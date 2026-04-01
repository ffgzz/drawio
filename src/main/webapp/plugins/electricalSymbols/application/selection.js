/**
 * 当前选中对象解析器。
 * UI 和 runtime 都从这里拿当前 root/frame/cabinet/gap，避免到处重复 selection 判定。
 */
import { getApp } from "../core/appRuntime.js";
import { findElectricalRoot, isCabinetGap } from "../core/runtimeHelpers.js";
import { cabinetDomainApi } from "../domain/cabinet.js";
import { frameDomainApi } from "../domain/frame.js";

export function getSelectedCell() {
  return getApp().ctx.graph.getSelectionCell();
}

export function getSelectedRoot() {
  return findElectricalRoot(getSelectedCell());
}

export function getSelectedFrame() {
  return frameDomainApi.findDrawingFrame(getSelectedCell());
}

export function getSelectedCabinetSegment() {
  return cabinetDomainApi.findCabinetSegment(getSelectedCell());
}

export function getSelectedCabinetGap() {
  var cell = getSelectedCell();
  return isCabinetGap(cell) ? cell : null;
}

export var selectionApi = {
  getSelectedCabinetGap,
  getSelectedCabinetSegment,
  getSelectedCell,
  getSelectedFrame,
  getSelectedRoot,
};
