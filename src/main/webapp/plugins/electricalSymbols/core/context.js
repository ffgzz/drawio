import { ELECTRICAL_CONSTANTS } from "./constants.js";
import { createPluginState } from "./state.js";

export function createPluginContext(ui) {
  var graph = ui.editor.graph;

  return {
    ui: ui,
    graph: graph,
    model: graph.getModel(),
    state: createPluginState(ELECTRICAL_CONSTANTS),
    constants: ELECTRICAL_CONSTANTS,
  };
}

