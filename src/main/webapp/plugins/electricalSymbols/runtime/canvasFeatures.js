/**
 * 画布运行时行为。
 * 负责 action 注册、菜单注入、画布保护逻辑以及与组合模式相关的鼠标监听。
 */
// 顶部动作栏按钮顺序在这里集中维护。
import { actionApi } from "../application/actions.js";
import {
  findElectricalRoot,
  isCabinetBlock,
  isCabinetSegment,
  isCabinetSwitchLink,
  isDrawingFrame,
  isElectricalRoot,
  isPluginInternalCell,
} from "../core/runtimeHelpers.js";
import { cabinetDomainApi } from "../domain/cabinet.js";
import { commandApi } from "../application/commands.js";
import { switchPickerApi } from "../ui/switchPickerDialog.js";
import { getAttr } from "../utils/xml.js";
import { trim } from "../utils/base.js";
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
  {
    resourceKey: "electricalForceDelete",
    actionKey: "electricalForceDelete",
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
  "electricalForceDelete",
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
  var graphIsCellResizable = graph.isCellResizable;
  var graphIsCellSelectable = graph.isCellSelectable;
  var graphSelectCellForEvent = graph.selectCellForEvent;
  var graphGetMovableCells = graph.getMovableCells;
  var menu = ui.menus.get("extras");
  var oldExtrasMenu = menu.funct;

  function isCabinetBoundSwitchCell(cell) {
    var root = isElectricalRoot(cell) ? cell : findElectricalRoot(cell);

    return (
      root != null && cabinetDomainApi.isSwitchBoundToCabinet(root)
    );
  }

  graph.isCellDeletable = function (cell) {
    // 配电柜段与图框同级保护：既然不允许单独复制，也不允许被 Delete / Ctrl+X 删掉。
    // 插件自身的清屏、快照恢复会先置 state.allowProtectedDelete = true，
    // 配电柜重排走的是 model.remove，都不受这里影响。
    if (
      isDrawingFrame(cell) ||
      isCabinetSegment(cell) ||
      isPluginInternalCell(cell) ||
      isCabinetBoundSwitchCell(cell)
    ) {
      return !!state.allowProtectedDelete;
    }

    return graphIsCellDeletable.apply(this, arguments);
  };

  // draw.io 的 cut action 有两条路径：
  //   路径 1: ui.copyXml() 成功 → graph.removeCells(cells, false)  — 传了显式 cells
  //   路径 2: copyXml 返回 null → mxClipboard.cut → mxClipboard.removeCells
  // 原生 graph.removeCells 只在 cells==null 时调 getDeletableCells 过滤，
  // 传了显式 cells 就跳过过滤。这里统一拦截 graph.removeCells，
  // 当有显式 cells 且非 allowProtectedDelete 时，先过滤不可删除的元素。
  var _origRemoveCells = graph.removeCells;

  graph.removeCells = function (cells, includeEdges) {
    if (cells != null && !state.allowProtectedDelete) {
      cells = this.getDeletableCells(cells);

      if (cells.length === 0) {
        return [];
      }
    }

    return _origRemoveCells.call(this, cells, includeEdges);
  };

  graph.isCellMovable = function (cell) {
    if (
      isCabinetBoundSwitchCell(cell) ||
      composeModeApi.isBlockedComposeTarget(cell) ||
      composeModeApi.isLockedComposedChild(cell)
    ) {
      return false;
    }

    return graphIsCellMovable.apply(this, arguments);
  };

  graph.isCellResizable = function (cell) {
    if (isCabinetBoundSwitchCell(cell)) {
      return false;
    }

    if (isElectricalRoot(cell)) {
      return true;
    }

    // 块可以纵向拉高，柜体可以横向拉宽；具体只取哪个维度在 cellsResized 里裁定
    if (isCabinetBlock(cell) || isCabinetSegment(cell)) {
      return true;
    }

    if (isPluginInternalCell(cell)) {
      return false;
    }

    return graphIsCellResizable.apply(this, arguments);
  };

  // 配电柜的尺寸不直接落在几何上：块只收高度、柜体只收宽度，写回模型后整体重排。
  // 这样"柜高 = 各块高度之和""所有块共享柜宽"这两条不变式永远成立。
  var _origCellsResized = graph.cellsResized;

  graph.cellsResized = function (cells, bounds, recurse) {
    if (!Array.isArray(cells) || cells.length === 0) {
      return _origCellsResized.apply(this, arguments);
    }

    var passthroughCells = [];
    var passthroughBounds = [];
    var cabinetEdits = [];
    var i;

    for (i = 0; i < cells.length; i++) {
      var cell = cells[i];
      var bound = bounds != null ? bounds[i] : null;

      if (bound != null && isCabinetBlock(cell)) {
        cabinetEdits.push({ kind: "blockHeight", cell: cell, value: bound.height });
      } else if (bound != null && isCabinetSegment(cell)) {
        cabinetEdits.push({ kind: "cabinetWidth", cell: cell, value: bound.width });
      } else {
        passthroughCells.push(cell);
        passthroughBounds.push(bound);
      }
    }

    if (cabinetEdits.length === 0) {
      return _origCellsResized.apply(this, arguments);
    }

    var result;

    model.beginUpdate();

    try {
      if (passthroughCells.length > 0) {
        result = _origCellsResized.call(this, passthroughCells, passthroughBounds, recurse);
      }

      for (i = 0; i < cabinetEdits.length; i++) {
        var edit = cabinetEdits[i];

        if (edit.kind === "blockHeight") {
          cabinetDomainApi.applyCabinetBlockHeight(edit.cell, edit.value);
        } else {
          cabinetDomainApi.applyCabinetWidth(edit.cell, edit.value);
        }
      }
    } finally {
      model.endUpdate();
    }

    return result;
  };

  graph.isCellSelectable = function (cell) {
    if (composeModeApi.isBlockedComposeTarget(cell)) {
      return false;
    }

    // 托管连线不绘制，但 drawio 仍按路径做命中测试；样式里的 selectable=0
    // 对 drawio 无效（它的 isCellSelectable 只看图层锁定），必须在这里挡掉。
    if (isCabinetSwitchLink(cell)) {
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
      if (
        !isCabinetBoundSwitchCell(result[i]) &&
        !composeModeApi.isBlockedComposeTarget(result[i])
      ) {
        filtered.push(result[i]);
      }
    }

    return filtered;
  };

  // 配电柜块的右键菜单：开关的绑定/更换/解除都从这里走
  var _origCreatePopupMenu = ui.menus.createPopupMenu;

  ui.menus.createPopupMenu = function (menu, cell, evt) {
    var result = _origCreatePopupMenu.apply(this, arguments);
    var target =
      graph.getSelectionCount() === 1 ? graph.getSelectionCell() : cell;

    if (isCabinetBlock(target)) {
      addCabinetBlockMenuItems(menu, target, evt);
    }

    return result;
  };

  function addCabinetBlockMenuItems(menu, blockCell, evt) {
    var bound = trim(getAttr(blockCell, "switchInstanceId")).length > 0;

    menu.addSeparator();

    if (!bound) {
      menu.addItem("绑定开关…", null, function () {
        switchPickerApi.openSwitchPickerDialog(blockCell, evt);
      });
      return;
    }

    menu.addItem("更换开关…", null, function () {
      switchPickerApi.openSwitchPickerDialog(blockCell, evt);
    });
    menu.addItem("解除绑定（保留开关）", null, function () {
      commandApi.unbindCabinetSwitch(blockCell, false);
    });
    menu.addItem("删除开关", null, function () {
      commandApi.unbindCabinetSwitch(blockCell, true);
    });
  }

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
  ui.actions.addAction("electricalForceDelete", actions.electricalForceDelete);

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
