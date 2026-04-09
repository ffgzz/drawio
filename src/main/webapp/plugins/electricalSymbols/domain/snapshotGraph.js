import {
  computeSnapshotChanges,
  deserializeCellValue,
  deserializeGeometry,
  getCellStableId,
  getGenericObjectId,
  normalizeGenericStableId,
  normalizeSnapshotGenericIds,
  serializeCellValue,
  serializeGeometry,
  toNumber,
} from "./snapshotCore.js";
import { getApp } from "../core/appRuntime.js";
import {
  cloneJson,
  isObject,
  toInt,
  trim,
  uniqueStrings,
} from "../utils/base.js";
import { createNode, getAttr } from "../utils/xml.js";
import {
  findPortHostRoot,
  isCabinetGap,
  isCabinetSegment,
  isDrawingFrame,
  isElectricalRoot,
  resetPendingChangeRecords,
} from "../core/runtimeHelpers.js";
import { cabinetDialogsApi } from "../ui/cabinetDialog.js";
import { cabinetDomainApi } from "./cabinet.js";
import { composeModeApi } from "../runtime/composeMode.js";
import { connectionConstraintsApi } from "../runtime/connectionConstraints.js";
import { frameDomainApi } from "./frame.js";
import { portSwapModeApi } from "../runtime/portSwapMode.js";
import { specDomainApi } from "./spec.js";
import { symbolDomainApi } from "./symbol.js";

/**
 * 快照域模型。
 * 负责图纸导出、恢复、对象标识归一化和快照差异比较。
 */
// 这个模块支撑后端保存、加载、回滚和本地操作记录。
function buildSnapshotDeps() {
  var app = getApp();
  var ctx = app.ctx;

  return {
    graph: ctx.graph,
    model: ctx.model,
    state: ctx.state,
    ui: ctx.ui,
    BODY_KIND: ctx.constants.BODY_KIND,
    LABEL_KIND: ctx.constants.LABEL_KIND,
    FRAME_LABEL_KIND: ctx.constants.FRAME_LABEL_KIND,
    CABINET_BODY_KIND: ctx.constants.CABINET_BODY_KIND,
    CABINET_GAP_KIND: ctx.constants.CABINET_GAP_KIND,
    FRAME_MARGIN_RATIO: ctx.constants.FRAME_MARGIN_RATIO,
    trim,
    toInt,
    isObject,
    cloneJson,
    createNode,
    getAttr,
    uniqueStrings,
    isCabinetGap,
    isDrawingFrame,
    isCabinetSegment,
    isElectricalRoot,
    extractSpec: symbolDomainApi.extractSpec,
    getFrameConfig: frameDomainApi.getFrameConfig,
    getFramePageNumber: frameDomainApi.getFramePageNumber,
    getFrameGroupId: frameDomainApi.getFrameGroupId,
    findFrameById: frameDomainApi.findFrameById,
    extractCabinetModel: cabinetDomainApi.extractCabinetModel,
    findCabinetSegments: cabinetDomainApi.findCabinetSegments,
    getPortMetaById: connectionConstraintsApi.getPortMetaById,
    findDrawingFrame: frameDomainApi.findDrawingFrame,
    findPortHostRoot,
    parsePortLayout: specDomainApi.parsePortLayout,
    getAllDrawingFrames: frameDomainApi.getAllDrawingFrames,
    exitInstanceComposeMode: function (clearStatus) {
      return composeModeApi.exitInstanceComposeMode(clearStatus);
    },
    closeGapDialogWindow: function () {
      return cabinetDialogsApi.closeGapDialogWindow();
    },
    setSelectedCabinetGap: function (logicalCabinetId, gapIndex) {
      return cabinetDomainApi.setSelectedCabinetGap(logicalCabinetId, gapIndex);
    },
    exitPortSwapMode: function (clearStatus) {
      return portSwapModeApi.exitPortSwapMode(clearStatus);
    },
    createDrawingFrameCell: frameDomainApi.createDrawingFrameCell,
    addTopLevelCell: frameDomainApi.addTopLevelCell,
    relayoutCabinetByModel: cabinetDomainApi.relayoutCabinetByModel,
    normalizeSpec: specDomainApi.normalizeSpec,
    buildSymbolCell: symbolDomainApi.buildSymbolCell,
    resetPendingChangeRecords,
  };
}

export function createSnapshotDomain() {
  var deps = arguments.length > 0 ? arguments[0] : buildSnapshotDeps();
  var graph = deps.graph;
  var model = deps.model;
  var state = deps.state;
  var ui = deps.ui;
  var currentDuplicateSymbolInstanceIds = null;

  function belongsToCurrentDefaultParent(cell) {
    var parent = cell != null ? model.getParent(cell) : null;
    var defaultParent = graph.getDefaultParent();

    while (parent != null) {
      if (parent == defaultParent) {
        return true;
      }

      parent = model.getParent(parent);
    }

    return false;
  }

  function getAllModelCells() {
    var cells = [];
    var seen = {};
    var key;

    for (key in model.cells) {
      if (
        Object.prototype.hasOwnProperty.call(model.cells, key) &&
        model.cells[key] != null &&
        model.cells[key] != graph.getDefaultParent() &&
        belongsToCurrentDefaultParent(model.cells[key]) &&
        !seen[key]
      ) {
        seen[key] = true;
        cells.push(model.cells[key]);
      }
    }

    return cells;
  }

  function getPreferredSymbolInstanceId(cell) {
    var instanceId = deps.trim(deps.getAttr(cell, "instanceId"));

    if (instanceId.length > 0) {
      return instanceId;
    }

    var spec = deps.extractSpec(cell);
    return deps.trim(spec != null ? spec.instanceId : "");
  }

  function collectDuplicateSymbolInstanceIds(cells) {
    var counts = {};
    var duplicates = {};
    var i;

    for (i = 0; i < cells.length; i++) {
      var cell = cells[i];

      if (!deps.isElectricalRoot(cell)) {
        continue;
      }

      var instanceId = getPreferredSymbolInstanceId(cell);

      if (instanceId.length == 0) {
        continue;
      }

      counts[instanceId] = (counts[instanceId] || 0) + 1;
    }

    for (var key in counts) {
      if (
        Object.prototype.hasOwnProperty.call(counts, key) &&
        counts[key] > 1
      ) {
        duplicates[key] = true;
      }
    }

    return duplicates;
  }

  function getStyleConstraintFromEdge(edge, source) {
    var style = graph.getCellStyle(edge) || {};
    var prefix = source ? "exit" : "entry";
    var x = mxUtils.getValue(style, prefix + "X", null);
    var y = mxUtils.getValue(style, prefix + "Y", null);

    if (deps.trim(x).length == 0 || deps.trim(y).length == 0) {
      return null;
    }

    return new mxConnectionConstraint(
      new mxPoint(toNumber(x, 0), toNumber(y, 0)),
      mxUtils.getValue(style, prefix + "Perimeter", 1) != "0",
      null,
      toNumber(mxUtils.getValue(style, prefix + "Dx", 0), 0),
      toNumber(mxUtils.getValue(style, prefix + "Dy", 0), 0),
    );
  }

  function getEdgePortId(edge, root, source) {
    var style = graph.getCellStyle(edge) || {};
    var key = source ? "sourcePortId" : "targetPortId";
    var portId = deps.trim(mxUtils.getValue(style, key, ""));
    var edgeState;
    var terminalState;
    var constraint;
    var point;
    var isGenericRoot;
    var genericBindings;
    var ports;
    var i;

    if (portId.length > 0) {
      return portId;
    }

    edgeState = graph.view.getState(edge);
    terminalState = graph.view.getState(root);
    constraint =
      edgeState != null && terminalState != null
        ? graph.getConnectionConstraint(edgeState, terminalState, source)
        : null;

    if (constraint == null) {
      constraint = getStyleConstraintFromEdge(edge, source);
    }

    point = constraint != null ? constraint.point : null;
    isGenericRoot = !deps.isElectricalRoot(root) && !deps.isCabinetSegment(root);
    genericBindings = isGenericRoot ? collectGenericPortBindings(root) : null;
    ports = isGenericRoot
      ? genericBindings.map(function (binding) {
          return binding.port;
        })
      : deps.parsePortLayout(deps.getAttr(root, "portsJson"));

    if (isGenericRoot && constraint != null) {
      var absolutePoint =
        edgeState != null && terminalState != null
          ? graph.getConnectionPoint(terminalState, constraint)
          : null;

      for (i = 0; i < genericBindings.length; i++) {
        var binding = genericBindings[i];

        if (
          deps.trim(binding.port.name).length > 0 &&
          deps.trim(binding.port.name) == deps.trim(constraint.name)
        ) {
          return deps.trim(binding.port.id);
        }

        if (
          binding.constraint != null &&
          binding.constraint.point != null &&
          Math.abs(binding.constraint.point.x - constraint.point.x) < 0.0001 &&
          Math.abs(binding.constraint.point.y - constraint.point.y) < 0.0001 &&
          toNumber(binding.constraint.dx, 0) == toNumber(constraint.dx, 0) &&
          toNumber(binding.constraint.dy, 0) == toNumber(constraint.dy, 0) &&
          binding.constraint.perimeter === constraint.perimeter
        ) {
          return deps.trim(binding.port.id);
        }

        if (
          absolutePoint != null &&
          Math.abs(binding.port.x - absolutePoint.x) < 1 &&
          Math.abs(binding.port.y - absolutePoint.y) < 1
        ) {
          return deps.trim(binding.port.id);
        }
      }
    }

    if (point != null) {
      for (i = 0; i < ports.length; i++) {
        if (
          Math.abs(ports[i].x - point.x) < 0.0001 &&
          Math.abs(ports[i].y - point.y) < 0.0001
        ) {
          return deps.trim(ports[i].id);
        }
      }
    }

    return "";
  }


  // 统一过滤插件内部辅助 cell，避免把 body/label/gap 当成业务对象导出。
  function isPluginInternalCell(cell) {
    var kind = deps.trim(deps.getAttr(cell, "esKind"));

    return (
      deps.isCabinetGap(cell) ||
      kind == deps.BODY_KIND ||
      kind == deps.LABEL_KIND ||
      kind == deps.FRAME_LABEL_KIND ||
      kind == deps.CABINET_BODY_KIND ||
      kind == deps.CABINET_GAP_KIND
    );
  }

  // 只有真正的“普通图形”才会作为 generic 对象导出到快照。
  function shouldExportGenericObject(cell) {
    return (
      cell != null &&
      model.isVertex(cell) &&
      !deps.isDrawingFrame(cell) &&
      !deps.isCabinetSegment(cell) &&
      !deps.isElectricalRoot(cell) &&
      !isPluginInternalCell(cell)
    );
  }

  function clearPageForImport() {
    var parent = graph.getDefaultParent();
    var cells = [];
    var i;

    for (i = 0; i < model.getChildCount(parent); i++) {
      cells.push(model.getChildAt(parent, i));
    }

    deps.closeGapDialogWindow();
    deps.setSelectedCabinetGap(null, null);
    deps.exitPortSwapMode(false);

    if (cells.length == 0) {
      return;
    }

    state.allowProtectedDelete = true;

    try {
      graph.removeCells(cells, true);
    } finally {
      state.allowProtectedDelete = false;
    }
  }

  function resolveSnapshotObjectId(cell) {
    if (cell == null) {
      return null;
    }

    if (deps.isDrawingFrame(cell)) {
      return deps.trim(deps.getAttr(cell, "frameId")) || null;
    }

    if (deps.isCabinetSegment(cell)) {
      return (
        deps.trim(cell.id != null ? String(cell.id) : "") ||
        deps.trim(deps.getAttr(cell, "logicalCabinetId")) ||
        null
      );
    }

    if (deps.isElectricalRoot(cell)) {
      return getSymbolObjectId(cell, currentDuplicateSymbolInstanceIds);
    }

    if (shouldExportGenericObject(cell)) {
      return getGenericObjectId(cell);
    }

    return null;
  }

  function collectGenericPortBindings(cell) {
    var seen = {};
    var result = [];

    function addConstraint(constraint) {
      if (constraint == null || constraint.point == null) {
        return;
      }

      var duplicateKey = JSON.stringify({
        name: deps.trim(constraint.name),
        x: toNumber(constraint.point.x, 0),
        y: toNumber(constraint.point.y, 0),
        perimeter: constraint.perimeter !== false,
        dx: toNumber(constraint.dx, 0),
        dy: toNumber(constraint.dy, 0),
      });

      if (seen[duplicateKey]) {
        return;
      }

      seen[duplicateKey] = true;

      var entry = {
        id: deps.trim(constraint.name) || "port:" + String(result.length + 1),
        name: deps.trim(constraint.name),
        x: toNumber(constraint.point.x, 0),
        y: toNumber(constraint.point.y, 0),
        marker: "cross",
        direction: "any",
        ioMode: "both",
        perimeter: constraint.perimeter !== false,
        dx: toNumber(constraint.dx, 0),
        dy: toNumber(constraint.dy, 0),
      };
      result.push({
        port: entry,
        constraint,
      });
    }

    var stateView = graph.view.getState(cell);

    if (stateView != null) {
      var sourceConstraints = graph.getAllConnectionConstraints(stateView, true);
      var targetConstraints = graph.getAllConnectionConstraints(stateView, false);
      var i;

      if (Array.isArray(sourceConstraints)) {
        for (i = 0; i < sourceConstraints.length; i++) {
          addConstraint(sourceConstraints[i]);
        }
      }

      if (Array.isArray(targetConstraints)) {
        for (i = 0; i < targetConstraints.length; i++) {
          addConstraint(targetConstraints[i]);
        }
      }
    }

    return result;
  }

  function extractGenericPorts(cell) {
    return collectGenericPortBindings(cell).map(function (entry) {
      return entry.port;
    });
  }

  function getGenericPortBindingById(cell, portId) {
    var targetId = deps.trim(portId);
    var bindings = collectGenericPortBindings(cell);
    var i;

    for (i = 0; i < bindings.length; i++) {
      if (deps.trim(bindings[i].port.id) == targetId) {
        return bindings[i];
      }
    }

    return null;
  }

  function getSymbolObjectId(root, duplicateInstanceIds) {
    var instanceId = getPreferredSymbolInstanceId(root);

    if (
      instanceId.length > 0 &&
      !(duplicateInstanceIds != null && duplicateInstanceIds[instanceId] === true)
    ) {
      return instanceId;
    }

    return deps.trim(root != null ? root.id : "");
  }

  function exportFrameObject(frame) {
    var geometry = model.getGeometry(frame);
    var frameId = deps.trim(deps.getAttr(frame, "frameId"));
    var frameConfig = deps.getFrameConfig(frame);

    return {
      id: frameId,
      kind: "frame",
      parentId: null,
      groupId: deps.getFrameGroupId(frame) || null,
      geometry: {
        x: geometry != null ? geometry.x : 0,
        y: geometry != null ? geometry.y : 0,
        width: geometry != null ? geometry.width : frameConfig.width,
        height: geometry != null ? geometry.height : frameConfig.height,
      },
      props: {
        pageNumber: deps.getFramePageNumber(frame),
        frameConfig,
        originFrameId: deps.trim(deps.getAttr(frame, "originFrameId")) || null,
        autoFrameOwner: deps.trim(deps.getAttr(frame, "autoFrameOwner")) || null,
        autoFrameIndex: deps.toInt(deps.getAttr(frame, "autoFrameIndex"), 0),
      },
    };
  }

  function exportCabinetObject(segment) {
    var cabinetModel = deps.extractCabinetModel(segment);
    var currentFrame = deps.findDrawingFrame(segment);
    var originFrame = deps.findFrameById(cabinetModel.originFrameId);
    var geometry = model.getGeometry(segment);
    var segmentPorts = deps.parsePortLayout(deps.getAttr(segment, "portsJson"));
    var logicalCabinetId = deps.trim(cabinetModel.logicalCabinetId);
    var segmentObjectId =
      deps.trim(segment != null && segment.id != null ? String(segment.id) : "") ||
      logicalCabinetId;
    var currentFrameId =
      currentFrame != null ? deps.trim(deps.getAttr(currentFrame, "frameId")) : "";

    return {
      id: segmentObjectId,
      kind: "cabinet",
      parentId: currentFrameId || deps.trim(cabinetModel.originFrameId) || null,
      groupId: currentFrame != null ? deps.getFrameGroupId(currentFrame) : null,
      geometry: {
        x: geometry != null ? geometry.x : cabinetModel.cabinetX,
        y:
          geometry != null
            ? geometry.y
            : originFrame != null
              ? Math.round(
                  deps.getFrameConfig(originFrame).height * deps.FRAME_MARGIN_RATIO,
                )
              : 0,
        width: geometry != null ? geometry.width : cabinetModel.cabinetWidth,
        height: geometry != null ? geometry.height : 0,
      },
      props: {
        cabinetModel,
        segmentPorts,
        logicalCabinetId: logicalCabinetId || null,
        originFrameId: deps.trim(cabinetModel.originFrameId) || null,
        currentFrameId: currentFrameId || null,
        segmentCellId:
          deps.trim(segment != null && segment.id != null ? String(segment.id) : "") ||
          null,
      },
    };
  }

  function exportSymbolObject(root, duplicateInstanceIds) {
    var spec = deps.extractSpec(root);
    var geometry = model.getGeometry(root);
    var frame = deps.findDrawingFrame(root);
    var parent = model.getParent(root);

    if (parent == graph.getDefaultParent()) {
      parent = null;
    }

    return {
      id: getSymbolObjectId(root, duplicateInstanceIds),
      kind: "symbol",
      parentId: resolveSnapshotObjectId(parent),
      groupId: frame != null ? deps.getFrameGroupId(frame) : null,
      geometry: {
        x: geometry != null ? geometry.x : 0,
        y: geometry != null ? geometry.y : 0,
        width: geometry != null ? geometry.width : spec.size.width,
        height: geometry != null ? geometry.height : spec.size.height,
      },
      props: {
        spec,
      },
    };
  }

  function exportEdgeObject(edge) {
    var sourceTerminal = model.getTerminal(edge, true);
    var targetTerminal = model.getTerminal(edge, false);
    var sourceRoot = deps.findPortHostRoot(sourceTerminal);
    var targetRoot = deps.findPortHostRoot(targetTerminal);
    var sourcePortRoot =
      sourceRoot != null
        ? sourceRoot
        : shouldExportGenericObject(sourceTerminal)
          ? sourceTerminal
          : null;
    var targetPortRoot =
      targetRoot != null
        ? targetRoot
        : shouldExportGenericObject(targetTerminal)
          ? targetTerminal
          : null;
    var geometry = model.getGeometry(edge);
    var style = model.getStyle(edge) || "";
    var parent = model.getParent(edge);
    var sourcePortId =
      sourcePortRoot != null ? getEdgePortId(edge, sourcePortRoot, true) : null;
    var targetPortId =
      targetPortRoot != null ? getEdgePortId(edge, targetPortRoot, false) : null;

    return {
      id: edge.id || mxObjectIdentity.get(edge),
      source: {
        objectId: resolveSnapshotObjectId(
          sourcePortRoot != null ? sourcePortRoot : sourceTerminal,
        ),
        portId: deps.trim(sourcePortId) || null,
      },
      target: {
        objectId: resolveSnapshotObjectId(
          targetPortRoot != null ? targetPortRoot : targetTerminal,
        ),
        portId: deps.trim(targetPortId) || null,
      },
      props: {
        parentId:
          parent != null && parent != graph.getDefaultParent()
            ? resolveSnapshotObjectId(parent)
            : null,
        style: {
          raw: style,
          sourcePortId: deps.trim(sourcePortId) || null,
          targetPortId: deps.trim(targetPortId) || null,
          sourcePortConstraint: mxUtils.getValue(
            style,
            "sourcePortConstraint",
            "",
          ),
          targetPortConstraint: mxUtils.getValue(
            style,
            "targetPortConstraint",
            "",
          ),
        },
        value: serializeCellValue(edge.value),
        geometry: serializeGeometry(geometry),
      },
    };
  }

  function exportGenericObject(cell) {
    var geometry = model.getGeometry(cell);
    var frame = deps.findDrawingFrame(cell);
    var parent = model.getParent(cell);

    if (parent == graph.getDefaultParent()) {
      parent = null;
    }

    return {
      id: getGenericObjectId(cell),
      kind: "generic",
      parentId: resolveSnapshotObjectId(parent),
      groupId: frame != null ? deps.getFrameGroupId(frame) : null,
      geometry: serializeGeometry(geometry),
      props: {
        style: model.getStyle(cell) || "",
        value: serializeCellValue(cell.value),
        vertex: cell.vertex === true,
        connectable:
          typeof cell.isConnectable === "function"
            ? !!cell.isConnectable()
            : cell.connectable !== false,
        visible: cell.visible !== false,
        collapsed: !!cell.collapsed,
        ports: extractGenericPorts(cell),
      },
    };
  }

  function collectChangeObjectIds(changes) {
    var result = [];
    var i;

    for (i = 0; Array.isArray(changes) && i < changes.length; i++) {
      if (deps.trim(changes[i].objectId).length > 0) {
        result.push(changes[i].objectId);
      }
    }

    return deps.uniqueStrings(result);
  }

  function exportDiagramSnapshot() {
    var frames = deps.getAllDrawingFrames();
    var frameObjects = [];
    var cabinetObjects = [];
    var symbolObjects = [];
    var genericObjects = [];
    var edgeObjects = [];
    var allCells = getAllModelCells();
    var duplicateSymbolInstanceIds = collectDuplicateSymbolInstanceIds(allCells);
    var i;

    currentDuplicateSymbolInstanceIds = duplicateSymbolInstanceIds;

    for (i = 0; i < frames.length; i++) {
      frameObjects.push(exportFrameObject(frames[i]));
    }

    for (i = 0; i < allCells.length; i++) {
      var cell = allCells[i];

      if (deps.isCabinetSegment(cell)) {
        cabinetObjects.push(exportCabinetObject(cell));
      } else if (deps.isElectricalRoot(cell)) {
        symbolObjects.push(
          exportSymbolObject(cell, duplicateSymbolInstanceIds),
        );
      } else if (shouldExportGenericObject(cell)) {
        genericObjects.push(exportGenericObject(cell));
      } else if (model.isEdge(cell)) {
        edgeObjects.push(exportEdgeObject(cell));
      }
    }

    try {
      return {
        diagramId: deps.trim(state.backendDiagramId),
        version: Math.max(0, state.backendDiagramVersion),
        updatedAt: new Date().toISOString(),
        objects: frameObjects
          .concat(cabinetObjects)
          .concat(symbolObjects)
          .concat(genericObjects),
        edges: edgeObjects,
      };
    } finally {
      currentDuplicateSymbolInstanceIds = null;
    }
  }


  function findCabinetSegmentForPort(logicalCabinetId, portId) {
    var segments = deps.findCabinetSegments(logicalCabinetId);
    var i;

    for (i = 0; i < segments.length; i++) {
      if (deps.getPortMetaById(segments[i], portId) != null) {
        return segments[i];
      }
    }

    return null;
  }

  function buildConstraintForPort(root, portId) {
    var port = null;

    if (deps.isElectricalRoot(root) || deps.isCabinetSegment(root)) {
      port = deps.getPortMetaById(root, portId);

      if (port == null) {
        return null;
      }

      return new mxConnectionConstraint(
        new mxPoint(port.x, port.y),
        false,
        port.id,
      );
    }

    var binding = getGenericPortBindingById(root, portId);
    return binding != null ? binding.constraint : null;
  }

  function createGenericCellFromSnapshot(object) {
    var objectId = deps.trim(object != null ? object.id : "");
    var cell = new mxCell(
      deserializeCellValue(object.props != null ? object.props.value : null),
      deserializeGeometry(object.geometry),
      object.props != null ? object.props.style || "" : "",
    );
    cell.setId(normalizeGenericStableId(objectId));
    cell.vertex =
      object.props == null || object.props.vertex == null
        ? true
        : !!object.props.vertex;
    cell.edge = false;
    cell.setConnectable(
      object.props == null || object.props.connectable == null
        ? true
        : !!object.props.connectable,
    );
    cell.visible =
      object.props == null || object.props.visible == null
        ? true
        : !!object.props.visible;
    cell.collapsed =
      object.props != null && object.props.collapsed != null
        ? !!object.props.collapsed
        : false;
    return cell;
  }

  function resolveImportedObjectParent(parentId, frameMap, symbolMap, genericMap) {
    var key = deps.trim(parentId);

    if (key.length == 0) {
      return graph.getDefaultParent();
    }

    return genericMap[key] || frameMap[key] || symbolMap[key] || null;
  }

  function resolveImportedEdgeTerminal(
    terminal,
    symbolMap,
    genericMap,
    cabinetLogicalIdMap,
  ) {
    var objectId = deps.trim(terminal != null ? terminal.objectId : "");
    var portId = deps.trim(terminal != null ? terminal.portId : "");

    if (objectId.length == 0) {
      return null;
    }

    if (genericMap[objectId] != null) {
      return genericMap[objectId];
    }

    if (symbolMap[objectId] != null) {
      return symbolMap[objectId];
    }

    if (portId.length > 0) {
      return findCabinetSegmentForPort(
        cabinetLogicalIdMap != null && cabinetLogicalIdMap[objectId] != null
          ? cabinetLogicalIdMap[objectId]
          : objectId,
        portId,
      );
    }

    return null;
  }

  function restoreDiagramSnapshot(snapshot) {
    snapshot = normalizeSnapshotGenericIds(snapshot);
    var frameObjects = [];
    var cabinetObjects = [];
    var symbolObjects = [];
    var genericObjects = [];
    var i;
    var frameMap = {};
    var symbolMap = {};
    var genericMap = {};

    state.suspendOperationRecording = true;
    deps.exitInstanceComposeMode(false);
    clearPageForImport();

    try {
      if (!deps.isObject(snapshot)) {
        throw new Error("后端返回的图纸数据无效");
      }

      if (
        deps.trim(snapshot.rawGraphXml).length > 0 &&
        (!Array.isArray(snapshot.objects) || snapshot.objects.length == 0) &&
        (!Array.isArray(snapshot.edges) || snapshot.edges.length == 0)
      ) {
        var legacyDoc = mxUtils.parseXml(snapshot.rawGraphXml);
        ui.editor.setGraphXml(legacyDoc.documentElement);
        graph.refresh();
        return;
      }

      if (Array.isArray(snapshot.objects)) {
        for (i = 0; i < snapshot.objects.length; i++) {
          var item = snapshot.objects[i];

          if (item.kind == "frame") {
            frameObjects.push(item);
          } else if (item.kind == "cabinet") {
            cabinetObjects.push(item);
          } else if (item.kind == "symbol") {
            symbolObjects.push(item);
          } else if (item.kind == "generic") {
            genericObjects.push(item);
          }
        }
      }

      state.updatingModel = true;
      model.beginUpdate();

      try {
        for (i = 0; i < frameObjects.length; i++) {
          var frameObject = frameObjects[i];
          var frame = deps.createDrawingFrameCell(
            frameObject.props != null ? frameObject.props.frameConfig : null,
            frameObject.props != null ? frameObject.props.pageNumber : 1,
            {
              frameId: frameObject.id,
              groupId: frameObject.groupId,
              originFrameId:
                frameObject.props != null
                  ? frameObject.props.originFrameId
                  : null,
              autoFrameOwner:
                frameObject.props != null
                  ? frameObject.props.autoFrameOwner
                  : null,
              autoFrameIndex:
                frameObject.props != null
                  ? frameObject.props.autoFrameIndex
                  : null,
            },
          );
          frame.geometry = new mxGeometry(
            frameObject.geometry.x,
            frameObject.geometry.y,
            frameObject.geometry.width,
            frameObject.geometry.height,
          );
          deps.addTopLevelCell(frame);
          frameMap[frameObject.id] = frame;
        }

        for (i = 0; i < cabinetObjects.length; i++) {
          var cabinetObject = cabinetObjects[i];
          var cabinetModel = deps.cloneJson(
            cabinetObject.props != null ? cabinetObject.props.cabinetModel : {},
          );
          cabinetModel.logicalCabinetId =
            deps.trim(
              cabinetObject.props != null
                ? cabinetObject.props.logicalCabinetId
                : null,
            ) || cabinetObject.id;
          cabinetModel.originFrameId =
            deps.trim(
              cabinetObject.props != null
                ? cabinetObject.props.originFrameId
                : null,
            ) || cabinetObject.parentId;
          cabinetModel.cabinetX = cabinetObject.geometry.x;
          cabinetModel.cabinetWidth = cabinetObject.geometry.width;
          deps.relayoutCabinetByModel(cabinetModel);
        }

        if (symbolObjects.length > 0) {
          var pendingSymbolObjects = symbolObjects.slice();
          var symbolSafetyCounter = 0;

          while (pendingSymbolObjects.length > 0 && symbolSafetyCounter < 1000) {
            var nextPendingSymbols = [];
            var symbolProgressed = false;

            for (i = 0; i < pendingSymbolObjects.length; i++) {
              var symbolObject = pendingSymbolObjects[i];
              var symbolParent = resolveImportedObjectParent(
                symbolObject.parentId,
                frameMap,
                symbolMap,
                genericMap,
              );

              if (symbolParent == null) {
                nextPendingSymbols.push(symbolObject);
                continue;
              }

              var spec = deps.normalizeSpec(
                deps.cloneJson(
                  symbolObject.props != null ? symbolObject.props.spec : {},
                ),
              );
              var root = deps.buildSymbolCell(spec);
              root.geometry = new mxGeometry(
                symbolObject.geometry.x,
                symbolObject.geometry.y,
                symbolObject.geometry.width,
                symbolObject.geometry.height,
              );
              model.add(symbolParent, root);
              symbolMap[symbolObject.id] = root;
              symbolProgressed = true;
            }

            if (!symbolProgressed) {
              for (i = 0; i < nextPendingSymbols.length; i++) {
                var fallbackSpec = deps.normalizeSpec(
                  deps.cloneJson(
                    nextPendingSymbols[i].props != null
                      ? nextPendingSymbols[i].props.spec
                      : {},
                  ),
                );
                var fallbackRoot = deps.buildSymbolCell(fallbackSpec);
                fallbackRoot.geometry = new mxGeometry(
                  nextPendingSymbols[i].geometry.x,
                  nextPendingSymbols[i].geometry.y,
                  nextPendingSymbols[i].geometry.width,
                  nextPendingSymbols[i].geometry.height,
                );
                deps.addTopLevelCell(fallbackRoot);
                symbolMap[nextPendingSymbols[i].id] = fallbackRoot;
              }
              break;
            }

            pendingSymbolObjects = nextPendingSymbols;
            symbolSafetyCounter += 1;
          }
        }

        if (genericObjects.length > 0) {
          var pendingGenericObjects = genericObjects.slice();
          var safetyCounter = 0;

          while (pendingGenericObjects.length > 0 && safetyCounter < 1000) {
            var nextPending = [];
            var progressed = false;

            for (i = 0; i < pendingGenericObjects.length; i++) {
              var genericObject = pendingGenericObjects[i];
              var parent = resolveImportedObjectParent(
                genericObject.parentId,
                frameMap,
                symbolMap,
                genericMap,
              );

              if (parent == null) {
                nextPending.push(genericObject);
                continue;
              }

              var genericCell = createGenericCellFromSnapshot(genericObject);
              model.add(parent, genericCell);
              genericMap[genericObject.id] = genericCell;
              progressed = true;
            }

            if (!progressed) {
              for (i = 0; i < nextPending.length; i++) {
                var fallbackCell = createGenericCellFromSnapshot(nextPending[i]);
                deps.addTopLevelCell(fallbackCell);
                genericMap[nextPending[i].id] = fallbackCell;
              }
              break;
            }

            pendingGenericObjects = nextPending;
            safetyCounter += 1;
          }
        }

        if (Array.isArray(snapshot.edges)) {
          var cabinetLogicalIdMap = {};

          for (i = 0; i < cabinetObjects.length; i++) {
            var edgeCabinetObject = cabinetObjects[i];
            var edgeCabinetLogicalId =
              deps.trim(
                edgeCabinetObject.props != null
                  ? edgeCabinetObject.props.logicalCabinetId
                  : null,
              ) || edgeCabinetObject.id;
            cabinetLogicalIdMap[edgeCabinetObject.id] = edgeCabinetLogicalId;
          }

          for (i = 0; i < snapshot.edges.length; i++) {
            var edgeObject = snapshot.edges[i];
            var sourceRoot = resolveImportedEdgeTerminal(
              edgeObject.source,
              symbolMap,
              genericMap,
              cabinetLogicalIdMap,
            );
            var targetRoot = resolveImportedEdgeTerminal(
              edgeObject.target,
              symbolMap,
              genericMap,
              cabinetLogicalIdMap,
            );

            if (
              sourceRoot == null &&
              targetRoot == null &&
              !deps.isObject(
                edgeObject.props != null ? edgeObject.props.geometry : null,
              )
            ) {
              continue;
            }

            var style =
              edgeObject.props != null &&
              edgeObject.props.style != null &&
              deps.trim(edgeObject.props.style.raw).length > 0
                ? edgeObject.props.style.raw
                : "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;";
            var edgeParent = resolveImportedObjectParent(
              edgeObject.props != null ? edgeObject.props.parentId : null,
              frameMap,
              symbolMap,
              genericMap,
            );
            var edge = graph.insertEdge(
              edgeParent != null ? edgeParent : graph.getDefaultParent(),
              edgeObject.id,
              deserializeCellValue(
                edgeObject.props != null ? edgeObject.props.value : null,
              ),
              sourceRoot,
              targetRoot,
              style,
            );
            var sourceConstraint = buildConstraintForPort(
              sourceRoot,
              edgeObject.source.portId,
            );
            var targetConstraint = buildConstraintForPort(
              targetRoot,
              edgeObject.target.portId,
            );

            if (sourceConstraint != null) {
              graph.setConnectionConstraint(
                edge,
                sourceRoot,
                true,
                sourceConstraint,
              );
            }

            if (targetConstraint != null) {
              graph.setConnectionConstraint(
                edge,
                targetRoot,
                false,
                targetConstraint,
              );
            }

            model.setGeometry(
              edge,
              deserializeGeometry(
                edgeObject.props != null ? edgeObject.props.geometry : null,
              ),
            );
          }
        }
      } finally {
        model.endUpdate();
        state.updatingModel = false;
      }

      graph.refresh();
    } finally {
      state.suspendOperationRecording = false;
      deps.resetPendingChangeRecords(exportDiagramSnapshot());
    }
  }

  return {
    collectChangeObjectIds,
    collectGenericPortBindings,
    computeSnapshotChanges,
    deserializeCellValue,
    deserializeGeometry,
    exportDiagramSnapshot,
    getEdgePortId,
    getConstraintForPort: buildConstraintForPort,
    getGenericObjectId,
    getGenericPortBindingById,
    isPluginInternalCell,
    normalizeGenericStableId,
    normalizeSnapshotGenericIds,
    restoreDiagramSnapshot,
    serializeCellValue,
    serializeGeometry,
    shouldExportGenericObject,
  };
}
