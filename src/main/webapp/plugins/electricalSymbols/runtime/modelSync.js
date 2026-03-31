/**
 * 模型同步监听器。
 * 负责记录画布变更快照，以及在 root 尺寸变化后自动刷新内部结构。
 */
// 这里不创建 UI，只监听 model change 事件。
export function createModelSync(deps) {
  var ctx = deps.ctx;
  var model = ctx.model;
  var state = ctx.state;

  function recordCanvasOperation(sender, evt) {
    if (state.suspendOperationRecording || state.updatingModel) {
      return;
    }

    var edit = evt != null ? evt.getProperty("edit") : null;
    var modelChanges = edit != null ? edit.changes : null;
    var previousSnapshot = state.lastOperationSnapshot;
    var currentSnapshot;
    var diff;
    var createdAt;
    var sequence;
    var i;

    if (!Array.isArray(modelChanges) || modelChanges.length == 0) {
      return;
    }

    currentSnapshot = deps.exportDiagramSnapshot();
    previousSnapshot = deps.isObject(previousSnapshot)
      ? previousSnapshot
      : deps.cloneJson(currentSnapshot);
    diff = deps.computeSnapshotChanges(previousSnapshot, currentSnapshot);
    state.lastOperationSnapshot = deps.cloneJson(currentSnapshot);

    if (!Array.isArray(diff.changes) || diff.changes.length == 0) {
      return;
    }

    createdAt = new Date().toISOString();
    sequence = state.nextChangeSequence++;

    for (i = 0; i < diff.changes.length; i++) {
      var change = deps.cloneJson(diff.changes[i]);
      change.sequence = sequence;
      change.createdAt = createdAt;
      state.pendingChangeRecords.push(change);
    }
  }

  function handleModelChange(sender, evt) {
    if (state.updatingModel) {
      return;
    }

    var changes = evt.getProperty("edit").changes;
    var resizeRoots = {};
    var hasResize = false;
    var i;

    for (i = 0; i < changes.length; i++) {
      var change = changes[i];

      if (change.constructor == mxGeometryChange && change.cell != null) {
        if (deps.isElectricalRoot(change.cell)) {
          var previous = change.previous;
          var geometry = model.getGeometry(change.cell);

          if (
            previous != null &&
            geometry != null &&
            (previous.width != geometry.width ||
              previous.height != geometry.height)
          ) {
            resizeRoots[change.cell.id] = change.cell;
          }
        }
      }
    }

    for (var key in resizeRoots) {
      if (resizeRoots.hasOwnProperty(key)) {
        hasResize = true;
        break;
      }
    }

    if (!hasResize) {
      return;
    }

    state.updatingModel = true;
    model.beginUpdate();

    try {
      for (var id in resizeRoots) {
        if (resizeRoots.hasOwnProperty(id)) {
          deps.refreshRoot(resizeRoots[id]);
        }
      }
    } finally {
      model.endUpdate();
      state.updatingModel = false;
    }
  }

  return {
    handleModelChange,
    recordCanvasOperation,
  };
}
