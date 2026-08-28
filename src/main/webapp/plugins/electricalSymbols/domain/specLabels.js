/**
 * 规格标签子模块。
 * 负责标签位置、对齐、绑定字段以及实例值解析后的标签文本生成。
 */
import { clamp, cloneJson, isObject, toFloat, toInt, trim } from "../utils/base.js";

export function normalizeLabelAlign(align) {
  align = trim(align).toLowerCase();

  return align == "left" || align == "right" ? align : "center";
}

export function normalizeLabelItem(raw, fallbackId, fallbackText) {
  var text = fallbackText;
  var id = fallbackId;
  var binding = "";
  var x = 0.5;
  var y = -0.18;
  var width = 120;
  var height = 26;
  var align = "center";
  var boxed = false;

  if (isObject(raw)) {
    text = trim(raw.text || raw.label) || fallbackText;
    id = trim(raw.id || raw.key || raw.name) || fallbackId;
    binding = trim(raw.binding || raw.field || raw.prop);
    x = toFloat(raw.x, x);
    y = toFloat(raw.y, y);
    width = Math.max(40, toInt(raw.width, width));
    height = Math.max(20, toInt(raw.height, height));
    align = normalizeLabelAlign(raw.align);
    boxed = raw.boxed === true || raw.boxed === 1 || raw.boxed === "1";
  } else {
    text = trim(raw) || fallbackText;
  }

  return {
    id,
    text,
    binding,
    x: clamp(x, -1.5, 2.5),
    y: clamp(y, -1.5, 2.5),
    width,
    height,
    align,
    boxed,
  };
}

export function normalizeLabels(rawLabels) {
  var labels = [];
  var i;

  if (!Array.isArray(rawLabels)) {
    return labels;
  }

  for (i = 0; i < rawLabels.length; i++) {
    labels.push(normalizeLabelItem(rawLabels[i], "label:" + i, "文本" + (i + 1)));
  }

  return labels;
}

function resolveBindingText(binding, instance, getValueByPath) {
  var normalizedBinding = trim(binding);
  var hasTemplate;

  if (
    normalizedBinding.length == 0 ||
    typeof getValueByPath !== "function"
  ) {
    return null;
  }

  hasTemplate = /\{\{\s*[^{}]+?\s*\}\}/.test(normalizedBinding);

  if (hasTemplate) {
    return normalizedBinding.replace(
      /\{\{\s*([^{}]+?)\s*\}\}/g,
      function (_placeholder, fieldPath) {
        var value = getValueByPath(instance, trim(fieldPath));
        return value != null ? String(value) : "";
      },
    );
  }

  var value = getValueByPath(instance, normalizedBinding);
  return value != null ? String(value) : "";
}

export function buildResolvedLabels(labels, instance, getValueByPath) {
  var result = [];
  var i;

  for (i = 0; i < labels.length; i++) {
    var item = cloneJson(labels[i]);
    var resolvedText = resolveBindingText(
      item.binding,
      instance,
      getValueByPath,
    );

    item.text = resolvedText != null ? resolvedText : item.text || "";
    result.push(item);
  }

  return result;
}
