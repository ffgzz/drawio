/**
 * 应用装配入口。
 * 这里负责创建 ctx 之上的稳定 app 对象，把 domain/services/runtime/ui 需要的共享能力组织起来。
 */
import {
  clamp,
  cloneJson,
  createBaseUtils,
  deepMerge,
  generateUuid,
  isObject,
  stripFileExtension,
  toFloat,
  toInt,
  toSlug,
  trim,
  uniqueStrings,
} from "../utils/base.js";
import {
  cloneValue,
  createMetaCell,
  createNode,
  createXmlUtils,
  extractSvgSize,
  getAttr,
  validateSvg,
} from "../utils/xml.js";
import { createAppContext } from "../core/appContext.js";
import { getApp, setApp } from "../core/appRuntime.js";
import { createGraphApi } from "../core/graphApi.js";
import { createRuntimeHelpers } from "../core/runtimeHelpers.js";
import { createPluginButton } from "../ui/shared/buttonFactory.js";
import { selectionApi } from "../application/selection.js";
import { commandApi } from "../application/commands.js";
import { createActionApi } from "../application/actions.js";
import { createSpecDomain } from "../domain/spec.js";
import { createSymbolDomain } from "../domain/symbol.js";
import { createFrameDomain } from "../domain/frame.js";
import { createCabinetDomain } from "../domain/cabinet.js";
import { createSnapshotDomain } from "../domain/snapshot.js";
import { createConnectionConstraints } from "../runtime/connectionConstraints.js";
import { createDraftStore } from "../services/draftStore.js";
import { createLibraryStore } from "../services/libraryStore.js";
import { createBackendService } from "../services/backend.js";
import { openSvgExportDialog } from "../ui/exportSvgDialog.js";
import { openInsertFrameDialog } from "../ui/frameDialog.js";
import { createCabinetDialogs } from "../ui/cabinetDialog.js";
import { createBackendDialogs } from "../ui/backendDialogs.js";
import { openCreateFromLibraryDialog } from "../ui/createInstanceDialog.js";
import { openTemplateBrowserDialog } from "../ui/templateBrowser.js";
import { createTemplateEditor } from "../ui/templateEditor.js";
import { openEditInstanceDialog } from "../ui/instanceEditor.js";
import { createPortSwapMode } from "../runtime/portSwapMode.js";
import { createComposeMode } from "../runtime/composeMode.js";
import { createModelSync } from "../runtime/modelSync.js";
import { ACTION_ITEMS, installCanvasFeatures } from "../runtime/canvasFeatures.js";
import { installTopActionBar } from "../ui/topActionBar.js";

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
    generateInstanceId: helpers.generateInstanceId,
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
    buildResolvedLabels: domains.spec.buildResolvedLabels,
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
    setCanvasStatus: app.setCanvasStatus,
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
    getCellAbsoluteGeometry: function (cell) {
      return domains.cabinet.getCellAbsoluteGeometry(cell);
    },
    getPortAbsolutePosition: function (root, port) {
      return domains.cabinet.getPortAbsolutePosition(root, port);
    },
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
    getMaxFramePageNumberInGroup:
      domains.frame.getMaxFramePageNumberInGroup,
    getRightmostFrameInGroup: domains.frame.getRightmostFrameInGroup,
    findFrameById: domains.frame.findFrameById,
    findDrawingFrame: domains.frame.findDrawingFrame,
    createDrawingFrameCell: domains.frame.createDrawingFrameCell,
    addTopLevelCell: domains.frame.addTopLevelCell,
    getEdgePortId: function (edge, root, source) {
      return domains.snapshot.getEdgePortId(edge, root, source);
    },
    getPortMetaById: domains.connectionConstraints.getPortMetaById,
    parsePortLayout: domains.spec.parsePortLayout,
    isMovableConnectedTerminal:
      domains.connectionConstraints.isMovableConnectedTerminal,
    moveCellToFrameByDelta:
      domains.connectionConstraints.moveCellToFrameByDelta,
    setConnectionConstraint: function (edge, root, source, constraint) {
      ctx.graph.setConnectionConstraint(edge, root, source, constraint);
    },
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
    exitInstanceComposeMode: function (clearStatus) {
      return app.runtime != null &&
        typeof app.runtime.exitInstanceComposeMode === "function"
        ? app.runtime.exitInstanceComposeMode(clearStatus)
        : null;
    },
    closeGapDialogWindow: function () {
      return app.ui != null && typeof app.ui.closeGapDialogWindow === "function"
        ? app.ui.closeGapDialogWindow()
        : null;
    },
    setSelectedCabinetGap: function (logicalCabinetId, gapIndex) {
      return domains.cabinet.setSelectedCabinetGap(logicalCabinetId, gapIndex);
    },
    exitPortSwapMode: function (clearStatus) {
      return app.runtime != null &&
        typeof app.runtime.exitPortSwapMode === "function"
        ? app.runtime.exitPortSwapMode(clearStatus)
        : null;
    },
    createDrawingFrameCell: domains.frame.createDrawingFrameCell,
    addTopLevelCell: domains.frame.addTopLevelCell,
    relayoutCabinetByModel: domains.cabinet.relayoutCabinetByModel,
    normalizeSpec: domains.spec.normalizeSpec,
    buildSymbolCell: domains.symbol.buildSymbolCell,
    resetPendingChangeRecords: helpers.resetPendingChangeRecords,
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
      cloneJson: utils.cloneJson,
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
      showStatus: app.showStatus,
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
      restoreDiagramSnapshot: domains.snapshot.restoreDiagramSnapshot,
    }),
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

  uiApi.openInsertFrameDialog = function () {
    return openInsertFrameDialog();
  };

  uiApi.openSvgExportDialog = function () {
    return openSvgExportDialog();
  };

  uiApi.openCreateFromLibraryDialog = function (preferredSymbolId) {
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
        insertIntoGraph: app.commands.insertIntoGraph,
      },
      preferredSymbolId,
    );
  };

  uiApi.openTemplateBrowserDialog = function () {
    return openTemplateBrowserDialog();
  };

  var templateEditorUi = createTemplateEditor();
  uiApi.updateSelectedItem = templateEditorUi.updateSelectedItem;
  uiApi.updatePreview = templateEditorUi.updatePreview;
  uiApi.createWindow = templateEditorUi.createWindow;
  uiApi.toggleWindow = templateEditorUi.toggleWindow;
  uiApi.openEditorWithTemplate = templateEditorUi.openEditorWithTemplate;

  uiApi.openEditInstanceDialog = function () {
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
  runtimeApi.applyEdgePortConstraintMetadata =
    portSwapMode.applyEdgePortConstraintMetadata;
  runtimeApi.clearPortSwapOverlay = portSwapMode.clearPortSwapOverlay;
  runtimeApi.commitPortSwap = portSwapMode.commitPortSwap;
  runtimeApi.enterPortSwapMode = portSwapMode.enterPortSwapMode;
  runtimeApi.exitPortSwapMode = portSwapMode.exitPortSwapMode;
  runtimeApi.getNearestCabinetPortFromClick =
    portSwapMode.getNearestCabinetPortFromClick;

  var composeMode = createComposeMode();
  runtimeApi.collectComposeDragCandidates =
    composeMode.collectComposeDragCandidates;
  runtimeApi.enterInstanceComposeMode = composeMode.enterInstanceComposeMode;
  runtimeApi.exitInstanceComposeMode = composeMode.exitInstanceComposeMode;
  runtimeApi.isBlockedComposeTarget = composeMode.isBlockedComposeTarget;
  runtimeApi.isLockedComposedChild = composeMode.isLockedComposedChild;
  runtimeApi.refreshInstanceComposeOverlay =
    composeMode.refreshInstanceComposeOverlay;

  var modelSync = createModelSync();
  runtimeApi.recordCanvasOperation = modelSync.recordCanvasOperation;
  runtimeApi.handleModelChange = modelSync.handleModelChange;

  function activateRuntime() {
    portSwapMode.installGraphClickBehavior({
      isCabinetGap: app.helpers.isCabinetGap,
      openCabinetGapDialog: function () {
        var currentApp = getApp();

        if (
          currentApp.ui == null ||
          typeof currentApp.ui.openCabinetGapDialog !== "function"
        ) {
          return null;
        }

        return currentApp.ui.openCabinetGapDialog.apply(
          null,
          Array.prototype.slice.call(arguments),
        );
      },
      closeGapDialogWindow: function () {
        var currentApp = getApp();
        return currentApp.ui != null &&
          typeof currentApp.ui.closeGapDialogWindow === "function"
          ? currentApp.ui.closeGapDialogWindow()
          : null;
      },
      setSelectedCabinetGap: app.domains.cabinet.setSelectedCabinetGap,
    });

    app.domains.connectionConstraints.installGraphBehavior({
      applyEdgePortConstraintMetadata: runtimeApi.applyEdgePortConstraintMetadata,
      setCanvasStatus: app.setCanvasStatus,
    });

    installCanvasFeatures(app);
    installTopActionBar({
      ui: app.ctx.ui,
      createButton: app.utils.createButton,
      items: ACTION_ITEMS,
    });
    app.ctx.ui.addListener("languageChanged", function () {
      installTopActionBar({
        ui: app.ctx.ui,
        createButton: app.utils.createButton,
        items: ACTION_ITEMS,
      });
    });
    app.ctx.ui.addListener("currentThemeChanged", function () {
      installTopActionBar({
        ui: app.ctx.ui,
        createButton: app.utils.createButton,
        items: ACTION_ITEMS,
      });
    });
  }

  return {
    activateRuntime,
    runtimeApi,
  };
}

export function createApp(ctx) {
  var constants = ctx.constants;
  var app = {
    ctx,
    constants,
    appContext: createAppContext(ctx),
    graphApi: createGraphApi(ctx),
    runtime: null,
    ui: null,
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
    extractSvgSize: function (svg) {
      return extractSvgSize(svg, toFloat, trim);
    },
    generateUuid,
    getAttr,
    isObject,
    normalizeSvg: function (svg) {
      return validateSvg(svg, trim);
    },
    stripFileExtension,
    toFloat,
    toInt,
    toSlug,
    trim,
    uniqueStrings,
    cloneValue: function (node) {
      return cloneValue(node, constants.ROOT_TAG);
    },
    validateSvg: function (svg) {
      return validateSvg(svg, trim);
    },
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
    shouldExportGenericObject: function (cell) {
      return (
        app.domains != null &&
        app.domains.snapshot != null &&
        typeof app.domains.snapshot.shouldExportGenericObject === "function" &&
        app.domains.snapshot.shouldExportGenericObject(cell)
      );
    },
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
