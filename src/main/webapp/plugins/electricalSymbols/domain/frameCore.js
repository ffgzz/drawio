/**
 * 图框纯规则子模块。
 * 只保留图框样式、配置归一化和值元数据拼装，不直接访问 graph/model。
 */
import { ELECTRICAL_CONSTANTS } from "../core/constants.js";
import { isObject, toInt, trim } from "../utils/base.js";
import { createMetaCell } from "../utils/xml.js";

export function makeFrameStyle() {
  return (
    "shape=rectangle;fillColor=none;strokeColor=#6b7280;strokeWidth=2;" +
    "rounded=0;html=1;whiteSpace=wrap;connectable=0;container=1;dropTarget=1;" +
    "collapsible=0;foldable=0;recursiveResize=0;rotatable=0;resizable=0;deletable=0;"
  );
}

export function makeFrameLabelStyle() {
  return (
    "text;html=1;whiteSpace=wrap;strokeColor=none;fillColor=none;" +
    "align=center;verticalAlign=middle;fontStyle=1;fontSize=13;" +
    "connectable=0;editable=0;movable=0;resizable=0;rotatable=0;deletable=0;pointerEvents=0;"
  );
}

export function normalizeFrameConfig(raw) {
  raw = isObject(raw) ? raw : {};

  return {
    width: Math.max(320, toInt(raw.width, ELECTRICAL_CONSTANTS.FRAME_DEFAULT_WIDTH)),
    height: Math.max(
      240,
      toInt(raw.height, ELECTRICAL_CONSTANTS.FRAME_DEFAULT_HEIGHT),
    ),
  };
}

export function applyFrameValueMetadata(node, frameId, pageNumber, frameConfig, extra) {
  var config = normalizeFrameConfig(frameConfig);
  var extras = isObject(extra) ? extra : {};
  var key;

  node.setAttribute("pluginType", ELECTRICAL_CONSTANTS.FRAME_TYPE);
  node.setAttribute("frameId", trim(frameId));
  node.setAttribute("pageNumber", String(Math.max(1, toInt(pageNumber, 1))));
  node.setAttribute("frameConfigJson", JSON.stringify(config));
  node.setAttribute("frameWidth", String(config.width));
  node.setAttribute("frameHeight", String(config.height));
  node.setAttribute("label", "");

  for (key in extras) {
    if (extras.hasOwnProperty(key) && extras[key] != null) {
      node.setAttribute(key, String(extras[key]));
    }
  }

  return node;
}

export function createFramePageLabelCell(pageNumber, frameConfig) {
  var config = normalizeFrameConfig(frameConfig);
  var width = 140;
  var height = 24;
  var geometry = new mxGeometry(config.width - width - 16, 10, width, height);
  var value = createMetaCell(
    ELECTRICAL_CONSTANTS.FRAME_LABEL_TAG,
    ELECTRICAL_CONSTANTS.FRAME_LABEL_KIND,
    "page",
    "PAGE " + pageNumber,
  );
  var cell = new mxCell(value, geometry, makeFrameLabelStyle());
  cell.vertex = true;
  cell.setConnectable(false);
  return cell;
}
