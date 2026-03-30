import { installTopActionBar } from "../ui/topActionBar.js";

var ACTION_ITEMS = [
  { resourceKey: "electricalSymbols", actionKey: "electricalSymbols" },
  { resourceKey: "electricalBrowse", actionKey: "electricalBrowse" },
  { resourceKey: "electricalCreate", actionKey: "electricalCreate" },
  {
    resourceKey: "electricalEditInstance",
    actionKey: "electricalEditInstance",
  },
  {
    resourceKey: "electricalComposeInstance",
    actionKey: "electricalComposeInstance",
  },
  {
    resourceKey: "electricalInsertFrame",
    actionKey: "electricalInsertFrame",
  },
  {
    resourceKey: "electricalInsertCabinet",
    actionKey: "electricalInsertCabinet",
  },
  { resourceKey: "electricalClearScreen", actionKey: "electricalClearScreen" },
  {
    resourceKey: "electricalReassignPort",
    actionKey: "electricalReassignPort",
  },
  { resourceKey: "electricalExportSvg", actionKey: "electricalExportSvg" },
  {
    resourceKey: "electricalSaveBackend",
    actionKey: "electricalSaveBackend",
  },
  {
    resourceKey: "electricalNewBackend",
    actionKey: "electricalNewBackend",
  },
  {
    resourceKey: "electricalLoadBackend",
    actionKey: "electricalLoadBackend",
  },
  {
    resourceKey: "electricalRollbackBackend",
    actionKey: "electricalRollbackBackend",
  },
];

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
  "electricalExportSvg",
  "electricalSaveBackend",
  "electricalNewBackend",
  "electricalLoadBackend",
  "electricalRollbackBackend",
];

export function createCanvasActions(deps) {
  var ctx = deps.ctx;
  var graph = ctx.graph;
  var model = ctx.model;
  var state = ctx.state;

  function getDefaultParentChildren() {
    var parent = graph.getDefaultParent();
    var cells = [];
    var i;

    for (i = 0; i < model.getChildCount(parent); i++) {
      cells.push(model.getChildAt(parent, i));
    }

    return cells;
  }

  function insertCellIntoFrame(cell, frame) {
    var insertPoint = deps.getFrameChildInsertPoint(
      frame,
      cell.geometry != null ? cell.geometry.width : 0,
      cell.geometry != null ? cell.geometry.height : 0,
    );
    graph.setSelectionCells(
      graph.importCells([cell], insertPoint.x, insertPoint.y, frame),
    );
    graph.scrollCellToVisible(graph.getSelectionCell());
  }

  function insertIntoGraph(spec) {
    var root = deps.buildSymbolCell(spec);
    var frame = deps.getActiveFrame(false);

    if (frame != null) {
      insertCellIntoFrame(root, frame);
    } else {
      var pt = graph.getFreeInsertPoint();
      graph.setSelectionCells(graph.importCells([root], pt.x, pt.y));
    }

    graph.scrollCellToVisible(graph.getSelectionCell());
    deps.showStatus("已插入图元", false);
    deps.setCanvasStatus("已插入图元");
  }

  function refreshSelection() {
    var root = deps.findElectricalRoot(graph.getSelectionCell());
    var cabinet = deps.findCabinetSegment(graph.getSelectionCell());

    if (cabinet != null) {
      try {
        state.updatingModel = true;
        model.beginUpdate();
        deps.relayoutCabinetByModel(deps.extractCabinetModel(cabinet));
        deps.showStatus("配电柜已刷新", false);
        deps.setCanvasStatus("配电柜已刷新");
      } catch (e) {
        deps.showStatus(e.message || String(e), true);
        deps.setCanvasStatus(e.message || String(e));
      } finally {
        model.endUpdate();
        state.updatingModel = false;
      }
      return;
    }

    if (root == null) {
      deps.showStatus("请先选择一个电气图元", true);
      return;
    }

    state.updatingModel = true;
    model.beginUpdate();

    try {
      deps.refreshRoot(root);
    } catch (e) {
      deps.showStatus(e.message || String(e), true);
      return;
    } finally {
      model.endUpdate();
      state.updatingModel = false;
    }

    deps.showStatus("电气图元已刷新", false);
  }

  function clearCurrentPage() {
    var cells = getDefaultParentChildren();

    if (cells.length == 0) {
      deps.showStatus("当前页面没有可清除的内容", false);
      return;
    }

    if (!mxUtils.confirm("确认清除当前页面所有内容？")) {
      return;
    }

    if (!mxUtils.confirm("此操作不可恢复，确定继续清除吗？")) {
      return;
    }

    deps.closeGapDialogWindow();
    deps.setSelectedCabinetGap(null, null);
    deps.exitPortSwapMode(false);
    deps.exitInstanceComposeMode(false);

    state.allowProtectedDelete = true;

    try {
      graph.removeCells(cells, true);
      deps.showStatus("已清空当前页面", false);
    } finally {
      state.allowProtectedDelete = false;
    }
  }

  return {
    clearCurrentPage: clearCurrentPage,
    insertIntoGraph: insertIntoGraph,
    refreshSelection: refreshSelection,
  };
}

export function installCanvasFeatures(deps) {
  var ctx = deps.ctx;
  var graph = ctx.graph;
  var model = ctx.model;
  var state = ctx.state;
  var ui = ctx.ui;
  var graphIsCellDeletable = graph.isCellDeletable;
  var graphIsCellMovable = graph.isCellMovable;
  var graphIsCellSelectable = graph.isCellSelectable;
  var graphSelectCellForEvent = graph.selectCellForEvent;
  var graphGetMovableCells = graph.getMovableCells;
  var menu = ui.menus.get("extras");
  var oldExtrasMenu = menu.funct;

  graph.isCellDeletable = function (cell) {
    if (deps.isDrawingFrame(cell)) {
      return !!state.allowProtectedDelete;
    }

    return graphIsCellDeletable.apply(this, arguments);
  };

  graph.isCellMovable = function (cell) {
    if (deps.isBlockedComposeTarget(cell) || deps.isLockedComposedChild(cell)) {
      return false;
    }

    return graphIsCellMovable.apply(this, arguments);
  };

  graph.isCellSelectable = function (cell) {
    if (deps.isBlockedComposeTarget(cell)) {
      return false;
    }

    return graphIsCellSelectable.apply(this, arguments);
  };

  graph.selectCellForEvent = function (cell) {
    if (deps.isBlockedComposeTarget(cell)) {
      return;
    }

    return graphSelectCellForEvent.apply(this, arguments);
  };

  graph.getMovableCells = function (cells) {
    var result = graphGetMovableCells.apply(this, arguments) || [];
    var filtered = [];
    var i;

    for (i = 0; i < result.length; i++) {
      if (!deps.isBlockedComposeTarget(result[i])) {
        filtered.push(result[i]);
      }
    }

    return filtered;
  };

  ui.actions.addAction("electricalSymbols", function () {
    deps.toggleWindow();
  });
  ui.actions.addAction("electricalBrowse", function () {
    deps.openTemplateBrowserDialog();
  });
  ui.actions.addAction("electricalCreate", function () {
    deps.openCreateFromLibraryDialog();
  });
  ui.actions.addAction("electricalEditInstance", function () {
    deps.openEditInstanceDialog();
  });
  ui.actions.addAction("electricalComposeInstance", function () {
    deps.enterInstanceComposeMode();
  });
  ui.actions.addAction("electricalInsertFrame", function () {
    deps.openInsertFrameDialog();
  });
  ui.actions.addAction("electricalInsertCabinet", function () {
    deps.openInsertCabinetDialog();
  });
  ui.actions.addAction("electricalReassignPort", function () {
    deps.enterPortSwapMode();
  });
  ui.actions.addAction("electricalRefresh", function () {
    deps.refreshSelection();
  });
  ui.actions.addAction("electricalExportSvg", function () {
    try {
      deps.openSvgExportDialog();
    } catch (e) {
      deps.showStatus(e.message || String(e), true);
    }
  });
  ui.actions.addAction("electricalSaveBackend", function () {
    try {
      deps.openBackendSaveDialog();
    } catch (e) {
      deps.showStatus(e.message || String(e), true);
    }
  });
  ui.actions.addAction("electricalNewBackend", function () {
    try {
      deps.resetBackendBinding();
      deps.showStatus("已新建后端图纸会话，下一次保存将创建新图纸", false);
    } catch (e) {
      deps.showStatus(e.message || String(e), true);
    }
  });
  ui.actions.addAction("electricalLoadBackend", function () {
    try {
      deps.openBackendLoadDialog();
    } catch (e) {
      deps.showStatus(e.message || String(e), true);
    }
  });
  ui.actions.addAction("electricalRollbackBackend", function () {
    try {
      deps.openBackendRollbackDialog();
    } catch (e) {
      deps.showStatus(e.message || String(e), true);
    }
  });
  ui.actions.addAction("electricalClearScreen", function () {
    try {
      deps.clearCurrentPage();
    } catch (e) {
      state.allowProtectedDelete = false;
      deps.showStatus(e.message || String(e), true);
    }
  });

  menu.funct = function (nextMenu, parent) {
    oldExtrasMenu.apply(this, arguments);
    ui.menus.addMenuItems(nextMenu, EXTRA_MENU_ACTIONS, parent);
  };

  installTopActionBar({
    ui: ui,
    createButton: deps.createButton,
    items: ACTION_ITEMS,
  });
  ui.addListener("languageChanged", function () {
    installTopActionBar({
      ui: ui,
      createButton: deps.createButton,
      items: ACTION_ITEMS,
    });
  });
  ui.addListener("currentThemeChanged", function () {
    installTopActionBar({
      ui: ui,
      createButton: deps.createButton,
      items: ACTION_ITEMS,
    });
  });

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

      if (deps.isBlockedComposeTarget(eventCell)) {
        deps.refreshInstanceComposeOverlay();
        return;
      }

      session.dragCandidates = deps.collectComposeDragCandidates(
        session.root,
        eventCell,
      );

      if (session.dragCandidates.length == 0) {
        deps.refreshInstanceComposeOverlay();
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
        deps.refreshInstanceComposeOverlay();
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
      deps.refreshInstanceComposeOverlay();
    },
  });
  mxEvent.addListener(
    graph.container,
    "scroll",
    deps.refreshInstanceComposeOverlay,
  );
  graph.view.addListener(mxEvent.SCALE, deps.refreshInstanceComposeOverlay);
  graph.view.addListener(
    mxEvent.SCALE_AND_TRANSLATE,
    deps.refreshInstanceComposeOverlay,
  );
  graph.view.addListener(
    mxEvent.TRANSLATE,
    deps.refreshInstanceComposeOverlay,
  );

  state.lastOperationSnapshot = deps.exportDiagramSnapshot();
  model.addListener(mxEvent.CHANGE, deps.recordCanvasOperation);
  model.addListener(mxEvent.CHANGE, deps.handleModelChange);
}
