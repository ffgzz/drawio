/**
 * 连接约束运行时。
 * 负责端口约束生成、连线校验、端口元数据写回和端子切换后的跟随移动。
 */
// 这个模块是电气端口系统和 mxGraph 原生连线约束的衔接层。
import { getApp } from "../core/appRuntime.js";
import { clamp, trim } from "../utils/base.js";
import { getAttr } from "../utils/xml.js";
import { cabinetDomainApi } from "../domain/cabinet.js";
import { frameDomainApi } from "../domain/frame.js";
import { specDomainApi } from "../domain/spec.js";
import {
  findPortHostRoot,
  isCabinetBlock,
  isCabinetGap,
  isCabinetSegment,
  isDrawingFrame,
} from "../core/runtimeHelpers.js";

function getConstraintDeps() {
  var app = getApp();
  var ctx = app.ctx;

  return {
    ctx,
    trim,
    clamp,
    parsePortLayout: specDomainApi.parsePortLayout,
    getAttr,
    findPortHostRoot,
    normalizePortDirection: specDomainApi.normalizePortDirection,
    normalizePortIoMode: specDomainApi.normalizePortIoMode,
    isDrawingFrame,
    isCabinetSegment,
    isCabinetBlock,
    isCabinetGap,
    findDrawingFrame: frameDomainApi.findDrawingFrame,
    getCellAbsoluteGeometry: function (cell) {
      return cabinetDomainApi.getCellAbsoluteGeometry(cell);
    },
    getPortAbsolutePosition: function (root, port) {
      return cabinetDomainApi.getPortAbsolutePosition(root, port);
    },
  };
}

function getConstraintRuntime() {
  var deps = getConstraintDeps();
  var ctx = deps.ctx;
  var graph = ctx.graph;

  return {
    deps,
    graph,
    model: ctx.model,
    state: ctx.state,
    oldGetAllConnectionConstraints: graph.getAllConnectionConstraints,
    oldSetConnectionConstraint: graph.setConnectionConstraint,
    oldValidateConnection: graph.connectionHandler.validateConnection,
  };
}

/**
 * 普通图元的端口必须落在 0..1 内，但柜体回路端口可以被用户
 * 拖出原柜块范围（块不重排，回路可重叠）。先用公共规则归一化
 * id/方向/标记，再仅对 cabinetBlock 恢复原始 y。
 */
export function getPortLayoutForRoot(root) {
  var deps = getConstraintRuntime().deps;
  var raw = deps.getAttr(root, "portsJson");
  var ports = deps.parsePortLayout(raw);

  if (!deps.isCabinetBlock(root) || raw == null || raw.length == 0) {
    return ports;
  }

  try {
    var source = JSON.parse(raw);
    var items = Array.isArray(source)
      ? source
      : source != null && Array.isArray(source.items)
        ? source.items
        : [];
    var i;

    for (i = 0; i < ports.length && i < items.length; i++) {
      var rawY = Number(items[i] != null ? items[i].y : NaN);

      if (isFinite(rawY)) {
        ports[i].y = rawY;
      }
    }
  } catch (e) {
    // 旧数据不合法时保留通用解析结果。
  }

  return ports;
}

// 从端口布局生成 mxGraph 可识别的连接约束数组。
export function getElectricalConstraints(cell) {
  var runtime = getConstraintRuntime();
  var deps = runtime.deps;
  var root = deps.findPortHostRoot(cell);
  var layout;
  var constraints = [];
  var i;

  if (root == null) {
    return null;
  }

  layout = getPortLayoutForRoot(root);

  if (layout.length == 0) {
    layout = deps.parsePortLayout(deps.getAttr(root, "portLayout"));
  }

  for (i = 0; i < layout.length; i++) {
    var point = layout[i];
    constraints.push(
      new mxConnectionConstraint(
        new mxPoint(point.x, point.y),
        false,
        point.id || "port:" + i,
      ),
    );
  }

  return constraints;
}

export function getPortMetaByConstraint(root, constraint) {
  var deps = getConstraintRuntime().deps;
  var ports = getPortLayoutForRoot(root);
  var name = constraint != null ? deps.trim(constraint.name) : "";
  var i;

  for (i = 0; i < ports.length; i++) {
    if (deps.trim(ports[i].id) == name) {
      return ports[i];
    }
  }

  return null;
}

export function getPortMetaById(root, portId) {
  var deps = getConstraintRuntime().deps;
  var ports = getPortLayoutForRoot(root);
  var target = deps.trim(portId);
  var i;

  for (i = 0; i < ports.length; i++) {
    if (deps.trim(ports[i].id) == target) {
      return ports[i];
    }
  }

  return null;
}

export function mapPortDirectionToConstraint(direction) {
  var normalizePortDirection = getConstraintRuntime().deps.normalizePortDirection;

  switch (normalizePortDirection(direction)) {
    case "left":
      return "west";
    case "right":
      return "east";
    case "up":
      return "north";
    case "down":
      return "south";
    default:
      return "";
  }
}

// 端口 IO 方向校验直接作用在连线开始/结束阶段。
function validatePortIoMode(sourcePort, targetPort) {
  var normalizePortIoMode = getConstraintRuntime().deps.normalizePortIoMode;

  if (sourcePort != null && normalizePortIoMode(sourcePort.ioMode) == "in") {
    return "该端子仅允许接入，不能作为连线起点";
  }

  if (targetPort != null && normalizePortIoMode(targetPort.ioMode) == "out") {
    return "该端子仅允许接出，不能作为连线终点";
  }

  return null;
}

export function applyNativeConnectionConstraint(edge, terminal, source, constraint) {
  var runtime = getConstraintRuntime();

  runtime.oldSetConnectionConstraint.call(
    runtime.graph,
    edge,
    terminal,
    source,
    constraint,
  );
}

export function isMovableConnectedTerminal(cell) {
  var runtime = getConstraintRuntime();
  var deps = runtime.deps;
  var model = runtime.model;

  return (
    cell != null &&
    model.isVertex(cell) &&
    !deps.isDrawingFrame(cell) &&
    !deps.isCabinetSegment(cell) &&
    !deps.isCabinetBlock(cell) &&
    !deps.isCabinetGap(cell)
  );
}

function clampCellGeometryToFrame(geometry, frame) {
  var runtime = getConstraintRuntime();
  var deps = runtime.deps;
  var model = runtime.model;
  var frameGeometry = model.getGeometry(frame);
  var nextGeometry = geometry.clone();
  var padding = 12;
  var minX = padding;
  var minY = padding;
  var maxX = Math.max(minX, frameGeometry.width - geometry.width - padding);
  var maxY = Math.max(minY, frameGeometry.height - geometry.height - padding);

  nextGeometry.x = deps.clamp(nextGeometry.x, minX, maxX);
  nextGeometry.y = deps.clamp(nextGeometry.y, minY, maxY);

  return nextGeometry;
}

export function moveCellToFrameByDelta(cell, targetFrame, deltaX, deltaY) {
  var runtime = getConstraintRuntime();
  var deps = runtime.deps;
  var model = runtime.model;

  if (!isMovableConnectedTerminal(cell) || targetFrame == null) {
    return;
  }

  var geometry = model.getGeometry(cell);

  if (geometry == null) {
    return;
  }

  var currentFrame = deps.findDrawingFrame(cell);
  var absolute = deps.getCellAbsoluteGeometry(cell);
  var targetFrameGeometry = model.getGeometry(targetFrame);
  var nextGeometry = geometry.clone();
  var nextAbsoluteX = absolute.x + deltaX;
  var nextAbsoluteY = absolute.y + deltaY;

  if (currentFrame != targetFrame) {
    model.add(targetFrame, cell);
  }

  nextGeometry.x = nextAbsoluteX - targetFrameGeometry.x;
  nextGeometry.y = nextAbsoluteY - targetFrameGeometry.y;
  nextGeometry = clampCellGeometryToFrame(nextGeometry, targetFrame);
  model.setGeometry(cell, nextGeometry);
}

function collectConnectedMovableGroup(startCell) {
  var model = getConstraintRuntime().model;
  var queue = [];
  var vertexMap = {};
  var edgeMap = {};
  var vertices = [];
  var edges = [];
  var i;

  if (!isMovableConnectedTerminal(startCell)) {
    return {
      vertices,
      edges,
    };
  }

  queue.push(startCell);

  while (queue.length > 0) {
    var cell = queue.shift();
    var cellId = mxObjectIdentity.get(cell);

    if (vertexMap[cellId]) {
      continue;
    }

    vertexMap[cellId] = true;
    vertices.push(cell);

    for (i = 0; i < model.getEdgeCount(cell); i++) {
      var edge = model.getEdgeAt(cell, i);
      var edgeId = mxObjectIdentity.get(edge);
      var source = model.getTerminal(edge, true);
      var target = model.getTerminal(edge, false);

      // 柜块重排只应沿“开关输出 → 电缆 → 负载”向下游搬移。
      // 如果按无向连通分量遍历，双路供电负载会把另一条输入
      // 的电缆和已绑定开关也一起拖走，导致另一个柜块脱钩。
      if (source != cell) {
        continue;
      }

      var other = target;

      if (!edgeMap[edgeId]) {
        edgeMap[edgeId] = true;
        edges.push(edge);
      }

      if (isMovableConnectedTerminal(other)) {
        queue.push(other);
      }
    }
  }

  return {
    vertices,
    edges,
  };
}

function getCellsAbsoluteBounds(cells) {
  var getCellAbsoluteGeometry = getConstraintRuntime().deps.getCellAbsoluteGeometry;
  var bounds = null;
  var i;

  for (i = 0; i < cells.length; i++) {
    var geometry = getCellAbsoluteGeometry(cells[i]);

    if (bounds == null) {
      bounds = {
        x: geometry.x,
        y: geometry.y,
        width: geometry.width,
        height: geometry.height,
      };
    } else {
      var minX = Math.min(bounds.x, geometry.x);
      var minY = Math.min(bounds.y, geometry.y);
      var maxX = Math.max(
        bounds.x + bounds.width,
        geometry.x + geometry.width,
      );
      var maxY = Math.max(
        bounds.y + bounds.height,
        geometry.y + geometry.height,
      );

      bounds.x = minX;
      bounds.y = minY;
      bounds.width = maxX - minX;
      bounds.height = maxY - minY;
    }
  }

  return bounds;
}

function adjustGroupDeltaToFrame(vertices, targetFrame, deltaX, deltaY) {
  var model = getConstraintRuntime().model;
  var bounds = getCellsAbsoluteBounds(vertices);
  var frameGeometry = model.getGeometry(targetFrame);
  var padding = 12;

  if (bounds == null || frameGeometry == null) {
    return {
      x: deltaX,
      y: deltaY,
    };
  }

  var nextX = bounds.x + deltaX;
  var nextY = bounds.y + deltaY;
  var minX = frameGeometry.x + padding;
  var minY = frameGeometry.y + padding;
  var maxX = frameGeometry.x + frameGeometry.width - padding;
  var maxY = frameGeometry.y + frameGeometry.height - padding;

  if (nextX < minX) {
    deltaX += minX - nextX;
    nextX = minX;
  }

  if (nextY < minY) {
    deltaY += minY - nextY;
    nextY = minY;
  }

  if (nextX + bounds.width > maxX) {
    deltaX -= nextX + bounds.width - maxX;
  }

  if (nextY + bounds.height > maxY) {
    deltaY -= nextY + bounds.height - maxY;
  }

  return {
    x: deltaX,
    y: deltaY,
  };
}

function shiftEdgePointsByDelta(edge, deltaX, deltaY) {
  var model = getConstraintRuntime().model;
  var geometry = model.getGeometry(edge);
  var points;
  var i;

  if (
    geometry == null ||
    geometry.points == null ||
    geometry.points.length == 0
  ) {
    return;
  }

  geometry = geometry.clone();
  points = [];

  for (i = 0; i < geometry.points.length; i++) {
    points.push(
      new mxPoint(
        geometry.points[i].x + deltaX,
        geometry.points[i].y + deltaY,
      ),
    );
  }

  geometry.points = points;
  model.setGeometry(edge, geometry);
}

export function clearEdgePoints(edge) {
  var model = getConstraintRuntime().model;
  var geometry = model.getGeometry(edge);

  if (
    geometry != null &&
    geometry.points != null &&
    geometry.points.length > 0
  ) {
    geometry = geometry.clone();
    geometry.points = null;
    model.setGeometry(edge, geometry);
  }
}

/**
 * 把一个已连接的电气图元组整体平移到目标图框。
 *
 * 配电柜重排时不能只搬母线后的第一个开关，否则开关后面的
 * 电缆和负载会留在旧位置，连线就会被拉斜或跨页。这里复用端口
 * 更换的整组遍历规则，但直接使用已计算好的位移量。
 *
 * @returns {Object|null} 实际搬移的 vertices / edges / delta；无需搬移时返回 null。
 */
export function moveConnectedGroupByDelta(
  startCell,
  targetFrame,
  deltaX,
  deltaY,
  options,
) {
  var runtime = getConstraintRuntime();
  var model = runtime.model;
  var state = runtime.state;
  var group;
  var delta;
  var movedMap = {};
  var i;

  if (
    state.updatingModel ||
    !isMovableConnectedTerminal(startCell) ||
    targetFrame == null
  ) {
    return null;
  }

  group = collectConnectedMovableGroup(startCell);

  if (group.vertices.length == 0) {
    return null;
  }

  delta = adjustGroupDeltaToFrame(
    group.vertices,
    targetFrame,
    deltaX,
    deltaY,
  );

  // 柜体端口拖动是严格的纵向交互。即使某个历史图元已经
  // 越出图框水平边界，也不能让边界校正暗中产生横向位移。
  if (options != null && options.lockX === true) {
    delta.x = 0;
  }

  if (Math.abs(delta.x) < 0.0001 && Math.abs(delta.y) < 0.0001) {
    return {
      vertices: group.vertices,
      edges: group.edges,
      delta,
    };
  }

  state.updatingModel = true;
  model.beginUpdate();

  try {
    for (i = 0; i < group.vertices.length; i++) {
      var vertex = group.vertices[i];
      var key = mxObjectIdentity.get(vertex);

      if (!movedMap[key]) {
        movedMap[key] = true;
        moveCellToFrameByDelta(vertex, targetFrame, delta.x, delta.y);
      }
    }

    for (i = 0; i < group.edges.length; i++) {
      var groupEdge = group.edges[i];
      var sourceTerminal = model.getTerminal(groupEdge, true);
      var targetTerminal = model.getTerminal(groupEdge, false);
      var sourceMoved =
        movedMap[mxObjectIdentity.get(sourceTerminal)] === true;
      var targetMoved =
        movedMap[mxObjectIdentity.get(targetTerminal)] === true;

      if (sourceMoved && targetMoved) {
        shiftEdgePointsByDelta(groupEdge, delta.x, delta.y);
      } else {
        clearEdgePoints(groupEdge);
      }
    }
  } finally {
    model.endUpdate();
    state.updatingModel = false;
  }

  return {
    vertices: group.vertices,
    edges: group.edges,
    delta,
  };
}

export function moveConnectedGroupToCabinetPort(
  edge,
  source,
  oldRoot,
  oldPortId,
  newRoot,
  newPort,
) {
  var runtime = getConstraintRuntime();
  var deps = runtime.deps;
  var model = runtime.model;
  var state = runtime.state;
  var otherTerminal = model.getTerminal(edge, !source);
  var oldPort = getPortMetaById(oldRoot, oldPortId);
  var targetFrame = deps.findDrawingFrame(newRoot);

  if (
    state.updatingModel ||
    !(deps.isCabinetSegment(oldRoot) || deps.isCabinetBlock(oldRoot)) ||
    !(deps.isCabinetSegment(newRoot) || deps.isCabinetBlock(newRoot)) ||
    oldPort == null ||
    newPort == null ||
    !isMovableConnectedTerminal(otherTerminal) ||
    targetFrame == null
  ) {
    return;
  }

  return moveConnectedGroupByDelta(
    otherTerminal,
    targetFrame,
    deps.getPortAbsolutePosition(newRoot, newPort).x -
      deps.getPortAbsolutePosition(oldRoot, oldPort).x,
    deps.getPortAbsolutePosition(newRoot, newPort).y -
      deps.getPortAbsolutePosition(oldRoot, oldPort).y,
  );
}

export function installGraphBehavior(extraDeps) {
  var runtime = getConstraintRuntime();
  var deps = runtime.deps;
  var graph = runtime.graph;
  var model = runtime.model;

  graph.getAllConnectionConstraints = function (terminal, source) {
    var root = deps.findPortHostRoot(terminal != null ? terminal.cell : null);

    if (root != null) {
      return getElectricalConstraints(root);
    }

    return runtime.oldGetAllConnectionConstraints.apply(this, arguments);
  };

  graph.setConnectionConstraint = function (edge, terminal, source, constraint) {
    if (edge == null) {
      runtime.oldSetConnectionConstraint.apply(this, arguments);
      return;
    }

    var previousStyle = model.getStyle(edge) || "";
    var previousPortId = deps.trim(
      mxUtils.getValue(
        previousStyle,
        source ? "sourcePortId" : "targetPortId",
        "",
      ),
    );
    var previousRoot = deps.findPortHostRoot(model.getTerminal(edge, source));
    runtime.oldSetConnectionConstraint.apply(this, arguments);

    var root = deps.findPortHostRoot(terminal);

    if (root == null || edge == null) {
      return;
    }

    var port = getPortMetaByConstraint(root, constraint);
    extraDeps.applyEdgePortConstraintMetadata(edge, root, source, constraint);

    if (
      previousRoot != null &&
      root != null &&
      previousPortId.length > 0 &&
      port != null &&
      deps.trim(port.id).length > 0 &&
      (previousRoot != root || previousPortId != deps.trim(port.id))
    ) {
      moveConnectedGroupToCabinetPort(
        edge,
        source,
        previousRoot,
        previousPortId,
        root,
        port,
      );
    }
  };

  graph.connectionHandler.validateConnection = function (source, target) {
    var error = runtime.oldValidateConnection.apply(this, arguments);
    var sourceRoot;
    var targetRoot;
    var sourcePort;
    var targetPort;

    if (error != null) {
      extraDeps.setCanvasStatus(error);
      return error;
    }

    sourceRoot = deps.findPortHostRoot(source);
    targetRoot = deps.findPortHostRoot(target);

    // 块的出线端口只留给托管连线用：开关由绑定入口产生，用户不能手工往上拉线，
    // 下游要连的是开关的出线端子，不是柜体的端口。
    if (isCabinetBlock(sourceRoot) || isCabinetBlock(targetRoot)) {
      error = "请连接开关的出线端子，配电柜块的端口由绑定的开关占用";
      extraDeps.setCanvasStatus(error);
      return error;
    }

    if (sourceRoot == null && targetRoot == null) {
      return null;
    }

    sourcePort = getPortMetaByConstraint(sourceRoot, this.sourceConstraint);
    targetPort = getPortMetaByConstraint(
      targetRoot,
      this.constraintHandler != null
        ? this.constraintHandler.currentConstraint
        : null,
    );
    error = validatePortIoMode(sourcePort, targetPort);
    extraDeps.setCanvasStatus(error);
    return error;
  };

  graph.connectionHandler.addListener(mxEvent.RESET, function () {
    extraDeps.setCanvasStatus("");
  });

  graph.connectionHandler.addListener(mxEvent.CONNECT, function () {
    extraDeps.setCanvasStatus("");
  });
}

export var connectionConstraintsApi = {
  applyNativeConnectionConstraint,
  clearEdgePoints,
  getElectricalConstraints,
  getPortMetaByConstraint,
  getPortMetaById,
  getPortLayoutForRoot,
  isMovableConnectedTerminal,
  installGraphBehavior,
  mapPortDirectionToConstraint,
  moveCellToFrameByDelta,
  moveConnectedGroupByDelta,
  moveConnectedGroupToCabinetPort,
};
