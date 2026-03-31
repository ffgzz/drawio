/**
 * 应用动作层。
 * 这里定义稳定的用户动作接口，画布 action、顶部按钮和 UI 事件都只调用这里。
 */
import { getApp } from "../core/appRuntime.js";

export function createActionApi() {
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
    electricalBrowse: function () {
      return execute(function () {
        return getApp().ui.openTemplateBrowserDialog();
      });
    },
    electricalClearScreen: function () {
      return execute(function () {
        return getApp().commands.clearCurrentPage();
      }, true);
    },
    electricalComposeInstance: function () {
      return execute(function () {
        return getApp().runtime.enterInstanceComposeMode();
      });
    },
    electricalCreate: function () {
      return execute(function () {
        return getApp().ui.openCreateFromLibraryDialog();
      });
    },
    electricalEditInstance: function () {
      return execute(function () {
        return getApp().ui.openEditInstanceDialog();
      });
    },
    electricalExportSvg: function () {
      return execute(function () {
        return getApp().ui.openSvgExportDialog();
      });
    },
    electricalInsertCabinet: function () {
      return execute(function () {
        return getApp().ui.openInsertCabinetDialog();
      });
    },
    electricalInsertFrame: function () {
      return execute(function () {
        return getApp().ui.openInsertFrameDialog();
      });
    },
    electricalLoadBackend: function () {
      return execute(function () {
        return getApp().ui.openBackendLoadDialog();
      });
    },
    electricalNewBackend: function () {
      return execute(function () {
        var app = getApp();
        var backend = app.services.backend;
        backend.resetBackendBinding();
        app.showStatus("已新建后端图纸会话，下一次保存将创建新图纸", false);
      });
    },
    electricalReassignPort: function () {
      return execute(function () {
        return getApp().runtime.enterPortSwapMode();
      });
    },
    electricalRefresh: function () {
      return execute(function () {
        return getApp().commands.refreshSelection();
      });
    },
    electricalRollbackBackend: function () {
      return execute(function () {
        return getApp().ui.openBackendRollbackDialog();
      });
    },
    electricalSaveBackend: function () {
      return execute(function () {
        return getApp().ui.openBackendSaveDialog();
      });
    },
    electricalSymbols: function () {
      return execute(function () {
        return getApp().ui.toggleWindow();
      });
    },
  };
}
