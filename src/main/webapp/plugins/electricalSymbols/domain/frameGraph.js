/**
 * 图框 graph 子模块。
 * 负责图框在 mxGraph 模型中的查找、定位和 cell 创建，是 frame 的边缘适配层。
 */
import {
  applyFrameValueMetadata,
  createFramePageLabelCell,
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

  function findDrawingFrame(cell) {
    while (cell != null) {
      if (deps.isDrawingFrame(cell)) {
        return cell;
      }

      cell = model.getParent(cell);
    }

    return null;
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
    root.insert(createFramePageLabelCell(pageNumber, config));
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
