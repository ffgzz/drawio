/**
 * 应用命令层。
 * 所有会直接改 graph/model 的命令统一收口到这里，UI 和 runtime 只调命令，不直接散写模型。
 */
import { getApp } from "../core/appRuntime.js";

function getDefaultParentChildren() {
  var app = getApp();
  var graph = app.ctx.graph;
  var model = app.ctx.model;
  var parent = graph.getDefaultParent();
  var cells = [];
  var i;

  for (i = 0; i < model.getChildCount(parent); i++) {
    cells.push(model.getChildAt(parent, i));
  }

  return cells;
}

function insertCellIntoFrame(cell, frame) {
  var app = getApp();
  var graph = app.ctx.graph;
  var insertPoint = app.domains.frame.getFrameChildInsertPoint(
    frame,
    cell.geometry != null ? cell.geometry.width : 0,
    cell.geometry != null ? cell.geometry.height : 0,
  );
  graph.setSelectionCells(graph.importCells([cell], insertPoint.x, insertPoint.y, frame));
  graph.scrollCellToVisible(graph.getSelectionCell());
}

export function insertIntoGraph(spec) {
  var app = getApp();
  var graph = app.ctx.graph;
  var root = app.domains.symbol.buildSymbolCell(spec);
  var frame = app.domains.frame.getActiveFrame(false);

  if (frame != null) {
    insertCellIntoFrame(root, frame);
  } else {
    var pt = graph.getFreeInsertPoint();
    graph.setSelectionCells(graph.importCells([root], pt.x, pt.y));
  }

  graph.scrollCellToVisible(graph.getSelectionCell());
  app.showStatus("已插入图元", false);
  app.setCanvasStatus("已插入图元");
}

export function refreshSelection() {
  var app = getApp();
  var graph = app.ctx.graph;
  var model = app.ctx.model;
  var state = app.ctx.state;
  var root = app.selection.getSelectedRoot();
  var cabinet = app.selection.getSelectedCabinetSegment();

  if (cabinet != null) {
    try {
      state.updatingModel = true;
      model.beginUpdate();
      app.domains.cabinet.relayoutCabinetByModel(
        app.domains.cabinet.extractCabinetModel(cabinet),
      );
      app.showStatus("配电柜已刷新", false);
      app.setCanvasStatus("配电柜已刷新");
    } catch (e) {
      app.showStatus(e.message || String(e), true);
      app.setCanvasStatus(e.message || String(e));
    } finally {
      model.endUpdate();
      state.updatingModel = false;
    }

    return;
  }

  if (root == null) {
    app.showStatus("请先选择一个电气图元", true);
    return;
  }

  state.updatingModel = true;
  model.beginUpdate();

  try {
    app.domains.symbol.refreshRoot(root);
  } catch (e) {
    app.showStatus(e.message || String(e), true);
    return;
  } finally {
    model.endUpdate();
    state.updatingModel = false;
  }

  app.showStatus("电气图元已刷新", false);
}

export function insertFrame(config, selectedFrame, existingFrames) {
  var app = getApp();
  var graph = app.ctx.graph;
  var model = app.ctx.model;
  var state = app.ctx.state;
  var constants = app.ctx.constants;
  var normalizedConfig = app.domains.frame.normalizeFrameConfig(config || {});
  var frames = Array.isArray(existingFrames)
    ? existingFrames
    : app.domains.frame.getAllDrawingFrames();
    var groupId =
      selectedFrame != null
        ? app.domains.frame.getFrameGroupId(selectedFrame)
        : app.helpers.generateFrameGroupId();
    var nextPageNumber =
      selectedFrame != null
        ? app.domains.frame.getMaxFramePageNumberInGroup(groupId) + 1
        : 1;
    var frame = app.domains.frame.createDrawingFrameCell(normalizedConfig, nextPageNumber, {
      groupId,
    });

  state.frameConfig = app.utils.cloneJson(normalizedConfig);

  if (selectedFrame != null) {
      var anchorFrame =
        app.domains.frame.getRightmostFrameInGroup(groupId) || selectedFrame;
      var anchorGeometry = model.getGeometry(anchorFrame);
      frame.geometry = frame.geometry.clone();
      frame.geometry.x =
        anchorGeometry.x +
        anchorGeometry.width +
        constants.FRAME_HORIZONTAL_GAP;
      frame.geometry.y = anchorGeometry.y;
      app.domains.frame.addTopLevelCell(frame);
      graph.setSelectionCell(frame);
  } else if (frames.length > 0) {
      var leftmostFrame = app.domains.frame.getLeftmostFrame();
      var bottommostFrame = app.domains.frame.getBottommostFrame();
      var leftGeometry =
        leftmostFrame != null ? model.getGeometry(leftmostFrame) : null;
      var bottomGeometry =
        bottommostFrame != null ? model.getGeometry(bottommostFrame) : null;
      frame.geometry = frame.geometry.clone();
      frame.geometry.x = leftGeometry != null ? leftGeometry.x : 0;
      frame.geometry.y =
        bottomGeometry != null
          ? bottomGeometry.y +
            bottomGeometry.height +
            constants.FRAME_VERTICAL_GAP
          : 0;
      app.domains.frame.addTopLevelCell(frame);
      graph.setSelectionCell(frame);
  } else {
      var point = graph.getFreeInsertPoint();
      graph.setSelectionCells(graph.importCells([frame], point.x, point.y));
  }

  graph.scrollCellToVisible(graph.getSelectionCell());
  app.showStatus("已插入图框", false);
  app.setCanvasStatus("已插入图框");
}

export function insertCabinet(cabinetModel) {
  var app = getApp();
  var graph = app.ctx.graph;
  var model = app.ctx.model;
  var state = app.ctx.state;
  state.updatingModel = true;
  model.beginUpdate();

  try {
    app.domains.cabinet.relayoutCabinetByModel(cabinetModel);
  } finally {
    model.endUpdate();
    state.updatingModel = false;
  }

  var segments = app.domains.cabinet.findCabinetSegments(cabinetModel.logicalCabinetId);

  if (segments.length > 0) {
    graph.setSelectionCell(segments[0]);
    graph.scrollCellToVisible(segments[0]);
  }

  app.showStatus("已插入配电柜", false);
  app.setCanvasStatus("已插入配电柜");
}

export function updateCabinetGap(cabinetModel) {
  var app = getApp();
  var model = app.ctx.model;
  var state = app.ctx.state;
  state.updatingModel = true;
  model.beginUpdate();

  try {
    app.domains.cabinet.relayoutCabinetByModel(cabinetModel);
  } finally {
    model.endUpdate();
    state.updatingModel = false;
  }

  app.showStatus("已更新端子间距", false);
  app.setCanvasStatus("已更新端子间距");
}

export function applyInstanceSpec(root, spec) {
  var app = getApp();
  var graph = app.ctx.graph;
  var model = app.ctx.model;
  var state = app.ctx.state;
  if (root == null || root.parent == null) {
    throw new Error("当前图元已不存在，无法应用修改");
  }

  state.updatingModel = true;
  model.beginUpdate();

  try {
    app.domains.symbol.syncRoot(root, spec, spec.ports);
    graph.setSelectionCell(root);
  } finally {
    model.endUpdate();
    state.updatingModel = false;
  }

  app.showStatus("已更新图元实例", false);
}

export function clearCurrentPage() {
  var app = getApp();
  var graph = app.ctx.graph;
  var state = app.ctx.state;
  var cells = getDefaultParentChildren();

  if (cells.length == 0) {
    app.showStatus("当前页面没有可清除的内容", false);
    return;
  }

  if (!mxUtils.confirm("确认清除当前页面所有内容？")) {
    return;
  }

  if (!mxUtils.confirm("此操作不可恢复，确定继续清除吗？")) {
    return;
  }

  if (app.ui != null && typeof app.ui.closeGapDialogWindow === "function") {
    app.ui.closeGapDialogWindow();
  }
  app.domains.cabinet.setSelectedCabinetGap(null, null);

  if (app.runtime != null && typeof app.runtime.exitPortSwapMode === "function") {
    app.runtime.exitPortSwapMode(false);
  }

  if (
    app.runtime != null &&
    typeof app.runtime.exitInstanceComposeMode === "function"
  ) {
    app.runtime.exitInstanceComposeMode(false);
  }

  state.allowProtectedDelete = true;

  try {
    graph.removeCells(cells, true);
    app.showStatus("已清空当前页面", false);
  } finally {
    state.allowProtectedDelete = false;
  }
}

export var commandApi = {
    applyInstanceSpec,
    clearCurrentPage,
    insertCabinet,
    insertFrame,
    insertIntoGraph,
    refreshSelection,
    updateCabinetGap,
};
