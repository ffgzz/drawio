/**
 * 配电柜块的浮层按钮。
 *
 * 每个块的底边中央挂一个圆形加号，点击后在该块下方插入新块。
 *
 * 用 mxCellOverlay 而不是真实 cell：overlay 属于视图层，
 *   - 不进 model，因此不进快照、不进增量 diff、不进 undo 栈
 *   - 不需要为它单独做剪贴板保护
 *   - mxCellCodec 的排除表里含 overlays，不会被序列化进图纸 XML
 *   - Overview 模式下一行代码即可全部摘掉
 * 真实 cell（改造前的蓝色 gap 框）会同时污染上面四条链路。
 */
import { getApp } from "../core/appRuntime.js";
import { isCabinetBlock, isCabinetSegment } from "../core/runtimeHelpers.js";
import { getAttr } from "../utils/xml.js";
import { trim } from "../utils/base.js";
import { cabinetDomainApi } from "../domain/cabinet.js";
import { frameDomainApi } from "../domain/frame.js";
import { cabinetBlockDialogApi } from "../ui/cabinetBlockDialog.js";
import { switchPickerApi } from "../ui/switchPickerDialog.js";
import { isOverviewMode, onLodChanged } from "./viewportVirtualization.js";
import { isPrintMode, onPrintModeChanged } from "./printMode.js";

var OVERLAY_SIZE = 18;

// 蓝底白十字：在浅色和深色画布上都读得出来，不用跟着主题切换重建
var PLUS_ICON_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18">' +
  '<circle cx="9" cy="9" r="8" fill="#2a5c9c" stroke="#ffffff" stroke-width="1"/>' +
  '<path d="M9 5.4v7.2M5.4 9h7.2" stroke="#ffffff" stroke-width="1.6" ' +
  'stroke-linecap="round"/>' +
  "</svg>";

// 铜色隔离开关图形：与蓝色加号区分开，一眼能看出是两类操作
var SWITCH_ICON_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18">' +
  '<circle cx="9" cy="9" r="8" fill="#a85c22" stroke="#ffffff" stroke-width="1"/>' +
  '<path d="M4.9 12.2L11.2 6.6" stroke="#ffffff" stroke-width="1.5" ' +
  'stroke-linecap="round"/>' +
  '<path d="M11.4 12.2h1.8" stroke="#ffffff" stroke-width="1.5" ' +
  'stroke-linecap="round"/>' +
  '<circle cx="4.8" cy="12.2" r="1.2" fill="#ffffff"/>' +
  '<circle cx="13.2" cy="12.2" r="1.2" fill="#ffffff"/>' +
  "</svg>";

var iconCache = {};

function getIconImage(key, svg) {
  if (iconCache[key] == null) {
    // 注意：不能用 ;base64,——drawio 的 XML 解析会破坏这种 data URL
    iconCache[key] = new mxImage(
      "data:image/svg+xml," + encodeURIComponent(svg),
      OVERLAY_SIZE,
      OVERLAY_SIZE,
    );
  }

  return iconCache[key];
}

function createInsertOverlay() {
  var overlay = new mxCellOverlay(
    getIconImage("plus", PLUS_ICON_SVG),
    "在此块下方插入新块",
    mxConstants.ALIGN_CENTER,
    mxConstants.ALIGN_BOTTOM,
    new mxPoint(0, 0),
    "pointer",
  );

  overlay.addListener(mxEvent.CLICK, function (sender, evt) {
    var cell = evt.getProperty("cell");
    var nativeEvent = evt.getProperty("event");

    if (cell != null) {
      cabinetBlockDialogApi.openCabinetBlockDialog(cell, nativeEvent);
    }
  });

  return overlay;
}

/**
 * 未绑定开关的块，在右边缘中央给一个绑定入口——正是开关将要落位的地方。
 */
function createBindSwitchOverlay() {
  var overlay = new mxCellOverlay(
    getIconImage("switch", SWITCH_ICON_SVG),
    "为此块绑定开关",
    mxConstants.ALIGN_RIGHT,
    mxConstants.ALIGN_MIDDLE,
    new mxPoint(-12, 0),
    "pointer",
  );

  overlay.addListener(mxEvent.CLICK, function (sender, evt) {
    var cell = evt.getProperty("cell");
    var nativeEvent = evt.getProperty("event");

    if (cell != null) {
      switchPickerApi.openSwitchPickerDialog(cell, nativeEvent);
    }
  });

  return overlay;
}

function hasSwitchBound(cell) {
  return trim(getAttr(cell, "switchInstanceId")).length > 0;
}

function countOverlays(cell) {
  return Array.isArray(cell.overlays) ? cell.overlays.length : 0;
}

/**
 * 让单个块的浮层与当前 LOD 状态一致。幂等。
 */
export function syncBlockOverlay(cell) {
  var graph = getApp().ctx.graph;

  if (!isCabinetBlock(cell)) {
    return;
  }

  // 出图模式和 Overview 模式都不该出现编辑用的浮层
  if (isPrintMode() || isOverviewMode()) {
    if (countOverlays(cell) > 0) {
      graph.removeCellOverlays(cell);
    }

    return;
  }

  // 未绑定的块两个入口（插入块 + 绑开关），已绑定的只留插入块
  var expected = hasSwitchBound(cell) ? 1 : 2;

  if (countOverlays(cell) === expected) {
    return;
  }

  graph.removeCellOverlays(cell);
  graph.addCellOverlay(cell, createInsertOverlay());

  if (!hasSwitchBound(cell)) {
    graph.addCellOverlay(cell, createBindSwitchOverlay());
  }
}

/**
 * 全量刷新。用于插件启动、图纸整体替换（快照恢复/打开文件）和 LOD 模式切换。
 */
export function refreshCabinetOverlays() {
  var model = getApp().ctx.model;
  var frames = frameDomainApi.getAllDrawingFrames();
  var i;
  var j;
  var k;

  for (i = 0; i < frames.length; i++) {
    for (j = 0; j < model.getChildCount(frames[i]); j++) {
      var segment = model.getChildAt(frames[i], j);

      if (!isCabinetSegment(segment)) {
        continue;
      }

      var blocks = cabinetDomainApi.getSegmentBlocks(segment);

      for (k = 0; k < blocks.length; k++) {
        syncBlockOverlay(blocks[k]);
      }
    }
  }
}

function syncSegmentOverlays(segment) {
  var blocks = cabinetDomainApi.getSegmentBlocks(segment);
  var i;

  for (i = 0; i < blocks.length; i++) {
    syncBlockOverlay(blocks[i]);
  }
}

/**
 * 重排配电柜会整批换掉块 cell，新块没有浮层。这里只看本次变更涉及的 cell，
 * 代价是 O(变更数) 而不是 O(画布对象数)。
 *
 * 注意：块是在柜段加入 model **之前**用 root.insert() 挂进去的，所以重排只会
 * 产生一条针对柜段的 mxChildChange，块本身不产生变更——必须顺着新增的柜段
 * 往下找块，只盯 isCabinetBlock(change.child) 会一个都抓不到。
 */
function handleModelChange(sender, evt) {
  var edit = evt != null ? evt.getProperty("edit") : null;
  var changes = edit != null ? edit.changes : null;
  var i;

  if (!Array.isArray(changes)) {
    return;
  }

  for (i = 0; i < changes.length; i++) {
    var change = changes[i];

    if (change.constructor == mxRootChange) {
      // 整张图被换掉（打开文件、快照恢复）
      refreshCabinetOverlays();
      return;
    }

    if (change.constructor != mxChildChange || change.parent == null) {
      continue;
    }

    if (isCabinetSegment(change.child)) {
      syncSegmentOverlays(change.child);
    } else if (isCabinetBlock(change.child)) {
      syncBlockOverlay(change.child);
    }
  }
}

export function installCabinetOverlays(ctx) {
  ctx.model.addListener(mxEvent.CHANGE, handleModelChange);

  // LOD 在 Overview 模式下要把加号全部摘掉，切回 Detail 再挂上
  onLodChanged(refreshCabinetOverlays);

  // 出图期间同样摘掉
  onPrintModeChanged(refreshCabinetOverlays);

  refreshCabinetOverlays();
}

export var cabinetOverlaysApi = {
  installCabinetOverlays,
  refreshCabinetOverlays,
  syncBlockOverlay,
};
