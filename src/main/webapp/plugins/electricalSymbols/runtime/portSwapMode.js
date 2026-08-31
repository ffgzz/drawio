/**
 * 更换挂点模式。
 * 负责从当前选中边推导换挂点上下文、渲染端口 overlay 并提交切换。
 */
// 这个模式和配电柜 gap 点击共用部分点击监听，因此集中放在一个 runtime 模块里。
import { getApp } from "../core/appRuntime.js";
import { cloneJson, trim } from "../utils/base.js";
import { getAttr } from "../utils/xml.js";
import { cabinetDomainApi } from "../domain/cabinet.js";
import { cabinetBlockDialogApi } from "../ui/cabinetBlockDialog.js";
import { connectionConstraintsApi } from "./connectionConstraints.js";
import { specDomainApi } from "../domain/spec.js";
import {
  findPortHostRoot,
  isCabinetBlock,
  isCabinetSegment,
  isCabinetSwitchLink,
  setCanvasStatus,
  showStatus,
} from "../core/runtimeHelpers.js";

function getPortSwapDeps() {
  var app = getApp();
  var ctx = app.ctx;

  return {
    ctx,
    trim,
    cloneJson,
    parsePortLayout: specDomainApi.parsePortLayout,
    getAttr,
    findCabinetSegments: cabinetDomainApi.findCabinetSegments,
    getSegmentBlocks: cabinetDomainApi.getSegmentBlocks,
    extractCabinetModel: cabinetDomainApi.extractCabinetModel,
    relayoutCabinetByModel: cabinetDomainApi.relayoutCabinetByModel,
    findPortHostRoot,
    isCabinetBlock,
    isCabinetSegment,
    isCabinetSwitchLink,
    isMovableConnectedTerminal: connectionConstraintsApi.isMovableConnectedTerminal,
    closeCabinetBlockDialog: function () {
      return cabinetBlockDialogApi.closeCabinetBlockDialog();
    },
    showStatus,
    setCanvasStatus,
    getPortAbsolutePosition: cabinetDomainApi.getPortAbsolutePosition,
    getPortMetaByConstraint: connectionConstraintsApi.getPortMetaByConstraint,
    mapPortDirectionToConstraint: connectionConstraintsApi.mapPortDirectionToConstraint,
    clearEdgePoints: connectionConstraintsApi.clearEdgePoints,
    moveConnectedGroupToCabinetPort: connectionConstraintsApi.moveConnectedGroupToCabinetPort,
    setConnectionConstraint: function (edge, root, source, constraint) {
      connectionConstraintsApi.applyNativeConnectionConstraint(
        edge,
        root,
        source,
        constraint,
      );
    },
  };
}

function getPortSwapRuntime() {
  var deps = getPortSwapDeps();
  var ctx = deps.ctx;

  return {
    deps,
    graph: ctx.graph,
    model: ctx.model,
    state: ctx.state,
  };
}

function buildPortSwapContextFromEdge(edge) {
  var runtime = getPortSwapRuntime();
  var deps = runtime.deps;
  var graph = runtime.graph;
  var model = runtime.model;
  var sourceTerminal = model.getTerminal(edge, true);
  var targetTerminal = model.getTerminal(edge, false);
  var sourceRoot = deps.findPortHostRoot(sourceTerminal);
  var targetRoot = deps.findPortHostRoot(targetTerminal);
  var sourceCabinet =
    deps.isCabinetSegment(sourceRoot) || deps.isCabinetBlock(sourceRoot);
  var targetCabinet =
    deps.isCabinetSegment(targetRoot) || deps.isCabinetBlock(targetRoot);

  if (sourceCabinet == targetCabinet) {
    return null;
  }

  return {
    edge,
    source: sourceCabinet,
    cabinetRoot: sourceCabinet ? sourceRoot : targetRoot,
    portId: deps.trim(
      mxUtils.getValue(
        graph.getCellStyle(edge) || {},
        sourceCabinet ? "sourcePortId" : "targetPortId",
        "",
      ),
    ),
    otherTerminal: sourceCabinet ? targetTerminal : sourceTerminal,
  };
}

function getPortSwapContextFromSelection() {
  var runtime = getPortSwapRuntime();
  var deps = runtime.deps;
  var graph = runtime.graph;
  var model = runtime.model;
  var cell = graph.getSelectionCell();
  var i;

  if (model.isEdge(cell)) {
    return buildPortSwapContextFromEdge(cell);
  }

  if (deps.isMovableConnectedTerminal(cell)) {
    var match = null;

    for (i = 0; i < model.getEdgeCount(cell); i++) {
      var edge = model.getEdgeAt(cell, i);
      var context = buildPortSwapContextFromEdge(edge);

      if (
        context != null &&
        context.otherTerminal == cell &&
        context.portId.length > 0
      ) {
        if (match != null) {
          return {
            error:
              "该图元连接了多个配电柜端子，请直接选中第一条边再执行更换挂点",
          };
        }

        match = context;
      }
    }

    return match;
  }

  return null;
}

export function clearPortSwapOverlay() {
  var runtime = getPortSwapRuntime();
  var state = runtime.state;

  if (
    state.portSwapOverlay != null &&
    state.portSwapOverlay.parentNode != null
  ) {
    state.portSwapOverlay.parentNode.removeChild(state.portSwapOverlay);
  }

  state.portSwapOverlay = null;
}

export function exitPortSwapMode(clearStatus) {
  var runtime = getPortSwapRuntime();
  var deps = runtime.deps;
  var state = runtime.state;

  clearPortSwapOverlay();
  state.portSwapSession = null;

  if (clearStatus !== false) {
    deps.setCanvasStatus("");
  }
}

function renderPortSwapOverlay(session) {
  var runtime = getPortSwapRuntime();
  var deps = runtime.deps;
  var graph = runtime.graph;
  var state = runtime.state;
  var container = document.createElement("div");
  var segments = deps.findCabinetSegments(
    deps.trim(deps.getAttr(session.cabinetRoot, "logicalCabinetId")),
  );
  var i;
  var j;

  clearPortSwapOverlay();
  container.style.position = "absolute";
  container.style.left = "0";
  container.style.top = "0";
  container.style.width = "100%";
  container.style.height = "100%";
  container.style.pointerEvents = "none";
  container.style.zIndex = "3";

  for (i = 0; i < segments.length; i++) {
    var hosts = deps.getSegmentBlocks(segments[i]);

    // 兼容块化之前端口直接挂在柜段上的旧图。
    if (hosts.length == 0) {
      hosts = [segments[i]];
    }

    for (j = 0; j < hosts.length; j++) {
      var host = hosts[j];
      var stateView = graph.view.getState(host);
      var ports = deps.parsePortLayout(deps.getAttr(host, "portsJson"));
      var k;

      if (stateView == null) {
        continue;
      }

      for (k = 0; k < ports.length; k++) {
        var marker = document.createElement("div");
        var portId = deps.trim(ports[k].id);
        var selected = portId == deps.trim(session.portId);
        var occupied =
          !selected && isCabinetPortOccupied(host, portId, session.edge);
        marker.style.position = "absolute";
        marker.style.width = "14px";
        marker.style.height = "14px";
        marker.style.borderRadius = "50%";
        marker.style.boxSizing = "border-box";
        marker.style.border = selected
          ? "2px solid #1a73e8"
          : occupied
            ? "2px solid #94a3b8"
            : "2px solid #16a34a";
        marker.style.background = selected
          ? "rgba(26,115,232,0.15)"
          : occupied
            ? "rgba(148,163,184,0.18)"
            : "rgba(22,163,74,0.18)";
        marker.style.pointerEvents = "auto";
        marker.style.cursor = selected || occupied ? "default" : "pointer";
        marker.style.left =
          Math.round(stateView.x + ports[k].x * stateView.width - 7) + "px";
        marker.style.top =
          Math.round(stateView.y + ports[k].y * stateView.height - 7) + "px";
        marker.title = selected
          ? "当前挂点"
          : occupied
            ? "该挂点已连接其他设备，不能再选择"
            : "点击切换到该挂点";

        if (!selected && !occupied) {
          mxEvent.addListener(
            marker,
            "click",
            (function (root, port) {
              return function (evt) {
                mxEvent.consume(evt);
                commitPortSwap(state.portSwapSession, root, port);
              };
            })(host, deps.cloneJson(ports[k])),
          );
        }

        container.appendChild(marker);
      }
    }
  }

  graph.container.appendChild(container);
  state.portSwapOverlay = container;
}

function isCabinetPortOccupied(root, portId, ignoreEdge) {
  var runtime = getPortSwapRuntime();
  var deps = runtime.deps;
  var graph = runtime.graph;
  var model = runtime.model;
  var targetPortId = deps.trim(portId);
  var i;

  if (root == null || targetPortId.length == 0) {
    return false;
  }

  for (i = 0; i < model.getEdgeCount(root); i++) {
    var edge = model.getEdgeAt(root, i);
    var sourceRoot = deps.findPortHostRoot(model.getTerminal(edge, true));
    var targetRoot = deps.findPortHostRoot(model.getTerminal(edge, false));
    var sourcePortId =
      sourceRoot == root
        ? deps.trim(
            mxUtils.getValue(graph.getCellStyle(edge) || {}, "sourcePortId", ""),
          )
        : "";
    var targetPortIdOnEdge =
      targetRoot == root
        ? deps.trim(
            mxUtils.getValue(graph.getCellStyle(edge) || {}, "targetPortId", ""),
          )
        : "";

    if (edge == ignoreEdge) {
      continue;
    }

    if (sourcePortId == targetPortId || targetPortIdOnEdge == targetPortId) {
      return true;
    }
  }

  return false;
}

export function installGraphClickBehavior() {
  var runtime = getPortSwapRuntime();
  var deps = runtime.deps;
  var graph = runtime.graph;
  var state = runtime.state;

  graph.addListener(mxEvent.CLICK, function (sender, evt) {
    var cell = evt.getProperty("cell");
    var mouseEvent = evt.getProperty("event");

    if (state.portSwapSession != null) {
      var portRoot = deps.findPortHostRoot(cell);
      var sessionLogicalId =
        state.portSwapSession.cabinetRoot != null
          ? deps.trim(
              deps.getAttr(state.portSwapSession.cabinetRoot, "logicalCabinetId"),
            )
          : "";

      if (
        (deps.isCabinetSegment(portRoot) || deps.isCabinetBlock(portRoot)) &&
        deps.trim(deps.getAttr(portRoot, "logicalCabinetId")) == sessionLogicalId
      ) {
        var nextPort = getNearestCabinetPortFromClick(portRoot, mouseEvent);

        if (nextPort != null) {
          commitPortSwap(state.portSwapSession, portRoot, nextPort);
          evt.consume();
          return;
        }
      }

      if (cell == null) {
        exitPortSwapMode();
        evt.consume();
        return;
      }
    }

  });
}

export function getNearestCabinetPortFromClick(root, mouseEvent) {
  var runtime = getPortSwapRuntime();
  var deps = runtime.deps;
  var graph = runtime.graph;
  var state = runtime.state;
  var ports = deps.parsePortLayout(deps.getAttr(root, "portsJson"));
  var graphX =
    mouseEvent != null && typeof mouseEvent.getGraphX === "function"
      ? mouseEvent.getGraphX()
      : null;
  var graphY =
    mouseEvent != null && typeof mouseEvent.getGraphY === "function"
      ? mouseEvent.getGraphY()
      : null;
  var threshold = 18 / graph.view.scale;
  var best = null;
  var bestDistance = Infinity;
  var i;

  if (graphX == null || graphY == null) {
    return null;
  }

  for (i = 0; i < ports.length; i++) {
    if (
      deps.trim(ports[i].id) != deps.trim(state.portSwapSession.portId) &&
      isCabinetPortOccupied(root, ports[i].id, state.portSwapSession.edge)
    ) {
      continue;
    }

    var position = deps.getPortAbsolutePosition(root, ports[i]);
    var dx = position.x - graphX;
    var dy = position.y - graphY;
    var distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= threshold && distance < bestDistance) {
      best = ports[i];
      bestDistance = distance;
    }
  }

  return best;
}

export function applyEdgePortConstraintMetadata(edge, root, source, constraint) {
  var runtime = getPortSwapRuntime();
  var deps = runtime.deps;
  var model = runtime.model;
  var port = deps.getPortMetaByConstraint(root, constraint);
  var direction =
    port != null ? deps.mapPortDirectionToConstraint(port.direction) : "";
  var key = source ? "sourcePortConstraint" : "targetPortConstraint";
  var portKey = source ? "sourcePortId" : "targetPortId";
  var style = model.getStyle(edge) || "";

  style = mxUtils.setStyle(
    style,
    key,
    direction.length > 0 ? direction : null,
  );
  style = mxUtils.setStyle(
    style,
    portKey,
    port != null && deps.trim(port.id).length > 0 ? deps.trim(port.id) : null,
  );
  model.setStyle(edge, style);
}

function buildReboundCabinetModel(edge, oldRoot, newRoot, oldPortId, newPortId) {
  var runtime = getPortSwapRuntime();
  var deps = runtime.deps;

  if (
    !deps.isCabinetSwitchLink(edge) ||
    !(deps.isCabinetBlock(oldRoot) || deps.isCabinetSegment(oldRoot)) ||
    !(deps.isCabinetBlock(newRoot) || deps.isCabinetSegment(newRoot))
  ) {
    return null;
  }

  var oldLogicalId = deps.trim(deps.getAttr(oldRoot, "logicalCabinetId"));
  var newLogicalId = deps.trim(deps.getAttr(newRoot, "logicalCabinetId"));

  if (oldLogicalId.length == 0 || oldLogicalId != newLogicalId) {
    return { error: "只能在同一个配电柜内更换开关挂点" };
  }

  var cabinetModel = deps.extractCabinetModel(oldRoot);
  var oldBlockId = deps.trim(deps.getAttr(oldRoot, "blockId"));
  var newBlockId = deps.trim(deps.getAttr(newRoot, "blockId"));
  var oldBlock = null;
  var newBlock = null;
  var i;

  for (i = 0; i < cabinetModel.blocks.length; i++) {
    if (
      deps.trim(cabinetModel.blocks[i].id) == oldBlockId ||
      deps.trim(cabinetModel.blocks[i].portId) == deps.trim(oldPortId)
    ) {
      oldBlock = cabinetModel.blocks[i];
    }
    if (
      deps.trim(cabinetModel.blocks[i].id) == newBlockId ||
      deps.trim(cabinetModel.blocks[i].portId) == deps.trim(newPortId)
    ) {
      newBlock = cabinetModel.blocks[i];
    }
  }

  if (oldBlock == null || newBlock == null) {
    return { error: "目标挂点不属于当前配电柜模型" };
  }
  if (deps.trim(oldBlock.switchInstanceId).length == 0) {
    return { error: "当前柜块没有绑定可移动的开关" };
  }
  if (deps.trim(newBlock.switchInstanceId).length > 0) {
    return { error: "目标挂点已经绑定其他开关" };
  }

  newBlock.switchInstanceId = deps.trim(oldBlock.switchInstanceId);
  newBlock.switchSymbolId = deps.trim(oldBlock.switchSymbolId);
  oldBlock.switchInstanceId = "";
  oldBlock.switchSymbolId = "";

  return { cabinetModel };
}

export function commitPortSwap(session, newRoot, newPort) {
  var runtime = getPortSwapRuntime();
  var deps = runtime.deps;
  var model = runtime.model;
  var state = runtime.state;
  var edge = session.edge;
  var source = !!session.source;
  var oldRoot = session.cabinetRoot;
  var oldPortId = deps.trim(session.portId);
  var rebound = buildReboundCabinetModel(
    edge,
    oldRoot,
    newRoot,
    oldPortId,
    newPort != null ? newPort.id : "",
  );
  var constraint = new mxConnectionConstraint(
    new mxPoint(newPort.x, newPort.y),
    false,
    newPort.id,
  );

  if (
    edge == null ||
    newRoot == null ||
    newPort == null ||
    oldPortId.length == 0 ||
    (oldRoot == newRoot && oldPortId == deps.trim(newPort.id))
  ) {
    exitPortSwapMode();
    return;
  }

  if (isCabinetPortOccupied(newRoot, newPort.id, edge)) {
    deps.showStatus("目标挂点已连接其他设备，不能重复选择", true);
    deps.setCanvasStatus("目标挂点已连接其他设备，不能重复选择");
    return;
  }

  if (rebound != null && rebound.error != null) {
    deps.showStatus(rebound.error, true);
    deps.setCanvasStatus(rebound.error);
    return;
  }

  state.updatingModel = true;
  model.beginUpdate();

  try {
    model.setTerminal(edge, newRoot, source);
    deps.setConnectionConstraint(edge, newRoot, source, constraint);
    applyEdgePortConstraintMetadata(edge, newRoot, source, constraint);
    deps.clearEdgePoints(edge);
  } finally {
    model.endUpdate();
    state.updatingModel = false;
  }

  deps.moveConnectedGroupToCabinetPort(
    edge,
    source,
    oldRoot,
    oldPortId,
    newRoot,
    newPort,
  );
  if (rebound != null && rebound.cabinetModel != null) {
    deps.relayoutCabinetByModel(rebound.cabinetModel);
  }
  exitPortSwapMode();
  deps.showStatus("已更换挂点", false);
  deps.setCanvasStatus("已更换挂点");
}

export function enterPortSwapMode() {
  var runtime = getPortSwapRuntime();
  var deps = runtime.deps;
  var state = runtime.state;

  if (state.portSwapSession != null) {
    exitPortSwapMode();
    return;
  }

  deps.closeCabinetBlockDialog();

  var context = getPortSwapContextFromSelection();

  if (context == null) {
    deps.showStatus("请先选中与配电柜直接相连的第一条边或第一个图元", true);
    deps.setCanvasStatus("请先选中与配电柜直接相连的第一条边或第一个图元");
    return;
  }

  if (context.error != null) {
    deps.showStatus(context.error, true);
    deps.setCanvasStatus(context.error);
    return;
  }

  if (context.portId.length == 0 || context.cabinetRoot == null) {
    deps.showStatus("当前选中对象未绑定到有效的配电柜端子", true);
    deps.setCanvasStatus("当前选中对象未绑定到有效的配电柜端子");
    return;
  }

  state.portSwapSession = context;
  renderPortSwapOverlay(context);
  deps.setCanvasStatus("更换挂点模式：点击同一配电柜上的目标连接点，或点空白取消");
}

export var portSwapModeApi = {
  applyEdgePortConstraintMetadata,
  clearPortSwapOverlay,
  commitPortSwap,
  enterPortSwapMode,
  exitPortSwapMode,
  getNearestCabinetPortFromClick,
  installGraphClickBehavior,
};
