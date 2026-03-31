/**
 * 插件正式安装入口。负责接收 draw.io 传进来的 ui，启动整个插件的初始化流程
 * 负责把基础能力、业务模块、UI 模块和运行时行为组装起来。
 */
import { createApp } from "./createApp.js";
import { wireApp } from "./wireApp.js";
import { installUi } from "./installUi.js";
import { installRuntime } from "./installRuntime.js";

// 安装流程非常短，便于后续排查初始化顺序问题。
export function installElectricalSymbols(ctx) {
  var app = createApp(ctx);

  // 从本地存储里恢复上一次后端连接/图纸会话信息，放回插件 state
  app.services.backend.loadBackendSession();
  installUi(app);
  installRuntime(app);
  wireApp(app);
  // 把 electricalSymbols 的所有 action、对话框、graph 监听、运行模式真正挂到 draw.io 上
  app.activateRuntime();
}
