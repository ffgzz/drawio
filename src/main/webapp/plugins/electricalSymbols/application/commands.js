/**
 * 应用命令层。
 * 所有会直接改 graph/model 的命令统一收口到这里，UI 和 runtime 只调命令，不直接散写模型。
 */
import { getApp } from "../core/appRuntime.js";
import { cloneJson } from "../utils/base.js";
import {
  generateFrameGroupId,
  setCanvasStatus,
  showStatus,
} from "../core/runtimeHelpers.js";
import { cabinetDialogsApi } from "../ui/cabinetDialog.js";
import { cabinetDomainApi } from "../domain/cabinet.js";
import { composeModeApi } from "../runtime/composeMode.js";
import { frameDomainApi } from "../domain/frame.js";
import { portSwapModeApi } from "../runtime/portSwapMode.js";
import { selectionApi } from "./selection.js";
import { symbolDomainApi } from "../domain/symbol.js";
import { withAllFramesExpanded } from "../runtime/viewportVirtualization.js";

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
  var insertPoint = frameDomainApi.getFrameChildInsertPoint(
    frame,
    cell.geometry != null ? cell.geometry.width : 0,
    cell.geometry != null ? cell.geometry.height : 0,
  );
  graph.setSelectionCells(graph.importCells([cell], insertPoint.x, insertPoint.y, frame));
  graph.scrollCellToVisible(graph.getSelectionCell());
}

function insertCellAtPoint(cell, point) {
  var app = getApp();
  var graph = app.ctx.graph;

  graph.setSelectionCells(graph.importCells([cell], point.x, point.y));
  graph.scrollCellToVisible(graph.getSelectionCell());
}

export function insertIntoGraph(spec) {
  var app = getApp();
  var graph = app.ctx.graph;
  var root = symbolDomainApi.buildSymbolCell(spec);
  var frame = frameDomainApi.getActiveFrame(false);

  if (frame != null) {
    insertCellIntoFrame(root, frame);
  } else {
    var pt = graph.getFreeInsertPoint();
    graph.setSelectionCells(graph.importCells([root], pt.x, pt.y));
  }

  graph.scrollCellToVisible(graph.getSelectionCell());
  showStatus("已插入图元", false);
  setCanvasStatus("已插入图元");
}

export function insertIntoGraphAt(spec, point) {
  var app = getApp();
  var graph = app.ctx.graph;
  var root = symbolDomainApi.buildSymbolCell(spec);

  if (point != null && isFinite(point.x) && isFinite(point.y)) {
    insertCellAtPoint(root, point);
  } else {
    var fallbackPoint = graph.getFreeInsertPoint();
    insertCellAtPoint(root, fallbackPoint);
  }

  showStatus("已插入图元", false);
  setCanvasStatus("已插入图元");
}

export function refreshSelection() {
  var app = getApp();
  var graph = app.ctx.graph;
  var model = app.ctx.model;
  var state = app.ctx.state;
  var root = selectionApi.getSelectedRoot();
  var cabinet = selectionApi.getSelectedCabinetSegment();

  if (cabinet != null) {
    try {
      state.updatingModel = true;
      model.beginUpdate();
      cabinetDomainApi.relayoutCabinetByModel(
        cabinetDomainApi.extractCabinetModel(cabinet),
      );
      showStatus("配电柜已刷新", false);
      setCanvasStatus("配电柜已刷新");
    } catch (e) {
      showStatus(e.message || String(e), true);
      setCanvasStatus(e.message || String(e));
    } finally {
      model.endUpdate();
      state.updatingModel = false;
    }

    return;
  }

  if (root == null) {
    showStatus("请先选择一个电气图元", true);
    return;
  }

  state.updatingModel = true;
  model.beginUpdate();

  try {
    symbolDomainApi.refreshRoot(root);
  } catch (e) {
    showStatus(e.message || String(e), true);
    return;
  } finally {
    model.endUpdate();
    state.updatingModel = false;
  }

  showStatus("电气图元已刷新", false);
}

export function insertFrame(config, selectedFrame, existingFrames) {
  var app = getApp();
  var graph = app.ctx.graph;
  var model = app.ctx.model;
  var state = app.ctx.state;
  var constants = app.ctx.constants;
  var normalizedConfig = frameDomainApi.normalizeFrameConfig(config || {});
  var frames = Array.isArray(existingFrames)
    ? existingFrames
    : frameDomainApi.getAllDrawingFrames();
    var groupId =
      selectedFrame != null
        ? frameDomainApi.getFrameGroupId(selectedFrame)
        : generateFrameGroupId();
    var nextPageNumber =
      selectedFrame != null
        ? frameDomainApi.getMaxFramePageNumberInGroup(groupId) + 1
        : 1;
    var frame = frameDomainApi.createDrawingFrameCell(normalizedConfig, nextPageNumber, {
      groupId,
    });

  state.frameConfig = cloneJson(normalizedConfig);

  if (selectedFrame != null) {
      var anchorFrame =
        frameDomainApi.getRightmostFrameInGroup(groupId) || selectedFrame;
      var anchorGeometry = model.getGeometry(anchorFrame);
      frame.geometry = frame.geometry.clone();
      frame.geometry.x =
        anchorGeometry.x +
        anchorGeometry.width +
        constants.FRAME_HORIZONTAL_GAP;
      frame.geometry.y = anchorGeometry.y;
      frameDomainApi.addTopLevelCell(frame);
      graph.setSelectionCell(frame);
  } else if (frames.length > 0) {
      var leftmostFrame = frameDomainApi.getLeftmostFrame();
      var bottommostFrame = frameDomainApi.getBottommostFrame();
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
      frameDomainApi.addTopLevelCell(frame);
      graph.setSelectionCell(frame);
  } else {
      var point = graph.getFreeInsertPoint();
      graph.setSelectionCells(graph.importCells([frame], point.x, point.y));
  }

  graph.scrollCellToVisible(graph.getSelectionCell());
  showStatus("已插入图框", false);
  setCanvasStatus("已插入图框");
}

export function insertCabinet(cabinetModel) {
  var app = getApp();
  var graph = app.ctx.graph;
  var model = app.ctx.model;
  var state = app.ctx.state;
  state.updatingModel = true;
  model.beginUpdate();

  try {
    cabinetDomainApi.relayoutCabinetByModel(cabinetModel);
  } finally {
    model.endUpdate();
    state.updatingModel = false;
  }

  var segments = cabinetDomainApi.findCabinetSegments(cabinetModel.logicalCabinetId);

  if (segments.length > 0) {
    graph.setSelectionCell(segments[0]);
    graph.scrollCellToVisible(segments[0]);
  }

  showStatus("已插入配电柜", false);
  setCanvasStatus("已插入配电柜");
}

export function updateCabinetGap(cabinetModel) {
  var app = getApp();
  var model = app.ctx.model;
  var state = app.ctx.state;
  state.updatingModel = true;
  model.beginUpdate();

  try {
    cabinetDomainApi.relayoutCabinetByModel(cabinetModel);
  } finally {
    model.endUpdate();
    state.updatingModel = false;
  }

  showStatus("已更新端子间距", false);
  setCanvasStatus("已更新端子间距");
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
    symbolDomainApi.syncRoot(root, spec, spec.ports);
    graph.setSelectionCell(root);
  } finally {
    model.endUpdate();
    state.updatingModel = false;
  }

  showStatus("已更新图元实例", false);
}

export function clearCurrentPage() {
  var app = getApp();
  var graph = app.ctx.graph;
  var state = app.ctx.state;
  var cells = getDefaultParentChildren();

  if (cells.length == 0) {
    showStatus("当前页面没有可清除的内容", false);
    return;
  }

  if (!mxUtils.confirm("确认清除当前页面所有内容？")) {
    return;
  }

  if (!mxUtils.confirm("此操作不可恢复，确定继续清除吗？")) {
    return;
  }

  cabinetDialogsApi.closeGapDialogWindow();
  cabinetDomainApi.setSelectedCabinetGap(null, null);

  portSwapModeApi.exitPortSwapMode(false);

  composeModeApi.exitInstanceComposeMode(false);

  state.allowProtectedDelete = true;

  try {
    graph.removeCells(cells, true);
    showStatus("已清空当前页面", false);
  } finally {
    state.allowProtectedDelete = false;
  }
}

function forceDeleteSelection() {
  var app = getApp();
  var graph = app.ctx.graph;
  var model = app.ctx.model;
  var cells = graph.getSelectionCells();

  if (cells == null || cells.length === 0) {
    showStatus("没有选中任何元素", true);
    return;
  }

  if (!mxUtils.confirm("强制删除将无视所有保护，确定继续？")) {
    return;
  }

  withAllFramesExpanded(function () {
    // 收集所有后代，确保图框子元素一并移除
    var toRemove = [];
    var i, j, child;

    for (i = 0; i < cells.length; i++) {
      toRemove.push(cells[i]);
      var desc = model.getDescendants(cells[i]);

      for (j = 0; j < desc.length; j++) {
        child = desc[j];

        if (child !== cells[i]) {
          toRemove.push(child);
        }
      }
    }

    model.beginUpdate();

    try {
      graph.cellsRemoved(toRemove);
    } finally {
      model.endUpdate();
    }
  });

  showStatus("强制删除完成 (" + cells.length + " 个元素)", false);
}

export var commandApi = {
    applyInstanceSpec,
    clearCurrentPage,
    forceDeleteSelection,
    insertCabinet,
    insertFrame,
    insertIntoGraph,
    insertIntoGraphAt,
    refreshSelection,
    updateCabinetGap,
};
