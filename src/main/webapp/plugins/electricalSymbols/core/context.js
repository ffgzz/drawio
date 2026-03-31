/**
 * 运行上下文工厂。
 * 用于把 draw.io 的 ui、graph、model 和插件状态封装成统一上下文对象。
 */
import { ELECTRICAL_CONSTANTS } from "./constants.js";
import { createPluginState } from "./state.js";

// ctx 会传给几乎所有模块，是模块间协作的统一入口。
export function createPluginContext(ui) {
  var graph = ui.editor.graph;

  return {
    ui,
    graph,
    model: graph.getModel(),
    state: createPluginState(ELECTRICAL_CONSTANTS),
    constants: ELECTRICAL_CONSTANTS,
  };
}
