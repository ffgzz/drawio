import {
  createCanvasActions,
  installCanvasFeatures,
} from "../runtime/canvasFeatures.js";
import { createModelSync } from "../runtime/modelSync.js";
import { createPortSwapMode } from "../runtime/portSwapMode.js";
import { createComposeMode } from "../runtime/composeMode.js";
import { openSvgExportDialog as showSvgExportDialog } from "../ui/exportSvgDialog.js";
import { openInsertFrameDialog as showInsertFrameDialog } from "../ui/frameDialog.js";
import { createCabinetDialogs } from "../ui/cabinetDialog.js";
import { createBackendDialogs } from "../ui/backendDialogs.js";
import { openCreateFromLibraryDialog as showCreateInstanceDialog } from "../ui/createInstanceDialog.js";
import { openTemplateBrowserDialog as showTemplateBrowserDialog } from "../ui/templateBrowser.js";
import { createTemplateEditor as createTemplateEditorUi } from "../ui/templateEditor.js";
import { openEditInstanceDialog as showInstanceEditorDialog } from "../ui/instanceEditor.js";

export function createUiRuntime(bundle) {
  var ctx = bundle.ctx;
  var constants = bundle.constants;
  var uiApi = bundle.ui;
  var runtimeApi = bundle.runtime;

  var cabinetDialogs = createCabinetDialogs({
    ctx: ctx,
    trim: bundle.trim,
    clamp: bundle.clamp,
    toInt: bundle.toInt,
    toFloat: bundle.toFloat,
    createButton: bundle.createButton,
    getActiveFrame: bundle.getActiveFrame,
    getAttr: bundle.getAttr,
    normalizeCabinetModel: bundle.normalizeCabinetModel,
    generateLogicalCabinetId: bundle.generateLogicalCabinetId,
    relayoutCabinetByModel: bundle.relayoutCabinetByModel,
    findCabinetSegments: bundle.findCabinetSegments,
    showStatus: bundle.showStatus,
    setCanvasStatus: bundle.setCanvasStatus,
    findCabinetSegment: bundle.findCabinetSegment,
    extractCabinetModel: bundle.extractCabinetModel,
  });
  uiApi.closeGapDialogWindow = cabinetDialogs.closeGapDialogWindow;
  uiApi.openInsertCabinetDialog = cabinetDialogs.openInsertCabinetDialog;
  uiApi.openCabinetGapDialog = cabinetDialogs.openCabinetGapDialog;

  uiApi.openInsertFrameDialog = function () {
    return showInsertFrameDialog({
      ctx: ctx,
      cloneJson: bundle.cloneJson,
      normalizeFrameConfig: bundle.normalizeFrameConfig,
      findDrawingFrame: bundle.findDrawingFrame,
      getAllDrawingFrames: bundle.getAllDrawingFrames,
      createButton: bundle.createButton,
      getFrameGroupId: bundle.getFrameGroupId,
      generateFrameGroupId: bundle.generateFrameGroupId,
      getMaxFramePageNumberInGroup: bundle.getMaxFramePageNumberInGroup,
      createDrawingFrameCell: bundle.createDrawingFrameCell,
      getRightmostFrameInGroup: bundle.getRightmostFrameInGroup,
      addTopLevelCell: bundle.addTopLevelCell,
      getLeftmostFrame: bundle.getLeftmostFrame,
      getBottommostFrame: bundle.getBottommostFrame,
      showStatus: bundle.showStatus,
      setCanvasStatus: bundle.setCanvasStatus,
    });
  };

  uiApi.openSvgExportDialog = function () {
    return showSvgExportDialog({
      ctx: ctx,
      toInt: bundle.toInt,
      createButton: bundle.createButton,
      showStatus: bundle.showStatus,
    });
  };

  uiApi.openCreateFromLibraryDialog = function (preferredSymbolId) {
    return showCreateInstanceDialog(
      {
        library: bundle.libraryStore,
        trim: bundle.trim,
        getLibraryEntrySpec: bundle.libraryStore.getLibraryEntrySpec,
        showStatus: bundle.showStatus,
        flattenSchemaFields: bundle.flattenSchemaFields,
        normalizeSchemaType: bundle.normalizeSchemaType,
        toFloat: bundle.toFloat,
        setValueByPath: bundle.setValueByPath,
        buildInstanceSpec: bundle.buildInstanceSpec,
        createButton: bundle.createButton,
        insertIntoGraph: function (spec) {
          return uiApi.insertIntoGraph(spec);
        },
      },
      preferredSymbolId,
    );
  };

  uiApi.openTemplateBrowserDialog = function () {
    return showTemplateBrowserDialog({
      ctx: ctx,
      library: bundle.libraryStore,
      getLibraryEntrySpec: bundle.libraryStore.getLibraryEntrySpec,
      showStatus: bundle.showStatus,
      normalizePortLayout: bundle.normalizePortLayout,
      normalizeLabels: bundle.normalizeLabels,
      trim: bundle.trim,
      createButton: bundle.createButton,
      openEditorWithTemplate: function (template) {
        return uiApi.openEditorWithTemplate(template);
      },
      openCreateFromLibraryDialog: function (preferredSymbolId) {
        return uiApi.openCreateFromLibraryDialog(preferredSymbolId);
      },
    });
  };

  var templateEditorUi = createTemplateEditorUi({
    ctx: ctx,
    trim: bundle.trim,
    cloneJson: bundle.cloneJson,
    normalizePortLayout: bundle.normalizePortLayout,
    normalizeLabels: bundle.normalizeLabels,
    toSvgDataUri: bundle.toSvgDataUri,
    createButton: bundle.createButton,
    normalizePortMarker: bundle.normalizePortMarker,
    normalizePortDirection: bundle.normalizePortDirection,
    normalizePortIoMode: bundle.normalizePortIoMode,
    portEdgeSnapThresholdPx: constants.PORT_EDGE_SNAP_THRESHOLD_PX,
    nextItemId: bundle.nextItemId,
    normalizeLabelItem: bundle.normalizeLabelItem,
    validateSvg: bundle.validateSvg,
    extractSvgSize: bundle.extractSvgSize,
    scheduleEditorDraftSave: bundle.scheduleEditorDraftSave,
    clearDraftSaveTimer: bundle.clearDraftSaveTimer,
    loadEditorDraft: bundle.loadEditorDraft,
    clearEditorDraft: bundle.clearEditorDraft,
    generateSymbolId: bundle.generateSymbolId,
    getDefaultSchemaFields: bundle.getDefaultSchemaFields,
    buildSchemaFromFields: bundle.buildSchemaFromFields,
    hasSchemaPath: bundle.hasSchemaPath,
    normalizeSchemaField: bundle.normalizeSchemaField,
    normalizeSchemaType: bundle.normalizeSchemaType,
    normalizeEnumOptions: bundle.normalizeEnumOptions,
    isValidFieldPath: bundle.isValidFieldPath,
    toInt: bundle.toInt,
    showStatus: bundle.showStatus,
    normalizeSpec: bundle.normalizeSpec,
    normalizeVariantLayouts: bundle.normalizeVariantLayouts,
    flattenSchemaFields: bundle.flattenSchemaFields,
    isObject: bundle.isObject,
    addToLibrary: bundle.addToLibrary,
    isTemplateNameTaken: bundle.libraryStore.isTemplateNameTaken,
    loadStoredLibrary: bundle.loadStoredLibrary,
  });
  uiApi.updateSelectedItem = templateEditorUi.updateSelectedItem;
  uiApi.updatePreview = templateEditorUi.updatePreview;
  uiApi.createWindow = templateEditorUi.createWindow;
  uiApi.toggleWindow = templateEditorUi.toggleWindow;
  uiApi.openEditorWithTemplate = templateEditorUi.openEditorWithTemplate;

  uiApi.openEditInstanceDialog = function () {
    return showInstanceEditorDialog({
      ctx: ctx,
      findElectricalRoot: bundle.findElectricalRoot,
      showStatus: bundle.showStatus,
      extractSpec: bundle.extractSpec,
      normalizePortLayout: bundle.normalizePortLayout,
      normalizeLabels: bundle.normalizeLabels,
      trim: bundle.trim,
      getValueByPath: bundle.getValueByPath,
      createButton: bundle.createButton,
      normalizePortMarker: bundle.normalizePortMarker,
      normalizePortDirection: bundle.normalizePortDirection,
      normalizePortIoMode: bundle.normalizePortIoMode,
      normalizeLabelAlign: bundle.normalizeLabelAlign,
      toSvgDataUri: bundle.toSvgDataUri,
      portEdgeSnapThresholdPx: constants.PORT_EDGE_SNAP_THRESHOLD_PX,
      normalizePortPoint: bundle.normalizePortPoint,
      normalizeLabelItem: bundle.normalizeLabelItem,
      syncRoot: bundle.syncRoot,
    });
  };

  var canvasActions = createCanvasActions({
    ctx: ctx,
    getFrameChildInsertPoint: bundle.getFrameChildInsertPoint,
    buildSymbolCell: bundle.buildSymbolCell,
    getActiveFrame: bundle.getActiveFrame,
    showStatus: bundle.showStatus,
    setCanvasStatus: bundle.setCanvasStatus,
    findElectricalRoot: bundle.findElectricalRoot,
    findCabinetSegment: bundle.findCabinetSegment,
    relayoutCabinetByModel: bundle.relayoutCabinetByModel,
    extractCabinetModel: bundle.extractCabinetModel,
    refreshRoot: bundle.refreshRoot,
    closeGapDialogWindow: function () {
      if (typeof uiApi.closeGapDialogWindow === "function") {
        return uiApi.closeGapDialogWindow.apply(null, arguments);
      }

      return null;
    },
    setSelectedCabinetGap: function (logicalCabinetId, gapIndex) {
      return bundle.setSelectedCabinetGap(logicalCabinetId, gapIndex);
    },
    exitPortSwapMode: function (clearStatus) {
      if (typeof runtimeApi.exitPortSwapMode === "function") {
        return runtimeApi.exitPortSwapMode(clearStatus);
      }

      return null;
    },
    exitInstanceComposeMode: function (clearStatus) {
      if (typeof runtimeApi.exitInstanceComposeMode === "function") {
        return runtimeApi.exitInstanceComposeMode(clearStatus);
      }

      return null;
    },
  });
  uiApi.clearCurrentPage = canvasActions.clearCurrentPage;
  uiApi.insertIntoGraph = canvasActions.insertIntoGraph;
  uiApi.refreshSelection = canvasActions.refreshSelection;

  var backendDialogs = createBackendDialogs({
    ctx: ctx,
    backend: bundle.backendService,
    trim: bundle.trim,
    showStatus: bundle.showStatus,
    createButton: bundle.createButton,
    isObject: bundle.isObject,
    toInt: bundle.toInt,
  });
  uiApi.openBackendSaveDialog = backendDialogs.openBackendSaveDialog;
  uiApi.openBackendLoadDialog = backendDialogs.openBackendLoadDialog;
  uiApi.openBackendRollbackDialog = backendDialogs.openBackendRollbackDialog;

  var portSwapMode = createPortSwapMode({
    ctx: ctx,
    trim: bundle.trim,
    cloneJson: bundle.cloneJson,
    parsePortLayout: bundle.parsePortLayout,
    getAttr: bundle.getAttr,
    findCabinetSegments: bundle.findCabinetSegments,
    findPortHostRoot: bundle.findPortHostRoot,
    isCabinetSegment: bundle.isCabinetSegment,
    isMovableConnectedTerminal: bundle.isMovableConnectedTerminal,
    closeGapDialogWindow: function () {
      if (typeof uiApi.closeGapDialogWindow === "function") {
        return uiApi.closeGapDialogWindow.apply(null, arguments);
      }

      return null;
    },
    setSelectedCabinetGap: bundle.setSelectedCabinetGap,
    showStatus: bundle.showStatus,
    setCanvasStatus: bundle.setCanvasStatus,
    getPortAbsolutePosition: bundle.getPortAbsolutePosition,
    getPortMetaByConstraint: bundle.getPortMetaByConstraint,
    mapPortDirectionToConstraint: bundle.mapPortDirectionToConstraint,
    clearEdgePoints: bundle.clearEdgePoints,
    moveConnectedGroupToCabinetPort: bundle.moveConnectedGroupToCabinetPort,
    setConnectionConstraint: function (edge, root, source, constraint) {
      bundle.connectionConstraints.applyNativeConnectionConstraint(
        edge,
        root,
        source,
        constraint,
      );
    },
  });
  runtimeApi.exitPortSwapMode = portSwapMode.exitPortSwapMode;
  runtimeApi.applyEdgePortConstraintMetadata =
    portSwapMode.applyEdgePortConstraintMetadata;
  runtimeApi.enterPortSwapMode = portSwapMode.enterPortSwapMode;
  portSwapMode.installGraphClickBehavior({
    isCabinetGap: bundle.isCabinetGap,
    openCabinetGapDialog: uiApi.openCabinetGapDialog,
    closeGapDialogWindow: uiApi.closeGapDialogWindow,
    setSelectedCabinetGap: bundle.setSelectedCabinetGap,
  });

  bundle.connectionConstraints.installGraphBehavior({
    applyEdgePortConstraintMetadata:
      runtimeApi.applyEdgePortConstraintMetadata,
    setCanvasStatus: bundle.setCanvasStatus,
  });

  var composeMode = createComposeMode({
    ctx: ctx,
    trim: bundle.trim,
    clamp: bundle.clamp,
    padding: constants.INSTANCE_COMPOSE_ZONE_PADDING,
    minWidth: constants.INSTANCE_COMPOSE_ZONE_MIN_WIDTH,
    minHeight: constants.INSTANCE_COMPOSE_ZONE_MIN_HEIGHT,
    showStatus: bundle.showStatus,
    setCanvasStatus: bundle.setCanvasStatus,
    closeGapDialogWindow: function () {
      if (typeof uiApi.closeGapDialogWindow === "function") {
        return uiApi.closeGapDialogWindow.apply(null, arguments);
      }

      return null;
    },
    exitPortSwapMode: function (clearStatus) {
      if (typeof runtimeApi.exitPortSwapMode === "function") {
        return runtimeApi.exitPortSwapMode(clearStatus);
      }

      return null;
    },
    isDrawingFrame: bundle.isDrawingFrame,
    isCabinetSegment: bundle.isCabinetSegment,
    isCabinetGap: bundle.isCabinetGap,
    isPluginInternalCell: bundle.isPluginInternalCell,
    isElectricalRoot: bundle.isElectricalRoot,
    shouldExportGenericObject: bundle.shouldExportGenericObject,
    findElectricalRoot: bundle.findElectricalRoot,
  });
  runtimeApi.refreshInstanceComposeOverlay =
    composeMode.refreshInstanceComposeOverlay;
  runtimeApi.exitInstanceComposeMode = composeMode.exitInstanceComposeMode;
  runtimeApi.isBlockedComposeTarget = composeMode.isBlockedComposeTarget;
  runtimeApi.isLockedComposedChild = composeMode.isLockedComposedChild;
  runtimeApi.collectComposeDragCandidates =
    composeMode.collectComposeDragCandidates;
  runtimeApi.enterInstanceComposeMode = composeMode.enterInstanceComposeMode;

  var modelSync = createModelSync({
    ctx: ctx,
    isObject: bundle.isObject,
    cloneJson: bundle.cloneJson,
    exportDiagramSnapshot: bundle.exportDiagramSnapshot,
    computeSnapshotChanges: bundle.computeSnapshotChanges,
    isElectricalRoot: bundle.isElectricalRoot,
    refreshRoot: bundle.refreshRoot,
  });
  runtimeApi.recordCanvasOperation = modelSync.recordCanvasOperation;
  runtimeApi.handleModelChange = modelSync.handleModelChange;

  return {
    installCanvas: function () {
      installCanvasFeatures({
        ctx: ctx,
        createButton: bundle.createButton,
        toggleWindow: uiApi.toggleWindow,
        openTemplateBrowserDialog: uiApi.openTemplateBrowserDialog,
        openCreateFromLibraryDialog: uiApi.openCreateFromLibraryDialog,
        openEditInstanceDialog: uiApi.openEditInstanceDialog,
        enterInstanceComposeMode: runtimeApi.enterInstanceComposeMode,
        openInsertFrameDialog: uiApi.openInsertFrameDialog,
        openInsertCabinetDialog: uiApi.openInsertCabinetDialog,
        enterPortSwapMode: runtimeApi.enterPortSwapMode,
        refreshSelection: uiApi.refreshSelection,
        openSvgExportDialog: uiApi.openSvgExportDialog,
        openBackendSaveDialog: uiApi.openBackendSaveDialog,
        resetBackendBinding: bundle.resetBackendBinding,
        openBackendLoadDialog: uiApi.openBackendLoadDialog,
        openBackendRollbackDialog: uiApi.openBackendRollbackDialog,
        clearCurrentPage: uiApi.clearCurrentPage,
        showStatus: bundle.showStatus,
        setCanvasStatus: bundle.setCanvasStatus,
        isDrawingFrame: bundle.isDrawingFrame,
        isBlockedComposeTarget: runtimeApi.isBlockedComposeTarget,
        isLockedComposedChild: runtimeApi.isLockedComposedChild,
        refreshInstanceComposeOverlay: runtimeApi.refreshInstanceComposeOverlay,
        collectComposeDragCandidates: runtimeApi.collectComposeDragCandidates,
        exportDiagramSnapshot: bundle.exportDiagramSnapshot,
        recordCanvasOperation: runtimeApi.recordCanvasOperation,
        handleModelChange: runtimeApi.handleModelChange,
      });
    },
  };
}
