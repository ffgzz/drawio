/**
 * 图框纯规则子模块。
 * 只保留图框样式、配置归一化和值元数据拼装，不直接访问 graph/model。
 */
import { ELECTRICAL_CONSTANTS } from "../core/constants.js";
import {
  EID_DRAWING_FONT_FAMILY,
  EID_TEXT_SIZE_PX,
} from "./drawingTypography.js";
import { isObject, toInt, trim } from "../utils/base.js";
import { createMetaCell } from "../utils/xml.js";
import {
  A4_INNER_BORDER_MM,
  A4_PORTRAIT_MM,
  FRAME_A4_PORTRAIT_SVG,
  PX_PER_MM,
} from "./frameA4Geometry.js";

/**
 * 图幅本体默认用参考图纸的图框图形：内框、四角折线、A-F / 1-4 分区网格；
 * 传入 svg 时改画模板自带的图幅（例如招商局带图签栏的 A4）。
 * drawio 的 XML 解析会破坏 `;base64,` 数据 URL，所以一律转成百分号编码。
 * imageAspect=0 让它随单元格拉伸（只在用非 A4 配置时才有意义）。
 */
export function makeFrameStyle(svg) {
  var markup = decodeFrameSvg(svg) || FRAME_A4_PORTRAIT_SVG;

  return (
    "shape=image;image=data:image/svg+xml," +
    encodeURIComponent(markup) +
    ";imageAspect=0;fillColor=none;strokeColor=none;" +
    "rounded=0;html=1;whiteSpace=wrap;connectable=0;container=1;dropTarget=1;" +
    "collapsible=0;foldable=0;recursiveResize=0;rotatable=0;resizable=0;deletable=0;"
  );
}

/** 接受裸 SVG 文本，或 base64 / 百分号编码的 `data:image/svg+xml` URL。 */
function decodeFrameSvg(svg) {
  var value = trim(svg);

  if (value.length === 0) {
    return "";
  }
  if (value.indexOf("data:") !== 0) {
    return value;
  }

  var comma = value.indexOf(",");

  if (comma < 0) {
    return "";
  }

  var header = value.slice(0, comma);
  var payload = value.slice(comma + 1);

  try {
    if (header.indexOf(";base64") < 0) {
      return decodeURIComponent(payload);
    }

    // atob 一个字节给一个字符，多字节汉字会散成原始 UTF-8 字节，
    // 必须再按 UTF-8 读回来，否则图签栏的中文会变成 "å·¥ä¸"。
    var binary = atob(payload);
    var bytes = new Uint8Array(binary.length);
    var i;

    for (i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    return new TextDecoder("utf-8").decode(bytes);
  } catch (e) {
    return "";
  }
}

export function makeFrameLabelStyle() {
  return (
    "text;html=1;whiteSpace=wrap;strokeColor=none;fillColor=none;" +
    "align=center;verticalAlign=middle;fontStyle=0;fontSize=" +
    EID_TEXT_SIZE_PX +
    ";fontFamily=" +
    EID_DRAWING_FONT_FAMILY +
    ";" +
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
    if (key === "svgData") {
      continue;
    }
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
  // 贴住内框右上角，也就是参考图纸挂标题条的位置
  var geometry = new mxGeometry(
    A4_INNER_BORDER_MM.right * PX_PER_MM - width,
    (A4_PORTRAIT_MM.height - A4_INNER_BORDER_MM.top) * PX_PER_MM + 4,
    width,
    height,
  );
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
