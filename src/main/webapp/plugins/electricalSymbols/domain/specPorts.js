/**
 * 规格端口子模块。
 * 负责端口方向、IO 模式、布局坐标以及端口布局的序列化/反序列化。
 */
import { clamp, isObject, toFloat, toInt, trim } from "../utils/base.js";

export function normalizePortMarker(marker) {
  marker = trim(marker).toLowerCase();

  return marker == "circle" || marker == "hidden" ? marker : "cross";
}

export function normalizePortDirection(direction) {
  direction = trim(direction).toLowerCase();

  return direction == "left" ||
    direction == "right" ||
    direction == "up" ||
    direction == "down"
    ? direction
    : "any";
}

export function normalizePortIoMode(mode) {
  mode = trim(mode).toLowerCase();

  return mode == "in" || mode == "out" ? mode : "both";
}

export function defaultPortPosition(index, count) {
  return count <= 0 ? 0.5 : (index + 1) / (count + 1);
}

export function normalizePortPoint(raw, fallbackId, fallbackX, fallbackY) {
  var id = fallbackId;
  var x = fallbackX;
  var y = fallbackY;
  var name = "";
  var marker = "cross";
  var direction = "any";
  var ioMode = "both";

  if (isObject(raw)) {
    id = trim(raw.id || raw.key || raw.name) || fallbackId;
    x = toFloat(raw.x, fallbackX);
    y = toFloat(raw.y, fallbackY);
    name = trim(raw.name || raw.label || "");
    marker = normalizePortMarker(raw.marker || raw.style);
    direction = normalizePortDirection(raw.direction || raw.side);
    ioMode = normalizePortIoMode(raw.ioMode || raw.io || raw.mode);
  } else if (typeof raw == "number") {
    y = raw;
  }

  return {
    id,
    x: clamp(x, 0, 1),
    y: clamp(y, 0, 1),
    name,
    marker,
    direction,
    ioMode,
  };
}

export function normalizePortLayout(rawPorts) {
  var points = [];
  var i;

  if (Array.isArray(rawPorts)) {
    for (i = 0; i < rawPorts.length; i++) {
      points.push(
        normalizePortPoint(
          rawPorts[i],
          "port:" + i,
          0.5,
          (i + 1) / (rawPorts.length + 1),
        ),
      );
    }

    return points;
  }

  if (!isObject(rawPorts)) {
    return points;
  }

  if (Array.isArray(rawPorts.items)) {
    for (i = 0; i < rawPorts.items.length; i++) {
      points.push(
        normalizePortPoint(
          rawPorts.items[i],
          "port:" + i,
          0.5,
          (i + 1) / (rawPorts.items.length + 1),
        ),
      );
    }

    return points;
  }

  if (Array.isArray(rawPorts.left) || Array.isArray(rawPorts.right)) {
    var left = Array.isArray(rawPorts.left) ? rawPorts.left : [];
    var right = Array.isArray(rawPorts.right) ? rawPorts.right : [];

    for (i = 0; i < left.length; i++) {
      points.push(
        normalizePortPoint(
          { id: "left:" + i, x: 0, y: left[i] },
          "left:" + i,
          0,
          defaultPortPosition(i, left.length),
        ),
      );
    }

    for (i = 0; i < right.length; i++) {
      points.push(
        normalizePortPoint(
          { id: "right:" + i, x: 1, y: right[i] },
          "right:" + i,
          1,
          defaultPortPosition(i, right.length),
        ),
      );
    }

    return points;
  }

  var leftCount = Math.max(0, toInt(rawPorts.leftCount, 0));
  var rightCount = Math.max(0, toInt(rawPorts.rightCount, 0));

  for (i = 0; i < leftCount; i++) {
    points.push({
      id: "left:" + i,
      x: 0,
      y: defaultPortPosition(i, leftCount),
    });
  }

  for (i = 0; i < rightCount; i++) {
    points.push({
      id: "right:" + i,
      x: 1,
      y: defaultPortPosition(i, rightCount),
    });
  }

  return points;
}

export function parsePortLayout(raw) {
  if (raw == null || raw.length == 0) {
    return [];
  }

  try {
    return normalizePortLayout(JSON.parse(raw));
  } catch (e) {
    return [];
  }
}

export function buildPortLayout(spec, base) {
  var current = normalizePortLayout(spec.ports);
  var fallback = normalizePortLayout(base);

  return current.length > 0 ? current : fallback;
}

export function serializePortLayout(layout) {
  return JSON.stringify(normalizePortLayout(layout));
}
