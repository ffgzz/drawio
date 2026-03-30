import { createPluginContext } from "./core/context.js";
import { registerElectricalResources } from "./core/resources.js";
import { installElectricalSymbols } from "./bootstrap/installElectricalSymbols.js";

Draw.loadPlugin(function (ui) {
  var ctx = createPluginContext(ui);

  registerElectricalResources();
  installElectricalSymbols(ctx);
});
