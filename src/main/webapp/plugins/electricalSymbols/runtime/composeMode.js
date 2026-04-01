/**
 * 组合模式运行时。
 * 负责绿色组合区域 overlay、拖拽候选筛选和最终挂接到 root 的过程。
 */
// 组合模式本质上是一个短生命周期的画布交互会话。
import { getApp } from "../core/appRuntime.js";
import { clamp, trim } from "../utils/base.js";
import { cabinetDialogsApi } from "../ui/cabinetDialog.js";
import { portSwapModeApi } from "./portSwapMode.js";
import { snapshotDomainApi } from "../domain/snapshot.js";
import {
  findElectricalRoot,
  isCabinetGap,
  isCabinetSegment,
  isDrawingFrame,
  isElectricalRoot,
  setCanvasStatus,
  showStatus,
} from "../core/runtimeHelpers.js";

function getComposeDeps() {
  var app = getApp();
  var ctx = app.ctx;

  return {
    ctx,
    trim,
    clamp,
    padding: ctx.constants.INSTANCE_COMPOSE_ZONE_PADDING,
    minWidth: ctx.constants.INSTANCE_COMPOSE_ZONE_MIN_WIDTH,
    minHeight: ctx.constants.INSTANCE_COMPOSE_ZONE_MIN_HEIGHT,
    showStatus,
    setCanvasStatus,
    closeGapDialogWindow: function () {
      return cabinetDialogsApi.closeGapDialogWindow();
    },
    exitPortSwapMode: function (clearStatus) {
      return portSwapModeApi.exitPortSwapMode(clearStatus);
    },
    isDrawingFrame,
    isCabinetSegment,
    isCabinetGap,
    isPluginInternalCell: snapshotDomainApi.isPluginInternalCell,
    isElectricalRoot,
    shouldExportGenericObject: snapshotDomainApi.shouldExportGenericObject,
    findElectricalRoot,
  };
}

function getComposeRuntime() {
  var deps = getComposeDeps();
  var ctx = deps.ctx;

  return {
    deps,
    graph: ctx.graph,
    model: ctx.model,
    state: ctx.state,
  };
}

function isCellDescendantOf(cell, ancestor) {
  var model = getComposeRuntime().model;

  while (cell != null) {
    if (cell == ancestor) {
      return true;
    }

    cell = model.getParent(cell);
  }

  return false;
}

function getCellViewBounds(cell) {
  var graph = getComposeRuntime().graph;
  var stateView = graph.view.getState(cell);

  if (stateView == null) {
    return null;
  }

  return {
    x: stateView.x,
    y: stateView.y,
    width: stateView.width,
    height: stateView.height,
  };
}

function getCellModelBounds(cell) {
  var runtime = getComposeRuntime();
  var graph = runtime.graph;
  var model = runtime.model;
  var stateView = graph.view.getState(cell);
  var scale = graph.view.scale || 1;
  var translate = graph.view.translate || { x: 0, y: 0 };

  if (stateView != null) {
    return {
      x: stateView.x / scale - translate.x,
      y: stateView.y / scale - translate.y,
      width: stateView.width / scale,
      height: stateView.height / scale,
    };
  }

  var geometry = model.getGeometry(cell);

  if (geometry == null) {
    return null;
  }

  return {
    x: geometry.x,
    y: geometry.y,
    width: geometry.width,
    height: geometry.height,
  };
}

function getUnionViewBounds(cells) {
  var bounds = null;
  var i;

  for (i = 0; i < cells.length; i++) {
    var cellBounds = getCellViewBounds(cells[i]);

    if (cellBounds == null) {
      continue;
    }

    if (bounds == null) {
      bounds = {
        x: cellBounds.x,
        y: cellBounds.y,
        width: cellBounds.width,
        height: cellBounds.height,
      };
    } else {
      var right = Math.max(
        bounds.x + bounds.width,
        cellBounds.x + cellBounds.width,
      );
      var bottom = Math.max(
        bounds.y + bounds.height,
        cellBounds.y + cellBounds.height,
      );
      bounds.x = Math.min(bounds.x, cellBounds.x);
      bounds.y = Math.min(bounds.y, cellBounds.y);
      bounds.width = right - bounds.x;
      bounds.height = bottom - bounds.y;
    }
  }

  return bounds;
}

function getInstanceComposeZoneBounds(root, extraCells) {
  var runtime = getComposeRuntime();
  var deps = runtime.deps;
  var graph = runtime.graph;
  var candidates = [root];
  var bounds;
  var container = graph.container;
  var scrollLeft = container.scrollLeft;
  var scrollTop = container.scrollTop;
  var viewportLeft = scrollLeft + 20;
  var viewportTop = scrollTop + 20;
  var viewportRight = scrollLeft + container.clientWidth - 20;
  var viewportBottom = scrollTop + container.clientHeight - 20;
  var width;
  var height;
  var left;
  var top;
  var maxLeft;
  var maxTop;

  if (Array.isArray(extraCells) && extraCells.length > 0) {
    candidates = candidates.concat(extraCells);
  }

  bounds = getUnionViewBounds(candidates);

  if (bounds == null) {
    return null;
  }

  width = Math.max(deps.minWidth, bounds.width + deps.padding * 2);
  height = Math.max(deps.minHeight, bounds.height + deps.padding * 2);
  left = bounds.x + (bounds.width - width) / 2;
  top = bounds.y + (bounds.height - height) / 2;
  maxLeft = Math.max(viewportLeft, viewportRight - width);
  maxTop = Math.max(viewportTop, viewportBottom - height);

  return {
    left: deps.clamp(Math.round(left), viewportLeft, maxLeft),
    top: deps.clamp(Math.round(top), viewportTop, maxTop),
    width: Math.round(Math.min(width, viewportRight - viewportLeft)),
    height: Math.round(Math.min(height, viewportBottom - viewportTop)),
  };
}

function clearInstanceComposeOverlay() {
  var state = getComposeRuntime().state;

  if (
    state.instanceComposeOverlay != null &&
    state.instanceComposeOverlay.parentNode != null
  ) {
    state.instanceComposeOverlay.parentNode.removeChild(
      state.instanceComposeOverlay,
    );
  }

  state.instanceComposeOverlay = null;
}

function completeInstanceComposeMode() {
  var runtime = getComposeRuntime();
  var deps = runtime.deps;
  var graph = runtime.graph;
  var state = runtime.state;
  var session = state.instanceComposeSession;
  var root;
  var candidates;
  var matched = [];
  var attached;
  var i;

  if (session == null) {
    return;
  }

  root = session.root;

  if (root == null || root.parent == null) {
    exitInstanceComposeMode();
    return;
  }

  candidates = collectComposableCellsInZone(root, session.zoneBounds);

  for (i = 0; i < candidates.length; i++) {
    if (!session.initialZoneCellIds[candidates[i].id]) {
      matched.push(candidates[i]);
    }
  }

  if (matched.length == 0) {
    deps.showStatus("绿色区域内没有新的可组合图元", true);
    return;
  }

  attached = attachCellsToElectricalRoot(root, matched);

  if (attached.length == 0) {
    deps.showStatus("没有检测到可组合的图元", true);
    return;
  }

  exitInstanceComposeMode(false);
  graph.setSelectionCell(root);
  deps.showStatus("已组合到当前图元实例", false);
  deps.setCanvasStatus("");
}

function renderInstanceComposeOverlay(session) {
  var runtime = getComposeRuntime();
  var deps = runtime.deps;
  var graph = runtime.graph;
  var state = runtime.state;
  var containerRect = graph.container.getBoundingClientRect();
  var zone = getInstanceComposeZoneBounds(
    session.root,
    session.dragging ? session.dragCandidates : null,
  );
  var scrollLeft = graph.container.scrollLeft || 0;
  var scrollTop = graph.container.scrollTop || 0;
  var container = document.createElement("div");
  var shade = document.createElement("div");
  var zoneNode = document.createElement("div");
  var hint = document.createElement("div");
  var actions = document.createElement("div");
  var completeButton = document.createElement("button");
  var cancelButton = document.createElement("button");
  var controlsTop;

  clearInstanceComposeOverlay();

  if (zone == null) {
    return;
  }

  session.zoneBounds = zone;

  container.style.position = "fixed";
  container.style.left = Math.round(containerRect.left) + "px";
  container.style.top = Math.round(containerRect.top) + "px";
  container.style.width = graph.container.clientWidth + "px";
  container.style.height = graph.container.clientHeight + "px";
  container.style.pointerEvents = "none";
  container.style.zIndex = "3";

  shade.style.position = "absolute";
  shade.style.left = "0";
  shade.style.top = "0";
  shade.style.width = "100%";
  shade.style.height = "100%";
  shade.style.background = "rgba(15, 23, 42, 0.18)";
  container.appendChild(shade);

  zoneNode.style.position = "absolute";
  zoneNode.style.left = zone.left - scrollLeft + "px";
  zoneNode.style.top = zone.top - scrollTop + "px";
  zoneNode.style.width = zone.width + "px";
  zoneNode.style.height = zone.height + "px";
  zoneNode.style.border = "3px solid #16a34a";
  zoneNode.style.borderRadius = "10px";
  zoneNode.style.background = "rgba(22,163,74,0.06)";
  zoneNode.style.boxSizing = "border-box";
  zoneNode.style.backdropFilter = "none";
  container.appendChild(zoneNode);

  hint.style.position = "absolute";
  hint.style.left = zone.left - scrollLeft + "px";
  hint.style.top = Math.max(8, zone.top - 28 - scrollTop) + "px";
  hint.style.padding = "4px 10px";
  hint.style.maxWidth = Math.max(120, zone.width - 176) + "px";
  hint.style.borderRadius = "6px";
  hint.style.background = "rgba(22,163,74,0.92)";
  hint.style.color = "#ffffff";
  hint.style.fontSize = "12px";
  hint.style.fontWeight = "bold";
  hint.style.whiteSpace = "nowrap";
  hint.style.overflow = "hidden";
  hint.style.textOverflow = "ellipsis";
  hint.innerText = "拖入绿色区域即可组合到当前图元实例";
  container.appendChild(hint);

  controlsTop = Math.max(8, zone.top - 30 - scrollTop);
  actions.style.position = "absolute";
  actions.style.right =
    Math.max(
      8,
      graph.container.clientWidth - (zone.left + zone.width - scrollLeft),
    ) + "px";
  actions.style.top = controlsTop + "px";
  actions.style.display = "flex";
  actions.style.gap = "8px";
  actions.style.pointerEvents = "auto";

  completeButton.type = "button";
  completeButton.innerText = "完成";
  completeButton.style.height = "28px";
  completeButton.style.padding = "0 14px";
  completeButton.style.border = "1px solid #16a34a";
  completeButton.style.borderRadius = "6px";
  completeButton.style.background = "#16a34a";
  completeButton.style.color = "#ffffff";
  completeButton.style.cursor = "pointer";
  mxEvent.addListener(completeButton, "click", function (evt) {
    mxEvent.consume(evt);
    completeInstanceComposeMode();
  });
  actions.appendChild(completeButton);

  cancelButton.type = "button";
  cancelButton.innerText = "取消";
  cancelButton.style.height = "28px";
  cancelButton.style.padding = "0 14px";
  cancelButton.style.border = "1px solid #cbd5e1";
  cancelButton.style.borderRadius = "6px";
  cancelButton.style.background = "#ffffff";
  cancelButton.style.color = "#334155";
  cancelButton.style.cursor = "pointer";
  mxEvent.addListener(cancelButton, "click", function (evt) {
    mxEvent.consume(evt);
    exitInstanceComposeMode();
  });
  actions.appendChild(cancelButton);

  container.appendChild(actions);

  document.body.appendChild(container);
  state.instanceComposeOverlay = container;
}

export function refreshInstanceComposeOverlay() {
  var state = getComposeRuntime().state;

  if (state.instanceComposeSession == null) {
    return;
  }

  renderInstanceComposeOverlay(state.instanceComposeSession);
}

export function exitInstanceComposeMode(clearStatus) {
  var runtime = getComposeRuntime();
  var deps = runtime.deps;
  var state = runtime.state;

  clearInstanceComposeOverlay();
  state.instanceComposeSession = null;

  if (state.instanceComposeKeyHandler != null) {
    mxEvent.removeListener(
      document,
      "keydown",
      state.instanceComposeKeyHandler,
    );
    state.instanceComposeKeyHandler = null;
  }

  if (clearStatus !== false) {
    deps.setCanvasStatus("");
  }
}

function findOwningElectricalRoot(cell) {
  var runtime = getComposeRuntime();
  var deps = runtime.deps;
  var model = runtime.model;
  var current = cell;

  while (current != null) {
    if (deps.isElectricalRoot(current)) {
      return current;
    }

    current = model.getParent(current);
  }

  return null;
}

export function isBlockedComposeTarget(cell) {
  var runtime = getComposeRuntime();
  var deps = runtime.deps;
  var state = runtime.state;
  var session = state.instanceComposeSession;
  var ownerRoot;

  if (session == null || session.root == null || cell == null) {
    return false;
  }

  if (cell == session.root) {
    return true;
  }

  ownerRoot = findOwningElectricalRoot(cell);

  return ownerRoot == session.root && deps.isPluginInternalCell(cell);
}

export function isLockedComposedChild(cell) {
  var runtime = getComposeRuntime();
  var deps = runtime.deps;
  var model = runtime.model;
  var state = runtime.state;
  var composeSession = state.instanceComposeSession;

  if (cell == null || deps.isDrawingFrame(cell) || deps.isCabinetSegment(cell)) {
    return false;
  }

  var ownerRoot = findOwningElectricalRoot(model.getParent(cell));

  if (ownerRoot == null) {
    return false;
  }

  if (composeSession != null && composeSession.root == ownerRoot) {
    return false;
  }

  return true;
}

function isComposableCandidateCell(cell, root) {
  var runtime = getComposeRuntime();
  var deps = runtime.deps;
  var model = runtime.model;

  return (
    cell != null &&
    !model.isEdge(cell) &&
    !deps.isDrawingFrame(cell) &&
    !deps.isCabinetSegment(cell) &&
    !deps.isCabinetGap(cell) &&
    !deps.isPluginInternalCell(cell) &&
    cell != root &&
    !isCellDescendantOf(cell, root) &&
    (deps.isElectricalRoot(cell) || deps.shouldExportGenericObject(cell))
  );
}

function filterTopLevelSelection(cells) {
  var result = [];
  var i;
  var j;
  var nested;

  for (i = 0; i < cells.length; i++) {
    nested = false;

    for (j = 0; j < cells.length; j++) {
      if (i != j && isCellDescendantOf(cells[i], cells[j])) {
        nested = true;
        break;
      }
    }

    if (!nested) {
      result.push(cells[i]);
    }
  }

  return result;
}

function collectComposableSelection(root) {
  var graph = getComposeRuntime().graph;
  var selection = graph.getSelectionCells();
  var candidates = [];
  var i;

  for (i = 0; i < selection.length; i++) {
    if (isComposableCandidateCell(selection[i], root)) {
      candidates.push(selection[i]);
    }
  }

  return filterTopLevelSelection(candidates);
}

export function collectComposeDragCandidates(root, eventCell) {
  var candidates = collectComposableSelection(root);

  if (candidates.length == 0 && isComposableCandidateCell(eventCell, root)) {
    candidates = [eventCell];
  }

  return filterTopLevelSelection(candidates);
}

function collectComposableCells(root) {
  var model = getComposeRuntime().model;
  var cells = model.cells || {};
  var result = [];
  var id;
  var cell;

  for (id in cells) {
    if (!Object.prototype.hasOwnProperty.call(cells, id)) {
      continue;
    }

    cell = cells[id];

    if (isComposableCandidateCell(cell, root)) {
      result.push(cell);
    }
  }

  return filterTopLevelSelection(result);
}

function intersectsComposeZone(cell, zone) {
  var bounds = getCellViewBounds(cell);

  if (bounds == null || zone == null) {
    return false;
  }

  return !(
    bounds.x + bounds.width < zone.left ||
    bounds.x > zone.left + zone.width ||
    bounds.y + bounds.height < zone.top ||
    bounds.y > zone.top + zone.height
  );
}

function collectComposableCellsInZone(root, zone) {
  var candidates = collectComposableCells(root);
  var result = [];
  var i;

  for (i = 0; i < candidates.length; i++) {
    if (intersectsComposeZone(candidates[i], zone)) {
      result.push(candidates[i]);
    }
  }

  return result;
}

function toCellIdMap(cells) {
  var trim = getComposeRuntime().deps.trim;
  var map = {};
  var i;

  for (i = 0; i < cells.length; i++) {
    if (cells[i] != null && trim(cells[i].id).length > 0) {
      map[cells[i].id] = true;
    }
  }

  return map;
}

function attachCellsToElectricalRoot(root, cells) {
  var runtime = getComposeRuntime();
  var model = runtime.model;
  var state = runtime.state;
  var rootBounds = getCellModelBounds(root);
  var attached = [];
  var i;

  if (rootBounds == null) {
    throw new Error("当前目标图元无法计算位置，不能执行组合");
  }

  state.updatingModel = true;
  model.beginUpdate();

  try {
    for (i = 0; i < cells.length; i++) {
      var cell = cells[i];
      var geometry = model.getGeometry(cell);
      var cellBounds = getCellModelBounds(cell);

      if (
        geometry == null ||
        cellBounds == null ||
        model.getParent(cell) == root
      ) {
        continue;
      }

      geometry = geometry.clone();
      geometry.relative = false;
      geometry.x = cellBounds.x - rootBounds.x;
      geometry.y = cellBounds.y - rootBounds.y;
      model.add(root, cell, model.getChildCount(root));
      model.setGeometry(cell, geometry);
      attached.push(cell);
    }
  } finally {
    model.endUpdate();
    state.updatingModel = false;
  }

  return attached;
}

export function enterInstanceComposeMode() {
  var runtime = getComposeRuntime();
  var deps = runtime.deps;
  var graph = runtime.graph;
  var state = runtime.state;

  if (state.instanceComposeSession != null) {
    exitInstanceComposeMode();
    return;
  }

  var root = deps.findElectricalRoot(graph.getSelectionCell());

  if (root == null) {
    deps.showStatus("请先选中一个自定义图元实例，再执行组合图元实例", true);
    deps.setCanvasStatus("请先选中一个自定义图元实例，再执行组合图元实例");
    return;
  }

  state.instanceComposeSession = {
    root,
    pointerDown: false,
    dragging: false,
    startPoint: null,
    dragCandidates: [],
    zoneBounds: null,
    initialZoneCellIds: {},
  };
  deps.closeGapDialogWindow();
  deps.exitPortSwapMode(false);
  graph.clearSelection();

  if (
    graph.selectionCellsHandler != null &&
    typeof graph.selectionCellsHandler.clear === "function"
  ) {
    graph.selectionCellsHandler.clear();
  }

  refreshInstanceComposeOverlay();
  state.instanceComposeSession.initialZoneCellIds = toCellIdMap(
    collectComposableCellsInZone(
      root,
      state.instanceComposeSession.zoneBounds,
    ),
  );
  deps.setCanvasStatus(
    "组合模式：把普通图元或自定义图元拖入绿色区域，然后点击完成",
  );

  state.instanceComposeKeyHandler = function (evt) {
    if (evt.key == "Escape") {
      exitInstanceComposeMode();
    }
  };
  mxEvent.addListener(document, "keydown", state.instanceComposeKeyHandler);
}

export var composeModeApi = {
  collectComposeDragCandidates,
  enterInstanceComposeMode,
  exitInstanceComposeMode,
  isBlockedComposeTarget,
  isLockedComposedChild,
  refreshInstanceComposeOverlay,
};
