/**
 * 视口 LOD 系统：两级视图 + 视口裁剪。
 *
 * 全局模式（根据缩放级别自动切换）：
 *   Detail   — 完整渲染 + 编辑，视口外图框折叠以控制 DOM 量
 *   Overview — 文字隐藏，图形/连线保持可见（自然缩小即为"块"），
 *              禁止编辑，仅图框可选可拖拽
 *
 * 视口裁剪（两种模式下均生效）：
 *   超出「视口 + 预加载边距」的图框 → isCellCollapsed = true → 子 DOM 不创建
 *
 * 不修改任何 model 数据——undo/redo/clipboard 安全。
 */
import { getApp } from "../core/appRuntime.js";
import { isDrawingFrame } from "../core/runtimeHelpers.js";

// ---------------------------------------------------------------------------
// Debug
// ---------------------------------------------------------------------------

var DEBUG = true;

function debugLog() {
  if (DEBUG && typeof console !== "undefined") {
    var args = ["[LOD]"];

    for (var i = 0; i < arguments.length; i++) {
      args.push(arguments[i]);
    }

    console.log.apply(console, args);
  }
}

// ---------------------------------------------------------------------------
// 常量
// ---------------------------------------------------------------------------

/** 图框屏幕宽 < 此值 → 进入 Overview 模式 */
var OVERVIEW_PX = 360;

/** 视口预加载边距（屏幕像素） */
var PRELOAD_MARGIN_PX = 600;

/** 迟滞系数：防止在阈值附近反复切换 */
var HYSTERESIS = 0.05;

/** 节流间隔（毫秒） */
var THROTTLE_MS = 120;

/** 初始裁剪延迟（毫秒） */
var INIT_DELAY_MS = 200;

/** 图框名义宽度（用于根据 scale 判断 Overview 模式） */
var FRAME_NOMINAL_WIDTH = 820;

// ---------------------------------------------------------------------------
// 模块状态
// ---------------------------------------------------------------------------

/** true = Overview（只读预览），false = Detail（可编辑） */
var overviewMode = false;

/** 被视口裁剪的图框集合（子 DOM 不创建） */
var culledFrameSet = new Set();

var installed = false;
var throttleTimer = null;
var _graph = null;

// ---------------------------------------------------------------------------
// 辅助
// ---------------------------------------------------------------------------

/**
 * 沿 parent 链查找 cell 所属的 DrawingFrame。
 */
export function findOwnerFrame(cell) {
  if (cell == null || _graph == null) {
    return null;
  }

  if (isDrawingFrame(cell)) {
    return cell;
  }

  var model = _graph.getModel();
  var cur = model.getParent(cell);

  while (cur != null) {
    if (isDrawingFrame(cur)) {
      return cur;
    }

    cur = model.getParent(cur);
  }

  return null;
}

/**
 * 判断 cell 是否为不在任何图框内的顶层 cell（layer 直接子节点且非图框）。
 */
function isOrphanTopLevelCell(cell) {
  if (cell == null || isDrawingFrame(cell)) {
    return false;
  }

  var model = _graph.getModel();
  var parent = model.getParent(cell);

  if (parent == null) {
    return false;
  }

  return model.getParent(parent) === model.getRoot();
}

// ---------------------------------------------------------------------------
// 视口几何
// ---------------------------------------------------------------------------

function getCurrentScale(graph) {
  if (graph.useCssTransforms) {
    return graph.currentScale || 1;
  }

  return graph.view != null ? graph.view.scale || 1 : 1;
}

function getViewportRect(graph) {
  var c = graph.container;

  if (c == null) {
    return null;
  }

  var s = getCurrentScale(graph);
  var tx;
  var ty;

  if (graph.useCssTransforms) {
    tx = graph.currentTranslate != null ? graph.currentTranslate.x : 0;
    ty = graph.currentTranslate != null ? graph.currentTranslate.y : 0;
  } else {
    var t = graph.view != null ? graph.view.translate : null;
    tx = t != null ? t.x : 0;
    ty = t != null ? t.y : 0;
  }

  return {
    x: c.scrollLeft / s - tx,
    y: c.scrollTop / s - ty,
    width: c.clientWidth / s,
    height: c.clientHeight / s,
  };
}

function expandRectByPixels(rect, scale) {
  var m = PRELOAD_MARGIN_PX / scale;

  return {
    x: rect.x - m,
    y: rect.y - m,
    width: rect.width + m * 2,
    height: rect.height + m * 2,
  };
}

function rectsIntersect(a, b) {
  return !(
    a.x + a.width < b.x ||
    b.x + b.width < a.x ||
    a.y + a.height < b.y ||
    b.y + b.height < a.y
  );
}

// ---------------------------------------------------------------------------
// 图框收集与定位
// ---------------------------------------------------------------------------

function collectAllFrames(graph) {
  var model = graph.getModel();
  var frames = [];

  function walk(cell) {
    if (cell == null) {
      return;
    }

    if (isDrawingFrame(cell)) {
      frames.push(cell);
      return;
    }

    var n = model.getChildCount(cell);

    for (var i = 0; i < n; i++) {
      walk(model.getChildAt(cell, i));
    }
  }

  walk(model.getRoot());
  return frames;
}

function getFrameAbsoluteRect(graph, frame) {
  var model = graph.getModel();
  var geo = model.getGeometry(frame);

  if (geo == null) {
    return null;
  }

  var x = geo.x;
  var y = geo.y;
  var p = model.getParent(frame);

  while (p != null && p !== model.getRoot()) {
    var pg = model.getGeometry(p);

    if (pg != null) {
      x += pg.x;
      y += pg.y;
    }

    p = model.getParent(p);
  }

  return { x: x, y: y, width: geo.width, height: geo.height };
}

// ---------------------------------------------------------------------------
// 核心重算
// ---------------------------------------------------------------------------

/**
 * 重算 overviewMode 和 culledFrameSet。
 * 返回 true 表示有变化需要刷新视图。
 */
function recompute(graph) {
  var scale = getCurrentScale(graph);
  var changed = false;

  // ---- 1. Overview 模式判定（带迟滞） ----
  var screenW = FRAME_NOMINAL_WIDTH * scale;
  var newOverview;

  if (overviewMode) {
    // 正在 Overview，需要屏幕宽超过阈值 + 迟滞才回到 Detail
    newOverview = screenW < OVERVIEW_PX * (1 + HYSTERESIS);
  } else {
    // 正在 Detail，需要屏幕宽低于阈值 - 迟滞才进入 Overview
    newOverview = screenW < OVERVIEW_PX * (1 - HYSTERESIS);
  }

  // 正在编辑中不切换模式，避免打断用户
  if (graph.cellEditor != null && graph.cellEditor.editingCell != null) {
    newOverview = overviewMode;
  }

  if (newOverview !== overviewMode) {
    overviewMode = newOverview;
    changed = true;
  }

  // ---- 2. 视口裁剪 ----
  var vp = getViewportRect(graph);

  if (vp == null) {
    return changed;
  }

  var expanded = expandRectByPixels(vp, scale);
  var frames = collectAllFrames(graph);

  for (var i = 0; i < frames.length; i++) {
    var frame = frames[i];
    var rect = getFrameAbsoluteRect(graph, frame);
    var shouldCull = rect == null || !rectsIntersect(rect, expanded);
    var isCulled = culledFrameSet.has(frame);

    if (shouldCull && !isCulled) {
      culledFrameSet.add(frame);
      changed = true;
    } else if (!shouldCull && isCulled) {
      culledFrameSet.delete(frame);
      changed = true;
    }
  }

  // 清理已从 model 移除的图框
  for (var f of culledFrameSet) {
    if (f.parent == null) {
      culledFrameSet.delete(f);
      changed = true;
    }
  }

  return changed;
}

// ---------------------------------------------------------------------------
// 选中状态清理
// ---------------------------------------------------------------------------

function clearInvalidSelection(graph) {
  if (!overviewMode) {
    return;
  }

  var sel = graph.getSelectionCells();

  if (sel == null || sel.length === 0) {
    return;
  }

  var remove = [];

  for (var i = 0; i < sel.length; i++) {
    if (!isDrawingFrame(sel[i])) {
      remove.push(sel[i]);
    }
  }

  if (remove.length > 0) {
    debugLog("clearSelection: " + remove.length + " cells");
    graph.removeSelectionCells(remove);
  }
}

// ---------------------------------------------------------------------------
// 裁剪执行
// ---------------------------------------------------------------------------

function runCullingPass(graph) {
  if (recompute(graph)) {
    debugLog(
      "changed: overview=" + overviewMode,
      "culled=" + culledFrameSet.size,
      "scale=" + getCurrentScale(graph).toFixed(3),
    );

    clearInvalidSelection(graph);
    graph.view.revalidate();
    graph.view.validate();
  }
}

function scheduleThrottledCulling(graph) {
  if (throttleTimer != null) {
    return;
  }

  throttleTimer = setTimeout(function () {
    throttleTimer = null;
    runCullingPass(graph);
  }, THROTTLE_MS);
}

// ---------------------------------------------------------------------------
// 公共 API
// ---------------------------------------------------------------------------

/** 兼容旧接口：cell 是否被视口裁剪 */
export function isVirtuallyCollapsed(cell) {
  return culledFrameSet.has(cell);
}

/** 查询图框当前等效 LOD（0=Detail可见 / 1=Overview可见 / 2=被裁剪） */
export function getFrameLod(frame) {
  if (culledFrameSet.has(frame)) {
    return 2;
  }

  if (overviewMode) {
    return 1;
  }

  return 0;
}

/**
 * 临时恢复全部图框为 Detail 可见状态执行 fn（同步），完成后还原。
 * 用于导出 / 快照等需要完整 DOM 的操作。
 */
export function isOverviewMode() {
  return overviewMode;
}

export function withAllFramesExpanded(fn) {
  var graph = getApp().ctx.graph;
  var savedCulled = new Set(culledFrameSet);
  var savedOverview = overviewMode;
  var needRestore = culledFrameSet.size > 0 || overviewMode;

  if (needRestore) {
    debugLog("expandAll: clearing culled=" + savedCulled.size + " overview=" + savedOverview);
    culledFrameSet.clear();
    overviewMode = false;
    graph.view.revalidate();
    graph.view.validate();
  }

  try {
    return fn();
  } finally {
    if (needRestore) {
      for (var f of savedCulled) {
        culledFrameSet.add(f);
      }

      overviewMode = savedOverview;
      debugLog("expandAll: restored");
      graph.view.revalidate();
      graph.view.validate();
    }
  }
}

// ---------------------------------------------------------------------------
// 安装
// ---------------------------------------------------------------------------

export function installViewportVirtualization(ctx) {
  if (installed) {
    return;
  }

  var graph = ctx.graph;

  if (graph.container == null) {
    return;
  }

  installed = true;
  _graph = graph;

  debugLog("install: OVERVIEW_PX=" + OVERVIEW_PX, "PRELOAD_MARGIN_PX=" + PRELOAD_MARGIN_PX);

  // ================================================================
  // 1. isCellCollapsed — 被裁剪的图框折叠（子 DOM 不创建）
  // ================================================================
  var _origCollapsed = graph.isCellCollapsed;

  graph.isCellCollapsed = function (cell) {
    if (culledFrameSet.has(cell)) {
      return true;
    }

    return _origCollapsed.call(this, cell);
  };

  // ================================================================
  // 2. isCellFoldable — 被裁剪的图框不显示 +/- 按钮
  // ================================================================
  var _origFoldable = graph.isCellFoldable;

  graph.isCellFoldable = function (cell, collapse) {
    if (culledFrameSet.has(cell)) {
      return false;
    }

    return _origFoldable.call(this, cell, collapse);
  };

  // ================================================================
  // 3. getLabel — Overview 模式隐藏所有文字
  // ================================================================
  var _origGetLabel = graph.getLabel;

  graph.getLabel = function (cell) {
    if (overviewMode) {
      return "";
    }

    return _origGetLabel.call(this, cell);
  };

  // ================================================================
  // 4. isCellSelectable — Overview 模式仅图框可选
  // ================================================================
  var _origSelectable = graph.isCellSelectable;

  graph.isCellSelectable = function (cell) {
    if (overviewMode && !isDrawingFrame(cell)) {
      return false;
    }

    return _origSelectable.call(this, cell);
  };

  // ================================================================
  // 5. isCellMovable — Overview 模式仅图框可拖
  // ================================================================
  var _origMovable = graph.isCellMovable;

  graph.isCellMovable = function (cell) {
    if (overviewMode && !isDrawingFrame(cell)) {
      return false;
    }

    return _origMovable.call(this, cell);
  };

  // ================================================================
  // 6. isCellDeletable — Overview 模式禁止一切删除
  // ================================================================
  var _origDeletable = graph.isCellDeletable;

  graph.isCellDeletable = function (cell) {
    if (overviewMode) {
      return false;
    }

    return _origDeletable.call(this, cell);
  };

  // ================================================================
  // 7. isCellEditable — Overview 模式全部不可编辑
  // ================================================================
  var _origEditable = graph.isCellEditable;

  graph.isCellEditable = function (cell) {
    if (overviewMode) {
      return false;
    }

    return _origEditable.call(this, cell);
  };

  // ================================================================
  // 7. getCellAt — Overview 模式点击图框内部 → 返回图框本身
  //              非 Overview 模式下图框只有边框可选中（防止误触内部空白）
  //
  // getCellAt 递归到 DrawingFrame 时截断，调用方回退检查
  // 图框自身的 intersects → 点击图框区域 = 选中图框。
  // ================================================================

  /** 图框边框命中容差（图形坐标，≈ strokeWidth + 额外可点击边距） */
  var FRAME_BORDER_TOLERANCE = 8;

  /**
   * 判断 (x, y) 是否落在图框边框区域（strokeWidth + 容差）。
   * 坐标为 graph 坐标（非屏幕坐标）。
   */
  function isOnFrameBorder(cellState, gx, gy) {
    var tol = FRAME_BORDER_TOLERANCE;
    var left = cellState.x;
    var top = cellState.y;
    var right = cellState.x + cellState.width;
    var bottom = cellState.y + cellState.height;
    var scale = graph.view.scale;
    var tolScaled = tol * scale;

    // 先判断是否在整个矩形范围内（含容差外扩）
    if (
      gx < left - tolScaled ||
      gx > right + tolScaled ||
      gy < top - tolScaled ||
      gy > bottom + tolScaled
    ) {
      return false;
    }

    // 在内部矩形之外 = 落在边框带上
    if (
      gx < left + tolScaled ||
      gx > right - tolScaled ||
      gy < top + tolScaled ||
      gy > bottom - tolScaled
    ) {
      return true;
    }

    // 落在内部区域
    return false;
  }

  var _origGetCellAt = graph.getCellAt;

  graph.getCellAt = function (x, y, parent, vertices, edges, ignoreFn) {
    if (overviewMode && parent != null && isDrawingFrame(parent)) {
      return null;
    }

    var result = _origGetCellAt.call(this, x, y, parent, vertices, edges, ignoreFn);

    // 非 Overview 模式：如果命中的是图框自身且点击不在边框上，则不选中
    if (!overviewMode && result != null && isDrawingFrame(result)) {
      var state = graph.view.getState(result);
      if (state != null) {
        var onBorder = isOnFrameBorder(state, x, y);
        console.log("[FrameHit] x=" + x + " y=" + y +
          " state=(" + state.x + "," + state.y + "," + state.width + "," + state.height + ")" +
          " scale=" + graph.view.scale + " onBorder=" + onBorder);
        if (!onBorder) {
          return null;
        }
      }
    }

    return result;
  };

  // ================================================================
  // 8. isCellVisible — Overview 模式隐藏孤儿顶层 vertex
  //    （不在任何图框内的零散 vertex；保留 edge 以显示跨框连线）
  // ================================================================
  var _origVisible = graph.isCellVisible;

  graph.isCellVisible = function (cell) {
    if (
      overviewMode &&
      isOrphanTopLevelCell(cell) &&
      !graph.getModel().isEdge(cell)
    ) {
      return false;
    }

    return _origVisible.call(this, cell);
  };

  // ================================================================
  // 9. getAllConnectionConstraints — Overview 模式抑制端口箭头
  // ================================================================
  var _origConstraints = graph.getAllConnectionConstraints;

  graph.getAllConnectionConstraints = function (terminal, source) {
    if (overviewMode) {
      return null;
    }

    return _origConstraints.call(this, terminal, source);
  };

  // ================================================================
  // 10. getSvg — 导出时临时全展开
  // ================================================================
  var _origGetSvg = graph.getSvg;

  if (typeof _origGetSvg === "function") {
    graph.getSvg = function () {
      var self = this;
      var outerArgs = arguments;

      return withAllFramesExpanded(function () {
        return _origGetSvg.apply(self, outerArgs);
      });
    };
  }

  // ================================================================
  // 事件监听
  // ================================================================
  var container = graph.container;

  container.addEventListener("scroll", function () {
    scheduleThrottledCulling(graph);
  });

  graph.view.addListener(mxEvent.SCALE, function () {
    scheduleThrottledCulling(graph);
  });

  graph.view.addListener(mxEvent.SCALE_AND_TRANSLATE, function () {
    scheduleThrottledCulling(graph);
  });

  graph.getModel().addListener(mxEvent.CHANGE, function () {
    for (var f of culledFrameSet) {
      if (f.parent == null) {
        culledFrameSet.delete(f);
      }
    }

    scheduleThrottledCulling(graph);
  });

  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(function () {
      scheduleThrottledCulling(graph);
    }).observe(container);
  }

  // 初始裁剪
  setTimeout(function () {
    debugLog("initial culling pass");
    runCullingPass(graph);
  }, INIT_DELAY_MS);
}
