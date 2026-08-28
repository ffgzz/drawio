/**
 * 插件常量定义。
 * 这里集中维护标签名、类型名、默认尺寸和各类运行参数，避免魔法字符串散落。
 */
// ELECTRICAL_CONSTANTS 是整个插件共享的只读配置表。
export const ELECTRICAL_CONSTANTS = Object.freeze({
  LIBRARY_TITLE: "电气图元库",
  ROOT_TAG: "ElectricalSymbol",
  BODY_TAG: "ElectricalBody",
  LABEL_TAG: "ElectricalLabel",
  FRAME_TAG: "DrawingFrame",
  FRAME_LABEL_TAG: "DrawingFrameLabel",
  CABINET_TAG: "CabinetSegment",
  CABINET_BODY_TAG: "CabinetBody",
  CABINET_BLOCK_TAG: "CabinetBlock",
  CABINET_SWITCH_LINK_TAG: "CabinetSwitchLink",
  CABINET_BUSBAR_TAG: "CabinetBusbar",
  CABINET_TEXT_TAG: "CabinetText",
  CABINET_GAP_TAG: "CabinetGap",
  ROOT_TYPE: "electricalSymbol",
  FRAME_TYPE: "drawingFrame",
  CABINET_TYPE: "cabinetSegment",
  CABINET_GAP_TYPE: "cabinetGap",
  BODY_KIND: "body",
  LABEL_KIND: "label",
  FRAME_LABEL_KIND: "pageLabel",
  CABINET_BODY_KIND: "cabinetBody",
  CABINET_BLOCK_KIND: "cabinetBlock",
  CABINET_SWITCH_LINK_KIND: "cabinetSwitchLink",
  CABINET_BUSBAR_KIND: "cabinetBusbar",
  CABINET_NAME_LABEL_KIND: "cabinetNameLabel",
  CABINET_LOCATION_LABEL_KIND: "cabinetLocationLabel",
  CABINET_DESIGNATION_LABEL_KIND: "cabinetDesignationLabel",
  CABINET_GAP_KIND: "cabinetGap",
  PORT_EDGE_SNAP_THRESHOLD_PX: 14,
  // Screen-space distance used when a user releases an electrical symbol near
  // a compatible port. 18px was too precise at normal zoom and made the
  // feature feel unavailable, especially on Retina displays.
  CANVAS_PORT_SNAP_THRESHOLD_PX: 36,
  CANVAS_PORT_SNAP_PREVIEW_RADIUS_PX: 160,
  TEMPLATE_DRAFT_STORAGE_KEY: "electrical-symbol-template-draft",
  FRAME_DEFAULT_WIDTH: 820,
  FRAME_DEFAULT_HEIGHT: 1180,
  FRAME_HORIZONTAL_GAP: 40,
  FRAME_VERTICAL_GAP: 56,
  FRAME_CONTENT_RATIO: 0.8,
  FRAME_MARGIN_RATIO: 0.1,
  // 柜宽要放得下：左壁留白 + 纵向名称文字 + 母线 + 引出线段 + 开关
  CABINET_DEFAULT_WIDTH: 180,
  CABINET_MIN_WIDTH: 90,
  // 母线距左壁占柜宽的比例；纵向名称文字摆在左壁与母线之间
  // 配电柜可以比普通图元占得更高一些：图框内容区是 0.8，柜体给到 0.86
  CABINET_CONTENT_RATIO: 0.86,
  CABINET_BUSBAR_RATIO: 0.28,
  // 母线上下不到顶不到底的留白
  CABINET_BUSBAR_INSET_Y: 34,
  // 母线到开关左端的引出线长度
  CABINET_SWITCH_LEAD: 52,
  // 柜体首块之上、末块之下的留白（编号文字要占顶部这一段）
  CABINET_HEAD_PADDING: 44,
  // 换页折断标识的深度
  CABINET_BREAK_DEPTH: 22,
  // 折断边左右两段各占柜宽的比例。两段之和超过 1，重叠区里的斜线才连成反 Z
  CABINET_BREAK_SEGMENT_RATIO: 0.6,
  // 柜体文字的默认值：不强制用户填，插入时先按这套渲染，再由参数导入覆盖
  CABINET_DEFAULT_CODE: "GB01",
  CABINET_DEFAULT_VOLTAGE: "230VAC",
  CABINET_DEFAULT_LOCATION: "DECK / EL. EQ.",
  // 母线线宽
  CABINET_BUSBAR_WIDTH: 4,
  CABINET_DEFAULT_BLOCK_COUNT: 4,
  CABINET_BLOCK_DEFAULT_HEIGHT: 150,
  CABINET_BLOCK_MIN_HEIGHT: 24,
  CABINET_BLOCK_MAX_HEIGHT: 4000,
  CABINET_DEFAULT_X: 72,
  CABINET_TAIL_PADDING: 40,
  BACKEND_SESSION_STORAGE_KEY: "electrical-symbol-backend-session",
  BACKEND_DEFAULT_BASE_URL: "/api",
  INSTANCE_COMPOSE_ZONE_PADDING: 80,
  INSTANCE_COMPOSE_ZONE_MIN_WIDTH: 260,
  INSTANCE_COMPOSE_ZONE_MIN_HEIGHT: 200,
});
