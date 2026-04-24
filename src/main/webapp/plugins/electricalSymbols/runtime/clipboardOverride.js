/**
 * 剪贴板覆写模块。
 * 拦截 mxClipboard 的 copy/cut/paste，实现：
 *   1. 阻止图框/配电柜被复制（静默过滤 + toast 通知宿主）
 *   2. 设备/电缆粘贴时自动递增编号 + 生成新 instanceId
 *   3. 电缆悬空端自动断开
 *   4. 通知宿主页面（emitHostEvent）完成 React 侧数据同步
 */
import { getApp } from "../core/appRuntime.js";
import { generateUuid, trim } from "../utils/base.js";
import { getAttr } from "../utils/xml.js";
import {
  isDrawingFrame,
  isCabinetSegment,
  isCabinetGap,
  isElectricalRoot,
} from "../core/runtimeHelpers.js";
import { emitHostEvent } from "./hostBridge.js";

// ─── 编号递增工具 ─────────────────────────────────────────────────────────

/**
 * 收集画布上所有已存在的 deviceCode 和 cableCode。
 * 返回 Set<string>。
 */
function collectExistingCodes(model) {
  var codes = {};
  var cells = model.cells;
  var key;
  var code;

  for (key in cells) {
    if (!Object.prototype.hasOwnProperty.call(cells, key)) {
      continue;
    }

    var cell = cells[key];
    code = trim(getAttr(cell, "deviceCode"));

    if (code.length > 0) {
      codes[code] = true;
    }

    // 电缆（边）也可能带 cableCode
    code = trim(getAttr(cell, "cableCode"));

    if (code.length > 0) {
      codes[code] = true;
    }
  }

  return codes;
}

/**
 * 对一个编号做递增。
 * "QF-01" → "QF-02"，前导零保持位数。
 * 如果末尾无数字，追加 "-1"。
 * 循环递增直到不与 existingCodes 冲突。
 *
 * @param {string} code      原编号
 * @param {Object} existingCodes  已存在编号的 lookup 表 {code: true}
 * @returns {string} 新编号
 */
function incrementCode(code, existingCodes) {
  var match = code.match(/^(.*?)(\d+)$/);
  var prefix;
  var numStr;
  var num;
  var padLen;
  var candidate;

  if (!match) {
    // 末尾无数字，追加 -1，-2 ...
    num = 0;

    do {
      num++;
      candidate = code + "-" + num;
    } while (existingCodes[candidate] === true);

    return candidate;
  }

  prefix = match[1];
  numStr = match[2];
  padLen = numStr.length;
  num = parseInt(numStr, 10);

  do {
    num++;
    candidate = prefix + padNumber(num, padLen);
  } while (existingCodes[candidate] === true);

  return candidate;
}

function padNumber(num, minLen) {
  var s = String(num);

  while (s.length < minLen) {
    s = "0" + s;
  }

  return s;
}

// ─── Cell 类型判断 ──────────────────────────────────────────────────────────

/**
 * 判断一个 cell 是否是被保护、不允许复制的类型（图框或配电柜），
 * 或者是其后代子节点。
 */
function isProtectedFromCopy(cell) {
  if (cell == null) {
    return false;
  }

  // 自身就是受保护类型
  if (isDrawingFrame(cell) || isCabinetSegment(cell) || isCabinetGap(cell)) {
    return true;
  }

  // 向上遍历父链，如果任何祖先是受保护类型，也视为受保护
  var model = getApp().ctx.model;
  var parent = model.getParent(cell);

  while (parent != null) {
    if (isDrawingFrame(parent) || isCabinetSegment(parent) || isCabinetGap(parent)) {
      return true;
    }

    parent = model.getParent(parent);
  }

  return false;
}

/**
 * 判断一个 cell 是否是设备图元根节点。
 */
function isDeviceRoot(cell) {
  return isElectricalRoot(cell);
}

// ─── Clone 后的属性改写 ──────────────────────────────────────────────────

/**
 * 遍历 cloned cells，改写设备/电缆的标识属性。
 *
 * @param {Array} clonedCells  由 mxClipboard.cloneCells 返回的待粘贴 cell 数组
 * @param {Object} existingCodes 当前画布已有编号索引
 * @param {Array} duplicateLog  输出数组，记录每次 duplicate 的详情
 */
function rewriteClonedCellAttributes(clonedCells, existingCodes, duplicateLog) {
  var i;
  var cell;

  for (i = 0; i < clonedCells.length; i++) {
    cell = clonedCells[i];

    if (cell == null) {
      continue;
    }

    // ── 设备（pluginType == ROOT_TYPE）──────────────────────────────
    if (isDeviceRoot(cell)) {
      rewriteDeviceCell(cell, existingCodes, duplicateLog);
      continue;
    }

    // ── 电缆 edge：目前 edge 可能在 value 上带 cableCode ──────────
    rewriteCableCell(cell, existingCodes, duplicateLog);
  }
}

function rewriteDeviceCell(cell, existingCodes, duplicateLog) {
  var oldCode = trim(getAttr(cell, "deviceCode"));
  var oldInstanceId = trim(getAttr(cell, "instanceId"));
  var newInstanceId = generateUuid();
  var newCode;

  if (oldCode.length > 0) {
    newCode = incrementCode(oldCode, existingCodes);
    // 注册到索引，以便同批次下一个 clone 不冲突
    existingCodes[newCode] = true;
  } else {
    newCode = "";
  }

  // 改写 value 节点属性（深拷贝保证不影响原 cell）
  if (cell.value != null && cell.value.nodeType === 1) {
    cell.value = cell.value.cloneNode(true);
    cell.value.setAttribute("instanceId", newInstanceId);

    if (newCode.length > 0) {
      cell.value.setAttribute("deviceCode", newCode);
    }

    // 如果 symbolPayload JSON 里也存了 device.code / instanceId，一并更新
    updateSymbolPayloadJson(cell, newCode, newInstanceId);
  }

  duplicateLog.push({
    type: "device",
    originalCode: oldCode,
    newCode: newCode,
    originalInstanceId: oldInstanceId,
    newInstanceId: newInstanceId,
  });

  // 更新子 cell 的 label 如果引用了 deviceCode
  rewriteChildLabels(cell, "deviceCode", newCode);
}

function rewriteCableCell(cell, existingCodes, duplicateLog) {
  var oldCode = trim(getAttr(cell, "cableCode"));

  if (oldCode.length === 0) {
    return;
  }

  var newCode = incrementCode(oldCode, existingCodes);
  existingCodes[newCode] = true;

  if (cell.value != null && cell.value.nodeType === 1) {
    cell.value = cell.value.cloneNode(true);
    cell.value.setAttribute("cableCode", newCode);
  }

  duplicateLog.push({
    type: "cable",
    originalCode: oldCode,
    newCode: newCode,
  });
}

/**
 * 更新 symbolPayload JSON 中的 device.code 和 instanceId。
 */
function updateSymbolPayloadJson(cell, newCode, newInstanceId) {
  var payloadStr = trim(getAttr(cell, "symbolPayload"));

  if (payloadStr.length === 0) {
    return;
  }

  try {
    var payload = JSON.parse(payloadStr);

    if (payload.instanceId != null) {
      payload.instanceId = newInstanceId;
    }

    if (payload.device != null && payload.device.code != null && newCode.length > 0) {
      payload.device.code = newCode;
    }

    cell.value.setAttribute("symbolPayload", JSON.stringify(payload));
  } catch (e) {
    // JSON 解析失败，跳过
  }
}

/**
 * 如果设备的子 cell（label）显示了 deviceCode，同步更新文字。
 */
function rewriteChildLabels(rootCell, attrName, newValue) {
  if (newValue.length === 0 || rootCell.children == null) {
    return;
  }

  var model = getApp().ctx.model;
  var childCount = model.getChildCount(rootCell);
  var i;

  for (i = 0; i < childCount; i++) {
    var child = model.getChildAt(rootCell, i);
    var labelFieldPath = trim(getAttr(child, "esFieldPath"));

    if (labelFieldPath === attrName || labelFieldPath === "device.code") {
      if (child.value != null && child.value.nodeType === 1) {
        child.value = child.value.cloneNode(true);
        child.value.setAttribute("label", newValue);
      }
    }
  }
}

// ─── 悬空端处理 ──────────────────────────────────────────────────────────

/**
 * 断开 clone 批次中、连接到"不在本批次内"的设备端的 edge。
 *
 * @param {Array} clonedCells   待粘贴 cell 列表
 * @param {Array} originalCells 原始复制源 cell 列表
 */
function disconnectDanglingEdges(clonedCells, originalCells) {
  // 建立原始 cell id → clone 映射
  var cloneIdSet = {};
  var i;

  for (i = 0; i < clonedCells.length; i++) {
    if (clonedCells[i] != null && clonedCells[i].id != null) {
      cloneIdSet[clonedCells[i].id] = true;
    }
  }

  for (i = 0; i < clonedCells.length; i++) {
    var cell = clonedCells[i];

    if (cell == null || !cell.edge) {
      continue;
    }

    // source 不在 clone 批次中 → 断开
    if (cell.source != null && cloneIdSet[cell.source.id] == null) {
      cell.source = null;
    }

    // target 不在 clone 批次中 → 断开
    if (cell.target != null && cloneIdSet[cell.target.id] == null) {
      cell.target = null;
    }
  }
}

// ─── 主入口：安装剪贴板覆写 ──────────────────────────────────────────────

/**
 * 记录 duplicate 日志并通知宿主
 */
function logDuplicates(duplicateLog) {
  for (var k = 0; k < duplicateLog.length; k++) {
    var entry = duplicateLog[k];

    if (entry.type === "device") {
      console.warn(
        "[EID Clipboard] 复制设备: %s → %s (instanceId: %s)",
        entry.originalCode,
        entry.newCode,
        entry.newInstanceId,
      );
    } else if (entry.type === "cable") {
      console.warn(
        "[EID Clipboard] 复制电缆: %s → %s",
        entry.originalCode,
        entry.newCode,
      );
    }
  }

  emitHostEvent("eid-duplicate-created", {
    duplicates: duplicateLog,
  });
}

export function installClipboardOverride(ctx) {
  var graph = ctx.graph;

  // 注意：不覆写 graph.cloneCells。cloneCells 是 drawio 的通用底层方法，
  // 图框/配电柜插入等内部操作也会调用它。过滤逻辑只在剪贴板 + duplicate 层做。

  // ── 0. 通用：从 cell 列表中分离被保护的 cell ─────────────────────────

  function separateProtected(cells) {
    var filtered = [];
    var hadProtected = false;
    var i;

    for (i = 0; i < cells.length; i++) {
      if (isProtectedFromCopy(cells[i])) {
        hadProtected = true;
      } else {
        filtered.push(cells[i]);
      }
    }

    return { filtered: filtered, hadProtected: hadProtected };
  }

  // ── 1. 覆写 graph.duplicateCells：拦截 Ctrl+D ─────────────────────

  var _origDuplicateCells = graph.duplicateCells;

  graph.duplicateCells = function (cells, append) {
    var input = cells || this.getSelectionCells();

    if (!Array.isArray(input) || input.length === 0) {
      return _origDuplicateCells.call(this, cells, append);
    }

    var result = separateProtected(input);

    if (result.hadProtected) {
      emitHostEvent("eid-clipboard-filtered", {
        message: "图框/配电柜无法复制，已自动排除",
      });
    }

    if (result.filtered.length === 0) {
      return [];
    }

    // 在 duplicate 前，先用 cloneCells 拿到克隆体做编号改写
    var model = this.getModel();
    var existingCodes = collectExistingCodes(model);
    var duplicateLog = [];
    var clonedCells = this.cloneCells(result.filtered);

    rewriteClonedCellAttributes(clonedCells, existingCodes, duplicateLog);
    disconnectDanglingEdges(clonedCells, result.filtered);

    // 在一个 compound edit 内插入
    var imported;
    model.beginUpdate();

    try {
      var s = this.gridSize;
      imported = this.importCells(clonedCells, s, s, null);
    } finally {
      model.endUpdate();
    }

    if (imported != null && imported.length > 0) {
      this.setSelectionCells(imported);
    }

    if (duplicateLog.length > 0) {
      logDuplicates(duplicateLog);
    }

    return imported || [];
  };

  // ── 2. 覆写 mxClipboard.paste：在粘贴时改写 clone 属性 ─────────────

  var _origPaste = mxClipboard.paste;

  mxClipboard.paste = function (graph) {
    if (graph == null) {
      return;
    }

    // mxClipboard.cells 是上一次 copy 出来的原始 cell 引用
    var copiedCells = mxClipboard.getCells();

    if (!Array.isArray(copiedCells) || copiedCells.length === 0) {
      return _origPaste.call(this, graph);
    }

    // clone（还未插入 model）
    var clonedCells = graph.cloneCells(copiedCells);

    if (clonedCells.length === 0) {
      return;
    }

    // 收集当前画布已有编号
    var model = graph.getModel();
    var existingCodes = collectExistingCodes(model);
    var duplicateLog = [];

    // 改写设备/电缆编号 + instanceId
    rewriteClonedCellAttributes(clonedCells, existingCodes, duplicateLog);

    // 断开悬空端
    disconnectDanglingEdges(clonedCells, copiedCells);

    // 在一个 compound edit 内插入（保证 undo 是一步）
    model.beginUpdate();

    try {
      var defaultParent = graph.getDefaultParent();
      var dx = mxClipboard.getDx();
      var dy = mxClipboard.getDy();
      var imported = graph.importCells(clonedCells, dx, dy, defaultParent);

      if (imported != null && imported.length > 0) {
        graph.setSelectionCells(imported);
      }

      // 递增偏移，下次再粘贴时位置错开
      mxClipboard.setDx(dx + 10);
      mxClipboard.setDy(dy + 10);
    } finally {
      model.endUpdate();
    }

    // 通知宿主 + console 记录
    if (duplicateLog.length > 0) {
      logDuplicates(duplicateLog);
    }
  };

  // ── 3. 覆写 mxClipboard.copy：确保 copy 时也过滤保护 cell ──────────

  var _origCopy = mxClipboard.copy;

  mxClipboard.copy = function (graph, cells) {
    if (graph == null) {
      return _origCopy.call(this, graph, cells);
    }

    var selectedCells = cells || graph.getSelectionCells();

    if (!Array.isArray(selectedCells) || selectedCells.length === 0) {
      return _origCopy.call(this, graph, cells);
    }

    var result = separateProtected(selectedCells);

    if (result.hadProtected) {
      emitHostEvent("eid-clipboard-filtered", {
        message: "图框/配电柜无法复制，已自动排除",
      });
    }

    if (result.filtered.length === 0) {
      // 所有 cell 都被保护，清空剪贴板，不能传 null（否则 drawio 会回退到 getSelectionCells）
      mxClipboard.setCells(null);
      return null;
    }

    return _origCopy.call(this, graph, result.filtered);
  };

  // ── 4. 覆写 mxClipboard.cut：同理过滤保护 cell ─────────────────────

  var _origCut = mxClipboard.cut;

  mxClipboard.cut = function (graph, cells) {
    if (graph == null) {
      return _origCut.call(this, graph, cells);
    }

    var selectedCells = cells || graph.getSelectionCells();

    if (!Array.isArray(selectedCells) || selectedCells.length === 0) {
      return _origCut.call(this, graph, cells);
    }

    var result = separateProtected(selectedCells);

    if (result.hadProtected) {
      emitHostEvent("eid-clipboard-filtered", {
        message: "图框/配电柜无法剪切，已自动排除",
      });
    }

    if (result.filtered.length === 0) {
      mxClipboard.setCells(null);
      return null;
    }

    return _origCut.call(this, graph, result.filtered);
  };
}
