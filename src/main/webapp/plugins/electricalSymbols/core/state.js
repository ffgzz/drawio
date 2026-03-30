function defineAlias(state, alias, slice, key) {
  Object.defineProperty(state, alias, {
    configurable: true,
    enumerable: true,
    get: function () {
      return state[slice][key];
    },
    set: function (value) {
      state[slice][key] = value;
    },
  });
}

export function createPluginState(constants) {
  var state = {
    editor: {
      status: null,
      symbolIdInput: null,
      symbolIdTouched: false,
      templateNameInput: null,
      templateWidthInput: null,
      templateHeightInput: null,
      variantFieldInput: null,
      variantEnabled: false,
      lastValidVariantField: "",
      schemaFields: [],
      preview: null,
      currentSpec: null,
      previewMode: "select",
      previewVariantId: "",
      selectedItem: null,
      nextId: 1,
      uploadedPrimarySvg: "",
      uploadedPrimarySvgName: "",
      uploadedPrimarySvgSize: null,
      variantItems: [],
      draftSaveTimer: null,
    },
    windows: {
      templateEditor: null,
      templateBrowser: null,
      instanceEditor: null,
      cabinetGapDialog: null,
    },
    library: {
      images: [],
    },
    backend: {
      baseUrl: constants.BACKEND_DEFAULT_BASE_URL,
      actorId: "local-user",
      diagramId: "",
      diagramTitle: "",
      diagramVersion: 0,
      lastSnapshot: null,
    },
    canvas: {
      updatingModel: false,
      allowProtectedDelete: false,
      pendingChangeRecords: [],
      nextChangeSequence: 1,
      suspendOperationRecording: false,
      lastOperationSnapshot: null,
    },
    compose: {
      session: null,
      overlay: null,
      keyHandler: null,
    },
    portSwap: {
      session: null,
      overlay: null,
    },
    cabinet: {
      frameConfig: null,
      selectedGap: null,
    },
  };

  defineAlias(state, "libraryImages", "library", "images");
  defineAlias(state, "updatingModel", "canvas", "updatingModel");
  defineAlias(state, "window", "windows", "templateEditor");
  defineAlias(state, "templatesWindow", "windows", "templateBrowser");
  defineAlias(state, "instanceWindow", "windows", "instanceEditor");
  defineAlias(state, "instanceComposeSession", "compose", "session");
  defineAlias(state, "instanceComposeOverlay", "compose", "overlay");
  defineAlias(state, "instanceComposeKeyHandler", "compose", "keyHandler");
  defineAlias(state, "status", "editor", "status");
  defineAlias(state, "symbolIdInput", "editor", "symbolIdInput");
  defineAlias(state, "symbolIdTouched", "editor", "symbolIdTouched");
  defineAlias(state, "templateNameInput", "editor", "templateNameInput");
  defineAlias(state, "templateWidthInput", "editor", "templateWidthInput");
  defineAlias(state, "templateHeightInput", "editor", "templateHeightInput");
  defineAlias(state, "variantFieldInput", "editor", "variantFieldInput");
  defineAlias(state, "variantEnabled", "editor", "variantEnabled");
  defineAlias(
    state,
    "lastValidVariantField",
    "editor",
    "lastValidVariantField",
  );
  defineAlias(state, "schemaFields", "editor", "schemaFields");
  defineAlias(state, "preview", "editor", "preview");
  defineAlias(state, "currentSpec", "editor", "currentSpec");
  defineAlias(state, "previewMode", "editor", "previewMode");
  defineAlias(state, "previewVariantId", "editor", "previewVariantId");
  defineAlias(state, "selectedItem", "editor", "selectedItem");
  defineAlias(state, "nextId", "editor", "nextId");
  defineAlias(state, "uploadedPrimarySvg", "editor", "uploadedPrimarySvg");
  defineAlias(
    state,
    "uploadedPrimarySvgName",
    "editor",
    "uploadedPrimarySvgName",
  );
  defineAlias(
    state,
    "uploadedPrimarySvgSize",
    "editor",
    "uploadedPrimarySvgSize",
  );
  defineAlias(state, "variantItems", "editor", "variantItems");
  defineAlias(state, "draftSaveTimer", "editor", "draftSaveTimer");
  defineAlias(state, "frameConfig", "cabinet", "frameConfig");
  defineAlias(state, "selectedCabinetGap", "cabinet", "selectedGap");
  defineAlias(state, "gapDialogWindow", "windows", "cabinetGapDialog");
  defineAlias(state, "portSwapSession", "portSwap", "session");
  defineAlias(state, "portSwapOverlay", "portSwap", "overlay");
  defineAlias(state, "allowProtectedDelete", "canvas", "allowProtectedDelete");
  defineAlias(state, "backendBaseUrl", "backend", "baseUrl");
  defineAlias(state, "backendActorId", "backend", "actorId");
  defineAlias(state, "backendDiagramId", "backend", "diagramId");
  defineAlias(state, "backendDiagramTitle", "backend", "diagramTitle");
  defineAlias(state, "backendDiagramVersion", "backend", "diagramVersion");
  defineAlias(state, "backendLastSnapshot", "backend", "lastSnapshot");
  defineAlias(state, "pendingChangeRecords", "canvas", "pendingChangeRecords");
  defineAlias(state, "nextChangeSequence", "canvas", "nextChangeSequence");
  defineAlias(
    state,
    "suspendOperationRecording",
    "canvas",
    "suspendOperationRecording",
  );
  defineAlias(state, "lastOperationSnapshot", "canvas", "lastOperationSnapshot");

  return state;
}

