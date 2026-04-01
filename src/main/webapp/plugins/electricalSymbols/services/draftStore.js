/**
 * 模板草稿服务。
 * 负责模板编辑器草稿的保存、节流、恢复和清理。
 */
// 这里故意只处理草稿，不掺入模板图库逻辑。
import { getApp } from "../core/appRuntime.js";
import { cloneJson, trim } from "../utils/base.js";

function buildDraftStoreDeps() {
  var app = getApp();

  return {
    state: app.appContext.getState(),
    storageKey: app.constants.TEMPLATE_DRAFT_STORAGE_KEY,
    trim,
    cloneJson,
  };
}

function getDraftDeps() {
  return buildDraftStoreDeps();
}

function getDraftStorage() {
  try {
    return window.localStorage;
  } catch (e) {
    return null;
  }
}

function clearDraftSaveTimer() {
  var deps = getDraftDeps();
  var state = deps.state;

  if (state.draftSaveTimer != null) {
    window.clearTimeout(state.draftSaveTimer);
    state.draftSaveTimer = null;
  }
}

function buildEditorDraftSnapshot() {
  var deps = getDraftDeps();
  var state = deps.state;
  var trim = deps.trim;
  var cloneJson = deps.cloneJson;

  return {
    symbolId:
      state.symbolIdInput != null ? trim(state.symbolIdInput.value) : "",
    symbolIdTouched: !!state.symbolIdTouched,
    templateName:
      state.templateNameInput != null ? trim(state.templateNameInput.value) : "",
    templateWidth:
      state.templateWidthInput != null
        ? trim(state.templateWidthInput.value)
        : "",
    templateHeight:
      state.templateHeightInput != null
        ? trim(state.templateHeightInput.value)
        : "",
    uploadedPrimarySvg: state.uploadedPrimarySvg || "",
    uploadedPrimarySvgName: state.uploadedPrimarySvgName || "",
    uploadedPrimarySvgSize: state.uploadedPrimarySvgSize || null,
    variantEnabled: !!state.variantEnabled,
    variantField:
      state.variantFieldInput != null ? trim(state.variantFieldInput.value) : "",
    previewVariantId: trim(state.previewVariantId),
    schemaFields: cloneJson(state.schemaFields || []),
    variantItems: cloneJson(state.variantItems || []),
    currentSpec:
      state.currentSpec != null ? cloneJson(state.currentSpec) : null,
  };
}

function saveEditorDraftNow() {
  var deps = getDraftDeps();
  var storage = getDraftStorage();

  clearDraftSaveTimer();

  if (storage == null) {
    return;
  }

  try {
    storage.setItem(deps.storageKey, JSON.stringify(buildEditorDraftSnapshot()));
  } catch (e) {
    // ignore storage quota / privacy errors
  }
}

function scheduleEditorDraftSave() {
  var deps = getDraftDeps();
  clearDraftSaveTimer();
  deps.state.draftSaveTimer = window.setTimeout(saveEditorDraftNow, 180);
}

function loadEditorDraft() {
  var deps = getDraftDeps();
  var storage = getDraftStorage();
  var raw;

  if (storage == null) {
    return null;
  }

  try {
    raw = storage.getItem(deps.storageKey);
  } catch (e) {
    return null;
  }

  if (deps.trim(raw).length == 0) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function clearEditorDraft() {
  var deps = getDraftDeps();
  var storage = getDraftStorage();

  clearDraftSaveTimer();

  if (storage == null) {
    return;
  }

  try {
    storage.removeItem(deps.storageKey);
  } catch (e) {
    // ignore storage errors
  }
}

export var draftStoreApi = {
  buildEditorDraftSnapshot,
  clearDraftSaveTimer,
  clearEditorDraft,
  loadEditorDraft,
  saveEditorDraftNow,
  scheduleEditorDraftSave,
};
