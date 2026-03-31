/**
 * UI 桥接对象。
 * 所有窗口、对话框和编辑器对外暴露的入口都挂在这里，runtime 只能通过这里回调 UI。
 */
export function createUiBridge() {
  return {
    clearCurrentPage: null,
    closeGapDialogWindow: function () {},
    createWindow: null,
    insertIntoGraph: null,
    openBackendLoadDialog: null,
    openBackendRollbackDialog: null,
    openBackendSaveDialog: null,
    openCabinetGapDialog: null,
    openCreateFromLibraryDialog: null,
    openEditInstanceDialog: null,
    openEditorWithTemplate: null,
    openInsertCabinetDialog: null,
    openInsertFrameDialog: null,
    openSvgExportDialog: null,
    openTemplateBrowserDialog: null,
    refreshSelection: null,
    toggleWindow: null,
    updatePreview: null,
    updateSelectedItem: null,
  };
}
