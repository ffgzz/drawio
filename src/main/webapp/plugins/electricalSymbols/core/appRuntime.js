/**
 * 全局运行时 app 注册表。
 * 插件启动时只注册一次，运行中的 UI/runtime/application 模块通过这里拿当前 app。
 */
var currentApp = null;

export function setApp(app) {
  currentApp = app;
}

export function getApp() {
  if (currentApp == null) {
    throw new Error("electricalSymbols app 尚未初始化");
  }

  return currentApp;
}

export function clearApp() {
  currentApp = null;
}
