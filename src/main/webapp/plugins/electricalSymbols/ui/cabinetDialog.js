/**
 * 配电柜相关对话框。
 * 负责插入配电柜窗口。端子间距的编辑已被"可独立调高的块"取代。
 */
// getCabinetPopupPosition 供块参数弹窗使用：贴着画布上的触发点定位。
import { getApp } from "../core/appRuntime.js";
import { clamp, toFloat, toInt, trim } from "../utils/base.js";
import { getAttr } from "../utils/xml.js";
import {
  generateLogicalCabinetId,
  setCanvasStatus,
  showStatus,
} from "../core/runtimeHelpers.js";
import { cabinetDomainApi } from "../domain/cabinet.js";
import { frameDomainApi } from "../domain/frame.js";
import { commandApi } from "../application/commands.js";
import { createPluginButton } from "./shared/buttonFactory.js";

function buildCabinetDialogDeps() {
  var app = getApp();

  return {
    ctx: app.ctx,
    trim,
    clamp,
    toInt,
    toFloat,
    createButton: createPluginButton,
    getActiveFrame: frameDomainApi.getActiveFrame,
    getAttr,
    normalizeCabinetModel: cabinetDomainApi.normalizeCabinetModel,
    generateLogicalCabinetId,
    insertCabinet: commandApi.insertCabinet,
    showStatus,
    setCanvasStatus,
    findCabinetSegment: cabinetDomainApi.findCabinetSegment,
    extractCabinetModel: cabinetDomainApi.extractCabinetModel,
  };
}

function getCabinetDialogDeps() {
  return buildCabinetDialogDeps();
}

export function getCabinetPopupPosition(nativeEvent, width, height) {
  var deps = getCabinetDialogDeps();
  var fallback = { x: 220, y: 180 };

  if (nativeEvent == null) {
    return fallback;
  }

  var offsetX = 36;
  var offsetY = -24;
  var rawEvent =
    typeof nativeEvent.getEvent == "function" ? nativeEvent.getEvent() : nativeEvent;
  var pageX =
    mxEvent.getClientX(rawEvent) +
    (window.pageXOffset || document.documentElement.scrollLeft || 0);
  var pageY =
    mxEvent.getClientY(rawEvent) +
    (window.pageYOffset || document.documentElement.scrollTop || 0);
  var viewportWidth = window.innerWidth || document.documentElement.clientWidth || 1280;
  var viewportHeight = window.innerHeight || document.documentElement.clientHeight || 720;
  var minX = (window.pageXOffset || document.documentElement.scrollLeft || 0) + 12;
  var minY = (window.pageYOffset || document.documentElement.scrollTop || 0) + 12;
  var maxX =
    (window.pageXOffset || document.documentElement.scrollLeft || 0) +
    viewportWidth -
    width -
    12;
  var maxY =
    (window.pageYOffset || document.documentElement.scrollTop || 0) +
    viewportHeight -
    height -
    12;
  var x = pageX + offsetX;
  var y = pageY + offsetY;

  if (x > maxX) {
    x = pageX - width - offsetX;
  }

  if (y > maxY) {
    y = maxY;
  }

  return {
    x: deps.clamp(x, minX, Math.max(minX, maxX)),
    y: deps.clamp(y, minY, Math.max(minY, maxY)),
  };
}

/**
 * 按"块数 + 统一块高"生成初始块列表。id 交给 normalizeCabinetBlock 生成。
 */
function buildInitialBlocks(rawCount, rawHeight, constants) {
  var count = Math.max(1, parseInt(rawCount, 10) || constants.CABINET_DEFAULT_BLOCK_COUNT);
  var height = Math.max(
    constants.CABINET_BLOCK_MIN_HEIGHT,
    parseInt(rawHeight, 10) || constants.CABINET_BLOCK_DEFAULT_HEIGHT,
  );
  var blocks = [];
  var i;

  for (i = 0; i < count; i++) {
    blocks.push({ height: height });
  }

  return blocks;
}

export function openInsertCabinetDialog() {
  var deps = getCabinetDialogDeps();
  var ctx = deps.ctx;
  var constants = ctx.constants;
  var trim = deps.trim;
  var frame = deps.getActiveFrame(true);

  if (frame == null) {
    return;
  }

  var div = document.createElement("div");
  div.style.padding = "12px";
  div.style.display = "flex";
  div.style.flexDirection = "column";
  div.style.gap = "10px";
  div.style.boxSizing = "border-box";
  div.style.width = "100%";
  div.style.height = "100%";

  // 这几项都是要画到图上的文字：名称/编号/电压拼成柜内的纵向标注，
  // 位置两行画在柜体上方，柜内编号画在柜体顶部。
  function addTextRow(label, initial, placeholder) {
    var row = document.createElement("div");
    row.style.display = "grid";
    row.style.gridTemplateColumns = "90px 1fr";
    row.style.alignItems = "center";
    row.style.gap = "8px";
    div.appendChild(row);

    var caption = document.createElement("div");
    caption.innerText = label;
    row.appendChild(caption);

    var input = document.createElement("input");
    input.setAttribute("type", "text");
    input.value = initial || "";

    if (placeholder != null) {
      input.setAttribute("placeholder", placeholder);
    }

    row.appendChild(input);
    return input;
  }

  var nameInput = addTextRow("名称", "配电柜", "GALLEY MAIN SWITCHBOARD");
  var codeInput = addTextRow("编号", "", "GB11");
  var voltageInput = addTextRow("电压", "", "230VAC");
  var designationInput = addTextRow("柜内编号", "", "875.022 / GB11");
  var locationNoteInput = addTextRow("位置说明", "", "10甲板处227点，电气设备间");
  var locationInput = addTextRow("位置代号", "", "Fr227P DECK 10, EL. EQ.");

  var configRow = document.createElement("div");
  configRow.style.display = "grid";
  configRow.style.gridTemplateColumns = "90px 100px 60px 80px 60px 80px";
  configRow.style.alignItems = "center";
  configRow.style.gap = "8px";
  div.appendChild(configRow);

  var widthLabel = document.createElement("div");
  widthLabel.innerText = "柜宽";
  configRow.appendChild(widthLabel);

  var widthInput = document.createElement("input");
  widthInput.setAttribute("type", "number");
  widthInput.setAttribute("min", "30");
  widthInput.value = String(constants.CABINET_DEFAULT_WIDTH);
  configRow.appendChild(widthInput);

  var countLabel = document.createElement("div");
  countLabel.innerText = "块数";
  configRow.appendChild(countLabel);

  var countInput = document.createElement("input");
  countInput.setAttribute("type", "number");
  countInput.setAttribute("min", "1");
  countInput.value = String(constants.CABINET_DEFAULT_BLOCK_COUNT);
  configRow.appendChild(countInput);

  var heightLabel = document.createElement("div");
  heightLabel.innerText = "块高";
  configRow.appendChild(heightLabel);

  var heightInput = document.createElement("input");
  heightInput.setAttribute("type", "number");
  heightInput.setAttribute("min", String(constants.CABINET_BLOCK_MIN_HEIGHT));
  heightInput.value = String(constants.CABINET_BLOCK_DEFAULT_HEIGHT);
  configRow.appendChild(heightInput);

  var hint = document.createElement("div");
  hint.style.color = Editor.isDarkMode() ? "#c0c4cc" : "#57606a";
  hint.style.fontSize = "12px";
  hint.innerText =
    "每块在母线上派生一个出线端口。插入后可直接拖块的上下边框改高度，拖柜体左右边框改柜宽。";
  div.appendChild(hint);

  var buttons = document.createElement("div");
  div.appendChild(buttons);

  var wnd = new mxWindow("插入配电柜", div, 200, 120, 560, 400, true, true);
  wnd.destroyOnClose = true;
  wnd.setClosable(true);
  wnd.setMaximizable(false);
  wnd.setResizable(false);
  wnd.setScrollable(false);

  var submitButton = deps.createButton("插入配电柜", function () {
    var cabinetModel = deps.normalizeCabinetModel({
      logicalCabinetId: deps.generateLogicalCabinetId(),
      originFrameId: trim(deps.getAttr(frame, "frameId")),
      title: trim(nameInput.value) || "配电柜",
      code: trim(codeInput.value),
      voltage: trim(voltageInput.value),
      designation: trim(designationInput.value),
      locationNote: trim(locationNoteInput.value),
      location: trim(locationInput.value),
      cabinetWidth: widthInput.value,
      blockCount: countInput.value,
      blocks: buildInitialBlocks(countInput.value, heightInput.value, constants),
    });

    try {
      deps.insertCabinet(cabinetModel);
    } catch (e) {
      deps.showStatus(e.message || String(e), true);
      deps.setCanvasStatus(e.message || String(e));
      return;
    }
    wnd.destroy();
  });
  submitButton.style.marginTop = "0";
  buttons.appendChild(submitButton);

  wnd.setVisible(true);
}

export var cabinetDialogsApi = {
  getCabinetPopupPosition,
  openInsertCabinetDialog,
};
