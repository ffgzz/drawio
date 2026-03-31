/**
 * graph/model 访问边界。
 * 这里把最常用的 draw.io 运行时对象收口成稳定接口，避免高层模块直接拼 ctx。
 */
export function createGraphApi(ctx) {
  return {
    ui: ctx.ui,
    graph: ctx.graph,
    model: ctx.model,
    state: ctx.state,
    constants: ctx.constants,
    getSelectionCell: function () {
      return ctx.graph.getSelectionCell();
    },
    getDefaultParent: function () {
      return ctx.graph.getDefaultParent();
    },
  };
}
