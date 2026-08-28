/** Generated file. Edit sources in plugins/electricalSymbols/ instead. Built with npm run build from plugins/electricalSymbols/. */
(() => {
  // core/constants.js
  var ELECTRICAL_CONSTANTS = Object.freeze({
    LIBRARY_TITLE: "\u7535\u6C14\u56FE\u5143\u5E93",
    ROOT_TAG: "ElectricalSymbol",
    BODY_TAG: "ElectricalBody",
    LABEL_TAG: "ElectricalLabel",
    FRAME_TAG: "DrawingFrame",
    FRAME_LABEL_TAG: "DrawingFrameLabel",
    CABINET_TAG: "CabinetSegment",
    CABINET_BODY_TAG: "CabinetBody",
    CABINET_BLOCK_TAG: "CabinetBlock",
    CABINET_SWITCH_LINK_TAG: "CabinetSwitchLink",
    CABINET_BUSBAR_TAG: "CabinetBusbar",
    CABINET_TEXT_TAG: "CabinetText",
    CABINET_GAP_TAG: "CabinetGap",
    ROOT_TYPE: "electricalSymbol",
    FRAME_TYPE: "drawingFrame",
    CABINET_TYPE: "cabinetSegment",
    CABINET_GAP_TYPE: "cabinetGap",
    BODY_KIND: "body",
    LABEL_KIND: "label",
    FRAME_LABEL_KIND: "pageLabel",
    CABINET_BODY_KIND: "cabinetBody",
    CABINET_BLOCK_KIND: "cabinetBlock",
    CABINET_SWITCH_LINK_KIND: "cabinetSwitchLink",
    CABINET_BUSBAR_KIND: "cabinetBusbar",
    CABINET_NAME_LABEL_KIND: "cabinetNameLabel",
    CABINET_LOCATION_LABEL_KIND: "cabinetLocationLabel",
    CABINET_DESIGNATION_LABEL_KIND: "cabinetDesignationLabel",
    CABINET_GAP_KIND: "cabinetGap",
    PORT_EDGE_SNAP_THRESHOLD_PX: 14,
    TEMPLATE_DRAFT_STORAGE_KEY: "electrical-symbol-template-draft",
    FRAME_DEFAULT_WIDTH: 820,
    FRAME_DEFAULT_HEIGHT: 1180,
    FRAME_HORIZONTAL_GAP: 40,
    FRAME_VERTICAL_GAP: 56,
    FRAME_CONTENT_RATIO: 0.8,
    FRAME_MARGIN_RATIO: 0.1,
    // 柜宽要放得下：左壁留白 + 纵向名称文字 + 母线 + 引出线段 + 开关
    CABINET_DEFAULT_WIDTH: 180,
    CABINET_MIN_WIDTH: 90,
    // 母线距左壁占柜宽的比例；纵向名称文字摆在左壁与母线之间
    // 配电柜可以比普通图元占得更高一些：图框内容区是 0.8，柜体给到 0.86
    CABINET_CONTENT_RATIO: 0.86,
    CABINET_BUSBAR_RATIO: 0.28,
    // 母线上下不到顶不到底的留白
    CABINET_BUSBAR_INSET_Y: 34,
    // 母线到开关左端的引出线长度
    CABINET_SWITCH_LEAD: 52,
    // 柜体首块之上、末块之下的留白（编号文字要占顶部这一段）
    CABINET_HEAD_PADDING: 44,
    // 换页折断标识的深度
    CABINET_BREAK_DEPTH: 22,
    // 折断边左右两段各占柜宽的比例。两段之和超过 1，重叠区里的斜线才连成反 Z
    CABINET_BREAK_SEGMENT_RATIO: 0.6,
    // 柜体文字的默认值：不强制用户填，插入时先按这套渲染，再由参数导入覆盖
    CABINET_DEFAULT_CODE: "GB01",
    CABINET_DEFAULT_VOLTAGE: "230VAC",
    CABINET_DEFAULT_LOCATION: "DECK / EL. EQ.",
    // 母线线宽
    CABINET_BUSBAR_WIDTH: 4,
    CABINET_DEFAULT_BLOCK_COUNT: 4,
    CABINET_BLOCK_DEFAULT_HEIGHT: 150,
    CABINET_BLOCK_MIN_HEIGHT: 24,
    CABINET_BLOCK_MAX_HEIGHT: 4e3,
    CABINET_DEFAULT_X: 72,
    CABINET_TAIL_PADDING: 40,
    BACKEND_SESSION_STORAGE_KEY: "electrical-symbol-backend-session",
    BACKEND_DEFAULT_BASE_URL: "/api",
    INSTANCE_COMPOSE_ZONE_PADDING: 80,
    INSTANCE_COMPOSE_ZONE_MIN_WIDTH: 260,
    INSTANCE_COMPOSE_ZONE_MIN_HEIGHT: 200
  });

  // core/state.js
  function defineAlias(state, alias, slice, key) {
    Object.defineProperty(state, alias, {
      configurable: true,
      enumerable: true,
      get: function() {
        return state[slice][key];
      },
      set: function(value) {
        state[slice][key] = value;
      }
    });
  }
  function createPluginState(constants) {
    var state = {
      // editor 存放模板编辑器及预览相关状态。
      editor: {
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
        draftSaveTimer: null
      },
      // windows 只记录各弹窗/窗口实例。
      windows: {
        templateEditor: null,
        templateBrowser: null,
        instanceEditor: null,
        cabinetBlockDialog: null,
        switchPicker: null
      },
      library: {
        images: []
      },
      // backend 记录当前与后端图纸会话相关的上下文。
      backend: {
        baseUrl: constants.BACKEND_DEFAULT_BASE_URL,
        actorId: "local-user",
        diagramId: "",
        diagramTitle: "",
        diagramVersion: 0,
        lastSnapshot: null
      },
      // canvas 存放图编辑器运行期的保护开关和变更记录。
      canvas: {
        updatingModel: false,
        allowProtectedDelete: false,
        pendingChangeRecords: [],
        nextChangeSequence: 1,
        suspendOperationRecording: false,
        lastOperationSnapshot: null
      },
      compose: {
        session: null,
        overlay: null,
        keyHandler: null
      },
      portSwap: {
        session: null,
        overlay: null
      },
      cabinet: {
        frameConfig: null
      }
    };
    defineAlias(state, "libraryImages", "library", "images");
    defineAlias(state, "updatingModel", "canvas", "updatingModel");
    defineAlias(state, "window", "windows", "templateEditor");
    defineAlias(state, "templatesWindow", "windows", "templateBrowser");
    defineAlias(state, "instanceWindow", "windows", "instanceEditor");
    defineAlias(state, "instanceComposeSession", "compose", "session");
    defineAlias(state, "instanceComposeOverlay", "compose", "overlay");
    defineAlias(state, "instanceComposeKeyHandler", "compose", "keyHandler");
    defineAlias(state, "status", "editor", "status");
    defineAlias(state, "symbolIdInput", "editor", "symbolIdInput");
    defineAlias(state, "symbolIdTouched", "editor", "symbolIdTouched");
    defineAlias(state, "templateNameInput", "editor", "templateNameInput");
    defineAlias(state, "templateWidthInput", "editor", "templateWidthInput");
    defineAlias(state, "templateHeightInput", "editor", "templateHeightInput");
    defineAlias(state, "variantFieldInput", "editor", "variantFieldInput");
    defineAlias(state, "variantEnabled", "editor", "variantEnabled");
    defineAlias(
      state,
      "lastValidVariantField",
      "editor",
      "lastValidVariantField"
    );
    defineAlias(state, "schemaFields", "editor", "schemaFields");
    defineAlias(state, "preview", "editor", "preview");
    defineAlias(state, "currentSpec", "editor", "currentSpec");
    defineAlias(state, "previewMode", "editor", "previewMode");
    defineAlias(state, "previewVariantId", "editor", "previewVariantId");
    defineAlias(state, "selectedItem", "editor", "selectedItem");
    defineAlias(state, "nextId", "editor", "nextId");
    defineAlias(state, "uploadedPrimarySvg", "editor", "uploadedPrimarySvg");
    defineAlias(
      state,
      "uploadedPrimarySvgName",
      "editor",
      "uploadedPrimarySvgName"
    );
    defineAlias(
      state,
      "uploadedPrimarySvgSize",
      "editor",
      "uploadedPrimarySvgSize"
    );
    defineAlias(state, "variantItems", "editor", "variantItems");
    defineAlias(state, "draftSaveTimer", "editor", "draftSaveTimer");
    defineAlias(state, "frameConfig", "cabinet", "frameConfig");
    defineAlias(state, "cabinetBlockDialogWindow", "windows", "cabinetBlockDialog");
    defineAlias(state, "switchPickerWindow", "windows", "switchPicker");
    defineAlias(state, "portSwapSession", "portSwap", "session");
    defineAlias(state, "portSwapOverlay", "portSwap", "overlay");
    defineAlias(state, "allowProtectedDelete", "canvas", "allowProtectedDelete");
    defineAlias(state, "backendBaseUrl", "backend", "baseUrl");
    defineAlias(state, "backendActorId", "backend", "actorId");
    defineAlias(state, "backendDiagramId", "backend", "diagramId");
    defineAlias(state, "backendDiagramTitle", "backend", "diagramTitle");
    defineAlias(state, "backendDiagramVersion", "backend", "diagramVersion");
    defineAlias(state, "backendLastSnapshot", "backend", "lastSnapshot");
    defineAlias(state, "pendingChangeRecords", "canvas", "pendingChangeRecords");
    defineAlias(state, "nextChangeSequence", "canvas", "nextChangeSequence");
    defineAlias(
      state,
      "suspendOperationRecording",
      "canvas",
      "suspendOperationRecording"
    );
    defineAlias(state, "lastOperationSnapshot", "canvas", "lastOperationSnapshot");
    return state;
  }

  // core/context.js
  function createPluginContext(ui) {
    var graph = ui.editor.graph;
    return {
      ui,
      graph,
      model: graph.getModel(),
      state: createPluginState(ELECTRICAL_CONSTANTS),
      constants: ELECTRICAL_CONSTANTS
    };
  }

  // core/resources.js
  var ELECTRICAL_RESOURCE_ENTRIES = [
    "electricalSymbols=\u5B9A\u4E49\u7535\u6C14\u56FE\u5143",
    "electricalBrowse=\u5DF2\u5B9A\u4E49\u56FE\u5143",
    "electricalCreate=\u521B\u5EFA\u7535\u6C14\u56FE\u5143",
    "electricalEditInstance=\u7F16\u8F91\u56FE\u5143\u5B9E\u4F8B",
    "electricalComposeInstance=\u7EC4\u5408\u56FE\u5143\u5B9E\u4F8B",
    "electricalRefresh=\u5237\u65B0\u7535\u6C14\u56FE\u5143",
    "electricalExport=\u5BFC\u51FA",
    "electricalExportSvg=\u5BFC\u51FASVG",
    "electricalInsertFrame=\u63D2\u5165\u56FE\u6846",
    "electricalInsertCabinet=\u63D2\u5165\u914D\u7535\u67DC",
    "electricalReassignPort=\u66F4\u6362\u6302\u70B9",
    "electricalSaveBackend=\u4FDD\u5B58\u5230\u540E\u7AEF",
    "electricalNewBackend=\u65B0\u5EFA\u540E\u7AEF\u56FE\u7EB8",
    "electricalLoadBackend=\u4ECE\u540E\u7AEF\u52A0\u8F7D",
    "electricalRollbackBackend=\u7248\u672C\u56DE\u6EDA",
    "electricalPreview=\u5237\u65B0\u9884\u89C8",
    "electricalAddLibrary=\u52A0\u5165\u5E93",
    "electricalClearScreen=\u6E05\u5C4F",
    "electricalForceDelete=\u5F3A\u5236\u5220\u9664",
    "electricalUploadPrimarySvg=\u4E0A\u4F20\u9ED8\u8BA4SVG",
    "electricalEnableVariants=\u542F\u7528\u53D8\u4F53SVG",
    "electricalAddVariantSvg=\u65B0\u589E\u53D8\u4F53SVG"
  ];
  function registerElectricalResources() {
    mxResources.parse(ELECTRICAL_RESOURCE_ENTRIES.join("\n"));
  }

  // core/appRuntime.js
  var currentApp = null;
  function setApp(app) {
    currentApp = app;
  }
  function getApp() {
    if (currentApp == null) {
      throw new Error("electricalSymbols app \u5C1A\u672A\u521D\u59CB\u5316");
    }
    return currentApp;
  }

  // utils/base.js
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
    return trim(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }
  function stripFileExtension(name) {
    var text = trim(name);
    var index = text.lastIndexOf(".");
    return index > 0 ? text.substring(0, index) : text;
  }
  function generateUuid() {
    if (typeof crypto !== "undefined" && crypto != null && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function(ch) {
        var rand = Math.random() * 16 | 0;
        var next = ch == "x" ? rand : rand & 3 | 8;
        return next.toString(16);
      }
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

  // utils/xml.js
  function createNode(tagName) {
    return mxUtils.createXmlDocument().createElement(tagName);
  }
  function cloneValue(node, fallbackTagName) {
    if (node != null && node.nodeType == mxConstants.NODETYPE_ELEMENT) {
      return node.cloneNode(true);
    }
    return createNode(fallbackTagName);
  }
  function getAttr(cell, name) {
    return cell != null && cell.value != null && cell.value.nodeType == mxConstants.NODETYPE_ELEMENT ? cell.value.getAttribute(name) : null;
  }
  function createMetaCell(tagName, kind, key, label) {
    var value = createNode(tagName);
    value.setAttribute("esKind", kind);
    value.setAttribute("esKey", key);
    value.setAttribute("label", label || "");
    return value;
  }
  function validateSvg(svg, trimFn) {
    var text = (trimFn || trim)(svg);
    if (text.length == 0) {
      throw new Error("\u7F3A\u5C11 svg \u5B57\u6BB5");
    }
    var doc = mxUtils.parseXml(text);
    var root = doc.documentElement;
    if (root == null || root.nodeName.toLowerCase() != "svg") {
      throw new Error("svg \u5185\u5BB9\u5FC5\u987B\u5305\u542B\u6839\u8282\u70B9 <svg>");
    }
    return mxUtils.getXml(root);
  }
  function extractSvgSize(svg, toFloatFn, trimFn) {
    var trim2 = trimFn || trim;
    var toFloat2 = toFloatFn || toFloat;
    var doc = mxUtils.parseXml(validateSvg(svg, trim2));
    var root = doc.documentElement;
    var viewBox = trim2(root.getAttribute("viewBox"));
    var width = toFloat2(root.getAttribute("width"), NaN);
    var height = toFloat2(root.getAttribute("height"), NaN);
    if (viewBox.length > 0) {
      var parts = viewBox.split(/\s+/);
      if (parts.length == 4) {
        width = toFloat2(parts[2], width);
        height = toFloat2(parts[3], height);
      }
    }
    return {
      width: Math.max(20, Math.round(isNaN(width) ? 120 : width)),
      height: Math.max(20, Math.round(isNaN(height) ? 80 : height))
    };
  }

  // core/runtimeHelpers.js
  function getGraphApi() {
    return getApp().ctx;
  }
  function getConstants() {
    return getApp().ctx.constants;
  }
  function getState() {
    return getApp().ctx.state;
  }
  function resetPendingChangeRecords(baselineSnapshot) {
    var state = getState();
    state.pendingChangeRecords = [];
    state.nextChangeSequence = 1;
    state.lastOperationSnapshot = baselineSnapshot != null ? cloneJson(baselineSnapshot) : null;
  }
  function isElectricalRoot(cell) {
    return getAttr(cell, "pluginType") == getConstants().ROOT_TYPE;
  }
  function findElectricalRoot(cell) {
    var model = getGraphApi().model;
    while (cell != null) {
      if (isElectricalRoot(cell)) {
        return cell;
      }
      cell = model.getParent(cell);
    }
    return null;
  }
  function isDrawingFrame(cell) {
    return getAttr(cell, "pluginType") == getConstants().FRAME_TYPE;
  }
  function isCabinetSegment(cell) {
    return getAttr(cell, "pluginType") == getConstants().CABINET_TYPE;
  }
  function isCabinetGap(cell) {
    return getAttr(cell, "pluginType") == getConstants().CABINET_GAP_TYPE;
  }
  function isCabinetBlock(cell) {
    return getAttr(cell, "esKind") == getConstants().CABINET_BLOCK_KIND;
  }
  function isCabinetSwitchLink(cell) {
    return getAttr(cell, "esKind") == getConstants().CABINET_SWITCH_LINK_KIND;
  }
  function isGenericPortHost(cell) {
    return getAttr(cell, "eidGenericPortHost") == "1";
  }
  function isPortHostRoot(cell) {
    return isElectricalRoot(cell) || isCabinetBlock(cell) || isCabinetSegment(cell) || isGenericPortHost(cell);
  }
  function findPortHostRoot(cell) {
    var model = getGraphApi().model;
    while (cell != null) {
      if (isPortHostRoot(cell)) {
        return cell;
      }
      if (shouldExportGenericObject(cell)) {
        return null;
      }
      cell = model.getParent(cell);
    }
    return null;
  }
  var FRAME_DECORATION_STYLE_FLAG = "eidFrameDeco=1";
  function isFrameDecorationCell(cell) {
    var style = cell != null && cell.style != null ? String(cell.style) : "";
    return style.indexOf(FRAME_DECORATION_STYLE_FLAG) >= 0;
  }
  function isPluginInternalCell(cell) {
    var constants = getConstants();
    var kind = trim(getAttr(cell, "esKind"));
    return isCabinetGap(cell) || kind == constants.CABINET_BLOCK_KIND || kind == constants.CABINET_SWITCH_LINK_KIND || kind == constants.CABINET_BUSBAR_KIND || kind == constants.CABINET_NAME_LABEL_KIND || kind == constants.CABINET_LOCATION_LABEL_KIND || kind == constants.CABINET_DESIGNATION_LABEL_KIND || kind == constants.BODY_KIND || kind == constants.LABEL_KIND || kind == constants.FRAME_LABEL_KIND || kind == constants.CABINET_BODY_KIND || kind == constants.CABINET_GAP_KIND;
  }
  function shouldExportGenericObject(cell) {
    var model = getGraphApi().model;
    return cell != null && model.isVertex(cell) && !isDrawingFrame(cell) && !isCabinetSegment(cell) && !isElectricalRoot(cell) && !isPluginInternalCell(cell);
  }
  function normalizeMode(mode) {
    mode = trim(mode).toLowerCase();
    return mode == "primary" || mode == "standby" ? mode : "";
  }
  function generateSymbolId(seed) {
    var base = toSlug(stripFileExtension(seed)) || "electrical-symbol";
    var shortUuid = generateUuid().split("-")[0];
    return base + "-" + shortUuid;
  }
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
  function showStatus(message, isError) {
    var state = getState();
    if (state.status != null) {
      state.status.style.color = isError ? "#b3261e" : "#2e7d32";
      state.status.innerText = message || "";
    }
  }
  function setCanvasStatus(message) {
    var ui = getGraphApi().ui;
    var text = trim(message);
    if (text.length == 0) {
      if (typeof ui.clearStatus === "function") {
        ui.clearStatus();
      }
      return;
    }
    if (typeof ui.updateStatus === "function") {
      ui.updateStatus(function() {
        ui.editor.setStatus(mxUtils.htmlEntities(text));
        if (typeof ui.setStatusText === "function") {
          ui.setStatusText(ui.editor.getStatus());
        }
      });
    } else if (ui.editor != null && typeof ui.editor.setStatus === "function") {
      ui.editor.setStatus(mxUtils.htmlEntities(text));
    }
  }
  function nextItemId(prefix) {
    var state = getState();
    var id = prefix + ":" + state.nextId;
    state.nextId += 1;
    return id;
  }

  // domain/frameCore.js
  function makeFrameStyle() {
    return "shape=rectangle;fillColor=none;strokeColor=#6b7280;strokeWidth=2;rounded=0;html=1;whiteSpace=wrap;connectable=0;container=1;dropTarget=1;collapsible=0;foldable=0;recursiveResize=0;rotatable=0;resizable=0;deletable=0;";
  }
  function makeFrameLabelStyle() {
    return "text;html=1;whiteSpace=wrap;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;fontStyle=1;fontSize=13;connectable=0;editable=0;movable=0;resizable=0;rotatable=0;deletable=0;pointerEvents=0;";
  }
  function normalizeFrameConfig(raw) {
    raw = isObject(raw) ? raw : {};
    return {
      width: Math.max(320, toInt(raw.width, ELECTRICAL_CONSTANTS.FRAME_DEFAULT_WIDTH)),
      height: Math.max(
        240,
        toInt(raw.height, ELECTRICAL_CONSTANTS.FRAME_DEFAULT_HEIGHT)
      )
    };
  }
  function applyFrameValueMetadata(node, frameId, pageNumber, frameConfig, extra) {
    var config = normalizeFrameConfig(frameConfig);
    var extras = isObject(extra) ? extra : {};
    var key;
    node.setAttribute("pluginType", ELECTRICAL_CONSTANTS.FRAME_TYPE);
    node.setAttribute("frameId", trim(frameId));
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

  // domain/cabinetCore.js
  function createCabinetOutlineSvg(descriptor) {
    var width = Math.max(20, Math.round(descriptor.width));
    var height = Math.max(20, Math.round(descriptor.height));
    var strokeWidth = 2;
    var inset = strokeWidth / 2;
    var depth = Math.max(
      8,
      Math.min(ELECTRICAL_CONSTANTS.CABINET_BREAK_DEPTH, Math.round(height / 4))
    );
    var left = inset;
    var right = width - inset;
    var top = inset;
    var bottom = height - inset;
    var ratio = ELECTRICAL_CONSTANTS.CABINET_BREAK_SEGMENT_RATIO;
    var segmentEnd = Math.round(width * ratio);
    var segmentStart = Math.round(width * (1 - ratio));
    var path;
    var topLeftY = descriptor.continuesFromPrev ? top + depth : top;
    var bottomRightY = descriptor.continuesToNext ? bottom - depth : bottom;
    if (descriptor.continuesFromPrev) {
      path = "M " + left + " " + topLeftY + " L " + segmentEnd + " " + topLeftY + " L " + segmentStart + " " + top + " L " + right + " " + top;
    } else {
      path = "M " + left + " " + top + " L " + right + " " + top;
    }
    path += " L " + right + " " + bottomRightY;
    if (descriptor.continuesToNext) {
      path += " L " + segmentStart + " " + bottomRightY + " L " + segmentEnd + " " + bottom + " L " + left + " " + bottom;
    } else {
      path += " L " + left + " " + bottom;
    }
    path += " Z";
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '" viewBox="0 0 ' + width + " " + height + '"><path d="' + path + '" fill="none" stroke="#111111" stroke-width="' + strokeWidth + '" stroke-linejoin="miter" stroke-linecap="square"/></svg>';
  }
  function makeCabinetRootStyle(descriptor) {
    return "shape=image;image=data:image/svg+xml," + encodeURIComponent(createCabinetOutlineSvg(descriptor)) + ";imageAspect=0;html=1;fillColor=none;strokeColor=none;connectable=0;container=1;collapsible=0;foldable=0;rotatable=0;recursiveResize=1;resizable=1;movable=1;";
  }
  function makeCabinetBlockStyle() {
    return "shape=rectangle;fillColor=none;strokeColor=#c8ccd2;strokeWidth=1;dashed=1;html=1;whiteSpace=wrap;verticalAlign=middle;align=left;spacingLeft=8;connectable=1;movable=0;resizable=1;rotatable=0;editable=0;deletable=0;resizeWidth=1;resizeHeight=0;";
  }
  function makeCabinetSwitchLinkStyle() {
    return "edgeStyle=none;html=1;strokeColor=#111111;strokeWidth=1;endArrow=none;startArrow=none;noEdgeStyle=1;rounded=0;movable=0;editable=0;deletable=0;bendable=0;";
  }
  function makeCabinetBusbarStyle() {
    return "shape=rectangle;fillColor=#00b7c3;strokeColor=none;html=1;connectable=0;movable=0;resizable=0;rotatable=0;editable=0;deletable=0;";
  }
  function makeCabinetNameLabelStyle() {
    return "text;html=1;horizontal=0;align=center;verticalAlign=middle;fontSize=11;fontColor=#111111;whiteSpace=nowrap;overflow=visible;connectable=0;movable=0;resizable=0;rotatable=0;editable=0;deletable=0;";
  }
  function makeCabinetLocationLabelStyle() {
    return "text;html=1;align=left;verticalAlign=bottom;fontSize=10;fontColor=#111111;whiteSpace=nowrap;overflow=visible;connectable=0;movable=0;resizable=0;rotatable=0;editable=0;deletable=0;";
  }
  function makeCabinetDesignationLabelStyle() {
    return "text;html=1;align=center;verticalAlign=middle;fontSize=11;fontColor=#111111;whiteSpace=nowrap;overflow=visible;connectable=0;movable=0;resizable=0;rotatable=0;editable=0;deletable=0;";
  }
  function generateCabinetBlockId() {
    return "cabinet-block:" + generateUuid().split("-")[0];
  }
  function normalizeCabinetBlock(raw, index) {
    raw = isObject(raw) ? raw : {};
    var id = trim(raw.id) || generateCabinetBlockId();
    return {
      id,
      title: trim(raw.title),
      height: clamp(
        toInt(raw.height, ELECTRICAL_CONSTANTS.CABINET_BLOCK_DEFAULT_HEIGHT),
        ELECTRICAL_CONSTANTS.CABINET_BLOCK_MIN_HEIGHT,
        ELECTRICAL_CONSTANTS.CABINET_BLOCK_MAX_HEIGHT
      ),
      portId: trim(raw.portId) || id + ":out",
      switchInstanceId: trim(raw.switchInstanceId),
      switchSymbolId: trim(raw.switchSymbolId),
      params: isObject(raw.params) ? cloneJson(raw.params) : {},
      order: index
    };
  }
  function migrateLegacyBlocks(raw, usableHeight) {
    var ports = Array.isArray(raw.ports) ? raw.ports : [];
    var gapRatios = Array.isArray(raw.gapRatios) ? raw.gapRatios : [];
    var tailPadding = Math.max(
      8,
      toInt(raw.tailPadding, ELECTRICAL_CONSTANTS.CABINET_TAIL_PADDING)
    );
    var offsets = [];
    var cursor = tailPadding;
    var blocks = [];
    var i;
    for (i = 0; i < ports.length; i++) {
      if (i > 0) {
        cursor += clamp(Number(gapRatios[i - 1]) || 0.12, 0, 1) * usableHeight;
      }
      offsets.push(cursor);
    }
    for (i = 0; i < offsets.length; i++) {
      var prevGap = i > 0 ? offsets[i] - offsets[i - 1] : 0;
      var nextGap = i + 1 < offsets.length ? offsets[i + 1] - offsets[i] : 0;
      var upper = i > 0 ? prevGap / 2 : nextGap > 0 ? nextGap / 2 : tailPadding;
      var lower = i + 1 < offsets.length ? nextGap / 2 : prevGap > 0 ? prevGap / 2 : tailPadding;
      blocks.push(
        normalizeCabinetBlock(
          {
            id: trim(ports[i] != null ? ports[i].id : "") || generateCabinetBlockId(),
            portId: trim(ports[i] != null ? ports[i].id : ""),
            height: Math.round(upper + lower)
          },
          i
        )
      );
    }
    return blocks;
  }
  function buildDefaultBlocks(count) {
    var blocks = [];
    var i;
    for (i = 0; i < count; i++) {
      blocks.push(normalizeCabinetBlock({}, i));
    }
    return blocks;
  }
  function normalizeCabinetModel(raw, frameConfig) {
    raw = isObject(raw) ? cloneJson(raw) : {};
    var config = normalizeFrameConfig(frameConfig);
    var usableHeight = config.height * ELECTRICAL_CONSTANTS.FRAME_CONTENT_RATIO;
    var blocks;
    var i;
    if (Array.isArray(raw.blocks) && raw.blocks.length > 0) {
      blocks = [];
      for (i = 0; i < raw.blocks.length; i++) {
        blocks.push(normalizeCabinetBlock(raw.blocks[i], i));
      }
    } else if (Array.isArray(raw.ports) && raw.ports.length > 0) {
      blocks = migrateLegacyBlocks(raw, usableHeight);
    } else {
      blocks = buildDefaultBlocks(
        Math.max(
          1,
          toInt(
            raw.blockCount != null ? raw.blockCount : raw.portCount,
            ELECTRICAL_CONSTANTS.CABINET_DEFAULT_BLOCK_COUNT
          )
        )
      );
    }
    if (blocks.length == 0) {
      blocks = buildDefaultBlocks(ELECTRICAL_CONSTANTS.CABINET_DEFAULT_BLOCK_COUNT);
    }
    return {
      logicalCabinetId: trim(raw.logicalCabinetId) || generateUuid(),
      originFrameId: trim(raw.originFrameId),
      // title / code / voltage 拼起来就是柜内那行纵向文字
      title: trim(raw.title) || "\u914D\u7535\u67DC",
      // 这几项都有默认值：插入时不必手填也能画成图纸的样子，参数导入时再覆盖
      code: trim(raw.code) || ELECTRICAL_CONSTANTS.CABINET_DEFAULT_CODE,
      voltage: trim(raw.voltage) || ELECTRICAL_CONSTANTS.CABINET_DEFAULT_VOLTAGE,
      // 柜体上方的位置标注，两行
      location: trim(raw.location) || ELECTRICAL_CONSTANTS.CABINET_DEFAULT_LOCATION,
      locationNote: trim(raw.locationNote),
      // 柜内靠上的编号；没给就跟着柜体编号走
      designation: trim(raw.designation) || trim(raw.code) || ELECTRICAL_CONSTANTS.CABINET_DEFAULT_CODE,
      cabinetWidth: Math.max(
        ELECTRICAL_CONSTANTS.CABINET_MIN_WIDTH,
        toInt(raw.cabinetWidth, ELECTRICAL_CONSTANTS.CABINET_DEFAULT_WIDTH)
      ),
      cabinetX: Math.max(20, toInt(raw.cabinetX, ELECTRICAL_CONSTANTS.CABINET_DEFAULT_X)),
      headPadding: Math.max(
        0,
        toInt(raw.headPadding, ELECTRICAL_CONSTANTS.CABINET_HEAD_PADDING)
      ),
      tailPadding: Math.max(
        0,
        toInt(raw.tailPadding, ELECTRICAL_CONSTANTS.CABINET_TAIL_PADDING)
      ),
      busbarRatio: clamp(
        toFloat(raw.busbarRatio, ELECTRICAL_CONSTANTS.CABINET_BUSBAR_RATIO),
        0.05,
        0.6
      ),
      busbarInsetY: Math.max(
        0,
        toInt(raw.busbarInsetY, ELECTRICAL_CONSTANTS.CABINET_BUSBAR_INSET_Y)
      ),
      switchLead: Math.max(
        8,
        toInt(raw.switchLead, ELECTRICAL_CONSTANTS.CABINET_SWITCH_LEAD)
      ),
      blocks
    };
  }
  function buildCabinetNameLabel(cabinetModel) {
    var parts = [];
    if (trim(cabinetModel.title).length > 0) {
      parts.push(trim(cabinetModel.title));
    }
    if (trim(cabinetModel.code).length > 0) {
      parts.push(trim(cabinetModel.code));
    }
    if (trim(cabinetModel.voltage).length > 0) {
      parts.push(trim(cabinetModel.voltage));
    }
    return parts.join(", ");
  }
  function insertBlockAfter(cabinetModel, blockId, blockInit) {
    var modelData = normalizeCabinetModel(cabinetModel);
    var target = trim(blockId);
    var index = -1;
    var i;
    for (i = 0; i < modelData.blocks.length; i++) {
      if (modelData.blocks[i].id == target) {
        index = i;
        break;
      }
    }
    if (index < 0) {
      return null;
    }
    var blocks = modelData.blocks.slice(0, index + 1).concat([normalizeCabinetBlock(blockInit || {}, index + 1)]).concat(modelData.blocks.slice(index + 1));
    for (i = 0; i < blocks.length; i++) {
      blocks[i].order = i;
    }
    var next = cloneJson(modelData);
    next.blocks = blocks;
    return next;
  }
  function setBlockSwitchBinding(cabinetModel, blockId, binding) {
    var modelData = normalizeCabinetModel(cabinetModel);
    var target = trim(blockId);
    var found = false;
    var blocks = [];
    var i;
    for (i = 0; i < modelData.blocks.length; i++) {
      var block = cloneJson(modelData.blocks[i]);
      if (block.id == target) {
        found = true;
        block.switchInstanceId = binding != null ? trim(binding.instanceId) : "";
        block.switchSymbolId = binding != null ? trim(binding.symbolId) : "";
      }
      blocks.push(block);
    }
    if (!found) {
      return null;
    }
    var next = cloneJson(modelData);
    next.blocks = blocks;
    return next;
  }
  function computeSwitchPlacementInBlock(blockRect, switchSize, options) {
    var busbarX = options != null ? toInt(options.busbarX, 0) : 0;
    var lead = options != null ? Math.max(0, toInt(options.switchLead, 0)) : 0;
    var available = Math.max(8, blockRect.width - busbarX - lead);
    var width = Math.max(8, Math.min(switchSize.width, available));
    var height = Math.max(8, switchSize.height);
    return {
      x: busbarX + lead,
      y: (blockRect.height - height) / 2,
      width,
      height
    };
  }
  function buildCabinetPageDescriptors(cabinetModel, frameConfig) {
    var config = normalizeFrameConfig(frameConfig);
    var modelData = normalizeCabinetModel(cabinetModel, config);
    var usableHeight = config.height * ELECTRICAL_CONSTANTS.CABINET_CONTENT_RATIO;
    var topMargin = config.height * ELECTRICAL_CONSTANTS.FRAME_MARGIN_RATIO;
    var padding = modelData.headPadding + modelData.tailPadding;
    var blockCapacity = Math.max(
      ELECTRICAL_CONSTANTS.CABINET_BLOCK_MIN_HEIGHT,
      usableHeight - padding
    );
    var pages = [];
    var current = [];
    var used = 0;
    var i;
    for (i = 0; i < modelData.blocks.length; i++) {
      var block = modelData.blocks[i];
      var height = Math.min(block.height, Math.floor(blockCapacity));
      if (current.length > 0 && used + height > blockCapacity) {
        pages.push({ blocks: current, height: used });
        current = [];
        used = 0;
      }
      current.push({ block, localY: used, height });
      used += height;
    }
    pages.push({ blocks: current, height: used });
    var offsetCursor = 0;
    var p;
    for (p = 0; p < pages.length; p++) {
      pages[p].startOffset = offsetCursor;
      offsetCursor += pages[p].height;
      pages[p].endOffset = offsetCursor;
    }
    var descriptors = [];
    var pageIndex;
    for (pageIndex = 0; pageIndex < pages.length; pageIndex++) {
      var page = pages[pageIndex];
      var continuesToNext = pageIndex < pages.length - 1;
      var continuesFromPrev = pageIndex > 0;
      var segmentHeight = continuesToNext ? Math.round(usableHeight) : Math.max(
        ELECTRICAL_CONSTANTS.CABINET_BLOCK_MIN_HEIGHT,
        modelData.headPadding + page.height + modelData.tailPadding
      );
      var topBreakDepth = continuesFromPrev ? Math.max(
        8,
        Math.min(
          ELECTRICAL_CONSTANTS.CABINET_BREAK_DEPTH,
          Math.round(segmentHeight / 4)
        )
      ) : 0;
      var busbarX = Math.round(modelData.cabinetWidth * modelData.busbarRatio);
      var blocks = [];
      var j;
      for (j = 0; j < page.blocks.length; j++) {
        var entry = page.blocks[j];
        var localY = topBreakDepth + modelData.headPadding + entry.localY;
        blocks.push({
          id: entry.block.id,
          title: entry.block.title,
          portId: entry.block.portId,
          switchInstanceId: entry.block.switchInstanceId,
          switchSymbolId: entry.block.switchSymbolId,
          params: cloneJson(entry.block.params),
          order: entry.block.order,
          localY,
          height: entry.height,
          width: modelData.cabinetWidth,
          // 出线接口在母线上，不在柜壁上
          portX: modelData.cabinetWidth > 0 ? busbarX / modelData.cabinetWidth : 0,
          portY: segmentHeight > 0 ? clamp((localY + entry.height / 2) / segmentHeight, 0, 1) : 0.5
        });
      }
      descriptors.push({
        segmentIndex: pageIndex,
        pageCount: pages.length,
        // 换页折断标识画在柜体外框上，不再由块承担
        continuesFromPrev,
        continuesToNext,
        topBreakDepth,
        x: modelData.cabinetX,
        y: topMargin,
        width: modelData.cabinetWidth,
        height: segmentHeight,
        segmentStartOffset: page.startOffset,
        segmentEndOffset: page.endOffset,
        blocks,
        // 母线：靠左纵向贯穿，上下各留 busbarInsetY
        busbar: {
          x: busbarX,
          y: topBreakDepth + Math.min(modelData.busbarInsetY, segmentHeight / 3),
          width: ELECTRICAL_CONSTANTS.CABINET_BUSBAR_WIDTH,
          height: Math.max(
            8,
            segmentHeight - topBreakDepth - 2 * Math.min(modelData.busbarInsetY, segmentHeight / 3)
          )
        },
        switchLead: modelData.switchLead,
        // 位置标注只画在第一段上，续接段不重复
        showLocation: pageIndex == 0,
        frameConfig: config,
        cabinetModel: modelData
      });
    }
    return descriptors;
  }
  function buildSegmentPortLayout(descriptor) {
    var result = [];
    var i;
    for (i = 0; i < descriptor.blocks.length; i++) {
      var block = descriptor.blocks[i];
      result.push({
        id: block.portId,
        x: block.portX,
        y: block.portY,
        marker: "cross",
        direction: "right",
        ioMode: "out",
        order: block.order,
        blockId: block.id
      });
    }
    return result;
  }

  // domain/frameGraph.js
  function buildFrameDeps() {
    var app = getApp();
    var ctx = app.ctx;
    var constants = ctx.constants;
    return {
      graph: ctx.graph,
      model: ctx.model,
      state: ctx.state,
      frameTag: constants.FRAME_TAG,
      frameType: constants.FRAME_TYPE,
      frameLabelTag: constants.FRAME_LABEL_TAG,
      frameLabelKind: constants.FRAME_LABEL_KIND,
      frameMarginRatio: constants.FRAME_MARGIN_RATIO,
      defaultWidth: constants.FRAME_DEFAULT_WIDTH,
      defaultHeight: constants.FRAME_DEFAULT_HEIGHT,
      trim,
      toInt,
      isObject,
      getAttr,
      createNode,
      createMetaCell,
      generateFrameId,
      isDrawingFrame,
      showStatus,
      setCanvasStatus
    };
  }
  function createFrameDomain() {
    var deps = arguments.length > 0 ? arguments[0] : buildFrameDeps();
    var graph = deps.graph;
    var model = deps.model;
    function findDrawingFrame2(cell) {
      var origin = cell;
      while (cell != null) {
        if (deps.isDrawingFrame(cell)) {
          return cell;
        }
        cell = model.getParent(cell);
      }
      return findFrameByGeometry2(origin);
    }
    function getAbsoluteOrigin2(cell) {
      var x = 0;
      var y = 0;
      var parent = model.getParent(cell);
      while (parent != null && model.isVertex(parent)) {
        var geometry = model.getGeometry(parent);
        if (geometry != null && !geometry.relative) {
          x += geometry.x;
          y += geometry.y;
        }
        parent = model.getParent(parent);
      }
      return { x, y };
    }
    function getAbsoluteCenter2(cell) {
      if (cell == null || !model.isVertex(cell)) {
        return null;
      }
      var geometry = model.getGeometry(cell);
      if (geometry == null || geometry.relative) {
        return null;
      }
      var origin = getAbsoluteOrigin2(cell);
      return {
        x: origin.x + geometry.x + geometry.width / 2,
        y: origin.y + geometry.y + geometry.height / 2
      };
    }
    function findFrameContainingPoint2(x, y) {
      var parent = graph.getDefaultParent();
      var count = model.getChildCount(parent);
      var i;
      for (i = 0; i < count; i++) {
        var child = model.getChildAt(parent, i);
        if (!deps.isDrawingFrame(child)) {
          continue;
        }
        var geometry = model.getGeometry(child);
        if (geometry == null) {
          continue;
        }
        if (x >= geometry.x && x <= geometry.x + geometry.width && y >= geometry.y && y <= geometry.y + geometry.height) {
          return child;
        }
      }
      return null;
    }
    function findFrameByGeometry2(cell) {
      var center = getAbsoluteCenter2(cell);
      if (center == null) {
        return null;
      }
      return findFrameContainingPoint2(center.x, center.y);
    }
    function getFrameConfig2(frame) {
      var raw = deps.getAttr(frame, "frameConfigJson");
      var geometry;
      if (raw != null && raw.length > 0) {
        try {
          return normalizeFrameConfig(JSON.parse(raw));
        } catch (e) {
        }
      }
      geometry = model.getGeometry(frame);
      return normalizeFrameConfig({
        width: geometry != null ? geometry.width : deps.defaultWidth,
        height: geometry != null ? geometry.height : deps.defaultHeight
      });
    }
    function getFramePageNumber2(frame) {
      return Math.max(1, deps.toInt(deps.getAttr(frame, "pageNumber"), 1));
    }
    function getAllDrawingFrames2() {
      var parent = graph.getDefaultParent();
      var frames = [];
      var i;
      for (i = 0; i < model.getChildCount(parent); i++) {
        var child = model.getChildAt(parent, i);
        if (deps.isDrawingFrame(child)) {
          frames.push(child);
        }
      }
      return frames;
    }
    function findFrameById2(frameId) {
      var target = deps.trim(frameId);
      var frames = getAllDrawingFrames2();
      var i;
      for (i = 0; i < frames.length; i++) {
        if (deps.trim(deps.getAttr(frames[i], "frameId")) == target) {
          return frames[i];
        }
      }
      return null;
    }
    function getFrameGroupId2(frame) {
      if (frame == null) {
        return "";
      }
      var groupId = deps.trim(deps.getAttr(frame, "groupId"));
      if (groupId.length > 0) {
        return groupId;
      }
      var originFrameId = deps.trim(deps.getAttr(frame, "originFrameId"));
      var frameId = deps.trim(deps.getAttr(frame, "frameId"));
      if (originFrameId.length > 0 && originFrameId != frameId) {
        var originFrame = findFrameById2(originFrameId);
        if (originFrame != null && originFrame != frame) {
          return getFrameGroupId2(originFrame);
        }
        return originFrameId;
      }
      return frameId;
    }
    function getFramesInGroup(groupId) {
      var target = deps.trim(groupId);
      var frames = getAllDrawingFrames2();
      var result = [];
      var i;
      for (i = 0; i < frames.length; i++) {
        if (getFrameGroupId2(frames[i]) == target) {
          result.push(frames[i]);
        }
      }
      return result;
    }
    function getRightmostFrameInGroup2(groupId) {
      var frames = getFramesInGroup(groupId);
      var rightmost = null;
      var i;
      for (i = 0; i < frames.length; i++) {
        var geometry = model.getGeometry(frames[i]);
        if (geometry == null) {
          continue;
        }
        if (rightmost == null || geometry.x + geometry.width > model.getGeometry(rightmost).x + model.getGeometry(rightmost).width) {
          rightmost = frames[i];
        }
      }
      return rightmost;
    }
    function getBottommostFrame2() {
      var frames = getAllDrawingFrames2();
      var bottommost = null;
      var i;
      for (i = 0; i < frames.length; i++) {
        var geometry = model.getGeometry(frames[i]);
        if (geometry == null) {
          continue;
        }
        if (bottommost == null || geometry.y + geometry.height > model.getGeometry(bottommost).y + model.getGeometry(bottommost).height) {
          bottommost = frames[i];
        }
      }
      return bottommost;
    }
    function getLeftmostFrame2() {
      var frames = getAllDrawingFrames2();
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
      var frames = getAllDrawingFrames2();
      var last = null;
      var i;
      for (i = 0; i < frames.length; i++) {
        if (last == null || getFramePageNumber2(frames[i]) > getFramePageNumber2(last)) {
          last = frames[i];
        }
      }
      return last;
    }
    function getMaxFramePageNumberInGroup2(groupId) {
      var frames = getFramesInGroup(groupId);
      var maxPage = 0;
      var i;
      for (i = 0; i < frames.length; i++) {
        maxPage = Math.max(maxPage, getFramePageNumber2(frames[i]));
      }
      return maxPage;
    }
    function getActiveFrame2(showError) {
      var frame = findDrawingFrame2(graph.getSelectionCell());
      if (frame == null) {
        frame = getLastDrawingFrame();
      }
      if (frame == null && showError) {
        deps.showStatus("\u8BF7\u5148\u63D2\u5165\u6216\u9009\u4E2D\u4E00\u4E2A\u56FE\u6846", true);
        deps.setCanvasStatus("\u8BF7\u5148\u63D2\u5165\u6216\u9009\u4E2D\u4E00\u4E2A\u56FE\u6846");
      }
      return frame;
    }
    function getFrameChildInsertPoint2(frame, width, height) {
      var frameConfig = getFrameConfig2(frame);
      var childCount = 0;
      var i;
      for (i = 0; i < model.getChildCount(frame); i++) {
        var child = model.getChildAt(frame, i);
        if (deps.getAttr(child, "esKind") != deps.frameLabelKind) {
          childCount += 1;
        }
      }
      return {
        x: 40 + childCount % 6 * 18,
        y: Math.round(frameConfig.height * deps.frameMarginRatio) + 20 + Math.floor(childCount / 6) * 18
      };
    }
    function createDrawingFrameCell2(frameConfig, pageNumber, extra) {
      var config = normalizeFrameConfig(frameConfig);
      var frameId = extra != null && deps.trim(extra.frameId).length > 0 ? deps.trim(extra.frameId) : deps.generateFrameId();
      var root = new mxCell(
        applyFrameValueMetadata(
          deps.createNode(deps.frameTag),
          frameId,
          pageNumber,
          config,
          extra
        ),
        new mxGeometry(0, 0, config.width, config.height),
        makeFrameStyle()
      );
      root.vertex = true;
      root.setConnectable(false);
      return root;
    }
    function addTopLevelCell2(cell) {
      model.add(graph.getDefaultParent(), cell);
      return cell;
    }
    return {
      addTopLevelCell: addTopLevelCell2,
      createDrawingFrameCell: createDrawingFrameCell2,
      findDrawingFrame: findDrawingFrame2,
      findFrameByGeometry: findFrameByGeometry2,
      findFrameContainingPoint: findFrameContainingPoint2,
      getAbsoluteCenter: getAbsoluteCenter2,
      getAbsoluteOrigin: getAbsoluteOrigin2,
      findFrameById: findFrameById2,
      getActiveFrame: getActiveFrame2,
      getAllDrawingFrames: getAllDrawingFrames2,
      getBottommostFrame: getBottommostFrame2,
      getFrameChildInsertPoint: getFrameChildInsertPoint2,
      getFrameConfig: getFrameConfig2,
      getFrameGroupId: getFrameGroupId2,
      getFramePageNumber: getFramePageNumber2,
      getLeftmostFrame: getLeftmostFrame2,
      getMaxFramePageNumberInGroup: getMaxFramePageNumberInGroup2,
      getRightmostFrameInGroup: getRightmostFrameInGroup2,
      normalizeFrameConfig
    };
  }

  // domain/frame.js
  function getFrameDomain() {
    return createFrameDomain();
  }
  function addTopLevelCell() {
    return getFrameDomain().addTopLevelCell.apply(null, arguments);
  }
  function createDrawingFrameCell() {
    return getFrameDomain().createDrawingFrameCell.apply(null, arguments);
  }
  function findDrawingFrame() {
    return getFrameDomain().findDrawingFrame.apply(null, arguments);
  }
  function findFrameByGeometry() {
    return getFrameDomain().findFrameByGeometry.apply(null, arguments);
  }
  function findFrameById() {
    return getFrameDomain().findFrameById.apply(null, arguments);
  }
  function findFrameContainingPoint() {
    return getFrameDomain().findFrameContainingPoint.apply(null, arguments);
  }
  function getAbsoluteCenter() {
    return getFrameDomain().getAbsoluteCenter.apply(null, arguments);
  }
  function getAbsoluteOrigin() {
    return getFrameDomain().getAbsoluteOrigin.apply(null, arguments);
  }
  function getActiveFrame() {
    return getFrameDomain().getActiveFrame.apply(null, arguments);
  }
  function getAllDrawingFrames() {
    return getFrameDomain().getAllDrawingFrames.apply(null, arguments);
  }
  function getBottommostFrame() {
    return getFrameDomain().getBottommostFrame.apply(null, arguments);
  }
  function getFrameChildInsertPoint() {
    return getFrameDomain().getFrameChildInsertPoint.apply(null, arguments);
  }
  function getFrameConfig() {
    return getFrameDomain().getFrameConfig.apply(null, arguments);
  }
  function getFrameGroupId() {
    return getFrameDomain().getFrameGroupId.apply(null, arguments);
  }
  function getFramePageNumber() {
    return getFrameDomain().getFramePageNumber.apply(null, arguments);
  }
  function getLeftmostFrame() {
    return getFrameDomain().getLeftmostFrame.apply(null, arguments);
  }
  function getMaxFramePageNumberInGroup() {
    return getFrameDomain().getMaxFramePageNumberInGroup.apply(null, arguments);
  }
  function getRightmostFrameInGroup() {
    return getFrameDomain().getRightmostFrameInGroup.apply(null, arguments);
  }
  var frameDomainApi = {
    addTopLevelCell,
    createDrawingFrameCell,
    findDrawingFrame,
    findFrameByGeometry,
    findFrameById,
    findFrameContainingPoint,
    getAbsoluteCenter,
    getAbsoluteOrigin,
    getActiveFrame,
    getAllDrawingFrames,
    getBottommostFrame,
    getFrameChildInsertPoint,
    getFrameConfig,
    getFrameGroupId,
    getFramePageNumber,
    getLeftmostFrame,
    getMaxFramePageNumberInGroup,
    getRightmostFrameInGroup,
    normalizeFrameConfig
  };

  // domain/snapshotCore.js
  function getCellStableId(cell) {
    return trim(
      cell != null ? cell.id != null ? cell.id : mxObjectIdentity.get(cell) : ""
    );
  }
  function normalizeGenericStableId(value) {
    var stableId = trim(value);
    while (stableId.indexOf("generic:") === 0) {
      stableId = stableId.substring("generic:".length);
    }
    return stableId;
  }
  function getGenericObjectId(cell) {
    return normalizeGenericStableId(getCellStableId(cell));
  }
  function normalizeSnapshotGenericIds(snapshot) {
    if (!isObject(snapshot)) {
      return snapshot;
    }
    var normalized = cloneJson(snapshot);
    var genericIdMap = {};
    var i;
    if (Array.isArray(normalized.objects)) {
      for (i = 0; i < normalized.objects.length; i++) {
        var object = normalized.objects[i];
        if (trim(object.kind) == "generic") {
          var currentId = trim(object.id);
          var nextId = normalizeGenericStableId(currentId);
          if (currentId.length > 0 && currentId != nextId) {
            genericIdMap[currentId] = nextId;
            object.id = nextId;
          }
        }
      }
      for (i = 0; i < normalized.objects.length; i++) {
        var parentId = trim(normalized.objects[i].parentId);
        if (genericIdMap[parentId] != null) {
          normalized.objects[i].parentId = genericIdMap[parentId];
        }
      }
    }
    if (Array.isArray(normalized.edges)) {
      for (i = 0; i < normalized.edges.length; i++) {
        var edge = normalized.edges[i];
        var sourceObjectId = trim(edge.source != null ? edge.source.objectId : "");
        var targetObjectId = trim(edge.target != null ? edge.target.objectId : "");
        if (genericIdMap[sourceObjectId] != null) {
          edge.source.objectId = genericIdMap[sourceObjectId];
        }
        if (genericIdMap[targetObjectId] != null) {
          edge.target.objectId = genericIdMap[targetObjectId];
        }
      }
    }
    if (Array.isArray(normalized.changes)) {
      for (i = 0; i < normalized.changes.length; i++) {
        var changeObjectId = trim(normalized.changes[i].objectId);
        if (genericIdMap[changeObjectId] != null) {
          normalized.changes[i].objectId = genericIdMap[changeObjectId];
        }
      }
    }
    return normalized;
  }
  function isPlainXmlNode(value) {
    return value != null && typeof value === "object" && typeof value.nodeType === "number" && typeof value.nodeName === "string";
  }
  function serializeXmlNode(node) {
    var attrs = {};
    var children = [];
    var i;
    if (!isPlainXmlNode(node)) {
      return null;
    }
    if (node.attributes != null) {
      for (i = 0; i < node.attributes.length; i++) {
        attrs[node.attributes[i].name] = node.attributes[i].value;
      }
    }
    if (node.childNodes != null) {
      for (i = 0; i < node.childNodes.length; i++) {
        var child = node.childNodes[i];
        if (child.nodeType == 1) {
          children.push({
            kind: "element",
            value: serializeXmlNode(child)
          });
        } else if (child.nodeType == 3 || child.nodeType == 4) {
          children.push({
            kind: "text",
            value: child.nodeValue || ""
          });
        }
      }
    }
    return {
      tagName: node.nodeName,
      attributes: attrs,
      children
    };
  }
  function deserializeXmlNode(data) {
    var node;
    var attrs;
    var children;
    var i;
    if (!isObject(data) || trim(data.tagName).length == 0) {
      return null;
    }
    node = createNode(data.tagName);
    attrs = isObject(data.attributes) ? data.attributes : {};
    for (var key in attrs) {
      if (attrs.hasOwnProperty(key)) {
        node.setAttribute(key, attrs[key]);
      }
    }
    children = Array.isArray(data.children) ? data.children : [];
    for (i = 0; i < children.length; i++) {
      var child = children[i];
      if (!isObject(child)) {
        continue;
      }
      if (child.kind == "element") {
        var elementChild = deserializeXmlNode(child.value);
        if (elementChild != null) {
          node.appendChild(elementChild);
        }
      } else if (child.kind == "text") {
        node.appendChild(node.ownerDocument.createTextNode(String(child.value)));
      }
    }
    return node;
  }
  function serializeCellValue(value) {
    if (value == null) {
      return { kind: "null", value: null };
    }
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      return { kind: "primitive", value };
    }
    if (isPlainXmlNode(value)) {
      return { kind: "xml", value: serializeXmlNode(value) };
    }
    return { kind: "json", value: cloneJson(value) };
  }
  function deserializeCellValue(data) {
    if (!isObject(data)) {
      return data;
    }
    if (data.kind == "null") {
      return null;
    }
    if (data.kind == "primitive") {
      return data.value;
    }
    if (data.kind == "xml") {
      return deserializeXmlNode(data.value);
    }
    if (data.kind == "json") {
      return cloneJson(data.value);
    }
    return null;
  }
  function toNumber(value, fallback) {
    var parsed = Number(value);
    return isFinite(parsed) ? parsed : fallback;
  }
  function serializeGeometry(geometry) {
    return {
      x: geometry != null ? toNumber(geometry.x, 0) : 0,
      y: geometry != null ? toNumber(geometry.y, 0) : 0,
      width: geometry != null ? toNumber(geometry.width, 0) : 0,
      height: geometry != null ? toNumber(geometry.height, 0) : 0,
      relative: geometry != null ? !!geometry.relative : false,
      offset: geometry != null && geometry.offset != null ? {
        x: toNumber(geometry.offset.x, 0),
        y: toNumber(geometry.offset.y, 0)
      } : null,
      sourcePoint: geometry != null && geometry.sourcePoint != null ? {
        x: toNumber(geometry.sourcePoint.x, 0),
        y: toNumber(geometry.sourcePoint.y, 0)
      } : null,
      targetPoint: geometry != null && geometry.targetPoint != null ? {
        x: toNumber(geometry.targetPoint.x, 0),
        y: toNumber(geometry.targetPoint.y, 0)
      } : null,
      points: geometry != null && Array.isArray(geometry.points) ? geometry.points.map(function(point) {
        return {
          x: toNumber(point.x, 0),
          y: toNumber(point.y, 0)
        };
      }) : [],
      alternateBounds: geometry != null && geometry.alternateBounds != null ? {
        x: toNumber(geometry.alternateBounds.x, 0),
        y: toNumber(geometry.alternateBounds.y, 0),
        width: toNumber(geometry.alternateBounds.width, 0),
        height: toNumber(geometry.alternateBounds.height, 0)
      } : null
    };
  }
  function deserializeGeometry(data) {
    var geometry = new mxGeometry(
      isObject(data) ? toNumber(data.x, 0) : 0,
      isObject(data) ? toNumber(data.y, 0) : 0,
      isObject(data) ? toNumber(data.width, 0) : 0,
      isObject(data) ? toNumber(data.height, 0) : 0
    );
    geometry.relative = isObject(data) ? !!data.relative : false;
    if (isObject(data) && isObject(data.offset)) {
      geometry.offset = new mxPoint(toNumber(data.offset.x, 0), toNumber(data.offset.y, 0));
    }
    if (isObject(data) && isObject(data.sourcePoint)) {
      geometry.sourcePoint = new mxPoint(
        toNumber(data.sourcePoint.x, 0),
        toNumber(data.sourcePoint.y, 0)
      );
    }
    if (isObject(data) && isObject(data.targetPoint)) {
      geometry.targetPoint = new mxPoint(
        toNumber(data.targetPoint.x, 0),
        toNumber(data.targetPoint.y, 0)
      );
    }
    if (isObject(data) && Array.isArray(data.points) && data.points.length > 0) {
      geometry.points = data.points.map(function(point) {
        return new mxPoint(toNumber(point.x, 0), toNumber(point.y, 0));
      });
    }
    if (isObject(data) && isObject(data.alternateBounds)) {
      geometry.alternateBounds = new mxRectangle(
        toNumber(data.alternateBounds.x, 0),
        toNumber(data.alternateBounds.y, 0),
        toNumber(data.alternateBounds.width, 0),
        toNumber(data.alternateBounds.height, 0)
      );
    }
    return geometry;
  }
  function indexSnapshotEntries(snapshot) {
    var map = {};
    var i;
    if (!isObject(snapshot)) {
      return map;
    }
    if (Array.isArray(snapshot.objects)) {
      for (i = 0; i < snapshot.objects.length; i++) {
        map["object:" + snapshot.objects[i].id] = snapshot.objects[i];
      }
    }
    if (Array.isArray(snapshot.edges)) {
      for (i = 0; i < snapshot.edges.length; i++) {
        map["edge:" + snapshot.edges[i].id] = snapshot.edges[i];
      }
    }
    return map;
  }
  function computeSnapshotChanges(previousSnapshot, nextSnapshot) {
    var previousMap = indexSnapshotEntries(previousSnapshot);
    var nextMap = indexSnapshotEntries(nextSnapshot);
    var keys = {};
    var changes = [];
    var touchedObjectIds = [];
    var key;
    for (key in previousMap) {
      keys[key] = true;
    }
    for (key in nextMap) {
      keys[key] = true;
    }
    for (key in keys) {
      if (!keys.hasOwnProperty(key)) {
        continue;
      }
      var previousValue = previousMap[key];
      var nextValue = nextMap[key];
      var parts = key.split(":");
      var objectType = parts[0] == "edge" ? "edge" : "object";
      var objectId = key.substring(key.indexOf(":") + 1);
      var op = null;
      if (previousValue == null && nextValue != null) {
        op = "create";
      } else if (previousValue != null && nextValue == null) {
        op = "delete";
      } else if (JSON.stringify(previousValue) != JSON.stringify(nextValue)) {
        op = "update";
      }
      if (op != null) {
        changes.push({
          objectType,
          objectId,
          op,
          before: previousValue != null ? cloneJson(previousValue) : null,
          after: nextValue != null ? cloneJson(nextValue) : null
        });
        touchedObjectIds.push(objectId);
      }
    }
    return {
      touchedObjectIds,
      changes
    };
  }

  // domain/specSchema.js
  function isSchemaLeafDescriptor(value) {
    return isObject(value) && typeof value.type === "string" && trim(value.type).length > 0;
  }
  function normalizeSchemaType(type) {
    type = trim(type).toLowerCase();
    return type == "number" || type == "boolean" || type == "enum" ? type : "string";
  }
  function normalizeEnumOptions(options) {
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
  function normalizeSchemaField(raw, nextItemId2) {
    var field = isObject(raw) ? cloneJson(raw) : {};
    field.id = trim(field.id) || (typeof nextItemId2 === "function" ? nextItemId2("field") : "");
    field.path = trim(field.path);
    field.type = normalizeSchemaType(field.type);
    field.required = !!field.required;
    field.enumValues = normalizeEnumOptions(field.enumValues);
    return field;
  }
  function getDefaultSchemaFields(nextItemId2) {
    return [
      normalizeSchemaField({ path: "title", type: "string" }, nextItemId2),
      normalizeSchemaField({ path: "name", type: "string" }, nextItemId2),
      normalizeSchemaField({ path: "code", type: "string" }, nextItemId2),
      normalizeSchemaField({ path: "power", type: "string" }, nextItemId2)
    ];
  }
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
  function isValidFieldPath(path) {
    var parts = trim(path).split(".");
    var i;
    if (trim(path).length == 0) {
      return false;
    }
    for (i = 0; i < parts.length; i++) {
      if (!/^[\p{L}_$][\p{L}\p{N}_$]*$/u.test(parts[i])) {
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
  function buildSchemaFromFields(fields, nextItemId2) {
    var schema = {};
    var seen = {};
    var i;
    for (i = 0; i < fields.length; i++) {
      var field = normalizeSchemaField(fields[i], nextItemId2);
      var path = trim(field.path);
      if (path.length == 0) {
        continue;
      }
      if (!isValidFieldPath(path)) {
        throw new Error("\u5B57\u6BB5\u8DEF\u5F84\u683C\u5F0F\u4E0D\u6B63\u786E");
      }
      if (seen[path]) {
        throw new Error("\u5B57\u6BB5\u8DEF\u5F84\u4E0D\u80FD\u91CD\u590D");
      }
      if (field.type == "enum" && field.enumValues.length == 0) {
        throw new Error("\u679A\u4E3E\u7C7B\u578B\u5FC5\u987B\u81F3\u5C11\u63D0\u4F9B\u4E00\u4E2A\u53EF\u9009\u503C");
      }
      seen[path] = true;
      setValueByPath(schema, path, {
        type: field.type,
        required: !!field.required,
        enumValues: field.enumValues
      });
    }
    return schema;
  }
  function flattenSchemaFields(schema, prefix, result, nextItemId2) {
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
                enumValues: value.enumValues
              },
              nextItemId2
            )
          );
        } else if (isObject(value)) {
          flattenSchemaFields(value, path, result, nextItemId2);
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

  // domain/specPorts.js
  function normalizePortMarker(marker) {
    marker = trim(marker).toLowerCase();
    return marker == "circle" || marker == "hidden" ? marker : "cross";
  }
  function normalizePortDirection(direction) {
    direction = trim(direction).toLowerCase();
    return direction == "left" || direction == "right" || direction == "up" || direction == "down" ? direction : "any";
  }
  function normalizePortIoMode(mode) {
    mode = trim(mode).toLowerCase();
    return mode == "in" || mode == "out" ? mode : "both";
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
      id,
      x: clamp(x, 0, 1),
      y: clamp(y, 0, 1),
      name,
      marker,
      direction,
      ioMode
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
            (i + 1) / (rawPorts.length + 1)
          )
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
            (i + 1) / (rawPorts.items.length + 1)
          )
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
            defaultPortPosition(i, left.length)
          )
        );
      }
      for (i = 0; i < right.length; i++) {
        points.push(
          normalizePortPoint(
            { id: "right:" + i, x: 1, y: right[i] },
            "right:" + i,
            1,
            defaultPortPosition(i, right.length)
          )
        );
      }
      return points;
    }
    var leftCount = Math.max(0, toInt(rawPorts.leftCount, 0));
    var rightCount = Math.max(0, toInt(rawPorts.rightCount, 0));
    for (i = 0; i < leftCount; i++) {
      points.push({
        id: "left:" + i,
        x: 0,
        y: defaultPortPosition(i, leftCount)
      });
    }
    for (i = 0; i < rightCount; i++) {
      points.push({
        id: "right:" + i,
        x: 1,
        y: defaultPortPosition(i, rightCount)
      });
    }
    return points;
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
  function serializePortLayout(layout) {
    return JSON.stringify(normalizePortLayout(layout));
  }

  // domain/specLabels.js
  function normalizeLabelAlign(align) {
    align = trim(align).toLowerCase();
    return align == "left" || align == "right" ? align : "center";
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
      id,
      text,
      binding,
      x: clamp(x, -1.5, 2.5),
      y: clamp(y, -1.5, 2.5),
      width,
      height,
      align
    };
  }
  function normalizeLabels(rawLabels) {
    var labels = [];
    var i;
    if (!Array.isArray(rawLabels)) {
      return labels;
    }
    for (i = 0; i < rawLabels.length; i++) {
      labels.push(normalizeLabelItem(rawLabels[i], "label:" + i, "\u6587\u672C" + (i + 1)));
    }
    return labels;
  }
  function buildResolvedLabels(labels, instance, getValueByPath2) {
    var result = [];
    var i;
    for (i = 0; i < labels.length; i++) {
      var item = cloneJson(labels[i]);
      var value = typeof getValueByPath2 === "function" ? getValueByPath2(instance, item.binding) : null;
      item.text = trim(item.binding).length > 0 ? value != null ? String(value) : "" : item.text || "";
      result.push(item);
    }
    return result;
  }

  // domain/spec.js
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
      generateInstanceId
    };
  }
  function getVariantLayout(spec, variantKey) {
    var deps = getSpecDeps();
    var layouts = normalizeVariantLayouts(spec.variantLayouts);
    var key = deps.trim(variantKey);
    if (key.length > 0 && layouts[key] != null) {
      return {
        ports: normalizePortLayout(layouts[key].ports),
        labels: normalizeLabels(layouts[key].labels)
      };
    }
    return {
      ports: normalizePortLayout(spec.ports),
      labels: normalizeLabels(spec.labels)
    };
  }
  function getActiveVariantKey(spec) {
    var deps = getSpecDeps();
    var field = deps.trim(spec.variantField || "");
    var value = deps.trim(getValueByPath(spec.data, field));
    if (value.length == 0 && field == "mode") {
      value = deps.trim(spec.device.mode);
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
          labels: normalizeLabels(entry.labels)
        };
      }
    }
    return result;
  }
  function normalizeSpec(raw) {
    var deps = getSpecDeps();
    if (!deps.isObject(raw)) {
      throw new Error("JSON \u6839\u8282\u70B9\u5FC5\u987B\u662F\u5BF9\u8C61");
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
      templateName: deps.trim(raw.templateName) || deps.trim(raw.title) || deps.trim(device.name) || "\u7535\u6C14\u56FE\u5143",
      title: deps.trim(raw.title) || deps.trim(device.name) || "\u7535\u6C14\u56FE\u5143",
      svg: deps.validateSvg(raw.svg),
      size: {
        width: Math.max(20, deps.toInt(size.width, 120)),
        height: Math.max(20, deps.toInt(size.height, 80))
      },
      device: {
        name: deps.trim(device.name),
        code: deps.trim(device.code),
        power: deps.trim(device.power),
        mode: deps.normalizeMode(device.mode),
        params
      },
      ports: normalizePortLayout(ports),
      labels: normalizeLabels(raw.labels),
      schema,
      data,
      variantField,
      svgVariants: {},
      variantLayouts: normalizeVariantLayouts(raw.variantLayouts)
    };
    for (var variantKey in variants) {
      if (variants.hasOwnProperty(variantKey) && deps.trim(variantKey).length > 0 && variants[variantKey] != null && deps.trim(variants[variantKey]).length > 0) {
        spec.svgVariants[deps.trim(variantKey)] = deps.validateSvg(variants[variantKey]);
      }
    }
    return spec;
  }
  function createEmptyTemplateSpec() {
    var deps = getSpecDeps();
    return normalizeSpec({
      symbolId: deps.generateSymbolId("symbol"),
      templateName: "\u7535\u6C14\u56FE\u5143",
      title: "\u7535\u6C14\u56FE\u5143",
      svg: '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" viewBox="0 0 120 80"></svg>',
      size: {
        width: 120,
        height: 80
      },
      device: {},
      ports: [],
      labels: [],
      schema: {},
      data: {},
      variantField: "",
      svgVariants: {},
      variantLayouts: {}
    });
  }
  function buildInstanceSpec(instanceData, template, sizeOverride) {
    var deps = getSpecDeps();
    template = template != null ? normalizeSpec(deps.cloneJson(template)) : createEmptyTemplateSpec();
    var mergedData = deps.deepMerge(
      buildEmptyValueFromSchema(template.schema),
      instanceData
    );
    var spec = deps.cloneJson(template);
    var nameValue = getValueByPath(mergedData, "name") || getValueByPath(mergedData, "device.name");
    var codeValue = getValueByPath(mergedData, "code") || getValueByPath(mergedData, "device.code");
    var powerValue = getValueByPath(mergedData, "power") || getValueByPath(mergedData, "device.power");
    var modeValue = getValueByPath(mergedData, "mode") || getValueByPath(mergedData, "device.mode");
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
          template.size.width
        )
      ),
      height: Math.max(
        20,
        deps.toInt(
          sizeOverride != null ? sizeOverride.height : null,
          template.size.height
        )
      )
    };
    spec.device.name = deps.trim(nameValue);
    spec.device.code = deps.trim(codeValue);
    spec.device.power = deps.trim(powerValue);
    spec.device.mode = deps.normalizeMode(modeValue);
    variantKey = getActiveVariantKey(spec);
    layout = getVariantLayout(template, variantKey);
    spec.ports = layout.ports;
    spec.labels = buildResolvedLabels(layout.labels, mergedData, getValueByPath);
    return normalizeSpec(spec);
  }
  function buildResolvedLabels2(labels, instance) {
    return buildResolvedLabels(labels, instance, getValueByPath);
  }
  function buildSchemaFromFields2(fields) {
    var deps = getSpecDeps();
    return buildSchemaFromFields(fields, deps.nextItemId);
  }
  function flattenSchemaFields2(schema, prefix, result) {
    var deps = getSpecDeps();
    return flattenSchemaFields(schema, prefix, result, deps.nextItemId);
  }
  function getDefaultSchemaFields2() {
    var deps = getSpecDeps();
    return getDefaultSchemaFields(deps.nextItemId);
  }
  function normalizeSchemaField2(raw) {
    var deps = getSpecDeps();
    return normalizeSchemaField(raw, deps.nextItemId);
  }
  var specDomainApi = {
    buildEmptyValueFromSchema,
    buildInstanceSpec,
    buildPortLayout,
    buildResolvedLabels: buildResolvedLabels2,
    buildSchemaFromFields: buildSchemaFromFields2,
    createEmptyTemplateSpec,
    flattenSchemaFields: flattenSchemaFields2,
    getActiveSvg,
    getActiveVariantKey,
    getDefaultSchemaFields: getDefaultSchemaFields2,
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
    normalizeSchemaField: normalizeSchemaField2,
    normalizeSchemaType,
    normalizeSpec,
    normalizeVariantLayouts,
    parsePortLayout,
    serializePortLayout,
    setValueByPath,
    toStyleImageUri,
    toSvgDataUri
  };

  // runtime/portSwapMode.js
  function getPortSwapDeps() {
    var app = getApp();
    var ctx = app.ctx;
    return {
      ctx,
      trim,
      cloneJson,
      parsePortLayout: specDomainApi.parsePortLayout,
      getAttr,
      findCabinetSegments: cabinetDomainApi.findCabinetSegments,
      findPortHostRoot,
      isCabinetSegment,
      isMovableConnectedTerminal: connectionConstraintsApi.isMovableConnectedTerminal,
      closeCabinetBlockDialog: function() {
        return cabinetBlockDialogApi.closeCabinetBlockDialog();
      },
      showStatus,
      setCanvasStatus,
      getPortAbsolutePosition: cabinetDomainApi.getPortAbsolutePosition,
      getPortMetaByConstraint: connectionConstraintsApi.getPortMetaByConstraint,
      mapPortDirectionToConstraint: connectionConstraintsApi.mapPortDirectionToConstraint,
      clearEdgePoints: connectionConstraintsApi.clearEdgePoints,
      moveConnectedGroupToCabinetPort: connectionConstraintsApi.moveConnectedGroupToCabinetPort,
      setConnectionConstraint: function(edge, root, source, constraint) {
        connectionConstraintsApi.applyNativeConnectionConstraint(
          edge,
          root,
          source,
          constraint
        );
      }
    };
  }
  function getPortSwapRuntime() {
    var deps = getPortSwapDeps();
    var ctx = deps.ctx;
    return {
      deps,
      graph: ctx.graph,
      model: ctx.model,
      state: ctx.state
    };
  }
  function buildPortSwapContextFromEdge(edge) {
    var runtime = getPortSwapRuntime();
    var deps = runtime.deps;
    var graph = runtime.graph;
    var model = runtime.model;
    var sourceTerminal = model.getTerminal(edge, true);
    var targetTerminal = model.getTerminal(edge, false);
    var sourceRoot = deps.findPortHostRoot(sourceTerminal);
    var targetRoot = deps.findPortHostRoot(targetTerminal);
    var sourceCabinet = deps.isCabinetSegment(sourceRoot);
    var targetCabinet = deps.isCabinetSegment(targetRoot);
    if (sourceCabinet == targetCabinet) {
      return null;
    }
    return {
      edge,
      source: sourceCabinet,
      cabinetRoot: sourceCabinet ? sourceRoot : targetRoot,
      portId: deps.trim(
        mxUtils.getValue(
          graph.getCellStyle(edge) || {},
          sourceCabinet ? "sourcePortId" : "targetPortId",
          ""
        )
      ),
      otherTerminal: sourceCabinet ? targetTerminal : sourceTerminal
    };
  }
  function getPortSwapContextFromSelection() {
    var runtime = getPortSwapRuntime();
    var deps = runtime.deps;
    var graph = runtime.graph;
    var model = runtime.model;
    var cell = graph.getSelectionCell();
    var i;
    if (model.isEdge(cell)) {
      return buildPortSwapContextFromEdge(cell);
    }
    if (deps.isMovableConnectedTerminal(cell)) {
      var match = null;
      for (i = 0; i < model.getEdgeCount(cell); i++) {
        var edge = model.getEdgeAt(cell, i);
        var context = buildPortSwapContextFromEdge(edge);
        if (context != null && context.otherTerminal == cell && context.portId.length > 0) {
          if (match != null) {
            return {
              error: "\u8BE5\u56FE\u5143\u8FDE\u63A5\u4E86\u591A\u4E2A\u914D\u7535\u67DC\u7AEF\u5B50\uFF0C\u8BF7\u76F4\u63A5\u9009\u4E2D\u7B2C\u4E00\u6761\u8FB9\u518D\u6267\u884C\u66F4\u6362\u6302\u70B9"
            };
          }
          match = context;
        }
      }
      return match;
    }
    return null;
  }
  function clearPortSwapOverlay() {
    var runtime = getPortSwapRuntime();
    var state = runtime.state;
    if (state.portSwapOverlay != null && state.portSwapOverlay.parentNode != null) {
      state.portSwapOverlay.parentNode.removeChild(state.portSwapOverlay);
    }
    state.portSwapOverlay = null;
  }
  function exitPortSwapMode(clearStatus) {
    var runtime = getPortSwapRuntime();
    var deps = runtime.deps;
    var state = runtime.state;
    clearPortSwapOverlay();
    state.portSwapSession = null;
    if (clearStatus !== false) {
      deps.setCanvasStatus("");
    }
  }
  function renderPortSwapOverlay(session) {
    var runtime = getPortSwapRuntime();
    var deps = runtime.deps;
    var graph = runtime.graph;
    var state = runtime.state;
    var container = document.createElement("div");
    var segments = deps.findCabinetSegments(
      deps.trim(deps.getAttr(session.cabinetRoot, "logicalCabinetId"))
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
      var ports = deps.parsePortLayout(deps.getAttr(segments[i], "portsJson"));
      if (stateView == null) {
        continue;
      }
      for (j = 0; j < ports.length; j++) {
        var marker = document.createElement("div");
        var portId = deps.trim(ports[j].id);
        var selected = deps.trim(ports[j].id) == deps.trim(session.portId);
        var occupied = !selected && isCabinetPortOccupied(segments[i], portId, session.edge);
        marker.style.position = "absolute";
        marker.style.width = "14px";
        marker.style.height = "14px";
        marker.style.borderRadius = "50%";
        marker.style.boxSizing = "border-box";
        marker.style.border = selected ? "2px solid #1a73e8" : occupied ? "2px solid #94a3b8" : "2px solid #16a34a";
        marker.style.background = selected ? "rgba(26,115,232,0.15)" : occupied ? "rgba(148,163,184,0.18)" : "rgba(22,163,74,0.18)";
        marker.style.pointerEvents = "auto";
        marker.style.cursor = selected || occupied ? "default" : "pointer";
        marker.style.left = Math.round(stateView.x + ports[j].x * stateView.width - 7) + "px";
        marker.style.top = Math.round(stateView.y + ports[j].y * stateView.height - 7) + "px";
        marker.title = selected ? "\u5F53\u524D\u6302\u70B9" : occupied ? "\u8BE5\u6302\u70B9\u5DF2\u8FDE\u63A5\u5176\u4ED6\u8BBE\u5907\uFF0C\u4E0D\u80FD\u518D\u9009\u62E9" : "\u70B9\u51FB\u5207\u6362\u5230\u8BE5\u6302\u70B9";
        if (!selected && !occupied) {
          mxEvent.addListener(
            marker,
            "click",
            /* @__PURE__ */ (function(root, port) {
              return function(evt) {
                mxEvent.consume(evt);
                commitPortSwap(state.portSwapSession, root, port);
              };
            })(segments[i], deps.cloneJson(ports[j]))
          );
        }
        container.appendChild(marker);
      }
    }
    graph.container.appendChild(container);
    state.portSwapOverlay = container;
  }
  function isCabinetPortOccupied(root, portId, ignoreEdge) {
    var runtime = getPortSwapRuntime();
    var deps = runtime.deps;
    var graph = runtime.graph;
    var model = runtime.model;
    var targetPortId = deps.trim(portId);
    var i;
    if (root == null || targetPortId.length == 0) {
      return false;
    }
    for (i = 0; i < model.getEdgeCount(root); i++) {
      var edge = model.getEdgeAt(root, i);
      var sourceRoot = deps.findPortHostRoot(model.getTerminal(edge, true));
      var targetRoot = deps.findPortHostRoot(model.getTerminal(edge, false));
      var sourcePortId = sourceRoot == root ? deps.trim(
        mxUtils.getValue(graph.getCellStyle(edge) || {}, "sourcePortId", "")
      ) : "";
      var targetPortIdOnEdge = targetRoot == root ? deps.trim(
        mxUtils.getValue(graph.getCellStyle(edge) || {}, "targetPortId", "")
      ) : "";
      if (edge == ignoreEdge) {
        continue;
      }
      if (sourcePortId == targetPortId || targetPortIdOnEdge == targetPortId) {
        return true;
      }
    }
    return false;
  }
  function installGraphClickBehavior() {
    var runtime = getPortSwapRuntime();
    var deps = runtime.deps;
    var graph = runtime.graph;
    var state = runtime.state;
    graph.addListener(mxEvent.CLICK, function(sender, evt) {
      var cell = evt.getProperty("cell");
      var mouseEvent = evt.getProperty("event");
      if (state.portSwapSession != null) {
        var portRoot = deps.findPortHostRoot(cell);
        var sessionLogicalId = state.portSwapSession.cabinetRoot != null ? deps.trim(
          deps.getAttr(state.portSwapSession.cabinetRoot, "logicalCabinetId")
        ) : "";
        if (deps.isCabinetSegment(portRoot) && deps.trim(deps.getAttr(portRoot, "logicalCabinetId")) == sessionLogicalId) {
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
    });
  }
  function getNearestCabinetPortFromClick(root, mouseEvent) {
    var runtime = getPortSwapRuntime();
    var deps = runtime.deps;
    var graph = runtime.graph;
    var state = runtime.state;
    var ports = deps.parsePortLayout(deps.getAttr(root, "portsJson"));
    var graphX = mouseEvent != null && typeof mouseEvent.getGraphX === "function" ? mouseEvent.getGraphX() : null;
    var graphY = mouseEvent != null && typeof mouseEvent.getGraphY === "function" ? mouseEvent.getGraphY() : null;
    var threshold = 18 / graph.view.scale;
    var best = null;
    var bestDistance = Infinity;
    var i;
    if (graphX == null || graphY == null) {
      return null;
    }
    for (i = 0; i < ports.length; i++) {
      if (deps.trim(ports[i].id) != deps.trim(state.portSwapSession.portId) && isCabinetPortOccupied(root, ports[i].id, state.portSwapSession.edge)) {
        continue;
      }
      var position = deps.getPortAbsolutePosition(root, ports[i]);
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
    var runtime = getPortSwapRuntime();
    var deps = runtime.deps;
    var model = runtime.model;
    var port = deps.getPortMetaByConstraint(root, constraint);
    var direction = port != null ? deps.mapPortDirectionToConstraint(port.direction) : "";
    var key = source ? "sourcePortConstraint" : "targetPortConstraint";
    var portKey = source ? "sourcePortId" : "targetPortId";
    var style = model.getStyle(edge) || "";
    style = mxUtils.setStyle(
      style,
      key,
      direction.length > 0 ? direction : null
    );
    style = mxUtils.setStyle(
      style,
      portKey,
      port != null && deps.trim(port.id).length > 0 ? deps.trim(port.id) : null
    );
    model.setStyle(edge, style);
  }
  function commitPortSwap(session, newRoot, newPort) {
    var runtime = getPortSwapRuntime();
    var deps = runtime.deps;
    var model = runtime.model;
    var state = runtime.state;
    var edge = session.edge;
    var source = !!session.source;
    var oldRoot = session.cabinetRoot;
    var oldPortId = deps.trim(session.portId);
    var constraint = new mxConnectionConstraint(
      new mxPoint(newPort.x, newPort.y),
      false,
      newPort.id
    );
    if (edge == null || newRoot == null || newPort == null || oldPortId.length == 0 || oldRoot == newRoot && oldPortId == deps.trim(newPort.id)) {
      exitPortSwapMode();
      return;
    }
    if (isCabinetPortOccupied(newRoot, newPort.id, edge)) {
      deps.showStatus("\u76EE\u6807\u6302\u70B9\u5DF2\u8FDE\u63A5\u5176\u4ED6\u8BBE\u5907\uFF0C\u4E0D\u80FD\u91CD\u590D\u9009\u62E9", true);
      deps.setCanvasStatus("\u76EE\u6807\u6302\u70B9\u5DF2\u8FDE\u63A5\u5176\u4ED6\u8BBE\u5907\uFF0C\u4E0D\u80FD\u91CD\u590D\u9009\u62E9");
      return;
    }
    state.updatingModel = true;
    model.beginUpdate();
    try {
      model.setTerminal(edge, newRoot, source);
      deps.setConnectionConstraint(edge, newRoot, source, constraint);
      applyEdgePortConstraintMetadata(edge, newRoot, source, constraint);
      deps.clearEdgePoints(edge);
    } finally {
      model.endUpdate();
      state.updatingModel = false;
    }
    deps.moveConnectedGroupToCabinetPort(
      edge,
      source,
      oldRoot,
      oldPortId,
      newRoot,
      newPort
    );
    exitPortSwapMode();
    deps.showStatus("\u5DF2\u66F4\u6362\u6302\u70B9", false);
    deps.setCanvasStatus("\u5DF2\u66F4\u6362\u6302\u70B9");
  }
  function enterPortSwapMode() {
    var runtime = getPortSwapRuntime();
    var deps = runtime.deps;
    var state = runtime.state;
    if (state.portSwapSession != null) {
      exitPortSwapMode();
      return;
    }
    deps.closeCabinetBlockDialog();
    var context = getPortSwapContextFromSelection();
    if (context == null) {
      deps.showStatus("\u8BF7\u5148\u9009\u4E2D\u4E0E\u914D\u7535\u67DC\u76F4\u63A5\u76F8\u8FDE\u7684\u7B2C\u4E00\u6761\u8FB9\u6216\u7B2C\u4E00\u4E2A\u56FE\u5143", true);
      deps.setCanvasStatus("\u8BF7\u5148\u9009\u4E2D\u4E0E\u914D\u7535\u67DC\u76F4\u63A5\u76F8\u8FDE\u7684\u7B2C\u4E00\u6761\u8FB9\u6216\u7B2C\u4E00\u4E2A\u56FE\u5143");
      return;
    }
    if (context.error != null) {
      deps.showStatus(context.error, true);
      deps.setCanvasStatus(context.error);
      return;
    }
    if (context.portId.length == 0 || context.cabinetRoot == null) {
      deps.showStatus("\u5F53\u524D\u9009\u4E2D\u5BF9\u8C61\u672A\u7ED1\u5B9A\u5230\u6709\u6548\u7684\u914D\u7535\u67DC\u7AEF\u5B50", true);
      deps.setCanvasStatus("\u5F53\u524D\u9009\u4E2D\u5BF9\u8C61\u672A\u7ED1\u5B9A\u5230\u6709\u6548\u7684\u914D\u7535\u67DC\u7AEF\u5B50");
      return;
    }
    state.portSwapSession = context;
    renderPortSwapOverlay(context);
    deps.setCanvasStatus("\u66F4\u6362\u6302\u70B9\u6A21\u5F0F\uFF1A\u70B9\u51FB\u540C\u4E00\u914D\u7535\u67DC\u4E0A\u7684\u76EE\u6807\u8FDE\u63A5\u70B9\uFF0C\u6216\u70B9\u7A7A\u767D\u53D6\u6D88");
  }
  var portSwapModeApi = {
    applyEdgePortConstraintMetadata,
    clearPortSwapOverlay,
    commitPortSwap,
    enterPortSwapMode,
    exitPortSwapMode,
    getNearestCabinetPortFromClick,
    installGraphClickBehavior
  };

  // runtime/composeMode.js
  function getComposeDeps() {
    var app = getApp();
    var ctx = app.ctx;
    return {
      ctx,
      trim,
      clamp,
      padding: ctx.constants.INSTANCE_COMPOSE_ZONE_PADDING,
      minWidth: ctx.constants.INSTANCE_COMPOSE_ZONE_MIN_WIDTH,
      minHeight: ctx.constants.INSTANCE_COMPOSE_ZONE_MIN_HEIGHT,
      showStatus,
      setCanvasStatus,
      closeCabinetBlockDialog: function() {
        return cabinetBlockDialogApi.closeCabinetBlockDialog();
      },
      exitPortSwapMode: function(clearStatus) {
        return portSwapModeApi.exitPortSwapMode(clearStatus);
      },
      isDrawingFrame,
      isCabinetSegment,
      isCabinetGap,
      isPluginInternalCell: snapshotDomainApi.isPluginInternalCell,
      isElectricalRoot,
      shouldExportGenericObject: snapshotDomainApi.shouldExportGenericObject,
      findElectricalRoot
    };
  }
  function getComposeRuntime() {
    var deps = getComposeDeps();
    var ctx = deps.ctx;
    return {
      deps,
      graph: ctx.graph,
      model: ctx.model,
      state: ctx.state
    };
  }
  function isCellDescendantOf(cell, ancestor) {
    var model = getComposeRuntime().model;
    while (cell != null) {
      if (cell == ancestor) {
        return true;
      }
      cell = model.getParent(cell);
    }
    return false;
  }
  function getCellViewBounds(cell) {
    var graph = getComposeRuntime().graph;
    var stateView = graph.view.getState(cell);
    if (stateView == null) {
      return null;
    }
    return {
      x: stateView.x,
      y: stateView.y,
      width: stateView.width,
      height: stateView.height
    };
  }
  function getCellModelBounds(cell) {
    var runtime = getComposeRuntime();
    var graph = runtime.graph;
    var model = runtime.model;
    var stateView = graph.view.getState(cell);
    var scale = graph.view.scale || 1;
    var translate = graph.view.translate || { x: 0, y: 0 };
    if (stateView != null) {
      return {
        x: stateView.x / scale - translate.x,
        y: stateView.y / scale - translate.y,
        width: stateView.width / scale,
        height: stateView.height / scale
      };
    }
    var geometry = model.getGeometry(cell);
    if (geometry == null) {
      return null;
    }
    return {
      x: geometry.x,
      y: geometry.y,
      width: geometry.width,
      height: geometry.height
    };
  }
  function getUnionViewBounds(cells) {
    var bounds = null;
    var i;
    for (i = 0; i < cells.length; i++) {
      var cellBounds = getCellViewBounds(cells[i]);
      if (cellBounds == null) {
        continue;
      }
      if (bounds == null) {
        bounds = {
          x: cellBounds.x,
          y: cellBounds.y,
          width: cellBounds.width,
          height: cellBounds.height
        };
      } else {
        var right = Math.max(
          bounds.x + bounds.width,
          cellBounds.x + cellBounds.width
        );
        var bottom = Math.max(
          bounds.y + bounds.height,
          cellBounds.y + cellBounds.height
        );
        bounds.x = Math.min(bounds.x, cellBounds.x);
        bounds.y = Math.min(bounds.y, cellBounds.y);
        bounds.width = right - bounds.x;
        bounds.height = bottom - bounds.y;
      }
    }
    return bounds;
  }
  function getInstanceComposeZoneBounds(root, extraCells) {
    var runtime = getComposeRuntime();
    var deps = runtime.deps;
    var graph = runtime.graph;
    var candidates = [root];
    var bounds;
    var container = graph.container;
    var scrollLeft = container.scrollLeft;
    var scrollTop = container.scrollTop;
    var viewportLeft = scrollLeft + 20;
    var viewportTop = scrollTop + 20;
    var viewportRight = scrollLeft + container.clientWidth - 20;
    var viewportBottom = scrollTop + container.clientHeight - 20;
    var width;
    var height;
    var left;
    var top;
    var maxLeft;
    var maxTop;
    if (Array.isArray(extraCells) && extraCells.length > 0) {
      candidates = candidates.concat(extraCells);
    }
    bounds = getUnionViewBounds(candidates);
    if (bounds == null) {
      return null;
    }
    width = Math.max(deps.minWidth, bounds.width + deps.padding * 2);
    height = Math.max(deps.minHeight, bounds.height + deps.padding * 2);
    left = bounds.x + (bounds.width - width) / 2;
    top = bounds.y + (bounds.height - height) / 2;
    maxLeft = Math.max(viewportLeft, viewportRight - width);
    maxTop = Math.max(viewportTop, viewportBottom - height);
    return {
      left: deps.clamp(Math.round(left), viewportLeft, maxLeft),
      top: deps.clamp(Math.round(top), viewportTop, maxTop),
      width: Math.round(Math.min(width, viewportRight - viewportLeft)),
      height: Math.round(Math.min(height, viewportBottom - viewportTop))
    };
  }
  function clearInstanceComposeOverlay() {
    var state = getComposeRuntime().state;
    if (state.instanceComposeOverlay != null && state.instanceComposeOverlay.parentNode != null) {
      state.instanceComposeOverlay.parentNode.removeChild(
        state.instanceComposeOverlay
      );
    }
    state.instanceComposeOverlay = null;
  }
  function completeInstanceComposeMode() {
    var runtime = getComposeRuntime();
    var deps = runtime.deps;
    var graph = runtime.graph;
    var state = runtime.state;
    var session = state.instanceComposeSession;
    var root;
    var candidates;
    var matched = [];
    var attached;
    var i;
    if (session == null) {
      return;
    }
    root = session.root;
    if (root == null || root.parent == null) {
      exitInstanceComposeMode();
      return;
    }
    candidates = collectComposableCellsInZone(root, session.zoneBounds);
    for (i = 0; i < candidates.length; i++) {
      if (!session.initialZoneCellIds[candidates[i].id]) {
        matched.push(candidates[i]);
      }
    }
    if (matched.length == 0) {
      deps.showStatus("\u7EFF\u8272\u533A\u57DF\u5185\u6CA1\u6709\u65B0\u7684\u53EF\u7EC4\u5408\u56FE\u5143", true);
      return;
    }
    attached = attachCellsToElectricalRoot(root, matched);
    if (attached.length == 0) {
      deps.showStatus("\u6CA1\u6709\u68C0\u6D4B\u5230\u53EF\u7EC4\u5408\u7684\u56FE\u5143", true);
      return;
    }
    exitInstanceComposeMode(false);
    graph.setSelectionCell(root);
    deps.showStatus("\u5DF2\u7EC4\u5408\u5230\u5F53\u524D\u56FE\u5143\u5B9E\u4F8B", false);
    deps.setCanvasStatus("");
  }
  function renderInstanceComposeOverlay(session) {
    var runtime = getComposeRuntime();
    var deps = runtime.deps;
    var graph = runtime.graph;
    var state = runtime.state;
    var containerRect = graph.container.getBoundingClientRect();
    var zone = getInstanceComposeZoneBounds(
      session.root,
      session.dragging ? session.dragCandidates : null
    );
    var scrollLeft = graph.container.scrollLeft || 0;
    var scrollTop = graph.container.scrollTop || 0;
    var container = document.createElement("div");
    var shade = document.createElement("div");
    var zoneNode = document.createElement("div");
    var hint = document.createElement("div");
    var actions = document.createElement("div");
    var completeButton = document.createElement("button");
    var cancelButton = document.createElement("button");
    var controlsTop;
    clearInstanceComposeOverlay();
    if (zone == null) {
      return;
    }
    session.zoneBounds = zone;
    container.style.position = "fixed";
    container.style.left = Math.round(containerRect.left) + "px";
    container.style.top = Math.round(containerRect.top) + "px";
    container.style.width = graph.container.clientWidth + "px";
    container.style.height = graph.container.clientHeight + "px";
    container.style.pointerEvents = "none";
    container.style.zIndex = "3";
    shade.style.position = "absolute";
    shade.style.left = "0";
    shade.style.top = "0";
    shade.style.width = "100%";
    shade.style.height = "100%";
    shade.style.background = "rgba(15, 23, 42, 0.18)";
    container.appendChild(shade);
    zoneNode.style.position = "absolute";
    zoneNode.style.left = zone.left - scrollLeft + "px";
    zoneNode.style.top = zone.top - scrollTop + "px";
    zoneNode.style.width = zone.width + "px";
    zoneNode.style.height = zone.height + "px";
    zoneNode.style.border = "3px solid #16a34a";
    zoneNode.style.borderRadius = "10px";
    zoneNode.style.background = "rgba(22,163,74,0.06)";
    zoneNode.style.boxSizing = "border-box";
    zoneNode.style.backdropFilter = "none";
    container.appendChild(zoneNode);
    hint.style.position = "absolute";
    hint.style.left = zone.left - scrollLeft + "px";
    hint.style.top = Math.max(8, zone.top - 28 - scrollTop) + "px";
    hint.style.padding = "4px 10px";
    hint.style.maxWidth = Math.max(120, zone.width - 176) + "px";
    hint.style.borderRadius = "6px";
    hint.style.background = "rgba(22,163,74,0.92)";
    hint.style.color = "#ffffff";
    hint.style.fontSize = "12px";
    hint.style.fontWeight = "bold";
    hint.style.whiteSpace = "nowrap";
    hint.style.overflow = "hidden";
    hint.style.textOverflow = "ellipsis";
    hint.innerText = "\u62D6\u5165\u7EFF\u8272\u533A\u57DF\u5373\u53EF\u7EC4\u5408\u5230\u5F53\u524D\u56FE\u5143\u5B9E\u4F8B";
    container.appendChild(hint);
    controlsTop = Math.max(8, zone.top - 30 - scrollTop);
    actions.style.position = "absolute";
    actions.style.right = Math.max(
      8,
      graph.container.clientWidth - (zone.left + zone.width - scrollLeft)
    ) + "px";
    actions.style.top = controlsTop + "px";
    actions.style.display = "flex";
    actions.style.gap = "8px";
    actions.style.pointerEvents = "auto";
    completeButton.type = "button";
    completeButton.innerText = "\u5B8C\u6210";
    completeButton.style.height = "28px";
    completeButton.style.padding = "0 14px";
    completeButton.style.border = "1px solid #16a34a";
    completeButton.style.borderRadius = "6px";
    completeButton.style.background = "#16a34a";
    completeButton.style.color = "#ffffff";
    completeButton.style.cursor = "pointer";
    mxEvent.addListener(completeButton, "click", function(evt) {
      mxEvent.consume(evt);
      completeInstanceComposeMode();
    });
    actions.appendChild(completeButton);
    cancelButton.type = "button";
    cancelButton.innerText = "\u53D6\u6D88";
    cancelButton.style.height = "28px";
    cancelButton.style.padding = "0 14px";
    cancelButton.style.border = "1px solid #cbd5e1";
    cancelButton.style.borderRadius = "6px";
    cancelButton.style.background = "#ffffff";
    cancelButton.style.color = "#334155";
    cancelButton.style.cursor = "pointer";
    mxEvent.addListener(cancelButton, "click", function(evt) {
      mxEvent.consume(evt);
      exitInstanceComposeMode();
    });
    actions.appendChild(cancelButton);
    container.appendChild(actions);
    document.body.appendChild(container);
    state.instanceComposeOverlay = container;
  }
  function refreshInstanceComposeOverlay() {
    var state = getComposeRuntime().state;
    if (state.instanceComposeSession == null) {
      return;
    }
    renderInstanceComposeOverlay(state.instanceComposeSession);
  }
  function exitInstanceComposeMode(clearStatus) {
    var runtime = getComposeRuntime();
    var deps = runtime.deps;
    var state = runtime.state;
    clearInstanceComposeOverlay();
    state.instanceComposeSession = null;
    if (state.instanceComposeKeyHandler != null) {
      mxEvent.removeListener(
        document,
        "keydown",
        state.instanceComposeKeyHandler
      );
      state.instanceComposeKeyHandler = null;
    }
    if (clearStatus !== false) {
      deps.setCanvasStatus("");
    }
  }
  function findOwningElectricalRoot(cell) {
    var runtime = getComposeRuntime();
    var deps = runtime.deps;
    var model = runtime.model;
    var current = cell;
    while (current != null) {
      if (deps.isElectricalRoot(current)) {
        return current;
      }
      current = model.getParent(current);
    }
    return null;
  }
  function isBlockedComposeTarget(cell) {
    var runtime = getComposeRuntime();
    var deps = runtime.deps;
    var state = runtime.state;
    var session = state.instanceComposeSession;
    var ownerRoot;
    if (session == null || session.root == null || cell == null) {
      return false;
    }
    if (cell == session.root) {
      return true;
    }
    ownerRoot = findOwningElectricalRoot(cell);
    return ownerRoot == session.root && deps.isPluginInternalCell(cell);
  }
  function isLockedComposedChild(cell) {
    var runtime = getComposeRuntime();
    var deps = runtime.deps;
    var model = runtime.model;
    var state = runtime.state;
    var composeSession = state.instanceComposeSession;
    if (cell == null || deps.isDrawingFrame(cell) || deps.isCabinetSegment(cell)) {
      return false;
    }
    var ownerRoot = findOwningElectricalRoot(model.getParent(cell));
    if (ownerRoot == null) {
      return false;
    }
    if (composeSession != null && composeSession.root == ownerRoot) {
      return false;
    }
    return true;
  }
  function isComposableCandidateCell(cell, root) {
    var runtime = getComposeRuntime();
    var deps = runtime.deps;
    var model = runtime.model;
    return cell != null && !model.isEdge(cell) && !deps.isDrawingFrame(cell) && !deps.isCabinetSegment(cell) && !deps.isCabinetGap(cell) && !deps.isPluginInternalCell(cell) && cell != root && !isCellDescendantOf(cell, root) && (deps.isElectricalRoot(cell) || deps.shouldExportGenericObject(cell));
  }
  function filterTopLevelSelection(cells) {
    var result = [];
    var i;
    var j;
    var nested;
    for (i = 0; i < cells.length; i++) {
      nested = false;
      for (j = 0; j < cells.length; j++) {
        if (i != j && isCellDescendantOf(cells[i], cells[j])) {
          nested = true;
          break;
        }
      }
      if (!nested) {
        result.push(cells[i]);
      }
    }
    return result;
  }
  function collectComposableSelection(root) {
    var graph = getComposeRuntime().graph;
    var selection = graph.getSelectionCells();
    var candidates = [];
    var i;
    for (i = 0; i < selection.length; i++) {
      if (isComposableCandidateCell(selection[i], root)) {
        candidates.push(selection[i]);
      }
    }
    return filterTopLevelSelection(candidates);
  }
  function collectComposeDragCandidates(root, eventCell) {
    var candidates = collectComposableSelection(root);
    if (candidates.length == 0 && isComposableCandidateCell(eventCell, root)) {
      candidates = [eventCell];
    }
    return filterTopLevelSelection(candidates);
  }
  function collectComposableCells(root) {
    var model = getComposeRuntime().model;
    var cells = model.cells || {};
    var result = [];
    var id;
    var cell;
    for (id in cells) {
      if (!Object.prototype.hasOwnProperty.call(cells, id)) {
        continue;
      }
      cell = cells[id];
      if (isComposableCandidateCell(cell, root)) {
        result.push(cell);
      }
    }
    return filterTopLevelSelection(result);
  }
  function intersectsComposeZone(cell, zone) {
    var bounds = getCellViewBounds(cell);
    if (bounds == null || zone == null) {
      return false;
    }
    return !(bounds.x + bounds.width < zone.left || bounds.x > zone.left + zone.width || bounds.y + bounds.height < zone.top || bounds.y > zone.top + zone.height);
  }
  function collectComposableCellsInZone(root, zone) {
    var candidates = collectComposableCells(root);
    var result = [];
    var i;
    for (i = 0; i < candidates.length; i++) {
      if (intersectsComposeZone(candidates[i], zone)) {
        result.push(candidates[i]);
      }
    }
    return result;
  }
  function toCellIdMap(cells) {
    var trim2 = getComposeRuntime().deps.trim;
    var map = {};
    var i;
    for (i = 0; i < cells.length; i++) {
      if (cells[i] != null && trim2(cells[i].id).length > 0) {
        map[cells[i].id] = true;
      }
    }
    return map;
  }
  function attachCellsToElectricalRoot(root, cells) {
    var runtime = getComposeRuntime();
    var model = runtime.model;
    var state = runtime.state;
    var rootBounds = getCellModelBounds(root);
    var attached = [];
    var i;
    if (rootBounds == null) {
      throw new Error("\u5F53\u524D\u76EE\u6807\u56FE\u5143\u65E0\u6CD5\u8BA1\u7B97\u4F4D\u7F6E\uFF0C\u4E0D\u80FD\u6267\u884C\u7EC4\u5408");
    }
    state.updatingModel = true;
    model.beginUpdate();
    try {
      for (i = 0; i < cells.length; i++) {
        var cell = cells[i];
        var geometry = model.getGeometry(cell);
        var cellBounds = getCellModelBounds(cell);
        if (geometry == null || cellBounds == null || model.getParent(cell) == root) {
          continue;
        }
        geometry = geometry.clone();
        geometry.relative = false;
        geometry.x = cellBounds.x - rootBounds.x;
        geometry.y = cellBounds.y - rootBounds.y;
        model.add(root, cell, model.getChildCount(root));
        model.setGeometry(cell, geometry);
        attached.push(cell);
      }
    } finally {
      model.endUpdate();
      state.updatingModel = false;
    }
    return attached;
  }
  function enterInstanceComposeMode() {
    var runtime = getComposeRuntime();
    var deps = runtime.deps;
    var graph = runtime.graph;
    var state = runtime.state;
    if (state.instanceComposeSession != null) {
      exitInstanceComposeMode();
      return;
    }
    var root = deps.findElectricalRoot(graph.getSelectionCell());
    if (root == null) {
      deps.showStatus("\u8BF7\u5148\u9009\u4E2D\u4E00\u4E2A\u81EA\u5B9A\u4E49\u56FE\u5143\u5B9E\u4F8B\uFF0C\u518D\u6267\u884C\u7EC4\u5408\u56FE\u5143\u5B9E\u4F8B", true);
      deps.setCanvasStatus("\u8BF7\u5148\u9009\u4E2D\u4E00\u4E2A\u81EA\u5B9A\u4E49\u56FE\u5143\u5B9E\u4F8B\uFF0C\u518D\u6267\u884C\u7EC4\u5408\u56FE\u5143\u5B9E\u4F8B");
      return;
    }
    state.instanceComposeSession = {
      root,
      pointerDown: false,
      dragging: false,
      startPoint: null,
      dragCandidates: [],
      zoneBounds: null,
      initialZoneCellIds: {}
    };
    deps.closeCabinetBlockDialog();
    deps.exitPortSwapMode(false);
    graph.clearSelection();
    if (graph.selectionCellsHandler != null && typeof graph.selectionCellsHandler.clear === "function") {
      graph.selectionCellsHandler.clear();
    }
    refreshInstanceComposeOverlay();
    state.instanceComposeSession.initialZoneCellIds = toCellIdMap(
      collectComposableCellsInZone(
        root,
        state.instanceComposeSession.zoneBounds
      )
    );
    deps.setCanvasStatus(
      "\u7EC4\u5408\u6A21\u5F0F\uFF1A\u628A\u666E\u901A\u56FE\u5143\u6216\u81EA\u5B9A\u4E49\u56FE\u5143\u62D6\u5165\u7EFF\u8272\u533A\u57DF\uFF0C\u7136\u540E\u70B9\u51FB\u5B8C\u6210"
    );
    state.instanceComposeKeyHandler = function(evt) {
      if (evt.key == "Escape") {
        exitInstanceComposeMode();
      }
    };
    mxEvent.addListener(document, "keydown", state.instanceComposeKeyHandler);
  }
  var composeModeApi = {
    collectComposeDragCandidates,
    enterInstanceComposeMode,
    exitInstanceComposeMode,
    isBlockedComposeTarget,
    isLockedComposedChild,
    refreshInstanceComposeOverlay
  };

  // application/selection.js
  function getSelectedCell() {
    return getApp().ctx.graph.getSelectionCell();
  }
  function getSelectedRoot() {
    return findElectricalRoot(getSelectedCell());
  }
  function getSelectedFrame() {
    return frameDomainApi.findDrawingFrame(getSelectedCell());
  }
  function getSelectedCabinetSegment() {
    return cabinetDomainApi.findCabinetSegment(getSelectedCell());
  }
  function getSelectedCabinetGap() {
    var cell = getSelectedCell();
    return isCabinetGap(cell) ? cell : null;
  }
  var selectionApi = {
    getSelectedCabinetGap,
    getSelectedCabinetSegment,
    getSelectedCell,
    getSelectedFrame,
    getSelectedRoot
  };

  // domain/symbolCore.js
  function buildSymbolCoreDeps() {
    var app = getApp();
    return {
      toStyleImageUri: specDomainApi.toStyleImageUri,
      ROOT_TYPE: app.ctx.constants.ROOT_TYPE,
      trim,
      serializePortLayout: specDomainApi.serializePortLayout,
      normalizeLabels: specDomainApi.normalizeLabels
    };
  }
  function getSymbolCoreDeps() {
    return buildSymbolCoreDeps();
  }
  function makeRootStyle() {
    return "fillColor=none;strokeColor=none;html=1;whiteSpace=wrap;connectable=1;container=1;collapsible=0;foldable=0;recursiveResize=1;rotatable=0;resizable=1;";
  }
  function makeBodyStyle(spec) {
    var deps = getSymbolCoreDeps();
    return "shape=image;image=" + deps.toStyleImageUri(spec) + ";imageAspect=0;aspect=fixed;html=1;strokeColor=none;fillColor=none;part=1;connectable=0;editable=0;movable=0;resizable=0;rotatable=0;cloneable=0;deletable=0;pointerEvents=0;";
  }
  function makeLabelStyle(align) {
    return "text;part=1;html=1;whiteSpace=wrap;strokeColor=none;fillColor=none;align=" + align + ";verticalAlign=middle;spacing=2;rotatable=0;connectable=0;";
  }
  function applyValueMetadata(node, spec, layout) {
    var deps = getSymbolCoreDeps();
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
    node.setAttribute("labelsJson", JSON.stringify(deps.normalizeLabels(spec.labels)));
    node.setAttribute("schemaJson", JSON.stringify(spec.schema || {}));
    node.setAttribute("dataJson", JSON.stringify(spec.data || {}));
    node.setAttribute("symbolPayload", JSON.stringify(spec));
    return node;
  }
  var symbolCoreApi = {
    applyValueMetadata,
    makeBodyStyle,
    makeLabelStyle,
    makeRootStyle
  };

  // domain/symbolGraph.js
  function buildSymbolGraphDeps() {
    var app = getApp();
    var ctx = app.ctx;
    return {
      model: ctx.model,
      ROOT_TAG: ctx.constants.ROOT_TAG,
      ROOT_TYPE: ctx.constants.ROOT_TYPE,
      BODY_TAG: ctx.constants.BODY_TAG,
      BODY_KIND: ctx.constants.BODY_KIND,
      LABEL_TAG: ctx.constants.LABEL_TAG,
      LABEL_KIND: ctx.constants.LABEL_KIND,
      trim,
      isObject,
      normalizeMode,
      normalizeSpec: specDomainApi.normalizeSpec,
      normalizePortLayout: specDomainApi.normalizePortLayout,
      normalizeLabels: specDomainApi.normalizeLabels,
      parsePortLayout: specDomainApi.parsePortLayout,
      getAttr,
      createNode,
      createMetaCell,
      cloneValue,
      toStyleImageUri: specDomainApi.toStyleImageUri,
      serializePortLayout: specDomainApi.serializePortLayout,
      buildPortLayout: specDomainApi.buildPortLayout,
      buildResolvedLabels: specDomainApi.buildResolvedLabels
    };
  }
  function createSymbolDomain() {
    var deps = arguments.length > 0 ? arguments[0] : buildSymbolGraphDeps();
    var model = deps.model;
    var core = symbolCoreApi;
    function addChild(root, child) {
      var index = arguments.length > 2 ? arguments[2] : null;
      if (root.parent != null) {
        model.add(root, child, index);
      } else {
        root.insert(child, index);
      }
    }
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
    function ensureRootValue(root, spec, layout) {
      var value = core.applyValueMetadata(deps.cloneValue(root.value), spec, layout);
      if (root.parent != null) {
        model.setValue(root, value);
        model.setStyle(root, core.makeRootStyle());
      } else {
        root.value = value;
        root.style = core.makeRootStyle();
        root.setConnectable(false);
      }
    }
    function createBodyCell(spec) {
      var geometry = new mxGeometry(0, 0, spec.size.width, spec.size.height);
      geometry.relative = true;
      geometry.offset = new mxPoint(0, 0);
      var cell = new mxCell(
        deps.createMetaCell(deps.BODY_TAG, deps.BODY_KIND, "main", ""),
        geometry,
        core.makeBodyStyle(spec)
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
      var value = deps.cloneValue(cell.value);
      value.setAttribute("esKind", deps.BODY_KIND);
      value.setAttribute("esKey", "main");
      value.setAttribute("label", "");
      model.setValue(cell, value);
      model.setStyle(cell, core.makeBodyStyle(spec));
      cell.setConnectable(false);
    }
    function createLabelCell(label) {
      var geometry = new mxGeometry(label.x, label.y, label.width, label.height);
      geometry.relative = true;
      geometry.offset = new mxPoint(-label.width / 2, -label.height / 2);
      var cell = new mxCell(
        deps.createMetaCell(deps.LABEL_TAG, deps.LABEL_KIND, label.id, label.text),
        geometry,
        core.makeLabelStyle(label.align)
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
      var value = deps.cloneValue(cell.value);
      value.setAttribute("esKind", deps.LABEL_KIND);
      value.setAttribute("esKey", label.id);
      value.setAttribute("label", label.text);
      model.setValue(cell, value);
      model.setStyle(cell, core.makeLabelStyle(label.align));
      cell.setConnectable(false);
    }
    function mapChildren(root) {
      var children = {
        body: {},
        label: {}
      };
      var i;
      for (i = 0; i < model.getChildCount(root); i++) {
        var child = model.getChildAt(root, i);
        var kind = deps.getAttr(child, "esKind");
        var key = deps.getAttr(child, "esKey");
        if (kind != null && key != null && children[kind] != null) {
          children[kind][key] = child;
        }
      }
      return children;
    }
    function removeUnused(map, keep) {
      for (var key in map) {
        if (map.hasOwnProperty(key) && keep[key] == null) {
          model.remove(map[key]);
        }
      }
    }
    function syncRoot2(root, spec, baseLayout) {
      var layout = deps.buildPortLayout(spec, baseLayout);
      var resolvedLabels = deps.buildResolvedLabels(spec.labels, spec.data);
      var mapped;
      var keepBodies = {};
      var keepLabels = {};
      var child;
      var i;
      ensureRootGeometry(root, spec);
      ensureRootValue(root, spec, layout);
      mapped = mapChildren(root);
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
      if (root.parent != null) {
        removeUnused(mapped.body, keepBodies);
        removeUnused(mapped.label, keepLabels);
      }
      root.setConnectable(true);
      return root;
    }
    function buildSymbolCell2(spec) {
      var root = new mxCell(
        deps.createNode(deps.ROOT_TAG),
        new mxGeometry(0, 0, spec.size.width, spec.size.height),
        ""
      );
      root.vertex = true;
      root.setConnectable(true);
      return syncRoot2(root, spec, null);
    }
    function extractSpec2(root) {
      var raw = deps.getAttr(root, "symbolPayload");
      var spec;
      var portsRaw;
      var labelsRaw;
      var schemaJson;
      var dataJson;
      var paramsJson;
      var geo;
      if (raw == null || raw.length == 0) {
        throw new Error("\u7F3A\u5C11 symbolPayload \u6570\u636E");
      }
      spec = JSON.parse(raw);
      if (!deps.isObject(spec.device)) {
        spec.device = {};
      }
      spec.ports = deps.normalizePortLayout(spec.ports);
      spec.labels = deps.normalizeLabels(spec.labels);
      spec.symbolId = deps.trim(deps.getAttr(root, "symbolId")) || spec.symbolId;
      spec.instanceId = deps.trim(deps.getAttr(root, "instanceId")) || deps.trim(spec.instanceId);
      spec.title = deps.trim(deps.getAttr(root, "title")) || spec.title;
      spec.device.name = deps.trim(deps.getAttr(root, "deviceName")) || deps.trim(spec.device.name);
      spec.device.code = deps.trim(deps.getAttr(root, "deviceCode")) || deps.trim(spec.device.code);
      spec.device.power = deps.trim(deps.getAttr(root, "devicePower")) || deps.trim(spec.device.power);
      spec.device.mode = deps.normalizeMode(
        deps.getAttr(root, "mode") || spec.device.mode
      );
      spec.variantField = deps.trim(deps.getAttr(root, "variantField")) || deps.trim(spec.variantField || "mode");
      portsRaw = deps.getAttr(root, "portsJson");
      if (portsRaw == null || portsRaw.length == 0) {
        portsRaw = deps.getAttr(root, "portLayout");
      }
      if (portsRaw != null && portsRaw.length > 0) {
        spec.ports = deps.parsePortLayout(portsRaw);
      }
      labelsRaw = deps.getAttr(root, "labelsJson");
      if (labelsRaw != null && labelsRaw.length > 0) {
        try {
          spec.labels = deps.normalizeLabels(JSON.parse(labelsRaw));
        } catch (e) {
        }
      }
      schemaJson = deps.getAttr(root, "schemaJson");
      if (schemaJson != null && schemaJson.length > 0) {
        try {
          spec.schema = JSON.parse(schemaJson);
        } catch (e) {
        }
      }
      dataJson = deps.getAttr(root, "dataJson");
      if (dataJson != null && dataJson.length > 0) {
        try {
          spec.data = JSON.parse(dataJson);
        } catch (e) {
        }
      }
      paramsJson = deps.getAttr(root, "paramsJson");
      if (paramsJson != null && paramsJson.length > 0) {
        try {
          spec.device.params = JSON.parse(paramsJson);
        } catch (e) {
        }
      }
      geo = model.getGeometry(root);
      if (geo != null) {
        spec.size = {
          width: Math.max(20, Math.round(geo.width)),
          height: Math.max(20, Math.round(geo.height))
        };
      }
      return deps.normalizeSpec(spec);
    }
    function refreshRoot2(root) {
      var spec = extractSpec2(root);
      var portLayout = deps.parsePortLayout(deps.getAttr(root, "portLayout"));
      syncRoot2(root, spec, portLayout);
      return spec;
    }
    return {
      buildSymbolCell: buildSymbolCell2,
      extractSpec: extractSpec2,
      refreshRoot: refreshRoot2,
      syncRoot: syncRoot2
    };
  }

  // domain/symbol.js
  function getSymbolDomain() {
    return createSymbolDomain();
  }
  function buildSymbolCell() {
    return getSymbolDomain().buildSymbolCell.apply(null, arguments);
  }
  function extractSpec() {
    return getSymbolDomain().extractSpec.apply(null, arguments);
  }
  function refreshRoot() {
    return getSymbolDomain().refreshRoot.apply(null, arguments);
  }
  function syncRoot() {
    return getSymbolDomain().syncRoot.apply(null, arguments);
  }
  var symbolDomainApi = {
    buildSymbolCell,
    extractSpec,
    refreshRoot,
    syncRoot
  };

  // runtime/viewportVirtualization.js
  var DEBUG = true;
  function debugLog() {
    if (DEBUG && typeof console !== "undefined") {
      var args = ["[LOD]"];
      for (var i = 0; i < arguments.length; i++) {
        args.push(arguments[i]);
      }
      console.log.apply(console, args);
    }
  }
  var OVERVIEW_PX = 360;
  var PRELOAD_MARGIN_PX = 600;
  var HYSTERESIS = 0.05;
  var THROTTLE_MS = 120;
  var INIT_DELAY_MS = 200;
  var FRAME_NOMINAL_WIDTH = 820;
  var overviewMode = false;
  var culledFrameSet = /* @__PURE__ */ new Set();
  var installed = false;
  var throttleTimer = null;
  var lodListeners = [];
  var _graph = null;
  function isOrphanTopLevelCell(cell) {
    if (cell == null || isDrawingFrame(cell)) {
      return false;
    }
    var model = _graph.getModel();
    var parent = model.getParent(cell);
    if (parent == null) {
      return false;
    }
    return model.getParent(parent) === model.getRoot();
  }
  function getCurrentScale(graph) {
    if (graph.useCssTransforms) {
      return graph.currentScale || 1;
    }
    return graph.view != null ? graph.view.scale || 1 : 1;
  }
  function getViewportRect(graph) {
    var c = graph.container;
    if (c == null) {
      return null;
    }
    var s = getCurrentScale(graph);
    var tx;
    var ty;
    if (graph.useCssTransforms) {
      tx = graph.currentTranslate != null ? graph.currentTranslate.x : 0;
      ty = graph.currentTranslate != null ? graph.currentTranslate.y : 0;
    } else {
      var t = graph.view != null ? graph.view.translate : null;
      tx = t != null ? t.x : 0;
      ty = t != null ? t.y : 0;
    }
    return {
      x: c.scrollLeft / s - tx,
      y: c.scrollTop / s - ty,
      width: c.clientWidth / s,
      height: c.clientHeight / s
    };
  }
  function expandRectByPixels(rect, scale) {
    var m = PRELOAD_MARGIN_PX / scale;
    return {
      x: rect.x - m,
      y: rect.y - m,
      width: rect.width + m * 2,
      height: rect.height + m * 2
    };
  }
  function rectsIntersect(a, b) {
    return !(a.x + a.width < b.x || b.x + b.width < a.x || a.y + a.height < b.y || b.y + b.height < a.y);
  }
  function collectAllFrames(graph) {
    var model = graph.getModel();
    var frames = [];
    function walk(cell) {
      if (cell == null) {
        return;
      }
      if (isDrawingFrame(cell)) {
        frames.push(cell);
        return;
      }
      var n = model.getChildCount(cell);
      for (var i = 0; i < n; i++) {
        walk(model.getChildAt(cell, i));
      }
    }
    walk(model.getRoot());
    return frames;
  }
  function getFrameAbsoluteRect(graph, frame) {
    var model = graph.getModel();
    var geo = model.getGeometry(frame);
    if (geo == null) {
      return null;
    }
    var x = geo.x;
    var y = geo.y;
    var p = model.getParent(frame);
    while (p != null && p !== model.getRoot()) {
      var pg = model.getGeometry(p);
      if (pg != null) {
        x += pg.x;
        y += pg.y;
      }
      p = model.getParent(p);
    }
    return { x, y, width: geo.width, height: geo.height };
  }
  function recompute(graph) {
    var scale = getCurrentScale(graph);
    var changed = false;
    var screenW = FRAME_NOMINAL_WIDTH * scale;
    var newOverview;
    if (overviewMode) {
      newOverview = screenW < OVERVIEW_PX * (1 + HYSTERESIS);
    } else {
      newOverview = screenW < OVERVIEW_PX * (1 - HYSTERESIS);
    }
    if (graph.cellEditor != null && graph.cellEditor.editingCell != null) {
      newOverview = overviewMode;
    }
    if (newOverview !== overviewMode) {
      overviewMode = newOverview;
      changed = true;
    }
    var vp = getViewportRect(graph);
    if (vp == null) {
      return changed;
    }
    var expanded = expandRectByPixels(vp, scale);
    var frames = collectAllFrames(graph);
    for (var i = 0; i < frames.length; i++) {
      var frame = frames[i];
      var rect = getFrameAbsoluteRect(graph, frame);
      var shouldCull = rect == null || !rectsIntersect(rect, expanded);
      var isCulled = culledFrameSet.has(frame);
      if (shouldCull && !isCulled) {
        culledFrameSet.add(frame);
        changed = true;
      } else if (!shouldCull && isCulled) {
        culledFrameSet.delete(frame);
        changed = true;
      }
    }
    for (var f of culledFrameSet) {
      if (f.parent == null) {
        culledFrameSet.delete(f);
        changed = true;
      }
    }
    return changed;
  }
  function clearInvalidSelection(graph) {
    if (!overviewMode) {
      return;
    }
    var sel = graph.getSelectionCells();
    if (sel == null || sel.length === 0) {
      return;
    }
    var remove = [];
    for (var i = 0; i < sel.length; i++) {
      if (!isDrawingFrame(sel[i])) {
        remove.push(sel[i]);
      }
    }
    if (remove.length > 0) {
      debugLog("clearSelection: " + remove.length + " cells");
      graph.removeSelectionCells(remove);
    }
  }
  function runCullingPass(graph) {
    if (recompute(graph)) {
      debugLog(
        "changed: overview=" + overviewMode,
        "culled=" + culledFrameSet.size,
        "scale=" + getCurrentScale(graph).toFixed(3)
      );
      clearInvalidSelection(graph);
      graph.view.revalidate();
      graph.view.validate();
      notifyLodChanged();
    }
  }
  function scheduleThrottledCulling(graph) {
    if (throttleTimer != null) {
      return;
    }
    throttleTimer = setTimeout(function() {
      throttleTimer = null;
      runCullingPass(graph);
    }, THROTTLE_MS);
  }
  function onLodChanged(listener) {
    if (typeof listener === "function") {
      lodListeners.push(listener);
    }
  }
  function notifyLodChanged() {
    var i;
    for (i = 0; i < lodListeners.length; i++) {
      try {
        lodListeners[i]();
      } catch (e) {
        debugLog("lod listener failed", e);
      }
    }
  }
  function isOverviewMode() {
    return overviewMode;
  }
  function withAllFramesExpanded(fn) {
    var graph = getApp().ctx.graph;
    var savedCulled = new Set(culledFrameSet);
    var savedOverview = overviewMode;
    var needRestore = culledFrameSet.size > 0 || overviewMode;
    if (needRestore) {
      debugLog("expandAll: clearing culled=" + savedCulled.size + " overview=" + savedOverview);
      culledFrameSet.clear();
      overviewMode = false;
      graph.view.revalidate();
      graph.view.validate();
    }
    try {
      return fn();
    } finally {
      if (needRestore) {
        for (var f of savedCulled) {
          culledFrameSet.add(f);
        }
        overviewMode = savedOverview;
        debugLog("expandAll: restored");
        graph.view.revalidate();
        graph.view.validate();
      }
    }
  }
  function installViewportVirtualization(ctx) {
    if (installed) {
      return;
    }
    var graph = ctx.graph;
    if (graph.container == null) {
      return;
    }
    installed = true;
    _graph = graph;
    debugLog("install: OVERVIEW_PX=" + OVERVIEW_PX, "PRELOAD_MARGIN_PX=" + PRELOAD_MARGIN_PX);
    var _origCollapsed = graph.isCellCollapsed;
    graph.isCellCollapsed = function(cell) {
      if (culledFrameSet.has(cell)) {
        return true;
      }
      return _origCollapsed.call(this, cell);
    };
    var _origFoldable = graph.isCellFoldable;
    graph.isCellFoldable = function(cell, collapse) {
      if (culledFrameSet.has(cell)) {
        return false;
      }
      return _origFoldable.call(this, cell, collapse);
    };
    var _origGetLabel = graph.getLabel;
    graph.getLabel = function(cell) {
      if (overviewMode) {
        return "";
      }
      return _origGetLabel.call(this, cell);
    };
    var _origSelectable = graph.isCellSelectable;
    graph.isCellSelectable = function(cell) {
      if (overviewMode && !isDrawingFrame(cell)) {
        return false;
      }
      return _origSelectable.call(this, cell);
    };
    var _origMovable = graph.isCellMovable;
    graph.isCellMovable = function(cell) {
      if (overviewMode && !isDrawingFrame(cell)) {
        return false;
      }
      return _origMovable.call(this, cell);
    };
    var _origDeletable = graph.isCellDeletable;
    graph.isCellDeletable = function(cell) {
      if (overviewMode) {
        return false;
      }
      return _origDeletable.call(this, cell);
    };
    var _origEditable = graph.isCellEditable;
    graph.isCellEditable = function(cell) {
      if (overviewMode) {
        return false;
      }
      return _origEditable.call(this, cell);
    };
    var FRAME_BORDER_TOLERANCE = 8;
    function isOnFrameBorder(cellState, gx, gy) {
      var tol = FRAME_BORDER_TOLERANCE;
      var left = cellState.x;
      var top = cellState.y;
      var right = cellState.x + cellState.width;
      var bottom = cellState.y + cellState.height;
      var scale = graph.view.scale;
      var tolScaled = tol * scale;
      if (gx < left - tolScaled || gx > right + tolScaled || gy < top - tolScaled || gy > bottom + tolScaled) {
        return false;
      }
      if (gx < left + tolScaled || gx > right - tolScaled || gy < top + tolScaled || gy > bottom - tolScaled) {
        return true;
      }
      return false;
    }
    var _origGetCellAt = graph.getCellAt;
    graph.getCellAt = function(x, y, parent, vertices, edges, ignoreFn) {
      if (overviewMode && parent != null && isDrawingFrame(parent)) {
        return null;
      }
      var result = _origGetCellAt.call(this, x, y, parent, vertices, edges, ignoreFn);
      if (!overviewMode && result != null && isDrawingFrame(result)) {
        var state = graph.view.getState(result);
        if (state != null) {
          var onBorder = isOnFrameBorder(state, x, y);
          console.log("[FrameHit] x=" + x + " y=" + y + " state=(" + state.x + "," + state.y + "," + state.width + "," + state.height + ") scale=" + graph.view.scale + " onBorder=" + onBorder);
          if (!onBorder) {
            return null;
          }
        }
      }
      return result;
    };
    var _origVisible = graph.isCellVisible;
    graph.isCellVisible = function(cell) {
      if (overviewMode && isOrphanTopLevelCell(cell) && !graph.getModel().isEdge(cell)) {
        return false;
      }
      return _origVisible.call(this, cell);
    };
    var _origConstraints = graph.getAllConnectionConstraints;
    graph.getAllConnectionConstraints = function(terminal, source) {
      if (overviewMode) {
        return null;
      }
      return _origConstraints.call(this, terminal, source);
    };
    var _origGetSvg = graph.getSvg;
    if (typeof _origGetSvg === "function") {
      graph.getSvg = function() {
        var self = this;
        var outerArgs = arguments;
        return withAllFramesExpanded(function() {
          return _origGetSvg.apply(self, outerArgs);
        });
      };
    }
    var container = graph.container;
    container.addEventListener("scroll", function() {
      scheduleThrottledCulling(graph);
    });
    graph.view.addListener(mxEvent.SCALE, function() {
      scheduleThrottledCulling(graph);
    });
    graph.view.addListener(mxEvent.SCALE_AND_TRANSLATE, function() {
      scheduleThrottledCulling(graph);
    });
    graph.getModel().addListener(mxEvent.CHANGE, function() {
      for (var f of culledFrameSet) {
        if (f.parent == null) {
          culledFrameSet.delete(f);
        }
      }
      scheduleThrottledCulling(graph);
    });
    if (typeof ResizeObserver !== "undefined") {
      new ResizeObserver(function() {
        scheduleThrottledCulling(graph);
      }).observe(container);
    }
    setTimeout(function() {
      debugLog("initial culling pass");
      runCullingPass(graph);
    }, INIT_DELAY_MS);
  }

  // application/commands.js
  function getDefaultParentChildren() {
    var app = getApp();
    var graph = app.ctx.graph;
    var model = app.ctx.model;
    var parent = graph.getDefaultParent();
    var cells = [];
    var i;
    for (i = 0; i < model.getChildCount(parent); i++) {
      cells.push(model.getChildAt(parent, i));
    }
    return cells;
  }
  function insertCellIntoFrame(cell, frame) {
    var app = getApp();
    var graph = app.ctx.graph;
    var insertPoint = frameDomainApi.getFrameChildInsertPoint(
      frame,
      cell.geometry != null ? cell.geometry.width : 0,
      cell.geometry != null ? cell.geometry.height : 0
    );
    graph.setSelectionCells(graph.importCells([cell], insertPoint.x, insertPoint.y, frame));
    graph.scrollCellToVisible(graph.getSelectionCell());
  }
  function insertCellAtPoint(cell, point) {
    var app = getApp();
    var graph = app.ctx.graph;
    graph.setSelectionCells(graph.importCells([cell], point.x, point.y));
    graph.scrollCellToVisible(graph.getSelectionCell());
  }
  function insertIntoGraph(spec) {
    var app = getApp();
    var graph = app.ctx.graph;
    var root = symbolDomainApi.buildSymbolCell(spec);
    var frame = frameDomainApi.getActiveFrame(false);
    if (frame != null) {
      insertCellIntoFrame(root, frame);
    } else {
      var pt = graph.getFreeInsertPoint();
      graph.setSelectionCells(graph.importCells([root], pt.x, pt.y));
    }
    graph.scrollCellToVisible(graph.getSelectionCell());
    showStatus("\u5DF2\u63D2\u5165\u56FE\u5143", false);
    setCanvasStatus("\u5DF2\u63D2\u5165\u56FE\u5143");
  }
  function insertIntoGraphAt(spec, point) {
    var app = getApp();
    var graph = app.ctx.graph;
    var root = symbolDomainApi.buildSymbolCell(spec);
    if (point != null && isFinite(point.x) && isFinite(point.y)) {
      insertCellAtPoint(root, point);
    } else {
      var fallbackPoint = graph.getFreeInsertPoint();
      insertCellAtPoint(root, fallbackPoint);
    }
    showStatus("\u5DF2\u63D2\u5165\u56FE\u5143", false);
    setCanvasStatus("\u5DF2\u63D2\u5165\u56FE\u5143");
  }
  function refreshSelection() {
    var app = getApp();
    var graph = app.ctx.graph;
    var model = app.ctx.model;
    var state = app.ctx.state;
    var root = selectionApi.getSelectedRoot();
    var cabinet = selectionApi.getSelectedCabinetSegment();
    if (cabinet != null) {
      try {
        state.updatingModel = true;
        model.beginUpdate();
        cabinetDomainApi.relayoutCabinetByModel(
          cabinetDomainApi.extractCabinetModel(cabinet)
        );
        showStatus("\u914D\u7535\u67DC\u5DF2\u5237\u65B0", false);
        setCanvasStatus("\u914D\u7535\u67DC\u5DF2\u5237\u65B0");
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
      showStatus("\u8BF7\u5148\u9009\u62E9\u4E00\u4E2A\u7535\u6C14\u56FE\u5143", true);
      return;
    }
    state.updatingModel = true;
    model.beginUpdate();
    try {
      symbolDomainApi.refreshRoot(root);
    } catch (e) {
      showStatus(e.message || String(e), true);
      return;
    } finally {
      model.endUpdate();
      state.updatingModel = false;
    }
    showStatus("\u7535\u6C14\u56FE\u5143\u5DF2\u5237\u65B0", false);
  }
  function insertFrame(config, selectedFrame, existingFrames) {
    var app = getApp();
    var graph = app.ctx.graph;
    var model = app.ctx.model;
    var state = app.ctx.state;
    var constants = app.ctx.constants;
    var normalizedConfig = frameDomainApi.normalizeFrameConfig(config || {});
    var frames = Array.isArray(existingFrames) ? existingFrames : frameDomainApi.getAllDrawingFrames();
    var groupId = selectedFrame != null ? frameDomainApi.getFrameGroupId(selectedFrame) : generateFrameGroupId();
    var nextPageNumber = selectedFrame != null ? frameDomainApi.getMaxFramePageNumberInGroup(groupId) + 1 : 1;
    var frame = frameDomainApi.createDrawingFrameCell(normalizedConfig, nextPageNumber, {
      groupId
    });
    state.frameConfig = cloneJson(normalizedConfig);
    if (selectedFrame != null) {
      var anchorFrame = frameDomainApi.getRightmostFrameInGroup(groupId) || selectedFrame;
      var anchorGeometry = model.getGeometry(anchorFrame);
      frame.geometry = frame.geometry.clone();
      frame.geometry.x = anchorGeometry.x + anchorGeometry.width + constants.FRAME_HORIZONTAL_GAP;
      frame.geometry.y = anchorGeometry.y;
      frameDomainApi.addTopLevelCell(frame);
      graph.setSelectionCell(frame);
    } else if (frames.length > 0) {
      var leftmostFrame = frameDomainApi.getLeftmostFrame();
      var bottommostFrame = frameDomainApi.getBottommostFrame();
      var leftGeometry = leftmostFrame != null ? model.getGeometry(leftmostFrame) : null;
      var bottomGeometry = bottommostFrame != null ? model.getGeometry(bottommostFrame) : null;
      frame.geometry = frame.geometry.clone();
      frame.geometry.x = leftGeometry != null ? leftGeometry.x : 0;
      frame.geometry.y = bottomGeometry != null ? bottomGeometry.y + bottomGeometry.height + constants.FRAME_VERTICAL_GAP : 0;
      frameDomainApi.addTopLevelCell(frame);
      graph.setSelectionCell(frame);
    } else {
      var point = graph.getFreeInsertPoint();
      graph.setSelectionCells(graph.importCells([frame], point.x, point.y));
    }
    graph.scrollCellToVisible(graph.getSelectionCell());
    showStatus("\u5DF2\u63D2\u5165\u56FE\u6846", false);
    setCanvasStatus("\u5DF2\u63D2\u5165\u56FE\u6846");
  }
  function insertCabinet(cabinetModel) {
    var app = getApp();
    var graph = app.ctx.graph;
    var model = app.ctx.model;
    model.beginUpdate();
    try {
      cabinetDomainApi.relayoutCabinetByModel(cabinetModel);
    } finally {
      model.endUpdate();
    }
    var segments = cabinetDomainApi.findCabinetSegments(cabinetModel.logicalCabinetId);
    if (segments.length > 0) {
      graph.setSelectionCell(segments[0]);
      graph.scrollCellToVisible(segments[0]);
    }
    showStatus("\u5DF2\u63D2\u5165\u914D\u7535\u67DC", false);
    setCanvasStatus("\u5DF2\u63D2\u5165\u914D\u7535\u67DC");
  }
  function insertCabinetBlock(blockCell, blockInit) {
    var app = getApp();
    var graph = app.ctx.graph;
    var model = app.ctx.model;
    var segments;
    model.beginUpdate();
    try {
      segments = cabinetDomainApi.insertCabinetBlockAfter(blockCell, blockInit);
    } finally {
      model.endUpdate();
    }
    if (segments == null) {
      showStatus("\u672A\u627E\u5230\u8981\u63D2\u5165\u7684\u4F4D\u7F6E", true);
      return false;
    }
    if (segments.length > 0) {
      graph.scrollCellToVisible(segments[0]);
    }
    showStatus("\u5DF2\u63D2\u5165\u914D\u7535\u67DC\u5757", false);
    setCanvasStatus("\u5DF2\u63D2\u5165\u914D\u7535\u67DC\u5757");
    return true;
  }
  function bindCabinetSwitch(blockCell, spec) {
    var app = getApp();
    var graph = app.ctx.graph;
    var model = app.ctx.model;
    var result;
    model.beginUpdate();
    try {
      result = cabinetDomainApi.bindSwitchToBlock(blockCell, spec);
    } finally {
      model.endUpdate();
    }
    if (result == null) {
      showStatus("\u672A\u627E\u5230\u8981\u7ED1\u5B9A\u7684\u914D\u7535\u67DC\u5757", true);
      return false;
    }
    if (result.switchCell != null) {
      graph.setSelectionCell(result.switchCell);
      graph.scrollCellToVisible(result.switchCell);
    }
    showStatus("\u5DF2\u7ED1\u5B9A\u5F00\u5173", false);
    setCanvasStatus("\u5DF2\u7ED1\u5B9A\u5F00\u5173");
    return true;
  }
  function unbindCabinetSwitch(blockCell, removeSwitch) {
    var app = getApp();
    var model = app.ctx.model;
    model.beginUpdate();
    try {
      cabinetDomainApi.unbindSwitchFromBlock(blockCell, removeSwitch === true, false);
    } finally {
      model.endUpdate();
    }
    showStatus(removeSwitch === true ? "\u5DF2\u5220\u9664\u5F00\u5173" : "\u5DF2\u89E3\u9664\u5F00\u5173\u7ED1\u5B9A", false);
    setCanvasStatus("\u5DF2\u66F4\u65B0\u5F00\u5173\u7ED1\u5B9A");
    return true;
  }
  function updateCabinetModel(cabinetModel, statusText) {
    var app = getApp();
    var model = app.ctx.model;
    var label = statusText || "\u5DF2\u66F4\u65B0\u914D\u7535\u67DC";
    model.beginUpdate();
    try {
      cabinetDomainApi.relayoutCabinetByModel(cabinetModel);
    } finally {
      model.endUpdate();
    }
    showStatus(label, false);
    setCanvasStatus(label);
  }
  function applyInstanceSpec(root, spec) {
    var app = getApp();
    var graph = app.ctx.graph;
    var model = app.ctx.model;
    var state = app.ctx.state;
    if (root == null || root.parent == null) {
      throw new Error("\u5F53\u524D\u56FE\u5143\u5DF2\u4E0D\u5B58\u5728\uFF0C\u65E0\u6CD5\u5E94\u7528\u4FEE\u6539");
    }
    state.updatingModel = true;
    model.beginUpdate();
    try {
      symbolDomainApi.syncRoot(root, spec, spec.ports);
      graph.setSelectionCell(root);
    } finally {
      model.endUpdate();
      state.updatingModel = false;
    }
    showStatus("\u5DF2\u66F4\u65B0\u56FE\u5143\u5B9E\u4F8B", false);
  }
  function clearCurrentPage() {
    var app = getApp();
    var graph = app.ctx.graph;
    var state = app.ctx.state;
    var cells = getDefaultParentChildren();
    if (cells.length == 0) {
      showStatus("\u5F53\u524D\u9875\u9762\u6CA1\u6709\u53EF\u6E05\u9664\u7684\u5185\u5BB9", false);
      return;
    }
    if (!mxUtils.confirm("\u786E\u8BA4\u6E05\u9664\u5F53\u524D\u9875\u9762\u6240\u6709\u5185\u5BB9\uFF1F")) {
      return;
    }
    if (!mxUtils.confirm("\u6B64\u64CD\u4F5C\u4E0D\u53EF\u6062\u590D\uFF0C\u786E\u5B9A\u7EE7\u7EED\u6E05\u9664\u5417\uFF1F")) {
      return;
    }
    cabinetBlockDialogApi.closeCabinetBlockDialog();
    portSwapModeApi.exitPortSwapMode(false);
    composeModeApi.exitInstanceComposeMode(false);
    state.allowProtectedDelete = true;
    try {
      graph.removeCells(cells, true);
      showStatus("\u5DF2\u6E05\u7A7A\u5F53\u524D\u9875\u9762", false);
    } finally {
      state.allowProtectedDelete = false;
    }
  }
  function forceDeleteSelection() {
    var app = getApp();
    var graph = app.ctx.graph;
    var model = app.ctx.model;
    var cells = graph.getSelectionCells();
    if (cells == null || cells.length === 0) {
      showStatus("\u6CA1\u6709\u9009\u4E2D\u4EFB\u4F55\u5143\u7D20", true);
      return;
    }
    if (!mxUtils.confirm("\u5F3A\u5236\u5220\u9664\u5C06\u65E0\u89C6\u6240\u6709\u4FDD\u62A4\uFF0C\u786E\u5B9A\u7EE7\u7EED\uFF1F")) {
      return;
    }
    withAllFramesExpanded(function() {
      var toRemove = [];
      var i, j, child;
      for (i = 0; i < cells.length; i++) {
        toRemove.push(cells[i]);
        var desc = model.getDescendants(cells[i]);
        for (j = 0; j < desc.length; j++) {
          child = desc[j];
          if (child !== cells[i]) {
            toRemove.push(child);
          }
        }
      }
      model.beginUpdate();
      try {
        graph.cellsRemoved(toRemove);
      } finally {
        model.endUpdate();
      }
    });
    showStatus("\u5F3A\u5236\u5220\u9664\u5B8C\u6210 (" + cells.length + " \u4E2A\u5143\u7D20)", false);
  }
  var commandApi = {
    applyInstanceSpec,
    clearCurrentPage,
    forceDeleteSelection,
    insertCabinet,
    insertCabinetBlock,
    bindCabinetSwitch,
    unbindCabinetSwitch,
    insertFrame,
    insertIntoGraph,
    insertIntoGraphAt,
    refreshSelection,
    updateCabinetModel
  };

  // ui/shared/buttonFactory.js
  function createPluginButton(label, fn) {
    var button = mxUtils.button(label, fn);
    button.className = "geBtn";
    button.style.marginRight = "8px";
    button.style.marginTop = "8px";
    return button;
  }

  // ui/cabinetDialog.js
  function buildCabinetDialogDeps() {
    var app = getApp();
    return {
      ctx: app.ctx,
      trim,
      clamp,
      toInt,
      toFloat,
      createButton: createPluginButton,
      getActiveFrame: frameDomainApi.getActiveFrame,
      getAttr,
      normalizeCabinetModel: cabinetDomainApi.normalizeCabinetModel,
      generateLogicalCabinetId,
      insertCabinet: commandApi.insertCabinet,
      showStatus,
      setCanvasStatus,
      findCabinetSegment: cabinetDomainApi.findCabinetSegment,
      extractCabinetModel: cabinetDomainApi.extractCabinetModel
    };
  }
  function getCabinetDialogDeps() {
    return buildCabinetDialogDeps();
  }
  function getCabinetPopupPosition(nativeEvent, width, height) {
    var deps = getCabinetDialogDeps();
    var fallback = { x: 220, y: 180 };
    if (nativeEvent == null) {
      return fallback;
    }
    var offsetX = 36;
    var offsetY = -24;
    var rawEvent = typeof nativeEvent.getEvent == "function" ? nativeEvent.getEvent() : nativeEvent;
    var pageX = mxEvent.getClientX(rawEvent) + (window.pageXOffset || document.documentElement.scrollLeft || 0);
    var pageY = mxEvent.getClientY(rawEvent) + (window.pageYOffset || document.documentElement.scrollTop || 0);
    var viewportWidth = window.innerWidth || document.documentElement.clientWidth || 1280;
    var viewportHeight = window.innerHeight || document.documentElement.clientHeight || 720;
    var minX = (window.pageXOffset || document.documentElement.scrollLeft || 0) + 12;
    var minY = (window.pageYOffset || document.documentElement.scrollTop || 0) + 12;
    var maxX = (window.pageXOffset || document.documentElement.scrollLeft || 0) + viewportWidth - width - 12;
    var maxY = (window.pageYOffset || document.documentElement.scrollTop || 0) + viewportHeight - height - 12;
    var x = pageX + offsetX;
    var y = pageY + offsetY;
    if (x > maxX) {
      x = pageX - width - offsetX;
    }
    if (y > maxY) {
      y = maxY;
    }
    return {
      x: deps.clamp(x, minX, Math.max(minX, maxX)),
      y: deps.clamp(y, minY, Math.max(minY, maxY))
    };
  }
  function buildInitialBlocks(rawCount, rawHeight, constants) {
    var count = Math.max(1, parseInt(rawCount, 10) || constants.CABINET_DEFAULT_BLOCK_COUNT);
    var height = Math.max(
      constants.CABINET_BLOCK_MIN_HEIGHT,
      parseInt(rawHeight, 10) || constants.CABINET_BLOCK_DEFAULT_HEIGHT
    );
    var blocks = [];
    var i;
    for (i = 0; i < count; i++) {
      blocks.push({ height });
    }
    return blocks;
  }
  function openInsertCabinetDialog() {
    var deps = getCabinetDialogDeps();
    var ctx = deps.ctx;
    var constants = ctx.constants;
    var trim2 = deps.trim;
    var frame = deps.getActiveFrame(true);
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
    function addTextRow(label, initial, placeholder) {
      var row = document.createElement("div");
      row.style.display = "grid";
      row.style.gridTemplateColumns = "90px 1fr";
      row.style.alignItems = "center";
      row.style.gap = "8px";
      div.appendChild(row);
      var caption = document.createElement("div");
      caption.innerText = label;
      row.appendChild(caption);
      var input = document.createElement("input");
      input.setAttribute("type", "text");
      input.value = initial || "";
      if (placeholder != null) {
        input.setAttribute("placeholder", placeholder);
      }
      row.appendChild(input);
      return input;
    }
    var nameInput = addTextRow("\u540D\u79F0", "\u914D\u7535\u67DC", "GALLEY MAIN SWITCHBOARD");
    var codeInput = addTextRow("\u7F16\u53F7", "", "GB11");
    var voltageInput = addTextRow("\u7535\u538B", "", "230VAC");
    var designationInput = addTextRow("\u67DC\u5185\u7F16\u53F7", "", "875.022 / GB11");
    var locationNoteInput = addTextRow("\u4F4D\u7F6E\u8BF4\u660E", "", "10\u7532\u677F\u5904227\u70B9\uFF0C\u7535\u6C14\u8BBE\u5907\u95F4");
    var locationInput = addTextRow("\u4F4D\u7F6E\u4EE3\u53F7", "", "Fr227P DECK 10, EL. EQ.");
    var configRow = document.createElement("div");
    configRow.style.display = "grid";
    configRow.style.gridTemplateColumns = "90px 100px 60px 80px 60px 80px";
    configRow.style.alignItems = "center";
    configRow.style.gap = "8px";
    div.appendChild(configRow);
    var widthLabel = document.createElement("div");
    widthLabel.innerText = "\u67DC\u5BBD";
    configRow.appendChild(widthLabel);
    var widthInput = document.createElement("input");
    widthInput.setAttribute("type", "number");
    widthInput.setAttribute("min", "30");
    widthInput.value = String(constants.CABINET_DEFAULT_WIDTH);
    configRow.appendChild(widthInput);
    var countLabel = document.createElement("div");
    countLabel.innerText = "\u5757\u6570";
    configRow.appendChild(countLabel);
    var countInput = document.createElement("input");
    countInput.setAttribute("type", "number");
    countInput.setAttribute("min", "1");
    countInput.value = String(constants.CABINET_DEFAULT_BLOCK_COUNT);
    configRow.appendChild(countInput);
    var heightLabel = document.createElement("div");
    heightLabel.innerText = "\u5757\u9AD8";
    configRow.appendChild(heightLabel);
    var heightInput = document.createElement("input");
    heightInput.setAttribute("type", "number");
    heightInput.setAttribute("min", String(constants.CABINET_BLOCK_MIN_HEIGHT));
    heightInput.value = String(constants.CABINET_BLOCK_DEFAULT_HEIGHT);
    configRow.appendChild(heightInput);
    var hint = document.createElement("div");
    hint.style.color = Editor.isDarkMode() ? "#c0c4cc" : "#57606a";
    hint.style.fontSize = "12px";
    hint.innerText = "\u6BCF\u5757\u5728\u6BCD\u7EBF\u4E0A\u6D3E\u751F\u4E00\u4E2A\u51FA\u7EBF\u7AEF\u53E3\u3002\u63D2\u5165\u540E\u53EF\u76F4\u63A5\u62D6\u5757\u7684\u4E0A\u4E0B\u8FB9\u6846\u6539\u9AD8\u5EA6\uFF0C\u62D6\u67DC\u4F53\u5DE6\u53F3\u8FB9\u6846\u6539\u67DC\u5BBD\u3002";
    div.appendChild(hint);
    var buttons = document.createElement("div");
    div.appendChild(buttons);
    var wnd = new mxWindow("\u63D2\u5165\u914D\u7535\u67DC", div, 200, 120, 560, 400, true, true);
    wnd.destroyOnClose = true;
    wnd.setClosable(true);
    wnd.setMaximizable(false);
    wnd.setResizable(false);
    wnd.setScrollable(false);
    var submitButton = deps.createButton("\u63D2\u5165\u914D\u7535\u67DC", function() {
      var cabinetModel = deps.normalizeCabinetModel({
        logicalCabinetId: deps.generateLogicalCabinetId(),
        originFrameId: trim2(deps.getAttr(frame, "frameId")),
        title: trim2(nameInput.value) || "\u914D\u7535\u67DC",
        code: trim2(codeInput.value),
        voltage: trim2(voltageInput.value),
        designation: trim2(designationInput.value),
        locationNote: trim2(locationNoteInput.value),
        location: trim2(locationInput.value),
        cabinetWidth: widthInput.value,
        blockCount: countInput.value,
        blocks: buildInitialBlocks(countInput.value, heightInput.value, constants)
      });
      try {
        deps.insertCabinet(cabinetModel);
      } catch (e) {
        deps.showStatus(e.message || String(e), true);
        deps.setCanvasStatus(e.message || String(e));
        return;
      }
      wnd.destroy();
    });
    submitButton.style.marginTop = "0";
    buttons.appendChild(submitButton);
    wnd.setVisible(true);
  }
  var cabinetDialogsApi = {
    getCabinetPopupPosition,
    openInsertCabinetDialog
  };

  // ui/cabinetBlockDialog.js
  var DIALOG_WIDTH = 320;
  var DIALOG_HEIGHT = 186;
  function getState2() {
    return getApp().ctx.state;
  }
  function closeCabinetBlockDialog() {
    var state = getState2();
    if (state.cabinetBlockDialogWindow != null) {
      var wnd = state.cabinetBlockDialogWindow;
      state.cabinetBlockDialogWindow = null;
      wnd.destroy();
    }
  }
  function createFieldRow(labelText) {
    var row = document.createElement("div");
    row.style.display = "grid";
    row.style.gridTemplateColumns = "72px 1fr";
    row.style.alignItems = "center";
    row.style.gap = "8px";
    var label = document.createElement("div");
    label.innerText = labelText;
    row.appendChild(label);
    return row;
  }
  function openCabinetBlockDialog(blockCell, nativeEvent) {
    if (blockCell == null) {
      return;
    }
    closeCabinetBlockDialog();
    var constants = getApp().ctx.constants;
    var referenceHeight = toInt(
      getAttr(blockCell, "blockHeight"),
      constants.CABINET_BLOCK_DEFAULT_HEIGHT
    );
    var div = document.createElement("div");
    div.style.padding = "12px";
    div.style.display = "flex";
    div.style.flexDirection = "column";
    div.style.gap = "10px";
    div.style.boxSizing = "border-box";
    div.style.width = "100%";
    div.style.height = "100%";
    var titleRow = createFieldRow("\u56DE\u8DEF\u7F16\u53F7");
    var titleInput = document.createElement("input");
    titleInput.setAttribute("type", "text");
    titleInput.value = "";
    titleRow.appendChild(titleInput);
    div.appendChild(titleRow);
    var heightRow = createFieldRow("\u5757\u9AD8");
    var heightInput = document.createElement("input");
    heightInput.setAttribute("type", "number");
    heightInput.setAttribute("min", String(constants.CABINET_BLOCK_MIN_HEIGHT));
    heightInput.value = String(referenceHeight);
    heightRow.appendChild(heightInput);
    div.appendChild(heightRow);
    var error = document.createElement("div");
    error.style.color = "#d64545";
    error.style.fontSize = "12px";
    error.style.minHeight = "16px";
    div.appendChild(error);
    var buttons = document.createElement("div");
    div.appendChild(buttons);
    var position = getCabinetPopupPosition(nativeEvent, DIALOG_WIDTH, DIALOG_HEIGHT);
    var wnd = new mxWindow(
      "\u63D2\u5165\u5757",
      div,
      position.x,
      position.y,
      DIALOG_WIDTH,
      DIALOG_HEIGHT,
      true,
      true
    );
    wnd.destroyOnClose = true;
    wnd.setClosable(true);
    wnd.setMaximizable(false);
    wnd.setResizable(false);
    wnd.setScrollable(false);
    wnd.addListener(mxEvent.DESTROY, function() {
      getState2().cabinetBlockDialogWindow = null;
    });
    var submitButton = createPluginButton("\u63D2\u5165", function() {
      var height = toInt(heightInput.value, NaN);
      if (!isFinite(height) || height < constants.CABINET_BLOCK_MIN_HEIGHT) {
        error.innerText = "\u5757\u9AD8\u81F3\u5C11 " + constants.CABINET_BLOCK_MIN_HEIGHT;
        return;
      }
      try {
        commandApi.insertCabinetBlock(blockCell, {
          title: trim(titleInput.value),
          height
        });
      } catch (e) {
        var message = e.message || String(e);
        error.innerText = message;
        showStatus(message, true);
        setCanvasStatus(message);
        return;
      }
      closeCabinetBlockDialog();
    });
    submitButton.style.marginTop = "0";
    buttons.appendChild(submitButton);
    getState2().cabinetBlockDialogWindow = wnd;
    wnd.setVisible(true);
    titleInput.focus();
  }
  var cabinetBlockDialogApi = {
    closeCabinetBlockDialog,
    openCabinetBlockDialog
  };

  // domain/snapshotGraph.js
  function buildSnapshotDeps() {
    var app = getApp();
    var ctx = app.ctx;
    return {
      graph: ctx.graph,
      model: ctx.model,
      state: ctx.state,
      ui: ctx.ui,
      BODY_KIND: ctx.constants.BODY_KIND,
      LABEL_KIND: ctx.constants.LABEL_KIND,
      FRAME_LABEL_KIND: ctx.constants.FRAME_LABEL_KIND,
      CABINET_BODY_KIND: ctx.constants.CABINET_BODY_KIND,
      CABINET_GAP_KIND: ctx.constants.CABINET_GAP_KIND,
      FRAME_MARGIN_RATIO: ctx.constants.FRAME_MARGIN_RATIO,
      trim,
      toInt,
      isObject,
      cloneJson,
      createNode,
      getAttr,
      uniqueStrings,
      isCabinetGap,
      isDrawingFrame,
      isCabinetSegment,
      isElectricalRoot,
      extractSpec: symbolDomainApi.extractSpec,
      getFrameConfig: frameDomainApi.getFrameConfig,
      getFramePageNumber: frameDomainApi.getFramePageNumber,
      getFrameGroupId: frameDomainApi.getFrameGroupId,
      findFrameById: frameDomainApi.findFrameById,
      extractCabinetModel: cabinetDomainApi.extractCabinetModel,
      findCabinetSegments: cabinetDomainApi.findCabinetSegments,
      getPortMetaById: connectionConstraintsApi.getPortMetaById,
      findDrawingFrame: frameDomainApi.findDrawingFrame,
      findPortHostRoot,
      parsePortLayout: specDomainApi.parsePortLayout,
      getAllDrawingFrames: frameDomainApi.getAllDrawingFrames,
      exitInstanceComposeMode: function(clearStatus) {
        return composeModeApi.exitInstanceComposeMode(clearStatus);
      },
      closeCabinetBlockDialog: function() {
        return cabinetBlockDialogApi.closeCabinetBlockDialog();
      },
      exitPortSwapMode: function(clearStatus) {
        return portSwapModeApi.exitPortSwapMode(clearStatus);
      },
      createDrawingFrameCell: frameDomainApi.createDrawingFrameCell,
      addTopLevelCell: frameDomainApi.addTopLevelCell,
      relayoutCabinetByModel: cabinetDomainApi.relayoutCabinetByModel,
      normalizeSpec: specDomainApi.normalizeSpec,
      buildSymbolCell: symbolDomainApi.buildSymbolCell,
      resetPendingChangeRecords
    };
  }
  function createSnapshotDomain() {
    var deps = arguments.length > 0 ? arguments[0] : buildSnapshotDeps();
    var graph = deps.graph;
    var model = deps.model;
    var state = deps.state;
    var ui = deps.ui;
    var currentDuplicateSymbolInstanceIds = null;
    var currentDuplicateFrameIds = null;
    function belongsToCurrentDefaultParent(cell) {
      var parent = cell != null ? model.getParent(cell) : null;
      var defaultParent = graph.getDefaultParent();
      while (parent != null) {
        if (parent == defaultParent) {
          return true;
        }
        parent = model.getParent(parent);
      }
      return false;
    }
    function getAllModelCells() {
      var cells = [];
      var seen = {};
      var key;
      for (key in model.cells) {
        if (Object.prototype.hasOwnProperty.call(model.cells, key) && model.cells[key] != null && model.cells[key] != graph.getDefaultParent() && belongsToCurrentDefaultParent(model.cells[key]) && !seen[key]) {
          seen[key] = true;
          cells.push(model.cells[key]);
        }
      }
      return cells;
    }
    function getPreferredSymbolInstanceId(cell) {
      var instanceId = deps.trim(deps.getAttr(cell, "instanceId"));
      if (instanceId.length > 0) {
        return instanceId;
      }
      var spec = deps.extractSpec(cell);
      return deps.trim(spec != null ? spec.instanceId : "");
    }
    function collectDuplicateFrameIds(frames) {
      var counts = {};
      var duplicates = {};
      var i;
      for (i = 0; i < frames.length; i++) {
        var frameId = deps.trim(deps.getAttr(frames[i], "frameId"));
        if (frameId.length == 0) {
          continue;
        }
        counts[frameId] = (counts[frameId] || 0) + 1;
      }
      for (var key in counts) {
        if (Object.prototype.hasOwnProperty.call(counts, key) && counts[key] > 1) {
          duplicates[key] = true;
        }
      }
      return duplicates;
    }
    function getFrameObjectId(frame, duplicateFrameIds) {
      var frameId = deps.trim(deps.getAttr(frame, "frameId"));
      if (frameId.length > 0 && !(duplicateFrameIds != null && duplicateFrameIds[frameId] === true)) {
        return frameId;
      }
      return deps.trim(frame != null && frame.id != null ? String(frame.id) : "");
    }
    function collectDuplicateSymbolInstanceIds(cells) {
      var counts = {};
      var duplicates = {};
      var i;
      for (i = 0; i < cells.length; i++) {
        var cell = cells[i];
        if (!deps.isElectricalRoot(cell)) {
          continue;
        }
        var instanceId = getPreferredSymbolInstanceId(cell);
        if (instanceId.length == 0) {
          continue;
        }
        counts[instanceId] = (counts[instanceId] || 0) + 1;
      }
      for (var key in counts) {
        if (Object.prototype.hasOwnProperty.call(counts, key) && counts[key] > 1) {
          duplicates[key] = true;
        }
      }
      return duplicates;
    }
    function getStyleConstraintFromEdge(edge, source) {
      var style = graph.getCellStyle(edge) || {};
      var prefix = source ? "exit" : "entry";
      var x = mxUtils.getValue(style, prefix + "X", null);
      var y = mxUtils.getValue(style, prefix + "Y", null);
      if (deps.trim(x).length == 0 || deps.trim(y).length == 0) {
        return null;
      }
      return new mxConnectionConstraint(
        new mxPoint(toNumber(x, 0), toNumber(y, 0)),
        mxUtils.getValue(style, prefix + "Perimeter", 1) != "0",
        null,
        toNumber(mxUtils.getValue(style, prefix + "Dx", 0), 0),
        toNumber(mxUtils.getValue(style, prefix + "Dy", 0), 0)
      );
    }
    function isImplicitDrawioGenericPortId(portId) {
      return /^port:\d+$/.test(deps.trim(portId).toLowerCase());
    }
    function getEdgePortId2(edge, root, source) {
      var style = graph.getCellStyle(edge) || {};
      var key = source ? "sourcePortId" : "targetPortId";
      var portId = deps.trim(mxUtils.getValue(style, key, ""));
      var edgeState;
      var terminalState;
      var constraint;
      var point;
      var isGenericRoot;
      var genericBindings;
      var ports;
      var i;
      if (portId.length > 0) {
        return portId;
      }
      edgeState = graph.view.getState(edge);
      terminalState = graph.view.getState(root);
      constraint = edgeState != null && terminalState != null ? graph.getConnectionConstraint(edgeState, terminalState, source) : null;
      if (constraint == null) {
        constraint = getStyleConstraintFromEdge(edge, source);
      }
      point = constraint != null ? constraint.point : null;
      isGenericRoot = !deps.isElectricalRoot(root) && !deps.isCabinetSegment(root);
      genericBindings = isGenericRoot ? collectGenericPortBindings2(root) : null;
      ports = isGenericRoot ? genericBindings.map(function(binding2) {
        return binding2.port;
      }) : deps.parsePortLayout(deps.getAttr(root, "portsJson"));
      if (isGenericRoot && constraint != null) {
        var absolutePoint = edgeState != null && terminalState != null ? graph.getConnectionPoint(terminalState, constraint) : null;
        for (i = 0; i < genericBindings.length; i++) {
          var binding = genericBindings[i];
          if (deps.trim(binding.port.name).length > 0 && deps.trim(binding.port.name) == deps.trim(constraint.name)) {
            if (isImplicitDrawioGenericPortId(binding.port.id)) {
              return "";
            }
            return deps.trim(binding.port.id);
          }
          if (binding.constraint != null && binding.constraint.point != null && point != null && Math.abs(binding.constraint.point.x - point.x) < 1e-4 && Math.abs(binding.constraint.point.y - point.y) < 1e-4 && toNumber(binding.constraint.dx, 0) == toNumber(constraint.dx, 0) && toNumber(binding.constraint.dy, 0) == toNumber(constraint.dy, 0) && binding.constraint.perimeter === constraint.perimeter) {
            if (isImplicitDrawioGenericPortId(binding.port.id)) {
              return "";
            }
            return deps.trim(binding.port.id);
          }
          if (absolutePoint != null && Math.abs(binding.port.x - absolutePoint.x) < 1 && Math.abs(binding.port.y - absolutePoint.y) < 1) {
            if (isImplicitDrawioGenericPortId(binding.port.id)) {
              return "";
            }
            return deps.trim(binding.port.id);
          }
        }
      }
      if (point != null) {
        for (i = 0; i < ports.length; i++) {
          if (Math.abs(ports[i].x - point.x) < 1e-4 && Math.abs(ports[i].y - point.y) < 1e-4) {
            if (isGenericRoot && isImplicitDrawioGenericPortId(ports[i].id)) {
              return "";
            }
            return deps.trim(ports[i].id);
          }
        }
      }
      return "";
    }
    function isPluginInternalCell3(cell) {
      var kind = deps.trim(deps.getAttr(cell, "esKind"));
      return deps.isCabinetGap(cell) || kind == deps.BODY_KIND || kind == deps.LABEL_KIND || kind == deps.FRAME_LABEL_KIND || kind == deps.CABINET_BODY_KIND || kind == deps.CABINET_GAP_KIND;
    }
    function shouldExportGenericObject3(cell) {
      return cell != null && model.isVertex(cell) && !deps.isDrawingFrame(cell) && !deps.isCabinetSegment(cell) && !deps.isElectricalRoot(cell) && !isPluginInternalCell3(cell);
    }
    function clearPageForImport() {
      var parent = graph.getDefaultParent();
      var cells = [];
      var i;
      for (i = 0; i < model.getChildCount(parent); i++) {
        cells.push(model.getChildAt(parent, i));
      }
      deps.closeCabinetBlockDialog();
      deps.exitPortSwapMode(false);
      if (cells.length == 0) {
        return;
      }
      state.allowProtectedDelete = true;
      try {
        graph.removeCells(cells, true);
      } finally {
        state.allowProtectedDelete = false;
      }
    }
    function resolveSnapshotObjectId(cell) {
      if (cell == null) {
        return null;
      }
      if (deps.isDrawingFrame(cell)) {
        return getFrameObjectId(cell, currentDuplicateFrameIds) || null;
      }
      if (deps.isCabinetSegment(cell)) {
        return deps.trim(cell.id != null ? String(cell.id) : "") || deps.trim(deps.getAttr(cell, "logicalCabinetId")) || null;
      }
      if (deps.isElectricalRoot(cell)) {
        return getSymbolObjectId(cell, currentDuplicateSymbolInstanceIds);
      }
      if (shouldExportGenericObject3(cell)) {
        return getGenericObjectId(cell);
      }
      return null;
    }
    function collectGenericPortBindings2(cell) {
      var seen = {};
      var result = [];
      function addConstraint(constraint) {
        if (constraint == null || constraint.point == null) {
          return;
        }
        var duplicateKey = JSON.stringify({
          name: deps.trim(constraint.name),
          x: toNumber(constraint.point.x, 0),
          y: toNumber(constraint.point.y, 0),
          perimeter: constraint.perimeter !== false,
          dx: toNumber(constraint.dx, 0),
          dy: toNumber(constraint.dy, 0)
        });
        if (seen[duplicateKey]) {
          return;
        }
        seen[duplicateKey] = true;
        var entry = {
          id: deps.trim(constraint.name) || "port:" + String(result.length + 1),
          name: deps.trim(constraint.name),
          x: toNumber(constraint.point.x, 0),
          y: toNumber(constraint.point.y, 0),
          marker: "cross",
          direction: "any",
          ioMode: "both",
          perimeter: constraint.perimeter !== false,
          dx: toNumber(constraint.dx, 0),
          dy: toNumber(constraint.dy, 0)
        };
        result.push({
          port: entry,
          constraint
        });
      }
      var stateView = graph.view.getState(cell);
      if (stateView != null) {
        var sourceConstraints = graph.getAllConnectionConstraints(stateView, true);
        var targetConstraints = graph.getAllConnectionConstraints(stateView, false);
        var i;
        if (Array.isArray(sourceConstraints)) {
          for (i = 0; i < sourceConstraints.length; i++) {
            addConstraint(sourceConstraints[i]);
          }
        }
        if (Array.isArray(targetConstraints)) {
          for (i = 0; i < targetConstraints.length; i++) {
            addConstraint(targetConstraints[i]);
          }
        }
      }
      return result;
    }
    function extractGenericPorts(cell) {
      return collectGenericPortBindings2(cell).filter(function(entry) {
        return !isImplicitDrawioGenericPortId(entry.port.id);
      }).map(function(entry) {
        return entry.port;
      });
    }
    function getGenericPortBindingById2(cell, portId) {
      var targetId = deps.trim(portId);
      var bindings = collectGenericPortBindings2(cell);
      var i;
      for (i = 0; i < bindings.length; i++) {
        if (deps.trim(bindings[i].port.id) == targetId) {
          return bindings[i];
        }
      }
      return null;
    }
    function getSymbolObjectId(root, duplicateInstanceIds) {
      var instanceId = getPreferredSymbolInstanceId(root);
      if (instanceId.length > 0 && !(duplicateInstanceIds != null && duplicateInstanceIds[instanceId] === true)) {
        return instanceId;
      }
      return deps.trim(root != null ? root.id : "");
    }
    function exportFrameObject(frame) {
      var geometry = model.getGeometry(frame);
      var frameConfig = deps.getFrameConfig(frame);
      return {
        id: getFrameObjectId(frame, currentDuplicateFrameIds),
        kind: "frame",
        parentId: null,
        groupId: deps.getFrameGroupId(frame) || null,
        geometry: {
          x: geometry != null ? geometry.x : 0,
          y: geometry != null ? geometry.y : 0,
          width: geometry != null ? geometry.width : frameConfig.width,
          height: geometry != null ? geometry.height : frameConfig.height
        },
        props: {
          pageNumber: deps.getFramePageNumber(frame),
          frameConfig,
          originFrameId: deps.trim(deps.getAttr(frame, "originFrameId")) || null,
          autoFrameOwner: deps.trim(deps.getAttr(frame, "autoFrameOwner")) || null,
          autoFrameIndex: deps.toInt(deps.getAttr(frame, "autoFrameIndex"), 0)
        }
      };
    }
    function exportCabinetObject(segment) {
      var cabinetModel = deps.extractCabinetModel(segment);
      var currentFrame = deps.findDrawingFrame(segment);
      var originFrame = deps.findFrameById(cabinetModel.originFrameId);
      var geometry = model.getGeometry(segment);
      var segmentPorts = deps.parsePortLayout(deps.getAttr(segment, "portsJson"));
      var logicalCabinetId = deps.trim(cabinetModel.logicalCabinetId);
      var segmentObjectId = deps.trim(segment != null && segment.id != null ? String(segment.id) : "") || logicalCabinetId;
      var currentFrameId = currentFrame != null ? deps.trim(deps.getAttr(currentFrame, "frameId")) : "";
      var currentFrameObjectId = currentFrame != null ? getFrameObjectId(currentFrame, currentDuplicateFrameIds) : "";
      return {
        id: segmentObjectId,
        kind: "cabinet",
        parentId: currentFrameObjectId || deps.trim(cabinetModel.originFrameId) || null,
        groupId: currentFrame != null ? deps.getFrameGroupId(currentFrame) : null,
        geometry: {
          x: geometry != null ? geometry.x : cabinetModel.cabinetX,
          y: geometry != null ? geometry.y : originFrame != null ? Math.round(
            deps.getFrameConfig(originFrame).height * deps.FRAME_MARGIN_RATIO
          ) : 0,
          width: geometry != null ? geometry.width : cabinetModel.cabinetWidth,
          height: geometry != null ? geometry.height : 0
        },
        props: {
          cabinetModel,
          segmentPorts,
          logicalCabinetId: logicalCabinetId || null,
          originFrameId: deps.trim(cabinetModel.originFrameId) || null,
          currentFrameId: currentFrameId || null,
          segmentCellId: deps.trim(segment != null && segment.id != null ? String(segment.id) : "") || null
        }
      };
    }
    function exportSymbolObject(root, duplicateInstanceIds) {
      var spec = deps.extractSpec(root);
      var geometry = model.getGeometry(root);
      var frame = deps.findDrawingFrame(root);
      var parent = model.getParent(root);
      if (parent == graph.getDefaultParent()) {
        parent = null;
      }
      return {
        id: getSymbolObjectId(root, duplicateInstanceIds),
        kind: "symbol",
        parentId: resolveSnapshotObjectId(parent),
        groupId: frame != null ? deps.getFrameGroupId(frame) : null,
        geometry: {
          x: geometry != null ? geometry.x : 0,
          y: geometry != null ? geometry.y : 0,
          width: geometry != null ? geometry.width : spec.size.width,
          height: geometry != null ? geometry.height : spec.size.height
        },
        props: {
          spec
        }
      };
    }
    function exportEdgeObject(edge) {
      var sourceTerminal = model.getTerminal(edge, true);
      var targetTerminal = model.getTerminal(edge, false);
      var sourceRoot = deps.findPortHostRoot(sourceTerminal);
      var targetRoot = deps.findPortHostRoot(targetTerminal);
      var sourcePortRoot = sourceRoot != null ? sourceRoot : shouldExportGenericObject3(sourceTerminal) ? sourceTerminal : null;
      var targetPortRoot = targetRoot != null ? targetRoot : shouldExportGenericObject3(targetTerminal) ? targetTerminal : null;
      var geometry = model.getGeometry(edge);
      var style = model.getStyle(edge) || "";
      var parent = model.getParent(edge);
      var sourcePortId = sourcePortRoot != null ? getEdgePortId2(edge, sourcePortRoot, true) : null;
      var targetPortId = targetPortRoot != null ? getEdgePortId2(edge, targetPortRoot, false) : null;
      return {
        id: edge.id || mxObjectIdentity.get(edge),
        source: {
          objectId: resolveSnapshotObjectId(
            sourcePortRoot != null ? sourcePortRoot : sourceTerminal
          ),
          portId: deps.trim(sourcePortId) || null
        },
        target: {
          objectId: resolveSnapshotObjectId(
            targetPortRoot != null ? targetPortRoot : targetTerminal
          ),
          portId: deps.trim(targetPortId) || null
        },
        props: {
          // 托管连线（块↔开关）带 esKind，消费方据此把它与用户画的电缆区分开
          esKind: deps.trim(deps.getAttr(edge, "esKind")) || null,
          parentId: parent != null && parent != graph.getDefaultParent() ? resolveSnapshotObjectId(parent) : null,
          style: {
            raw: style,
            sourcePortId: deps.trim(sourcePortId) || null,
            targetPortId: deps.trim(targetPortId) || null,
            sourcePortConstraint: mxUtils.getValue(
              style,
              "sourcePortConstraint",
              ""
            ),
            targetPortConstraint: mxUtils.getValue(
              style,
              "targetPortConstraint",
              ""
            )
          },
          value: serializeCellValue(edge.value),
          geometry: serializeGeometry(geometry)
        }
      };
    }
    function exportGenericObject(cell) {
      var geometry = model.getGeometry(cell);
      var frame = deps.findDrawingFrame(cell);
      var parent = model.getParent(cell);
      if (parent == graph.getDefaultParent()) {
        parent = null;
      }
      return {
        id: getGenericObjectId(cell),
        kind: "generic",
        parentId: resolveSnapshotObjectId(parent),
        groupId: frame != null ? deps.getFrameGroupId(frame) : null,
        geometry: serializeGeometry(geometry),
        props: {
          style: model.getStyle(cell) || "",
          value: serializeCellValue(cell.value),
          vertex: model.isVertex(cell),
          connectable: typeof cell.isConnectable === "function" ? !!cell.isConnectable() : cell.connectable !== false,
          visible: cell.visible !== false,
          collapsed: !!cell.collapsed,
          ports: extractGenericPorts(cell)
        }
      };
    }
    function collectChangeObjectIds2(changes) {
      var result = [];
      var i;
      for (i = 0; Array.isArray(changes) && i < changes.length; i++) {
        if (deps.trim(changes[i].objectId).length > 0) {
          result.push(changes[i].objectId);
        }
      }
      return deps.uniqueStrings(result);
    }
    function exportDiagramSnapshot2() {
      var frames = deps.getAllDrawingFrames();
      var frameObjects = [];
      var cabinetObjects = [];
      var symbolObjects = [];
      var genericObjects = [];
      var edgeObjects = [];
      var allCells = getAllModelCells();
      var duplicateSymbolInstanceIds = collectDuplicateSymbolInstanceIds(allCells);
      var i;
      currentDuplicateSymbolInstanceIds = duplicateSymbolInstanceIds;
      currentDuplicateFrameIds = collectDuplicateFrameIds(frames);
      for (i = 0; i < frames.length; i++) {
        frameObjects.push(exportFrameObject(frames[i]));
      }
      for (i = 0; i < allCells.length; i++) {
        var cell = allCells[i];
        if (deps.isCabinetSegment(cell)) {
          cabinetObjects.push(exportCabinetObject(cell));
        } else if (deps.isElectricalRoot(cell)) {
          symbolObjects.push(
            exportSymbolObject(cell, duplicateSymbolInstanceIds)
          );
        } else if (shouldExportGenericObject3(cell)) {
          genericObjects.push(exportGenericObject(cell));
        } else if (model.isEdge(cell)) {
          edgeObjects.push(exportEdgeObject(cell));
        }
      }
      try {
        return {
          diagramId: deps.trim(state.backendDiagramId),
          version: Math.max(0, state.backendDiagramVersion),
          updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
          objects: frameObjects.concat(cabinetObjects).concat(symbolObjects).concat(genericObjects),
          edges: edgeObjects
        };
      } finally {
        currentDuplicateSymbolInstanceIds = null;
        currentDuplicateFrameIds = null;
      }
    }
    function findCabinetSegmentForPort(logicalCabinetId, portId) {
      var segments = deps.findCabinetSegments(logicalCabinetId);
      var i;
      for (i = 0; i < segments.length; i++) {
        if (deps.getPortMetaById(segments[i], portId) != null) {
          return segments[i];
        }
      }
      return null;
    }
    function buildConstraintForPort(root, portId) {
      var port = null;
      if (deps.isElectricalRoot(root) || deps.isCabinetSegment(root)) {
        port = deps.getPortMetaById(root, portId);
        if (port == null) {
          return null;
        }
        return new mxConnectionConstraint(
          new mxPoint(port.x, port.y),
          false,
          port.id
        );
      }
      var binding = getGenericPortBindingById2(root, portId);
      return binding != null ? binding.constraint : null;
    }
    function buildConstraintFromSnapshotPort(ports, portId) {
      var target = deps.trim(portId);
      var i;
      if (!Array.isArray(ports) || target.length === 0) {
        return null;
      }
      for (i = 0; i < ports.length; i++) {
        if (deps.trim(ports[i].id) === target) {
          return new mxConnectionConstraint(
            new mxPoint(
              toNumber(ports[i].x, 0),
              toNumber(ports[i].y, 0)
            ),
            ports[i].perimeter !== false,
            ports[i].id,
            toNumber(ports[i].dx, 0),
            toNumber(ports[i].dy, 0)
          );
        }
      }
      return null;
    }
    function createGenericCellFromSnapshot(object) {
      var objectId = deps.trim(object != null ? object.id : "");
      var cell = new mxCell(
        deserializeCellValue(object.props != null ? object.props.value : null),
        deserializeGeometry(object.geometry),
        object.props != null ? object.props.style || "" : ""
      );
      cell.setId(normalizeGenericStableId(objectId));
      cell.vertex = object.props == null || object.props.vertex == null ? true : !!object.props.vertex;
      cell.edge = false;
      cell.setConnectable(
        object.props == null || object.props.connectable == null ? true : !!object.props.connectable
      );
      cell.visible = object.props == null || object.props.visible == null ? true : !!object.props.visible;
      cell.collapsed = object.props != null && object.props.collapsed != null ? !!object.props.collapsed : false;
      return cell;
    }
    function resolveImportedObjectParent(parentId, frameMap, symbolMap, genericMap) {
      var key = deps.trim(parentId);
      if (key.length == 0) {
        return graph.getDefaultParent();
      }
      return genericMap[key] || frameMap[key] || symbolMap[key] || null;
    }
    function resolveImportedEdgeTerminal(terminal, symbolMap, genericMap, cabinetLogicalIdMap) {
      var objectId = deps.trim(terminal != null ? terminal.objectId : "");
      var portId = deps.trim(terminal != null ? terminal.portId : "");
      if (objectId.length == 0) {
        return null;
      }
      if (genericMap[objectId] != null) {
        return genericMap[objectId];
      }
      if (symbolMap[objectId] != null) {
        return symbolMap[objectId];
      }
      if (portId.length > 0) {
        return findCabinetSegmentForPort(
          cabinetLogicalIdMap != null && cabinetLogicalIdMap[objectId] != null ? cabinetLogicalIdMap[objectId] : objectId,
          portId
        );
      }
      return null;
    }
    function restoreDiagramSnapshot2(snapshot) {
      snapshot = normalizeSnapshotGenericIds(snapshot);
      var frameObjects = [];
      var cabinetObjects = [];
      var symbolObjects = [];
      var genericObjects = [];
      var i;
      var frameMap = {};
      var symbolMap = {};
      var genericMap = {};
      state.suspendOperationRecording = true;
      deps.exitInstanceComposeMode(false);
      clearPageForImport();
      try {
        if (!deps.isObject(snapshot)) {
          throw new Error("\u540E\u7AEF\u8FD4\u56DE\u7684\u56FE\u7EB8\u6570\u636E\u65E0\u6548");
        }
        if (deps.trim(snapshot.rawGraphXml).length > 0 && (!Array.isArray(snapshot.objects) || snapshot.objects.length == 0) && (!Array.isArray(snapshot.edges) || snapshot.edges.length == 0)) {
          var legacyDoc = mxUtils.parseXml(snapshot.rawGraphXml);
          ui.editor.setGraphXml(legacyDoc.documentElement);
          graph.refresh();
          return;
        }
        if (Array.isArray(snapshot.objects)) {
          for (i = 0; i < snapshot.objects.length; i++) {
            var item = snapshot.objects[i];
            if (item.kind == "frame") {
              frameObjects.push(item);
            } else if (item.kind == "cabinet") {
              cabinetObjects.push(item);
            } else if (item.kind == "symbol") {
              symbolObjects.push(item);
            } else if (item.kind == "generic") {
              genericObjects.push(item);
            }
          }
        }
        state.updatingModel = true;
        model.beginUpdate();
        try {
          for (i = 0; i < frameObjects.length; i++) {
            var frameObject = frameObjects[i];
            var frame = deps.createDrawingFrameCell(
              frameObject.props != null ? frameObject.props.frameConfig : null,
              frameObject.props != null ? frameObject.props.pageNumber : 1,
              {
                frameId: frameObject.id,
                groupId: frameObject.groupId,
                originFrameId: frameObject.props != null ? frameObject.props.originFrameId : null,
                autoFrameOwner: frameObject.props != null ? frameObject.props.autoFrameOwner : null,
                autoFrameIndex: frameObject.props != null ? frameObject.props.autoFrameIndex : null
              }
            );
            frame.geometry = new mxGeometry(
              frameObject.geometry.x,
              frameObject.geometry.y,
              frameObject.geometry.width,
              frameObject.geometry.height
            );
            deps.addTopLevelCell(frame);
            frameMap[frameObject.id] = frame;
          }
          for (i = 0; i < cabinetObjects.length; i++) {
            var cabinetObject = cabinetObjects[i];
            var cabinetModel = deps.cloneJson(
              cabinetObject.props != null ? cabinetObject.props.cabinetModel : {}
            );
            cabinetModel.logicalCabinetId = deps.trim(
              cabinetObject.props != null ? cabinetObject.props.logicalCabinetId : null
            ) || cabinetObject.id;
            cabinetModel.originFrameId = deps.trim(
              cabinetObject.props != null ? cabinetObject.props.originFrameId : null
            ) || cabinetObject.parentId;
            cabinetModel.cabinetX = cabinetObject.geometry.x;
            cabinetModel.cabinetWidth = cabinetObject.geometry.width;
            deps.relayoutCabinetByModel(cabinetModel);
          }
          if (symbolObjects.length > 0) {
            var pendingSymbolObjects = symbolObjects.slice();
            var symbolSafetyCounter = 0;
            while (pendingSymbolObjects.length > 0 && symbolSafetyCounter < 1e3) {
              var nextPendingSymbols = [];
              var symbolProgressed = false;
              for (i = 0; i < pendingSymbolObjects.length; i++) {
                var symbolObject = pendingSymbolObjects[i];
                var symbolParent = resolveImportedObjectParent(
                  symbolObject.parentId,
                  frameMap,
                  symbolMap,
                  genericMap
                );
                if (symbolParent == null) {
                  nextPendingSymbols.push(symbolObject);
                  continue;
                }
                var spec = deps.normalizeSpec(
                  deps.cloneJson(
                    symbolObject.props != null ? symbolObject.props.spec : {}
                  )
                );
                var root = deps.buildSymbolCell(spec);
                root.geometry = new mxGeometry(
                  symbolObject.geometry.x,
                  symbolObject.geometry.y,
                  symbolObject.geometry.width,
                  symbolObject.geometry.height
                );
                model.add(symbolParent, root);
                symbolMap[symbolObject.id] = root;
                symbolProgressed = true;
              }
              if (!symbolProgressed) {
                for (i = 0; i < nextPendingSymbols.length; i++) {
                  var fallbackSpec = deps.normalizeSpec(
                    deps.cloneJson(
                      nextPendingSymbols[i].props != null ? nextPendingSymbols[i].props.spec : {}
                    )
                  );
                  var fallbackRoot = deps.buildSymbolCell(fallbackSpec);
                  fallbackRoot.geometry = new mxGeometry(
                    nextPendingSymbols[i].geometry.x,
                    nextPendingSymbols[i].geometry.y,
                    nextPendingSymbols[i].geometry.width,
                    nextPendingSymbols[i].geometry.height
                  );
                  deps.addTopLevelCell(fallbackRoot);
                  symbolMap[nextPendingSymbols[i].id] = fallbackRoot;
                }
                break;
              }
              pendingSymbolObjects = nextPendingSymbols;
              symbolSafetyCounter += 1;
            }
          }
          if (genericObjects.length > 0) {
            var pendingGenericObjects = genericObjects.slice();
            var safetyCounter = 0;
            while (pendingGenericObjects.length > 0 && safetyCounter < 1e3) {
              var nextPending = [];
              var progressed = false;
              for (i = 0; i < pendingGenericObjects.length; i++) {
                var genericObject = pendingGenericObjects[i];
                var parent = resolveImportedObjectParent(
                  genericObject.parentId,
                  frameMap,
                  symbolMap,
                  genericMap
                );
                if (parent == null) {
                  nextPending.push(genericObject);
                  continue;
                }
                var genericCell = createGenericCellFromSnapshot(genericObject);
                model.add(parent, genericCell);
                genericMap[genericObject.id] = genericCell;
                progressed = true;
              }
              if (!progressed) {
                for (i = 0; i < nextPending.length; i++) {
                  var fallbackCell = createGenericCellFromSnapshot(nextPending[i]);
                  deps.addTopLevelCell(fallbackCell);
                  genericMap[nextPending[i].id] = fallbackCell;
                }
                break;
              }
              pendingGenericObjects = nextPending;
              safetyCounter += 1;
            }
          }
          if (Array.isArray(snapshot.edges)) {
            var cabinetLogicalIdMap = {};
            var genericPortsMap = {};
            for (i = 0; i < genericObjects.length; i++) {
              var gobj = genericObjects[i];
              if (gobj.props != null && Array.isArray(gobj.props.ports) && gobj.props.ports.length > 0) {
                genericPortsMap[gobj.id] = gobj.props.ports;
              }
            }
            for (i = 0; i < cabinetObjects.length; i++) {
              var edgeCabinetObject = cabinetObjects[i];
              var edgeCabinetLogicalId = deps.trim(
                edgeCabinetObject.props != null ? edgeCabinetObject.props.logicalCabinetId : null
              ) || edgeCabinetObject.id;
              cabinetLogicalIdMap[edgeCabinetObject.id] = edgeCabinetLogicalId;
            }
            for (i = 0; i < snapshot.edges.length; i++) {
              var edgeObject = snapshot.edges[i];
              var sourceRoot = resolveImportedEdgeTerminal(
                edgeObject.source,
                symbolMap,
                genericMap,
                cabinetLogicalIdMap
              );
              var targetRoot = resolveImportedEdgeTerminal(
                edgeObject.target,
                symbolMap,
                genericMap,
                cabinetLogicalIdMap
              );
              var style = edgeObject.props != null && edgeObject.props.style != null && deps.trim(edgeObject.props.style.raw).length > 0 ? edgeObject.props.style.raw : "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;";
              var edgeParent = resolveImportedObjectParent(
                edgeObject.props != null ? edgeObject.props.parentId : null,
                frameMap,
                symbolMap,
                genericMap
              );
              var edge = graph.insertEdge(
                edgeParent != null ? edgeParent : graph.getDefaultParent(),
                edgeObject.id,
                deserializeCellValue(
                  edgeObject.props != null ? edgeObject.props.value : null
                ),
                sourceRoot,
                targetRoot,
                style
              );
              var sourceConstraint = buildConstraintForPort(
                sourceRoot,
                edgeObject.source.portId
              );
              var targetConstraint = buildConstraintForPort(
                targetRoot,
                edgeObject.target.portId
              );
              if (sourceConstraint == null && sourceRoot != null && edgeObject.source != null) {
                sourceConstraint = buildConstraintFromSnapshotPort(
                  genericPortsMap[deps.trim(edgeObject.source.objectId)],
                  edgeObject.source.portId
                );
              }
              if (targetConstraint == null && targetRoot != null && edgeObject.target != null) {
                targetConstraint = buildConstraintFromSnapshotPort(
                  genericPortsMap[deps.trim(edgeObject.target.objectId)],
                  edgeObject.target.portId
                );
              }
              if (sourceConstraint != null) {
                graph.setConnectionConstraint(
                  edge,
                  sourceRoot,
                  true,
                  sourceConstraint
                );
              }
              if (targetConstraint != null) {
                graph.setConnectionConstraint(
                  edge,
                  targetRoot,
                  false,
                  targetConstraint
                );
              }
              model.setGeometry(
                edge,
                deserializeGeometry(
                  edgeObject.props != null ? edgeObject.props.geometry : null
                )
              );
            }
          }
        } finally {
          model.endUpdate();
          state.updatingModel = false;
        }
        graph.refresh();
      } finally {
        state.suspendOperationRecording = false;
        deps.resetPendingChangeRecords(exportDiagramSnapshot2());
      }
    }
    return {
      collectChangeObjectIds: collectChangeObjectIds2,
      collectGenericPortBindings: collectGenericPortBindings2,
      computeSnapshotChanges,
      deserializeCellValue,
      deserializeGeometry,
      exportDiagramSnapshot: exportDiagramSnapshot2,
      getEdgePortId: getEdgePortId2,
      getConstraintForPort: buildConstraintForPort,
      getGenericObjectId,
      getGenericPortBindingById: getGenericPortBindingById2,
      isPluginInternalCell: isPluginInternalCell3,
      normalizeGenericStableId,
      normalizeSnapshotGenericIds,
      restoreDiagramSnapshot: restoreDiagramSnapshot2,
      serializeCellValue,
      serializeGeometry,
      shouldExportGenericObject: shouldExportGenericObject3
    };
  }

  // domain/snapshot.js
  function getSnapshotDomain() {
    return createSnapshotDomain();
  }
  function collectChangeObjectIds() {
    return getSnapshotDomain().collectChangeObjectIds.apply(null, arguments);
  }
  function collectGenericPortBindings() {
    return getSnapshotDomain().collectGenericPortBindings.apply(null, arguments);
  }
  function exportDiagramSnapshot() {
    return getSnapshotDomain().exportDiagramSnapshot.apply(null, arguments);
  }
  function getEdgePortId() {
    return getSnapshotDomain().getEdgePortId.apply(null, arguments);
  }
  function getConstraintForPort() {
    return getSnapshotDomain().getConstraintForPort.apply(null, arguments);
  }
  function getGenericPortBindingById() {
    return getSnapshotDomain().getGenericPortBindingById.apply(null, arguments);
  }
  function isPluginInternalCell2() {
    return getSnapshotDomain().isPluginInternalCell.apply(null, arguments);
  }
  function restoreDiagramSnapshot() {
    return getSnapshotDomain().restoreDiagramSnapshot.apply(null, arguments);
  }
  function shouldExportGenericObject2() {
    return getSnapshotDomain().shouldExportGenericObject.apply(null, arguments);
  }
  var snapshotDomainApi = {
    collectChangeObjectIds,
    collectGenericPortBindings,
    computeSnapshotChanges,
    deserializeCellValue,
    deserializeGeometry,
    exportDiagramSnapshot,
    getConstraintForPort,
    getEdgePortId,
    getGenericObjectId,
    getGenericPortBindingById,
    isPluginInternalCell: isPluginInternalCell2,
    normalizeGenericStableId,
    normalizeSnapshotGenericIds,
    restoreDiagramSnapshot,
    serializeCellValue,
    serializeGeometry,
    shouldExportGenericObject: shouldExportGenericObject2
  };

  // domain/cabinetGraph.js
  function buildCabinetDeps() {
    var app = getApp();
    var ctx = app.ctx;
    var constants = ctx.constants;
    return {
      graph: ctx.graph,
      model: ctx.model,
      state: ctx.state,
      cabinetTag: constants.CABINET_TAG,
      cabinetType: constants.CABINET_TYPE,
      cabinetBodyTag: constants.CABINET_BODY_TAG,
      cabinetBodyKind: constants.CABINET_BODY_KIND,
      cabinetBlockTag: constants.CABINET_BLOCK_TAG,
      cabinetBlockKind: constants.CABINET_BLOCK_KIND,
      cabinetBusbarTag: constants.CABINET_BUSBAR_TAG,
      cabinetBusbarKind: constants.CABINET_BUSBAR_KIND,
      cabinetTextTag: constants.CABINET_TEXT_TAG,
      cabinetNameLabelKind: constants.CABINET_NAME_LABEL_KIND,
      cabinetLocationLabelKind: constants.CABINET_LOCATION_LABEL_KIND,
      cabinetDesignationLabelKind: constants.CABINET_DESIGNATION_LABEL_KIND,
      busbarWidth: constants.CABINET_BUSBAR_WIDTH,
      cabinetSwitchLinkTag: constants.CABINET_SWITCH_LINK_TAG,
      cabinetSwitchLinkKind: constants.CABINET_SWITCH_LINK_KIND,
      cabinetGapTag: constants.CABINET_GAP_TAG,
      cabinetGapType: constants.CABINET_GAP_TYPE,
      cabinetGapKind: constants.CABINET_GAP_KIND,
      frameLabelKind: constants.FRAME_LABEL_KIND,
      frameContentRatio: constants.FRAME_CONTENT_RATIO,
      frameMarginRatio: constants.FRAME_MARGIN_RATIO,
      frameHorizontalGap: constants.FRAME_HORIZONTAL_GAP,
      minPortFollowSpaceRatio: constants.CABINET_MIN_PORT_FOLLOW_SPACE_RATIO,
      defaultWidth: constants.CABINET_DEFAULT_WIDTH,
      minWidth: constants.CABINET_MIN_WIDTH,
      defaultBlockCount: constants.CABINET_DEFAULT_BLOCK_COUNT,
      blockMinHeight: constants.CABINET_BLOCK_MIN_HEIGHT,
      blockMaxHeight: constants.CABINET_BLOCK_MAX_HEIGHT,
      defaultX: constants.CABINET_DEFAULT_X,
      tailPadding: constants.CABINET_TAIL_PADDING,
      trim,
      toInt,
      toFloat,
      clamp,
      isObject,
      cloneJson,
      normalizePortPoint: specDomainApi.normalizePortPoint,
      generateLogicalCabinetId,
      createNode,
      createMetaCell,
      serializePortLayout: specDomainApi.serializePortLayout,
      getAttr,
      isCabinetSegment,
      isCabinetBlock,
      isCabinetGap,
      isCabinetSwitchLink,
      isElectricalRoot,
      buildSymbolCell: function(spec) {
        return symbolDomainApi.buildSymbolCell(spec);
      },
      getNormalizedFrameConfig: frameDomainApi.normalizeFrameConfig,
      getAllDrawingFrames: frameDomainApi.getAllDrawingFrames,
      getFrameConfig: frameDomainApi.getFrameConfig,
      getFrameGroupId: frameDomainApi.getFrameGroupId,
      getFramePageNumber: frameDomainApi.getFramePageNumber,
      getMaxFramePageNumberInGroup: frameDomainApi.getMaxFramePageNumberInGroup,
      getRightmostFrameInGroup: frameDomainApi.getRightmostFrameInGroup,
      findFrameById: frameDomainApi.findFrameById,
      findDrawingFrame: frameDomainApi.findDrawingFrame,
      createDrawingFrameCell: frameDomainApi.createDrawingFrameCell,
      addTopLevelCell: frameDomainApi.addTopLevelCell,
      getEdgePortId: function(edge, root, source) {
        return snapshotDomainApi.getEdgePortId(edge, root, source);
      },
      getPortMetaById: connectionConstraintsApi.getPortMetaById,
      parsePortLayout: specDomainApi.parsePortLayout,
      isMovableConnectedTerminal: connectionConstraintsApi.isMovableConnectedTerminal,
      moveCellToFrameByDelta: connectionConstraintsApi.moveCellToFrameByDelta,
      setConnectionConstraint: function(edge, root, source, constraint) {
        ctx.graph.setConnectionConstraint(edge, root, source, constraint);
      }
    };
  }
  function createCabinetDomain() {
    var deps = arguments.length > 0 ? arguments[0] : buildCabinetDeps();
    var model = deps.model;
    var state = deps.state;
    function findCabinetSegment2(cell) {
      while (cell != null) {
        if (deps.isCabinetSegment(cell)) {
          return cell;
        }
        cell = model.getParent(cell);
      }
      return null;
    }
    function createCabinetValueMetadata(node, cabinetModel, descriptor, frameId) {
      node.setAttribute("pluginType", deps.cabinetType);
      node.setAttribute(
        "logicalCabinetId",
        deps.trim(cabinetModel.logicalCabinetId)
      );
      node.setAttribute("originFrameId", deps.trim(cabinetModel.originFrameId));
      node.setAttribute("frameId", deps.trim(frameId));
      node.setAttribute("segmentIndex", String(descriptor.segmentIndex));
      node.setAttribute(
        "segmentStartOffset",
        String(Math.round(descriptor.segmentStartOffset * 1e3) / 1e3)
      );
      node.setAttribute(
        "segmentEndOffset",
        String(Math.round(descriptor.segmentEndOffset * 1e3) / 1e3)
      );
      node.setAttribute("cabinetModelJson", JSON.stringify(cabinetModel));
      var segmentPorts = deps.serializePortLayout(buildSegmentPortLayout(descriptor));
      node.setAttribute("portsJson", segmentPorts);
      node.setAttribute("portLayout", segmentPorts);
      node.setAttribute("label", "");
      return node;
    }
    function escapeLabelHtml(text) {
      return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
    function createCabinetDecorationCell(kind, style, geometry, label, tag) {
      var value = deps.createNode(tag || deps.cabinetTextTag);
      value.setAttribute("esKind", kind);
      value.setAttribute("label", label != null ? String(label) : "");
      var cell = new mxCell(value, geometry, style);
      cell.vertex = true;
      cell.setConnectable(false);
      return cell;
    }
    function buildCabinetDecorations(cabinetModel, descriptor) {
      var cells = [];
      var busbarX = descriptor.busbar.x;
      cells.push(
        createCabinetDecorationCell(
          deps.cabinetBusbarKind,
          makeCabinetBusbarStyle(),
          new mxGeometry(
            busbarX - Math.round(deps.busbarWidth / 2),
            descriptor.busbar.y,
            deps.busbarWidth,
            descriptor.busbar.height
          ),
          "",
          deps.cabinetBusbarTag
        )
      );
      var nameLabel = buildCabinetNameLabel(cabinetModel);
      if (nameLabel.length > 0 && busbarX > 8) {
        cells.push(
          createCabinetDecorationCell(
            deps.cabinetNameLabelKind,
            makeCabinetNameLabelStyle(),
            new mxGeometry(
              0,
              descriptor.busbar.y,
              Math.max(12, busbarX - Math.round(deps.busbarWidth / 2) - 2),
              descriptor.busbar.height
            ),
            escapeLabelHtml(nameLabel)
          )
        );
      }
      var designation = deps.trim(cabinetModel.designation);
      if (designation.length > 0 && cabinetModel.headPadding > 0) {
        cells.push(
          createCabinetDecorationCell(
            deps.cabinetDesignationLabelKind,
            makeCabinetDesignationLabelStyle(),
            new mxGeometry(
              busbarX,
              // 续接页的顶边折断会压到这块区域，编号要整体下移让开它
              (descriptor.topBreakDepth || 0) + 2,
              Math.max(20, descriptor.width - busbarX),
              Math.max(12, cabinetModel.headPadding - 6)
            ),
            escapeLabelHtml(designation)
          )
        );
      }
      if (descriptor.showLocation) {
        var lines = [];
        if (deps.trim(cabinetModel.locationNote).length > 0) {
          lines.push(deps.trim(cabinetModel.locationNote));
        }
        if (deps.trim(cabinetModel.location).length > 0) {
          lines.push(deps.trim(cabinetModel.location));
        }
        if (lines.length > 0) {
          var lineHeight = 14;
          var boxHeight = lines.length * lineHeight;
          var li;
          for (li = 0; li < lines.length; li++) {
            lines[li] = escapeLabelHtml(lines[li]);
          }
          cells.push(
            createCabinetDecorationCell(
              deps.cabinetLocationLabelKind,
              makeCabinetLocationLabelStyle(),
              new mxGeometry(0, -(boxHeight + 6), Math.max(80, descriptor.width), boxHeight),
              lines.join("<br>")
            )
          );
        }
      }
      return cells;
    }
    function createCabinetBlockCell(cabinetModel, block) {
      var value = deps.createNode(deps.cabinetBlockTag);
      value.setAttribute("esKind", deps.cabinetBlockKind);
      value.setAttribute("esKey", deps.trim(block.id));
      value.setAttribute("blockId", deps.trim(block.id));
      value.setAttribute("portId", deps.trim(block.portId));
      value.setAttribute(
        "logicalCabinetId",
        deps.trim(cabinetModel.logicalCabinetId)
      );
      value.setAttribute("switchInstanceId", deps.trim(block.switchInstanceId));
      value.setAttribute("blockOrder", String(block.order));
      value.setAttribute("blockHeight", String(Math.round(block.height)));
      value.setAttribute("label", deps.trim(block.title));
      value.setAttribute(
        "portsJson",
        deps.serializePortLayout([
          {
            // 出线接口在母线上，不在柜壁上
            id: block.portId,
            x: block.portX,
            y: 0.5,
            marker: "cross",
            direction: "right",
            ioMode: "out",
            order: block.order
          }
        ])
      );
      var cell = new mxCell(
        value,
        new mxGeometry(0, block.localY, block.width, block.height),
        makeCabinetBlockStyle()
      );
      cell.vertex = true;
      cell.setConnectable(true);
      return cell;
    }
    function getCellAbsoluteGeometry2(cell) {
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
        x,
        y,
        width: geometry != null ? geometry.width : 0,
        height: geometry != null ? geometry.height : 0
      };
    }
    function getPortAbsolutePosition2(root, port) {
      var geometry = getCellAbsoluteGeometry2(root);
      return {
        x: geometry.x + port.x * geometry.width,
        y: geometry.y + port.y * geometry.height
      };
    }
    function buildCabinetSegmentCell2(cabinetModel, frameId, descriptor) {
      var root = new mxCell(
        createCabinetValueMetadata(
          deps.createNode(deps.cabinetTag),
          cabinetModel,
          descriptor,
          frameId
        ),
        new mxGeometry(
          descriptor.x,
          descriptor.y,
          descriptor.width,
          descriptor.height
        ),
        // 柜段本身就是外框（含换页折断标识）
        makeCabinetRootStyle(descriptor)
      );
      var decorations = buildCabinetDecorations(cabinetModel, descriptor);
      var i;
      root.vertex = true;
      root.setConnectable(false);
      for (i = 0; i < decorations.length; i++) {
        root.insert(decorations[i]);
      }
      for (i = 0; i < descriptor.blocks.length; i++) {
        root.insert(createCabinetBlockCell(cabinetModel, descriptor.blocks[i]));
      }
      return root;
    }
    function extractCabinetModel2(cell) {
      var root = findCabinetSegment2(cell);
      var raw;
      if (root == null) {
        throw new Error("\u672A\u627E\u5230\u914D\u7535\u67DC\u7247\u6BB5");
      }
      raw = deps.getAttr(root, "cabinetModelJson");
      if (raw == null || raw.length == 0) {
        throw new Error("\u7F3A\u5C11 cabinetModelJson \u6570\u636E");
      }
      var frame = deps.findDrawingFrame(root);
      return normalizeCabinetModel(
        JSON.parse(raw),
        frame != null ? deps.getFrameConfig(frame) : null
      );
    }
    function findCabinetSegments2(logicalCabinetId) {
      var target = deps.trim(logicalCabinetId);
      var frames = deps.getAllDrawingFrames();
      var result = [];
      var i;
      var j;
      for (i = 0; i < frames.length; i++) {
        for (j = 0; j < model.getChildCount(frames[i]); j++) {
          var child = model.getChildAt(frames[i], j);
          if (deps.isCabinetSegment(child) && deps.trim(deps.getAttr(child, "logicalCabinetId")) == target) {
            result.push(child);
          }
        }
      }
      return result;
    }
    function getSegmentBlocks2(segment) {
      var result = [];
      var count = model.getChildCount(segment);
      var i;
      for (i = 0; i < count; i++) {
        var child = model.getChildAt(segment, i);
        if (deps.isCabinetBlock(child)) {
          result.push(child);
        }
      }
      return result;
    }
    function collectCabinetAttachments2(segments) {
      var seen = {};
      var attachments = [];
      var i;
      var j;
      var k;
      for (i = 0; i < segments.length; i++) {
        var hosts = getSegmentBlocks2(segments[i]);
        hosts.push(segments[i]);
        for (j = 0; j < hosts.length; j++) {
          var host = hosts[j];
          var edgeCount = model.getEdgeCount(host);
          for (k = 0; k < edgeCount; k++) {
            var edge = model.getEdgeAt(host, k);
            var sourceIsHost = model.getTerminal(edge, true) == host;
            var targetIsHost = model.getTerminal(edge, false) == host;
            if (!sourceIsHost && !targetIsHost) {
              continue;
            }
            var key = mxCellPath.create(edge) + ":" + (sourceIsHost ? "S" : "T");
            if (seen[key]) {
              continue;
            }
            seen[key] = true;
            var source = sourceIsHost;
            var portId = deps.getEdgePortId(edge, host, source);
            var port = deps.getPortMetaById(host, portId);
            if (port == null) {
              continue;
            }
            attachments.push({
              edge,
              source,
              portId,
              oldPortPosition: getPortAbsolutePosition2(host, port),
              otherTerminal: model.getTerminal(edge, !source)
            });
          }
        }
      }
      return attachments;
    }
    function buildCabinetPortMap2(segments) {
      var result = {};
      var i;
      var j;
      var k;
      for (i = 0; i < segments.length; i++) {
        var segment = segments[i];
        var frame = deps.findDrawingFrame(segment);
        var blocks = getSegmentBlocks2(segment);
        for (j = 0; j < blocks.length; j++) {
          var block = blocks[j];
          var ports = deps.parsePortLayout(deps.getAttr(block, "portsJson"));
          for (k = 0; k < ports.length; k++) {
            result[deps.trim(ports[k].id)] = {
              segment,
              host: block,
              port: ports[k],
              frame,
              absolutePosition: getPortAbsolutePosition2(block, ports[k])
            };
          }
        }
      }
      return result;
    }
    function restoreCabinetAttachments2(attachments, newPortMap) {
      var movedTerminals = {};
      var i;
      for (i = 0; i < attachments.length; i++) {
        var attachment = attachments[i];
        var target = newPortMap[deps.trim(attachment.portId)];
        if (target == null) {
          continue;
        }
        model.setTerminal(attachment.edge, target.host, attachment.source);
        deps.setConnectionConstraint(
          attachment.edge,
          target.host,
          attachment.source,
          new mxConnectionConstraint(
            new mxPoint(target.port.x, target.port.y),
            false,
            target.port.id
          )
        );
        var edgeGeometry = model.getGeometry(attachment.edge);
        if (edgeGeometry != null && edgeGeometry.points != null) {
          edgeGeometry = edgeGeometry.clone();
          edgeGeometry.points = null;
          model.setGeometry(attachment.edge, edgeGeometry);
        }
        if (deps.isMovableConnectedTerminal(attachment.otherTerminal)) {
          var moveKey = mxObjectIdentity.get(attachment.otherTerminal);
          if (!movedTerminals[moveKey]) {
            movedTerminals[moveKey] = true;
            deps.moveCellToFrameByDelta(
              attachment.otherTerminal,
              target.frame,
              target.absolutePosition.x - attachment.oldPortPosition.x,
              target.absolutePosition.y - attachment.oldPortPosition.y
            );
          }
        }
      }
    }
    function findAutoFramesForCabinet(originFrameId, logicalCabinetId) {
      var frames = deps.getAllDrawingFrames();
      var result = [];
      var i;
      for (i = 0; i < frames.length; i++) {
        if (deps.trim(deps.getAttr(frames[i], "originFrameId")) == deps.trim(originFrameId) && deps.trim(deps.getAttr(frames[i], "autoFrameOwner")) == deps.trim(logicalCabinetId)) {
          result.push(frames[i]);
        }
      }
      result.sort(function(a, b) {
        return deps.toInt(deps.getAttr(a, "autoFrameIndex"), 0) - deps.toInt(deps.getAttr(b, "autoFrameIndex"), 0);
      });
      return result;
    }
    function frameHasOnlyCabinetChildren(frame, logicalCabinetId) {
      var i;
      for (i = 0; i < model.getChildCount(frame); i++) {
        var child = model.getChildAt(frame, i);
        if (deps.getAttr(child, "esKind") == deps.frameLabelKind) {
          continue;
        }
        if (deps.isCabinetSegment(child) && deps.trim(deps.getAttr(child, "logicalCabinetId")) == deps.trim(logicalCabinetId)) {
          continue;
        }
        return false;
      }
      return true;
    }
    function ensureCabinetFrames(originFrame, cabinetModel, pageCount, skipCleanup) {
      var originFrameId = deps.trim(deps.getAttr(originFrame, "frameId"));
      var originGroupId = deps.getFrameGroupId(originFrame);
      var logicalCabinetId = deps.trim(cabinetModel.logicalCabinetId);
      var config = deps.getFrameConfig(originFrame);
      var autoFrames = findAutoFramesForCabinet(originFrameId, logicalCabinetId);
      var frames = [originFrame];
      var previousFrame = originFrame;
      var i;
      for (i = 1; i < pageCount; i++) {
        var frame = autoFrames.length >= i ? autoFrames[i - 1] : null;
        if (frame == null) {
          var rightmostInGroup = deps.getRightmostFrameInGroup(originGroupId);
          var rightmostGeometry = rightmostInGroup != null ? model.getGeometry(rightmostInGroup) : null;
          frame = deps.createDrawingFrameCell(
            config,
            Math.max(
              deps.getMaxFramePageNumberInGroup(originGroupId),
              deps.getFramePageNumber(previousFrame)
            ) + 1,
            {
              originFrameId,
              groupId: originGroupId,
              autoFrameOwner: logicalCabinetId,
              autoFrameIndex: i
            }
          );
          frame.geometry = frame.geometry.clone();
          frame.geometry.x = Math.max(
            model.getGeometry(previousFrame).x + config.width + deps.frameHorizontalGap,
            rightmostGeometry != null ? rightmostGeometry.x + rightmostGeometry.width + deps.frameHorizontalGap : model.getGeometry(previousFrame).x + config.width + deps.frameHorizontalGap
          );
          frame.geometry.y = model.getGeometry(previousFrame).y;
          deps.addTopLevelCell(frame);
        }
        frames.push(frame);
        previousFrame = frame;
      }
      if (!skipCleanup) {
        for (i = pageCount; i <= autoFrames.length; i++) {
          var extraFrame = autoFrames[i - 1];
          if (extraFrame != null && frameHasOnlyCabinetChildren(extraFrame, logicalCabinetId)) {
            model.remove(extraFrame);
          }
        }
      }
      return frames;
    }
    function relayoutCabinetByModel2(cabinetModel) {
      var probe = normalizeCabinetModel(cabinetModel);
      var originFrame = deps.findFrameById(probe.originFrameId);
      if (originFrame == null) {
        throw new Error("\u672A\u627E\u5230\u914D\u7535\u67DC\u6240\u5C5E\u7684\u8D77\u59CB\u56FE\u6846");
      }
      var frameConfig = deps.getFrameConfig(originFrame);
      var normalized = normalizeCabinetModel(cabinetModel, frameConfig);
      var descriptors = buildCabinetPageDescriptors(normalized, frameConfig);
      var oldSegments = findCabinetSegments2(normalized.logicalCabinetId);
      var attachments = collectCabinetAttachments2(oldSegments);
      var frames;
      var newSegments = [];
      var i;
      frames = ensureCabinetFrames(
        originFrame,
        normalized,
        descriptors.length,
        true
      );
      for (i = 0; i < descriptors.length; i++) {
        var segment = buildCabinetSegmentCell2(
          normalized,
          deps.trim(deps.getAttr(frames[i], "frameId")),
          descriptors[i]
        );
        model.add(frames[i], segment);
        newSegments.push(segment);
      }
      restoreCabinetAttachments2(attachments, buildCabinetPortMap2(newSegments));
      for (i = 0; i < oldSegments.length; i++) {
        model.remove(oldSegments[i]);
      }
      ensureCabinetFrames(originFrame, normalized, descriptors.length);
      syncBoundSwitches(newSegments);
      return newSegments;
    }
    function findSwitchCellByInstanceId2(instanceId) {
      var target = deps.trim(instanceId);
      if (target.length == 0) {
        return null;
      }
      var frames = deps.getAllDrawingFrames();
      var i;
      var j;
      for (i = 0; i < frames.length; i++) {
        for (j = 0; j < model.getChildCount(frames[i]); j++) {
          var child = model.getChildAt(frames[i], j);
          if (deps.isElectricalRoot(child) && deps.trim(deps.getAttr(child, "instanceId")) == target) {
            return child;
          }
        }
      }
      return null;
    }
    function findSwitchInputPort(switchCell) {
      var ports = deps.parsePortLayout(deps.getAttr(switchCell, "portsJson"));
      var fallback = null;
      var i;
      for (i = 0; i < ports.length; i++) {
        if (deps.trim(ports[i].ioMode) == "in") {
          return ports[i];
        }
        if (fallback == null || ports[i].x < fallback.x) {
          fallback = ports[i];
        }
      }
      return fallback;
    }
    function placeSwitchInBlock(blockCell, switchCell) {
      var frame = deps.findDrawingFrame(blockCell);
      if (frame == null) {
        return;
      }
      var blockRect = getCellAbsoluteGeometry2(blockCell);
      var switchGeometry = model.getGeometry(switchCell);
      if (switchGeometry == null) {
        return;
      }
      var cabinetModel = extractCabinetModel2(blockCell);
      var busbarX = Math.round(blockRect.width * cabinetModel.busbarRatio);
      var placement = computeSwitchPlacementInBlock(
        blockRect,
        { width: switchGeometry.width, height: switchGeometry.height },
        { busbarX, switchLead: cabinetModel.switchLead }
      );
      var frameRect = getCellAbsoluteGeometry2(frame);
      var nextGeometry = switchGeometry.clone();
      nextGeometry.x = blockRect.x + placement.x - frameRect.x;
      nextGeometry.y = blockRect.y + placement.y - frameRect.y;
      nextGeometry.width = placement.width;
      if (model.getParent(switchCell) !== frame) {
        model.add(frame, switchCell);
      }
      model.setGeometry(switchCell, nextGeometry);
      ensureSwitchAboveCabinet(frame, switchCell);
    }
    function ensureSwitchAboveCabinet(frame, switchCell) {
      var count = model.getChildCount(frame);
      var lastSegmentIndex = -1;
      var switchIndex = -1;
      var i;
      for (i = 0; i < count; i++) {
        var child = model.getChildAt(frame, i);
        if (deps.isCabinetSegment(child)) {
          lastSegmentIndex = i;
        } else if (child === switchCell) {
          switchIndex = i;
        }
      }
      if (switchIndex >= 0 && switchIndex < lastSegmentIndex) {
        model.add(frame, switchCell);
      }
    }
    function findSwitchLink(blockCell) {
      var edgeCount = model.getEdgeCount(blockCell);
      var i;
      for (i = 0; i < edgeCount; i++) {
        var edge = model.getEdgeAt(blockCell, i);
        if (deps.isCabinetSwitchLink(edge)) {
          return edge;
        }
      }
      return null;
    }
    function ensureSwitchLink(blockCell, switchCell) {
      var frame = deps.findDrawingFrame(blockCell);
      if (frame == null || switchCell == null) {
        return null;
      }
      var blockPortId = deps.trim(deps.getAttr(blockCell, "portId"));
      var blockPorts = deps.parsePortLayout(deps.getAttr(blockCell, "portsJson"));
      var blockPort = blockPorts.length > 0 ? blockPorts[0] : null;
      var switchPort = findSwitchInputPort(switchCell);
      var edge = findSwitchLink(blockCell);
      if (edge == null) {
        var value = deps.createNode(deps.cabinetSwitchLinkTag);
        value.setAttribute("esKind", deps.cabinetSwitchLinkKind);
        value.setAttribute("label", "");
        edge = new mxCell(value, new mxGeometry(), makeCabinetSwitchLinkStyle());
        edge.edge = true;
        model.add(frame, edge);
      }
      edge.value.setAttribute("blockId", deps.trim(deps.getAttr(blockCell, "blockId")));
      edge.value.setAttribute(
        "logicalCabinetId",
        deps.trim(deps.getAttr(blockCell, "logicalCabinetId"))
      );
      edge.value.setAttribute(
        "switchInstanceId",
        deps.trim(deps.getAttr(switchCell, "instanceId"))
      );
      model.setTerminal(edge, blockCell, true);
      model.setTerminal(edge, switchCell, false);
      if (blockPort != null) {
        deps.setConnectionConstraint(
          edge,
          blockCell,
          true,
          new mxConnectionConstraint(
            new mxPoint(blockPort.x, blockPort.y),
            false,
            blockPortId
          )
        );
      }
      if (switchPort != null) {
        deps.setConnectionConstraint(
          edge,
          switchCell,
          false,
          new mxConnectionConstraint(
            new mxPoint(switchPort.x, switchPort.y),
            false,
            deps.trim(switchPort.id)
          )
        );
      }
      return edge;
    }
    function syncBoundSwitches(segments) {
      var i;
      var j;
      for (i = 0; i < segments.length; i++) {
        var blocks = getSegmentBlocks2(segments[i]);
        for (j = 0; j < blocks.length; j++) {
          var blockCell = blocks[j];
          var instanceId = deps.trim(deps.getAttr(blockCell, "switchInstanceId"));
          if (instanceId.length == 0) {
            continue;
          }
          var switchCell = findSwitchCellByInstanceId2(instanceId);
          if (switchCell == null) {
            continue;
          }
          placeSwitchInBlock(blockCell, switchCell);
          ensureSwitchLink(blockCell, switchCell);
        }
      }
    }
    function bindSwitchToBlock2(blockCell, spec) {
      var segment = findCabinetSegment2(blockCell);
      var frame = deps.findDrawingFrame(blockCell);
      if (segment == null || frame == null || spec == null) {
        return null;
      }
      var blockId = deps.trim(deps.getAttr(blockCell, "blockId"));
      var nextModel = setBlockSwitchBinding(extractCabinetModel2(segment), blockId, {
        instanceId: deps.trim(spec.instanceId),
        symbolId: deps.trim(spec.symbolId)
      });
      if (nextModel == null) {
        return null;
      }
      unbindSwitchFromBlock2(blockCell, true, true);
      var switchCell = deps.buildSymbolCell(spec);
      model.add(frame, switchCell);
      placeSwitchInBlock(blockCell, switchCell);
      var segments = relayoutCabinetByModel2(nextModel);
      return { segments, switchCell };
    }
    function unbindSwitchFromBlock2(blockCell, removeSwitch, skipRelayout) {
      var segment = findCabinetSegment2(blockCell);
      if (segment == null) {
        return null;
      }
      var instanceId = deps.trim(deps.getAttr(blockCell, "switchInstanceId"));
      var link = findSwitchLink(blockCell);
      if (link != null) {
        model.remove(link);
      }
      if (removeSwitch && instanceId.length > 0) {
        var switchCell = findSwitchCellByInstanceId2(instanceId);
        if (switchCell != null) {
          model.remove(switchCell);
        }
      }
      if (skipRelayout) {
        return null;
      }
      var blockId = deps.trim(deps.getAttr(blockCell, "blockId"));
      var nextModel = setBlockSwitchBinding(extractCabinetModel2(segment), blockId, null);
      return nextModel != null ? relayoutCabinetByModel2(nextModel) : null;
    }
    function insertCabinetBlockAfter2(blockCell, blockInit) {
      var segment = findCabinetSegment2(blockCell);
      if (segment == null) {
        return null;
      }
      var nextModel = insertBlockAfter(
        extractCabinetModel2(segment),
        deps.getAttr(blockCell, "blockId"),
        blockInit
      );
      if (nextModel == null) {
        return null;
      }
      return relayoutCabinetByModel2(nextModel);
    }
    function applyCabinetBlockHeight2(blockCell, height) {
      var segment = findCabinetSegment2(blockCell);
      if (segment == null) {
        return null;
      }
      var cabinetModel = extractCabinetModel2(segment);
      var blockId = deps.trim(deps.getAttr(blockCell, "blockId"));
      var nextHeight = deps.clamp(
        Math.round(height),
        deps.blockMinHeight,
        deps.blockMaxHeight
      );
      var i;
      for (i = 0; i < cabinetModel.blocks.length; i++) {
        if (cabinetModel.blocks[i].id != blockId) {
          continue;
        }
        if (cabinetModel.blocks[i].height == nextHeight) {
          return null;
        }
        cabinetModel.blocks[i].height = nextHeight;
        return relayoutCabinetByModel2(cabinetModel);
      }
      return null;
    }
    function applyCabinetWidth2(cell, width) {
      var segment = findCabinetSegment2(cell);
      if (segment == null) {
        return null;
      }
      var cabinetModel = extractCabinetModel2(segment);
      var nextWidth = Math.max(deps.minWidth, Math.round(width));
      if (cabinetModel.cabinetWidth == nextWidth) {
        return null;
      }
      cabinetModel.cabinetWidth = nextWidth;
      return relayoutCabinetByModel2(cabinetModel);
    }
    return {
      applyCabinetBlockHeight: applyCabinetBlockHeight2,
      applyCabinetWidth: applyCabinetWidth2,
      bindSwitchToBlock: bindSwitchToBlock2,
      findSwitchCellByInstanceId: findSwitchCellByInstanceId2,
      findSwitchLink,
      insertCabinetBlockAfter: insertCabinetBlockAfter2,
      syncBoundSwitches,
      unbindSwitchFromBlock: unbindSwitchFromBlock2,
      buildCabinetPageDescriptors,
      buildCabinetPortMap: buildCabinetPortMap2,
      buildCabinetSegmentCell: buildCabinetSegmentCell2,
      collectCabinetAttachments: collectCabinetAttachments2,
      extractCabinetModel: extractCabinetModel2,
      findCabinetSegment: findCabinetSegment2,
      findCabinetSegments: findCabinetSegments2,
      getSegmentBlocks: getSegmentBlocks2,
      getCellAbsoluteGeometry: getCellAbsoluteGeometry2,
      getPortAbsolutePosition: getPortAbsolutePosition2,
      normalizeCabinetModel,
      relayoutCabinetByModel: relayoutCabinetByModel2,
      restoreCabinetAttachments: restoreCabinetAttachments2
    };
  }

  // domain/cabinet.js
  function getCabinetDomain() {
    return createCabinetDomain();
  }
  function buildCabinetPageDescriptors2() {
    return getCabinetDomain().buildCabinetPageDescriptors.apply(null, arguments);
  }
  function buildCabinetPortMap() {
    return getCabinetDomain().buildCabinetPortMap.apply(null, arguments);
  }
  function buildCabinetSegmentCell() {
    return getCabinetDomain().buildCabinetSegmentCell.apply(null, arguments);
  }
  function collectCabinetAttachments() {
    return getCabinetDomain().collectCabinetAttachments.apply(null, arguments);
  }
  function extractCabinetModel() {
    return getCabinetDomain().extractCabinetModel.apply(null, arguments);
  }
  function findCabinetSegment() {
    return getCabinetDomain().findCabinetSegment.apply(null, arguments);
  }
  function findCabinetSegments() {
    return getCabinetDomain().findCabinetSegments.apply(null, arguments);
  }
  function getCellAbsoluteGeometry() {
    return getCabinetDomain().getCellAbsoluteGeometry.apply(null, arguments);
  }
  function getPortAbsolutePosition() {
    return getCabinetDomain().getPortAbsolutePosition.apply(null, arguments);
  }
  function relayoutCabinetByModel() {
    return getCabinetDomain().relayoutCabinetByModel.apply(null, arguments);
  }
  function restoreCabinetAttachments() {
    return getCabinetDomain().restoreCabinetAttachments.apply(null, arguments);
  }
  function applyCabinetBlockHeight() {
    return getCabinetDomain().applyCabinetBlockHeight.apply(null, arguments);
  }
  function applyCabinetWidth() {
    return getCabinetDomain().applyCabinetWidth.apply(null, arguments);
  }
  function bindSwitchToBlock() {
    return getCabinetDomain().bindSwitchToBlock.apply(null, arguments);
  }
  function unbindSwitchFromBlock() {
    return getCabinetDomain().unbindSwitchFromBlock.apply(null, arguments);
  }
  function findSwitchCellByInstanceId() {
    return getCabinetDomain().findSwitchCellByInstanceId.apply(null, arguments);
  }
  function insertCabinetBlockAfter() {
    return getCabinetDomain().insertCabinetBlockAfter.apply(null, arguments);
  }
  function getSegmentBlocks() {
    return getCabinetDomain().getSegmentBlocks.apply(null, arguments);
  }
  var cabinetDomainApi = {
    applyCabinetBlockHeight,
    applyCabinetWidth,
    bindSwitchToBlock,
    buildCabinetPageDescriptors: buildCabinetPageDescriptors2,
    findSwitchCellByInstanceId,
    buildCabinetPortMap,
    buildCabinetSegmentCell,
    collectCabinetAttachments,
    extractCabinetModel,
    findCabinetSegment,
    findCabinetSegments,
    getCellAbsoluteGeometry,
    getPortAbsolutePosition,
    getSegmentBlocks,
    insertCabinetBlockAfter,
    unbindSwitchFromBlock,
    normalizeCabinetModel,
    relayoutCabinetByModel,
    restoreCabinetAttachments
  };

  // runtime/connectionConstraints.js
  function getConstraintDeps() {
    var app = getApp();
    var ctx = app.ctx;
    return {
      ctx,
      trim,
      clamp,
      parsePortLayout: specDomainApi.parsePortLayout,
      getAttr,
      buildPortLayout: specDomainApi.buildPortLayout,
      findPortHostRoot,
      normalizePortDirection: specDomainApi.normalizePortDirection,
      normalizePortIoMode: specDomainApi.normalizePortIoMode,
      isDrawingFrame,
      isCabinetSegment,
      isCabinetGap,
      findDrawingFrame: frameDomainApi.findDrawingFrame,
      getCellAbsoluteGeometry: function(cell) {
        return cabinetDomainApi.getCellAbsoluteGeometry(cell);
      },
      getPortAbsolutePosition: function(root, port) {
        return cabinetDomainApi.getPortAbsolutePosition(root, port);
      }
    };
  }
  function getConstraintRuntime() {
    var deps = getConstraintDeps();
    var ctx = deps.ctx;
    var graph = ctx.graph;
    return {
      deps,
      graph,
      model: ctx.model,
      state: ctx.state,
      oldGetAllConnectionConstraints: graph.getAllConnectionConstraints,
      oldSetConnectionConstraint: graph.setConnectionConstraint,
      oldValidateConnection: graph.connectionHandler.validateConnection
    };
  }
  function getElectricalConstraints(cell) {
    var runtime = getConstraintRuntime();
    var deps = runtime.deps;
    var root = deps.findPortHostRoot(cell);
    var layout;
    var constraints = [];
    var i;
    if (root == null) {
      return null;
    }
    layout = deps.buildPortLayout(
      { ports: deps.parsePortLayout(deps.getAttr(root, "portsJson")) },
      deps.parsePortLayout(deps.getAttr(root, "portLayout"))
    );
    for (i = 0; i < layout.length; i++) {
      var point = layout[i];
      constraints.push(
        new mxConnectionConstraint(
          new mxPoint(point.x, point.y),
          false,
          point.id || "port:" + i
        )
      );
    }
    return constraints;
  }
  function getPortMetaByConstraint(root, constraint) {
    var deps = getConstraintRuntime().deps;
    var ports = deps.parsePortLayout(deps.getAttr(root, "portsJson"));
    var name = constraint != null ? deps.trim(constraint.name) : "";
    var i;
    for (i = 0; i < ports.length; i++) {
      if (deps.trim(ports[i].id) == name) {
        return ports[i];
      }
    }
    return null;
  }
  function getPortMetaById(root, portId) {
    var deps = getConstraintRuntime().deps;
    var ports = deps.parsePortLayout(deps.getAttr(root, "portsJson"));
    var target = deps.trim(portId);
    var i;
    for (i = 0; i < ports.length; i++) {
      if (deps.trim(ports[i].id) == target) {
        return ports[i];
      }
    }
    return null;
  }
  function mapPortDirectionToConstraint(direction) {
    var normalizePortDirection2 = getConstraintRuntime().deps.normalizePortDirection;
    switch (normalizePortDirection2(direction)) {
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
    var normalizePortIoMode2 = getConstraintRuntime().deps.normalizePortIoMode;
    if (sourcePort != null && normalizePortIoMode2(sourcePort.ioMode) == "in") {
      return "\u8BE5\u7AEF\u5B50\u4EC5\u5141\u8BB8\u63A5\u5165\uFF0C\u4E0D\u80FD\u4F5C\u4E3A\u8FDE\u7EBF\u8D77\u70B9";
    }
    if (targetPort != null && normalizePortIoMode2(targetPort.ioMode) == "out") {
      return "\u8BE5\u7AEF\u5B50\u4EC5\u5141\u8BB8\u63A5\u51FA\uFF0C\u4E0D\u80FD\u4F5C\u4E3A\u8FDE\u7EBF\u7EC8\u70B9";
    }
    return null;
  }
  function applyNativeConnectionConstraint(edge, terminal, source, constraint) {
    var runtime = getConstraintRuntime();
    runtime.oldSetConnectionConstraint.call(
      runtime.graph,
      edge,
      terminal,
      source,
      constraint
    );
  }
  function isMovableConnectedTerminal(cell) {
    var runtime = getConstraintRuntime();
    var deps = runtime.deps;
    var model = runtime.model;
    return cell != null && model.isVertex(cell) && !deps.isDrawingFrame(cell) && !deps.isCabinetSegment(cell) && !deps.isCabinetGap(cell);
  }
  function clampCellGeometryToFrame(geometry, frame) {
    var runtime = getConstraintRuntime();
    var deps = runtime.deps;
    var model = runtime.model;
    var frameGeometry = model.getGeometry(frame);
    var nextGeometry = geometry.clone();
    var padding = 12;
    var minX = padding;
    var minY = padding;
    var maxX = Math.max(minX, frameGeometry.width - geometry.width - padding);
    var maxY = Math.max(minY, frameGeometry.height - geometry.height - padding);
    nextGeometry.x = deps.clamp(nextGeometry.x, minX, maxX);
    nextGeometry.y = deps.clamp(nextGeometry.y, minY, maxY);
    return nextGeometry;
  }
  function moveCellToFrameByDelta(cell, targetFrame, deltaX, deltaY) {
    var runtime = getConstraintRuntime();
    var deps = runtime.deps;
    var model = runtime.model;
    if (!isMovableConnectedTerminal(cell) || targetFrame == null) {
      return;
    }
    var geometry = model.getGeometry(cell);
    if (geometry == null) {
      return;
    }
    var currentFrame = deps.findDrawingFrame(cell);
    var absolute = deps.getCellAbsoluteGeometry(cell);
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
    var model = getConstraintRuntime().model;
    var queue = [];
    var vertexMap = {};
    var edgeMap = {};
    var vertices = [];
    var edges = [];
    var i;
    if (!isMovableConnectedTerminal(startCell)) {
      return {
        vertices,
        edges
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
      vertices,
      edges
    };
  }
  function getCellsAbsoluteBounds(cells) {
    var getCellAbsoluteGeometry2 = getConstraintRuntime().deps.getCellAbsoluteGeometry;
    var bounds = null;
    var i;
    for (i = 0; i < cells.length; i++) {
      var geometry = getCellAbsoluteGeometry2(cells[i]);
      if (bounds == null) {
        bounds = {
          x: geometry.x,
          y: geometry.y,
          width: geometry.width,
          height: geometry.height
        };
      } else {
        var minX = Math.min(bounds.x, geometry.x);
        var minY = Math.min(bounds.y, geometry.y);
        var maxX = Math.max(
          bounds.x + bounds.width,
          geometry.x + geometry.width
        );
        var maxY = Math.max(
          bounds.y + bounds.height,
          geometry.y + geometry.height
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
    var model = getConstraintRuntime().model;
    var bounds = getCellsAbsoluteBounds(vertices);
    var frameGeometry = model.getGeometry(targetFrame);
    var padding = 12;
    if (bounds == null || frameGeometry == null) {
      return {
        x: deltaX,
        y: deltaY
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
      y: deltaY
    };
  }
  function shiftEdgePointsByDelta(edge, deltaX, deltaY) {
    var model = getConstraintRuntime().model;
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
          geometry.points[i].y + deltaY
        )
      );
    }
    geometry.points = points;
    model.setGeometry(edge, geometry);
  }
  function clearEdgePoints(edge) {
    var model = getConstraintRuntime().model;
    var geometry = model.getGeometry(edge);
    if (geometry != null && geometry.points != null && geometry.points.length > 0) {
      geometry = geometry.clone();
      geometry.points = null;
      model.setGeometry(edge, geometry);
    }
  }
  function moveConnectedGroupToCabinetPort(edge, source, oldRoot, oldPortId, newRoot, newPort) {
    var runtime = getConstraintRuntime();
    var deps = runtime.deps;
    var model = runtime.model;
    var state = runtime.state;
    var otherTerminal = model.getTerminal(edge, !source);
    var oldPort = getPortMetaById(oldRoot, oldPortId);
    var targetFrame = deps.findDrawingFrame(newRoot);
    var group;
    var delta;
    var movedMap = {};
    var i;
    if (state.updatingModel || !deps.isCabinetSegment(oldRoot) || !deps.isCabinetSegment(newRoot) || oldPort == null || newPort == null || !isMovableConnectedTerminal(otherTerminal) || targetFrame == null) {
      return;
    }
    group = collectConnectedMovableGroup(otherTerminal);
    if (group.vertices.length == 0) {
      return;
    }
    delta = adjustGroupDeltaToFrame(
      group.vertices,
      targetFrame,
      deps.getPortAbsolutePosition(newRoot, newPort).x - deps.getPortAbsolutePosition(oldRoot, oldPort).x,
      deps.getPortAbsolutePosition(newRoot, newPort).y - deps.getPortAbsolutePosition(oldRoot, oldPort).y
    );
    if (Math.abs(delta.x) < 1e-4 && Math.abs(delta.y) < 1e-4) {
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
  function installGraphBehavior(extraDeps) {
    var runtime = getConstraintRuntime();
    var deps = runtime.deps;
    var graph = runtime.graph;
    var model = runtime.model;
    graph.getAllConnectionConstraints = function(terminal, source) {
      var root = deps.findPortHostRoot(terminal != null ? terminal.cell : null);
      if (root != null) {
        return getElectricalConstraints(root);
      }
      return runtime.oldGetAllConnectionConstraints.apply(this, arguments);
    };
    graph.setConnectionConstraint = function(edge, terminal, source, constraint) {
      if (edge == null) {
        runtime.oldSetConnectionConstraint.apply(this, arguments);
        return;
      }
      var previousStyle = model.getStyle(edge) || "";
      var previousPortId = deps.trim(
        mxUtils.getValue(
          previousStyle,
          source ? "sourcePortId" : "targetPortId",
          ""
        )
      );
      var previousRoot = deps.findPortHostRoot(model.getTerminal(edge, source));
      runtime.oldSetConnectionConstraint.apply(this, arguments);
      var root = deps.findPortHostRoot(terminal);
      if (root == null || edge == null) {
        return;
      }
      var port = getPortMetaByConstraint(root, constraint);
      extraDeps.applyEdgePortConstraintMetadata(edge, root, source, constraint);
      if (previousRoot != null && root != null && previousPortId.length > 0 && port != null && deps.trim(port.id).length > 0 && (previousRoot != root || previousPortId != deps.trim(port.id))) {
        moveConnectedGroupToCabinetPort(
          edge,
          source,
          previousRoot,
          previousPortId,
          root,
          port
        );
      }
    };
    graph.connectionHandler.validateConnection = function(source, target) {
      var error = runtime.oldValidateConnection.apply(this, arguments);
      var sourceRoot;
      var targetRoot;
      var sourcePort;
      var targetPort;
      if (error != null) {
        extraDeps.setCanvasStatus(error);
        return error;
      }
      sourceRoot = deps.findPortHostRoot(source);
      targetRoot = deps.findPortHostRoot(target);
      if (isCabinetBlock(sourceRoot) || isCabinetBlock(targetRoot)) {
        error = "\u8BF7\u8FDE\u63A5\u5F00\u5173\u7684\u51FA\u7EBF\u7AEF\u5B50\uFF0C\u914D\u7535\u67DC\u5757\u7684\u7AEF\u53E3\u7531\u7ED1\u5B9A\u7684\u5F00\u5173\u5360\u7528";
        extraDeps.setCanvasStatus(error);
        return error;
      }
      if (sourceRoot == null && targetRoot == null) {
        return null;
      }
      sourcePort = getPortMetaByConstraint(sourceRoot, this.sourceConstraint);
      targetPort = getPortMetaByConstraint(
        targetRoot,
        this.constraintHandler != null ? this.constraintHandler.currentConstraint : null
      );
      error = validatePortIoMode(sourcePort, targetPort);
      extraDeps.setCanvasStatus(error);
      return error;
    };
    graph.connectionHandler.addListener(mxEvent.RESET, function() {
      extraDeps.setCanvasStatus("");
    });
    graph.connectionHandler.addListener(mxEvent.CONNECT, function() {
      extraDeps.setCanvasStatus("");
    });
  }
  var connectionConstraintsApi = {
    applyNativeConnectionConstraint,
    clearEdgePoints,
    getElectricalConstraints,
    getPortMetaByConstraint,
    getPortMetaById,
    isMovableConnectedTerminal,
    installGraphBehavior,
    mapPortDirectionToConstraint,
    moveCellToFrameByDelta,
    moveConnectedGroupToCabinetPort
  };

  // ui/backendDialogs.js
  function buildBackendDialogDeps() {
    var app = getApp();
    return {
      ctx: app.ctx,
      backend: backendServiceApi,
      trim,
      showStatus,
      createButton: createPluginButton,
      isObject,
      toInt
    };
  }
  function getBackendDialogDeps() {
    return buildBackendDialogDeps();
  }
  function createLabeledInputRow(container, labelText, input) {
    var row = document.createElement("div");
    row.style.display = "grid";
    row.style.gridTemplateColumns = "100px 1fr";
    row.style.alignItems = "center";
    row.style.gap = "8px";
    row.style.marginBottom = "8px";
    container.appendChild(row);
    var label = document.createElement("div");
    label.innerText = labelText;
    row.appendChild(label);
    input.style.width = "100%";
    input.style.boxSizing = "border-box";
    row.appendChild(input);
  }
  async function openBackendSaveDialog() {
    var deps = getBackendDialogDeps();
    var ctx = deps.ctx;
    var state = ctx.state;
    var trim2 = deps.trim;
    if (trim2(state.backendDiagramId).length > 0) {
      try {
        await deps.backend.saveDiagramToBackend(state.backendDiagramTitle || "\u672A\u547D\u540D\u56FE\u7EB8");
      } catch (e) {
        var payload = e.payload || {};
        if (payload != null && payload.latestVersion != null && Array.isArray(payload.conflictingObjectIds)) {
          deps.showStatus(
            "\u4FDD\u5B58\u51B2\u7A81\uFF0C\u6700\u65B0\u7248\u672C\uFF1A" + payload.latestVersion + "\uFF0C\u51B2\u7A81\u5BF9\u8C61\uFF1A" + payload.conflictingObjectIds.join(", "),
            true
          );
        } else {
          deps.showStatus(e.message || String(e), true);
        }
      }
      return;
    }
    var div = document.createElement("div");
    div.style.padding = "12px";
    div.style.width = "100%";
    div.style.height = "100%";
    div.style.boxSizing = "border-box";
    div.style.display = "flex";
    div.style.flexDirection = "column";
    var title = document.createElement("div");
    title.style.fontWeight = "bold";
    title.style.marginBottom = "8px";
    title.innerText = "\u4FDD\u5B58\u5F53\u524D\u56FE\u7EB8\u5230\u540E\u7AEF";
    div.appendChild(title);
    var titleInput = document.createElement("input");
    titleInput.value = state.backendDiagramTitle || "\u672A\u547D\u540D\u56FE\u7EB8";
    createLabeledInputRow(div, "\u56FE\u7EB8\u6807\u9898", titleInput);
    var note = document.createElement("div");
    note.style.fontSize = "12px";
    note.style.color = "#666";
    note.style.marginBottom = "10px";
    note.innerText = "\u9996\u6B21\u4FDD\u5B58\u4F1A\u5728\u540E\u7AEF\u521B\u5EFA\u4E00\u5F20\u65B0\u56FE\uFF0C\u540E\u7EED\u4FDD\u5B58\u5C06\u76F4\u63A5\u8986\u76D6\u5230\u540C\u4E00\u56FE\u7EB8\u7248\u672C\u94FE\u3002";
    div.appendChild(note);
    var buttons = document.createElement("div");
    div.appendChild(buttons);
    var wnd = new mxWindow("\u4FDD\u5B58\u5230\u540E\u7AEF", div, 180, 120, 440, 190, true, true);
    wnd.destroyOnClose = true;
    wnd.setClosable(true);
    wnd.setMaximizable(false);
    wnd.setResizable(true);
    wnd.setScrollable(true);
    var saveButton = deps.createButton("\u4FDD\u5B58", async function() {
      try {
        state.backendDiagramTitle = trim2(titleInput.value) || "\u672A\u547D\u540D\u56FE\u7EB8";
        deps.backend.saveBackendSession();
        await deps.backend.saveDiagramToBackend(state.backendDiagramTitle);
        wnd.destroy();
      } catch (e) {
        var payload2 = e.payload || {};
        if (payload2 != null && payload2.latestVersion != null && Array.isArray(payload2.conflictingObjectIds)) {
          deps.showStatus(
            "\u4FDD\u5B58\u51B2\u7A81\uFF0C\u6700\u65B0\u7248\u672C\uFF1A" + payload2.latestVersion + "\uFF0C\u51B2\u7A81\u5BF9\u8C61\uFF1A" + payload2.conflictingObjectIds.join(", "),
            true
          );
        } else {
          deps.showStatus(e.message || String(e), true);
        }
      }
    });
    saveButton.style.marginTop = "0";
    buttons.appendChild(saveButton);
    wnd.setVisible(true);
  }
  async function openBackendLoadDialog() {
    var deps = getBackendDialogDeps();
    var ctx = deps.ctx;
    var state = ctx.state;
    var trim2 = deps.trim;
    if (trim2(state.backendDiagramId).length > 0) {
      try {
        await deps.backend.loadDiagramFromBackend(state.backendDiagramId);
      } catch (e) {
        deps.showStatus(e.message || String(e), true);
      }
      return;
    }
    var div = document.createElement("div");
    div.style.padding = "12px";
    div.style.width = "100%";
    div.style.height = "100%";
    div.style.boxSizing = "border-box";
    div.style.display = "flex";
    div.style.flexDirection = "column";
    var title = document.createElement("div");
    title.style.fontWeight = "bold";
    title.style.marginBottom = "8px";
    title.innerText = "\u9009\u62E9\u8981\u52A0\u8F7D\u7684\u56FE\u7EB8";
    div.appendChild(title);
    var select = document.createElement("select");
    select.style.width = "100%";
    select.style.boxSizing = "border-box";
    select.style.marginBottom = "10px";
    div.appendChild(select);
    var note = document.createElement("div");
    note.style.fontSize = "12px";
    note.style.color = "#666";
    note.style.marginBottom = "10px";
    note.innerText = "\u52A0\u8F7D\u4F1A\u5148\u6E05\u7A7A\u5F53\u524D\u9875\u9762\uFF0C\u518D\u6309\u540E\u7AEF\u5FEB\u7167\u5B8C\u6574\u6062\u590D\u3002";
    div.appendChild(note);
    var buttons = document.createElement("div");
    div.appendChild(buttons);
    var wnd = new mxWindow("\u4ECE\u540E\u7AEF\u52A0\u8F7D", div, 220, 140, 520, 220, true, true);
    wnd.destroyOnClose = true;
    wnd.setClosable(true);
    wnd.setMaximizable(false);
    wnd.setResizable(true);
    wnd.setScrollable(true);
    var loadButton = deps.createButton("\u52A0\u8F7D", async function() {
      try {
        var diagramId = select.options.length > 0 ? select.options[select.selectedIndex].value : "";
        var titleText = select.options.length > 0 ? trim2(select.options[select.selectedIndex].getAttribute("data-title")) || select.options[select.selectedIndex].innerText : "";
        await deps.backend.loadDiagramFromBackend(diagramId);
        state.backendDiagramTitle = titleText;
        deps.backend.saveBackendSession();
        wnd.destroy();
      } catch (e) {
        deps.showStatus(e.message || String(e), true);
      }
    });
    loadButton.style.marginTop = "0";
    buttons.appendChild(loadButton);
    var refreshButton = deps.createButton("\u5237\u65B0\u5217\u8868", function() {
      select.innerHTML = "";
      note.innerText = "\u6B63\u5728\u4ECE\u540E\u7AEF\u8BFB\u53D6\u56FE\u7EB8\u5217\u8868...";
      deps.backend.listDiagramsFromBackend().then(function(payload) {
        var diagrams = Array.isArray(payload.diagrams) ? payload.diagrams : [];
        diagrams.forEach(function(diagram) {
          var option = document.createElement("option");
          option.value = diagram.diagramId;
          var titleText = trim2(diagram.title) || "\u56FE\u7EB8 " + diagram.diagramId.slice(0, 8);
          option.innerText = titleText + " | v" + diagram.latestVersion + (diagram.updatedAt != null ? " | " + String(diagram.updatedAt).replace("T", " ").slice(0, 19) : "");
          option.setAttribute("data-title", titleText);
          if (trim2(state.backendDiagramId) == trim2(diagram.diagramId)) {
            option.selected = true;
          }
          select.appendChild(option);
        });
        note.innerText = diagrams.length == 0 ? "\u540E\u7AEF\u8FD8\u6CA1\u6709\u53EF\u52A0\u8F7D\u7684\u56FE\u7EB8\u3002" : "\u8BF7\u9009\u62E9\u4E00\u5F20\u56FE\u7EB8\u8FDB\u884C\u52A0\u8F7D\u3002";
      }).catch(function(error) {
        note.innerText = "\u8BFB\u53D6\u56FE\u7EB8\u5217\u8868\u5931\u8D25";
        deps.showStatus(error.message || String(error), true);
      });
    });
    refreshButton.style.marginTop = "0";
    refreshButton.style.marginLeft = "8px";
    buttons.appendChild(refreshButton);
    wnd.setVisible(true);
    refreshButton.click();
  }
  async function openBackendRollbackDialog() {
    var deps = getBackendDialogDeps();
    var ctx = deps.ctx;
    var state = ctx.state;
    var trim2 = deps.trim;
    var diagramId = trim2(state.backendDiagramId);
    if (diagramId.length == 0) {
      deps.showStatus("\u8BF7\u5148\u4FDD\u5B58\u56FE\u7EB8\u5230\u540E\u7AEF\uFF0C\u518D\u6267\u884C\u7248\u672C\u56DE\u6EDA", true);
      return;
    }
    var div = document.createElement("div");
    div.style.padding = "12px";
    div.style.width = "100%";
    div.style.height = "100%";
    div.style.boxSizing = "border-box";
    div.style.display = "flex";
    div.style.flexDirection = "column";
    var title = document.createElement("div");
    title.style.fontWeight = "bold";
    title.style.marginBottom = "8px";
    title.innerText = "\u7248\u672C\u56DE\u6EDA";
    div.appendChild(title);
    var note = document.createElement("div");
    note.style.fontSize = "12px";
    note.style.color = "#666";
    note.style.marginBottom = "10px";
    note.innerText = "\u8BF7\u9009\u62E9\u4E00\u4E2A\u5386\u53F2\u7248\u672C\u8FDB\u884C\u56DE\u6EDA\uFF0C\u56DE\u6EDA\u4F1A\u751F\u6210\u4E00\u4E2A\u65B0\u7684\u7248\u672C\u3002";
    div.appendChild(note);
    var list = document.createElement("div");
    list.style.flex = "1 1 auto";
    list.style.overflow = "auto";
    list.style.border = "1px solid #ddd";
    list.style.padding = "8px";
    list.style.background = Editor.isDarkMode() ? "#2b2b2b" : "#fff";
    div.appendChild(list);
    var wnd = new mxWindow("\u7248\u672C\u56DE\u6EDA", div, 240, 160, 560, 420, true, true);
    wnd.destroyOnClose = true;
    wnd.setClosable(true);
    wnd.setMaximizable(false);
    wnd.setResizable(true);
    wnd.setScrollable(true);
    function renderHistory(payload) {
      list.innerHTML = "";
      var commits = payload != null && Array.isArray(payload.commits) ? payload.commits.slice() : [];
      var versionItems = [
        {
          version: 0,
          actorId: "",
          commitType: "initial",
          createdAt: "",
          rollbackTargetVersion: null
        }
      ].concat(
        commits.map(function(commit) {
          var rollbackTargetVersion = null;
          if (trim2(commit.commitType) === "rollback" && Array.isArray(commit.changes)) {
            for (var changeIndex = 0; changeIndex < commit.changes.length; changeIndex++) {
              var change = commit.changes[changeIndex];
              if (change != null && change.objectId === "__rollback__" && deps.isObject(change.after) && change.after.version != null) {
                rollbackTargetVersion = Math.max(0, deps.toInt(change.after.version, 0));
                break;
              }
            }
          }
          return {
            version: Math.max(0, deps.toInt(commit.resultVersion, 0)),
            actorId: trim2(commit.actorId),
            commitType: trim2(commit.commitType) || "normal",
            createdAt: trim2(commit.createdAt),
            rollbackTargetVersion
          };
        })
      );
      versionItems.sort(function(a, b) {
        return b.version - a.version;
      });
      if (versionItems.length == 0) {
        var empty = document.createElement("div");
        empty.style.color = "#666";
        empty.innerText = "\u6682\u65E0\u53EF\u56DE\u6EDA\u7684\u7248\u672C\u5386\u53F2\u3002";
        list.appendChild(empty);
        return;
      }
      versionItems.forEach(function(item) {
        var row = document.createElement("div");
        row.style.display = "flex";
        row.style.alignItems = "center";
        row.style.justifyContent = "space-between";
        row.style.gap = "12px";
        row.style.padding = "8px 0";
        row.style.borderBottom = "1px solid #eee";
        list.appendChild(row);
        var meta = document.createElement("div");
        meta.style.flex = "1 1 auto";
        row.appendChild(meta);
        var versionText = document.createElement("div");
        versionText.style.fontWeight = "bold";
        versionText.innerText = "v" + String(item.version) + (item.version === state.backendDiagramVersion ? "\uFF08\u5F53\u524D\uFF09" : "");
        meta.appendChild(versionText);
        var detail = document.createElement("div");
        detail.style.fontSize = "12px";
        detail.style.color = "#666";
        detail.innerText = (item.commitType === "rollback" ? "\u56DE\u6EDA\u63D0\u4EA4" + (item.rollbackTargetVersion != null ? "\uFF08\u56DE\u6EDA\u5230 v" + String(item.rollbackTargetVersion) + "\uFF09" : "") : item.commitType === "initial" ? "\u521D\u59CB\u7248\u672C" : "\u666E\u901A\u63D0\u4EA4") + (item.actorId.length > 0 ? " | " + item.actorId : "") + (item.createdAt.length > 0 ? " | " + item.createdAt.replace("T", " ").slice(0, 19) : "");
        meta.appendChild(detail);
        var rollbackButton = deps.createButton("\u56DE\u6EDA\u5230\u6B64\u7248\u672C", async function() {
          if (!mxUtils.confirm(
            "\u786E\u5B9A\u56DE\u6EDA\u5230\u7248\u672C v" + String(item.version) + " \u5417\uFF1F\u5F53\u524D\u753B\u5E03\u5185\u5BB9\u4F1A\u88AB\u8BE5\u7248\u672C\u8986\u76D6\u3002"
          )) {
            return;
          }
          try {
            await deps.backend.rollbackDiagramToVersion(item.version);
            wnd.destroy();
          } catch (e) {
            deps.showStatus(e.message || String(e), true);
          }
        });
        rollbackButton.style.marginTop = "0";
        rollbackButton.disabled = item.version === state.backendDiagramVersion;
        row.appendChild(rollbackButton);
      });
    }
    wnd.setVisible(true);
    list.innerText = "\u6B63\u5728\u8BFB\u53D6\u7248\u672C\u5386\u53F2...";
    try {
      renderHistory(await deps.backend.getDiagramHistoryFromBackend(diagramId));
    } catch (e) {
      list.innerText = "\u8BFB\u53D6\u7248\u672C\u5386\u53F2\u5931\u8D25";
      deps.showStatus(e.message || String(e), true);
    }
  }
  var backendDialogsApi = {
    openBackendLoadDialog,
    openBackendRollbackDialog,
    openBackendSaveDialog
  };

  // runtime/frameBinding.js
  var ZERO_ORIGIN = { x: 0, y: 0 };
  var syncing = false;
  function getCtx() {
    return getApp().ctx;
  }
  function isBindableVertex(cell) {
    var ctx = getCtx();
    var model = ctx.model;
    if (cell == null || !model.isVertex(cell)) {
      return false;
    }
    if (isDrawingFrame(cell) || isCabinetSegment(cell) || isCabinetGap(cell)) {
      return false;
    }
    if (trim(getAttr(cell, "esKind")).length > 0 || isFrameDecorationCell(cell)) {
      return false;
    }
    var parent = model.getParent(cell);
    return parent === ctx.graph.getDefaultParent() || isDrawingFrame(parent);
  }
  function originOfParent(parent) {
    var ctx = getCtx();
    if (parent == null || parent === ctx.graph.getDefaultParent()) {
      return ZERO_ORIGIN;
    }
    var origin = frameDomainApi.getAbsoluteOrigin(parent);
    var geometry = ctx.model.getGeometry(parent);
    return {
      x: origin.x + (geometry != null ? geometry.x : 0),
      y: origin.y + (geometry != null ? geometry.y : 0)
    };
  }
  function resolveTargetParent(cell) {
    var ctx = getCtx();
    var center = frameDomainApi.getAbsoluteCenter(cell);
    var frame = center != null ? frameDomainApi.findFrameContainingPoint(center.x, center.y) : null;
    return frame != null ? frame : ctx.graph.getDefaultParent();
  }
  function reparentCell(cell, nextParent) {
    var ctx = getCtx();
    var model = ctx.model;
    var from = originOfParent(model.getParent(cell));
    var to = originOfParent(nextParent);
    var dx = from.x - to.x;
    var dy = from.y - to.y;
    var geometry = model.getGeometry(cell);
    if (geometry != null && (dx !== 0 || dy !== 0)) {
      geometry = geometry.clone();
      geometry.translate(dx, dy);
      model.setGeometry(cell, geometry);
    }
    model.add(nextParent, cell, model.getChildCount(nextParent));
  }
  function syncFrameBinding(cells) {
    if (syncing || !Array.isArray(cells) || cells.length === 0) {
      return 0;
    }
    var model = getCtx().model;
    var changed = 0;
    var i;
    syncing = true;
    model.beginUpdate();
    try {
      for (i = 0; i < cells.length; i++) {
        var cell = cells[i];
        if (!isBindableVertex(cell)) {
          continue;
        }
        var nextParent = resolveTargetParent(cell);
        if (nextParent === model.getParent(cell)) {
          continue;
        }
        reparentCell(cell, nextParent);
        changed++;
      }
    } finally {
      model.endUpdate();
      syncing = false;
    }
    return changed;
  }
  function bindCellsToFrame(cells, frame) {
    if (syncing || !Array.isArray(cells) || cells.length === 0 || frame == null) {
      return 0;
    }
    var model = getCtx().model;
    var changed = 0;
    var i;
    syncing = true;
    model.beginUpdate();
    try {
      for (i = 0; i < cells.length; i++) {
        var cell = cells[i];
        if (!isBindableVertex(cell) || model.getParent(cell) === frame) {
          continue;
        }
        reparentCell(cell, frame);
        changed++;
      }
    } finally {
      model.endUpdate();
      syncing = false;
    }
    return changed;
  }
  function handleGraphCellsEvent(sender, evt) {
    var cells = evt != null ? evt.getProperty("cells") : null;
    if (Array.isArray(cells) && cells.length > 0) {
      syncFrameBinding(cells);
    }
  }
  function installFrameBinding(ctx) {
    var graph = ctx.graph;
    graph.addListener(mxEvent.MOVE_CELLS, handleGraphCellsEvent);
    graph.addListener(mxEvent.CELLS_ADDED, handleGraphCellsEvent);
    graph.addListener(mxEvent.CELLS_RESIZED, handleGraphCellsEvent);
  }

  // runtime/hostBridge.js
  function parseHostMessage(data) {
    if (data === null) {
      return null;
    }
    if (typeof data === "string") {
      try {
        return JSON.parse(data);
      } catch (e) {
        return null;
      }
    }
    if (typeof data === "object") {
      return data;
    }
    return null;
  }
  function resolveGraphInsertPoint(ctx, payload) {
    var graph = ctx.graph;
    var diagramContainer = ctx.ui != null ? ctx.ui.diagramContainer : null;
    var scale = graph.view != null ? graph.view.scale || 1 : 1;
    var translate = graph.view != null ? graph.view.translate : null;
    var viewportX = Number(payload.viewportX);
    var viewportY = Number(payload.viewportY);
    if (diagramContainer == null || !isFinite(viewportX) || !isFinite(viewportY) || translate == null) {
      return graph.getFreeInsertPoint();
    }
    return new mxPoint(
      viewportX / scale + diagramContainer.scrollLeft / scale - translate.x,
      viewportY / scale + diagramContainer.scrollTop / scale - translate.y
    );
  }
  function clamp2(value, min, max) {
    if (!isFinite(value)) {
      return min;
    }
    return Math.max(min, Math.min(max, value));
  }
  function buildSvgExportPayload(ctx, format) {
    var graph = ctx.graph;
    var bounds = graph.getGraphBounds();
    var viewScale = graph.view != null ? graph.view.scale || 1 : 1;
    var width;
    var height;
    var svgRoot;
    var data;
    if (bounds == null || bounds.width <= 0 || bounds.height <= 0) {
      throw new Error("\u753B\u5E03\u4E0A\u6CA1\u6709\u53EF\u5BFC\u51FA\u7684\u56FE\u5F62");
    }
    width = Math.max(1, Math.ceil(bounds.width / viewScale));
    height = Math.max(1, Math.ceil(bounds.height / viewScale));
    svgRoot = graph.getSvg(
      null,
      1,
      0,
      false,
      null,
      true,
      null,
      null,
      null,
      null,
      true,
      null
    );
    if (graph.shadowVisible) {
      graph.addSvgShadow(svgRoot);
    }
    if (graph.mathEnabled) {
      Editor.prototype.addMathCss(svgRoot);
    }
    svgRoot.setAttribute("width", String(width));
    svgRoot.setAttribute("height", String(height));
    svgRoot.setAttribute("preserveAspectRatio", "xMidYMid meet");
    data = mxUtils.getXml(svgRoot);
    return {
      data,
      format
    };
  }
  function emitHostEvent(eventName, payload) {
    var targetWindow = window.opener || window.parent;
    if (targetWindow == null || targetWindow === window || typeof targetWindow.postMessage !== "function") {
      return;
    }
    targetWindow.postMessage(
      JSON.stringify(
        Object.assign(
          {
            event: eventName
          },
          payload || {}
        )
      ),
      "*"
    );
  }
  function installHostBridge(ctx) {
    if (window.__eidElectricalHostBridgeInstalled) {
      return;
    }
    var validSource = window.opener || window.parent;
    var graph = ctx.graph;
    var model = ctx.model != null ? ctx.model : graph != null && typeof graph.getModel === "function" ? graph.getModel() : null;
    var runtimeState = ctx.state != null ? ctx.state : {};
    var constants = ctx.constants;
    var MANAGED_LAYOUT_PORT_PREFIX = "eid-layout-port:";
    var BASIC_DEFAULT_PORT_PREFIX = "eid-basic-port:";
    function isManagedLayoutPortId(id) {
      return String(id || "").indexOf(MANAGED_LAYOUT_PORT_PREFIX) === 0;
    }
    function isBasicDefaultPortId(id) {
      return String(id || "").indexOf(BASIC_DEFAULT_PORT_PREFIX) === 0;
    }
    function isPluginOwnedCell(cell) {
      return getAttr(cell, "esKind") != null || getAttr(cell, "pluginType") != null || getAttr(cell, "eidCadSymbol") != null;
    }
    function createGenericHostValue(cell) {
      var currentValue = cell != null ? cell.value : null;
      var value;
      var label;
      if (currentValue != null && currentValue.nodeType == mxConstants.NODETYPE_ELEMENT) {
        value = currentValue.cloneNode(true);
      } else {
        value = mxUtils.createXmlDocument().createElement("object");
        label = currentValue != null ? String(currentValue) : "";
        if (label.length > 0) {
          value.setAttribute("label", label);
        }
      }
      value.setAttribute("eidGenericPortHost", "1");
      return value;
    }
    function parsePortArrayFromValue(value) {
      var raw;
      var parsed;
      if (value == null || value.nodeType != mxConstants.NODETYPE_ELEMENT) {
        return [];
      }
      raw = value.getAttribute("portsJson");
      if (raw == null || String(raw).length == 0) {
        return [];
      }
      try {
        parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        return [];
      }
    }
    function setGenericHostPorts(cell, ports) {
      var value;
      var serialized;
      if (cell == null || model == null || !model.isVertex(cell)) {
        return;
      }
      value = createGenericHostValue(cell);
      serialized = JSON.stringify(Array.isArray(ports) ? ports : []);
      value.setAttribute("portsJson", serialized);
      value.setAttribute("portLayout", serialized);
      model.setValue(cell, value);
    }
    function getBasicDefaultPorts() {
      return [
        {
          id: BASIC_DEFAULT_PORT_PREFIX + "left",
          x: 0,
          y: 0.5,
          direction: "left",
          ioMode: "both",
          marker: "hidden"
        },
        {
          id: BASIC_DEFAULT_PORT_PREFIX + "right",
          x: 1,
          y: 0.5,
          direction: "right",
          ioMode: "both",
          marker: "hidden"
        },
        {
          id: BASIC_DEFAULT_PORT_PREFIX + "top",
          x: 0.5,
          y: 0,
          direction: "up",
          ioMode: "both",
          marker: "hidden"
        },
        {
          id: BASIC_DEFAULT_PORT_PREFIX + "bottom",
          x: 0.5,
          y: 1,
          direction: "down",
          ioMode: "both",
          marker: "hidden"
        }
      ];
    }
    function ensureDefaultGenericPortHost(cell) {
      var ports;
      var hasDefaultPort = false;
      var i;
      if (cell == null || model == null || !model.isVertex(cell) || isPluginOwnedCell(cell)) {
        return;
      }
      ports = parsePortArrayFromValue(cell.value);
      for (i = 0; i < ports.length; i++) {
        if (isBasicDefaultPortId(ports[i] != null ? ports[i].id : "")) {
          hasDefaultPort = true;
          break;
        }
      }
      if (!hasDefaultPort) {
        ports = ports.concat(getBasicDefaultPorts());
      }
      setGenericHostPorts(cell, ports);
    }
    function cleanupManagedLayoutPortsForCell(cell) {
      var ports;
      var nextPorts = [];
      var i;
      if (cell == null || model == null || !model.isVertex(cell) || getAttr(cell, "eidGenericPortHost") != "1") {
        return;
      }
      ports = parsePortArrayFromValue(cell.value);
      for (i = 0; i < ports.length; i++) {
        if (!isManagedLayoutPortId(ports[i] != null ? ports[i].id : "")) {
          nextPorts.push(ports[i]);
        }
      }
      setGenericHostPorts(cell, nextPorts);
    }
    function normalizeManagedLayoutPort(raw) {
      var objectId;
      var port;
      var id;
      var x;
      var y;
      var direction;
      var ioMode;
      if (raw == null || typeof raw !== "object") {
        return null;
      }
      objectId = raw.objectId != null ? String(raw.objectId) : "";
      port = raw.port != null && typeof raw.port === "object" ? raw.port : null;
      if (objectId.length == 0 || port == null) {
        return null;
      }
      id = port.id != null ? String(port.id) : "";
      x = Number(port.x);
      y = Number(port.y);
      if (!isManagedLayoutPortId(id) || !isFinite(x) || !isFinite(y)) {
        return null;
      }
      direction = port.direction != null ? String(port.direction) : "any";
      ioMode = port.ioMode != null ? String(port.ioMode) : "both";
      return {
        objectId,
        port: {
          id,
          x: clamp2(x, 0, 1),
          y: clamp2(y, 0, 1),
          direction,
          ioMode,
          marker: "hidden",
          name: port.name != null ? String(port.name) : ""
        }
      };
    }
    function addManagedPortToGroup(grouped, raw) {
      var managed = normalizeManagedLayoutPort(raw);
      var portsById;
      if (managed == null) {
        return;
      }
      portsById = grouped[managed.objectId];
      if (portsById == null) {
        portsById = {};
        grouped[managed.objectId] = portsById;
      }
      portsById[managed.port.id] = managed.port;
    }
    function upsertManagedLayoutPorts(edgeRoutes) {
      var grouped = {};
      var objectId;
      var cell;
      var ports;
      var nextPorts;
      var portsById;
      var portId;
      var i;
      if (!Array.isArray(edgeRoutes)) {
        return;
      }
      for (i = 0; i < edgeRoutes.length; i++) {
        var route = edgeRoutes[i] || {};
        addManagedPortToGroup(grouped, route.sourceManagedPort);
        addManagedPortToGroup(grouped, route.targetManagedPort);
      }
      for (objectId in grouped) {
        if (!grouped.hasOwnProperty(objectId)) {
          continue;
        }
        cell = model != null ? model.getCell(objectId) : null;
        if (cell == null || !model.isVertex(cell) || isPluginOwnedCell(cell)) {
          continue;
        }
        ports = parsePortArrayFromValue(cell.value);
        nextPorts = [];
        for (i = 0; i < ports.length; i++) {
          if (!isManagedLayoutPortId(ports[i] != null ? ports[i].id : "")) {
            nextPorts.push(ports[i]);
          }
        }
        portsById = grouped[objectId];
        for (portId in portsById) {
          if (portsById.hasOwnProperty(portId)) {
            nextPorts.push(portsById[portId]);
          }
        }
        setGenericHostPorts(cell, nextPorts);
      }
    }
    function withFrameDecorationFlag(style) {
      var text = style != null ? String(style) : "";
      if (text.indexOf(FRAME_DECORATION_STYLE_FLAG) >= 0) {
        return text;
      }
      if (text.length === 0) {
        return FRAME_DECORATION_STYLE_FLAG + ";";
      }
      return text.charAt(text.length - 1) === ";" ? text + FRAME_DECORATION_STYLE_FLAG + ";" : text + ";" + FRAME_DECORATION_STYLE_FLAG + ";";
    }
    function createFrameTemplateLabelCell(frame, label) {
      var frameConfig = frameDomainApi.getFrameConfig(frame);
      var width = Math.max(40, Math.round(Number(label.width) || 120));
      var height = Math.max(20, Math.round(Number(label.height) || 26));
      var maxX = Math.max(0, frameConfig.width - width);
      var maxY = Math.max(0, frameConfig.height - height);
      var geometry = new mxGeometry(
        clamp2(Math.round(Number(label.x) || 0), 0, maxX),
        clamp2(Math.round(Number(label.y) || 0), 0, maxY),
        width,
        height
      );
      var value = createMetaCell(
        constants.FRAME_LABEL_TAG,
        "frameTemplateLabel",
        label.id != null ? String(label.id) : "",
        label.text != null ? String(label.text) : ""
      );
      var style = mxUtils.setStyle(
        makeFrameLabelStyle(),
        "align",
        label.align != null ? String(label.align) : "center"
      );
      var fieldPath = label.fieldPath != null ? String(label.fieldPath) : "";
      var cell;
      if (fieldPath.length > 0) {
        value.setAttribute("fieldPath", fieldPath);
      }
      cell = new mxCell(value, geometry, style);
      cell.vertex = true;
      cell.setConnectable(false);
      return cell;
    }
    function resetEdgeAutoStyle(edge) {
      var style = model.getStyle(edge) || "";
      style = mxUtils.setStyle(style, "noEdgeStyle", null);
      style = mxUtils.setStyle(style, "edgeStyle", "orthogonalEdgeStyle");
      style = mxUtils.setStyle(style, "entryX", null);
      style = mxUtils.setStyle(style, "entryY", null);
      style = mxUtils.setStyle(style, "exitX", null);
      style = mxUtils.setStyle(style, "exitY", null);
      style = mxUtils.setStyle(style, "entryPerimeter", null);
      style = mxUtils.setStyle(style, "exitPerimeter", null);
      style = mxUtils.setStyle(style, "jettySize", "auto");
      style = mxUtils.setStyle(style, "sourceJettySize", "auto");
      style = mxUtils.setStyle(style, "targetJettySize", "auto");
      style = mxUtils.setStyle(style, "rounded", "0");
      model.setStyle(edge, style);
    }
    function clearLayoutRouteMetadata(edge) {
      var style = model.getStyle(edge) || "";
      style = mxUtils.setStyle(style, "eidLayoutManaged", null);
      style = mxUtils.setStyle(style, "sourcePortId", null);
      style = mxUtils.setStyle(style, "targetPortId", null);
      style = mxUtils.setStyle(style, "sourcePortConstraint", null);
      style = mxUtils.setStyle(style, "targetPortConstraint", null);
      model.setStyle(edge, style);
    }
    function resetAutoLayoutEdgeState(edge) {
      var edgeGeometry;
      if (edge == null || model == null) {
        return;
      }
      edgeGeometry = model.getGeometry(edge);
      if (edgeGeometry != null && edgeGeometry.points != null) {
        edgeGeometry = edgeGeometry.clone();
        edgeGeometry.points = null;
        model.setGeometry(edge, edgeGeometry);
      }
      resetEdgeAutoStyle(edge);
      clearLayoutRouteMetadata(edge);
    }
    function isLayoutManagedEdge(edge) {
      var style;
      if (edge == null || model == null) {
        return false;
      }
      style = model.getStyle(edge) || "";
      return mxUtils.getValue(style, "eidLayoutManaged", "0") === "1";
    }
    function applyEdgeConstraintByPortId(edge, source, portId) {
      var terminal;
      var root;
      var port;
      var constraint;
      if (edge == null || portId == null || String(portId).length == 0 || graph == null || model == null) {
        return;
      }
      terminal = model.getTerminal(edge, source);
      root = findPortHostRoot(terminal);
      if (root == null) {
        return;
      }
      if (terminal != root) {
        model.setTerminal(edge, root, source);
      }
      port = getPortMetaById(root, String(portId));
      if (port == null) {
        return;
      }
      constraint = new mxConnectionConstraint(
        new mxPoint(Number(port.x) || 0, Number(port.y) || 0),
        false,
        port.id != null ? String(port.id) : ""
      );
      graph.setConnectionConstraint(edge, root, source, constraint);
    }
    function readRouteConstraint(raw) {
      var x;
      var y;
      if (raw == null || typeof raw !== "object") {
        return null;
      }
      x = Number(raw.x);
      y = Number(raw.y);
      if (!isFinite(x) || !isFinite(y)) {
        return null;
      }
      return {
        x: clamp2(x, 0, 1),
        y: clamp2(y, 0, 1)
      };
    }
    function applyEdgeConstraintByPoint(edge, source, point) {
      var terminal;
      var root;
      var constraint;
      var style;
      var xKey = source ? "exitX" : "entryX";
      var yKey = source ? "exitY" : "entryY";
      var perimeterKey = source ? "exitPerimeter" : "entryPerimeter";
      if (edge == null || point == null || graph == null || model == null) {
        return;
      }
      terminal = model.getTerminal(edge, source);
      root = findPortHostRoot(terminal) || terminal;
      if (root == null || !model.isVertex(root)) {
        return;
      }
      if (terminal !== root) {
        model.setTerminal(edge, root, source);
      }
      constraint = new mxConnectionConstraint(
        new mxPoint(point.x, point.y),
        false
      );
      graph.setConnectionConstraint(edge, root, source, constraint);
      style = model.getStyle(edge) || "";
      style = mxUtils.setStyle(style, xKey, String(point.x));
      style = mxUtils.setStyle(style, yKey, String(point.y));
      style = mxUtils.setStyle(style, perimeterKey, "1");
      model.setStyle(edge, style);
    }
    function clearConnectedEdgesForCells(cells) {
      var edgeMap = {};
      var i;
      var j;
      if (!Array.isArray(cells) || cells.length == 0) {
        return;
      }
      for (i = 0; i < cells.length; i++) {
        var cell = cells[i];
        if (cell == null || !model.isVertex(cell)) {
          continue;
        }
        var edges = graph.getConnections(cell) || [];
        for (j = 0; j < edges.length; j++) {
          if (edges[j] != null && edges[j].id != null && isLayoutManagedEdge(edges[j])) {
            edgeMap[String(edges[j].id)] = edges[j];
          }
        }
      }
      for (var edgeId in edgeMap) {
        if (edgeMap.hasOwnProperty(edgeId)) {
          var edge = edgeMap[edgeId];
          var edgeStyle = model.getStyle(edge) || "";
          var sourcePortId = mxUtils.getValue(edgeStyle, "sourcePortId", "");
          var targetPortId = mxUtils.getValue(edgeStyle, "targetPortId", "");
          clearEdgePoints(edge);
          resetEdgeAutoStyle(edge);
          applyEdgeConstraintByPortId(edge, true, sourcePortId);
          applyEdgeConstraintByPortId(edge, false, targetPortId);
        }
      }
    }
    function postReply(targetWindow, payload) {
      if (targetWindow != null && typeof targetWindow.postMessage === "function") {
        targetWindow.postMessage(JSON.stringify(payload), "*");
      }
    }
    function postResult(targetWindow, payload, extra) {
      postReply(
        targetWindow,
        Object.assign(
          {
            event: "eid-host-result",
            action: payload != null ? payload.action : "",
            actionId: payload != null ? payload.actionId : ""
          },
          extra || {}
        )
      );
    }
    function postError(targetWindow, payload, error) {
      postReply(targetWindow, {
        event: "eid-host-error",
        action: payload != null ? payload.action : "",
        actionId: payload != null ? payload.actionId : "",
        error: error != null && error.message != null ? error.message : String(error)
      });
    }
    function resolveSelectedFrame(payload) {
      var targetFrameId = payload != null && payload.selectedFrameId != null ? String(payload.selectedFrameId) : "";
      var targetGroupId = payload != null && payload.selectedGroupId != null ? String(payload.selectedGroupId) : "";
      var frames;
      var i;
      if (targetFrameId.length > 0) {
        return frameDomainApi.findFrameById(targetFrameId);
      }
      if (targetGroupId.length == 0) {
        return null;
      }
      frames = frameDomainApi.getAllDrawingFrames();
      for (i = 0; i < frames.length; i++) {
        if (frameDomainApi.getFrameGroupId(frames[i]) == targetGroupId) {
          return frames[i];
        }
      }
      return null;
    }
    function resolveFrameCell(payload) {
      var explicitFrameCellId = payload != null && payload.frameCellId != null ? String(payload.frameCellId) : "";
      var explicitFrame = null;
      if (explicitFrameCellId.length > 0) {
        explicitFrame = ctx.model.getCell(explicitFrameCellId);
        if (explicitFrame != null && frameDomainApi.findDrawingFrame(explicitFrame) === explicitFrame) {
          return explicitFrame;
        }
      }
      return resolveSelectedFrame(payload);
    }
    function belongsToLayoutFrame(cell, frame) {
      var ownerFrame;
      if (cell == null || frame == null) {
        return false;
      }
      if (cell === frame || model.getParent(cell) === frame) {
        return true;
      }
      ownerFrame = frameDomainApi.findDrawingFrame(cell);
      return ownerFrame === frame;
    }
    function edgeBelongsToLayoutFrame(edge, frame) {
      var source;
      var target;
      if (edge == null || frame == null || model == null) {
        return false;
      }
      source = model.getTerminal(edge, true);
      target = model.getTerminal(edge, false);
      if (source == null || target == null) {
        return false;
      }
      return belongsToLayoutFrame(source, frame) && belongsToLayoutFrame(target, frame);
    }
    function collectDescendants(parent, result) {
      var childCount;
      var i;
      if (parent == null || model == null) {
        return;
      }
      result.push(parent);
      childCount = model.getChildCount(parent);
      for (i = 0; i < childCount; i++) {
        collectDescendants(model.getChildAt(parent, i), result);
      }
    }
    function resolveLayoutCell(cellId) {
      var target = cellId != null ? String(cellId) : "";
      var defaultParent;
      var cells = [];
      var i;
      var cell;
      if (target.length == 0 || model == null) {
        return null;
      }
      cell = model.getCell(target);
      if (cell != null) {
        return cell;
      }
      defaultParent = graph != null ? graph.getDefaultParent() : null;
      collectDescendants(defaultParent, cells);
      for (i = 0; i < cells.length; i++) {
        cell = cells[i];
        if (cell == null) {
          continue;
        }
        if (getAttr(cell, "pluginType") == constants.FRAME_TYPE && getAttr(cell, "frameId") == target) {
          return cell;
        }
        if (getAttr(cell, "pluginType") == constants.ROOT_TYPE && (getAttr(cell, "instanceId") == target || cell.id != null && String(cell.id) == target)) {
          return cell;
        }
        if (getAttr(cell, "pluginType") == constants.CABINET_TYPE && getAttr(cell, "logicalCabinetId") == target) {
          return cell;
        }
      }
      return null;
    }
    window.addEventListener(
      "message",
      function(evt) {
        if (validSource != null && evt.source !== validSource) {
          return;
        }
        var payload = parseHostMessage(evt.data);
        if (payload == null || payload.action == null) {
          return;
        }
        try {
          if (payload.action === "createSymbol" && payload.spec != null) {
            evt.stopImmediatePropagation();
            var point = resolveGraphInsertPoint(ctx, payload);
            commandApi.insertIntoGraphAt(payload.spec, point);
            var createdCell = ctx.graph.getSelectionCell();
            postResult(evt.source, payload, {
              cellId: createdCell != null && createdCell.id != null ? String(createdCell.id) : ""
            });
            return;
          }
          if (payload.action === "insertRawXml" && typeof payload.xml === "string") {
            evt.stopImmediatePropagation();
            var insertPoint = resolveGraphInsertPoint(ctx, payload);
            var xmlDoc = mxUtils.parseXml(payload.xml);
            var cells = ctx.graph.importGraphModel(xmlDoc.documentElement, 0, 0);
            var insertedIds = [];
            if (Array.isArray(cells)) {
              var model2 = ctx.graph.getModel();
              model2.beginUpdate();
              try {
                for (var ci = 0; ci < cells.length; ci++) {
                  var geo = model2.getGeometry(cells[ci]);
                  if (geo != null) {
                    geo = geo.clone();
                    if (cells[ci].isEdge()) {
                      if (geo.sourcePoint != null) {
                        geo.sourcePoint.x += insertPoint.x;
                        geo.sourcePoint.y += insertPoint.y;
                      }
                      if (geo.targetPoint != null) {
                        geo.targetPoint.x += insertPoint.x;
                        geo.targetPoint.y += insertPoint.y;
                      }
                      if (geo.points != null && Array.isArray(geo.points)) {
                        for (var pi = 0; pi < geo.points.length; pi++) {
                          geo.points[pi].x += insertPoint.x;
                          geo.points[pi].y += insertPoint.y;
                        }
                      }
                    } else {
                      geo.x = insertPoint.x;
                      geo.y = insertPoint.y;
                    }
                    model2.setGeometry(cells[ci], geo);
                  }
                  if (cells[ci] != null && !cells[ci].isEdge()) {
                    ensureDefaultGenericPortHost(cells[ci]);
                  }
                  if (cells[ci] != null && cells[ci].id != null) {
                    insertedIds.push(String(cells[ci].id));
                  }
                }
                syncFrameBinding(cells);
              } finally {
                model2.endUpdate();
              }
              if (cells.length > 0) {
                ctx.graph.setSelectionCells(cells);
                ctx.graph.scrollCellToVisible(cells[0]);
              }
            }
            postResult(evt.source, payload, {
              cellIds: insertedIds,
              cellId: insertedIds.length > 0 ? insertedIds[0] : ""
            });
            return;
          }
          if (payload.action === "exportDiagram") {
            evt.stopImmediatePropagation();
            if (payload.format === "svg") {
              postResult(
                evt.source,
                payload,
                buildSvgExportPayload(ctx, payload.format)
              );
              return;
            }
            throw new Error("\u4E0D\u652F\u6301\u7684\u5BFC\u51FA\u683C\u5F0F");
          }
          if (payload.action === "exportPdf") {
            evt.stopImmediatePropagation();
            var ui = ctx.ui;
            var pdfAction = ui != null ? ui.actions.get("exportPdf") : null;
            if (pdfAction == null) {
              throw new Error("\u5F53\u524D\u73AF\u5883\u7F3A\u5C11 PDF \u5BFC\u51FA\u52A8\u4F5C");
            }
            pdfAction.funct();
            return;
          }
          if (payload.action === "saveToBackend") {
            evt.stopImmediatePropagation();
            openBackendSaveDialog();
            return;
          }
          if (payload.action === "rollbackBackend") {
            evt.stopImmediatePropagation();
            openBackendRollbackDialog();
            return;
          }
          if (payload.action === "ping") {
            evt.stopImmediatePropagation();
            postResult(evt.source, payload, {});
            return;
          }
          if (payload.action === "insertFrame" && payload.config != null) {
            evt.stopImmediatePropagation();
            var selectedFrame = resolveSelectedFrame(payload);
            commandApi.insertFrame(
              payload.config,
              selectedFrame,
              frameDomainApi.getAllDrawingFrames()
            );
            var insertedFrame = frameDomainApi.findDrawingFrame(
              ctx.graph.getSelectionCell()
            );
            if (insertedFrame != null && Array.isArray(payload.frameLabels) && payload.frameLabels.length > 0) {
              var frameLabels = payload.frameLabels;
              var insertedCells = [];
              var labelIndex;
              runtimeState.updatingModel = true;
              if (model2 != null) {
                model2.beginUpdate();
              }
              try {
                for (labelIndex = 0; labelIndex < frameLabels.length; labelIndex++) {
                  var frameLabel = frameLabels[labelIndex];
                  if (frameLabel == null) {
                    continue;
                  }
                  insertedCells.push(
                    createFrameTemplateLabelCell(insertedFrame, frameLabel)
                  );
                }
                for (labelIndex = 0; labelIndex < insertedCells.length; labelIndex++) {
                  if (model2 != null) {
                    model2.add(insertedFrame, insertedCells[labelIndex]);
                  } else {
                    insertedFrame.insert(insertedCells[labelIndex]);
                  }
                }
              } finally {
                if (model2 != null) {
                  model2.endUpdate();
                }
                runtimeState.updatingModel = false;
              }
            }
            if (insertedFrame != null && Array.isArray(payload.decorationCells) && payload.decorationCells.length > 0) {
              runtimeState.updatingModel = true;
              if (model2 != null) {
                model2.beginUpdate();
              }
              try {
                for (var di = 0; di < payload.decorationCells.length; di++) {
                  var deco = payload.decorationCells[di];
                  if (deco == null) continue;
                  var decoGeo = new mxGeometry(
                    Number(deco.x) || 0,
                    Number(deco.y) || 0,
                    Math.max(1, Number(deco.width) || 0),
                    Math.max(1, Number(deco.height) || 0)
                  );
                  var decoCell = new mxCell(
                    deco.label || "",
                    decoGeo,
                    withFrameDecorationFlag(deco.style)
                  );
                  decoCell.vertex = true;
                  decoCell.setConnectable(false);
                  if (model2 != null) {
                    model2.add(insertedFrame, decoCell);
                  } else {
                    insertedFrame.insert(decoCell);
                  }
                }
              } finally {
                if (model2 != null) {
                  model2.endUpdate();
                }
                runtimeState.updatingModel = false;
              }
            }
            if (insertedFrame != null && Array.isArray(payload.decorationEdges) && payload.decorationEdges.length > 0) {
              runtimeState.updatingModel = true;
              if (model2 != null) {
                model2.beginUpdate();
              }
              try {
                for (var ei = 0; ei < payload.decorationEdges.length; ei++) {
                  var edgeDeco = payload.decorationEdges[ei];
                  if (edgeDeco == null) continue;
                  var pts = edgeDeco.points || [];
                  if (pts.length < 2) continue;
                  var edgeGeo = new mxGeometry();
                  edgeGeo.relative = true;
                  edgeGeo.setTerminalPoint(
                    new mxPoint(Number(pts[0].x) || 0, Number(pts[0].y) || 0),
                    true
                  );
                  edgeGeo.setTerminalPoint(
                    new mxPoint(
                      Number(pts[pts.length - 1].x) || 0,
                      Number(pts[pts.length - 1].y) || 0
                    ),
                    false
                  );
                  if (pts.length > 2) {
                    edgeGeo.points = [];
                    for (var pi = 1; pi < pts.length - 1; pi++) {
                      edgeGeo.points.push(
                        new mxPoint(Number(pts[pi].x) || 0, Number(pts[pi].y) || 0)
                      );
                    }
                  }
                  var edgeCell = new mxCell(
                    edgeDeco.label || "",
                    edgeGeo,
                    withFrameDecorationFlag(edgeDeco.style)
                  );
                  edgeCell.edge = true;
                  edgeCell.setConnectable(false);
                  if (model2 != null) {
                    model2.add(insertedFrame, edgeCell);
                  } else {
                    insertedFrame.insert(edgeCell);
                  }
                }
              } finally {
                if (model2 != null) {
                  model2.endUpdate();
                }
                runtimeState.updatingModel = false;
              }
            }
            postResult(evt.source, payload, {
              frameId: insertedFrame != null ? getAttr(insertedFrame, "frameId") : "",
              groupId: insertedFrame != null ? frameDomainApi.getFrameGroupId(insertedFrame) : "",
              frameCellId: insertedFrame != null && insertedFrame.id != null ? String(insertedFrame.id) : ""
            });
            return;
          }
          if (payload.action === "insertCabinet" && payload.cabinetModel != null) {
            evt.stopImmediatePropagation();
            commandApi.insertCabinet(payload.cabinetModel);
            postResult(evt.source, payload, {
              logicalCabinetId: payload.cabinetModel.logicalCabinetId != null ? String(payload.cabinetModel.logicalCabinetId) : ""
            });
            return;
          }
          if (payload.action === "getSelectionInfo") {
            evt.stopImmediatePropagation();
            var selectedCell = selectionApi.getSelectedCell();
            var selectedFrame = selectionApi.getSelectedFrame();
            postResult(evt.source, payload, {
              selectedCellId: selectedCell != null && selectedCell.id != null ? String(selectedCell.id) : "",
              selectedFrameCellId: selectedFrame != null && selectedFrame.id != null ? String(selectedFrame.id) : "",
              selectedFrameId: selectedFrame != null ? getAttr(selectedFrame, "frameId") : "",
              selectedGroupId: selectedFrame != null ? frameDomainApi.getFrameGroupId(selectedFrame) : ""
            });
            return;
          }
          if (payload.action === "selectCell") {
            evt.stopImmediatePropagation();
            var requestedCellId = payload.cellId != null ? String(payload.cellId) : "";
            var requestedCell = resolveLayoutCell(requestedCellId);
            var selectionGraph = ctx.graph != null ? ctx.graph : ctx.ui != null && ctx.ui.editor != null ? ctx.ui.editor.graph : null;
            var selectedFrame2;
            if (requestedCell == null) {
              throw new Error("\u672A\u627E\u5230\u8981\u9009\u4E2D\u7684\u5355\u5143");
            }
            if (selectionGraph == null) {
              throw new Error("\u5F53\u524D\u56FE\u7F16\u8F91\u5668\u5B9E\u4F8B\u4E0D\u53EF\u7528");
            }
            selectionGraph.setSelectionCell(requestedCell);
            selectionGraph.scrollCellToVisible(requestedCell);
            selectedFrame2 = selectionApi.getSelectedFrame();
            postResult(evt.source, payload, {
              selectedCellId: requestedCell != null && requestedCell.id != null ? String(requestedCell.id) : "",
              selectedFrameCellId: selectedFrame2 != null && selectedFrame2.id != null ? String(selectedFrame2.id) : "",
              selectedFrameId: selectedFrame2 != null ? getAttr(selectedFrame2, "frameId") : "",
              selectedGroupId: selectedFrame2 != null ? frameDomainApi.getFrameGroupId(selectedFrame2) : ""
            });
            return;
          }
          if (payload.action === "getDiagramSnapshot") {
            evt.stopImmediatePropagation();
            var exportedSnapshot = withAllFramesExpanded(function() {
              return snapshotDomainApi.exportDiagramSnapshot();
            });
            postResult(evt.source, payload, {
              snapshot: exportedSnapshot
            });
            return;
          }
          if (payload.action === "restoreDiagramSnapshot" && payload.snapshot != null) {
            evt.stopImmediatePropagation();
            withAllFramesExpanded(function() {
              snapshotDomainApi.restoreDiagramSnapshot(payload.snapshot);
            });
            var restoredSnapshot = withAllFramesExpanded(function() {
              return snapshotDomainApi.exportDiagramSnapshot();
            });
            postResult(evt.source, payload, {
              snapshot: restoredSnapshot
            });
            return;
          }
          if (payload.action === "applyLayoutPositions" && Array.isArray(payload.positions)) {
            evt.stopImmediatePropagation();
            var frame = resolveFrameCell(payload);
            var graph2 = ctx.graph;
            var model2 = ctx.model != null ? ctx.model : graph2 != null && typeof graph2.getModel === "function" ? graph2.getModel() : null;
            var movedCells = [];
            var edgeMap = {};
            var frameGeometry;
            var frameOrigin;
            var isSnakeLayout = payload.layoutMode === "snake-wrap";
            var i;
            if (frame == null) {
              throw new Error("\u672A\u627E\u5230\u8981\u5E03\u5C40\u7684\u56FE\u6846");
            }
            frameGeometry = model2.getGeometry(frame);
            frameOrigin = {
              x: frameGeometry != null ? frameGeometry.x : 0,
              y: frameGeometry != null ? frameGeometry.y : 0
            };
            runtimeState.updatingModel = true;
            model2.beginUpdate();
            try {
              for (i = 0; i < payload.positions.length; i++) {
                var item = payload.positions[i] || {};
                var cellId = item.cellId != null ? String(item.cellId) : "";
                var x = Number(item.x);
                var y = Number(item.y);
                var cell;
                var geometry;
                var nextGeometry;
                var edges;
                var j;
                if (cellId.length == 0 || !isFinite(x) || !isFinite(y)) {
                  continue;
                }
                cell = resolveLayoutCell(cellId);
                if (cell == null) {
                  continue;
                }
                if (!belongsToLayoutFrame(cell, frame)) {
                  continue;
                }
                geometry = model2.getGeometry(cell);
                if (geometry == null) {
                  continue;
                }
                nextGeometry = geometry.clone();
                if (model2.getParent(cell) === frame) {
                  nextGeometry.x = x;
                  nextGeometry.y = y;
                } else {
                  nextGeometry.x = x + frameOrigin.x;
                  nextGeometry.y = y + frameOrigin.y;
                }
                model2.setGeometry(cell, nextGeometry);
                movedCells.push(cell);
                edges = graph2.getConnections(cell) || [];
                for (j = 0; j < edges.length; j++) {
                  if (edges[j] != null && edges[j].id != null && edgeBelongsToLayoutFrame(edges[j], frame)) {
                    edgeMap[String(edges[j].id)] = edges[j];
                  }
                }
              }
              bindCellsToFrame(movedCells, frame);
              for (var edgeId in edgeMap) {
                if (edgeMap.hasOwnProperty(edgeId)) {
                  clearEdgePoints(edgeMap[edgeId]);
                  if (!isSnakeLayout) {
                    clearLayoutRouteMetadata(edgeMap[edgeId]);
                    resetEdgeAutoStyle(edgeMap[edgeId]);
                  }
                }
              }
              if (Array.isArray(payload.edgeRoutes)) {
                for (i = 0; i < movedCells.length; i++) {
                  cleanupManagedLayoutPortsForCell(movedCells[i]);
                }
                upsertManagedLayoutPorts(payload.edgeRoutes);
                for (i = 0; i < payload.edgeRoutes.length; i++) {
                  var route = payload.edgeRoutes[i] || {};
                  var edgeId = route.edgeId != null ? String(route.edgeId) : "";
                  var edge = edgeId.length > 0 ? model2.getCell(edgeId) : null;
                  var edgeGeometry;
                  var nextPoints = [];
                  var edgeParent;
                  var parentGeometry;
                  var parentOriginX;
                  var parentOriginY;
                  var points;
                  var hasSourcePortBinding;
                  var hasTargetPortBinding;
                  var sourceConstraint;
                  var targetConstraint;
                  var useNativeRouting;
                  var useManualRouteStyle;
                  var keepLayoutManagedFlag;
                  var j;
                  if (edge == null || !Array.isArray(route.points) || !edgeBelongsToLayoutFrame(edge, frame)) {
                    continue;
                  }
                  edgeGeometry = model2.getGeometry(edge);
                  if (edgeGeometry == null) {
                    continue;
                  }
                  edgeParent = model2.getParent(edge);
                  parentGeometry = edgeParent != null ? model2.getGeometry(edgeParent) : null;
                  parentOriginX = parentGeometry != null ? parentGeometry.x : 0;
                  parentOriginY = parentGeometry != null ? parentGeometry.y : 0;
                  points = route.points;
                  useNativeRouting = route.useNativeRouting === true;
                  if (!useNativeRouting) {
                    for (j = 0; j < points.length; j++) {
                      var point = points[j] || {};
                      var px = Number(point.x);
                      var py = Number(point.y);
                      if (!isFinite(px) || !isFinite(py)) {
                        continue;
                      }
                      nextPoints.push(
                        new mxPoint(
                          px + frameOrigin.x - parentOriginX,
                          py + frameOrigin.y - parentOriginY
                        )
                      );
                    }
                  }
                  var nextStyle;
                  hasSourcePortBinding = route.sourcePortId != null && String(route.sourcePortId).length > 0;
                  hasTargetPortBinding = route.targetPortId != null && String(route.targetPortId).length > 0;
                  sourceConstraint = useNativeRouting ? null : readRouteConstraint(route.sourceConstraint);
                  targetConstraint = useNativeRouting ? null : readRouteConstraint(route.targetConstraint);
                  resetAutoLayoutEdgeState(edge);
                  edgeGeometry = edgeGeometry.clone();
                  edgeGeometry.points = !useNativeRouting && nextPoints.length > 0 ? nextPoints : null;
                  model2.setGeometry(edge, edgeGeometry);
                  nextStyle = model2.getStyle(edge) || "";
                  if (hasSourcePortBinding) {
                    applyEdgeConstraintByPortId(edge, true, route.sourcePortId);
                  } else if (sourceConstraint != null) {
                    applyEdgeConstraintByPoint(edge, true, sourceConstraint);
                  }
                  nextStyle = model2.getStyle(edge) || nextStyle;
                  if (hasTargetPortBinding) {
                    applyEdgeConstraintByPortId(edge, false, route.targetPortId);
                  } else if (targetConstraint != null) {
                    applyEdgeConstraintByPoint(edge, false, targetConstraint);
                  }
                  nextStyle = model2.getStyle(edge) || nextStyle;
                  useManualRouteStyle = !useNativeRouting && (isSnakeLayout && route.manual || nextPoints.length > 0);
                  keepLayoutManagedFlag = hasSourcePortBinding || hasTargetPortBinding || sourceConstraint != null || targetConstraint != null || nextPoints.length > 0 || useNativeRouting;
                  if (useManualRouteStyle) {
                    nextStyle = mxUtils.setStyle(nextStyle, "jettySize", "0");
                    nextStyle = mxUtils.setStyle(
                      nextStyle,
                      "sourceJettySize",
                      "0"
                    );
                    nextStyle = mxUtils.setStyle(
                      nextStyle,
                      "targetJettySize",
                      "0"
                    );
                    nextStyle = mxUtils.setStyle(nextStyle, "noEdgeStyle", "1");
                    nextStyle = mxUtils.setStyle(nextStyle, "edgeStyle", null);
                    nextStyle = mxUtils.setStyle(
                      nextStyle,
                      "eidLayoutManaged",
                      keepLayoutManagedFlag ? "1" : null
                    );
                  } else {
                    nextStyle = mxUtils.setStyle(nextStyle, "jettySize", "auto");
                    nextStyle = mxUtils.setStyle(
                      nextStyle,
                      "sourceJettySize",
                      "auto"
                    );
                    nextStyle = mxUtils.setStyle(
                      nextStyle,
                      "targetJettySize",
                      "auto"
                    );
                    nextStyle = mxUtils.setStyle(nextStyle, "noEdgeStyle", null);
                    nextStyle = mxUtils.setStyle(
                      nextStyle,
                      "edgeStyle",
                      "orthogonalEdgeStyle"
                    );
                    nextStyle = mxUtils.setStyle(
                      nextStyle,
                      "eidLayoutManaged",
                      keepLayoutManagedFlag ? "1" : null
                    );
                  }
                  nextStyle = mxUtils.setStyle(nextStyle, "rounded", "0");
                  model2.setStyle(edge, nextStyle);
                }
              }
            } finally {
              model2.endUpdate();
              runtimeState.updatingModel = false;
            }
            if (movedCells.length > 0) {
              graph2.setSelectionCells(movedCells);
              graph2.scrollCellToVisible(movedCells[0]);
            }
            postResult(evt.source, payload, {
              movedCount: movedCells.length
            });
          }
        } catch (e) {
          postError(evt.source, payload, e);
          if (window.console != null) {
            console.error("[electricalSymbols] host bridge failed", e);
          }
        }
      },
      true
    );
    graph.addListener(mxEvent.CELLS_MOVED, function(_sender, evt) {
      if (runtimeState.updatingModel) {
        return;
      }
      clearConnectedEdgesForCells(evt != null ? evt.getProperty("cells") : null);
    });
    var selectionDebounce = null;
    var selModel = graph.getSelectionModel();
    selModel.addListener(mxEvent.CHANGE, function() {
      clearTimeout(selectionDebounce);
      selectionDebounce = setTimeout(function() {
        var cell = graph.getSelectionCell();
        emitHostEvent("eid-selection-changed", {
          cellId: cell != null && cell.id != null ? String(cell.id) : "",
          cellType: cell != null ? cell.edge ? "edge" : "vertex" : "",
          isEdge: cell != null && !!cell.edge
        });
      }, 50);
    });
    window.__eidElectricalHostBridgeInstalled = true;
    emitHostEvent("eid-ready");
  }

  // services/backendSession.js
  function normalizeBackendBaseUrl(url, constants) {
    var normalized = trim(url).replace(/\/+$/, "");
    if (normalized.length == 0) {
      return constants.BACKEND_DEFAULT_BASE_URL;
    }
    if (/^https?:\/\/localhost(?::\d+)?\/api$/i.test(normalized) || /^https?:\/\/127\.0\.0\.1(?::\d+)?\/api$/i.test(normalized)) {
      return constants.BACKEND_DEFAULT_BASE_URL;
    }
    return normalized;
  }
  function loadBackendSession(state, constants, normalizeSnapshotGenericIds2) {
    if (typeof localStorage === "undefined") {
      return;
    }
    try {
      var raw = localStorage.getItem(constants.BACKEND_SESSION_STORAGE_KEY);
      if (!raw) {
        return;
      }
      var session = JSON.parse(raw);
      var normalizedLastSnapshot = normalizeSnapshotGenericIds2(session.lastSnapshot);
      state.backendBaseUrl = normalizeBackendBaseUrl(session.baseUrl, constants);
      state.backendActorId = trim(session.actorId) || "local-user";
      state.backendDiagramId = trim(session.diagramId);
      state.backendDiagramTitle = trim(session.diagramTitle);
      state.backendDiagramVersion = Math.max(0, toInt(session.diagramVersion, 0));
      state.backendLastSnapshot = isObject(normalizedLastSnapshot) ? cloneJson(normalizedLastSnapshot) : null;
    } catch (e) {
      state.backendBaseUrl = constants.BACKEND_DEFAULT_BASE_URL;
      state.backendActorId = "local-user";
      state.backendDiagramId = "";
      state.backendDiagramTitle = "";
      state.backendDiagramVersion = 0;
      state.backendLastSnapshot = null;
    }
  }
  function saveBackendSession(state, constants, normalizeSnapshotGenericIds2) {
    if (typeof localStorage === "undefined") {
      return;
    }
    try {
      localStorage.setItem(
        constants.BACKEND_SESSION_STORAGE_KEY,
        JSON.stringify({
          baseUrl: state.backendBaseUrl,
          actorId: state.backendActorId,
          diagramId: state.backendDiagramId,
          diagramTitle: state.backendDiagramTitle,
          diagramVersion: state.backendDiagramVersion,
          lastSnapshot: normalizeSnapshotGenericIds2(state.backendLastSnapshot)
        })
      );
    } catch (e) {
    }
  }
  function syncBackendState(state, constants, diagramId, version, snapshot, title, normalizeSnapshotGenericIds2, resetPendingChangeRecords2, exportDiagramSnapshot2) {
    snapshot = normalizeSnapshotGenericIds2(snapshot);
    state.backendDiagramId = trim(diagramId);
    state.backendDiagramTitle = trim(title || state.backendDiagramTitle);
    state.backendDiagramVersion = Math.max(0, toInt(version, 0));
    state.backendLastSnapshot = snapshot != null ? cloneJson(snapshot) : null;
    resetPendingChangeRecords2(snapshot != null ? snapshot : exportDiagramSnapshot2());
    saveBackendSession(state, constants, normalizeSnapshotGenericIds2);
  }
  function resetBackendBinding(state, constants, normalizeSnapshotGenericIds2, resetPendingChangeRecords2, exportDiagramSnapshot2) {
    state.backendDiagramId = "";
    state.backendDiagramTitle = "";
    state.backendDiagramVersion = 0;
    state.backendLastSnapshot = null;
    resetPendingChangeRecords2(exportDiagramSnapshot2());
    saveBackendSession(state, constants, normalizeSnapshotGenericIds2);
  }

  // services/backendRemoteApi.js
  function emitBackendSavePayload(deps, payload) {
    if (deps == null || typeof deps.emitBackendSavePayload !== "function") {
      return;
    }
    deps.emitBackendSavePayload(cloneJson(payload));
  }
  function requestBackendJson(method, url, body) {
    var options = {
      method,
      headers: {
        Accept: "application/json"
      }
    };
    if (body != null) {
      options.headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(body);
    }
    return fetch(url, options).then(function(response) {
      return response.text().then(function(text) {
        var payload = text.length > 0 ? JSON.parse(text) : null;
        if (!response.ok) {
          var error = new Error(
            payload != null && payload.message != null ? payload.message : "\u540E\u7AEF\u8BF7\u6C42\u5931\u8D25"
          );
          error.payload = payload;
          throw error;
        }
        return payload;
      });
    });
  }
  async function saveDiagramToBackend(state, deps, title) {
    var backendUrl = deps.normalizeBackendBaseUrl(state.backendBaseUrl);
    var actorId = trim(state.backendActorId) || "local-user";
    var diagramId = trim(state.backendDiagramId);
    var pendingChanges = cloneJson(state.pendingChangeRecords || []);
    var response;
    var baseVersion = Math.max(0, state.backendDiagramVersion);
    if (diagramId.length == 0) {
      response = await requestBackendJson("POST", backendUrl + "/diagrams", {
        title: trim(title) || "\u672A\u547D\u540D\u56FE\u7EB8"
      });
      diagramId = trim(response.diagramId);
      state.backendDiagramId = diagramId;
      state.backendDiagramTitle = trim(response.title) || trim(title) || "\u672A\u547D\u540D\u56FE\u7EB8";
      state.backendDiagramVersion = 0;
      state.backendLastSnapshot = response.snapshot || null;
    }
    var latestSnapshot = null;
    if (diagramId.length > 0) {
      latestSnapshot = await requestBackendJson(
        "GET",
        backendUrl + "/diagrams/" + encodeURIComponent(diagramId)
      );
      state.backendDiagramTitle = trim(latestSnapshot.title) || state.backendDiagramTitle;
      state.backendDiagramVersion = Math.max(
        0,
        toInt(latestSnapshot.version, state.backendDiagramVersion)
      );
      state.backendLastSnapshot = deps.normalizeSnapshotGenericIds(latestSnapshot);
    }
    var snapshot = deps.exportDiagramSnapshot();
    var emittedTitle;
    snapshot.diagramId = diagramId;
    var snapshotDiff = deps.computeSnapshotChanges(state.backendLastSnapshot, snapshot);
    emittedTitle = trim(title) || state.backendDiagramTitle || "\u672A\u547D\u540D\u56FE\u7EB8";
    if (snapshotDiff.changes.length == 0) {
      emitBackendSavePayload(deps, {
        diagramId,
        title: emittedTitle,
        actorId,
        baseVersion,
        resultVersion: baseVersion,
        savedAt: (/* @__PURE__ */ new Date()).toISOString(),
        hasChanges: false,
        snapshot,
        diff: {
          touchedObjectIds: [],
          changes: []
        }
      });
      state.backendLastSnapshot = latestSnapshot != null ? cloneJson(state.backendLastSnapshot) : snapshot;
      deps.resetPendingChangeRecords(
        latestSnapshot != null ? state.backendLastSnapshot : snapshot
      );
      deps.saveBackendSession();
      deps.showStatus("\u6CA1\u6709\u68C0\u6D4B\u5230\u9700\u8981\u4FDD\u5B58\u7684\u53D8\u66F4", false);
      return;
    }
    var diff = {
      touchedObjectIds: uniqueStrings(
        (snapshotDiff.touchedObjectIds || []).concat(
          deps.collectChangeObjectIds(pendingChanges)
        )
      ),
      changes: pendingChanges
    };
    if (diff.changes.length == 0 && snapshotDiff.changes.length > 0) {
      var createdAt = (/* @__PURE__ */ new Date()).toISOString();
      var sequence = state.nextChangeSequence++;
      var i;
      for (i = 0; i < snapshotDiff.changes.length; i++) {
        var fallbackChange = cloneJson(snapshotDiff.changes[i]);
        fallbackChange.sequence = sequence;
        fallbackChange.createdAt = createdAt;
        diff.changes.push(fallbackChange);
      }
      diff.touchedObjectIds = uniqueStrings(
        diff.touchedObjectIds.concat(deps.collectChangeObjectIds(diff.changes))
      );
    }
    if (typeof console !== "undefined" && typeof console.groupCollapsed === "function") {
      console.groupCollapsed("[electricalSymbols] saveDiagramToBackend", diagramId || "(new)");
      console.log("snapshot", snapshot);
      console.log("diff", diff);
      console.groupEnd();
    } else if (typeof console !== "undefined" && typeof console.log === "function") {
      console.log("[electricalSymbols] snapshot", snapshot);
      console.log("[electricalSymbols] diff", diff);
    }
    response = await requestBackendJson(
      "POST",
      backendUrl + "/diagrams/" + encodeURIComponent(diagramId) + "/commits",
      {
        baseVersion,
        actorId,
        touchedObjectIds: diff.touchedObjectIds,
        changes: diff.changes,
        snapshot
      }
    );
    deps.syncBackendState(
      diagramId,
      response.version,
      response.snapshot,
      trim(title) || state.backendDiagramTitle
    );
    emitBackendSavePayload(deps, {
      diagramId,
      title: emittedTitle,
      actorId,
      baseVersion,
      resultVersion: Math.max(0, toInt(response.version, baseVersion)),
      savedAt: (/* @__PURE__ */ new Date()).toISOString(),
      hasChanges: diff.changes.length > 0,
      snapshot,
      diff
    });
    deps.showStatus(
      "\u5DF2\u4FDD\u5B58\u5230\u540E\u7AEF\uFF1A" + (state.backendDiagramTitle || diagramId) + "\uFF0C\u7248\u672C\uFF1A" + String(response.version),
      false
    );
  }
  function listDiagramsFromBackend(state, normalizeBackendBaseUrl2) {
    return requestBackendJson("GET", normalizeBackendBaseUrl2(state.backendBaseUrl) + "/diagrams");
  }
  function getDiagramHistoryFromBackend(state, normalizeBackendBaseUrl2, diagramId) {
    return requestBackendJson(
      "GET",
      normalizeBackendBaseUrl2(state.backendBaseUrl) + "/diagrams/" + encodeURIComponent(diagramId) + "/history"
    );
  }
  async function rollbackDiagramToVersion(state, deps, targetVersion) {
    var diagramId = trim(state.backendDiagramId);
    if (diagramId.length == 0) {
      throw new Error("\u8BF7\u5148\u4FDD\u5B58\u56FE\u7EB8\u5230\u540E\u7AEF\uFF0C\u518D\u6267\u884C\u7248\u672C\u56DE\u6EDA");
    }
    var response = await requestBackendJson(
      "POST",
      deps.normalizeBackendBaseUrl(state.backendBaseUrl) + "/diagrams/" + encodeURIComponent(diagramId) + "/rollback",
      {
        targetVersion: Math.max(0, toInt(targetVersion, 0)),
        actorId: trim(state.backendActorId) || "local-user"
      }
    );
    deps.restoreDiagramSnapshot(response.snapshot);
    deps.syncBackendState(diagramId, response.version, response.snapshot, state.backendDiagramTitle);
    deps.showStatus(
      "\u5DF2\u56DE\u6EDA\u5230\u7248\u672C v" + String(targetVersion) + "\uFF0C\u5F53\u524D\u6700\u65B0\u7248\u672C\u4E3A v" + String(response.version),
      false
    );
    return response;
  }
  async function loadDiagramFromBackend(state, deps, diagramId) {
    var targetDiagramId = trim(diagramId || state.backendDiagramId);
    if (targetDiagramId.length == 0) {
      throw new Error("\u8BF7\u5148\u9009\u62E9\u4E00\u5F20\u56FE\u7EB8");
    }
    var backendUrl = deps.normalizeBackendBaseUrl(state.backendBaseUrl);
    var snapshot = await requestBackendJson(
      "GET",
      backendUrl + "/diagrams/" + encodeURIComponent(targetDiagramId)
    );
    deps.restoreDiagramSnapshot(snapshot);
    deps.syncBackendState(targetDiagramId, snapshot.version, snapshot);
    deps.showStatus("\u5DF2\u4ECE\u540E\u7AEF\u52A0\u8F7D\u56FE\u7EB8\uFF0C\u7248\u672C\uFF1A" + String(snapshot.version), false);
  }

  // services/backend.js
  function buildBackendServiceDeps() {
    var app = getApp();
    var ctx = app.ctx;
    return {
      state: ctx.state,
      constants: ctx.constants,
      normalizeSnapshotGenericIds: snapshotDomainApi.normalizeSnapshotGenericIds,
      exportDiagramSnapshot: function() {
        return withAllFramesExpanded(function() {
          return snapshotDomainApi.exportDiagramSnapshot();
        });
      },
      resetPendingChangeRecords,
      computeSnapshotChanges: snapshotDomainApi.computeSnapshotChanges,
      collectChangeObjectIds: snapshotDomainApi.collectChangeObjectIds,
      showStatus,
      restoreDiagramSnapshot: snapshotDomainApi.restoreDiagramSnapshot
    };
  }
  function getBackendDeps() {
    return buildBackendServiceDeps();
  }
  function normalizeBackendBaseUrlCompat(url) {
    var deps = getBackendDeps();
    return normalizeBackendBaseUrl(url, deps.constants);
  }
  function syncBackendStateCompat(diagramId, version, snapshot, title) {
    var deps = getBackendDeps();
    return syncBackendState(
      deps.state,
      deps.constants,
      diagramId,
      version,
      snapshot,
      title,
      deps.normalizeSnapshotGenericIds,
      deps.resetPendingChangeRecords,
      deps.exportDiagramSnapshot
    );
  }
  function loadBackendSessionCompat() {
    var deps = getBackendDeps();
    return loadBackendSession(
      deps.state,
      deps.constants,
      deps.normalizeSnapshotGenericIds
    );
  }
  function saveBackendSessionCompat() {
    var deps = getBackendDeps();
    return saveBackendSession(
      deps.state,
      deps.constants,
      deps.normalizeSnapshotGenericIds
    );
  }
  function listDiagramsFromBackendCompat() {
    var deps = getBackendDeps();
    return listDiagramsFromBackend(deps.state, function(url) {
      return normalizeBackendBaseUrl(url, deps.constants);
    });
  }
  function getDiagramHistoryFromBackendCompat(diagramId) {
    var deps = getBackendDeps();
    return getDiagramHistoryFromBackend(
      deps.state,
      function(url) {
        return normalizeBackendBaseUrl(url, deps.constants);
      },
      diagramId
    );
  }
  function loadDiagramFromBackendCompat(diagramId) {
    var deps = getBackendDeps();
    return loadDiagramFromBackend(
      deps.state,
      {
        normalizeBackendBaseUrl: function(url) {
          return normalizeBackendBaseUrl(url, deps.constants);
        },
        restoreDiagramSnapshot: deps.restoreDiagramSnapshot,
        showStatus: deps.showStatus,
        syncBackendState: function(targetDiagramId, version, snapshot, title) {
          return syncBackendState(
            deps.state,
            deps.constants,
            targetDiagramId,
            version,
            snapshot,
            title,
            deps.normalizeSnapshotGenericIds,
            deps.resetPendingChangeRecords,
            deps.exportDiagramSnapshot
          );
        }
      },
      diagramId
    );
  }
  function resetBackendBindingCompat() {
    var deps = getBackendDeps();
    return resetBackendBinding(
      deps.state,
      deps.constants,
      deps.normalizeSnapshotGenericIds,
      deps.resetPendingChangeRecords,
      deps.exportDiagramSnapshot
    );
  }
  function rollbackDiagramToVersionCompat(targetVersion) {
    var deps = getBackendDeps();
    return rollbackDiagramToVersion(
      deps.state,
      {
        normalizeBackendBaseUrl: function(url) {
          return normalizeBackendBaseUrl(url, deps.constants);
        },
        restoreDiagramSnapshot: deps.restoreDiagramSnapshot,
        showStatus: deps.showStatus,
        syncBackendState: function(diagramId, version, snapshot, title) {
          return syncBackendState(
            deps.state,
            deps.constants,
            diagramId,
            version,
            snapshot,
            title,
            deps.normalizeSnapshotGenericIds,
            deps.resetPendingChangeRecords,
            deps.exportDiagramSnapshot
          );
        }
      },
      targetVersion
    );
  }
  function saveDiagramToBackendCompat(title) {
    var deps = getBackendDeps();
    return saveDiagramToBackend(
      deps.state,
      {
        normalizeBackendBaseUrl: function(url) {
          return normalizeBackendBaseUrl(url, deps.constants);
        },
        normalizeSnapshotGenericIds: deps.normalizeSnapshotGenericIds,
        exportDiagramSnapshot: deps.exportDiagramSnapshot,
        resetPendingChangeRecords: deps.resetPendingChangeRecords,
        computeSnapshotChanges: deps.computeSnapshotChanges,
        collectChangeObjectIds: deps.collectChangeObjectIds,
        showStatus: deps.showStatus,
        restoreDiagramSnapshot: deps.restoreDiagramSnapshot,
        emitBackendSavePayload: function(payload) {
          emitHostEvent("eid-backend-save", payload);
        },
        saveBackendSession: function() {
          return saveBackendSession(
            deps.state,
            deps.constants,
            deps.normalizeSnapshotGenericIds
          );
        },
        syncBackendState: function(diagramId, version, snapshot, nextTitle) {
          return syncBackendState(
            deps.state,
            deps.constants,
            diagramId,
            version,
            snapshot,
            nextTitle,
            deps.normalizeSnapshotGenericIds,
            deps.resetPendingChangeRecords,
            deps.exportDiagramSnapshot
          );
        }
      },
      title
    );
  }
  var backendServiceApi = {
    getDiagramHistoryFromBackend: getDiagramHistoryFromBackendCompat,
    listDiagramsFromBackend: listDiagramsFromBackendCompat,
    loadBackendSession: loadBackendSessionCompat,
    loadDiagramFromBackend: loadDiagramFromBackendCompat,
    normalizeBackendBaseUrl: normalizeBackendBaseUrlCompat,
    requestBackendJson,
    resetBackendBinding: resetBackendBindingCompat,
    rollbackDiagramToVersion: rollbackDiagramToVersionCompat,
    saveBackendSession: saveBackendSessionCompat,
    saveDiagramToBackend: saveDiagramToBackendCompat,
    syncBackendState: syncBackendStateCompat
  };

  // services/libraryGraphCodec.js
  function createLibraryEntry(graph, buildSymbolCell2, spec) {
    var root = buildSymbolCell2(spec);
    var bounds = graph.getBoundingBoxFromGeometry([root]);
    var xml;
    if (bounds != null) {
      root.geometry = root.geometry.clone();
      root.geometry.x = -bounds.x;
      root.geometry.y = -bounds.y;
    }
    xml = mxUtils.getXml(graph.encodeCells([root]));
    if (Editor.defaultCompressed) {
      xml = Graph.compress(xml);
    }
    return {
      xml,
      w: bounds != null ? Math.round(bounds.width) : spec.size.width,
      h: bounds != null ? Math.round(bounds.height) : spec.size.height,
      title: spec.templateName || spec.title,
      spec: cloneJson(spec)
    };
  }
  function getLibraryEntrySpec(ui, image, normalizeSpec2, isElectricalRoot2, extractSpec2) {
    var xml;
    var cells;
    var i;
    if (image != null && isObject(image.spec)) {
      return normalizeSpec2(cloneJson(image.spec));
    }
    if (image == null || image.xml == null) {
      throw new Error("\u6A21\u677F\u6761\u76EE\u7F3A\u5C11 xml");
    }
    xml = image.xml;
    if ("<" != xml.charAt(0)) {
      xml = Graph.decompress(xml);
    }
    cells = ui.stringToCells(xml);
    for (i = 0; i < cells.length; i++) {
      if (isElectricalRoot2(cells[i])) {
        return extractSpec2(cells[i]);
      }
    }
    throw new Error("\u5E93\u6761\u76EE\u4E2D\u672A\u627E\u5230\u7535\u6C14\u56FE\u5143");
  }
  function findLibraryEntryIndex(images, symbolId, getLibraryEntrySpecFn) {
    var id = trim(symbolId);
    var i;
    for (i = 0; i < images.length; i++) {
      try {
        if (trim(getLibraryEntrySpecFn(images[i]).symbolId) == id) {
          return i;
        }
      } catch (e) {
      }
    }
    return -1;
  }

  // services/libraryStorage.js
  function loadStoredLibrary(ui, state, libraryTitle, callback, openInSidebar) {
    StorageFile.getFileContent(
      ui,
      libraryTitle,
      function(data) {
        var images = [];
        if (data != null && data.length > 0) {
          try {
            var doc = mxUtils.parseXml(data);
            if (doc.documentElement != null && doc.documentElement.nodeName == "mxlibrary") {
              images = JSON.parse(mxUtils.getTextContent(doc.documentElement));
            }
          } catch (e) {
            images = [];
          }
        }
        state.libraryImages = images;
        if (openInSidebar && data != null && data.length > 0) {
          ui.libraryLoaded(new StorageLibrary(ui, data, libraryTitle), images, libraryTitle, true);
        }
        if (callback != null) {
          callback(images);
        }
      },
      function() {
        state.libraryImages = [];
        if (callback != null) {
          callback([]);
        }
      }
    );
  }
  function saveLibraryImages(ui, state, libraryTitle, images, callback) {
    var xml = ui.createLibraryDataFromImages(images);
    var file = new StorageLibrary(ui, xml, libraryTitle);
    ui.libraryLoaded(file, images, libraryTitle, true);
    file.save(
      false,
      function() {
        state.libraryImages = images;
        if (callback != null) {
          callback(file, images, xml);
        }
      },
      function(err) {
        ui.handleError(err || { message: "\u4FDD\u5B58\u7535\u6C14\u56FE\u5E93\u5931\u8D25" });
      }
    );
  }

  // services/libraryStore.js
  function buildLibraryStoreDeps() {
    var app = getApp();
    var ctx = app.ctx;
    return {
      ui: ctx.ui,
      graph: ctx.graph,
      state: ctx.state,
      libraryTitle: ctx.constants.LIBRARY_TITLE,
      normalizeSpec: specDomainApi.normalizeSpec,
      isElectricalRoot,
      extractSpec: symbolDomainApi.extractSpec,
      buildSymbolCell: symbolDomainApi.buildSymbolCell,
      showStatus
    };
  }
  function getLibraryDeps() {
    return buildLibraryStoreDeps();
  }
  function getLibraryEntrySpecCompat(image) {
    var deps = getLibraryDeps();
    return getLibraryEntrySpec(
      deps.ui,
      image,
      deps.normalizeSpec,
      deps.isElectricalRoot,
      deps.extractSpec
    );
  }
  function isTemplateNameTaken(name, ignoreSymbolId) {
    var deps = getLibraryDeps();
    var target = trim(name);
    var ignoreId = trim(ignoreSymbolId);
    var i;
    var state = deps.state;
    if (target.length == 0) {
      return false;
    }
    for (i = 0; i < state.libraryImages.length; i++) {
      try {
        var spec = getLibraryEntrySpecCompat(state.libraryImages[i]);
        if (trim(spec.templateName || spec.title) == target && trim(spec.symbolId) != ignoreId) {
          return true;
        }
      } catch (e) {
      }
    }
    return false;
  }
  function addToLibrary(spec, onSaved) {
    var deps = getLibraryDeps();
    loadStoredLibrary(deps.ui, deps.state, deps.libraryTitle, function(images) {
      var next = images.slice();
      var entry = createLibraryEntry(deps.graph, deps.buildSymbolCell, spec);
      var index = findLibraryEntryIndex(next, spec.symbolId, getLibraryEntrySpecCompat);
      var i;
      for (i = 0; i < next.length; i++) {
        try {
          var currentSpec = getLibraryEntrySpecCompat(next[i]);
          if (trim(currentSpec.templateName || currentSpec.title) == trim(spec.templateName || spec.title) && trim(currentSpec.symbolId) != trim(spec.symbolId)) {
            deps.showStatus("\u56FE\u5143\u7C7B\u578B\u540D\u79F0\u4E0D\u80FD\u91CD\u590D", true);
            return;
          }
        } catch (e) {
        }
      }
      if (index >= 0) {
        next[index] = entry;
      } else {
        next.push(entry);
      }
      saveLibraryImages(deps.ui, deps.state, deps.libraryTitle, next, function() {
        deps.showStatus(index >= 0 ? "\u5DF2\u66F4\u65B0\u56FE\u5E93\u6A21\u677F" : "\u5DF2\u52A0\u5165\u56FE\u5E93", false);
        if (typeof onSaved === "function") {
          onSaved();
        }
      });
    });
  }
  function removeTemplateFromLibrary(symbolId, onRemoved) {
    var deps = getLibraryDeps();
    loadStoredLibrary(deps.ui, deps.state, deps.libraryTitle, function(images) {
      var next = [];
      var removed = false;
      var i;
      for (i = 0; i < images.length; i++) {
        try {
          if (trim(getLibraryEntrySpecCompat(images[i]).symbolId) == trim(symbolId)) {
            removed = true;
            continue;
          }
        } catch (e) {
        }
        next.push(images[i]);
      }
      if (!removed) {
        deps.showStatus("\u672A\u627E\u5230\u8981\u5220\u9664\u7684\u56FE\u5143\u6A21\u677F", true);
        return;
      }
      saveLibraryImages(deps.ui, deps.state, deps.libraryTitle, next, function() {
        deps.showStatus("\u5DF2\u5220\u9664\u56FE\u5143\u6A21\u677F", false);
        if (typeof onRemoved === "function") {
          onRemoved(next);
        }
      });
    });
  }
  function loadStoredLibraryCompat(callback, openInSidebar) {
    var deps = getLibraryDeps();
    return loadStoredLibrary(
      deps.ui,
      deps.state,
      deps.libraryTitle,
      callback,
      openInSidebar
    );
  }
  function saveLibraryImagesCompat(images, callback) {
    var deps = getLibraryDeps();
    return saveLibraryImages(
      deps.ui,
      deps.state,
      deps.libraryTitle,
      images,
      callback
    );
  }
  var libraryStoreApi = {
    addToLibrary,
    getLibraryEntrySpec: getLibraryEntrySpecCompat,
    isTemplateNameTaken,
    loadStoredLibrary: loadStoredLibraryCompat,
    removeTemplateFromLibrary,
    saveLibraryImages: saveLibraryImagesCompat
  };

  // ui/createInstanceDialog.js
  function getCreateInstanceDeps() {
    return {
      trim,
      library: libraryStoreApi,
      getLibraryEntrySpec: libraryStoreApi.getLibraryEntrySpec,
      showStatus,
      flattenSchemaFields: specDomainApi.flattenSchemaFields,
      normalizeSchemaType: specDomainApi.normalizeSchemaType,
      setValueByPath: specDomainApi.setValueByPath,
      buildInstanceSpec: specDomainApi.buildInstanceSpec,
      createButton: createPluginButton,
      insertIntoGraph: commandApi.insertIntoGraph
    };
  }
  function openCreateFromLibraryDialog() {
    var deps = arguments.length > 0 && arguments[0] != null && typeof arguments[0] == "object" && !Array.isArray(arguments[0]) && arguments[0].library != null ? arguments[0] : getCreateInstanceDeps();
    var preferredSymbolId = arguments.length > 1 || arguments.length > 0 && (arguments[0] == null || typeof arguments[0] != "object" || Array.isArray(arguments[0]) || arguments[0].library == null) ? arguments[arguments.length > 1 ? 1 : 0] : arguments[1];
    var trim2 = deps.trim;
    deps.library.loadStoredLibrary(function(images) {
      var templates = [];
      var i;
      for (i = 0; i < images.length; i++) {
        try {
          templates.push(deps.getLibraryEntrySpec(images[i]));
        } catch (e) {
        }
      }
      if (templates.length == 0) {
        deps.showStatus("\u7535\u6C14\u56FE\u5E93\u4E3A\u7A7A\uFF0C\u8BF7\u5148\u4FDD\u5B58\u56FE\u5143\u7C7B\u578B", true);
        return;
      }
      var initialIndex = 0;
      if (trim2(preferredSymbolId).length > 0) {
        for (i = 0; i < templates.length; i++) {
          if (trim2(templates[i].symbolId) == trim2(preferredSymbolId)) {
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
      title.innerText = "\u9009\u62E9\u56FE\u5143\u7C7B\u578B\u5E76\u586B\u5199\u5B9E\u4F8B\u5C5E\u6027";
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
      widthLabel.innerText = "\u5BBD";
      sizeRow.appendChild(widthLabel);
      var widthInput = document.createElement("input");
      widthInput.setAttribute("type", "number");
      widthInput.setAttribute("min", "20");
      widthInput.style.width = "120px";
      sizeRow.appendChild(widthInput);
      var heightLabel = document.createElement("div");
      heightLabel.innerText = "\u9AD8";
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
        deps.flattenSchemaFields(currentTemplate.schema, "", []).forEach(
          function(field) {
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
            var type = deps.normalizeSchemaType(field.type);
            if (type == "enum") {
              control = document.createElement("select");
              var emptyOption = document.createElement("option");
              emptyOption.value = "";
              emptyOption.innerText = "\u8BF7\u9009\u62E9";
              control.appendChild(emptyOption);
              field.enumValues.forEach(function(optionValue) {
                var option2 = document.createElement("option");
                option2.value = optionValue;
                option2.innerText = optionValue;
                control.appendChild(option2);
              });
            } else if (type == "boolean") {
              control = document.createElement("select");
              [
                { value: "", label: "\u8BF7\u9009\u62E9" },
                { value: "true", label: "true" },
                { value: "false", label: "false" }
              ].forEach(function(item) {
                var option2 = document.createElement("option");
                option2.value = item.value;
                option2.innerText = item.label;
                control.appendChild(option2);
              });
            } else {
              control = document.createElement("input");
              control.setAttribute(
                "type",
                type == "number" ? "number" : "text"
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
              field,
              control,
              type,
              error
            });
          }
        );
      }
      for (i = 0; i < templates.length; i++) {
        var option = document.createElement("option");
        option.value = String(i);
        option.innerText = templates[i].templateName || templates[i].title;
        select.appendChild(option);
      }
      mxEvent.addListener(select, "change", function() {
        syncTemplate(parseInt(select.value, 10) || 0);
      });
      select.value = String(initialIndex);
      syncTemplate(initialIndex);
      var wnd = new mxWindow(
        "\u521B\u5EFA\u7535\u6C14\u56FE\u5143",
        div,
        140,
        120,
        460,
        520,
        true,
        true
      );
      wnd.destroyOnClose = true;
      wnd.setClosable(true);
      wnd.setMaximizable(false);
      wnd.setResizable(true);
      wnd.setScrollable(true);
      wnd.setVisible(true);
      var submitButton = deps.createButton("\u521B\u5EFA\u5230\u753B\u5E03", function() {
        try {
          var payload = {};
          var firstInvalid = null;
          formControls.forEach(function(entry) {
            entry.error.innerText = "";
            entry.control.style.borderColor = "";
            entry.control.style.boxShadow = "";
          });
          formControls.forEach(function(entry) {
            var rawValue = trim2(entry.control.value);
            var value = null;
            if (entry.type == "number") {
              value = rawValue.length > 0 ? deps.toFloat(rawValue, null) : null;
            } else if (entry.type == "boolean") {
              value = rawValue == "true" ? true : rawValue == "false" ? false : null;
            } else {
              value = rawValue;
            }
            if (entry.field.required && (value == null || typeof value === "string" && value.length == 0)) {
              entry.error.innerText = "\u5FC5\u586B\u9879";
              entry.control.style.borderColor = "#b3261e";
              entry.control.style.boxShadow = "0 0 0 1px rgba(179,38,30,0.2)";
              firstInvalid = firstInvalid || entry;
              return;
            }
            if (entry.type == "enum" && rawValue.length > 0) {
              if (entry.field.enumValues.indexOf(rawValue) < 0) {
                entry.error.innerText = "\u5FC5\u987B\u9009\u62E9\u679A\u4E3E\u5B9A\u4E49\u4E2D\u7684\u503C";
                entry.control.style.borderColor = "#b3261e";
                entry.control.style.boxShadow = "0 0 0 1px rgba(179,38,30,0.2)";
                firstInvalid = firstInvalid || entry;
                return;
              }
            }
            if (entry.type == "number" && rawValue.length > 0 && value == null) {
              entry.error.innerText = "\u8BF7\u8F93\u5165\u6709\u6548\u6570\u5B57";
              entry.control.style.borderColor = "#b3261e";
              entry.control.style.boxShadow = "0 0 0 1px rgba(179,38,30,0.2)";
              firstInvalid = firstInvalid || entry;
              return;
            }
            deps.setValueByPath(payload, entry.field.path, value);
          });
          if (firstInvalid != null) {
            firstInvalid.control.focus();
            if (typeof firstInvalid.control.scrollIntoView === "function") {
              firstInvalid.control.scrollIntoView({
                block: "nearest",
                behavior: "smooth"
              });
            }
            deps.showStatus("\u8BF7\u5148\u4FEE\u6B63\u8868\u5355\u4E2D\u7684\u9519\u8BEF\u5B57\u6BB5", true);
            return;
          }
          deps.insertIntoGraph(
            deps.buildInstanceSpec(payload, currentTemplate, {
              width: widthInput.value,
              height: heightInput.value
            })
          );
          wnd.destroy();
        } catch (e) {
          deps.showStatus(e.message || String(e), true);
        }
      });
      submitButton.style.marginTop = "0";
      buttons.appendChild(submitButton);
    });
  }

  // runtime/printMode.js
  var printMode = false;
  var listeners = [];
  function isPrintMode() {
    return printMode;
  }
  function onPrintModeChanged(listener) {
    if (typeof listener === "function") {
      listeners.push(listener);
    }
  }
  function notify() {
    var i;
    for (i = 0; i < listeners.length; i++) {
      try {
        listeners[i]();
      } catch (e) {
      }
    }
  }
  function applyMode(graph, next) {
    printMode = next;
    notify();
    graph.refresh();
  }
  function withPrintStyles(callback) {
    var graph = getApp().ctx.graph;
    if (printMode) {
      return callback();
    }
    applyMode(graph, true);
    try {
      return callback();
    } finally {
      applyMode(graph, false);
    }
  }
  function installPrintMode(ctx) {
    var graph = ctx.graph;
    var origGetCellStyle = graph.getCellStyle;
    graph.getCellStyle = function(cell) {
      var style = origGetCellStyle.apply(this, arguments);
      if (printMode && isCabinetBlock(cell)) {
        style[mxConstants.STYLE_STROKECOLOR] = mxConstants.NONE;
      }
      return style;
    };
  }

  // ui/exportSvgDialog.js
  function buildExportDialogDeps() {
    var app = getApp();
    return {
      ctx: app.ctx,
      toInt,
      createButton: createPluginButton,
      showStatus
    };
  }
  function openSvgExportDialog() {
    var deps = arguments.length > 0 ? arguments[0] : buildExportDialogDeps();
    var ui = deps.ctx.ui;
    var graph = deps.ctx.graph;
    function getDiagramExportBounds() {
      var bounds = graph.getGraphBounds();
      var viewScale = graph.view.scale || 1;
      if (bounds == null || bounds.width <= 0 || bounds.height <= 0) {
        throw new Error("\u753B\u5E03\u4E0A\u6CA1\u6709\u53EF\u5BFC\u51FA\u7684\u56FE\u5F62");
      }
      return {
        width: Math.max(1, Math.ceil(bounds.width / viewScale)),
        height: Math.max(1, Math.ceil(bounds.height / viewScale))
      };
    }
    function createSvgExportCode(width, height) {
      return withPrintStyles(function() {
        return buildSvgExportCode(width, height);
      });
    }
    function buildSvgExportCode(width, height) {
      var exportBounds2 = getDiagramExportBounds();
      var targetWidth = Math.max(1, deps.toInt(width, exportBounds2.width));
      var targetHeight = Math.max(1, deps.toInt(height, exportBounds2.height));
      var scale = Math.min(
        targetWidth / exportBounds2.width,
        targetHeight / exportBounds2.height
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
        null
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
    function downloadSvgCode(svgCode) {
      var blob = new Blob([svgCode], { type: "image/svg+xml;charset=utf-8" });
      var url = URL.createObjectURL(blob);
      var link = document.createElement("a");
      link.href = url;
      link.download = "diagram-export.svg";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(function() {
        URL.revokeObjectURL(url);
      }, 0);
    }
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
    widthLabel.innerText = "\u5BBD";
    formRow.appendChild(widthLabel);
    var widthInput = document.createElement("input");
    widthInput.setAttribute("type", "number");
    widthInput.setAttribute("min", "1");
    widthInput.style.width = "120px";
    widthInput.value = String(exportBounds.width);
    formRow.appendChild(widthInput);
    var heightLabel = document.createElement("div");
    heightLabel.innerText = "\u9AD8";
    formRow.appendChild(heightLabel);
    var heightInput = document.createElement("input");
    heightInput.setAttribute("type", "number");
    heightInput.setAttribute("min", "1");
    heightInput.style.width = "120px";
    heightInput.value = String(exportBounds.height);
    formRow.appendChild(heightInput);
    var refreshButton = deps.createButton("\u5237\u65B0SVG\u4EE3\u7801", function() {
      try {
        textarea.value = createSvgExportCode(widthInput.value, heightInput.value);
      } catch (e) {
        deps.showStatus(e.message || String(e), true);
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
    var copyButton = deps.createButton("\u590D\u5236SVG\u4EE3\u7801", function() {
      ui.writeTextToClipboard(
        textarea.value,
        function(e) {
          ui.handleError(e);
        },
        function() {
          ui.alert("\u5DF2\u590D\u5236\u5230\u526A\u8D34\u677F");
        }
      );
    });
    copyButton.style.marginTop = "0";
    buttons.appendChild(copyButton);
    var downloadButton = deps.createButton("\u4E0B\u8F7DSVG", function() {
      try {
        var svgCode = createSvgExportCode(widthInput.value, heightInput.value);
        textarea.value = svgCode;
        downloadSvgCode(svgCode);
        wnd.destroy();
      } catch (e) {
        deps.showStatus(e.message || String(e), true);
      }
    });
    downloadButton.style.marginTop = "0";
    buttons.appendChild(downloadButton);
    textarea.value = createSvgExportCode(exportBounds.width, exportBounds.height);
    var wnd = new mxWindow("\u5BFC\u51FASVG", div, 160, 120, 720, 560, true, true);
    wnd.destroyOnClose = true;
    wnd.setClosable(true);
    wnd.setMaximizable(false);
    wnd.setResizable(true);
    wnd.setScrollable(true);
    wnd.setVisible(true);
  }

  // ui/exportDialog.js
  function buildExportDialogDeps2() {
    var app = getApp();
    return {
      ctx: app.ctx,
      createButton: createPluginButton,
      showStatus,
      openSvgExportDialog
    };
  }
  function createOptionCard(title, description) {
    var card = document.createElement("div");
    card.style.display = "flex";
    card.style.flexDirection = "column";
    card.style.gap = "6px";
    card.style.padding = "12px";
    card.style.border = "1px solid #d0d7de";
    card.style.borderRadius = "8px";
    card.style.background = Editor.isDarkMode() ? "#2b2b2b" : "#ffffff";
    var heading = document.createElement("div");
    heading.style.fontWeight = "bold";
    heading.innerText = title;
    card.appendChild(heading);
    var text = document.createElement("div");
    text.style.fontSize = "12px";
    text.style.lineHeight = "1.5";
    text.style.color = Editor.isDarkMode() ? "#c9d1d9" : "#57606a";
    text.innerText = description;
    card.appendChild(text);
    return card;
  }
  function openExportDialog() {
    var deps = arguments.length > 0 ? arguments[0] : buildExportDialogDeps2();
    var ui = deps.ctx.ui;
    var div = document.createElement("div");
    var buttons = document.createElement("div");
    var wnd = null;
    div.style.padding = "12px";
    div.style.width = "100%";
    div.style.height = "100%";
    div.style.boxSizing = "border-box";
    div.style.display = "flex";
    div.style.flexDirection = "column";
    div.style.gap = "12px";
    div.appendChild(
      createOptionCard(
        "SVG",
        "\u6253\u5F00 SVG \u5BFC\u51FA\u7A97\u53E3\uFF0C\u53EF\u8C03\u6574\u5C3A\u5BF8\u3001\u590D\u5236\u4EE3\u7801\u6216\u4E0B\u8F7D\u6587\u4EF6\u3002"
      )
    );
    div.appendChild(
      createOptionCard(
        "PDF",
        "\u590D\u7528 draw.io \u539F\u751F PDF \u5BFC\u51FA\u80FD\u529B\uFF0C\u652F\u6301\u6253\u5370\u5BFC\u51FA\u53C2\u6570\u914D\u7F6E\u3002"
      )
    );
    div.appendChild(
      createOptionCard(
        "DXF",
        "\u672C\u5730 draw.io \u5185\u6838\u6682\u4E0D\u652F\u6301\u76F4\u63A5\u5BFC\u51FA DXF\uFF0C\u6B64\u5165\u53E3\u4F1A\u7ED9\u51FA\u660E\u786E\u8BF4\u660E\u3002"
      )
    );
    buttons.style.display = "flex";
    buttons.style.alignItems = "center";
    buttons.style.flexWrap = "wrap";
    buttons.style.gap = "8px";
    div.appendChild(buttons);
    function closeDialog() {
      if (wnd != null) {
        wnd.destroy();
      }
    }
    var svgButton = deps.createButton("\u5BFC\u51FA SVG", function() {
      closeDialog();
      deps.openSvgExportDialog();
    });
    svgButton.style.marginTop = "0";
    buttons.appendChild(svgButton);
    var pdfButton = deps.createButton("\u5BFC\u51FA PDF", function() {
      closeDialog();
      if (ui.actions.get("exportPdf") == null) {
        deps.showStatus("\u5F53\u524D\u73AF\u5883\u7F3A\u5C11 PDF \u5BFC\u51FA\u52A8\u4F5C", true);
        return;
      }
      withPrintStyles(function() {
        ui.actions.get("exportPdf").funct();
      });
    });
    pdfButton.style.marginTop = "0";
    buttons.appendChild(pdfButton);
    var dxfButton = deps.createButton("\u5BFC\u51FA DXF", function() {
      ui.alert("\u5F53\u524D draw.io \u5185\u6838\u4E0D\u652F\u6301 DXF \u76F4\u63A5\u5BFC\u51FA\uFF0C\u8BF7\u5148\u5BFC\u51FA SVG \u518D\u8F6C\u6362\u4E3A DXF\u3002");
    });
    dxfButton.style.marginTop = "0";
    buttons.appendChild(dxfButton);
    wnd = new mxWindow("\u5BFC\u51FA", div, 220, 140, 480, 320, true, true);
    wnd.destroyOnClose = true;
    wnd.setClosable(true);
    wnd.setMaximizable(false);
    wnd.setResizable(true);
    wnd.setScrollable(true);
    wnd.setVisible(true);
  }

  // ui/frameDialog.js
  function buildFrameDialogDeps() {
    var app = getApp();
    return {
      ctx: app.ctx,
      cloneJson,
      normalizeFrameConfig: frameDomainApi.normalizeFrameConfig,
      findDrawingFrame: frameDomainApi.findDrawingFrame,
      getAllDrawingFrames: frameDomainApi.getAllDrawingFrames,
      createButton: createPluginButton,
      getFrameGroupId: frameDomainApi.getFrameGroupId,
      generateFrameGroupId,
      getMaxFramePageNumberInGroup: frameDomainApi.getMaxFramePageNumberInGroup,
      createDrawingFrameCell: frameDomainApi.createDrawingFrameCell,
      getRightmostFrameInGroup: frameDomainApi.getRightmostFrameInGroup,
      addTopLevelCell: frameDomainApi.addTopLevelCell,
      getLeftmostFrame: frameDomainApi.getLeftmostFrame,
      getBottommostFrame: frameDomainApi.getBottommostFrame,
      insertFrame: commandApi.insertFrame,
      showStatus,
      setCanvasStatus
    };
  }
  function openInsertFrameDialog() {
    var deps = arguments.length > 0 ? arguments[0] : buildFrameDialogDeps();
    var ctx = deps.ctx;
    var graph = ctx.graph;
    var state = ctx.state;
    var defaultConfig = deps.normalizeFrameConfig(state.frameConfig || {});
    var selectedFrame = deps.findDrawingFrame(graph.getSelectionCell());
    var existingFrames = deps.getAllDrawingFrames();
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
    widthLabel.innerText = "\u5BBD";
    row.appendChild(widthLabel);
    var widthInput = document.createElement("input");
    widthInput.setAttribute("type", "number");
    widthInput.setAttribute("min", "320");
    widthInput.style.width = "140px";
    widthInput.value = String(defaultConfig.width);
    row.appendChild(widthInput);
    var heightLabel = document.createElement("div");
    heightLabel.innerText = "\u9AD8";
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
    hint.innerText = selectedFrame != null ? "\u5DF2\u9009\u4E2D\u56FE\u6846\u7EC4\uFF1A\u65B0\u56FE\u6846\u4F1A\u7EED\u63A5\u5230\u5F53\u524D\u7EC4\u53F3\u4FA7\uFF1B\u672A\u9009\u4E2D\u56FE\u6846\u65F6\u4F1A\u5728\u73B0\u6709\u7EC4\u4E0B\u65B9\u65B0\u5EFA\u4E00\u7EC4\u3002" : existingFrames.length > 0 ? "\u5F53\u524D\u672A\u9009\u4E2D\u56FE\u6846\uFF1A\u65B0\u56FE\u6846\u4F1A\u5728\u73B0\u6709\u56FE\u6846\u7EC4\u4E0B\u65B9\u65B0\u5EFA\u4E00\u7EC4\u3002\u9009\u4E2D\u67D0\u4E2A\u56FE\u6846\u540E\u518D\u63D2\u5165\uFF0C\u53EF\u7EED\u63A5\u5230\u8BE5\u7EC4\u53F3\u4FA7\u3002" : "\u9996\u6B21\u8BBE\u7F6E\u7684\u5C3A\u5BF8\u4F1A\u4F5C\u4E3A\u540E\u7EED\u81EA\u52A8\u5206\u9875\u56FE\u6846\u7684\u9ED8\u8BA4\u5C3A\u5BF8\u3002";
    div.appendChild(hint);
    var buttons = document.createElement("div");
    div.appendChild(buttons);
    var wnd = new mxWindow("\u63D2\u5165\u56FE\u6846", div, 180, 140, 420, 170, true, true);
    wnd.destroyOnClose = true;
    wnd.setClosable(true);
    wnd.setMaximizable(false);
    wnd.setResizable(false);
    wnd.setScrollable(false);
    var submitButton = deps.createButton("\u63D2\u5165\u56FE\u6846", function() {
      var config = deps.normalizeFrameConfig({
        width: widthInput.value,
        height: heightInput.value
      });
      deps.insertFrame(config, selectedFrame, existingFrames);
      wnd.destroy();
    });
    submitButton.style.marginTop = "0";
    buttons.appendChild(submitButton);
    wnd.setVisible(true);
  }

  // ui/shared/previewSurface.js
  function clamp3(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }
  function findPreviewItemById(list, id) {
    var i;
    for (i = 0; Array.isArray(list) && i < list.length; i++) {
      if (list[i].id == id) {
        return list[i];
      }
    }
    return null;
  }
  function getPreviewMetrics(spec, surface) {
    var surfaceWidth = Math.max(200, surface.clientWidth || 520);
    var surfaceHeight = Math.max(200, surface.clientHeight || 260);
    var padding = 52;
    var scale = Math.min(
      (surfaceWidth - padding * 2) / spec.size.width,
      (surfaceHeight - padding * 2) / spec.size.height
    );
    var width;
    var height;
    scale = clamp3(scale, 0.35, 2.5);
    width = spec.size.width * scale;
    height = spec.size.height * scale;
    return {
      left: Math.round((surfaceWidth - width) / 2),
      top: Math.round((surfaceHeight - height) / 2),
      width,
      height,
      scale
    };
  }
  function getRelativePoint(evt, surface, metrics, clampToBody) {
    var rect = surface.getBoundingClientRect();
    var x = (evt.clientX - rect.left - metrics.left) / metrics.width;
    var y = (evt.clientY - rect.top - metrics.top) / metrics.height;
    return {
      x: clampToBody ? clamp3(x, 0, 1) : clamp3(x, -1.5, 2.5),
      y: clampToBody ? clamp3(y, 0, 1) : clamp3(y, -1.5, 2.5)
    };
  }
  function snapPortPointToEdge(point, metrics, thresholdPx) {
    var thresholdX;
    var thresholdY;
    var distances = [];
    var snapped;
    thresholdPx = Math.max(0, thresholdPx == null ? 12 : thresholdPx);
    thresholdX = thresholdPx / Math.max(1, metrics.width);
    thresholdY = thresholdPx / Math.max(1, metrics.height);
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
    distances.sort(function(a, b) {
      return a.distance - b.distance;
    });
    snapped = {
      x: point.x,
      y: point.y
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
  function positionPortTarget(target, metrics, point) {
    target.style.left = metrics.left + point.x * metrics.width - 7 + "px";
    target.style.top = metrics.top + point.y * metrics.height - 7 + "px";
  }
  function positionLabelTarget(target, metrics, label) {
    target.style.left = metrics.left + label.x * metrics.width - label.width / 2 + "px";
    target.style.top = metrics.top + label.y * metrics.height - label.height / 2 + "px";
  }
  function renderInteractivePreviewSurface(deps, options) {
    var resolvePreviewMetrics = deps != null && typeof deps.getPreviewMetrics === "function" ? deps.getPreviewMetrics : getPreviewMetrics;
    var resolveRelativePoint = deps != null && typeof deps.getRelativePoint === "function" ? deps.getRelativePoint : getRelativePoint;
    var surface = document.createElement("div");
    surface.style.position = "relative";
    surface.style.height = String(options.height || 278) + "px";
    surface.style.overflow = "hidden";
    surface.style.cursor = options.mode == "port" || options.mode == "label" ? "crosshair" : "default";
    surface.style.background = options.background || (Editor.isDarkMode() ? "linear-gradient(180deg, #111111, #171717)" : "linear-gradient(180deg, #fafafa, #f3f4f6)");
    options.container.appendChild(surface);
    var metrics = resolvePreviewMetrics(options.spec, surface);
    var img = document.createElement("img");
    img.setAttribute("alt", options.title || "");
    img.setAttribute("src", options.svgDataUri || "");
    img.style.position = "absolute";
    img.style.left = metrics.left + "px";
    img.style.top = metrics.top + "px";
    img.style.width = metrics.width + "px";
    img.style.height = metrics.height + "px";
    img.style.objectFit = "fill";
    img.style.pointerEvents = "none";
    surface.appendChild(img);
    function getPort(id) {
      return typeof options.getPortById === "function" ? options.getPortById(id) : findPreviewItemById(options.ports, id);
    }
    function getLabel(id) {
      return typeof options.getLabelById === "function" ? options.getLabelById(id) : findPreviewItemById(options.labels, id);
    }
    function requestRender() {
      if (typeof options.onRequestRender === "function") {
        options.onRequestRender();
      }
    }
    function isSelected(type, id) {
      return options.selectedItem != null && options.selectedItem.type == type && options.selectedItem.id == id;
    }
    function startDrag(type, id, target) {
      return function(evt) {
        evt.preventDefault();
        evt.stopPropagation();
        if (typeof options.onSelect === "function") {
          options.onSelect(type, id);
        }
        function moveHandler(moveEvt) {
          var point = resolveRelativePoint(
            moveEvt,
            surface,
            metrics,
            type == "port"
          );
          var item;
          if (typeof options.onDragMove === "function") {
            options.onDragMove(type, id, point, metrics, target);
          }
          item = type == "port" ? getPort(id) : getLabel(id);
          if (item == null) {
            return;
          }
          if (type == "port") {
            positionPortTarget(target, metrics, item);
          } else {
            positionLabelTarget(target, metrics, item);
          }
        }
        function upHandler() {
          document.removeEventListener("mousemove", moveHandler);
          document.removeEventListener("mouseup", upHandler);
          if (typeof options.onDragEnd === "function") {
            options.onDragEnd(type, id, metrics, target);
          }
          requestRender();
        }
        document.addEventListener("mousemove", moveHandler);
        document.addEventListener("mouseup", upHandler);
      };
    }
    (options.ports || []).forEach(function(point, index) {
      var handle = document.createElement("div");
      handle.style.position = "absolute";
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
      handle.innerText = point.marker == "circle" ? "\u25CF" : point.marker == "hidden" ? "" : "\xD7";
      handle.title = typeof options.buildPortTitle === "function" ? options.buildPortTitle(point, index) : point.id || "";
      if (isSelected("port", point.id)) {
        handle.style.textShadow = "0 0 6px rgba(26,115,232,0.45)";
      }
      positionPortTarget(handle, metrics, point);
      mxEvent.addListener(
        handle,
        "mousedown",
        startDrag("port", point.id, handle)
      );
      mxEvent.addListener(handle, "click", function(evt) {
        evt.stopPropagation();
        if (typeof options.onSelect === "function") {
          options.onSelect("port", point.id);
        }
        requestRender();
      });
      surface.appendChild(handle);
    });
    (options.labels || []).forEach(function(label) {
      var box = document.createElement("div");
      box.style.position = "absolute";
      box.style.width = label.width + "px";
      box.style.minHeight = label.height + "px";
      box.style.padding = "2px 6px";
      box.style.boxSizing = "border-box";
      box.style.background = Editor.isDarkMode() ? "#1f1f1f" : "#ffffff";
      box.style.border = isSelected("label", label.id) ? "2px solid #1a73e8" : "1px dashed #9aa4b2";
      box.style.borderRadius = "4px";
      box.style.fontSize = "12px";
      box.style.lineHeight = "20px";
      box.style.textAlign = label.align;
      box.style.cursor = "move";
      box.style.userSelect = "none";
      box.style.zIndex = "2";
      box.innerText = typeof options.getLabelText === "function" ? options.getLabelText(label) : label.text || "";
      positionLabelTarget(box, metrics, label);
      mxEvent.addListener(box, "mousedown", startDrag("label", label.id, box));
      mxEvent.addListener(box, "click", function(evt) {
        evt.stopPropagation();
        if (typeof options.onSelect === "function") {
          options.onSelect("label", label.id);
        }
        requestRender();
      });
      if (typeof options.onLabelDoubleClick === "function") {
        mxEvent.addListener(box, "dblclick", function(evt) {
          evt.stopPropagation();
          options.onLabelDoubleClick(label, evt);
        });
      }
      surface.appendChild(box);
    });
    mxEvent.addListener(surface, "click", function(evt) {
      if (evt.target !== surface) {
        return;
      }
      if (typeof options.onSurfaceClick === "function") {
        options.onSurfaceClick(
          resolveRelativePoint(evt, surface, metrics, options.mode == "port"),
          metrics,
          evt
        );
      }
    });
    return {
      metrics,
      surface
    };
  }

  // ui/instanceEditor.js
  function buildInstanceEditorDeps() {
    var app = getApp();
    var ctx = app.ctx;
    return {
      ctx,
      findElectricalRoot,
      showStatus,
      extractSpec: symbolDomainApi.extractSpec,
      normalizePortLayout: specDomainApi.normalizePortLayout,
      normalizeLabels: specDomainApi.normalizeLabels,
      trim,
      getValueByPath: specDomainApi.getValueByPath,
      createButton: createPluginButton,
      normalizePortMarker: specDomainApi.normalizePortMarker,
      normalizePortDirection: specDomainApi.normalizePortDirection,
      normalizePortIoMode: specDomainApi.normalizePortIoMode,
      normalizeLabelAlign: specDomainApi.normalizeLabelAlign,
      toSvgDataUri: specDomainApi.toSvgDataUri,
      portEdgeSnapThresholdPx: ctx.constants.PORT_EDGE_SNAP_THRESHOLD_PX,
      normalizePortPoint: specDomainApi.normalizePortPoint,
      normalizeLabelItem: specDomainApi.normalizeLabelItem,
      applyInstanceSpec: commandApi.applyInstanceSpec
    };
  }
  function openEditInstanceDialog() {
    var deps = arguments.length > 0 ? arguments[0] : buildInstanceEditorDeps();
    var ctx = deps.ctx;
    var graph = ctx.graph;
    var state = ctx.state;
    var root = deps.findElectricalRoot(graph.getSelectionCell());
    if (root == null) {
      deps.showStatus("\u8BF7\u5148\u9009\u62E9\u4E00\u4E2A\u7535\u6C14\u56FE\u5143\u5B9E\u4F8B", true);
      return;
    }
    if (state.instanceWindow != null) {
      state.instanceWindow.destroy();
      state.instanceWindow = null;
    }
    var editorState = {
      spec: deps.extractSpec(root),
      selectedItem: null,
      mode: "select",
      nextId: 1,
      preview: null,
      statusNode: null
    };
    editorState.spec.ports = deps.normalizePortLayout(editorState.spec.ports);
    editorState.spec.labels = deps.normalizeLabels(editorState.spec.labels);
    function scanNextId() {
      var maxId = 0;
      function scan(id) {
        var match = /:(\d+)$/.exec(deps.trim(id));
        if (match != null) {
          maxId = Math.max(maxId, parseInt(match[1], 10) || 0);
        }
      }
      editorState.spec.ports.forEach(function(item) {
        scan(item.id);
      });
      editorState.spec.labels.forEach(function(item) {
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
      editorState.selectedItem = type != null && id != null ? { type, id } : null;
    }
    function updateEditorStatus(message, isError) {
      if (editorState.statusNode != null) {
        editorState.statusNode.innerText = message || "";
        editorState.statusNode.style.color = isError ? "#b3261e" : "#2e7d32";
      }
    }
    function getEditorLabelText(label) {
      var binding = deps.trim(label.binding);
      if (binding.length > 0) {
        var value = deps.getValueByPath(editorState.spec.data || {}, binding);
        if (value != null) {
          return String(value);
        }
        if (deps.trim(label.text).length > 0) {
          return label.text;
        }
        return "{{" + binding + "}}";
      }
      return deps.trim(label.text).length > 0 ? label.text : "\u6587\u672C";
    }
    function deleteEditorSelection() {
      if (editorState.selectedItem == null) {
        return;
      }
      if (editorState.selectedItem.type == "port") {
        editorState.spec.ports = editorState.spec.ports.filter(function(item) {
          return item.id != editorState.selectedItem.id;
        });
      } else if (editorState.selectedItem.type == "label") {
        editorState.spec.labels = editorState.spec.labels.filter(function(item) {
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
        var btn = deps.createButton(label, function() {
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
      toolbar.appendChild(createModeButton("select", "\u9009\u62E9"));
      toolbar.appendChild(createModeButton("port", "\u6DFB\u52A0\u8FDE\u63A5\u70B9"));
      toolbar.appendChild(createModeButton("label", "\u6DFB\u52A0\u6587\u672C\u6846"));
      var deleteBtn = deps.createButton("\u5220\u9664\u9009\u4E2D", function() {
        deleteEditorSelection();
      });
      deleteBtn.style.marginTop = "0";
      deleteBtn.style.marginRight = "0";
      deleteBtn.style.padding = "4px 10px";
      toolbar.appendChild(deleteBtn);
      if (editorState.selectedItem != null && editorState.selectedItem.type == "port") {
        var selectedPort = findPreviewItemById(
          editorState.spec.ports,
          editorState.selectedItem.id
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
          portNameInput.setAttribute("placeholder", "\u7AEF\u5B50\u540D\u79F0\uFF0C\u5982 L1 / N / PE");
          portNameInput.value = selectedPort.name || "";
          portNameInput.style.width = "180px";
          portEditor.appendChild(portNameInput);
          var markerSelect = document.createElement("select");
          [
            { value: "cross", label: "\u53C9\u53F7" },
            { value: "circle", label: "\u5706\u70B9" },
            { value: "hidden", label: "\u9690\u85CF" }
          ].forEach(function(item) {
            var option = document.createElement("option");
            option.value = item.value;
            option.innerText = item.label;
            markerSelect.appendChild(option);
          });
          markerSelect.value = selectedPort.marker || "cross";
          portEditor.appendChild(markerSelect);
          var directionSelect = document.createElement("select");
          [
            { value: "any", label: "\u4EFB\u610F\u65B9\u5411" },
            { value: "left", label: "\u5DE6\u4FA7\u63A5\u5165" },
            { value: "right", label: "\u53F3\u4FA7\u63A5\u5165" },
            { value: "up", label: "\u4E0A\u4FA7\u63A5\u5165" },
            { value: "down", label: "\u4E0B\u4FA7\u63A5\u5165" }
          ].forEach(function(item) {
            var option = document.createElement("option");
            option.value = item.value;
            option.innerText = item.label;
            directionSelect.appendChild(option);
          });
          directionSelect.value = selectedPort.direction || "any";
          portEditor.appendChild(directionSelect);
          var ioSelect = document.createElement("select");
          [
            { value: "both", label: "\u53EF\u63A5\u5165\u53EF\u63A5\u51FA" },
            { value: "in", label: "\u4EC5\u63A5\u5165" },
            { value: "out", label: "\u4EC5\u63A5\u51FA" }
          ].forEach(function(item) {
            var option = document.createElement("option");
            option.value = item.value;
            option.innerText = item.label;
            ioSelect.appendChild(option);
          });
          ioSelect.value = selectedPort.ioMode || "both";
          portEditor.appendChild(ioSelect);
          mxEvent.addListener(portNameInput, "input", function() {
            selectedPort.name = deps.trim(portNameInput.value);
          });
          mxEvent.addListener(markerSelect, "change", function() {
            selectedPort.marker = deps.normalizePortMarker(markerSelect.value);
            renderEditorPreview();
          });
          mxEvent.addListener(directionSelect, "change", function() {
            selectedPort.direction = deps.normalizePortDirection(
              directionSelect.value
            );
          });
          mxEvent.addListener(ioSelect, "change", function() {
            selectedPort.ioMode = deps.normalizePortIoMode(ioSelect.value);
          });
        }
      } else if (editorState.selectedItem != null && editorState.selectedItem.type == "label") {
        var selectedLabel = findPreviewItemById(
          editorState.spec.labels,
          editorState.selectedItem.id
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
          textInput.setAttribute("placeholder", "\u6587\u672C\u5185\u5BB9");
          textInput.value = selectedLabel.text || "";
          textInput.style.width = "180px";
          labelEditor.appendChild(textInput);
          var bindingInput = document.createElement("input");
          bindingInput.setAttribute("type", "text");
          bindingInput.setAttribute("placeholder", "\u53EF\u9009\uFF1A\u7ED1\u5B9A\u5C5E\u6027\u8DEF\u5F84");
          bindingInput.value = selectedLabel.binding || "";
          bindingInput.style.width = "180px";
          labelEditor.appendChild(bindingInput);
          var alignSelect = document.createElement("select");
          [
            { value: "left", label: "\u5DE6\u5BF9\u9F50" },
            { value: "center", label: "\u5C45\u4E2D" },
            { value: "right", label: "\u53F3\u5BF9\u9F50" }
          ].forEach(function(item) {
            var option = document.createElement("option");
            option.value = item.value;
            option.innerText = item.label;
            alignSelect.appendChild(option);
          });
          alignSelect.value = selectedLabel.align || "center";
          labelEditor.appendChild(alignSelect);
          mxEvent.addListener(textInput, "change", function() {
            selectedLabel.text = deps.trim(textInput.value);
            renderEditorPreview();
          });
          mxEvent.addListener(bindingInput, "change", function() {
            selectedLabel.binding = deps.trim(bindingInput.value);
            renderEditorPreview();
          });
          mxEvent.addListener(alignSelect, "change", function() {
            selectedLabel.align = deps.normalizeLabelAlign(alignSelect.value);
            renderEditorPreview();
          });
        }
      }
      renderInteractivePreviewSurface(
        null,
        {
          container: preview,
          spec: editorState.spec,
          height: 300,
          title: editorState.spec.title || "\u56FE\u5143\u5B9E\u4F8B",
          svgDataUri: deps.toSvgDataUri(editorState.spec),
          mode: editorState.mode,
          selectedItem: editorState.selectedItem,
          ports: editorState.spec.ports,
          labels: editorState.spec.labels,
          getPortById: function(id) {
            return findPreviewItemById(editorState.spec.ports, id);
          },
          getLabelById: function(id) {
            return findPreviewItemById(editorState.spec.labels, id);
          },
          getLabelText: getEditorLabelText,
          buildPortTitle: function(point, index) {
            return point.name || point.id || "\u8FDE\u63A5\u70B9" + (index + 1);
          },
          onSelect: setEditorSelection,
          onRequestRender: renderEditorPreview,
          onDragMove: function(type, id, point) {
            if (type == "port") {
              var port = findPreviewItemById(editorState.spec.ports, id);
              if (port != null) {
                port.x = point.x;
                port.y = point.y;
              }
            } else {
              var label = findPreviewItemById(editorState.spec.labels, id);
              if (label != null) {
                label.x = point.x;
                label.y = point.y;
              }
            }
          },
          onDragEnd: function(type, id, metrics) {
            if (type != "port") {
              return;
            }
            var finalPort = findPreviewItemById(editorState.spec.ports, id);
            if (finalPort != null) {
              var snapped = snapPortPointToEdge(
                { x: finalPort.x, y: finalPort.y },
                metrics,
                deps.portEdgeSnapThresholdPx
              );
              finalPort.x = snapped.x;
              finalPort.y = snapped.y;
            }
          },
          onSurfaceClick: function(point, metrics) {
            if (editorState.mode == "port") {
              var portId = nextEditorId("port");
              point = snapPortPointToEdge(
                point,
                metrics,
                deps.portEdgeSnapThresholdPx
              );
              editorState.spec.ports.push(
                deps.normalizePortPoint(
                  {
                    id: portId,
                    x: point.x,
                    y: point.y,
                    name: "",
                    marker: "cross",
                    direction: "any",
                    ioMode: "both"
                  },
                  portId,
                  point.x,
                  point.y
                )
              );
              setEditorSelection(
                "port",
                editorState.spec.ports[editorState.spec.ports.length - 1].id
              );
            } else if (editorState.mode == "label") {
              var labelId = nextEditorId("label");
              editorState.spec.labels.push(
                deps.normalizeLabelItem(
                  {
                    id: labelId,
                    text: "\u6587\u672C",
                    binding: "",
                    x: point.x,
                    y: point.y,
                    width: 120,
                    height: 26,
                    align: "center"
                  },
                  labelId,
                  "\u6587\u672C"
                )
              );
              setEditorSelection(
                "label",
                editorState.spec.labels[editorState.spec.labels.length - 1].id
              );
            } else {
              setEditorSelection(null, null);
            }
            renderEditorPreview();
          }
        }
      );
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
    title.innerText = "\u7F16\u8F91\u56FE\u5143\u5B9E\u4F8B";
    container.appendChild(title);
    var hint = document.createElement("div");
    hint.style.marginBottom = "10px";
    hint.style.color = Editor.isDarkMode() ? "#c0c4cc" : "#57606a";
    hint.style.fontSize = "12px";
    hint.innerText = "\u8FD9\u91CC\u4FEE\u6539\u7684\u662F\u5F53\u524D\u753B\u5E03\u4E0A\u7684\u8FD9\u4E2A\u56FE\u5143\u5B9E\u4F8B\uFF0C\u4E0D\u4F1A\u5F71\u54CD\u56FE\u5143\u7C7B\u578B\u6A21\u677F\u3002";
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
    var applyButton = deps.createButton("\u5E94\u7528\u5230\u56FE\u5143", function() {
      try {
        deps.applyInstanceSpec(root, editorState.spec);
      } catch (e) {
        updateEditorStatus(e.message || String(e), true);
        return;
      }
      updateEditorStatus("\u5DF2\u66F4\u65B0\u56FE\u5143\u5B9E\u4F8B", false);
      if (state.instanceWindow != null) {
        state.instanceWindow.destroy();
      }
    });
    applyButton.style.marginTop = "0";
    applyButton.style.marginRight = "0";
    buttons.appendChild(applyButton);
    var closeButton = deps.createButton("\u5173\u95ED", function() {
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
    var wnd = new mxWindow(
      "\u7F16\u8F91\u56FE\u5143\u5B9E\u4F8B",
      container,
      220,
      120,
      680,
      520,
      true,
      true
    );
    wnd.destroyOnClose = true;
    wnd.setClosable(true);
    wnd.setMaximizable(false);
    wnd.setResizable(true);
    wnd.setScrollable(true);
    wnd.addListener(mxEvent.DESTROY, function() {
      if (state.instanceWindow == wnd) {
        state.instanceWindow = null;
      }
    });
    wnd.setVisible(true);
    state.instanceWindow = wnd;
  }

  // services/draftStore.js
  function buildDraftStoreDeps() {
    var app = getApp();
    return {
      state: app.ctx.state,
      storageKey: app.ctx.constants.TEMPLATE_DRAFT_STORAGE_KEY,
      trim,
      cloneJson
    };
  }
  function getDraftDeps() {
    return buildDraftStoreDeps();
  }
  function getDraftStorage() {
    try {
      return window.localStorage;
    } catch (e) {
      return null;
    }
  }
  function clearDraftSaveTimer() {
    var deps = getDraftDeps();
    var state = deps.state;
    if (state.draftSaveTimer != null) {
      window.clearTimeout(state.draftSaveTimer);
      state.draftSaveTimer = null;
    }
  }
  function buildEditorDraftSnapshot() {
    var deps = getDraftDeps();
    var state = deps.state;
    var trim2 = deps.trim;
    var cloneJson2 = deps.cloneJson;
    return {
      symbolId: state.symbolIdInput != null ? trim2(state.symbolIdInput.value) : "",
      symbolIdTouched: !!state.symbolIdTouched,
      templateName: state.templateNameInput != null ? trim2(state.templateNameInput.value) : "",
      templateWidth: state.templateWidthInput != null ? trim2(state.templateWidthInput.value) : "",
      templateHeight: state.templateHeightInput != null ? trim2(state.templateHeightInput.value) : "",
      uploadedPrimarySvg: state.uploadedPrimarySvg || "",
      uploadedPrimarySvgName: state.uploadedPrimarySvgName || "",
      uploadedPrimarySvgSize: state.uploadedPrimarySvgSize || null,
      variantEnabled: !!state.variantEnabled,
      variantField: state.variantFieldInput != null ? trim2(state.variantFieldInput.value) : "",
      previewVariantId: trim2(state.previewVariantId),
      schemaFields: cloneJson2(state.schemaFields || []),
      variantItems: cloneJson2(state.variantItems || []),
      currentSpec: state.currentSpec != null ? cloneJson2(state.currentSpec) : null
    };
  }
  function saveEditorDraftNow() {
    var deps = getDraftDeps();
    var storage = getDraftStorage();
    clearDraftSaveTimer();
    if (storage == null) {
      return;
    }
    try {
      storage.setItem(deps.storageKey, JSON.stringify(buildEditorDraftSnapshot()));
    } catch (e) {
    }
  }
  function scheduleEditorDraftSave() {
    var deps = getDraftDeps();
    clearDraftSaveTimer();
    deps.state.draftSaveTimer = window.setTimeout(saveEditorDraftNow, 180);
  }
  function loadEditorDraft() {
    var deps = getDraftDeps();
    var storage = getDraftStorage();
    var raw;
    if (storage == null) {
      return null;
    }
    try {
      raw = storage.getItem(deps.storageKey);
    } catch (e) {
      return null;
    }
    if (deps.trim(raw).length == 0) {
      return null;
    }
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }
  function clearEditorDraft() {
    var deps = getDraftDeps();
    var storage = getDraftStorage();
    clearDraftSaveTimer();
    if (storage == null) {
      return;
    }
    try {
      storage.removeItem(deps.storageKey);
    } catch (e) {
    }
  }
  var draftStoreApi = {
    buildEditorDraftSnapshot,
    clearDraftSaveTimer,
    clearEditorDraft,
    loadEditorDraft,
    saveEditorDraftNow,
    scheduleEditorDraftSave
  };

  // ui/templateEditor.js
  function getTemplateEditorDeps() {
    var app = getApp();
    var ctx = app.ctx;
    return {
      ctx,
      trim,
      cloneJson,
      normalizePortLayout: specDomainApi.normalizePortLayout,
      normalizeLabels: specDomainApi.normalizeLabels,
      toSvgDataUri: specDomainApi.toSvgDataUri,
      createButton: createPluginButton,
      normalizePortMarker: specDomainApi.normalizePortMarker,
      normalizePortDirection: specDomainApi.normalizePortDirection,
      normalizePortIoMode: specDomainApi.normalizePortIoMode,
      portEdgeSnapThresholdPx: ctx.constants.PORT_EDGE_SNAP_THRESHOLD_PX,
      nextItemId,
      normalizeLabelItem: specDomainApi.normalizeLabelItem,
      validateSvg,
      extractSvgSize,
      scheduleEditorDraftSave: draftStoreApi.scheduleEditorDraftSave,
      clearDraftSaveTimer: draftStoreApi.clearDraftSaveTimer,
      loadEditorDraft: draftStoreApi.loadEditorDraft,
      clearEditorDraft: draftStoreApi.clearEditorDraft,
      generateSymbolId,
      getDefaultSchemaFields: specDomainApi.getDefaultSchemaFields,
      buildSchemaFromFields: specDomainApi.buildSchemaFromFields,
      hasSchemaPath: specDomainApi.hasSchemaPath,
      normalizeSchemaField: specDomainApi.normalizeSchemaField,
      normalizeSchemaType: specDomainApi.normalizeSchemaType,
      normalizeEnumOptions: specDomainApi.normalizeEnumOptions,
      isValidFieldPath: specDomainApi.isValidFieldPath,
      toInt,
      showStatus,
      normalizeSpec: specDomainApi.normalizeSpec,
      normalizeVariantLayouts: specDomainApi.normalizeVariantLayouts,
      flattenSchemaFields: specDomainApi.flattenSchemaFields,
      isObject,
      addToLibrary: libraryStoreApi.addToLibrary,
      isTemplateNameTaken: libraryStoreApi.isTemplateNameTaken,
      loadStoredLibrary: libraryStoreApi.loadStoredLibrary
    };
  }
  function getTemplateEditorRuntime() {
    var deps = getTemplateEditorDeps();
    var ctx = deps.ctx;
    var state = ctx.state;
    return {
      deps,
      ctx,
      state
    };
  }
  function hasLabelBinding(spec, binding, ignoreId) {
    var runtime = getTemplateEditorRuntime();
    var deps = runtime.deps;
    var normalized = deps.trim(binding);
    var i;
    if (normalized.length == 0) {
      return false;
    }
    for (i = 0; i < spec.labels.length; i++) {
      if (spec.labels[i].id != ignoreId && deps.trim(spec.labels[i].binding) == normalized) {
        return true;
      }
    }
    return false;
  }
  function hasVariantKey(key, ignoreId) {
    var runtime = getTemplateEditorRuntime();
    var deps = runtime.deps;
    var state = runtime.state;
    var normalized = deps.trim(key);
    var i;
    if (normalized.length == 0) {
      return false;
    }
    for (i = 0; i < state.variantItems.length; i++) {
      if (state.variantItems[i].id != ignoreId && deps.trim(state.variantItems[i].key) == normalized) {
        return true;
      }
    }
    return false;
  }
  function findVariantItem(id) {
    var state = getTemplateEditorRuntime().state;
    var i;
    for (i = 0; i < state.variantItems.length; i++) {
      if (state.variantItems[i].id == id) {
        return state.variantItems[i];
      }
    }
    return null;
  }
  function getPreviewLayoutStore(spec) {
    var runtime = getTemplateEditorRuntime();
    var deps = runtime.deps;
    var state = runtime.state;
    if (state.previewVariantId != null && state.previewVariantId.length > 0) {
      var variantItem = findVariantItem(state.previewVariantId);
      if (variantItem != null) {
        variantItem.ports = deps.normalizePortLayout(variantItem.ports);
        variantItem.labels = deps.normalizeLabels(variantItem.labels);
        return variantItem;
      }
    }
    spec.ports = deps.normalizePortLayout(spec.ports);
    spec.labels = deps.normalizeLabels(spec.labels);
    return spec;
  }
  function getPreviewSvg(spec) {
    var runtime = getTemplateEditorRuntime();
    var deps = runtime.deps;
    var state = runtime.state;
    var variantItem = state.previewVariantId != null && state.previewVariantId.length > 0 ? findVariantItem(state.previewVariantId) : null;
    if (variantItem != null && deps.trim(variantItem.svg).length > 0) {
      return "data:image/svg+xml," + encodeURIComponent(variantItem.svg);
    }
    return deps.toSvgDataUri(spec);
  }
  function getPreviewTitle(spec) {
    var runtime = getTemplateEditorRuntime();
    var deps = runtime.deps;
    var state = runtime.state;
    var variantItem = state.previewVariantId != null && state.previewVariantId.length > 0 ? findVariantItem(state.previewVariantId) : null;
    if (variantItem != null) {
      return deps.trim(variantItem.key).length > 0 ? spec.title + " [" + deps.trim(variantItem.key) + "]" : spec.title + " [\u672A\u547D\u540D\u53D8\u4F53]";
    }
    return spec.title;
  }
  function getEditorSchema() {
    var runtime = getTemplateEditorRuntime();
    var deps = runtime.deps;
    var state = runtime.state;
    return deps.buildSchemaFromFields(state.schemaFields || []);
  }
  function validateVariantField(showError) {
    var runtime = getTemplateEditorRuntime();
    var deps = runtime.deps;
    var state = runtime.state;
    if (!state.variantEnabled) {
      return "";
    }
    var field = deps.trim(
      state.variantFieldInput != null ? state.variantFieldInput.value : ""
    );
    if (field.length == 0) {
      if (showError) {
        deps.showStatus("\u8BF7\u5148\u586B\u5199\u53D8\u4F53\u5B57\u6BB5", true);
      }
      return null;
    }
    try {
      var schema = getEditorSchema();
      if (!deps.isObject(schema)) {
        throw new Error("\u7C7B\u578B\u5B9A\u4E49\u5FC5\u987B\u662F\u5BF9\u8C61");
      }
      if (!deps.hasSchemaPath(schema, field)) {
        if (showError) {
          deps.showStatus("\u53D8\u4F53\u5B57\u6BB5\u5FC5\u987B\u5148\u5728 JSON \u7C7B\u578B\u5B9A\u4E49\u4E2D\u58F0\u660E", true);
        }
        return null;
      }
      return field;
    } catch (e) {
      if (showError) {
        deps.showStatus(e.message || "\u7C7B\u578B\u5B9A\u4E49\u683C\u5F0F\u6709\u8BEF", true);
      }
      return null;
    }
  }
  function collectVariantMap() {
    var runtime = getTemplateEditorRuntime();
    var deps = runtime.deps;
    var state = runtime.state;
    var variants = {};
    var i;
    if (!state.variantEnabled) {
      return variants;
    }
    for (i = 0; i < state.variantItems.length; i++) {
      var item = state.variantItems[i];
      var key = deps.trim(item.key);
      if (key.length > 0 && deps.trim(item.svg).length > 0) {
        variants[key] = item.svg;
      }
    }
    return variants;
  }
  function collectVariantLayouts() {
    var runtime = getTemplateEditorRuntime();
    var deps = runtime.deps;
    var state = runtime.state;
    var layouts = {};
    var i;
    if (!state.variantEnabled) {
      return layouts;
    }
    for (i = 0; i < state.variantItems.length; i++) {
      var item = state.variantItems[i];
      var key = deps.trim(item.key);
      if (key.length == 0) {
        continue;
      }
      layouts[key] = {
        ports: deps.normalizePortLayout(item.ports),
        labels: deps.normalizeLabels(item.labels)
      };
    }
    return layouts;
  }
  function buildTemplateSpec() {
    var runtime = getTemplateEditorRuntime();
    var deps = runtime.deps;
    var state = runtime.state;
    if (deps.trim(state.uploadedPrimarySvg).length == 0) {
      throw new Error("\u8BF7\u5148\u4E0A\u4F20\u9ED8\u8BA4SVG");
    }
    var schema = getEditorSchema();
    if (!deps.isObject(schema)) {
      throw new Error("\u7C7B\u578B\u5B9A\u4E49\u5FC5\u987B\u662F\u5BF9\u8C61");
    }
    var current = state.currentSpec || {};
    var symbolId = deps.trim(
      state.symbolIdInput != null ? state.symbolIdInput.value : ""
    );
    var templateName = deps.trim(
      state.templateNameInput != null ? state.templateNameInput.value : ""
    );
    var variantField = "";
    var baseSize;
    if (symbolId.length == 0) {
      throw new Error("\u8BF7\u5148\u586B\u5199\u56FE\u5143\u7C7B\u578BID");
    }
    if (templateName.length == 0) {
      throw new Error("\u8BF7\u5148\u586B\u5199\u56FE\u5143\u7C7B\u578B\u540D\u79F0");
    }
    if (state.variantEnabled) {
      variantField = validateVariantField(true);
      if (variantField == null) {
        throw new Error("\u53D8\u4F53\u5B57\u6BB5\u5FC5\u987B\u5148\u5728 JSON \u7C7B\u578B\u5B9A\u4E49\u4E2D\u58F0\u660E");
      }
    }
    baseSize = state.uploadedPrimarySvgSize || deps.extractSvgSize(state.uploadedPrimarySvg);
    return deps.normalizeSpec({
      symbolId,
      templateName,
      title: deps.trim(current.title) || templateName,
      svg: state.uploadedPrimarySvg,
      size: {
        width: Math.max(
          20,
          deps.toInt(
            state.templateWidthInput != null ? state.templateWidthInput.value : null,
            baseSize.width
          )
        ),
        height: Math.max(
          20,
          deps.toInt(
            state.templateHeightInput != null ? state.templateHeightInput.value : null,
            baseSize.height
          )
        )
      },
      device: current.device || {},
      ports: current.ports || [],
      labels: current.labels || [],
      schema,
      data: current.data || {},
      variantField,
      svgVariants: collectVariantMap(),
      variantLayouts: collectVariantLayouts()
    });
  }
  function parseEditorSpec() {
    var runtime = getTemplateEditorRuntime();
    var deps = runtime.deps;
    var state = runtime.state;
    try {
      var spec = buildTemplateSpec();
      state.currentSpec = spec;
      updatePreview(spec);
      deps.showStatus("\u9884\u89C8\u5DF2\u5237\u65B0", false);
      return spec;
    } catch (e) {
      deps.showStatus(e.message || String(e), true);
      throw e;
    }
  }
  function updateSelectedItem(type, id) {
    var state = getTemplateEditorRuntime().state;
    state.selectedItem = type != null && id != null ? { type, id } : null;
  }
  function deleteSelectedItem() {
    var runtime = getTemplateEditorRuntime();
    var deps = runtime.deps;
    var state = runtime.state;
    if (state.currentSpec == null || state.selectedItem == null) {
      return;
    }
    var next = deps.cloneJson(state.currentSpec);
    var layout = getPreviewLayoutStore(next);
    if (state.selectedItem.type == "port") {
      layout.ports = layout.ports.filter(function(item) {
        return item.id != state.selectedItem.id;
      });
    } else if (state.selectedItem.type == "label") {
      layout.labels = layout.labels.filter(function(item) {
        return item.id != state.selectedItem.id;
      });
    }
    state.currentSpec = deps.normalizeSpec(next);
    updateSelectedItem(null, null);
    updatePreview(state.currentSpec);
  }
  function getTemplateLabelText(label) {
    var deps = getTemplateEditorRuntime().deps;
    return deps.trim(label.binding).length > 0 ? "{{" + label.binding + "}}" : label.text || "\u672A\u7ED1\u5B9A";
  }
  function updatePreview(spec) {
    var runtime = getTemplateEditorRuntime();
    var deps = runtime.deps;
    var state = runtime.state;
    if (state.preview == null) {
      return;
    }
    state.preview.innerHTML = "";
    if (spec == null || deps.trim(spec.svg).length == 0) {
      var empty = document.createElement("div");
      empty.style.height = "100%";
      empty.style.display = "flex";
      empty.style.alignItems = "center";
      empty.style.justifyContent = "center";
      empty.style.color = Editor.isDarkMode() ? "#c0c4cc" : "#57606a";
      empty.innerText = "\u8BF7\u5148\u4E0A\u4F20\u9ED8\u8BA4SVG\uFF0C\u518D\u5728\u8FD9\u91CC\u6DFB\u52A0\u8FDE\u63A5\u70B9\u548C\u6587\u672C\u6846";
      state.preview.appendChild(empty);
      deps.scheduleEditorDraftSave();
      return;
    }
    state.currentSpec = deps.normalizeSpec(spec);
    deps.scheduleEditorDraftSave();
    var layoutStore = getPreviewLayoutStore(state.currentSpec);
    var selectedId = state.selectedItem != null ? state.selectedItem.id : null;
    var selectedType = state.selectedItem != null ? state.selectedItem.type : null;
    if (selectedType == "port" && findPreviewItemById(layoutStore.ports, selectedId) == null || selectedType == "label" && findPreviewItemById(layoutStore.labels, selectedId) == null) {
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
      var btn = deps.createButton(label, function() {
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
    toolbar.appendChild(createModeButton("select", "\u9009\u62E9"));
    toolbar.appendChild(createModeButton("port", "\u6DFB\u52A0\u8FDE\u63A5\u70B9"));
    toolbar.appendChild(createModeButton("label", "\u6DFB\u52A0\u6587\u672C\u6846"));
    if (state.variantEnabled && state.variantItems.length > 0) {
      var previewSelect = document.createElement("select");
      previewSelect.style.marginLeft = "8px";
      previewSelect.style.maxWidth = "180px";
      var defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.innerText = "\u7F16\u8F91\u9ED8\u8BA4SVG";
      previewSelect.appendChild(defaultOption);
      for (var p = 0; p < state.variantItems.length; p++) {
        var previewItem = state.variantItems[p];
        var option = document.createElement("option");
        option.value = previewItem.id;
        option.innerText = deps.trim(previewItem.key).length > 0 ? "\u7F16\u8F91\u53D8\u4F53\uFF1A" + deps.trim(previewItem.key) : "\u7F16\u8F91\u672A\u547D\u540D\u53D8\u4F53";
        previewSelect.appendChild(option);
      }
      previewSelect.value = state.previewVariantId || "";
      mxEvent.addListener(previewSelect, "change", function() {
        state.previewVariantId = previewSelect.value || "";
        updateSelectedItem(null, null);
        updatePreview(state.currentSpec);
      });
      toolbar.appendChild(previewSelect);
    }
    var deleteBtn = deps.createButton("\u5220\u9664\u9009\u4E2D", function() {
      deleteSelectedItem();
    });
    deleteBtn.style.marginTop = "0";
    deleteBtn.style.marginRight = "0";
    deleteBtn.style.padding = "4px 10px";
    toolbar.appendChild(deleteBtn);
    if (state.selectedItem != null && state.selectedItem.type == "port") {
      var selectedPort = findPreviewItemById(
        layoutStore.ports,
        state.selectedItem.id
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
        portNameInput.setAttribute("placeholder", "\u7AEF\u5B50\u540D\u79F0\uFF0C\u5982 L1 / N / PE");
        portNameInput.value = selectedPort.name || "";
        portNameInput.style.width = "180px";
        portEditor.appendChild(portNameInput);
        var markerSelect = document.createElement("select");
        [
          { value: "cross", label: "\u53C9\u53F7" },
          { value: "circle", label: "\u5706\u70B9" },
          { value: "hidden", label: "\u9690\u85CF" }
        ].forEach(function(item) {
          var option2 = document.createElement("option");
          option2.value = item.value;
          option2.innerText = item.label;
          markerSelect.appendChild(option2);
        });
        markerSelect.value = selectedPort.marker || "cross";
        portEditor.appendChild(markerSelect);
        var directionSelect = document.createElement("select");
        [
          { value: "any", label: "\u4EFB\u610F\u65B9\u5411" },
          { value: "left", label: "\u5DE6\u4FA7\u63A5\u5165" },
          { value: "right", label: "\u53F3\u4FA7\u63A5\u5165" },
          { value: "up", label: "\u4E0A\u4FA7\u63A5\u5165" },
          { value: "down", label: "\u4E0B\u4FA7\u63A5\u5165" }
        ].forEach(function(item) {
          var option2 = document.createElement("option");
          option2.value = item.value;
          option2.innerText = item.label;
          directionSelect.appendChild(option2);
        });
        directionSelect.value = selectedPort.direction || "any";
        portEditor.appendChild(directionSelect);
        var ioSelect = document.createElement("select");
        [
          { value: "both", label: "\u53EF\u63A5\u5165\u53EF\u63A5\u51FA" },
          { value: "in", label: "\u4EC5\u63A5\u5165" },
          { value: "out", label: "\u4EC5\u63A5\u51FA" }
        ].forEach(function(item) {
          var option2 = document.createElement("option");
          option2.value = item.value;
          option2.innerText = item.label;
          ioSelect.appendChild(option2);
        });
        ioSelect.value = selectedPort.ioMode || "both";
        portEditor.appendChild(ioSelect);
        mxEvent.addListener(portNameInput, "input", function() {
          selectedPort.name = deps.trim(portNameInput.value);
          updatePreview(state.currentSpec);
        });
        mxEvent.addListener(markerSelect, "change", function() {
          selectedPort.marker = deps.normalizePortMarker(markerSelect.value);
          updatePreview(state.currentSpec);
        });
        mxEvent.addListener(directionSelect, "change", function() {
          selectedPort.direction = deps.normalizePortDirection(
            directionSelect.value
          );
          updatePreview(state.currentSpec);
        });
        mxEvent.addListener(ioSelect, "change", function() {
          selectedPort.ioMode = deps.normalizePortIoMode(ioSelect.value);
          updatePreview(state.currentSpec);
        });
      }
    }
    renderInteractivePreviewSurface(null, {
      container: state.preview,
      spec: state.currentSpec,
      height: 278,
      title: getPreviewTitle(state.currentSpec),
      svgDataUri: getPreviewSvg(state.currentSpec),
      mode: state.previewMode,
      selectedItem: state.selectedItem,
      ports: layoutStore.ports,
      labels: layoutStore.labels,
      getPortById: function(id) {
        return findPreviewItemById(
          getPreviewLayoutStore(state.currentSpec).ports,
          id
        );
      },
      getLabelById: function(id) {
        return findPreviewItemById(
          getPreviewLayoutStore(state.currentSpec).labels,
          id
        );
      },
      getLabelText: getTemplateLabelText,
      buildPortTitle: function(point) {
        return point.id;
      },
      onSelect: updateSelectedItem,
      onRequestRender: function() {
        updatePreview(state.currentSpec);
      },
      onDragMove: function(type, id, point) {
        var current = state.currentSpec;
        var nextLayout = getPreviewLayoutStore(current);
        if (type == "port") {
          var port = findPreviewItemById(nextLayout.ports, id);
          if (port != null) {
            port.x = point.x;
            port.y = point.y;
          }
        } else {
          var label = findPreviewItemById(nextLayout.labels, id);
          if (label != null) {
            label.x = point.x;
            label.y = point.y;
          }
        }
      },
      onDragEnd: function(type, id, metrics) {
        if (type != "port" || state.currentSpec == null) {
          return;
        }
        var finalLayout = getPreviewLayoutStore(state.currentSpec);
        var finalPort = findPreviewItemById(finalLayout.ports, id);
        if (finalPort != null) {
          var snappedPoint = snapPortPointToEdge(
            { x: finalPort.x, y: finalPort.y },
            metrics,
            deps.portEdgeSnapThresholdPx
          );
          finalPort.x = snappedPoint.x;
          finalPort.y = snappedPoint.y;
        }
      },
      onSurfaceClick: function(point, metrics) {
        if (state.previewMode == "port") {
          point = snapPortPointToEdge(
            point,
            metrics,
            deps.portEdgeSnapThresholdPx
          );
          layoutStore.ports.push({
            id: deps.nextItemId("port"),
            x: point.x,
            y: point.y
          });
          updateSelectedItem(
            "port",
            layoutStore.ports[layoutStore.ports.length - 1].id
          );
          updatePreview(state.currentSpec);
        } else if (state.previewMode == "label") {
          var binding = window.prompt(
            "\u8F93\u5165\u7ED1\u5B9A\u5C5E\u6027\u8DEF\u5F84\uFF0C\u4F8B\u5982 name \u6216 device.name",
            "name"
          );
          var labelId = deps.nextItemId("label");
          if (binding == null) {
            return;
          }
          binding = deps.trim(binding);
          if (hasLabelBinding({ labels: layoutStore.labels }, binding, null)) {
            deps.showStatus("\u540C\u4E00\u4E2A\u5C5E\u6027\u53EA\u80FD\u7ED1\u5B9A\u4E00\u4E2A\u6587\u672C\u6846", true);
            return;
          }
          layoutStore.labels.push(
            deps.normalizeLabelItem(
              {
                id: labelId,
                text: "\u6587\u672C",
                binding,
                x: point.x,
                y: point.y,
                width: 120,
                height: 26,
                align: "center"
              },
              labelId,
              "\u6587\u672C"
            )
          );
          updateSelectedItem(
            "label",
            layoutStore.labels[layoutStore.labels.length - 1].id
          );
          updatePreview(state.currentSpec);
        } else {
          updateSelectedItem(null, null);
          updatePreview(state.currentSpec);
        }
      },
      onLabelDoubleClick: function(label) {
        var nextBinding = window.prompt(
          "\u8F93\u5165\u7ED1\u5B9A\u5C5E\u6027\u8DEF\u5F84\uFF0C\u4F8B\u5982 name \u6216 device.name",
          label.binding
        );
        if (nextBinding == null) {
          return;
        }
        nextBinding = deps.trim(nextBinding);
        if (hasLabelBinding(
          { labels: getPreviewLayoutStore(state.currentSpec).labels },
          nextBinding,
          label.id
        )) {
          deps.showStatus("\u540C\u4E00\u4E2A\u5C5E\u6027\u53EA\u80FD\u7ED1\u5B9A\u4E00\u4E2A\u6587\u672C\u6846", true);
          return;
        }
        label.binding = nextBinding;
        updateSelectedItem("label", label.id);
        updatePreview(state.currentSpec);
      }
    });
  }
  function bindSvgUpload(input, nameNode, svgKey, nameKey, successMessage, updateSize, onLoaded) {
    var runtime = getTemplateEditorRuntime();
    var deps = runtime.deps;
    var state = runtime.state;
    mxEvent.addListener(input, "change", function() {
      if (input.files == null || input.files.length == 0) {
        return;
      }
      var reader = new FileReader();
      reader.onload = function() {
        try {
          var svg = deps.validateSvg(reader.result);
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
            state.uploadedPrimarySvgSize = deps.extractSvgSize(svg);
          }
          if (nameNode != null && nameKey != null) {
            nameNode.innerText = state[nameKey];
          }
          if (deps.trim(state.uploadedPrimarySvg).length > 0) {
            parseEditorSpec();
          } else {
            updatePreview(null);
          }
          deps.scheduleEditorDraftSave();
          deps.showStatus(successMessage, false);
        } catch (e) {
          deps.showStatus(e.message || String(e), true);
        }
      };
      reader.readAsText(input.files[0], "utf-8");
    });
  }
  function createWindow() {
    var runtime = getTemplateEditorRuntime();
    var deps = runtime.deps;
    var ctx = runtime.ctx;
    var state = runtime.state;
    deps.clearDraftSaveTimer();
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
    title.innerText = "\u7535\u6C14\u56FE\u5143\u7C7B\u578B\u5B9A\u4E49";
    container.appendChild(title);
    var symbolRow = document.createElement("div");
    symbolRow.style.display = "flex";
    symbolRow.style.alignItems = "center";
    symbolRow.style.marginBottom = "10px";
    container.appendChild(symbolRow);
    var symbolLabel = document.createElement("div");
    symbolLabel.style.width = "90px";
    symbolLabel.style.flex = "0 0 90px";
    symbolLabel.innerText = "\u56FE\u5143\u7C7B\u578BID";
    symbolRow.appendChild(symbolLabel);
    state.symbolIdInput = document.createElement("input");
    state.symbolIdInput.setAttribute("type", "text");
    state.symbolIdInput.style.flex = "1 1 auto";
    state.symbolIdInput.style.boxSizing = "border-box";
    state.symbolIdInput.value = deps.generateSymbolId("electrical-symbol");
    symbolRow.appendChild(state.symbolIdInput);
    mxEvent.addListener(state.symbolIdInput, "input", function() {
      state.symbolIdTouched = true;
      deps.scheduleEditorDraftSave();
    });
    var nameRow = document.createElement("div");
    nameRow.style.display = "flex";
    nameRow.style.alignItems = "center";
    nameRow.style.marginBottom = "10px";
    container.appendChild(nameRow);
    var nameLabel = document.createElement("div");
    nameLabel.style.width = "90px";
    nameLabel.style.flex = "0 0 90px";
    nameLabel.innerText = "\u56FE\u5143\u7C7B\u578B\u540D\u79F0";
    nameRow.appendChild(nameLabel);
    state.templateNameInput = document.createElement("input");
    state.templateNameInput.setAttribute("type", "text");
    state.templateNameInput.style.flex = "1 1 auto";
    state.templateNameInput.style.boxSizing = "border-box";
    state.templateNameInput.value = "\u7535\u6C14\u56FE\u5143";
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
    sizeLabel.innerText = "\u9ED8\u8BA4\u5BBD\u9AD8";
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
    var primaryButton = deps.createButton(
      mxResources.get("electricalUploadPrimarySvg"),
      function() {
        primaryInput.click();
      }
    );
    primaryButton.style.marginTop = "0";
    topRow.appendChild(primaryButton);
    var primaryName = document.createElement("div");
    primaryName.style.marginLeft = "8px";
    primaryName.style.marginRight = "12px";
    primaryName.style.color = Editor.isDarkMode() ? "#c0c4cc" : "#57606a";
    primaryName.innerText = "\u672A\u9009\u62E9\u9ED8\u8BA4SVG";
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
    variantLabel.innerText = "\u53D8\u4F53\u5B57\u6BB5";
    variantRow.appendChild(variantLabel);
    state.variantFieldInput = document.createElement("input");
    state.variantFieldInput.setAttribute("type", "text");
    state.variantFieldInput.style.flex = "1 1 auto";
    state.variantFieldInput.style.boxSizing = "border-box";
    state.variantFieldInput.value = "";
    state.variantFieldInput.setAttribute(
      "placeholder",
      "\u8BF7\u8F93\u5165\u7C7B\u578B\u5B9A\u4E49\u91CC\u5DF2\u5B58\u5728\u7684\u5B57\u6BB5\u8DEF\u5F84"
    );
    variantRow.appendChild(state.variantFieldInput);
    var addVariantButton = deps.createButton(
      mxResources.get("electricalAddVariantSvg"),
      function() {
        if (state.variantEnabled && validateVariantField(true) == null) {
          return;
        }
        state.variantItems.push({
          id: deps.nextItemId("variant"),
          key: "",
          svg: "",
          name: "",
          ports: deps.cloneJson(
            state.currentSpec != null ? state.currentSpec.ports || [] : []
          ),
          labels: deps.cloneJson(
            state.currentSpec != null ? state.currentSpec.labels || [] : []
          )
        });
        renderVariantList();
        updateSelectedItem(null, null);
        updatePreview(state.currentSpec);
        deps.scheduleEditorDraftSave();
      }
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
      state.variantItems.forEach(function(item) {
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
          "\u53D8\u4F53\u503C\uFF0C\u5982 standby / large / medium"
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
        var uploadButton = deps.createButton("\u4E0A\u4F20\u53D8\u4F53SVG", function() {
          uploadInput.click();
        });
        uploadButton.style.marginTop = "0";
        uploadButton.style.marginRight = "0";
        row.appendChild(uploadButton);
        var fileName = document.createElement("div");
        fileName.style.flex = "1 1 auto";
        fileName.style.color = Editor.isDarkMode() ? "#c0c4cc" : "#57606a";
        fileName.innerText = item.name || "\u672A\u9009\u62E9\u53D8\u4F53SVG";
        row.appendChild(fileName);
        var deleteButton = deps.createButton("\u5220\u9664", function() {
          state.variantItems = state.variantItems.filter(function(entry) {
            return entry.id != item.id;
          });
          if (state.previewVariantId == item.id) {
            state.previewVariantId = "";
            updateSelectedItem(null, null);
          }
          renderVariantList();
          if (deps.trim(state.uploadedPrimarySvg).length > 0) {
            parseEditorSpec();
          }
          deps.scheduleEditorDraftSave();
        });
        deleteButton.style.marginTop = "0";
        deleteButton.style.marginRight = "0";
        row.appendChild(deleteButton);
        mxEvent.addListener(keyInput, "change", function() {
          var nextKey = deps.trim(keyInput.value);
          if (hasVariantKey(nextKey, item.id)) {
            deps.showStatus("\u540C\u4E00\u4E2A\u53D8\u4F53\u503C\u53EA\u80FD\u7ED1\u5B9A\u4E00\u5F20SVG", true);
            keyInput.value = item.key;
            return;
          }
          item.key = nextKey;
          if (state.variantEnabled) {
            validateVariantField(true);
          }
          if (deps.trim(state.uploadedPrimarySvg).length > 0) {
            parseEditorSpec();
          }
          deps.scheduleEditorDraftSave();
        });
        bindSvgUpload(
          uploadInput,
          null,
          null,
          null,
          "\u53D8\u4F53SVG \u5DF2\u52A0\u8F7D",
          false,
          function(svg, fileNameText) {
            item.svg = svg;
            item.name = fileNameText;
            fileName.innerText = item.name || "\u672A\u9009\u62E9\u53D8\u4F53SVG";
            deps.scheduleEditorDraftSave();
          }
        );
      });
    }
    state.schemaFields = deps.getDefaultSchemaFields();
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
    schemaTitle.innerText = "\u5C5E\u6027\u5B57\u6BB5\u914D\u7F6E";
    schemaHeader.appendChild(schemaTitle);
    var addFieldButton = deps.createButton("\u65B0\u589E\u5B57\u6BB5", function() {
      state.schemaFields.push(
        deps.normalizeSchemaField({
          path: "",
          type: "string",
          required: false,
          enumValues: []
        })
      );
      renderSchemaFields();
      deps.scheduleEditorDraftSave();
    });
    addFieldButton.style.marginTop = "0";
    addFieldButton.style.marginLeft = "12px";
    schemaHeader.appendChild(addFieldButton);
    var schemaList = document.createElement("div");
    schemaSection.appendChild(schemaList);
    function renderSchemaFields() {
      schemaList.innerHTML = "";
      var hasEnumField = state.schemaFields.some(function(field) {
        return deps.normalizeSchemaType(field.type) == "enum";
      });
      var header = document.createElement("div");
      header.style.display = "grid";
      header.style.gridTemplateColumns = hasEnumField ? "minmax(0, 1.6fr) 110px minmax(0, 1.2fr) 80px auto" : "minmax(0, 1.6fr) 110px 80px auto";
      header.style.gap = "8px";
      header.style.alignItems = "center";
      header.style.marginBottom = "6px";
      header.style.fontSize = "12px";
      header.style.color = Editor.isDarkMode() ? "#c0c4cc" : "#57606a";
      (hasEnumField ? ["\u5B57\u6BB5\u8DEF\u5F84", "\u7C7B\u578B", "\u679A\u4E3E\u503C", "\u5FC5\u586B", "\u64CD\u4F5C"] : ["\u5B57\u6BB5\u8DEF\u5F84", "\u7C7B\u578B", "\u5FC5\u586B", "\u64CD\u4F5C"]).forEach(function(text) {
        var cell = document.createElement("div");
        cell.innerText = text;
        header.appendChild(cell);
      });
      schemaList.appendChild(header);
      state.schemaFields.forEach(function(field) {
        var row = document.createElement("div");
        row.style.display = "grid";
        row.style.gap = "8px";
        row.style.alignItems = "center";
        row.style.marginBottom = "8px";
        schemaList.appendChild(row);
        var pathInput = document.createElement("input");
        pathInput.setAttribute("type", "text");
        pathInput.setAttribute("placeholder", "\u5B57\u6BB5\u8DEF\u5F84\uFF0C\u5982 name \u6216 device.mode");
        pathInput.value = field.path;
        row.appendChild(pathInput);
        var typeSelect = document.createElement("select");
        ["string", "number", "boolean", "enum"].forEach(function(type) {
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
        enumInput.setAttribute("placeholder", "\u679A\u4E3E\u503C\uFF0C\u9017\u53F7\u5206\u9694");
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
        requiredText.innerText = "\u5FC5\u586B";
        requiredWrap.appendChild(requiredText);
        row.appendChild(requiredWrap);
        var deleteFieldButton = deps.createButton("\u5220\u9664", function() {
          state.schemaFields = state.schemaFields.filter(function(entry) {
            return entry.id != field.id;
          });
          renderSchemaFields();
          updateVariantFieldState(false);
          deps.scheduleEditorDraftSave();
        });
        deleteFieldButton.style.marginTop = "0";
        deleteFieldButton.style.marginRight = "0";
        deleteFieldButton.style.padding = "4px 8px";
        deleteFieldButton.style.minWidth = "64px";
        deleteFieldButton.style.whiteSpace = "nowrap";
        row.appendChild(deleteFieldButton);
        function refreshRowLayout() {
          var enumVisible = deps.normalizeSchemaType(typeSelect.value) == "enum";
          row.style.gridTemplateColumns = enumVisible ? "minmax(0, 1.6fr) 110px minmax(0, 1.2fr) 80px auto" : "minmax(0, 1.6fr) 110px 80px auto";
          enumWrap.style.display = enumVisible ? "" : "none";
        }
        function syncField(showError) {
          field.path = deps.trim(pathInput.value);
          field.type = deps.normalizeSchemaType(typeSelect.value);
          field.required = requiredInput.checked;
          field.enumValues = deps.normalizeEnumOptions(enumInput.value);
          var valid = field.path.length > 0 && deps.isValidFieldPath(field.path) && state.schemaFields.filter(function(entry) {
            return deps.trim(entry.path) == field.path;
          }).length == 1 && (field.type != "enum" || field.enumValues.length > 0);
          pathInput.style.borderColor = valid ? "" : "#b3261e";
          enumInput.style.borderColor = field.type != "enum" || field.enumValues.length > 0 ? "" : "#b3261e";
          if (!valid && showError) {
            deps.showStatus("\u5B57\u6BB5\u914D\u7F6E\u6709\u8BEF\uFF0C\u8BF7\u68C0\u67E5\u8DEF\u5F84\u552F\u4E00\u6027\u548C\u679A\u4E3E\u503C", true);
          }
          updateVariantFieldState(false);
          deps.scheduleEditorDraftSave();
        }
        mxEvent.addListener(pathInput, "input", function() {
          syncField(false);
        });
        mxEvent.addListener(typeSelect, "change", function() {
          refreshRowLayout();
          syncField(false);
        });
        mxEvent.addListener(enumInput, "input", function() {
          syncField(false);
        });
        mxEvent.addListener(requiredInput, "change", function() {
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
        var match = /:(\d+)$/.exec(deps.trim(id));
        if (match != null) {
          maxId = Math.max(maxId, parseInt(match[1], 10) || 0);
        }
      }
      function scanLayout(layout) {
        var i;
        var ports = deps.normalizePortLayout(layout != null ? layout.ports : []);
        var labels = deps.normalizeLabels(layout != null ? layout.labels : []);
        for (i = 0; i < ports.length; i++) {
          scanId(ports[i].id);
        }
        for (i = 0; i < labels.length; i++) {
          scanId(labels[i].id);
        }
      }
      scanLayout(state.currentSpec);
      (state.variantItems || []).forEach(function(item) {
        scanId(item.id);
        scanLayout(item);
      });
      state.nextId = maxId + 1;
    }
    function loadTemplateIntoEditor(template, options) {
      var spec = deps.normalizeSpec(deps.cloneJson(template));
      var layouts = deps.normalizeVariantLayouts(spec.variantLayouts);
      var keys = Object.keys(spec.svgVariants || {});
      options = options || {};
      state.symbolIdTouched = !options.allowAutoSymbolId;
      state.symbolIdInput.value = deps.trim(spec.symbolId).length > 0 ? spec.symbolId : deps.generateSymbolId(
        spec.templateName || spec.title || "electrical-symbol"
      );
      state.templateNameInput.value = deps.trim(spec.templateName || spec.title) || "\u7535\u6C14\u56FE\u5143";
      state.uploadedPrimarySvg = spec.svg || "";
      state.uploadedPrimarySvgName = deps.trim(options.primarySvgName || "") || (deps.trim(spec.templateName || spec.title).length > 0 ? deps.trim(spec.templateName || spec.title) + ".svg" : "\u5DF2\u52A0\u8F7D\u9ED8\u8BA4SVG");
      state.uploadedPrimarySvgSize = spec.size != null ? deps.cloneJson(spec.size) : deps.extractSvgSize(spec.svg || "");
      if (state.templateWidthInput != null) {
        state.templateWidthInput.value = String(spec.size.width);
      }
      if (state.templateHeightInput != null) {
        state.templateHeightInput.value = String(spec.size.height);
      }
      primaryName.innerText = deps.trim(state.uploadedPrimarySvg).length > 0 ? state.uploadedPrimarySvgName : "\u672A\u9009\u62E9\u9ED8\u8BA4SVG";
      state.schemaFields = deps.flattenSchemaFields(spec.schema, "", []).map(function(field) {
        return deps.normalizeSchemaField(field);
      });
      if (state.schemaFields.length == 0) {
        state.schemaFields = deps.getDefaultSchemaFields();
      }
      state.variantEnabled = deps.trim(spec.variantField).length > 0 || Object.keys(spec.svgVariants || {}).length > 0;
      state.variantFieldInput.value = deps.trim(spec.variantField);
      state.lastValidVariantField = deps.trim(spec.variantField);
      state.previewVariantId = "";
      state.selectedItem = null;
      state.currentSpec = spec;
      state.variantItems = keys.map(function(key) {
        var variantLayout = layouts[key] || {};
        return {
          id: deps.nextItemId("variant"),
          key,
          svg: spec.svgVariants[key],
          name: key + ".svg",
          ports: deps.normalizePortLayout(variantLayout.ports || []),
          labels: deps.normalizeLabels(variantLayout.labels || [])
        };
      });
      recalcNextItemId();
      rebuildEditorUi(spec);
      deps.scheduleEditorDraftSave();
    }
    function restoreDraftIfExists() {
      var draft = deps.loadEditorDraft();
      var draftSpec;
      if (draft == null) {
        return false;
      }
      try {
        state.symbolIdTouched = !!draft.symbolIdTouched;
        state.symbolIdInput.value = deps.trim(draft.symbolId).length > 0 ? draft.symbolId : deps.generateSymbolId("electrical-symbol");
        state.templateNameInput.value = deps.trim(draft.templateName).length > 0 ? draft.templateName : "\u7535\u6C14\u56FE\u5143";
        state.uploadedPrimarySvg = deps.trim(draft.uploadedPrimarySvg);
        state.uploadedPrimarySvgName = deps.trim(draft.uploadedPrimarySvgName);
        state.uploadedPrimarySvgSize = deps.isObject(draft.uploadedPrimarySvgSize) ? deps.cloneJson(draft.uploadedPrimarySvgSize) : null;
        if (state.templateWidthInput != null) {
          state.templateWidthInput.value = deps.trim(draft.templateWidth).length > 0 ? deps.trim(draft.templateWidth) : String(
            draft.currentSpec != null && draft.currentSpec.size != null ? draft.currentSpec.size.width : state.uploadedPrimarySvgSize != null ? state.uploadedPrimarySvgSize.width : 120
          );
        }
        if (state.templateHeightInput != null) {
          state.templateHeightInput.value = deps.trim(draft.templateHeight).length > 0 ? deps.trim(draft.templateHeight) : String(
            draft.currentSpec != null && draft.currentSpec.size != null ? draft.currentSpec.size.height : state.uploadedPrimarySvgSize != null ? state.uploadedPrimarySvgSize.height : 80
          );
        }
        primaryName.innerText = deps.trim(state.uploadedPrimarySvg).length > 0 ? state.uploadedPrimarySvgName || "\u5DF2\u52A0\u8F7D\u9ED8\u8BA4SVG" : "\u672A\u9009\u62E9\u9ED8\u8BA4SVG";
        state.variantEnabled = !!draft.variantEnabled;
        state.variantFieldInput.value = deps.trim(draft.variantField);
        state.lastValidVariantField = deps.trim(draft.variantField);
        state.previewVariantId = deps.trim(draft.previewVariantId);
        state.schemaFields = Array.isArray(draft.schemaFields) ? draft.schemaFields.map(function(field) {
          return deps.normalizeSchemaField(field);
        }) : deps.getDefaultSchemaFields();
        state.variantItems = Array.isArray(draft.variantItems) ? draft.variantItems.map(function(item) {
          return {
            id: deps.trim(item.id) || deps.nextItemId("variant"),
            key: deps.trim(item.key),
            svg: deps.trim(item.svg),
            name: deps.trim(item.name),
            ports: deps.normalizePortLayout(item.ports || []),
            labels: deps.normalizeLabels(item.labels || [])
          };
        }) : [];
        draftSpec = draft.currentSpec != null && deps.trim(draft.currentSpec.svg || draft.uploadedPrimarySvg).length > 0 ? deps.normalizeSpec(deps.cloneJson(draft.currentSpec)) : null;
        state.currentSpec = draftSpec;
        recalcNextItemId();
        rebuildEditorUi(draftSpec);
        deps.showStatus("\u5DF2\u6062\u590D\u4E0A\u6B21\u672A\u4FDD\u5B58\u7684\u8349\u7A3F", false);
        return true;
      } catch (e) {
        deps.clearEditorDraft();
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
    state.preview.style.background = Editor.isDarkMode() ? "#111111" : "#fafafa";
    container.appendChild(state.preview);
    var buttons = document.createElement("div");
    buttons.style.marginTop = "10px";
    container.appendChild(buttons);
    var previewButton = deps.createButton(
      mxResources.get("electricalPreview"),
      function() {
        parseEditorSpec();
      }
    );
    buttons.appendChild(previewButton);
    var addLibraryButton = deps.createButton(
      mxResources.get("electricalAddLibrary"),
      function() {
        deps.addToLibrary(parseEditorSpec(), function() {
          deps.clearEditorDraft();
          if (state.window != null && state.window.window != null) {
            state.window.window.destroy();
          }
        });
      }
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
      var name = deps.trim(
        state.templateNameInput != null ? state.templateNameInput.value : ""
      );
      var symbolId = deps.trim(
        state.symbolIdInput != null ? state.symbolIdInput.value : ""
      );
      var valid = name.length > 0 && !deps.isTemplateNameTaken(name, symbolId);
      if (state.templateNameInput != null) {
        state.templateNameInput.style.borderColor = !valid ? "#b3261e" : "";
        state.templateNameInput.style.boxShadow = !valid ? "0 0 0 1px rgba(179,38,30,0.2)" : "";
        state.templateNameInput.title = name.length == 0 ? "\u56FE\u5143\u7C7B\u578B\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A" : !valid ? "\u56FE\u5143\u7C7B\u578B\u540D\u79F0\u4E0D\u80FD\u91CD\u590D" : "";
      }
      setButtonEnabled(addLibraryButton, valid);
      if (!valid && showError) {
        deps.showStatus(
          name.length == 0 ? "\u8BF7\u5148\u586B\u5199\u56FE\u5143\u7C7B\u578B\u540D\u79F0" : "\u56FE\u5143\u7C7B\u578B\u540D\u79F0\u4E0D\u80FD\u91CD\u590D",
          true
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
        state.variantFieldInput.style.boxShadow = !valid ? "0 0 0 1px rgba(179,38,30,0.2)" : "";
        state.variantFieldInput.title = !valid ? "\u53D8\u4F53\u5B57\u6BB5\u5FC5\u987B\u5148\u5728 JSON \u7C7B\u578B\u5B9A\u4E49\u4E2D\u58F0\u660E" : "";
      }
      setButtonEnabled(addVariantButton, !state.variantEnabled || valid);
      setButtonEnabled(previewButton, !state.variantEnabled || valid);
      setButtonEnabled(
        addLibraryButton,
        (!state.variantEnabled || valid) && updateTemplateNameState(false)
      );
      return valid;
    }
    bindSvgUpload(
      primaryInput,
      primaryName,
      "uploadedPrimarySvg",
      "uploadedPrimarySvgName",
      "\u9ED8\u8BA4SVG \u5DF2\u52A0\u8F7D",
      true,
      function() {
        state.previewVariantId = "";
        updateSelectedItem(null, null);
        if (state.templateWidthInput != null && state.uploadedPrimarySvgSize != null) {
          state.templateWidthInput.value = String(
            state.uploadedPrimarySvgSize.width
          );
        }
        if (state.templateHeightInput != null && state.uploadedPrimarySvgSize != null) {
          state.templateHeightInput.value = String(
            state.uploadedPrimarySvgSize.height
          );
        }
      }
    );
    mxEvent.addListener(primaryInput, "change", function() {
      if (state.symbolIdInput != null && !state.symbolIdTouched) {
        state.symbolIdInput.value = deps.generateSymbolId(
          state.uploadedPrimarySvgName || "electrical-symbol"
        );
        updateTemplateNameState(false);
      }
    });
    mxEvent.addListener(state.templateNameInput, "input", function() {
      updateTemplateNameState(false);
      deps.scheduleEditorDraftSave();
    });
    mxEvent.addListener(state.templateNameInput, "blur", function() {
      updateTemplateNameState(true);
    });
    mxEvent.addListener(state.templateWidthInput, "change", function() {
      if (deps.trim(state.uploadedPrimarySvg).length > 0) {
        try {
          parseEditorSpec();
        } catch (e) {
        }
      } else {
        deps.scheduleEditorDraftSave();
      }
    });
    mxEvent.addListener(state.templateHeightInput, "change", function() {
      if (deps.trim(state.uploadedPrimarySvg).length > 0) {
        try {
          parseEditorSpec();
        } catch (e) {
        }
      } else {
        deps.scheduleEditorDraftSave();
      }
    });
    mxEvent.addListener(state.variantFieldInput, "change", function() {
      var currentValue = deps.trim(state.variantFieldInput.value);
      if (state.variantEnabled) {
        if (!updateVariantFieldState(true)) {
          return;
        }
        state.lastValidVariantField = currentValue;
      }
      if (deps.trim(state.uploadedPrimarySvg).length > 0) {
        parseEditorSpec();
      }
      deps.scheduleEditorDraftSave();
    });
    mxEvent.addListener(state.variantFieldInput, "input", function() {
      updateVariantFieldState(false);
      deps.scheduleEditorDraftSave();
    });
    mxEvent.addListener(state.variantFieldInput, "blur", function() {
      updateVariantFieldState(true);
    });
    mxEvent.addListener(variantToggle, "change", function() {
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
      deps.scheduleEditorDraftSave();
      if (deps.trim(state.uploadedPrimarySvg).length > 0) {
        try {
          parseEditorSpec();
        } catch (e) {
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
      true
    );
    wnd.destroyOnClose = true;
    wnd.setClosable(true);
    wnd.setMaximizable(false);
    wnd.setResizable(true);
    wnd.setScrollable(true);
    wnd.addListener(mxEvent.DESTROY, function() {
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
      deps.clearDraftSaveTimer();
    });
    if (state.currentSpec == null) {
      updatePreview(null);
    }
    deps.loadStoredLibrary(null, true);
    return {
      window: wnd,
      container,
      loadTemplate: function(template) {
        loadTemplateIntoEditor(template);
      }
    };
  }
  function toggleWindow() {
    var state = getTemplateEditorRuntime().state;
    if (state.window == null) {
      state.window = createWindow();
      state.window.window.setVisible(true);
    } else {
      state.window.window.setVisible(!state.window.window.isVisible());
    }
  }
  function openEditorWithTemplate(template) {
    var state = getTemplateEditorRuntime().state;
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
  var templateEditorApi = {
    createWindow,
    deleteSelectedItem,
    openEditorWithTemplate,
    toggleWindow,
    updatePreview,
    updateSelectedItem
  };

  // ui/templateBrowser.js
  function buildTemplateBrowserDeps() {
    var app = getApp();
    return {
      ctx: app.ctx,
      library: libraryStoreApi,
      getLibraryEntrySpec: libraryStoreApi.getLibraryEntrySpec,
      showStatus,
      normalizePortLayout: specDomainApi.normalizePortLayout,
      normalizeLabels: specDomainApi.normalizeLabels,
      trim,
      createButton: createPluginButton,
      openEditorWithTemplate: function(template) {
        return templateEditorApi.openEditorWithTemplate(template);
      },
      openCreateFromLibraryDialog: function(preferredSymbolId) {
        return openCreateFromLibraryDialog(preferredSymbolId);
      }
    };
  }
  function openTemplateBrowserDialog() {
    var deps = arguments.length > 0 ? arguments[0] : buildTemplateBrowserDeps();
    var ctx = deps.ctx;
    var state = ctx.state;
    if (state.templatesWindow != null) {
      state.templatesWindow.setVisible(!state.templatesWindow.isVisible());
      return;
    }
    deps.library.loadStoredLibrary(function(images) {
      var templates = [];
      var i;
      for (i = 0; i < images.length; i++) {
        try {
          templates.push(deps.getLibraryEntrySpec(images[i]));
        } catch (e) {
        }
      }
      if (templates.length == 0) {
        deps.showStatus("\u7535\u6C14\u56FE\u5E93\u4E3A\u7A7A\uFF0C\u8BF7\u5148\u4FDD\u5B58\u56FE\u5143\u7C7B\u578B", true);
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
      title.innerText = "\u5DF2\u5B9A\u4E49\u56FE\u5143";
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
        var ports = deps.normalizePortLayout(template.ports);
        var labels = deps.normalizeLabels(template.labels);
        var bounds = {
          minX: 0,
          minY: 0,
          maxX: template.size.width,
          maxY: template.size.height
        };
        ports.forEach(function(point) {
          var x = point.x * template.size.width;
          var y = point.y * template.size.height;
          bounds.minX = Math.min(bounds.minX, x - 10);
          bounds.minY = Math.min(bounds.minY, y - 10);
          bounds.maxX = Math.max(bounds.maxX, x + 10);
          bounds.maxY = Math.max(bounds.maxY, y + 10);
        });
        labels.forEach(function(label) {
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
          (surfaceHeight - padding * 2) / contentHeight
        );
        scale = Math.max(0.05, scale);
        var left = Math.round(
          (surfaceWidth - contentWidth * scale) / 2 - bounds.minX * scale
        );
        var top = Math.round(
          (surfaceHeight - contentHeight * scale) / 2 - bounds.minY * scale
        );
        var img = document.createElement("img");
        img.setAttribute(
          "src",
          "data:image/svg+xml," + encodeURIComponent(template.svg)
        );
        img.setAttribute("alt", template.title);
        img.style.position = "absolute";
        img.style.left = left + "px";
        img.style.top = top + "px";
        img.style.width = Math.round(template.size.width * scale) + "px";
        img.style.height = Math.round(template.size.height * scale) + "px";
        img.style.objectFit = "fill";
        container.appendChild(img);
        ports.forEach(function(point) {
          var handle = document.createElement("div");
          handle.style.position = "absolute";
          handle.style.left = Math.round(left + point.x * template.size.width * scale - 7) + "px";
          handle.style.top = Math.round(top + point.y * template.size.height * scale - 7) + "px";
          handle.style.width = "14px";
          handle.style.height = "14px";
          handle.style.lineHeight = "14px";
          handle.style.textAlign = "center";
          handle.style.color = "#1a73e8";
          handle.style.fontSize = point.marker == "circle" ? "12px" : "16px";
          handle.style.fontWeight = "700";
          handle.style.userSelect = "none";
          handle.style.opacity = point.marker == "hidden" ? "0.35" : "1";
          handle.innerText = point.marker == "circle" ? "\u25CF" : point.marker == "hidden" ? "" : "\xD7";
          container.appendChild(handle);
        });
        labels.forEach(function(label) {
          var box = document.createElement("div");
          box.style.position = "absolute";
          box.style.left = Math.round(
            left + label.x * template.size.width * scale - label.width * scale / 2
          ) + "px";
          box.style.top = Math.round(
            top + label.y * template.size.height * scale - label.height * scale / 2
          ) + "px";
          box.style.width = Math.max(36, Math.round(label.width * scale)) + "px";
          box.style.minHeight = Math.max(20, Math.round(label.height * scale)) + "px";
          box.style.padding = "1px 4px";
          box.style.boxSizing = "border-box";
          box.style.background = Editor.isDarkMode() ? "#1f1f1f" : "#ffffff";
          box.style.border = "1px dashed #9aa4b2";
          box.style.borderRadius = "4px";
          box.style.fontSize = Math.max(10, Math.round(12 * scale)) + "px";
          box.style.lineHeight = Math.max(14, Math.round(18 * scale)) + "px";
          box.style.textAlign = label.align;
          box.style.userSelect = "none";
          box.innerText = deps.trim(label.binding).length > 0 ? "{{" + label.binding + "}}" : label.text || "";
          container.appendChild(box);
        });
      }
      templates.forEach(function(template) {
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
        window.setTimeout(function() {
          renderTemplateCardPreview(preview, template);
        }, 0);
        var actions = document.createElement("div");
        actions.style.display = "flex";
        actions.style.justifyContent = "flex-start";
        actions.style.flexWrap = "wrap";
        card.appendChild(actions);
        var editBtn = deps.createButton("\u7F16\u8F91\u6A21\u677F", function() {
          if (state.templatesWindow != null) {
            state.templatesWindow.destroy();
          }
          deps.openEditorWithTemplate(template);
        });
        editBtn.style.marginTop = "0";
        actions.appendChild(editBtn);
        var createBtn = deps.createButton("\u521B\u5EFA\u5B9E\u4F8B", function() {
          if (state.templatesWindow != null) {
            state.templatesWindow.destroy();
          }
          deps.openCreateFromLibraryDialog(template.symbolId);
        });
        createBtn.style.marginTop = "0";
        actions.appendChild(createBtn);
        var deleteBtn = deps.createButton("\u5220\u9664\u6A21\u677F", function() {
          if (!mxUtils.confirm(
            "\u786E\u5B9A\u5220\u9664\u56FE\u5143\u6A21\u677F\u201C" + (template.templateName || template.title || template.symbolId) + "\u201D\u5417\uFF1F"
          )) {
            return;
          }
          deps.library.removeTemplateFromLibrary(template.symbolId, function(nextImages) {
            if (state.templatesWindow != null) {
              state.templatesWindow.destroy();
            }
            if (nextImages != null && nextImages.length > 0) {
              openTemplateBrowserDialog(deps);
            }
          });
        });
        deleteBtn.style.marginTop = "0";
        actions.appendChild(deleteBtn);
      });
      var wnd = new mxWindow("\u5DF2\u5B9A\u4E49\u56FE\u5143", div, 160, 120, 760, 560, true, true);
      wnd.destroyOnClose = true;
      wnd.setClosable(true);
      wnd.setMaximizable(false);
      wnd.setResizable(true);
      wnd.setScrollable(true);
      wnd.setVisible(true);
      wnd.addListener(mxEvent.DESTROY, function() {
        state.templatesWindow = null;
      });
      state.templatesWindow = wnd;
    });
  }

  // application/actions.js
  function execute(fn, resetDeleteFlag) {
    try {
      return fn();
    } catch (e) {
      if (resetDeleteFlag) {
        getApp().ctx.state.allowProtectedDelete = false;
      }
      showStatus(e.message || String(e), true);
      return null;
    }
  }
  var actionApi = {
    electricalBrowse: function() {
      return execute(openTemplateBrowserDialog);
    },
    electricalClearScreen: function() {
      return execute(commandApi.clearCurrentPage, true);
    },
    electricalComposeInstance: function() {
      return execute(composeModeApi.enterInstanceComposeMode);
    },
    electricalCreate: function() {
      return execute(openCreateFromLibraryDialog);
    },
    electricalEditInstance: function() {
      return execute(openEditInstanceDialog);
    },
    electricalExport: function() {
      return execute(openExportDialog);
    },
    electricalExportSvg: function() {
      return execute(openSvgExportDialog);
    },
    electricalInsertCabinet: function() {
      return execute(cabinetDialogsApi.openInsertCabinetDialog);
    },
    electricalInsertFrame: function() {
      return execute(openInsertFrameDialog);
    },
    electricalLoadBackend: function() {
      return execute(backendDialogsApi.openBackendLoadDialog);
    },
    electricalNewBackend: function() {
      return execute(function() {
        backendServiceApi.resetBackendBinding();
        showStatus("\u5DF2\u65B0\u5EFA\u540E\u7AEF\u56FE\u7EB8\u4F1A\u8BDD\uFF0C\u4E0B\u4E00\u6B21\u4FDD\u5B58\u5C06\u521B\u5EFA\u65B0\u56FE\u7EB8", false);
      });
    },
    electricalReassignPort: function() {
      return execute(portSwapModeApi.enterPortSwapMode);
    },
    electricalRefresh: function() {
      return execute(commandApi.refreshSelection);
    },
    electricalRollbackBackend: function() {
      return execute(backendDialogsApi.openBackendRollbackDialog);
    },
    electricalSaveBackend: function() {
      return execute(backendDialogsApi.openBackendSaveDialog);
    },
    electricalForceDelete: function() {
      return execute(commandApi.forceDeleteSelection);
    },
    electricalSymbols: function() {
      return execute(templateEditorApi.toggleWindow);
    }
  };

  // ui/switchPickerDialog.js
  var DIALOG_WIDTH2 = 360;
  var DIALOG_HEIGHT2 = 420;
  function getState3() {
    return getApp().ctx.state;
  }
  function closeSwitchPickerDialog() {
    var state = getState3();
    if (state.switchPickerWindow != null) {
      var wnd = state.switchPickerWindow;
      state.switchPickerWindow = null;
      wnd.destroy();
    }
  }
  function loadTemplates(onReady) {
    libraryStoreApi.loadStoredLibrary(function(images) {
      var templates = [];
      var i;
      for (i = 0; i < images.length; i++) {
        try {
          templates.push(libraryStoreApi.getLibraryEntrySpec(images[i]));
        } catch (e) {
        }
      }
      onReady(templates);
    });
  }
  function createTemplateRow(template, onPick) {
    var row = document.createElement("div");
    row.style.display = "flex";
    row.style.alignItems = "center";
    row.style.gap = "10px";
    row.style.padding = "6px 8px";
    row.style.border = "1px solid transparent";
    row.style.borderRadius = "4px";
    row.style.cursor = "pointer";
    row.onmouseenter = function() {
      row.style.background = Editor.isDarkMode() ? "#2a2a2a" : "#f0f3f7";
      row.style.borderColor = "#2a5c9c";
    };
    row.onmouseleave = function() {
      row.style.background = "transparent";
      row.style.borderColor = "transparent";
    };
    var thumb = document.createElement("div");
    thumb.style.width = "40px";
    thumb.style.height = "32px";
    thumb.style.flex = "0 0 auto";
    thumb.style.display = "flex";
    thumb.style.alignItems = "center";
    thumb.style.justifyContent = "center";
    thumb.style.overflow = "hidden";
    if (trim(template.svg).length > 0) {
      var img = document.createElement("img");
      img.setAttribute("src", "data:image/svg+xml," + encodeURIComponent(template.svg));
      img.style.maxWidth = "100%";
      img.style.maxHeight = "100%";
      thumb.appendChild(img);
    }
    row.appendChild(thumb);
    var text = document.createElement("div");
    text.style.flex = "1 1 auto";
    text.style.minWidth = "0";
    var title = document.createElement("div");
    title.innerText = trim(template.title) || trim(template.symbolId) || "\u672A\u547D\u540D";
    title.style.fontSize = "13px";
    title.style.overflow = "hidden";
    title.style.textOverflow = "ellipsis";
    title.style.whiteSpace = "nowrap";
    text.appendChild(title);
    var subtitle = document.createElement("div");
    subtitle.innerText = trim(template.symbolId);
    subtitle.style.fontSize = "11px";
    subtitle.style.color = Editor.isDarkMode() ? "#9aa0a6" : "#6b7280";
    subtitle.style.overflow = "hidden";
    subtitle.style.textOverflow = "ellipsis";
    subtitle.style.whiteSpace = "nowrap";
    text.appendChild(subtitle);
    row.appendChild(text);
    mxEvent.addListener(row, "click", function() {
      onPick(template);
    });
    return row;
  }
  function openSwitchPickerDialog(blockCell, nativeEvent) {
    if (blockCell == null) {
      return;
    }
    closeSwitchPickerDialog();
    loadTemplates(function(templates) {
      var div = document.createElement("div");
      div.style.padding = "10px";
      div.style.display = "flex";
      div.style.flexDirection = "column";
      div.style.gap = "8px";
      div.style.boxSizing = "border-box";
      div.style.width = "100%";
      div.style.height = "100%";
      var search = document.createElement("input");
      search.setAttribute("type", "text");
      search.setAttribute("placeholder", "\u6309\u540D\u79F0\u6216\u7F16\u53F7\u7B5B\u9009");
      search.style.flex = "0 0 auto";
      div.appendChild(search);
      var list = document.createElement("div");
      list.style.flex = "1 1 auto";
      list.style.overflow = "auto";
      list.style.display = "flex";
      list.style.flexDirection = "column";
      list.style.gap = "2px";
      div.appendChild(list);
      function renderEmptyState(message, hint) {
        var box = document.createElement("div");
        box.style.padding = "16px 8px";
        box.style.color = Editor.isDarkMode() ? "#9aa0a6" : "#6b7280";
        box.style.fontSize = "12.5px";
        box.style.lineHeight = "1.7";
        var title = document.createElement("div");
        title.innerText = message;
        title.style.marginBottom = "6px";
        box.appendChild(title);
        if (hint != null) {
          var tip = document.createElement("div");
          tip.innerText = hint;
          box.appendChild(tip);
        }
        list.appendChild(box);
      }
      function pick(template) {
        try {
          commandApi.bindCabinetSwitch(
            blockCell,
            specDomainApi.buildInstanceSpec({}, template)
          );
        } catch (e) {
          var message = e.message || String(e);
          showStatus(message, true);
          setCanvasStatus(message);
          return;
        }
        closeSwitchPickerDialog();
      }
      function render() {
        var keyword = trim(search.value).toLowerCase();
        var shown = 0;
        var i;
        list.innerHTML = "";
        for (i = 0; i < templates.length; i++) {
          var template = templates[i];
          var haystack = (trim(template.title) + " " + trim(template.symbolId)).toLowerCase();
          if (keyword.length > 0 && haystack.indexOf(keyword) < 0) {
            continue;
          }
          list.appendChild(createTemplateRow(template, pick));
          shown++;
        }
        if (shown > 0) {
          return;
        }
        if (templates.length == 0) {
          renderEmptyState(
            "\u7535\u6C14\u56FE\u5143\u5E93\u8FD8\u662F\u7A7A\u7684\u3002",
            "\u5F00\u5173\u662F\u4ECE\u56FE\u5143\u5E93\u91CC\u9009\u7684\uFF1A\u5148\u5728 Extras \u83DC\u5355\u70B9\u300C\u5B9A\u4E49\u7535\u6C14\u56FE\u5143\u300D\u6253\u5F00\u7F16\u8F91\u5668\uFF0C\u753B\u597D\u5F00\u5173\u540E\u70B9\u300C\u52A0\u5165\u5E93\u300D\uFF0C\u5B83\u5C31\u4F1A\u51FA\u73B0\u5728\u8FD9\u91CC\u3002"
          );
        } else {
          renderEmptyState("\u6CA1\u6709\u5339\u914D\u7684\u56FE\u5143\u7C7B\u578B\u3002", "\u6362\u4E2A\u5173\u952E\u8BCD\uFF0C\u6216\u8005\u6E05\u7A7A\u641C\u7D22\u6846\u770B\u5168\u90E8\u3002");
        }
      }
      mxEvent.addListener(search, "input", render);
      render();
      var position = getCabinetPopupPosition(nativeEvent, DIALOG_WIDTH2, DIALOG_HEIGHT2);
      var wnd = new mxWindow(
        "\u9009\u62E9\u5F00\u5173",
        div,
        position.x,
        position.y,
        DIALOG_WIDTH2,
        DIALOG_HEIGHT2,
        true,
        true
      );
      wnd.destroyOnClose = true;
      wnd.setClosable(true);
      wnd.setMaximizable(false);
      wnd.setResizable(true);
      wnd.setScrollable(false);
      wnd.addListener(mxEvent.DESTROY, function() {
        getState3().switchPickerWindow = null;
      });
      getState3().switchPickerWindow = wnd;
      wnd.setVisible(true);
      search.focus();
    });
  }
  var switchPickerApi = {
    closeSwitchPickerDialog,
    openSwitchPickerDialog
  };

  // runtime/modelSync.js
  function buildModelSyncDeps() {
    var app = getApp();
    return {
      ctx: app.ctx,
      isObject,
      cloneJson,
      exportDiagramSnapshot: snapshotDomainApi.exportDiagramSnapshot,
      computeSnapshotChanges: snapshotDomainApi.computeSnapshotChanges,
      isElectricalRoot,
      refreshRoot: symbolDomainApi.refreshRoot
    };
  }
  function getModelSyncDeps() {
    return buildModelSyncDeps();
  }
  function recordCanvasOperation(sender, evt) {
    var deps = getModelSyncDeps();
    var ctx = deps.ctx;
    var state = ctx.state;
    if (state.suspendOperationRecording || state.updatingModel) {
      return;
    }
    var edit = evt != null ? evt.getProperty("edit") : null;
    var modelChanges = edit != null ? edit.changes : null;
    var previousSnapshot = state.lastOperationSnapshot;
    var currentSnapshot;
    var diff;
    var createdAt;
    var sequence;
    var i;
    if (!Array.isArray(modelChanges) || modelChanges.length == 0) {
      return;
    }
    currentSnapshot = deps.exportDiagramSnapshot();
    previousSnapshot = deps.isObject(previousSnapshot) ? previousSnapshot : deps.cloneJson(currentSnapshot);
    diff = deps.computeSnapshotChanges(previousSnapshot, currentSnapshot);
    state.lastOperationSnapshot = deps.cloneJson(currentSnapshot);
    if (!Array.isArray(diff.changes) || diff.changes.length == 0) {
      return;
    }
    createdAt = (/* @__PURE__ */ new Date()).toISOString();
    sequence = state.nextChangeSequence++;
    for (i = 0; i < diff.changes.length; i++) {
      var change = deps.cloneJson(diff.changes[i]);
      change.sequence = sequence;
      change.createdAt = createdAt;
      state.pendingChangeRecords.push(change);
    }
  }
  function handleModelChange(sender, evt) {
    var deps = getModelSyncDeps();
    var ctx = deps.ctx;
    var model = ctx.model;
    var state = ctx.state;
    if (state.updatingModel) {
      return;
    }
    var changes = evt.getProperty("edit").changes;
    var resizeRoots = {};
    var hasResize = false;
    var i;
    for (i = 0; i < changes.length; i++) {
      var change = changes[i];
      if (change.constructor == mxGeometryChange && change.cell != null) {
        if (deps.isElectricalRoot(change.cell)) {
          var previous = change.previous;
          var geometry = model.getGeometry(change.cell);
          if (previous != null && geometry != null && (previous.width != geometry.width || previous.height != geometry.height)) {
            resizeRoots[change.cell.id] = change.cell;
          }
        }
      }
    }
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
          deps.refreshRoot(resizeRoots[id]);
        }
      }
    } finally {
      model.endUpdate();
      state.updatingModel = false;
    }
  }
  var modelSyncApi = {
    handleModelChange,
    recordCanvasOperation
  };

  // runtime/canvasFeatures.js
  var ACTION_ITEMS = [
    {
      resourceKey: "electricalComposeInstance",
      actionKey: "electricalComposeInstance"
    },
    {
      resourceKey: "electricalReassignPort",
      actionKey: "electricalReassignPort"
    },
    {
      resourceKey: "electricalForceDelete",
      actionKey: "electricalForceDelete"
    }
  ];
  var EXTRA_MENU_ACTIONS = [
    "-",
    "electricalSymbols",
    "electricalBrowse",
    "electricalCreate",
    "electricalEditInstance",
    "electricalComposeInstance",
    "electricalInsertFrame",
    "electricalInsertCabinet",
    "electricalClearScreen",
    "electricalReassignPort",
    "electricalRefresh",
    "electricalForceDelete",
    "electricalExport",
    "electricalSaveBackend",
    "electricalNewBackend",
    "electricalLoadBackend",
    "electricalRollbackBackend"
  ];
  function installCanvasFeatures(ctx) {
    var graph = ctx.graph;
    var model = ctx.model;
    var state = ctx.state;
    var ui = ctx.ui;
    var actions = actionApi;
    var graphIsCellDeletable = graph.isCellDeletable;
    var graphIsCellMovable = graph.isCellMovable;
    var graphIsCellResizable = graph.isCellResizable;
    var graphIsCellSelectable = graph.isCellSelectable;
    var graphSelectCellForEvent = graph.selectCellForEvent;
    var graphGetMovableCells = graph.getMovableCells;
    var menu = ui.menus.get("extras");
    var oldExtrasMenu = menu.funct;
    graph.isCellDeletable = function(cell) {
      if (isDrawingFrame(cell) || isCabinetSegment(cell) || isPluginInternalCell(cell)) {
        return !!state.allowProtectedDelete;
      }
      return graphIsCellDeletable.apply(this, arguments);
    };
    var _origRemoveCells = graph.removeCells;
    graph.removeCells = function(cells, includeEdges) {
      if (cells != null && !state.allowProtectedDelete) {
        cells = this.getDeletableCells(cells);
        if (cells.length === 0) {
          return [];
        }
      }
      return _origRemoveCells.call(this, cells, includeEdges);
    };
    graph.isCellMovable = function(cell) {
      if (composeModeApi.isBlockedComposeTarget(cell) || composeModeApi.isLockedComposedChild(cell)) {
        return false;
      }
      return graphIsCellMovable.apply(this, arguments);
    };
    graph.isCellResizable = function(cell) {
      if (isElectricalRoot(cell)) {
        return true;
      }
      if (isCabinetBlock(cell) || isCabinetSegment(cell)) {
        return true;
      }
      if (isPluginInternalCell(cell)) {
        return false;
      }
      return graphIsCellResizable.apply(this, arguments);
    };
    var _origCellsResized = graph.cellsResized;
    graph.cellsResized = function(cells, bounds, recurse) {
      if (!Array.isArray(cells) || cells.length === 0) {
        return _origCellsResized.apply(this, arguments);
      }
      var passthroughCells = [];
      var passthroughBounds = [];
      var cabinetEdits = [];
      var i;
      for (i = 0; i < cells.length; i++) {
        var cell = cells[i];
        var bound = bounds != null ? bounds[i] : null;
        if (bound != null && isCabinetBlock(cell)) {
          cabinetEdits.push({ kind: "blockHeight", cell, value: bound.height });
        } else if (bound != null && isCabinetSegment(cell)) {
          cabinetEdits.push({ kind: "cabinetWidth", cell, value: bound.width });
        } else {
          passthroughCells.push(cell);
          passthroughBounds.push(bound);
        }
      }
      if (cabinetEdits.length === 0) {
        return _origCellsResized.apply(this, arguments);
      }
      var result;
      model.beginUpdate();
      try {
        if (passthroughCells.length > 0) {
          result = _origCellsResized.call(this, passthroughCells, passthroughBounds, recurse);
        }
        for (i = 0; i < cabinetEdits.length; i++) {
          var edit = cabinetEdits[i];
          if (edit.kind === "blockHeight") {
            cabinetDomainApi.applyCabinetBlockHeight(edit.cell, edit.value);
          } else {
            cabinetDomainApi.applyCabinetWidth(edit.cell, edit.value);
          }
        }
      } finally {
        model.endUpdate();
      }
      return result;
    };
    graph.isCellSelectable = function(cell) {
      if (composeModeApi.isBlockedComposeTarget(cell)) {
        return false;
      }
      if (isCabinetSwitchLink(cell)) {
        return false;
      }
      return graphIsCellSelectable.apply(this, arguments);
    };
    graph.selectCellForEvent = function(cell) {
      if (composeModeApi.isBlockedComposeTarget(cell)) {
        return;
      }
      return graphSelectCellForEvent.apply(this, arguments);
    };
    graph.getMovableCells = function(cells) {
      var result = graphGetMovableCells.apply(this, arguments) || [];
      var filtered = [];
      var i;
      for (i = 0; i < result.length; i++) {
        if (!composeModeApi.isBlockedComposeTarget(result[i])) {
          filtered.push(result[i]);
        }
      }
      return filtered;
    };
    var _origCreatePopupMenu = ui.menus.createPopupMenu;
    ui.menus.createPopupMenu = function(menu2, cell, evt) {
      var result = _origCreatePopupMenu.apply(this, arguments);
      var target = graph.getSelectionCount() === 1 ? graph.getSelectionCell() : cell;
      if (isCabinetBlock(target)) {
        addCabinetBlockMenuItems(menu2, target, evt);
      }
      return result;
    };
    function addCabinetBlockMenuItems(menu2, blockCell, evt) {
      var bound = trim(getAttr(blockCell, "switchInstanceId")).length > 0;
      menu2.addSeparator();
      if (!bound) {
        menu2.addItem("\u7ED1\u5B9A\u5F00\u5173\u2026", null, function() {
          switchPickerApi.openSwitchPickerDialog(blockCell, evt);
        });
        return;
      }
      menu2.addItem("\u66F4\u6362\u5F00\u5173\u2026", null, function() {
        switchPickerApi.openSwitchPickerDialog(blockCell, evt);
      });
      menu2.addItem("\u89E3\u9664\u7ED1\u5B9A\uFF08\u4FDD\u7559\u5F00\u5173\uFF09", null, function() {
        commandApi.unbindCabinetSwitch(blockCell, false);
      });
      menu2.addItem("\u5220\u9664\u5F00\u5173", null, function() {
        commandApi.unbindCabinetSwitch(blockCell, true);
      });
    }
    ui.actions.addAction("electricalSymbols", actions.electricalSymbols);
    ui.actions.addAction("electricalBrowse", actions.electricalBrowse);
    ui.actions.addAction("electricalCreate", actions.electricalCreate);
    ui.actions.addAction("electricalEditInstance", actions.electricalEditInstance);
    ui.actions.addAction(
      "electricalComposeInstance",
      actions.electricalComposeInstance
    );
    ui.actions.addAction("electricalExport", actions.electricalExport);
    ui.actions.addAction("electricalInsertFrame", actions.electricalInsertFrame);
    ui.actions.addAction(
      "electricalInsertCabinet",
      actions.electricalInsertCabinet
    );
    ui.actions.addAction("electricalReassignPort", actions.electricalReassignPort);
    ui.actions.addAction("electricalRefresh", actions.electricalRefresh);
    ui.actions.addAction("electricalExportSvg", actions.electricalExportSvg);
    ui.actions.addAction("electricalSaveBackend", actions.electricalSaveBackend);
    ui.actions.addAction("electricalNewBackend", actions.electricalNewBackend);
    ui.actions.addAction("electricalLoadBackend", actions.electricalLoadBackend);
    ui.actions.addAction(
      "electricalRollbackBackend",
      actions.electricalRollbackBackend
    );
    ui.actions.addAction("electricalClearScreen", actions.electricalClearScreen);
    ui.actions.addAction("electricalForceDelete", actions.electricalForceDelete);
    menu.funct = function(nextMenu, parent) {
      oldExtrasMenu.apply(this, arguments);
      ui.menus.addMenuItems(nextMenu, EXTRA_MENU_ACTIONS, parent);
    };
    graph.addMouseListener({
      mouseDown: function(sender, me) {
        var session = state.instanceComposeSession;
        var eventCell;
        if (session == null) {
          return;
        }
        eventCell = me.getCell();
        session.pointerDown = false;
        session.dragging = false;
        session.startPoint = null;
        session.dragCandidates = [];
        if (composeModeApi.isBlockedComposeTarget(eventCell)) {
          composeModeApi.refreshInstanceComposeOverlay();
          return;
        }
        session.dragCandidates = composeModeApi.collectComposeDragCandidates(
          session.root,
          eventCell
        );
        if (session.dragCandidates.length == 0) {
          composeModeApi.refreshInstanceComposeOverlay();
          return;
        }
        session.pointerDown = true;
        session.startPoint = {
          x: me.getGraphX(),
          y: me.getGraphY()
        };
      },
      mouseMove: function(sender, me) {
        var session = state.instanceComposeSession;
        var dx;
        var dy;
        if (session == null || !session.pointerDown || session.startPoint == null || session.dragCandidates.length == 0) {
          return;
        }
        dx = Math.abs(me.getGraphX() - session.startPoint.x);
        dy = Math.abs(me.getGraphY() - session.startPoint.y);
        if (dx > 2 || dy > 2) {
          session.dragging = true;
          composeModeApi.refreshInstanceComposeOverlay();
        }
      },
      mouseUp: function() {
        var session = state.instanceComposeSession;
        if (session == null) {
          return;
        }
        session.pointerDown = false;
        session.dragging = false;
        session.startPoint = null;
        session.dragCandidates = [];
        composeModeApi.refreshInstanceComposeOverlay();
      }
    });
    mxEvent.addListener(
      graph.container,
      "scroll",
      composeModeApi.refreshInstanceComposeOverlay
    );
    graph.view.addListener(mxEvent.SCALE, composeModeApi.refreshInstanceComposeOverlay);
    graph.view.addListener(
      mxEvent.SCALE_AND_TRANSLATE,
      composeModeApi.refreshInstanceComposeOverlay
    );
    graph.view.addListener(
      mxEvent.TRANSLATE,
      composeModeApi.refreshInstanceComposeOverlay
    );
    state.lastOperationSnapshot = snapshotDomainApi.exportDiagramSnapshot();
    model.addListener(mxEvent.CHANGE, modelSyncApi.recordCanvasOperation);
    model.addListener(mxEvent.CHANGE, modelSyncApi.handleModelChange);
  }

  // runtime/cabinetOverlays.js
  var OVERLAY_SIZE = 18;
  var PLUS_ICON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18"><circle cx="9" cy="9" r="8" fill="#2a5c9c" stroke="#ffffff" stroke-width="1"/><path d="M9 5.4v7.2M5.4 9h7.2" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round"/></svg>';
  var SWITCH_ICON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18"><circle cx="9" cy="9" r="8" fill="#a85c22" stroke="#ffffff" stroke-width="1"/><path d="M4.9 12.2L11.2 6.6" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/><path d="M11.4 12.2h1.8" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/><circle cx="4.8" cy="12.2" r="1.2" fill="#ffffff"/><circle cx="13.2" cy="12.2" r="1.2" fill="#ffffff"/></svg>';
  var iconCache = {};
  function getIconImage(key, svg) {
    if (iconCache[key] == null) {
      iconCache[key] = new mxImage(
        "data:image/svg+xml," + encodeURIComponent(svg),
        OVERLAY_SIZE,
        OVERLAY_SIZE
      );
    }
    return iconCache[key];
  }
  function createInsertOverlay() {
    var overlay = new mxCellOverlay(
      getIconImage("plus", PLUS_ICON_SVG),
      "\u5728\u6B64\u5757\u4E0B\u65B9\u63D2\u5165\u65B0\u5757",
      mxConstants.ALIGN_CENTER,
      mxConstants.ALIGN_BOTTOM,
      new mxPoint(0, 0),
      "pointer"
    );
    overlay.addListener(mxEvent.CLICK, function(sender, evt) {
      var cell = evt.getProperty("cell");
      var nativeEvent = evt.getProperty("event");
      if (cell != null) {
        cabinetBlockDialogApi.openCabinetBlockDialog(cell, nativeEvent);
      }
    });
    return overlay;
  }
  function createBindSwitchOverlay() {
    var overlay = new mxCellOverlay(
      getIconImage("switch", SWITCH_ICON_SVG),
      "\u4E3A\u6B64\u5757\u7ED1\u5B9A\u5F00\u5173",
      mxConstants.ALIGN_RIGHT,
      mxConstants.ALIGN_MIDDLE,
      new mxPoint(-12, 0),
      "pointer"
    );
    overlay.addListener(mxEvent.CLICK, function(sender, evt) {
      var cell = evt.getProperty("cell");
      var nativeEvent = evt.getProperty("event");
      if (cell != null) {
        switchPickerApi.openSwitchPickerDialog(cell, nativeEvent);
      }
    });
    return overlay;
  }
  function hasSwitchBound(cell) {
    return trim(getAttr(cell, "switchInstanceId")).length > 0;
  }
  function countOverlays(cell) {
    return Array.isArray(cell.overlays) ? cell.overlays.length : 0;
  }
  function syncBlockOverlay(cell) {
    var graph = getApp().ctx.graph;
    if (!isCabinetBlock(cell)) {
      return;
    }
    if (isPrintMode() || isOverviewMode()) {
      if (countOverlays(cell) > 0) {
        graph.removeCellOverlays(cell);
      }
      return;
    }
    var expected = hasSwitchBound(cell) ? 1 : 2;
    if (countOverlays(cell) === expected) {
      return;
    }
    graph.removeCellOverlays(cell);
    graph.addCellOverlay(cell, createInsertOverlay());
    if (!hasSwitchBound(cell)) {
      graph.addCellOverlay(cell, createBindSwitchOverlay());
    }
  }
  function refreshCabinetOverlays() {
    var model = getApp().ctx.model;
    var frames = frameDomainApi.getAllDrawingFrames();
    var i;
    var j;
    var k;
    for (i = 0; i < frames.length; i++) {
      for (j = 0; j < model.getChildCount(frames[i]); j++) {
        var segment = model.getChildAt(frames[i], j);
        if (!isCabinetSegment(segment)) {
          continue;
        }
        var blocks = cabinetDomainApi.getSegmentBlocks(segment);
        for (k = 0; k < blocks.length; k++) {
          syncBlockOverlay(blocks[k]);
        }
      }
    }
  }
  function syncSegmentOverlays(segment) {
    var blocks = cabinetDomainApi.getSegmentBlocks(segment);
    var i;
    for (i = 0; i < blocks.length; i++) {
      syncBlockOverlay(blocks[i]);
    }
  }
  function handleModelChange2(sender, evt) {
    var edit = evt != null ? evt.getProperty("edit") : null;
    var changes = edit != null ? edit.changes : null;
    var i;
    if (!Array.isArray(changes)) {
      return;
    }
    for (i = 0; i < changes.length; i++) {
      var change = changes[i];
      if (change.constructor == mxRootChange) {
        refreshCabinetOverlays();
        return;
      }
      if (change.constructor != mxChildChange || change.parent == null) {
        continue;
      }
      if (isCabinetSegment(change.child)) {
        syncSegmentOverlays(change.child);
      } else if (isCabinetBlock(change.child)) {
        syncBlockOverlay(change.child);
      }
    }
  }
  function installCabinetOverlays(ctx) {
    ctx.model.addListener(mxEvent.CHANGE, handleModelChange2);
    onLodChanged(refreshCabinetOverlays);
    onPrintModeChanged(refreshCabinetOverlays);
    refreshCabinetOverlays();
  }

  // runtime/clipboardSanitizer.js
  var CELL_TAG_NAMES = {
    mxCell: true,
    object: true,
    UserObject: true
  };
  var PROTECTED_TYPE_REASON = {};
  PROTECTED_TYPE_REASON[ELECTRICAL_CONSTANTS.FRAME_TYPE] = "frame";
  PROTECTED_TYPE_REASON[ELECTRICAL_CONSTANTS.CABINET_TYPE] = "cabinet";
  PROTECTED_TYPE_REASON[ELECTRICAL_CONSTANTS.CABINET_GAP_TYPE] = "cabinet";
  function isCellElement(node) {
    return node != null && node.nodeType === 1 && CELL_TAG_NAMES[node.nodeName] === true;
  }
  function getTopologyNode(element) {
    var inner;
    if (element.nodeName !== "mxCell") {
      inner = element.getElementsByTagName("mxCell");
      if (inner.length > 0) {
        return inner[0];
      }
    }
    return element;
  }
  function collectCellElements(doc) {
    var all = doc.getElementsByTagName("*");
    var result = [];
    var i;
    for (i = 0; i < all.length; i++) {
      var element = all[i];
      if (!isCellElement(element) || element.getAttribute("id") == null) {
        continue;
      }
      if (element.nodeName === "mxCell" && isCellElement(element.parentNode)) {
        continue;
      }
      result.push(element);
    }
    return result;
  }
  function isContentCell(topologyNode) {
    return topologyNode.getAttribute("vertex") === "1" || topologyNode.getAttribute("edge") === "1";
  }
  function sanitizePastedGraphXml(xml) {
    var doc;
    if (typeof xml !== "string" || xml.length === 0) {
      return null;
    }
    try {
      doc = mxUtils.parseXml(xml);
    } catch (e) {
      return null;
    }
    if (doc == null || doc.documentElement == null) {
      return null;
    }
    var elements = collectCellElements(doc);
    if (elements.length === 0) {
      return null;
    }
    var entries = [];
    var removed = {};
    var reasons = {};
    var i;
    for (i = 0; i < elements.length; i++) {
      var element = elements[i];
      var topology = getTopologyNode(element);
      var id = element.getAttribute("id");
      var reason = PROTECTED_TYPE_REASON[element.getAttribute("pluginType")];
      entries.push({ element, topology, id });
      if (reason != null) {
        removed[id] = true;
        reasons[reason] = true;
      }
    }
    var changed = true;
    while (changed) {
      changed = false;
      for (i = 0; i < entries.length; i++) {
        var entry = entries[i];
        if (removed[entry.id] === true) {
          continue;
        }
        var parentId = entry.topology.getAttribute("parent");
        if (parentId != null && removed[parentId] === true) {
          removed[entry.id] = true;
          changed = true;
        }
      }
    }
    for (i = 0; i < entries.length; i++) {
      var edgeEntry = entries[i];
      if (removed[edgeEntry.id] === true) {
        continue;
      }
      var source = edgeEntry.topology.getAttribute("source");
      var target = edgeEntry.topology.getAttribute("target");
      if (source != null && removed[source] === true || target != null && removed[target] === true) {
        removed[edgeEntry.id] = true;
      }
    }
    var hadProtected = false;
    var remaining = 0;
    for (i = 0; i < entries.length; i++) {
      var current = entries[i];
      if (removed[current.id] === true) {
        hadProtected = true;
        if (current.element.parentNode != null) {
          current.element.parentNode.removeChild(current.element);
        }
      } else if (isContentCell(current.topology)) {
        remaining++;
      }
    }
    if (!hadProtected) {
      return null;
    }
    return {
      xml: mxUtils.getXml(doc.documentElement),
      hadProtected: true,
      reasons,
      removedAll: remaining === 0
    };
  }

  // runtime/clipboardOverride.js
  function collectExistingCodes(model) {
    var codes = {};
    var cells = model.cells;
    var key;
    var code;
    for (key in cells) {
      if (!Object.prototype.hasOwnProperty.call(cells, key)) {
        continue;
      }
      var cell = cells[key];
      code = trim(getAttr(cell, "deviceCode"));
      if (code.length > 0) {
        codes[code] = true;
      }
      code = trim(getAttr(cell, "cableCode"));
      if (code.length > 0) {
        codes[code] = true;
      }
    }
    return codes;
  }
  function incrementCode(code, existingCodes) {
    var match = code.match(/^(.*?)(\d+)$/);
    var prefix;
    var numStr;
    var num;
    var padLen;
    var candidate;
    if (!match) {
      num = 0;
      do {
        num++;
        candidate = code + "-" + num;
      } while (existingCodes[candidate] === true);
      return candidate;
    }
    prefix = match[1];
    numStr = match[2];
    padLen = numStr.length;
    num = parseInt(numStr, 10);
    do {
      num++;
      candidate = prefix + padNumber(num, padLen);
    } while (existingCodes[candidate] === true);
    return candidate;
  }
  function padNumber(num, minLen) {
    var s = String(num);
    while (s.length < minLen) {
      s = "0" + s;
    }
    return s;
  }
  function classifyCopyProtection(cell) {
    if (cell == null) {
      return null;
    }
    if (isDrawingFrame(cell)) {
      return "frame";
    }
    if (isCabinetSegment(cell) || isCabinetGap(cell)) {
      return "cabinet";
    }
    if (isElectricalRoot(cell)) {
      return null;
    }
    if (trim(getAttr(cell, "esKind")).length > 0 || isFrameDecorationCell(cell)) {
      return "internal";
    }
    var model = getApp().ctx.model;
    var parent = model.getParent(cell);
    while (parent != null) {
      if (isElectricalRoot(parent)) {
        return null;
      }
      if (isCabinetSegment(parent) || isCabinetGap(parent)) {
        return "cabinet";
      }
      parent = model.getParent(parent);
    }
    return null;
  }
  function describeProtection(reasons, actionLabel) {
    var names = [];
    var message = "";
    if (reasons.frame === true) {
      names.push("\u56FE\u6846");
    }
    if (reasons.cabinet === true) {
      names.push("\u914D\u7535\u67DC");
    }
    if (names.length > 0) {
      message = names.join("\u3001") + "\u65E0\u6CD5" + actionLabel + "\uFF0C\u5DF2\u81EA\u52A8\u6392\u9664";
    }
    if (reasons.internal === true) {
      var tip = "\u56FE\u5143\u5185\u90E8\u6784\u4EF6\u4E0D\u80FD\u5355\u72EC" + actionLabel + "\uFF0C\u8BF7\u9009\u62E9\u6574\u4E2A\u56FE\u5143";
      message = message.length > 0 ? message + "\uFF1B" + tip : tip;
    }
    return message;
  }
  function notifyProtection(reasons, actionLabel) {
    var message = describeProtection(reasons, actionLabel);
    if (message.length > 0) {
      emitHostEvent("eid-clipboard-filtered", { message });
    }
  }
  function isDeviceRoot(cell) {
    return isElectricalRoot(cell);
  }
  function rewriteClonedCellAttributes(clonedCells, existingCodes, duplicateLog) {
    var i;
    var cell;
    for (i = 0; i < clonedCells.length; i++) {
      cell = clonedCells[i];
      if (cell == null) {
        continue;
      }
      if (isDeviceRoot(cell)) {
        rewriteDeviceCell(cell, existingCodes, duplicateLog);
        continue;
      }
      rewriteCableCell(cell, existingCodes, duplicateLog);
    }
  }
  function rewriteDeviceCell(cell, existingCodes, duplicateLog) {
    var oldCode = trim(getAttr(cell, "deviceCode"));
    var oldInstanceId = trim(getAttr(cell, "instanceId"));
    var newInstanceId = generateUuid();
    var newCode;
    if (oldCode.length > 0) {
      newCode = incrementCode(oldCode, existingCodes);
      existingCodes[newCode] = true;
    } else {
      newCode = "";
    }
    if (cell.value != null && cell.value.nodeType === 1) {
      cell.value = cell.value.cloneNode(true);
      cell.value.setAttribute("instanceId", newInstanceId);
      if (newCode.length > 0) {
        cell.value.setAttribute("deviceCode", newCode);
      }
      updateSymbolPayloadJson(cell, newCode, newInstanceId);
    }
    duplicateLog.push({
      type: "device",
      originalCode: oldCode,
      newCode,
      originalInstanceId: oldInstanceId,
      newInstanceId
    });
    rewriteChildLabels(cell, "deviceCode", newCode);
  }
  function rewriteCableCell(cell, existingCodes, duplicateLog) {
    var oldCode = trim(getAttr(cell, "cableCode"));
    if (oldCode.length === 0) {
      return;
    }
    var newCode = incrementCode(oldCode, existingCodes);
    existingCodes[newCode] = true;
    if (cell.value != null && cell.value.nodeType === 1) {
      cell.value = cell.value.cloneNode(true);
      cell.value.setAttribute("cableCode", newCode);
    }
    duplicateLog.push({
      type: "cable",
      originalCode: oldCode,
      newCode
    });
  }
  function updateSymbolPayloadJson(cell, newCode, newInstanceId) {
    updateSymbolPayloadJsonOnNode(cell.value, newCode, newInstanceId);
  }
  function updateSymbolPayloadJsonOnNode(valueNode, newCode, newInstanceId) {
    if (valueNode == null || valueNode.nodeType !== 1) {
      return;
    }
    var payloadStr = trim(valueNode.getAttribute("symbolPayload"));
    if (payloadStr.length === 0) {
      return;
    }
    try {
      var payload = JSON.parse(payloadStr);
      if (payload.instanceId != null) {
        payload.instanceId = newInstanceId;
      }
      if (payload.device != null && payload.device.code != null && newCode.length > 0) {
        payload.device.code = newCode;
      }
      valueNode.setAttribute("symbolPayload", JSON.stringify(payload));
    } catch (e) {
    }
  }
  function rewriteChildLabels(rootCell, attrName, newValue) {
    if (newValue.length === 0 || rootCell.children == null) {
      return;
    }
    var model = getApp().ctx.model;
    var childCount = model.getChildCount(rootCell);
    var i;
    for (i = 0; i < childCount; i++) {
      var child = model.getChildAt(rootCell, i);
      var labelFieldPath = trim(getAttr(child, "esFieldPath"));
      if (labelFieldPath === attrName || labelFieldPath === "device.code") {
        if (child.value != null && child.value.nodeType === 1) {
          child.value = child.value.cloneNode(true);
          child.value.setAttribute("label", newValue);
        }
      }
    }
  }
  function collectSubtree(model, cells) {
    var result = [];
    var stack = Array.isArray(cells) ? cells.slice() : [];
    while (stack.length > 0) {
      var cell = stack.pop();
      if (cell == null) {
        continue;
      }
      result.push(cell);
      var childCount = model.getChildCount(cell);
      var i;
      for (i = 0; i < childCount; i++) {
        stack.push(model.getChildAt(cell, i));
      }
    }
    return result;
  }
  function rewriteInsertedDeviceCell(model, cell, existingCodes, duplicateLog) {
    if (cell.value == null || cell.value.nodeType !== 1) {
      return;
    }
    var oldCode = trim(getAttr(cell, "deviceCode"));
    var oldInstanceId = trim(getAttr(cell, "instanceId"));
    var newInstanceId = generateUuid();
    var newCode = "";
    var value = cell.value.cloneNode(true);
    if (oldCode.length > 0) {
      newCode = incrementCode(oldCode, existingCodes);
      existingCodes[newCode] = true;
    }
    value.setAttribute("instanceId", newInstanceId);
    if (newCode.length > 0) {
      value.setAttribute("deviceCode", newCode);
    }
    updateSymbolPayloadJsonOnNode(value, newCode, newInstanceId);
    model.setValue(cell, value);
    duplicateLog.push({
      type: "device",
      originalCode: oldCode,
      newCode,
      originalInstanceId: oldInstanceId,
      newInstanceId
    });
    rewriteInsertedChildLabels(model, cell, newCode);
  }
  function rewriteInsertedCableCell(model, cell, existingCodes, duplicateLog) {
    var oldCode = trim(getAttr(cell, "cableCode"));
    if (oldCode.length === 0 || cell.value == null || cell.value.nodeType !== 1) {
      return;
    }
    var newCode = incrementCode(oldCode, existingCodes);
    var value = cell.value.cloneNode(true);
    existingCodes[newCode] = true;
    value.setAttribute("cableCode", newCode);
    model.setValue(cell, value);
    duplicateLog.push({
      type: "cable",
      originalCode: oldCode,
      newCode
    });
  }
  function rewriteInsertedChildLabels(model, rootCell, newValue) {
    if (newValue.length === 0) {
      return;
    }
    var childCount = model.getChildCount(rootCell);
    var i;
    for (i = 0; i < childCount; i++) {
      var child = model.getChildAt(rootCell, i);
      var labelFieldPath = trim(getAttr(child, "esFieldPath"));
      if (labelFieldPath !== "deviceCode" && labelFieldPath !== "device.code") {
        continue;
      }
      if (child.value != null && child.value.nodeType === 1) {
        var value = child.value.cloneNode(true);
        value.setAttribute("label", newValue);
        model.setValue(child, value);
      }
    }
  }
  function rewriteImportedCells(graph, importedCells) {
    var model = graph.getModel();
    var all = collectSubtree(model, importedCells);
    var existingCodes = collectExistingCodes(model);
    var duplicateLog = [];
    var importedIds = {};
    var i;
    for (i = 0; i < all.length; i++) {
      if (all[i].id != null) {
        importedIds[all[i].id] = true;
      }
    }
    for (i = 0; i < all.length; i++) {
      var cell = all[i];
      if (isDeviceRoot(cell)) {
        rewriteInsertedDeviceCell(model, cell, existingCodes, duplicateLog);
        continue;
      }
      if (cell.edge) {
        rewriteInsertedCableCell(model, cell, existingCodes, duplicateLog);
        if (cell.source != null && importedIds[cell.source.id] !== true) {
          model.setTerminal(cell, null, true);
        }
        if (cell.target != null && importedIds[cell.target.id] !== true) {
          model.setTerminal(cell, null, false);
        }
      }
    }
    if (duplicateLog.length > 0) {
      logDuplicates(duplicateLog);
    }
    return duplicateLog;
  }
  function disconnectDanglingEdges(clonedCells, originalCells) {
    var cloneIdSet = {};
    var i;
    for (i = 0; i < clonedCells.length; i++) {
      if (clonedCells[i] != null && clonedCells[i].id != null) {
        cloneIdSet[clonedCells[i].id] = true;
      }
    }
    for (i = 0; i < clonedCells.length; i++) {
      var cell = clonedCells[i];
      if (cell == null || !cell.edge) {
        continue;
      }
      if (cell.source != null && cloneIdSet[cell.source.id] == null) {
        cell.source = null;
      }
      if (cell.target != null && cloneIdSet[cell.target.id] == null) {
        cell.target = null;
      }
    }
  }
  function logDuplicates(duplicateLog) {
    for (var k = 0; k < duplicateLog.length; k++) {
      var entry = duplicateLog[k];
      if (entry.type === "device") {
        console.warn(
          "[EID Clipboard] \u590D\u5236\u8BBE\u5907: %s \u2192 %s (instanceId: %s)",
          entry.originalCode,
          entry.newCode,
          entry.newInstanceId
        );
      } else if (entry.type === "cable") {
        console.warn(
          "[EID Clipboard] \u590D\u5236\u7535\u7F06: %s \u2192 %s",
          entry.originalCode,
          entry.newCode
        );
      }
    }
    emitHostEvent("eid-duplicate-created", {
      duplicates: duplicateLog
    });
  }
  function installClipboardOverride(ctx) {
    var graph = ctx.graph;
    function separateProtected(cells) {
      var filtered = [];
      var reasons = {};
      var hadProtected = false;
      var i;
      for (i = 0; i < cells.length; i++) {
        var reason = classifyCopyProtection(cells[i]);
        if (reason != null) {
          reasons[reason] = true;
          hadProtected = true;
        } else {
          filtered.push(cells[i]);
        }
      }
      return { filtered, hadProtected, reasons };
    }
    var _origDuplicateCells = graph.duplicateCells;
    graph.duplicateCells = function(cells, append) {
      var input = cells || this.getSelectionCells();
      if (!Array.isArray(input) || input.length === 0) {
        return _origDuplicateCells.call(this, cells, append);
      }
      var result = separateProtected(input);
      if (result.hadProtected) {
        notifyProtection(result.reasons, "\u590D\u5236");
      }
      if (result.filtered.length === 0) {
        return [];
      }
      var model = this.getModel();
      var existingCodes = collectExistingCodes(model);
      var duplicateLog = [];
      var clonedCells = this.cloneCells(result.filtered);
      rewriteClonedCellAttributes(clonedCells, existingCodes, duplicateLog);
      disconnectDanglingEdges(clonedCells, result.filtered);
      var imported;
      model.beginUpdate();
      try {
        var s = this.gridSize;
        imported = this.importCells(clonedCells, s, s, null);
      } finally {
        model.endUpdate();
      }
      if (imported != null && imported.length > 0) {
        this.setSelectionCells(imported);
      }
      if (duplicateLog.length > 0) {
        logDuplicates(duplicateLog);
      }
      return imported || [];
    };
    var _origPaste = mxClipboard.paste;
    mxClipboard.paste = function(graph2) {
      if (graph2 == null) {
        return;
      }
      var copiedCells = mxClipboard.getCells();
      if (!Array.isArray(copiedCells) || copiedCells.length === 0) {
        return _origPaste.call(this, graph2);
      }
      var clonedCells = graph2.cloneCells(copiedCells);
      if (clonedCells.length === 0) {
        return;
      }
      var model = graph2.getModel();
      var existingCodes = collectExistingCodes(model);
      var duplicateLog = [];
      rewriteClonedCellAttributes(clonedCells, existingCodes, duplicateLog);
      disconnectDanglingEdges(clonedCells, copiedCells);
      var imported = null;
      model.beginUpdate();
      try {
        var defaultParent = graph2.getDefaultParent();
        var dx = mxClipboard.getDx();
        var dy = mxClipboard.getDy();
        imported = graph2.importCells(clonedCells, dx, dy, defaultParent);
        if (imported != null && imported.length > 0) {
          graph2.setSelectionCells(imported);
        }
        mxClipboard.setDx(dx + 10);
        mxClipboard.setDy(dy + 10);
      } finally {
        model.endUpdate();
      }
      if (duplicateLog.length > 0) {
        logDuplicates(duplicateLog);
      }
      return imported || [];
    };
    var _origCopy = mxClipboard.copy;
    mxClipboard.copy = function(graph2, cells) {
      if (graph2 == null) {
        return _origCopy.call(this, graph2, cells);
      }
      var selectedCells = cells || graph2.getSelectionCells();
      if (!Array.isArray(selectedCells) || selectedCells.length === 0) {
        return _origCopy.call(this, graph2, cells);
      }
      var result = separateProtected(selectedCells);
      if (result.hadProtected) {
        notifyProtection(result.reasons, "\u590D\u5236");
      }
      if (result.filtered.length === 0) {
        mxClipboard.setCells(null);
        return null;
      }
      return _origCopy.call(this, graph2, result.filtered);
    };
    var _origCut = mxClipboard.cut;
    mxClipboard.cut = function(graph2, cells) {
      if (graph2 == null) {
        return _origCut.call(this, graph2, cells);
      }
      var selectedCells = cells || graph2.getSelectionCells();
      if (!Array.isArray(selectedCells) || selectedCells.length === 0) {
        return _origCut.call(this, graph2, cells);
      }
      var result = separateProtected(selectedCells);
      if (result.hadProtected) {
        notifyProtection(result.reasons, "\u526A\u5207");
      }
      if (result.filtered.length === 0) {
        mxClipboard.setCells(null);
        return null;
      }
      return _origCut.call(this, graph2, result.filtered);
    };
    var ui = ctx.ui;
    var _origCopyCells = ui.copyCells;
    ui.copyCells = function(elt, removeCells) {
      var currentGraph = this.editor.graph;
      var result = separateProtected(currentGraph.getSelectionCells() || []);
      if (!result.hadProtected) {
        return _origCopyCells.apply(this, arguments);
      }
      notifyProtection(result.reasons, removeCells ? "\u526A\u5207" : "\u590D\u5236");
      if (result.filtered.length === 0) {
        elt.innerText = "";
        return;
      }
      var cells = mxUtils.sortCells(
        currentGraph.model.getTopmostCells(result.filtered)
      );
      var xml = mxUtils.getXml(currentGraph.encodeCells(cells));
      mxUtils.setTextContent(elt, encodeURIComponent(xml));
      if (removeCells) {
        currentGraph.removeCells(cells, false);
        currentGraph.lastPasteXml = null;
      } else {
        currentGraph.lastPasteXml = xml;
        currentGraph.pasteCounter = 0;
      }
      elt.focus();
      document.execCommand("selectAll", false, null);
    };
    var _origPasteXml = ui.pasteXml;
    ui.pasteXml = function(xml, pasteAsLabel, compat, evt, html, pt) {
      var sanitized = sanitizePastedGraphXml(xml);
      if (sanitized != null) {
        notifyProtection(sanitized.reasons, "\u7C98\u8D34");
        if (sanitized.removedAll) {
          return null;
        }
        xml = sanitized.xml;
      }
      var currentModel = this.editor.graph.getModel();
      var pasted = null;
      currentModel.beginUpdate();
      try {
        pasted = _origPasteXml.call(
          this,
          xml,
          pasteAsLabel,
          compat,
          evt,
          html,
          pt
        );
        if (Array.isArray(pasted) && pasted.length > 0) {
          rewriteImportedCells(this.editor.graph, pasted);
        }
      } finally {
        currentModel.endUpdate();
      }
      return pasted;
    };
  }

  // bootstrap/createApp.js
  function applyEmbeddedEditorLayout(ui) {
    if (ui == null) {
      return;
    }
    if (typeof ui.toggleShapesPanel == "function" && ui.isShapesPanelVisible()) {
      ui.toggleShapesPanel(false);
    } else if (ui.sidebarContainer != null) {
      ui.hsplitPosition = 0;
      ui.sidebarContainer.style.display = "none";
    }
    if (typeof ui.toggleFormatPanel == "function" && ui.isFormatPanelVisible()) {
      ui.toggleFormatPanel(false);
    } else if (ui.formatContainer != null) {
      ui.formatWidth = 0;
      ui.formatContainer.style.display = "none";
    }
    if (ui.hsplit != null) {
      ui.hsplit.style.display = "none";
    }
    if (ui.sidebarContainer != null) {
      ui.sidebarContainer.style.width = "0px";
      ui.sidebarContainer.style.display = "none";
    }
    if (ui.formatContainer != null) {
      ui.formatContainer.style.width = "0px";
      ui.formatContainer.style.display = "none";
    }
    if (typeof ui.refresh == "function") {
      ui.refresh(true);
    } else if (ui.editor != null && ui.editor.graph != null) {
      ui.editor.graph.sizeDidChange();
    }
  }
  function pruneToolbarButtons(ui) {
    var toolbarContainer = ui.toolbar != null ? ui.toolbar.container : null;
    if (toolbarContainer == null) {
      return;
    }
    var hiddenImages = [];
    if (typeof Editor !== "undefined") {
      if (Editor.fillColorImage) hiddenImages.push(Editor.fillColorImage);
      if (Editor.strokeColorImage) hiddenImages.push(Editor.strokeColorImage);
      if (Editor.shadowImage) hiddenImages.push(Editor.shadowImage);
      if (Editor.plusImage) hiddenImages.push(Editor.plusImage);
      if (Editor.shapesImage) hiddenImages.push(Editor.shapesImage);
      if (Editor.freehandImage) hiddenImages.push(Editor.freehandImage);
      if (Editor.sparklesImage) hiddenImages.push(Editor.sparklesImage);
      if (Editor.tableImage) hiddenImages.push(Editor.tableImage);
    }
    if (ui.toolbar.edgeShapeMenu != null) {
      ui.toolbar.edgeShapeMenu.style.display = "none";
    }
    if (ui.toolbar.edgeStyleMenu != null) {
      ui.toolbar.edgeStyleMenu.style.display = "none";
    }
    var children = toolbarContainer.children;
    var i;
    var j;
    for (i = 0; i < children.length; i++) {
      var child = children[i];
      var bgImage = child.style.backgroundImage || "";
      if (bgImage.length === 0) {
        continue;
      }
      for (j = 0; j < hiddenImages.length; j++) {
        if (bgImage.indexOf(hiddenImages[j]) >= 0) {
          child.style.display = "none";
          break;
        }
      }
    }
    var tableMinWidths = { "360": true };
    for (i = 0; i < children.length; i++) {
      var minW = children[i].getAttribute("data-min-width");
      if (minW != null && tableMinWidths[minW] === true) {
        if (children[i].style.display !== "none") {
          children[i].style.display = "none";
        }
      }
    }
    cleanupToolbarSeparators(toolbarContainer);
  }
  function cleanupToolbarSeparators(container) {
    var children = container.children;
    var i;
    for (i = 0; i < children.length; i++) {
      var child = children[i];
      if (child.tagName !== "SPAN" || child.style.display === "none") {
        continue;
      }
      if (child.offsetWidth <= 2 || child.className.indexOf("geSeparator") >= 0) {
        var prevVisible = findVisibleSibling(children, i, -1);
        var nextVisible = findVisibleSibling(children, i, 1);
        if (prevVisible == null || nextVisible == null) {
          child.style.display = "none";
        }
      }
    }
  }
  function findVisibleSibling(children, index, direction) {
    var i = index + direction;
    while (i >= 0 && i < children.length) {
      var el = children[i];
      if (el.style.display !== "none" && el.offsetWidth > 2) {
        return el;
      }
      i += direction;
    }
    return null;
  }
  function installCustomToolbarButtons(ui) {
    var toolbarContainer = ui.toolbar != null ? ui.toolbar.container : null;
    if (toolbarContainer == null) {
      return;
    }
    var items = ACTION_ITEMS;
    var i;
    for (i = 0; i < items.length; i++) {
      var item = items[i];
      var action = ui.actions.get(item.actionKey);
      if (action == null) {
        continue;
      }
      var label = mxResources.get(item.resourceKey) || item.actionKey;
      var button = document.createElement("a");
      button.className = "geButton";
      button.setAttribute("title", label);
      button.style.display = "inline-flex";
      button.style.alignItems = "center";
      button.style.justifyContent = "center";
      button.style.cursor = "pointer";
      button.style.fontSize = "12px";
      button.style.padding = "0 8px";
      button.style.whiteSpace = "nowrap";
      button.style.userSelect = "none";
      button.innerText = label;
      (function(act) {
        mxEvent.addListener(button, "click", function(evt) {
          act.funct();
          mxEvent.consume(evt);
        });
      })(action);
      toolbarContainer.appendChild(button);
    }
  }
  function createApp(ctx) {
    return {
      ctx
    };
  }
  function activateAppRuntime(app) {
    var ui = app.ctx.ui;
    applyEmbeddedEditorLayout(ui);
    installHostBridge(app.ctx);
    portSwapModeApi.installGraphClickBehavior();
    connectionConstraintsApi.installGraphBehavior({
      applyEdgePortConstraintMetadata: portSwapModeApi.applyEdgePortConstraintMetadata,
      setCanvasStatus
    });
    installFrameBinding(app.ctx);
    installCanvasFeatures(app.ctx);
    installClipboardOverride(app.ctx);
    installViewportVirtualization(app.ctx);
    installPrintMode(app.ctx);
    installCabinetOverlays(app.ctx);
    pruneToolbarButtons(ui);
    installCustomToolbarButtons(ui);
    if (ui.menubarContainer != null) {
      ui.menubarContainer.style.display = "none";
      if (typeof ui.refresh == "function") {
        ui.refresh(true);
      }
    }
    ui.addListener("languageChanged", function() {
      pruneToolbarButtons(ui);
      installCustomToolbarButtons(ui);
    });
    ui.addListener("currentThemeChanged", function() {
      pruneToolbarButtons(ui);
      installCustomToolbarButtons(ui);
    });
  }

  // bootstrap/installElectricalSymbols.js
  function installElectricalSymbols(ctx) {
    var app = createApp(ctx);
    var initialSnapshot;
    setApp(app);
    backendServiceApi.loadBackendSession();
    activateAppRuntime(app);
    initialSnapshot = snapshotDomainApi.exportDiagramSnapshot();
    if (ctx.state.backendDiagramId && ctx.state.backendLastSnapshot != null && Array.isArray(initialSnapshot.objects) && Array.isArray(initialSnapshot.edges) && initialSnapshot.objects.length == 0 && initialSnapshot.edges.length == 0) {
      backendServiceApi.resetBackendBinding();
    }
  }

  // index.js
  Draw.loadPlugin(function(ui) {
    var ctx = createPluginContext(ui);
    registerElectricalResources();
    installElectricalSymbols(ctx);
  });
})();
