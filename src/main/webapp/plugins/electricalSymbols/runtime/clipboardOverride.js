/**
 * 剪贴板覆写模块。
 *
 * drawio 有两条互不相通的复制粘贴链路，两条都必须拦：
 *   A. mxClipboard.copy / cut / paste —— 菜单和右键走这条
 *   B. EditorUi.copyCells / pasteXml —— Ctrl+C/X/V 走这条
 *      （installNativeClipboardHandler 用隐藏 contenteditable 接管了快捷键，
 *        copyCells 直接读 graph.getSelectionCells()，pasteXml 直接 importXml，
 *        完全不经过 mxClipboard）
 *
 * 两条链路上统一实现：
 *   1. 阻止图框/配电柜及其内部构件被复制（过滤 + toast 通知宿主）
 *   2. 设备/电缆粘贴时自动递增编号 + 生成新 instanceId
 *   3. 电缆悬空端自动断开
 *   4. 插入与改写合并进同一条 undo 记录，避免增量 diff 看到中间态
 *   5. 通知宿主页面（emitHostEvent）完成 React 侧数据同步
 */
import { getApp } from "../core/appRuntime.js";
import { generateUuid, trim } from "../utils/base.js";
import { getAttr } from "../utils/xml.js";
import {
  isDrawingFrame,
  isCabinetSegment,
  isCabinetGap,
  isElectricalRoot,
  isFrameDecorationCell,
} from "../core/runtimeHelpers.js";
import { emitHostEvent } from "./hostBridge.js";
import { sanitizePastedGraphXml } from "./clipboardSanitizer.js";

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
 * 判断 cell 属于哪一类"不允许单独复制"的对象。
 *
 * 注意：图框样式是 container=1;dropTarget=1，画布上的图元几乎都是图框的**子节点**
 * （见 application/commands.js 的 insertCellIntoFrame）。因此绝不能用"祖先里有图框
 * 就算受保护"的规则，否则所有图元都会被误判成不可复制。这里的判定只看 cell 自身
 * 的身份：
 *   - 图框                                   → "frame"
 *   - 配电柜段 / 配电柜断点 / 配电柜内部构件 → "cabinet"
 *   - 插件生成的内部构件（body/label/柜体/图框标题/装饰件）→ "internal"
 *   - 图元根节点、用户自己画的普通图形       → null（可自由复制）
 *
 * @returns {string|null} "frame" | "cabinet" | "internal" | null
 */
function classifyCopyProtection(cell) {
  if (cell == null) {
    return null;
  }

  if (isDrawingFrame(cell)) {
    return "frame";
  }

  if (isCabinetSegment(cell) || isCabinetGap(cell)) {
    return "cabinet";
  }

  // 图元根节点即使挂在图框下面也允许复制，必须先于任何父链判断返回。
  if (isElectricalRoot(cell)) {
    return null;
  }

  // 插件生成的内部构件一律带 esKind；图框装饰件靠样式标记。
  if (trim(getAttr(cell, "esKind")).length > 0 || isFrameDecorationCell(cell)) {
    return "internal";
  }

  // 配电柜内部的所有 cell 都由插件生成，跟随配电柜一起受保护。
  var model = getApp().ctx.model;
  var parent = model.getParent(cell);

  while (parent != null) {
    if (isElectricalRoot(parent)) {
      return null;
    }

    if (isCabinetSegment(parent) || isCabinetGap(parent)) {
      return "cabinet";
    }

    parent = model.getParent(parent);
  }

  return null;
}

function isProtectedFromCopy(cell) {
  return classifyCopyProtection(cell) != null;
}

/**
 * 把保护原因汇总成一句面向用户的提示。
 *
 * @param {Object} reasons     {frame, cabinet, internal} 的任意子集
 * @param {string} actionLabel "复制" / "剪切" / "粘贴"
 */
function describeProtection(reasons, actionLabel) {
  var names = [];
  var message = "";

  if (reasons.frame === true) {
    names.push("图框");
  }

  if (reasons.cabinet === true) {
    names.push("配电柜");
  }

  if (names.length > 0) {
    message = names.join("、") + "无法" + actionLabel + "，已自动排除";
  }

  if (reasons.internal === true) {
    var tip = "图元内部构件不能单独" + actionLabel + "，请选择整个图元";
    message = message.length > 0 ? message + "；" + tip : tip;
  }

  return message;
}

function notifyProtection(reasons, actionLabel) {
  var message = describeProtection(reasons, actionLabel);

  if (message.length > 0) {
    emitHostEvent("eid-clipboard-filtered", { message: message });
  }
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
  updateSymbolPayloadJsonOnNode(cell.value, newCode, newInstanceId);
}

/**
 * 直接作用在 value 节点上的版本。插入后的改写路径没有"临时 cell"可用，
 * 必须先改好节点再整体 model.setValue。
 */
function updateSymbolPayloadJsonOnNode(valueNode, newCode, newInstanceId) {
  if (valueNode == null || valueNode.nodeType !== 1) {
    return;
  }

  var payloadStr = trim(valueNode.getAttribute("symbolPayload"));

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

    valueNode.setAttribute("symbolPayload", JSON.stringify(payload));
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

// ─── 已插入 model 的 cell 改写（drawio 原生粘贴路径用）────────────────────

/**
 * 收集 cells 及其全部后代。
 */
function collectSubtree(model, cells) {
  var result = [];
  var stack = Array.isArray(cells) ? cells.slice() : [];

  while (stack.length > 0) {
    var cell = stack.pop();

    if (cell == null) {
      continue;
    }

    result.push(cell);

    var childCount = model.getChildCount(cell);
    var i;

    for (i = 0; i < childCount; i++) {
      stack.push(model.getChildAt(cell, i));
    }
  }

  return result;
}

function rewriteInsertedDeviceCell(model, cell, existingCodes, duplicateLog) {
  if (cell.value == null || cell.value.nodeType !== 1) {
    return;
  }

  var oldCode = trim(getAttr(cell, "deviceCode"));
  var oldInstanceId = trim(getAttr(cell, "instanceId"));
  var newInstanceId = generateUuid();
  var newCode = "";
  var value = cell.value.cloneNode(true);

  if (oldCode.length > 0) {
    newCode = incrementCode(oldCode, existingCodes);
    existingCodes[newCode] = true;
  }

  value.setAttribute("instanceId", newInstanceId);

  if (newCode.length > 0) {
    value.setAttribute("deviceCode", newCode);
  }

  updateSymbolPayloadJsonOnNode(value, newCode, newInstanceId);
  model.setValue(cell, value);

  duplicateLog.push({
    type: "device",
    originalCode: oldCode,
    newCode: newCode,
    originalInstanceId: oldInstanceId,
    newInstanceId: newInstanceId,
  });

  rewriteInsertedChildLabels(model, cell, newCode);
}

function rewriteInsertedCableCell(model, cell, existingCodes, duplicateLog) {
  var oldCode = trim(getAttr(cell, "cableCode"));

  if (oldCode.length === 0 || cell.value == null || cell.value.nodeType !== 1) {
    return;
  }

  var newCode = incrementCode(oldCode, existingCodes);
  var value = cell.value.cloneNode(true);

  existingCodes[newCode] = true;
  value.setAttribute("cableCode", newCode);
  model.setValue(cell, value);

  duplicateLog.push({
    type: "cable",
    originalCode: oldCode,
    newCode: newCode,
  });
}

function rewriteInsertedChildLabels(model, rootCell, newValue) {
  if (newValue.length === 0) {
    return;
  }

  var childCount = model.getChildCount(rootCell);
  var i;

  for (i = 0; i < childCount; i++) {
    var child = model.getChildAt(rootCell, i);
    var labelFieldPath = trim(getAttr(child, "esFieldPath"));

    if (labelFieldPath !== "deviceCode" && labelFieldPath !== "device.code") {
      continue;
    }

    if (child.value != null && child.value.nodeType === 1) {
      var value = child.value.cloneNode(true);
      value.setAttribute("label", newValue);
      model.setValue(child, value);
    }
  }
}

/**
 * 对"已经插入 model"的粘贴结果做与 mxClipboard 路径一致的业务改写：
 * 编号递增、instanceId 重生成、悬空端断开。
 *
 * 所有写操作都走 model.setValue / model.setTerminal；调用方必须已经处在
 * beginUpdate/endUpdate 中，才能和插入动作合并成同一条 undo 记录。
 */
function rewriteImportedCells(graph, importedCells) {
  var model = graph.getModel();
  var all = collectSubtree(model, importedCells);
  var existingCodes = collectExistingCodes(model);
  var duplicateLog = [];
  var importedIds = {};
  var i;

  for (i = 0; i < all.length; i++) {
    if (all[i].id != null) {
      importedIds[all[i].id] = true;
    }
  }

  for (i = 0; i < all.length; i++) {
    var cell = all[i];

    if (isDeviceRoot(cell)) {
      rewriteInsertedDeviceCell(model, cell, existingCodes, duplicateLog);
      continue;
    }

    if (cell.edge) {
      rewriteInsertedCableCell(model, cell, existingCodes, duplicateLog);

      // 连到"不在本批次内"的端点上的边要断开，避免副本抢占原设备的挂点
      if (cell.source != null && importedIds[cell.source.id] !== true) {
        model.setTerminal(cell, null, true);
      }

      if (cell.target != null && importedIds[cell.target.id] !== true) {
        model.setTerminal(cell, null, false);
      }
    }
  }

  if (duplicateLog.length > 0) {
    logDuplicates(duplicateLog);
  }

  return duplicateLog;
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
    var reasons = {};
    var hadProtected = false;
    var i;

    for (i = 0; i < cells.length; i++) {
      var reason = classifyCopyProtection(cells[i]);

      if (reason != null) {
        reasons[reason] = true;
        hadProtected = true;
      } else {
        filtered.push(cells[i]);
      }
    }

    return { filtered: filtered, hadProtected: hadProtected, reasons: reasons };
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
      notifyProtection(result.reasons, "复制");
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
    var imported = null;

    model.beginUpdate();

    try {
      var defaultParent = graph.getDefaultParent();
      var dx = mxClipboard.getDx();
      var dy = mxClipboard.getDy();
      imported = graph.importCells(clonedCells, dx, dy, defaultParent);

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

    // EditorUi.pasteFromLocalClipboard 用返回值做 moveCellsTo（"粘贴到此处"）
    return imported || [];
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
      notifyProtection(result.reasons, "复制");
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
      notifyProtection(result.reasons, "剪切");
    }

    if (result.filtered.length === 0) {
      mxClipboard.setCells(null);
      return null;
    }

    return _origCut.call(this, graph, result.filtered);
  };

  // ── 5. 覆写 EditorUi.copyCells：堵住 drawio 原生剪贴板的复制/剪切旁路 ──
  //
  // drawio 29 的 installNativeClipboardHandler 用一个隐藏 contenteditable 接管了
  // Ctrl+C/X/V：copy 事件里先调 mxClipboard.copy（走上面的覆写，所以提示会弹），
  // 紧接着又调 ui.copyCells(textInput) —— 后者直接拿 graph.getSelectionCells()
  // 序列化成 XML 写进系统剪贴板，完全不看 mxClipboard.cells。
  // 这就是"警告照弹、复制照样成功"的根因，必须在这里再过滤一次。

  var ui = ctx.ui;
  var _origCopyCells = ui.copyCells;

  ui.copyCells = function (elt, removeCells) {
    var currentGraph = this.editor.graph;
    var result = separateProtected(currentGraph.getSelectionCells() || []);

    if (!result.hadProtected) {
      return _origCopyCells.apply(this, arguments);
    }

    notifyProtection(result.reasons, removeCells ? "剪切" : "复制");

    if (result.filtered.length === 0) {
      // 选中的全是受保护对象：清空承载元素，避免把上一次的 XML 再写进剪贴板
      elt.innerText = "";
      return;
    }

    // 下面与 EditorUi.copyCells 原实现保持一致，只是序列化范围换成过滤后的 cells
    var cells = mxUtils.sortCells(
      currentGraph.model.getTopmostCells(result.filtered),
    );
    var xml = mxUtils.getXml(currentGraph.encodeCells(cells));

    mxUtils.setTextContent(elt, encodeURIComponent(xml));

    if (removeCells) {
      currentGraph.removeCells(cells, false);
      currentGraph.lastPasteXml = null;
    } else {
      currentGraph.lastPasteXml = xml;
      currentGraph.pasteCounter = 0;
    }

    elt.focus();
    document.execCommand("selectAll", false, null);
  };

  // ── 6. 覆写 EditorUi.pasteXml：原生粘贴与"粘贴到此处"的共同汇聚点 ──────
  //
  // 补上原生路径缺失的两件事（mxClipboard.paste 覆写里本来就有）：
  //   1. 从 XML 里剔除图框/配电柜及其后代、连到它们的边
  //   2. 对插入结果做编号递增 / instanceId 重生成 / 悬空端断开
  // 整段包在一次 beginUpdate/endUpdate 内，保证 Ctrl+Z 能一次性撤销干净，
  // 也保证增量 diff 只看到一次结构变化。

  var _origPasteXml = ui.pasteXml;

  ui.pasteXml = function (xml, pasteAsLabel, compat, evt, html, pt) {
    // 返回 null 表示"不是图形 XML 或没有受保护对象"，纯文本/图片粘贴原样放行
    var sanitized = sanitizePastedGraphXml(xml);

    if (sanitized != null) {
      notifyProtection(sanitized.reasons, "粘贴");

      if (sanitized.removedAll) {
        return null;
      }

      xml = sanitized.xml;
    }

    var currentModel = this.editor.graph.getModel();
    var pasted = null;

    currentModel.beginUpdate();

    try {
      pasted = _origPasteXml.call(
        this,
        xml,
        pasteAsLabel,
        compat,
        evt,
        html,
        pt,
      );

      if (Array.isArray(pasted) && pasted.length > 0) {
        rewriteImportedCells(this.editor.graph, pasted);
      }
    } finally {
      currentModel.endUpdate();
    }

    return pasted;
  };
}
