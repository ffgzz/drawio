/**
 * runtime 桥接对象。
 * 所有运行时模式和 graph hook 暴露给外部的接口都挂在这里，避免 UI 直接 import runtime 文件。
 */
export function createRuntimeBridge() {
  return {
    applyEdgePortConstraintMetadata: null,
    clearPortSwapOverlay: null,
    collectComposeDragCandidates: null,
    enterInstanceComposeMode: null,
    enterPortSwapMode: null,
    exitInstanceComposeMode: null,
    exitPortSwapMode: null,
    getNearestCabinetPortFromClick: null,
    handleModelChange: null,
    isBlockedComposeTarget: function () {
      return false;
    },
    isLockedComposedChild: function () {
      return false;
    },
    recordCanvasOperation: null,
    refreshInstanceComposeOverlay: function () {},
  };
}
