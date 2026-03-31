/**
 * UI 和 runtime 装配层。
 * 这个文件把窗口、动作、graph hook 和运行模式组合起来，对外只暴露安装结果。
 */
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

// 这里把“面向用户的 UI 能力”和“面向图编辑器的运行时能力”分开装配。
export function createUiRuntime(bundle) {
  var ctx = bundle.ctx;
  var constants = bundle.constants;
  var uiApi = bundle.ui;
  var runtimeApi = bundle.runtime;

  // 配电柜相关对话框由独立 UI 模块管理。
  var cabinetDialogs = createCabinetDialogs({
    ctx,
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

  // 图框插入对话框只做 UI，真正的图框创建仍走 domain 层。
  uiApi.openInsertFrameDialog = function () {
    return showInsertFrameDialog({
      ctx,
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

  // SVG 导出仍保持为独立对话框，避免和其它窗口状态耦合。
  uiApi.openSvgExportDialog = function () {
    return showSvgExportDialog({
      ctx,
      toInt: bundle.toInt,
      createButton: bundle.createButton,
      showStatus: bundle.showStatus,
    });
  };

  // 从图库创建实例时，只通过注入的纯依赖与业务层交互。
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

  // 模板浏览器负责查看、编辑和从模板创建实例。
  uiApi.openTemplateBrowserDialog = function () {
    return showTemplateBrowserDialog({
      ctx,
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

  // 模板编辑器是主窗口，也是状态最复杂的 UI 模块。
  var templateEditorUi = createTemplateEditorUi({
    ctx,
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

  // 实例编辑器只面向当前选中的 root，不直接操作全局模板状态。
  uiApi.openEditInstanceDialog = function () {
    return showInstanceEditorDialog({
      ctx,
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

  // 画布动作封装了插入、刷新、清屏这三类“用户动作 -> graph 写操作”。
  var canvasActions = createCanvasActions({
    ctx,
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

  // 后端相关对话框统一托管到一个 UI 模块，避免重复表单逻辑。
  var backendDialogs = createBackendDialogs({
    ctx,
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

  // 更换挂点模式是一个独立的运行态，需要维护 overlay 和点击行为。
  var portSwapMode = createPortSwapMode({
    ctx,
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

  // 连接约束 hook 要在挂点模式之后安装，确保元数据写回逻辑已准备好。
  bundle.connectionConstraints.installGraphBehavior({
    applyEdgePortConstraintMetadata:
      runtimeApi.applyEdgePortConstraintMetadata,
    setCanvasStatus: bundle.setCanvasStatus,
  });

  // 组合模式负责 overlay、拖拽候选过滤和最终挂接。
  var composeMode = createComposeMode({
    ctx,
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

  // modelSync 用于监听模型变化并维护快照差异记录。
  var modelSync = createModelSync({
    ctx,
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
      // 所有 action 注册、菜单注入、graph hook 都在这里统一挂到 draw.io 上。
      installCanvasFeatures({
        ctx,
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
