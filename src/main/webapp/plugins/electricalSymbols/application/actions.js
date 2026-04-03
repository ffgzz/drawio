/**
 * 应用动作层。
 * 这里定义稳定的用户动作接口，画布 action、顶部按钮和 UI 事件都只调用这里。
 */
import { getApp } from "../core/appRuntime.js";
import { showStatus } from "../core/runtimeHelpers.js";
import { commandApi } from "./commands.js";
import { backendServiceApi } from "../services/backend.js";
import { backendDialogsApi } from "../ui/backendDialogs.js";
import { cabinetDialogsApi } from "../ui/cabinetDialog.js";
import { openCreateFromLibraryDialog } from "../ui/createInstanceDialog.js";
import { openExportDialog } from "../ui/exportDialog.js";
import { openSvgExportDialog } from "../ui/exportSvgDialog.js";
import { openInsertFrameDialog } from "../ui/frameDialog.js";
import { openEditInstanceDialog } from "../ui/instanceEditor.js";
import { templateEditorApi } from "../ui/templateEditor.js";
import { openTemplateBrowserDialog } from "../ui/templateBrowser.js";
import { composeModeApi } from "../runtime/composeMode.js";
import { portSwapModeApi } from "../runtime/portSwapMode.js";

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

export var actionApi = {
  electricalBrowse: function () {
    return execute(openTemplateBrowserDialog);
  },
  electricalClearScreen: function () {
    return execute(commandApi.clearCurrentPage, true);
  },
  electricalComposeInstance: function () {
    return execute(composeModeApi.enterInstanceComposeMode);
  },
  electricalCreate: function () {
    return execute(openCreateFromLibraryDialog);
  },
  electricalEditInstance: function () {
    return execute(openEditInstanceDialog);
  },
  electricalExport: function () {
    return execute(openExportDialog);
  },
  electricalExportSvg: function () {
    return execute(openSvgExportDialog);
  },
  electricalInsertCabinet: function () {
    return execute(cabinetDialogsApi.openInsertCabinetDialog);
  },
  electricalInsertFrame: function () {
    return execute(openInsertFrameDialog);
  },
  electricalLoadBackend: function () {
    return execute(backendDialogsApi.openBackendLoadDialog);
  },
  electricalNewBackend: function () {
    return execute(function () {
      backendServiceApi.resetBackendBinding();
      showStatus("已新建后端图纸会话，下一次保存将创建新图纸", false);
    });
  },
  electricalReassignPort: function () {
    return execute(portSwapModeApi.enterPortSwapMode);
  },
  electricalRefresh: function () {
    return execute(commandApi.refreshSelection);
  },
  electricalRollbackBackend: function () {
    return execute(backendDialogsApi.openBackendRollbackDialog);
  },
  electricalSaveBackend: function () {
    return execute(backendDialogsApi.openBackendSaveDialog);
  },
  electricalSymbols: function () {
    return execute(templateEditorApi.toggleWindow);
  },
};
