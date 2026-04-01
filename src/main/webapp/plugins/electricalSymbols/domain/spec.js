/**
 * 规格数据域模型。
 * 负责 schema、端口、标签、变体、实例数据这些“纯数据结构”的归一化与构造。
 */
import {
  buildEmptyValueFromSchema,
  buildSchemaFromFields as buildSchemaFromFieldsRaw,
  flattenSchemaFields as flattenSchemaFieldsRaw,
  getDefaultSchemaFields as getDefaultSchemaFieldsRaw,
  getValueByPath,
  hasSchemaPath,
  isSchemaLeafDescriptor,
  isValidFieldPath,
  normalizeEnumOptions,
  normalizeSchemaField as normalizeSchemaFieldRaw,
  normalizeSchemaType,
  setValueByPath,
} from "./specSchema.js";
import {
  buildPortLayout,
  normalizePortDirection,
  normalizePortIoMode,
  normalizePortLayout,
  normalizePortMarker,
  normalizePortPoint,
  parsePortLayout,
  serializePortLayout,
} from "./specPorts.js";
import {
  buildResolvedLabels as buildResolvedLabelsRaw,
  normalizeLabelAlign,
  normalizeLabelItem,
  normalizeLabels,
} from "./specLabels.js";
import { getApp } from "../core/appRuntime.js";
import {
  cloneJson,
  deepMerge,
  isObject,
  toInt,
  trim,
} from "../utils/base.js";
import { validateSvg } from "../utils/xml.js";
import {
  generateInstanceId,
  generateSymbolId,
  nextItemId,
  normalizeMode,
} from "../core/runtimeHelpers.js";

function getSpecDeps() {
  var app = getApp();

  return {
    trim,
    isObject,
    cloneJson,
    validateSvg,
    generateSymbolId,
    toInt,
    nextItemId,
    normalizeMode,
    deepMerge,
    generateInstanceId,
  };
}

export function getVariantLayout(spec, variantKey) {
  var deps = getSpecDeps();
  var layouts = normalizeVariantLayouts(spec.variantLayouts);
  var key = deps.trim(variantKey);

  if (key.length > 0 && layouts[key] != null) {
    return {
      ports: normalizePortLayout(layouts[key].ports),
      labels: normalizeLabels(layouts[key].labels),
    };
  }

  return {
    ports: normalizePortLayout(spec.ports),
    labels: normalizeLabels(spec.labels),
  };
}

export function getActiveVariantKey(spec) {
  var deps = getSpecDeps();
  var field = deps.trim(spec.variantField || "");
  var value = deps.trim(getValueByPath(spec.data, field));

  if (value.length == 0 && field == "mode") {
    value = deps.trim(spec.device.mode);
  }

  return value;
}

export function getActiveSvg(spec) {
  var variantKey = getActiveVariantKey(spec);

  if (variantKey.length > 0 && spec.svgVariants[variantKey] != null) {
    return spec.svgVariants[variantKey];
  }

  return spec.svg;
}

export function toSvgDataUri(spec) {
  return "data:image/svg+xml," + encodeURIComponent(getActiveSvg(spec));
}

export function toStyleImageUri(spec) {
  return "data:image/svg+xml," + encodeURIComponent(getActiveSvg(spec));
}

export function normalizeVariantLayouts(raw) {
  var deps = getSpecDeps();
  var result = {};
  var key;

  if (!deps.isObject(raw)) {
    return result;
  }

  for (key in raw) {
    if (raw.hasOwnProperty(key) && deps.trim(key).length > 0) {
      var entry = deps.isObject(raw[key]) ? raw[key] : {};
      result[deps.trim(key)] = {
        ports: normalizePortLayout(entry.ports),
        labels: normalizeLabels(entry.labels),
      };
    }
  }

  return result;
}

export function normalizeSpec(raw) {
  var deps = getSpecDeps();

  if (!deps.isObject(raw)) {
    throw new Error("JSON 根节点必须是对象");
  }

  var device = deps.isObject(raw.device) ? raw.device : {};
  var ports = raw.ports;
  var variants = deps.isObject(raw.svgVariants) ? raw.svgVariants : {};
  var size = deps.isObject(raw.size) ? raw.size : {};
  var params = deps.isObject(device.params) ? deps.cloneJson(device.params) : {};
  var schema = deps.isObject(raw.schema) ? deps.cloneJson(raw.schema) : {};
  var data = deps.isObject(raw.data) ? deps.cloneJson(raw.data) : {};
  var variantField = deps.trim(raw.variantField || "");
  var spec = {
    symbolId: deps.trim(raw.symbolId) || deps.generateSymbolId("symbol"),
    templateName:
      deps.trim(raw.templateName) ||
      deps.trim(raw.title) ||
      deps.trim(device.name) ||
      "电气图元",
    title: deps.trim(raw.title) || deps.trim(device.name) || "电气图元",
    svg: deps.validateSvg(raw.svg),
    size: {
      width: Math.max(20, deps.toInt(size.width, 120)),
      height: Math.max(20, deps.toInt(size.height, 80)),
    },
    device: {
      name: deps.trim(device.name),
      code: deps.trim(device.code),
      power: deps.trim(device.power),
      mode: deps.normalizeMode(device.mode),
      params,
    },
    ports: normalizePortLayout(ports),
    labels: normalizeLabels(raw.labels),
    schema,
    data,
    variantField,
    svgVariants: {},
    variantLayouts: normalizeVariantLayouts(raw.variantLayouts),
  };

  for (var variantKey in variants) {
    if (
      variants.hasOwnProperty(variantKey) &&
      deps.trim(variantKey).length > 0 &&
      variants[variantKey] != null &&
      deps.trim(variants[variantKey]).length > 0
    ) {
      spec.svgVariants[deps.trim(variantKey)] = deps.validateSvg(variants[variantKey]);
    }
  }

  return spec;
}

export function createEmptyTemplateSpec() {
  var deps = getSpecDeps();

  return normalizeSpec({
    symbolId: deps.generateSymbolId("symbol"),
    templateName: "电气图元",
    title: "电气图元",
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" viewBox="0 0 120 80"></svg>',
    size: {
      width: 120,
      height: 80,
    },
    device: {},
    ports: [],
    labels: [],
    schema: {},
    data: {},
    variantField: "",
    svgVariants: {},
    variantLayouts: {},
  });
}

export function buildInstanceSpec(instanceData, template, sizeOverride) {
  var deps = getSpecDeps();

  template =
    template != null ? normalizeSpec(deps.cloneJson(template)) : createEmptyTemplateSpec();
  var mergedData = deps.deepMerge(
    buildEmptyValueFromSchema(template.schema),
    instanceData,
  );
  var spec = deps.cloneJson(template);
  var nameValue =
    getValueByPath(mergedData, "name") || getValueByPath(mergedData, "device.name");
  var codeValue =
    getValueByPath(mergedData, "code") || getValueByPath(mergedData, "device.code");
  var powerValue =
    getValueByPath(mergedData, "power") || getValueByPath(mergedData, "device.power");
  var modeValue =
    getValueByPath(mergedData, "mode") || getValueByPath(mergedData, "device.mode");
  var titleValue = getValueByPath(mergedData, "title");
  var variantKey;
  var layout;

  spec.data = mergedData;
  spec.symbolId = template.symbolId;
  spec.instanceId = deps.generateInstanceId();
  spec.title = deps.trim(titleValue) || deps.trim(nameValue) || template.title;
  spec.size = {
    width: Math.max(
      20,
      deps.toInt(
        sizeOverride != null ? sizeOverride.width : null,
        template.size.width,
      ),
    ),
    height: Math.max(
      20,
      deps.toInt(
        sizeOverride != null ? sizeOverride.height : null,
        template.size.height,
      ),
    ),
  };
  spec.device.name = deps.trim(nameValue);
  spec.device.code = deps.trim(codeValue);
  spec.device.power = deps.trim(powerValue);
  spec.device.mode = deps.normalizeMode(modeValue);
  variantKey = getActiveVariantKey(spec);
  layout = getVariantLayout(template, variantKey);
  spec.ports = layout.ports;
  spec.labels = buildResolvedLabelsRaw(layout.labels, mergedData, getValueByPath);

  return normalizeSpec(spec);
}

export function buildResolvedLabels(labels, instance) {
  return buildResolvedLabelsRaw(labels, instance, getValueByPath);
}

export function buildSchemaFromFields(fields) {
  var deps = getSpecDeps();
  return buildSchemaFromFieldsRaw(fields, deps.nextItemId);
}

export function flattenSchemaFields(schema, prefix, result) {
  var deps = getSpecDeps();
  return flattenSchemaFieldsRaw(schema, prefix, result, deps.nextItemId);
}

export function getDefaultSchemaFields() {
  var deps = getSpecDeps();
  return getDefaultSchemaFieldsRaw(deps.nextItemId);
}

export function normalizeSchemaField(raw) {
  var deps = getSpecDeps();
  return normalizeSchemaFieldRaw(raw, deps.nextItemId);
}

export var specDomainApi = {
  buildEmptyValueFromSchema,
  buildInstanceSpec,
  buildPortLayout,
  buildResolvedLabels,
  buildSchemaFromFields,
  createEmptyTemplateSpec,
  flattenSchemaFields,
  getActiveSvg,
  getActiveVariantKey,
  getDefaultSchemaFields,
  getValueByPath,
  getVariantLayout,
  hasSchemaPath,
  isSchemaLeafDescriptor,
  isValidFieldPath,
  normalizeEnumOptions,
  normalizeLabelAlign,
  normalizeLabelItem,
  normalizeLabels,
  normalizePortDirection,
  normalizePortIoMode,
  normalizePortLayout,
  normalizePortMarker,
  normalizePortPoint,
  normalizeSchemaField,
  normalizeSchemaType,
  normalizeSpec,
  normalizeVariantLayouts,
  parsePortLayout,
  serializePortLayout,
  setValueByPath,
  toStyleImageUri,
  toSvgDataUri,
};
