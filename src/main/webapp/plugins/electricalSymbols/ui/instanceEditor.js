/**
 * 图元实例编辑器。
 * 负责编辑单个实例的端口、标签和绑定数据，并把变更同步回 root。
 */
import {
  findPreviewItemById,
  renderInteractivePreviewSurface,
  snapPortPointToEdge,
} from "./shared/previewSurface.js";
import { getApp } from "../core/appRuntime.js";

// 实例编辑器只作用于当前选中的电气图元实例。
function buildInstanceEditorDeps() {
  var app = getApp();

  return {
    ctx: app.ctx,
    findElectricalRoot: app.helpers.findElectricalRoot,
    showStatus: app.showStatus,
    extractSpec: app.domains.symbol.extractSpec,
    normalizePortLayout: app.domains.spec.normalizePortLayout,
    normalizeLabels: app.domains.spec.normalizeLabels,
    trim: app.utils.trim,
    getValueByPath: app.domains.spec.getValueByPath,
    createButton: app.utils.createButton,
    normalizePortMarker: app.domains.spec.normalizePortMarker,
    normalizePortDirection: app.domains.spec.normalizePortDirection,
    normalizePortIoMode: app.domains.spec.normalizePortIoMode,
    normalizeLabelAlign: app.domains.spec.normalizeLabelAlign,
    toSvgDataUri: app.domains.spec.toSvgDataUri,
    portEdgeSnapThresholdPx: app.constants.PORT_EDGE_SNAP_THRESHOLD_PX,
    normalizePortPoint: app.domains.spec.normalizePortPoint,
    normalizeLabelItem: app.domains.spec.normalizeLabelItem,
    applyInstanceSpec: app.commands.applyInstanceSpec,
  };
}

export function openEditInstanceDialog() {
  var deps = arguments.length > 0 ? arguments[0] : buildInstanceEditorDeps();
  var ctx = deps.ctx;
  var graph = ctx.graph;
  var state = ctx.state;
  var root = deps.findElectricalRoot(graph.getSelectionCell());

  if (root == null) {
    deps.showStatus("请先选择一个电气图元实例", true);
    return;
  }

  if (state.instanceWindow != null) {
    state.instanceWindow.destroy();
    state.instanceWindow = null;
  }

  // editorState 是实例编辑窗口的私有状态，不回写全局模板编辑状态。
  var editorState = {
    spec: deps.extractSpec(root),
    selectedItem: null,
    mode: "select",
    nextId: 1,
    preview: null,
    statusNode: null,
  };

  editorState.spec.ports = deps.normalizePortLayout(editorState.spec.ports);
  editorState.spec.labels = deps.normalizeLabels(editorState.spec.labels);

  // 扫描现有端口/标签 id，确保新建项时不会和旧 id 冲突。
  function scanNextId() {
    var maxId = 0;

    function scan(id) {
      var match = /:(\d+)$/.exec(deps.trim(id));

      if (match != null) {
        maxId = Math.max(maxId, parseInt(match[1], 10) || 0);
      }
    }

    editorState.spec.ports.forEach(function (item) {
      scan(item.id);
    });
    editorState.spec.labels.forEach(function (item) {
      scan(item.id);
    });
    editorState.nextId = maxId + 1;
  }

  function nextEditorId(prefix) {
    var id = prefix + ":" + editorState.nextId;
    editorState.nextId += 1;
    return id;
  }

  function setEditorSelection(type, id) {
    editorState.selectedItem =
      type != null && id != null ? { type, id } : null;
  }

  function updateEditorStatus(message, isError) {
    if (editorState.statusNode != null) {
      editorState.statusNode.innerText = message || "";
      editorState.statusNode.style.color = isError ? "#b3261e" : "#2e7d32";
    }
  }

  function getEditorLabelText(label) {
    var binding = deps.trim(label.binding);

    if (binding.length > 0) {
      var value = deps.getValueByPath(editorState.spec.data || {}, binding);

      if (value != null) {
        return String(value);
      }

      if (deps.trim(label.text).length > 0) {
        return label.text;
      }

      return "{{" + binding + "}}";
    }

    return deps.trim(label.text).length > 0 ? label.text : "文本";
  }

  function deleteEditorSelection() {
    if (editorState.selectedItem == null) {
      return;
    }

    if (editorState.selectedItem.type == "port") {
      editorState.spec.ports = editorState.spec.ports.filter(function (item) {
        return item.id != editorState.selectedItem.id;
      });
    } else if (editorState.selectedItem.type == "label") {
      editorState.spec.labels = editorState.spec.labels.filter(function (item) {
        return item.id != editorState.selectedItem.id;
      });
    }

    setEditorSelection(null, null);
    renderEditorPreview();
  }

  function renderEditorPreview() {
    var preview = editorState.preview;
    preview.innerHTML = "";

    var toolbar = document.createElement("div");
    toolbar.style.display = "flex";
    toolbar.style.alignItems = "center";
    toolbar.style.padding = "8px";
    toolbar.style.gap = "8px";
    toolbar.style.borderBottom = "1px solid #d0d7de";
    preview.appendChild(toolbar);

    function createModeButton(mode, label) {
      var btn = deps.createButton(label, function () {
        editorState.mode = mode;
        renderEditorPreview();
      });
      btn.style.marginTop = "0";
      btn.style.marginRight = "0";
      btn.style.padding = "4px 10px";

      if (editorState.mode == mode) {
        btn.style.borderColor = "#1a73e8";
        btn.style.color = "#1a73e8";
      }

      return btn;
    }

    toolbar.appendChild(createModeButton("select", "选择"));
    toolbar.appendChild(createModeButton("port", "添加连接点"));
    toolbar.appendChild(createModeButton("label", "添加文本框"));

    var deleteBtn = deps.createButton("删除选中", function () {
      deleteEditorSelection();
    });
    deleteBtn.style.marginTop = "0";
    deleteBtn.style.marginRight = "0";
    deleteBtn.style.padding = "4px 10px";
    toolbar.appendChild(deleteBtn);

    if (
      editorState.selectedItem != null &&
      editorState.selectedItem.type == "port"
    ) {
      var selectedPort = findPreviewItemById(
        editorState.spec.ports,
        editorState.selectedItem.id,
      );

      if (selectedPort != null) {
        var portEditor = document.createElement("div");
        portEditor.style.display = "flex";
        portEditor.style.alignItems = "center";
        portEditor.style.gap = "8px";
        portEditor.style.padding = "8px";
        portEditor.style.borderBottom = "1px solid #d0d7de";
        preview.appendChild(portEditor);

        var portNameInput = document.createElement("input");
        portNameInput.setAttribute("type", "text");
        portNameInput.setAttribute("placeholder", "端子名称，如 L1 / N / PE");
        portNameInput.value = selectedPort.name || "";
        portNameInput.style.width = "180px";
        portEditor.appendChild(portNameInput);

        var markerSelect = document.createElement("select");
        [
          { value: "cross", label: "叉号" },
          { value: "circle", label: "圆点" },
          { value: "hidden", label: "隐藏" },
        ].forEach(function (item) {
          var option = document.createElement("option");
          option.value = item.value;
          option.innerText = item.label;
          markerSelect.appendChild(option);
        });
        markerSelect.value = selectedPort.marker || "cross";
        portEditor.appendChild(markerSelect);

        var directionSelect = document.createElement("select");
        [
          { value: "any", label: "任意方向" },
          { value: "left", label: "左侧接入" },
          { value: "right", label: "右侧接入" },
          { value: "up", label: "上侧接入" },
          { value: "down", label: "下侧接入" },
        ].forEach(function (item) {
          var option = document.createElement("option");
          option.value = item.value;
          option.innerText = item.label;
          directionSelect.appendChild(option);
        });
        directionSelect.value = selectedPort.direction || "any";
        portEditor.appendChild(directionSelect);

        var ioSelect = document.createElement("select");
        [
          { value: "both", label: "可接入可接出" },
          { value: "in", label: "仅接入" },
          { value: "out", label: "仅接出" },
        ].forEach(function (item) {
          var option = document.createElement("option");
          option.value = item.value;
          option.innerText = item.label;
          ioSelect.appendChild(option);
        });
        ioSelect.value = selectedPort.ioMode || "both";
        portEditor.appendChild(ioSelect);

        mxEvent.addListener(portNameInput, "input", function () {
          selectedPort.name = deps.trim(portNameInput.value);
        });
        mxEvent.addListener(markerSelect, "change", function () {
          selectedPort.marker = deps.normalizePortMarker(markerSelect.value);
          renderEditorPreview();
        });
        mxEvent.addListener(directionSelect, "change", function () {
          selectedPort.direction = deps.normalizePortDirection(
            directionSelect.value,
          );
        });
        mxEvent.addListener(ioSelect, "change", function () {
          selectedPort.ioMode = deps.normalizePortIoMode(ioSelect.value);
        });
      }
    } else if (
      editorState.selectedItem != null &&
      editorState.selectedItem.type == "label"
    ) {
      var selectedLabel = findPreviewItemById(
        editorState.spec.labels,
        editorState.selectedItem.id,
      );

      if (selectedLabel != null) {
        var labelEditor = document.createElement("div");
        labelEditor.style.display = "flex";
        labelEditor.style.alignItems = "center";
        labelEditor.style.gap = "8px";
        labelEditor.style.padding = "8px";
        labelEditor.style.borderBottom = "1px solid #d0d7de";
        preview.appendChild(labelEditor);

        var textInput = document.createElement("input");
        textInput.setAttribute("type", "text");
        textInput.setAttribute("placeholder", "文本内容");
        textInput.value = selectedLabel.text || "";
        textInput.style.width = "180px";
        labelEditor.appendChild(textInput);

        var bindingInput = document.createElement("input");
        bindingInput.setAttribute("type", "text");
        bindingInput.setAttribute("placeholder", "可选：绑定属性路径");
        bindingInput.value = selectedLabel.binding || "";
        bindingInput.style.width = "180px";
        labelEditor.appendChild(bindingInput);

        var alignSelect = document.createElement("select");
        [
          { value: "left", label: "左对齐" },
          { value: "center", label: "居中" },
          { value: "right", label: "右对齐" },
        ].forEach(function (item) {
          var option = document.createElement("option");
          option.value = item.value;
          option.innerText = item.label;
          alignSelect.appendChild(option);
        });
        alignSelect.value = selectedLabel.align || "center";
        labelEditor.appendChild(alignSelect);

        mxEvent.addListener(textInput, "change", function () {
          selectedLabel.text = deps.trim(textInput.value);
          renderEditorPreview();
        });
        mxEvent.addListener(bindingInput, "change", function () {
          selectedLabel.binding = deps.trim(bindingInput.value);
          renderEditorPreview();
        });
        mxEvent.addListener(alignSelect, "change", function () {
          selectedLabel.align = deps.normalizeLabelAlign(alignSelect.value);
          renderEditorPreview();
        });
      }
    }

    renderInteractivePreviewSurface(
      null,
      {
        container: preview,
        spec: editorState.spec,
        height: 300,
        title: editorState.spec.title || "图元实例",
        svgDataUri: deps.toSvgDataUri(editorState.spec),
        mode: editorState.mode,
        selectedItem: editorState.selectedItem,
        ports: editorState.spec.ports,
        labels: editorState.spec.labels,
        getPortById: function (id) {
          return findPreviewItemById(editorState.spec.ports, id);
        },
        getLabelById: function (id) {
          return findPreviewItemById(editorState.spec.labels, id);
        },
        getLabelText: getEditorLabelText,
        buildPortTitle: function (point, index) {
          return point.name || point.id || "连接点" + (index + 1);
        },
        onSelect: setEditorSelection,
        onRequestRender: renderEditorPreview,
        onDragMove: function (type, id, point) {
          if (type == "port") {
            var port = findPreviewItemById(editorState.spec.ports, id);

            if (port != null) {
              port.x = point.x;
              port.y = point.y;
            }
          } else {
            var label = findPreviewItemById(editorState.spec.labels, id);

            if (label != null) {
              label.x = point.x;
              label.y = point.y;
            }
          }
        },
        onDragEnd: function (type, id, metrics) {
          if (type != "port") {
            return;
          }

          var finalPort = findPreviewItemById(editorState.spec.ports, id);

          if (finalPort != null) {
            var snapped = snapPortPointToEdge(
              { x: finalPort.x, y: finalPort.y },
              metrics,
              deps.portEdgeSnapThresholdPx,
            );
            finalPort.x = snapped.x;
            finalPort.y = snapped.y;
          }
        },
        onSurfaceClick: function (point, metrics) {
          if (editorState.mode == "port") {
            var portId = nextEditorId("port");
            point = snapPortPointToEdge(
              point,
              metrics,
              deps.portEdgeSnapThresholdPx,
            );
            editorState.spec.ports.push(
              deps.normalizePortPoint(
                {
                  id: portId,
                  x: point.x,
                  y: point.y,
                  name: "",
                  marker: "cross",
                  direction: "any",
                  ioMode: "both",
                },
                portId,
                point.x,
                point.y,
              ),
            );
            setEditorSelection(
              "port",
              editorState.spec.ports[editorState.spec.ports.length - 1].id,
            );
          } else if (editorState.mode == "label") {
            var labelId = nextEditorId("label");
            editorState.spec.labels.push(
              deps.normalizeLabelItem(
                {
                  id: labelId,
                  text: "文本",
                  binding: "",
                  x: point.x,
                  y: point.y,
                  width: 120,
                  height: 26,
                  align: "center",
                },
                labelId,
                "文本",
              ),
            );
            setEditorSelection(
              "label",
              editorState.spec.labels[editorState.spec.labels.length - 1].id,
            );
          } else {
            setEditorSelection(null, null);
          }

          renderEditorPreview();
        },
      },
    );
  }

  scanNextId();

  var container = document.createElement("div");
  container.style.width = "100%";
  container.style.height = "100%";
  container.style.boxSizing = "border-box";
  container.style.padding = "12px";
  container.style.overflow = "auto";
  container.style.background = Editor.isDarkMode() ? "#1e1e1e" : "#ffffff";
  container.style.display = "flex";
  container.style.flexDirection = "column";

  var title = document.createElement("div");
  title.style.fontWeight = "bold";
  title.style.marginBottom = "8px";
  title.innerText = "编辑图元实例";
  container.appendChild(title);

  var hint = document.createElement("div");
  hint.style.marginBottom = "10px";
  hint.style.color = Editor.isDarkMode() ? "#c0c4cc" : "#57606a";
  hint.style.fontSize = "12px";
  hint.innerText =
    "这里修改的是当前画布上的这个图元实例，不会影响图元类型模板。";
  container.appendChild(hint);

  editorState.preview = document.createElement("div");
  editorState.preview.style.flex = "1 1 auto";
  editorState.preview.style.border = "1px solid #d0d7de";
  editorState.preview.style.borderRadius = "8px";
  editorState.preview.style.overflow = "hidden";
  container.appendChild(editorState.preview);

  var buttons = document.createElement("div");
  buttons.style.marginTop = "10px";
  buttons.style.display = "flex";
  buttons.style.alignItems = "center";
  buttons.style.gap = "8px";
  container.appendChild(buttons);

  var applyButton = deps.createButton("应用到图元", function () {
    try {
      deps.applyInstanceSpec(root, editorState.spec);
    } catch (e) {
      updateEditorStatus(e.message || String(e), true);
      return;
    }

    updateEditorStatus("已更新图元实例", false);

    if (state.instanceWindow != null) {
      state.instanceWindow.destroy();
    }
  });
  applyButton.style.marginTop = "0";
  applyButton.style.marginRight = "0";
  buttons.appendChild(applyButton);

  var closeButton = deps.createButton("关闭", function () {
    if (state.instanceWindow != null) {
      state.instanceWindow.destroy();
    }
  });
  closeButton.style.marginTop = "0";
  closeButton.style.marginRight = "0";
  buttons.appendChild(closeButton);

  editorState.statusNode = document.createElement("div");
  editorState.statusNode.style.marginLeft = "8px";
  editorState.statusNode.style.fontSize = "12px";
  editorState.statusNode.style.minHeight = "18px";
  buttons.appendChild(editorState.statusNode);

  renderEditorPreview();

  var wnd = new mxWindow(
    "编辑图元实例",
    container,
    220,
    120,
    680,
    520,
    true,
    true,
  );
  wnd.destroyOnClose = true;
  wnd.setClosable(true);
  wnd.setMaximizable(false);
  wnd.setResizable(true);
  wnd.setScrollable(true);
  wnd.addListener(mxEvent.DESTROY, function () {
    if (state.instanceWindow == wnd) {
      state.instanceWindow = null;
    }
  });
  wnd.setVisible(true);
  state.instanceWindow = wnd;
}
