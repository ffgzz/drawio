export function createRuntimeHelpers(deps) {
  var ctx = deps.ctx;
  var ui = ctx.ui;
  var model = ctx.model;
  var state = ctx.state;
  var constants = deps.constants;

  function resetPendingChangeRecords(baselineSnapshot) {
    state.pendingChangeRecords = [];
    state.nextChangeSequence = 1;
    state.lastOperationSnapshot =
      baselineSnapshot != null ? deps.cloneJson(baselineSnapshot) : null;
  }

  function isElectricalRoot(cell) {
    return deps.getAttr(cell, "pluginType") == constants.ROOT_TYPE;
  }

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

  function isPortHostRoot(cell) {
    return isElectricalRoot(cell) || isCabinetSegment(cell);
  }

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

  function normalizeMode(mode) {
    mode = deps.trim(mode).toLowerCase();

    return mode == "primary" || mode == "standby" ? mode : "";
  }

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

  function showStatus(message, isError) {
    if (state.status != null) {
      state.status.style.color = isError ? "#b3261e" : "#2e7d32";
      state.status.innerText = message || "";
    }
  }

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
    findElectricalRoot: findElectricalRoot,
    findPortHostRoot: findPortHostRoot,
    generateFrameGroupId: generateFrameGroupId,
    generateFrameId: generateFrameId,
    generateInstanceId: generateInstanceId,
    generateLogicalCabinetId: generateLogicalCabinetId,
    generateSymbolId: generateSymbolId,
    isCabinetGap: isCabinetGap,
    isCabinetSegment: isCabinetSegment,
    isDrawingFrame: isDrawingFrame,
    isElectricalRoot: isElectricalRoot,
    isPortHostRoot: isPortHostRoot,
    nextItemId: nextItemId,
    normalizeMode: normalizeMode,
    resetPendingChangeRecords: resetPendingChangeRecords,
    setCanvasStatus: setCanvasStatus,
    showStatus: showStatus,
  };
}
