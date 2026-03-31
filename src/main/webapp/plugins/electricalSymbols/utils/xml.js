/**
 * XML/SVG 相关工具函数。
 * 这里统一处理 mxGraph value 节点、SVG 校验和尺寸提取。
 */
// createXmlUtils 把依赖最小化，只依赖外部注入的 trim。
export function createXmlUtils(deps) {
  var trim = deps.trim;

  function createNode(tagName) {
    return mxUtils.createXmlDocument().createElement(tagName);
  }

  function cloneValue(node, fallbackTagName) {
    if (node != null && node.nodeType == mxConstants.NODETYPE_ELEMENT) {
      return node.cloneNode(true);
    }

    return createNode(fallbackTagName);
  }

  function getAttr(cell, name) {
    return cell != null &&
      cell.value != null &&
      cell.value.nodeType == mxConstants.NODETYPE_ELEMENT
      ? cell.value.getAttribute(name)
      : null;
  }

  function createMetaCell(tagName, kind, key, label) {
    var value = createNode(tagName);
    value.setAttribute("esKind", kind);
    value.setAttribute("esKey", key);
    value.setAttribute("label", label || "");
    return value;
  }

  function validateSvg(svg) {
    var text = trim(svg);

    if (text.length == 0) {
      throw new Error("缺少 svg 字段");
    }

    var doc = mxUtils.parseXml(text);
    var root = doc.documentElement;

    if (root == null || root.nodeName.toLowerCase() != "svg") {
      throw new Error("svg 内容必须包含根节点 <svg>");
    }

    return mxUtils.getXml(root);
  }

  function extractSvgSize(svg, toFloat) {
    var doc = mxUtils.parseXml(validateSvg(svg));
    var root = doc.documentElement;
    var viewBox = trim(root.getAttribute("viewBox"));
    var width = toFloat(root.getAttribute("width"), NaN);
    var height = toFloat(root.getAttribute("height"), NaN);

    if (viewBox.length > 0) {
      var parts = viewBox.split(/\s+/);

      if (parts.length == 4) {
        width = toFloat(parts[2], width);
        height = toFloat(parts[3], height);
      }
    }

    return {
      width: Math.max(20, Math.round(isNaN(width) ? 120 : width)),
      height: Math.max(20, Math.round(isNaN(height) ? 80 : height)),
    };
  }

  return {
    cloneValue,
    createMetaCell,
    createNode,
    extractSvgSize,
    getAttr,
    validateSvg,
  };
}
