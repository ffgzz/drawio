/**
 * 插件源码入口文件。
 * 这里只负责创建运行上下文、注册国际化资源，并把控制权交给正式安装器。
 */
import { createPluginContext } from "./core/context.js";
import { registerElectricalResources } from "./core/resources.js";
import { installElectricalSymbols } from "./bootstrap/installElectricalSymbols.js";

Draw.loadPlugin(function (ui) {
  // ctx 汇总了插件运行期需要共享的 ui、graph、model、state 和常量。
  var ctx = createPluginContext(ui);

  registerElectricalResources();
  installElectricalSymbols(ctx);
});
