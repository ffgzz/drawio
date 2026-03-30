export const ELECTRICAL_RESOURCE_ENTRIES = [
  "electricalSymbols=定义电气图元",
  "electricalBrowse=已定义图元",
  "electricalCreate=创建电气图元",
  "electricalEditInstance=编辑图元实例",
  "electricalComposeInstance=组合图元实例",
  "electricalRefresh=刷新电气图元",
  "electricalExportSvg=导出SVG",
  "electricalInsertFrame=插入图框",
  "electricalInsertCabinet=插入配电柜",
  "electricalReassignPort=更换挂点",
  "electricalSaveBackend=保存到后端",
  "electricalNewBackend=新建后端图纸",
  "electricalLoadBackend=从后端加载",
  "electricalRollbackBackend=版本回滚",
  "electricalPreview=刷新预览",
  "electricalAddLibrary=加入库",
  "electricalClearScreen=清屏",
  "electricalUploadPrimarySvg=上传默认SVG",
  "electricalEnableVariants=启用变体SVG",
  "electricalAddVariantSvg=新增变体SVG",
];

export function registerElectricalResources() {
  mxResources.parse(ELECTRICAL_RESOURCE_ENTRIES.join("\n"));
}

