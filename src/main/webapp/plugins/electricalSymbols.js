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
  var ROOT_TYPE = "electricalSymbol";
  var BODY_KIND = "body";
  var LABEL_KIND = "label";
  var BADGE_KIND = "badge";
  // 保存插件窗口和运行期缓存
  var state = {
    libraryImages: [],
    updatingModel: false,
    window: null,
    status: null,
    symbolIdInput: null,
    symbolIdTouched: false,
    variantFieldInput: null,
    variantEnabled: false,
    lastValidVariantField: "",
    jsonArea: null,
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
  };

  mxResources.parse(
    [
      "electricalSymbols=定义电气图元",
      "electricalCreate=创建电气图元",
      "electricalRefresh=刷新电气图元",
      "electricalExportSvg=导出SVG",
      "electricalPreview=刷新预览",
      "electricalAddLibrary=加入库",
      "electricalExportLibrary=导出库",
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

  function normalizeLabelAlign(align) {
    align = trim(align).toLowerCase();

    return align == "left" || align == "right" ? align : "center";
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
        var rand = Math.random() * 16 | 0;
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
      var schema = parseTypeDefinition(state.jsonArea.value);

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

  function parseTypeDefinition(text) {
    var source = trim(text);

    if (source.length == 0) {
      return {};
    }

    try {
      return JSON.parse(source);
    } catch (e) {
      return new Function(
        "var string='string', number='number', boolean='boolean', object='object', array='array', any='any', nullType='null'; return (" +
          source +
          ");",
      )();
    }
  }

  function buildEmptyValueFromSchema(schema) {
    var key;

    if (Array.isArray(schema)) {
      return [];
    }

    if (isObject(schema)) {
      var result = {};

      for (key in schema) {
        if (schema.hasOwnProperty(key)) {
          result[key] = buildEmptyValueFromSchema(schema[key]);
        }
      }

      return result;
    }

    switch (schema) {
      case "string":
        return "";
      case "number":
        return null;
      case "boolean":
        return null;
      case "array":
        return [];
      case "object":
        return {};
      default:
        return null;
    }
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

  // 生成预览区使用的 svg data uri
  function toSvgDataUri(spec) {
    return Graph.clipSvgDataUri(Editor.createSvgDataUri(getActiveSvg(spec)));
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

  function buildTemplateSpec() {
    if (trim(state.uploadedPrimarySvg).length == 0) {
      throw new Error("请先上传默认SVG");
    }

    var schema = parseTypeDefinition(state.jsonArea.value);

    if (!isObject(schema)) {
      throw new Error("类型定义必须是对象");
    }

    var current = state.currentSpec || {};
    var symbolId = trim(
      state.symbolIdInput != null ? state.symbolIdInput.value : "",
    );

    if (symbolId.length == 0) {
      throw new Error("请先填写图元类型ID");
    }

    var variantField = "";

    if (state.variantEnabled) {
      variantField = validateVariantField(true);

      if (variantField == null) {
        throw new Error("变体字段必须先在 JSON 类型定义中声明");
      }
    }

    return normalizeSpec({
      symbolId: symbolId,
      title: trim(current.title) || "电气图元",
      svg: state.uploadedPrimarySvg,
      size:
        state.uploadedPrimarySvgSize ||
        extractSvgSize(state.uploadedPrimarySvg),
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

    if (
      variantItem != null &&
      trim(variantItem.svg).length > 0
    ) {
      return Graph.clipSvgDataUri(Editor.createSvgDataUri(variantItem.svg));
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

  // 预览区是一个轻量交互编辑面板。
  // 用户可以直接在这里添加/拖动连接点和文本框，修改会实时写回 JSON。
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
      return;
    }

    state.currentSpec = normalizeSpec(spec);
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
      handle.style.fontSize = "16px";
      handle.style.fontWeight = "700";
      handle.style.cursor = "move";
      handle.style.userSelect = "none";
      handle.style.zIndex = "2";
      handle.innerText = "×";
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

  // 规范化单个端口点位，最终格式为 {id, x, y}，x/y 都在 0..1。
  function normalizePortPoint(raw, fallbackId, fallbackX, fallbackY) {
    var id = fallbackId;
    var x = fallbackX;
    var y = fallbackY;

    if (isObject(raw)) {
      id = trim(raw.id || raw.key || raw.name) || fallbackId;
      x = toFloat(raw.x, fallbackX);
      y = toFloat(raw.y, fallbackY);
    } else if (typeof raw == "number") {
      y = raw;
    }

    return {
      id: id,
      x: clamp(x, 0, 1),
      y: clamp(y, 0, 1),
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
    var root = findElectricalRoot(cell);

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

  var oldGetAllConnectionConstraints = graph.getAllConnectionConstraints;

  // 用 mxConnectionConstraint 动态生成 draw.io 原生连接点。
  // 只拦截电气图元，其他普通图元仍走 draw.io 原生连接点逻辑。
  graph.getAllConnectionConstraints = function (terminal, source) {
    var root = findElectricalRoot(terminal != null ? terminal.cell : null);

    if (root != null) {
      return getElectricalConstraints(root);
    }

    return oldGetAllConnectionConstraints.apply(this, arguments);
  };

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
      title: spec.title,
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
  function addToLibrary(spec) {
    loadStoredLibrary(function (images) {
      var next = images.slice();
      var entry = createLibraryEntry(spec);
      var index = findLibraryEntryIndex(next, spec.symbolId);

      if (index >= 0) {
        next[index] = entry;
      } else {
        next.push(entry);
      }

      saveLibraryImages(next, function () {
        showStatus(index >= 0 ? "已更新图库模板" : "已加入图库", false);
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

  function buildInstanceSpec(instanceData, template) {
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
  function openCreateFromLibraryDialog() {
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

      var currentTemplate = templates[0];
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
      title.innerText = "选择图元类型并输入实例 JSON";
      div.appendChild(title);

      var select = document.createElement("select");
      select.style.width = "100%";
      select.style.boxSizing = "border-box";
      select.style.marginBottom = "10px";
      div.appendChild(select);

      var textarea = document.createElement("textarea");
      textarea.spellcheck = false;
      textarea.style.width = "100%";
      textarea.style.flex = "1 1 auto";
      textarea.style.minHeight = "220px";
      textarea.style.boxSizing = "border-box";
      div.appendChild(textarea);

      var buttons = document.createElement("div");
      buttons.style.marginTop = "10px";
      buttons.style.flex = "0 0 auto";
      div.appendChild(buttons);

      function syncTemplate(index) {
        currentTemplate = templates[index];
        textarea.value = JSON.stringify(
          buildEmptyValueFromSchema(currentTemplate.schema),
          null,
          2,
        );
      }

      for (i = 0; i < templates.length; i++) {
        var option = document.createElement("option");
        option.value = String(i);
        option.innerText =
          templates[i].title + " (" + templates[i].symbolId + ")";
        select.appendChild(option);
      }

      mxEvent.addListener(select, "change", function () {
        syncTemplate(parseInt(select.value, 10) || 0);
      });

      syncTemplate(0);

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
          var payload = JSON.parse(textarea.value);
          insertIntoGraph(buildInstanceSpec(payload, currentTemplate));
          wnd.destroy();
        } catch (e) {
          showStatus(e.message || String(e), true);
        }
      });
      submitButton.style.marginTop = "0";
      buttons.appendChild(submitButton);
    });
  }

  // 插入画布时只需要导入 root，子节点会随 root 一起进入图模型。
  function insertIntoGraph(spec) {
    var root = buildSymbolCell(spec);
    var pt = graph.getFreeInsertPoint();
    graph.setSelectionCells(graph.importCells([root], pt.x, pt.y));
    graph.scrollCellToVisible(graph.getSelectionCell());
    showStatus("已插入图元", false);
  }

  // 菜单里的“刷新电气图元”动作
  // 手工 Edit Data 后，让图形外观重新和元数据对齐
  function refreshSelection() {
    var root = findElectricalRoot(graph.getSelectionCell());

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
    addTopButton("electricalCreate", "electricalCreate");
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
    });

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
          },
        );
      });
    }

    state.jsonArea = document.createElement("textarea");
    state.jsonArea.spellcheck = false;
    state.jsonArea.style.width = "100%";
    state.jsonArea.style.height = "220px";
    state.jsonArea.style.marginTop = "10px";
    state.jsonArea.style.boxSizing = "border-box";
    state.jsonArea.value = [
      "{",
      "  title: string,",
      "  name: string,",
      "  code: string,",
      "  power: string",
      "}",
    ].join("\n");
    container.appendChild(state.jsonArea);

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

    var previewButton = createButton(mxResources.get("electricalPreview"), function () {
        parseEditorSpec();
      });
    buttons.appendChild(previewButton);

    var addLibraryButton = createButton(mxResources.get("electricalAddLibrary"), function () {
        addToLibrary(parseEditorSpec());
      });
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

    function updateVariantFieldState(showError) {
      var valid = true;

      if (state.variantEnabled) {
        valid = validateVariantField(showError) != null;
      }

      if (state.variantFieldInput != null) {
        state.variantFieldInput.style.borderColor =
          !valid ? "#b3261e" : "";
        state.variantFieldInput.style.boxShadow =
          !valid ? "0 0 0 1px rgba(179,38,30,0.2)" : "";
        state.variantFieldInput.title =
          !valid ? "变体字段必须先在 JSON 类型定义中声明" : "";
      }

      setButtonEnabled(addVariantButton, !state.variantEnabled || valid);
      setButtonEnabled(previewButton, !state.variantEnabled || valid);
      setButtonEnabled(addLibraryButton, !state.variantEnabled || valid);

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
      },
    );

    mxEvent.addListener(primaryInput, "change", function () {
      if (state.symbolIdInput != null && !state.symbolIdTouched) {
        state.symbolIdInput.value = generateSymbolId(
          state.uploadedPrimarySvgName || "electrical-symbol",
        );
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
    });
    mxEvent.addListener(state.variantFieldInput, "input", function () {
      updateVariantFieldState(false);
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
    updateVariantFieldState(false);

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
      state.variantFieldInput = null;
      state.jsonArea = null;
      state.preview = null;
      state.variantEnabled = false;
      state.lastValidVariantField = "";
      state.previewVariantId = "";
      state.variantItems = [];
      state.currentSpec = null;
    });
    updatePreview(null);
    loadStoredLibrary(null, true);

    return { window: wnd, container: container };
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

  ui.actions.addAction("electricalSymbols", function () {
    toggleWindow();
  });

  ui.actions.addAction("electricalCreate", function () {
    openCreateFromLibraryDialog();
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

  var menu = ui.menus.get("extras");
  var oldExtrasMenu = menu.funct;

  menu.funct = function (menu, parent) {
    oldExtrasMenu.apply(this, arguments);
    ui.menus.addMenuItems(
      menu,
      [
        "-",
        "electricalSymbols",
        "electricalCreate",
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
