/**
 * 应用装配入口。
 * 现在这里只创建运行时容器本身，普通模块能力全部走静态 import/export。
 */
import { isCabinetGap, setCanvasStatus } from "../core/runtimeHelpers.js";
import { cabinetDomainApi } from "../domain/cabinet.js";
import { connectionConstraintsApi } from "../runtime/connectionConstraints.js";
import { installCanvasFeatures, ACTION_ITEMS } from "../runtime/canvasFeatures.js";
import { installClipboardOverride } from "../runtime/clipboardOverride.js";
import { installHostBridge } from "../runtime/hostBridge.js";
import { installViewportVirtualization } from "../runtime/viewportVirtualization.js";
import { portSwapModeApi } from "../runtime/portSwapMode.js";
import { cabinetDialogsApi } from "../ui/cabinetDialog.js";

function applyEmbeddedEditorLayout(ui) {
  if (ui == null) {
    return;
  }

  // 隐藏侧边形状面板
  if (typeof ui.toggleShapesPanel == "function" && ui.isShapesPanelVisible()) {
    ui.toggleShapesPanel(false);
  } else if (ui.sidebarContainer != null) {
    ui.hsplitPosition = 0;
    ui.sidebarContainer.style.display = "none";
  }

  // 隐藏格式面板
  if (typeof ui.toggleFormatPanel == "function" && ui.isFormatPanelVisible()) {
    ui.toggleFormatPanel(false);
  } else if (ui.formatContainer != null) {
    ui.formatWidth = 0;
    ui.formatContainer.style.display = "none";
  }

  // 保留页面标签栏（不再隐藏 tabContainer）

  if (ui.hsplit != null) {
    ui.hsplit.style.display = "none";
  }

  if (ui.sidebarContainer != null) {
    ui.sidebarContainer.style.width = "0px";
    ui.sidebarContainer.style.display = "none";
  }

  if (ui.formatContainer != null) {
    ui.formatContainer.style.width = "0px";
    ui.formatContainer.style.display = "none";
  }

  if (typeof ui.refresh == "function") {
    ui.refresh(true);
  } else if (ui.editor != null && ui.editor.graph != null) {
    ui.editor.graph.sizeDidChange();
  }
}

/**
 * 隐藏工具栏中不需要的按钮。
 * 策略：收集需要隐藏的按钮的 backgroundImage URL，
 * 以及通过 toolbar 对象上的直接引用（edgeShapeMenu, edgeStyleMenu）来匹配。
 */
function pruneToolbarButtons(ui) {
  var toolbarContainer =
    ui.toolbar != null ? ui.toolbar.container : null;

  if (toolbarContainer == null) {
    return;
  }

  // 收集需要隐藏的 backgroundImage URL 片段
  var hiddenImages = [];

  if (typeof Editor !== "undefined") {
    if (Editor.fillColorImage) hiddenImages.push(Editor.fillColorImage);
    if (Editor.strokeColorImage) hiddenImages.push(Editor.strokeColorImage);
    if (Editor.shadowImage) hiddenImages.push(Editor.shadowImage);
    if (Editor.plusImage) hiddenImages.push(Editor.plusImage);
    if (Editor.shapesImage) hiddenImages.push(Editor.shapesImage);
    if (Editor.freehandImage) hiddenImages.push(Editor.freehandImage);
    if (Editor.sparklesImage) hiddenImages.push(Editor.sparklesImage);
    if (Editor.tableImage) hiddenImages.push(Editor.tableImage);
  }

  // 隐藏 edgeShapeMenu 和 edgeStyleMenu（通过 toolbar 直接引用）
  if (ui.toolbar.edgeShapeMenu != null) {
    ui.toolbar.edgeShapeMenu.style.display = "none";
  }

  if (ui.toolbar.edgeStyleMenu != null) {
    ui.toolbar.edgeStyleMenu.style.display = "none";
  }

  // 遍历所有子元素，匹配 backgroundImage
  var children = toolbarContainer.children;
  var i;
  var j;

  for (i = 0; i < children.length; i++) {
    var child = children[i];
    var bgImage = child.style.backgroundImage || "";

    if (bgImage.length === 0) {
      continue;
    }

    for (j = 0; j < hiddenImages.length; j++) {
      if (bgImage.indexOf(hiddenImages[j]) >= 0) {
        child.style.display = "none";
        break;
      }
    }
  }

  // 隐藏 table dropdown（addTableDropDown 创建的元素没有 backgroundImage，
  // 需要通过 data-min-width 匹配：table 的 data-min-width 是独有的值）
  // 同时也把已知的 insert(+) 用 data-min-width=300 匹配
  var tableMinWidths = { "360": true };

  for (i = 0; i < children.length; i++) {
    var minW = children[i].getAttribute("data-min-width");

    if (minW != null && tableMinWidths[minW] === true) {
      // 只匹配还没被隐藏的
      if (children[i].style.display !== "none") {
        children[i].style.display = "none";
      }
    }
  }

  // 清理多余的分隔符
  cleanupToolbarSeparators(toolbarContainer);
}

/**
 * 清理工具栏分隔符：如果某个分隔符前后的元素都 hidden，就隐藏分隔符。
 */
function cleanupToolbarSeparators(container) {
  var children = container.children;
  var i;

  for (i = 0; i < children.length; i++) {
    var child = children[i];

    if (child.tagName !== "SPAN" || child.style.display === "none") {
      continue;
    }

    // 分隔符一般是宽度很小的 span
    if (child.offsetWidth <= 2 || child.className.indexOf("geSeparator") >= 0) {
      var prevVisible = findVisibleSibling(children, i, -1);
      var nextVisible = findVisibleSibling(children, i, 1);

      if (prevVisible == null || nextVisible == null) {
        child.style.display = "none";
      }
    }
  }
}

function findVisibleSibling(children, index, direction) {
  var i = index + direction;

  while (i >= 0 && i < children.length) {
    var el = children[i];

    if (el.style.display !== "none" && el.offsetWidth > 2) {
      return el;
    }

    i += direction;
  }

  return null;
}

/**
 * 把自定义按钮（组合图元、更换挂点）融入 drawio 原生工具栏。
 */
function installCustomToolbarButtons(ui) {
  var toolbarContainer =
    ui.toolbar != null ? ui.toolbar.container : null;

  if (toolbarContainer == null) {
    return;
  }

  var items = ACTION_ITEMS;
  var i;

  for (i = 0; i < items.length; i++) {
    var item = items[i];
    var action = ui.actions.get(item.actionKey);

    if (action == null) {
      continue;
    }

    var label = mxResources.get(item.resourceKey) || item.actionKey;
    var button = document.createElement("a");
    button.className = "geButton";
    button.setAttribute("title", label);
    button.style.display = "inline-flex";
    button.style.alignItems = "center";
    button.style.justifyContent = "center";
    button.style.cursor = "pointer";
    button.style.fontSize = "12px";
    button.style.padding = "0 8px";
    button.style.whiteSpace = "nowrap";
    button.style.userSelect = "none";
    button.innerText = label;

    (function (act) {
      mxEvent.addListener(button, "click", function (evt) {
        act.funct();
        mxEvent.consume(evt);
      });
    })(action);

    // 添加到工具栏末尾
    toolbarContainer.appendChild(button);
  }
}

/**
 * 只保留 draw.io 运行时实例和基于它们创建出的运行时单例。
 */
export function createApp(ctx) {
  return {
    ctx,
  };
}

/**
 * 真正把 electricalSymbols 的运行时行为挂到 draw.io 上。
 * 这里不再把 runtime/ui/domain API 挂回 app，而是直接静态导入使用。
 */
export function activateAppRuntime(app) {
  var ui = app.ctx.ui;

  applyEmbeddedEditorLayout(ui);
  installHostBridge(app.ctx);

  portSwapModeApi.installGraphClickBehavior({
    isCabinetGap,
    openCabinetGapDialog: cabinetDialogsApi.openCabinetGapDialog,
    closeGapDialogWindow: cabinetDialogsApi.closeGapDialogWindow,
    setSelectedCabinetGap: cabinetDomainApi.setSelectedCabinetGap,
  });

  connectionConstraintsApi.installGraphBehavior({
    applyEdgePortConstraintMetadata:
      portSwapModeApi.applyEdgePortConstraintMetadata,
    setCanvasStatus,
  });

  installCanvasFeatures(app.ctx);

  // 剪贴板覆写：拦截复制/粘贴，处理设备/电缆编号递增，阻止图框/配电柜复制
  installClipboardOverride(app.ctx);

  // 视口虚拟化：对远离视口的图框做虚拟折叠以减少 SVG DOM 节点
  installViewportVirtualization(app.ctx);

  // 隐藏不需要的原生工具栏按钮
  pruneToolbarButtons(ui);

  // 把自定义按钮融入原生工具栏
  installCustomToolbarButtons(ui);

  // 隐藏插件自己的 menubar（不再使用独立的顶部动作栏）
  if (ui.menubarContainer != null) {
    ui.menubarContainer.style.display = "none";
    // 触发布局刷新
    if (typeof ui.refresh == "function") {
      ui.refresh(true);
    }
  }

  // 主题/语言变更时重新应用
  ui.addListener("languageChanged", function () {
    pruneToolbarButtons(ui);
    installCustomToolbarButtons(ui);
  });
  ui.addListener("currentThemeChanged", function () {
    pruneToolbarButtons(ui);
    installCustomToolbarButtons(ui);
  });
}
