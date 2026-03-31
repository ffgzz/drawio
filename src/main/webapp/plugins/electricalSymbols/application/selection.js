/**
 * 当前选中对象解析器。
 * UI 和 runtime 都从这里拿当前 root/frame/cabinet/gap，避免到处重复 selection 判定。
 */
export function createSelectionApi(deps) {
  var graph = deps.ctx.graph;

  function getSelectedCell() {
    return graph.getSelectionCell();
  }

  function getSelectedRoot() {
    return deps.findElectricalRoot(getSelectedCell());
  }

  function getSelectedFrame() {
    return deps.findDrawingFrame(getSelectedCell());
  }

  function getSelectedCabinetSegment() {
    return deps.findCabinetSegment(getSelectedCell());
  }

  function getSelectedCabinetGap() {
    var cell = getSelectedCell();
    return deps.isCabinetGap(cell) ? cell : null;
  }

  return {
    getSelectedCabinetGap,
    getSelectedCabinetSegment,
    getSelectedCell,
    getSelectedFrame,
    getSelectedRoot,
  };
}
