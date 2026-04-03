/**
 * 后端服务层。
 * 这里作为组合层，连接后端会话存储和远端 API，对外暴露统一的 backendService。
 */
import { getApp } from "../core/appRuntime.js";
import { resetPendingChangeRecords, showStatus } from "../core/runtimeHelpers.js";
import { snapshotDomainApi } from "../domain/snapshot.js";
import { emitHostEvent } from "../runtime/hostBridge.js";
import {
  loadBackendSession,
  normalizeBackendBaseUrl,
  resetBackendBinding,
  saveBackendSession,
  syncBackendState,
} from "./backendSession.js";
import {
  getDiagramHistoryFromBackend,
  listDiagramsFromBackend,
  loadDiagramFromBackend,
  requestBackendJson,
  rollbackDiagramToVersion,
  saveDiagramToBackend,
} from "./backendRemoteApi.js";

function buildBackendServiceDeps() {
  var app = getApp();
  var ctx = app.ctx;

  return {
    state: ctx.state,
    constants: ctx.constants,
    normalizeSnapshotGenericIds: snapshotDomainApi.normalizeSnapshotGenericIds,
    exportDiagramSnapshot: snapshotDomainApi.exportDiagramSnapshot,
    resetPendingChangeRecords,
    computeSnapshotChanges: snapshotDomainApi.computeSnapshotChanges,
    collectChangeObjectIds: snapshotDomainApi.collectChangeObjectIds,
    showStatus,
    restoreDiagramSnapshot: snapshotDomainApi.restoreDiagramSnapshot,
  };
}

function getBackendDeps() {
  return buildBackendServiceDeps();
}

function normalizeBackendBaseUrlCompat(url) {
  var deps = getBackendDeps();
  return normalizeBackendBaseUrl(url, deps.constants);
}

function syncBackendStateCompat(diagramId, version, snapshot, title) {
  var deps = getBackendDeps();
  return syncBackendState(
    deps.state,
    deps.constants,
    diagramId,
    version,
    snapshot,
    title,
    deps.normalizeSnapshotGenericIds,
    deps.resetPendingChangeRecords,
    deps.exportDiagramSnapshot,
  );
}

function loadBackendSessionCompat() {
  var deps = getBackendDeps();
  return loadBackendSession(
    deps.state,
    deps.constants,
    deps.normalizeSnapshotGenericIds,
  );
}

function saveBackendSessionCompat() {
  var deps = getBackendDeps();
  return saveBackendSession(
    deps.state,
    deps.constants,
    deps.normalizeSnapshotGenericIds,
  );
}

function listDiagramsFromBackendCompat() {
  var deps = getBackendDeps();
  return listDiagramsFromBackend(deps.state, function (url) {
    return normalizeBackendBaseUrl(url, deps.constants);
  });
}

function getDiagramHistoryFromBackendCompat(diagramId) {
  var deps = getBackendDeps();
  return getDiagramHistoryFromBackend(
    deps.state,
    function (url) {
      return normalizeBackendBaseUrl(url, deps.constants);
    },
    diagramId,
  );
}

function loadDiagramFromBackendCompat(diagramId) {
  var deps = getBackendDeps();
  return loadDiagramFromBackend(
    deps.state,
    {
      normalizeBackendBaseUrl: function (url) {
        return normalizeBackendBaseUrl(url, deps.constants);
      },
      restoreDiagramSnapshot: deps.restoreDiagramSnapshot,
      showStatus: deps.showStatus,
      syncBackendState: function (targetDiagramId, version, snapshot, title) {
        return syncBackendState(
          deps.state,
          deps.constants,
          targetDiagramId,
          version,
          snapshot,
          title,
          deps.normalizeSnapshotGenericIds,
          deps.resetPendingChangeRecords,
          deps.exportDiagramSnapshot,
        );
      },
    },
    diagramId,
  );
}

function resetBackendBindingCompat() {
  var deps = getBackendDeps();
  return resetBackendBinding(
    deps.state,
    deps.constants,
    deps.normalizeSnapshotGenericIds,
    deps.resetPendingChangeRecords,
    deps.exportDiagramSnapshot,
  );
}

function rollbackDiagramToVersionCompat(targetVersion) {
  var deps = getBackendDeps();
  return rollbackDiagramToVersion(
    deps.state,
    {
      normalizeBackendBaseUrl: function (url) {
        return normalizeBackendBaseUrl(url, deps.constants);
      },
      restoreDiagramSnapshot: deps.restoreDiagramSnapshot,
      showStatus: deps.showStatus,
      syncBackendState: function (diagramId, version, snapshot, title) {
        return syncBackendState(
          deps.state,
          deps.constants,
          diagramId,
          version,
          snapshot,
          title,
          deps.normalizeSnapshotGenericIds,
          deps.resetPendingChangeRecords,
          deps.exportDiagramSnapshot,
        );
      },
    },
    targetVersion,
  );
}

function saveDiagramToBackendCompat(title) {
  var deps = getBackendDeps();
  return saveDiagramToBackend(
    deps.state,
    {
      normalizeBackendBaseUrl: function (url) {
        return normalizeBackendBaseUrl(url, deps.constants);
      },
      normalizeSnapshotGenericIds: deps.normalizeSnapshotGenericIds,
      exportDiagramSnapshot: deps.exportDiagramSnapshot,
      resetPendingChangeRecords: deps.resetPendingChangeRecords,
      computeSnapshotChanges: deps.computeSnapshotChanges,
      collectChangeObjectIds: deps.collectChangeObjectIds,
      showStatus: deps.showStatus,
      restoreDiagramSnapshot: deps.restoreDiagramSnapshot,
      emitBackendSavePayload: function (payload) {
        emitHostEvent("eid-backend-save", payload);
      },
      saveBackendSession: function () {
        return saveBackendSession(
          deps.state,
          deps.constants,
          deps.normalizeSnapshotGenericIds,
        );
      },
      syncBackendState: function (diagramId, version, snapshot, nextTitle) {
        return syncBackendState(
          deps.state,
          deps.constants,
          diagramId,
          version,
          snapshot,
          nextTitle,
          deps.normalizeSnapshotGenericIds,
          deps.resetPendingChangeRecords,
          deps.exportDiagramSnapshot,
        );
      },
    },
    title,
  );
}

export var backendServiceApi = {
  getDiagramHistoryFromBackend: getDiagramHistoryFromBackendCompat,
  listDiagramsFromBackend: listDiagramsFromBackendCompat,
  loadBackendSession: loadBackendSessionCompat,
  loadDiagramFromBackend: loadDiagramFromBackendCompat,
  normalizeBackendBaseUrl: normalizeBackendBaseUrlCompat,
  requestBackendJson,
  resetBackendBinding: resetBackendBindingCompat,
  rollbackDiagramToVersion: rollbackDiagramToVersionCompat,
  saveBackendSession: saveBackendSessionCompat,
  saveDiagramToBackend: saveDiagramToBackendCompat,
  syncBackendState: syncBackendStateCompat,
};
