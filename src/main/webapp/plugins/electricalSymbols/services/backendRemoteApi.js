/**
 * 后端远端 API 子模块。
 * 负责 fetch 请求、图纸保存/加载/回滚以及历史查询，不直接处理 localStorage。
 */
export function createBackendRemoteApi(deps) {
  var state = deps.state;
  var trim = deps.trim;
  var toInt = deps.toInt;
  var cloneJson = deps.cloneJson;

  function requestBackendJson(method, url, body) {
    var options = {
      method,
      headers: {
        Accept: "application/json",
      },
    };

    if (body != null) {
      options.headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(body);
    }

    return fetch(url, options).then(function (response) {
      return response.text().then(function (text) {
        var payload = text.length > 0 ? JSON.parse(text) : null;

        if (!response.ok) {
          var error = new Error(
            payload != null && payload.message != null
              ? payload.message
              : "后端请求失败",
          );
          error.payload = payload;
          throw error;
        }

        return payload;
      });
    });
  }

  async function saveDiagramToBackend(title) {
    var backendUrl = deps.normalizeBackendBaseUrl(state.backendBaseUrl);
    var actorId = trim(state.backendActorId) || "local-user";
    var diagramId = trim(state.backendDiagramId);
    var pendingChanges = cloneJson(state.pendingChangeRecords || []);
    var response;

    if (diagramId.length == 0) {
      response = await requestBackendJson("POST", backendUrl + "/diagrams", {
        title: trim(title) || "未命名图纸",
      });
      diagramId = trim(response.diagramId);
      state.backendDiagramId = diagramId;
      state.backendDiagramTitle =
        trim(response.title) || trim(title) || "未命名图纸";
      state.backendDiagramVersion = 0;
      state.backendLastSnapshot = response.snapshot || null;
    }

    var latestSnapshot = null;

    if (diagramId.length > 0) {
      latestSnapshot = await requestBackendJson(
        "GET",
        backendUrl + "/diagrams/" + encodeURIComponent(diagramId),
      );

      state.backendDiagramTitle =
        trim(latestSnapshot.title) || state.backendDiagramTitle;
      state.backendDiagramVersion = Math.max(
        0,
        toInt(latestSnapshot.version, state.backendDiagramVersion),
      );
      state.backendLastSnapshot =
        deps.normalizeSnapshotGenericIds(latestSnapshot);
    }

    var snapshot = deps.exportDiagramSnapshot();

    snapshot.diagramId = diagramId;
    var snapshotDiff = deps.computeSnapshotChanges(
      state.backendLastSnapshot,
      snapshot,
    );

    if (snapshotDiff.changes.length == 0) {
      state.backendLastSnapshot =
        latestSnapshot != null
          ? cloneJson(state.backendLastSnapshot)
          : snapshot;
      deps.resetPendingChangeRecords(
        latestSnapshot != null ? state.backendLastSnapshot : snapshot,
      );
      deps.saveBackendSession();
      deps.showStatus("没有检测到需要保存的变更", false);
      return;
    }

    var diff = {
      touchedObjectIds: deps.uniqueStrings(
        (snapshotDiff.touchedObjectIds || []).concat(
          deps.collectChangeObjectIds(pendingChanges),
        ),
      ),
      changes: pendingChanges,
    };

    if (diff.changes.length == 0 && snapshotDiff.changes.length > 0) {
      var createdAt = new Date().toISOString();
      var sequence = state.nextChangeSequence++;
      var i;

      for (i = 0; i < snapshotDiff.changes.length; i++) {
        var fallbackChange = cloneJson(snapshotDiff.changes[i]);
        fallbackChange.sequence = sequence;
        fallbackChange.createdAt = createdAt;
        diff.changes.push(fallbackChange);
      }

      diff.touchedObjectIds = deps.uniqueStrings(
        diff.touchedObjectIds.concat(deps.collectChangeObjectIds(diff.changes)),
      );
    }

    if (
      typeof console !== "undefined" &&
      typeof console.groupCollapsed === "function"
    ) {
      console.groupCollapsed(
        "[electricalSymbols] saveDiagramToBackend",
        diagramId || "(new)",
      );
      console.log("snapshot", snapshot);
      console.log("diff", diff);
      console.groupEnd();
    } else if (
      typeof console !== "undefined" &&
      typeof console.log === "function"
    ) {
      console.log("[electricalSymbols] snapshot", snapshot);
      console.log("[electricalSymbols] diff", diff);
    }

    response = await requestBackendJson(
      "POST",
      backendUrl + "/diagrams/" + encodeURIComponent(diagramId) + "/commits",
      {
        baseVersion: Math.max(0, state.backendDiagramVersion),
        actorId,
        touchedObjectIds: diff.touchedObjectIds,
        changes: diff.changes,
        snapshot,
      },
    );

    deps.syncBackendState(
      diagramId,
      response.version,
      response.snapshot,
      trim(title) || state.backendDiagramTitle,
    );
    deps.showStatus(
      "已保存到后端：" +
        (state.backendDiagramTitle || diagramId) +
        "，版本：" +
        String(response.version),
      false,
    );
  }

  function listDiagramsFromBackend() {
    return requestBackendJson(
      "GET",
      deps.normalizeBackendBaseUrl(state.backendBaseUrl) + "/diagrams",
    );
  }

  function getDiagramHistoryFromBackend(diagramId) {
    return requestBackendJson(
      "GET",
      deps.normalizeBackendBaseUrl(state.backendBaseUrl) +
        "/diagrams/" +
        encodeURIComponent(diagramId) +
        "/history",
    );
  }

  async function rollbackDiagramToVersion(targetVersion) {
    var diagramId = trim(state.backendDiagramId);

    if (diagramId.length == 0) {
      throw new Error("请先保存图纸到后端，再执行版本回滚");
    }

    var response = await requestBackendJson(
      "POST",
      deps.normalizeBackendBaseUrl(state.backendBaseUrl) +
        "/diagrams/" +
        encodeURIComponent(diagramId) +
        "/rollback",
      {
        targetVersion: Math.max(0, toInt(targetVersion, 0)),
        actorId: trim(state.backendActorId) || "local-user",
      },
    );

    deps.restoreDiagramSnapshot(response.snapshot);
    deps.syncBackendState(
      diagramId,
      response.version,
      response.snapshot,
      state.backendDiagramTitle,
    );
    deps.showStatus(
      "已回滚到版本 v" +
        String(targetVersion) +
        "，当前最新版本为 v" +
        String(response.version),
      false,
    );

    return response;
  }

  async function loadDiagramFromBackend(diagramId) {
    var targetDiagramId = trim(diagramId || state.backendDiagramId);

    if (targetDiagramId.length == 0) {
      throw new Error("请先选择一张图纸");
    }

    var backendUrl = deps.normalizeBackendBaseUrl(state.backendBaseUrl);
    var snapshot = await requestBackendJson(
      "GET",
      backendUrl + "/diagrams/" + encodeURIComponent(targetDiagramId),
    );

    deps.restoreDiagramSnapshot(snapshot);
    deps.syncBackendState(targetDiagramId, snapshot.version, snapshot);
    deps.showStatus("已从后端加载图纸，版本：" + String(snapshot.version), false);
  }

  return {
    getDiagramHistoryFromBackend,
    listDiagramsFromBackend,
    loadDiagramFromBackend,
    requestBackendJson,
    rollbackDiagramToVersion,
    saveDiagramToBackend,
  };
}
