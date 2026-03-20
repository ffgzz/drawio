Draw.loadPlugin(function (ui) {
  // 当前 draw.io 编辑器里的核心图对象
  var graph = ui.editor.graph;
  // graph 底层的数据模型
  var model = graph.getModel();
  // 统一定义插件里会用到的节点标签和类型，避免字符串散落在各处
  var LIBRARY_TITLE = "电气图元库";
  var ROOT_TAG = "ElectricalSymbol";
  var BODY_TAG = "ElectricalBody";
  var LABEL_TAG = "ElectricalLabel";
  var BADGE_TAG = "ElectricalBadge";
  var FRAME_TAG = "DrawingFrame";
  var FRAME_LABEL_TAG = "DrawingFrameLabel";
  var CABINET_TAG = "CabinetSegment";
  var CABINET_BODY_TAG = "CabinetBody";
  var CABINET_GAP_TAG = "CabinetGap";
  var ROOT_TYPE = "electricalSymbol";
  var FRAME_TYPE = "drawingFrame";
  var CABINET_TYPE = "cabinetSegment";
  var CABINET_GAP_TYPE = "cabinetGap";
  var BODY_KIND = "body";
  var LABEL_KIND = "label";
  var BADGE_KIND = "badge";
  var FRAME_LABEL_KIND = "pageLabel";
  var CABINET_BODY_KIND = "cabinetBody";
  var CABINET_GAP_KIND = "cabinetGap";
  // 预览区新增连接点时，距离边缘多近算“想吸附到边上”。
  var PORT_EDGE_SNAP_THRESHOLD_PX = 14;
  var TEMPLATE_DRAFT_STORAGE_KEY = "electrical-symbol-template-draft";
  var FRAME_DEFAULT_WIDTH = 820;
  var FRAME_DEFAULT_HEIGHT = 1180;
  var FRAME_HORIZONTAL_GAP = 40;
  var FRAME_VERTICAL_GAP = 56;
  var FRAME_CONTENT_RATIO = 0.8;
  var FRAME_MARGIN_RATIO = 0.1;
  var CABINET_DEFAULT_WIDTH = 86;
  var CABINET_DEFAULT_PORT_COUNT = 4;
  var CABINET_DEFAULT_X = 72;
  var CABINET_TAIL_PADDING = 24;
  var CABINET_MIN_PORT_FOLLOW_SPACE_RATIO = 0.24;
  // 保存插件窗口和运行期缓存
  var state = {
    libraryImages: [],
    updatingModel: false,
    window: null,
    templatesWindow: null,
    instanceWindow: null,
    status: null,
    symbolIdInput: null,
    symbolIdTouched: false,
    templateNameInput: null,
    templateWidthInput: null,
    templateHeightInput: null,
    variantFieldInput: null,
    variantEnabled: false,
    lastValidVariantField: "",
    schemaFields: [],
    preview: null,
    currentSpec: null,
    previewMode: "select",
    previewVariantId: "",
    selectedItem: null,
    nextId: 1,
    uploadedPrimarySvg: "",
    uploadedPrimarySvgName: "",
    uploadedPrimarySvgSize: null,
    variantItems: [],
    draftSaveTimer: null,
    frameConfig: null,
    selectedCabinetGap: null,
    gapDialogWindow: null,
    portSwapSession: null,
    portSwapOverlay: null,
    allowProtectedDelete: false,
  };

  mxResources.parse(
    [
      "electricalSymbols=定义电气图元",
      "electricalBrowse=已定义图元",
      "electricalCreate=创建电气图元",
      "electricalEditInstance=编辑图元实例",
      "electricalRefresh=刷新电气图元",
      "electricalExportSvg=导出SVG",
      "electricalInsertFrame=插入图框",
      "electricalInsertCabinet=插入配电柜",
      "electricalReassignPort=更换挂点",
      "electricalPreview=刷新预览",
      "electricalAddLibrary=加入库",
      "electricalExportLibrary=导出库",
      "electricalClearScreen=清屏",
      "electricalUploadPrimarySvg=上传默认SVG",
      "electricalEnableVariants=启用变体SVG",
      "electricalAddVariantSvg=新增变体SVG",
    ].join("\n"),
  );

  // 把任意输入安全转成去首尾空格的字符串
  function trim(value) {
    return value != null ? mxUtils.trim(String(value)) : "";
  }

  // 判断值是否为普通对象，用来保护 JSON 结构解析
  function isObject(value) {
    return value != null && typeof value === "object" && !Array.isArray(value);
  }

  function isSchemaLeafDescriptor(value) {
    return (
      isObject(value) &&
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
    var field = isObject(raw) ? cloneJson(raw) : {};
    field.id = trim(field.id) || nextItemId("field");
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

  // 把数值限制在给定区间内
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  // 把输入转成整数，失败时回退到默认值
  function toInt(value, defaultValue) {
    var parsed = parseInt(value, 10);

    return isNaN(parsed) ? defaultValue : parsed;
  }

  // 把输入转成浮点数，失败时回退到默认值
  function toFloat(value, defaultValue) {
    var parsed = parseFloat(value);

    return isNaN(parsed) ? defaultValue : parsed;
  }

  // 深拷贝 JSON 兼容数据，避免后续修改原对象
  function cloneJson(value) {
    return JSON.parse(JSON.stringify(value));
  }

  // 创建一个新的 XML 元素节点，作为 mxCell.value 使用
  function createNode(tagName) {
    return mxUtils.createXmlDocument().createElement(tagName);
  }

  // 克隆已有的 value 节点；如果没有，就创建一个新的根节点
  function cloneValue(node) {
    if (node != null && node.nodeType == mxConstants.NODETYPE_ELEMENT) {
      return node.cloneNode(true);
    }

    return createNode(ROOT_TAG);
  }

  // 读取 mxCell.value XML 上的属性，屏蔽空值和非元素节点情况
  function getAttr(cell, name) {
    return cell != null &&
      cell.value != null &&
      cell.value.nodeType == mxConstants.NODETYPE_ELEMENT
      ? cell.value.getAttribute(name)
      : null;
  }

  // 判断一个 cell 是否是电气图元根节点
  function isElectricalRoot(cell) {
    return getAttr(cell, "pluginType") == ROOT_TYPE;
  }

  // 从任意子节点向上查找所属的电气图元根节点
  function findElectricalRoot(cell) {
    while (cell != null) {
      if (isElectricalRoot(cell)) {
        return cell;
      }

      cell = model.getParent(cell);
    }

    return null;
  }

  function isDrawingFrame(cell) {
    return getAttr(cell, "pluginType") == FRAME_TYPE;
  }

  function findDrawingFrame(cell) {
    while (cell != null) {
      if (isDrawingFrame(cell)) {
        return cell;
      }

      cell = model.getParent(cell);
    }

    return null;
  }

  function isCabinetSegment(cell) {
    return getAttr(cell, "pluginType") == CABINET_TYPE;
  }

  function findCabinetSegment(cell) {
    while (cell != null) {
      if (isCabinetSegment(cell)) {
        return cell;
      }

      cell = model.getParent(cell);
    }

    return null;
  }

  function isCabinetGap(cell) {
    return getAttr(cell, "pluginType") == CABINET_GAP_TYPE;
  }

  function isPortHostRoot(cell) {
    return isElectricalRoot(cell) || isCabinetSegment(cell);
  }

  function findPortHostRoot(cell) {
    while (cell != null) {
      if (isPortHostRoot(cell)) {
        return cell;
      }

      cell = model.getParent(cell);
    }

    return null;
  }

  // 校验传入的 svg 文本是否合法，并返回规范化后的根节点 XML
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

  function normalizeMode(mode) {
    mode = trim(mode).toLowerCase();

    return mode == "primary" || mode == "standby" ? mode : "";
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

  function normalizeGapRatio(value, fallbackValue) {
    return clamp(
      toFloat(value, fallbackValue != null ? fallbackValue : 0.12),
      0,
      1,
    );
  }

  function normalizeFrameConfig(raw) {
    raw = isObject(raw) ? raw : {};

    return {
      width: Math.max(320, toInt(raw.width, FRAME_DEFAULT_WIDTH)),
      height: Math.max(240, toInt(raw.height, FRAME_DEFAULT_HEIGHT)),
    };
  }

  function normalizeCabinetPort(raw, index) {
    var base = normalizePortPoint(
      raw,
      trim(raw != null ? raw.id : "") || "cabinet-port:" + index,
      1,
      0,
    );

    base.direction = "right";
    // 配电柜右侧端子只允许接出，不允许接入。
    base.ioMode = "out";
    base.order = index;
    return base;
  }

  function normalizeCabinetModel(raw) {
    raw = isObject(raw) ? cloneJson(raw) : {};
    var portCount = Math.max(
      2,
      Array.isArray(raw.ports)
        ? raw.ports.length
        : toInt(raw.portCount, CABINET_DEFAULT_PORT_COUNT),
    );
    var ports = [];
    var i;

    if (Array.isArray(raw.ports) && raw.ports.length > 0) {
      for (i = 0; i < raw.ports.length; i++) {
        ports.push(normalizeCabinetPort(raw.ports[i], i));
      }
    } else {
      for (i = 0; i < portCount; i++) {
        ports.push(
          normalizeCabinetPort(
            {
              id: "cabinet-port:" + i,
              x: 1,
              y: 0,
              marker: "cross",
              direction: "right",
              ioMode: "out",
            },
            i,
          ),
        );
      }
    }

    var gapRatios = [];

    for (i = 0; i < Math.max(0, ports.length - 1); i++) {
      gapRatios.push(
        normalizeGapRatio(
          Array.isArray(raw.gapRatios) ? raw.gapRatios[i] : null,
          0.12,
        ),
      );
    }

    return {
      logicalCabinetId:
        trim(raw.logicalCabinetId) || generateLogicalCabinetId(),
      originFrameId: trim(raw.originFrameId),
      title: trim(raw.title) || "配电柜",
      cabinetWidth: Math.max(
        30,
        toInt(raw.cabinetWidth, CABINET_DEFAULT_WIDTH),
      ),
      cabinetX: Math.max(20, toInt(raw.cabinetX, CABINET_DEFAULT_X)),
      tailPadding: Math.max(8, toInt(raw.tailPadding, CABINET_TAIL_PADDING)),
      ports: ports,
      gapRatios: gapRatios,
    };
  }

  function extractSvgSize(svg) {
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

  // 把任意文本转成适合 symbolId 的短横线标识。
  function toSlug(value) {
    var slug = trim(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    return slug;
  }

  // 从文件名中去掉扩展名，避免 symbolId 带上 .svg 这类后缀噪音。
  function stripFileExtension(name) {
    var text = trim(name);
    var index = text.lastIndexOf(".");

    return index > 0 ? text.substring(0, index) : text;
  }

  // 优先使用浏览器原生 UUID，旧环境再回退到随机生成器。
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
        var value = ch == "x" ? rand : (rand & 0x3) | 0x8;
        return value.toString(16);
      },
    );
  }

  // 生成模板级唯一标识，同一种图元后续实例都复用这个 symbolId。
  function generateSymbolId(seed) {
    var base = toSlug(stripFileExtension(seed)) || "electrical-symbol";
    var shortUuid = generateUuid().split("-")[0];

    return base + "-" + shortUuid;
  }

  // 生成画布实例级唯一标识，避免同一模板多次插入时冲突。
  function generateInstanceId() {
    return generateUuid();
  }

  function generateFrameId() {
    return generateUuid();
  }

  function generateFrameGroupId() {
    return generateUuid();
  }

  function generateLogicalCabinetId() {
    return generateUuid();
  }

  function isIdentifierKey(key) {
    return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key);
  }

  function formatTypeDefinitionValue(value, indent) {
    indent = indent || 0;
    var pad = new Array(indent + 1).join(" ");
    var childPad = new Array(indent + 3).join(" ");
    var key;
    var lines;

    if (isObject(value)) {
      lines = ["{"];

      for (key in value) {
        if (value.hasOwnProperty(key)) {
          lines.push(
            childPad +
              (isIdentifierKey(key) ? key : JSON.stringify(key)) +
              ": " +
              formatTypeDefinitionValue(value[key], indent + 2) +
              ",",
          );
        }
      }

      lines.push(pad + "}");
      return lines.join("\n");
    }

    if (Array.isArray(value)) {
      return "array";
    }

    if (typeof value === "string" && isIdentifierKey(value)) {
      return value;
    }

    if (value === null) {
      return "nullType";
    }

    return JSON.stringify(value);
  }

  function formatTypeDefinition(schema) {
    return formatTypeDefinitionValue(schema, 0);
  }

  // 校验 schema 中是否存在给定路径，变体字段只能引用用户已经定义好的字段。
  function hasSchemaPath(schema, path) {
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

  // 启用变体时，要求变体字段必须已经存在于类型定义里。
  function validateVariantField(showError) {
    if (!state.variantEnabled) {
      return "";
    }

    var field = trim(
      state.variantFieldInput != null ? state.variantFieldInput.value : "",
    );

    if (field.length == 0) {
      if (showError) {
        showStatus("请先填写变体字段", true);
      }

      return null;
    }

    try {
      var schema = getEditorSchema();

      if (!isObject(schema)) {
        throw new Error("类型定义必须是对象");
      }

      if (!hasSchemaPath(schema, field)) {
        if (showError) {
          showStatus("变体字段必须先在 JSON 类型定义中声明", true);
        }

        return null;
      }

      return field;
    } catch (e) {
      if (showError) {
        showStatus(e.message || "类型定义格式有误", true);
      }

      return null;
    }
  }

  // 统一把当前变体条目列表收集成 svgVariants 对象。
  function collectVariantMap() {
    var variants = {};
    var i;

    if (!state.variantEnabled) {
      return variants;
    }

    for (i = 0; i < state.variantItems.length; i++) {
      var item = state.variantItems[i];
      var key = trim(item.key);

      if (key.length > 0 && trim(item.svg).length > 0) {
        variants[key] = item.svg;
      }
    }

    return variants;
  }

  // 当前编辑中的变体条目列表会分别保存自己的连接点和文本框布局。
  function collectVariantLayouts() {
    var layouts = {};
    var i;

    if (!state.variantEnabled) {
      return layouts;
    }

    for (i = 0; i < state.variantItems.length; i++) {
      var item = state.variantItems[i];
      var key = trim(item.key);

      if (key.length == 0) {
        continue;
      }

      layouts[key] = {
        ports: normalizePortLayout(item.ports),
        labels: normalizeLabels(item.labels),
      };
    }

    return layouts;
  }

  // 变体 key 必须唯一，避免同一个属性值映射到多张 SVG。
  function hasVariantKey(key, ignoreId) {
    var normalized = trim(key);
    var i;

    if (normalized.length == 0) {
      return false;
    }

    for (i = 0; i < state.variantItems.length; i++) {
      if (
        state.variantItems[i].id != ignoreId &&
        trim(state.variantItems[i].key) == normalized
      ) {
        return true;
      }
    }

    return false;
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
      if (!isObject(current[parts[i]])) {
        current[parts[i]] = {};
      }

      current = current[parts[i]];
    }

    current[parts[parts.length - 1]] = value;
  }

  function buildSchemaFromFields(fields) {
    var schema = {};
    var i;
    var seen = {};

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
    var key;
    var nextPrefix = trim(prefix);

    if (!isObject(schema)) {
      return result;
    }

    for (key in schema) {
      if (schema.hasOwnProperty(key)) {
        var path = nextPrefix.length > 0 ? nextPrefix + "." + key : key;
        var value = schema[key];

        if (isSchemaLeafDescriptor(value)) {
          result.push(
            normalizeSchemaField({
              path: path,
              type: value.type,
              required: value.required,
              enumValues: value.enumValues,
            }),
          );
        } else if (isObject(value)) {
          flattenSchemaFields(value, path, result);
        }
      }
    }

    return result;
  }

  function getEditorSchema() {
    return buildSchemaFromFields(state.schemaFields || []);
  }

  function buildEmptyValueFromSchema(schema) {
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
      var item = cloneJson(labels[i]);
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

  function normalizeVariantLayouts(raw) {
    var result = {};
    var key;

    if (!isObject(raw)) {
      return result;
    }

    for (key in raw) {
      if (raw.hasOwnProperty(key) && trim(key).length > 0) {
        var entry = isObject(raw[key]) ? raw[key] : {};
        result[trim(key)] = {
          ports: normalizePortLayout(entry.ports),
          labels: normalizeLabels(entry.labels),
        };
      }
    }

    return result;
  }

  // 把外部 JSON 规范化成统一的数据结构
  // 这里会做默认值填充、字段裁剪和 svg 校验
  function normalizeSpec(raw) {
    if (!isObject(raw)) {
      throw new Error("JSON 根节点必须是对象");
    }

    var device = isObject(raw.device) ? raw.device : {};
    var ports = raw.ports;
    var variants = isObject(raw.svgVariants) ? raw.svgVariants : {};
    var size = isObject(raw.size) ? raw.size : {};
    var params = isObject(device.params) ? cloneJson(device.params) : {};
    var schema = isObject(raw.schema) ? cloneJson(raw.schema) : {};
    var data = isObject(raw.data) ? cloneJson(raw.data) : {};
    var variantField = trim(raw.variantField || "");
    var spec = {
      symbolId: trim(raw.symbolId) || generateSymbolId("symbol"),
      templateName:
        trim(raw.templateName) ||
        trim(raw.title) ||
        trim(device.name) ||
        "电气图元",
      title: trim(raw.title) || trim(device.name) || "电气图元",
      svg: validateSvg(raw.svg),
      size: {
        width: Math.max(20, toInt(size.width, 120)),
        height: Math.max(20, toInt(size.height, 80)),
      },
      device: {
        name: trim(device.name),
        code: trim(device.code),
        power: trim(device.power),
        mode: normalizeMode(device.mode),
        params: params,
      },
      ports: normalizePortLayout(ports),
      labels: normalizeLabels(raw.labels),
      schema: schema,
      data: data,
      variantField: variantField,
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
        spec.svgVariants[trim(variantKey)] = validateSvg(variants[variantKey]);
      }
    }

    return spec;
  }

  // 根据 mode 和 svgVariants 选出当前真正要渲染的 svg
  function getActiveVariantKey(spec) {
    var field = trim(spec.variantField || "");
    var value = trim(getValueByPath(spec.data, field));

    if (value.length == 0 && field == "mode") {
      value = trim(spec.device.mode);
    }

    return value;
  }

  // 根据实例中的变体字段和值，选出当前真正要渲染的 svg
  function getActiveSvg(spec) {
    var variantKey = getActiveVariantKey(spec);

    if (variantKey.length > 0 && spec.svgVariants[variantKey] != null) {
      return spec.svgVariants[variantKey];
    }

    return spec.svg;
  }

  // 生成预览区使用的 svg data uri。
  // 这里故意和 mxCell.style 里的 image 使用同一套原始 SVG 编码方式，
  // 避免预览与画布对 viewBox/留白的处理不一致，导致连接点位置看起来偏移。
  function toSvgDataUri(spec) {
    return "data:image/svg+xml," + encodeURIComponent(getActiveSvg(spec));
  }

  // 生成写入 mxCell.style 的 image data uri
  function toStyleImageUri(spec) {
    return "data:image/svg+xml," + encodeURIComponent(getActiveSvg(spec));
  }

  // 统一更新弹窗底部状态栏颜色和文案
  function showStatus(message, isError) {
    if (state.status != null) {
      state.status.style.color = isError ? "#b3261e" : "#2e7d32";
      state.status.innerText = message || "";
    }
  }

  function getDraftStorage() {
    try {
      return window.localStorage;
    } catch (e) {
      return null;
    }
  }

  function clearDraftSaveTimer() {
    if (state.draftSaveTimer != null) {
      window.clearTimeout(state.draftSaveTimer);
      state.draftSaveTimer = null;
    }
  }

  function buildEditorDraftSnapshot() {
    return {
      symbolId:
        state.symbolIdInput != null ? trim(state.symbolIdInput.value) : "",
      symbolIdTouched: !!state.symbolIdTouched,
      templateName:
        state.templateNameInput != null
          ? trim(state.templateNameInput.value)
          : "",
      templateWidth:
        state.templateWidthInput != null
          ? trim(state.templateWidthInput.value)
          : "",
      templateHeight:
        state.templateHeightInput != null
          ? trim(state.templateHeightInput.value)
          : "",
      uploadedPrimarySvg: state.uploadedPrimarySvg || "",
      uploadedPrimarySvgName: state.uploadedPrimarySvgName || "",
      uploadedPrimarySvgSize: state.uploadedPrimarySvgSize || null,
      variantEnabled: !!state.variantEnabled,
      variantField:
        state.variantFieldInput != null
          ? trim(state.variantFieldInput.value)
          : "",
      previewVariantId: trim(state.previewVariantId),
      schemaFields: cloneJson(state.schemaFields || []),
      variantItems: cloneJson(state.variantItems || []),
      currentSpec:
        state.currentSpec != null ? cloneJson(state.currentSpec) : null,
    };
  }

  function saveEditorDraftNow() {
    var storage = getDraftStorage();

    clearDraftSaveTimer();

    if (storage == null) {
      return;
    }

    try {
      storage.setItem(
        TEMPLATE_DRAFT_STORAGE_KEY,
        JSON.stringify(buildEditorDraftSnapshot()),
      );
    } catch (e) {
      // ignore storage quota / privacy errors
    }
  }

  function scheduleEditorDraftSave() {
    clearDraftSaveTimer();
    state.draftSaveTimer = window.setTimeout(saveEditorDraftNow, 180);
  }

  function loadEditorDraft() {
    var storage = getDraftStorage();
    var raw;

    if (storage == null) {
      return null;
    }

    try {
      raw = storage.getItem(TEMPLATE_DRAFT_STORAGE_KEY);
    } catch (e) {
      return null;
    }

    if (trim(raw).length == 0) {
      return null;
    }

    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function clearEditorDraft() {
    var storage = getDraftStorage();

    clearDraftSaveTimer();

    if (storage == null) {
      return;
    }

    try {
      storage.removeItem(TEMPLATE_DRAFT_STORAGE_KEY);
    } catch (e) {
      // ignore storage errors
    }
  }

  function setCanvasStatus(message) {
    var text = trim(message);

    if (text.length == 0) {
      if (typeof ui.clearStatus === "function") {
        ui.clearStatus();
      }

      return;
    }

    if (typeof ui.updateStatus === "function") {
      ui.updateStatus(function () {
        ui.editor.setStatus(mxUtils.htmlEntities(text));

        if (typeof ui.setStatusText === "function") {
          ui.setStatusText(ui.editor.getStatus());
        }
      });
    } else if (ui.editor != null && typeof ui.editor.setStatus === "function") {
      ui.editor.setStatus(mxUtils.htmlEntities(text));
    }
  }

  function buildTemplateSpec() {
    if (trim(state.uploadedPrimarySvg).length == 0) {
      throw new Error("请先上传默认SVG");
    }

    var schema = getEditorSchema();

    if (!isObject(schema)) {
      throw new Error("类型定义必须是对象");
    }

    var current = state.currentSpec || {};
    var symbolId = trim(
      state.symbolIdInput != null ? state.symbolIdInput.value : "",
    );
    var templateName = trim(
      state.templateNameInput != null ? state.templateNameInput.value : "",
    );

    if (symbolId.length == 0) {
      throw new Error("请先填写图元类型ID");
    }

    if (templateName.length == 0) {
      throw new Error("请先填写图元类型名称");
    }

    var variantField = "";

    if (state.variantEnabled) {
      variantField = validateVariantField(true);

      if (variantField == null) {
        throw new Error("变体字段必须先在 JSON 类型定义中声明");
      }
    }

    var baseSize =
      state.uploadedPrimarySvgSize ||
      extractSvgSize(state.uploadedPrimarySvg);

    return normalizeSpec({
      symbolId: symbolId,
      templateName: templateName,
      title: trim(current.title) || templateName,
      svg: state.uploadedPrimarySvg,
      size: {
        width: Math.max(
          20,
          toInt(
            state.templateWidthInput != null
              ? state.templateWidthInput.value
              : null,
            baseSize.width,
          ),
        ),
        height: Math.max(
          20,
          toInt(
            state.templateHeightInput != null
              ? state.templateHeightInput.value
              : null,
            baseSize.height,
          ),
        ),
      },
      device: current.device || {},
      ports: current.ports || [],
      labels: current.labels || [],
      schema: schema,
      data: current.data || {},
      variantField: variantField,
      svgVariants: collectVariantMap(),
      variantLayouts: collectVariantLayouts(),
    });
  }

  // 从编辑区读取当前“图元模板”：类型定义来自上方文本框，图形与交互结果来自内存状态。
  function getSpecFromEditor() {
    return buildTemplateSpec();
  }

  function nextItemId(prefix) {
    var id = prefix + ":" + state.nextId;
    state.nextId += 1;
    return id;
  }

  function findPort(spec, id) {
    var i;

    for (i = 0; i < spec.ports.length; i++) {
      if (spec.ports[i].id == id) {
        return spec.ports[i];
      }
    }

    return null;
  }

  function findLabel(spec, id) {
    var i;

    for (i = 0; i < spec.labels.length; i++) {
      if (spec.labels[i].id == id) {
        return spec.labels[i];
      }
    }

    return null;
  }

  // 文本框绑定属性必须唯一，同一个字段不允许重复挂多个文本框。
  function hasLabelBinding(spec, binding, ignoreId) {
    var normalized = trim(binding);
    var i;

    if (normalized.length == 0) {
      return false;
    }

    for (i = 0; i < spec.labels.length; i++) {
      if (
        spec.labels[i].id != ignoreId &&
        trim(spec.labels[i].binding) == normalized
      ) {
        return true;
      }
    }

    return false;
  }

  function findVariantItem(id) {
    var i;

    for (i = 0; i < state.variantItems.length; i++) {
      if (state.variantItems[i].id == id) {
        return state.variantItems[i];
      }
    }

    return null;
  }

  function getPreviewLayoutStore(spec) {
    if (state.previewVariantId != null && state.previewVariantId.length > 0) {
      var variantItem = findVariantItem(state.previewVariantId);

      if (variantItem != null) {
        variantItem.ports = normalizePortLayout(variantItem.ports);
        variantItem.labels = normalizeLabels(variantItem.labels);
        return variantItem;
      }
    }

    spec.ports = normalizePortLayout(spec.ports);
    spec.labels = normalizeLabels(spec.labels);
    return spec;
  }

  function getPreviewSvg(spec) {
    var variantItem =
      state.previewVariantId != null && state.previewVariantId.length > 0
        ? findVariantItem(state.previewVariantId)
        : null;

    if (variantItem != null && trim(variantItem.svg).length > 0) {
      return "data:image/svg+xml," + encodeURIComponent(variantItem.svg);
    }

    return toSvgDataUri(spec);
  }

  function getPreviewTitle(spec) {
    var variantItem =
      state.previewVariantId != null && state.previewVariantId.length > 0
        ? findVariantItem(state.previewVariantId)
        : null;

    if (variantItem != null) {
      return trim(variantItem.key).length > 0
        ? spec.title + " [" + trim(variantItem.key) + "]"
        : spec.title + " [未命名变体]";
    }

    return spec.title;
  }

  function getPreviewMetrics(spec, surface) {
    var surfaceWidth = Math.max(200, surface.clientWidth || 520);
    var surfaceHeight = Math.max(200, surface.clientHeight || 260);
    var padding = 52;
    var scale = Math.min(
      (surfaceWidth - padding * 2) / spec.size.width,
      (surfaceHeight - padding * 2) / spec.size.height,
    );

    scale = clamp(scale, 0.35, 2.5);

    var width = spec.size.width * scale;
    var height = spec.size.height * scale;

    return {
      left: Math.round((surfaceWidth - width) / 2),
      top: Math.round((surfaceHeight - height) / 2),
      width: width,
      height: height,
      scale: scale,
    };
  }

  function getRelativePoint(evt, surface, metrics, clampToBody) {
    var rect = surface.getBoundingClientRect();
    var x = (evt.clientX - rect.left - metrics.left) / metrics.width;
    var y = (evt.clientY - rect.top - metrics.top) / metrics.height;

    return {
      x: clampToBody ? clamp(x, 0, 1) : clamp(x, -1.5, 2.5),
      y: clampToBody ? clamp(y, 0, 1) : clamp(y, -1.5, 2.5),
    };
  }

  // 新增连接点时，如果点击位置已经很靠近图元边缘，就自动吸附到其最近的边上。
  // 阈值按像素换算成相对坐标，避免不同尺寸 SVG 下吸附手感不一致。
  function snapPortPointToEdge(point, metrics) {
    var thresholdX = PORT_EDGE_SNAP_THRESHOLD_PX / Math.max(1, metrics.width);
    var thresholdY = PORT_EDGE_SNAP_THRESHOLD_PX / Math.max(1, metrics.height);
    var distances = [];

    if (point.x <= thresholdX) {
      distances.push({ edge: "left", distance: point.x });
    }

    if (1 - point.x <= thresholdX) {
      distances.push({ edge: "right", distance: 1 - point.x });
    }

    if (point.y <= thresholdY) {
      distances.push({ edge: "top", distance: point.y });
    }

    if (1 - point.y <= thresholdY) {
      distances.push({ edge: "bottom", distance: 1 - point.y });
    }

    if (distances.length == 0) {
      return point;
    }

    distances.sort(function (a, b) {
      return a.distance - b.distance;
    });

    var snapped = {
      x: point.x,
      y: point.y,
    };

    if (distances[0].edge == "left") {
      snapped.x = 0;
    } else if (distances[0].edge == "right") {
      snapped.x = 1;
    } else if (distances[0].edge == "top") {
      snapped.y = 0;
    } else if (distances[0].edge == "bottom") {
      snapped.y = 1;
    }

    return snapped;
  }

  function updateSelectedItem(type, id) {
    state.selectedItem =
      type != null && id != null ? { type: type, id: id } : null;
  }

  function deleteSelectedItem() {
    if (state.currentSpec == null || state.selectedItem == null) {
      return;
    }

    var next = cloneJson(state.currentSpec);
    var layout = getPreviewLayoutStore(next);

    if (state.selectedItem.type == "port") {
      layout.ports = layout.ports.filter(function (item) {
        return item.id != state.selectedItem.id;
      });
    } else if (state.selectedItem.type == "label") {
      layout.labels = layout.labels.filter(function (item) {
        return item.id != state.selectedItem.id;
      });
    }

    state.currentSpec = normalizeSpec(next);
    updateSelectedItem(null, null);
    updatePreview(state.currentSpec);
  }

  // 预览区是一个轻量交互编辑面板
  // 用户可以直接在这里添加/拖动连接点和文本框，修改会实时写回 JSON
  function updatePreview(spec) {
    state.preview.innerHTML = "";

    if (spec == null || trim(spec.svg).length == 0) {
      var empty = document.createElement("div");
      empty.style.height = "100%";
      empty.style.display = "flex";
      empty.style.alignItems = "center";
      empty.style.justifyContent = "center";
      empty.style.color = Editor.isDarkMode() ? "#c0c4cc" : "#57606a";
      empty.innerText = "请先上传默认SVG，再在这里添加连接点和文本框";
      state.preview.appendChild(empty);
      scheduleEditorDraftSave();
      return;
    }

    state.currentSpec = normalizeSpec(spec);
    scheduleEditorDraftSave();
    var layoutStore = getPreviewLayoutStore(state.currentSpec);
    var selectedId = state.selectedItem != null ? state.selectedItem.id : null;
    var selectedType =
      state.selectedItem != null ? state.selectedItem.type : null;

    if (
      (selectedType == "port" &&
        findPort({ ports: layoutStore.ports }, selectedId) == null) ||
      (selectedType == "label" &&
        findLabel({ labels: layoutStore.labels }, selectedId) == null)
    ) {
      updateSelectedItem(null, null);
    }

    var toolbar = document.createElement("div");
    toolbar.style.display = "flex";
    toolbar.style.alignItems = "center";
    toolbar.style.padding = "8px";
    toolbar.style.gap = "8px";
    toolbar.style.borderBottom = "1px solid #d0d7de";
    state.preview.appendChild(toolbar);

    function createModeButton(mode, label) {
      var btn = createButton(label, function () {
        state.previewMode = mode;
        updatePreview(state.currentSpec);
      });
      btn.style.marginTop = "0";
      btn.style.marginRight = "0";
      btn.style.padding = "4px 10px";
      if (state.previewMode == mode) {
        btn.style.borderColor = "#1a73e8";
        btn.style.color = "#1a73e8";
      }
      return btn;
    }

    toolbar.appendChild(createModeButton("select", "选择"));
    toolbar.appendChild(createModeButton("port", "添加连接点"));
    toolbar.appendChild(createModeButton("label", "添加文本框"));

    if (state.variantEnabled && state.variantItems.length > 0) {
      var previewSelect = document.createElement("select");
      previewSelect.style.marginLeft = "8px";
      previewSelect.style.maxWidth = "180px";
      var defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.innerText = "编辑默认SVG";
      previewSelect.appendChild(defaultOption);

      for (var p = 0; p < state.variantItems.length; p++) {
        var previewItem = state.variantItems[p];
        var option = document.createElement("option");
        option.value = previewItem.id;
        option.innerText =
          trim(previewItem.key).length > 0
            ? "编辑变体：" + trim(previewItem.key)
            : "编辑未命名变体";
        previewSelect.appendChild(option);
      }

      previewSelect.value = state.previewVariantId || "";
      mxEvent.addListener(previewSelect, "change", function () {
        state.previewVariantId = previewSelect.value || "";
        updateSelectedItem(null, null);
        updatePreview(state.currentSpec);
      });
      toolbar.appendChild(previewSelect);
    }

    var deleteBtn = createButton("删除选中", function () {
      deleteSelectedItem();
    });
    deleteBtn.style.marginTop = "0";
    deleteBtn.style.marginRight = "0";
    deleteBtn.style.padding = "4px 10px";
    toolbar.appendChild(deleteBtn);

    if (state.selectedItem != null && state.selectedItem.type == "port") {
      var selectedPort = findPort(
        { ports: layoutStore.ports },
        state.selectedItem.id,
      );

      if (selectedPort != null) {
        var portEditor = document.createElement("div");
        portEditor.style.display = "flex";
        portEditor.style.alignItems = "center";
        portEditor.style.gap = "8px";
        portEditor.style.padding = "8px";
        portEditor.style.borderBottom = "1px solid #d0d7de";
        state.preview.appendChild(portEditor);

        var portNameInput = document.createElement("input");
        portNameInput.setAttribute("type", "text");
        portNameInput.setAttribute("placeholder", "端子名称，如 L1 / N / PE");
        portNameInput.value = selectedPort.name || "";
        portNameInput.style.width = "180px";
        portEditor.appendChild(portNameInput);

        var markerSelect = document.createElement("select");
        [
          { value: "cross", label: "叉号" },
          { value: "circle", label: "圆点" },
          { value: "hidden", label: "隐藏" },
        ].forEach(function (item) {
          var option = document.createElement("option");
          option.value = item.value;
          option.innerText = item.label;
          markerSelect.appendChild(option);
        });
        markerSelect.value = selectedPort.marker || "cross";
        portEditor.appendChild(markerSelect);

        var directionSelect = document.createElement("select");
        [
          { value: "any", label: "任意方向" },
          { value: "left", label: "左侧接入" },
          { value: "right", label: "右侧接入" },
          { value: "up", label: "上侧接入" },
          { value: "down", label: "下侧接入" },
        ].forEach(function (item) {
          var option = document.createElement("option");
          option.value = item.value;
          option.innerText = item.label;
          directionSelect.appendChild(option);
        });
        directionSelect.value = selectedPort.direction || "any";
        portEditor.appendChild(directionSelect);

        var ioSelect = document.createElement("select");
        [
          { value: "both", label: "可接入可接出" },
          { value: "in", label: "仅接入" },
          { value: "out", label: "仅接出" },
        ].forEach(function (item) {
          var option = document.createElement("option");
          option.value = item.value;
          option.innerText = item.label;
          ioSelect.appendChild(option);
        });
        ioSelect.value = selectedPort.ioMode || "both";
        portEditor.appendChild(ioSelect);

        mxEvent.addListener(portNameInput, "input", function () {
          selectedPort.name = trim(portNameInput.value);
          updatePreview(state.currentSpec);
        });
        mxEvent.addListener(markerSelect, "change", function () {
          selectedPort.marker = normalizePortMarker(markerSelect.value);
          updatePreview(state.currentSpec);
        });
        mxEvent.addListener(directionSelect, "change", function () {
          selectedPort.direction = normalizePortDirection(
            directionSelect.value,
          );
          updatePreview(state.currentSpec);
        });
        mxEvent.addListener(ioSelect, "change", function () {
          selectedPort.ioMode = normalizePortIoMode(ioSelect.value);
          updatePreview(state.currentSpec);
        });
      }
    }

    var surface = document.createElement("div");
    surface.style.position = "relative";
    surface.style.height = "278px";
    surface.style.overflow = "hidden";
    surface.style.cursor =
      state.previewMode == "port" || state.previewMode == "label"
        ? "crosshair"
        : "default";
    surface.style.background = Editor.isDarkMode()
      ? "linear-gradient(180deg, #111111, #171717)"
      : "linear-gradient(180deg, #fafafa, #f3f4f6)";
    state.preview.appendChild(surface);

    var metrics = getPreviewMetrics(state.currentSpec, surface);
    var img = document.createElement("img");
    img.setAttribute("alt", getPreviewTitle(state.currentSpec));
    img.setAttribute("src", getPreviewSvg(state.currentSpec));
    img.style.position = "absolute";
    img.style.left = metrics.left + "px";
    img.style.top = metrics.top + "px";
    img.style.width = metrics.width + "px";
    img.style.height = metrics.height + "px";
    img.style.objectFit = "fill";
    img.style.pointerEvents = "none";
    surface.appendChild(img);

    function startDrag(type, id, target) {
      return function (evt) {
        evt.preventDefault();
        evt.stopPropagation();
        updateSelectedItem(type, id);

        function moveHandler(moveEvt) {
          var point = getRelativePoint(
            moveEvt,
            surface,
            metrics,
            type == "port",
          );
          var current = state.currentSpec;
          var nextLayout = getPreviewLayoutStore(current);

          if (type == "port") {
            var port = findPort({ ports: nextLayout.ports }, id);
            if (port != null) {
              port.x = point.x;
              port.y = point.y;
              target.style.left =
                metrics.left + port.x * metrics.width - 7 + "px";
              target.style.top =
                metrics.top + port.y * metrics.height - 7 + "px";
            }
          } else {
            var label = findLabel({ labels: nextLayout.labels }, id);
            if (label != null) {
              label.x = point.x;
              label.y = point.y;
              target.style.left =
                metrics.left + label.x * metrics.width - label.width / 2 + "px";
              target.style.top =
                metrics.top +
                label.y * metrics.height -
                label.height / 2 +
                "px";
            }
          }
        }

        function upHandler() {
          document.removeEventListener("mousemove", moveHandler);
          document.removeEventListener("mouseup", upHandler);

          if (type == "port" && state.currentSpec != null) {
            var finalLayout = getPreviewLayoutStore(state.currentSpec);
            var finalPort = findPort({ ports: finalLayout.ports }, id);

            if (finalPort != null) {
              var snappedPoint = snapPortPointToEdge(
                { x: finalPort.x, y: finalPort.y },
                metrics,
              );
              finalPort.x = snappedPoint.x;
              finalPort.y = snappedPoint.y;
            }
          }

          updatePreview(state.currentSpec);
        }

        document.addEventListener("mousemove", moveHandler);
        document.addEventListener("mouseup", upHandler);
      };
    }

    function renderPort(point) {
      var handle = document.createElement("div");
      handle.style.position = "absolute";
      handle.style.left = metrics.left + point.x * metrics.width - 7 + "px";
      handle.style.top = metrics.top + point.y * metrics.height - 7 + "px";
      handle.style.width = "14px";
      handle.style.height = "14px";
      handle.style.lineHeight = "14px";
      handle.style.textAlign = "center";
      handle.style.color = "#1a73e8";
      handle.style.fontSize = point.marker == "circle" ? "12px" : "16px";
      handle.style.fontWeight = "700";
      handle.style.cursor = "move";
      handle.style.userSelect = "none";
      handle.style.zIndex = "2";
      handle.innerText =
        point.marker == "circle" ? "●" : point.marker == "hidden" ? "" : "×";
      handle.style.opacity = point.marker == "hidden" ? "0.35" : "1";
      handle.title = point.id;
      if (
        state.selectedItem != null &&
        state.selectedItem.type == "port" &&
        state.selectedItem.id == point.id
      ) {
        handle.style.textShadow = "0 0 6px rgba(26,115,232,0.45)";
      }
      mxEvent.addListener(
        handle,
        "mousedown",
        startDrag("port", point.id, handle),
      );
      mxEvent.addListener(handle, "click", function (evt) {
        evt.stopPropagation();
        updateSelectedItem("port", point.id);
        updatePreview(state.currentSpec);
      });
      surface.appendChild(handle);
    }

    function renderLabel(label) {
      var box = document.createElement("div");
      box.style.position = "absolute";
      box.style.left =
        metrics.left + label.x * metrics.width - label.width / 2 + "px";
      box.style.top =
        metrics.top + label.y * metrics.height - label.height / 2 + "px";
      box.style.width = label.width + "px";
      box.style.minHeight = label.height + "px";
      box.style.padding = "2px 6px";
      box.style.boxSizing = "border-box";
      box.style.background = Editor.isDarkMode() ? "#1f1f1f" : "#ffffff";
      box.style.border =
        state.selectedItem != null &&
        state.selectedItem.type == "label" &&
        state.selectedItem.id == label.id
          ? "2px solid #1a73e8"
          : "1px dashed #9aa4b2";
      box.style.borderRadius = "4px";
      box.style.fontSize = "12px";
      box.style.lineHeight = "20px";
      box.style.textAlign = label.align;
      box.style.cursor = "move";
      box.style.userSelect = "none";
      box.style.zIndex = "2";
      box.innerText =
        trim(label.binding).length > 0
          ? "{{" + label.binding + "}}"
          : label.text || "未绑定";
      mxEvent.addListener(box, "mousedown", startDrag("label", label.id, box));
      mxEvent.addListener(box, "click", function (evt) {
        evt.stopPropagation();
        updateSelectedItem("label", label.id);
        updatePreview(state.currentSpec);
      });
      mxEvent.addListener(box, "dblclick", function (evt) {
        evt.stopPropagation();
        var nextBinding = window.prompt(
          "输入绑定属性路径，例如 name 或 device.name",
          label.binding,
        );
        if (nextBinding == null) {
          return;
        }
        nextBinding = trim(nextBinding);

        if (
          hasLabelBinding(
            { labels: getPreviewLayoutStore(state.currentSpec).labels },
            nextBinding,
            label.id,
          )
        ) {
          showStatus("同一个属性只能绑定一个文本框", true);
          return;
        }

        label.binding = nextBinding;
        updateSelectedItem("label", label.id);
        updatePreview(state.currentSpec);
      });
      surface.appendChild(box);
    }

    for (var i = 0; i < layoutStore.ports.length; i++) {
      renderPort(layoutStore.ports[i]);
    }

    for (var j = 0; j < layoutStore.labels.length; j++) {
      renderLabel(layoutStore.labels[j]);
    }

    mxEvent.addListener(surface, "click", function (evt) {
      if (evt.target !== surface) {
        return;
      }

      var point = getRelativePoint(
        evt,
        surface,
        metrics,
        state.previewMode == "port",
      );

      if (state.previewMode == "port") {
        point = snapPortPointToEdge(point, metrics);
        layoutStore.ports.push({
          id: nextItemId("port"),
          x: point.x,
          y: point.y,
        });
        updateSelectedItem(
          "port",
          layoutStore.ports[layoutStore.ports.length - 1].id,
        );
        updatePreview(state.currentSpec);
      } else if (state.previewMode == "label") {
        var binding = window.prompt(
          "输入绑定属性路径，例如 name 或 device.name",
          "name",
        );
        var labelId = nextItemId("label");

        if (binding == null) {
          return;
        }

        binding = trim(binding);

        if (hasLabelBinding({ labels: layoutStore.labels }, binding, null)) {
          showStatus("同一个属性只能绑定一个文本框", true);
          return;
        }

        layoutStore.labels.push(
          normalizeLabelItem(
            {
              id: labelId,
              text: "文本",
              binding: binding,
              x: point.x,
              y: point.y,
              width: 120,
              height: 26,
              align: "center",
            },
            labelId,
            "文本",
          ),
        );
        updateSelectedItem(
          "label",
          layoutStore.labels[layoutStore.labels.length - 1].id,
        );
        updatePreview(state.currentSpec);
      } else {
        updateSelectedItem(null, null);
        updatePreview(state.currentSpec);
      }
    });
  }

  // 根节点只作为透明容器和连接点宿主
  function makeRootStyle() {
    return (
      "fillColor=none;strokeColor=none;html=1;whiteSpace=wrap;" +
      "connectable=1;container=1;collapsible=0;foldable=0;recursiveResize=0;rotatable=0;"
    );
  }

  // 主图元本体作为 root 的背景子节点存在。
  function makeBodyStyle(spec) {
    return (
      "shape=image;image=" +
      toStyleImageUri(spec) +
      ";imageAspect=0;aspect=fixed;html=1;strokeColor=none;fillColor=none;" +
      "part=1;connectable=0;editable=0;movable=0;resizable=0;rotatable=0;" +
      "cloneable=0;deletable=0;pointerEvents=0;"
    );
  }

  function makeFrameStyle() {
    return (
      "shape=rectangle;fillColor=none;strokeColor=#6b7280;strokeWidth=2;" +
      "rounded=0;html=1;whiteSpace=wrap;connectable=0;container=1;dropTarget=1;" +
      "collapsible=0;foldable=0;recursiveResize=0;rotatable=0;resizable=0;deletable=0;"
    );
  }

  function makeFrameLabelStyle() {
    return (
      "text;html=1;whiteSpace=wrap;strokeColor=none;fillColor=none;" +
      "align=center;verticalAlign=middle;fontStyle=1;fontSize=13;" +
      "connectable=0;editable=0;movable=0;resizable=0;rotatable=0;deletable=0;pointerEvents=0;"
    );
  }

  function makeCabinetRootStyle() {
    return (
      "fillColor=none;strokeColor=none;html=1;whiteSpace=wrap;" +
      "connectable=1;container=1;collapsible=0;foldable=0;recursiveResize=0;rotatable=0;resizable=0;"
    );
  }

  // 根据当前这个配电柜片段的描述信息，拼出一段 SVG 字符串
  // 这里的 descriptor 里会带：width，height，continuesFromPrev，continuesToNext;
  // 会根据片段是不是跨页首段/中段/末段，决定画哪种轮廓
  function createCabinetBodySvg(descriptor) {
    var width = Math.max(20, Math.round(descriptor.width));
    var height = Math.max(20, Math.round(descriptor.height));
    var strokeWidth = 4;
    var inset = strokeWidth / 2;
    var notchLeft = Math.max(14, Math.round(width * 0.16));
    var notchWidth = Math.max(18, Math.round(width * 0.16));
    var notchDepth = Math.max(8, Math.round(Math.min(height, 80) * 0.12));
    var path;

    if (!descriptor.continuesFromPrev && !descriptor.continuesToNext) {
      path =
        "M " +
        inset +
        " " +
        inset +
        " L " +
        (width - inset) +
        " " +
        inset +
        " L " +
        (width - inset) +
        " " +
        (height - inset) +
        " L " +
        inset +
        " " +
        (height - inset) +
        " Z";
    } else {
      var topY = descriptor.continuesFromPrev ? inset + notchDepth : inset;
      var bottomY = descriptor.continuesToNext
        ? height - inset - notchDepth
        : height - inset;

      path =
        "M " +
        inset +
        " " +
        topY +
        " " +
        "L " +
        notchLeft +
        " " +
        topY +
        " " +
        (descriptor.continuesFromPrev
          ? "L " + (notchLeft + notchWidth) + " " + inset + " "
          : "") +
        "L " +
        (width - inset) +
        " " +
        inset +
        " " +
        "L " +
        (width - inset) +
        " " +
        (height - inset) +
        " " +
        (descriptor.continuesToNext
          ? "L " +
            (notchLeft + notchWidth) +
            " " +
            (height - inset) +
            " " +
            "L " +
            notchLeft +
            " " +
            bottomY +
            " "
          : "") +
        "L " +
        inset +
        " " +
        bottomY +
        " Z";
    }

    return (
      '<svg xmlns="http://www.w3.org/2000/svg" width="' +
      width +
      '" height="' +
      height +
      '" viewBox="0 0 ' +
      width +
      " " +
      height +
      '">' +
      '<path d="' +
      path +
      '" fill="none" stroke="#111111" stroke-width="' +
      strokeWidth +
      '" stroke-linejoin="round" stroke-linecap="round"/>' +
      "</svg>"
    );
  }

  // 把 createCabinetBodySvg 生成的 SVG 包装成一个 draw.io 样式字符串
  function makeCabinetBodyStyle(descriptor) {
    return (
      "shape=image;image=" +
      "data:image/svg+xml," +
      encodeURIComponent(createCabinetBodySvg(descriptor)) +
      ";imageAspect=0;aspect=fixed;html=1;strokeColor=none;fillColor=none;" +
      "part=1;connectable=0;editable=0;movable=0;resizable=0;rotatable=0;" +
      "cloneable=0;deletable=0;pointerEvents=0;"
    );
  }

  function makeCabinetGapStyle(selected) {
    return (
      "shape=rectangle;fillColor=#4dabf7;gradientColor=none;fillOpacity=" +
      (selected ? "38" : "14") +
      ";strokeColor=" +
      (selected ? "#1d4ed8" : "none") +
      ";strokeWidth=" +
      (selected ? "2" : "0") +
      ";connectable=0;editable=0;movable=0;resizable=0;rotatable=0;"
    );
  }

  // 创建文本子节点的统一样式。
  function makeLabelStyle(align) {
    return (
      "text;part=1;html=1;whiteSpace=wrap;strokeColor=none;fillColor=none;" +
      "align=" +
      align +
      ";verticalAlign=middle;spacing=2;rotatable=0;connectable=0;"
    );
  }

  // 创建主/备徽标的统一样式，颜色随模式变化。
  function makeBadgeStyle(mode) {
    var fillColor = mode == "standby" ? "#ffe9d6" : "#e6f4ea";
    var strokeColor = mode == "standby" ? "#b06000" : "#1e8e3e";

    return (
      "rounded=1;arcSize=18;part=1;html=1;whiteSpace=wrap;align=center;" +
      "verticalAlign=middle;fontStyle=1;strokeColor=" +
      strokeColor +
      ";fillColor=" +
      fillColor +
      ";connectable=0;rotatable=0;"
    );
  }

  function defaultPortPosition(index, count) {
    return count <= 0 ? 0.5 : (index + 1) / (count + 1);
  }

  // 规范化单个端口点位，最终格式为 {id, x, y, name, marker, direction, ioMode}。
  function normalizePortPoint(raw, fallbackId, fallbackX, fallbackY) {
    var id = fallbackId;
    var x = fallbackX;
    var y = fallbackY;
    var name = "";
    var marker = "cross";
    var direction = "any";
    var ioMode = "both";

    if (isObject(raw)) {
      id = trim(raw.id || raw.key || raw.name) || fallbackId;
      x = toFloat(raw.x, fallbackX);
      y = toFloat(raw.y, fallbackY);
      name = trim(raw.name || raw.label || "");
      marker = normalizePortMarker(raw.marker || raw.style);
      direction = normalizePortDirection(raw.direction || raw.side);
      ioMode = normalizePortIoMode(raw.ioMode || raw.io || raw.mode);
    } else if (typeof raw == "number") {
      y = raw;
    }

    return {
      id: id,
      x: clamp(x, 0, 1),
      y: clamp(y, 0, 1),
      name: name,
      marker: marker,
      direction: direction,
      ioMode: ioMode,
    };
  }

  // 规范化单个文本框定义，位置使用相对坐标，可落在图元外部。
  function normalizeLabelItem(raw, fallbackId, fallbackText) {
    var text = fallbackText;
    var id = fallbackId;
    var binding = "";
    var x = 0.5;
    var y = -0.18;
    var width = 120;
    var height = 26;
    var align = "center";

    if (isObject(raw)) {
      text = trim(raw.text || raw.label) || fallbackText;
      id = trim(raw.id || raw.key || raw.name) || fallbackId;
      binding = trim(raw.binding || raw.field || raw.prop);
      x = toFloat(raw.x, x);
      y = toFloat(raw.y, y);
      width = Math.max(40, toInt(raw.width, width));
      height = Math.max(20, toInt(raw.height, height));
      align = normalizeLabelAlign(raw.align);
    } else {
      text = trim(raw) || fallbackText;
    }

    return {
      id: id,
      text: text,
      binding: binding,
      x: clamp(x, -1.5, 2.5),
      y: clamp(y, -1.5, 2.5),
      width: width,
      height: height,
      align: align,
    };
  }

  // 统一把 ports 解析成端口点位数组。
  // 新格式：
  // ports: [{ id: "p1", x: 0, y: 0.3 }, ...]
  // 兼容格式：
  // ports: { items: [...] } / ports: { left: [0.3], right: [0.7] } / ports: { leftCount, rightCount }。
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

    if (!isObject(rawPorts)) {
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

    // 兼容旧格式：按数量自动生成左右默认位置
    var leftCount = Math.max(0, toInt(rawPorts.leftCount, 0));
    var rightCount = Math.max(0, toInt(rawPorts.rightCount, 0));

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

  // 从根节点属性读取端口点位数组。
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

  // 根据 spec 以及历史布局，生成当前图元应使用的端口点位。
  // spec.ports 有值时优先使用；为空时回退到 base。
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

  // 把端口点位数组序列化回根节点属性，便于保存和刷新时复用。
  function serializePortLayout(layout) {
    return JSON.stringify(normalizePortLayout(layout));
  }

  // 所有业务属性都挂在根节点 value 上，便于 Edit Data 后再执行“刷新电气图元”。
  function applyValueMetadata(node, spec, layout) {
    node.setAttribute("pluginType", ROOT_TYPE);
    node.setAttribute("symbolId", spec.symbolId);
    node.setAttribute("instanceId", trim(spec.instanceId));
    node.setAttribute("title", spec.title);
    node.setAttribute("label", "");
    node.setAttribute("deviceName", spec.device.name);
    node.setAttribute("deviceCode", spec.device.code);
    node.setAttribute("devicePower", spec.device.power);
    node.setAttribute("mode", spec.device.mode);
    node.setAttribute("variantField", trim(spec.variantField || "mode"));
    node.setAttribute("paramsJson", JSON.stringify(spec.device.params || {}));
    node.setAttribute("portsJson", serializePortLayout(layout));
    node.setAttribute("portLayout", serializePortLayout(layout));
    node.setAttribute(
      "labelsJson",
      JSON.stringify(normalizeLabels(spec.labels)),
    );
    node.setAttribute("schemaJson", JSON.stringify(spec.schema || {}));
    node.setAttribute("dataJson", JSON.stringify(spec.data || {}));
    node.setAttribute("symbolPayload", JSON.stringify(spec));

    return node;
  }

  // 统一创建子节点 value。子节点本身都是 mxCell，
  function createMetaCell(tagName, kind, key, label) {
    var value = createNode(tagName);
    value.setAttribute("esKind", kind);
    value.setAttribute("esKey", key);
    value.setAttribute("label", label || "");

    return value;
  }

  function applyFrameValueMetadata(
    node,
    frameId,
    pageNumber,
    frameConfig,
    extra,
  ) {
    var config = normalizeFrameConfig(frameConfig);
    var extras = isObject(extra) ? extra : {};
    var key;

    node.setAttribute("pluginType", FRAME_TYPE);
    node.setAttribute("frameId", frameId);
    node.setAttribute("pageNumber", String(Math.max(1, toInt(pageNumber, 1))));
    node.setAttribute("frameConfigJson", JSON.stringify(config));
    node.setAttribute("frameWidth", String(config.width));
    node.setAttribute("frameHeight", String(config.height));
    node.setAttribute("label", "");

    for (key in extras) {
      if (extras.hasOwnProperty(key) && extras[key] != null) {
        node.setAttribute(key, String(extras[key]));
      }
    }

    return node;
  }

  function getFrameConfig(frame) {
    var raw = getAttr(frame, "frameConfigJson");

    if (raw != null && raw.length > 0) {
      try {
        return normalizeFrameConfig(JSON.parse(raw));
      } catch (e) {
        // ignore malformed config
      }
    }

    var geometry = model.getGeometry(frame);
    return normalizeFrameConfig({
      width: geometry != null ? geometry.width : FRAME_DEFAULT_WIDTH,
      height: geometry != null ? geometry.height : FRAME_DEFAULT_HEIGHT,
    });
  }

  function getFramePageNumber(frame) {
    return Math.max(1, toInt(getAttr(frame, "pageNumber"), 1));
  }

  function getFrameGroupId(frame) {
    if (frame == null) {
      return "";
    }

    var groupId = trim(getAttr(frame, "groupId"));

    if (groupId.length > 0) {
      return groupId;
    }

    var originFrameId = trim(getAttr(frame, "originFrameId"));
    var frameId = trim(getAttr(frame, "frameId"));

    if (originFrameId.length > 0 && originFrameId != frameId) {
      var originFrame = findFrameById(originFrameId);

      if (originFrame != null && originFrame != frame) {
        return getFrameGroupId(originFrame);
      }

      return originFrameId;
    }

    return frameId;
  }

  function getAllDrawingFrames() {
    var parent = graph.getDefaultParent();
    var frames = [];
    var i;

    for (i = 0; i < model.getChildCount(parent); i++) {
      var child = model.getChildAt(parent, i);

      if (isDrawingFrame(child)) {
        frames.push(child);
      }
    }

    return frames;
  }

  function findFrameById(frameId) {
    var target = trim(frameId);
    var frames = getAllDrawingFrames();
    var i;

    for (i = 0; i < frames.length; i++) {
      if (trim(getAttr(frames[i], "frameId")) == target) {
        return frames[i];
      }
    }

    return null;
  }

  function getFramesInGroup(groupId) {
    var target = trim(groupId);
    var frames = getAllDrawingFrames();
    var result = [];
    var i;

    for (i = 0; i < frames.length; i++) {
      if (getFrameGroupId(frames[i]) == target) {
        result.push(frames[i]);
      }
    }

    return result;
  }

  function getRightmostFrameInGroup(groupId) {
    var frames = getFramesInGroup(groupId);
    var rightmost = null;
    var i;

    for (i = 0; i < frames.length; i++) {
      var geometry = model.getGeometry(frames[i]);

      if (geometry == null) {
        continue;
      }

      if (
        rightmost == null ||
        geometry.x + geometry.width >
          model.getGeometry(rightmost).x + model.getGeometry(rightmost).width
      ) {
        rightmost = frames[i];
      }
    }

    return rightmost;
  }

  function getBottommostFrame() {
    var frames = getAllDrawingFrames();
    var bottommost = null;
    var i;

    for (i = 0; i < frames.length; i++) {
      var geometry = model.getGeometry(frames[i]);

      if (geometry == null) {
        continue;
      }

      if (
        bottommost == null ||
        geometry.y + geometry.height >
          model.getGeometry(bottommost).y + model.getGeometry(bottommost).height
      ) {
        bottommost = frames[i];
      }
    }

    return bottommost;
  }

  function getLeftmostFrame() {
    var frames = getAllDrawingFrames();
    var leftmost = null;
    var i;

    for (i = 0; i < frames.length; i++) {
      var geometry = model.getGeometry(frames[i]);

      if (geometry == null) {
        continue;
      }

      if (leftmost == null || geometry.x < model.getGeometry(leftmost).x) {
        leftmost = frames[i];
      }
    }

    return leftmost;
  }

  function getLastDrawingFrame() {
    var frames = getAllDrawingFrames();
    var last = null;
    var i;

    for (i = 0; i < frames.length; i++) {
      if (
        last == null ||
        getFramePageNumber(frames[i]) > getFramePageNumber(last)
      ) {
        last = frames[i];
      }
    }

    return last;
  }

  function getMaxFramePageNumberInGroup(groupId) {
    var frames = getFramesInGroup(groupId);
    var maxPage = 0;
    var i;

    for (i = 0; i < frames.length; i++) {
      maxPage = Math.max(maxPage, getFramePageNumber(frames[i]));
    }

    return maxPage;
  }

  function getActiveFrame(showError) {
    var frame = findDrawingFrame(graph.getSelectionCell());

    if (frame == null) {
      frame = getLastDrawingFrame();
    }

    if (frame == null && showError) {
      showStatus("请先插入或选中一个图框", true);
      setCanvasStatus("请先插入或选中一个图框");
    }

    return frame;
  }

  function getFrameChildInsertPoint(frame, width, height) {
    var frameConfig = getFrameConfig(frame);
    var childCount = 0;
    var i;

    for (i = 0; i < model.getChildCount(frame); i++) {
      var child = model.getChildAt(frame, i);

      if (getAttr(child, "esKind") != FRAME_LABEL_KIND) {
        childCount += 1;
      }
    }

    return {
      x: 40 + (childCount % 6) * 18,
      y:
        Math.round(frameConfig.height * FRAME_MARGIN_RATIO) +
        20 +
        Math.floor(childCount / 6) * 18,
    };
  }

  function createFramePageLabelCell(pageNumber, frameConfig) {
    var config = normalizeFrameConfig(frameConfig);
    var width = 140;
    var height = 24;
    var geometry = new mxGeometry(config.width - width - 16, 10, width, height);
    var value = createMetaCell(
      FRAME_LABEL_TAG,
      FRAME_LABEL_KIND,
      "page",
      "PAGE " + pageNumber,
    );
    var cell = new mxCell(value, geometry, makeFrameLabelStyle());
    cell.vertex = true;
    cell.setConnectable(false);
    return cell;
  }

  function createDrawingFrameCell(frameConfig, pageNumber, extra) {
    var config = normalizeFrameConfig(frameConfig);
    var frameId =
      extra != null && trim(extra.frameId).length > 0
        ? trim(extra.frameId)
        : generateFrameId();
    var root = new mxCell(
      applyFrameValueMetadata(
        createNode(FRAME_TAG),
        frameId,
        pageNumber,
        config,
        extra,
      ),
      new mxGeometry(0, 0, config.width, config.height),
      makeFrameStyle(),
    );
    root.vertex = true;
    root.setConnectable(false);
    root.insert(createFramePageLabelCell(pageNumber, config));
    return root;
  }

  function addTopLevelCell(cell) {
    model.add(graph.getDefaultParent(), cell);
    return cell;
  }

  function getMaxFramePageNumber() {
    var frames = getAllDrawingFrames();
    var maxPage = 0;
    var i;

    for (i = 0; i < frames.length; i++) {
      maxPage = Math.max(maxPage, getFramePageNumber(frames[i]));
    }

    return maxPage;
  }

  function getRightmostFrame() {
    var frames = getAllDrawingFrames();
    var result = null;
    var maxEdge = -Infinity;
    var i;

    for (i = 0; i < frames.length; i++) {
      var geometry = model.getGeometry(frames[i]);

      if (geometry != null) {
        var edge = geometry.x + geometry.width;

        if (edge > maxEdge) {
          maxEdge = edge;
          result = frames[i];
        }
      }
    }

    return result;
  }

  function getRightmostFrameEdge() {
    var frames = getAllDrawingFrames();
    var maxEdge = 0;
    var i;

    for (i = 0; i < frames.length; i++) {
      var geometry = model.getGeometry(frames[i]);

      if (geometry != null) {
        maxEdge = Math.max(maxEdge, geometry.x + geometry.width);
      }
    }

    return maxEdge;
  }

  function buildCabinetOffsets(cabinetModel, frameConfig) {
    var config = normalizeFrameConfig(frameConfig);
    var modelData = normalizeCabinetModel(cabinetModel);
    var usableHeight = config.height * FRAME_CONTENT_RATIO;
    var topMargin = config.height * FRAME_MARGIN_RATIO;
    var offsets = [];
    var minFollowSpace = Math.max(
      modelData.tailPadding * 2,
      usableHeight * CABINET_MIN_PORT_FOLLOW_SPACE_RATIO,
    );
    // 配电柜顶部也保留与尾巴相同长度的“头部”，让首尾留白一致。
    var currentOffset = modelData.tailPadding;
    var i;

    if (modelData.ports.length == 0) {
      modelData.ports = normalizeCabinetModel({ portCount: 2 }).ports;
      modelData.gapRatios = [0.12];
    }

    for (i = 0; i < modelData.ports.length; i++) {
      if (i > 0) {
        var previousGap = modelData.gapRatios[i - 1] * usableHeight;
        var nextGap =
          i < modelData.gapRatios.length
            ? modelData.gapRatios[i] * usableHeight
            : 0;
        var candidateOffset = currentOffset + previousGap;
        var candidatePage = Math.floor(
          Math.max(0, candidateOffset - 0.0001) / usableHeight,
        );
        var candidateLocalOffset =
          candidateOffset - candidatePage * usableHeight;
        var remainingLocalSpace = usableHeight - candidateLocalOffset;

        // 如果当前端子前后的两段连续间距之和已经超过单页最大高度，
        // 则把当前端子作为“第二段”的头端子移到下一页顶部附近，
        // 避免它落在本页底部过低位置，导致右侧连接图元几乎没有摆放空间。
        if (
          i < modelData.gapRatios.length &&
          previousGap + nextGap > usableHeight &&
          candidateLocalOffset > modelData.tailPadding
        ) {
          currentOffset =
            (candidatePage + 1) * usableHeight + modelData.tailPadding;
        } else if (
          remainingLocalSpace < minFollowSpace &&
          candidateLocalOffset > modelData.tailPadding
        ) {
          // 如果当前端子落在本页后，后面剩余的可用空间太小，
          // 则把它整体提到下一页顶部，给该端子后续连接的图元留出足够摆放空间。
          currentOffset =
            (candidatePage + 1) * usableHeight + modelData.tailPadding;
        } else {
          currentOffset = candidateOffset;
        }
      }

      offsets.push(currentOffset);
    }

    return {
      frameConfig: config,
      cabinetModel: modelData,
      usableHeight: usableHeight,
      topMargin: topMargin,
      offsets: offsets,
      totalLogicalHeight:
        (offsets.length > 0
          ? offsets[offsets.length - 1]
          : modelData.tailPadding) + modelData.tailPadding,
    };
  }

  function getPageIndexForOffset(offset, usableHeight, pageCount) {
    if (pageCount <= 1 || offset <= 0) {
      return 0;
    }

    return clamp(
      Math.floor((offset - 0.0001) / usableHeight),
      0,
      pageCount - 1,
    );
  }

  function buildCabinetPageDescriptors(cabinetModel, frameConfig) {
    var layout = buildCabinetOffsets(cabinetModel, frameConfig);
    // 当前这个配电柜自身需要拆成几个分页片段来显示
    var pageCount = Math.max(
      1,
      Math.ceil(layout.totalLogicalHeight / layout.usableHeight),
    );
    var descriptors = [];
    var pageIndex;
    var i;

    for (pageIndex = 0; pageIndex < pageCount; pageIndex++) {
      var pageStart = pageIndex * layout.usableHeight;
      var remaining = Math.max(0, layout.totalLogicalHeight - pageStart);
      // 当前这一页配电柜片段应该画多高
      // 只要这个柜体一共要分到两页及以上，那每一页上的柜体片段高度都直接取整页可用高度
      // 如果没有跨页，只在一页里
      var segmentHeight =
        pageCount > 1
          ? layout.usableHeight
          : Math.max(
              layout.cabinetModel.tailPadding,
              Math.min(layout.usableHeight, remaining),
            );
      var ports = [];
      var gaps = [];

      for (i = 0; i < layout.cabinetModel.ports.length; i++) {
        if (
          getPageIndexForOffset(
            layout.offsets[i],
            layout.usableHeight,
            pageCount,
          ) == pageIndex
        ) {
          var localOffset = layout.offsets[i] - pageStart;
          var port = cloneJson(layout.cabinetModel.ports[i]);
          port.x = 1;
          port.y =
            segmentHeight > 0 ? clamp(localOffset / segmentHeight, 0, 1) : 0;
          port.order = i;
          port.logicalOffset = layout.offsets[i];
          ports.push(port);
        }
      }

      for (i = 0; i < layout.cabinetModel.gapRatios.length; i++) {
        var gapAbsoluteStart = layout.offsets[i];
        var gapAbsoluteEnd =
          i + 1 < layout.offsets.length
            ? layout.offsets[i + 1]
            : gapAbsoluteStart;
        var visibleStart = Math.max(gapAbsoluteStart, pageStart);
        var visibleEnd = Math.min(gapAbsoluteEnd, pageStart + segmentHeight);

        if (visibleEnd > visibleStart) {
          var gapStart = clamp(visibleStart - pageStart, 0, segmentHeight);
          var gapEnd = clamp(visibleEnd - pageStart, gapStart, segmentHeight);

          if (gapEnd - gapStart < 12) {
            gapEnd = Math.min(segmentHeight, gapStart + 12);
          }

          gaps.push({
            id: "cabinet-gap:" + i + ":" + pageIndex,
            gapIndex: i,
            y: segmentHeight > 0 ? clamp(gapStart / segmentHeight, 0, 1) : 0,
            height: Math.max(12, gapEnd - gapStart),
          });
        }
      }

      descriptors.push({
        segmentIndex: pageIndex,
        pageCount: pageCount,
        continuesFromPrev: pageIndex > 0,
        continuesToNext: pageIndex < pageCount - 1,
        x: layout.cabinetModel.cabinetX,
        y: layout.topMargin,
        width: layout.cabinetModel.cabinetWidth,
        height: segmentHeight,
        segmentStartOffset: pageStart,
        segmentEndOffset: pageStart + segmentHeight,
        ports: ports,
        gaps: gaps,
        frameConfig: layout.frameConfig,
        cabinetModel: layout.cabinetModel,
      });
    }

    return descriptors;
  }

  function createCabinetValueMetadata(node, cabinetModel, descriptor, frameId) {
    node.setAttribute("pluginType", CABINET_TYPE);
    node.setAttribute("logicalCabinetId", trim(cabinetModel.logicalCabinetId));
    node.setAttribute("originFrameId", trim(cabinetModel.originFrameId));
    node.setAttribute("frameId", trim(frameId));
    node.setAttribute("segmentIndex", String(descriptor.segmentIndex));
    node.setAttribute(
      "segmentStartOffset",
      String(Math.round(descriptor.segmentStartOffset * 1000) / 1000),
    );
    node.setAttribute(
      "segmentEndOffset",
      String(Math.round(descriptor.segmentEndOffset * 1000) / 1000),
    );
    node.setAttribute("cabinetModelJson", JSON.stringify(cabinetModel));
    node.setAttribute("gapRatiosJson", JSON.stringify(cabinetModel.gapRatios));
    node.setAttribute("portsJson", serializePortLayout(descriptor.ports));
    node.setAttribute("portLayout", serializePortLayout(descriptor.ports));
    node.setAttribute("label", "");
    return node;
  }

  // 真正创建一个 mxCell 来表示配电柜片段的主体部分，样式里会把 SVG 轮廓字符串嵌入进去。
  function createCabinetBodyCell(descriptor) {
    var cell = new mxCell(
      createMetaCell(CABINET_BODY_TAG, CABINET_BODY_KIND, "main", ""),
      new mxGeometry(0, 0, descriptor.width, descriptor.height),
      makeCabinetBodyStyle(descriptor),
    );
    cell.vertex = true;
    cell.setConnectable(false);
    return cell;
  }

  function createCabinetGapCell(cabinetModel, descriptor, gap) {
    var value = createNode(CABINET_GAP_TAG);
    value.setAttribute("pluginType", CABINET_GAP_TYPE);
    value.setAttribute("esKind", CABINET_GAP_KIND);
    value.setAttribute("esKey", String(gap.gapIndex));
    value.setAttribute("logicalCabinetId", trim(cabinetModel.logicalCabinetId));
    value.setAttribute("gapIndex", String(gap.gapIndex));
    value.setAttribute("label", "");
    var geometry = new mxGeometry(1, gap.y, 14, gap.height);
    geometry.relative = true;
    geometry.offset = new mxPoint(-7, 0);
    var cell = new mxCell(
      value,
      geometry,
      makeCabinetGapStyle(
        isSelectedCabinetGap(cabinetModel.logicalCabinetId, gap.gapIndex),
      ),
    );
    cell.vertex = true;
    cell.setConnectable(false);
    return cell;
  }

  function getCellAbsoluteGeometry(cell) {
    var geometry = model.getGeometry(cell);
    var parent = model.getParent(cell);
    var x = geometry != null ? geometry.x : 0;
    var y = geometry != null ? geometry.y : 0;

    while (parent != null) {
      var parentGeometry = model.getGeometry(parent);

      if (parentGeometry != null) {
        x += parentGeometry.x;
        y += parentGeometry.y;
      }

      parent = model.getParent(parent);
    }

    return {
      x: x,
      y: y,
      width: geometry != null ? geometry.width : 0,
      height: geometry != null ? geometry.height : 0,
    };
  }

  function getPortAbsolutePosition(root, port) {
    var geometry = getCellAbsoluteGeometry(root);

    return {
      x: geometry.x + port.x * geometry.width,
      y: geometry.y + port.y * geometry.height,
    };
  }

  function buildCabinetSegmentCell(cabinetModel, frameId, descriptor) {
    var root = new mxCell(
      createCabinetValueMetadata(
        createNode(CABINET_TAG),
        cabinetModel,
        descriptor,
        frameId,
      ),
      new mxGeometry(
        descriptor.x,
        descriptor.y,
        descriptor.width,
        descriptor.height,
      ),
      makeCabinetRootStyle(),
    );
    var i;
    root.vertex = true;
    root.setConnectable(true);
    root.insert(createCabinetBodyCell(descriptor));

    for (i = 0; i < descriptor.gaps.length; i++) {
      root.insert(
        createCabinetGapCell(cabinetModel, descriptor, descriptor.gaps[i]),
      );
    }

    return root;
  }

  function extractCabinetModel(cell) {
    var root = findCabinetSegment(cell);
    var raw;

    if (root == null) {
      throw new Error("未找到配电柜片段");
    }

    raw = getAttr(root, "cabinetModelJson");

    if (raw == null || raw.length == 0) {
      throw new Error("缺少 cabinetModelJson 数据");
    }

    return normalizeCabinetModel(JSON.parse(raw));
  }

  function findCabinetSegments(logicalCabinetId) {
    var target = trim(logicalCabinetId);
    var frames = getAllDrawingFrames();
    var result = [];
    var i;
    var j;

    for (i = 0; i < frames.length; i++) {
      for (j = 0; j < model.getChildCount(frames[i]); j++) {
        var child = model.getChildAt(frames[i], j);

        if (
          isCabinetSegment(child) &&
          trim(getAttr(child, "logicalCabinetId")) == target
        ) {
          result.push(child);
        }
      }
    }

    return result;
  }

  function isSelectedCabinetGap(logicalCabinetId, gapIndex) {
    return (
      state.selectedCabinetGap != null &&
      trim(state.selectedCabinetGap.logicalCabinetId) ==
        trim(logicalCabinetId) &&
      toInt(state.selectedCabinetGap.gapIndex, -1) == toInt(gapIndex, -1)
    );
  }

  function updateCabinetGapHighlight() {
    var frames = getAllDrawingFrames();
    var i;
    var j;
    var k;

    model.beginUpdate();
    try {
      for (i = 0; i < frames.length; i++) {
        for (j = 0; j < model.getChildCount(frames[i]); j++) {
          var segment = model.getChildAt(frames[i], j);

          if (!isCabinetSegment(segment)) {
            continue;
          }

          for (k = 0; k < model.getChildCount(segment); k++) {
            var child = model.getChildAt(segment, k);

            if (isCabinetGap(child)) {
              var nextStyle = makeCabinetGapStyle(
                isSelectedCabinetGap(
                  getAttr(child, "logicalCabinetId"),
                  getAttr(child, "gapIndex"),
                ),
              );

              if (child.style != nextStyle) {
                model.setStyle(child, nextStyle);
              }
            }
          }
        }
      }
    } finally {
      model.endUpdate();
    }
  }

  function setSelectedCabinetGap(logicalCabinetId, gapIndex) {
    if (trim(logicalCabinetId).length == 0 || toInt(gapIndex, -1) < 0) {
      state.selectedCabinetGap = null;
    } else {
      state.selectedCabinetGap = {
        logicalCabinetId: trim(logicalCabinetId),
        gapIndex: toInt(gapIndex, -1),
      };
    }

    updateCabinetGapHighlight();
  }

  function getEdgePortId(edge, root, source) {
    var style = graph.getCellStyle(edge) || {};
    var key = source ? "sourcePortId" : "targetPortId";
    var portId = trim(mxUtils.getValue(style, key, ""));

    if (portId.length > 0) {
      return portId;
    }

    var edgeState = graph.view.getState(edge);
    var terminalState = graph.view.getState(root);
    var constraint =
      edgeState != null && terminalState != null
        ? graph.getConnectionConstraint(edgeState, terminalState, source)
        : null;
    var point = constraint != null ? constraint.point : null;
    var ports = parsePortLayout(getAttr(root, "portsJson"));
    var i;

    if (point != null) {
      for (i = 0; i < ports.length; i++) {
        if (
          Math.abs(ports[i].x - point.x) < 0.0001 &&
          Math.abs(ports[i].y - point.y) < 0.0001
        ) {
          return trim(ports[i].id);
        }
      }
    }

    return "";
  }

  function collectCabinetAttachments(segments) {
    var seen = {};
    var attachments = [];
    var i;
    var j;

    for (i = 0; i < segments.length; i++) {
      var segment = segments[i];
      var edgeCount = model.getEdgeCount(segment);

      for (j = 0; j < edgeCount; j++) {
        var edge = model.getEdgeAt(segment, j);
        var sourceTerminal = model.getTerminal(edge, true);
        var targetTerminal = model.getTerminal(edge, false);
        var sourceIsSegment = sourceTerminal == segment;
        var targetIsSegment = targetTerminal == segment;

        if (!sourceIsSegment && !targetIsSegment) {
          continue;
        }

        var key = mxCellPath.create(edge) + ":" + (sourceIsSegment ? "S" : "T");

        if (seen[key]) {
          continue;
        }

        seen[key] = true;

        var source = sourceIsSegment;
        var portId = getEdgePortId(edge, segment, source);
        var port = getPortMetaById(segment, portId);

        if (port == null) {
          continue;
        }

        attachments.push({
          edge: edge,
          source: source,
          portId: portId,
          oldPortPosition: getPortAbsolutePosition(segment, port),
          otherTerminal: model.getTerminal(edge, !source),
        });
      }
    }

    return attachments;
  }

  function buildCabinetPortMap(segments) {
    var result = {};
    var i;

    for (i = 0; i < segments.length; i++) {
      var segment = segments[i];
      var frame = findDrawingFrame(segment);
      var ports = parsePortLayout(getAttr(segment, "portsJson"));
      var j;

      for (j = 0; j < ports.length; j++) {
        result[trim(ports[j].id)] = {
          segment: segment,
          port: ports[j],
          frame: frame,
          absolutePosition: getPortAbsolutePosition(segment, ports[j]),
        };
      }
    }

    return result;
  }

  function isMovableConnectedTerminal(cell) {
    return (
      cell != null &&
      model.isVertex(cell) &&
      !isDrawingFrame(cell) &&
      !isCabinetSegment(cell) &&
      !isCabinetGap(cell)
    );
  }

  function clampCellGeometryToFrame(geometry, frame) {
    var frameGeometry = model.getGeometry(frame);
    var nextGeometry = geometry.clone();
    var padding = 12;
    var minX = padding;
    var minY = padding;
    var maxX = Math.max(minX, frameGeometry.width - geometry.width - padding);
    var maxY = Math.max(minY, frameGeometry.height - geometry.height - padding);

    nextGeometry.x = clamp(nextGeometry.x, minX, maxX);
    nextGeometry.y = clamp(nextGeometry.y, minY, maxY);

    return nextGeometry;
  }

  function moveCellToFrameByDelta(cell, targetFrame, deltaX, deltaY) {
    if (!isMovableConnectedTerminal(cell) || targetFrame == null) {
      return;
    }

    var geometry = model.getGeometry(cell);

    if (geometry == null) {
      return;
    }

    var currentFrame = findDrawingFrame(cell);
    var absolute = getCellAbsoluteGeometry(cell);
    var targetFrameGeometry = model.getGeometry(targetFrame);
    var nextGeometry = geometry.clone();
    var nextAbsoluteX = absolute.x + deltaX;
    var nextAbsoluteY = absolute.y + deltaY;

    if (currentFrame != targetFrame) {
      model.add(targetFrame, cell);
    }

    nextGeometry.x = nextAbsoluteX - targetFrameGeometry.x;
    nextGeometry.y = nextAbsoluteY - targetFrameGeometry.y;
    nextGeometry = clampCellGeometryToFrame(nextGeometry, targetFrame);
    model.setGeometry(cell, nextGeometry);
  }

  function collectConnectedMovableGroup(startCell) {
    var queue = [];
    var vertexMap = {};
    var edgeMap = {};
    var vertices = [];
    var edges = [];
    var i;

    if (!isMovableConnectedTerminal(startCell)) {
      return {
        vertices: vertices,
        edges: edges,
      };
    }

    queue.push(startCell);

    while (queue.length > 0) {
      var cell = queue.shift();
      var cellId = mxObjectIdentity.get(cell);

      if (vertexMap[cellId]) {
        continue;
      }

      vertexMap[cellId] = true;
      vertices.push(cell);

      for (i = 0; i < model.getEdgeCount(cell); i++) {
        var edge = model.getEdgeAt(cell, i);
        var edgeId = mxObjectIdentity.get(edge);
        var source = model.getTerminal(edge, true);
        var target = model.getTerminal(edge, false);
        var other = source == cell ? target : source;

        if (!edgeMap[edgeId]) {
          edgeMap[edgeId] = true;
          edges.push(edge);
        }

        if (isMovableConnectedTerminal(other)) {
          queue.push(other);
        }
      }
    }

    return {
      vertices: vertices,
      edges: edges,
    };
  }

  function getCellsAbsoluteBounds(cells) {
    var bounds = null;
    var i;

    for (i = 0; i < cells.length; i++) {
      var geometry = getCellAbsoluteGeometry(cells[i]);

      if (bounds == null) {
        bounds = {
          x: geometry.x,
          y: geometry.y,
          width: geometry.width,
          height: geometry.height,
        };
      } else {
        var minX = Math.min(bounds.x, geometry.x);
        var minY = Math.min(bounds.y, geometry.y);
        var maxX = Math.max(bounds.x + bounds.width, geometry.x + geometry.width);
        var maxY = Math.max(
          bounds.y + bounds.height,
          geometry.y + geometry.height,
        );

        bounds.x = minX;
        bounds.y = minY;
        bounds.width = maxX - minX;
        bounds.height = maxY - minY;
      }
    }

    return bounds;
  }

  function adjustGroupDeltaToFrame(vertices, targetFrame, deltaX, deltaY) {
    var bounds = getCellsAbsoluteBounds(vertices);
    var frameGeometry = model.getGeometry(targetFrame);
    var padding = 12;

    if (bounds == null || frameGeometry == null) {
      return {
        x: deltaX,
        y: deltaY,
      };
    }

    var nextX = bounds.x + deltaX;
    var nextY = bounds.y + deltaY;
    var minX = frameGeometry.x + padding;
    var minY = frameGeometry.y + padding;
    var maxX = frameGeometry.x + frameGeometry.width - padding;
    var maxY = frameGeometry.y + frameGeometry.height - padding;

    if (nextX < minX) {
      deltaX += minX - nextX;
      nextX = minX;
    }

    if (nextY < minY) {
      deltaY += minY - nextY;
      nextY = minY;
    }

    if (nextX + bounds.width > maxX) {
      deltaX -= nextX + bounds.width - maxX;
    }

    if (nextY + bounds.height > maxY) {
      deltaY -= nextY + bounds.height - maxY;
    }

    return {
      x: deltaX,
      y: deltaY,
    };
  }

  function shiftEdgePointsByDelta(edge, deltaX, deltaY) {
    var geometry = model.getGeometry(edge);
    var points;
    var i;

    if (geometry == null || geometry.points == null || geometry.points.length == 0) {
      return;
    }

    geometry = geometry.clone();
    points = [];

    for (i = 0; i < geometry.points.length; i++) {
      points.push(
        new mxPoint(
          geometry.points[i].x + deltaX,
          geometry.points[i].y + deltaY,
        ),
      );
    }

    geometry.points = points;
    model.setGeometry(edge, geometry);
  }

  function clearEdgePoints(edge) {
    var geometry = model.getGeometry(edge);

    if (geometry != null && geometry.points != null && geometry.points.length > 0) {
      geometry = geometry.clone();
      geometry.points = null;
      model.setGeometry(edge, geometry);
    }
  }

  function moveConnectedGroupToCabinetPort(
    edge,
    source,
    oldRoot,
    oldPortId,
    newRoot,
    newPort,
  ) {
    var otherTerminal = model.getTerminal(edge, !source);
    var oldPort = getPortMetaById(oldRoot, oldPortId);
    var targetFrame = findDrawingFrame(newRoot);
    var group;
    var delta;
    var movedMap = {};
    var i;

    if (
      state.updatingModel ||
      !isCabinetSegment(oldRoot) ||
      !isCabinetSegment(newRoot) ||
      oldPort == null ||
      newPort == null ||
      !isMovableConnectedTerminal(otherTerminal) ||
      targetFrame == null
    ) {
      return;
    }

    group = collectConnectedMovableGroup(otherTerminal);

    if (group.vertices.length == 0) {
      return;
    }

    delta = adjustGroupDeltaToFrame(
      group.vertices,
      targetFrame,
      getPortAbsolutePosition(newRoot, newPort).x -
        getPortAbsolutePosition(oldRoot, oldPort).x,
      getPortAbsolutePosition(newRoot, newPort).y -
        getPortAbsolutePosition(oldRoot, oldPort).y,
    );

    if (Math.abs(delta.x) < 0.0001 && Math.abs(delta.y) < 0.0001) {
      return;
    }

    state.updatingModel = true;
    model.beginUpdate();

    try {
      for (i = 0; i < group.vertices.length; i++) {
        var vertex = group.vertices[i];
        var key = mxObjectIdentity.get(vertex);

        if (!movedMap[key]) {
          movedMap[key] = true;
          moveCellToFrameByDelta(vertex, targetFrame, delta.x, delta.y);
        }
      }

      for (i = 0; i < group.edges.length; i++) {
        var groupEdge = group.edges[i];
        var sourceTerminal = model.getTerminal(groupEdge, true);
        var targetTerminal = model.getTerminal(groupEdge, false);
        var sourceMoved = movedMap[mxObjectIdentity.get(sourceTerminal)] === true;
        var targetMoved = movedMap[mxObjectIdentity.get(targetTerminal)] === true;

        if (sourceMoved && targetMoved) {
          shiftEdgePointsByDelta(groupEdge, delta.x, delta.y);
        } else {
          clearEdgePoints(groupEdge);
        }
      }
    } finally {
      model.endUpdate();
      state.updatingModel = false;
    }
  }

  function clearPortSwapOverlay() {
    if (
      state.portSwapOverlay != null &&
      state.portSwapOverlay.parentNode != null
    ) {
      state.portSwapOverlay.parentNode.removeChild(state.portSwapOverlay);
    }

    state.portSwapOverlay = null;
  }

  function exitPortSwapMode(clearStatus) {
    clearPortSwapOverlay();
    state.portSwapSession = null;

    if (clearStatus !== false) {
      setCanvasStatus("");
    }
  }

  function buildPortSwapContextFromEdge(edge) {
    var sourceTerminal = model.getTerminal(edge, true);
    var targetTerminal = model.getTerminal(edge, false);
    var sourceRoot = findPortHostRoot(sourceTerminal);
    var targetRoot = findPortHostRoot(targetTerminal);
    var sourceCabinet = isCabinetSegment(sourceRoot);
    var targetCabinet = isCabinetSegment(targetRoot);

    if (sourceCabinet == targetCabinet) {
      return null;
    }

    return {
      edge: edge,
      source: sourceCabinet,
      cabinetRoot: sourceCabinet ? sourceRoot : targetRoot,
      portId: trim(
        mxUtils.getValue(
          graph.getCellStyle(edge) || {},
          sourceCabinet ? "sourcePortId" : "targetPortId",
          "",
        ),
      ),
      otherTerminal: sourceCabinet ? targetTerminal : sourceTerminal,
    };
  }

  function getPortSwapContextFromSelection() {
    var cell = graph.getSelectionCell();
    var i;

    if (model.isEdge(cell)) {
      return buildPortSwapContextFromEdge(cell);
    }

    if (isMovableConnectedTerminal(cell)) {
      var match = null;

      for (i = 0; i < model.getEdgeCount(cell); i++) {
        var edge = model.getEdgeAt(cell, i);
        var context = buildPortSwapContextFromEdge(edge);

        if (
          context != null &&
          context.otherTerminal == cell &&
          context.portId.length > 0
        ) {
          if (match != null) {
            return {
              error: "该图元连接了多个配电柜端子，请直接选中第一条边再执行更换挂点",
            };
          }

          match = context;
        }
      }

      return match;
    }

    return null;
  }

  function renderPortSwapOverlay(session) {
    var container = document.createElement("div");
    var segments = findCabinetSegments(
      trim(getAttr(session.cabinetRoot, "logicalCabinetId")),
    );
    var i;
    var j;

    clearPortSwapOverlay();
    container.style.position = "absolute";
    container.style.left = "0";
    container.style.top = "0";
    container.style.width = "100%";
    container.style.height = "100%";
    container.style.pointerEvents = "none";
    container.style.zIndex = "3";

    for (i = 0; i < segments.length; i++) {
      var stateView = graph.view.getState(segments[i]);
      var ports = parsePortLayout(getAttr(segments[i], "portsJson"));

      if (stateView == null) {
        continue;
      }

      for (j = 0; j < ports.length; j++) {
        var marker = document.createElement("div");
        var portId = trim(ports[j].id);
        var selected = trim(ports[j].id) == trim(session.portId);
        marker.style.position = "absolute";
        marker.style.width = "14px";
        marker.style.height = "14px";
        marker.style.borderRadius = "50%";
        marker.style.boxSizing = "border-box";
        marker.style.border = selected
          ? "2px solid #1a73e8"
          : "2px solid #16a34a";
        marker.style.background = selected
          ? "rgba(26,115,232,0.15)"
          : "rgba(22,163,74,0.18)";
        marker.style.pointerEvents = "auto";
        marker.style.cursor = selected ? "default" : "pointer";
        marker.style.left =
          Math.round(stateView.x + ports[j].x * stateView.width - 7) + "px";
        marker.style.top =
          Math.round(stateView.y + ports[j].y * stateView.height - 7) + "px";
        marker.title = selected ? "当前挂点" : "点击切换到该挂点";

        if (!selected) {
          mxEvent.addListener(marker, "click", (function (root, port) {
            return function (evt) {
              mxEvent.consume(evt);
              commitPortSwap(state.portSwapSession, root, port);
            };
          })(segments[i], cloneJson(ports[j])));
        }

        container.appendChild(marker);
      }
    }

    graph.container.appendChild(container);
    state.portSwapOverlay = container;
  }

  function getNearestCabinetPortFromClick(root, mouseEvent) {
    var ports = parsePortLayout(getAttr(root, "portsJson"));
    var graphX =
      mouseEvent != null && typeof mouseEvent.getGraphX === "function"
        ? mouseEvent.getGraphX()
        : null;
    var graphY =
      mouseEvent != null && typeof mouseEvent.getGraphY === "function"
        ? mouseEvent.getGraphY()
        : null;
    var threshold = 18 / graph.view.scale;
    var best = null;
    var bestDistance = Infinity;
    var i;

    if (graphX == null || graphY == null) {
      return null;
    }

    for (i = 0; i < ports.length; i++) {
      var position = getPortAbsolutePosition(root, ports[i]);
      var dx = position.x - graphX;
      var dy = position.y - graphY;
      var distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= threshold && distance < bestDistance) {
        best = ports[i];
        bestDistance = distance;
      }
    }

    return best;
  }

  function applyEdgePortConstraintMetadata(edge, root, source, constraint) {
    var port = getPortMetaByConstraint(root, constraint);
    var direction =
      port != null ? mapPortDirectionToConstraint(port.direction) : "";
    var key = source ? "sourcePortConstraint" : "targetPortConstraint";
    var portKey = source ? "sourcePortId" : "targetPortId";
    var style = model.getStyle(edge) || "";

    style = mxUtils.setStyle(
      style,
      key,
      direction.length > 0 ? direction : null,
    );
    style = mxUtils.setStyle(
      style,
      portKey,
      port != null && trim(port.id).length > 0 ? trim(port.id) : null,
    );
    model.setStyle(edge, style);
  }

  function commitPortSwap(session, newRoot, newPort) {
    var edge = session.edge;
    var source = !!session.source;
    var oldRoot = session.cabinetRoot;
    var oldPortId = trim(session.portId);
    var constraint = new mxConnectionConstraint(
      new mxPoint(newPort.x, newPort.y),
      false,
      newPort.id,
    );

    if (
      edge == null ||
      newRoot == null ||
      newPort == null ||
      oldPortId.length == 0 ||
      (oldRoot == newRoot && oldPortId == trim(newPort.id))
    ) {
      exitPortSwapMode();
      return;
    }

    state.updatingModel = true;
    model.beginUpdate();

    try {
      model.setTerminal(edge, newRoot, source);
      oldSetConnectionConstraint.call(graph, edge, newRoot, source, constraint);
      applyEdgePortConstraintMetadata(edge, newRoot, source, constraint);
      clearEdgePoints(edge);
    } finally {
      model.endUpdate();
      state.updatingModel = false;
    }

    moveConnectedGroupToCabinetPort(
      edge,
      source,
      oldRoot,
      oldPortId,
      newRoot,
      newPort,
    );
    exitPortSwapMode();
    showStatus("已更换挂点", false);
    setCanvasStatus("已更换挂点");
  }

  function enterPortSwapMode() {
    if (state.portSwapSession != null) {
      exitPortSwapMode();
      return;
    }

    closeGapDialogWindow();
    setSelectedCabinetGap(null, null);

    var context = getPortSwapContextFromSelection();

    if (context == null) {
      showStatus("请先选中与配电柜直接相连的第一条边或第一个图元", true);
      setCanvasStatus("请先选中与配电柜直接相连的第一条边或第一个图元");
      return;
    }

    if (context.error != null) {
      showStatus(context.error, true);
      setCanvasStatus(context.error);
      return;
    }

    if (context.portId.length == 0 || context.cabinetRoot == null) {
      showStatus("当前选中对象未绑定到有效的配电柜端子", true);
      setCanvasStatus("当前选中对象未绑定到有效的配电柜端子");
      return;
    }

    state.portSwapSession = context;
    renderPortSwapOverlay(context);
    setCanvasStatus("更换挂点模式：点击同一配电柜上的目标连接点，或点空白取消");
  }

  function restoreCabinetAttachments(attachments, newPortMap) {
    var movedTerminals = {};
    var i;

    for (i = 0; i < attachments.length; i++) {
      var attachment = attachments[i];
      var target = newPortMap[trim(attachment.portId)];

      if (target == null) {
        continue;
      }

      model.setTerminal(attachment.edge, target.segment, attachment.source);
      graph.setConnectionConstraint(
        attachment.edge,
        target.segment,
        attachment.source,
        new mxConnectionConstraint(
          new mxPoint(target.port.x, target.port.y),
          false,
          target.port.id,
        ),
      );

      var edgeGeometry = model.getGeometry(attachment.edge);

      if (edgeGeometry != null && edgeGeometry.points != null) {
        edgeGeometry = edgeGeometry.clone();
        edgeGeometry.points = null;
        model.setGeometry(attachment.edge, edgeGeometry);
      }

      if (isMovableConnectedTerminal(attachment.otherTerminal)) {
        var moveKey = mxObjectIdentity.get(attachment.otherTerminal);

        if (!movedTerminals[moveKey]) {
          movedTerminals[moveKey] = true;
          moveCellToFrameByDelta(
            attachment.otherTerminal,
            target.frame,
            target.absolutePosition.x - attachment.oldPortPosition.x,
            target.absolutePosition.y - attachment.oldPortPosition.y,
          );
        }
      }
    }
  }

  function closeGapDialogWindow() {
    if (state.gapDialogWindow != null) {
      var wnd = state.gapDialogWindow;
      state.gapDialogWindow = null;
      wnd.destroy();
    }
  }

  function clearCurrentPage() {
    var parent = graph.getDefaultParent();
    var cells = [];
    var i;

    for (i = 0; i < model.getChildCount(parent); i++) {
      cells.push(model.getChildAt(parent, i));
    }

    if (cells.length == 0) {
      showStatus("当前页面没有可清除的内容", false);
      return;
    }

    if (!mxUtils.confirm("确认清除当前页面所有内容？")) {
      return;
    }

    if (!mxUtils.confirm("此操作不可恢复，确定继续清除吗？")) {
      return;
    }

    closeGapDialogWindow();
    setSelectedCabinetGap(null, null);
    exitPortSwapMode(false);

    state.allowProtectedDelete = true;

    try {
      graph.removeCells(cells, true);
      showStatus("已清空当前页面", false);
    } finally {
      state.allowProtectedDelete = false;
    }
  }

  function findAutoFramesForCabinet(originFrameId, logicalCabinetId) {
    var frames = getAllDrawingFrames();
    var result = [];
    var i;

    for (i = 0; i < frames.length; i++) {
      if (
        trim(getAttr(frames[i], "originFrameId")) == trim(originFrameId) &&
        trim(getAttr(frames[i], "autoFrameOwner")) == trim(logicalCabinetId)
      ) {
        result.push(frames[i]);
      }
    }

    result.sort(function (a, b) {
      return (
        toInt(getAttr(a, "autoFrameIndex"), 0) -
        toInt(getAttr(b, "autoFrameIndex"), 0)
      );
    });

    return result;
  }

  function frameHasOnlyCabinetChildren(frame, logicalCabinetId) {
    var i;

    for (i = 0; i < model.getChildCount(frame); i++) {
      var child = model.getChildAt(frame, i);

      if (getAttr(child, "esKind") == FRAME_LABEL_KIND) {
        continue;
      }

      if (
        isCabinetSegment(child) &&
        trim(getAttr(child, "logicalCabinetId")) == trim(logicalCabinetId)
      ) {
        continue;
      }

      return false;
    }

    return true;
  }

  function ensureCabinetFrames(
    originFrame,
    cabinetModel,
    pageCount,
    skipCleanup,
  ) {
    var originFrameId = trim(getAttr(originFrame, "frameId"));
    var originGroupId = getFrameGroupId(originFrame);
    var logicalCabinetId = trim(cabinetModel.logicalCabinetId);
    var config = getFrameConfig(originFrame);
    var autoFrames = findAutoFramesForCabinet(originFrameId, logicalCabinetId);
    var frames = [originFrame];
    var previousFrame = originFrame;
    var i;

    for (i = 1; i < pageCount; i++) {
      var frame = autoFrames.length >= i ? autoFrames[i - 1] : null;

      if (frame == null) {
        var rightmostInGroup = getRightmostFrameInGroup(originGroupId);
        var rightmostGeometry =
          rightmostInGroup != null ? model.getGeometry(rightmostInGroup) : null;
        frame = createDrawingFrameCell(
          config,
          Math.max(
            getMaxFramePageNumberInGroup(originGroupId),
            getFramePageNumber(previousFrame),
          ) + 1,
          {
            originFrameId: originFrameId,
            groupId: originGroupId,
            autoFrameOwner: logicalCabinetId,
            autoFrameIndex: i,
          },
        );
        frame.geometry = frame.geometry.clone();
        frame.geometry.x =
          Math.max(
            model.getGeometry(previousFrame).x +
              config.width +
              FRAME_HORIZONTAL_GAP,
            rightmostGeometry != null
              ? rightmostGeometry.x +
                  rightmostGeometry.width +
                  FRAME_HORIZONTAL_GAP
              : model.getGeometry(previousFrame).x +
                  config.width +
                  FRAME_HORIZONTAL_GAP,
          );
        frame.geometry.y = model.getGeometry(previousFrame).y;
        addTopLevelCell(frame);
      }

      frames.push(frame);
      previousFrame = frame;
    }

    if (!skipCleanup) {
      for (i = pageCount; i <= autoFrames.length; i++) {
        var extraFrame = autoFrames[i - 1];

        if (
          extraFrame != null &&
          frameHasOnlyCabinetChildren(extraFrame, logicalCabinetId)
        ) {
          model.remove(extraFrame);
        }
      }
    }

    return frames;
  }

  function relayoutCabinetByModel(cabinetModel) {
    var normalized = normalizeCabinetModel(cabinetModel);
    var originFrame = findFrameById(normalized.originFrameId);

    if (originFrame == null) {
      throw new Error("未找到配电柜所属的起始图框");
    }

    var frameConfig = getFrameConfig(originFrame);
    var descriptors = buildCabinetPageDescriptors(normalized, frameConfig);
    var oldSegments = findCabinetSegments(normalized.logicalCabinetId);
    var attachments = collectCabinetAttachments(oldSegments);
    var frames;
    var newSegments = [];
    var i;

    frames = ensureCabinetFrames(
      originFrame,
      normalized,
      descriptors.length,
      true,
    );

    for (i = 0; i < descriptors.length; i++) {
      var segment = buildCabinetSegmentCell(
        normalized,
        trim(getAttr(frames[i], "frameId")),
        descriptors[i],
      );
      model.add(frames[i], segment);
      newSegments.push(segment);
    }

    restoreCabinetAttachments(attachments, buildCabinetPortMap(newSegments));

    for (i = 0; i < oldSegments.length; i++) {
      model.remove(oldSegments[i]);
    }

    ensureCabinetFrames(originFrame, normalized, descriptors.length);
    return newSegments;
  }

  // 背景图元是 root 的第一个子节点，采用相对定位，保证整体插入/拖动时能和 root 一起移动。
  function createBodyCell(spec) {
    var geometry = new mxGeometry(0, 0, spec.size.width, spec.size.height);
    geometry.relative = true;
    geometry.offset = new mxPoint(0, 0);
    var cell = new mxCell(
      createMetaCell(BODY_TAG, BODY_KIND, "main", ""),
      geometry,
      makeBodyStyle(spec),
    );
    cell.vertex = true;
    cell.setConnectable(false);

    return cell;
  }

  function applyBodyCell(cell, spec) {
    var geometry = model.getGeometry(cell);

    if (geometry == null) {
      geometry = new mxGeometry();
    } else {
      geometry = geometry.clone();
    }

    geometry.x = 0;
    geometry.y = 0;
    geometry.width = spec.size.width;
    geometry.height = spec.size.height;
    geometry.relative = true;
    geometry.offset = new mxPoint(0, 0);
    model.setGeometry(cell, geometry);

    var value = cloneValue(cell.value);
    value.setAttribute("esKind", BODY_KIND);
    value.setAttribute("esKey", "main");
    value.setAttribute("label", "");
    model.setValue(cell, value);
    model.setStyle(cell, makeBodyStyle(spec));
    cell.setConnectable(false);
  }

  // 文本框和主/备标记都实现为 root 的相对子节点。
  function createLabelCell(label) {
    var geometry = new mxGeometry(label.x, label.y, label.width, label.height);
    geometry.relative = true;
    geometry.offset = new mxPoint(-label.width / 2, -label.height / 2);
    var cell = new mxCell(
      createMetaCell(LABEL_TAG, LABEL_KIND, label.id, label.text),
      geometry,
      makeLabelStyle(label.align),
    );
    cell.vertex = true;
    cell.setConnectable(false);

    return cell;
  }

  function applyLabelCell(cell, label) {
    var geometry = model.getGeometry(cell);

    if (geometry == null) {
      geometry = new mxGeometry();
    } else {
      geometry = geometry.clone();
    }

    geometry.x = label.x;
    geometry.y = label.y;
    geometry.width = label.width;
    geometry.height = label.height;
    geometry.relative = true;
    geometry.offset = new mxPoint(-label.width / 2, -label.height / 2);
    model.setGeometry(cell, geometry);

    var value = cloneValue(cell.value);
    value.setAttribute("esKind", LABEL_KIND);
    value.setAttribute("esKey", label.id);
    value.setAttribute("label", label.text);
    model.setValue(cell, value);
    model.setStyle(cell, makeLabelStyle(label.align));
    cell.setConnectable(false);
  }

  // 创建“主/备”徽标子节点。
  function createBadgeCell(mode) {
    var text = mode == "standby" ? "\u5907" : "\u4e3b";
    var geometry = new mxGeometry(1, 0, 24, 18);
    geometry.relative = true;
    geometry.offset = new mxPoint(-32, 8);
    var cell = new mxCell(
      createMetaCell(BADGE_TAG, BADGE_KIND, "mode", text),
      geometry,
      makeBadgeStyle(mode),
    );
    cell.vertex = true;
    cell.setConnectable(false);

    return cell;
  }

  // 更新已有主/备徽标子节点的几何、文案和样式。
  function applyBadgeCell(cell, mode) {
    var geometry = model.getGeometry(cell);

    if (geometry == null) {
      geometry = new mxGeometry();
    } else {
      geometry = geometry.clone();
    }

    geometry.x = 1;
    geometry.y = 0;
    geometry.width = 24;
    geometry.height = 18;
    geometry.relative = true;
    geometry.offset = new mxPoint(-32, 8);
    model.setGeometry(cell, geometry);

    var value = cloneValue(cell.value);
    value.setAttribute("esKind", BADGE_KIND);
    value.setAttribute("esKey", "mode");
    value.setAttribute("label", mode == "standby" ? "\u5907" : "\u4e3b");
    model.setValue(cell, value);
    model.setStyle(cell, makeBadgeStyle(mode));
    cell.setConnectable(false);
  }

  // 把 root 当前已有子节点按 kind/key 建索引，后续同步逻辑依赖它做“增量对账”。
  function mapChildren(root) {
    var children = {
      body: {},
      label: {},
      badge: {},
    };

    for (var i = 0; i < model.getChildCount(root); i++) {
      var child = model.getChildAt(root, i);
      var kind = getAttr(child, "esKind");
      var key = getAttr(child, "esKey");

      if (kind != null && key != null && children[kind] != null) {
        children[kind][key] = child;
      }
    }

    return children;
  }

  // 删除当前不再需要保留的子节点
  function removeUnused(map, keep) {
    for (var key in map) {
      if (map.hasOwnProperty(key) && keep[key] == null) {
        model.remove(map[key]);
      }
    }
  }

  // addChild 同时兼容两种场景：
  // 1. 复合图元还没插入画布时，直接用 root.insert 组装对象树；
  // 2. 图元已在模型里时，必须走 model.add，才能触发视图刷新。
  function addChild(root, child) {
    var index = arguments.length > 2 ? arguments[2] : null;

    if (root.parent != null) {
      model.add(root, child, index);
    } else {
      root.insert(child, index);
    }
  }

  // 保证根节点几何和 spec.size 一致。
  function ensureRootGeometry(root, spec) {
    var geometry = model.getGeometry(root);

    if (geometry == null) {
      geometry = new mxGeometry(0, 0, spec.size.width, spec.size.height);
    } else {
      geometry = geometry.clone();
      geometry.width = spec.size.width;
      geometry.height = spec.size.height;
    }

    if (root.parent != null) {
      model.setGeometry(root, geometry);
    } else {
      root.geometry = geometry;
    }
  }

  // root 自身不显示文字，只保存业务数据和 connection constraints 所需信息。
  function ensureRootValue(root, spec, layout) {
    var value = applyValueMetadata(cloneValue(root.value), spec, layout);

    if (root.parent != null) {
      model.setValue(root, value);
      model.setStyle(root, makeRootStyle());
    } else {
      root.value = value;
      root.style = makeRootStyle();
      root.setConnectable(false);
    }
  }

  // 同步函数：
  // 根据 spec 把 root 调整为“背景图 + 文本 + 徽标 + 元数据”一致状态。
  function syncRoot(root, spec, baseLayout) {
    var layout = buildPortLayout(spec, baseLayout);
    var resolvedLabels = buildResolvedLabels(spec.labels, spec.data);
    ensureRootGeometry(root, spec);
    ensureRootValue(root, spec, layout);
    var mapped = mapChildren(root);
    var keepBodies = {};
    var keepLabels = {};
    var keepBadges = {};
    var child;
    var i;

    child = mapped.body.main;

    if (child != null) {
      applyBodyCell(child, spec);
    } else {
      addChild(root, createBodyCell(spec), 0);
    }

    keepBodies.main = true;

    for (i = 0; i < resolvedLabels.length; i++) {
      var label = resolvedLabels[i];
      child = mapped.label[label.id];

      if (child != null) {
        applyLabelCell(child, label);
      } else {
        addChild(root, createLabelCell(label));
      }

      keepLabels[label.id] = true;
    }

    if (
      spec.device.mode.length > 0 &&
      spec.svgVariants[spec.device.mode] == null
    ) {
      child = mapped.badge.mode;

      if (child != null) {
        applyBadgeCell(child, spec.device.mode);
      } else {
        addChild(root, createBadgeCell(spec.device.mode));
      }

      keepBadges.mode = true;
    }

    if (root.parent != null) {
      removeUnused(mapped.body, keepBodies);
      removeUnused(mapped.label, keepLabels);
      removeUnused(mapped.badge, keepBadges);
    }

    root.setConnectable(true);
    return root;
  }

  // 新建一个完整电气图元时，从 root 开始组装整棵子树。
  function buildSymbolCell(spec) {
    var root = new mxCell(
      createNode(ROOT_TAG),
      new mxGeometry(0, 0, spec.size.width, spec.size.height),
      "",
    );
    root.vertex = true;
    root.setConnectable(true);

    return syncRoot(root, spec, null);
  }

  // 从图元根节点反向提取 spec，以便 Edit Data 后重新刷新图元时使用。
  function extractSpec(root) {
    var raw = getAttr(root, "symbolPayload");

    if (raw == null || raw.length == 0) {
      throw new Error("缺少 symbolPayload 数据");
    }

    var spec = JSON.parse(raw);

    if (!isObject(spec.device)) {
      spec.device = {};
    }

    spec.ports = normalizePortLayout(spec.ports);
    spec.labels = normalizeLabels(spec.labels);

    spec.symbolId = trim(getAttr(root, "symbolId")) || spec.symbolId;
    spec.instanceId =
      trim(getAttr(root, "instanceId")) || trim(spec.instanceId);
    spec.title = trim(getAttr(root, "title")) || spec.title;
    spec.device.name =
      trim(getAttr(root, "deviceName")) || trim(spec.device.name);
    spec.device.code =
      trim(getAttr(root, "deviceCode")) || trim(spec.device.code);
    spec.device.power =
      trim(getAttr(root, "devicePower")) || trim(spec.device.power);
    spec.device.mode = normalizeMode(getAttr(root, "mode") || spec.device.mode);
    spec.variantField =
      trim(getAttr(root, "variantField")) || trim(spec.variantField || "mode");

    var portsRaw = getAttr(root, "portsJson");

    if (portsRaw == null || portsRaw.length == 0) {
      portsRaw = getAttr(root, "portLayout");
    }

    if (portsRaw != null && portsRaw.length > 0) {
      spec.ports = parsePortLayout(portsRaw);
    }

    var labelsRaw = getAttr(root, "labelsJson");

    if (labelsRaw != null && labelsRaw.length > 0) {
      try {
        spec.labels = normalizeLabels(JSON.parse(labelsRaw));
      } catch (e) {
        // ignore malformed labels override
      }
    }

    var schemaJson = getAttr(root, "schemaJson");

    if (schemaJson != null && schemaJson.length > 0) {
      try {
        spec.schema = JSON.parse(schemaJson);
      } catch (e) {
        // ignore malformed schema override
      }
    }

    var dataJson = getAttr(root, "dataJson");

    if (dataJson != null && dataJson.length > 0) {
      try {
        spec.data = JSON.parse(dataJson);
      } catch (e) {
        // ignore malformed data override
      }
    }

    var paramsJson = getAttr(root, "paramsJson");

    if (paramsJson != null && paramsJson.length > 0) {
      try {
        spec.device.params = JSON.parse(paramsJson);
      } catch (e) {
        // ignore malformed params override
      }
    }

    var geo = model.getGeometry(root);

    if (geo != null) {
      spec.size = {
        width: Math.max(20, Math.round(geo.width)),
        height: Math.max(20, Math.round(geo.height)),
      };
    }

    return normalizeSpec(spec);
  }

  // “刷新电气图元”的底层实现：读取当前 root 状态并重新同步整棵结构
  function refreshRoot(root) {
    var spec = extractSpec(root);
    var portLayout = parsePortLayout(getAttr(root, "portLayout"));
    syncRoot(root, spec, portLayout);
    return spec;
  }

  // 监听模型变化，目前只处理图元尺寸变化。
  // 当用户直接拖拽改变根图元宽高时，需要重算背景和文本默认布局。
  function handleModelChange(sender, evt) {
    if (state.updatingModel) {
      return;
    }

    var changes = evt.getProperty("edit").changes;
    var resizeRoots = {};

    for (var i = 0; i < changes.length; i++) {
      var change = changes[i];

      if (change.constructor == mxGeometryChange && change.cell != null) {
        if (isElectricalRoot(change.cell)) {
          var previous = change.previous;
          var geometry = model.getGeometry(change.cell);

          if (
            previous != null &&
            geometry != null &&
            (previous.width != geometry.width ||
              previous.height != geometry.height)
          ) {
            resizeRoots[change.cell.id] = change.cell;
          }
        }
      }
    }

    var hasResize = false;

    for (var key in resizeRoots) {
      if (resizeRoots.hasOwnProperty(key)) {
        hasResize = true;
        break;
      }
    }

    if (!hasResize) {
      return;
    }

    state.updatingModel = true;
    model.beginUpdate();

    try {
      for (var id in resizeRoots) {
        if (resizeRoots.hasOwnProperty(id)) {
          refreshRoot(resizeRoots[id]);
        }
      }
    } finally {
      model.endUpdate();
      state.updatingModel = false;
    }
  }

  // 根据根节点元数据动态生成左右两侧的连接点。
  function getElectricalConstraints(cell) {
    var root = findPortHostRoot(cell);

    if (root == null) {
      return null;
    }

    var layout = buildPortLayout(
      { ports: parsePortLayout(getAttr(root, "portsJson")) },
      parsePortLayout(getAttr(root, "portLayout")),
    );
    var constraints = [];
    var i;

    for (i = 0; i < layout.length; i++) {
      var point = layout[i];
      constraints.push(
        new mxConnectionConstraint(
          new mxPoint(point.x, point.y),
          false,
          point.id || "port:" + i,
        ),
      );
    }

    return constraints;
  }

  function getPortMetaByConstraint(root, constraint) {
    var ports = parsePortLayout(getAttr(root, "portsJson"));
    var name = constraint != null ? trim(constraint.name) : "";
    var i;

    for (i = 0; i < ports.length; i++) {
      if (trim(ports[i].id) == name) {
        return ports[i];
      }
    }

    return null;
  }

  function getPortMetaById(root, portId) {
    var ports = parsePortLayout(getAttr(root, "portsJson"));
    var target = trim(portId);
    var i;

    for (i = 0; i < ports.length; i++) {
      if (trim(ports[i].id) == target) {
        return ports[i];
      }
    }

    return null;
  }

  function mapPortDirectionToConstraint(direction) {
    switch (normalizePortDirection(direction)) {
      case "left":
        return "west";
      case "right":
        return "east";
      case "up":
        return "north";
      case "down":
        return "south";
      default:
        return "";
    }
  }

  function validatePortIoMode(sourcePort, targetPort) {
    if (sourcePort != null && normalizePortIoMode(sourcePort.ioMode) == "in") {
      return "该端子仅允许接入，不能作为连线起点";
    }

    if (targetPort != null && normalizePortIoMode(targetPort.ioMode) == "out") {
      return "该端子仅允许接出，不能作为连线终点";
    }

    return null;
  }

  var oldGetAllConnectionConstraints = graph.getAllConnectionConstraints;

  // 用 mxConnectionConstraint 动态生成 draw.io 原生连接点。
  graph.getAllConnectionConstraints = function (terminal, source) {
    var root = findPortHostRoot(terminal != null ? terminal.cell : null);

    if (root != null) {
      return getElectricalConstraints(root);
    }

    return oldGetAllConnectionConstraints.apply(this, arguments);
  };

  var oldSetConnectionConstraint = graph.setConnectionConstraint;

  // 保持连接点仍然是 draw.io 原生约束点，同时把端子方向约束写入边样式，
  // 让正交连线在连接后按照端子方向出线。
  graph.setConnectionConstraint = function (
    edge,
    terminal,
    source,
    constraint,
  ) {
    if (edge == null) {
      oldSetConnectionConstraint.apply(this, arguments);
      return;
    }

    var previousStyle = model.getStyle(edge) || "";
    var previousPortId = trim(
      mxUtils.getValue(previousStyle, source ? "sourcePortId" : "targetPortId", ""),
    );
    var previousRoot = findPortHostRoot(model.getTerminal(edge, source));
    oldSetConnectionConstraint.apply(this, arguments);

    var root = findPortHostRoot(terminal);

    if (root == null || edge == null) {
      return;
    }
    var port = getPortMetaByConstraint(root, constraint);
    applyEdgePortConstraintMetadata(edge, root, source, constraint);

    if (
      previousRoot != null &&
      root != null &&
      previousPortId.length > 0 &&
      port != null &&
      trim(port.id).length > 0 &&
      (previousRoot != root || previousPortId != trim(port.id))
    ) {
      moveConnectedGroupToCabinetPort(
        edge,
        source,
        previousRoot,
        previousPortId,
        root,
        port,
      );
    }
  };

  var oldValidateConnection = graph.connectionHandler.validateConnection;

  graph.connectionHandler.validateConnection = function (source, target) {
    var error = oldValidateConnection.apply(this, arguments);

    if (error != null) {
      setCanvasStatus(error);
      return error;
    }

    var sourceRoot = findPortHostRoot(source);
    var targetRoot = findPortHostRoot(target);

    if (sourceRoot == null && targetRoot == null) {
      return null;
    }

    var sourcePort = getPortMetaByConstraint(sourceRoot, this.sourceConstraint);
    var targetPort = getPortMetaByConstraint(
      targetRoot,
      this.constraintHandler != null
        ? this.constraintHandler.currentConstraint
        : null,
    );
    error = validatePortIoMode(sourcePort, targetPort);

    setCanvasStatus(error);

    return error;
  };

  graph.connectionHandler.addListener(mxEvent.RESET, function () {
    setCanvasStatus("");
  });

  graph.connectionHandler.addListener(mxEvent.CONNECT, function () {
    setCanvasStatus("");
  });

  graph.addListener(mxEvent.CLICK, function (sender, evt) {
    var cell = evt.getProperty("cell");
    var mouseEvent = evt.getProperty("event");

     if (state.portSwapSession != null) {
      var portRoot = findPortHostRoot(cell);
      var sessionLogicalId =
        state.portSwapSession.cabinetRoot != null
          ? trim(getAttr(state.portSwapSession.cabinetRoot, "logicalCabinetId"))
          : "";

      if (
        isCabinetSegment(portRoot) &&
        trim(getAttr(portRoot, "logicalCabinetId")) == sessionLogicalId
      ) {
        var nextPort = getNearestCabinetPortFromClick(portRoot, mouseEvent);

        if (nextPort != null) {
          commitPortSwap(state.portSwapSession, portRoot, nextPort);
          evt.consume();
          return;
        }
      }

      if (cell == null) {
        exitPortSwapMode();
        evt.consume();
        return;
      }
    }

    if (isCabinetGap(cell)) {
      setSelectedCabinetGap(
        getAttr(cell, "logicalCabinetId"),
        getAttr(cell, "gapIndex"),
      );
      openCabinetGapDialog(cell, mouseEvent);
      evt.consume();
    } else if (state.selectedCabinetGap != null) {
      closeGapDialogWindow();
      setSelectedCabinetGap(null, null);
    }
  });

  function createLibraryEntry(spec) {
    var root = buildSymbolCell(spec);
    var bounds = graph.getBoundingBoxFromGeometry([root]);

    if (bounds != null) {
      root.geometry = root.geometry.clone();
      root.geometry.x = -bounds.x;
      root.geometry.y = -bounds.y;
    }

    var xml = mxUtils.getXml(graph.encodeCells([root]));

    if (Editor.defaultCompressed) {
      xml = Graph.compress(xml);
    }

    return {
      xml: xml,
      w: bounds != null ? Math.round(bounds.width) : spec.size.width,
      h: bounds != null ? Math.round(bounds.height) : spec.size.height,
      title: spec.templateName || spec.title,
      spec: cloneJson(spec),
    };
  }

  // 优先从库条目的 spec 字段读取模板；旧条目再回退到 xml 反解。
  function getLibraryEntrySpec(image) {
    if (image != null && isObject(image.spec)) {
      return normalizeSpec(cloneJson(image.spec));
    }

    if (image == null || image.xml == null) {
      throw new Error("模板条目缺少 xml");
    }

    var xml = image.xml;

    if ("<" != xml.charAt(0)) {
      xml = Graph.decompress(xml);
    }

    var cells = ui.stringToCells(xml);
    var i;

    for (i = 0; i < cells.length; i++) {
      if (isElectricalRoot(cells[i])) {
        return extractSpec(cells[i]);
      }
    }

    throw new Error("库条目中未找到电气图元");
  }

  // 使用 symbolId 作为模板主键，重复保存时覆盖旧模板而不是继续追加。
  function findLibraryEntryIndex(images, symbolId) {
    var id = trim(symbolId);
    var i;

    for (i = 0; i < images.length; i++) {
      try {
        if (trim(getLibraryEntrySpec(images[i]).symbolId) == id) {
          return i;
        }
      } catch (e) {
        // ignore malformed entry
      }
    }

    return -1;
  }

  function isTemplateNameTaken(name, ignoreSymbolId) {
    var target = trim(name);
    var ignoreId = trim(ignoreSymbolId);
    var i;

    if (target.length == 0) {
      return false;
    }

    for (i = 0; i < state.libraryImages.length; i++) {
      try {
        var spec = getLibraryEntrySpec(state.libraryImages[i]);

        if (
          trim(spec.templateName || spec.title) == target &&
          trim(spec.symbolId) != ignoreId
        ) {
          return true;
        }
      } catch (e) {
        // ignore malformed entry
      }
    }

    return false;
  }

  // 从本地存储读取“电气图元库”，并在需要时同步打开到左侧 Sidebar。
  function loadStoredLibrary(callback, openInSidebar) {
    StorageFile.getFileContent(
      ui,
      LIBRARY_TITLE,
      function (data) {
        var images = [];

        if (data != null && data.length > 0) {
          try {
            var doc = mxUtils.parseXml(data);

            if (
              doc.documentElement != null &&
              doc.documentElement.nodeName == "mxlibrary"
            ) {
              images = JSON.parse(mxUtils.getTextContent(doc.documentElement));
            }
          } catch (e) {
            images = [];
          }
        }

        state.libraryImages = images;

        if (openInSidebar && data != null && data.length > 0) {
          ui.libraryLoaded(
            new StorageLibrary(ui, data, LIBRARY_TITLE),
            images,
            LIBRARY_TITLE,
            true,
          );
        }

        if (callback != null) {
          callback(images);
        }
      },
      function () {
        state.libraryImages = [];

        if (callback != null) {
          callback([]);
        }
      },
    );
  }

  // 保存图库后，立即通知 Sidebar 重新加载，保证左侧马上可见
  function saveLibraryImages(images, callback) {
    var xml = ui.createLibraryDataFromImages(images);
    var file = new StorageLibrary(ui, xml, LIBRARY_TITLE);
    ui.libraryLoaded(file, images, LIBRARY_TITLE, true);
    file.save(
      false,
      function () {
        state.libraryImages = images;

        if (callback != null) {
          callback(file, images, xml);
        }
      },
      function (err) {
        ui.handleError(err || { message: "保存电气图库失败" });
      },
    );
  }

  // 把当前 spec 转成一个新的图库条目并追加到电气图库
  function addToLibrary(spec, onSaved) {
    loadStoredLibrary(function (images) {
      var next = images.slice();
      var entry = createLibraryEntry(spec);
      var index = findLibraryEntryIndex(next, spec.symbolId);
      var i;

      for (i = 0; i < next.length; i++) {
        try {
          var currentSpec = getLibraryEntrySpec(next[i]);

          if (
            trim(currentSpec.templateName || currentSpec.title) ==
              trim(spec.templateName || spec.title) &&
            trim(currentSpec.symbolId) != trim(spec.symbolId)
          ) {
            showStatus("图元类型名称不能重复", true);
            return;
          }
        } catch (e) {
          // ignore malformed entry
        }
      }

      if (index >= 0) {
        next[index] = entry;
      } else {
        next.push(entry);
      }

      saveLibraryImages(next, function () {
        showStatus(index >= 0 ? "已更新图库模板" : "已加入图库", false);
        if (typeof onSaved === "function") {
          onSaved();
        }
      });
    });
  }

  // 导出 .drawiolib
  function exportLibrary() {
    loadStoredLibrary(function (images) {
      if (images.length == 0) {
        showStatus("电气图库为空", true);
        return;
      }

      var xml = ui.createLibraryDataFromImages(images);
      ui.saveLocalFile(
        xml,
        "electrical-symbols.drawiolib",
        "text/xml",
        null,
        null,
        true,
        null,
        "drawiolib",
      );
      showStatus("已开始导出图库", false);
    });
  }

  function removeTemplateFromLibrary(symbolId, onRemoved) {
    loadStoredLibrary(function (images) {
      var next = [];
      var removed = false;
      var i;

      for (i = 0; i < images.length; i++) {
        try {
          if (trim(getLibraryEntrySpec(images[i]).symbolId) == trim(symbolId)) {
            removed = true;
            continue;
          }
        } catch (e) {
          // keep malformed entries untouched
        }

        next.push(images[i]);
      }

      if (!removed) {
        showStatus("未找到要删除的图元模板", true);
        return;
      }

      saveLibraryImages(next, function () {
        showStatus("已删除图元模板", false);

        if (typeof onRemoved === "function") {
          onRemoved(next);
        }
      });
    });
  }

  function buildInstanceSpec(instanceData, template, sizeOverride) {
    template =
      template != null
        ? normalizeSpec(cloneJson(template))
        : buildTemplateSpec();
    var mergedData = deepMerge(
      buildEmptyValueFromSchema(template.schema),
      instanceData,
    );
    var spec = cloneJson(template);
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
    spec.instanceId = generateInstanceId();
    spec.title = trim(titleValue) || trim(nameValue) || template.title;
    spec.size = {
      width: Math.max(
        20,
        toInt(
          sizeOverride != null ? sizeOverride.width : null,
          template.size.width,
        ),
      ),
      height: Math.max(
        20,
        toInt(
          sizeOverride != null ? sizeOverride.height : null,
          template.size.height,
        ),
      ),
    };
    spec.device.name = trim(nameValue);
    spec.device.code = trim(codeValue);
    spec.device.power = trim(powerValue);
    spec.device.mode = normalizeMode(modeValue);
    variantKey = getActiveVariantKey(spec);
    layout = getVariantLayout(template, variantKey);
    spec.ports = layout.ports;
    spec.labels = buildResolvedLabels(layout.labels, mergedData);

    return normalizeSpec(spec);
  }

  // 从本地模板库选择一个图元类型，再输入实例 JSON 创建到画布。
  function openCreateFromLibraryDialog(preferredSymbolId) {
    loadStoredLibrary(function (images) {
      var templates = [];
      var i;

      for (i = 0; i < images.length; i++) {
        try {
          templates.push(getLibraryEntrySpec(images[i]));
        } catch (e) {
          // ignore malformed entry
        }
      }

      if (templates.length == 0) {
        showStatus("电气图库为空，请先保存图元类型", true);
        return;
      }

      var initialIndex = 0;

      if (trim(preferredSymbolId).length > 0) {
        for (i = 0; i < templates.length; i++) {
          if (trim(templates[i].symbolId) == trim(preferredSymbolId)) {
            initialIndex = i;
            break;
          }
        }
      }

      var currentTemplate = templates[initialIndex];
      var div = document.createElement("div");
      div.style.padding = "12px";
      div.style.width = "100%";
      div.style.height = "100%";
      div.style.boxSizing = "border-box";
      div.style.display = "flex";
      div.style.flexDirection = "column";
      div.style.background = Editor.isDarkMode() ? "#1e1e1e" : "#ffffff";

      var title = document.createElement("div");
      title.style.fontWeight = "bold";
      title.style.marginBottom = "8px";
      title.innerText = "选择图元类型并填写实例属性";
      div.appendChild(title);

      var select = document.createElement("select");
      select.style.width = "100%";
      select.style.boxSizing = "border-box";
      select.style.marginBottom = "10px";
      div.appendChild(select);

      var sizeRow = document.createElement("div");
      sizeRow.style.display = "flex";
      sizeRow.style.alignItems = "center";
      sizeRow.style.gap = "8px";
      sizeRow.style.marginBottom = "10px";
      div.appendChild(sizeRow);

      var widthLabel = document.createElement("div");
      widthLabel.innerText = "宽";
      sizeRow.appendChild(widthLabel);

      var widthInput = document.createElement("input");
      widthInput.setAttribute("type", "number");
      widthInput.setAttribute("min", "20");
      widthInput.style.width = "120px";
      sizeRow.appendChild(widthInput);

      var heightLabel = document.createElement("div");
      heightLabel.innerText = "高";
      sizeRow.appendChild(heightLabel);

      var heightInput = document.createElement("input");
      heightInput.setAttribute("type", "number");
      heightInput.setAttribute("min", "20");
      heightInput.style.width = "120px";
      sizeRow.appendChild(heightInput);

      var formPanel = document.createElement("div");
      formPanel.style.flex = "1 1 auto";
      formPanel.style.minHeight = "220px";
      formPanel.style.overflow = "auto";
      formPanel.style.display = "flex";
      formPanel.style.flexDirection = "column";
      formPanel.style.gap = "8px";
      div.appendChild(formPanel);

      var formControls = [];

      var buttons = document.createElement("div");
      buttons.style.marginTop = "10px";
      buttons.style.flex = "0 0 auto";
      div.appendChild(buttons);

      function syncTemplate(index) {
        currentTemplate = templates[index];
        widthInput.value = String(currentTemplate.size.width);
        heightInput.value = String(currentTemplate.size.height);
        formPanel.innerHTML = "";
        formControls = [];

        flattenSchemaFields(currentTemplate.schema, "", []).forEach(
          function (field) {
            var block = document.createElement("div");
            block.style.display = "flex";
            block.style.flexDirection = "column";
            block.style.gap = "4px";
            formPanel.appendChild(block);

            var row = document.createElement("div");
            row.style.display = "grid";
            row.style.gridTemplateColumns = "140px 1fr";
            row.style.gap = "8px";
            row.style.alignItems = "center";
            block.appendChild(row);

            var label = document.createElement("div");
            label.innerText = field.path + (field.required ? " *" : "");
            row.appendChild(label);

            var control;
            var type = normalizeSchemaType(field.type);

            if (type == "enum") {
              control = document.createElement("select");
              var emptyOption = document.createElement("option");
              emptyOption.value = "";
              emptyOption.innerText = "请选择";
              control.appendChild(emptyOption);
              field.enumValues.forEach(function (optionValue) {
                var option = document.createElement("option");
                option.value = optionValue;
                option.innerText = optionValue;
                control.appendChild(option);
              });
            } else if (type == "boolean") {
              control = document.createElement("select");
              [
                { value: "", label: "请选择" },
                { value: "true", label: "true" },
                { value: "false", label: "false" },
              ].forEach(function (item) {
                var option = document.createElement("option");
                option.value = item.value;
                option.innerText = item.label;
                control.appendChild(option);
              });
            } else {
              control = document.createElement("input");
              control.setAttribute(
                "type",
                type == "number" ? "number" : "text",
              );
            }

            control.style.width = "100%";
            control.style.boxSizing = "border-box";
            row.appendChild(control);

            var error = document.createElement("div");
            error.style.marginLeft = "148px";
            error.style.minHeight = "16px";
            error.style.fontSize = "12px";
            error.style.color = "#b3261e";
            block.appendChild(error);

            formControls.push({
              field: field,
              control: control,
              type: type,
              error: error,
            });
          },
        );
      }

      for (i = 0; i < templates.length; i++) {
        var option = document.createElement("option");
        option.value = String(i);
        option.innerText = templates[i].templateName || templates[i].title;
        select.appendChild(option);
      }

      mxEvent.addListener(select, "change", function () {
        syncTemplate(parseInt(select.value, 10) || 0);
      });

      select.value = String(initialIndex);
      syncTemplate(initialIndex);

      var wnd = new mxWindow(
        "创建电气图元",
        div,
        140,
        120,
        460,
        520,
        true,
        true,
      );
      wnd.destroyOnClose = true;
      wnd.setClosable(true);
      wnd.setMaximizable(false);
      wnd.setResizable(true);
      wnd.setScrollable(true);
      wnd.setVisible(true);

      var submitButton = createButton("创建到画布", function () {
        try {
          var payload = {};
          var firstInvalid = null;

          formControls.forEach(function (entry) {
            entry.error.innerText = "";
            entry.control.style.borderColor = "";
            entry.control.style.boxShadow = "";
          });

          formControls.forEach(function (entry) {
            var rawValue = trim(entry.control.value);
            var value = null;

            if (entry.type == "number") {
              value = rawValue.length > 0 ? toFloat(rawValue, null) : null;
            } else if (entry.type == "boolean") {
              value =
                rawValue == "true" ? true : rawValue == "false" ? false : null;
            } else {
              value = rawValue;
            }

            if (
              entry.field.required &&
              (value == null ||
                (typeof value === "string" && value.length == 0))
            ) {
              entry.error.innerText = "必填项";
              entry.control.style.borderColor = "#b3261e";
              entry.control.style.boxShadow = "0 0 0 1px rgba(179,38,30,0.2)";
              firstInvalid = firstInvalid || entry;
              return;
            }

            if (entry.type == "enum" && rawValue.length > 0) {
              if (entry.field.enumValues.indexOf(rawValue) < 0) {
                entry.error.innerText = "必须选择枚举定义中的值";
                entry.control.style.borderColor = "#b3261e";
                entry.control.style.boxShadow = "0 0 0 1px rgba(179,38,30,0.2)";
                firstInvalid = firstInvalid || entry;
                return;
              }
            }

            if (
              entry.type == "number" &&
              rawValue.length > 0 &&
              value == null
            ) {
              entry.error.innerText = "请输入有效数字";
              entry.control.style.borderColor = "#b3261e";
              entry.control.style.boxShadow = "0 0 0 1px rgba(179,38,30,0.2)";
              firstInvalid = firstInvalid || entry;
              return;
            }

            setValueByPath(payload, entry.field.path, value);
          });

          if (firstInvalid != null) {
            firstInvalid.control.focus();
            if (typeof firstInvalid.control.scrollIntoView === "function") {
              firstInvalid.control.scrollIntoView({
                block: "nearest",
                behavior: "smooth",
              });
            }
            showStatus("请先修正表单中的错误字段", true);
            return;
          }

          insertIntoGraph(
            buildInstanceSpec(payload, currentTemplate, {
              width: widthInput.value,
              height: heightInput.value,
            }),
          );
          wnd.destroy();
        } catch (e) {
          showStatus(e.message || String(e), true);
        }
      });
      submitButton.style.marginTop = "0";
      buttons.appendChild(submitButton);
    });
  }

  function openEditInstanceDialog() {
    var root = findElectricalRoot(graph.getSelectionCell());

    if (root == null) {
      showStatus("请先选择一个电气图元实例", true);
      return;
    }

    if (state.instanceWindow != null) {
      state.instanceWindow.destroy();
      state.instanceWindow = null;
    }

    var editorState = {
      spec: extractSpec(root),
      selectedItem: null,
      mode: "select",
      nextId: 1,
      preview: null,
      statusNode: null,
    };

    editorState.spec.ports = normalizePortLayout(editorState.spec.ports);
    editorState.spec.labels = normalizeLabels(editorState.spec.labels);

    function scanNextId() {
      var maxId = 0;

      function scan(id) {
        var match = /:(\d+)$/.exec(trim(id));

        if (match != null) {
          maxId = Math.max(maxId, parseInt(match[1], 10) || 0);
        }
      }

      editorState.spec.ports.forEach(function (item) {
        scan(item.id);
      });
      editorState.spec.labels.forEach(function (item) {
        scan(item.id);
      });
      editorState.nextId = maxId + 1;
    }

    function nextEditorId(prefix) {
      var id = prefix + ":" + editorState.nextId;
      editorState.nextId += 1;
      return id;
    }

    function setEditorSelection(type, id) {
      editorState.selectedItem =
        type != null && id != null ? { type: type, id: id } : null;
    }

    function updateEditorStatus(message, isError) {
      if (editorState.statusNode != null) {
        editorState.statusNode.innerText = message || "";
        editorState.statusNode.style.color = isError ? "#b3261e" : "#2e7d32";
      }
    }

    function getEditorLabelText(label) {
      var binding = trim(label.binding);

      if (binding.length > 0) {
        var value = getValueByPath(editorState.spec.data || {}, binding);

        if (value != null) {
          return String(value);
        }

        if (trim(label.text).length > 0) {
          return label.text;
        }

        return "{{" + binding + "}}";
      }

      return trim(label.text).length > 0 ? label.text : "文本";
    }

    function deleteEditorSelection() {
      if (editorState.selectedItem == null) {
        return;
      }

      if (editorState.selectedItem.type == "port") {
        editorState.spec.ports = editorState.spec.ports.filter(function (item) {
          return item.id != editorState.selectedItem.id;
        });
      } else if (editorState.selectedItem.type == "label") {
        editorState.spec.labels = editorState.spec.labels.filter(function (item) {
          return item.id != editorState.selectedItem.id;
        });
      }

      setEditorSelection(null, null);
      renderEditorPreview();
    }

    function renderEditorPreview() {
      var preview = editorState.preview;
      preview.innerHTML = "";

      var toolbar = document.createElement("div");
      toolbar.style.display = "flex";
      toolbar.style.alignItems = "center";
      toolbar.style.padding = "8px";
      toolbar.style.gap = "8px";
      toolbar.style.borderBottom = "1px solid #d0d7de";
      preview.appendChild(toolbar);

      function createModeButton(mode, label) {
        var btn = createButton(label, function () {
          editorState.mode = mode;
          renderEditorPreview();
        });
        btn.style.marginTop = "0";
        btn.style.marginRight = "0";
        btn.style.padding = "4px 10px";
        if (editorState.mode == mode) {
          btn.style.borderColor = "#1a73e8";
          btn.style.color = "#1a73e8";
        }
        return btn;
      }

      toolbar.appendChild(createModeButton("select", "选择"));
      toolbar.appendChild(createModeButton("port", "添加连接点"));
      toolbar.appendChild(createModeButton("label", "添加文本框"));

      var deleteBtn = createButton("删除选中", function () {
        deleteEditorSelection();
      });
      deleteBtn.style.marginTop = "0";
      deleteBtn.style.marginRight = "0";
      deleteBtn.style.padding = "4px 10px";
      toolbar.appendChild(deleteBtn);

      if (
        editorState.selectedItem != null &&
        editorState.selectedItem.type == "port"
      ) {
        var selectedPort = findPort(
          { ports: editorState.spec.ports },
          editorState.selectedItem.id,
        );

        if (selectedPort != null) {
          var portEditor = document.createElement("div");
          portEditor.style.display = "flex";
          portEditor.style.alignItems = "center";
          portEditor.style.gap = "8px";
          portEditor.style.padding = "8px";
          portEditor.style.borderBottom = "1px solid #d0d7de";
          preview.appendChild(portEditor);

          var portNameInput = document.createElement("input");
          portNameInput.setAttribute("type", "text");
          portNameInput.setAttribute("placeholder", "端子名称，如 L1 / N / PE");
          portNameInput.value = selectedPort.name || "";
          portNameInput.style.width = "180px";
          portEditor.appendChild(portNameInput);

          var markerSelect = document.createElement("select");
          [
            { value: "cross", label: "叉号" },
            { value: "circle", label: "圆点" },
            { value: "hidden", label: "隐藏" },
          ].forEach(function (item) {
            var option = document.createElement("option");
            option.value = item.value;
            option.innerText = item.label;
            markerSelect.appendChild(option);
          });
          markerSelect.value = selectedPort.marker || "cross";
          portEditor.appendChild(markerSelect);

          var directionSelect = document.createElement("select");
          [
            { value: "any", label: "任意方向" },
            { value: "left", label: "左侧接入" },
            { value: "right", label: "右侧接入" },
            { value: "up", label: "上侧接入" },
            { value: "down", label: "下侧接入" },
          ].forEach(function (item) {
            var option = document.createElement("option");
            option.value = item.value;
            option.innerText = item.label;
            directionSelect.appendChild(option);
          });
          directionSelect.value = selectedPort.direction || "any";
          portEditor.appendChild(directionSelect);

          var ioSelect = document.createElement("select");
          [
            { value: "both", label: "可接入可接出" },
            { value: "in", label: "仅接入" },
            { value: "out", label: "仅接出" },
          ].forEach(function (item) {
            var option = document.createElement("option");
            option.value = item.value;
            option.innerText = item.label;
            ioSelect.appendChild(option);
          });
          ioSelect.value = selectedPort.ioMode || "both";
          portEditor.appendChild(ioSelect);

          mxEvent.addListener(portNameInput, "input", function () {
            selectedPort.name = trim(portNameInput.value);
          });
          mxEvent.addListener(markerSelect, "change", function () {
            selectedPort.marker = normalizePortMarker(markerSelect.value);
            renderEditorPreview();
          });
          mxEvent.addListener(directionSelect, "change", function () {
            selectedPort.direction = normalizePortDirection(
              directionSelect.value,
            );
          });
          mxEvent.addListener(ioSelect, "change", function () {
            selectedPort.ioMode = normalizePortIoMode(ioSelect.value);
          });
        }
      } else if (
        editorState.selectedItem != null &&
        editorState.selectedItem.type == "label"
      ) {
        var selectedLabel = findLabel(
          { labels: editorState.spec.labels },
          editorState.selectedItem.id,
        );

        if (selectedLabel != null) {
          var labelEditor = document.createElement("div");
          labelEditor.style.display = "flex";
          labelEditor.style.alignItems = "center";
          labelEditor.style.gap = "8px";
          labelEditor.style.padding = "8px";
          labelEditor.style.borderBottom = "1px solid #d0d7de";
          preview.appendChild(labelEditor);

          var textInput = document.createElement("input");
          textInput.setAttribute("type", "text");
          textInput.setAttribute("placeholder", "文本内容");
          textInput.value = selectedLabel.text || "";
          textInput.style.width = "180px";
          labelEditor.appendChild(textInput);

          var bindingInput = document.createElement("input");
          bindingInput.setAttribute("type", "text");
          bindingInput.setAttribute("placeholder", "可选：绑定属性路径");
          bindingInput.value = selectedLabel.binding || "";
          bindingInput.style.width = "180px";
          labelEditor.appendChild(bindingInput);

          var alignSelect = document.createElement("select");
          [
            { value: "left", label: "左对齐" },
            { value: "center", label: "居中" },
            { value: "right", label: "右对齐" },
          ].forEach(function (item) {
            var option = document.createElement("option");
            option.value = item.value;
            option.innerText = item.label;
            alignSelect.appendChild(option);
          });
          alignSelect.value = selectedLabel.align || "center";
          labelEditor.appendChild(alignSelect);

          mxEvent.addListener(textInput, "change", function () {
            selectedLabel.text = trim(textInput.value);
            renderEditorPreview();
          });
          mxEvent.addListener(bindingInput, "change", function () {
            selectedLabel.binding = trim(bindingInput.value);
            renderEditorPreview();
          });
          mxEvent.addListener(alignSelect, "change", function () {
            selectedLabel.align = normalizeLabelAlign(alignSelect.value);
            renderEditorPreview();
          });
        }
      }

      var surface = document.createElement("div");
      surface.style.position = "relative";
      surface.style.height = "300px";
      surface.style.overflow = "hidden";
      surface.style.cursor =
        editorState.mode == "port" || editorState.mode == "label"
          ? "crosshair"
          : "default";
      surface.style.background = Editor.isDarkMode()
        ? "linear-gradient(180deg, #111111, #171717)"
        : "linear-gradient(180deg, #fafafa, #f3f4f6)";
      preview.appendChild(surface);

      var metrics = getPreviewMetrics(editorState.spec, surface);
      var img = document.createElement("img");
      img.setAttribute("alt", editorState.spec.title || "图元实例");
      img.setAttribute("src", toSvgDataUri(editorState.spec));
      img.style.position = "absolute";
      img.style.left = metrics.left + "px";
      img.style.top = metrics.top + "px";
      img.style.width = metrics.width + "px";
      img.style.height = metrics.height + "px";
      img.style.objectFit = "fill";
      img.style.pointerEvents = "none";
      surface.appendChild(img);

      function startDrag(type, id, target) {
        return function (evt) {
          evt.preventDefault();
          evt.stopPropagation();
          setEditorSelection(type, id);

          function moveHandler(moveEvt) {
            var point = getRelativePoint(
              moveEvt,
              surface,
              metrics,
              type == "port",
            );

            if (type == "port") {
              var port = findPort({ ports: editorState.spec.ports }, id);

              if (port != null) {
                port.x = point.x;
                port.y = point.y;
                target.style.left =
                  metrics.left + port.x * metrics.width - 7 + "px";
                target.style.top =
                  metrics.top + port.y * metrics.height - 7 + "px";
              }
            } else {
              var label = findLabel({ labels: editorState.spec.labels }, id);

              if (label != null) {
                label.x = point.x;
                label.y = point.y;
                target.style.left =
                  metrics.left +
                  label.x * metrics.width -
                  label.width / 2 +
                  "px";
                target.style.top =
                  metrics.top +
                  label.y * metrics.height -
                  label.height / 2 +
                  "px";
              }
            }
          }

          function upHandler() {
            document.removeEventListener("mousemove", moveHandler);
            document.removeEventListener("mouseup", upHandler);

            if (type == "port") {
              var finalPort = findPort({ ports: editorState.spec.ports }, id);

              if (finalPort != null) {
                var snapped = snapPortPointToEdge(
                  { x: finalPort.x, y: finalPort.y },
                  metrics,
                );
                finalPort.x = snapped.x;
                finalPort.y = snapped.y;
              }
            }

            renderEditorPreview();
          }

          document.addEventListener("mousemove", moveHandler);
          document.addEventListener("mouseup", upHandler);
        };
      }

      editorState.spec.ports.forEach(function (point, index) {
        var handle = document.createElement("div");
        handle.style.position = "absolute";
        handle.style.left = metrics.left + point.x * metrics.width - 7 + "px";
        handle.style.top = metrics.top + point.y * metrics.height - 7 + "px";
        handle.style.width = "14px";
        handle.style.height = "14px";
        handle.style.lineHeight = "14px";
        handle.style.textAlign = "center";
        handle.style.color = "#1a73e8";
        handle.style.fontSize = point.marker == "circle" ? "12px" : "16px";
        handle.style.fontWeight = "700";
        handle.style.cursor = "move";
        handle.style.userSelect = "none";
        handle.style.zIndex = "2";
        handle.style.opacity = point.marker == "hidden" ? "0.35" : "1";
        handle.innerText =
          point.marker == "circle"
            ? "●"
            : point.marker == "hidden"
              ? ""
              : "×";
        handle.title = point.name || point.id || "连接点" + (index + 1);
        if (
          editorState.selectedItem != null &&
          editorState.selectedItem.type == "port" &&
          editorState.selectedItem.id == point.id
        ) {
          handle.style.textShadow = "0 0 6px rgba(26,115,232,0.45)";
        }
        mxEvent.addListener(
          handle,
          "mousedown",
          startDrag("port", point.id, handle),
        );
        mxEvent.addListener(handle, "click", function (evt) {
          evt.stopPropagation();
          setEditorSelection("port", point.id);
          renderEditorPreview();
        });
        surface.appendChild(handle);
      });

      editorState.spec.labels.forEach(function (label) {
        var box = document.createElement("div");
        box.style.position = "absolute";
        box.style.left =
          metrics.left + label.x * metrics.width - label.width / 2 + "px";
        box.style.top =
          metrics.top + label.y * metrics.height - label.height / 2 + "px";
        box.style.width = label.width + "px";
        box.style.minHeight = label.height + "px";
        box.style.padding = "2px 6px";
        box.style.boxSizing = "border-box";
        box.style.background = Editor.isDarkMode() ? "#1f1f1f" : "#ffffff";
        box.style.border =
          editorState.selectedItem != null &&
          editorState.selectedItem.type == "label" &&
          editorState.selectedItem.id == label.id
            ? "2px solid #1a73e8"
            : "1px dashed #9aa4b2";
        box.style.borderRadius = "4px";
        box.style.fontSize = "12px";
        box.style.lineHeight = "20px";
        box.style.textAlign = label.align;
        box.style.cursor = "move";
        box.style.userSelect = "none";
        box.style.zIndex = "2";
        box.innerText = getEditorLabelText(label);
        mxEvent.addListener(
          box,
          "mousedown",
          startDrag("label", label.id, box),
        );
        mxEvent.addListener(box, "click", function (evt) {
          evt.stopPropagation();
          setEditorSelection("label", label.id);
          renderEditorPreview();
        });
        surface.appendChild(box);
      });

      mxEvent.addListener(surface, "click", function (evt) {
        if (evt.target !== surface) {
          return;
        }

        var point = getRelativePoint(
          evt,
          surface,
          metrics,
          editorState.mode == "port",
        );

        if (editorState.mode == "port") {
          point = snapPortPointToEdge(point, metrics);
          var portId = nextEditorId("port");
          editorState.spec.ports.push(
            normalizePortPoint(
              {
                id: portId,
                x: point.x,
                y: point.y,
                name: "",
                marker: "cross",
                direction: "any",
                ioMode: "both",
              },
              portId,
              point.x,
              point.y,
            ),
          );
          setEditorSelection(
            "port",
            editorState.spec.ports[editorState.spec.ports.length - 1].id,
          );
        } else if (editorState.mode == "label") {
          var labelId = nextEditorId("label");
          editorState.spec.labels.push(
            normalizeLabelItem(
              {
                id: labelId,
                text: "文本",
                binding: "",
                x: point.x,
                y: point.y,
                width: 120,
                height: 26,
                align: "center",
              },
              labelId,
              "文本",
            ),
          );
          setEditorSelection(
            "label",
            editorState.spec.labels[editorState.spec.labels.length - 1].id,
          );
        } else {
          setEditorSelection(null, null);
        }

        renderEditorPreview();
      });
    }

    scanNextId();

    var container = document.createElement("div");
    container.style.width = "100%";
    container.style.height = "100%";
    container.style.boxSizing = "border-box";
    container.style.padding = "12px";
    container.style.overflow = "auto";
    container.style.background = Editor.isDarkMode() ? "#1e1e1e" : "#ffffff";
    container.style.display = "flex";
    container.style.flexDirection = "column";

    var title = document.createElement("div");
    title.style.fontWeight = "bold";
    title.style.marginBottom = "8px";
    title.innerText = "编辑图元实例";
    container.appendChild(title);

    var hint = document.createElement("div");
    hint.style.marginBottom = "10px";
    hint.style.color = Editor.isDarkMode() ? "#c0c4cc" : "#57606a";
    hint.style.fontSize = "12px";
    hint.innerText =
      "这里修改的是当前画布上的这个图元实例，不会影响图元类型模板。";
    container.appendChild(hint);

    editorState.preview = document.createElement("div");
    editorState.preview.style.flex = "1 1 auto";
    editorState.preview.style.border = "1px solid #d0d7de";
    editorState.preview.style.borderRadius = "8px";
    editorState.preview.style.overflow = "hidden";
    container.appendChild(editorState.preview);

    var buttons = document.createElement("div");
    buttons.style.marginTop = "10px";
    buttons.style.display = "flex";
    buttons.style.alignItems = "center";
    buttons.style.gap = "8px";
    container.appendChild(buttons);

    var applyButton = createButton("应用到图元", function () {
      if (root.parent == null) {
        updateEditorStatus("当前图元已不存在，无法应用修改", true);
        return;
      }

      state.updatingModel = true;
      model.beginUpdate();

      try {
        syncRoot(root, editorState.spec, editorState.spec.ports);
        graph.setSelectionCell(root);
      } catch (e) {
        updateEditorStatus(e.message || String(e), true);
        return;
      } finally {
        model.endUpdate();
        state.updatingModel = false;
      }

      showStatus("已更新图元实例", false);
      updateEditorStatus("已更新图元实例", false);
      if (state.instanceWindow != null) {
        state.instanceWindow.destroy();
      }
    });
    applyButton.style.marginTop = "0";
    applyButton.style.marginRight = "0";
    buttons.appendChild(applyButton);

    var closeButton = createButton("关闭", function () {
      if (state.instanceWindow != null) {
        state.instanceWindow.destroy();
      }
    });
    closeButton.style.marginTop = "0";
    closeButton.style.marginRight = "0";
    buttons.appendChild(closeButton);

    editorState.statusNode = document.createElement("div");
    editorState.statusNode.style.marginLeft = "8px";
    editorState.statusNode.style.fontSize = "12px";
    editorState.statusNode.style.minHeight = "18px";
    buttons.appendChild(editorState.statusNode);

    renderEditorPreview();

    var wnd = new mxWindow("编辑图元实例", container, 220, 120, 680, 520, true, true);
    wnd.destroyOnClose = true;
    wnd.setClosable(true);
    wnd.setMaximizable(false);
    wnd.setResizable(true);
    wnd.setScrollable(true);
    wnd.addListener(mxEvent.DESTROY, function () {
      if (state.instanceWindow == wnd) {
        state.instanceWindow = null;
      }
    });
    wnd.setVisible(true);
    state.instanceWindow = wnd;
  }

  // 单独展示“已定义图元”的浏览窗口，避免用户只能去左侧图库里找模板。
  function openTemplateBrowserDialog() {
    if (state.templatesWindow != null) {
      state.templatesWindow.setVisible(!state.templatesWindow.isVisible());
      return;
    }

    loadStoredLibrary(function (images) {
      var templates = [];
      var i;

      for (i = 0; i < images.length; i++) {
        try {
          templates.push(getLibraryEntrySpec(images[i]));
        } catch (e) {
          // ignore malformed entry
        }
      }

      if (templates.length == 0) {
        showStatus("电气图库为空，请先保存图元类型", true);
        return;
      }

      var div = document.createElement("div");
      div.style.padding = "12px";
      div.style.width = "100%";
      div.style.height = "100%";
      div.style.boxSizing = "border-box";
      div.style.display = "flex";
      div.style.flexDirection = "column";
      div.style.background = Editor.isDarkMode() ? "#1e1e1e" : "#ffffff";

      var title = document.createElement("div");
      title.style.fontWeight = "bold";
      title.style.marginBottom = "10px";
      title.innerText = "已定义图元";
      div.appendChild(title);

      var list = document.createElement("div");
      list.style.flex = "1 1 auto";
      list.style.overflow = "auto";
      list.style.display = "grid";
      list.style.gridTemplateColumns = "repeat(auto-fill, minmax(220px, 1fr))";
      list.style.gap = "12px";
      list.style.alignContent = "start";
      div.appendChild(list);

      function renderTemplateCardPreview(container, template) {
        container.innerHTML = "";
        container.style.position = "relative";
        container.style.overflow = "hidden";
        var ports = normalizePortLayout(template.ports);
        var labels = normalizeLabels(template.labels);
        var bounds = {
          minX: 0,
          minY: 0,
          maxX: template.size.width,
          maxY: template.size.height,
        };

        ports.forEach(function (point) {
          var x = point.x * template.size.width;
          var y = point.y * template.size.height;
          bounds.minX = Math.min(bounds.minX, x - 10);
          bounds.minY = Math.min(bounds.minY, y - 10);
          bounds.maxX = Math.max(bounds.maxX, x + 10);
          bounds.maxY = Math.max(bounds.maxY, y + 10);
        });

        labels.forEach(function (label) {
          var x = label.x * template.size.width;
          var y = label.y * template.size.height;
          bounds.minX = Math.min(bounds.minX, x - label.width / 2);
          bounds.minY = Math.min(bounds.minY, y - label.height / 2);
          bounds.maxX = Math.max(bounds.maxX, x + label.width / 2);
          bounds.maxY = Math.max(bounds.maxY, y + label.height / 2);
        });

        var contentWidth = Math.max(1, bounds.maxX - bounds.minX);
        var contentHeight = Math.max(1, bounds.maxY - bounds.minY);
        var rect = container.getBoundingClientRect();
        var surfaceWidth = Math.max(200, Math.round(rect.width) || 0);
        var surfaceHeight = Math.max(160, Math.round(rect.height) || 0);
        var padding = 18;
        var scale = Math.min(
          (surfaceWidth - padding * 2) / contentWidth,
          (surfaceHeight - padding * 2) / contentHeight,
        );

        scale = Math.max(0.05, scale);
        var left = Math.round(
          (surfaceWidth - contentWidth * scale) / 2 - bounds.minX * scale,
        );
        var top = Math.round(
          (surfaceHeight - contentHeight * scale) / 2 - bounds.minY * scale,
        );

        var img = document.createElement("img");
        img.setAttribute(
          "src",
          "data:image/svg+xml," + encodeURIComponent(template.svg),
        );
        img.setAttribute("alt", template.title);
        img.style.position = "absolute";
        img.style.left = left + "px";
        img.style.top = top + "px";
        img.style.width = Math.round(template.size.width * scale) + "px";
        img.style.height = Math.round(template.size.height * scale) + "px";
        img.style.objectFit = "fill";
        container.appendChild(img);

        ports.forEach(function (point) {
          var handle = document.createElement("div");
          handle.style.position = "absolute";
          handle.style.left =
            Math.round(left + point.x * template.size.width * scale - 7) + "px";
          handle.style.top =
            Math.round(top + point.y * template.size.height * scale - 7) + "px";
          handle.style.width = "14px";
          handle.style.height = "14px";
          handle.style.lineHeight = "14px";
          handle.style.textAlign = "center";
          handle.style.color = "#1a73e8";
          handle.style.fontSize = point.marker == "circle" ? "12px" : "16px";
          handle.style.fontWeight = "700";
          handle.style.userSelect = "none";
          handle.style.opacity = point.marker == "hidden" ? "0.35" : "1";
          handle.innerText =
            point.marker == "circle"
              ? "●"
              : point.marker == "hidden"
                ? ""
                : "×";
          container.appendChild(handle);
        });

        labels.forEach(function (label) {
          var box = document.createElement("div");
          box.style.position = "absolute";
          box.style.left =
            Math.round(
              left +
                label.x * template.size.width * scale -
                (label.width * scale) / 2,
            ) + "px";
          box.style.top =
            Math.round(
              top +
                label.y * template.size.height * scale -
                (label.height * scale) / 2,
            ) + "px";
          box.style.width =
            Math.max(36, Math.round(label.width * scale)) + "px";
          box.style.minHeight =
            Math.max(20, Math.round(label.height * scale)) + "px";
          box.style.padding = "1px 4px";
          box.style.boxSizing = "border-box";
          box.style.background = Editor.isDarkMode() ? "#1f1f1f" : "#ffffff";
          box.style.border = "1px dashed #9aa4b2";
          box.style.borderRadius = "4px";
          box.style.fontSize = Math.max(10, Math.round(12 * scale)) + "px";
          box.style.lineHeight = Math.max(14, Math.round(18 * scale)) + "px";
          box.style.textAlign = label.align;
          box.style.userSelect = "none";
          box.innerText =
            trim(label.binding).length > 0
              ? "{{" + label.binding + "}}"
              : label.text || "";
          container.appendChild(box);
        });
      }

      templates.forEach(function (template) {
        var card = document.createElement("div");
        card.style.border = "1px solid #d0d7de";
        card.style.borderRadius = "8px";
        card.style.padding = "10px";
        card.style.background = Editor.isDarkMode() ? "#161616" : "#ffffff";
        card.style.display = "flex";
        card.style.flexDirection = "column";
        card.style.gap = "8px";
        card.style.alignSelf = "start";
        list.appendChild(card);

        var preview = document.createElement("div");
        preview.style.height = "220px";
        preview.style.border = "1px solid #e5e7eb";
        preview.style.borderRadius = "6px";
        preview.style.background = Editor.isDarkMode() ? "#111111" : "#f8fafc";
        card.appendChild(preview);
        renderTemplateCardPreview(preview, template);
        window.setTimeout(function () {
          renderTemplateCardPreview(preview, template);
        }, 0);

        var actions = document.createElement("div");
        actions.style.display = "flex";
        actions.style.justifyContent = "flex-start";
        actions.style.flexWrap = "wrap";
        card.appendChild(actions);

        var editBtn = createButton("编辑模板", function () {
          if (state.templatesWindow != null) {
            state.templatesWindow.destroy();
          }

          openEditorWithTemplate(template);
        });
        editBtn.style.marginTop = "0";
        actions.appendChild(editBtn);

        var createBtn = createButton("创建实例", function () {
          if (state.templatesWindow != null) {
            state.templatesWindow.destroy();
          }
          openCreateFromLibraryDialog(template.symbolId);
        });
        createBtn.style.marginTop = "0";
        actions.appendChild(createBtn);

        var deleteBtn = createButton("删除模板", function () {
          if (
            !mxUtils.confirm(
              "确定删除图元模板“" +
                (template.templateName || template.title || template.symbolId) +
                "”吗？",
            )
          ) {
            return;
          }

          removeTemplateFromLibrary(template.symbolId, function (nextImages) {
            if (state.templatesWindow != null) {
              state.templatesWindow.destroy();
            }

            if (nextImages != null && nextImages.length > 0) {
              openTemplateBrowserDialog();
            }
          });
        });
        deleteBtn.style.marginTop = "0";
        actions.appendChild(deleteBtn);
      });

      var wnd = new mxWindow("已定义图元", div, 160, 120, 760, 560, true, true);
      wnd.destroyOnClose = true;
      wnd.setClosable(true);
      wnd.setMaximizable(false);
      wnd.setResizable(true);
      wnd.setScrollable(true);
      wnd.setVisible(true);
      wnd.addListener(mxEvent.DESTROY, function () {
        state.templatesWindow = null;
      });
      state.templatesWindow = wnd;
    });
  }

  function openInsertFrameDialog() {
    var defaultConfig = normalizeFrameConfig(state.frameConfig || {});
    var selectedFrame = findDrawingFrame(graph.getSelectionCell());
    var existingFrames = getAllDrawingFrames();
    var div = document.createElement("div");
    div.style.padding = "12px";
    div.style.display = "flex";
    div.style.flexDirection = "column";
    div.style.gap = "10px";
    div.style.boxSizing = "border-box";
    div.style.width = "100%";
    div.style.height = "100%";

    var row = document.createElement("div");
    row.style.display = "flex";
    row.style.alignItems = "center";
    row.style.gap = "8px";
    div.appendChild(row);

    var widthLabel = document.createElement("div");
    widthLabel.innerText = "宽";
    row.appendChild(widthLabel);

    var widthInput = document.createElement("input");
    widthInput.setAttribute("type", "number");
    widthInput.setAttribute("min", "320");
    widthInput.style.width = "140px";
    widthInput.value = String(defaultConfig.width);
    row.appendChild(widthInput);

    var heightLabel = document.createElement("div");
    heightLabel.innerText = "高";
    row.appendChild(heightLabel);

    var heightInput = document.createElement("input");
    heightInput.setAttribute("type", "number");
    heightInput.setAttribute("min", "240");
    heightInput.style.width = "140px";
    heightInput.value = String(defaultConfig.height);
    row.appendChild(heightInput);

    var hint = document.createElement("div");
    hint.style.color = Editor.isDarkMode() ? "#c0c4cc" : "#57606a";
    hint.style.fontSize = "12px";
    hint.innerText =
      selectedFrame != null
        ? "已选中图框组：新图框会续接到当前组右侧；未选中图框时会在现有组下方新建一组。"
        : existingFrames.length > 0
          ? "当前未选中图框：新图框会在现有图框组下方新建一组。选中某个图框后再插入，可续接到该组右侧。"
          : "首次设置的尺寸会作为后续自动分页图框的默认尺寸。";
    div.appendChild(hint);

    var buttons = document.createElement("div");
    div.appendChild(buttons);

    var wnd = new mxWindow("插入图框", div, 180, 140, 420, 170, true, true);
    wnd.destroyOnClose = true;
    wnd.setClosable(true);
    wnd.setMaximizable(false);
    wnd.setResizable(false);
    wnd.setScrollable(false);

    var submitButton = createButton("插入图框", function () {
      var config = normalizeFrameConfig({
        width: widthInput.value,
        height: heightInput.value,
      });
      var groupId =
        selectedFrame != null ? getFrameGroupId(selectedFrame) : generateFrameGroupId();
      var nextPageNumber =
        selectedFrame != null ? getMaxFramePageNumberInGroup(groupId) + 1 : 1;
      var frame = createDrawingFrameCell(config, nextPageNumber, {
        groupId: groupId,
      });
      state.frameConfig = cloneJson(config);

      if (selectedFrame != null) {
        var anchorFrame = getRightmostFrameInGroup(groupId) || selectedFrame;
        var anchorGeometry = model.getGeometry(anchorFrame);
        frame.geometry = frame.geometry.clone();
        frame.geometry.x =
          anchorGeometry.x + anchorGeometry.width + FRAME_HORIZONTAL_GAP;
        frame.geometry.y = anchorGeometry.y;
        addTopLevelCell(frame);
        graph.setSelectionCell(frame);
      } else if (existingFrames.length > 0) {
        var leftmostFrame = getLeftmostFrame();
        var bottommostFrame = getBottommostFrame();
        var leftGeometry = leftmostFrame != null ? model.getGeometry(leftmostFrame) : null;
        var bottomGeometry =
          bottommostFrame != null ? model.getGeometry(bottommostFrame) : null;
        frame.geometry = frame.geometry.clone();
        frame.geometry.x = leftGeometry != null ? leftGeometry.x : 0;
        frame.geometry.y =
          bottomGeometry != null
            ? bottomGeometry.y + bottomGeometry.height + FRAME_VERTICAL_GAP
            : 0;
        addTopLevelCell(frame);
        graph.setSelectionCell(frame);
      } else {
        var point = graph.getFreeInsertPoint();
        graph.setSelectionCells(graph.importCells([frame], point.x, point.y));
      }

      graph.scrollCellToVisible(graph.getSelectionCell());
      showStatus("已插入图框", false);
      setCanvasStatus("已插入图框");
      wnd.destroy();
    });
    submitButton.style.marginTop = "0";
    buttons.appendChild(submitButton);

    wnd.setVisible(true);
  }

  function openInsertCabinetDialog() {
    var frame = getActiveFrame(true);

    if (frame == null) {
      return;
    }

    var div = document.createElement("div");
    div.style.padding = "12px";
    div.style.display = "flex";
    div.style.flexDirection = "column";
    div.style.gap = "10px";
    div.style.boxSizing = "border-box";
    div.style.width = "100%";
    div.style.height = "100%";

    var nameRow = document.createElement("div");
    nameRow.style.display = "grid";
    nameRow.style.gridTemplateColumns = "90px 1fr";
    nameRow.style.alignItems = "center";
    nameRow.style.gap = "8px";
    div.appendChild(nameRow);

    var nameLabel = document.createElement("div");
    nameLabel.innerText = "名称";
    nameRow.appendChild(nameLabel);

    var nameInput = document.createElement("input");
    nameInput.setAttribute("type", "text");
    nameInput.value = "配电柜";
    nameRow.appendChild(nameInput);

    var configRow = document.createElement("div");
    configRow.style.display = "grid";
    configRow.style.gridTemplateColumns = "90px 120px 90px 120px";
    configRow.style.alignItems = "center";
    configRow.style.gap = "8px";
    div.appendChild(configRow);

    var widthLabel = document.createElement("div");
    widthLabel.innerText = "柜宽";
    configRow.appendChild(widthLabel);

    var widthInput = document.createElement("input");
    widthInput.setAttribute("type", "number");
    widthInput.setAttribute("min", "30");
    widthInput.value = String(CABINET_DEFAULT_WIDTH);
    configRow.appendChild(widthInput);

    var countLabel = document.createElement("div");
    countLabel.innerText = "右侧端子数";
    configRow.appendChild(countLabel);

    var countInput = document.createElement("input");
    countInput.setAttribute("type", "number");
    countInput.setAttribute("min", "2");
    countInput.value = String(CABINET_DEFAULT_PORT_COUNT);
    configRow.appendChild(countInput);

    var hint = document.createElement("div");
    hint.style.color = Editor.isDarkMode() ? "#c0c4cc" : "#57606a";
    hint.style.fontSize = "12px";
    hint.innerText =
      "仅生成专用配电柜主体和右侧连接点，间距后续通过右侧热点编辑。";
    div.appendChild(hint);

    var buttons = document.createElement("div");
    div.appendChild(buttons);

    var wnd = new mxWindow("插入配电柜", div, 200, 160, 460, 190, true, true);
    wnd.destroyOnClose = true;
    wnd.setClosable(true);
    wnd.setMaximizable(false);
    wnd.setResizable(false);
    wnd.setScrollable(false);

    var submitButton = createButton("插入配电柜", function () {
      var cabinetModel = normalizeCabinetModel({
        logicalCabinetId: generateLogicalCabinetId(),
        originFrameId: trim(getAttr(frame, "frameId")),
        title: trim(nameInput.value) || "配电柜",
        cabinetWidth: widthInput.value,
        portCount: countInput.value,
      });

      state.updatingModel = true;
      model.beginUpdate();

      try {
        relayoutCabinetByModel(cabinetModel);
      } catch (e) {
        showStatus(e.message || String(e), true);
        setCanvasStatus(e.message || String(e));
        return;
      } finally {
        model.endUpdate();
        state.updatingModel = false;
      }

      var segments = findCabinetSegments(cabinetModel.logicalCabinetId);

      if (segments.length > 0) {
        graph.setSelectionCell(segments[0]);
        graph.scrollCellToVisible(segments[0]);
      }

      showStatus("已插入配电柜", false);
      setCanvasStatus("已插入配电柜");
      wnd.destroy();
    });
    submitButton.style.marginTop = "0";
    buttons.appendChild(submitButton);

    wnd.setVisible(true);
  }

  function getGapDialogPosition(nativeEvent, width, height) {
    var fallback = { x: 220, y: 180 };

    if (nativeEvent == null) {
      return fallback;
    }

    var offsetX = 36;
    var offsetY = -24;
    var rawEvent =
      typeof nativeEvent.getEvent == "function"
        ? nativeEvent.getEvent()
        : nativeEvent;
    var pageX =
      mxEvent.getClientX(rawEvent) +
      (window.pageXOffset || document.documentElement.scrollLeft || 0);
    var pageY =
      mxEvent.getClientY(rawEvent) +
      (window.pageYOffset || document.documentElement.scrollTop || 0);
    var viewportWidth =
      window.innerWidth || document.documentElement.clientWidth || 1280;
    var viewportHeight =
      window.innerHeight || document.documentElement.clientHeight || 720;
    var minX =
      (window.pageXOffset || document.documentElement.scrollLeft || 0) + 12;
    var minY =
      (window.pageYOffset || document.documentElement.scrollTop || 0) + 12;
    var maxX =
      (window.pageXOffset || document.documentElement.scrollLeft || 0) +
      viewportWidth -
      width -
      12;
    var maxY =
      (window.pageYOffset || document.documentElement.scrollTop || 0) +
      viewportHeight -
      height -
      12;
    var x = pageX + offsetX;
    var y = pageY + offsetY;

    if (x > maxX) {
      x = pageX - width - offsetX;
    }

    if (y > maxY) {
      y = maxY;
    }

    return {
      x: clamp(x, minX, Math.max(minX, maxX)),
      y: clamp(y, minY, Math.max(minY, maxY)),
    };
  }

  function openCabinetGapDialog(gapCell, nativeEvent) {
    var segment = findCabinetSegment(gapCell);
    var gapIndex = toInt(getAttr(gapCell, "gapIndex"), -1);

    if (segment == null || gapIndex < 0) {
      return;
    }

    closeGapDialogWindow();

    var cabinetModel = extractCabinetModel(segment);
    var div = document.createElement("div");
    div.style.padding = "12px";
    div.style.display = "flex";
    div.style.flexDirection = "column";
    div.style.gap = "10px";
    div.style.width = "100%";
    div.style.height = "100%";
    div.style.boxSizing = "border-box";

    var label = document.createElement("div");
    label.innerText = "输入 0 到 1 之间的比例值";
    div.appendChild(label);

    var input = document.createElement("input");
    input.setAttribute("type", "number");
    input.setAttribute("min", "0");
    input.setAttribute("max", "1");
    input.setAttribute("step", "0.01");
    input.value = String(cabinetModel.gapRatios[gapIndex] || 0);
    div.appendChild(input);

    var error = document.createElement("div");
    error.style.minHeight = "18px";
    error.style.fontSize = "12px";
    error.style.color = "#b3261e";
    div.appendChild(error);

    var buttons = document.createElement("div");
    div.appendChild(buttons);

    var dialogWidth = 320;
    var dialogHeight = 170;
    var dialogPosition = getGapDialogPosition(
      nativeEvent,
      dialogWidth,
      dialogHeight,
    );
    var wnd = new mxWindow(
      "设置端子间距",
      div,
      dialogPosition.x,
      dialogPosition.y,
      dialogWidth,
      dialogHeight,
      true,
      true,
    );
    wnd.destroyOnClose = true;
    wnd.setClosable(true);
    wnd.setMaximizable(false);
    wnd.setResizable(false);
    wnd.setScrollable(false);
    wnd.addListener(mxEvent.DESTROY, function () {
      if (state.gapDialogWindow == wnd) {
        state.gapDialogWindow = null;
      }
    });
    state.gapDialogWindow = wnd;

    var saveButton = createButton("保存", function () {
      var ratio = toFloat(input.value, NaN);

      if (isNaN(ratio) || ratio < 0 || ratio > 1) {
        error.innerText = "请输入 0 到 1 之间的数值";
        return;
      }

      cabinetModel.gapRatios[gapIndex] = ratio;
      state.updatingModel = true;
      model.beginUpdate();

      try {
        relayoutCabinetByModel(cabinetModel);
      } catch (e) {
        error.innerText = e.message || String(e);
        return;
      } finally {
        model.endUpdate();
        state.updatingModel = false;
      }

      showStatus("已更新端子间距", false);
      setCanvasStatus("已更新端子间距");
      wnd.destroy();
    });
    saveButton.style.marginTop = "0";
    buttons.appendChild(saveButton);

    wnd.setVisible(true);
  }

  function insertCellIntoFrame(cell, frame) {
    var insertPoint = getFrameChildInsertPoint(
      frame,
      cell.geometry != null ? cell.geometry.width : 0,
      cell.geometry != null ? cell.geometry.height : 0,
    );
    graph.setSelectionCells(
      graph.importCells([cell], insertPoint.x, insertPoint.y, frame),
    );
    graph.scrollCellToVisible(graph.getSelectionCell());
  }

  // 插入画布时只需要导入 root，子节点会随 root 一起进入图模型。
  function insertIntoGraph(spec) {
    var root = buildSymbolCell(spec);
    var frame = getActiveFrame(false);

    if (frame != null) {
      insertCellIntoFrame(root, frame);
    } else {
      var pt = graph.getFreeInsertPoint();
      graph.setSelectionCells(graph.importCells([root], pt.x, pt.y));
    }

    graph.scrollCellToVisible(graph.getSelectionCell());
    showStatus("已插入图元", false);
    setCanvasStatus("已插入图元");
  }

  // 菜单里的“刷新电气图元”动作
  // 手工 Edit Data 后，让图形外观重新和元数据对齐
  function refreshSelection() {
    var root = findElectricalRoot(graph.getSelectionCell());
    var cabinet = findCabinetSegment(graph.getSelectionCell());

    if (cabinet != null) {
      try {
        state.updatingModel = true;
        model.beginUpdate();
        relayoutCabinetByModel(extractCabinetModel(cabinet));
        showStatus("配电柜已刷新", false);
        setCanvasStatus("配电柜已刷新");
      } catch (e) {
        showStatus(e.message || String(e), true);
        setCanvasStatus(e.message || String(e));
      } finally {
        model.endUpdate();
        state.updatingModel = false;
      }
      return;
    }

    if (root == null) {
      showStatus("请先选择一个电气图元", true);
      return;
    }

    state.updatingModel = true;
    model.beginUpdate();

    try {
      refreshRoot(root);
    } catch (e) {
      showStatus(e.message || String(e), true);
      return;
    } finally {
      model.endUpdate();
      state.updatingModel = false;
    }

    showStatus("电气图元已刷新", false);
  }

  // 从编辑器文本框读取 JSON，校验通过后同时刷新预览和状态栏
  function parseEditorSpec() {
    try {
      var spec = getSpecFromEditor();
      state.currentSpec = spec;
      updatePreview(spec);
      showStatus("预览已刷新", false);
      return spec;
    } catch (e) {
      showStatus(e.message || String(e), true);
      throw e;
    }
  }

  // 统一生成插件窗口里的按钮样式和点击行为。
  function createButton(label, fn) {
    var button = mxUtils.button(label, fn);
    button.className = "geBtn";
    button.style.marginRight = "8px";
    button.style.marginTop = "8px";
    return button;
  }

  // 返回当前画布图形内容的未缩放包围盒，用于给 SVG 导出提供默认宽高。
  function getDiagramExportBounds() {
    var bounds = graph.getGraphBounds();
    var viewScale = graph.view.scale || 1;

    if (bounds == null || bounds.width <= 0 || bounds.height <= 0) {
      throw new Error("画布上没有可导出的图形");
    }

    return {
      width: Math.max(1, Math.ceil(bounds.width / viewScale)),
      height: Math.max(1, Math.ceil(bounds.height / viewScale)),
    };
  }

  // 复用 draw.io 原生 graph.getSvg 导出当前图形，只返回纯 SVG 节点文本。
  function createSvgExportCode(width, height) {
    var exportBounds = getDiagramExportBounds();
    var targetWidth = Math.max(1, toInt(width, exportBounds.width));
    var targetHeight = Math.max(1, toInt(height, exportBounds.height));
    var scale = Math.min(
      targetWidth / exportBounds.width,
      targetHeight / exportBounds.height,
    );
    var svgRoot = graph.getSvg(
      null,
      scale,
      0,
      false,
      null,
      true,
      null,
      null,
      null,
      null,
      true,
      null,
    );

    if (graph.shadowVisible) {
      graph.addSvgShadow(svgRoot);
    }

    if (graph.mathEnabled) {
      Editor.prototype.addMathCss(svgRoot);
    }

    svgRoot.setAttribute("width", String(targetWidth));
    svgRoot.setAttribute("height", String(targetHeight));
    svgRoot.setAttribute("preserveAspectRatio", "xMidYMid meet");

    return mxUtils.getXml(svgRoot);
  }

  // 将当前文本框中的 SVG 代码下载为 .svg 文件，宽高以用户当前输入生成的代码为准。
  function downloadSvgCode(svgCode) {
    var blob = new Blob([svgCode], { type: "image/svg+xml;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = "diagram-export.svg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 0);
  }

  // 弹出 SVG 导出窗口，允许用户调整导出尺寸并直接查看纯 SVG 代码。
  function openSvgExportDialog() {
    var exportBounds = getDiagramExportBounds();
    var div = document.createElement("div");
    div.style.padding = "12px";
    div.style.width = "100%";
    div.style.height = "100%";
    div.style.boxSizing = "border-box";
    div.style.display = "flex";
    div.style.flexDirection = "column";
    div.style.background = Editor.isDarkMode() ? "#1e1e1e" : "#ffffff";

    var formRow = document.createElement("div");
    formRow.style.display = "flex";
    formRow.style.alignItems = "center";
    formRow.style.gap = "8px";
    formRow.style.flexWrap = "wrap";
    div.appendChild(formRow);

    var widthLabel = document.createElement("div");
    widthLabel.innerText = "宽";
    formRow.appendChild(widthLabel);

    var widthInput = document.createElement("input");
    widthInput.setAttribute("type", "number");
    widthInput.setAttribute("min", "1");
    widthInput.style.width = "120px";
    widthInput.value = String(exportBounds.width);
    formRow.appendChild(widthInput);

    var heightLabel = document.createElement("div");
    heightLabel.innerText = "高";
    formRow.appendChild(heightLabel);

    var heightInput = document.createElement("input");
    heightInput.setAttribute("type", "number");
    heightInput.setAttribute("min", "1");
    heightInput.style.width = "120px";
    heightInput.value = String(exportBounds.height);
    formRow.appendChild(heightInput);

    var refreshButton = createButton("刷新SVG代码", function () {
      try {
        textarea.value = createSvgExportCode(
          widthInput.value,
          heightInput.value,
        );
      } catch (e) {
        showStatus(e.message || String(e), true);
      }
    });
    refreshButton.style.marginTop = "0";
    refreshButton.style.marginRight = "0";
    formRow.appendChild(refreshButton);

    var textarea = document.createElement("textarea");
    textarea.spellcheck = false;
    textarea.style.width = "100%";
    textarea.style.flex = "1 1 auto";
    textarea.style.minHeight = "320px";
    textarea.style.marginTop = "10px";
    textarea.style.boxSizing = "border-box";
    div.appendChild(textarea);

    var buttons = document.createElement("div");
    buttons.style.marginTop = "10px";
    buttons.style.flex = "0 0 auto";
    div.appendChild(buttons);

    var copyButton = createButton("复制SVG代码", function () {
      ui.writeTextToClipboard(
        textarea.value,
        function (e) {
          ui.handleError(e);
        },
        function () {
          ui.alert("已复制到剪贴板");
        },
      );
    });
    copyButton.style.marginTop = "0";
    buttons.appendChild(copyButton);

    var downloadButton = createButton("下载SVG", function () {
      try {
        var svgCode = createSvgExportCode(widthInput.value, heightInput.value);
        textarea.value = svgCode;
        downloadSvgCode(svgCode);
        wnd.destroy();
      } catch (e) {
        showStatus(e.message || String(e), true);
      }
    });
    downloadButton.style.marginTop = "0";
    buttons.appendChild(downloadButton);

    textarea.value = createSvgExportCode(
      exportBounds.width,
      exportBounds.height,
    );

    var wnd = new mxWindow("导出SVG", div, 160, 120, 720, 560, true, true);
    wnd.destroyOnClose = true;
    wnd.setClosable(true);
    wnd.setMaximizable(false);
    wnd.setResizable(true);
    wnd.setScrollable(true);
    wnd.setVisible(true);
  }

  // 接管顶部菜单栏，只保留电气插件自己的几个入口按钮。
  function installTopActionBar() {
    if (ui.menubarContainer == null) {
      return;
    }

    ui.menubarContainer.innerHTML = "";
    ui.menubarContainer.style.display = "flex";
    ui.menubarContainer.style.alignItems = "center";
    ui.menubarContainer.style.padding = "0 12px";

    var bar = document.createElement("div");
    bar.style.display = "flex";
    bar.style.alignItems = "center";
    bar.style.gap = "12px";
    bar.style.width = "100%";
    bar.style.height = "100%";

    function addTopButton(resourceKey, actionKey) {
      var button = createButton(mxResources.get(resourceKey), function () {
        ui.actions.get(actionKey).funct();
      });
      button.style.marginTop = "0";
      button.style.marginRight = "0";
      button.style.padding = "6px 16px";
      bar.appendChild(button);
    }

    addTopButton("electricalSymbols", "electricalSymbols");
    addTopButton("electricalBrowse", "electricalBrowse");
    addTopButton("electricalCreate", "electricalCreate");
    addTopButton("electricalEditInstance", "electricalEditInstance");
    addTopButton("electricalInsertFrame", "electricalInsertFrame");
    addTopButton("electricalInsertCabinet", "electricalInsertCabinet");
    addTopButton("electricalClearScreen", "electricalClearScreen");
    addTopButton("electricalReassignPort", "electricalReassignPort");
    addTopButton("electricalExportSvg", "electricalExportSvg");

    ui.menubarContainer.appendChild(bar);
  }

  // 统一绑定 SVG 上传按钮；可直接写入 state，也可把结果交给自定义回调处理。
  function bindSvgUpload(
    input,
    nameNode,
    svgKey,
    nameKey,
    successMessage,
    updateSize,
    onLoaded,
  ) {
    mxEvent.addListener(input, "change", function () {
      if (input.files == null || input.files.length == 0) {
        return;
      }

      var reader = new FileReader();
      reader.onload = function () {
        try {
          var svg = validateSvg(reader.result);
          var fileName = input.files[0].name;

          if (svgKey != null) {
            state[svgKey] = svg;
          }

          if (nameKey != null) {
            state[nameKey] = fileName;
          }

          if (typeof onLoaded === "function") {
            onLoaded(svg, fileName);
          }

          if (updateSize) {
            state.uploadedPrimarySvgSize = extractSvgSize(svg);
          }

          if (nameNode != null && nameKey != null) {
            nameNode.innerText = state[nameKey];
          }

          if (trim(state.uploadedPrimarySvg).length > 0) {
            parseEditorSpec();
          } else {
            updatePreview(null);
          }

          scheduleEditorDraftSave();
          showStatus(successMessage, false);
        } catch (e) {
          showStatus(e.message || String(e), true);
        }
      };
      reader.readAsText(input.files[0], "utf-8");
    });
  }

  // 插件窗口是一个轻量 mxWindow
  // 把“JSON 输入、预览、插入、入库、导出、刷新”几个核心操作集中在一个面板里。
  function createWindow() {
    clearDraftSaveTimer();
    state.nextId = 1;
    state.symbolIdTouched = false;
    state.variantEnabled = false;
    state.lastValidVariantField = "";
    state.variantItems = [];
    state.currentSpec = null;
    state.selectedItem = null;
    state.previewVariantId = "";
    state.previewMode = "select";
    state.uploadedPrimarySvg = "";
    state.uploadedPrimarySvgName = "";
    state.uploadedPrimarySvgSize = null;

    var container = document.createElement("div");
    container.style.width = "100%";
    container.style.height = "100%";
    container.style.boxSizing = "border-box";
    container.style.padding = "12px";
    container.style.overflow = "auto";
    container.style.background = Editor.isDarkMode() ? "#1e1e1e" : "#ffffff";

    var title = document.createElement("div");
    title.style.fontWeight = "bold";
    title.style.marginBottom = "8px";
    title.innerText = "电气图元类型定义";
    container.appendChild(title);

    var symbolRow = document.createElement("div");
    symbolRow.style.display = "flex";
    symbolRow.style.alignItems = "center";
    symbolRow.style.marginBottom = "10px";
    container.appendChild(symbolRow);

    var symbolLabel = document.createElement("div");
    symbolLabel.style.width = "90px";
    symbolLabel.style.flex = "0 0 90px";
    symbolLabel.innerText = "图元类型ID";
    symbolRow.appendChild(symbolLabel);

    state.symbolIdInput = document.createElement("input");
    state.symbolIdInput.setAttribute("type", "text");
    state.symbolIdInput.style.flex = "1 1 auto";
    state.symbolIdInput.style.boxSizing = "border-box";
    state.symbolIdInput.value = generateSymbolId("electrical-symbol");
    symbolRow.appendChild(state.symbolIdInput);
    mxEvent.addListener(state.symbolIdInput, "input", function () {
      state.symbolIdTouched = true;
      scheduleEditorDraftSave();
    });

    var nameRow = document.createElement("div");
    nameRow.style.display = "flex";
    nameRow.style.alignItems = "center";
    nameRow.style.marginBottom = "10px";
    container.appendChild(nameRow);

    var nameLabel = document.createElement("div");
    nameLabel.style.width = "90px";
    nameLabel.style.flex = "0 0 90px";
    nameLabel.innerText = "图元类型名称";
    nameRow.appendChild(nameLabel);

    state.templateNameInput = document.createElement("input");
    state.templateNameInput.setAttribute("type", "text");
    state.templateNameInput.style.flex = "1 1 auto";
    state.templateNameInput.style.boxSizing = "border-box";
    state.templateNameInput.value = "电气图元";
    nameRow.appendChild(state.templateNameInput);

    var sizeRow = document.createElement("div");
    sizeRow.style.display = "flex";
    sizeRow.style.alignItems = "center";
    sizeRow.style.gap = "8px";
    sizeRow.style.marginBottom = "10px";
    container.appendChild(sizeRow);

    var sizeLabel = document.createElement("div");
    sizeLabel.style.width = "90px";
    sizeLabel.style.flex = "0 0 90px";
    sizeLabel.innerText = "默认宽高";
    sizeRow.appendChild(sizeLabel);

    state.templateWidthInput = document.createElement("input");
    state.templateWidthInput.setAttribute("type", "number");
    state.templateWidthInput.setAttribute("min", "20");
    state.templateWidthInput.style.width = "120px";
    state.templateWidthInput.value = "120";
    sizeRow.appendChild(state.templateWidthInput);

    var sizeSplit = document.createElement("div");
    sizeSplit.innerText = "x";
    sizeRow.appendChild(sizeSplit);

    state.templateHeightInput = document.createElement("input");
    state.templateHeightInput.setAttribute("type", "number");
    state.templateHeightInput.setAttribute("min", "20");
    state.templateHeightInput.style.width = "120px";
    state.templateHeightInput.value = "80";
    sizeRow.appendChild(state.templateHeightInput);

    var topRow = document.createElement("div");
    topRow.style.display = "flex";
    topRow.style.alignItems = "center";
    topRow.style.flexWrap = "wrap";
    topRow.style.rowGap = "8px";
    container.appendChild(topRow);

    var primaryInput = document.createElement("input");
    primaryInput.setAttribute("type", "file");
    primaryInput.setAttribute("accept", ".svg,image/svg+xml");
    primaryInput.style.display = "none";
    topRow.appendChild(primaryInput);

    var primaryButton = createButton(
      mxResources.get("electricalUploadPrimarySvg"),
      function () {
        primaryInput.click();
      },
    );
    primaryButton.style.marginTop = "0";
    topRow.appendChild(primaryButton);

    var primaryName = document.createElement("div");
    primaryName.style.marginLeft = "8px";
    primaryName.style.marginRight = "12px";
    primaryName.style.color = Editor.isDarkMode() ? "#c0c4cc" : "#57606a";
    primaryName.innerText = "未选择默认SVG";
    topRow.appendChild(primaryName);

    var variantToggleRow = document.createElement("div");
    variantToggleRow.style.display = "flex";
    variantToggleRow.style.alignItems = "center";
    variantToggleRow.style.gap = "8px";
    variantToggleRow.style.marginTop = "10px";
    container.appendChild(variantToggleRow);

    var variantToggle = document.createElement("input");
    variantToggle.setAttribute("type", "checkbox");
    variantToggleRow.appendChild(variantToggle);

    var variantToggleLabel = document.createElement("div");
    variantToggleLabel.innerText = mxResources.get("electricalEnableVariants");
    variantToggleRow.appendChild(variantToggleLabel);

    var variantSection = document.createElement("div");
    variantSection.style.display = "none";
    container.appendChild(variantSection);

    var variantRow = document.createElement("div");
    variantRow.style.display = "flex";
    variantRow.style.alignItems = "center";
    variantRow.style.gap = "8px";
    variantRow.style.marginTop = "10px";
    variantSection.appendChild(variantRow);

    var variantLabel = document.createElement("div");
    variantLabel.style.width = "90px";
    variantLabel.style.flex = "0 0 90px";
    variantLabel.innerText = "变体字段";
    variantRow.appendChild(variantLabel);

    state.variantFieldInput = document.createElement("input");
    state.variantFieldInput.setAttribute("type", "text");
    state.variantFieldInput.style.flex = "1 1 auto";
    state.variantFieldInput.style.boxSizing = "border-box";
    state.variantFieldInput.value = "";
    state.variantFieldInput.setAttribute(
      "placeholder",
      "请输入类型定义里已存在的字段路径",
    );
    variantRow.appendChild(state.variantFieldInput);

    var addVariantButton = createButton(
      mxResources.get("electricalAddVariantSvg"),
      function () {
        if (state.variantEnabled && validateVariantField(true) == null) {
          return;
        }

        state.variantItems.push({
          id: nextItemId("variant"),
          key: "",
          svg: "",
          name: "",
          ports: cloneJson(
            state.currentSpec != null ? state.currentSpec.ports || [] : [],
          ),
          labels: cloneJson(
            state.currentSpec != null ? state.currentSpec.labels || [] : [],
          ),
        });
        renderVariantList();
        updateSelectedItem(null, null);
        updatePreview(state.currentSpec);
        scheduleEditorDraftSave();
      },
    );
    addVariantButton.style.marginTop = "0";
    addVariantButton.style.marginRight = "0";
    variantRow.appendChild(addVariantButton);

    var variantList = document.createElement("div");
    variantList.style.marginTop = "10px";
    variantSection.appendChild(variantList);

    function refreshVariantSection() {
      variantSection.style.display = state.variantEnabled ? "block" : "none";
      variantToggle.checked = state.variantEnabled;
    }

    function renderVariantList() {
      variantList.innerHTML = "";

      if (state.variantItems.length == 0) {
        return;
      }

      state.variantItems.forEach(function (item) {
        var row = document.createElement("div");
        row.style.display = "flex";
        row.style.alignItems = "center";
        row.style.gap = "8px";
        row.style.marginTop = "8px";
        variantList.appendChild(row);

        var keyInput = document.createElement("input");
        keyInput.setAttribute("type", "text");
        keyInput.setAttribute(
          "placeholder",
          "变体值，如 standby / large / medium",
        );
        keyInput.style.width = "180px";
        keyInput.style.boxSizing = "border-box";
        keyInput.value = item.key;
        row.appendChild(keyInput);

        var uploadInput = document.createElement("input");
        uploadInput.setAttribute("type", "file");
        uploadInput.setAttribute("accept", ".svg,image/svg+xml");
        uploadInput.style.display = "none";
        row.appendChild(uploadInput);

        var uploadButton = createButton("上传变体SVG", function () {
          uploadInput.click();
        });
        uploadButton.style.marginTop = "0";
        uploadButton.style.marginRight = "0";
        row.appendChild(uploadButton);

        var fileName = document.createElement("div");
        fileName.style.flex = "1 1 auto";
        fileName.style.color = Editor.isDarkMode() ? "#c0c4cc" : "#57606a";
        fileName.innerText = item.name || "未选择变体SVG";
        row.appendChild(fileName);

        var deleteButton = createButton("删除", function () {
          state.variantItems = state.variantItems.filter(function (entry) {
            return entry.id != item.id;
          });
          if (state.previewVariantId == item.id) {
            state.previewVariantId = "";
            updateSelectedItem(null, null);
          }
          renderVariantList();
          if (trim(state.uploadedPrimarySvg).length > 0) {
            parseEditorSpec();
          }
          scheduleEditorDraftSave();
        });
        deleteButton.style.marginTop = "0";
        deleteButton.style.marginRight = "0";
        row.appendChild(deleteButton);

        mxEvent.addListener(keyInput, "change", function () {
          var nextKey = trim(keyInput.value);

          if (hasVariantKey(nextKey, item.id)) {
            showStatus("同一个变体值只能绑定一张SVG", true);
            keyInput.value = item.key;
            return;
          }

          item.key = nextKey;
          if (state.variantEnabled) {
            validateVariantField(true);
          }

          if (trim(state.uploadedPrimarySvg).length > 0) {
            parseEditorSpec();
          }
          scheduleEditorDraftSave();
        });

        bindSvgUpload(
          uploadInput,
          null,
          null,
          null,
          "变体SVG 已加载",
          false,
          function (svg, fileNameText) {
            item.svg = svg;
            item.name = fileNameText;
            fileName.innerText = item.name || "未选择变体SVG";
            scheduleEditorDraftSave();
          },
        );
      });
    }

    state.schemaFields = getDefaultSchemaFields();

    var schemaSection = document.createElement("div");
    schemaSection.style.marginTop = "10px";
    container.appendChild(schemaSection);

    var schemaHeader = document.createElement("div");
    schemaHeader.style.display = "flex";
    schemaHeader.style.alignItems = "center";
    schemaHeader.style.marginBottom = "8px";
    schemaSection.appendChild(schemaHeader);

    var schemaTitle = document.createElement("div");
    schemaTitle.style.fontWeight = "bold";
    schemaTitle.innerText = "属性字段配置";
    schemaHeader.appendChild(schemaTitle);

    var addFieldButton = createButton("新增字段", function () {
      state.schemaFields.push(
        normalizeSchemaField({
          path: "",
          type: "string",
          required: false,
          enumValues: [],
        }),
      );
      renderSchemaFields();
      scheduleEditorDraftSave();
    });
    addFieldButton.style.marginTop = "0";
    addFieldButton.style.marginLeft = "12px";
    schemaHeader.appendChild(addFieldButton);

    var schemaList = document.createElement("div");
    schemaSection.appendChild(schemaList);

    function renderSchemaFields() {
      schemaList.innerHTML = "";
      var hasEnumField = state.schemaFields.some(function (field) {
        return normalizeSchemaType(field.type) == "enum";
      });

      var header = document.createElement("div");
      header.style.display = "grid";
      header.style.gridTemplateColumns = hasEnumField
        ? "minmax(0, 1.6fr) 110px minmax(0, 1.2fr) 80px auto"
        : "minmax(0, 1.6fr) 110px 80px auto";
      header.style.gap = "8px";
      header.style.alignItems = "center";
      header.style.marginBottom = "6px";
      header.style.fontSize = "12px";
      header.style.color = Editor.isDarkMode() ? "#c0c4cc" : "#57606a";
      (hasEnumField
        ? ["字段路径", "类型", "枚举值", "必填", "操作"]
        : ["字段路径", "类型", "必填", "操作"]
      ).forEach(function (text) {
        var cell = document.createElement("div");
        cell.innerText = text;
        header.appendChild(cell);
      });
      schemaList.appendChild(header);

      state.schemaFields.forEach(function (field) {
        var row = document.createElement("div");
        row.style.display = "grid";
        row.style.gap = "8px";
        row.style.alignItems = "center";
        row.style.marginBottom = "8px";
        schemaList.appendChild(row);

        var pathInput = document.createElement("input");
        pathInput.setAttribute("type", "text");
        pathInput.setAttribute(
          "placeholder",
          "字段路径，如 name 或 device.mode",
        );
        pathInput.value = field.path;
        row.appendChild(pathInput);

        var typeSelect = document.createElement("select");
        ["string", "number", "boolean", "enum"].forEach(function (type) {
          var option = document.createElement("option");
          option.value = type;
          option.innerText = type;
          typeSelect.appendChild(option);
        });
        typeSelect.value = field.type;
        row.appendChild(typeSelect);

        var enumWrap = document.createElement("div");
        enumWrap.style.minWidth = "0";
        row.appendChild(enumWrap);

        var enumInput = document.createElement("input");
        enumInput.setAttribute("type", "text");
        enumInput.setAttribute("placeholder", "枚举值，逗号分隔");
        enumInput.value = (field.enumValues || []).join(", ");
        enumInput.style.width = "100%";
        enumInput.style.boxSizing = "border-box";
        enumWrap.appendChild(enumInput);

        var requiredWrap = document.createElement("label");
        requiredWrap.style.display = "flex";
        requiredWrap.style.alignItems = "center";
        requiredWrap.style.gap = "4px";
        var requiredInput = document.createElement("input");
        requiredInput.setAttribute("type", "checkbox");
        requiredInput.checked = !!field.required;
        requiredWrap.appendChild(requiredInput);
        var requiredText = document.createElement("span");
        requiredText.innerText = "必填";
        requiredWrap.appendChild(requiredText);
        row.appendChild(requiredWrap);

        var deleteFieldButton = createButton("删除", function () {
          state.schemaFields = state.schemaFields.filter(function (entry) {
            return entry.id != field.id;
          });
          renderSchemaFields();
          updateVariantFieldState(false);
          scheduleEditorDraftSave();
        });
        deleteFieldButton.style.marginTop = "0";
        deleteFieldButton.style.marginRight = "0";
        deleteFieldButton.style.padding = "4px 8px";
        deleteFieldButton.style.minWidth = "64px";
        deleteFieldButton.style.whiteSpace = "nowrap";
        row.appendChild(deleteFieldButton);

        function refreshRowLayout() {
          var enumVisible = normalizeSchemaType(typeSelect.value) == "enum";
          row.style.gridTemplateColumns = enumVisible
            ? "minmax(0, 1.6fr) 110px minmax(0, 1.2fr) 80px auto"
            : "minmax(0, 1.6fr) 110px 80px auto";
          enumWrap.style.display = enumVisible ? "" : "none";
        }

        function syncField(showError) {
          field.path = trim(pathInput.value);
          field.type = normalizeSchemaType(typeSelect.value);
          field.required = requiredInput.checked;
          field.enumValues = normalizeEnumOptions(enumInput.value);

          var valid =
            field.path.length > 0 &&
            isValidFieldPath(field.path) &&
            state.schemaFields.filter(function (entry) {
              return trim(entry.path) == field.path;
            }).length == 1 &&
            (field.type != "enum" || field.enumValues.length > 0);

          pathInput.style.borderColor = valid ? "" : "#b3261e";
          enumInput.style.borderColor =
            field.type != "enum" || field.enumValues.length > 0
              ? ""
              : "#b3261e";

          if (!valid && showError) {
            showStatus("字段配置有误，请检查路径唯一性和枚举值", true);
          }

          updateVariantFieldState(false);
          scheduleEditorDraftSave();
        }

        mxEvent.addListener(pathInput, "input", function () {
          syncField(false);
        });
        mxEvent.addListener(typeSelect, "change", function () {
          refreshRowLayout();
          syncField(false);
        });
        mxEvent.addListener(enumInput, "input", function () {
          syncField(false);
        });
        mxEvent.addListener(requiredInput, "change", function () {
          syncField(false);
        });
        refreshRowLayout();
      });
    }

    renderSchemaFields();

    function rebuildEditorUi(specOrNull) {
      renderSchemaFields();
      refreshVariantSection();
      renderVariantList();
      updateTemplateNameState(false);
      updateVariantFieldState(false);

      if (specOrNull != null) {
        updatePreview(specOrNull);
      } else {
        updatePreview(null);
      }
    }

    function recalcNextItemId() {
      var maxId = 0;

      function scanId(id) {
        var match = /:(\d+)$/.exec(trim(id));

        if (match != null) {
          maxId = Math.max(maxId, parseInt(match[1], 10) || 0);
        }
      }

      function scanLayout(layout) {
        var i;
        var ports = normalizePortLayout(layout != null ? layout.ports : []);
        var labels = normalizeLabels(layout != null ? layout.labels : []);

        for (i = 0; i < ports.length; i++) {
          scanId(ports[i].id);
        }

        for (i = 0; i < labels.length; i++) {
          scanId(labels[i].id);
        }
      }

      scanLayout(state.currentSpec);

      (state.variantItems || []).forEach(function (item) {
        scanId(item.id);
        scanLayout(item);
      });

      state.nextId = maxId + 1;
    }

    function loadTemplateIntoEditor(template, options) {
      var spec = normalizeSpec(cloneJson(template));
      var layouts = normalizeVariantLayouts(spec.variantLayouts);
      var keys = Object.keys(spec.svgVariants || {});

      options = options || {};
      state.symbolIdTouched = !options.allowAutoSymbolId;
      state.symbolIdInput.value =
        trim(spec.symbolId).length > 0
          ? spec.symbolId
          : generateSymbolId(
              spec.templateName || spec.title || "electrical-symbol",
            );
      state.templateNameInput.value =
        trim(spec.templateName || spec.title) || "电气图元";
      state.uploadedPrimarySvg = spec.svg || "";
      state.uploadedPrimarySvgName =
        trim(options.primarySvgName || "") ||
        (trim(spec.templateName || spec.title).length > 0
          ? trim(spec.templateName || spec.title) + ".svg"
          : "已加载默认SVG");
      state.uploadedPrimarySvgSize =
        spec.size != null
          ? cloneJson(spec.size)
          : extractSvgSize(spec.svg || "");
      if (state.templateWidthInput != null) {
        state.templateWidthInput.value = String(spec.size.width);
      }
      if (state.templateHeightInput != null) {
        state.templateHeightInput.value = String(spec.size.height);
      }
      primaryName.innerText =
        trim(state.uploadedPrimarySvg).length > 0
          ? state.uploadedPrimarySvgName
          : "未选择默认SVG";
      state.schemaFields = flattenSchemaFields(spec.schema, "", []).map(
        function (field) {
          return normalizeSchemaField(field);
        },
      );
      if (state.schemaFields.length == 0) {
        state.schemaFields = getDefaultSchemaFields();
      }
      state.variantEnabled =
        trim(spec.variantField).length > 0 ||
        Object.keys(spec.svgVariants || {}).length > 0;
      state.variantFieldInput.value = trim(spec.variantField);
      state.lastValidVariantField = trim(spec.variantField);
      state.previewVariantId = "";
      state.selectedItem = null;
      state.currentSpec = spec;
      state.variantItems = keys.map(function (key) {
        var variantLayout = layouts[key] || {};

        return {
          id: nextItemId("variant"),
          key: key,
          svg: spec.svgVariants[key],
          name: key + ".svg",
          ports: normalizePortLayout(variantLayout.ports || []),
          labels: normalizeLabels(variantLayout.labels || []),
        };
      });
      recalcNextItemId();
      rebuildEditorUi(spec);
      scheduleEditorDraftSave();
    }

    function restoreDraftIfExists() {
      var draft = loadEditorDraft();
      var draftSpec;

      if (draft == null) {
        return false;
      }

      try {
        state.symbolIdTouched = !!draft.symbolIdTouched;
        state.symbolIdInput.value =
          trim(draft.symbolId).length > 0
            ? draft.symbolId
            : generateSymbolId("electrical-symbol");
        state.templateNameInput.value =
          trim(draft.templateName).length > 0 ? draft.templateName : "电气图元";
        state.uploadedPrimarySvg = trim(draft.uploadedPrimarySvg);
        state.uploadedPrimarySvgName = trim(draft.uploadedPrimarySvgName);
        state.uploadedPrimarySvgSize = isObject(draft.uploadedPrimarySvgSize)
          ? cloneJson(draft.uploadedPrimarySvgSize)
          : null;
        if (state.templateWidthInput != null) {
          state.templateWidthInput.value =
            trim(draft.templateWidth).length > 0
              ? trim(draft.templateWidth)
              : String(
                  draft.currentSpec != null && draft.currentSpec.size != null
                    ? draft.currentSpec.size.width
                    : state.uploadedPrimarySvgSize != null
                      ? state.uploadedPrimarySvgSize.width
                      : 120,
                );
        }
        if (state.templateHeightInput != null) {
          state.templateHeightInput.value =
            trim(draft.templateHeight).length > 0
              ? trim(draft.templateHeight)
              : String(
                  draft.currentSpec != null && draft.currentSpec.size != null
                    ? draft.currentSpec.size.height
                    : state.uploadedPrimarySvgSize != null
                      ? state.uploadedPrimarySvgSize.height
                      : 80,
                );
        }
        primaryName.innerText =
          trim(state.uploadedPrimarySvg).length > 0
            ? state.uploadedPrimarySvgName || "已加载默认SVG"
            : "未选择默认SVG";
        state.variantEnabled = !!draft.variantEnabled;
        state.variantFieldInput.value = trim(draft.variantField);
        state.lastValidVariantField = trim(draft.variantField);
        state.previewVariantId = trim(draft.previewVariantId);
        state.schemaFields = Array.isArray(draft.schemaFields)
          ? draft.schemaFields.map(function (field) {
              return normalizeSchemaField(field);
            })
          : getDefaultSchemaFields();
        state.variantItems = Array.isArray(draft.variantItems)
          ? draft.variantItems.map(function (item) {
              return {
                id: trim(item.id) || nextItemId("variant"),
                key: trim(item.key),
                svg: trim(item.svg),
                name: trim(item.name),
                ports: normalizePortLayout(item.ports || []),
                labels: normalizeLabels(item.labels || []),
              };
            })
          : [];
        draftSpec =
          draft.currentSpec != null &&
          trim(draft.currentSpec.svg || draft.uploadedPrimarySvg).length > 0
            ? normalizeSpec(cloneJson(draft.currentSpec))
            : null;
        state.currentSpec = draftSpec;
        recalcNextItemId();
        rebuildEditorUi(draftSpec);
        showStatus("已恢复上次未保存的草稿", false);
        return true;
      } catch (e) {
        clearEditorDraft();
        return false;
      }
    }

    state.preview = document.createElement("div");
    state.preview.style.marginTop = "10px";
    state.preview.style.height = "328px";
    state.preview.style.border = "1px solid #d0d7de";
    state.preview.style.display = "block";
    state.preview.style.boxSizing = "border-box";
    state.preview.style.overflow = "hidden";
    state.preview.style.background = Editor.isDarkMode()
      ? "#111111"
      : "#fafafa";
    container.appendChild(state.preview);

    var buttons = document.createElement("div");
    buttons.style.marginTop = "10px";
    container.appendChild(buttons);

    var previewButton = createButton(
      mxResources.get("electricalPreview"),
      function () {
        parseEditorSpec();
      },
    );
    buttons.appendChild(previewButton);

    var addLibraryButton = createButton(
      mxResources.get("electricalAddLibrary"),
      function () {
        addToLibrary(parseEditorSpec(), function () {
          clearEditorDraft();
          if (state.window != null && state.window.window != null) {
            state.window.window.destroy();
          }
        });
      },
    );
    buttons.appendChild(addLibraryButton);

    state.status = document.createElement("div");
    state.status.style.marginTop = "10px";
    state.status.style.minHeight = "18px";
    container.appendChild(state.status);

    function setButtonEnabled(button, enabled) {
      button.disabled = !enabled;
      button.style.opacity = enabled ? "1" : "0.45";
      button.style.pointerEvents = enabled ? "auto" : "none";
    }

    function updateTemplateNameState(showError) {
      var name = trim(
        state.templateNameInput != null ? state.templateNameInput.value : "",
      );
      var symbolId = trim(
        state.symbolIdInput != null ? state.symbolIdInput.value : "",
      );
      var valid = name.length > 0 && !isTemplateNameTaken(name, symbolId);

      if (state.templateNameInput != null) {
        state.templateNameInput.style.borderColor = !valid ? "#b3261e" : "";
        state.templateNameInput.style.boxShadow = !valid
          ? "0 0 0 1px rgba(179,38,30,0.2)"
          : "";
        state.templateNameInput.title =
          name.length == 0
            ? "图元类型名称不能为空"
            : !valid
              ? "图元类型名称不能重复"
              : "";
      }

      setButtonEnabled(addLibraryButton, valid);

      if (!valid && showError) {
        showStatus(
          name.length == 0 ? "请先填写图元类型名称" : "图元类型名称不能重复",
          true,
        );
      }

      return valid;
    }

    function updateVariantFieldState(showError) {
      var valid = true;

      if (state.variantEnabled) {
        valid = validateVariantField(showError) != null;
      }

      if (state.variantFieldInput != null) {
        state.variantFieldInput.style.borderColor = !valid ? "#b3261e" : "";
        state.variantFieldInput.style.boxShadow = !valid
          ? "0 0 0 1px rgba(179,38,30,0.2)"
          : "";
        state.variantFieldInput.title = !valid
          ? "变体字段必须先在 JSON 类型定义中声明"
          : "";
      }

      setButtonEnabled(addVariantButton, !state.variantEnabled || valid);
      setButtonEnabled(previewButton, !state.variantEnabled || valid);
      setButtonEnabled(
        addLibraryButton,
        (!state.variantEnabled || valid) && updateTemplateNameState(false),
      );

      return valid;
    }

    bindSvgUpload(
      primaryInput,
      primaryName,
      "uploadedPrimarySvg",
      "uploadedPrimarySvgName",
      "默认SVG 已加载",
      true,
      function () {
        state.previewVariantId = "";
        updateSelectedItem(null, null);
        if (state.templateWidthInput != null && state.uploadedPrimarySvgSize != null) {
          state.templateWidthInput.value = String(state.uploadedPrimarySvgSize.width);
        }
        if (state.templateHeightInput != null && state.uploadedPrimarySvgSize != null) {
          state.templateHeightInput.value = String(state.uploadedPrimarySvgSize.height);
        }
      },
    );

    mxEvent.addListener(primaryInput, "change", function () {
      if (state.symbolIdInput != null && !state.symbolIdTouched) {
        state.symbolIdInput.value = generateSymbolId(
          state.uploadedPrimarySvgName || "electrical-symbol",
        );
        updateTemplateNameState(false);
      }
    });
    mxEvent.addListener(state.templateNameInput, "input", function () {
      updateTemplateNameState(false);
      scheduleEditorDraftSave();
    });
    mxEvent.addListener(state.templateNameInput, "blur", function () {
      updateTemplateNameState(true);
    });
    mxEvent.addListener(state.templateWidthInput, "change", function () {
      if (trim(state.uploadedPrimarySvg).length > 0) {
        try {
          parseEditorSpec();
        } catch (e) {
          // keep status feedback only
        }
      } else {
        scheduleEditorDraftSave();
      }
    });
    mxEvent.addListener(state.templateHeightInput, "change", function () {
      if (trim(state.uploadedPrimarySvg).length > 0) {
        try {
          parseEditorSpec();
        } catch (e) {
          // keep status feedback only
        }
      } else {
        scheduleEditorDraftSave();
      }
    });
    mxEvent.addListener(state.variantFieldInput, "change", function () {
      var currentValue = trim(state.variantFieldInput.value);

      if (state.variantEnabled) {
        if (!updateVariantFieldState(true)) {
          return;
        }

        state.lastValidVariantField = currentValue;
      }

      if (trim(state.uploadedPrimarySvg).length > 0) {
        parseEditorSpec();
      }

      scheduleEditorDraftSave();
    });
    mxEvent.addListener(state.variantFieldInput, "input", function () {
      updateVariantFieldState(false);
      scheduleEditorDraftSave();
    });
    mxEvent.addListener(state.variantFieldInput, "blur", function () {
      updateVariantFieldState(true);
    });
    mxEvent.addListener(variantToggle, "change", function () {
      state.variantEnabled = variantToggle.checked;

      if (state.variantEnabled) {
        var validField = validateVariantField(false);

        if (validField != null) {
          state.lastValidVariantField = validField;
        }
      } else {
        state.previewVariantId = "";
        updateSelectedItem(null, null);
      }

      refreshVariantSection();
      updateVariantFieldState(false);
      scheduleEditorDraftSave();

      if (trim(state.uploadedPrimarySvg).length > 0) {
        try {
          parseEditorSpec();
        } catch (e) {
          // 启用变体后允许用户继续补字段，不强制立即关闭开关
        }
      }
    });
    refreshVariantSection();
    renderVariantList();
    updateTemplateNameState(false);
    updateVariantFieldState(false);
    restoreDraftIfExists();

    var x = Math.max(20, (document.body.offsetWidth - 560) / 2);
    var y = 80;
    var wnd = new mxWindow(
      mxResources.get("electricalSymbols"),
      container,
      x,
      y,
      560,
      620,
      true,
      true,
    );
    wnd.destroyOnClose = true;
    wnd.setClosable(true);
    wnd.setMaximizable(false);
    wnd.setResizable(true);
    wnd.setScrollable(true);
    wnd.addListener(mxEvent.DESTROY, function () {
      state.window = null;
      state.status = null;
      state.symbolIdInput = null;
      state.templateNameInput = null;
      state.templateWidthInput = null;
      state.templateHeightInput = null;
      state.variantFieldInput = null;
      state.schemaFields = [];
      state.preview = null;
      state.variantEnabled = false;
      state.lastValidVariantField = "";
      state.previewVariantId = "";
      state.variantItems = [];
      state.currentSpec = null;
      clearDraftSaveTimer();
    });
    if (state.currentSpec == null) {
      updatePreview(null);
    }
    loadStoredLibrary(null, true);

    return {
      window: wnd,
      container: container,
      loadTemplate: function (template) {
        loadTemplateIntoEditor(template);
      },
    };
  }

  // 菜单项再次点击时直接复用已有窗口实例，避免重复创建事件和 DOM
  function toggleWindow() {
    if (state.window == null) {
      state.window = createWindow();
      state.window.window.setVisible(true);
    } else {
      state.window.window.setVisible(!state.window.window.isVisible());
    }
  }

  function openEditorWithTemplate(template) {
    if (state.window == null) {
      state.window = createWindow();
    }

    state.window.window.setVisible(true);

    if (typeof state.window.loadTemplate === "function") {
      state.window.loadTemplate(template);
    }

    if (typeof state.window.window.toFront === "function") {
      state.window.window.toFront();
    }
  }

  var graphIsCellDeletable = graph.isCellDeletable;
  graph.isCellDeletable = function (cell) {
    if (isDrawingFrame(cell)) {
      return !!state.allowProtectedDelete;
    }

    return graphIsCellDeletable.apply(this, arguments);
  };

  ui.actions.addAction("electricalSymbols", function () {
    toggleWindow();
  });

  ui.actions.addAction("electricalBrowse", function () {
    openTemplateBrowserDialog();
  });

  ui.actions.addAction("electricalCreate", function () {
    openCreateFromLibraryDialog();
  });

  ui.actions.addAction("electricalEditInstance", function () {
    openEditInstanceDialog();
  });

  ui.actions.addAction("electricalInsertFrame", function () {
    openInsertFrameDialog();
  });

  ui.actions.addAction("electricalInsertCabinet", function () {
    openInsertCabinetDialog();
  });

  ui.actions.addAction("electricalReassignPort", function () {
    enterPortSwapMode();
  });

  ui.actions.addAction("electricalRefresh", function () {
    refreshSelection();
  });

  ui.actions.addAction("electricalExportSvg", function () {
    try {
      openSvgExportDialog();
    } catch (e) {
      showStatus(e.message || String(e), true);
    }
  });

  ui.actions.addAction("electricalClearScreen", function () {
    try {
      clearCurrentPage();
    } catch (e) {
      state.allowProtectedDelete = false;
      showStatus(e.message || String(e), true);
    }
  });

  var menu = ui.menus.get("extras");
  var oldExtrasMenu = menu.funct;

  menu.funct = function (menu, parent) {
    oldExtrasMenu.apply(this, arguments);
    ui.menus.addMenuItems(
      menu,
      [
        "-",
        "electricalSymbols",
        "electricalBrowse",
        "electricalCreate",
        "electricalEditInstance",
        "electricalInsertFrame",
        "electricalInsertCabinet",
        "electricalClearScreen",
        "electricalReassignPort",
        "electricalRefresh",
        "electricalExportSvg",
      ],
      parent,
    );
  };

  installTopActionBar();
  ui.addListener("languageChanged", installTopActionBar);
  ui.addListener("currentThemeChanged", installTopActionBar);

  model.addListener(mxEvent.CHANGE, handleModelChange);
});
