/**
 * 统一导出入口。
 * 把 SVG / PDF / DXF 三种导出方式收口到一个对话框里。
 */
import { getApp } from "../core/appRuntime.js";
import { showStatus } from "../core/runtimeHelpers.js";
import { createPluginButton } from "./shared/buttonFactory.js";
import { openSvgExportDialog } from "./exportSvgDialog.js";

function buildExportDialogDeps() {
  var app = getApp();

  return {
    ctx: app.ctx,
    createButton: createPluginButton,
    showStatus,
    openSvgExportDialog,
  };
}

function createOptionCard(title, description) {
  var card = document.createElement("div");
  card.style.display = "flex";
  card.style.flexDirection = "column";
  card.style.gap = "6px";
  card.style.padding = "12px";
  card.style.border = "1px solid #d0d7de";
  card.style.borderRadius = "8px";
  card.style.background = Editor.isDarkMode() ? "#2b2b2b" : "#ffffff";

  var heading = document.createElement("div");
  heading.style.fontWeight = "bold";
  heading.innerText = title;
  card.appendChild(heading);

  var text = document.createElement("div");
  text.style.fontSize = "12px";
  text.style.lineHeight = "1.5";
  text.style.color = Editor.isDarkMode() ? "#c9d1d9" : "#57606a";
  text.innerText = description;
  card.appendChild(text);

  return card;
}

export function openExportDialog() {
  var deps = arguments.length > 0 ? arguments[0] : buildExportDialogDeps();
  var ui = deps.ctx.ui;
  var div = document.createElement("div");
  var buttons = document.createElement("div");
  var wnd = null;

  div.style.padding = "12px";
  div.style.width = "100%";
  div.style.height = "100%";
  div.style.boxSizing = "border-box";
  div.style.display = "flex";
  div.style.flexDirection = "column";
  div.style.gap = "12px";

  div.appendChild(
    createOptionCard(
      "SVG",
      "打开 SVG 导出窗口，可调整尺寸、复制代码或下载文件。",
    ),
  );
  div.appendChild(
    createOptionCard(
      "PDF",
      "复用 draw.io 原生 PDF 导出能力，支持打印导出参数配置。",
    ),
  );
  div.appendChild(
    createOptionCard(
      "DXF",
      "本地 draw.io 内核暂不支持直接导出 DXF，此入口会给出明确说明。",
    ),
  );

  buttons.style.display = "flex";
  buttons.style.alignItems = "center";
  buttons.style.flexWrap = "wrap";
  buttons.style.gap = "8px";
  div.appendChild(buttons);

  function closeDialog() {
    if (wnd != null) {
      wnd.destroy();
    }
  }

  var svgButton = deps.createButton("导出 SVG", function () {
    closeDialog();
    deps.openSvgExportDialog();
  });
  svgButton.style.marginTop = "0";
  buttons.appendChild(svgButton);

  var pdfButton = deps.createButton("导出 PDF", function () {
    closeDialog();

    if (ui.actions.get("exportPdf") == null) {
      deps.showStatus("当前环境缺少 PDF 导出动作", true);
      return;
    }

    ui.actions.get("exportPdf").funct();
  });
  pdfButton.style.marginTop = "0";
  buttons.appendChild(pdfButton);

  var dxfButton = deps.createButton("导出 DXF", function () {
    ui.alert("当前 draw.io 内核不支持 DXF 直接导出，请先导出 SVG 再转换为 DXF。");
  });
  dxfButton.style.marginTop = "0";
  buttons.appendChild(dxfButton);

  wnd = new mxWindow("导出", div, 220, 140, 480, 320, true, true);
  wnd.destroyOnClose = true;
  wnd.setClosable(true);
  wnd.setMaximizable(false);
  wnd.setResizable(true);
  wnd.setScrollable(true);
  wnd.setVisible(true);
}
