/**
 * 应用接线层。
 * 这里保留最后一层 UI/runtime/application 的互相绑定，禁止其它层直接跨层引用。
 */
export function wireApp(app) {
  if (app.ui != null) {
    Object.assign(app.uiBridge, app.ui);
  }

  if (app.runtime != null) {
    Object.assign(app.runtimeBridge, app.runtime);
  }

  app.uiBridge.insertIntoGraph = app.commands.insertIntoGraph;
  app.uiBridge.refreshSelection = app.commands.refreshSelection;
  app.uiBridge.clearCurrentPage = app.commands.clearCurrentPage;

  return app;
}
