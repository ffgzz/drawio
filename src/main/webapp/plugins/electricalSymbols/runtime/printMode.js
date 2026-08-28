/**
 * 出图模式。
 *
 * 画布上有一些只服务于编辑的辅助元素——配电柜块的浅灰分隔线、块上的浮层按钮。
 * 真实图纸里不该有它们，所以导出（SVG / PDF / 打印）时要临时藏掉。
 *
 * 做法是在**视图层**改：覆写 graph.getCellStyle，出图模式下把块的描边换成 none。
 * 不动模型，因此不进 undo、不进增量 diff、不影响快照——和视口虚拟化用
 * isCellCollapsed 做裁剪是同一套路数。
 */
import { getApp } from "../core/appRuntime.js";
import { isCabinetBlock } from "../core/runtimeHelpers.js";

var printMode = false;
var listeners = [];

export function isPrintMode() {
  return printMode;
}

/**
 * 订阅出图模式的开关。配电柜浮层用它来决定挂不挂加号/绑定入口。
 */
export function onPrintModeChanged(listener) {
  if (typeof listener === "function") {
    listeners.push(listener);
  }
}

function notify() {
  var i;

  for (i = 0; i < listeners.length; i++) {
    try {
      listeners[i]();
    } catch (e) {
      // 单个订阅者出错不应该挡住导出
    }
  }
}

function applyMode(graph, next) {
  printMode = next;
  notify();
  // 样式是按 cell 解析后缓存在 mxCellState 上的，必须整体重算一次
  graph.refresh();
}

/**
 * 在出图模式下执行 callback，结束后无论成败都恢复。
 *
 * @param {Function} callback
 * @returns {*} callback 的返回值
 */
export function withPrintStyles(callback) {
  var graph = getApp().ctx.graph;

  if (printMode) {
    return callback();
  }

  applyMode(graph, true);

  try {
    return callback();
  } finally {
    applyMode(graph, false);
  }
}

export function installPrintMode(ctx) {
  var graph = ctx.graph;
  var origGetCellStyle = graph.getCellStyle;

  graph.getCellStyle = function (cell) {
    var style = origGetCellStyle.apply(this, arguments);

    if (printMode && isCabinetBlock(cell)) {
      style[mxConstants.STYLE_STROKECOLOR] = mxConstants.NONE;
    }

    return style;
  };
}

export var printModeApi = {
  installPrintMode,
  isPrintMode,
  onPrintModeChanged,
  withPrintStyles,
};
