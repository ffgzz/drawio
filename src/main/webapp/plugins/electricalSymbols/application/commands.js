/**
 * 应用命令层。
 * 所有会直接改 graph/model 的命令统一收口到这里，UI 和 runtime 只调命令，不直接散写模型。
 */
export function createCommandApi(deps) {
  var ctx = deps.ctx;
  var graph = ctx.graph;
  var model = ctx.model;
  var state = ctx.state;
  var constants = ctx.constants;

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
    var insertPoint = deps.frame.getFrameChildInsertPoint(
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
    var root = deps.symbol.buildSymbolCell(spec);
    var frame = deps.frame.getActiveFrame(false);

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
    var root = deps.selection.getSelectedRoot();
    var cabinet = deps.selection.getSelectedCabinetSegment();

    if (cabinet != null) {
      try {
        state.updatingModel = true;
        model.beginUpdate();
        deps.cabinet.relayoutCabinetByModel(
          deps.cabinet.extractCabinetModel(cabinet),
        );
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
      deps.symbol.refreshRoot(root);
    } catch (e) {
      deps.showStatus(e.message || String(e), true);
      return;
    } finally {
      model.endUpdate();
      state.updatingModel = false;
    }

    deps.showStatus("电气图元已刷新", false);
  }

  function insertFrame(config, selectedFrame, existingFrames) {
    var normalizedConfig = deps.frame.normalizeFrameConfig(config || {});
    var frames = Array.isArray(existingFrames)
      ? existingFrames
      : deps.frame.getAllDrawingFrames();
    var groupId =
      selectedFrame != null
        ? deps.frame.getFrameGroupId(selectedFrame)
        : deps.helpers.generateFrameGroupId();
    var nextPageNumber =
      selectedFrame != null
        ? deps.frame.getMaxFramePageNumberInGroup(groupId) + 1
        : 1;
    var frame = deps.frame.createDrawingFrameCell(normalizedConfig, nextPageNumber, {
      groupId,
    });

    state.frameConfig = deps.cloneJson(normalizedConfig);

    if (selectedFrame != null) {
      var anchorFrame =
        deps.frame.getRightmostFrameInGroup(groupId) || selectedFrame;
      var anchorGeometry = model.getGeometry(anchorFrame);
      frame.geometry = frame.geometry.clone();
      frame.geometry.x =
        anchorGeometry.x +
        anchorGeometry.width +
        constants.FRAME_HORIZONTAL_GAP;
      frame.geometry.y = anchorGeometry.y;
      deps.frame.addTopLevelCell(frame);
      graph.setSelectionCell(frame);
    } else if (frames.length > 0) {
      var leftmostFrame = deps.frame.getLeftmostFrame();
      var bottommostFrame = deps.frame.getBottommostFrame();
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
      deps.frame.addTopLevelCell(frame);
      graph.setSelectionCell(frame);
    } else {
      var point = graph.getFreeInsertPoint();
      graph.setSelectionCells(graph.importCells([frame], point.x, point.y));
    }

    graph.scrollCellToVisible(graph.getSelectionCell());
    deps.showStatus("已插入图框", false);
    deps.setCanvasStatus("已插入图框");
  }

  function insertCabinet(cabinetModel) {
    state.updatingModel = true;
    model.beginUpdate();

    try {
      deps.cabinet.relayoutCabinetByModel(cabinetModel);
    } finally {
      model.endUpdate();
      state.updatingModel = false;
    }

    var segments = deps.cabinet.findCabinetSegments(cabinetModel.logicalCabinetId);

    if (segments.length > 0) {
      graph.setSelectionCell(segments[0]);
      graph.scrollCellToVisible(segments[0]);
    }

    deps.showStatus("已插入配电柜", false);
    deps.setCanvasStatus("已插入配电柜");
  }

  function updateCabinetGap(cabinetModel) {
    state.updatingModel = true;
    model.beginUpdate();

    try {
      deps.cabinet.relayoutCabinetByModel(cabinetModel);
    } finally {
      model.endUpdate();
      state.updatingModel = false;
    }

    deps.showStatus("已更新端子间距", false);
    deps.setCanvasStatus("已更新端子间距");
  }

  function applyInstanceSpec(root, spec) {
    if (root == null || root.parent == null) {
      throw new Error("当前图元已不存在，无法应用修改");
    }

    state.updatingModel = true;
    model.beginUpdate();

    try {
      deps.symbol.syncRoot(root, spec, spec.ports);
      graph.setSelectionCell(root);
    } finally {
      model.endUpdate();
      state.updatingModel = false;
    }

    deps.showStatus("已更新图元实例", false);
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

    deps.uiBridge.closeGapDialogWindow();
    deps.cabinet.setSelectedCabinetGap(null, null);

    if (typeof deps.runtimeBridge.exitPortSwapMode === "function") {
      deps.runtimeBridge.exitPortSwapMode(false);
    }

    if (typeof deps.runtimeBridge.exitInstanceComposeMode === "function") {
      deps.runtimeBridge.exitInstanceComposeMode(false);
    }

    state.allowProtectedDelete = true;

    try {
      graph.removeCells(cells, true);
      deps.showStatus("已清空当前页面", false);
    } finally {
      state.allowProtectedDelete = false;
    }
  }

  return {
    applyInstanceSpec,
    clearCurrentPage,
    insertCabinet,
    insertFrame,
    insertIntoGraph,
    refreshSelection,
    updateCabinetGap,
  };
}
