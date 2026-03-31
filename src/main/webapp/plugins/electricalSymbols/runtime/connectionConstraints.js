/**
 * 连接约束运行时。
 * 负责端口约束生成、连线校验、端口元数据写回和端子切换后的跟随移动。
 */
// 这个模块是电气端口系统和 mxGraph 原生连线约束的衔接层。
import { getApp } from "../core/appRuntime.js";

function buildConstraintDeps() {
  var app = getApp();
  var ctx = app.ctx;

  return {
    ctx,
    trim: app.utils.trim,
    clamp: app.utils.clamp,
    parsePortLayout: app.domains.spec.parsePortLayout,
    getAttr: app.utils.getAttr,
    buildPortLayout: app.domains.spec.buildPortLayout,
    findPortHostRoot: app.helpers.findPortHostRoot,
    normalizePortDirection: app.domains.spec.normalizePortDirection,
    normalizePortIoMode: app.domains.spec.normalizePortIoMode,
    isDrawingFrame: app.helpers.isDrawingFrame,
    isCabinetSegment: app.helpers.isCabinetSegment,
    isCabinetGap: app.helpers.isCabinetGap,
    findDrawingFrame: app.domains.frame.findDrawingFrame,
    getCellAbsoluteGeometry: function (cell) {
      return app.domains.cabinet.getCellAbsoluteGeometry(cell);
    },
    getPortAbsolutePosition: function (root, port) {
      return app.domains.cabinet.getPortAbsolutePosition(root, port);
    },
  };
}

export function createConnectionConstraints() {
  var deps = arguments.length > 0 ? arguments[0] : buildConstraintDeps();
  var ctx = deps.ctx;
  var graph = ctx.graph;
  var model = ctx.model;
  var state = ctx.state;
  var oldGetAllConnectionConstraints = graph.getAllConnectionConstraints;
  var oldSetConnectionConstraint = graph.setConnectionConstraint;
  var oldValidateConnection = graph.connectionHandler.validateConnection;

  // 从端口布局生成 mxGraph 可识别的连接约束数组。
  function getElectricalConstraints(cell) {
    var root = deps.findPortHostRoot(cell);
    var layout;
    var constraints = [];
    var i;

    if (root == null) {
      return null;
    }

    layout = deps.buildPortLayout(
      { ports: deps.parsePortLayout(deps.getAttr(root, "portsJson")) },
      deps.parsePortLayout(deps.getAttr(root, "portLayout")),
    );

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

  function getPortMetaByConstraint(root, constraint) {
    var ports = deps.parsePortLayout(deps.getAttr(root, "portsJson"));
    var name = constraint != null ? deps.trim(constraint.name) : "";
    var i;

    for (i = 0; i < ports.length; i++) {
      if (deps.trim(ports[i].id) == name) {
        return ports[i];
      }
    }

    return null;
  }

  function getPortMetaById(root, portId) {
    var ports = deps.parsePortLayout(deps.getAttr(root, "portsJson"));
    var target = deps.trim(portId);
    var i;

    for (i = 0; i < ports.length; i++) {
      if (deps.trim(ports[i].id) == target) {
        return ports[i];
      }
    }

    return null;
  }

  function mapPortDirectionToConstraint(direction) {
    switch (deps.normalizePortDirection(direction)) {
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
    if (sourcePort != null && deps.normalizePortIoMode(sourcePort.ioMode) == "in") {
      return "该端子仅允许接入，不能作为连线起点";
    }

    if (targetPort != null && deps.normalizePortIoMode(targetPort.ioMode) == "out") {
      return "该端子仅允许接出，不能作为连线终点";
    }

    return null;
  }

  function applyNativeConnectionConstraint(edge, terminal, source, constraint) {
    oldSetConnectionConstraint.call(graph, edge, terminal, source, constraint);
  }

  function isMovableConnectedTerminal(cell) {
    return (
      cell != null &&
      model.isVertex(cell) &&
      !deps.isDrawingFrame(cell) &&
      !deps.isCabinetSegment(cell) &&
      !deps.isCabinetGap(cell)
    );
  }

  function clampCellGeometryToFrame(geometry, frame) {
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

  function moveCellToFrameByDelta(cell, targetFrame, deltaX, deltaY) {
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
        var other = source == cell ? target : source;

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
    var bounds = null;
    var i;

    for (i = 0; i < cells.length; i++) {
      var geometry = deps.getCellAbsoluteGeometry(cells[i]);

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

  function clearEdgePoints(edge) {
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

  function moveConnectedGroupToCabinetPort(
    edge,
    source,
    oldRoot,
    oldPortId,
    newRoot,
    newPort,
  ) {
    var otherTerminal = model.getTerminal(edge, !source);
    var oldPort = getPortMetaById(oldRoot, oldPortId);
    var targetFrame = deps.findDrawingFrame(newRoot);
    var group;
    var delta;
    var movedMap = {};
    var i;

    if (
      state.updatingModel ||
      !deps.isCabinetSegment(oldRoot) ||
      !deps.isCabinetSegment(newRoot) ||
      oldPort == null ||
      newPort == null ||
      !isMovableConnectedTerminal(otherTerminal) ||
      targetFrame == null
    ) {
      return;
    }

    group = collectConnectedMovableGroup(otherTerminal);

    if (group.vertices.length == 0) {
      return;
    }

    delta = adjustGroupDeltaToFrame(
      group.vertices,
      targetFrame,
      deps.getPortAbsolutePosition(newRoot, newPort).x -
        deps.getPortAbsolutePosition(oldRoot, oldPort).x,
      deps.getPortAbsolutePosition(newRoot, newPort).y -
        deps.getPortAbsolutePosition(oldRoot, oldPort).y,
    );

    if (Math.abs(delta.x) < 0.0001 && Math.abs(delta.y) < 0.0001) {
      return;
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
  }

  function installGraphBehavior(extraDeps) {
    graph.getAllConnectionConstraints = function (terminal, source) {
      var root = deps.findPortHostRoot(terminal != null ? terminal.cell : null);

      if (root != null) {
        return getElectricalConstraints(root);
      }

      return oldGetAllConnectionConstraints.apply(this, arguments);
    };

    graph.setConnectionConstraint = function (edge, terminal, source, constraint) {
      if (edge == null) {
        oldSetConnectionConstraint.apply(this, arguments);
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
      oldSetConnectionConstraint.apply(this, arguments);

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
      var error = oldValidateConnection.apply(this, arguments);
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

  return {
    applyNativeConnectionConstraint,
    clearEdgePoints,
    getElectricalConstraints,
    getPortMetaByConstraint,
    getPortMetaById,
    isMovableConnectedTerminal,
    installGraphBehavior,
    mapPortDirectionToConstraint,
    moveCellToFrameByDelta,
    moveConnectedGroupToCabinetPort,
  };
}
