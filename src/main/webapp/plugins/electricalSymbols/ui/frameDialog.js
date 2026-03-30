export function openInsertFrameDialog(deps) {
  var ctx = deps.ctx;
  var graph = ctx.graph;
  var model = ctx.model;
  var state = ctx.state;
  var constants = ctx.constants;
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
    var groupId =
      selectedFrame != null
        ? deps.getFrameGroupId(selectedFrame)
        : deps.generateFrameGroupId();
    var nextPageNumber =
      selectedFrame != null
        ? deps.getMaxFramePageNumberInGroup(groupId) + 1
        : 1;
    var frame = deps.createDrawingFrameCell(config, nextPageNumber, {
      groupId: groupId,
    });
    state.frameConfig = deps.cloneJson(config);

    if (selectedFrame != null) {
      var anchorFrame =
        deps.getRightmostFrameInGroup(groupId) || selectedFrame;
      var anchorGeometry = model.getGeometry(anchorFrame);
      frame.geometry = frame.geometry.clone();
      frame.geometry.x =
        anchorGeometry.x +
        anchorGeometry.width +
        constants.FRAME_HORIZONTAL_GAP;
      frame.geometry.y = anchorGeometry.y;
      deps.addTopLevelCell(frame);
      graph.setSelectionCell(frame);
    } else if (existingFrames.length > 0) {
      var leftmostFrame = deps.getLeftmostFrame();
      var bottommostFrame = deps.getBottommostFrame();
      var leftGeometry =
        leftmostFrame != null ? model.getGeometry(leftmostFrame) : null;
      var bottomGeometry =
        bottommostFrame != null ? model.getGeometry(bottommostFrame) : null;
      frame.geometry = frame.geometry.clone();
      frame.geometry.x = leftGeometry != null ? leftGeometry.x : 0;
      frame.geometry.y =
        bottomGeometry != null
          ? bottomGeometry.y +
            bottomGeometry.height +
            constants.FRAME_VERTICAL_GAP
          : 0;
      deps.addTopLevelCell(frame);
      graph.setSelectionCell(frame);
    } else {
      var point = graph.getFreeInsertPoint();
      graph.setSelectionCells(graph.importCells([frame], point.x, point.y));
    }

    graph.scrollCellToVisible(graph.getSelectionCell());
    deps.showStatus("已插入图框", false);
    deps.setCanvasStatus("已插入图框");
    wnd.destroy();
  });
  submitButton.style.marginTop = "0";
  buttons.appendChild(submitButton);

  wnd.setVisible(true);
}

