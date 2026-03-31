/**
 * UI 注册器。
 * 负责创建所有窗口/对话框入口，并返回一份纯 UI API，具体桥接动作交给 wireApp。
 */
import { openSvgExportDialog } from "../ui/exportSvgDialog.js";
import { openInsertFrameDialog } from "../ui/frameDialog.js";
import { createCabinetDialogs } from "../ui/cabinetDialog.js";
import { createBackendDialogs } from "../ui/backendDialogs.js";
import { openCreateFromLibraryDialog } from "../ui/createInstanceDialog.js";
import { openTemplateBrowserDialog } from "../ui/templateBrowser.js";
import { createTemplateEditor } from "../ui/templateEditor.js";
import { openEditInstanceDialog } from "../ui/instanceEditor.js";

export function createUiRegistry(app) {
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

  var cabinetDialogs = createCabinetDialogs({
    ctx: app.ctx,
    trim: utils.trim,
    clamp: utils.clamp,
    toInt: utils.toInt,
    toFloat: utils.toFloat,
    createButton: utils.createButton,
    getActiveFrame: frame.getActiveFrame,
    getAttr: utils.getAttr,
    normalizeCabinetModel: cabinet.normalizeCabinetModel,
    generateLogicalCabinetId: helpers.generateLogicalCabinetId,
    relayoutCabinetByModel: cabinet.relayoutCabinetByModel,
    findCabinetSegments: cabinet.findCabinetSegments,
    insertCabinet: app.commands.insertCabinet,
    updateCabinetGap: app.commands.updateCabinetGap,
    showStatus: app.showStatus,
    setCanvasStatus: app.setCanvasStatus,
    findCabinetSegment: cabinet.findCabinetSegment,
    extractCabinetModel: cabinet.extractCabinetModel,
  });
  uiApi.closeGapDialogWindow = cabinetDialogs.closeGapDialogWindow;
  uiApi.openInsertCabinetDialog = cabinetDialogs.openInsertCabinetDialog;
  uiApi.openCabinetGapDialog = cabinetDialogs.openCabinetGapDialog;

  uiApi.openInsertFrameDialog = function () {
    return openInsertFrameDialog({
      ctx: app.ctx,
      cloneJson: utils.cloneJson,
      normalizeFrameConfig: frame.normalizeFrameConfig,
      findDrawingFrame: frame.findDrawingFrame,
      getAllDrawingFrames: frame.getAllDrawingFrames,
      createButton: utils.createButton,
      getFrameGroupId: frame.getFrameGroupId,
      generateFrameGroupId: helpers.generateFrameGroupId,
      getMaxFramePageNumberInGroup: frame.getMaxFramePageNumberInGroup,
      createDrawingFrameCell: frame.createDrawingFrameCell,
      getRightmostFrameInGroup: frame.getRightmostFrameInGroup,
      addTopLevelCell: frame.addTopLevelCell,
      getLeftmostFrame: frame.getLeftmostFrame,
      getBottommostFrame: frame.getBottommostFrame,
      insertFrame: app.commands.insertFrame,
      showStatus: app.showStatus,
      setCanvasStatus: app.setCanvasStatus,
    });
  };

  uiApi.openSvgExportDialog = function () {
    return openSvgExportDialog({
      ctx: app.ctx,
      toInt: utils.toInt,
      createButton: utils.createButton,
      showStatus: app.showStatus,
    });
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
    return openTemplateBrowserDialog({
      ctx: app.ctx,
      library,
      getLibraryEntrySpec: library.getLibraryEntrySpec,
      showStatus: app.showStatus,
      normalizePortLayout: spec.normalizePortLayout,
      normalizeLabels: spec.normalizeLabels,
      trim: utils.trim,
      createButton: utils.createButton,
      openEditorWithTemplate: function (template) {
        return uiApi.openEditorWithTemplate(template);
      },
      openCreateFromLibraryDialog: function (preferredSymbolId) {
        return uiApi.openCreateFromLibraryDialog(preferredSymbolId);
      },
    });
  };

  var templateEditorUi = createTemplateEditor({
    ctx: app.ctx,
    trim: utils.trim,
    cloneJson: utils.cloneJson,
    normalizePortLayout: spec.normalizePortLayout,
    normalizeLabels: spec.normalizeLabels,
    toSvgDataUri: spec.toSvgDataUri,
    createButton: utils.createButton,
    normalizePortMarker: spec.normalizePortMarker,
    normalizePortDirection: spec.normalizePortDirection,
    normalizePortIoMode: spec.normalizePortIoMode,
    portEdgeSnapThresholdPx: constants.PORT_EDGE_SNAP_THRESHOLD_PX,
    nextItemId: helpers.nextItemId,
    normalizeLabelItem: spec.normalizeLabelItem,
    validateSvg: app.utils.validateSvg,
    extractSvgSize: app.utils.extractSvgSize,
    scheduleEditorDraftSave: draftStore.scheduleEditorDraftSave,
    clearDraftSaveTimer: draftStore.clearDraftSaveTimer,
    loadEditorDraft: draftStore.loadEditorDraft,
    clearEditorDraft: draftStore.clearEditorDraft,
    generateSymbolId: helpers.generateSymbolId,
    getDefaultSchemaFields: spec.getDefaultSchemaFields,
    buildSchemaFromFields: spec.buildSchemaFromFields,
    hasSchemaPath: spec.hasSchemaPath,
    normalizeSchemaField: spec.normalizeSchemaField,
    normalizeSchemaType: spec.normalizeSchemaType,
    normalizeEnumOptions: spec.normalizeEnumOptions,
    isValidFieldPath: spec.isValidFieldPath,
    toInt: utils.toInt,
    showStatus: app.showStatus,
    normalizeSpec: spec.normalizeSpec,
    normalizeVariantLayouts: spec.normalizeVariantLayouts,
    flattenSchemaFields: spec.flattenSchemaFields,
    isObject: utils.isObject,
    addToLibrary: library.addToLibrary,
    isTemplateNameTaken: library.isTemplateNameTaken,
    loadStoredLibrary: library.loadStoredLibrary,
  });
  uiApi.updateSelectedItem = templateEditorUi.updateSelectedItem;
  uiApi.updatePreview = templateEditorUi.updatePreview;
  uiApi.createWindow = templateEditorUi.createWindow;
  uiApi.toggleWindow = templateEditorUi.toggleWindow;
  uiApi.openEditorWithTemplate = templateEditorUi.openEditorWithTemplate;

  uiApi.openEditInstanceDialog = function () {
    return openEditInstanceDialog({
      ctx: app.ctx,
      findElectricalRoot: helpers.findElectricalRoot,
      showStatus: app.showStatus,
      extractSpec: symbol.extractSpec,
      normalizePortLayout: spec.normalizePortLayout,
      normalizeLabels: spec.normalizeLabels,
      trim: utils.trim,
      getValueByPath: spec.getValueByPath,
      createButton: utils.createButton,
      normalizePortMarker: spec.normalizePortMarker,
      normalizePortDirection: spec.normalizePortDirection,
      normalizePortIoMode: spec.normalizePortIoMode,
      normalizeLabelAlign: spec.normalizeLabelAlign,
      toSvgDataUri: spec.toSvgDataUri,
      portEdgeSnapThresholdPx: constants.PORT_EDGE_SNAP_THRESHOLD_PX,
      normalizePortPoint: spec.normalizePortPoint,
      normalizeLabelItem: spec.normalizeLabelItem,
      applyInstanceSpec: app.commands.applyInstanceSpec,
    });
  };

  var backendDialogs = createBackendDialogs({
    ctx: app.ctx,
    backend,
    trim: utils.trim,
    showStatus: app.showStatus,
    createButton: utils.createButton,
    isObject: utils.isObject,
    toInt: utils.toInt,
  });
  uiApi.openBackendSaveDialog = backendDialogs.openBackendSaveDialog;
  uiApi.openBackendLoadDialog = backendDialogs.openBackendLoadDialog;
  uiApi.openBackendRollbackDialog = backendDialogs.openBackendRollbackDialog;

  return uiApi;
}
