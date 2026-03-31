/**
 * runtime 安装器。
 * 这里先创建纯 runtime API，并把激活逻辑延后到 wireApp 之后执行。
 */
import { createRuntimeRegistry } from "./createRuntimeRegistry.js";

export function installRuntime(app) {
  var runtime = createRuntimeRegistry(app);
  app.runtime = runtime.runtimeApi;
  app.activateRuntime = runtime.activateRuntime;
  return app.runtime;
}
