/**
 * 规格 schema 子模块。
 * 负责字段描述、schema 路径、默认值以及实例数据按路径读写这些纯数据规则。
 */
import { cloneJson, isObject, trim } from "../utils/base.js";

export function isSchemaLeafDescriptor(value) {
  return (
    isObject(value) &&
    typeof value.type === "string" &&
    trim(value.type).length > 0
  );
}

export function normalizeSchemaType(type) {
  type = trim(type).toLowerCase();

  return type == "number" || type == "boolean" || type == "enum"
    ? type
    : "string";
}

export function normalizeEnumOptions(options) {
  var list = Array.isArray(options) ? options : String(options || "").split(",");
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

export function normalizeSchemaField(raw, nextItemId) {
  var field = isObject(raw) ? cloneJson(raw) : {};
  field.id =
    trim(field.id) ||
    (typeof nextItemId === "function" ? nextItemId("field") : "");
  field.path = trim(field.path);
  field.type = normalizeSchemaType(field.type);
  field.required = !!field.required;
  field.enumValues = normalizeEnumOptions(field.enumValues);
  return field;
}

export function getDefaultSchemaFields(nextItemId) {
  return [
    normalizeSchemaField({ path: "title", type: "string" }, nextItemId),
    normalizeSchemaField({ path: "name", type: "string" }, nextItemId),
    normalizeSchemaField({ path: "code", type: "string" }, nextItemId),
    normalizeSchemaField({ path: "power", type: "string" }, nextItemId),
  ];
}

export function hasSchemaPath(schema, path) {
  var parts = trim(path).split(".");
  var current = schema;
  var i;

  if (!isObject(schema) || trim(path).length == 0) {
    return false;
  }

  for (i = 0; i < parts.length; i++) {
    if (!isObject(current) || !current.hasOwnProperty(parts[i])) {
      return false;
    }

    current = current[parts[i]];
  }

  return true;
}

export function isValidFieldPath(path) {
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

export function setValueByPath(target, path, value) {
  var parts = trim(path).split(".");
  var current = target;
  var i;

  for (i = 0; i < parts.length - 1; i++) {
    if (!isObject(current[parts[i]])) {
      current[parts[i]] = {};
    }

    current = current[parts[i]];
  }

  current[parts[parts.length - 1]] = value;
}

export function buildSchemaFromFields(fields, nextItemId) {
  var schema = {};
  var seen = {};
  var i;

  for (i = 0; i < fields.length; i++) {
    var field = normalizeSchemaField(fields[i], nextItemId);
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

export function flattenSchemaFields(schema, prefix, result, nextItemId) {
  var nextPrefix = trim(prefix);
  var key;

  if (!isObject(schema)) {
    return result;
  }

  for (key in schema) {
    if (schema.hasOwnProperty(key)) {
      var path = nextPrefix.length > 0 ? nextPrefix + "." + key : key;
      var value = schema[key];

      if (isSchemaLeafDescriptor(value)) {
        result.push(
          normalizeSchemaField(
            {
              path,
              type: value.type,
              required: value.required,
              enumValues: value.enumValues,
            },
            nextItemId,
          ),
        );
      } else if (isObject(value)) {
        flattenSchemaFields(value, path, result, nextItemId);
      }
    }
  }

  return result;
}

export function buildEmptyValueFromSchema(schema) {
  var key;

  if (Array.isArray(schema)) {
    return [];
  }

  if (isObject(schema)) {
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

export function getValueByPath(obj, path) {
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
