/**
 * 规格数据域模型。
 * 负责 schema、端口、标签、变体、实例数据这些“纯数据结构”的归一化与构造。
 */
import { createSpecSchemaModule } from "./specSchema.js";
import { createSpecPortsModule } from "./specPorts.js";
import { createSpecLabelsModule } from "./specLabels.js";

// 这一层尽量保持纯函数，便于后续继续拆测试。
export function createSpecDomain(deps) {
  var trim = deps.trim;
  var schemaModule = createSpecSchemaModule(deps);
  var portsModule = createSpecPortsModule(deps);
  var labelsModule = createSpecLabelsModule({
    trim,
    clamp: deps.clamp,
    cloneJson: deps.cloneJson,
    getValueByPath: schemaModule.getValueByPath,
    isObject: deps.isObject,
    toFloat: deps.toFloat,
    toInt: deps.toInt,
  });

  function getVariantLayout(spec, variantKey) {
    var layouts = normalizeVariantLayouts(spec.variantLayouts);
    var key = trim(variantKey);

    if (key.length > 0 && layouts[key] != null) {
      return {
        ports: portsModule.normalizePortLayout(layouts[key].ports),
        labels: labelsModule.normalizeLabels(layouts[key].labels),
      };
    }

    return {
      ports: portsModule.normalizePortLayout(spec.ports),
      labels: labelsModule.normalizeLabels(spec.labels),
    };
  }

  function getActiveVariantKey(spec) {
    var field = trim(spec.variantField || "");
    var value = trim(schemaModule.getValueByPath(spec.data, field));

    if (value.length == 0 && field == "mode") {
      value = trim(spec.device.mode);
    }

    return value;
  }

  function getActiveSvg(spec) {
    var variantKey = getActiveVariantKey(spec);

    if (variantKey.length > 0 && spec.svgVariants[variantKey] != null) {
      return spec.svgVariants[variantKey];
    }

    return spec.svg;
  }

  function toSvgDataUri(spec) {
    return "data:image/svg+xml," + encodeURIComponent(getActiveSvg(spec));
  }

  function toStyleImageUri(spec) {
    return "data:image/svg+xml," + encodeURIComponent(getActiveSvg(spec));
  }

  function normalizeVariantLayouts(raw) {
    var result = {};
    var key;

    if (!deps.isObject(raw)) {
      return result;
    }

    for (key in raw) {
      if (raw.hasOwnProperty(key) && trim(key).length > 0) {
        var entry = deps.isObject(raw[key]) ? raw[key] : {};
        result[trim(key)] = {
          ports: portsModule.normalizePortLayout(entry.ports),
          labels: labelsModule.normalizeLabels(entry.labels),
        };
      }
    }

    return result;
  }

  function normalizeSpec(raw) {
    if (!deps.isObject(raw)) {
      throw new Error("JSON 根节点必须是对象");
    }

    var device = deps.isObject(raw.device) ? raw.device : {};
    var ports = raw.ports;
    var variants = deps.isObject(raw.svgVariants) ? raw.svgVariants : {};
    var size = deps.isObject(raw.size) ? raw.size : {};
    var params = deps.isObject(device.params)
      ? deps.cloneJson(device.params)
      : {};
    var schema = deps.isObject(raw.schema) ? deps.cloneJson(raw.schema) : {};
    var data = deps.isObject(raw.data) ? deps.cloneJson(raw.data) : {};
    var variantField = trim(raw.variantField || "");
    var spec = {
      symbolId: trim(raw.symbolId) || deps.generateSymbolId("symbol"),
      templateName:
        trim(raw.templateName) ||
        trim(raw.title) ||
        trim(device.name) ||
        "电气图元",
      title: trim(raw.title) || trim(device.name) || "电气图元",
      svg: deps.validateSvg(raw.svg),
      size: {
        width: Math.max(20, deps.toInt(size.width, 120)),
        height: Math.max(20, deps.toInt(size.height, 80)),
      },
      device: {
        name: trim(device.name),
        code: trim(device.code),
        power: trim(device.power),
        mode: deps.normalizeMode(device.mode),
        params,
      },
      ports: portsModule.normalizePortLayout(ports),
      labels: labelsModule.normalizeLabels(raw.labels),
      schema,
      data,
      variantField,
      svgVariants: {},
      variantLayouts: normalizeVariantLayouts(raw.variantLayouts),
    };

    for (var variantKey in variants) {
      if (
        variants.hasOwnProperty(variantKey) &&
        trim(variantKey).length > 0 &&
        variants[variantKey] != null &&
        trim(variants[variantKey]).length > 0
      ) {
        spec.svgVariants[trim(variantKey)] = deps.validateSvg(
          variants[variantKey],
        );
      }
    }

    return spec;
  }

  function createEmptyTemplateSpec() {
    return normalizeSpec({
      symbolId: deps.generateSymbolId("symbol"),
      templateName: "电气图元",
      title: "电气图元",
      svg:
        '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" viewBox="0 0 120 80"></svg>',
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

  function buildInstanceSpec(instanceData, template, sizeOverride) {
    template =
      template != null
        ? normalizeSpec(deps.cloneJson(template))
        : createEmptyTemplateSpec();
    var mergedData = deps.deepMerge(
      schemaModule.buildEmptyValueFromSchema(template.schema),
      instanceData,
    );
    var spec = deps.cloneJson(template);
    var nameValue =
      schemaModule.getValueByPath(mergedData, "name") ||
      schemaModule.getValueByPath(mergedData, "device.name");
    var codeValue =
      schemaModule.getValueByPath(mergedData, "code") ||
      schemaModule.getValueByPath(mergedData, "device.code");
    var powerValue =
      schemaModule.getValueByPath(mergedData, "power") ||
      schemaModule.getValueByPath(mergedData, "device.power");
    var modeValue =
      schemaModule.getValueByPath(mergedData, "mode") ||
      schemaModule.getValueByPath(mergedData, "device.mode");
    var titleValue = schemaModule.getValueByPath(mergedData, "title");
    var variantKey;
    var layout;

    spec.data = mergedData;
    spec.symbolId = template.symbolId;
    spec.instanceId = deps.generateInstanceId();
    spec.title = trim(titleValue) || trim(nameValue) || template.title;
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
    spec.device.name = trim(nameValue);
    spec.device.code = trim(codeValue);
    spec.device.power = trim(powerValue);
    spec.device.mode = deps.normalizeMode(modeValue);
    variantKey = getActiveVariantKey(spec);
    layout = getVariantLayout(template, variantKey);
    spec.ports = layout.ports;
    spec.labels = labelsModule.buildResolvedLabels(layout.labels, mergedData);

    return normalizeSpec(spec);
  }

  return {
    buildEmptyValueFromSchema: schemaModule.buildEmptyValueFromSchema,
    buildInstanceSpec,
    buildPortLayout: portsModule.buildPortLayout,
    buildResolvedLabels: labelsModule.buildResolvedLabels,
    buildSchemaFromFields: schemaModule.buildSchemaFromFields,
    createEmptyTemplateSpec,
    flattenSchemaFields: schemaModule.flattenSchemaFields,
    getActiveSvg,
    getActiveVariantKey,
    getDefaultSchemaFields: schemaModule.getDefaultSchemaFields,
    getValueByPath: schemaModule.getValueByPath,
    getVariantLayout,
    hasSchemaPath: schemaModule.hasSchemaPath,
    isSchemaLeafDescriptor: schemaModule.isSchemaLeafDescriptor,
    isValidFieldPath: schemaModule.isValidFieldPath,
    normalizeEnumOptions: schemaModule.normalizeEnumOptions,
    normalizeLabelAlign: labelsModule.normalizeLabelAlign,
    normalizeLabelItem: labelsModule.normalizeLabelItem,
    normalizeLabels: labelsModule.normalizeLabels,
    normalizePortDirection: portsModule.normalizePortDirection,
    normalizePortIoMode: portsModule.normalizePortIoMode,
    normalizePortLayout: portsModule.normalizePortLayout,
    normalizePortMarker: portsModule.normalizePortMarker,
    normalizePortPoint: portsModule.normalizePortPoint,
    normalizeSchemaField: schemaModule.normalizeSchemaField,
    normalizeSchemaType: schemaModule.normalizeSchemaType,
    normalizeSpec,
    normalizeVariantLayouts,
    parsePortLayout: portsModule.parsePortLayout,
    serializePortLayout: portsModule.serializePortLayout,
    setValueByPath: schemaModule.setValueByPath,
    toStyleImageUri,
    toSvgDataUri,
  };
}
