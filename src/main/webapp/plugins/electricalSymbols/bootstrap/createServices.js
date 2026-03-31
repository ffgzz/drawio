/**
 * 服务层注册器。
 * 负责创建草稿、图库和后端服务，让 createApp 只保留高层装配步骤。
 */
import { createDraftStore } from "../services/draftStore.js";
import { createLibraryStore } from "../services/libraryStore.js";
import { createBackendService } from "../services/backend.js";

export function createServiceRegistry(app) {
  var ctx = app.ctx;
  var constants = app.constants;
  var utils = app.utils;
  var domains = app.domains;
  var helpers = app.helpers;

  return {
    draftStore: createDraftStore({
      state: ctx.state,
      storageKey: constants.TEMPLATE_DRAFT_STORAGE_KEY,
      trim: utils.trim,
      cloneJson: utils.cloneJson,
    }),
    libraryStore: createLibraryStore({
      ui: ctx.ui,
      graph: ctx.graph,
      state: ctx.state,
      libraryTitle: constants.LIBRARY_TITLE,
      trim: utils.trim,
      isObject: utils.isObject,
      cloneJson: utils.cloneJson,
      normalizeSpec: domains.spec.normalizeSpec,
      isElectricalRoot: helpers.isElectricalRoot,
      extractSpec: domains.symbol.extractSpec,
      buildSymbolCell: domains.symbol.buildSymbolCell,
      showStatus: app.showStatus,
    }),
    backend: createBackendService({
      state: ctx.state,
      constants,
      trim: utils.trim,
      toInt: utils.toInt,
      cloneJson: utils.cloneJson,
      isObject: utils.isObject,
      normalizeSnapshotGenericIds: domains.snapshot.normalizeSnapshotGenericIds,
      exportDiagramSnapshot: domains.snapshot.exportDiagramSnapshot,
      resetPendingChangeRecords: helpers.resetPendingChangeRecords,
      computeSnapshotChanges: domains.snapshot.computeSnapshotChanges,
      collectChangeObjectIds: domains.snapshot.collectChangeObjectIds,
      uniqueStrings: utils.uniqueStrings,
      showStatus: app.showStatus,
      restoreDiagramSnapshot: domains.snapshot.restoreDiagramSnapshot,
    }),
  };
}
