/**
 * 应用上下文访问器。
 * 统一提供 state/constants 的读取入口，供 service 和 application 层使用。
 */
export function createAppContext(ctx) {
  return {
    ui: ctx.ui,
    graph: ctx.graph,
    model: ctx.model,
    constants: ctx.constants,
    getState: function () {
      return ctx.state;
    },
    updateState: function (mutator) {
      if (typeof mutator === "function") {
        mutator(ctx.state);
      }

      return ctx.state;
    },
  };
}
