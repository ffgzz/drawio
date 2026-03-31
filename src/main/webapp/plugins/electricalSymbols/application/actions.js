/**
 * 应用动作层。
 * 这里定义稳定的用户动作接口，画布 action、顶部按钮和 UI 事件都只调用这里。
 */
export function createActionApi(app) {
  var uiBridge = app.uiBridge;
  var runtimeBridge = app.runtimeBridge;
  var commands = app.commands;
  var backend = app.services.backend;

  function execute(fn, resetDeleteFlag) {
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
        return uiBridge.openTemplateBrowserDialog();
      });
    },
    electricalClearScreen: function () {
      return execute(function () {
        return commands.clearCurrentPage();
      }, true);
    },
    electricalComposeInstance: function () {
      return execute(function () {
        return runtimeBridge.enterInstanceComposeMode();
      });
    },
    electricalCreate: function () {
      return execute(function () {
        return uiBridge.openCreateFromLibraryDialog();
      });
    },
    electricalEditInstance: function () {
      return execute(function () {
        return uiBridge.openEditInstanceDialog();
      });
    },
    electricalExportSvg: function () {
      return execute(function () {
        return uiBridge.openSvgExportDialog();
      });
    },
    electricalInsertCabinet: function () {
      return execute(function () {
        return uiBridge.openInsertCabinetDialog();
      });
    },
    electricalInsertFrame: function () {
      return execute(function () {
        return uiBridge.openInsertFrameDialog();
      });
    },
    electricalLoadBackend: function () {
      return execute(function () {
        return uiBridge.openBackendLoadDialog();
      });
    },
    electricalNewBackend: function () {
      return execute(function () {
        backend.resetBackendBinding();
        app.showStatus("已新建后端图纸会话，下一次保存将创建新图纸", false);
      });
    },
    electricalReassignPort: function () {
      return execute(function () {
        return runtimeBridge.enterPortSwapMode();
      });
    },
    electricalRefresh: function () {
      return execute(function () {
        return commands.refreshSelection();
      });
    },
    electricalRollbackBackend: function () {
      return execute(function () {
        return uiBridge.openBackendRollbackDialog();
      });
    },
    electricalSaveBackend: function () {
      return execute(function () {
        return uiBridge.openBackendSaveDialog();
      });
    },
    electricalSymbols: function () {
      return execute(function () {
        return uiBridge.toggleWindow();
      });
    },
  };
}
