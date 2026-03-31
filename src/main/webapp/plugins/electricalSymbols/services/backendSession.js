/**
 * 后端会话子模块。
 * 负责 baseUrl 归一化、本地会话持久化以及当前图纸绑定状态同步。
 */
export function createBackendSessionStore(deps) {
  var state = deps.state;
  var constants = deps.constants;
  var trim = deps.trim;
  var toInt = deps.toInt;
  var cloneJson = deps.cloneJson;
  var isObject = deps.isObject;

  function normalizeBackendBaseUrl(url) {
    var normalized = trim(url).replace(/\/+$/, "");

    if (normalized.length == 0) {
      return constants.BACKEND_DEFAULT_BASE_URL;
    }

    if (
      /^https?:\/\/localhost(?::\d+)?\/api$/i.test(normalized) ||
      /^https?:\/\/127\.0\.0\.1(?::\d+)?\/api$/i.test(normalized)
    ) {
      return constants.BACKEND_DEFAULT_BASE_URL;
    }

    return normalized;
  }

  function loadBackendSession() {
    if (typeof localStorage === "undefined") {
      return;
    }

    try {
      var raw = localStorage.getItem(constants.BACKEND_SESSION_STORAGE_KEY);

      if (!raw) {
        return;
      }

      var session = JSON.parse(raw);
      var normalizedLastSnapshot = deps.normalizeSnapshotGenericIds(
        session.lastSnapshot,
      );
      state.backendBaseUrl = normalizeBackendBaseUrl(session.baseUrl);
      state.backendActorId = trim(session.actorId) || "local-user";
      state.backendDiagramId = trim(session.diagramId);
      state.backendDiagramTitle = trim(session.diagramTitle);
      state.backendDiagramVersion = Math.max(
        0,
        toInt(session.diagramVersion, 0),
      );
      state.backendLastSnapshot = isObject(normalizedLastSnapshot)
        ? cloneJson(normalizedLastSnapshot)
        : null;
    } catch (e) {
      state.backendBaseUrl = constants.BACKEND_DEFAULT_BASE_URL;
      state.backendActorId = "local-user";
      state.backendDiagramId = "";
      state.backendDiagramTitle = "";
      state.backendDiagramVersion = 0;
      state.backendLastSnapshot = null;
    }
  }

  function saveBackendSession() {
    if (typeof localStorage === "undefined") {
      return;
    }

    try {
      localStorage.setItem(
        constants.BACKEND_SESSION_STORAGE_KEY,
        JSON.stringify({
          baseUrl: state.backendBaseUrl,
          actorId: state.backendActorId,
          diagramId: state.backendDiagramId,
          diagramTitle: state.backendDiagramTitle,
          diagramVersion: state.backendDiagramVersion,
          lastSnapshot: deps.normalizeSnapshotGenericIds(
            state.backendLastSnapshot,
          ),
        }),
      );
    } catch (e) {
      // ignore storage failures
    }
  }

  function syncBackendState(diagramId, version, snapshot, title) {
    snapshot = deps.normalizeSnapshotGenericIds(snapshot);
    state.backendDiagramId = trim(diagramId);
    state.backendDiagramTitle = trim(title || state.backendDiagramTitle);
    state.backendDiagramVersion = Math.max(0, toInt(version, 0));
    state.backendLastSnapshot = snapshot != null ? cloneJson(snapshot) : null;
    deps.resetPendingChangeRecords(
      snapshot != null ? snapshot : deps.exportDiagramSnapshot(),
    );
    saveBackendSession();
  }

  function resetBackendBinding() {
    state.backendDiagramId = "";
    state.backendDiagramTitle = "";
    state.backendDiagramVersion = 0;
    state.backendLastSnapshot = null;
    deps.resetPendingChangeRecords(deps.exportDiagramSnapshot());
    saveBackendSession();
  }

  return {
    loadBackendSession,
    normalizeBackendBaseUrl,
    resetBackendBinding,
    saveBackendSession,
    syncBackendState,
  };
}
