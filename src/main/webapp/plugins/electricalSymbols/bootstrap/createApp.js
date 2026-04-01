/**
 * 应用装配入口。
 * 这里负责创建 ctx 之上的稳定 app 对象，把 domain/services/runtime/ui 需要的共享能力组织起来。
 */
import {
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
} from "../utils/base.js";
import {
  cloneValue,
  createMetaCell,
  createNode,
  extractSvgSize,
  getAttr,
  validateSvg,
} from "../utils/xml.js";
import { createAppContext } from "../core/appContext.js";
import { getApp, setApp } from "../core/appRuntime.js";
import { createGraphApi } from "../core/graphApi.js";
import { isCabinetGap, setCanvasStatus, showStatus } from "../core/runtimeHelpers.js";
import { createPluginButton } from "../ui/shared/buttonFactory.js";
import { commandApi } from "../application/commands.js";
import { specDomainApi } from "../domain/spec.js";
import { createSymbolDomain } from "../domain/symbol.js";
import { createFrameDomain } from "../domain/frame.js";
import { createCabinetDomain } from "../domain/cabinet.js";
import { createSnapshotDomain } from "../domain/snapshot.js";
import { connectionConstraintsApi } from "../runtime/connectionConstraints.js";
import { libraryStoreApi } from "../services/libraryStore.js";
import { openSvgExportDialog } from "../ui/exportSvgDialog.js";
import { openInsertFrameDialog } from "../ui/frameDialog.js";
import { cabinetDialogsApi } from "../ui/cabinetDialog.js";
import { backendDialogsApi } from "../ui/backendDialogs.js";
import { openCreateFromLibraryDialog } from "../ui/createInstanceDialog.js";
import { openTemplateBrowserDialog } from "../ui/templateBrowser.js";
import { templateEditorApi } from "../ui/templateEditor.js";
import { openEditInstanceDialog } from "../ui/instanceEditor.js";
import { portSwapModeApi } from "../runtime/portSwapMode.js";
import { composeModeApi } from "../runtime/composeMode.js";
import { modelSyncApi } from "../runtime/modelSync.js";
import {
  ACTION_ITEMS,
  installCanvasFeatures,
} from "../runtime/canvasFeatures.js";
import { installTopActionBar } from "../ui/topActionBar.js";

function createDomains(app) {
  var domains = app.domains != null ? app.domains : {};
  app.domains = domains;

  domains.spec = specDomainApi;
  domains.connectionConstraints = connectionConstraintsApi;
  domains.symbol = createSymbolDomain();
  domains.frame = createFrameDomain();
  domains.cabinet = createCabinetDomain();
  domains.snapshot = createSnapshotDomain();

  return domains;
}

function createUi(app) {
  var spec = app.domains.spec;
  var library = libraryStoreApi;
  var uiApi = {};

  var cabinetDialogs = cabinetDialogsApi;
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
        trim,
        getLibraryEntrySpec: library.getLibraryEntrySpec,
        showStatus,
        flattenSchemaFields: spec.flattenSchemaFields,
        normalizeSchemaType: spec.normalizeSchemaType,
        toFloat,
        setValueByPath: spec.setValueByPath,
        buildInstanceSpec: spec.buildInstanceSpec,
        createButton: createPluginButton,
        insertIntoGraph: commandApi.insertIntoGraph,
      },
      preferredSymbolId,
    );
  };

  uiApi.openTemplateBrowserDialog = function () {
    return openTemplateBrowserDialog();
  };

  var templateEditorUi = templateEditorApi;
  uiApi.updateSelectedItem = templateEditorUi.updateSelectedItem;
  uiApi.updatePreview = templateEditorUi.updatePreview;
  uiApi.createWindow = templateEditorUi.createWindow;
  uiApi.toggleWindow = templateEditorUi.toggleWindow;
  uiApi.openEditorWithTemplate = templateEditorUi.openEditorWithTemplate;

  uiApi.openEditInstanceDialog = function () {
    return openEditInstanceDialog();
  };

  var backendDialogs = backendDialogsApi;
  uiApi.openBackendSaveDialog = backendDialogs.openBackendSaveDialog;
  uiApi.openBackendLoadDialog = backendDialogs.openBackendLoadDialog;
  uiApi.openBackendRollbackDialog = backendDialogs.openBackendRollbackDialog;

  return uiApi;
}

function createRuntime(app) {
  var runtimeApi = {};

  var portSwapMode = portSwapModeApi;
  runtimeApi.applyEdgePortConstraintMetadata =
    portSwapMode.applyEdgePortConstraintMetadata;
  runtimeApi.clearPortSwapOverlay = portSwapMode.clearPortSwapOverlay;
  runtimeApi.commitPortSwap = portSwapMode.commitPortSwap;
  runtimeApi.enterPortSwapMode = portSwapMode.enterPortSwapMode;
  runtimeApi.exitPortSwapMode = portSwapMode.exitPortSwapMode;
  runtimeApi.getNearestCabinetPortFromClick =
    portSwapMode.getNearestCabinetPortFromClick;

  var composeMode = composeModeApi;
  runtimeApi.collectComposeDragCandidates =
    composeMode.collectComposeDragCandidates;
  runtimeApi.enterInstanceComposeMode = composeMode.enterInstanceComposeMode;
  runtimeApi.exitInstanceComposeMode = composeMode.exitInstanceComposeMode;
  runtimeApi.isBlockedComposeTarget = composeMode.isBlockedComposeTarget;
  runtimeApi.isLockedComposedChild = composeMode.isLockedComposedChild;
  runtimeApi.refreshInstanceComposeOverlay =
    composeMode.refreshInstanceComposeOverlay;

  var modelSync = modelSyncApi;
  runtimeApi.recordCanvasOperation = modelSync.recordCanvasOperation;
  runtimeApi.handleModelChange = modelSync.handleModelChange;

  function activateRuntime() {
    portSwapMode.installGraphClickBehavior({
      isCabinetGap,
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
      applyEdgePortConstraintMetadata:
        runtimeApi.applyEdgePortConstraintMetadata,
      setCanvasStatus,
    });

    installCanvasFeatures(app);
    installTopActionBar({
      ui: app.ctx.ui,
      createButton: createPluginButton,
      items: ACTION_ITEMS,
    });
    app.ctx.ui.addListener("languageChanged", function () {
      installTopActionBar({
        ui: app.ctx.ui,
        createButton: createPluginButton,
        items: ACTION_ITEMS,
      });
    });
    app.ctx.ui.addListener("currentThemeChanged", function () {
      installTopActionBar({
        ui: app.ctx.ui,
        createButton: createPluginButton,
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

  setApp(app);

  app.domains = createDomains(app);
  app.ui = createUi(app);
  var runtime = createRuntime(app);
  app.runtime = runtime.runtimeApi;
  app.activateRuntime = runtime.activateRuntime;

  return app;
}
