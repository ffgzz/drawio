/**
 * 规格数据域模型。
 * 负责 schema、端口、标签、变体、实例数据这些“纯数据结构”的归一化与构造。
 */
// 这一层尽量保持纯函数，便于后续继续拆测试。
export function createSpecDomain(deps) {
  var trim = deps.trim;

  // 叶子描述符代表一个最终可填写的字段，而不是嵌套对象。
  function isSchemaLeafDescriptor(value) {
    return (
      deps.isObject(value) &&
      typeof value.type === "string" &&
      trim(value.type).length > 0
    );
  }

  // 当前 schema 类型只允许 string / number / boolean / enum。
  function normalizeSchemaType(type) {
    type = trim(type).toLowerCase();

    return type == "number" || type == "boolean" || type == "enum"
      ? type
      : "string";
  }

  // 枚举值会被去重、去空白，保证表单和校验逻辑稳定。
  function normalizeEnumOptions(options) {
    var list = Array.isArray(options)
      ? options
      : String(options || "").split(",");
    var result = [];
    var seen = {};
    var i;

    for (i = 0; i < list.length; i++) {
      var value = trim(list[i]);

      if (value.length > 0 && seen[value] == null) {
        seen[value] = true;
        result.push(value);
      }
    }

    return result;
  }

  // schema 字段归一化后，后续 UI 和实例生成都基于统一结构工作。
  function normalizeSchemaField(raw) {
    var field = deps.isObject(raw) ? deps.cloneJson(raw) : {};
    field.id =
      trim(field.id) ||
      (typeof deps.nextItemId === "function" ? deps.nextItemId("field") : "");
    field.path = trim(field.path);
    field.type = normalizeSchemaType(field.type);
    field.required = !!field.required;
    field.enumValues = normalizeEnumOptions(field.enumValues);
    return field;
  }

  function getDefaultSchemaFields() {
    return [
      normalizeSchemaField({ path: "title", type: "string" }),
      normalizeSchemaField({ path: "name", type: "string" }),
      normalizeSchemaField({ path: "code", type: "string" }),
      normalizeSchemaField({ path: "power", type: "string" }),
    ];
  }

  function normalizePortMarker(marker) {
    marker = trim(marker).toLowerCase();

    return marker == "circle" || marker == "hidden" ? marker : "cross";
  }

  function normalizePortDirection(direction) {
    direction = trim(direction).toLowerCase();

    return direction == "left" ||
      direction == "right" ||
      direction == "up" ||
      direction == "down"
      ? direction
      : "any";
  }

  function normalizePortIoMode(mode) {
    mode = trim(mode).toLowerCase();

    return mode == "in" || mode == "out" ? mode : "both";
  }

  function normalizeLabelAlign(align) {
    align = trim(align).toLowerCase();

    return align == "left" || align == "right" ? align : "center";
  }

  function defaultPortPosition(index, count) {
    return count <= 0 ? 0.5 : (index + 1) / (count + 1);
  }

  function normalizePortPoint(raw, fallbackId, fallbackX, fallbackY) {
    var id = fallbackId;
    var x = fallbackX;
    var y = fallbackY;
    var name = "";
    var marker = "cross";
    var direction = "any";
    var ioMode = "both";

    if (deps.isObject(raw)) {
      id = trim(raw.id || raw.key || raw.name) || fallbackId;
      x = deps.toFloat(raw.x, fallbackX);
      y = deps.toFloat(raw.y, fallbackY);
      name = trim(raw.name || raw.label || "");
      marker = normalizePortMarker(raw.marker || raw.style);
      direction = normalizePortDirection(raw.direction || raw.side);
      ioMode = normalizePortIoMode(raw.ioMode || raw.io || raw.mode);
    } else if (typeof raw == "number") {
      y = raw;
    }

    return {
      id,
      x: deps.clamp(x, 0, 1),
      y: deps.clamp(y, 0, 1),
      name,
      marker,
      direction,
      ioMode,
    };
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

  function normalizePortLayout(rawPorts) {
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

    if (!deps.isObject(rawPorts)) {
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

    var leftCount = Math.max(0, deps.toInt(rawPorts.leftCount, 0));
    var rightCount = Math.max(0, deps.toInt(rawPorts.rightCount, 0));

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

  function parsePortLayout(raw) {
    if (raw == null || raw.length == 0) {
      return [];
    }

    try {
      return normalizePortLayout(JSON.parse(raw));
    } catch (e) {
      return [];
    }
  }

  function buildPortLayout(spec, base) {
    var current = normalizePortLayout(spec.ports);
    var fallback = normalizePortLayout(base);

    return current.length > 0 ? current : fallback;
  }

  function getVariantLayout(spec, variantKey) {
    var layouts = normalizeVariantLayouts(spec.variantLayouts);
    var key = trim(variantKey);

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

  function serializePortLayout(layout) {
    return JSON.stringify(normalizePortLayout(layout));
  }

  function hasSchemaPath(schema, path) {
    var parts = trim(path).split(".");
    var current = schema;
    var i;

    if (!deps.isObject(schema) || trim(path).length == 0) {
      return false;
    }

    for (i = 0; i < parts.length; i++) {
      if (!deps.isObject(current) || !current.hasOwnProperty(parts[i])) {
        return false;
      }

      current = current[parts[i]];
    }

    return true;
  }

  function isValidFieldPath(path) {
    var parts = trim(path).split(".");
    var i;

    if (trim(path).length == 0) {
      return false;
    }

    for (i = 0; i < parts.length; i++) {
      if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(parts[i])) {
        return false;
      }
    }

    return true;
  }

  function setValueByPath(target, path, value) {
    var parts = trim(path).split(".");
    var current = target;
    var i;

    for (i = 0; i < parts.length - 1; i++) {
      if (!deps.isObject(current[parts[i]])) {
        current[parts[i]] = {};
      }

      current = current[parts[i]];
    }

    current[parts[parts.length - 1]] = value;
  }

  function buildSchemaFromFields(fields) {
    var schema = {};
    var seen = {};
    var i;

    for (i = 0; i < fields.length; i++) {
      var field = normalizeSchemaField(fields[i]);
      var path = trim(field.path);

      if (path.length == 0) {
        continue;
      }

      if (!isValidFieldPath(path)) {
        throw new Error("字段路径格式不正确");
      }

      if (seen[path]) {
        throw new Error("字段路径不能重复");
      }

      if (field.type == "enum" && field.enumValues.length == 0) {
        throw new Error("枚举类型必须至少提供一个可选值");
      }

      seen[path] = true;
      setValueByPath(schema, path, {
        type: field.type,
        required: !!field.required,
        enumValues: field.enumValues,
      });
    }

    return schema;
  }

  function flattenSchemaFields(schema, prefix, result) {
    var nextPrefix = trim(prefix);
    var key;

    if (!deps.isObject(schema)) {
      return result;
    }

    for (key in schema) {
      if (schema.hasOwnProperty(key)) {
        var path = nextPrefix.length > 0 ? nextPrefix + "." + key : key;
        var value = schema[key];

        if (isSchemaLeafDescriptor(value)) {
          result.push(
            normalizeSchemaField({
              path,
              type: value.type,
              required: value.required,
              enumValues: value.enumValues,
            }),
          );
        } else if (deps.isObject(value)) {
          flattenSchemaFields(value, path, result);
        }
      }
    }

    return result;
  }

  function buildEmptyValueFromSchema(schema) {
    var key;

    if (Array.isArray(schema)) {
      return [];
    }

    if (deps.isObject(schema)) {
      if (isSchemaLeafDescriptor(schema)) {
        switch (normalizeSchemaType(schema.type)) {
          case "number":
            return null;
          case "boolean":
            return null;
          case "enum":
            return "";
          default:
            return "";
        }
      }

      var result = {};

      for (key in schema) {
        if (schema.hasOwnProperty(key)) {
          result[key] = buildEmptyValueFromSchema(schema[key]);
        }
      }

      return result;
    }

    return null;
  }

  function getValueByPath(obj, path) {
    var current = obj;
    var parts = trim(path).split(".");
    var i;

    if (trim(path).length == 0) {
      return null;
    }

    for (i = 0; i < parts.length; i++) {
      if (current == null) {
        return null;
      }

      current = current[parts[i]];
    }

    return current;
  }

  function buildResolvedLabels(labels, instance) {
    var result = [];
    var i;

    for (i = 0; i < labels.length; i++) {
      var item = deps.cloneJson(labels[i]);
      var value = getValueByPath(instance, item.binding);

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

  function getActiveVariantKey(spec) {
    var field = trim(spec.variantField || "");
    var value = trim(getValueByPath(spec.data, field));

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
          ports: normalizePortLayout(entry.ports),
          labels: normalizeLabels(entry.labels),
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
      buildEmptyValueFromSchema(template.schema),
      instanceData,
    );
    var spec = deps.cloneJson(template);
    var nameValue =
      getValueByPath(mergedData, "name") ||
      getValueByPath(mergedData, "device.name");
    var codeValue =
      getValueByPath(mergedData, "code") ||
      getValueByPath(mergedData, "device.code");
    var powerValue =
      getValueByPath(mergedData, "power") ||
      getValueByPath(mergedData, "device.power");
    var modeValue =
      getValueByPath(mergedData, "mode") ||
      getValueByPath(mergedData, "device.mode");
    var titleValue = getValueByPath(mergedData, "title");
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
    spec.labels = buildResolvedLabels(layout.labels, mergedData);

    return normalizeSpec(spec);
  }

  return {
    buildEmptyValueFromSchema,
    buildResolvedLabels,
    buildSchemaFromFields,
    buildInstanceSpec,
    createEmptyTemplateSpec,
    getActiveSvg,
    getActiveVariantKey,
    getDefaultSchemaFields,
    getValueByPath,
    hasSchemaPath,
    isSchemaLeafDescriptor,
    isValidFieldPath,
    flattenSchemaFields,
    getVariantLayout,
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
    buildPortLayout,
    serializePortLayout,
    setValueByPath,
    toStyleImageUri,
    toSvgDataUri,
  };
}
