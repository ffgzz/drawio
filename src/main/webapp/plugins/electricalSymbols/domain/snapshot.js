export function createSnapshotDomain(deps) {
  var ctx = deps.ctx;
  var graph = ctx.graph;
  var model = ctx.model;
  var state = ctx.state;
  var ui = ctx.ui;

  function getCellStableId(cell) {
    return deps.trim(
      cell != null
        ? cell.id != null
          ? cell.id
          : mxObjectIdentity.get(cell)
        : "",
    );
  }

  function normalizeGenericStableId(value) {
    var stableId = deps.trim(value);

    while (stableId.indexOf("generic:") === 0) {
      stableId = stableId.substring("generic:".length);
    }

    return stableId;
  }

  function getGenericObjectId(cell) {
    return normalizeGenericStableId(getCellStableId(cell));
  }

  function normalizeSnapshotGenericIds(snapshot) {
    if (!deps.isObject(snapshot)) {
      return snapshot;
    }

    var normalized = deps.cloneJson(snapshot);
    var genericIdMap = {};
    var i;

    if (Array.isArray(normalized.objects)) {
      for (i = 0; i < normalized.objects.length; i++) {
        var object = normalized.objects[i];

        if (deps.trim(object.kind) == "generic") {
          var currentId = deps.trim(object.id);
          var nextId = normalizeGenericStableId(currentId);

          if (currentId.length > 0 && currentId != nextId) {
            genericIdMap[currentId] = nextId;
            object.id = nextId;
          }
        }
      }

      for (i = 0; i < normalized.objects.length; i++) {
        var parentId = deps.trim(normalized.objects[i].parentId);

        if (genericIdMap[parentId] != null) {
          normalized.objects[i].parentId = genericIdMap[parentId];
        }
      }
    }

    if (Array.isArray(normalized.edges)) {
      for (i = 0; i < normalized.edges.length; i++) {
        var edge = normalized.edges[i];
        var sourceObjectId = deps.trim(
          edge.source != null ? edge.source.objectId : "",
        );
        var targetObjectId = deps.trim(
          edge.target != null ? edge.target.objectId : "",
        );

        if (genericIdMap[sourceObjectId] != null) {
          edge.source.objectId = genericIdMap[sourceObjectId];
        }

        if (genericIdMap[targetObjectId] != null) {
          edge.target.objectId = genericIdMap[targetObjectId];
        }
      }
    }

    if (Array.isArray(normalized.changes)) {
      for (i = 0; i < normalized.changes.length; i++) {
        var changeObjectId = deps.trim(normalized.changes[i].objectId);

        if (genericIdMap[changeObjectId] != null) {
          normalized.changes[i].objectId = genericIdMap[changeObjectId];
        }
      }
    }

    return normalized;
  }

  function isPlainXmlNode(value) {
    return (
      value != null &&
      typeof value === "object" &&
      typeof value.nodeType === "number" &&
      typeof value.nodeName === "string"
    );
  }

  function serializeXmlNode(node) {
    var attrs = {};
    var children = [];
    var i;

    if (!isPlainXmlNode(node)) {
      return null;
    }

    if (node.attributes != null) {
      for (i = 0; i < node.attributes.length; i++) {
        attrs[node.attributes[i].name] = node.attributes[i].value;
      }
    }

    if (node.childNodes != null) {
      for (i = 0; i < node.childNodes.length; i++) {
        var child = node.childNodes[i];

        if (child.nodeType == 1) {
          children.push({
            kind: "element",
            value: serializeXmlNode(child),
          });
        } else if (child.nodeType == 3 || child.nodeType == 4) {
          children.push({
            kind: "text",
            value: child.nodeValue || "",
          });
        }
      }
    }

    return {
      tagName: node.nodeName,
      attributes: attrs,
      children: children,
    };
  }

  function deserializeXmlNode(data) {
    var node;
    var attrs;
    var children;
    var i;

    if (!deps.isObject(data) || deps.trim(data.tagName).length == 0) {
      return null;
    }

    node = deps.createNode(data.tagName);
    attrs = deps.isObject(data.attributes) ? data.attributes : {};

    for (var key in attrs) {
      if (attrs.hasOwnProperty(key)) {
        node.setAttribute(key, attrs[key]);
      }
    }

    children = Array.isArray(data.children) ? data.children : [];

    for (i = 0; i < children.length; i++) {
      var child = children[i];

      if (!deps.isObject(child)) {
        continue;
      }

      if (child.kind == "element") {
        var elementChild = deserializeXmlNode(child.value);

        if (elementChild != null) {
          node.appendChild(elementChild);
        }
      } else if (child.kind == "text") {
        node.appendChild(
          node.ownerDocument.createTextNode(String(child.value)),
        );
      }
    }

    return node;
  }

  function serializeCellValue(value) {
    if (value == null) {
      return { kind: "null", value: null };
    }

    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      return { kind: "primitive", value: value };
    }

    if (isPlainXmlNode(value)) {
      return { kind: "xml", value: serializeXmlNode(value) };
    }

    return { kind: "json", value: deps.cloneJson(value) };
  }

  function deserializeCellValue(data) {
    if (!deps.isObject(data)) {
      return data;
    }

    if (data.kind == "null") {
      return null;
    }

    if (data.kind == "primitive") {
      return data.value;
    }

    if (data.kind == "xml") {
      return deserializeXmlNode(data.value);
    }

    if (data.kind == "json") {
      return deps.cloneJson(data.value);
    }

    return null;
  }

  function toNumber(value, fallback) {
    var parsed = Number(value);
    return isFinite(parsed) ? parsed : fallback;
  }

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

  function serializeGeometry(geometry) {
    return {
      x: geometry != null ? toNumber(geometry.x, 0) : 0,
      y: geometry != null ? toNumber(geometry.y, 0) : 0,
      width: geometry != null ? toNumber(geometry.width, 0) : 0,
      height: geometry != null ? toNumber(geometry.height, 0) : 0,
      relative: geometry != null ? !!geometry.relative : false,
      offset:
        geometry != null && geometry.offset != null
          ? {
              x: toNumber(geometry.offset.x, 0),
              y: toNumber(geometry.offset.y, 0),
            }
          : null,
      sourcePoint:
        geometry != null && geometry.sourcePoint != null
          ? {
              x: toNumber(geometry.sourcePoint.x, 0),
              y: toNumber(geometry.sourcePoint.y, 0),
            }
          : null,
      targetPoint:
        geometry != null && geometry.targetPoint != null
          ? {
              x: toNumber(geometry.targetPoint.x, 0),
              y: toNumber(geometry.targetPoint.y, 0),
            }
          : null,
      points:
        geometry != null && Array.isArray(geometry.points)
          ? geometry.points.map(function (point) {
              return {
                x: toNumber(point.x, 0),
                y: toNumber(point.y, 0),
              };
            })
          : [],
      alternateBounds:
        geometry != null && geometry.alternateBounds != null
          ? {
              x: toNumber(geometry.alternateBounds.x, 0),
              y: toNumber(geometry.alternateBounds.y, 0),
              width: toNumber(geometry.alternateBounds.width, 0),
              height: toNumber(geometry.alternateBounds.height, 0),
            }
          : null,
    };
  }

  function deserializeGeometry(data) {
    var geometry = new mxGeometry(
      deps.isObject(data) ? toNumber(data.x, 0) : 0,
      deps.isObject(data) ? toNumber(data.y, 0) : 0,
      deps.isObject(data) ? toNumber(data.width, 0) : 0,
      deps.isObject(data) ? toNumber(data.height, 0) : 0,
    );

    geometry.relative = deps.isObject(data) ? !!data.relative : false;

    if (deps.isObject(data) && deps.isObject(data.offset)) {
      geometry.offset = new mxPoint(
        toNumber(data.offset.x, 0),
        toNumber(data.offset.y, 0),
      );
    }

    if (deps.isObject(data) && deps.isObject(data.sourcePoint)) {
      geometry.sourcePoint = new mxPoint(
        toNumber(data.sourcePoint.x, 0),
        toNumber(data.sourcePoint.y, 0),
      );
    }

    if (deps.isObject(data) && deps.isObject(data.targetPoint)) {
      geometry.targetPoint = new mxPoint(
        toNumber(data.targetPoint.x, 0),
        toNumber(data.targetPoint.y, 0),
      );
    }

    if (deps.isObject(data) && Array.isArray(data.points) && data.points.length > 0) {
      geometry.points = data.points.map(function (point) {
        return new mxPoint(toNumber(point.x, 0), toNumber(point.y, 0));
      });
    }

    if (deps.isObject(data) && deps.isObject(data.alternateBounds)) {
      geometry.alternateBounds = new mxRectangle(
        toNumber(data.alternateBounds.x, 0),
        toNumber(data.alternateBounds.y, 0),
        toNumber(data.alternateBounds.width, 0),
        toNumber(data.alternateBounds.height, 0),
      );
    }

    return geometry;
  }

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
      return deps.trim(deps.getAttr(cell, "logicalCabinetId")) || null;
    }

    if (deps.isElectricalRoot(cell)) {
      return getSymbolObjectId(cell);
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
        constraint: constraint,
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

  function getSymbolObjectId(root) {
    var instanceId = deps.trim(deps.getAttr(root, "instanceId"));

    if (instanceId.length > 0) {
      return instanceId;
    }

    var spec = deps.extractSpec(root);
    return deps.trim(spec.instanceId) || deps.trim(root != null ? root.id : "");
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
        frameConfig: frameConfig,
        originFrameId: deps.trim(deps.getAttr(frame, "originFrameId")) || null,
        autoFrameOwner: deps.trim(deps.getAttr(frame, "autoFrameOwner")) || null,
        autoFrameIndex: deps.toInt(deps.getAttr(frame, "autoFrameIndex"), 0),
      },
    };
  }

  function exportCabinetObject(segment) {
    var cabinetModel = deps.extractCabinetModel(segment);
    var originFrame = deps.findFrameById(cabinetModel.originFrameId);

    return {
      id: deps.trim(cabinetModel.logicalCabinetId),
      kind: "cabinet",
      parentId: deps.trim(cabinetModel.originFrameId) || null,
      groupId: originFrame != null ? deps.getFrameGroupId(originFrame) : null,
      geometry: {
        x: cabinetModel.cabinetX,
        y:
          originFrame != null
            ? Math.round(deps.getFrameConfig(originFrame).height * deps.FRAME_MARGIN_RATIO)
            : 0,
        width: cabinetModel.cabinetWidth,
        height: 0,
      },
      props: {
        cabinetModel: cabinetModel,
      },
    };
  }

  function exportSymbolObject(root) {
    var spec = deps.extractSpec(root);
    var geometry = model.getGeometry(root);
    var frame = deps.findDrawingFrame(root);
    var parent = model.getParent(root);

    if (parent == graph.getDefaultParent()) {
      parent = null;
    }

    return {
      id: getSymbolObjectId(root),
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
        spec: spec,
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
    var cabinetSeen = {};
    var allCells = getAllModelCells();
    var i;

    for (i = 0; i < frames.length; i++) {
      frameObjects.push(exportFrameObject(frames[i]));
    }

    for (i = 0; i < allCells.length; i++) {
      var cell = allCells[i];

      if (deps.isCabinetSegment(cell)) {
        var logicalId = deps.trim(deps.getAttr(cell, "logicalCabinetId"));

        if (!cabinetSeen[logicalId]) {
          cabinetSeen[logicalId] = true;
          cabinetObjects.push(exportCabinetObject(cell));
        }
      } else if (deps.isElectricalRoot(cell)) {
        symbolObjects.push(exportSymbolObject(cell));
      } else if (shouldExportGenericObject(cell)) {
        genericObjects.push(exportGenericObject(cell));
      } else if (model.isEdge(cell)) {
        edgeObjects.push(exportEdgeObject(cell));
      }
    }

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
  }

  function indexSnapshotEntries(snapshot) {
    var map = {};
    var i;

    if (!deps.isObject(snapshot)) {
      return map;
    }

    if (Array.isArray(snapshot.objects)) {
      for (i = 0; i < snapshot.objects.length; i++) {
        map["object:" + snapshot.objects[i].id] = snapshot.objects[i];
      }
    }

    if (Array.isArray(snapshot.edges)) {
      for (i = 0; i < snapshot.edges.length; i++) {
        map["edge:" + snapshot.edges[i].id] = snapshot.edges[i];
      }
    }

    return map;
  }

  function computeSnapshotChanges(previousSnapshot, nextSnapshot) {
    var previousMap = indexSnapshotEntries(previousSnapshot);
    var nextMap = indexSnapshotEntries(nextSnapshot);
    var keys = {};
    var changes = [];
    var touchedObjectIds = [];
    var key;

    for (key in previousMap) {
      keys[key] = true;
    }

    for (key in nextMap) {
      keys[key] = true;
    }

    for (key in keys) {
      if (!keys.hasOwnProperty(key)) {
        continue;
      }

      var previousValue = previousMap[key];
      var nextValue = nextMap[key];
      var parts = key.split(":");
      var objectType = parts[0] == "edge" ? "edge" : "object";
      var objectId = key.substring(key.indexOf(":") + 1);
      var op = null;

      if (previousValue == null && nextValue != null) {
        op = "create";
      } else if (previousValue != null && nextValue == null) {
        op = "delete";
      } else if (JSON.stringify(previousValue) != JSON.stringify(nextValue)) {
        op = "update";
      }

      if (op != null) {
        changes.push({
          objectType: objectType,
          objectId: objectId,
          op: op,
          before: previousValue != null ? deps.cloneJson(previousValue) : null,
          after: nextValue != null ? deps.cloneJson(nextValue) : null,
        });
        touchedObjectIds.push(objectId);
      }
    }

    return {
      touchedObjectIds: touchedObjectIds,
      changes: changes,
    };
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

  function resolveImportedEdgeTerminal(terminal, symbolMap, genericMap) {
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
      return findCabinetSegmentForPort(objectId, portId);
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
          cabinetModel.logicalCabinetId = cabinetObject.id;
          cabinetModel.originFrameId = cabinetObject.parentId;
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
          for (i = 0; i < snapshot.edges.length; i++) {
            var edgeObject = snapshot.edges[i];
            var sourceRoot = resolveImportedEdgeTerminal(
              edgeObject.source,
              symbolMap,
              genericMap,
            );
            var targetRoot = resolveImportedEdgeTerminal(
              edgeObject.target,
              symbolMap,
              genericMap,
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
    collectChangeObjectIds: collectChangeObjectIds,
    collectGenericPortBindings: collectGenericPortBindings,
    computeSnapshotChanges: computeSnapshotChanges,
    deserializeCellValue: deserializeCellValue,
    deserializeGeometry: deserializeGeometry,
    exportDiagramSnapshot: exportDiagramSnapshot,
    getEdgePortId: getEdgePortId,
    getConstraintForPort: buildConstraintForPort,
    getGenericObjectId: getGenericObjectId,
    getGenericPortBindingById: getGenericPortBindingById,
    isPluginInternalCell: isPluginInternalCell,
    normalizeGenericStableId: normalizeGenericStableId,
    normalizeSnapshotGenericIds: normalizeSnapshotGenericIds,
    restoreDiagramSnapshot: restoreDiagramSnapshot,
    serializeCellValue: serializeCellValue,
    serializeGeometry: serializeGeometry,
    shouldExportGenericObject: shouldExportGenericObject,
  };
}
