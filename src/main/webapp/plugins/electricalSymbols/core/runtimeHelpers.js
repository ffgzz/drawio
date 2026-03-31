/**
 * 运行期基础 helper。
 * 这里收口最底层的 cell 类型判断、ID 生成、状态提示和上下文查找逻辑。
 */
// 这些 helper 会被多个 domain/runtime/service 复用，所以放在 core 层。
export function createRuntimeHelpers() {
  var deps = arguments.length > 0 ? arguments[0] : {};
  var ctx = deps.ctx;
  var ui = ctx.ui;
  var model = ctx.model;
  var state = ctx.state;
  var constants = deps.constants;

  // 每次完成一次“完整快照基线切换”后，都要重置待提交的变更记录。
  function resetPendingChangeRecords(baselineSnapshot) {
    state.pendingChangeRecords = [];
    state.nextChangeSequence = 1;
    state.lastOperationSnapshot =
      baselineSnapshot != null ? deps.cloneJson(baselineSnapshot) : null;
  }

  // 根节点识别是插件里最常用的结构判断之一。
  function isElectricalRoot(cell) {
    return deps.getAttr(cell, "pluginType") == constants.ROOT_TYPE;
  }

  // 从任意子节点向上回溯，找到所属的电气图元根节点。
  function findElectricalRoot(cell) {
    while (cell != null) {
      if (isElectricalRoot(cell)) {
        return cell;
      }

      cell = model.getParent(cell);
    }

    return null;
  }

  function isDrawingFrame(cell) {
    return deps.getAttr(cell, "pluginType") == constants.FRAME_TYPE;
  }

  function isCabinetSegment(cell) {
    return deps.getAttr(cell, "pluginType") == constants.CABINET_TYPE;
  }

  function isCabinetGap(cell) {
    return deps.getAttr(cell, "pluginType") == constants.CABINET_GAP_TYPE;
  }

  // 端口宿主既可能是普通电气图元，也可能是配电柜片段。
  function isPortHostRoot(cell) {
    return isElectricalRoot(cell) || isCabinetSegment(cell);
  }

  // 遇到通用图元时停止向上查找，避免误把普通图形当成插件端口宿主。
  function findPortHostRoot(cell) {
    while (cell != null) {
      if (deps.shouldExportGenericObject(cell)) {
        return null;
      }

      if (isPortHostRoot(cell)) {
        return cell;
      }

      cell = model.getParent(cell);
    }

    return null;
  }

  // mode 只允许 primary / standby 两种显式取值。
  function normalizeMode(mode) {
    mode = deps.trim(mode).toLowerCase();

    return mode == "primary" || mode == "standby" ? mode : "";
  }

  // symbolId 用模板名 + 短 UUID 生成，便于识别和避免冲突。
  function generateSymbolId(seed) {
    var base = deps.toSlug(deps.stripFileExtension(seed)) || "electrical-symbol";
    var shortUuid = deps.generateUuid().split("-")[0];

    return base + "-" + shortUuid;
  }

  function generateInstanceId() {
    return deps.generateUuid();
  }

  function generateFrameId() {
    return deps.generateUuid();
  }

  function generateFrameGroupId() {
    return deps.generateUuid();
  }

  function generateLogicalCabinetId() {
    return deps.generateUuid();
  }

  // 统一更新插件窗口底部的状态提示。
  function showStatus(message, isError) {
    if (state.status != null) {
      state.status.style.color = isError ? "#b3261e" : "#2e7d32";
      state.status.innerText = message || "";
    }
  }

  // 统一更新 draw.io 画布状态栏。
  function setCanvasStatus(message) {
    var text = deps.trim(message);

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

  function nextItemId(prefix) {
    var id = prefix + ":" + state.nextId;
    state.nextId += 1;
    return id;
  }

  return {
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
}
