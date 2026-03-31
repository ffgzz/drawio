/**
 * 后端服务层。
 * 这里作为组合层，连接后端会话存储和远端 API，对外暴露统一的 backendService。
 */
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

export function createBackendService() {
  var deps = arguments.length > 0 ? arguments[0] : {};
  return {
    getDiagramHistoryFromBackend: function (diagramId) {
      return getDiagramHistoryFromBackend(
        deps.state,
        function (url) {
          return normalizeBackendBaseUrl(url, deps.constants);
        },
        diagramId,
      );
    },
    listDiagramsFromBackend: function () {
      return listDiagramsFromBackend(deps.state, function (url) {
        return normalizeBackendBaseUrl(url, deps.constants);
      });
    },
    loadBackendSession: function () {
      return loadBackendSession(
        deps.state,
        deps.constants,
        deps.normalizeSnapshotGenericIds,
      );
    },
    loadDiagramFromBackend: function (diagramId) {
      return loadDiagramFromBackend(deps.state, {
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
      }, diagramId);
    },
    normalizeBackendBaseUrl: function (url) {
      return normalizeBackendBaseUrl(url, deps.constants);
    },
    requestBackendJson,
    resetBackendBinding: function () {
      return resetBackendBinding(
        deps.state,
        deps.constants,
        deps.normalizeSnapshotGenericIds,
        deps.resetPendingChangeRecords,
        deps.exportDiagramSnapshot,
      );
    },
    rollbackDiagramToVersion: function (targetVersion) {
      return rollbackDiagramToVersion(deps.state, {
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
      }, targetVersion);
    },
    saveBackendSession: function () {
      return saveBackendSession(
        deps.state,
        deps.constants,
        deps.normalizeSnapshotGenericIds,
      );
    },
    saveDiagramToBackend: function (title) {
      return saveDiagramToBackend(deps.state, {
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
      }, title);
    },
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
  };
}
