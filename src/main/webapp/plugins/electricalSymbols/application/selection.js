/**
 * 当前选中对象解析器。
 * UI 和 runtime 都从这里拿当前 root/frame/cabinet/gap，避免到处重复 selection 判定。
 */
import { getApp } from "../core/appRuntime.js";
import { findElectricalRoot, isCabinetGap } from "../core/runtimeHelpers.js";

export function getSelectedCell() {
  return getApp().ctx.graph.getSelectionCell();
}

export function getSelectedRoot() {
  return findElectricalRoot(getSelectedCell());
}

export function getSelectedFrame() {
  var app = getApp();
  return app.domains.frame.findDrawingFrame(getSelectedCell());
}

export function getSelectedCabinetSegment() {
  var app = getApp();
  return app.domains.cabinet.findCabinetSegment(getSelectedCell());
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
