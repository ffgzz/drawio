/**
 * 应用命令层。
 * 所有会直接改 graph/model 的命令统一收口到这里，UI 和 runtime 只调命令，不直接散写模型。
 */
import { getApp } from "../core/appRuntime.js";
import { cloneJson } from "../utils/base.js";
import { cloneValue, getAttr } from "../utils/xml.js";
import {
  generateFrameGroupId,
  isCabinetSegment,
  setCanvasStatus,
  showStatus,
} from "../core/runtimeHelpers.js";
import { cabinetBlockDialogApi } from "../ui/cabinetBlockDialog.js";
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

  // 不再设 state.updatingModel：配电柜的改动必须进增量变更记录。
  // 重排只会改动绑定图元的位置而不改宽高，不会触发 handleModelChange 的递归刷新。
  model.beginUpdate();

  try {
    cabinetDomainApi.relayoutCabinetByModel(cabinetModel);
  } finally {
    model.endUpdate();
  }

  var segments = cabinetDomainApi.findCabinetSegments(cabinetModel.logicalCabinetId);

  if (segments.length > 0) {
    graph.setSelectionCell(segments[0]);
    graph.scrollCellToVisible(segments[0]);
  }

  showStatus("已插入配电柜", false);
  setCanvasStatus("已插入配电柜");
}

/**
 * 在参照块下方插入一个新块。
 *
 * @param {Object} blockCell 参照块
 * @param {Object} blockInit 新块的初始属性
 * @returns {boolean} 是否真的插入了
 */
/**
 * 给块绑定一个开关。已有绑定会被替换掉，不留孤儿图元。
 *
 * @param {Object} blockCell 目标块
 * @param {Object} spec      已经 buildInstanceSpec 过的图元 spec
 * @returns {boolean} 是否绑定成功
 */
export function bindCabinetSwitch(blockCell, spec) {
  var app = getApp();
  var graph = app.ctx.graph;
  var model = app.ctx.model;
  var result;

  model.beginUpdate();

  try {
    result = cabinetDomainApi.bindSwitchToBlock(blockCell, spec);
  } finally {
    model.endUpdate();
  }

  if (result == null) {
    showStatus("未找到要绑定的配电柜块", true);
    return false;
  }

  if (result.switchCell != null) {
    graph.setSelectionCell(result.switchCell);
    graph.scrollCellToVisible(result.switchCell);
  }

  showStatus("已绑定开关", false);
  setCanvasStatus("已绑定开关");
  return true;
}

/**
 * 解除块与开关的绑定。
 *
 * @param {Object}  blockCell    目标块
 * @param {boolean} removeSwitch 是否连开关图元一起删掉
 */
export function unbindCabinetSwitch(blockCell, removeSwitch) {
  var app = getApp();
  var model = app.ctx.model;

  model.beginUpdate();

  try {
    cabinetDomainApi.unbindSwitchFromBlock(blockCell, removeSwitch === true, false);
  } finally {
    model.endUpdate();
  }

  showStatus(removeSwitch === true ? "已删除开关" : "已解除开关绑定", false);
  setCanvasStatus("已更新开关绑定");
  return true;
}

/**
 * 配电柜模型改动后统一重排。块高、柜宽、块增删都走这里。
 */
export function updateCabinetModel(cabinetModel, statusText) {
  var app = getApp();
  var model = app.ctx.model;
  var label = statusText || "已更新配电柜";

  model.beginUpdate();

  try {
    cabinetDomainApi.relayoutCabinetByModel(cabinetModel);
  } finally {
    model.endUpdate();
  }

  showStatus(label, false);
  setCanvasStatus(label);
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

// Business-property edits must not rebuild a symbol or the whole diagram.
// Update only the root payload and visible label text so geometry, ports,
// terminals, edge parents and manual waypoints remain byte-for-byte intact.
export function applySymbolDataSpec(root, spec) {
  var app = getApp();
  var graph = app.ctx.graph;
  var model = app.ctx.model;
  var state = app.ctx.state;
  var labels = Array.isArray(spec.labels) ? spec.labels : [];
  var labelsById = {};
  var i;

  if (root == null || root.parent == null) {
    throw new Error("当前图元已不存在，无法应用属性修改");
  }

  for (i = 0; i < labels.length; i++) {
    if (labels[i] != null && labels[i].id != null) {
      labelsById[String(labels[i].id)] = labels[i];
    }
  }

  state.updatingModel = true;
  model.beginUpdate();

  try {
    var rootValue = cloneValue(root.value);
    rootValue.setAttribute("dataJson", JSON.stringify(spec.data || {}));
    rootValue.setAttribute("labelsJson", JSON.stringify(labels));
    rootValue.setAttribute("symbolPayload", JSON.stringify(spec));
    if (Array.isArray(spec.businessBindings)) {
      rootValue.setAttribute(
        "businessBindingsJson",
        JSON.stringify(spec.businessBindings),
      );
    }
    if (spec.businessBindingVersion != null) {
      rootValue.setAttribute(
        "businessBindingVersion",
        String(spec.businessBindingVersion),
      );
    }
    model.setValue(root, rootValue);

    for (i = 0; i < model.getChildCount(root); i++) {
      var child = model.getChildAt(root, i);
      var key = getAttr(child, "esKey");
      var label = key != null ? labelsById[String(key)] : null;
      if (label == null) continue;
      var childValue = cloneValue(child.value);
      childValue.setAttribute("label", String(label.text || ""));
      model.setValue(child, childValue);
    }

    graph.setSelectionCell(root);
  } finally {
    model.endUpdate();
    state.updatingModel = false;
  }

  showStatus("已更新图元属性", false);
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

  cabinetBlockDialogApi.closeCabinetBlockDialog();

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
      // 即使用户明确选择“强制删除”，也不能在 CabinetModel 里
      // 留下指向已删开关的 switchInstanceId。普通 Delete 会被
      // canvasFeatures 阻止；这里是唯一绕过保护的入口，必须先解绑。
      var unboundBlocks = {};

      for (i = 0; i < cells.length; i++) {
        var boundBlock = cabinetDomainApi.findBoundCabinetBlockForSwitch(
          cells[i],
        );

        if (boundBlock == null) {
          continue;
        }

        var blockKey = isCabinetSegment(boundBlock)
          ? String(boundBlock.id) + ":" + String(getAttr(cells[i], "instanceId"))
          : boundBlock.id != null
            ? String(boundBlock.id)
            : String(i);

        if (!unboundBlocks[blockKey]) {
          unboundBlocks[blockKey] = true;
          if (isCabinetSegment(boundBlock)) {
            cabinetDomainApi.unbindSwitchFromCabinetSwitch(
              boundBlock,
              cells[i],
              false,
              false,
            );
          } else {
            cabinetDomainApi.unbindSwitchFromBlock(boundBlock, false, false);
          }
        }
      }

      graph.cellsRemoved(toRemove);
    } finally {
      model.endUpdate();
    }
  });

  showStatus("强制删除完成 (" + cells.length + " 个元素)", false);
}

export var commandApi = {
    applySymbolDataSpec,
    applyInstanceSpec,
    clearCurrentPage,
    forceDeleteSelection,
    insertCabinet,
    bindCabinetSwitch,
    unbindCabinetSwitch,
    insertFrame,
    insertIntoGraph,
    insertIntoGraphAt,
    refreshSelection,
    updateCabinetModel,
};
