/**
 * 宿主桥接层。
 * 负责接收宿主页面通过 postMessage 发来的图元/图框/配电柜请求，
 * 在 draw.io 插件内直接走原生命令链路完成插入。
 */
import { commandApi } from "../application/commands.js";
import { selectionApi } from "../application/selection.js";
import { frameDomainApi } from "../domain/frame.js";
import { snapshotDomainApi } from "../domain/snapshot.js";
import { makeFrameLabelStyle } from "../domain/frameCore.js";
import { clearEdgePoints, getPortMetaById } from "./connectionConstraints.js";
import { findPortHostRoot } from "../core/runtimeHelpers.js";
import { createMetaCell } from "../utils/xml.js";
import { getAttr } from "../utils/xml.js";
import { openBackendSaveDialog, openBackendRollbackDialog } from "../ui/backendDialogs.js";

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
  var graph = ctx.graph;
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
    format: format,
  };
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
  var graph = ctx.graph;
  var model =
    ctx.model != null
      ? ctx.model
      : graph != null && typeof graph.getModel === "function"
        ? graph.getModel()
        : null;
  var runtimeState = ctx.state != null ? ctx.state : {};
  var constants = ctx.constants;

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

  function isLayoutManagedEdge(edge) {
    var style;

    if (edge == null || model == null) {
      return false;
    }

    style = model.getStyle(edge) || "";
    return mxUtils.getValue(style, "eidLayoutManaged", "0") === "1";
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
        var edgeStyle = model.getStyle(edge) || "";
        var sourcePortId = mxUtils.getValue(edgeStyle, "sourcePortId", "");
        var targetPortId = mxUtils.getValue(edgeStyle, "targetPortId", "");

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

    if (ownerFrame == null) {
      return true;
    }

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
            cellId: createdCell != null && createdCell.id != null ? String(createdCell.id) : "",
          });
          return;
        }

        if (payload.action === "exportDiagram") {
          evt.stopImmediatePropagation();

          if (payload.format === "svg") {
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
                  deco.style || "",
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
                      new mxPoint(Number(pts[pi].x) || 0, Number(pts[pi].y) || 0),
                    );
                  }
                }
                var edgeCell = new mxCell(
                  edgeDeco.label || "",
                  edgeGeo,
                  edgeDeco.style || "",
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
          var requestedCellId = payload.cellId != null ? String(payload.cellId) : "";
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

        if (payload.action === "getDiagramSnapshot") {
          evt.stopImmediatePropagation();
          postResult(evt.source, payload, {
            snapshot: snapshotDomainApi.exportDiagramSnapshot(),
          });
          return;
        }

        if (payload.action === "restoreDiagramSnapshot" && payload.snapshot != null) {
          evt.stopImmediatePropagation();
          snapshotDomainApi.restoreDiagramSnapshot(payload.snapshot);
          postResult(evt.source, payload, {
            snapshot: snapshotDomainApi.exportDiagramSnapshot(),
          });
          return;
        }

        if (
          payload.action === "applyLayoutPositions" &&
          Array.isArray(payload.positions)
        ) {
          evt.stopImmediatePropagation();
          var frame = resolveFrameCell(payload);
          var graph = ctx.graph;
          var model =
            ctx.model != null
              ? ctx.model
              : graph != null && typeof graph.getModel === "function"
                ? graph.getModel()
                : null;
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
                var useManualRouteStyle;
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

                var nextStyle;
                hasSourcePortBinding =
                  route.sourcePortId != null &&
                  String(route.sourcePortId).length > 0;
                hasTargetPortBinding =
                  route.targetPortId != null &&
                  String(route.targetPortId).length > 0;

                resetAutoLayoutEdgeState(edge);
                edgeGeometry = edgeGeometry.clone();
                edgeGeometry.points = nextPoints.length > 0 ? nextPoints : null;
                model.setGeometry(edge, edgeGeometry);
                nextStyle = model.getStyle(edge) || "";

                if (hasSourcePortBinding) {
                  applyEdgeConstraintByPortId(edge, true, route.sourcePortId);
                }
                nextStyle = model.getStyle(edge) || nextStyle;

                if (hasTargetPortBinding) {
                  applyEdgeConstraintByPortId(edge, false, route.targetPortId);
                }
                nextStyle = model.getStyle(edge) || nextStyle;
                useManualRouteStyle =
                  (isSnakeLayout && route.manual) || nextPoints.length > 0;
                keepLayoutManagedFlag =
                  hasSourcePortBinding || hasTargetPortBinding || nextPoints.length > 0;
                if (useManualRouteStyle) {
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

  graph.addListener(mxEvent.CELLS_MOVED, function (_sender, evt) {
    if (runtimeState.updatingModel) {
      return;
    }

    clearConnectedEdgesForCells(evt != null ? evt.getProperty("cells") : null);
  });

  // ─── Selection Change → push to host ─────────────────────────────────
  var selectionDebounce = null;
  var selModel = graph.getSelectionModel();

  selModel.addListener(mxEvent.CHANGE, function () {
    clearTimeout(selectionDebounce);
    selectionDebounce = setTimeout(function () {
      var cell = graph.getSelectionCell();
      emitHostEvent("eid-selection-changed", {
        cellId: cell != null && cell.id != null ? String(cell.id) : "",
        cellType: cell != null ? (cell.edge ? "edge" : "vertex") : "",
        isEdge: cell != null && !!cell.edge,
      });
    }, 50);
  });

  window.__eidElectricalHostBridgeInstalled = true;
  emitHostEvent("eid-ready");
}
