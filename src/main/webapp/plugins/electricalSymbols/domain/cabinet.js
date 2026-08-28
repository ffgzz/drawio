/**
 * 配电柜域入口。
 * 对外暴露稳定的 cabinet API，内部仍复用 cabinetGraph.js 的实现。
 */
import { createCabinetDomain } from "./cabinetGraph.js";
import { normalizeCabinetModel } from "./cabinetCore.js";

function getCabinetDomain() {
  return createCabinetDomain();
}

export function buildCabinetPageDescriptors() {
  return getCabinetDomain().buildCabinetPageDescriptors.apply(null, arguments);
}

export function buildCabinetPortMap() {
  return getCabinetDomain().buildCabinetPortMap.apply(null, arguments);
}

export function buildCabinetSegmentCell() {
  return getCabinetDomain().buildCabinetSegmentCell.apply(null, arguments);
}

export function collectCabinetAttachments() {
  return getCabinetDomain().collectCabinetAttachments.apply(null, arguments);
}

export function extractCabinetModel() {
  return getCabinetDomain().extractCabinetModel.apply(null, arguments);
}

export function findCabinetSegment() {
  return getCabinetDomain().findCabinetSegment.apply(null, arguments);
}

export function findCabinetSegments() {
  return getCabinetDomain().findCabinetSegments.apply(null, arguments);
}

export function getCellAbsoluteGeometry() {
  return getCabinetDomain().getCellAbsoluteGeometry.apply(null, arguments);
}

export function getPortAbsolutePosition() {
  return getCabinetDomain().getPortAbsolutePosition.apply(null, arguments);
}

export function relayoutCabinetByModel() {
  return getCabinetDomain().relayoutCabinetByModel.apply(null, arguments);
}

export function restoreCabinetAttachments() {
  return getCabinetDomain().restoreCabinetAttachments.apply(null, arguments);
}

export function applyCabinetBlockHeight() {
  return getCabinetDomain().applyCabinetBlockHeight.apply(null, arguments);
}

export function applyCabinetWidth() {
  return getCabinetDomain().applyCabinetWidth.apply(null, arguments);
}

export function bindSwitchToBlock() {
  return getCabinetDomain().bindSwitchToBlock.apply(null, arguments);
}

export function unbindSwitchFromBlock() {
  return getCabinetDomain().unbindSwitchFromBlock.apply(null, arguments);
}

export function findSwitchCellByInstanceId() {
  return getCabinetDomain().findSwitchCellByInstanceId.apply(null, arguments);
}

export function insertCabinetBlockAfter() {
  return getCabinetDomain().insertCabinetBlockAfter.apply(null, arguments);
}

export function getSegmentBlocks() {
  return getCabinetDomain().getSegmentBlocks.apply(null, arguments);
}

export var cabinetDomainApi = {
  applyCabinetBlockHeight,
  applyCabinetWidth,
  bindSwitchToBlock,
  buildCabinetPageDescriptors,
  findSwitchCellByInstanceId,
  buildCabinetPortMap,
  buildCabinetSegmentCell,
  collectCabinetAttachments,
  extractCabinetModel,
  findCabinetSegment,
  findCabinetSegments,
  getCellAbsoluteGeometry,
  getPortAbsolutePosition,
  getSegmentBlocks,
  insertCabinetBlockAfter,
  unbindSwitchFromBlock,
  normalizeCabinetModel,
  relayoutCabinetByModel,
  restoreCabinetAttachments,
};

export { normalizeCabinetModel };
