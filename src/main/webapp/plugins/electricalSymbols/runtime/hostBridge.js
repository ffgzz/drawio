/**
 * 宿主桥接层。
 * 负责接收宿主页面通过 postMessage 发来的图元/图框/配电柜请求，
 * 在 draw.io 插件内直接走原生命令链路完成插入。
 */
import { commandApi } from "../application/commands.js";
import { selectionApi } from "../application/selection.js";
import {
  FRAME_DECORATION_STYLE_FLAG,
  findElectricalRoot,
  findPortHostRoot,
} from "../core/runtimeHelpers.js";
import { frameDomainApi } from "../domain/frame.js";
import { makeFrameLabelStyle } from "../domain/frameCore.js";
import { snapshotDomainApi } from "../domain/snapshot.js";
import {
  openBackendRollbackDialog,
  openBackendSaveDialog,
} from "../ui/backendDialogs.js";
import { createMetaCell, getAttr } from "../utils/xml.js";
import { clearEdgePoints, getPortMetaById } from "./connectionConstraints.js";
import { bindCellsToFrame, syncFrameBinding } from "./frameBinding.js";
import { withAllFramesExpanded } from "./viewportVirtualization.js";

function parseHostMessage(data) {
  if (data === null) {
    return null;
  }

  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch (e) {
      return null;
    }
  }

  if (typeof data === "object") {
    return data;
  }

  return null;
}

// 根据宿主页面传来的 viewport 坐标，结合当前 graph 的 view 状态，计算出一个合理的图元插入点
function resolveGraphInsertPoint(ctx, payload) {
  var graph =
    ctx.graph != null
      ? ctx.graph
      : ctx.ui != null && ctx.ui.editor != null
        ? ctx.ui.editor.graph
        : null;
  var diagramContainer = ctx.ui != null ? ctx.ui.diagramContainer : null;
  var scale = graph.view != null ? graph.view.scale || 1 : 1;
  var translate = graph.view != null ? graph.view.translate : null;
  var viewportX = Number(payload.viewportX);
  var viewportY = Number(payload.viewportY);

  if (
    diagramContainer == null ||
    !isFinite(viewportX) ||
    !isFinite(viewportY) ||
    translate == null
  ) {
    return graph.getFreeInsertPoint();
  }

  return new mxPoint(
    viewportX / scale + diagramContainer.scrollLeft / scale - translate.x,
    viewportY / scale + diagramContainer.scrollTop / scale - translate.y,
  );
}

// 将数值限制在 min 和 max 之间，非数值类型会被当做无穷大处理
function clamp(value, min, max) {
  if (!isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

// 构建 SVG 导出结果的 payload，包含 SVG 数据和格式信息
function buildSvgExportPayload(ctx, format) {
  var graph = ctx.graph;
  var bounds = graph.getGraphBounds();
  var viewScale = graph.view != null ? graph.view.scale || 1 : 1;
  var width;
  var height;
  var svgRoot;
  var data;

  if (bounds == null || bounds.width <= 0 || bounds.height <= 0) {
    throw new Error("画布上没有可导出的图形");
  }

  width = Math.max(1, Math.ceil(bounds.width / viewScale));
  height = Math.max(1, Math.ceil(bounds.height / viewScale));
  svgRoot = graph.getSvg(
    null,
    1,
    0,
    false,
    null,
    true,
    null,
    null,
    null,
    null,
    true,
    null,
  );

  if (graph.shadowVisible) {
    graph.addSvgShadow(svgRoot);
  }

  if (graph.mathEnabled) {
    Editor.prototype.addMathCss(svgRoot);
  }

  svgRoot.setAttribute("width", String(width));
  svgRoot.setAttribute("height", String(height));
  svgRoot.setAttribute("preserveAspectRatio", "xMidYMid meet");
  data = mxUtils.getXml(svgRoot);

  return {
    data: data,
    // The host persists the editable mxGraphModel together with the SVG
    // preview.  Returning only the SVG made EID_SAVE silently store an empty
    // drawio_xml, which also made high-fidelity Visio conversion impossible.
    xml: mxUtils.getXml(ctx.ui.editor.getGraphXml()),
    format: format,
  };
}

/**
 * Serialize the current mxGraph model without entering Draw.io's export path.
 *
 * Editor#getGraphXml also resolves editor-level presentation metadata.  In the
 * E&iD canvas that resolution can invalidate the virtualized frame view and
 * make generated detail labels appear expanded after a Visio snapshot.  The
 * converter only needs the native model plus page geometry, so encode that
 * state directly and leave the live view completely untouched.
 */
function serializeGraphModelForVisio(ctx) {
  var graph = ctx.graph;
  var codec = new mxCodec(mxUtils.createXmlDocument());
  var node = codec.encode(graph.getModel());
  codec.document.appendChild(node);
  var translate = graph.view != null ? graph.view.translate : null;

  if (translate != null && (translate.x !== 0 || translate.y !== 0)) {
    node.setAttribute("dx", Math.round(translate.x * 100) / 100);
    node.setAttribute("dy", Math.round(translate.y * 100) / 100);
  }

  node.setAttribute("grid", graph.isGridEnabled() ? "1" : "0");
  node.setAttribute("gridSize", String(graph.gridSize));
  node.setAttribute("page", graph.pageVisible ? "1" : "0");
  node.setAttribute("pageScale", String(graph.pageScale));
  node.setAttribute("pageWidth", String(graph.pageFormat.width));
  node.setAttribute("pageHeight", String(graph.pageFormat.height));

  if (graph.background != null) {
    node.setAttribute("background", String(graph.background));
  }

  return mxUtils.getXml(node);
}

// 向宿主页面发送事件，eventName 是事件名称，payload 是事件数据对象，会被序列化成 JSON 字符串
export function emitHostEvent(eventName, payload) {
  var targetWindow = window.opener || window.parent;

  if (
    targetWindow == null ||
    targetWindow === window ||
    typeof targetWindow.postMessage !== "function"
  ) {
    return;
  }

  targetWindow.postMessage(
    JSON.stringify(
      Object.assign(
        {
          event: eventName,
        },
        payload || {},
      ),
    ),
    "*",
  );
}

// 安装宿主桥接层，接收并处理来自宿主页面的消息，完成图元/图框/配电柜的插入和布局等操作
export function installHostBridge(ctx) {
  if (window.__eidElectricalHostBridgeInstalled) {
    return;
  }

  var validSource = window.opener || window.parent;
  var graph =
    ctx.graph != null
      ? ctx.graph
      : ctx.ui != null && ctx.ui.editor != null
        ? ctx.ui.editor.graph
        : null;
  var model =
    ctx.model != null
      ? ctx.model
      : graph != null && typeof graph.getModel === "function"
        ? graph.getModel()
        : null;
  var runtimeState = ctx.state != null ? ctx.state : {};
  var constants = ctx.constants;
  var MANAGED_LAYOUT_PORT_PREFIX = "eid-layout-port:";
  var BASIC_DEFAULT_PORT_PREFIX = "eid-basic-port:";
  var snapPreviewShapes = {
    guide: null,
    moved: null,
    other: null,
  };
  var snapPreviewCandidate = null;

  function parseJsonAttribute(cell, name, fallback) {
    var raw = getAttr(cell, name);

    if (raw == null || String(raw).length == 0) {
      return fallback;
    }

    try {
      return JSON.parse(String(raw));
    } catch (_error) {
      return fallback;
    }
  }

  function getElectricalBusinessRole(root) {
    var spec = parseJsonAttribute(root, "symbolPayload", {});
    var role = spec != null ? String(spec.businessRole || "") : "";
    var category =
      spec != null && spec.libraryCategory != null ? spec.libraryCategory : {};
    var categoryName = String(
      category.libraryCategoryName || category.categoryName || "",
    );
    var parentName = String(category.categoryParentName || "");

    if (role == "breaker" || role == "cable" || role == "target") {
      return role;
    }

    if (categoryName == "开关" || parentName == "开关") {
      return "breaker";
    }

    if (categoryName == "电缆" || parentName == "电缆") {
      return "cable";
    }

    if (
      parentName == "负载" ||
      categoryName == "负载" ||
      categoryName == "普通负载" ||
      categoryName == "接线盒" ||
      categoryName == "插座"
    ) {
      return "target";
    }

    return "";
  }

  function getElectricalPorts(root) {
    var ports = parseJsonAttribute(root, "portsJson", []);

    return Array.isArray(ports)
      ? ports.filter(function (port) {
          return (
            port != null &&
            typeof port == "object" &&
            String(port.id || "").length > 0 &&
            isFinite(Number(port.x)) &&
            isFinite(Number(port.y))
          );
        })
      : [];
  }

  function portAllows(port, direction) {
    var mode = String(
      port != null ? port.ioMode || "both" : "both",
    ).toLowerCase();

    return mode == "both" || mode == direction;
  }

  function getPortViewPoint(root, port, offset) {
    var geometry = model.getGeometry(root);
    var view = graph.view;

    if (geometry == null || view == null) {
      return null;
    }

    var scale = view.scale || 1;
    var parent = model.getParent(root);
    var parentState = parent != null ? view.getState(parent) : null;
    var x;
    var y;

    // CELLS_MOVED is emitted before the moved cell's cached view state is
    // guaranteed to be refreshed.  Read the current model geometry instead,
    // otherwise a near-port drop can be measured at its previous position.
    if (parentState != null && !model.isLayer(parent)) {
      x = parentState.x + geometry.x * scale;
      y = parentState.y + geometry.y * scale;
    } else {
      var translate = view.translate || new mxPoint(0, 0);
      x = (geometry.x + translate.x) * scale;
      y = (geometry.y + translate.y) * scale;
    }

    return {
      x:
        x +
        Number(port.x) * geometry.width * scale +
        Number(offset != null ? offset.x || 0 : 0),
      y:
        y +
        Number(port.y) * geometry.height * scale +
        Number(offset != null ? offset.y || 0 : 0),
    };
  }

  function isCompatiblePortPair(sourceRole, targetRole) {
    return (
      (sourceRole == "breaker" && targetRole == "cable") ||
      (sourceRole == "cable" && targetRole == "target")
    );
  }

  function isPortOccupied(root, portId) {
    var count = model.getEdgeCount(root);
    var i;

    for (i = 0; i < count; i++) {
      var edge = model.getEdgeAt(root, i);
      var sourceRoot = findPortHostRoot(model.getTerminal(edge, true));
      var targetRoot = findPortHostRoot(model.getTerminal(edge, false));
      var source = sourceRoot == root;
      var target = targetRoot == root;

      if (
        (source || target) &&
        String(snapshotDomainApi.getEdgePortId(edge, root, source)) ==
          String(portId)
      ) {
        return true;
      }
    }

    return false;
  }

  function collectElectricalRoots() {
    var roots = [];
    var seen = {};
    var key;

    for (key in model.cells) {
      if (!Object.prototype.hasOwnProperty.call(model.cells, key)) {
        continue;
      }

      var root = findElectricalRoot(model.cells[key]);
      var rootId = root != null && root.id != null ? String(root.id) : "";

      if (rootId.length > 0 && !seen[rootId]) {
        seen[rootId] = true;
        roots.push(root);
      }
    }

    return roots;
  }

  function roleLabel(role) {
    if (role == "breaker") {
      return "开关";
    }

    if (role == "cable") {
      return "电缆";
    }

    if (role == "target") {
      return "负载";
    }

    return "未识别图元";
  }

  function buildPortPairs(movedRoot, stationaryRoots, movedOffset) {
    var movedRole = getElectricalBusinessRole(movedRoot);
    var movedPorts = getElectricalPorts(movedRoot);
    var pairs = [];
    var i;
    var j;
    var k;

    if (movedPorts.length == 0) {
      return pairs;
    }

    for (i = 0; i < stationaryRoots.length; i++) {
      var otherRoot = stationaryRoots[i];
      var otherRole = getElectricalBusinessRole(otherRoot);
      var otherPorts = getElectricalPorts(otherRoot);

      for (j = 0; j < movedPorts.length; j++) {
        for (k = 0; k < otherPorts.length; k++) {
          var movedPort = movedPorts[j];
          var otherPort = otherPorts[k];
          var sourceRoot;
          var sourcePort;
          var sourceRole;
          var targetRoot;
          var targetPort;
          var targetRole;
          var directionValid = true;

          if (portAllows(movedPort, "out") && portAllows(otherPort, "in")) {
            sourceRoot = movedRoot;
            sourcePort = movedPort;
            sourceRole = movedRole;
            targetRoot = otherRoot;
            targetPort = otherPort;
            targetRole = otherRole;
          } else if (
            portAllows(otherPort, "out") &&
            portAllows(movedPort, "in")
          ) {
            sourceRoot = otherRoot;
            sourcePort = otherPort;
            sourceRole = otherRole;
            targetRoot = movedRoot;
            targetPort = movedPort;
            targetRole = movedRole;
          } else {
            directionValid = false;
          }

          var movedPoint = getPortViewPoint(movedRoot, movedPort, movedOffset);
          var otherPoint = getPortViewPoint(otherRoot, otherPort);

          if (movedPoint == null || otherPoint == null) {
            continue;
          }

          var dx = otherPoint.x - movedPoint.x;
          var dy = otherPoint.y - movedPoint.y;
          var compatible =
            directionValid && isCompatiblePortPair(sourceRole, targetRole);
          var sourceOccupied =
            directionValid && isPortOccupied(sourceRoot, sourcePort.id);
          var targetOccupied =
            directionValid && isPortOccupied(targetRoot, targetPort.id);

          pairs.push({
            movedRoot: movedRoot,
            movedPort: movedPort,
            movedPoint: movedPoint,
            movedRole: movedRole,
            otherRoot: otherRoot,
            otherPort: otherPort,
            otherPoint: otherPoint,
            otherRole: otherRole,
            sourceRoot: directionValid ? sourceRoot : null,
            sourcePort: directionValid ? sourcePort : null,
            sourceRole: directionValid ? sourceRole : "",
            targetRoot: directionValid ? targetRoot : null,
            targetPort: directionValid ? targetPort : null,
            targetRole: directionValid ? targetRole : "",
            dx: dx,
            dy: dy,
            distance: Math.sqrt(dx * dx + dy * dy),
            directionValid: directionValid,
            compatible: compatible,
            sourceOccupied: sourceOccupied,
            targetOccupied: targetOccupied,
          });
        }
      }
    }

    return pairs;
  }

  function buildSnapCandidates(movedRoot, stationaryRoots, movedOffset) {
    return buildPortPairs(movedRoot, stationaryRoots, movedOffset).filter(
      function (pair) {
        return (
          pair.directionValid &&
          pair.compatible &&
          !pair.sourceOccupied &&
          !pair.targetOccupied
        );
      },
    );
  }

  function getSnapFailureMessage(pair) {
    if (pair == null) {
      return "未找到可吸附的连接点";
    }

    if (pair.movedRole.length == 0 || pair.otherRole.length == 0) {
      return "未识别图元类型，请从开关、电缆或负载分类中插入图元";
    }

    if (!pair.directionValid) {
      return "连接方向不正确，应按开关输出 → 电缆输入 → 负载输入连接";
    }

    if (!pair.compatible) {
      if (pair.movedRole == "breaker" && pair.otherRole == "breaker") {
        return "开关不能直接连接开关，请在两者之间使用电缆图元";
      }

      return (
        roleLabel(pair.movedRole) +
        "不能直接连接" +
        roleLabel(pair.otherRole) +
        "，应按开关 → 电缆 → 负载连接"
      );
    }

    if (pair.sourceOccupied || pair.targetOccupied) {
      return "连接点已被占用，请先删除 Spare 普通线或原有连接";
    }

    return "继续靠近绿色连接点，松开后会自动吸附";
  }

  function ensureSnapPreviewShapes() {
    var overlay = graph.getView().getOverlayPane();

    if (snapPreviewShapes.guide == null) {
      snapPreviewShapes.guide = new mxPolyline(
        [new mxPoint(0, 0), new mxPoint(0, 0)],
        "#16a34a",
        2,
      );
      snapPreviewShapes.guide.isDashed = true;
      snapPreviewShapes.guide.dialect = mxConstants.DIALECT_SVG;
      snapPreviewShapes.guide.pointerEvents = false;
      snapPreviewShapes.guide.init(overlay);
      snapPreviewShapes.guide.node.setAttribute(
        "data-eid-port-snap-preview",
        "guide",
      );
      snapPreviewShapes.guide.node.style.pointerEvents = "none";
    }

    if (snapPreviewShapes.moved == null) {
      snapPreviewShapes.moved = new mxEllipse(
        new mxRectangle(0, 0, 16, 16),
        "#dcfce7",
        "#16a34a",
        3,
      );
      snapPreviewShapes.moved.dialect = mxConstants.DIALECT_SVG;
      snapPreviewShapes.moved.pointerEvents = false;
      snapPreviewShapes.moved.init(overlay);
      snapPreviewShapes.moved.node.setAttribute(
        "data-eid-port-snap-preview",
        "moved-port",
      );
      snapPreviewShapes.moved.node.style.pointerEvents = "none";
    }

    if (snapPreviewShapes.other == null) {
      snapPreviewShapes.other = new mxEllipse(
        new mxRectangle(0, 0, 16, 16),
        "#dcfce7",
        "#16a34a",
        3,
      );
      snapPreviewShapes.other.dialect = mxConstants.DIALECT_SVG;
      snapPreviewShapes.other.pointerEvents = false;
      snapPreviewShapes.other.init(overlay);
      snapPreviewShapes.other.node.setAttribute(
        "data-eid-port-snap-preview",
        "target-port",
      );
      snapPreviewShapes.other.node.style.pointerEvents = "none";
    }
  }

  function hideSnapPreview() {
    var key;

    snapPreviewCandidate = null;
    for (key in snapPreviewShapes) {
      if (
        Object.prototype.hasOwnProperty.call(snapPreviewShapes, key) &&
        snapPreviewShapes[key] != null &&
        snapPreviewShapes[key].node != null
      ) {
        snapPreviewShapes[key].node.style.display = "none";
      }
    }
  }

  function showSnapPreview(pair, status) {
    var valid = status == "valid";
    var nearby = status == "near";
    var color = valid ? "#16a34a" : nearby ? "#2563eb" : "#f97316";
    var fill = valid ? "#dcfce7" : nearby ? "#dbeafe" : "#ffedd5";
    var markerSize = 16;

    ensureSnapPreviewShapes();
    snapPreviewCandidate = pair;
    snapPreviewShapes.guide.stroke = color;
    snapPreviewShapes.guide.points = [
      new mxPoint(pair.movedPoint.x, pair.movedPoint.y),
      new mxPoint(pair.otherPoint.x, pair.otherPoint.y),
    ];
    snapPreviewShapes.guide.node.style.display = "";
    snapPreviewShapes.guide.node.setAttribute(
      "data-eid-port-snap-status",
      status,
    );
    snapPreviewShapes.guide.redraw();

    snapPreviewShapes.moved.stroke = color;
    snapPreviewShapes.moved.fill = fill;
    snapPreviewShapes.moved.bounds = new mxRectangle(
      pair.movedPoint.x - markerSize / 2,
      pair.movedPoint.y - markerSize / 2,
      markerSize,
      markerSize,
    );
    snapPreviewShapes.moved.node.style.display = "";
    snapPreviewShapes.moved.redraw();

    snapPreviewShapes.other.stroke = color;
    snapPreviewShapes.other.fill = fill;
    snapPreviewShapes.other.bounds = new mxRectangle(
      pair.otherPoint.x - markerSize / 2,
      pair.otherPoint.y - markerSize / 2,
      markerSize,
      markerSize,
    );
    snapPreviewShapes.other.node.style.display = "";
    snapPreviewShapes.other.redraw();
  }

  function chooseSnapPreviewPair(movedRoot, stationaryRoots, movedOffset) {
    var pairs = buildPortPairs(movedRoot, stationaryRoots, movedOffset).sort(
      function (left, right) {
        return left.distance - right.distance;
      },
    );
    var previewRadius =
      Number(constants.CANVAS_PORT_SNAP_PREVIEW_RADIUS_PX) || 160;
    var compatible = pairs.filter(function (pair) {
      return (
        pair.directionValid &&
        pair.compatible &&
        !pair.sourceOccupied &&
        !pair.targetOccupied
      );
    });
    var selected = compatible.length > 0 ? compatible[0] : pairs[0];

    return selected != null && selected.distance <= previewRadius
      ? selected
      : null;
  }

  function updateSnapPreviewForCurrentDrag() {
    var handler = graph.graphHandler;
    var cells = handler != null ? handler.cells : null;
    var movedRoots = [];
    var movedIds = {};
    var i;

    if (
      handler == null ||
      !Array.isArray(cells) ||
      cells.length == 0 ||
      handler.currentDx == null ||
      handler.currentDy == null
    ) {
      hideSnapPreview();
      return;
    }

    for (i = 0; i < cells.length; i++) {
      var root = findElectricalRoot(cells[i]);
      var rootId = root != null && root.id != null ? String(root.id) : "";

      if (rootId.length > 0 && !movedIds[rootId]) {
        movedIds[rootId] = true;
        movedRoots.push(root);
      }
    }

    if (movedRoots.length != 1) {
      hideSnapPreview();
      return;
    }

    var stationaryRoots = collectElectricalRoots().filter(function (root) {
      return root != null && root.id != null && !movedIds[String(root.id)];
    });
    var pair = chooseSnapPreviewPair(movedRoots[0], stationaryRoots, {
      x: Number(handler.currentDx) || 0,
      y: Number(handler.currentDy) || 0,
    });

    if (pair == null) {
      hideSnapPreview();
      return;
    }

    var connectable =
      pair.directionValid &&
      pair.compatible &&
      !pair.sourceOccupied &&
      !pair.targetOccupied;
    var snapThreshold = Number(constants.CANVAS_PORT_SNAP_THRESHOLD_PX) || 36;

    showSnapPreview(
      pair,
      connectable
        ? pair.distance <= snapThreshold
          ? "valid"
          : "near"
        : "invalid",
    );
  }

  function connectSnappedPorts(candidate) {
    var sourceParent = model.getParent(candidate.sourceRoot);
    var targetParent = model.getParent(candidate.targetRoot);
    var parent =
      sourceParent == targetParent ? sourceParent : graph.getDefaultParent();
    var sourcePortId = String(candidate.sourcePort.id);
    var targetPortId = String(candidate.targetPort.id);
    var style =
      "endArrow=none;startArrow=none;html=1;rounded=0;edgeStyle=none;noEdgeStyle=1;" +
      "orthogonalLoop=0;eidLayoutManaged=1;eidPortSnapLink=1;" +
      "strokeColor=none;strokeWidth=0;opacity=0;" +
      "sourcePortId=" +
      sourcePortId +
      ";targetPortId=" +
      targetPortId +
      ";";
    var edge = graph.insertEdge(
      parent,
      null,
      "",
      candidate.sourceRoot,
      candidate.targetRoot,
      style,
    );

    applyEdgeConstraintByPortId(edge, true, sourcePortId);
    applyEdgeConstraintByPortId(edge, false, targetPortId);
    return edge;
  }

  function normalizeMagneticCircuitEdge(edge) {
    if (edge == null || !model.isEdge(edge)) {
      return false;
    }

    var sourceRoot = findPortHostRoot(model.getTerminal(edge, true));
    var targetRoot = findPortHostRoot(model.getTerminal(edge, false));
    var sourceRole = getElectricalBusinessRole(sourceRoot);
    var targetRole = getElectricalBusinessRole(targetRoot);

    if (!isCompatiblePortPair(sourceRole, targetRole)) {
      return false;
    }

    var sourcePortId = snapshotDomainApi.getEdgePortId(
      edge,
      sourceRoot,
      true,
    );
    var targetPortId = snapshotDomainApi.getEdgePortId(
      edge,
      targetRoot,
      false,
    );

    if (
      sourcePortId == null ||
      String(sourcePortId).length == 0 ||
      targetPortId == null ||
      String(targetPortId).length == 0
    ) {
      return false;
    }

    clearEdgePoints(edge);
    var style = model.getStyle(edge) || "";
    style = mxUtils.setStyle(style, "endArrow", "none");
    style = mxUtils.setStyle(style, "startArrow", "none");
    style = mxUtils.setStyle(style, "rounded", "0");
    style = mxUtils.setStyle(style, "edgeStyle", null);
    style = mxUtils.setStyle(style, "noEdgeStyle", "1");
    style = mxUtils.setStyle(style, "orthogonalLoop", "0");
    style = mxUtils.setStyle(style, "jettySize", "0");
    style = mxUtils.setStyle(style, "sourceJettySize", "0");
    style = mxUtils.setStyle(style, "targetJettySize", "0");
    style = mxUtils.setStyle(style, "eidLayoutManaged", "1");
    style = mxUtils.setStyle(style, "eidPortSnapLink", "1");
    style = mxUtils.setStyle(style, "strokeColor", "none");
    style = mxUtils.setStyle(style, "strokeWidth", "0");
    style = mxUtils.setStyle(style, "opacity", "0");
    style = mxUtils.setStyle(style, "sourcePortId", String(sourcePortId));
    style = mxUtils.setStyle(style, "targetPortId", String(targetPortId));
    model.setStyle(edge, style);
    applyEdgeConstraintByPortId(edge, true, sourcePortId);
    applyEdgeConstraintByPortId(edge, false, targetPortId);
    return true;
  }

  function normalizeMagneticCircuitEdges() {
    if (model == null || model.cells == null) {
      return 0;
    }

    var normalized = 0;
    model.beginUpdate();
    try {
      for (var cellId in model.cells) {
        if (
          Object.prototype.hasOwnProperty.call(model.cells, cellId) &&
          normalizeMagneticCircuitEdge(model.cells[cellId])
        ) {
          normalized += 1;
        }
      }
    } finally {
      model.endUpdate();
    }

    return normalized;
  }

  function snapMovedElectricalPorts(cells, suppressFailureFeedback) {
    if (!Array.isArray(cells) || cells.length == 0) {
      return 0;
    }

    var movedRoots = [];
    var movedIds = {};
    var i;

    for (i = 0; i < cells.length; i++) {
      var root = findElectricalRoot(cells[i]);
      var rootId = root != null && root.id != null ? String(root.id) : "";

      if (rootId.length > 0 && !movedIds[rootId]) {
        movedIds[rootId] = true;
        movedRoots.push(root);
      }
    }

    var stationaryRoots = collectElectricalRoots().filter(function (root) {
      return root != null && root.id != null && !movedIds[String(root.id)];
    });
    var threshold = Number(constants.CANVAS_PORT_SNAP_THRESHOLD_PX) || 36;
    var connectedCount = 0;
    var feedbackPair = null;
    var connectedAnchor = null;

    for (i = 0; i < movedRoots.length; i++) {
      var movedRoot = movedRoots[i];
      var candidates = buildSnapCandidates(movedRoot, stationaryRoots, null)
        .filter(function (candidate) {
          return candidate.distance <= threshold;
        })
        .sort(function (left, right) {
          return left.distance - right.distance;
        });

      if (candidates.length == 0) {
        if (feedbackPair == null) {
          feedbackPair = chooseSnapPreviewPair(
            movedRoot,
            stationaryRoots,
            null,
          );
        }
        continue;
      }

      var anchor = candidates[0];
      var geometry = model.getGeometry(movedRoot);
      var scale = graph.view != null ? graph.view.scale || 1 : 1;

      model.beginUpdate();
      try {
        if (geometry != null) {
          geometry = geometry.clone();
          geometry.x += anchor.dx / scale;
          geometry.y += anchor.dy / scale;
          model.setGeometry(movedRoot, geometry);
        }

        connectSnappedPorts(anchor);
        connectedCount += 1;
        connectedAnchor = anchor;

        for (
          var candidateIndex = 1;
          candidateIndex < candidates.length;
          candidateIndex++
        ) {
          var candidate = candidates[candidateIndex];
          var adjustedDistance = Math.sqrt(
            Math.pow(candidate.dx - anchor.dx, 2) +
              Math.pow(candidate.dy - anchor.dy, 2),
          );

          if (
            adjustedDistance <= 1 &&
            !isPortOccupied(candidate.sourceRoot, candidate.sourcePort.id) &&
            !isPortOccupied(candidate.targetRoot, candidate.targetPort.id)
          ) {
            connectSnappedPorts(candidate);
            connectedCount += 1;
          }
        }
      } finally {
        model.endUpdate();
      }
    }

    if (connectedCount > 0) {
      graph.refresh();
      emitHostEvent("eid-port-snap-feedback", {
        status: "success",
        code: "connected",
        message:
          "已吸附并连接：" +
          roleLabel(connectedAnchor.sourceRole) +
          " → " +
          roleLabel(connectedAnchor.targetRole),
      });
    } else if (feedbackPair != null && !suppressFailureFeedback) {
      emitHostEvent("eid-port-snap-feedback", {
        status:
          feedbackPair.directionValid &&
          feedbackPair.compatible &&
          !feedbackPair.sourceOccupied &&
          !feedbackPair.targetOccupied
            ? "info"
            : "warning",
        code: "not-connected",
        message: getSnapFailureMessage(feedbackPair),
      });
    }

    return connectedCount;
  }

  function detachMovedElectricalPorts(cells) {
    if (!Array.isArray(cells) || cells.length == 0) {
      return 0;
    }

    var movedRoots = [];
    var movedIds = {};
    var edgeMap = {};
    var threshold =
      Number(constants.CANVAS_PORT_DETACH_THRESHOLD_PX) || 72;
    var i;

    for (i = 0; i < cells.length; i++) {
      var movedRoot = findElectricalRoot(cells[i]);
      var movedRootId =
        movedRoot != null && movedRoot.id != null ? String(movedRoot.id) : "";

      if (movedRootId.length > 0 && !movedIds[movedRootId]) {
        movedIds[movedRootId] = true;
        movedRoots.push(movedRoot);
      }
    }

    // Restored snapshots may keep an edge terminal on a generated port child,
    // so graph.getConnections(root) is not reliable for every valid file.
    // Resolve every managed edge through findPortHostRoot and then keep only
    // those incident to a moved electrical root.
    for (var cellId in model.cells) {
      if (!Object.prototype.hasOwnProperty.call(model.cells, cellId)) {
        continue;
      }
      var candidateEdge = model.cells[cellId];
      if (
        candidateEdge != null &&
        candidateEdge.id != null &&
        model.isEdge(candidateEdge) &&
        isLayoutManagedEdge(candidateEdge)
      ) {
        edgeMap[String(candidateEdge.id)] = candidateEdge;
      }
    }

    var edgesToRemove = [];
    var removedPairs = [];
    for (var edgeId in edgeMap) {
      if (!Object.prototype.hasOwnProperty.call(edgeMap, edgeId)) {
        continue;
      }

      var edge = edgeMap[edgeId];
      var sourceRoot = findPortHostRoot(model.getTerminal(edge, true));
      var targetRoot = findPortHostRoot(model.getTerminal(edge, false));
      var sourceRootId =
        sourceRoot != null && sourceRoot.id != null ? String(sourceRoot.id) : "";
      var targetRootId =
        targetRoot != null && targetRoot.id != null ? String(targetRoot.id) : "";
      if (!movedIds[sourceRootId] && !movedIds[targetRootId]) {
        continue;
      }
      var sourceRole = getElectricalBusinessRole(sourceRoot);
      var targetRole = getElectricalBusinessRole(targetRoot);

      // Cabinet leads and ordinary drawing lines are not magnetic electrical
      // symbol connections. Only detach the two business chain pairs.
      if (!isCompatiblePortPair(sourceRole, targetRole)) {
        continue;
      }

      var sourcePortId = snapshotDomainApi.getEdgePortId(
        edge,
        sourceRoot,
        true,
      );
      var targetPortId = snapshotDomainApi.getEdgePortId(
        edge,
        targetRoot,
        false,
      );
      var sourcePort = getElectricalPorts(sourceRoot).filter(function (port) {
        return String(port.id) == String(sourcePortId);
      })[0];
      var targetPort = getElectricalPorts(targetRoot).filter(function (port) {
        return String(port.id) == String(targetPortId);
      })[0];
      if (sourcePort == null || targetPort == null) {
        continue;
      }
      var sourcePoint = getPortViewPoint(sourceRoot, sourcePort);
      var targetPoint = getPortViewPoint(targetRoot, targetPort);

      if (sourcePoint == null || targetPoint == null) {
        continue;
      }

      var dx = targetPoint.x - sourcePoint.x;
      var dy = targetPoint.y - sourcePoint.y;
      if (Math.sqrt(dx * dx + dy * dy) > threshold) {
        edgesToRemove.push(edge);
        removedPairs.push({ sourceRole: sourceRole, targetRole: targetRole });
      }
    }

    if (edgesToRemove.length == 0) {
      return 0;
    }

    graph.removeCells(edgesToRemove, true);
    var firstPair = removedPairs[0];
    emitHostEvent("eid-port-snap-feedback", {
      status: "info",
      code: "disconnected",
      message:
        "连接点已拉开，已自动断开：" +
        roleLabel(firstPair.sourceRole) +
        " → " +
        roleLabel(firstPair.targetRole),
    });
    return edgesToRemove.length;
  }

  function isManagedLayoutPortId(id) {
    return String(id || "").indexOf(MANAGED_LAYOUT_PORT_PREFIX) === 0;
  }

  function isBasicDefaultPortId(id) {
    return String(id || "").indexOf(BASIC_DEFAULT_PORT_PREFIX) === 0;
  }

  function isPluginOwnedCell(cell) {
    return (
      getAttr(cell, "esKind") != null ||
      getAttr(cell, "pluginType") != null ||
      getAttr(cell, "eidCadSymbol") != null
    );
  }

  function createGenericHostValue(cell) {
    var currentValue = cell != null ? cell.value : null;
    var value;
    var label;

    if (
      currentValue != null &&
      currentValue.nodeType == mxConstants.NODETYPE_ELEMENT
    ) {
      value = currentValue.cloneNode(true);
    } else {
      value = mxUtils.createXmlDocument().createElement("object");
      label = currentValue != null ? String(currentValue) : "";

      if (label.length > 0) {
        value.setAttribute("label", label);
      }
    }

    value.setAttribute("eidGenericPortHost", "1");
    return value;
  }

  function parsePortArrayFromValue(value) {
    var raw;
    var parsed;

    if (value == null || value.nodeType != mxConstants.NODETYPE_ELEMENT) {
      return [];
    }

    raw = value.getAttribute("portsJson");

    if (raw == null || String(raw).length == 0) {
      return [];
    }

    try {
      parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function setGenericHostPorts(cell, ports) {
    var value;
    var serialized;

    if (cell == null || model == null || !model.isVertex(cell)) {
      return;
    }

    value = createGenericHostValue(cell);
    serialized = JSON.stringify(Array.isArray(ports) ? ports : []);
    value.setAttribute("portsJson", serialized);
    value.setAttribute("portLayout", serialized);
    model.setValue(cell, value);
  }

  function getBasicDefaultPorts() {
    return [
      {
        id: BASIC_DEFAULT_PORT_PREFIX + "left",
        x: 0,
        y: 0.5,
        direction: "left",
        ioMode: "both",
        marker: "hidden",
      },
      {
        id: BASIC_DEFAULT_PORT_PREFIX + "right",
        x: 1,
        y: 0.5,
        direction: "right",
        ioMode: "both",
        marker: "hidden",
      },
      {
        id: BASIC_DEFAULT_PORT_PREFIX + "top",
        x: 0.5,
        y: 0,
        direction: "up",
        ioMode: "both",
        marker: "hidden",
      },
      {
        id: BASIC_DEFAULT_PORT_PREFIX + "bottom",
        x: 0.5,
        y: 1,
        direction: "down",
        ioMode: "both",
        marker: "hidden",
      },
    ];
  }

  function ensureDefaultGenericPortHost(cell) {
    var ports;
    var hasDefaultPort = false;
    var i;

    if (
      cell == null ||
      model == null ||
      !model.isVertex(cell) ||
      isPluginOwnedCell(cell)
    ) {
      return;
    }

    ports = parsePortArrayFromValue(cell.value);

    for (i = 0; i < ports.length; i++) {
      if (isBasicDefaultPortId(ports[i] != null ? ports[i].id : "")) {
        hasDefaultPort = true;
        break;
      }
    }

    if (!hasDefaultPort) {
      ports = ports.concat(getBasicDefaultPorts());
    }

    setGenericHostPorts(cell, ports);
  }

  function cleanupManagedLayoutPortsForCell(cell) {
    var ports;
    var nextPorts = [];
    var i;

    if (
      cell == null ||
      model == null ||
      !model.isVertex(cell) ||
      getAttr(cell, "eidGenericPortHost") != "1"
    ) {
      return;
    }

    ports = parsePortArrayFromValue(cell.value);

    for (i = 0; i < ports.length; i++) {
      if (!isManagedLayoutPortId(ports[i] != null ? ports[i].id : "")) {
        nextPorts.push(ports[i]);
      }
    }

    setGenericHostPorts(cell, nextPorts);
  }

  function normalizeManagedLayoutPort(raw) {
    var objectId;
    var port;
    var id;
    var x;
    var y;
    var direction;
    var ioMode;

    if (raw == null || typeof raw !== "object") {
      return null;
    }

    objectId = raw.objectId != null ? String(raw.objectId) : "";
    port = raw.port != null && typeof raw.port === "object" ? raw.port : null;

    if (objectId.length == 0 || port == null) {
      return null;
    }

    id = port.id != null ? String(port.id) : "";
    x = Number(port.x);
    y = Number(port.y);

    if (!isManagedLayoutPortId(id) || !isFinite(x) || !isFinite(y)) {
      return null;
    }

    direction = port.direction != null ? String(port.direction) : "any";
    ioMode = port.ioMode != null ? String(port.ioMode) : "both";

    return {
      objectId,
      port: {
        id,
        x: clamp(x, 0, 1),
        y: clamp(y, 0, 1),
        direction,
        ioMode,
        marker: "hidden",
        name: port.name != null ? String(port.name) : "",
      },
    };
  }

  function addManagedPortToGroup(grouped, raw) {
    var managed = normalizeManagedLayoutPort(raw);
    var portsById;

    if (managed == null) {
      return;
    }

    portsById = grouped[managed.objectId];

    if (portsById == null) {
      portsById = {};
      grouped[managed.objectId] = portsById;
    }

    portsById[managed.port.id] = managed.port;
  }

  function upsertManagedLayoutPorts(edgeRoutes) {
    var grouped = {};
    var objectId;
    var cell;
    var ports;
    var nextPorts;
    var portsById;
    var portId;
    var i;

    if (!Array.isArray(edgeRoutes)) {
      return;
    }

    for (i = 0; i < edgeRoutes.length; i++) {
      var route = edgeRoutes[i] || {};
      addManagedPortToGroup(grouped, route.sourceManagedPort);
      addManagedPortToGroup(grouped, route.targetManagedPort);
    }

    for (objectId in grouped) {
      if (!grouped.hasOwnProperty(objectId)) {
        continue;
      }

      cell = model != null ? model.getCell(objectId) : null;

      if (cell == null || !model.isVertex(cell) || isPluginOwnedCell(cell)) {
        continue;
      }

      ports = parsePortArrayFromValue(cell.value);
      nextPorts = [];

      for (i = 0; i < ports.length; i++) {
        if (!isManagedLayoutPortId(ports[i] != null ? ports[i].id : "")) {
          nextPorts.push(ports[i]);
        }
      }

      portsById = grouped[objectId];

      for (portId in portsById) {
        if (portsById.hasOwnProperty(portId)) {
          nextPorts.push(portsById[portId]);
        }
      }

      setGenericHostPorts(cell, nextPorts);
    }
  }

  /**
   * 图框模板装饰件（标题栏线条、方框等）没有 value 节点，无法像其他插件 cell
   * 那样靠 esKind 识别。这里在样式里打一个标记，剪贴板保护据此把它们
   * 视作图框的组成部分，不允许单独复制。
   */
  function withFrameDecorationFlag(style) {
    var text = style != null ? String(style) : "";

    if (text.indexOf(FRAME_DECORATION_STYLE_FLAG) >= 0) {
      return text;
    }

    if (text.length === 0) {
      return FRAME_DECORATION_STYLE_FLAG + ";";
    }

    return text.charAt(text.length - 1) === ";"
      ? text + FRAME_DECORATION_STYLE_FLAG + ";"
      : text + ";" + FRAME_DECORATION_STYLE_FLAG + ";";
  }

  function createFrameTemplateLabelCell(frame, label) {
    var frameConfig = frameDomainApi.getFrameConfig(frame);
    var width = Math.max(40, Math.round(Number(label.width) || 120));
    var height = Math.max(20, Math.round(Number(label.height) || 26));
    var maxX = Math.max(0, frameConfig.width - width);
    var maxY = Math.max(0, frameConfig.height - height);
    var geometry = new mxGeometry(
      clamp(Math.round(Number(label.x) || 0), 0, maxX),
      clamp(Math.round(Number(label.y) || 0), 0, maxY),
      width,
      height,
    );
    var value = createMetaCell(
      constants.FRAME_LABEL_TAG,
      "frameTemplateLabel",
      label.id != null ? String(label.id) : "",
      label.text != null ? String(label.text) : "",
    );
    var style = mxUtils.setStyle(
      makeFrameLabelStyle(),
      "align",
      label.align != null ? String(label.align) : "center",
    );
    var fieldPath = label.fieldPath != null ? String(label.fieldPath) : "";
    var cell;

    if (fieldPath.length > 0) {
      value.setAttribute("fieldPath", fieldPath);
    }

    cell = new mxCell(value, geometry, style);
    cell.vertex = true;
    cell.setConnectable(false);
    return cell;
  }

  function resetEdgeAutoStyle(edge) {
    var style = model.getStyle(edge) || "";

    style = mxUtils.setStyle(style, "noEdgeStyle", null);
    style = mxUtils.setStyle(style, "edgeStyle", "orthogonalEdgeStyle");
    style = mxUtils.setStyle(style, "entryX", null);
    style = mxUtils.setStyle(style, "entryY", null);
    style = mxUtils.setStyle(style, "exitX", null);
    style = mxUtils.setStyle(style, "exitY", null);
    style = mxUtils.setStyle(style, "entryPerimeter", null);
    style = mxUtils.setStyle(style, "exitPerimeter", null);
    style = mxUtils.setStyle(style, "jettySize", "auto");
    style = mxUtils.setStyle(style, "sourceJettySize", "auto");
    style = mxUtils.setStyle(style, "targetJettySize", "auto");
    style = mxUtils.setStyle(style, "rounded", "0");
    model.setStyle(edge, style);
  }

  function clearLayoutRouteMetadata(edge) {
    var style = model.getStyle(edge) || "";

    style = mxUtils.setStyle(style, "eidLayoutManaged", null);
    style = mxUtils.setStyle(style, "sourcePortId", null);
    style = mxUtils.setStyle(style, "targetPortId", null);
    style = mxUtils.setStyle(style, "sourcePortConstraint", null);
    style = mxUtils.setStyle(style, "targetPortConstraint", null);
    model.setStyle(edge, style);
  }

  function resetAutoLayoutEdgeState(edge) {
    var edgeGeometry;

    if (edge == null || model == null) {
      return;
    }

    edgeGeometry = model.getGeometry(edge);

    if (edgeGeometry != null && edgeGeometry.points != null) {
      edgeGeometry = edgeGeometry.clone();
      edgeGeometry.points = null;
      model.setGeometry(edge, edgeGeometry);
    }

    resetEdgeAutoStyle(edge);
    clearLayoutRouteMetadata(edge);
  }

  function isCabinetSwitchLink(edge) {
    return (
      String(getAttr(edge, "esKind") || "") ==
      String(constants.CABINET_SWITCH_LINK_KIND || "cabinetSwitchLink")
    );
  }

  function isLayoutManagedEdge(edge) {
    var style;

    if (edge == null || model == null) {
      return false;
    }

    // mxUtils.getValue expects the parsed cell-style map. model.getStyle
    // returns the raw semicolon-delimited string, which made every managed
    // edge look unmanaged and prevented drag-away detachment from running.
    style = graph.getCellStyle(edge) || {};
    return String(mxUtils.getValue(style, "eidLayoutManaged", "0")) === "1";
  }

  function applyEdgeConstraintByPortId(edge, source, portId) {
    var terminal;
    var root;
    var port;
    var constraint;

    if (
      edge == null ||
      portId == null ||
      String(portId).length == 0 ||
      graph == null ||
      model == null
    ) {
      return;
    }

    terminal = model.getTerminal(edge, source);
    root = findPortHostRoot(terminal);

    if (root == null) {
      return;
    }

    if (terminal != root) {
      model.setTerminal(edge, root, source);
    }

    port = getPortMetaById(root, String(portId));

    if (port == null) {
      return;
    }

    constraint = new mxConnectionConstraint(
      new mxPoint(Number(port.x) || 0, Number(port.y) || 0),
      false,
      port.id != null ? String(port.id) : "",
    );

    graph.setConnectionConstraint(edge, root, source, constraint);
  }

  function readRouteConstraint(raw) {
    var x;
    var y;

    if (raw == null || typeof raw !== "object") {
      return null;
    }

    x = Number(raw.x);
    y = Number(raw.y);

    if (!isFinite(x) || !isFinite(y)) {
      return null;
    }

    return {
      x: clamp(x, 0, 1),
      y: clamp(y, 0, 1),
    };
  }

  function applyEdgeConstraintByPoint(edge, source, point) {
    var terminal;
    var root;
    var constraint;
    var style;
    var xKey = source ? "exitX" : "entryX";
    var yKey = source ? "exitY" : "entryY";
    var perimeterKey = source ? "exitPerimeter" : "entryPerimeter";

    if (edge == null || point == null || graph == null || model == null) {
      return;
    }

    terminal = model.getTerminal(edge, source);
    root = findPortHostRoot(terminal) || terminal;

    if (root == null || !model.isVertex(root)) {
      return;
    }

    if (terminal !== root) {
      model.setTerminal(edge, root, source);
    }

    constraint = new mxConnectionConstraint(
      new mxPoint(point.x, point.y),
      false,
    );

    graph.setConnectionConstraint(edge, root, source, constraint);
    style = model.getStyle(edge) || "";
    style = mxUtils.setStyle(style, xKey, String(point.x));
    style = mxUtils.setStyle(style, yKey, String(point.y));
    style = mxUtils.setStyle(style, perimeterKey, "1");
    model.setStyle(edge, style);
  }

  function clearConnectedEdgesForCells(cells) {
    var edgeMap = {};
    var i;
    var j;

    if (!Array.isArray(cells) || cells.length == 0) {
      return;
    }

    for (i = 0; i < cells.length; i++) {
      var cell = cells[i];

      if (cell == null || !model.isVertex(cell)) {
        continue;
      }

      var edges = graph.getConnections(cell) || [];

      for (j = 0; j < edges.length; j++) {
        if (
          edges[j] != null &&
          edges[j].id != null &&
          isLayoutManagedEdge(edges[j])
        ) {
          edgeMap[String(edges[j].id)] = edges[j];
        }
      }
    }

    for (var edgeId in edgeMap) {
      if (edgeMap.hasOwnProperty(edgeId)) {
        var edge = edgeMap[edgeId];
        if (normalizeMagneticCircuitEdge(edge)) {
          continue;
        }

        var sourceRoot = findPortHostRoot(model.getTerminal(edge, true));
        var targetRoot = findPortHostRoot(model.getTerminal(edge, false));
        var sourcePortId = snapshotDomainApi.getEdgePortId(
          edge,
          sourceRoot,
          true,
        );
        var targetPortId = snapshotDomainApi.getEdgePortId(
          edge,
          targetRoot,
          false,
        );

        clearEdgePoints(edge);
        resetEdgeAutoStyle(edge);
        applyEdgeConstraintByPortId(edge, true, sourcePortId);
        applyEdgeConstraintByPortId(edge, false, targetPortId);
      }
    }
  }

  function postReply(targetWindow, payload) {
    if (
      targetWindow != null &&
      typeof targetWindow.postMessage === "function"
    ) {
      targetWindow.postMessage(JSON.stringify(payload), "*");
    }
  }

  function postResult(targetWindow, payload, extra) {
    postReply(
      targetWindow,
      Object.assign(
        {
          event: "eid-host-result",
          action: payload != null ? payload.action : "",
          actionId: payload != null ? payload.actionId : "",
        },
        extra || {},
      ),
    );
  }

  function postError(targetWindow, payload, error) {
    postReply(targetWindow, {
      event: "eid-host-error",
      action: payload != null ? payload.action : "",
      actionId: payload != null ? payload.actionId : "",
      error:
        error != null && error.message != null ? error.message : String(error),
    });
  }

  function resolveSelectedFrame(payload) {
    var targetFrameId =
      payload != null && payload.selectedFrameId != null
        ? String(payload.selectedFrameId)
        : "";
    var targetGroupId =
      payload != null && payload.selectedGroupId != null
        ? String(payload.selectedGroupId)
        : "";
    var frames;
    var i;

    if (targetFrameId.length > 0) {
      return frameDomainApi.findFrameById(targetFrameId);
    }

    if (targetGroupId.length == 0) {
      return null;
    }

    frames = frameDomainApi.getAllDrawingFrames();

    for (i = 0; i < frames.length; i++) {
      if (frameDomainApi.getFrameGroupId(frames[i]) == targetGroupId) {
        return frames[i];
      }
    }

    return null;
  }

  function resolveFrameCell(payload) {
    var explicitFrameCellId =
      payload != null && payload.frameCellId != null
        ? String(payload.frameCellId)
        : "";
    var explicitFrame = null;

    if (explicitFrameCellId.length > 0) {
      explicitFrame = ctx.model.getCell(explicitFrameCellId);

      if (
        explicitFrame != null &&
        frameDomainApi.findDrawingFrame(explicitFrame) === explicitFrame
      ) {
        return explicitFrame;
      }
    }

    return resolveSelectedFrame(payload);
  }

  function belongsToLayoutFrame(cell, frame) {
    var ownerFrame;

    if (cell == null || frame == null) {
      return false;
    }

    if (cell === frame || model.getParent(cell) === frame) {
      return true;
    }

    ownerFrame = frameDomainApi.findDrawingFrame(cell);

    return ownerFrame === frame;
  }

  function edgeBelongsToLayoutFrame(edge, frame) {
    var source;
    var target;

    if (edge == null || frame == null || model == null) {
      return false;
    }

    source = model.getTerminal(edge, true);
    target = model.getTerminal(edge, false);

    if (source == null || target == null) {
      return false;
    }

    return (
      belongsToLayoutFrame(source, frame) && belongsToLayoutFrame(target, frame)
    );
  }

  function collectDescendants(parent, result) {
    var childCount;
    var i;

    if (parent == null || model == null) {
      return;
    }

    result.push(parent);
    childCount = model.getChildCount(parent);

    for (i = 0; i < childCount; i++) {
      collectDescendants(model.getChildAt(parent, i), result);
    }
  }

  function resolveLayoutCell(cellId) {
    var target = cellId != null ? String(cellId) : "";
    var defaultParent;
    var cells = [];
    var i;
    var cell;

    if (target.length == 0 || model == null) {
      return null;
    }

    cell = model.getCell(target);

    if (cell != null) {
      return cell;
    }

    defaultParent = graph != null ? graph.getDefaultParent() : null;
    collectDescendants(defaultParent, cells);

    for (i = 0; i < cells.length; i++) {
      cell = cells[i];

      if (cell == null) {
        continue;
      }

      if (
        getAttr(cell, "pluginType") == constants.FRAME_TYPE &&
        getAttr(cell, "frameId") == target
      ) {
        return cell;
      }

      if (
        getAttr(cell, "pluginType") == constants.ROOT_TYPE &&
        (getAttr(cell, "instanceId") == target ||
          (cell.id != null && String(cell.id) == target))
      ) {
        return cell;
      }

      if (
        getAttr(cell, "pluginType") == constants.CABINET_TYPE &&
        getAttr(cell, "logicalCabinetId") == target
      ) {
        return cell;
      }
    }

    return null;
  }

  function createGenericCellFromHostSnapshot(object) {
    var props = object != null && object.props != null ? object.props : {};
    var cell = new mxCell(
      snapshotDomainApi.deserializeCellValue(props.value),
      snapshotDomainApi.deserializeGeometry(object.geometry),
      props.style || "",
    );

    cell.setId(
      snapshotDomainApi.normalizeGenericStableId(String(object.id || "")),
    );
    cell.vertex = props.vertex == null ? true : !!props.vertex;
    cell.edge = false;
    cell.setConnectable(props.connectable == null ? true : !!props.connectable);
    cell.visible = props.visible == null ? true : !!props.visible;
    cell.collapsed = props.collapsed == null ? false : !!props.collapsed;
    return cell;
  }

  function applyPatchPortConstraint(edge, root, source, portId, object) {
    var port =
      root != null ? getPortMetaById(root, String(portId || "")) : null;
    var ports =
      port == null &&
      object != null &&
      object.props != null &&
      Array.isArray(object.props.ports)
        ? object.props.ports
        : [];
    var i;

    if (port == null) {
      for (i = 0; i < ports.length; i++) {
        if (String(ports[i].id || "") == String(portId || "")) {
          port = ports[i];
          break;
        }
      }
    }

    if (edge == null || root == null || port == null) {
      return;
    }

    graph.setConnectionConstraint(
      edge,
      root,
      source,
      new mxConnectionConstraint(
        new mxPoint(Number(port.x) || 0, Number(port.y) || 0),
        port.perimeter !== false,
        String(port.id || ""),
      ),
    );

    var style = model.getStyle(edge) || "";
    style = mxUtils.setStyle(
      style,
      source ? "sourcePortId" : "targetPortId",
      String(port.id || ""),
    );
    model.setStyle(edge, style);
  }

  function applyDiagramSnapshotPatch(patch) {
    var removeObjectIds = Array.isArray(patch.removeObjectIds)
      ? patch.removeObjectIds
      : [];
    var removeEdgeIds = Array.isArray(patch.removeEdgeIds)
      ? patch.removeEdgeIds
      : [];
    var addObjects = Array.isArray(patch.addObjects) ? patch.addObjects : [];
    var addEdges = Array.isArray(patch.addEdges) ? patch.addEdges : [];
    var addedObjectMap = {};
    var cellsToRemove = [];
    var i;

    runtimeState.updatingModel = true;
    runtimeState.allowProtectedDelete = true;
    model.beginUpdate();

    try {
      for (i = 0; i < removeEdgeIds.length; i++) {
        var edgeCell = resolveLayoutCell(removeEdgeIds[i]);
        if (edgeCell != null && model.isEdge(edgeCell)) {
          cellsToRemove.push(edgeCell);
        }
      }

      for (i = 0; i < removeObjectIds.length; i++) {
        var objectCell = resolveLayoutCell(removeObjectIds[i]);
        if (objectCell != null && model.isVertex(objectCell)) {
          cellsToRemove.push(objectCell);
        }
      }

      if (cellsToRemove.length > 0) {
        graph.removeCells(cellsToRemove, true);
      }

      for (i = 0; i < addObjects.length; i++) {
        var object = addObjects[i];

        if (object == null || object.kind != "generic") {
          throw new Error("局部图纸更新只允许新增普通图元");
        }

        var parent =
          resolveLayoutCell(object.parentId) || graph.getDefaultParent();
        var genericCell = createGenericCellFromHostSnapshot(object);
        model.add(parent, genericCell);
        addedObjectMap[String(object.id)] = {
          cell: genericCell,
          object: object,
        };
      }

      for (i = 0; i < addEdges.length; i++) {
        var edgeObject = addEdges[i];
        var sourceEntry =
          addedObjectMap[String(edgeObject.source.objectId || "")];
        var targetEntry =
          addedObjectMap[String(edgeObject.target.objectId || "")];
        var sourceRoot =
          sourceEntry != null
            ? sourceEntry.cell
            : resolveLayoutCell(edgeObject.source.objectId);
        var targetRoot =
          targetEntry != null
            ? targetEntry.cell
            : resolveLayoutCell(edgeObject.target.objectId);

        if (sourceRoot == null || targetRoot == null) {
          throw new Error("局部图纸更新找不到连线端点");
        }

        var edgeProps = edgeObject.props || {};
        var edgeStyle =
          edgeProps.style != null && edgeProps.style.raw != null
            ? String(edgeProps.style.raw)
            : "endArrow=none;html=1;rounded=0;edgeStyle=none;noEdgeStyle=1;";
        var edgeParent = resolveLayoutCell(edgeProps.parentId);
        var edge = graph.insertEdge(
          edgeParent || graph.getDefaultParent(),
          String(edgeObject.id || ""),
          snapshotDomainApi.deserializeCellValue(edgeProps.value),
          sourceRoot,
          targetRoot,
          edgeStyle,
        );

        var edgeGeometry = snapshotDomainApi.deserializeGeometry(
          edgeProps.geometry,
        );
        edgeGeometry.relative = true;
        model.setGeometry(edge, edgeGeometry);
        applyPatchPortConstraint(
          edge,
          sourceRoot,
          true,
          edgeObject.source.portId,
          sourceEntry != null ? sourceEntry.object : null,
        );
        applyPatchPortConstraint(
          edge,
          targetRoot,
          false,
          edgeObject.target.portId,
          targetEntry != null ? targetEntry.object : null,
        );
      }
    } finally {
      model.endUpdate();
      runtimeState.allowProtectedDelete = false;
      runtimeState.updatingModel = false;
    }

    graph.refresh();
    return snapshotDomainApi.exportDiagramSnapshot();
  }

  window.addEventListener(
    "message",
    function (evt) {
      if (validSource != null && evt.source !== validSource) {
        return;
      }

      var payload = parseHostMessage(evt.data);

      if (payload == null || payload.action == null) {
        return;
      }

      try {
        if (payload.action === "createSymbol" && payload.spec != null) {
          evt.stopImmediatePropagation();
          var point = resolveGraphInsertPoint(ctx, payload);
          commandApi.insertIntoGraphAt(payload.spec, point);
          var createdCell = ctx.graph.getSelectionCell();
          postResult(evt.source, payload, {
            cellId:
              createdCell != null && createdCell.id != null
                ? String(createdCell.id)
                : "",
          });
          return;
        }

        // ── Insert raw mxCell XML (basic shapes) ─────────────────────
        if (
          payload.action === "insertRawXml" &&
          typeof payload.xml === "string"
        ) {
          evt.stopImmediatePropagation();
          var insertPoint = resolveGraphInsertPoint(ctx, payload);
          var xmlDoc = mxUtils.parseXml(payload.xml);
          var cells = ctx.graph.importGraphModel(xmlDoc.documentElement, 0, 0);
          var insertedIds = [];
          if (Array.isArray(cells)) {
            // Move imported cells from (0,0) to the resolved graph point
            var model = ctx.graph.getModel();
            model.beginUpdate();
            try {
              for (var ci = 0; ci < cells.length; ci++) {
                var geo = model.getGeometry(cells[ci]);
                if (geo != null) {
                  geo = geo.clone();
                  if (cells[ci].isEdge()) {
                    // Edges: offset source/target points and intermediate waypoints
                    if (geo.sourcePoint != null) {
                      geo.sourcePoint.x += insertPoint.x;
                      geo.sourcePoint.y += insertPoint.y;
                    }
                    if (geo.targetPoint != null) {
                      geo.targetPoint.x += insertPoint.x;
                      geo.targetPoint.y += insertPoint.y;
                    }
                    if (geo.points != null && Array.isArray(geo.points)) {
                      for (var pi = 0; pi < geo.points.length; pi++) {
                        geo.points[pi].x += insertPoint.x;
                        geo.points[pi].y += insertPoint.y;
                      }
                    }
                  } else {
                    geo.x = insertPoint.x;
                    geo.y = insertPoint.y;
                  }
                  model.setGeometry(cells[ci], geo);
                }
                if (cells[ci] != null && !cells[ci].isEdge()) {
                  ensureDefaultGenericPortHost(cells[ci]);
                }
                if (cells[ci] != null && cells[ci].id != null) {
                  insertedIds.push(String(cells[ci].id));
                }
              }

              // importGraphModel 内部触发的绑定是按 (0,0) 算的，
              // 这里位置定下来之后再按最终几何重算一次
              syncFrameBinding(cells);
            } finally {
              model.endUpdate();
            }
            if (cells.length > 0) {
              ctx.graph.setSelectionCells(cells);
              ctx.graph.scrollCellToVisible(cells[0]);
            }
          }
          postResult(evt.source, payload, {
            cellIds: insertedIds,
            cellId: insertedIds.length > 0 ? insertedIds[0] : "",
          });
          return;
        }

        if (payload.action === "getDiagramXml") {
          evt.stopImmediatePropagation();
          postResult(evt.source, payload, {
            xml: serializeGraphModelForVisio(ctx),
            format: "xml",
          });
          return;
        }

        if (payload.action === "exportDiagram") {
          evt.stopImmediatePropagation();

          if (payload.format === "svg") {
            // graph.getSvg 已被 viewportVirtualization 自动包裹 expand/restore
            postResult(
              evt.source,
              payload,
              buildSvgExportPayload(ctx, payload.format),
            );
            return;
          }

          throw new Error("不支持的导出格式");
        }

        if (payload.action === "exportPdf") {
          evt.stopImmediatePropagation();
          var ui = ctx.ui;
          var pdfAction = ui != null ? ui.actions.get("exportPdf") : null;

          if (pdfAction == null) {
            throw new Error("当前环境缺少 PDF 导出动作");
          }

          pdfAction.funct();
          return;
        }

        if (payload.action === "saveToBackend") {
          evt.stopImmediatePropagation();
          openBackendSaveDialog();
          return;
        }

        if (payload.action === "rollbackBackend") {
          evt.stopImmediatePropagation();
          openBackendRollbackDialog();
          return;
        }

        if (payload.action === "ping") {
          evt.stopImmediatePropagation();
          postResult(evt.source, payload, {});
          return;
        }

        if (payload.action === "insertFrame" && payload.config != null) {
          evt.stopImmediatePropagation();
          var selectedFrame = resolveSelectedFrame(payload);
          commandApi.insertFrame(
            payload.config,
            selectedFrame,
            frameDomainApi.getAllDrawingFrames(),
          );
          var insertedFrame = frameDomainApi.findDrawingFrame(
            ctx.graph.getSelectionCell(),
          );

          if (
            insertedFrame != null &&
            Array.isArray(payload.frameLabels) &&
            payload.frameLabels.length > 0
          ) {
            var frameLabels = payload.frameLabels;
            var insertedCells = [];
            var labelIndex;

            runtimeState.updatingModel = true;

            if (model != null) {
              model.beginUpdate();
            }
            try {
              for (
                labelIndex = 0;
                labelIndex < frameLabels.length;
                labelIndex++
              ) {
                var frameLabel = frameLabels[labelIndex];

                if (frameLabel == null) {
                  continue;
                }

                insertedCells.push(
                  createFrameTemplateLabelCell(insertedFrame, frameLabel),
                );
              }

              for (
                labelIndex = 0;
                labelIndex < insertedCells.length;
                labelIndex++
              ) {
                if (model != null) {
                  model.add(insertedFrame, insertedCells[labelIndex]);
                } else {
                  insertedFrame.insert(insertedCells[labelIndex]);
                }
              }
            } finally {
              if (model != null) {
                model.endUpdate();
              }
              runtimeState.updatingModel = false;
            }
          }

          // ── Insert decoration cells (non-text shapes) ────────────────
          if (
            insertedFrame != null &&
            Array.isArray(payload.decorationCells) &&
            payload.decorationCells.length > 0
          ) {
            runtimeState.updatingModel = true;
            if (model != null) {
              model.beginUpdate();
            }
            try {
              for (var di = 0; di < payload.decorationCells.length; di++) {
                var deco = payload.decorationCells[di];
                if (deco == null) continue;
                var decoGeo = new mxGeometry(
                  Number(deco.x) || 0,
                  Number(deco.y) || 0,
                  Math.max(1, Number(deco.width) || 0),
                  Math.max(1, Number(deco.height) || 0),
                );
                var decoCell = new mxCell(
                  deco.label || "",
                  decoGeo,
                  withFrameDecorationFlag(deco.style),
                );
                decoCell.vertex = true;
                decoCell.setConnectable(false);
                if (model != null) {
                  model.add(insertedFrame, decoCell);
                } else {
                  insertedFrame.insert(decoCell);
                }
              }
            } finally {
              if (model != null) {
                model.endUpdate();
              }
              runtimeState.updatingModel = false;
            }
          }

          // ── Insert decoration edges (lines) ──────────────────────────
          if (
            insertedFrame != null &&
            Array.isArray(payload.decorationEdges) &&
            payload.decorationEdges.length > 0
          ) {
            runtimeState.updatingModel = true;
            if (model != null) {
              model.beginUpdate();
            }
            try {
              for (var ei = 0; ei < payload.decorationEdges.length; ei++) {
                var edgeDeco = payload.decorationEdges[ei];
                if (edgeDeco == null) continue;
                var pts = edgeDeco.points || [];
                if (pts.length < 2) continue;
                var edgeGeo = new mxGeometry();
                edgeGeo.relative = true;
                edgeGeo.setTerminalPoint(
                  new mxPoint(Number(pts[0].x) || 0, Number(pts[0].y) || 0),
                  true,
                );
                edgeGeo.setTerminalPoint(
                  new mxPoint(
                    Number(pts[pts.length - 1].x) || 0,
                    Number(pts[pts.length - 1].y) || 0,
                  ),
                  false,
                );
                if (pts.length > 2) {
                  edgeGeo.points = [];
                  for (var pi = 1; pi < pts.length - 1; pi++) {
                    edgeGeo.points.push(
                      new mxPoint(
                        Number(pts[pi].x) || 0,
                        Number(pts[pi].y) || 0,
                      ),
                    );
                  }
                }
                var edgeCell = new mxCell(
                  edgeDeco.label || "",
                  edgeGeo,
                  withFrameDecorationFlag(edgeDeco.style),
                );
                edgeCell.edge = true;
                edgeCell.setConnectable(false);
                if (model != null) {
                  model.add(insertedFrame, edgeCell);
                } else {
                  insertedFrame.insert(edgeCell);
                }
              }
            } finally {
              if (model != null) {
                model.endUpdate();
              }
              runtimeState.updatingModel = false;
            }
          }

          postResult(evt.source, payload, {
            frameId:
              insertedFrame != null ? getAttr(insertedFrame, "frameId") : "",
            groupId:
              insertedFrame != null
                ? frameDomainApi.getFrameGroupId(insertedFrame)
                : "",
            frameCellId:
              insertedFrame != null && insertedFrame.id != null
                ? String(insertedFrame.id)
                : "",
          });
          return;
        }

        if (
          payload.action === "insertCabinet" &&
          payload.cabinetModel != null
        ) {
          evt.stopImmediatePropagation();
          commandApi.insertCabinet(payload.cabinetModel);
          postResult(evt.source, payload, {
            logicalCabinetId:
              payload.cabinetModel.logicalCabinetId != null
                ? String(payload.cabinetModel.logicalCabinetId)
                : "",
          });
          return;
        }

        if (payload.action === "getSelectionInfo") {
          evt.stopImmediatePropagation();
          var selectedCell = selectionApi.getSelectedCell();
          var selectedFrame = selectionApi.getSelectedFrame();

          postResult(evt.source, payload, {
            selectedCellId:
              selectedCell != null && selectedCell.id != null
                ? String(selectedCell.id)
                : "",
            selectedFrameCellId:
              selectedFrame != null && selectedFrame.id != null
                ? String(selectedFrame.id)
                : "",
            selectedFrameId:
              selectedFrame != null ? getAttr(selectedFrame, "frameId") : "",
            selectedGroupId:
              selectedFrame != null
                ? frameDomainApi.getFrameGroupId(selectedFrame)
                : "",
          });
          return;
        }

        if (payload.action === "selectCell") {
          evt.stopImmediatePropagation();
          var requestedCellId =
            payload.cellId != null ? String(payload.cellId) : "";
          var requestedCell = resolveLayoutCell(requestedCellId);
          var selectionGraph =
            ctx.graph != null
              ? ctx.graph
              : ctx.ui != null && ctx.ui.editor != null
                ? ctx.ui.editor.graph
                : null;
          var selectedFrame2;

          if (requestedCell == null) {
            throw new Error("未找到要选中的单元");
          }

          if (selectionGraph == null) {
            throw new Error("当前图编辑器实例不可用");
          }

          selectionGraph.setSelectionCell(requestedCell);
          selectionGraph.scrollCellToVisible(requestedCell);
          selectedFrame2 = selectionApi.getSelectedFrame();

          postResult(evt.source, payload, {
            selectedCellId:
              requestedCell != null && requestedCell.id != null
                ? String(requestedCell.id)
                : "",
            selectedFrameCellId:
              selectedFrame2 != null && selectedFrame2.id != null
                ? String(selectedFrame2.id)
                : "",
            selectedFrameId:
              selectedFrame2 != null ? getAttr(selectedFrame2, "frameId") : "",
            selectedGroupId:
              selectedFrame2 != null
                ? frameDomainApi.getFrameGroupId(selectedFrame2)
                : "",
          });
          return;
        }

        if (payload.action === "deleteCellForTest") {
          evt.stopImmediatePropagation();
          var deleteCell = resolveLayoutCell(
            payload.cellId != null ? String(payload.cellId) : "",
          );

          if (deleteCell == null) {
            throw new Error("未找到要删除的测试图元");
          }

          runtimeState.allowProtectedDelete = true;
          try {
            graph.removeCells([deleteCell], true);
          } finally {
            runtimeState.allowProtectedDelete = false;
          }

          postResult(evt.source, payload, {
            snapshot: snapshotDomainApi.exportDiagramSnapshot(),
          });
          return;
        }

        if (payload.action === "moveCellForTest") {
          evt.stopImmediatePropagation();
          var moveCell = resolveLayoutCell(
            payload.cellId != null ? String(payload.cellId) : "",
          );

          if (moveCell == null) {
            throw new Error("未找到要移动的测试图元");
          }

          graph.moveCells(
            [moveCell],
            Number(payload.dx) || 0,
            Number(payload.dy) || 0,
            false,
          );
          postResult(evt.source, payload, {
            snapshot: snapshotDomainApi.exportDiagramSnapshot(),
          });
          return;
        }

        if (payload.action === "getCellViewInfoForTest") {
          evt.stopImmediatePropagation();
          var viewInfoCell = resolveLayoutCell(
            payload.cellId != null ? String(payload.cellId) : "",
          );
          var viewInfoRoot = findElectricalRoot(viewInfoCell);

          if (viewInfoRoot == null) {
            throw new Error("未找到要读取的测试图元");
          }

          graph.getView().validate();
          var viewInfoState = graph.getView().getState(viewInfoRoot);
          var containerRect = graph.container.getBoundingClientRect();
          var scrollLeft = Number(graph.container.scrollLeft) || 0;
          var scrollTop = Number(graph.container.scrollTop) || 0;
          var viewInfoPorts = getElectricalPorts(viewInfoRoot).map(
            function (port) {
              var point = getPortViewPoint(viewInfoRoot, port);
              return {
                id: String(port.id),
                ioMode: String(port.ioMode || "both"),
                occupied: isPortOccupied(viewInfoRoot, port.id),
                x: point != null ? point.x : 0,
                y: point != null ? point.y : 0,
                clientX:
                  point != null ? containerRect.left + point.x - scrollLeft : 0,
                clientY:
                  point != null ? containerRect.top + point.y - scrollTop : 0,
              };
            },
          );

          postResult(evt.source, payload, {
            rootCellId: String(viewInfoRoot.id || ""),
            role: getElectricalBusinessRole(viewInfoRoot),
            bounds:
              viewInfoState != null
                ? {
                    x: viewInfoState.x,
                    y: viewInfoState.y,
                    width: viewInfoState.width,
                    height: viewInfoState.height,
                    clientX: containerRect.left + viewInfoState.x - scrollLeft,
                    clientY: containerRect.top + viewInfoState.y - scrollTop,
                  }
                : null,
            ports: viewInfoPorts,
          });
          return;
        }

        if (payload.action === "getDiagramSnapshot") {
          evt.stopImmediatePropagation();
          // 导出快照前临时展开所有虚拟折叠，确保 getEdgePortId 等依赖
          // view state 的操作能正确解析端口信息
          var exportedSnapshot = withAllFramesExpanded(function () {
            return snapshotDomainApi.exportDiagramSnapshot();
          });
          postResult(evt.source, payload, {
            snapshot: exportedSnapshot,
          });
          return;
        }

        if (payload.action === "updateSymbolSpec" && payload.spec != null) {
          evt.stopImmediatePropagation();
          var requestedSymbolCell = resolveLayoutCell(
            payload.cellId != null ? String(payload.cellId) : "",
          );
          var requestedSymbolRoot = findElectricalRoot(requestedSymbolCell);
          if (requestedSymbolRoot == null) {
            throw new Error("未找到要更新属性的图元");
          }
          commandApi.applySymbolDataSpec(requestedSymbolRoot, payload.spec);
          var updatedSnapshot = withAllFramesExpanded(function () {
            return snapshotDomainApi.exportDiagramSnapshot();
          });
          postResult(evt.source, payload, {
            snapshot: updatedSnapshot,
          });
          return;
        }

        if (
          payload.action === "applyDiagramSnapshotPatch" &&
          payload.snapshotPatch != null
        ) {
          evt.stopImmediatePropagation();
          var patchedSnapshot = applyDiagramSnapshotPatch(
            payload.snapshotPatch,
          );
          postResult(evt.source, payload, {
            snapshot: patchedSnapshot,
          });
          return;
        }

        if (
          payload.action === "restoreDiagramSnapshot" &&
          payload.snapshot != null
        ) {
          evt.stopImmediatePropagation();
          // 恢复快照前临时展开所有虚拟折叠，避免 restoreDiagramSnapshot
          // 内部操作与虚拟折叠态冲突；结束后 withAllFramesExpanded 会重算折叠集合
          withAllFramesExpanded(function () {
            snapshotDomainApi.restoreDiagramSnapshot(payload.snapshot);
          });
          // Breaker→cable and cable→load edges only preserve the business
          // topology. Their ports are physically snapped together, so drawing
          // an additional routed segment creates the small L-shaped line seen
          // beside the symbols. Normalize old and new snapshots to invisible,
          // port-bound semantic links.
          normalizeMagneticCircuitEdges();
          // Large generated drafts immediately apply their edge routes and then
          // request one final snapshot.  Avoid serializing the whole graph here
          // as well when the host explicitly opts out.
          var restoredSnapshot =
            payload.skipSnapshot === true
              ? null
              : withAllFramesExpanded(function () {
                  return snapshotDomainApi.exportDiagramSnapshot();
                });
          postResult(evt.source, payload, {
            snapshot: restoredSnapshot,
          });
          return;
        }

        // Generated project drafts only need native orthogonal routing and port
        // bindings.  Apply every frame in one model transaction so large
        // projects do not pay one validation/repaint cycle per page.
        if (
          payload.action === "applyGeneratedRoutesBatch" &&
          Array.isArray(payload.routeBatches)
        ) {
          evt.stopImmediatePropagation();
          var batchGraph = ctx.graph;
          var batchModel =
            ctx.model != null
              ? ctx.model
              : batchGraph != null && typeof batchGraph.getModel === "function"
                ? batchGraph.getModel()
                : null;
          var allRoutes = [];
          var appliedRouteCount = 0;
          var batchIndex;
          var routeIndex;

          for (
            batchIndex = 0;
            batchIndex < payload.routeBatches.length;
            batchIndex++
          ) {
            var routeBatch = payload.routeBatches[batchIndex] || {};
            if (Array.isArray(routeBatch.edgeRoutes)) {
              allRoutes = allRoutes.concat(routeBatch.edgeRoutes);
            }
          }

          runtimeState.updatingModel = true;
          batchModel.beginUpdate();
          try {
            upsertManagedLayoutPorts(allRoutes);
            for (
              batchIndex = 0;
              batchIndex < payload.routeBatches.length;
              batchIndex++
            ) {
              var currentBatch = payload.routeBatches[batchIndex] || {};
              var batchFrame = resolveFrameCell(currentBatch);
              var batchRoutes = Array.isArray(currentBatch.edgeRoutes)
                ? currentBatch.edgeRoutes
                : [];
              if (batchFrame == null) {
                continue;
              }
              for (
                routeIndex = 0;
                routeIndex < batchRoutes.length;
                routeIndex++
              ) {
                var batchRoute = batchRoutes[routeIndex] || {};
                var batchEdgeId =
                  batchRoute.edgeId != null ? String(batchRoute.edgeId) : "";
                var batchEdge =
                  batchEdgeId.length > 0
                    ? batchModel.getCell(batchEdgeId)
                    : null;
                if (
                  batchEdge == null ||
                  !edgeBelongsToLayoutFrame(batchEdge, batchFrame)
                ) {
                  continue;
                }
                var batchGeometry = batchModel.getGeometry(batchEdge);
                if (batchGeometry == null) {
                  continue;
                }
                resetAutoLayoutEdgeState(batchEdge);
                batchGeometry = batchGeometry.clone();
                batchGeometry.points = null;
                batchModel.setGeometry(batchEdge, batchGeometry);
                if (
                  batchRoute.sourcePortId != null &&
                  String(batchRoute.sourcePortId).length > 0
                ) {
                  applyEdgeConstraintByPortId(
                    batchEdge,
                    true,
                    batchRoute.sourcePortId,
                  );
                }
                if (
                  batchRoute.targetPortId != null &&
                  String(batchRoute.targetPortId).length > 0
                ) {
                  applyEdgeConstraintByPortId(
                    batchEdge,
                    false,
                    batchRoute.targetPortId,
                  );
                }
                var batchStyle = batchModel.getStyle(batchEdge) || "";
                if (isCabinetSwitchLink(batchEdge)) {
                  batchStyle = mxUtils.setStyle(batchStyle, "jettySize", "0");
                  batchStyle = mxUtils.setStyle(
                    batchStyle,
                    "sourceJettySize",
                    "0",
                  );
                  batchStyle = mxUtils.setStyle(
                    batchStyle,
                    "targetJettySize",
                    "0",
                  );
                  batchStyle = mxUtils.setStyle(
                    batchStyle,
                    "noEdgeStyle",
                    "1",
                  );
                  batchStyle = mxUtils.setStyle(
                    batchStyle,
                    "edgeStyle",
                    null,
                  );
                } else {
                  batchStyle = mxUtils.setStyle(
                    batchStyle,
                    "jettySize",
                    "auto",
                  );
                  batchStyle = mxUtils.setStyle(
                    batchStyle,
                    "sourceJettySize",
                    "auto",
                  );
                  batchStyle = mxUtils.setStyle(
                    batchStyle,
                    "targetJettySize",
                    "auto",
                  );
                  batchStyle = mxUtils.setStyle(
                    batchStyle,
                    "noEdgeStyle",
                    null,
                  );
                  batchStyle = mxUtils.setStyle(
                    batchStyle,
                    "edgeStyle",
                    "orthogonalEdgeStyle",
                  );
                }
                batchStyle = mxUtils.setStyle(
                  batchStyle,
                  "eidLayoutManaged",
                  "1",
                );
                batchStyle = mxUtils.setStyle(batchStyle, "rounded", "0");
                batchModel.setStyle(batchEdge, batchStyle);
                appliedRouteCount++;
              }
            }
          } finally {
            batchModel.endUpdate();
            runtimeState.updatingModel = false;
          }

          postResult(evt.source, payload, { movedCount: appliedRouteCount });
          return;
        }

        if (
          payload.action === "applyLayoutPositions" &&
          Array.isArray(payload.positions)
        ) {
          evt.stopImmediatePropagation();
          var frame = resolveFrameCell(payload);
          var movedCells = [];
          var edgeMap = {};
          var frameGeometry;
          var frameOrigin;
          var isSnakeLayout = payload.layoutMode === "snake-wrap";
          var i;

          if (frame == null) {
            throw new Error("未找到要布局的图框");
          }

          frameGeometry = model.getGeometry(frame);
          frameOrigin = {
            x: frameGeometry != null ? frameGeometry.x : 0,
            y: frameGeometry != null ? frameGeometry.y : 0,
          };

          runtimeState.updatingModel = true;
          model.beginUpdate();

          try {
            for (i = 0; i < payload.positions.length; i++) {
              var item = payload.positions[i] || {};
              var cellId = item.cellId != null ? String(item.cellId) : "";
              var x = Number(item.x);
              var y = Number(item.y);
              var cell;
              var geometry;
              var nextGeometry;
              var edges;
              var j;

              if (cellId.length == 0 || !isFinite(x) || !isFinite(y)) {
                continue;
              }

              cell = resolveLayoutCell(cellId);

              if (cell == null) {
                continue;
              }

              if (!belongsToLayoutFrame(cell, frame)) {
                continue;
              }

              geometry = model.getGeometry(cell);

              if (geometry == null) {
                continue;
              }

              nextGeometry = geometry.clone();
              if (model.getParent(cell) === frame) {
                nextGeometry.x = x;
                nextGeometry.y = y;
              } else {
                nextGeometry.x = x + frameOrigin.x;
                nextGeometry.y = y + frameOrigin.y;
              }
              model.setGeometry(cell, nextGeometry);
              movedCells.push(cell);

              edges = graph.getConnections(cell) || [];

              for (j = 0; j < edges.length; j++) {
                if (
                  edges[j] != null &&
                  edges[j].id != null &&
                  edgeBelongsToLayoutFrame(edges[j], frame)
                ) {
                  edgeMap[String(edges[j].id)] = edges[j];
                }
              }
            }

            bindCellsToFrame(movedCells, frame);

            for (var edgeId in edgeMap) {
              if (edgeMap.hasOwnProperty(edgeId)) {
                clearEdgePoints(edgeMap[edgeId]);
                if (!isSnakeLayout) {
                  clearLayoutRouteMetadata(edgeMap[edgeId]);
                  resetEdgeAutoStyle(edgeMap[edgeId]);
                }
              }
            }

            if (Array.isArray(payload.edgeRoutes)) {
              for (i = 0; i < movedCells.length; i++) {
                cleanupManagedLayoutPortsForCell(movedCells[i]);
              }

              upsertManagedLayoutPorts(payload.edgeRoutes);

              for (i = 0; i < payload.edgeRoutes.length; i++) {
                var route = payload.edgeRoutes[i] || {};
                var edgeId = route.edgeId != null ? String(route.edgeId) : "";
                var edge = edgeId.length > 0 ? model.getCell(edgeId) : null;
                var edgeGeometry;
                var nextPoints = [];
                var edgeParent;
                var parentGeometry;
                var parentOriginX;
                var parentOriginY;
                var points;
                var hasSourcePortBinding;
                var hasTargetPortBinding;
                var sourceConstraint;
                var targetConstraint;
                var useNativeRouting;
                var useStraightRouteStyle;
                var keepLayoutManagedFlag;
                var j;

                if (
                  edge == null ||
                  !Array.isArray(route.points) ||
                  !edgeBelongsToLayoutFrame(edge, frame)
                ) {
                  continue;
                }

                edgeGeometry = model.getGeometry(edge);

                if (edgeGeometry == null) {
                  continue;
                }

                edgeParent = model.getParent(edge);
                parentGeometry =
                  edgeParent != null ? model.getGeometry(edgeParent) : null;
                parentOriginX = parentGeometry != null ? parentGeometry.x : 0;
                parentOriginY = parentGeometry != null ? parentGeometry.y : 0;
                points = route.points;
                useNativeRouting = route.useNativeRouting === true;

                if (!useNativeRouting) {
                  for (j = 0; j < points.length; j++) {
                    var point = points[j] || {};
                    var px = Number(point.x);
                    var py = Number(point.y);

                    if (!isFinite(px) || !isFinite(py)) {
                      continue;
                    }

                    nextPoints.push(
                      new mxPoint(
                        px + frameOrigin.x - parentOriginX,
                        py + frameOrigin.y - parentOriginY,
                      ),
                    );
                  }
                }

                var nextStyle;
                hasSourcePortBinding =
                  route.sourcePortId != null &&
                  String(route.sourcePortId).length > 0;
                hasTargetPortBinding =
                  route.targetPortId != null &&
                  String(route.targetPortId).length > 0;
                sourceConstraint = useNativeRouting
                  ? null
                  : readRouteConstraint(route.sourceConstraint);
                targetConstraint = useNativeRouting
                  ? null
                  : readRouteConstraint(route.targetConstraint);

                resetAutoLayoutEdgeState(edge);
                edgeGeometry = edgeGeometry.clone();
                edgeGeometry.points =
                  !useNativeRouting && nextPoints.length > 0
                    ? nextPoints
                    : null;
                model.setGeometry(edge, edgeGeometry);
                nextStyle = model.getStyle(edge) || "";

                if (hasSourcePortBinding) {
                  applyEdgeConstraintByPortId(edge, true, route.sourcePortId);
                } else if (sourceConstraint != null) {
                  applyEdgeConstraintByPoint(edge, true, sourceConstraint);
                }
                nextStyle = model.getStyle(edge) || nextStyle;

                if (hasTargetPortBinding) {
                  applyEdgeConstraintByPortId(edge, false, route.targetPortId);
                } else if (targetConstraint != null) {
                  applyEdgeConstraintByPoint(edge, false, targetConstraint);
                }
                nextStyle = model.getStyle(edge) || nextStyle;
                // Cabinet-to-switch leads are intentionally single straight
                // segments. The orthogonal router adds an oversized jetty for
                // this short parent-to-symbol edge and doubles back across the
                // switch, visually filling the SVG's open contact gap.
                useStraightRouteStyle =
                  isCabinetSwitchLink(edge) ||
                  (!useNativeRouting &&
                    ((isSnakeLayout && route.manual) || nextPoints.length > 0));
                keepLayoutManagedFlag =
                  hasSourcePortBinding ||
                  hasTargetPortBinding ||
                  sourceConstraint != null ||
                  targetConstraint != null ||
                  nextPoints.length > 0 ||
                  useNativeRouting;
                if (useStraightRouteStyle) {
                  nextStyle = mxUtils.setStyle(nextStyle, "jettySize", "0");
                  nextStyle = mxUtils.setStyle(
                    nextStyle,
                    "sourceJettySize",
                    "0",
                  );
                  nextStyle = mxUtils.setStyle(
                    nextStyle,
                    "targetJettySize",
                    "0",
                  );
                  nextStyle = mxUtils.setStyle(nextStyle, "noEdgeStyle", "1");
                  nextStyle = mxUtils.setStyle(nextStyle, "edgeStyle", null);
                  nextStyle = mxUtils.setStyle(
                    nextStyle,
                    "eidLayoutManaged",
                    keepLayoutManagedFlag ? "1" : null,
                  );
                } else {
                  nextStyle = mxUtils.setStyle(nextStyle, "jettySize", "auto");
                  nextStyle = mxUtils.setStyle(
                    nextStyle,
                    "sourceJettySize",
                    "auto",
                  );
                  nextStyle = mxUtils.setStyle(
                    nextStyle,
                    "targetJettySize",
                    "auto",
                  );
                  nextStyle = mxUtils.setStyle(nextStyle, "noEdgeStyle", null);
                  nextStyle = mxUtils.setStyle(
                    nextStyle,
                    "edgeStyle",
                    "orthogonalEdgeStyle",
                  );
                  nextStyle = mxUtils.setStyle(
                    nextStyle,
                    "eidLayoutManaged",
                    keepLayoutManagedFlag ? "1" : null,
                  );
                }

                nextStyle = mxUtils.setStyle(nextStyle, "rounded", "0");
                model.setStyle(edge, nextStyle);
              }
            }
          } finally {
            model.endUpdate();
            runtimeState.updatingModel = false;
          }

          if (movedCells.length > 0) {
            graph.setSelectionCells(movedCells);
            graph.scrollCellToVisible(movedCells[0]);
          }

          postResult(evt.source, payload, {
            movedCount: movedCells.length,
          });
        }
      } catch (e) {
        postError(evt.source, payload, e);
        if (window.console != null) {
          console.error("[electricalSymbols] host bridge failed", e);
        }
      }
    },
    true,
  );

  // Make the magnetic behavior discoverable while the user is dragging. The
  // green rings and dashed guide identify the exact two ports that will be
  // connected; orange means the nearby pair is invalid or already occupied.
  graph.addMouseListener({
    mouseDown: function () {
      hideSnapPreview();
    },
    mouseMove: function () {
      updateSnapPreviewForCurrentDrag();
    },
    mouseUp: function () {
      hideSnapPreview();
    },
  });

  graph.addListener(mxEvent.CELLS_MOVED, function (_sender, evt) {
    if (runtimeState.updatingModel) {
      return;
    }

    var movedCells = evt != null ? evt.getProperty("cells") : null;
    // mxGraph dispatches CELLS_MOVED while finishing its model transaction.
    // Read port geometry on the next task so both programmatic and real mouse
    // drags are measured from the committed cell position, not the previous
    // cached location.
    window.setTimeout(function () {
      if (runtimeState.updatingModel) {
        return;
      }
      var detachedCount = detachMovedElectricalPorts(movedCells);
      snapMovedElectricalPorts(movedCells, detachedCount > 0);
      clearConnectedEdgesForCells(movedCells);
    }, 0);
  });

  // Notify the React host after user graph edits. Host-driven restores set
  // updatingModel, so they are excluded to prevent an event/restore loop.
  var modelChangeDebounce = null;
  var pendingStructuralModelChange = false;
  graph.getModel().addListener(mxEvent.CHANGE, function (_sender, evt) {
    if (runtimeState.updatingModel) {
      return;
    }

    var edit = evt != null ? evt.getProperty("edit") : null;
    var changes =
      edit != null && Array.isArray(edit.changes) ? edit.changes : [];
    for (var i = 0; i < changes.length; i++) {
      var change = changes[i];
      if (
        (typeof mxTerminalChange !== "undefined" &&
          change instanceof mxTerminalChange) ||
        (typeof mxChildChange !== "undefined" &&
          change instanceof mxChildChange)
      ) {
        pendingStructuralModelChange = true;
        break;
      }
    }

    clearTimeout(modelChangeDebounce);
    modelChangeDebounce = setTimeout(function () {
      if (!runtimeState.updatingModel) {
        var structural = pendingStructuralModelChange;
        pendingStructuralModelChange = false;
        emitHostEvent("eid-model-changed", { structural: structural });
      }
    }, 40);
  });

  // ─── Selection Change → push to host ─────────────────────────────────
  var selectionDebounce = null;
  var selModel = graph.getSelectionModel();

  selModel.addListener(mxEvent.CHANGE, function () {
    clearTimeout(selectionDebounce);
    selectionDebounce = setTimeout(function () {
      var cell = graph.getSelectionCell();
      // Generated symbols may contain ordinary-looking child vertices without
      // esKind metadata. findPortHostRoot intentionally stops at those cells,
      // so use the unrestricted electrical-root walk first for selections.
      var root =
        cell != null && !cell.edge
          ? findElectricalRoot(cell) || findPortHostRoot(cell)
          : null;
      emitHostEvent("eid-selection-changed", {
        cellId: cell != null && cell.id != null ? String(cell.id) : "",
        rootCellId: root != null && root.id != null ? String(root.id) : "",
        cellType: cell != null ? (cell.edge ? "edge" : "vertex") : "",
        isEdge: cell != null && !!cell.edge,
      });
    }, 50);
  });

  window.__eidElectricalHostBridgeInstalled = true;
  emitHostEvent("eid-ready");
}
