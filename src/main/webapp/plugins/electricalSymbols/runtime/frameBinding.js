/**
 * 图框绑定维护。
 *
 * 不变式：用户级顶层对象（图元根、用户自己画的图形）的 mxCell parent，恒等于
 * "几何上包含它中心点的图框"；没有命中图框时是 defaultParent。
 *
 * ── 为什么挂在 MOVE_CELLS / CELLS_ADDED / CELLS_RESIZED 上 ──
 * 这三个事件都在 mxGraph 自己的 beginUpdate/endUpdate **内部**触发
 * （mxgraph/src/view/mxGraph.js 的 moveCells / cellsAdded / cellsResized），
 * 所以重挂父节点会并进同一条 undo 记录，不会出现"撤销两次才回到原状"。
 *
 * ── 为什么不监听 undo/redo ──
 * 只要每次前向操作结束时模型都满足不变式，撤销恢复的就是上一个满足不变式的
 * 状态（parent 本身也在 mxChildChange 里被还原）。改在 model.CHANGE 上做全局
 * 兜底，反而会多产生一条独立的 undo 记录。
 *
 * ── 电缆（edge）不用管 ──
 * mxGraphModel.add 在 parent 变化时会自动调 updateEdgeParents，把相连的边移到
 * 两端的最近公共祖先并换算几何。两端同框 → 该图框；跨框 → defaultParent，
 * 正好就是我们要的规则。
 *
 * ── 成本 ──
 * 单个 cell 的判定 = 一次中心点计算 + 对 F 个图框矩形的线性扫描（F = 页数）。
 * 判定结果与当前 parent 相同就直接短路，一个 model 写操作都不做；日常拖动
 * 绝大多数情况走这条短路，等价于纯读。
 */
import { getApp } from "../core/appRuntime.js";
import { trim } from "../utils/base.js";
import { getAttr } from "../utils/xml.js";
import {
  isCabinetGap,
  isCabinetSegment,
  isDrawingFrame,
  isFrameDecorationCell,
} from "../core/runtimeHelpers.js";
import { frameDomainApi } from "../domain/frame.js";

var ZERO_ORIGIN = { x: 0, y: 0 };

// 重入保护：重挂父节点本身不会再触发 graph 层事件，这里只是兜底。
var syncing = false;

function getCtx() {
  return getApp().ctx;
}

/**
 * 哪些 cell 参与自动绑定。
 *
 * 排除项：
 *   - 图框自身：它就是容器
 *   - 配电柜段 / 断点：跨页归属由 cabinetGraph 的连续段算法管理，自动重挂会打架
 *   - 带 esKind 的插件内部构件（图元 body/label、图框标题、柜体）
 *   - 图框模板装饰件（靠样式标记识别）
 *   - 非顶层对象：父节点既不是 defaultParent 也不是图框（例如组内成员）
 */
function isBindableVertex(cell) {
  var ctx = getCtx();
  var model = ctx.model;

  if (cell == null || !model.isVertex(cell)) {
    return false;
  }

  if (isDrawingFrame(cell) || isCabinetSegment(cell) || isCabinetGap(cell)) {
    return false;
  }

  if (trim(getAttr(cell, "esKind")).length > 0 || isFrameDecorationCell(cell)) {
    return false;
  }

  var parent = model.getParent(cell);

  return parent === ctx.graph.getDefaultParent() || isDrawingFrame(parent);
}

/**
 * 某个父节点（图框或 defaultParent）在画布坐标系里的原点。
 */
function originOfParent(parent) {
  var ctx = getCtx();

  if (parent == null || parent === ctx.graph.getDefaultParent()) {
    return ZERO_ORIGIN;
  }

  var origin = frameDomainApi.getAbsoluteOrigin(parent);
  var geometry = ctx.model.getGeometry(parent);

  return {
    x: origin.x + (geometry != null ? geometry.x : 0),
    y: origin.y + (geometry != null ? geometry.y : 0),
  };
}

/**
 * 按中心点算出这个 cell 应该挂在谁下面。
 */
function resolveTargetParent(cell) {
  var ctx = getCtx();
  var center = frameDomainApi.getAbsoluteCenter(cell);
  var frame =
    center != null
      ? frameDomainApi.findFrameContainingPoint(center.x, center.y)
      : null;

  return frame != null ? frame : ctx.graph.getDefaultParent();
}

/**
 * 换父节点。子节点几何是相对父原点的，所以要按两个父节点的原点差做平移，
 * 保证图元在画布上的绝对位置不动。
 */
function reparentCell(cell, nextParent) {
  var ctx = getCtx();
  var model = ctx.model;
  var from = originOfParent(model.getParent(cell));
  var to = originOfParent(nextParent);
  var dx = from.x - to.x;
  var dy = from.y - to.y;
  var geometry = model.getGeometry(cell);

  if (geometry != null && (dx !== 0 || dy !== 0)) {
    geometry = geometry.clone();
    geometry.translate(dx, dy);
    model.setGeometry(cell, geometry);
  }

  // 插到子节点末尾，保证图元压在图框的装饰线之上
  model.add(nextParent, cell, model.getChildCount(nextParent));
}

/**
 * 按几何重算一批 cell 的图框归属。幂等；归属没变的 cell 不产生任何 model 写操作。
 *
 * @param {Array} cells 需要重算的 cell（非顶层对象会被自动跳过）
 * @returns {number} 实际重挂的数量
 */
export function syncFrameBinding(cells) {
  if (syncing || !Array.isArray(cells) || cells.length === 0) {
    return 0;
  }

  var model = getCtx().model;
  var changed = 0;
  var i;

  syncing = true;
  model.beginUpdate();

  try {
    for (i = 0; i < cells.length; i++) {
      var cell = cells[i];

      if (!isBindableVertex(cell)) {
        continue;
      }

      var nextParent = resolveTargetParent(cell);

      // 短路：归属没变就不碰 model，不进 undo、不进增量 diff
      if (nextParent === model.getParent(cell)) {
        continue;
      }

      reparentCell(cell, nextParent);
      changed++;
    }
  } finally {
    model.endUpdate();
    syncing = false;
  }

  return changed;
}

/**
 * 把一批 cell 明确绑定到指定图框，不做几何判定。
 *
 * 自动布局用这个而不是 syncFrameBinding：布局结果如果溢出了图框边界，
 * 按几何判定会把图元"踢出"页面，但用户的意图明确就是"这些属于这一页"。
 */
export function bindCellsToFrame(cells, frame) {
  if (syncing || !Array.isArray(cells) || cells.length === 0 || frame == null) {
    return 0;
  }

  var model = getCtx().model;
  var changed = 0;
  var i;

  syncing = true;
  model.beginUpdate();

  try {
    for (i = 0; i < cells.length; i++) {
      var cell = cells[i];

      if (!isBindableVertex(cell) || model.getParent(cell) === frame) {
        continue;
      }

      reparentCell(cell, frame);
      changed++;
    }
  } finally {
    model.endUpdate();
    syncing = false;
  }

  return changed;
}

function handleGraphCellsEvent(sender, evt) {
  var cells = evt != null ? evt.getProperty("cells") : null;

  if (Array.isArray(cells) && cells.length > 0) {
    syncFrameBinding(cells);
  }
}

export function installFrameBinding(ctx) {
  var graph = ctx.graph;

  // 这三个事件覆盖了所有走 graph API 的写入：用户拖拽、importCells（插入/粘贴/
  // 导入）、缩放。绕过 graph 直接写 model 的少数几处（insertRawXml 的偏移、
  // applyLayoutPositions）在各自的事务里显式调用上面两个函数。
  graph.addListener(mxEvent.MOVE_CELLS, handleGraphCellsEvent);
  graph.addListener(mxEvent.CELLS_ADDED, handleGraphCellsEvent);
  graph.addListener(mxEvent.CELLS_RESIZED, handleGraphCellsEvent);
}
