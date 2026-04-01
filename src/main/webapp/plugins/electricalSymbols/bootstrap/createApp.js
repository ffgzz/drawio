/**
 * 应用装配入口。
 * 现在这里只创建运行时容器本身，普通模块能力全部走静态 import/export。
 */
import { isCabinetGap, setCanvasStatus } from "../core/runtimeHelpers.js";
import { cabinetDomainApi } from "../domain/cabinet.js";
import { connectionConstraintsApi } from "../runtime/connectionConstraints.js";
import { installCanvasFeatures, ACTION_ITEMS } from "../runtime/canvasFeatures.js";
import { portSwapModeApi } from "../runtime/portSwapMode.js";
import { createPluginButton } from "../ui/shared/buttonFactory.js";
import { installTopActionBar } from "../ui/topActionBar.js";
import { cabinetDialogsApi } from "../ui/cabinetDialog.js";

function installTopBar(ui) {
  installTopActionBar({
    ui,
    createButton: createPluginButton,
    items: ACTION_ITEMS,
  });
}

/**
 * 只保留 draw.io 运行时实例和基于它们创建出的运行时单例。
 */
export function createApp(ctx) {
  return {
    ctx,
  };
}

/**
 * 真正把 electricalSymbols 的运行时行为挂到 draw.io 上。
 * 这里不再把 runtime/ui/domain API 挂回 app，而是直接静态导入使用。
 */
export function activateAppRuntime(app) {
  var ui = app.ctx.ui;

  portSwapModeApi.installGraphClickBehavior({
    isCabinetGap,
    openCabinetGapDialog: cabinetDialogsApi.openCabinetGapDialog,
    closeGapDialogWindow: cabinetDialogsApi.closeGapDialogWindow,
    setSelectedCabinetGap: cabinetDomainApi.setSelectedCabinetGap,
  });

  connectionConstraintsApi.installGraphBehavior({
    applyEdgePortConstraintMetadata:
      portSwapModeApi.applyEdgePortConstraintMetadata,
    setCanvasStatus,
  });

  installCanvasFeatures(app.ctx);
  installTopBar(ui);
  ui.addListener("languageChanged", function () {
    installTopBar(ui);
  });
  ui.addListener("currentThemeChanged", function () {
    installTopBar(ui);
  });
}
