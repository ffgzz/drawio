/**
 * 运行期基础 helper。
 * 这里收口最底层的 cell 类型判断、ID 生成、状态提示和上下文查找逻辑。
 */
// 这些 helper 会被多个 domain/runtime/service 复用，所以放在 core 层。
import { getApp } from "./appRuntime.js";
import {
  cloneJson,
  generateUuid,
  stripFileExtension,
  toSlug,
  trim,
} from "../utils/base.js";
import { getAttr } from "../utils/xml.js";

function getGraphApi() {
  return getApp().ctx;
}

function getConstants() {
  return getApp().ctx.constants;
}

function getState() {
  return getApp().ctx.state;
}

// 每次完成一次“完整快照基线切换”后，都要重置待提交的变更记录。
export function resetPendingChangeRecords(baselineSnapshot) {
  var state = getState();
  state.pendingChangeRecords = [];
  state.nextChangeSequence = 1;
  state.lastOperationSnapshot =
    baselineSnapshot != null ? cloneJson(baselineSnapshot) : null;
}

// 根节点识别是插件里最常用的结构判断之一。
export function isElectricalRoot(cell) {
  return getAttr(cell, "pluginType") == getConstants().ROOT_TYPE;
}

// 从任意子节点向上回溯，找到所属的电气图元根节点。
export function findElectricalRoot(cell) {
  var model = getGraphApi().model;

  while (cell != null) {
    if (isElectricalRoot(cell)) {
      return cell;
    }

    cell = model.getParent(cell);
  }

  return null;
}

export function isDrawingFrame(cell) {
  return getAttr(cell, "pluginType") == getConstants().FRAME_TYPE;
}

export function isCabinetSegment(cell) {
  return getAttr(cell, "pluginType") == getConstants().CABINET_TYPE;
}

export function isCabinetGap(cell) {
  return getAttr(cell, "pluginType") == getConstants().CABINET_GAP_TYPE;
}

// 端口宿主既可能是普通电气图元，也可能是配电柜片段。
export function isPortHostRoot(cell) {
  return isElectricalRoot(cell) || isCabinetSegment(cell);
}

// 遇到通用图元时停止向上查找，避免误把普通图形当成插件端口宿主。
export function findPortHostRoot(cell) {
  var model = getGraphApi().model;

  while (cell != null) {
    if (shouldExportGenericObject(cell)) {
      return null;
    }

    if (isPortHostRoot(cell)) {
      return cell;
    }

    cell = model.getParent(cell);
  }

  return null;
}

function isPluginInternalCell(cell) {
  var constants = getConstants();
  var kind = trim(getAttr(cell, "esKind"));

  return (
    isCabinetGap(cell) ||
    kind == constants.BODY_KIND ||
    kind == constants.LABEL_KIND ||
    kind == constants.FRAME_LABEL_KIND ||
    kind == constants.CABINET_BODY_KIND ||
    kind == constants.CABINET_GAP_KIND
  );
}

function shouldExportGenericObject(cell) {
  var model = getGraphApi().model;

  return (
    cell != null &&
    model.isVertex(cell) &&
    !isDrawingFrame(cell) &&
    !isCabinetSegment(cell) &&
    !isElectricalRoot(cell) &&
    !isPluginInternalCell(cell)
  );
}

// mode 只允许 primary / standby 两种显式取值。
export function normalizeMode(mode) {
  mode = trim(mode).toLowerCase();
  return mode == "primary" || mode == "standby" ? mode : "";
}

// symbolId 用模板名 + 短 UUID 生成，便于识别和避免冲突。
export function generateSymbolId(seed) {
  var base = toSlug(stripFileExtension(seed)) || "electrical-symbol";
  var shortUuid = generateUuid().split("-")[0];
  return base + "-" + shortUuid;
}

export function generateInstanceId() {
  return generateUuid();
}

export function generateFrameId() {
  return generateUuid();
}

export function generateFrameGroupId() {
  return generateUuid();
}

export function generateLogicalCabinetId() {
  return generateUuid();
}

// 统一更新插件窗口底部的状态提示。
export function showStatus(message, isError) {
  var state = getState();

  if (state.status != null) {
    state.status.style.color = isError ? "#b3261e" : "#2e7d32";
    state.status.innerText = message || "";
  }
}

// 统一更新 draw.io 画布状态栏。
export function setCanvasStatus(message) {
  var ui = getGraphApi().ui;
  var text = trim(message);

  if (text.length == 0) {
    if (typeof ui.clearStatus === "function") {
      ui.clearStatus();
    }

    return;
  }

  if (typeof ui.updateStatus === "function") {
    ui.updateStatus(function () {
      ui.editor.setStatus(mxUtils.htmlEntities(text));

      if (typeof ui.setStatusText === "function") {
        ui.setStatusText(ui.editor.getStatus());
      }
    });
  } else if (ui.editor != null && typeof ui.editor.setStatus === "function") {
    ui.editor.setStatus(mxUtils.htmlEntities(text));
  }
}

export function nextItemId(prefix) {
  var state = getState();
  var id = prefix + ":" + state.nextId;
  state.nextId += 1;
  return id;
}

export var runtimeHelpersApi = {
  findElectricalRoot,
  findPortHostRoot,
  generateFrameGroupId,
  generateFrameId,
  generateInstanceId,
  generateLogicalCabinetId,
  generateSymbolId,
  isCabinetGap,
  isCabinetSegment,
  isDrawingFrame,
  isElectricalRoot,
  isPortHostRoot,
  nextItemId,
  normalizeMode,
  resetPendingChangeRecords,
  setCanvasStatus,
  showStatus,
};
