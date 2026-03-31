/**
 * 插件正式安装入口。
 * 负责把基础能力、业务模块、UI 模块和运行时行为组装起来。
 */
import { createPluginBundle } from "./createPluginBundle.js";
import { createUiRuntime } from "./createUiRuntime.js";

// 安装流程非常短，便于后续排查初始化顺序问题。
export function installElectricalSymbols(ctx) {
  var bundle = createPluginBundle(ctx);
  var uiRuntime = createUiRuntime(bundle);

  bundle.loadBackendSession();
  uiRuntime.installCanvas();
}
