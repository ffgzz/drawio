/**
 * UI 安装器。
 * 这里负责创建纯 UI API，本身不再直接操作 uiBridge，桥接动作统一交给 wireApp。
 */
import { createUiRegistry } from "./createUiRegistry.js";

export function installUi(app) {
  app.ui = createUiRegistry(app);
  return app.ui;
}
