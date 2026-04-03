/**
 * 资源注册表。
 * 这里维护插件 action 与界面文案对应关系，并统一注册给 mxResources。
 */
// 资源键保持和 action 名称一一对应，便于菜单和按钮复用。
export const ELECTRICAL_RESOURCE_ENTRIES = [
  "electricalSymbols=定义电气图元",
  "electricalBrowse=已定义图元",
  "electricalCreate=创建电气图元",
  "electricalEditInstance=编辑图元实例",
  "electricalComposeInstance=组合图元实例",
  "electricalRefresh=刷新电气图元",
  "electricalExport=导出",
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

// 插件启动时调用一次，把资源批量注册到 draw.io。
export function registerElectricalResources() {
  mxResources.parse(ELECTRICAL_RESOURCE_ENTRIES.join("\n"));
}
