/**
 * 配电柜块参数对话框。
 *
 * 由块底部的加号 overlay 唤起：填好参数后在该块下方插入一个新块与新出线端口。
 * 这是改配电柜属性的操作，走 commandApi.insertCabinetBlock，会进增量变更记录。
 */
import { getApp } from "../core/appRuntime.js";
import { toInt, trim } from "../utils/base.js";
import { getAttr } from "../utils/xml.js";
import { setCanvasStatus, showStatus } from "../core/runtimeHelpers.js";
import { commandApi } from "../application/commands.js";
import { createPluginButton } from "./shared/buttonFactory.js";
import { getCabinetPopupPosition } from "./cabinetDialog.js";

var DIALOG_WIDTH = 320;
var DIALOG_HEIGHT = 186;

function getState() {
  return getApp().ctx.state;
}

export function closeCabinetBlockDialog() {
  var state = getState();

  if (state.cabinetBlockDialogWindow != null) {
    var wnd = state.cabinetBlockDialogWindow;
    state.cabinetBlockDialogWindow = null;
    wnd.destroy();
  }
}

function createFieldRow(labelText) {
  var row = document.createElement("div");
  row.style.display = "grid";
  row.style.gridTemplateColumns = "72px 1fr";
  row.style.alignItems = "center";
  row.style.gap = "8px";

  var label = document.createElement("div");
  label.innerText = labelText;
  row.appendChild(label);

  return row;
}

/**
 * @param {Object} blockCell   参照块，新块插在它下面
 * @param {Object} nativeEvent 触发点击的原生事件，用来把窗口贴到加号附近
 */
export function openCabinetBlockDialog(blockCell, nativeEvent) {
  if (blockCell == null) {
    return;
  }

  closeCabinetBlockDialog();

  var constants = getApp().ctx.constants;
  var referenceHeight = toInt(
    getAttr(blockCell, "blockHeight"),
    constants.CABINET_BLOCK_DEFAULT_HEIGHT,
  );

  var div = document.createElement("div");
  div.style.padding = "12px";
  div.style.display = "flex";
  div.style.flexDirection = "column";
  div.style.gap = "10px";
  div.style.boxSizing = "border-box";
  div.style.width = "100%";
  div.style.height = "100%";

  var titleRow = createFieldRow("回路编号");
  var titleInput = document.createElement("input");
  titleInput.setAttribute("type", "text");
  titleInput.value = "";
  titleRow.appendChild(titleInput);
  div.appendChild(titleRow);

  var heightRow = createFieldRow("块高");
  var heightInput = document.createElement("input");
  heightInput.setAttribute("type", "number");
  heightInput.setAttribute("min", String(constants.CABINET_BLOCK_MIN_HEIGHT));
  heightInput.value = String(referenceHeight);
  heightRow.appendChild(heightInput);
  div.appendChild(heightRow);

  var error = document.createElement("div");
  error.style.color = "#d64545";
  error.style.fontSize = "12px";
  error.style.minHeight = "16px";
  div.appendChild(error);

  var buttons = document.createElement("div");
  div.appendChild(buttons);

  var position = getCabinetPopupPosition(nativeEvent, DIALOG_WIDTH, DIALOG_HEIGHT);
  var wnd = new mxWindow(
    "插入块",
    div,
    position.x,
    position.y,
    DIALOG_WIDTH,
    DIALOG_HEIGHT,
    true,
    true,
  );

  wnd.destroyOnClose = true;
  wnd.setClosable(true);
  wnd.setMaximizable(false);
  wnd.setResizable(false);
  wnd.setScrollable(false);
  wnd.addListener(mxEvent.DESTROY, function () {
    getState().cabinetBlockDialogWindow = null;
  });

  var submitButton = createPluginButton("插入", function () {
    var height = toInt(heightInput.value, NaN);

    if (!isFinite(height) || height < constants.CABINET_BLOCK_MIN_HEIGHT) {
      error.innerText = "块高至少 " + constants.CABINET_BLOCK_MIN_HEIGHT;
      return;
    }

    try {
      commandApi.insertCabinetBlock(blockCell, {
        title: trim(titleInput.value),
        height: height,
      });
    } catch (e) {
      var message = e.message || String(e);
      error.innerText = message;
      showStatus(message, true);
      setCanvasStatus(message);
      return;
    }

    closeCabinetBlockDialog();
  });

  submitButton.style.marginTop = "0";
  buttons.appendChild(submitButton);

  getState().cabinetBlockDialogWindow = wnd;
  wnd.setVisible(true);
  titleInput.focus();
}

export var cabinetBlockDialogApi = {
  closeCabinetBlockDialog,
  openCabinetBlockDialog,
};
