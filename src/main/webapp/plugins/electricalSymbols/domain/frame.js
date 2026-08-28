/**
 * 图框域入口。
 * 对外暴露稳定的 frame API，内部仍复用 frameGraph.js 的实现。
 */
import { createFrameDomain } from "./frameGraph.js";
import { normalizeFrameConfig } from "./frameCore.js";

function getFrameDomain() {
  return createFrameDomain();
}

export function addTopLevelCell() {
  return getFrameDomain().addTopLevelCell.apply(null, arguments);
}

export function createDrawingFrameCell() {
  return getFrameDomain().createDrawingFrameCell.apply(null, arguments);
}

export function findDrawingFrame() {
  return getFrameDomain().findDrawingFrame.apply(null, arguments);
}

export function findFrameByGeometry() {
  return getFrameDomain().findFrameByGeometry.apply(null, arguments);
}

export function findFrameById() {
  return getFrameDomain().findFrameById.apply(null, arguments);
}

export function findFrameContainingPoint() {
  return getFrameDomain().findFrameContainingPoint.apply(null, arguments);
}

export function getAbsoluteCenter() {
  return getFrameDomain().getAbsoluteCenter.apply(null, arguments);
}

export function getAbsoluteOrigin() {
  return getFrameDomain().getAbsoluteOrigin.apply(null, arguments);
}

export function getActiveFrame() {
  return getFrameDomain().getActiveFrame.apply(null, arguments);
}

export function getAllDrawingFrames() {
  return getFrameDomain().getAllDrawingFrames.apply(null, arguments);
}

export function getBottommostFrame() {
  return getFrameDomain().getBottommostFrame.apply(null, arguments);
}

export function getFrameChildInsertPoint() {
  return getFrameDomain().getFrameChildInsertPoint.apply(null, arguments);
}

export function getFrameConfig() {
  return getFrameDomain().getFrameConfig.apply(null, arguments);
}

export function getFrameGroupId() {
  return getFrameDomain().getFrameGroupId.apply(null, arguments);
}

export function getFramePageNumber() {
  return getFrameDomain().getFramePageNumber.apply(null, arguments);
}

export function getLeftmostFrame() {
  return getFrameDomain().getLeftmostFrame.apply(null, arguments);
}

export function getMaxFramePageNumberInGroup() {
  return getFrameDomain().getMaxFramePageNumberInGroup.apply(null, arguments);
}

export function getRightmostFrameInGroup() {
  return getFrameDomain().getRightmostFrameInGroup.apply(null, arguments);
}

export var frameDomainApi = {
  addTopLevelCell,
  createDrawingFrameCell,
  findDrawingFrame,
  findFrameByGeometry,
  findFrameById,
  findFrameContainingPoint,
  getAbsoluteCenter,
  getAbsoluteOrigin,
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

export { normalizeFrameConfig };
