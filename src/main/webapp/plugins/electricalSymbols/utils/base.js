/**
 * 通用基础工具函数。
 * 这里放与业务无关的字符串、数字、对象和 ID 处理函数。
 */
// 统一做空值保护，避免调用方到处判断 null / undefined。
export function trim(value) {
  return value != null ? mxUtils.trim(String(value)) : "";
}

// 仅把普通对象视为可递归合并对象，数组单独处理。
export function isObject(value) {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

// clamp 常用于几何坐标、比例值和尺寸的边界约束。
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function toInt(value, defaultValue) {
  var parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

export function toFloat(value, defaultValue) {
  var parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

export function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

// deepMerge 用于把用户输入覆盖到默认配置上，同时保留嵌套结构。
export function deepMerge(base, value) {
  var key;

  if (Array.isArray(value)) {
    return cloneJson(value);
  }

  if (!isObject(value)) {
    return value != null ? value : base;
  }

  var result = isObject(base) ? cloneJson(base) : {};

  for (key in value) {
    if (value.hasOwnProperty(key)) {
      result[key] = deepMerge(result[key], value[key]);
    }
  }

  return result;
}

// 统一生成适合做标识符的 slug。
export function toSlug(value) {
  return trim(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function stripFileExtension(name) {
  var text = trim(name);
  var index = text.lastIndexOf(".");
  return index > 0 ? text.substring(0, index) : text;
}

// 生成 UUID 时优先使用浏览器原生实现，降级时再走随机串。
export function generateUuid() {
  if (
    typeof crypto !== "undefined" &&
    crypto != null &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
    /[xy]/g,
    function (ch) {
      var rand = (Math.random() * 16) | 0;
      var next = ch == "x" ? rand : (rand & 0x3) | 0x8;
      return next.toString(16);
    },
  );
}

export function uniqueStrings(values) {
  var result = [];
  var seen = {};
  var i;

  for (i = 0; Array.isArray(values) && i < values.length; i++) {
    var value = trim(values[i]);

    if (value.length > 0 && seen[value] == null) {
      seen[value] = true;
      result.push(value);
    }
  }

  return result;
}

// 兼容旧的工厂调用方式，便于边重构边过渡到直接 import/export。
export function createBaseUtils() {
  return {
    clamp,
    cloneJson,
    deepMerge,
    generateUuid,
    isObject,
    stripFileExtension,
    toFloat,
    toInt,
    toSlug,
    trim,
    uniqueStrings,
  };
}
