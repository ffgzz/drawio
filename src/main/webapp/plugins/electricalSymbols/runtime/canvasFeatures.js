/**
 * 画布运行时行为。
 * 负责 action 注册、菜单注入、画布保护逻辑以及与组合模式相关的鼠标监听。
 */
// 顶部动作栏按钮顺序在这里集中维护。
import { actionApi } from "../application/actions.js";
import { isDrawingFrame } from "../core/runtimeHelpers.js";
import { composeModeApi } from "./composeMode.js";
import { modelSyncApi } from "./modelSync.js";
import { portSwapModeApi } from "./portSwapMode.js";
import { snapshotDomainApi } from "../domain/snapshot.js";
export var ACTION_ITEMS = [
  {
    resourceKey: "electricalComposeInstance",
    actionKey: "electricalComposeInstance",
  },
  {
    resourceKey: "electricalReassignPort",
    actionKey: "electricalReassignPort",
  },
];

// extras 菜单也复用同一批 action，只是多了刷新项。
var EXTRA_MENU_ACTIONS = [
  "-",
  "electricalSymbols",
  "electricalBrowse",
  "electricalCreate",
  "electricalEditInstance",
  "electricalComposeInstance",
  "electricalInsertFrame",
  "electricalInsertCabinet",
  "electricalClearScreen",
  "electricalReassignPort",
  "electricalRefresh",
  "electricalExport",
  "electricalSaveBackend",
  "electricalNewBackend",
  "electricalLoadBackend",
  "electricalRollbackBackend",
];

// installCanvasFeatures 负责把所有 action 和 hook 真正挂到 draw.io 上。
export function installCanvasFeatures(ctx) {
  var graph = ctx.graph;
  var model = ctx.model;
  var state = ctx.state;
  var ui = ctx.ui;
  var actions = actionApi;
  var graphIsCellDeletable = graph.isCellDeletable;
  var graphIsCellMovable = graph.isCellMovable;
  var graphIsCellSelectable = graph.isCellSelectable;
  var graphSelectCellForEvent = graph.selectCellForEvent;
  var graphGetMovableCells = graph.getMovableCells;
  var menu = ui.menus.get("extras");
  var oldExtrasMenu = menu.funct;

  graph.isCellDeletable = function (cell) {
    if (isDrawingFrame(cell)) {
      return !!state.allowProtectedDelete;
    }

    return graphIsCellDeletable.apply(this, arguments);
  };

  graph.isCellMovable = function (cell) {
    if (
      composeModeApi.isBlockedComposeTarget(cell) ||
      composeModeApi.isLockedComposedChild(cell)
    ) {
      return false;
    }

    return graphIsCellMovable.apply(this, arguments);
  };

  graph.isCellSelectable = function (cell) {
    if (composeModeApi.isBlockedComposeTarget(cell)) {
      return false;
    }

    return graphIsCellSelectable.apply(this, arguments);
  };

  graph.selectCellForEvent = function (cell) {
    if (composeModeApi.isBlockedComposeTarget(cell)) {
      return;
    }

    return graphSelectCellForEvent.apply(this, arguments);
  };

  graph.getMovableCells = function (cells) {
    var result = graphGetMovableCells.apply(this, arguments) || [];
    var filtered = [];
    var i;

    for (i = 0; i < result.length; i++) {
      if (!composeModeApi.isBlockedComposeTarget(result[i])) {
        filtered.push(result[i]);
      }
    }

    return filtered;
  };

  ui.actions.addAction("electricalSymbols", actions.electricalSymbols);
  ui.actions.addAction("electricalBrowse", actions.electricalBrowse);
  ui.actions.addAction("electricalCreate", actions.electricalCreate);
  ui.actions.addAction("electricalEditInstance", actions.electricalEditInstance);
  ui.actions.addAction(
    "electricalComposeInstance",
    actions.electricalComposeInstance,
  );
  ui.actions.addAction("electricalExport", actions.electricalExport);
  ui.actions.addAction("electricalInsertFrame", actions.electricalInsertFrame);
  ui.actions.addAction(
    "electricalInsertCabinet",
    actions.electricalInsertCabinet,
  );
  ui.actions.addAction("electricalReassignPort", actions.electricalReassignPort);
  ui.actions.addAction("electricalRefresh", actions.electricalRefresh);
  ui.actions.addAction("electricalExportSvg", actions.electricalExportSvg);
  ui.actions.addAction("electricalSaveBackend", actions.electricalSaveBackend);
  ui.actions.addAction("electricalNewBackend", actions.electricalNewBackend);
  ui.actions.addAction("electricalLoadBackend", actions.electricalLoadBackend);
  ui.actions.addAction(
    "electricalRollbackBackend",
    actions.electricalRollbackBackend,
  );
  ui.actions.addAction("electricalClearScreen", actions.electricalClearScreen);

  menu.funct = function (nextMenu, parent) {
    oldExtrasMenu.apply(this, arguments);
    ui.menus.addMenuItems(nextMenu, EXTRA_MENU_ACTIONS, parent);
  };

  graph.addMouseListener({
    mouseDown: function (sender, me) {
      var session = state.instanceComposeSession;
      var eventCell;

      if (session == null) {
        return;
      }

      eventCell = me.getCell();
      session.pointerDown = false;
      session.dragging = false;
      session.startPoint = null;
      session.dragCandidates = [];

      if (composeModeApi.isBlockedComposeTarget(eventCell)) {
        composeModeApi.refreshInstanceComposeOverlay();
        return;
      }

      session.dragCandidates = composeModeApi.collectComposeDragCandidates(
        session.root,
        eventCell,
      );

      if (session.dragCandidates.length == 0) {
        composeModeApi.refreshInstanceComposeOverlay();
        return;
      }

      session.pointerDown = true;
      session.startPoint = {
        x: me.getGraphX(),
        y: me.getGraphY(),
      };
    },
    mouseMove: function (sender, me) {
      var session = state.instanceComposeSession;
      var dx;
      var dy;

      if (
        session == null ||
        !session.pointerDown ||
        session.startPoint == null ||
        session.dragCandidates.length == 0
      ) {
        return;
      }

      dx = Math.abs(me.getGraphX() - session.startPoint.x);
      dy = Math.abs(me.getGraphY() - session.startPoint.y);

      if (dx > 2 || dy > 2) {
        session.dragging = true;
        composeModeApi.refreshInstanceComposeOverlay();
      }
    },
    mouseUp: function () {
      var session = state.instanceComposeSession;

      if (session == null) {
        return;
      }

      session.pointerDown = false;
      session.dragging = false;
      session.startPoint = null;
      session.dragCandidates = [];
      composeModeApi.refreshInstanceComposeOverlay();
    },
  });
  mxEvent.addListener(
    graph.container,
    "scroll",
    composeModeApi.refreshInstanceComposeOverlay,
  );
  graph.view.addListener(mxEvent.SCALE, composeModeApi.refreshInstanceComposeOverlay);
  graph.view.addListener(
    mxEvent.SCALE_AND_TRANSLATE,
    composeModeApi.refreshInstanceComposeOverlay,
  );
  graph.view.addListener(
    mxEvent.TRANSLATE,
    composeModeApi.refreshInstanceComposeOverlay,
  );

  state.lastOperationSnapshot = snapshotDomainApi.exportDiagramSnapshot();
  model.addListener(mxEvent.CHANGE, modelSyncApi.recordCanvasOperation);
  model.addListener(mxEvent.CHANGE, modelSyncApi.handleModelChange);
}
