/**
 * 快照纯规则子模块。
 * 负责稳定 ID、XML/值序列化、几何序列化和快照 diff，不直接访问 graph/model。
 */
import { cloneJson, isObject, trim } from "../utils/base.js";
import { createNode } from "../utils/xml.js";

export function getCellStableId(cell) {
  return trim(
    cell != null ? (cell.id != null ? cell.id : mxObjectIdentity.get(cell)) : "",
  );
}

export function normalizeGenericStableId(value) {
  var stableId = trim(value);

  while (stableId.indexOf("generic:") === 0) {
    stableId = stableId.substring("generic:".length);
  }

  return stableId;
}

export function getGenericObjectId(cell) {
  return normalizeGenericStableId(getCellStableId(cell));
}

export function normalizeSnapshotGenericIds(snapshot) {
  if (!isObject(snapshot)) {
    return snapshot;
  }

  var normalized = cloneJson(snapshot);
  var genericIdMap = {};
  var i;

  if (Array.isArray(normalized.objects)) {
    for (i = 0; i < normalized.objects.length; i++) {
      var object = normalized.objects[i];

      if (trim(object.kind) == "generic") {
        var currentId = trim(object.id);
        var nextId = normalizeGenericStableId(currentId);

        if (currentId.length > 0 && currentId != nextId) {
          genericIdMap[currentId] = nextId;
          object.id = nextId;
        }
      }
    }

    for (i = 0; i < normalized.objects.length; i++) {
      var parentId = trim(normalized.objects[i].parentId);

      if (genericIdMap[parentId] != null) {
        normalized.objects[i].parentId = genericIdMap[parentId];
      }
    }
  }

  if (Array.isArray(normalized.edges)) {
    for (i = 0; i < normalized.edges.length; i++) {
      var edge = normalized.edges[i];
      var sourceObjectId = trim(edge.source != null ? edge.source.objectId : "");
      var targetObjectId = trim(edge.target != null ? edge.target.objectId : "");

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
      var changeObjectId = trim(normalized.changes[i].objectId);

      if (genericIdMap[changeObjectId] != null) {
        normalized.changes[i].objectId = genericIdMap[changeObjectId];
      }
    }
  }

  return normalized;
}

export function isPlainXmlNode(value) {
  return (
    value != null &&
    typeof value === "object" &&
    typeof value.nodeType === "number" &&
    typeof value.nodeName === "string"
  );
}

export function serializeXmlNode(node) {
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
    children,
  };
}

export function deserializeXmlNode(data) {
  var node;
  var attrs;
  var children;
  var i;

  if (!isObject(data) || trim(data.tagName).length == 0) {
    return null;
  }

  node = createNode(data.tagName);
  attrs = isObject(data.attributes) ? data.attributes : {};

  for (var key in attrs) {
    if (attrs.hasOwnProperty(key)) {
      node.setAttribute(key, attrs[key]);
    }
  }

  children = Array.isArray(data.children) ? data.children : [];

  for (i = 0; i < children.length; i++) {
    var child = children[i];

    if (!isObject(child)) {
      continue;
    }

    if (child.kind == "element") {
      var elementChild = deserializeXmlNode(child.value);

      if (elementChild != null) {
        node.appendChild(elementChild);
      }
    } else if (child.kind == "text") {
      node.appendChild(node.ownerDocument.createTextNode(String(child.value)));
    }
  }

  return node;
}

export function serializeCellValue(value) {
  if (value == null) {
    return { kind: "null", value: null };
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return { kind: "primitive", value };
  }

  if (isPlainXmlNode(value)) {
    return { kind: "xml", value: serializeXmlNode(value) };
  }

  return { kind: "json", value: cloneJson(value) };
}

export function deserializeCellValue(data) {
  if (!isObject(data)) {
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
    return cloneJson(data.value);
  }

  return null;
}

export function toNumber(value, fallback) {
  var parsed = Number(value);
  return isFinite(parsed) ? parsed : fallback;
}

export function serializeGeometry(geometry) {
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

export function deserializeGeometry(data) {
  var geometry = new mxGeometry(
    isObject(data) ? toNumber(data.x, 0) : 0,
    isObject(data) ? toNumber(data.y, 0) : 0,
    isObject(data) ? toNumber(data.width, 0) : 0,
    isObject(data) ? toNumber(data.height, 0) : 0,
  );

  geometry.relative = isObject(data) ? !!data.relative : false;

  if (isObject(data) && isObject(data.offset)) {
    geometry.offset = new mxPoint(toNumber(data.offset.x, 0), toNumber(data.offset.y, 0));
  }

  if (isObject(data) && isObject(data.sourcePoint)) {
    geometry.sourcePoint = new mxPoint(
      toNumber(data.sourcePoint.x, 0),
      toNumber(data.sourcePoint.y, 0),
    );
  }

  if (isObject(data) && isObject(data.targetPoint)) {
    geometry.targetPoint = new mxPoint(
      toNumber(data.targetPoint.x, 0),
      toNumber(data.targetPoint.y, 0),
    );
  }

  if (isObject(data) && Array.isArray(data.points) && data.points.length > 0) {
    geometry.points = data.points.map(function (point) {
      return new mxPoint(toNumber(point.x, 0), toNumber(point.y, 0));
    });
  }

  if (isObject(data) && isObject(data.alternateBounds)) {
    geometry.alternateBounds = new mxRectangle(
      toNumber(data.alternateBounds.x, 0),
      toNumber(data.alternateBounds.y, 0),
      toNumber(data.alternateBounds.width, 0),
      toNumber(data.alternateBounds.height, 0),
    );
  }

  return geometry;
}

export function indexSnapshotEntries(snapshot) {
  var map = {};
  var i;

  if (!isObject(snapshot)) {
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

export function computeSnapshotChanges(previousSnapshot, nextSnapshot) {
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
        objectType,
        objectId,
        op,
        before: previousValue != null ? cloneJson(previousValue) : null,
        after: nextValue != null ? cloneJson(nextValue) : null,
      });
      touchedObjectIds.push(objectId);
    }
  }

  return {
    touchedObjectIds,
    changes,
  };
}
