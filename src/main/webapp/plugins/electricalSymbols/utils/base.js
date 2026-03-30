export function createBaseUtils() {
  function trim(value) {
    return value != null ? mxUtils.trim(String(value)) : "";
  }

  function isObject(value) {
    return value != null && typeof value === "object" && !Array.isArray(value);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function toInt(value, defaultValue) {
    var parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  function toFloat(value, defaultValue) {
    var parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  function cloneJson(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function deepMerge(base, value) {
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

  function toSlug(value) {
    return trim(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function stripFileExtension(name) {
    var text = trim(name);
    var index = text.lastIndexOf(".");
    return index > 0 ? text.substring(0, index) : text;
  }

  function generateUuid() {
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

  function uniqueStrings(values) {
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

  return {
    clamp: clamp,
    cloneJson: cloneJson,
    deepMerge: deepMerge,
    generateUuid: generateUuid,
    isObject: isObject,
    stripFileExtension: stripFileExtension,
    toFloat: toFloat,
    toInt: toInt,
    toSlug: toSlug,
    trim: trim,
    uniqueStrings: uniqueStrings,
  };
}
