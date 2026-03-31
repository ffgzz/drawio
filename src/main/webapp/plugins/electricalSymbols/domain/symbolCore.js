/**
 * 电气图元纯规则子模块。
 * 负责 root/body/label 的样式和值元数据拼装，不直接操作 graph/model。
 */
import { getApp } from "../core/appRuntime.js";

function buildSymbolCoreDeps() {
  var app = getApp();

  return {
    toStyleImageUri: app.domains.spec.toStyleImageUri,
    ROOT_TYPE: app.constants.ROOT_TYPE,
    trim: app.utils.trim,
    serializePortLayout: app.domains.spec.serializePortLayout,
    normalizeLabels: app.domains.spec.normalizeLabels,
  };
}

export function createSymbolCore() {
  var deps = arguments.length > 0 ? arguments[0] : buildSymbolCoreDeps();
  function makeRootStyle() {
    return (
      "fillColor=none;strokeColor=none;html=1;whiteSpace=wrap;" +
      "connectable=1;container=1;collapsible=0;foldable=0;recursiveResize=0;rotatable=0;"
    );
  }

  function makeBodyStyle(spec) {
    return (
      "shape=image;image=" +
      deps.toStyleImageUri(spec) +
      ";imageAspect=0;aspect=fixed;html=1;strokeColor=none;fillColor=none;" +
      "part=1;connectable=0;editable=0;movable=0;resizable=0;rotatable=0;" +
      "cloneable=0;deletable=0;pointerEvents=0;"
    );
  }

  function makeLabelStyle(align) {
    return (
      "text;part=1;html=1;whiteSpace=wrap;strokeColor=none;fillColor=none;" +
      "align=" +
      align +
      ";verticalAlign=middle;spacing=2;rotatable=0;connectable=0;"
    );
  }

  function applyValueMetadata(node, spec, layout) {
    node.setAttribute("pluginType", deps.ROOT_TYPE);
    node.setAttribute("symbolId", spec.symbolId);
    node.setAttribute("instanceId", deps.trim(spec.instanceId));
    node.setAttribute("title", spec.title);
    node.setAttribute("label", "");
    node.setAttribute("deviceName", spec.device.name);
    node.setAttribute("deviceCode", spec.device.code);
    node.setAttribute("devicePower", spec.device.power);
    node.setAttribute("mode", spec.device.mode);
    node.setAttribute("variantField", deps.trim(spec.variantField || "mode"));
    node.setAttribute("paramsJson", JSON.stringify(spec.device.params || {}));
    node.setAttribute("portsJson", deps.serializePortLayout(layout));
    node.setAttribute("portLayout", deps.serializePortLayout(layout));
    node.setAttribute(
      "labelsJson",
      JSON.stringify(deps.normalizeLabels(spec.labels)),
    );
    node.setAttribute("schemaJson", JSON.stringify(spec.schema || {}));
    node.setAttribute("dataJson", JSON.stringify(spec.data || {}));
    node.setAttribute("symbolPayload", JSON.stringify(spec));
    return node;
  }

  return {
    applyValueMetadata,
    makeBodyStyle,
    makeLabelStyle,
    makeRootStyle,
  };
}
