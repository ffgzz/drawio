/**
 * 规格 schema 子模块。
 * 负责字段描述、schema 路径、默认值以及实例数据按路径读写这些纯数据规则。
 */
export function createSpecSchemaModule(deps) {
  var trim = deps.trim;

  function isSchemaLeafDescriptor(value) {
    return (
      deps.isObject(value) &&
      typeof value.type === "string" &&
      trim(value.type).length > 0
    );
  }

  function normalizeSchemaType(type) {
    type = trim(type).toLowerCase();

    return type == "number" || type == "boolean" || type == "enum"
      ? type
      : "string";
  }

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

  return {
    buildEmptyValueFromSchema,
    buildSchemaFromFields,
    flattenSchemaFields,
    getDefaultSchemaFields,
    getValueByPath,
    hasSchemaPath,
    isSchemaLeafDescriptor,
    isValidFieldPath,
    normalizeEnumOptions,
    normalizeSchemaField,
    normalizeSchemaType,
    setValueByPath,
  };
}
