/**
 * 后端服务层。
 * 这里作为组合层，连接后端会话存储和远端 API，对外暴露统一的 backendService。
 */
import { createBackendSessionStore } from "./backendSession.js";
import { createBackendRemoteApi } from "./backendRemoteApi.js";

export function createBackendService(deps) {
  var session = createBackendSessionStore(deps);
  var remoteApi = createBackendRemoteApi({
    state: deps.state,
    trim: deps.trim,
    toInt: deps.toInt,
    cloneJson: deps.cloneJson,
    normalizeBackendBaseUrl: session.normalizeBackendBaseUrl,
    normalizeSnapshotGenericIds: deps.normalizeSnapshotGenericIds,
    exportDiagramSnapshot: deps.exportDiagramSnapshot,
    resetPendingChangeRecords: deps.resetPendingChangeRecords,
    computeSnapshotChanges: deps.computeSnapshotChanges,
    collectChangeObjectIds: deps.collectChangeObjectIds,
    uniqueStrings: deps.uniqueStrings,
    showStatus: deps.showStatus,
    restoreDiagramSnapshot: deps.restoreDiagramSnapshot,
    saveBackendSession: session.saveBackendSession,
    syncBackendState: session.syncBackendState,
  });

  return {
    getDiagramHistoryFromBackend: remoteApi.getDiagramHistoryFromBackend,
    listDiagramsFromBackend: remoteApi.listDiagramsFromBackend,
    loadBackendSession: session.loadBackendSession,
    loadDiagramFromBackend: remoteApi.loadDiagramFromBackend,
    normalizeBackendBaseUrl: session.normalizeBackendBaseUrl,
    requestBackendJson: remoteApi.requestBackendJson,
    resetBackendBinding: session.resetBackendBinding,
    rollbackDiagramToVersion: remoteApi.rollbackDiagramToVersion,
    saveBackendSession: session.saveBackendSession,
    saveDiagramToBackend: remoteApi.saveDiagramToBackend,
    syncBackendState: session.syncBackendState,
  };
}
