/**
 * 图框插入对话框。
 * 负责采集图框尺寸，并根据当前选中图框决定插入位置与分页组关系。
 */
// 图框创建后的具体 cell 结构由 frame domain 负责。
import { getApp } from "../core/appRuntime.js";
import { cloneJson } from "../utils/base.js";
import {
  generateFrameGroupId,
  setCanvasStatus,
  showStatus,
} from "../core/runtimeHelpers.js";
import { frameDomainApi } from "../domain/frame.js";
import { commandApi } from "../application/commands.js";
import { createPluginButton } from "./shared/buttonFactory.js";

function buildFrameDialogDeps() {
  var app = getApp();

  return {
    ctx: app.ctx,
    cloneJson,
    normalizeFrameConfig: frameDomainApi.normalizeFrameConfig,
    findDrawingFrame: frameDomainApi.findDrawingFrame,
    getAllDrawingFrames: frameDomainApi.getAllDrawingFrames,
    createButton: createPluginButton,
    getFrameGroupId: frameDomainApi.getFrameGroupId,
    generateFrameGroupId,
    getMaxFramePageNumberInGroup: frameDomainApi.getMaxFramePageNumberInGroup,
    createDrawingFrameCell: frameDomainApi.createDrawingFrameCell,
    getRightmostFrameInGroup: frameDomainApi.getRightmostFrameInGroup,
    addTopLevelCell: frameDomainApi.addTopLevelCell,
    getLeftmostFrame: frameDomainApi.getLeftmostFrame,
    getBottommostFrame: frameDomainApi.getBottommostFrame,
    insertFrame: commandApi.insertFrame,
    showStatus,
    setCanvasStatus,
  };
}

export function openInsertFrameDialog() {
  var deps = arguments.length > 0 ? arguments[0] : buildFrameDialogDeps();
  var ctx = deps.ctx;
  var graph = ctx.graph;
  var state = ctx.state;
  var defaultConfig = deps.normalizeFrameConfig(state.frameConfig || {});
  var selectedFrame = deps.findDrawingFrame(graph.getSelectionCell());
  var existingFrames = deps.getAllDrawingFrames();
  var div = document.createElement("div");
  div.style.padding = "12px";
  div.style.display = "flex";
  div.style.flexDirection = "column";
  div.style.gap = "10px";
  div.style.boxSizing = "border-box";
  div.style.width = "100%";
  div.style.height = "100%";

  var row = document.createElement("div");
  row.style.display = "flex";
  row.style.alignItems = "center";
  row.style.gap = "8px";
  div.appendChild(row);

  var widthLabel = document.createElement("div");
  widthLabel.innerText = "宽";
  row.appendChild(widthLabel);

  var widthInput = document.createElement("input");
  widthInput.setAttribute("type", "number");
  widthInput.setAttribute("min", "320");
  widthInput.style.width = "140px";
  widthInput.value = String(defaultConfig.width);
  row.appendChild(widthInput);

  var heightLabel = document.createElement("div");
  heightLabel.innerText = "高";
  row.appendChild(heightLabel);

  var heightInput = document.createElement("input");
  heightInput.setAttribute("type", "number");
  heightInput.setAttribute("min", "240");
  heightInput.style.width = "140px";
  heightInput.value = String(defaultConfig.height);
  row.appendChild(heightInput);

  var hint = document.createElement("div");
  hint.style.color = Editor.isDarkMode() ? "#c0c4cc" : "#57606a";
  hint.style.fontSize = "12px";
  hint.innerText =
    selectedFrame != null
      ? "已选中图框组：新图框会续接到当前组右侧；未选中图框时会在现有组下方新建一组。"
      : existingFrames.length > 0
        ? "当前未选中图框：新图框会在现有图框组下方新建一组。选中某个图框后再插入，可续接到该组右侧。"
        : "首次设置的尺寸会作为后续自动分页图框的默认尺寸。";
  div.appendChild(hint);

  var buttons = document.createElement("div");
  div.appendChild(buttons);

  var wnd = new mxWindow("插入图框", div, 180, 140, 420, 170, true, true);
  wnd.destroyOnClose = true;
  wnd.setClosable(true);
  wnd.setMaximizable(false);
  wnd.setResizable(false);
  wnd.setScrollable(false);

  var submitButton = deps.createButton("插入图框", function () {
    var config = deps.normalizeFrameConfig({
      width: widthInput.value,
      height: heightInput.value,
    });
    deps.insertFrame(config, selectedFrame, existingFrames);
    wnd.destroy();
  });
  submitButton.style.marginTop = "0";
  buttons.appendChild(submitButton);

  wnd.setVisible(true);
}
