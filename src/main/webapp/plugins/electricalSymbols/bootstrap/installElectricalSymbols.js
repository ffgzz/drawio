import { createPluginBundle } from "./createPluginBundle.js";
import { createUiRuntime } from "./createUiRuntime.js";

export function installElectricalSymbols(ctx) {
  var bundle = createPluginBundle(ctx);
  var uiRuntime = createUiRuntime(bundle);

  bundle.loadBackendSession();
  uiRuntime.installCanvas();
}
