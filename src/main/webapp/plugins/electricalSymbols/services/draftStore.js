/**
 * 模板草稿服务。
 * 负责模板编辑器草稿的保存、节流、恢复和清理。
 */
// 这里故意只处理草稿，不掺入模板图库逻辑。
export function createDraftStore(deps) {
  var ctx = deps.ctx;
  var state = ctx.state;
  var storageKey = ctx.constants.TEMPLATE_DRAFT_STORAGE_KEY;
  var trim = deps.trim;
  var cloneJson = deps.cloneJson;

  function getDraftStorage() {
    try {
      return window.localStorage;
    } catch (e) {
      return null;
    }
  }

  function clearDraftSaveTimer() {
    if (state.draftSaveTimer != null) {
      window.clearTimeout(state.draftSaveTimer);
      state.draftSaveTimer = null;
    }
  }

  function buildEditorDraftSnapshot() {
    return {
      symbolId:
        state.symbolIdInput != null ? trim(state.symbolIdInput.value) : "",
      symbolIdTouched: !!state.symbolIdTouched,
      templateName:
        state.templateNameInput != null
          ? trim(state.templateNameInput.value)
          : "",
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
        state.variantFieldInput != null
          ? trim(state.variantFieldInput.value)
          : "",
      previewVariantId: trim(state.previewVariantId),
      schemaFields: cloneJson(state.schemaFields || []),
      variantItems: cloneJson(state.variantItems || []),
      currentSpec:
        state.currentSpec != null ? cloneJson(state.currentSpec) : null,
    };
  }

  function saveEditorDraftNow() {
    var storage = getDraftStorage();

    clearDraftSaveTimer();

    if (storage == null) {
      return;
    }

    try {
      storage.setItem(storageKey, JSON.stringify(buildEditorDraftSnapshot()));
    } catch (e) {
      // ignore storage quota / privacy errors
    }
  }

  function scheduleEditorDraftSave() {
    clearDraftSaveTimer();
    state.draftSaveTimer = window.setTimeout(saveEditorDraftNow, 180);
  }

  function loadEditorDraft() {
    var storage = getDraftStorage();
    var raw;

    if (storage == null) {
      return null;
    }

    try {
      raw = storage.getItem(storageKey);
    } catch (e) {
      return null;
    }

    if (trim(raw).length == 0) {
      return null;
    }

    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function clearEditorDraft() {
    var storage = getDraftStorage();

    clearDraftSaveTimer();

    if (storage == null) {
      return;
    }

    try {
      storage.removeItem(storageKey);
    } catch (e) {
      // ignore storage errors
    }
  }

  return {
    buildEditorDraftSnapshot,
    clearDraftSaveTimer,
    clearEditorDraft,
    loadEditorDraft,
    saveEditorDraftNow,
    scheduleEditorDraftSave,
  };
}
