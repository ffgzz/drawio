/**
 * 电气图元在模型中携带 esKind、esKey、pluginType 等内部元数据。
 * Drawio 的默认 Tooltip（尤其 dev=1 时）会把这些属性和坐标全部显示出来。
 * 这里只屏蔽插件管理单元的画布 Tooltip，不影响工具栏 title 和普通单元自定义提示。
 */
import { getAttr } from "../utils/xml.js";

const INSTALL_FLAG = "__electricalCellTooltipsSuppressed";

export function isElectricalTooltipCell(ctx, cell) {
  var constants = ctx.constants;

  while (cell != null) {
    var pluginType = String(getAttr(cell, "pluginType") || "");
    var kind = String(getAttr(cell, "esKind") || "");
    var style = cell.style != null ? String(cell.style) : "";

    if (
      kind.length > 0 ||
      pluginType == constants.ROOT_TYPE ||
      pluginType == constants.FRAME_TYPE ||
      pluginType == constants.CABINET_TYPE ||
      pluginType == constants.CABINET_GAP_TYPE ||
      style.indexOf("eidFrameDeco=1") >= 0
    ) {
      return true;
    }

    cell = ctx.model.getParent(cell);
  }

  return false;
}

export function installCellTooltipSuppression(ctx) {
  var graph = ctx.graph;

  if (graph == null || graph[INSTALL_FLAG] === true) {
    return;
  }

  var originalGetTooltipForCell = graph.getTooltipForCell;

  graph.getTooltipForCell = function (cell) {
    if (isElectricalTooltipCell(ctx, cell)) {
      return null;
    }

    return originalGetTooltipForCell.apply(this, arguments);
  };
  graph[INSTALL_FLAG] = true;

  // 集成页默认关闭整个画布 Tooltip handler，避免 dev=1 的调试浮层。
  // 工具栏、按钮等 DOM title 不属于 graph tooltip，不受影响。
  if (typeof graph.setTooltips == "function") {
    graph.setTooltips(false);
  }

  if (graph.tooltipHandler != null) {
    graph.tooltipHandler.hideTooltip();
  }
}
