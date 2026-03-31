/**
 * 规格标签子模块。
 * 负责标签位置、对齐、绑定字段以及实例值解析后的标签文本生成。
 */
export function createSpecLabelsModule(deps) {
  var trim = deps.trim;

  function normalizeLabelAlign(align) {
    align = trim(align).toLowerCase();

    return align == "left" || align == "right" ? align : "center";
  }

  function normalizeLabelItem(raw, fallbackId, fallbackText) {
    var text = fallbackText;
    var id = fallbackId;
    var binding = "";
    var x = 0.5;
    var y = -0.18;
    var width = 120;
    var height = 26;
    var align = "center";

    if (deps.isObject(raw)) {
      text = trim(raw.text || raw.label) || fallbackText;
      id = trim(raw.id || raw.key || raw.name) || fallbackId;
      binding = trim(raw.binding || raw.field || raw.prop);
      x = deps.toFloat(raw.x, x);
      y = deps.toFloat(raw.y, y);
      width = Math.max(40, deps.toInt(raw.width, width));
      height = Math.max(20, deps.toInt(raw.height, height));
      align = normalizeLabelAlign(raw.align);
    } else {
      text = trim(raw) || fallbackText;
    }

    return {
      id,
      text,
      binding,
      x: deps.clamp(x, -1.5, 2.5),
      y: deps.clamp(y, -1.5, 2.5),
      width,
      height,
      align,
    };
  }

  function normalizeLabels(rawLabels) {
    var labels = [];
    var i;

    if (!Array.isArray(rawLabels)) {
      return labels;
    }

    for (i = 0; i < rawLabels.length; i++) {
      labels.push(
        normalizeLabelItem(rawLabels[i], "label:" + i, "文本" + (i + 1)),
      );
    }

    return labels;
  }

  function buildResolvedLabels(labels, instance) {
    var result = [];
    var i;

    for (i = 0; i < labels.length; i++) {
      var item = deps.cloneJson(labels[i]);
      var value = deps.getValueByPath(instance, item.binding);

      item.text =
        trim(item.binding).length > 0
          ? value != null
            ? String(value)
            : ""
          : item.text || "";
      result.push(item);
    }

    return result;
  }

  return {
    buildResolvedLabels,
    normalizeLabelAlign,
    normalizeLabelItem,
    normalizeLabels,
  };
}
