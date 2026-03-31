/**
 * 配电柜相关对话框。
 * 负责插入配电柜窗口，以及配电柜 gap 比例编辑窗口。
 */
// 由于 gap 对话框是悬浮在画布附近的小窗，所以这里还负责计算弹窗位置。
import { getApp } from "../core/appRuntime.js";

function buildCabinetDialogDeps() {
  var app = getApp();

  return {
    ctx: app.ctx,
    trim: app.utils.trim,
    clamp: app.utils.clamp,
    toInt: app.utils.toInt,
    toFloat: app.utils.toFloat,
    createButton: app.utils.createButton,
    getActiveFrame: app.domains.frame.getActiveFrame,
    getAttr: app.utils.getAttr,
    normalizeCabinetModel: app.domains.cabinet.normalizeCabinetModel,
    generateLogicalCabinetId: app.helpers.generateLogicalCabinetId,
    relayoutCabinetByModel: app.domains.cabinet.relayoutCabinetByModel,
    findCabinetSegments: app.domains.cabinet.findCabinetSegments,
    insertCabinet: app.commands.insertCabinet,
    updateCabinetGap: app.commands.updateCabinetGap,
    showStatus: app.showStatus,
    setCanvasStatus: app.setCanvasStatus,
    findCabinetSegment: app.domains.cabinet.findCabinetSegment,
    extractCabinetModel: app.domains.cabinet.extractCabinetModel,
  };
}

export function createCabinetDialogs() {
  var deps = arguments.length > 0 ? arguments[0] : buildCabinetDialogDeps();
  var ctx = deps.ctx;
  var state = ctx.state;
  var constants = ctx.constants;
  var trim = deps.trim;

  // 根据点击位置推导 gap 对话框坐标，尽量避免超出视口。
  function getGapDialogPosition(nativeEvent, width, height) {
    var fallback = { x: 220, y: 180 };

    if (nativeEvent == null) {
      return fallback;
    }

    var offsetX = 36;
    var offsetY = -24;
    var rawEvent =
      typeof nativeEvent.getEvent == "function"
        ? nativeEvent.getEvent()
        : nativeEvent;
    var pageX =
      mxEvent.getClientX(rawEvent) +
      (window.pageXOffset || document.documentElement.scrollLeft || 0);
    var pageY =
      mxEvent.getClientY(rawEvent) +
      (window.pageYOffset || document.documentElement.scrollTop || 0);
    var viewportWidth =
      window.innerWidth || document.documentElement.clientWidth || 1280;
    var viewportHeight =
      window.innerHeight || document.documentElement.clientHeight || 720;
    var minX =
      (window.pageXOffset || document.documentElement.scrollLeft || 0) + 12;
    var minY =
      (window.pageYOffset || document.documentElement.scrollTop || 0) + 12;
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

  // 保证同一时刻只有一个 gap 编辑小窗存在。
  function closeGapDialogWindow() {
    if (state.gapDialogWindow != null) {
      var wnd = state.gapDialogWindow;
      state.gapDialogWindow = null;
      wnd.destroy();
    }
  }

  // 插入配电柜时只采集必要输入，实际分页和布局都由 domain 层完成。
  function openInsertCabinetDialog() {
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

    var nameRow = document.createElement("div");
    nameRow.style.display = "grid";
    nameRow.style.gridTemplateColumns = "90px 1fr";
    nameRow.style.alignItems = "center";
    nameRow.style.gap = "8px";
    div.appendChild(nameRow);

    var nameLabel = document.createElement("div");
    nameLabel.innerText = "名称";
    nameRow.appendChild(nameLabel);

    var nameInput = document.createElement("input");
    nameInput.setAttribute("type", "text");
    nameInput.value = "配电柜";
    nameRow.appendChild(nameInput);

    var configRow = document.createElement("div");
    configRow.style.display = "grid";
    configRow.style.gridTemplateColumns = "90px 120px 90px 120px";
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
    countLabel.innerText = "右侧端子数";
    configRow.appendChild(countLabel);

    var countInput = document.createElement("input");
    countInput.setAttribute("type", "number");
    countInput.setAttribute("min", "2");
    countInput.value = String(constants.CABINET_DEFAULT_PORT_COUNT);
    configRow.appendChild(countInput);

    var hint = document.createElement("div");
    hint.style.color = Editor.isDarkMode() ? "#c0c4cc" : "#57606a";
    hint.style.fontSize = "12px";
    hint.innerText =
      "仅生成专用配电柜主体和右侧连接点，间距后续通过右侧热点编辑。";
    div.appendChild(hint);

    var buttons = document.createElement("div");
    div.appendChild(buttons);

    var wnd = new mxWindow("插入配电柜", div, 200, 160, 460, 190, true, true);
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
        cabinetWidth: widthInput.value,
        portCount: countInput.value,
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

  // gap 对话框只负责把比例值回写给 cabinetModel，再触发重排。
  function openCabinetGapDialog(gapCell, nativeEvent) {
    var segment = deps.findCabinetSegment(gapCell);
    var gapIndex = deps.toInt(deps.getAttr(gapCell, "gapIndex"), -1);

    if (segment == null || gapIndex < 0) {
      return;
    }

    closeGapDialogWindow();

    var cabinetModel = deps.extractCabinetModel(segment);
    var div = document.createElement("div");
    div.style.padding = "12px";
    div.style.display = "flex";
    div.style.flexDirection = "column";
    div.style.gap = "10px";
    div.style.width = "100%";
    div.style.height = "100%";
    div.style.boxSizing = "border-box";

    var label = document.createElement("div");
    label.innerText = "输入 0 到 1 之间的比例值";
    div.appendChild(label);

    var input = document.createElement("input");
    input.setAttribute("type", "number");
    input.setAttribute("min", "0");
    input.setAttribute("max", "1");
    input.setAttribute("step", "0.01");
    input.value = String(cabinetModel.gapRatios[gapIndex] || 0);
    div.appendChild(input);

    var error = document.createElement("div");
    error.style.minHeight = "18px";
    error.style.fontSize = "12px";
    error.style.color = "#b3261e";
    div.appendChild(error);

    var buttons = document.createElement("div");
    div.appendChild(buttons);

    var dialogWidth = 320;
    var dialogHeight = 170;
    var dialogPosition = getGapDialogPosition(
      nativeEvent,
      dialogWidth,
      dialogHeight,
    );
    var wnd = new mxWindow(
      "设置端子间距",
      div,
      dialogPosition.x,
      dialogPosition.y,
      dialogWidth,
      dialogHeight,
      true,
      true,
    );
    wnd.destroyOnClose = true;
    wnd.setClosable(true);
    wnd.setMaximizable(false);
    wnd.setResizable(false);
    wnd.setScrollable(false);
    wnd.addListener(mxEvent.DESTROY, function () {
      if (state.gapDialogWindow == wnd) {
        state.gapDialogWindow = null;
      }
    });
    state.gapDialogWindow = wnd;

    var saveButton = deps.createButton("保存", function () {
      var ratio = deps.toFloat(input.value, NaN);

      if (isNaN(ratio) || ratio < 0 || ratio > 1) {
        error.innerText = "请输入 0 到 1 之间的数值";
        return;
      }

      cabinetModel.gapRatios[gapIndex] = ratio;

      try {
        deps.updateCabinetGap(cabinetModel);
      } catch (e) {
        error.innerText = e.message || String(e);
        return;
      }
      wnd.destroy();
    });
    saveButton.style.marginTop = "0";
    buttons.appendChild(saveButton);

    wnd.setVisible(true);
  }

  return {
    closeGapDialogWindow,
    getGapDialogPosition,
    openCabinetGapDialog,
    openInsertCabinetDialog,
  };
}
