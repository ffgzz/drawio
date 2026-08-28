/**
 * 图框 graph 子模块。
 * 负责图框在 mxGraph 模型中的查找、定位和 cell 创建，是 frame 的边缘适配层。
 */
import {
  applyFrameValueMetadata,
  makeFrameStyle,
  normalizeFrameConfig,
} from "./frameCore.js";
import { getApp } from "../core/appRuntime.js";
import { isObject, toInt, trim } from "../utils/base.js";
import { createMetaCell, createNode, getAttr } from "../utils/xml.js";
import {
  generateFrameId,
  isDrawingFrame,
  setCanvasStatus,
  showStatus,
} from "../core/runtimeHelpers.js";

function buildFrameDeps() {
  var app = getApp();
  var ctx = app.ctx;
  var constants = ctx.constants;

  return {
    graph: ctx.graph,
    model: ctx.model,
    state: ctx.state,
    frameTag: constants.FRAME_TAG,
    frameType: constants.FRAME_TYPE,
    frameLabelTag: constants.FRAME_LABEL_TAG,
    frameLabelKind: constants.FRAME_LABEL_KIND,
    frameMarginRatio: constants.FRAME_MARGIN_RATIO,
    defaultWidth: constants.FRAME_DEFAULT_WIDTH,
    defaultHeight: constants.FRAME_DEFAULT_HEIGHT,
    trim,
    toInt,
    isObject,
    getAttr,
    createNode,
    createMetaCell,
    generateFrameId,
    isDrawingFrame,
    showStatus,
    setCanvasStatus,
  };
}

export function createFrameDomain() {
  var deps = arguments.length > 0 ? arguments[0] : buildFrameDeps();
  var graph = deps.graph;
  var model = deps.model;

  /**
   * 顺着父链找所属图框；父链上没有图框时退回几何命中。
   *
   * 几何兜底是为了读旧图纸——历史数据里有大量"画在图框上但没有真正挂进去"的
   * 图元。兜底只读不写，不会在打开图纸时凭空产生变更提交。
   * 绑定正常的图纸走不到兜底分支（第一层父节点就是图框），零额外开销。
   */
  function findDrawingFrame(cell) {
    var origin = cell;

    while (cell != null) {
      if (deps.isDrawingFrame(cell)) {
        return cell;
      }

      cell = model.getParent(cell);
    }

    return findFrameByGeometry(origin);
  }

  /**
   * 顶点在画布坐标系里的绝对原点（父链上各级图框原点之和）。
   * 实际结构里父链最多一层图框，所以这个循环几乎总是走 0~1 次。
   */
  function getAbsoluteOrigin(cell) {
    var x = 0;
    var y = 0;
    var parent = model.getParent(cell);

    while (parent != null && model.isVertex(parent)) {
      var geometry = model.getGeometry(parent);

      if (geometry != null && !geometry.relative) {
        x += geometry.x;
        y += geometry.y;
      }

      parent = model.getParent(parent);
    }

    return { x: x, y: y };
  }

  /**
   * 顶点包围盒中心的绝对坐标。归属判定统一用中心点：跨到图框边界上的图元
   * 不会在两个框之间来回摇摆，行为可预测。
   */
  function getAbsoluteCenter(cell) {
    if (cell == null || !model.isVertex(cell)) {
      return null;
    }

    var geometry = model.getGeometry(cell);

    if (geometry == null || geometry.relative) {
      return null;
    }

    var origin = getAbsoluteOrigin(cell);

    return {
      x: origin.x + geometry.x + geometry.width / 2,
      y: origin.y + geometry.y + geometry.height / 2,
    };
  }

  /**
   * 找出包含给定画布坐标的图框。
   *
   * 图框都是 defaultParent 的直接子节点，这里直接遍历，不建索引也不分配数组：
   * F（页数）通常是个位到几十，单次判定就是几十次浮点比较。图框规模真的涨到
   * 几百页时再考虑按 y 排序做二分。
   */
  function findFrameContainingPoint(x, y) {
    var parent = graph.getDefaultParent();
    var count = model.getChildCount(parent);
    var i;

    for (i = 0; i < count; i++) {
      var child = model.getChildAt(parent, i);

      if (!deps.isDrawingFrame(child)) {
        continue;
      }

      var geometry = model.getGeometry(child);

      if (geometry == null) {
        continue;
      }

      if (
        x >= geometry.x &&
        x <= geometry.x + geometry.width &&
        y >= geometry.y &&
        y <= geometry.y + geometry.height
      ) {
        return child;
      }
    }

    return null;
  }

  function findFrameByGeometry(cell) {
    var center = getAbsoluteCenter(cell);

    if (center == null) {
      return null;
    }

    return findFrameContainingPoint(center.x, center.y);
  }

  function getFrameConfig(frame) {
    var raw = deps.getAttr(frame, "frameConfigJson");
    var geometry;

    if (raw != null && raw.length > 0) {
      try {
        return normalizeFrameConfig(JSON.parse(raw));
      } catch (e) {
        // ignore malformed config
      }
    }

    geometry = model.getGeometry(frame);
    return normalizeFrameConfig({
      width: geometry != null ? geometry.width : deps.defaultWidth,
      height: geometry != null ? geometry.height : deps.defaultHeight,
    });
  }

  function getFramePageNumber(frame) {
    return Math.max(1, deps.toInt(deps.getAttr(frame, "pageNumber"), 1));
  }

  function getAllDrawingFrames() {
    var parent = graph.getDefaultParent();
    var frames = [];
    var i;

    for (i = 0; i < model.getChildCount(parent); i++) {
      var child = model.getChildAt(parent, i);

      if (deps.isDrawingFrame(child)) {
        frames.push(child);
      }
    }

    return frames;
  }

  function findFrameById(frameId) {
    var target = deps.trim(frameId);
    var frames = getAllDrawingFrames();
    var i;

    for (i = 0; i < frames.length; i++) {
      if (deps.trim(deps.getAttr(frames[i], "frameId")) == target) {
        return frames[i];
      }
    }

    return null;
  }

  function getFrameGroupId(frame) {
    if (frame == null) {
      return "";
    }

    var groupId = deps.trim(deps.getAttr(frame, "groupId"));

    if (groupId.length > 0) {
      return groupId;
    }

    var originFrameId = deps.trim(deps.getAttr(frame, "originFrameId"));
    var frameId = deps.trim(deps.getAttr(frame, "frameId"));

    if (originFrameId.length > 0 && originFrameId != frameId) {
      var originFrame = findFrameById(originFrameId);

      if (originFrame != null && originFrame != frame) {
        return getFrameGroupId(originFrame);
      }

      return originFrameId;
    }

    return frameId;
  }

  function getFramesInGroup(groupId) {
    var target = deps.trim(groupId);
    var frames = getAllDrawingFrames();
    var result = [];
    var i;

    for (i = 0; i < frames.length; i++) {
      if (getFrameGroupId(frames[i]) == target) {
        result.push(frames[i]);
      }
    }

    return result;
  }

  function getRightmostFrameInGroup(groupId) {
    var frames = getFramesInGroup(groupId);
    var rightmost = null;
    var i;

    for (i = 0; i < frames.length; i++) {
      var geometry = model.getGeometry(frames[i]);

      if (geometry == null) {
        continue;
      }

      if (
        rightmost == null ||
        geometry.x + geometry.width >
          model.getGeometry(rightmost).x + model.getGeometry(rightmost).width
      ) {
        rightmost = frames[i];
      }
    }

    return rightmost;
  }

  function getBottommostFrame() {
    var frames = getAllDrawingFrames();
    var bottommost = null;
    var i;

    for (i = 0; i < frames.length; i++) {
      var geometry = model.getGeometry(frames[i]);

      if (geometry == null) {
        continue;
      }

      if (
        bottommost == null ||
        geometry.y + geometry.height >
          model.getGeometry(bottommost).y + model.getGeometry(bottommost).height
      ) {
        bottommost = frames[i];
      }
    }

    return bottommost;
  }

  function getLeftmostFrame() {
    var frames = getAllDrawingFrames();
    var leftmost = null;
    var i;

    for (i = 0; i < frames.length; i++) {
      var geometry = model.getGeometry(frames[i]);

      if (geometry == null) {
        continue;
      }

      if (leftmost == null || geometry.x < model.getGeometry(leftmost).x) {
        leftmost = frames[i];
      }
    }

    return leftmost;
  }

  function getLastDrawingFrame() {
    var frames = getAllDrawingFrames();
    var last = null;
    var i;

    for (i = 0; i < frames.length; i++) {
      if (last == null || getFramePageNumber(frames[i]) > getFramePageNumber(last)) {
        last = frames[i];
      }
    }

    return last;
  }

  function getMaxFramePageNumberInGroup(groupId) {
    var frames = getFramesInGroup(groupId);
    var maxPage = 0;
    var i;

    for (i = 0; i < frames.length; i++) {
      maxPage = Math.max(maxPage, getFramePageNumber(frames[i]));
    }

    return maxPage;
  }

  function getActiveFrame(showError) {
    var frame = findDrawingFrame(graph.getSelectionCell());

    if (frame == null) {
      frame = getLastDrawingFrame();
    }

    if (frame == null && showError) {
      deps.showStatus("请先插入或选中一个图框", true);
      deps.setCanvasStatus("请先插入或选中一个图框");
    }

    return frame;
  }

  function getFrameChildInsertPoint(frame, width, height) {
    var frameConfig = getFrameConfig(frame);
    var childCount = 0;
    var i;

    for (i = 0; i < model.getChildCount(frame); i++) {
      var child = model.getChildAt(frame, i);

      if (deps.getAttr(child, "esKind") != deps.frameLabelKind) {
        childCount += 1;
      }
    }

    return {
      x: 40 + (childCount % 6) * 18,
      y:
        Math.round(frameConfig.height * deps.frameMarginRatio) +
        20 +
        Math.floor(childCount / 6) * 18,
    };
  }

  function createDrawingFrameCell(frameConfig, pageNumber, extra) {
    var config = normalizeFrameConfig(frameConfig);
    var frameId =
      extra != null && deps.trim(extra.frameId).length > 0
        ? deps.trim(extra.frameId)
        : deps.generateFrameId();
    var root = new mxCell(
      applyFrameValueMetadata(
        deps.createNode(deps.frameTag),
        frameId,
        pageNumber,
        config,
        extra,
      ),
      new mxGeometry(0, 0, config.width, config.height),
      makeFrameStyle(),
    );
    root.vertex = true;
    root.setConnectable(false);
    return root;
  }

  function addTopLevelCell(cell) {
    model.add(graph.getDefaultParent(), cell);
    return cell;
  }

  return {
    addTopLevelCell,
    createDrawingFrameCell,
    findDrawingFrame,
    findFrameByGeometry,
    findFrameContainingPoint,
    getAbsoluteCenter,
    getAbsoluteOrigin,
    findFrameById,
    getActiveFrame,
    getAllDrawingFrames,
    getBottommostFrame,
    getFrameChildInsertPoint,
    getFrameConfig,
    getFrameGroupId,
    getFramePageNumber,
    getLeftmostFrame,
    getMaxFramePageNumberInGroup,
    getRightmostFrameInGroup,
    normalizeFrameConfig,
  };
}
