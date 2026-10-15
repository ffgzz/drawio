/**
 * E&iD drawing presentation standard.
 *
 * Draw.io keeps its native model scale (100 model units per inch). The
 * millimetre setting below changes only the editor's displayed unit; it does
 * not rescale page dimensions, grid size, cell geometry or edge waypoints.
 *
 * 这里是编辑器里字体字号的唯一出口：每次模型变动都会把有文字的单元改写成
 * 下面这套值，所以要跟客户图纸对齐就得改这里。
 */
import {
  EID_DRAWING_FONT_FAMILY,
  EID_LINE_WIDTH_PX,
  eidFontSizeFor,
} from "../domain/drawingTypography.js";

function getVisibleLabel(graph, cell) {
  var value = graph.convertValueToString(cell);

  if (value == null) {
    return "";
  }

  return String(value)
    .replace(/<br\s*\/?\s*>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&(?:nbsp|#160);/gi, " ")
    .trim();
}

function isZeroOpacity(value) {
  var opacity = parseFloat(value);

  return !isNaN(opacity) && opacity <= 0;
}

function rawStyleValue(style, key) {
  var match = String(style || "").match(
    new RegExp("(?:^|;)" + key + "=([^;]*)", "i"),
  );

  return match != null ? String(match[1]).trim() : null;
}

function explicitStyleValue(style, key) {
  var value = rawStyleValue(style, key);

  return value != null ? value.toLowerCase() : null;
}

function hasStyleToken(style, token) {
  return new RegExp("(?:^|;)" + token + "(?:;|$)", "i").test(
    String(style || ""),
  );
}

function hasVisibleStroke(style, computedStyle) {
  var explicitStrokeColor = explicitStyleValue(style, "strokeColor");
  var explicitStrokeWidth = parseFloat(explicitStyleValue(style, "strokeWidth"));
  var explicitOpacity = explicitStyleValue(style, "opacity");
  var explicitStrokeOpacity = explicitStyleValue(style, "strokeOpacity");
  var strokeColor = String(
    mxUtils.getValue(computedStyle, mxConstants.STYLE_STROKECOLOR, ""),
  ).toLowerCase();
  var shape = String(
    mxUtils.getValue(computedStyle, mxConstants.STYLE_SHAPE, ""),
  ).toLowerCase();

  if (
    hasStyleToken(style, "text") ||
    shape === "text" ||
    explicitStrokeColor === "none" ||
    explicitStrokeColor === "transparent" ||
    (!isNaN(explicitStrokeWidth) && explicitStrokeWidth <= 0) ||
    isZeroOpacity(explicitOpacity) ||
    isZeroOpacity(explicitStrokeOpacity) ||
    strokeColor === "none" ||
    strokeColor === "transparent"
  ) {
    return false;
  }

  return !(
    isZeroOpacity(mxUtils.getValue(computedStyle, mxConstants.STYLE_OPACITY, 100)) ||
    isZeroOpacity(
      mxUtils.getValue(computedStyle, mxConstants.STYLE_STROKE_OPACITY, 100),
    )
  );
}

function isVisibleSvgPaint(value) {
  var paint = String(value || "").trim().toLowerCase();

  return paint.length > 0 && paint !== "none" && paint !== "transparent";
}

function isWhiteSvgPaint(value) {
  var paint = String(value || "").trim().toLowerCase();

  return paint === "white" || paint === "#fff" || paint === "#ffffff";
}

function standardizeEmbeddedSvgStyle(style, cell, fontSize, strokeWidth) {
  var image = rawStyleValue(style, mxConstants.STYLE_IMAGE);

  if (
    image == null ||
    image.toLowerCase().indexOf("data:image/svg+xml,") !== 0 ||
    cell.geometry == null ||
    !(Number(cell.geometry.width) > 0)
  ) {
    return style;
  }

  var comma = image.indexOf(",");
  var svg;

  try {
    svg = decodeURIComponent(image.substring(comma + 1));
  } catch (_error) {
    return style;
  }

  var documentNode = new DOMParser().parseFromString(svg, "image/svg+xml");

  if (documentNode.querySelector("parsererror") != null) {
    return style;
  }

  var svgRoot = documentNode.documentElement;
  var viewBoxParts = String(svgRoot.getAttribute("viewBox") || "")
    .trim()
    .split(/[\s,]+/)
    .map(Number);

  if (viewBoxParts.length !== 4 || !(viewBoxParts[2] > 0)) {
    return style;
  }

  var modelScale = Number(cell.geometry.width) / viewBoxParts[2];

  if (!(modelScale > 0)) {
    return style;
  }

  var svgStrokeWidth = strokeWidth / modelScale;
  var svgFontSize = fontSize / modelScale;
  var elements = svgRoot.querySelectorAll("*");
  var i;

  for (i = 0; i < elements.length; i += 1) {
    var element = elements[i];
    var inlineStyle = element.style;
    var stroke = element.getAttribute("stroke");
    var inlineStroke =
      inlineStyle != null ? inlineStyle.getPropertyValue("stroke") : "";
    var hasStroke = isVisibleSvgPaint(stroke) || isVisibleSvgPaint(inlineStroke);

    if (hasStroke) {
      if (isVisibleSvgPaint(stroke)) {
        element.setAttribute("stroke", "#000000");
      }

      if (isVisibleSvgPaint(inlineStroke)) {
        inlineStyle.setProperty("stroke", "#000000");
      }
    }

    if (
      hasStroke ||
      (element.hasAttribute("stroke-width") &&
        String(stroke || "").toLowerCase() !== "none")
    ) {
      element.setAttribute("stroke-width", String(svgStrokeWidth));

      if (
        inlineStyle != null &&
        inlineStyle.getPropertyValue("stroke-width").length > 0
      ) {
        inlineStyle.setProperty("stroke-width", String(svgStrokeWidth));
      }
    }

    var tagName = String(element.localName || element.tagName || "").toLowerCase();
    var fill = element.getAttribute("fill");
    var inlineFill =
      inlineStyle != null ? inlineStyle.getPropertyValue("fill") : "";

    if (tagName === "text") {
      element.setAttribute("fill", "#000000");
      element.setAttribute("font-family", "Arial");
      element.setAttribute("font-size", String(svgFontSize));
      element.setAttribute("font-style", "normal");
      element.setAttribute("font-weight", "normal");
    } else {
      if (isVisibleSvgPaint(fill) && !isWhiteSvgPaint(fill)) {
        element.setAttribute("fill", "#000000");
      }

      if (isVisibleSvgPaint(inlineFill) && !isWhiteSvgPaint(inlineFill)) {
        inlineStyle.setProperty("fill", "#000000");
      }
    }
  }

  var standardizedSvg = new XMLSerializer().serializeToString(svgRoot);
  var prefix = image.substring(0, comma + 1);

  return mxUtils.setStyle(
    style,
    mxConstants.STYLE_IMAGE,
    prefix + encodeURIComponent(standardizedSvg),
  );
}

/** 自带字号、不参与正文统一化的单元。 */
var AUTHORED_TYPE_KINDS = { frameTemplateLabel: true };

function keepsAuthoredType(cell) {
  var value = cell != null ? cell.value : null;

  if (value == null || typeof value.getAttribute !== "function") {
    return false;
  }

  return AUTHORED_TYPE_KINDS[value.getAttribute("esKind")] === true;
}

function standardizeStyle(graph, model, cell, fontSize, strokeWidth) {
  if (cell == null || (!model.isVertex(cell) && !model.isEdge(cell))) {
    return null;
  }

  var style = model.getStyle(cell) || "";
  style = standardizeEmbeddedSvgStyle(style, cell, fontSize, strokeWidth);
  var computedStyle = graph.getCellStyle(cell) || {};

  // Only touch stroke colour and width. Dash patterns, arrows, routing and all
  // fill-related properties remain exactly as authored by the drawing logic.
  if (hasVisibleStroke(style, computedStyle)) {
    style = mxUtils.setStyle(style, mxConstants.STYLE_STROKECOLOR, "#000000");
    style = mxUtils.setStyle(
      style,
      mxConstants.STYLE_STROKEWIDTH,
      String(strokeWidth),
    );
  }

  var label = getVisibleLabel(graph, cell);

  // 图签栏的字号是从客户自己的 Sub_Title 图块里量出来的（3.0 mm），
  // 不是正文字号，统一化时必须放过，否则出图和图框对不上。
  if (label.length > 0 && !keepsAuthoredType(cell)) {
    style = mxUtils.setStyle(
      style,
      mxConstants.STYLE_FONTFAMILY,
      EID_DRAWING_FONT_FAMILY,
    );
    // 客户图纸中文比拉丁小一号，字号跟着内容走。
    style = mxUtils.setStyle(
      style,
      mxConstants.STYLE_FONTSIZE,
      String(eidFontSizeFor(label)),
    );
    style = mxUtils.setStyle(style, mxConstants.STYLE_FONTSTYLE, "0");
    style = mxUtils.setStyle(style, mxConstants.STYLE_FONTCOLOR, "#000000");
  }

  // The cabinet busbar is authored as a narrow filled rectangle rather than
  // a stroked line. Treat that one E&iD colour as linework, without touching
  // ordinary white/coloured component fills.
  if (explicitStyleValue(style, "fillColor") === "#00b7c3") {
    style = mxUtils.setStyle(style, mxConstants.STYLE_FILLCOLOR, "#000000");
  }

  return style;
}

function standardizeModel(graph, fontSize, strokeWidth) {
  var model = graph.getModel();
  var changed = false;
  var key;

  for (key in model.cells) {
    if (!Object.prototype.hasOwnProperty.call(model.cells, key)) {
      continue;
    }

    var cell = model.cells[key];
    var currentStyle = model.getStyle(cell) || "";
    var nextStyle = standardizeStyle(
      graph,
      model,
      cell,
      fontSize,
      strokeWidth,
    );

    if (nextStyle != null && nextStyle !== currentStyle) {
      // This standardizer is deliberately style-only. Direct assignment avoids
      // nesting a second model edit inside an mxEvent.CHANGE notification.
      cell.style = nextStyle;
      changed = true;
    }
  }

  if (changed) {
    graph.refresh();
  }
}

function standardizeDefaultStyles(graph, fontSize, strokeWidth) {
  var defaultVertex = graph.getStylesheet().getDefaultVertexStyle();
  var defaultEdge = graph.getStylesheet().getDefaultEdgeStyle();
  var defaults = [defaultVertex, defaultEdge];
  var i;

  for (i = 0; i < defaults.length; i += 1) {
    defaults[i][mxConstants.STYLE_STROKECOLOR] = "#000000";
    defaults[i][mxConstants.STYLE_STROKEWIDTH] = strokeWidth;
    defaults[i][mxConstants.STYLE_FONTCOLOR] = "#000000";
    defaults[i][mxConstants.STYLE_FONTFAMILY] = EID_DRAWING_FONT_FAMILY;
    defaults[i][mxConstants.STYLE_FONTSIZE] = fontSize;
    defaults[i][mxConstants.STYLE_FONTSTYLE] = 0;
  }
}

export function installEidDrawingStandard(ctx) {
  if (String(urlParams.eidStandard || "") !== "1") {
    return false;
  }

  var graph = ctx.graph;
  var model = ctx.model;
  var applying = false;
  // 用编辑器自己的 4 px/mm，而不是 mxGraph 的 96dpi 换算：图幅、图元、
  // 出图全按 4 px/mm 走，混用会让字比图纸小六分之一。
  var fontSize = eidFontSizeFor("");
  var strokeWidth = EID_LINE_WIDTH_PX;

  // Draw.io's built-in conversion now shows model dimensions in millimetres.
  // PIXELS_PER_MM/PIXELS_PER_INCH and every page/model coordinate stay native.
  graph.view.setUnit(mxConstants.MILLIMETERS);
  Editor.pageSizeUnit = mxConstants.MILLIMETERS;

  standardizeDefaultStyles(graph, fontSize, strokeWidth);

  model.addListener(mxEvent.CHANGE, function () {
    if (applying) {
      return;
    }

    applying = true;
    try {
      standardizeModel(graph, fontSize, strokeWidth);
    } finally {
      applying = false;
    }
  });

  standardizeModel(graph, fontSize, strokeWidth);
  return true;
}
