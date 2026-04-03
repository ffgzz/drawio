/**
 * 插件正式安装入口。负责接收 draw.io 传进来的 ui，启动整个插件的初始化流程
 * 负责把基础能力、业务模块、UI 模块和运行时行为组装起来。
 */
import { activateAppRuntime, createApp } from "./createApp.js";
import { setApp } from "../core/appRuntime.js";
import { backendServiceApi } from "../services/backend.js";
import { snapshotDomainApi } from "../domain/snapshot.js";

// 安装流程非常短，便于后续排查初始化顺序问题。
export function installElectricalSymbols(ctx) {
  var app = createApp(ctx);
  var initialSnapshot;
  setApp(app);

  // 从本地存储里恢复上一次后端连接/图纸会话信息，放回插件 state
  backendServiceApi.loadBackendSession();
  // 把 electricalSymbols 的所有 action、对话框、graph 监听、运行模式真正挂到 draw.io 上
  activateAppRuntime(app);

  initialSnapshot = snapshotDomainApi.exportDiagramSnapshot();

  if (
    ctx.state.backendDiagramId &&
    ctx.state.backendLastSnapshot != null &&
    Array.isArray(initialSnapshot.objects) &&
    Array.isArray(initialSnapshot.edges) &&
    initialSnapshot.objects.length == 0 &&
    initialSnapshot.edges.length == 0
  ) {
    backendServiceApi.resetBackendBinding();
  }
}
