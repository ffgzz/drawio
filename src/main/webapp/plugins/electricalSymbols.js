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
    CABINET_GAP_TAG: "CabinetGap",
    ROOT_TYPE: "electricalSymbol",
    FRAME_TYPE: "drawingFrame",
    CABINET_TYPE: "cabinetSegment",
    CABINET_GAP_TYPE: "cabinetGap",
    BODY_KIND: "body",
    LABEL_KIND: "label",
    FRAME_LABEL_KIND: "pageLabel",
    CABINET_BODY_KIND: "cabinetBody",
    CABINET_GAP_KIND: "cabinetGap",
    PORT_EDGE_SNAP_THRESHOLD_PX: 14,
    TEMPLATE_DRAFT_STORAGE_KEY: "electrical-symbol-template-draft",
    FRAME_DEFAULT_WIDTH: 820,
    FRAME_DEFAULT_HEIGHT: 1180,
    FRAME_HORIZONTAL_GAP: 40,
    FRAME_VERTICAL_GAP: 56,
    FRAME_CONTENT_RATIO: 0.8,
    FRAME_MARGIN_RATIO: 0.1,
    CABINET_DEFAULT_WIDTH: 86,
    CABINET_DEFAULT_PORT_COUNT: 4,
    CABINET_DEFAULT_X: 72,
    CABINET_TAIL_PADDING: 24,
    CABINET_MIN_PORT_FOLLOW_SPACE_RATIO: 0.24,
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
        cabinetGapDialog: null
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
        frameConfig: null,
        selectedGap: null
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
    defineAlias(state, "selectedCabinetGap", "cabinet", "selectedGap");
    defineAlias(state, "gapDialogWindow", "windows", "cabinetGapDialog");
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
    "electricalUploadPrimarySvg=\u4E0A\u4F20\u9ED8\u8BA4SVG",
    "electricalEnableVariants=\u542F\u7528\u53D8\u4F53SVG",
    "electricalAddVariantSvg=\u65B0\u589E\u53D8\u4F53SVG"
  ];
  function registerElectricalResources() {
    mxResources.parse(ELECTRICAL_RESOURCE_ENTRIES.join("\n"));
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
  function createBaseUtils() {
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
      uniqueStrings
    };
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
  function createXmlUtils() {
    var deps = arguments.length > 0 ? arguments[0] : null;
    var trim2 = deps != null ? deps.trim : trim;
    return {
      cloneValue,
      createMetaCell,
      createNode,
      extractSvgSize: function(svg, toFloat2) {
        return extractSvgSize(svg, toFloat2, trim2);
      },
      getAttr,
      validateSvg: function(svg) {
        return validateSvg(svg, trim2);
      }
    };
  }

  // core/appContext.js
  function createAppContext(ctx) {
    return {
      ui: ctx.ui,
      graph: ctx.graph,
      model: ctx.model,
      constants: ctx.constants,
      getState: function() {
        return ctx.state;
      },
      updateState: function(mutator) {
        if (typeof mutator === "function") {
          mutator(ctx.state);
        }
        return ctx.state;
      }
    };
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

  // core/graphApi.js
  function createGraphApi(ctx) {
    return {
      ui: ctx.ui,
      graph: ctx.graph,
      model: ctx.model,
      state: ctx.state,
      constants: ctx.constants,
      getSelectionCell: function() {
        return ctx.graph.getSelectionCell();
      },
      getDefaultParent: function() {
        return ctx.graph.getDefaultParent();
      }
    };
  }

  // core/runtimeHelpers.js
  function createRuntimeHelpers() {
    var deps = arguments.length > 0 ? arguments[0] : {};
    var ctx = deps.ctx;
    var ui = ctx.ui;
    var model = ctx.model;
    var state = ctx.state;
    var constants = deps.constants;
    function resetPendingChangeRecords(baselineSnapshot) {
      state.pendingChangeRecords = [];
      state.nextChangeSequence = 1;
      state.lastOperationSnapshot = baselineSnapshot != null ? deps.cloneJson(baselineSnapshot) : null;
    }
    function isElectricalRoot(cell) {
      return deps.getAttr(cell, "pluginType") == constants.ROOT_TYPE;
    }
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
      return deps.getAttr(cell, "pluginType") == constants.FRAME_TYPE;
    }
    function isCabinetSegment(cell) {
      return deps.getAttr(cell, "pluginType") == constants.CABINET_TYPE;
    }
    function isCabinetGap(cell) {
      return deps.getAttr(cell, "pluginType") == constants.CABINET_GAP_TYPE;
    }
    function isPortHostRoot(cell) {
      return isElectricalRoot(cell) || isCabinetSegment(cell);
    }
    function findPortHostRoot(cell) {
      while (cell != null) {
        if (deps.shouldExportGenericObject(cell)) {
          return null;
        }
        if (isPortHostRoot(cell)) {
          return cell;
        }
        cell = model.getParent(cell);
      }
      return null;
    }
    function normalizeMode(mode) {
      mode = deps.trim(mode).toLowerCase();
      return mode == "primary" || mode == "standby" ? mode : "";
    }
    function generateSymbolId(seed) {
      var base = deps.toSlug(deps.stripFileExtension(seed)) || "electrical-symbol";
      var shortUuid = deps.generateUuid().split("-")[0];
      return base + "-" + shortUuid;
    }
    function generateInstanceId() {
      return deps.generateUuid();
    }
    function generateFrameId() {
      return deps.generateUuid();
    }
    function generateFrameGroupId() {
      return deps.generateUuid();
    }
    function generateLogicalCabinetId() {
      return deps.generateUuid();
    }
    function showStatus(message, isError) {
      if (state.status != null) {
        state.status.style.color = isError ? "#b3261e" : "#2e7d32";
        state.status.innerText = message || "";
      }
    }
    function setCanvasStatus(message) {
      var text = deps.trim(message);
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
      var id = prefix + ":" + state.nextId;
      state.nextId += 1;
      return id;
    }
    return {
      findElectricalRoot,
      findPortHostRoot,
      generateFrameGroupId,
      generateFrameId,
      generateInstanceId,
      generateLogicalCabinetId,
      generateSymbolId,
      isCabinetGap,
      isCabinetSegment,
      isDrawingFrame,
      isElectricalRoot,
      isPortHostRoot,
      nextItemId,
      normalizeMode,
      resetPendingChangeRecords,
      setCanvasStatus,
      showStatus
    };
  }

  // ui/shared/buttonFactory.js
  function createPluginButton(label, fn) {
    var button = mxUtils.button(label, fn);
    button.className = "geBtn";
    button.style.marginRight = "8px";
    button.style.marginTop = "8px";
    return button;
  }

  // application/selection.js
  function getSelectedCell() {
    return getApp().ctx.graph.getSelectionCell();
  }
  function getSelectedRoot() {
    var app = getApp();
    return app.helpers.findElectricalRoot(getSelectedCell());
  }
  function getSelectedFrame() {
    var app = getApp();
    return app.domains.frame.findDrawingFrame(getSelectedCell());
  }
  function getSelectedCabinetSegment() {
    var app = getApp();
    return app.domains.cabinet.findCabinetSegment(getSelectedCell());
  }
  function getSelectedCabinetGap() {
    var app = getApp();
    var cell = getSelectedCell();
    return app.helpers.isCabinetGap(cell) ? cell : null;
  }
  var selectionApi = {
    getSelectedCabinetGap,
    getSelectedCabinetSegment,
    getSelectedCell,
    getSelectedFrame,
    getSelectedRoot
  };

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
    var insertPoint = app.domains.frame.getFrameChildInsertPoint(
      frame,
      cell.geometry != null ? cell.geometry.width : 0,
      cell.geometry != null ? cell.geometry.height : 0
    );
    graph.setSelectionCells(graph.importCells([cell], insertPoint.x, insertPoint.y, frame));
    graph.scrollCellToVisible(graph.getSelectionCell());
  }
  function insertIntoGraph(spec) {
    var app = getApp();
    var graph = app.ctx.graph;
    var root = app.domains.symbol.buildSymbolCell(spec);
    var frame = app.domains.frame.getActiveFrame(false);
    if (frame != null) {
      insertCellIntoFrame(root, frame);
    } else {
      var pt = graph.getFreeInsertPoint();
      graph.setSelectionCells(graph.importCells([root], pt.x, pt.y));
    }
    graph.scrollCellToVisible(graph.getSelectionCell());
    app.showStatus("\u5DF2\u63D2\u5165\u56FE\u5143", false);
    app.setCanvasStatus("\u5DF2\u63D2\u5165\u56FE\u5143");
  }
  function refreshSelection() {
    var app = getApp();
    var graph = app.ctx.graph;
    var model = app.ctx.model;
    var state = app.ctx.state;
    var root = app.selection.getSelectedRoot();
    var cabinet = app.selection.getSelectedCabinetSegment();
    if (cabinet != null) {
      try {
        state.updatingModel = true;
        model.beginUpdate();
        app.domains.cabinet.relayoutCabinetByModel(
          app.domains.cabinet.extractCabinetModel(cabinet)
        );
        app.showStatus("\u914D\u7535\u67DC\u5DF2\u5237\u65B0", false);
        app.setCanvasStatus("\u914D\u7535\u67DC\u5DF2\u5237\u65B0");
      } catch (e) {
        app.showStatus(e.message || String(e), true);
        app.setCanvasStatus(e.message || String(e));
      } finally {
        model.endUpdate();
        state.updatingModel = false;
      }
      return;
    }
    if (root == null) {
      app.showStatus("\u8BF7\u5148\u9009\u62E9\u4E00\u4E2A\u7535\u6C14\u56FE\u5143", true);
      return;
    }
    state.updatingModel = true;
    model.beginUpdate();
    try {
      app.domains.symbol.refreshRoot(root);
    } catch (e) {
      app.showStatus(e.message || String(e), true);
      return;
    } finally {
      model.endUpdate();
      state.updatingModel = false;
    }
    app.showStatus("\u7535\u6C14\u56FE\u5143\u5DF2\u5237\u65B0", false);
  }
  function insertFrame(config, selectedFrame, existingFrames) {
    var app = getApp();
    var graph = app.ctx.graph;
    var model = app.ctx.model;
    var state = app.ctx.state;
    var constants = app.ctx.constants;
    var normalizedConfig = app.domains.frame.normalizeFrameConfig(config || {});
    var frames = Array.isArray(existingFrames) ? existingFrames : app.domains.frame.getAllDrawingFrames();
    var groupId = selectedFrame != null ? app.domains.frame.getFrameGroupId(selectedFrame) : app.helpers.generateFrameGroupId();
    var nextPageNumber = selectedFrame != null ? app.domains.frame.getMaxFramePageNumberInGroup(groupId) + 1 : 1;
    var frame = app.domains.frame.createDrawingFrameCell(normalizedConfig, nextPageNumber, {
      groupId
    });
    state.frameConfig = app.utils.cloneJson(normalizedConfig);
    if (selectedFrame != null) {
      var anchorFrame = app.domains.frame.getRightmostFrameInGroup(groupId) || selectedFrame;
      var anchorGeometry = model.getGeometry(anchorFrame);
      frame.geometry = frame.geometry.clone();
      frame.geometry.x = anchorGeometry.x + anchorGeometry.width + constants.FRAME_HORIZONTAL_GAP;
      frame.geometry.y = anchorGeometry.y;
      app.domains.frame.addTopLevelCell(frame);
      graph.setSelectionCell(frame);
    } else if (frames.length > 0) {
      var leftmostFrame = app.domains.frame.getLeftmostFrame();
      var bottommostFrame = app.domains.frame.getBottommostFrame();
      var leftGeometry = leftmostFrame != null ? model.getGeometry(leftmostFrame) : null;
      var bottomGeometry = bottommostFrame != null ? model.getGeometry(bottommostFrame) : null;
      frame.geometry = frame.geometry.clone();
      frame.geometry.x = leftGeometry != null ? leftGeometry.x : 0;
      frame.geometry.y = bottomGeometry != null ? bottomGeometry.y + bottomGeometry.height + constants.FRAME_VERTICAL_GAP : 0;
      app.domains.frame.addTopLevelCell(frame);
      graph.setSelectionCell(frame);
    } else {
      var point = graph.getFreeInsertPoint();
      graph.setSelectionCells(graph.importCells([frame], point.x, point.y));
    }
    graph.scrollCellToVisible(graph.getSelectionCell());
    app.showStatus("\u5DF2\u63D2\u5165\u56FE\u6846", false);
    app.setCanvasStatus("\u5DF2\u63D2\u5165\u56FE\u6846");
  }
  function insertCabinet(cabinetModel) {
    var app = getApp();
    var graph = app.ctx.graph;
    var model = app.ctx.model;
    var state = app.ctx.state;
    state.updatingModel = true;
    model.beginUpdate();
    try {
      app.domains.cabinet.relayoutCabinetByModel(cabinetModel);
    } finally {
      model.endUpdate();
      state.updatingModel = false;
    }
    var segments = app.domains.cabinet.findCabinetSegments(cabinetModel.logicalCabinetId);
    if (segments.length > 0) {
      graph.setSelectionCell(segments[0]);
      graph.scrollCellToVisible(segments[0]);
    }
    app.showStatus("\u5DF2\u63D2\u5165\u914D\u7535\u67DC", false);
    app.setCanvasStatus("\u5DF2\u63D2\u5165\u914D\u7535\u67DC");
  }
  function updateCabinetGap(cabinetModel) {
    var app = getApp();
    var model = app.ctx.model;
    var state = app.ctx.state;
    state.updatingModel = true;
    model.beginUpdate();
    try {
      app.domains.cabinet.relayoutCabinetByModel(cabinetModel);
    } finally {
      model.endUpdate();
      state.updatingModel = false;
    }
    app.showStatus("\u5DF2\u66F4\u65B0\u7AEF\u5B50\u95F4\u8DDD", false);
    app.setCanvasStatus("\u5DF2\u66F4\u65B0\u7AEF\u5B50\u95F4\u8DDD");
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
      app.domains.symbol.syncRoot(root, spec, spec.ports);
      graph.setSelectionCell(root);
    } finally {
      model.endUpdate();
      state.updatingModel = false;
    }
    app.showStatus("\u5DF2\u66F4\u65B0\u56FE\u5143\u5B9E\u4F8B", false);
  }
  function clearCurrentPage() {
    var app = getApp();
    var graph = app.ctx.graph;
    var state = app.ctx.state;
    var cells = getDefaultParentChildren();
    if (cells.length == 0) {
      app.showStatus("\u5F53\u524D\u9875\u9762\u6CA1\u6709\u53EF\u6E05\u9664\u7684\u5185\u5BB9", false);
      return;
    }
    if (!mxUtils.confirm("\u786E\u8BA4\u6E05\u9664\u5F53\u524D\u9875\u9762\u6240\u6709\u5185\u5BB9\uFF1F")) {
      return;
    }
    if (!mxUtils.confirm("\u6B64\u64CD\u4F5C\u4E0D\u53EF\u6062\u590D\uFF0C\u786E\u5B9A\u7EE7\u7EED\u6E05\u9664\u5417\uFF1F")) {
      return;
    }
    if (app.ui != null && typeof app.ui.closeGapDialogWindow === "function") {
      app.ui.closeGapDialogWindow();
    }
    app.domains.cabinet.setSelectedCabinetGap(null, null);
    if (app.runtime != null && typeof app.runtime.exitPortSwapMode === "function") {
      app.runtime.exitPortSwapMode(false);
    }
    if (app.runtime != null && typeof app.runtime.exitInstanceComposeMode === "function") {
      app.runtime.exitInstanceComposeMode(false);
    }
    state.allowProtectedDelete = true;
    try {
      graph.removeCells(cells, true);
      app.showStatus("\u5DF2\u6E05\u7A7A\u5F53\u524D\u9875\u9762", false);
    } finally {
      state.allowProtectedDelete = false;
    }
  }
  var commandApi = {
    applyInstanceSpec,
    clearCurrentPage,
    insertCabinet,
    insertFrame,
    insertIntoGraph,
    refreshSelection,
    updateCabinetGap
  };

  // application/actions.js
  function createActionApi() {
    function execute(fn, resetDeleteFlag) {
      var app = getApp();
      try {
        return fn();
      } catch (e) {
        if (resetDeleteFlag) {
          app.ctx.state.allowProtectedDelete = false;
        }
        app.showStatus(e.message || String(e), true);
        return null;
      }
    }
    return {
      electricalBrowse: function() {
        return execute(function() {
          return getApp().ui.openTemplateBrowserDialog();
        });
      },
      electricalClearScreen: function() {
        return execute(function() {
          return getApp().commands.clearCurrentPage();
        }, true);
      },
      electricalComposeInstance: function() {
        return execute(function() {
          return getApp().runtime.enterInstanceComposeMode();
        });
      },
      electricalCreate: function() {
        return execute(function() {
          return getApp().ui.openCreateFromLibraryDialog();
        });
      },
      electricalEditInstance: function() {
        return execute(function() {
          return getApp().ui.openEditInstanceDialog();
        });
      },
      electricalExportSvg: function() {
        return execute(function() {
          return getApp().ui.openSvgExportDialog();
        });
      },
      electricalInsertCabinet: function() {
        return execute(function() {
          return getApp().ui.openInsertCabinetDialog();
        });
      },
      electricalInsertFrame: function() {
        return execute(function() {
          return getApp().ui.openInsertFrameDialog();
        });
      },
      electricalLoadBackend: function() {
        return execute(function() {
          return getApp().ui.openBackendLoadDialog();
        });
      },
      electricalNewBackend: function() {
        return execute(function() {
          var app = getApp();
          var backend = app.services.backend;
          backend.resetBackendBinding();
          app.showStatus("\u5DF2\u65B0\u5EFA\u540E\u7AEF\u56FE\u7EB8\u4F1A\u8BDD\uFF0C\u4E0B\u4E00\u6B21\u4FDD\u5B58\u5C06\u521B\u5EFA\u65B0\u56FE\u7EB8", false);
        });
      },
      electricalReassignPort: function() {
        return execute(function() {
          return getApp().runtime.enterPortSwapMode();
        });
      },
      electricalRefresh: function() {
        return execute(function() {
          return getApp().commands.refreshSelection();
        });
      },
      electricalRollbackBackend: function() {
        return execute(function() {
          return getApp().ui.openBackendRollbackDialog();
        });
      },
      electricalSaveBackend: function() {
        return execute(function() {
          return getApp().ui.openBackendSaveDialog();
        });
      },
      electricalSymbols: function() {
        return execute(function() {
          return getApp().ui.toggleWindow();
        });
      }
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
  function normalizeSchemaField(raw, nextItemId) {
    var field = isObject(raw) ? cloneJson(raw) : {};
    field.id = trim(field.id) || (typeof nextItemId === "function" ? nextItemId("field") : "");
    field.path = trim(field.path);
    field.type = normalizeSchemaType(field.type);
    field.required = !!field.required;
    field.enumValues = normalizeEnumOptions(field.enumValues);
    return field;
  }
  function getDefaultSchemaFields(nextItemId) {
    return [
      normalizeSchemaField({ path: "title", type: "string" }, nextItemId),
      normalizeSchemaField({ path: "name", type: "string" }, nextItemId),
      normalizeSchemaField({ path: "code", type: "string" }, nextItemId),
      normalizeSchemaField({ path: "power", type: "string" }, nextItemId)
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
  function buildSchemaFromFields(fields, nextItemId) {
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
  function flattenSchemaFields(schema, prefix, result, nextItemId) {
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
              nextItemId
            )
          );
        } else if (isObject(value)) {
          flattenSchemaFields(value, path, result, nextItemId);
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
  function buildSpecDeps() {
    var app = getApp();
    return {
      trim: app.utils.trim,
      isObject: app.utils.isObject,
      cloneJson: app.utils.cloneJson,
      validateSvg: app.utils.validateSvg,
      generateSymbolId: app.helpers.generateSymbolId,
      clamp: app.utils.clamp,
      toInt: app.utils.toInt,
      toFloat: app.utils.toFloat,
      nextItemId: app.helpers.nextItemId,
      normalizeMode: app.helpers.normalizeMode,
      deepMerge: app.utils.deepMerge,
      generateInstanceId: app.helpers.generateInstanceId
    };
  }
  function createSpecDomain() {
    var deps = arguments.length > 0 ? arguments[0] : buildSpecDeps();
    var trim2 = deps.trim;
    function getVariantLayout(spec, variantKey) {
      var layouts = normalizeVariantLayouts(spec.variantLayouts);
      var key = trim2(variantKey);
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
      var field = trim2(spec.variantField || "");
      var value = trim2(getValueByPath(spec.data, field));
      if (value.length == 0 && field == "mode") {
        value = trim2(spec.device.mode);
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
        if (raw.hasOwnProperty(key) && trim2(key).length > 0) {
          var entry = deps.isObject(raw[key]) ? raw[key] : {};
          result[trim2(key)] = {
            ports: normalizePortLayout(entry.ports),
            labels: normalizeLabels(entry.labels)
          };
        }
      }
      return result;
    }
    function normalizeSpec(raw) {
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
      var variantField = trim2(raw.variantField || "");
      var spec = {
        symbolId: trim2(raw.symbolId) || deps.generateSymbolId("symbol"),
        templateName: trim2(raw.templateName) || trim2(raw.title) || trim2(device.name) || "\u7535\u6C14\u56FE\u5143",
        title: trim2(raw.title) || trim2(device.name) || "\u7535\u6C14\u56FE\u5143",
        svg: deps.validateSvg(raw.svg),
        size: {
          width: Math.max(20, deps.toInt(size.width, 120)),
          height: Math.max(20, deps.toInt(size.height, 80))
        },
        device: {
          name: trim2(device.name),
          code: trim2(device.code),
          power: trim2(device.power),
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
        if (variants.hasOwnProperty(variantKey) && trim2(variantKey).length > 0 && variants[variantKey] != null && trim2(variants[variantKey]).length > 0) {
          spec.svgVariants[trim2(variantKey)] = deps.validateSvg(
            variants[variantKey]
          );
        }
      }
      return spec;
    }
    function createEmptyTemplateSpec() {
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
      spec.title = trim2(titleValue) || trim2(nameValue) || template.title;
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
      spec.device.name = trim2(nameValue);
      spec.device.code = trim2(codeValue);
      spec.device.power = trim2(powerValue);
      spec.device.mode = deps.normalizeMode(modeValue);
      variantKey = getActiveVariantKey(spec);
      layout = getVariantLayout(template, variantKey);
      spec.ports = layout.ports;
      spec.labels = buildResolvedLabels(layout.labels, mergedData, getValueByPath);
      return normalizeSpec(spec);
    }
    return {
      buildEmptyValueFromSchema,
      buildInstanceSpec,
      buildPortLayout,
      buildResolvedLabels: function(labels, instance) {
        return buildResolvedLabels(labels, instance, getValueByPath);
      },
      buildSchemaFromFields: function(fields) {
        return buildSchemaFromFields(fields, deps.nextItemId);
      },
      createEmptyTemplateSpec,
      flattenSchemaFields: function(schema, prefix, result) {
        return flattenSchemaFields(schema, prefix, result, deps.nextItemId);
      },
      getActiveSvg,
      getActiveVariantKey,
      getDefaultSchemaFields: function() {
        return getDefaultSchemaFields(deps.nextItemId);
      },
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
      normalizeSchemaField: function(raw) {
        return normalizeSchemaField(raw, deps.nextItemId);
      },
      normalizeSchemaType,
      normalizeSpec,
      normalizeVariantLayouts,
      parsePortLayout,
      serializePortLayout,
      setValueByPath,
      toStyleImageUri,
      toSvgDataUri
    };
  }

  // domain/symbolCore.js
  function buildSymbolCoreDeps() {
    var app = getApp();
    return {
      toStyleImageUri: app.domains.spec.toStyleImageUri,
      ROOT_TYPE: app.constants.ROOT_TYPE,
      trim: app.utils.trim,
      serializePortLayout: app.domains.spec.serializePortLayout,
      normalizeLabels: app.domains.spec.normalizeLabels
    };
  }
  function createSymbolCore() {
    var deps = arguments.length > 0 ? arguments[0] : buildSymbolCoreDeps();
    function makeRootStyle() {
      return "fillColor=none;strokeColor=none;html=1;whiteSpace=wrap;connectable=1;container=1;collapsible=0;foldable=0;recursiveResize=0;rotatable=0;";
    }
    function makeBodyStyle(spec) {
      return "shape=image;image=" + deps.toStyleImageUri(spec) + ";imageAspect=0;aspect=fixed;html=1;strokeColor=none;fillColor=none;part=1;connectable=0;editable=0;movable=0;resizable=0;rotatable=0;cloneable=0;deletable=0;pointerEvents=0;";
    }
    function makeLabelStyle(align) {
      return "text;part=1;html=1;whiteSpace=wrap;strokeColor=none;fillColor=none;align=" + align + ";verticalAlign=middle;spacing=2;rotatable=0;connectable=0;";
    }
    function applyValueMetadata(node, spec, layout) {
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
      node.setAttribute(
        "labelsJson",
        JSON.stringify(deps.normalizeLabels(spec.labels))
      );
      node.setAttribute("schemaJson", JSON.stringify(spec.schema || {}));
      node.setAttribute("dataJson", JSON.stringify(spec.data || {}));
      node.setAttribute("symbolPayload", JSON.stringify(spec));
      return node;
    }
    return {
      applyValueMetadata,
      makeBodyStyle,
      makeLabelStyle,
      makeRootStyle
    };
  }

  // domain/symbolGraph.js
  function buildSymbolGraphDeps() {
    var app = getApp();
    var graphApi = app.graphApi;
    return {
      model: graphApi.model,
      ROOT_TAG: app.constants.ROOT_TAG,
      ROOT_TYPE: app.constants.ROOT_TYPE,
      BODY_TAG: app.constants.BODY_TAG,
      BODY_KIND: app.constants.BODY_KIND,
      LABEL_TAG: app.constants.LABEL_TAG,
      LABEL_KIND: app.constants.LABEL_KIND,
      trim: app.utils.trim,
      isObject: app.utils.isObject,
      normalizeMode: app.helpers.normalizeMode,
      normalizeSpec: app.domains.spec.normalizeSpec,
      normalizePortLayout: app.domains.spec.normalizePortLayout,
      normalizeLabels: app.domains.spec.normalizeLabels,
      parsePortLayout: app.domains.spec.parsePortLayout,
      getAttr: app.utils.getAttr,
      createNode: app.utils.createNode,
      createMetaCell: app.utils.createMetaCell,
      cloneValue: app.utils.cloneValue,
      toStyleImageUri: app.domains.spec.toStyleImageUri,
      serializePortLayout: app.domains.spec.serializePortLayout,
      buildPortLayout: app.domains.spec.buildPortLayout,
      buildResolvedLabels: app.domains.spec.buildResolvedLabels
    };
  }
  function createSymbolDomain() {
    var deps = arguments.length > 0 ? arguments[0] : buildSymbolGraphDeps();
    var model = deps.model;
    var core = createSymbolCore(deps);
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
    function syncRoot(root, spec, baseLayout) {
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
    function buildSymbolCell(spec) {
      var root = new mxCell(
        deps.createNode(deps.ROOT_TAG),
        new mxGeometry(0, 0, spec.size.width, spec.size.height),
        ""
      );
      root.vertex = true;
      root.setConnectable(true);
      return syncRoot(root, spec, null);
    }
    function extractSpec(root) {
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
    function refreshRoot(root) {
      var spec = extractSpec(root);
      var portLayout = deps.parsePortLayout(deps.getAttr(root, "portLayout"));
      syncRoot(root, spec, portLayout);
      return spec;
    }
    return {
      buildSymbolCell,
      extractSpec,
      refreshRoot,
      syncRoot
    };
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
  function createFramePageLabelCell(pageNumber, frameConfig) {
    var config = normalizeFrameConfig(frameConfig);
    var width = 140;
    var height = 24;
    var geometry = new mxGeometry(config.width - width - 16, 10, width, height);
    var value = createMetaCell(
      ELECTRICAL_CONSTANTS.FRAME_LABEL_TAG,
      ELECTRICAL_CONSTANTS.FRAME_LABEL_KIND,
      "page",
      "PAGE " + pageNumber
    );
    var cell = new mxCell(value, geometry, makeFrameLabelStyle());
    cell.vertex = true;
    cell.setConnectable(false);
    return cell;
  }

  // domain/frameGraph.js
  function buildFrameDeps() {
    var app = getApp();
    var constants = app.constants;
    var utils = app.utils;
    var helpers = app.helpers;
    var graphApi = app.graphApi;
    return {
      graph: graphApi.graph,
      model: graphApi.model,
      state: graphApi.state,
      frameTag: constants.FRAME_TAG,
      frameType: constants.FRAME_TYPE,
      frameLabelTag: constants.FRAME_LABEL_TAG,
      frameLabelKind: constants.FRAME_LABEL_KIND,
      frameMarginRatio: constants.FRAME_MARGIN_RATIO,
      defaultWidth: constants.FRAME_DEFAULT_WIDTH,
      defaultHeight: constants.FRAME_DEFAULT_HEIGHT,
      trim: utils.trim,
      toInt: utils.toInt,
      isObject: utils.isObject,
      getAttr: utils.getAttr,
      createNode: utils.createNode,
      createMetaCell: utils.createMetaCell,
      generateFrameId: helpers.generateFrameId,
      isDrawingFrame: helpers.isDrawingFrame,
      showStatus: app.showStatus,
      setCanvasStatus: app.setCanvasStatus
    };
  }
  function createFrameDomain() {
    var deps = arguments.length > 0 ? arguments[0] : buildFrameDeps();
    var graph = deps.graph;
    var model = deps.model;
    function findDrawingFrame(cell) {
      while (cell != null) {
        if (deps.isDrawingFrame(cell)) {
          return cell;
        }
        cell = model.getParent(cell);
      }
      return null;
    }
    function getFrameConfig(frame) {
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
    function getFramePageNumber(frame) {
      return Math.max(1, deps.toInt(deps.getAttr(frame, "pageNumber"), 1));
    }
    function getAllDrawingFrames() {
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
    function findFrameById(frameId) {
      var target = deps.trim(frameId);
      var frames = getAllDrawingFrames();
      var i;
      for (i = 0; i < frames.length; i++) {
        if (deps.trim(deps.getAttr(frames[i], "frameId")) == target) {
          return frames[i];
        }
      }
      return null;
    }
    function getFrameGroupId(frame) {
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
        var originFrame = findFrameById(originFrameId);
        if (originFrame != null && originFrame != frame) {
          return getFrameGroupId(originFrame);
        }
        return originFrameId;
      }
      return frameId;
    }
    function getFramesInGroup(groupId) {
      var target = deps.trim(groupId);
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
        if (rightmost == null || geometry.x + geometry.width > model.getGeometry(rightmost).x + model.getGeometry(rightmost).width) {
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
        if (bottommost == null || geometry.y + geometry.height > model.getGeometry(bottommost).y + model.getGeometry(bottommost).height) {
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
        if (last == null || getFramePageNumber(frames[i]) > getFramePageNumber(last)) {
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
        deps.showStatus("\u8BF7\u5148\u63D2\u5165\u6216\u9009\u4E2D\u4E00\u4E2A\u56FE\u6846", true);
        deps.setCanvasStatus("\u8BF7\u5148\u63D2\u5165\u6216\u9009\u4E2D\u4E00\u4E2A\u56FE\u6846");
      }
      return frame;
    }
    function getFrameChildInsertPoint(frame, width, height) {
      var frameConfig = getFrameConfig(frame);
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
    function createDrawingFrameCell(frameConfig, pageNumber, extra) {
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
      root.insert(createFramePageLabelCell(pageNumber, config));
      return root;
    }
    function addTopLevelCell(cell) {
      model.add(graph.getDefaultParent(), cell);
      return cell;
    }
    return {
      addTopLevelCell,
      createDrawingFrameCell,
      findDrawingFrame,
      findFrameById,
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
  }

  // domain/cabinetCore.js
  function makeCabinetRootStyle() {
    return "fillColor=none;strokeColor=none;html=1;whiteSpace=wrap;connectable=1;container=1;collapsible=0;foldable=0;recursiveResize=0;rotatable=0;resizable=0;";
  }
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
      path = "M " + inset + " " + inset + " L " + (width - inset) + " " + inset + " L " + (width - inset) + " " + (height - inset) + " L " + inset + " " + (height - inset) + " Z";
    } else {
      var topY = descriptor.continuesFromPrev ? inset + notchDepth : inset;
      var bottomY = descriptor.continuesToNext ? height - inset - notchDepth : height - inset;
      path = "M " + inset + " " + topY + " L " + notchLeft + " " + topY + " " + (descriptor.continuesFromPrev ? "L " + (notchLeft + notchWidth) + " " + inset + " " : "") + "L " + (width - inset) + " " + inset + " L " + (width - inset) + " " + (height - inset) + " " + (descriptor.continuesToNext ? "L " + (notchLeft + notchWidth) + " " + (height - inset) + " L " + notchLeft + " " + bottomY + " " : "") + "L " + inset + " " + bottomY + " Z";
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '" viewBox="0 0 ' + width + " " + height + '"><path d="' + path + '" fill="none" stroke="#111111" stroke-width="' + strokeWidth + '" stroke-linejoin="round" stroke-linecap="round"/></svg>';
  }
  function makeCabinetBodyStyle(descriptor) {
    return "shape=image;image=data:image/svg+xml," + encodeURIComponent(createCabinetBodySvg(descriptor)) + ";imageAspect=0;aspect=fixed;html=1;strokeColor=none;fillColor=none;part=1;connectable=0;editable=0;movable=0;resizable=0;rotatable=0;cloneable=0;deletable=0;pointerEvents=0;";
  }
  function makeCabinetGapStyle(selected) {
    return "shape=rectangle;fillColor=#4dabf7;gradientColor=none;fillOpacity=" + (selected ? "38" : "14") + ";strokeColor=" + (selected ? "#1d4ed8" : "none") + ";strokeWidth=" + (selected ? "2" : "0") + ";connectable=0;editable=0;movable=0;resizable=0;rotatable=0;";
  }
  function normalizeGapRatio(value, fallbackValue) {
    return clamp(toFloat(value, fallbackValue != null ? fallbackValue : 0.12), 0, 1);
  }
  function normalizeCabinetPort(raw, index) {
    var base = normalizePortPoint(
      raw,
      trim(raw != null ? raw.id : "") || "cabinet-port:" + index,
      1,
      0
    );
    base.direction = "right";
    base.ioMode = "out";
    base.order = index;
    return base;
  }
  function normalizeCabinetModel(raw) {
    raw = isObject(raw) ? cloneJson(raw) : {};
    var portCount = Math.max(
      2,
      Array.isArray(raw.ports) ? raw.ports.length : toInt(raw.portCount, ELECTRICAL_CONSTANTS.CABINET_DEFAULT_PORT_COUNT)
    );
    var ports = [];
    var i;
    var gapRatios = [];
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
              ioMode: "out"
            },
            i
          )
        );
      }
    }
    for (i = 0; i < Math.max(0, ports.length - 1); i++) {
      gapRatios.push(
        normalizeGapRatio(Array.isArray(raw.gapRatios) ? raw.gapRatios[i] : null, 0.12)
      );
    }
    return {
      logicalCabinetId: trim(raw.logicalCabinetId) || generateUuid(),
      originFrameId: trim(raw.originFrameId),
      title: trim(raw.title) || "\u914D\u7535\u67DC",
      cabinetWidth: Math.max(
        30,
        toInt(raw.cabinetWidth, ELECTRICAL_CONSTANTS.CABINET_DEFAULT_WIDTH)
      ),
      cabinetX: Math.max(20, toInt(raw.cabinetX, ELECTRICAL_CONSTANTS.CABINET_DEFAULT_X)),
      tailPadding: Math.max(
        8,
        toInt(raw.tailPadding, ELECTRICAL_CONSTANTS.CABINET_TAIL_PADDING)
      ),
      ports,
      gapRatios
    };
  }
  function buildCabinetOffsets(cabinetModel, frameConfig) {
    var config = normalizeFrameConfig(frameConfig);
    var modelData = normalizeCabinetModel(cabinetModel);
    var usableHeight = config.height * ELECTRICAL_CONSTANTS.FRAME_CONTENT_RATIO;
    var topMargin = config.height * ELECTRICAL_CONSTANTS.FRAME_MARGIN_RATIO;
    var offsets = [];
    var minFollowSpace = Math.max(
      modelData.tailPadding * 2,
      usableHeight * ELECTRICAL_CONSTANTS.CABINET_MIN_PORT_FOLLOW_SPACE_RATIO
    );
    var currentOffset = modelData.tailPadding;
    var i;
    if (modelData.ports.length == 0) {
      modelData.ports = normalizeCabinetModel({ portCount: 2 }).ports;
      modelData.gapRatios = [0.12];
    }
    for (i = 0; i < modelData.ports.length; i++) {
      if (i > 0) {
        var previousGap = modelData.gapRatios[i - 1] * usableHeight;
        var nextGap = i < modelData.gapRatios.length ? modelData.gapRatios[i] * usableHeight : 0;
        var candidateOffset = currentOffset + previousGap;
        var candidatePage = Math.floor(Math.max(0, candidateOffset - 1e-4) / usableHeight);
        var candidateLocalOffset = candidateOffset - candidatePage * usableHeight;
        var remainingLocalSpace = usableHeight - candidateLocalOffset;
        if (i < modelData.gapRatios.length && previousGap + nextGap > usableHeight && candidateLocalOffset > modelData.tailPadding) {
          currentOffset = (candidatePage + 1) * usableHeight + modelData.tailPadding;
        } else if (remainingLocalSpace < minFollowSpace && candidateLocalOffset > modelData.tailPadding) {
          currentOffset = (candidatePage + 1) * usableHeight + modelData.tailPadding;
        } else {
          currentOffset = candidateOffset;
        }
      }
      offsets.push(currentOffset);
    }
    return {
      frameConfig: config,
      cabinetModel: modelData,
      usableHeight,
      topMargin,
      offsets,
      totalLogicalHeight: (offsets.length > 0 ? offsets[offsets.length - 1] : modelData.tailPadding) + modelData.tailPadding
    };
  }
  function getPageIndexForOffset(offset, usableHeight, pageCount) {
    if (pageCount <= 1 || offset <= 0) {
      return 0;
    }
    return clamp(Math.floor((offset - 1e-4) / usableHeight), 0, pageCount - 1);
  }
  function buildCabinetPageDescriptors(cabinetModel, frameConfig) {
    var layout = buildCabinetOffsets(cabinetModel, frameConfig);
    var pageCount = Math.max(1, Math.ceil(layout.totalLogicalHeight / layout.usableHeight));
    var descriptors = [];
    var pageIndex;
    var i;
    for (pageIndex = 0; pageIndex < pageCount; pageIndex++) {
      var pageStart = pageIndex * layout.usableHeight;
      var remaining = Math.max(0, layout.totalLogicalHeight - pageStart);
      var segmentHeight = pageCount > 1 ? layout.usableHeight : Math.max(
        layout.cabinetModel.tailPadding,
        Math.min(layout.usableHeight, remaining)
      );
      var ports = [];
      var gaps = [];
      for (i = 0; i < layout.cabinetModel.ports.length; i++) {
        if (getPageIndexForOffset(layout.offsets[i], layout.usableHeight, pageCount) == pageIndex) {
          var localOffset = layout.offsets[i] - pageStart;
          var port = cloneJson(layout.cabinetModel.ports[i]);
          port.x = 1;
          port.y = segmentHeight > 0 ? clamp(localOffset / segmentHeight, 0, 1) : 0;
          port.order = i;
          port.logicalOffset = layout.offsets[i];
          ports.push(port);
        }
      }
      for (i = 0; i < layout.cabinetModel.gapRatios.length; i++) {
        var gapAbsoluteStart = layout.offsets[i];
        var gapAbsoluteEnd = i + 1 < layout.offsets.length ? layout.offsets[i + 1] : gapAbsoluteStart;
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
            height: Math.max(12, gapEnd - gapStart)
          });
        }
      }
      descriptors.push({
        segmentIndex: pageIndex,
        pageCount,
        continuesFromPrev: pageIndex > 0,
        continuesToNext: pageIndex < pageCount - 1,
        x: layout.cabinetModel.cabinetX,
        y: layout.topMargin,
        width: layout.cabinetModel.cabinetWidth,
        height: segmentHeight,
        segmentStartOffset: pageStart,
        segmentEndOffset: pageStart + segmentHeight,
        ports,
        gaps,
        frameConfig: layout.frameConfig,
        cabinetModel: layout.cabinetModel
      });
    }
    return descriptors;
  }

  // domain/cabinetGraph.js
  function buildCabinetDeps() {
    var app = getApp();
    var constants = app.constants;
    var utils = app.utils;
    var domains = app.domains;
    var helpers = app.helpers;
    var graphApi = app.graphApi;
    return {
      model: graphApi.model,
      state: graphApi.state,
      cabinetTag: constants.CABINET_TAG,
      cabinetType: constants.CABINET_TYPE,
      cabinetBodyTag: constants.CABINET_BODY_TAG,
      cabinetBodyKind: constants.CABINET_BODY_KIND,
      cabinetGapTag: constants.CABINET_GAP_TAG,
      cabinetGapType: constants.CABINET_GAP_TYPE,
      cabinetGapKind: constants.CABINET_GAP_KIND,
      frameLabelKind: constants.FRAME_LABEL_KIND,
      frameContentRatio: constants.FRAME_CONTENT_RATIO,
      frameMarginRatio: constants.FRAME_MARGIN_RATIO,
      frameHorizontalGap: constants.FRAME_HORIZONTAL_GAP,
      minPortFollowSpaceRatio: constants.CABINET_MIN_PORT_FOLLOW_SPACE_RATIO,
      defaultWidth: constants.CABINET_DEFAULT_WIDTH,
      defaultPortCount: constants.CABINET_DEFAULT_PORT_COUNT,
      defaultX: constants.CABINET_DEFAULT_X,
      tailPadding: constants.CABINET_TAIL_PADDING,
      trim: utils.trim,
      toInt: utils.toInt,
      toFloat: utils.toFloat,
      clamp: utils.clamp,
      isObject: utils.isObject,
      cloneJson: utils.cloneJson,
      normalizePortPoint: domains.spec.normalizePortPoint,
      generateLogicalCabinetId: helpers.generateLogicalCabinetId,
      createNode: utils.createNode,
      createMetaCell: utils.createMetaCell,
      serializePortLayout: domains.spec.serializePortLayout,
      getAttr: utils.getAttr,
      isCabinetSegment: helpers.isCabinetSegment,
      isCabinetGap: helpers.isCabinetGap,
      getNormalizedFrameConfig: domains.frame.normalizeFrameConfig,
      getAllDrawingFrames: domains.frame.getAllDrawingFrames,
      getFrameConfig: domains.frame.getFrameConfig,
      getFrameGroupId: domains.frame.getFrameGroupId,
      getFramePageNumber: domains.frame.getFramePageNumber,
      getMaxFramePageNumberInGroup: domains.frame.getMaxFramePageNumberInGroup,
      getRightmostFrameInGroup: domains.frame.getRightmostFrameInGroup,
      findFrameById: domains.frame.findFrameById,
      findDrawingFrame: domains.frame.findDrawingFrame,
      createDrawingFrameCell: domains.frame.createDrawingFrameCell,
      addTopLevelCell: domains.frame.addTopLevelCell,
      getEdgePortId: function(edge, root, source) {
        return domains.snapshot.getEdgePortId(edge, root, source);
      },
      getPortMetaById: domains.connectionConstraints.getPortMetaById,
      parsePortLayout: domains.spec.parsePortLayout,
      isMovableConnectedTerminal: domains.connectionConstraints.isMovableConnectedTerminal,
      moveCellToFrameByDelta: domains.connectionConstraints.moveCellToFrameByDelta,
      setConnectionConstraint: function(edge, root, source, constraint) {
        graphApi.graph.setConnectionConstraint(edge, root, source, constraint);
      }
    };
  }
  function createCabinetDomain() {
    var deps = arguments.length > 0 ? arguments[0] : buildCabinetDeps();
    var model = deps.model;
    var state = deps.state;
    function findCabinetSegment(cell) {
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
      node.setAttribute("gapRatiosJson", JSON.stringify(cabinetModel.gapRatios));
      node.setAttribute("portsJson", deps.serializePortLayout(descriptor.ports));
      node.setAttribute("portLayout", deps.serializePortLayout(descriptor.ports));
      node.setAttribute("label", "");
      return node;
    }
    function createCabinetBodyCell(descriptor) {
      var cell = new mxCell(
        deps.createMetaCell(
          deps.cabinetBodyTag,
          deps.cabinetBodyKind,
          "main",
          ""
        ),
        new mxGeometry(0, 0, descriptor.width, descriptor.height),
        makeCabinetBodyStyle(descriptor)
      );
      cell.vertex = true;
      cell.setConnectable(false);
      return cell;
    }
    function isSelectedCabinetGap(logicalCabinetId, gapIndex) {
      return state.selectedCabinetGap != null && deps.trim(state.selectedCabinetGap.logicalCabinetId) == deps.trim(logicalCabinetId) && deps.toInt(state.selectedCabinetGap.gapIndex, -1) == deps.toInt(gapIndex, -1);
    }
    function createCabinetGapCell(cabinetModel, descriptor, gap) {
      var value = deps.createNode(deps.cabinetGapTag);
      value.setAttribute("pluginType", deps.cabinetGapType);
      value.setAttribute("esKind", deps.cabinetGapKind);
      value.setAttribute("esKey", String(gap.gapIndex));
      value.setAttribute(
        "logicalCabinetId",
        deps.trim(cabinetModel.logicalCabinetId)
      );
      value.setAttribute("gapIndex", String(gap.gapIndex));
      value.setAttribute("label", "");
      var geometry = new mxGeometry(1, gap.y, 14, gap.height);
      geometry.relative = true;
      geometry.offset = new mxPoint(-7, 0);
      var cell = new mxCell(
        value,
        geometry,
        makeCabinetGapStyle(
          isSelectedCabinetGap(cabinetModel.logicalCabinetId, gap.gapIndex)
        )
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
        x,
        y,
        width: geometry != null ? geometry.width : 0,
        height: geometry != null ? geometry.height : 0
      };
    }
    function getPortAbsolutePosition(root, port) {
      var geometry = getCellAbsoluteGeometry(root);
      return {
        x: geometry.x + port.x * geometry.width,
        y: geometry.y + port.y * geometry.height
      };
    }
    function buildCabinetSegmentCell(cabinetModel, frameId, descriptor) {
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
        makeCabinetRootStyle()
      );
      var i;
      root.vertex = true;
      root.setConnectable(true);
      root.insert(createCabinetBodyCell(descriptor));
      for (i = 0; i < descriptor.gaps.length; i++) {
        root.insert(
          createCabinetGapCell(cabinetModel, descriptor, descriptor.gaps[i])
        );
      }
      return root;
    }
    function extractCabinetModel(cell) {
      var root = findCabinetSegment(cell);
      var raw;
      if (root == null) {
        throw new Error("\u672A\u627E\u5230\u914D\u7535\u67DC\u7247\u6BB5");
      }
      raw = deps.getAttr(root, "cabinetModelJson");
      if (raw == null || raw.length == 0) {
        throw new Error("\u7F3A\u5C11 cabinetModelJson \u6570\u636E");
      }
      return normalizeCabinetModel(JSON.parse(raw));
    }
    function findCabinetSegments(logicalCabinetId) {
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
    function updateCabinetGapHighlight() {
      var frames = deps.getAllDrawingFrames();
      var i;
      var j;
      var k;
      model.beginUpdate();
      try {
        for (i = 0; i < frames.length; i++) {
          for (j = 0; j < model.getChildCount(frames[i]); j++) {
            var segment = model.getChildAt(frames[i], j);
            if (!deps.isCabinetSegment(segment)) {
              continue;
            }
            for (k = 0; k < model.getChildCount(segment); k++) {
              var child = model.getChildAt(segment, k);
              if (deps.isCabinetGap(child)) {
                var nextStyle = makeCabinetGapStyle(
                  isSelectedCabinetGap(
                    deps.getAttr(child, "logicalCabinetId"),
                    deps.getAttr(child, "gapIndex")
                  )
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
      if (deps.trim(logicalCabinetId).length == 0 || deps.toInt(gapIndex, -1) < 0) {
        state.selectedCabinetGap = null;
      } else {
        state.selectedCabinetGap = {
          logicalCabinetId: deps.trim(logicalCabinetId),
          gapIndex: deps.toInt(gapIndex, -1)
        };
      }
      updateCabinetGapHighlight();
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
          var portId = deps.getEdgePortId(edge, segment, source);
          var port = deps.getPortMetaById(segment, portId);
          if (port == null) {
            continue;
          }
          attachments.push({
            edge,
            source,
            portId,
            oldPortPosition: getPortAbsolutePosition(segment, port),
            otherTerminal: model.getTerminal(edge, !source)
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
        var frame = deps.findDrawingFrame(segment);
        var ports = deps.parsePortLayout(deps.getAttr(segment, "portsJson"));
        var j;
        for (j = 0; j < ports.length; j++) {
          result[deps.trim(ports[j].id)] = {
            segment,
            port: ports[j],
            frame,
            absolutePosition: getPortAbsolutePosition(segment, ports[j])
          };
        }
      }
      return result;
    }
    function restoreCabinetAttachments(attachments, newPortMap) {
      var movedTerminals = {};
      var i;
      for (i = 0; i < attachments.length; i++) {
        var attachment = attachments[i];
        var target = newPortMap[deps.trim(attachment.portId)];
        if (target == null) {
          continue;
        }
        model.setTerminal(attachment.edge, target.segment, attachment.source);
        deps.setConnectionConstraint(
          attachment.edge,
          target.segment,
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
    function relayoutCabinetByModel(cabinetModel) {
      var normalized = normalizeCabinetModel(cabinetModel);
      var originFrame = deps.findFrameById(normalized.originFrameId);
      if (originFrame == null) {
        throw new Error("\u672A\u627E\u5230\u914D\u7535\u67DC\u6240\u5C5E\u7684\u8D77\u59CB\u56FE\u6846");
      }
      var frameConfig = deps.getFrameConfig(originFrame);
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
        true
      );
      for (i = 0; i < descriptors.length; i++) {
        var segment = buildCabinetSegmentCell(
          normalized,
          deps.trim(deps.getAttr(frames[i], "frameId")),
          descriptors[i]
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
    return {
      buildCabinetPageDescriptors,
      buildCabinetPortMap,
      buildCabinetSegmentCell,
      collectCabinetAttachments,
      extractCabinetModel,
      findCabinetSegment,
      findCabinetSegments,
      getCellAbsoluteGeometry,
      getPortAbsolutePosition,
      normalizeCabinetModel,
      relayoutCabinetByModel,
      restoreCabinetAttachments,
      setSelectedCabinetGap
    };
  }

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

  // domain/snapshotGraph.js
  function buildSnapshotDeps() {
    var app = getApp();
    var graphApi = app.graphApi;
    return {
      graph: graphApi.graph,
      model: graphApi.model,
      state: graphApi.state,
      ui: graphApi.ui,
      BODY_KIND: app.constants.BODY_KIND,
      LABEL_KIND: app.constants.LABEL_KIND,
      FRAME_LABEL_KIND: app.constants.FRAME_LABEL_KIND,
      CABINET_BODY_KIND: app.constants.CABINET_BODY_KIND,
      CABINET_GAP_KIND: app.constants.CABINET_GAP_KIND,
      FRAME_MARGIN_RATIO: app.constants.FRAME_MARGIN_RATIO,
      trim: app.utils.trim,
      toInt: app.utils.toInt,
      isObject: app.utils.isObject,
      cloneJson: app.utils.cloneJson,
      createNode: app.utils.createNode,
      getAttr: app.utils.getAttr,
      uniqueStrings: app.utils.uniqueStrings,
      isCabinetGap: app.helpers.isCabinetGap,
      isDrawingFrame: app.helpers.isDrawingFrame,
      isCabinetSegment: app.helpers.isCabinetSegment,
      isElectricalRoot: app.helpers.isElectricalRoot,
      extractSpec: app.domains.symbol.extractSpec,
      getFrameConfig: app.domains.frame.getFrameConfig,
      getFramePageNumber: app.domains.frame.getFramePageNumber,
      getFrameGroupId: app.domains.frame.getFrameGroupId,
      findFrameById: app.domains.frame.findFrameById,
      extractCabinetModel: app.domains.cabinet.extractCabinetModel,
      findCabinetSegments: app.domains.cabinet.findCabinetSegments,
      getPortMetaById: app.domains.connectionConstraints.getPortMetaById,
      findDrawingFrame: app.domains.frame.findDrawingFrame,
      findPortHostRoot: app.helpers.findPortHostRoot,
      parsePortLayout: app.domains.spec.parsePortLayout,
      getAllDrawingFrames: app.domains.frame.getAllDrawingFrames,
      exitInstanceComposeMode: function(clearStatus) {
        return app.runtime != null && typeof app.runtime.exitInstanceComposeMode === "function" ? app.runtime.exitInstanceComposeMode(clearStatus) : null;
      },
      closeGapDialogWindow: function() {
        return app.ui != null && typeof app.ui.closeGapDialogWindow === "function" ? app.ui.closeGapDialogWindow() : null;
      },
      setSelectedCabinetGap: function(logicalCabinetId, gapIndex) {
        return app.domains.cabinet.setSelectedCabinetGap(logicalCabinetId, gapIndex);
      },
      exitPortSwapMode: function(clearStatus) {
        return app.runtime != null && typeof app.runtime.exitPortSwapMode === "function" ? app.runtime.exitPortSwapMode(clearStatus) : null;
      },
      createDrawingFrameCell: app.domains.frame.createDrawingFrameCell,
      addTopLevelCell: app.domains.frame.addTopLevelCell,
      relayoutCabinetByModel: app.domains.cabinet.relayoutCabinetByModel,
      normalizeSpec: app.domains.spec.normalizeSpec,
      buildSymbolCell: app.domains.symbol.buildSymbolCell,
      resetPendingChangeRecords: app.helpers.resetPendingChangeRecords
    };
  }
  function createSnapshotDomain() {
    var deps = arguments.length > 0 ? arguments[0] : buildSnapshotDeps();
    var graph = deps.graph;
    var model = deps.model;
    var state = deps.state;
    var ui = deps.ui;
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
    function getEdgePortId(edge, root, source) {
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
      genericBindings = isGenericRoot ? collectGenericPortBindings(root) : null;
      ports = isGenericRoot ? genericBindings.map(function(binding2) {
        return binding2.port;
      }) : deps.parsePortLayout(deps.getAttr(root, "portsJson"));
      if (isGenericRoot && constraint != null) {
        var absolutePoint = edgeState != null && terminalState != null ? graph.getConnectionPoint(terminalState, constraint) : null;
        for (i = 0; i < genericBindings.length; i++) {
          var binding = genericBindings[i];
          if (deps.trim(binding.port.name).length > 0 && deps.trim(binding.port.name) == deps.trim(constraint.name)) {
            return deps.trim(binding.port.id);
          }
          if (binding.constraint != null && binding.constraint.point != null && Math.abs(binding.constraint.point.x - constraint.point.x) < 1e-4 && Math.abs(binding.constraint.point.y - constraint.point.y) < 1e-4 && toNumber(binding.constraint.dx, 0) == toNumber(constraint.dx, 0) && toNumber(binding.constraint.dy, 0) == toNumber(constraint.dy, 0) && binding.constraint.perimeter === constraint.perimeter) {
            return deps.trim(binding.port.id);
          }
          if (absolutePoint != null && Math.abs(binding.port.x - absolutePoint.x) < 1 && Math.abs(binding.port.y - absolutePoint.y) < 1) {
            return deps.trim(binding.port.id);
          }
        }
      }
      if (point != null) {
        for (i = 0; i < ports.length; i++) {
          if (Math.abs(ports[i].x - point.x) < 1e-4 && Math.abs(ports[i].y - point.y) < 1e-4) {
            return deps.trim(ports[i].id);
          }
        }
      }
      return "";
    }
    function isPluginInternalCell(cell) {
      var kind = deps.trim(deps.getAttr(cell, "esKind"));
      return deps.isCabinetGap(cell) || kind == deps.BODY_KIND || kind == deps.LABEL_KIND || kind == deps.FRAME_LABEL_KIND || kind == deps.CABINET_BODY_KIND || kind == deps.CABINET_GAP_KIND;
    }
    function shouldExportGenericObject(cell) {
      return cell != null && model.isVertex(cell) && !deps.isDrawingFrame(cell) && !deps.isCabinetSegment(cell) && !deps.isElectricalRoot(cell) && !isPluginInternalCell(cell);
    }
    function clearPageForImport() {
      var parent = graph.getDefaultParent();
      var cells = [];
      var i;
      for (i = 0; i < model.getChildCount(parent); i++) {
        cells.push(model.getChildAt(parent, i));
      }
      deps.closeGapDialogWindow();
      deps.setSelectedCabinetGap(null, null);
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
        return deps.trim(deps.getAttr(cell, "frameId")) || null;
      }
      if (deps.isCabinetSegment(cell)) {
        return deps.trim(deps.getAttr(cell, "logicalCabinetId")) || null;
      }
      if (deps.isElectricalRoot(cell)) {
        return getSymbolObjectId(cell);
      }
      if (shouldExportGenericObject(cell)) {
        return getGenericObjectId(cell);
      }
      return null;
    }
    function collectGenericPortBindings(cell) {
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
      return collectGenericPortBindings(cell).map(function(entry) {
        return entry.port;
      });
    }
    function getGenericPortBindingById(cell, portId) {
      var targetId = deps.trim(portId);
      var bindings = collectGenericPortBindings(cell);
      var i;
      for (i = 0; i < bindings.length; i++) {
        if (deps.trim(bindings[i].port.id) == targetId) {
          return bindings[i];
        }
      }
      return null;
    }
    function getSymbolObjectId(root) {
      var instanceId = deps.trim(deps.getAttr(root, "instanceId"));
      if (instanceId.length > 0) {
        return instanceId;
      }
      var spec = deps.extractSpec(root);
      return deps.trim(spec.instanceId) || deps.trim(root != null ? root.id : "");
    }
    function exportFrameObject(frame) {
      var geometry = model.getGeometry(frame);
      var frameId = deps.trim(deps.getAttr(frame, "frameId"));
      var frameConfig = deps.getFrameConfig(frame);
      return {
        id: frameId,
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
      var originFrame = deps.findFrameById(cabinetModel.originFrameId);
      return {
        id: deps.trim(cabinetModel.logicalCabinetId),
        kind: "cabinet",
        parentId: deps.trim(cabinetModel.originFrameId) || null,
        groupId: originFrame != null ? deps.getFrameGroupId(originFrame) : null,
        geometry: {
          x: cabinetModel.cabinetX,
          y: originFrame != null ? Math.round(deps.getFrameConfig(originFrame).height * deps.FRAME_MARGIN_RATIO) : 0,
          width: cabinetModel.cabinetWidth,
          height: 0
        },
        props: {
          cabinetModel
        }
      };
    }
    function exportSymbolObject(root) {
      var spec = deps.extractSpec(root);
      var geometry = model.getGeometry(root);
      var frame = deps.findDrawingFrame(root);
      var parent = model.getParent(root);
      if (parent == graph.getDefaultParent()) {
        parent = null;
      }
      return {
        id: getSymbolObjectId(root),
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
      var sourcePortRoot = sourceRoot != null ? sourceRoot : shouldExportGenericObject(sourceTerminal) ? sourceTerminal : null;
      var targetPortRoot = targetRoot != null ? targetRoot : shouldExportGenericObject(targetTerminal) ? targetTerminal : null;
      var geometry = model.getGeometry(edge);
      var style = model.getStyle(edge) || "";
      var parent = model.getParent(edge);
      var sourcePortId = sourcePortRoot != null ? getEdgePortId(edge, sourcePortRoot, true) : null;
      var targetPortId = targetPortRoot != null ? getEdgePortId(edge, targetPortRoot, false) : null;
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
          vertex: cell.vertex === true,
          connectable: typeof cell.isConnectable === "function" ? !!cell.isConnectable() : cell.connectable !== false,
          visible: cell.visible !== false,
          collapsed: !!cell.collapsed,
          ports: extractGenericPorts(cell)
        }
      };
    }
    function collectChangeObjectIds(changes) {
      var result = [];
      var i;
      for (i = 0; Array.isArray(changes) && i < changes.length; i++) {
        if (deps.trim(changes[i].objectId).length > 0) {
          result.push(changes[i].objectId);
        }
      }
      return deps.uniqueStrings(result);
    }
    function exportDiagramSnapshot() {
      var frames = deps.getAllDrawingFrames();
      var frameObjects = [];
      var cabinetObjects = [];
      var symbolObjects = [];
      var genericObjects = [];
      var edgeObjects = [];
      var cabinetSeen = {};
      var allCells = getAllModelCells();
      var i;
      for (i = 0; i < frames.length; i++) {
        frameObjects.push(exportFrameObject(frames[i]));
      }
      for (i = 0; i < allCells.length; i++) {
        var cell = allCells[i];
        if (deps.isCabinetSegment(cell)) {
          var logicalId = deps.trim(deps.getAttr(cell, "logicalCabinetId"));
          if (!cabinetSeen[logicalId]) {
            cabinetSeen[logicalId] = true;
            cabinetObjects.push(exportCabinetObject(cell));
          }
        } else if (deps.isElectricalRoot(cell)) {
          symbolObjects.push(exportSymbolObject(cell));
        } else if (shouldExportGenericObject(cell)) {
          genericObjects.push(exportGenericObject(cell));
        } else if (model.isEdge(cell)) {
          edgeObjects.push(exportEdgeObject(cell));
        }
      }
      return {
        diagramId: deps.trim(state.backendDiagramId),
        version: Math.max(0, state.backendDiagramVersion),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        objects: frameObjects.concat(cabinetObjects).concat(symbolObjects).concat(genericObjects),
        edges: edgeObjects
      };
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
      var binding = getGenericPortBindingById(root, portId);
      return binding != null ? binding.constraint : null;
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
    function resolveImportedEdgeTerminal(terminal, symbolMap, genericMap) {
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
        return findCabinetSegmentForPort(objectId, portId);
      }
      return null;
    }
    function restoreDiagramSnapshot(snapshot) {
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
            cabinetModel.logicalCabinetId = cabinetObject.id;
            cabinetModel.originFrameId = cabinetObject.parentId;
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
            for (i = 0; i < snapshot.edges.length; i++) {
              var edgeObject = snapshot.edges[i];
              var sourceRoot = resolveImportedEdgeTerminal(
                edgeObject.source,
                symbolMap,
                genericMap
              );
              var targetRoot = resolveImportedEdgeTerminal(
                edgeObject.target,
                symbolMap,
                genericMap
              );
              if (sourceRoot == null && targetRoot == null && !deps.isObject(
                edgeObject.props != null ? edgeObject.props.geometry : null
              )) {
                continue;
              }
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
        deps.resetPendingChangeRecords(exportDiagramSnapshot());
      }
    }
    return {
      collectChangeObjectIds,
      collectGenericPortBindings,
      computeSnapshotChanges,
      deserializeCellValue,
      deserializeGeometry,
      exportDiagramSnapshot,
      getEdgePortId,
      getConstraintForPort: buildConstraintForPort,
      getGenericObjectId,
      getGenericPortBindingById,
      isPluginInternalCell,
      normalizeGenericStableId,
      normalizeSnapshotGenericIds,
      restoreDiagramSnapshot,
      serializeCellValue,
      serializeGeometry,
      shouldExportGenericObject
    };
  }

  // runtime/connectionConstraints.js
  function buildConstraintDeps() {
    var app = getApp();
    var ctx = app.ctx;
    return {
      ctx,
      trim: app.utils.trim,
      clamp: app.utils.clamp,
      parsePortLayout: app.domains.spec.parsePortLayout,
      getAttr: app.utils.getAttr,
      buildPortLayout: app.domains.spec.buildPortLayout,
      findPortHostRoot: app.helpers.findPortHostRoot,
      normalizePortDirection: app.domains.spec.normalizePortDirection,
      normalizePortIoMode: app.domains.spec.normalizePortIoMode,
      isDrawingFrame: app.helpers.isDrawingFrame,
      isCabinetSegment: app.helpers.isCabinetSegment,
      isCabinetGap: app.helpers.isCabinetGap,
      findDrawingFrame: app.domains.frame.findDrawingFrame,
      getCellAbsoluteGeometry: function(cell) {
        return app.domains.cabinet.getCellAbsoluteGeometry(cell);
      },
      getPortAbsolutePosition: function(root, port) {
        return app.domains.cabinet.getPortAbsolutePosition(root, port);
      }
    };
  }
  function createConnectionConstraints() {
    var deps = arguments.length > 0 ? arguments[0] : buildConstraintDeps();
    var ctx = deps.ctx;
    var graph = ctx.graph;
    var model = ctx.model;
    var state = ctx.state;
    var oldGetAllConnectionConstraints = graph.getAllConnectionConstraints;
    var oldSetConnectionConstraint = graph.setConnectionConstraint;
    var oldValidateConnection = graph.connectionHandler.validateConnection;
    function getElectricalConstraints(cell) {
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
      switch (deps.normalizePortDirection(direction)) {
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
      if (sourcePort != null && deps.normalizePortIoMode(sourcePort.ioMode) == "in") {
        return "\u8BE5\u7AEF\u5B50\u4EC5\u5141\u8BB8\u63A5\u5165\uFF0C\u4E0D\u80FD\u4F5C\u4E3A\u8FDE\u7EBF\u8D77\u70B9";
      }
      if (targetPort != null && deps.normalizePortIoMode(targetPort.ioMode) == "out") {
        return "\u8BE5\u7AEF\u5B50\u4EC5\u5141\u8BB8\u63A5\u51FA\uFF0C\u4E0D\u80FD\u4F5C\u4E3A\u8FDE\u7EBF\u7EC8\u70B9";
      }
      return null;
    }
    function applyNativeConnectionConstraint(edge, terminal, source, constraint) {
      oldSetConnectionConstraint.call(graph, edge, terminal, source, constraint);
    }
    function isMovableConnectedTerminal(cell) {
      return cell != null && model.isVertex(cell) && !deps.isDrawingFrame(cell) && !deps.isCabinetSegment(cell) && !deps.isCabinetGap(cell);
    }
    function clampCellGeometryToFrame(geometry, frame) {
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
      var bounds = null;
      var i;
      for (i = 0; i < cells.length; i++) {
        var geometry = deps.getCellAbsoluteGeometry(cells[i]);
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
      var geometry = model.getGeometry(edge);
      if (geometry != null && geometry.points != null && geometry.points.length > 0) {
        geometry = geometry.clone();
        geometry.points = null;
        model.setGeometry(edge, geometry);
      }
    }
    function moveConnectedGroupToCabinetPort(edge, source, oldRoot, oldPortId, newRoot, newPort) {
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
      graph.getAllConnectionConstraints = function(terminal, source) {
        var root = deps.findPortHostRoot(terminal != null ? terminal.cell : null);
        if (root != null) {
          return getElectricalConstraints(root);
        }
        return oldGetAllConnectionConstraints.apply(this, arguments);
      };
      graph.setConnectionConstraint = function(edge, terminal, source, constraint) {
        if (edge == null) {
          oldSetConnectionConstraint.apply(this, arguments);
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
        oldSetConnectionConstraint.apply(this, arguments);
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
        var error = oldValidateConnection.apply(this, arguments);
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
    return {
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
  }

  // services/draftStore.js
  function createDraftStore() {
    var deps = arguments.length > 0 ? arguments[0] : {};
    var state = deps.state;
    var storageKey = deps.storageKey;
    var trim2 = deps.trim;
    var cloneJson2 = deps.cloneJson;
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
      var storage = getDraftStorage();
      clearDraftSaveTimer();
      if (storage == null) {
        return;
      }
      try {
        storage.setItem(storageKey, JSON.stringify(buildEditorDraftSnapshot()));
      } catch (e) {
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
        raw = storage.getItem(storageKey);
      } catch (e) {
        return null;
      }
      if (trim2(raw).length == 0) {
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
        storage.removeItem(storageKey);
      } catch (e) {
      }
    }
    return {
      buildEditorDraftSnapshot,
      clearDraftSaveTimer,
      clearEditorDraft,
      loadEditorDraft,
      saveEditorDraftNow,
      scheduleEditorDraftSave
    };
  }

  // services/libraryGraphCodec.js
  function createLibraryEntry(graph, buildSymbolCell, spec) {
    var root = buildSymbolCell(spec);
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
  function getLibraryEntrySpec(ui, image, normalizeSpec, isElectricalRoot, extractSpec) {
    var xml;
    var cells;
    var i;
    if (image != null && isObject(image.spec)) {
      return normalizeSpec(cloneJson(image.spec));
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
      if (isElectricalRoot(cells[i])) {
        return extractSpec(cells[i]);
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
  function createLibraryStore() {
    var deps = arguments.length > 0 ? arguments[0] : {};
    var state = deps.state;
    function getLibraryEntrySpecCompat(image) {
      return getLibraryEntrySpec(
        deps.ui,
        image,
        deps.normalizeSpec,
        deps.isElectricalRoot,
        deps.extractSpec
      );
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
    return {
      addToLibrary,
      getLibraryEntrySpec: getLibraryEntrySpecCompat,
      isTemplateNameTaken,
      loadStoredLibrary: function(callback, openInSidebar) {
        return loadStoredLibrary(
          deps.ui,
          deps.state,
          deps.libraryTitle,
          callback,
          openInSidebar
        );
      },
      removeTemplateFromLibrary,
      saveLibraryImages: function(images, callback) {
        return saveLibraryImages(
          deps.ui,
          deps.state,
          deps.libraryTitle,
          images,
          callback
        );
      }
    };
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
  function syncBackendState(state, constants, diagramId, version, snapshot, title, normalizeSnapshotGenericIds2, resetPendingChangeRecords, exportDiagramSnapshot) {
    snapshot = normalizeSnapshotGenericIds2(snapshot);
    state.backendDiagramId = trim(diagramId);
    state.backendDiagramTitle = trim(title || state.backendDiagramTitle);
    state.backendDiagramVersion = Math.max(0, toInt(version, 0));
    state.backendLastSnapshot = snapshot != null ? cloneJson(snapshot) : null;
    resetPendingChangeRecords(snapshot != null ? snapshot : exportDiagramSnapshot());
    saveBackendSession(state, constants, normalizeSnapshotGenericIds2);
  }
  function resetBackendBinding(state, constants, normalizeSnapshotGenericIds2, resetPendingChangeRecords, exportDiagramSnapshot) {
    state.backendDiagramId = "";
    state.backendDiagramTitle = "";
    state.backendDiagramVersion = 0;
    state.backendLastSnapshot = null;
    resetPendingChangeRecords(exportDiagramSnapshot());
    saveBackendSession(state, constants, normalizeSnapshotGenericIds2);
  }

  // services/backendRemoteApi.js
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
    snapshot.diagramId = diagramId;
    var snapshotDiff = deps.computeSnapshotChanges(state.backendLastSnapshot, snapshot);
    if (snapshotDiff.changes.length == 0) {
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
        baseVersion: Math.max(0, state.backendDiagramVersion),
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
  function createBackendService() {
    var deps = arguments.length > 0 ? arguments[0] : {};
    return {
      getDiagramHistoryFromBackend: function(diagramId) {
        return getDiagramHistoryFromBackend(
          deps.state,
          function(url) {
            return normalizeBackendBaseUrl(url, deps.constants);
          },
          diagramId
        );
      },
      listDiagramsFromBackend: function() {
        return listDiagramsFromBackend(deps.state, function(url) {
          return normalizeBackendBaseUrl(url, deps.constants);
        });
      },
      loadBackendSession: function() {
        return loadBackendSession(
          deps.state,
          deps.constants,
          deps.normalizeSnapshotGenericIds
        );
      },
      loadDiagramFromBackend: function(diagramId) {
        return loadDiagramFromBackend(deps.state, {
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
        }, diagramId);
      },
      normalizeBackendBaseUrl: function(url) {
        return normalizeBackendBaseUrl(url, deps.constants);
      },
      requestBackendJson,
      resetBackendBinding: function() {
        return resetBackendBinding(
          deps.state,
          deps.constants,
          deps.normalizeSnapshotGenericIds,
          deps.resetPendingChangeRecords,
          deps.exportDiagramSnapshot
        );
      },
      rollbackDiagramToVersion: function(targetVersion) {
        return rollbackDiagramToVersion(deps.state, {
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
        }, targetVersion);
      },
      saveBackendSession: function() {
        return saveBackendSession(
          deps.state,
          deps.constants,
          deps.normalizeSnapshotGenericIds
        );
      },
      saveDiagramToBackend: function(title) {
        return saveDiagramToBackend(deps.state, {
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
        }, title);
      },
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
    };
  }

  // ui/exportSvgDialog.js
  function buildExportDialogDeps() {
    var app = getApp();
    return {
      ctx: app.ctx,
      toInt: app.utils.toInt,
      createButton: app.utils.createButton,
      showStatus: app.showStatus
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

  // ui/frameDialog.js
  function buildFrameDialogDeps() {
    var app = getApp();
    return {
      ctx: app.ctx,
      cloneJson: app.utils.cloneJson,
      normalizeFrameConfig: app.domains.frame.normalizeFrameConfig,
      findDrawingFrame: app.domains.frame.findDrawingFrame,
      getAllDrawingFrames: app.domains.frame.getAllDrawingFrames,
      createButton: app.utils.createButton,
      getFrameGroupId: app.domains.frame.getFrameGroupId,
      generateFrameGroupId: app.helpers.generateFrameGroupId,
      getMaxFramePageNumberInGroup: app.domains.frame.getMaxFramePageNumberInGroup,
      createDrawingFrameCell: app.domains.frame.createDrawingFrameCell,
      getRightmostFrameInGroup: app.domains.frame.getRightmostFrameInGroup,
      addTopLevelCell: app.domains.frame.addTopLevelCell,
      getLeftmostFrame: app.domains.frame.getLeftmostFrame,
      getBottommostFrame: app.domains.frame.getBottommostFrame,
      insertFrame: app.commands.insertFrame,
      showStatus: app.showStatus,
      setCanvasStatus: app.setCanvasStatus
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

  // ui/cabinetDialog.js
  function buildCabinetDialogDeps() {
    var app = getApp();
    return {
      ctx: app.ctx,
      trim: app.utils.trim,
      clamp: app.utils.clamp,
      toInt: app.utils.toInt,
      toFloat: app.utils.toFloat,
      createButton: app.utils.createButton,
      getActiveFrame: app.domains.frame.getActiveFrame,
      getAttr: app.utils.getAttr,
      normalizeCabinetModel: app.domains.cabinet.normalizeCabinetModel,
      generateLogicalCabinetId: app.helpers.generateLogicalCabinetId,
      relayoutCabinetByModel: app.domains.cabinet.relayoutCabinetByModel,
      findCabinetSegments: app.domains.cabinet.findCabinetSegments,
      insertCabinet: app.commands.insertCabinet,
      updateCabinetGap: app.commands.updateCabinetGap,
      showStatus: app.showStatus,
      setCanvasStatus: app.setCanvasStatus,
      findCabinetSegment: app.domains.cabinet.findCabinetSegment,
      extractCabinetModel: app.domains.cabinet.extractCabinetModel
    };
  }
  function createCabinetDialogs() {
    var deps = arguments.length > 0 ? arguments[0] : buildCabinetDialogDeps();
    var ctx = deps.ctx;
    var state = ctx.state;
    var constants = ctx.constants;
    var trim2 = deps.trim;
    function getGapDialogPosition(nativeEvent, width, height) {
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
    function closeGapDialogWindow() {
      if (state.gapDialogWindow != null) {
        var wnd = state.gapDialogWindow;
        state.gapDialogWindow = null;
        wnd.destroy();
      }
    }
    function openInsertCabinetDialog() {
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
      var nameRow = document.createElement("div");
      nameRow.style.display = "grid";
      nameRow.style.gridTemplateColumns = "90px 1fr";
      nameRow.style.alignItems = "center";
      nameRow.style.gap = "8px";
      div.appendChild(nameRow);
      var nameLabel = document.createElement("div");
      nameLabel.innerText = "\u540D\u79F0";
      nameRow.appendChild(nameLabel);
      var nameInput = document.createElement("input");
      nameInput.setAttribute("type", "text");
      nameInput.value = "\u914D\u7535\u67DC";
      nameRow.appendChild(nameInput);
      var configRow = document.createElement("div");
      configRow.style.display = "grid";
      configRow.style.gridTemplateColumns = "90px 120px 90px 120px";
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
      countLabel.innerText = "\u53F3\u4FA7\u7AEF\u5B50\u6570";
      configRow.appendChild(countLabel);
      var countInput = document.createElement("input");
      countInput.setAttribute("type", "number");
      countInput.setAttribute("min", "2");
      countInput.value = String(constants.CABINET_DEFAULT_PORT_COUNT);
      configRow.appendChild(countInput);
      var hint = document.createElement("div");
      hint.style.color = Editor.isDarkMode() ? "#c0c4cc" : "#57606a";
      hint.style.fontSize = "12px";
      hint.innerText = "\u4EC5\u751F\u6210\u4E13\u7528\u914D\u7535\u67DC\u4E3B\u4F53\u548C\u53F3\u4FA7\u8FDE\u63A5\u70B9\uFF0C\u95F4\u8DDD\u540E\u7EED\u901A\u8FC7\u53F3\u4FA7\u70ED\u70B9\u7F16\u8F91\u3002";
      div.appendChild(hint);
      var buttons = document.createElement("div");
      div.appendChild(buttons);
      var wnd = new mxWindow("\u63D2\u5165\u914D\u7535\u67DC", div, 200, 160, 460, 190, true, true);
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
          cabinetWidth: widthInput.value,
          portCount: countInput.value
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
    function openCabinetGapDialog(gapCell, nativeEvent) {
      var segment = deps.findCabinetSegment(gapCell);
      var gapIndex = deps.toInt(deps.getAttr(gapCell, "gapIndex"), -1);
      if (segment == null || gapIndex < 0) {
        return;
      }
      closeGapDialogWindow();
      var cabinetModel = deps.extractCabinetModel(segment);
      var div = document.createElement("div");
      div.style.padding = "12px";
      div.style.display = "flex";
      div.style.flexDirection = "column";
      div.style.gap = "10px";
      div.style.width = "100%";
      div.style.height = "100%";
      div.style.boxSizing = "border-box";
      var label = document.createElement("div");
      label.innerText = "\u8F93\u5165 0 \u5230 1 \u4E4B\u95F4\u7684\u6BD4\u4F8B\u503C";
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
        dialogHeight
      );
      var wnd = new mxWindow(
        "\u8BBE\u7F6E\u7AEF\u5B50\u95F4\u8DDD",
        div,
        dialogPosition.x,
        dialogPosition.y,
        dialogWidth,
        dialogHeight,
        true,
        true
      );
      wnd.destroyOnClose = true;
      wnd.setClosable(true);
      wnd.setMaximizable(false);
      wnd.setResizable(false);
      wnd.setScrollable(false);
      wnd.addListener(mxEvent.DESTROY, function() {
        if (state.gapDialogWindow == wnd) {
          state.gapDialogWindow = null;
        }
      });
      state.gapDialogWindow = wnd;
      var saveButton = deps.createButton("\u4FDD\u5B58", function() {
        var ratio = deps.toFloat(input.value, NaN);
        if (isNaN(ratio) || ratio < 0 || ratio > 1) {
          error.innerText = "\u8BF7\u8F93\u5165 0 \u5230 1 \u4E4B\u95F4\u7684\u6570\u503C";
          return;
        }
        cabinetModel.gapRatios[gapIndex] = ratio;
        try {
          deps.updateCabinetGap(cabinetModel);
        } catch (e) {
          error.innerText = e.message || String(e);
          return;
        }
        wnd.destroy();
      });
      saveButton.style.marginTop = "0";
      buttons.appendChild(saveButton);
      wnd.setVisible(true);
    }
    return {
      closeGapDialogWindow,
      getGapDialogPosition,
      openCabinetGapDialog,
      openInsertCabinetDialog
    };
  }

  // ui/backendDialogs.js
  function buildBackendDialogDeps() {
    var app = getApp();
    return {
      ctx: app.ctx,
      backend: app.services.backend,
      trim: app.utils.trim,
      showStatus: app.showStatus,
      createButton: app.utils.createButton,
      isObject: app.utils.isObject,
      toInt: app.utils.toInt
    };
  }
  function createBackendDialogs() {
    var deps = arguments.length > 0 ? arguments[0] : buildBackendDialogDeps();
    var ctx = deps.ctx;
    var state = ctx.state;
    var trim2 = deps.trim;
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
      if (trim2(state.backendDiagramId).length > 0) {
        try {
          await deps.backend.saveDiagramToBackend(
            state.backendDiagramTitle || "\u672A\u547D\u540D\u56FE\u7EB8"
          );
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
          var titleText = select.options.length > 0 ? trim2(
            select.options[select.selectedIndex].getAttribute("data-title")
          ) || select.options[select.selectedIndex].innerText : "";
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
                  rollbackTargetVersion = Math.max(
                    0,
                    deps.toInt(change.after.version, 0)
                  );
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
    return {
      openBackendLoadDialog,
      openBackendRollbackDialog,
      openBackendSaveDialog
    };
  }

  // ui/createInstanceDialog.js
  function openCreateFromLibraryDialog(deps, preferredSymbolId) {
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

  // ui/templateBrowser.js
  function buildTemplateBrowserDeps() {
    var app = getApp();
    return {
      ctx: app.ctx,
      library: app.services.libraryStore,
      getLibraryEntrySpec: app.services.libraryStore.getLibraryEntrySpec,
      showStatus: app.showStatus,
      normalizePortLayout: app.domains.spec.normalizePortLayout,
      normalizeLabels: app.domains.spec.normalizeLabels,
      trim: app.utils.trim,
      createButton: app.utils.createButton,
      openEditorWithTemplate: function(template) {
        return app.ui != null && typeof app.ui.openEditorWithTemplate === "function" ? app.ui.openEditorWithTemplate(template) : null;
      },
      openCreateFromLibraryDialog: function(preferredSymbolId) {
        return app.ui != null && typeof app.ui.openCreateFromLibraryDialog === "function" ? app.ui.openCreateFromLibraryDialog(preferredSymbolId) : null;
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

  // ui/shared/previewSurface.js
  function clamp2(value, min, max) {
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
    scale = clamp2(scale, 0.35, 2.5);
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
      x: clampToBody ? clamp2(x, 0, 1) : clamp2(x, -1.5, 2.5),
      y: clampToBody ? clamp2(y, 0, 1) : clamp2(y, -1.5, 2.5)
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

  // ui/templateEditor.js
  function buildTemplateEditorDeps() {
    var app = getApp();
    return {
      ctx: app.ctx,
      trim: app.utils.trim,
      cloneJson: app.utils.cloneJson,
      normalizePortLayout: app.domains.spec.normalizePortLayout,
      normalizeLabels: app.domains.spec.normalizeLabels,
      toSvgDataUri: app.domains.spec.toSvgDataUri,
      createButton: app.utils.createButton,
      normalizePortMarker: app.domains.spec.normalizePortMarker,
      normalizePortDirection: app.domains.spec.normalizePortDirection,
      normalizePortIoMode: app.domains.spec.normalizePortIoMode,
      portEdgeSnapThresholdPx: app.constants.PORT_EDGE_SNAP_THRESHOLD_PX,
      nextItemId: app.helpers.nextItemId,
      normalizeLabelItem: app.domains.spec.normalizeLabelItem,
      validateSvg: app.utils.validateSvg,
      extractSvgSize: app.utils.extractSvgSize,
      scheduleEditorDraftSave: app.services.draftStore.scheduleEditorDraftSave,
      clearDraftSaveTimer: app.services.draftStore.clearDraftSaveTimer,
      loadEditorDraft: app.services.draftStore.loadEditorDraft,
      clearEditorDraft: app.services.draftStore.clearEditorDraft,
      generateSymbolId: app.helpers.generateSymbolId,
      getDefaultSchemaFields: app.domains.spec.getDefaultSchemaFields,
      buildSchemaFromFields: app.domains.spec.buildSchemaFromFields,
      hasSchemaPath: app.domains.spec.hasSchemaPath,
      normalizeSchemaField: app.domains.spec.normalizeSchemaField,
      normalizeSchemaType: app.domains.spec.normalizeSchemaType,
      normalizeEnumOptions: app.domains.spec.normalizeEnumOptions,
      isValidFieldPath: app.domains.spec.isValidFieldPath,
      toInt: app.utils.toInt,
      showStatus: app.showStatus,
      normalizeSpec: app.domains.spec.normalizeSpec,
      normalizeVariantLayouts: app.domains.spec.normalizeVariantLayouts,
      flattenSchemaFields: app.domains.spec.flattenSchemaFields,
      isObject: app.utils.isObject,
      addToLibrary: app.services.libraryStore.addToLibrary,
      isTemplateNameTaken: app.services.libraryStore.isTemplateNameTaken,
      loadStoredLibrary: app.services.libraryStore.loadStoredLibrary
    };
  }
  function createTemplateEditor() {
    var deps = arguments.length > 0 ? arguments[0] : buildTemplateEditorDeps();
    var ctx = deps.ctx;
    var state = ctx.state;
    function hasLabelBinding(spec, binding, ignoreId) {
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
      var variantItem = state.previewVariantId != null && state.previewVariantId.length > 0 ? findVariantItem(state.previewVariantId) : null;
      if (variantItem != null && deps.trim(variantItem.svg).length > 0) {
        return "data:image/svg+xml," + encodeURIComponent(variantItem.svg);
      }
      return deps.toSvgDataUri(spec);
    }
    function getPreviewTitle(spec) {
      var variantItem = state.previewVariantId != null && state.previewVariantId.length > 0 ? findVariantItem(state.previewVariantId) : null;
      if (variantItem != null) {
        return deps.trim(variantItem.key).length > 0 ? spec.title + " [" + deps.trim(variantItem.key) + "]" : spec.title + " [\u672A\u547D\u540D\u53D8\u4F53]";
      }
      return spec.title;
    }
    function getEditorSchema() {
      return deps.buildSchemaFromFields(state.schemaFields || []);
    }
    function validateVariantField(showError) {
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
      state.selectedItem = type != null && id != null ? { type, id } : null;
    }
    function deleteSelectedItem() {
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
      return deps.trim(label.binding).length > 0 ? "{{" + label.binding + "}}" : label.text || "\u672A\u7ED1\u5B9A";
    }
    function updatePreview(spec) {
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
      renderInteractivePreviewSurface(
        null,
        {
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
        }
      );
    }
    function bindSvgUpload(input, nameNode, svgKey, nameKey, successMessage, updateSize, onLoaded) {
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
          pathInput.setAttribute(
            "placeholder",
            "\u5B57\u6BB5\u8DEF\u5F84\uFF0C\u5982 name \u6216 device.mode"
          );
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
        state.schemaFields = deps.flattenSchemaFields(spec.schema, "", []).map(
          function(field) {
            return deps.normalizeSchemaField(field);
          }
        );
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
    return {
      createWindow,
      deleteSelectedItem,
      openEditorWithTemplate,
      toggleWindow,
      updatePreview,
      updateSelectedItem
    };
  }

  // ui/instanceEditor.js
  function buildInstanceEditorDeps() {
    var app = getApp();
    return {
      ctx: app.ctx,
      findElectricalRoot: app.helpers.findElectricalRoot,
      showStatus: app.showStatus,
      extractSpec: app.domains.symbol.extractSpec,
      normalizePortLayout: app.domains.spec.normalizePortLayout,
      normalizeLabels: app.domains.spec.normalizeLabels,
      trim: app.utils.trim,
      getValueByPath: app.domains.spec.getValueByPath,
      createButton: app.utils.createButton,
      normalizePortMarker: app.domains.spec.normalizePortMarker,
      normalizePortDirection: app.domains.spec.normalizePortDirection,
      normalizePortIoMode: app.domains.spec.normalizePortIoMode,
      normalizeLabelAlign: app.domains.spec.normalizeLabelAlign,
      toSvgDataUri: app.domains.spec.toSvgDataUri,
      portEdgeSnapThresholdPx: app.constants.PORT_EDGE_SNAP_THRESHOLD_PX,
      normalizePortPoint: app.domains.spec.normalizePortPoint,
      normalizeLabelItem: app.domains.spec.normalizeLabelItem,
      applyInstanceSpec: app.commands.applyInstanceSpec
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

  // runtime/portSwapMode.js
  function buildPortSwapDeps() {
    var app = getApp();
    var ctx = app.ctx;
    return {
      ctx,
      trim: app.utils.trim,
      cloneJson: app.utils.cloneJson,
      parsePortLayout: app.domains.spec.parsePortLayout,
      getAttr: app.utils.getAttr,
      findCabinetSegments: app.domains.cabinet.findCabinetSegments,
      findPortHostRoot: app.helpers.findPortHostRoot,
      isCabinetSegment: app.helpers.isCabinetSegment,
      isMovableConnectedTerminal: app.domains.connectionConstraints.isMovableConnectedTerminal,
      closeGapDialogWindow: function() {
        return app.ui != null && typeof app.ui.closeGapDialogWindow === "function" ? app.ui.closeGapDialogWindow() : null;
      },
      setSelectedCabinetGap: app.domains.cabinet.setSelectedCabinetGap,
      showStatus: app.showStatus,
      setCanvasStatus: app.setCanvasStatus,
      getPortAbsolutePosition: app.domains.cabinet.getPortAbsolutePosition,
      getPortMetaByConstraint: app.domains.connectionConstraints.getPortMetaByConstraint,
      mapPortDirectionToConstraint: app.domains.connectionConstraints.mapPortDirectionToConstraint,
      clearEdgePoints: app.domains.connectionConstraints.clearEdgePoints,
      moveConnectedGroupToCabinetPort: app.domains.connectionConstraints.moveConnectedGroupToCabinetPort,
      setConnectionConstraint: function(edge, root, source, constraint) {
        app.domains.connectionConstraints.applyNativeConnectionConstraint(
          edge,
          root,
          source,
          constraint
        );
      }
    };
  }
  function createPortSwapMode() {
    var deps = arguments.length > 0 ? arguments[0] : buildPortSwapDeps();
    var ctx = deps.ctx;
    var graph = ctx.graph;
    var model = ctx.model;
    var state = ctx.state;
    function clearPortSwapOverlay() {
      if (state.portSwapOverlay != null && state.portSwapOverlay.parentNode != null) {
        state.portSwapOverlay.parentNode.removeChild(state.portSwapOverlay);
      }
      state.portSwapOverlay = null;
    }
    function exitPortSwapMode(clearStatus) {
      clearPortSwapOverlay();
      state.portSwapSession = null;
      if (clearStatus !== false) {
        deps.setCanvasStatus("");
      }
    }
    function buildPortSwapContextFromEdge(edge) {
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
    function renderPortSwapOverlay(session) {
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
          marker.style.position = "absolute";
          marker.style.width = "14px";
          marker.style.height = "14px";
          marker.style.borderRadius = "50%";
          marker.style.boxSizing = "border-box";
          marker.style.border = selected ? "2px solid #1a73e8" : "2px solid #16a34a";
          marker.style.background = selected ? "rgba(26,115,232,0.15)" : "rgba(22,163,74,0.18)";
          marker.style.pointerEvents = "auto";
          marker.style.cursor = selected ? "default" : "pointer";
          marker.style.left = Math.round(stateView.x + ports[j].x * stateView.width - 7) + "px";
          marker.style.top = Math.round(stateView.y + ports[j].y * stateView.height - 7) + "px";
          marker.title = selected ? "\u5F53\u524D\u6302\u70B9" : "\u70B9\u51FB\u5207\u6362\u5230\u8BE5\u6302\u70B9";
          if (!selected) {
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
    function installGraphClickBehavior(extraDeps) {
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
        if (extraDeps.isCabinetGap(cell)) {
          extraDeps.setSelectedCabinetGap(
            deps.getAttr(cell, "logicalCabinetId"),
            deps.getAttr(cell, "gapIndex")
          );
          extraDeps.openCabinetGapDialog(cell, mouseEvent);
          evt.consume();
        } else if (state.selectedCabinetGap != null) {
          extraDeps.closeGapDialogWindow();
          extraDeps.setSelectedCabinetGap(null, null);
        }
      });
    }
    function getNearestCabinetPortFromClick(root, mouseEvent) {
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
      if (state.portSwapSession != null) {
        exitPortSwapMode();
        return;
      }
      deps.closeGapDialogWindow();
      deps.setSelectedCabinetGap(null, null);
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
    return {
      applyEdgePortConstraintMetadata,
      clearPortSwapOverlay,
      commitPortSwap,
      enterPortSwapMode,
      exitPortSwapMode,
      getNearestCabinetPortFromClick,
      installGraphClickBehavior
    };
  }

  // runtime/composeMode.js
  function buildComposeDeps() {
    var app = getApp();
    return {
      ctx: app.ctx,
      trim: app.utils.trim,
      clamp: app.utils.clamp,
      padding: app.constants.INSTANCE_COMPOSE_ZONE_PADDING,
      minWidth: app.constants.INSTANCE_COMPOSE_ZONE_MIN_WIDTH,
      minHeight: app.constants.INSTANCE_COMPOSE_ZONE_MIN_HEIGHT,
      showStatus: app.showStatus,
      setCanvasStatus: app.setCanvasStatus,
      closeGapDialogWindow: function() {
        return app.ui != null && typeof app.ui.closeGapDialogWindow === "function" ? app.ui.closeGapDialogWindow() : null;
      },
      exitPortSwapMode: function(clearStatus) {
        return app.runtime != null && typeof app.runtime.exitPortSwapMode === "function" ? app.runtime.exitPortSwapMode(clearStatus) : null;
      },
      isDrawingFrame: app.helpers.isDrawingFrame,
      isCabinetSegment: app.helpers.isCabinetSegment,
      isCabinetGap: app.helpers.isCabinetGap,
      isPluginInternalCell: app.domains.snapshot.isPluginInternalCell,
      isElectricalRoot: app.helpers.isElectricalRoot,
      shouldExportGenericObject: app.domains.snapshot.shouldExportGenericObject,
      findElectricalRoot: app.helpers.findElectricalRoot
    };
  }
  function createComposeMode() {
    var deps = arguments.length > 0 ? arguments[0] : buildComposeDeps();
    var ctx = deps.ctx;
    var graph = ctx.graph;
    var model = ctx.model;
    var state = ctx.state;
    function isCellDescendantOf(cell, ancestor) {
      while (cell != null) {
        if (cell == ancestor) {
          return true;
        }
        cell = model.getParent(cell);
      }
      return false;
    }
    function getCellViewBounds(cell) {
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
      width = Math.max(
        deps.minWidth,
        bounds.width + deps.padding * 2
      );
      height = Math.max(
        deps.minHeight,
        bounds.height + deps.padding * 2
      );
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
      if (state.instanceComposeOverlay != null && state.instanceComposeOverlay.parentNode != null) {
        state.instanceComposeOverlay.parentNode.removeChild(
          state.instanceComposeOverlay
        );
      }
      state.instanceComposeOverlay = null;
    }
    function completeInstanceComposeMode() {
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
      if (state.instanceComposeSession == null) {
        return;
      }
      renderInstanceComposeOverlay(state.instanceComposeSession);
    }
    function exitInstanceComposeMode(clearStatus) {
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
      var map = {};
      var i;
      for (i = 0; i < cells.length; i++) {
        if (cells[i] != null && deps.trim(cells[i].id).length > 0) {
          map[cells[i].id] = true;
        }
      }
      return map;
    }
    function attachCellsToElectricalRoot(root, cells) {
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
      deps.closeGapDialogWindow();
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
    return {
      collectComposeDragCandidates,
      enterInstanceComposeMode,
      exitInstanceComposeMode,
      isBlockedComposeTarget,
      isLockedComposedChild,
      refreshInstanceComposeOverlay
    };
  }

  // runtime/modelSync.js
  function buildModelSyncDeps() {
    var app = getApp();
    return {
      ctx: app.ctx,
      isObject: app.utils.isObject,
      cloneJson: app.utils.cloneJson,
      exportDiagramSnapshot: app.domains.snapshot.exportDiagramSnapshot,
      computeSnapshotChanges: app.domains.snapshot.computeSnapshotChanges,
      isElectricalRoot: app.helpers.isElectricalRoot,
      refreshRoot: app.domains.symbol.refreshRoot
    };
  }
  function createModelSync() {
    var deps = arguments.length > 0 ? arguments[0] : buildModelSyncDeps();
    var ctx = deps.ctx;
    var model = ctx.model;
    var state = ctx.state;
    function recordCanvasOperation(sender, evt) {
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
    return {
      handleModelChange,
      recordCanvasOperation
    };
  }

  // runtime/canvasFeatures.js
  var ACTION_ITEMS = [
    { resourceKey: "electricalSymbols", actionKey: "electricalSymbols" },
    { resourceKey: "electricalBrowse", actionKey: "electricalBrowse" },
    { resourceKey: "electricalCreate", actionKey: "electricalCreate" },
    {
      resourceKey: "electricalEditInstance",
      actionKey: "electricalEditInstance"
    },
    {
      resourceKey: "electricalComposeInstance",
      actionKey: "electricalComposeInstance"
    },
    {
      resourceKey: "electricalInsertFrame",
      actionKey: "electricalInsertFrame"
    },
    {
      resourceKey: "electricalInsertCabinet",
      actionKey: "electricalInsertCabinet"
    },
    { resourceKey: "electricalClearScreen", actionKey: "electricalClearScreen" },
    {
      resourceKey: "electricalReassignPort",
      actionKey: "electricalReassignPort"
    },
    { resourceKey: "electricalExportSvg", actionKey: "electricalExportSvg" },
    {
      resourceKey: "electricalSaveBackend",
      actionKey: "electricalSaveBackend"
    },
    {
      resourceKey: "electricalNewBackend",
      actionKey: "electricalNewBackend"
    },
    {
      resourceKey: "electricalLoadBackend",
      actionKey: "electricalLoadBackend"
    },
    {
      resourceKey: "electricalRollbackBackend",
      actionKey: "electricalRollbackBackend"
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
    "electricalExportSvg",
    "electricalSaveBackend",
    "electricalNewBackend",
    "electricalLoadBackend",
    "electricalRollbackBackend"
  ];
  function installCanvasFeatures(app) {
    var ctx = app.ctx;
    var graph = ctx.graph;
    var model = ctx.model;
    var state = ctx.state;
    var ui = ctx.ui;
    var actions = app.actions;
    var helpers = app.helpers;
    var runtimeApi = app.runtime;
    var graphIsCellDeletable = graph.isCellDeletable;
    var graphIsCellMovable = graph.isCellMovable;
    var graphIsCellSelectable = graph.isCellSelectable;
    var graphSelectCellForEvent = graph.selectCellForEvent;
    var graphGetMovableCells = graph.getMovableCells;
    var menu = ui.menus.get("extras");
    var oldExtrasMenu = menu.funct;
    graph.isCellDeletable = function(cell) {
      if (helpers.isDrawingFrame(cell)) {
        return !!state.allowProtectedDelete;
      }
      return graphIsCellDeletable.apply(this, arguments);
    };
    graph.isCellMovable = function(cell) {
      if (runtimeApi.isBlockedComposeTarget(cell) || runtimeApi.isLockedComposedChild(cell)) {
        return false;
      }
      return graphIsCellMovable.apply(this, arguments);
    };
    graph.isCellSelectable = function(cell) {
      if (runtimeApi.isBlockedComposeTarget(cell)) {
        return false;
      }
      return graphIsCellSelectable.apply(this, arguments);
    };
    graph.selectCellForEvent = function(cell) {
      if (runtimeApi.isBlockedComposeTarget(cell)) {
        return;
      }
      return graphSelectCellForEvent.apply(this, arguments);
    };
    graph.getMovableCells = function(cells) {
      var result = graphGetMovableCells.apply(this, arguments) || [];
      var filtered = [];
      var i;
      for (i = 0; i < result.length; i++) {
        if (!runtimeApi.isBlockedComposeTarget(result[i])) {
          filtered.push(result[i]);
        }
      }
      return filtered;
    };
    ui.actions.addAction("electricalSymbols", actions.electricalSymbols);
    ui.actions.addAction("electricalBrowse", actions.electricalBrowse);
    ui.actions.addAction("electricalCreate", actions.electricalCreate);
    ui.actions.addAction("electricalEditInstance", actions.electricalEditInstance);
    ui.actions.addAction(
      "electricalComposeInstance",
      actions.electricalComposeInstance
    );
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
        if (runtimeApi.isBlockedComposeTarget(eventCell)) {
          runtimeApi.refreshInstanceComposeOverlay();
          return;
        }
        session.dragCandidates = runtimeApi.collectComposeDragCandidates(
          session.root,
          eventCell
        );
        if (session.dragCandidates.length == 0) {
          runtimeApi.refreshInstanceComposeOverlay();
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
          runtimeApi.refreshInstanceComposeOverlay();
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
        runtimeApi.refreshInstanceComposeOverlay();
      }
    });
    mxEvent.addListener(
      graph.container,
      "scroll",
      runtimeApi.refreshInstanceComposeOverlay
    );
    graph.view.addListener(mxEvent.SCALE, runtimeApi.refreshInstanceComposeOverlay);
    graph.view.addListener(
      mxEvent.SCALE_AND_TRANSLATE,
      runtimeApi.refreshInstanceComposeOverlay
    );
    graph.view.addListener(
      mxEvent.TRANSLATE,
      runtimeApi.refreshInstanceComposeOverlay
    );
    state.lastOperationSnapshot = app.domains.snapshot.exportDiagramSnapshot();
    model.addListener(mxEvent.CHANGE, runtimeApi.recordCanvasOperation);
    model.addListener(mxEvent.CHANGE, runtimeApi.handleModelChange);
  }

  // ui/topActionBar.js
  function installTopActionBar(options) {
    var ui = options.ui;
    var createButton = options.createButton;
    var items = options.items || [];
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
    items.forEach(function(item) {
      var button = createButton(mxResources.get(item.resourceKey), function() {
        ui.actions.get(item.actionKey).funct();
      });
      button.style.marginTop = "0";
      button.style.marginRight = "0";
      button.style.padding = "6px 16px";
      bar.appendChild(button);
    });
    ui.menubarContainer.appendChild(bar);
  }

  // bootstrap/createApp.js
  function createDomains(app) {
    var ctx = app.ctx;
    var constants = app.constants;
    var utils = app.utils;
    var helpers = app.helpers;
    var domains = {};
    domains.spec = createSpecDomain({
      trim: utils.trim,
      isObject: utils.isObject,
      cloneJson: utils.cloneJson,
      validateSvg: app.utils.validateSvg,
      generateSymbolId: helpers.generateSymbolId,
      clamp: utils.clamp,
      toInt: utils.toInt,
      toFloat: utils.toFloat,
      nextItemId: helpers.nextItemId,
      normalizeMode: helpers.normalizeMode,
      deepMerge: utils.deepMerge,
      generateInstanceId: helpers.generateInstanceId
    });
    domains.symbol = createSymbolDomain({
      model: ctx.model,
      ROOT_TAG: constants.ROOT_TAG,
      ROOT_TYPE: constants.ROOT_TYPE,
      BODY_TAG: constants.BODY_TAG,
      BODY_KIND: constants.BODY_KIND,
      LABEL_TAG: constants.LABEL_TAG,
      LABEL_KIND: constants.LABEL_KIND,
      trim: utils.trim,
      isObject: utils.isObject,
      normalizeMode: helpers.normalizeMode,
      normalizeSpec: domains.spec.normalizeSpec,
      normalizePortLayout: domains.spec.normalizePortLayout,
      normalizeLabels: domains.spec.normalizeLabels,
      parsePortLayout: domains.spec.parsePortLayout,
      getAttr: utils.getAttr,
      createNode: utils.createNode,
      createMetaCell: utils.createMetaCell,
      cloneValue: utils.cloneValue,
      toStyleImageUri: domains.spec.toStyleImageUri,
      serializePortLayout: domains.spec.serializePortLayout,
      buildPortLayout: domains.spec.buildPortLayout,
      buildResolvedLabels: domains.spec.buildResolvedLabels
    });
    domains.frame = createFrameDomain({
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
      trim: utils.trim,
      toInt: utils.toInt,
      isObject: utils.isObject,
      getAttr: utils.getAttr,
      createNode: utils.createNode,
      createMetaCell: utils.createMetaCell,
      generateFrameId: helpers.generateFrameId,
      isDrawingFrame: helpers.isDrawingFrame,
      showStatus: app.showStatus,
      setCanvasStatus: app.setCanvasStatus
    });
    domains.connectionConstraints = createConnectionConstraints({
      ctx,
      trim: utils.trim,
      clamp: utils.clamp,
      parsePortLayout: domains.spec.parsePortLayout,
      getAttr: utils.getAttr,
      buildPortLayout: domains.spec.buildPortLayout,
      findPortHostRoot: helpers.findPortHostRoot,
      normalizePortDirection: domains.spec.normalizePortDirection,
      normalizePortIoMode: domains.spec.normalizePortIoMode,
      isDrawingFrame: helpers.isDrawingFrame,
      isCabinetSegment: helpers.isCabinetSegment,
      isCabinetGap: helpers.isCabinetGap,
      findDrawingFrame: domains.frame.findDrawingFrame,
      getCellAbsoluteGeometry: function(cell) {
        return domains.cabinet.getCellAbsoluteGeometry(cell);
      },
      getPortAbsolutePosition: function(root, port) {
        return domains.cabinet.getPortAbsolutePosition(root, port);
      }
    });
    domains.cabinet = createCabinetDomain({
      model: ctx.model,
      state: ctx.state,
      cabinetTag: constants.CABINET_TAG,
      cabinetType: constants.CABINET_TYPE,
      cabinetBodyTag: constants.CABINET_BODY_TAG,
      cabinetBodyKind: constants.CABINET_BODY_KIND,
      cabinetGapTag: constants.CABINET_GAP_TAG,
      cabinetGapType: constants.CABINET_GAP_TYPE,
      cabinetGapKind: constants.CABINET_GAP_KIND,
      frameLabelKind: constants.FRAME_LABEL_KIND,
      frameContentRatio: constants.FRAME_CONTENT_RATIO,
      frameMarginRatio: constants.FRAME_MARGIN_RATIO,
      frameHorizontalGap: constants.FRAME_HORIZONTAL_GAP,
      minPortFollowSpaceRatio: constants.CABINET_MIN_PORT_FOLLOW_SPACE_RATIO,
      defaultWidth: constants.CABINET_DEFAULT_WIDTH,
      defaultPortCount: constants.CABINET_DEFAULT_PORT_COUNT,
      defaultX: constants.CABINET_DEFAULT_X,
      tailPadding: constants.CABINET_TAIL_PADDING,
      trim: utils.trim,
      toInt: utils.toInt,
      toFloat: utils.toFloat,
      clamp: utils.clamp,
      isObject: utils.isObject,
      cloneJson: utils.cloneJson,
      normalizePortPoint: domains.spec.normalizePortPoint,
      generateLogicalCabinetId: helpers.generateLogicalCabinetId,
      createNode: utils.createNode,
      createMetaCell: utils.createMetaCell,
      serializePortLayout: domains.spec.serializePortLayout,
      getAttr: utils.getAttr,
      isCabinetSegment: helpers.isCabinetSegment,
      isCabinetGap: helpers.isCabinetGap,
      getNormalizedFrameConfig: domains.frame.normalizeFrameConfig,
      getAllDrawingFrames: domains.frame.getAllDrawingFrames,
      getFrameConfig: domains.frame.getFrameConfig,
      getFrameGroupId: domains.frame.getFrameGroupId,
      getFramePageNumber: domains.frame.getFramePageNumber,
      getMaxFramePageNumberInGroup: domains.frame.getMaxFramePageNumberInGroup,
      getRightmostFrameInGroup: domains.frame.getRightmostFrameInGroup,
      findFrameById: domains.frame.findFrameById,
      findDrawingFrame: domains.frame.findDrawingFrame,
      createDrawingFrameCell: domains.frame.createDrawingFrameCell,
      addTopLevelCell: domains.frame.addTopLevelCell,
      getEdgePortId: function(edge, root, source) {
        return domains.snapshot.getEdgePortId(edge, root, source);
      },
      getPortMetaById: domains.connectionConstraints.getPortMetaById,
      parsePortLayout: domains.spec.parsePortLayout,
      isMovableConnectedTerminal: domains.connectionConstraints.isMovableConnectedTerminal,
      moveCellToFrameByDelta: domains.connectionConstraints.moveCellToFrameByDelta,
      setConnectionConstraint: function(edge, root, source, constraint) {
        ctx.graph.setConnectionConstraint(edge, root, source, constraint);
      }
    });
    domains.snapshot = createSnapshotDomain({
      graph: ctx.graph,
      model: ctx.model,
      state: ctx.state,
      ui: ctx.ui,
      BODY_KIND: constants.BODY_KIND,
      LABEL_KIND: constants.LABEL_KIND,
      FRAME_LABEL_KIND: constants.FRAME_LABEL_KIND,
      CABINET_BODY_KIND: constants.CABINET_BODY_KIND,
      CABINET_GAP_KIND: constants.CABINET_GAP_KIND,
      FRAME_MARGIN_RATIO: constants.FRAME_MARGIN_RATIO,
      trim: utils.trim,
      toInt: utils.toInt,
      isObject: utils.isObject,
      cloneJson: utils.cloneJson,
      createNode: utils.createNode,
      getAttr: utils.getAttr,
      uniqueStrings: utils.uniqueStrings,
      isCabinetGap: helpers.isCabinetGap,
      isDrawingFrame: helpers.isDrawingFrame,
      isCabinetSegment: helpers.isCabinetSegment,
      isElectricalRoot: helpers.isElectricalRoot,
      extractSpec: domains.symbol.extractSpec,
      getFrameConfig: domains.frame.getFrameConfig,
      getFramePageNumber: domains.frame.getFramePageNumber,
      getFrameGroupId: domains.frame.getFrameGroupId,
      findFrameById: domains.frame.findFrameById,
      extractCabinetModel: domains.cabinet.extractCabinetModel,
      findCabinetSegments: domains.cabinet.findCabinetSegments,
      getPortMetaById: domains.connectionConstraints.getPortMetaById,
      findDrawingFrame: domains.frame.findDrawingFrame,
      findPortHostRoot: helpers.findPortHostRoot,
      parsePortLayout: domains.spec.parsePortLayout,
      getAllDrawingFrames: domains.frame.getAllDrawingFrames,
      exitInstanceComposeMode: function(clearStatus) {
        return app.runtime != null && typeof app.runtime.exitInstanceComposeMode === "function" ? app.runtime.exitInstanceComposeMode(clearStatus) : null;
      },
      closeGapDialogWindow: function() {
        return app.ui != null && typeof app.ui.closeGapDialogWindow === "function" ? app.ui.closeGapDialogWindow() : null;
      },
      setSelectedCabinetGap: function(logicalCabinetId, gapIndex) {
        return domains.cabinet.setSelectedCabinetGap(logicalCabinetId, gapIndex);
      },
      exitPortSwapMode: function(clearStatus) {
        return app.runtime != null && typeof app.runtime.exitPortSwapMode === "function" ? app.runtime.exitPortSwapMode(clearStatus) : null;
      },
      createDrawingFrameCell: domains.frame.createDrawingFrameCell,
      addTopLevelCell: domains.frame.addTopLevelCell,
      relayoutCabinetByModel: domains.cabinet.relayoutCabinetByModel,
      normalizeSpec: domains.spec.normalizeSpec,
      buildSymbolCell: domains.symbol.buildSymbolCell,
      resetPendingChangeRecords: helpers.resetPendingChangeRecords
    });
    return domains;
  }
  function createServices(app) {
    var ctx = app.ctx;
    var constants = app.constants;
    var utils = app.utils;
    var domains = app.domains;
    var helpers = app.helpers;
    return {
      draftStore: createDraftStore({
        state: ctx.state,
        storageKey: constants.TEMPLATE_DRAFT_STORAGE_KEY,
        trim: utils.trim,
        cloneJson: utils.cloneJson
      }),
      libraryStore: createLibraryStore({
        ui: ctx.ui,
        graph: ctx.graph,
        state: ctx.state,
        libraryTitle: constants.LIBRARY_TITLE,
        trim: utils.trim,
        isObject: utils.isObject,
        cloneJson: utils.cloneJson,
        normalizeSpec: domains.spec.normalizeSpec,
        isElectricalRoot: helpers.isElectricalRoot,
        extractSpec: domains.symbol.extractSpec,
        buildSymbolCell: domains.symbol.buildSymbolCell,
        showStatus: app.showStatus
      }),
      backend: createBackendService({
        state: ctx.state,
        constants,
        trim: utils.trim,
        toInt: utils.toInt,
        cloneJson: utils.cloneJson,
        isObject: utils.isObject,
        normalizeSnapshotGenericIds: domains.snapshot.normalizeSnapshotGenericIds,
        exportDiagramSnapshot: domains.snapshot.exportDiagramSnapshot,
        resetPendingChangeRecords: helpers.resetPendingChangeRecords,
        computeSnapshotChanges: domains.snapshot.computeSnapshotChanges,
        collectChangeObjectIds: domains.snapshot.collectChangeObjectIds,
        uniqueStrings: utils.uniqueStrings,
        showStatus: app.showStatus,
        restoreDiagramSnapshot: domains.snapshot.restoreDiagramSnapshot
      })
    };
  }
  function createUi(app) {
    var utils = app.utils;
    var helpers = app.helpers;
    var spec = app.domains.spec;
    var symbol = app.domains.symbol;
    var frame = app.domains.frame;
    var cabinet = app.domains.cabinet;
    var library = app.services.libraryStore;
    var draftStore = app.services.draftStore;
    var backend = app.services.backend;
    var constants = app.constants;
    var uiApi = {};
    var cabinetDialogs = createCabinetDialogs();
    uiApi.closeGapDialogWindow = cabinetDialogs.closeGapDialogWindow;
    uiApi.openInsertCabinetDialog = cabinetDialogs.openInsertCabinetDialog;
    uiApi.openCabinetGapDialog = cabinetDialogs.openCabinetGapDialog;
    uiApi.openInsertFrameDialog = function() {
      return openInsertFrameDialog();
    };
    uiApi.openSvgExportDialog = function() {
      return openSvgExportDialog();
    };
    uiApi.openCreateFromLibraryDialog = function(preferredSymbolId) {
      return openCreateFromLibraryDialog(
        {
          library,
          trim: utils.trim,
          getLibraryEntrySpec: library.getLibraryEntrySpec,
          showStatus: app.showStatus,
          flattenSchemaFields: spec.flattenSchemaFields,
          normalizeSchemaType: spec.normalizeSchemaType,
          toFloat: utils.toFloat,
          setValueByPath: spec.setValueByPath,
          buildInstanceSpec: spec.buildInstanceSpec,
          createButton: utils.createButton,
          insertIntoGraph: app.commands.insertIntoGraph
        },
        preferredSymbolId
      );
    };
    uiApi.openTemplateBrowserDialog = function() {
      return openTemplateBrowserDialog();
    };
    var templateEditorUi = createTemplateEditor();
    uiApi.updateSelectedItem = templateEditorUi.updateSelectedItem;
    uiApi.updatePreview = templateEditorUi.updatePreview;
    uiApi.createWindow = templateEditorUi.createWindow;
    uiApi.toggleWindow = templateEditorUi.toggleWindow;
    uiApi.openEditorWithTemplate = templateEditorUi.openEditorWithTemplate;
    uiApi.openEditInstanceDialog = function() {
      return openEditInstanceDialog();
    };
    var backendDialogs = createBackendDialogs();
    uiApi.openBackendSaveDialog = backendDialogs.openBackendSaveDialog;
    uiApi.openBackendLoadDialog = backendDialogs.openBackendLoadDialog;
    uiApi.openBackendRollbackDialog = backendDialogs.openBackendRollbackDialog;
    return uiApi;
  }
  function createRuntime(app) {
    var runtimeApi = {};
    var portSwapMode = createPortSwapMode();
    runtimeApi.applyEdgePortConstraintMetadata = portSwapMode.applyEdgePortConstraintMetadata;
    runtimeApi.clearPortSwapOverlay = portSwapMode.clearPortSwapOverlay;
    runtimeApi.commitPortSwap = portSwapMode.commitPortSwap;
    runtimeApi.enterPortSwapMode = portSwapMode.enterPortSwapMode;
    runtimeApi.exitPortSwapMode = portSwapMode.exitPortSwapMode;
    runtimeApi.getNearestCabinetPortFromClick = portSwapMode.getNearestCabinetPortFromClick;
    var composeMode = createComposeMode();
    runtimeApi.collectComposeDragCandidates = composeMode.collectComposeDragCandidates;
    runtimeApi.enterInstanceComposeMode = composeMode.enterInstanceComposeMode;
    runtimeApi.exitInstanceComposeMode = composeMode.exitInstanceComposeMode;
    runtimeApi.isBlockedComposeTarget = composeMode.isBlockedComposeTarget;
    runtimeApi.isLockedComposedChild = composeMode.isLockedComposedChild;
    runtimeApi.refreshInstanceComposeOverlay = composeMode.refreshInstanceComposeOverlay;
    var modelSync = createModelSync();
    runtimeApi.recordCanvasOperation = modelSync.recordCanvasOperation;
    runtimeApi.handleModelChange = modelSync.handleModelChange;
    function activateRuntime() {
      portSwapMode.installGraphClickBehavior({
        isCabinetGap: app.helpers.isCabinetGap,
        openCabinetGapDialog: function() {
          var currentApp2 = getApp();
          if (currentApp2.ui == null || typeof currentApp2.ui.openCabinetGapDialog !== "function") {
            return null;
          }
          return currentApp2.ui.openCabinetGapDialog.apply(
            null,
            Array.prototype.slice.call(arguments)
          );
        },
        closeGapDialogWindow: function() {
          var currentApp2 = getApp();
          return currentApp2.ui != null && typeof currentApp2.ui.closeGapDialogWindow === "function" ? currentApp2.ui.closeGapDialogWindow() : null;
        },
        setSelectedCabinetGap: app.domains.cabinet.setSelectedCabinetGap
      });
      app.domains.connectionConstraints.installGraphBehavior({
        applyEdgePortConstraintMetadata: runtimeApi.applyEdgePortConstraintMetadata,
        setCanvasStatus: app.setCanvasStatus
      });
      installCanvasFeatures(app);
      installTopActionBar({
        ui: app.ctx.ui,
        createButton: app.utils.createButton,
        items: ACTION_ITEMS
      });
      app.ctx.ui.addListener("languageChanged", function() {
        installTopActionBar({
          ui: app.ctx.ui,
          createButton: app.utils.createButton,
          items: ACTION_ITEMS
        });
      });
      app.ctx.ui.addListener("currentThemeChanged", function() {
        installTopActionBar({
          ui: app.ctx.ui,
          createButton: app.utils.createButton,
          items: ACTION_ITEMS
        });
      });
    }
    return {
      activateRuntime,
      runtimeApi
    };
  }
  function createApp(ctx) {
    var constants = ctx.constants;
    var app = {
      ctx,
      constants,
      appContext: createAppContext(ctx),
      graphApi: createGraphApi(ctx),
      runtime: null,
      ui: null
    };
    app.utils = {
      clamp,
      cloneJson,
      createBaseUtils,
      createButton: createPluginButton,
      createMetaCell,
      createNode,
      createXmlUtils,
      deepMerge,
      extractSvgSize: function(svg) {
        return extractSvgSize(svg, toFloat, trim);
      },
      generateUuid,
      getAttr,
      isObject,
      normalizeSvg: function(svg) {
        return validateSvg(svg, trim);
      },
      stripFileExtension,
      toFloat,
      toInt,
      toSlug,
      trim,
      uniqueStrings,
      cloneValue: function(node) {
        return cloneValue(node, constants.ROOT_TAG);
      },
      validateSvg: function(svg) {
        return validateSvg(svg, trim);
      }
    };
    app.helpers = createRuntimeHelpers({
      ctx,
      constants,
      trim,
      cloneJson,
      getAttr,
      toSlug,
      stripFileExtension,
      generateUuid,
      shouldExportGenericObject: function(cell) {
        return app.domains != null && app.domains.snapshot != null && typeof app.domains.snapshot.shouldExportGenericObject === "function" && app.domains.snapshot.shouldExportGenericObject(cell);
      }
    });
    app.showStatus = app.helpers.showStatus;
    app.setCanvasStatus = app.helpers.setCanvasStatus;
    setApp(app);
    app.selection = selectionApi;
    app.commands = commandApi;
    app.actions = createActionApi();
    app.domains = createDomains(app);
    app.services = createServices(app);
    app.ui = createUi(app);
    var runtime = createRuntime(app);
    app.runtime = runtime.runtimeApi;
    app.activateRuntime = runtime.activateRuntime;
    return app;
  }

  // bootstrap/installElectricalSymbols.js
  function installElectricalSymbols(ctx) {
    var app = createApp(ctx);
    setApp(app);
    app.services.backend.loadBackendSession();
    app.activateRuntime();
  }

  // index.js
  Draw.loadPlugin(function(ui) {
    var ctx = createPluginContext(ui);
    registerElectricalResources();
    installElectricalSymbols(ctx);
  });
})();
