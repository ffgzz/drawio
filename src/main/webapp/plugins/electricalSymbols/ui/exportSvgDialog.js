/**
 * SVG 导出对话框。
 * 负责读取当前画布导出边界、生成 SVG 代码并提供复制/下载能力。
 */
// 导出逻辑和 UI 在这里闭合，避免在入口层散落按钮处理代码。
export function openSvgExportDialog(deps) {
  var ui = deps.ctx.ui;
  var graph = deps.ctx.graph;

  function getDiagramExportBounds() {
    var bounds = graph.getGraphBounds();
    var viewScale = graph.view.scale || 1;

    if (bounds == null || bounds.width <= 0 || bounds.height <= 0) {
      throw new Error("画布上没有可导出的图形");
    }

    return {
      width: Math.max(1, Math.ceil(bounds.width / viewScale)),
      height: Math.max(1, Math.ceil(bounds.height / viewScale)),
    };
  }

  function createSvgExportCode(width, height) {
    var exportBounds = getDiagramExportBounds();
    var targetWidth = Math.max(1, deps.toInt(width, exportBounds.width));
    var targetHeight = Math.max(1, deps.toInt(height, exportBounds.height));
    var scale = Math.min(
      targetWidth / exportBounds.width,
      targetHeight / exportBounds.height,
    );
    var svgRoot = graph.getSvg(
      null,
      scale,
      0,
      false,
      null,
      true,
      null,
      null,
      null,
      null,
      true,
      null,
    );

    if (graph.shadowVisible) {
      graph.addSvgShadow(svgRoot);
    }

    if (graph.mathEnabled) {
      Editor.prototype.addMathCss(svgRoot);
    }

    svgRoot.setAttribute("width", String(targetWidth));
    svgRoot.setAttribute("height", String(targetHeight));
    svgRoot.setAttribute("preserveAspectRatio", "xMidYMid meet");

    return mxUtils.getXml(svgRoot);
  }

  function downloadSvgCode(svgCode) {
    var blob = new Blob([svgCode], { type: "image/svg+xml;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = "diagram-export.svg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 0);
  }

  var exportBounds = getDiagramExportBounds();
  var div = document.createElement("div");
  div.style.padding = "12px";
  div.style.width = "100%";
  div.style.height = "100%";
  div.style.boxSizing = "border-box";
  div.style.display = "flex";
  div.style.flexDirection = "column";
  div.style.background = Editor.isDarkMode() ? "#1e1e1e" : "#ffffff";

  var formRow = document.createElement("div");
  formRow.style.display = "flex";
  formRow.style.alignItems = "center";
  formRow.style.gap = "8px";
  formRow.style.flexWrap = "wrap";
  div.appendChild(formRow);

  var widthLabel = document.createElement("div");
  widthLabel.innerText = "宽";
  formRow.appendChild(widthLabel);

  var widthInput = document.createElement("input");
  widthInput.setAttribute("type", "number");
  widthInput.setAttribute("min", "1");
  widthInput.style.width = "120px";
  widthInput.value = String(exportBounds.width);
  formRow.appendChild(widthInput);

  var heightLabel = document.createElement("div");
  heightLabel.innerText = "高";
  formRow.appendChild(heightLabel);

  var heightInput = document.createElement("input");
  heightInput.setAttribute("type", "number");
  heightInput.setAttribute("min", "1");
  heightInput.style.width = "120px";
  heightInput.value = String(exportBounds.height);
  formRow.appendChild(heightInput);

  var refreshButton = deps.createButton("刷新SVG代码", function () {
    try {
      textarea.value = createSvgExportCode(widthInput.value, heightInput.value);
    } catch (e) {
      deps.showStatus(e.message || String(e), true);
    }
  });
  refreshButton.style.marginTop = "0";
  refreshButton.style.marginRight = "0";
  formRow.appendChild(refreshButton);

  var textarea = document.createElement("textarea");
  textarea.spellcheck = false;
  textarea.style.width = "100%";
  textarea.style.flex = "1 1 auto";
  textarea.style.minHeight = "320px";
  textarea.style.marginTop = "10px";
  textarea.style.boxSizing = "border-box";
  div.appendChild(textarea);

  var buttons = document.createElement("div");
  buttons.style.marginTop = "10px";
  buttons.style.flex = "0 0 auto";
  div.appendChild(buttons);

  var copyButton = deps.createButton("复制SVG代码", function () {
    ui.writeTextToClipboard(
      textarea.value,
      function (e) {
        ui.handleError(e);
      },
      function () {
        ui.alert("已复制到剪贴板");
      },
    );
  });
  copyButton.style.marginTop = "0";
  buttons.appendChild(copyButton);

  var downloadButton = deps.createButton("下载SVG", function () {
    try {
      var svgCode = createSvgExportCode(widthInput.value, heightInput.value);
      textarea.value = svgCode;
      downloadSvgCode(svgCode);
      wnd.destroy();
    } catch (e) {
      deps.showStatus(e.message || String(e), true);
    }
  });
  downloadButton.style.marginTop = "0";
  buttons.appendChild(downloadButton);

  textarea.value = createSvgExportCode(exportBounds.width, exportBounds.height);

  var wnd = new mxWindow("导出SVG", div, 160, 120, 720, 560, true, true);
  wnd.destroyOnClose = true;
  wnd.setClosable(true);
  wnd.setMaximizable(false);
  wnd.setResizable(true);
  wnd.setScrollable(true);
  wnd.setVisible(true);
}
