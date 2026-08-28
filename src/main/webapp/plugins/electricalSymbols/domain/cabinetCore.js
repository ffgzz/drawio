/**
 * 配电柜纯规则子模块。
 *
 * 配电柜由 n 个可独立调高的矩形块组成，每块派生一个出线端口（右边缘垂直居中），
 * 并可绑定一个开关图元——开关中心骑在块的右边界上，一半在柜内一半在柜外。
 *
 * 这里只负责模型归一化、旧数据迁移、分页与样式生成，不访问 graph/model。
 */
import { ELECTRICAL_CONSTANTS } from "../core/constants.js";
import {
  clamp,
  cloneJson,
  generateUuid,
  isObject,
  toFloat,
  toInt,
  trim,
} from "../utils/base.js";
import { normalizeFrameConfig } from "./frameCore.js";

// ─── 样式 ────────────────────────────────────────────────────────────────

/**
 * 柜体外框。换页处画"反 Z"折断标识：两段横线错开一个 breakDepth，中间一段斜线。
 *
 * 左低右高：左段下沉一个 depth，右段贴着原边；两段各占柜宽 60%，
 * 在中间 20% 的重叠区里由一根反向斜线连起来，形成反 Z。
 *
 *   顶边折断        ╱────────────   右段在上
 *              ────╱                左段在下
 *
 *   底边折断   ─────╲                右段在上
 *                    ╲───────────   左段在下
 */
export function createCabinetOutlineSvg(descriptor) {
  var width = Math.max(20, Math.round(descriptor.width));
  var height = Math.max(20, Math.round(descriptor.height));
  var strokeWidth = 2;
  var inset = strokeWidth / 2;
  var depth = Math.max(
    8,
    Math.min(ELECTRICAL_CONSTANTS.CABINET_BREAK_DEPTH, Math.round(height / 4)),
  );
  var left = inset;
  var right = width - inset;
  var top = inset;
  var bottom = height - inset;
  // 左段 [left, segmentEnd]、右段 [segmentStart, right]，各占柜宽 60%。
  // 两段之和超过柜宽，重叠区里那根斜线反向连接，才形成反 Z。
  var ratio = ELECTRICAL_CONSTANTS.CABINET_BREAK_SEGMENT_RATIO;
  var segmentEnd = Math.round(width * ratio);
  var segmentStart = Math.round(width * (1 - ratio));
  var path;

  // 上下两条折断边都是"左低右高"：左段下沉一个 depth，右段贴着原边。
  // 右壁因此始终连在顶边的 top 与底边的 bottom - depth 之间。
  var topLeftY = descriptor.continuesFromPrev ? top + depth : top;
  var bottomRightY = descriptor.continuesToNext ? bottom - depth : bottom;

  if (descriptor.continuesFromPrev) {
    path =
      "M " + left + " " + topLeftY +
      " L " + segmentEnd + " " + topLeftY +
      " L " + segmentStart + " " + top +
      " L " + right + " " + top;
  } else {
    path = "M " + left + " " + top + " L " + right + " " + top;
  }

  path += " L " + right + " " + bottomRightY;

  if (descriptor.continuesToNext) {
    path +=
      " L " + segmentStart + " " + bottomRightY +
      " L " + segmentEnd + " " + bottom +
      " L " + left + " " + bottom;
  } else {
    path += " L " + left + " " + bottom;
  }

  path += " Z";

  return (
    '<svg xmlns="http://www.w3.org/2000/svg" width="' + width +
    '" height="' + height + '" viewBox="0 0 ' + width + " " + height + '">' +
    '<path d="' + path + '" fill="none" stroke="#111111" stroke-width="' +
    strokeWidth + '" stroke-linejoin="miter" stroke-linecap="square"/>' +
    "</svg>"
  );
}

/**
 * 柜段本身就是那个外框，母线/文字/块都画在它上面。
 */
export function makeCabinetRootStyle(descriptor) {
  return (
    "shape=image;image=data:image/svg+xml," +
    encodeURIComponent(createCabinetOutlineSvg(descriptor)) +
    ";imageAspect=0;html=1;fillColor=none;strokeColor=none;" +
    "connectable=0;container=1;collapsible=0;foldable=0;rotatable=0;" +
    "recursiveResize=1;resizable=1;movable=1;"
  );
}

/**
 * 块只是布局矩形——真实图纸的柜体内部没有横向分隔线。
 *
 * 平时画成浅灰虚线给编辑者一个参照，出图时由 printMode 在视图层改成无描边：
 * 走覆写 getCellStyle 的路子，不动模型，所以不进 undo 也不进增量 diff。
 *
 * fillColor=none 的矩形默认仍然接收指针事件（STYLE_POINTER_EVENTS 默认 true），
 * 所以描边被去掉之后，块照样点得中、拖得动。
 */
export function makeCabinetBlockStyle() {
  return (
    "shape=rectangle;fillColor=none;strokeColor=#c8ccd2;strokeWidth=1;dashed=1;" +
    "html=1;whiteSpace=wrap;verticalAlign=middle;align=left;spacingLeft=8;" +
    "connectable=1;movable=0;resizable=1;rotatable=0;editable=0;deletable=0;" +
    "resizeWidth=1;resizeHeight=0;"
  );
}

/**
 * 母线到开关的支路引出线。
 *
 * 这是图纸上真实存在的线：从母线上的接口向右引出，接到开关左侧输入端子。
 * 由绑定操作自动产生，用户不能手工拉、不能拖动删除，但会出现在快照与导出里。
 */
export function makeCabinetSwitchLinkStyle() {
  return (
    "edgeStyle=none;html=1;strokeColor=#111111;strokeWidth=1;" +
    "endArrow=none;startArrow=none;noEdgeStyle=1;rounded=0;" +
    "movable=0;editable=0;deletable=0;bendable=0;"
  );
}

/** 柜内母线：靠左纵向贯穿的粗线 */
export function makeCabinetBusbarStyle() {
  return (
    "shape=rectangle;fillColor=#00b7c3;strokeColor=none;" +
    "html=1;connectable=0;movable=0;resizable=0;rotatable=0;editable=0;deletable=0;"
  );
}

/** 柜体名称：纵向排布，摆在左壁与母线之间 */
export function makeCabinetNameLabelStyle() {
  return (
    "text;html=1;horizontal=0;align=center;verticalAlign=middle;" +
    "fontSize=11;fontColor=#111111;whiteSpace=nowrap;overflow=visible;" +
    "connectable=0;movable=0;resizable=0;rotatable=0;editable=0;deletable=0;"
  );
}

/** 柜体上方的位置标注 */
export function makeCabinetLocationLabelStyle() {
  return (
    "text;html=1;align=left;verticalAlign=bottom;" +
    "fontSize=10;fontColor=#111111;whiteSpace=nowrap;overflow=visible;" +
    "connectable=0;movable=0;resizable=0;rotatable=0;editable=0;deletable=0;"
  );
}

/** 柜内靠上的编号 */
export function makeCabinetDesignationLabelStyle() {
  return (
    "text;html=1;align=center;verticalAlign=middle;" +
    "fontSize=11;fontColor=#111111;whiteSpace=nowrap;overflow=visible;" +
    "connectable=0;movable=0;resizable=0;rotatable=0;editable=0;deletable=0;"
  );
}

/**
 * 跨页续接的块（本段首块 / 末块）改用 SVG 描边，好在断开处画出缺口。
 */
export function makeCabinetBlockNotchStyle(descriptor) {
  return (
    "shape=image;image=data:image/svg+xml," +
    encodeURIComponent(createCabinetBlockSvg(descriptor)) +
    ";imageAspect=0;html=1;strokeColor=none;fillColor=none;" +
    "connectable=1;movable=0;resizable=1;rotatable=0;editable=0;deletable=0;" +
    "resizeWidth=1;resizeHeight=0;"
  );
}

/**
 * 画一个带缺口的块外框。notchTop / notchBottom 表示该边是"续接断开处"。
 */
export function createCabinetBlockSvg(descriptor) {
  var width = Math.max(20, Math.round(descriptor.width));
  var height = Math.max(12, Math.round(descriptor.height));
  var strokeWidth = 2;
  var inset = strokeWidth / 2;
  var notchLeft = Math.max(12, Math.round(width * 0.16));
  var notchWidth = Math.max(16, Math.round(width * 0.16));
  var notchDepth = Math.max(6, Math.round(Math.min(height, 60) * 0.18));
  var topY = descriptor.notchTop ? inset + notchDepth : inset;
  var bottomY = descriptor.notchBottom ? height - inset - notchDepth : height - inset;
  var path =
    "M " + inset + " " + topY + " " +
    (descriptor.notchTop
      ? "L " + notchLeft + " " + topY + " L " + (notchLeft + notchWidth) + " " + inset + " "
      : "") +
    "L " + (width - inset) + " " + inset + " " +
    "L " + (width - inset) + " " + (height - inset) + " " +
    (descriptor.notchBottom
      ? "L " + (notchLeft + notchWidth) + " " + (height - inset) +
        " L " + notchLeft + " " + bottomY + " "
      : "") +
    "L " + inset + " " + bottomY + " Z";

  return (
    '<svg xmlns="http://www.w3.org/2000/svg" width="' + width +
    '" height="' + height + '" viewBox="0 0 ' + width + " " + height + '">' +
    '<path d="' + path + '" fill="none" stroke="#111111" stroke-width="' +
    strokeWidth + '" stroke-linejoin="round" stroke-linecap="round"/>' +
    "</svg>"
  );
}

// ─── 模型归一化 ──────────────────────────────────────────────────────────

export function generateCabinetBlockId() {
  return "cabinet-block:" + generateUuid().split("-")[0];
}

export function normalizeCabinetBlock(raw, index) {
  raw = isObject(raw) ? raw : {};

  var id = trim(raw.id) || generateCabinetBlockId();

  return {
    id,
    title: trim(raw.title),
    height: clamp(
      toInt(raw.height, ELECTRICAL_CONSTANTS.CABINET_BLOCK_DEFAULT_HEIGHT),
      ELECTRICAL_CONSTANTS.CABINET_BLOCK_MIN_HEIGHT,
      ELECTRICAL_CONSTANTS.CABINET_BLOCK_MAX_HEIGHT,
    ),
    portId: trim(raw.portId) || id + ":out",
    switchInstanceId: trim(raw.switchInstanceId),
    switchSymbolId: trim(raw.switchSymbolId),
    params: isObject(raw.params) ? cloneJson(raw.params) : {},
    order: index,
  };
}

/**
 * 把旧模型（ports[] + gapRatios[]）折算成块。
 *
 * 旧模型里端子是"点"，位置 = tailPadding + 累加 gapRatios×可用高度。
 * 迁移取相邻端子的中点作为块的分界。新模型里端口固定在块的垂直中心，所以：
 *   - 旧间距均匀时（默认就是均匀的），端子位置完全不变；
 *   - 旧间距不均匀时，端子会向块中心偏移，最大偏移量是相邻两段间距差的四分之一。
 * 这是"端口固定居中"这条设计带来的必然近似，不做逐块偏移去硬凑。
 */
function migrateLegacyBlocks(raw, usableHeight) {
  var ports = Array.isArray(raw.ports) ? raw.ports : [];
  var gapRatios = Array.isArray(raw.gapRatios) ? raw.gapRatios : [];
  var tailPadding = Math.max(
    8,
    toInt(raw.tailPadding, ELECTRICAL_CONSTANTS.CABINET_TAIL_PADDING),
  );
  var offsets = [];
  var cursor = tailPadding;
  var blocks = [];
  var i;

  for (i = 0; i < ports.length; i++) {
    if (i > 0) {
      cursor += clamp(Number(gapRatios[i - 1]) || 0.12, 0, 1) * usableHeight;
    }

    offsets.push(cursor);
  }

  for (i = 0; i < offsets.length; i++) {
    // 分界取相邻端子的中点；首尾各补一个半间距
    var prevGap = i > 0 ? offsets[i] - offsets[i - 1] : 0;
    var nextGap = i + 1 < offsets.length ? offsets[i + 1] - offsets[i] : 0;
    var upper = i > 0 ? prevGap / 2 : nextGap > 0 ? nextGap / 2 : tailPadding;
    var lower = i + 1 < offsets.length ? nextGap / 2 : prevGap > 0 ? prevGap / 2 : tailPadding;

    blocks.push(
      normalizeCabinetBlock(
        {
          id: trim(ports[i] != null ? ports[i].id : "") || generateCabinetBlockId(),
          portId: trim(ports[i] != null ? ports[i].id : ""),
          height: Math.round(upper + lower),
        },
        i,
      ),
    );
  }

  return blocks;
}

function buildDefaultBlocks(count) {
  var blocks = [];
  var i;

  for (i = 0; i < count; i++) {
    blocks.push(normalizeCabinetBlock({}, i));
  }

  return blocks;
}

/**
 * @param {Object} raw          原始模型（可能是旧结构）
 * @param {Object} [frameConfig] 提供时用真实图框高度做旧数据折算，否则退回默认图框
 */
export function normalizeCabinetModel(raw, frameConfig) {
  raw = isObject(raw) ? cloneJson(raw) : {};

  var config = normalizeFrameConfig(frameConfig);
  var usableHeight = config.height * ELECTRICAL_CONSTANTS.FRAME_CONTENT_RATIO;
  var blocks;
  var i;

  if (Array.isArray(raw.blocks) && raw.blocks.length > 0) {
    blocks = [];

    for (i = 0; i < raw.blocks.length; i++) {
      blocks.push(normalizeCabinetBlock(raw.blocks[i], i));
    }
  } else if (Array.isArray(raw.ports) && raw.ports.length > 0) {
    blocks = migrateLegacyBlocks(raw, usableHeight);
  } else {
    blocks = buildDefaultBlocks(
      Math.max(
        1,
        toInt(
          raw.blockCount != null ? raw.blockCount : raw.portCount,
          ELECTRICAL_CONSTANTS.CABINET_DEFAULT_BLOCK_COUNT,
        ),
      ),
    );
  }

  if (blocks.length == 0) {
    blocks = buildDefaultBlocks(ELECTRICAL_CONSTANTS.CABINET_DEFAULT_BLOCK_COUNT);
  }

  return {
    logicalCabinetId: trim(raw.logicalCabinetId) || generateUuid(),
    originFrameId: trim(raw.originFrameId),
    // title / code / voltage 拼起来就是柜内那行纵向文字
    title: trim(raw.title) || "配电柜",
    // 这几项都有默认值：插入时不必手填也能画成图纸的样子，参数导入时再覆盖
    code: trim(raw.code) || ELECTRICAL_CONSTANTS.CABINET_DEFAULT_CODE,
    voltage: trim(raw.voltage) || ELECTRICAL_CONSTANTS.CABINET_DEFAULT_VOLTAGE,
    // 柜体上方的位置标注，两行
    location: trim(raw.location) || ELECTRICAL_CONSTANTS.CABINET_DEFAULT_LOCATION,
    locationNote: trim(raw.locationNote),
    // 柜内靠上的编号；没给就跟着柜体编号走
    designation:
      trim(raw.designation) ||
      trim(raw.code) ||
      ELECTRICAL_CONSTANTS.CABINET_DEFAULT_CODE,
    cabinetWidth: Math.max(
      ELECTRICAL_CONSTANTS.CABINET_MIN_WIDTH,
      toInt(raw.cabinetWidth, ELECTRICAL_CONSTANTS.CABINET_DEFAULT_WIDTH),
    ),
    cabinetX: Math.max(20, toInt(raw.cabinetX, ELECTRICAL_CONSTANTS.CABINET_DEFAULT_X)),
    headPadding: Math.max(
      0,
      toInt(raw.headPadding, ELECTRICAL_CONSTANTS.CABINET_HEAD_PADDING),
    ),
    tailPadding: Math.max(
      0,
      toInt(raw.tailPadding, ELECTRICAL_CONSTANTS.CABINET_TAIL_PADDING),
    ),
    busbarRatio: clamp(
      toFloat(raw.busbarRatio, ELECTRICAL_CONSTANTS.CABINET_BUSBAR_RATIO),
      0.05,
      0.6,
    ),
    busbarInsetY: Math.max(
      0,
      toInt(raw.busbarInsetY, ELECTRICAL_CONSTANTS.CABINET_BUSBAR_INSET_Y),
    ),
    switchLead: Math.max(
      8,
      toInt(raw.switchLead, ELECTRICAL_CONSTANTS.CABINET_SWITCH_LEAD),
    ),
    blocks,
  };
}

/**
 * 柜内纵向文字的内容：名称、编号、电压拼成一行。
 */
export function buildCabinetNameLabel(cabinetModel) {
  var parts = [];

  if (trim(cabinetModel.title).length > 0) {
    parts.push(trim(cabinetModel.title));
  }

  if (trim(cabinetModel.code).length > 0) {
    parts.push(trim(cabinetModel.code));
  }

  if (trim(cabinetModel.voltage).length > 0) {
    parts.push(trim(cabinetModel.voltage));
  }

  return parts.join(", ");
}

/**
 * 在指定块之后插入一个新块，返回新的模型；不修改传入的模型。
 *
 * 新块不带 id，由 normalizeCabinetBlock 生成新的稳定 id 与 portId——
 * 这两个 id 跨重排必须稳定，否则连线会在重排时接不回去。
 *
 * @param {Object} cabinetModel 当前模型
 * @param {string} blockId      参照块的 id
 * @param {Object} [blockInit]  新块的初始属性
 * @returns {Object|null} 新模型；参照块不存在时返回 null
 */
export function insertBlockAfter(cabinetModel, blockId, blockInit) {
  var modelData = normalizeCabinetModel(cabinetModel);
  var target = trim(blockId);
  var index = -1;
  var i;

  for (i = 0; i < modelData.blocks.length; i++) {
    if (modelData.blocks[i].id == target) {
      index = i;
      break;
    }
  }

  if (index < 0) {
    return null;
  }

  var blocks = modelData.blocks
    .slice(0, index + 1)
    .concat([normalizeCabinetBlock(blockInit || {}, index + 1)])
    .concat(modelData.blocks.slice(index + 1));

  for (i = 0; i < blocks.length; i++) {
    blocks[i].order = i;
  }

  var next = cloneJson(modelData);
  next.blocks = blocks;
  return next;
}

/**
 * 把某一块的开关绑定信息写进模型，返回新模型；不修改传入的模型。
 *
 * @param {Object} cabinetModel 当前模型
 * @param {string} blockId      目标块
 * @param {Object} binding      {instanceId, symbolId}；传 null 表示解除绑定
 * @returns {Object|null} 新模型；块不存在时返回 null
 */
export function setBlockSwitchBinding(cabinetModel, blockId, binding) {
  var modelData = normalizeCabinetModel(cabinetModel);
  var target = trim(blockId);
  var found = false;
  var blocks = [];
  var i;

  for (i = 0; i < modelData.blocks.length; i++) {
    var block = cloneJson(modelData.blocks[i]);

    if (block.id == target) {
      found = true;
      block.switchInstanceId = binding != null ? trim(binding.instanceId) : "";
      block.switchSymbolId = binding != null ? trim(binding.symbolId) : "";
    }

    blocks.push(block);
  }

  if (!found) {
    return null;
  }

  var next = cloneJson(modelData);
  next.blocks = blocks;
  return next;
}

/**
 * 开关在块内的摆位：左端距母线一段固定的引出线长度，垂直居中。
 *
 * 这样柜体被拉宽时开关不动、引出线不变，多出来的宽度落在开关右侧到柜壁之间——
 * 与 CAD 图纸一致（支路线从母线引出，经过开关，再穿出柜壁去下游）。
 *
 * @param {Object} blockRect  {width, height}
 * @param {Object} switchSize {width, height}
 * @param {Object} options    {busbarX, switchLead}
 * @returns {Object} {x, y, width, height} —— 相对块左上角
 */
export function computeSwitchPlacementInBlock(blockRect, switchSize, options) {
  var busbarX = options != null ? toInt(options.busbarX, 0) : 0;
  var lead = options != null ? Math.max(0, toInt(options.switchLead, 0)) : 0;
  var available = Math.max(8, blockRect.width - busbarX - lead);
  var width = Math.max(8, Math.min(switchSize.width, available));
  var height = Math.max(8, switchSize.height);

  return {
    x: busbarX + lead,
    y: (blockRect.height - height) / 2,
    width,
    height,
  };
}

// ─── 分页 ────────────────────────────────────────────────────────────────

/**
 * 按块高累加分页。规则：整块不跨页——放不下就整块推到下一页的续接段。
 * 单块超过一页可用高度时钳制到可用高度（不做块内分割）。
 *
 * 柜体高度 = 顶部留白 + 各块高度之和 + 底部留白。顶部留白给编号文字用，
 * 首块之上、末块之下都要留出空间，这样才和 CAD 出图的比例一致。
 *
 * @returns {Array} 每页一个 descriptor
 */
export function buildCabinetPageDescriptors(cabinetModel, frameConfig) {
  var config = normalizeFrameConfig(frameConfig);
  var modelData = normalizeCabinetModel(cabinetModel, config);
  // 柜体单独用一个更大的内容比例，让它能一直画到接近图框底部
  var usableHeight = config.height * ELECTRICAL_CONSTANTS.CABINET_CONTENT_RATIO;
  var topMargin = config.height * ELECTRICAL_CONSTANTS.FRAME_MARGIN_RATIO;
  var padding = modelData.headPadding + modelData.tailPadding;
  var blockCapacity = Math.max(
    ELECTRICAL_CONSTANTS.CABINET_BLOCK_MIN_HEIGHT,
    usableHeight - padding,
  );
  var pages = [];
  var current = [];
  var used = 0;
  var i;

  for (i = 0; i < modelData.blocks.length; i++) {
    var block = modelData.blocks[i];
    var height = Math.min(block.height, Math.floor(blockCapacity));

    if (current.length > 0 && used + height > blockCapacity) {
      pages.push({ blocks: current, height: used });
      current = [];
      used = 0;
    }

    current.push({ block, localY: used, height });
    used += height;
  }

  pages.push({ blocks: current, height: used });

  // 每段在"整柜"里的纵向区间，写进柜段属性供外部定位用
  var offsetCursor = 0;
  var p;

  for (p = 0; p < pages.length; p++) {
    pages[p].startOffset = offsetCursor;
    offsetCursor += pages[p].height;
    pages[p].endOffset = offsetCursor;
  }

  var descriptors = [];
  var pageIndex;

  for (pageIndex = 0; pageIndex < pages.length; pageIndex++) {
    var page = pages[pageIndex];
    var continuesToNext = pageIndex < pages.length - 1;
    var continuesFromPrev = pageIndex > 0;
    // 续接页的柜体要一直画到可用高度的底部再折断，而不是画到最后一块就收尾
    var segmentHeight = continuesToNext
      ? Math.round(usableHeight)
      : Math.max(
          ELECTRICAL_CONSTANTS.CABINET_BLOCK_MIN_HEIGHT,
          modelData.headPadding + page.height + modelData.tailPadding,
        );
    // 顶边折断会占掉一段高度，柜内编号要让开它
    var topBreakDepth = continuesFromPrev
      ? Math.max(
          8,
          Math.min(
            ELECTRICAL_CONSTANTS.CABINET_BREAK_DEPTH,
            Math.round(segmentHeight / 4),
          ),
        )
      : 0;
    var busbarX = Math.round(modelData.cabinetWidth * modelData.busbarRatio);
    var blocks = [];
    var j;

    for (j = 0; j < page.blocks.length; j++) {
      var entry = page.blocks[j];
      // 块整体让开顶边折断占掉的那一段
      var localY = topBreakDepth + modelData.headPadding + entry.localY;

      blocks.push({
        id: entry.block.id,
        title: entry.block.title,
        portId: entry.block.portId,
        switchInstanceId: entry.block.switchInstanceId,
        switchSymbolId: entry.block.switchSymbolId,
        params: cloneJson(entry.block.params),
        order: entry.block.order,
        localY,
        height: entry.height,
        width: modelData.cabinetWidth,
        // 出线接口在母线上，不在柜壁上
        portX: modelData.cabinetWidth > 0 ? busbarX / modelData.cabinetWidth : 0,
        portY:
          segmentHeight > 0
            ? clamp((localY + entry.height / 2) / segmentHeight, 0, 1)
            : 0.5,
      });
    }

    descriptors.push({
      segmentIndex: pageIndex,
      pageCount: pages.length,
      // 换页折断标识画在柜体外框上，不再由块承担
      continuesFromPrev,
      continuesToNext,
      topBreakDepth,
      x: modelData.cabinetX,
      y: topMargin,
      width: modelData.cabinetWidth,
      height: segmentHeight,
      segmentStartOffset: page.startOffset,
      segmentEndOffset: page.endOffset,
      blocks,
      // 母线：靠左纵向贯穿，上下各留 busbarInsetY
      busbar: {
        x: busbarX,
        y: topBreakDepth + Math.min(modelData.busbarInsetY, segmentHeight / 3),
        width: ELECTRICAL_CONSTANTS.CABINET_BUSBAR_WIDTH,
        height: Math.max(
          8,
          segmentHeight -
            topBreakDepth -
            2 * Math.min(modelData.busbarInsetY, segmentHeight / 3),
        ),
      },
      switchLead: modelData.switchLead,
      // 位置标注只画在第一段上，续接段不重复
      showLocation: pageIndex == 0,
      frameConfig: config,
      cabinetModel: modelData,
    });
  }

  return descriptors;
}

/**
 * 段内所有块端口相对"段"的坐标（快照导出与自动布局要的是这个口径）。
 */
export function buildSegmentPortLayout(descriptor) {
  var result = [];
  var i;

  for (i = 0; i < descriptor.blocks.length; i++) {
    var block = descriptor.blocks[i];

    result.push({
      id: block.portId,
      x: block.portX,
      y: block.portY,
      marker: "cross",
      direction: "right",
      ioMode: "out",
      order: block.order,
      blockId: block.id,
    });
  }

  return result;
}
