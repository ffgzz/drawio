/**
 * 模板编辑器主窗口。
 * 负责编辑模板的 SVG、schema、端口、标签和变体信息。
 */
import {
  findPreviewItemById,
  renderInteractivePreviewSurface,
  snapPortPointToEdge,
} from "./shared/previewSurface.js";
import { getApp } from "../core/appRuntime.js";

// 这是插件里最复杂的 UI 模块，承载模板定义的完整编辑流程。
function buildTemplateEditorDeps() {
  var app = getApp();

  return {
    ctx: app.ctx,
    trim: app.utils.trim,
    cloneJson: app.utils.cloneJson,
    normalizePortLayout: app.domains.spec.normalizePortLayout,
    normalizeLabels: app.domains.spec.normalizeLabels,
    toSvgDataUri: app.domains.spec.toSvgDataUri,
    createButton: app.utils.createButton,
    normalizePortMarker: app.domains.spec.normalizePortMarker,
    normalizePortDirection: app.domains.spec.normalizePortDirection,
    normalizePortIoMode: app.domains.spec.normalizePortIoMode,
    portEdgeSnapThresholdPx: app.constants.PORT_EDGE_SNAP_THRESHOLD_PX,
    nextItemId: app.helpers.nextItemId,
    normalizeLabelItem: app.domains.spec.normalizeLabelItem,
    validateSvg: app.utils.validateSvg,
    extractSvgSize: app.utils.extractSvgSize,
    scheduleEditorDraftSave: app.services.draftStore.scheduleEditorDraftSave,
    clearDraftSaveTimer: app.services.draftStore.clearDraftSaveTimer,
    loadEditorDraft: app.services.draftStore.loadEditorDraft,
    clearEditorDraft: app.services.draftStore.clearEditorDraft,
    generateSymbolId: app.helpers.generateSymbolId,
    getDefaultSchemaFields: app.domains.spec.getDefaultSchemaFields,
    buildSchemaFromFields: app.domains.spec.buildSchemaFromFields,
    hasSchemaPath: app.domains.spec.hasSchemaPath,
    normalizeSchemaField: app.domains.spec.normalizeSchemaField,
    normalizeSchemaType: app.domains.spec.normalizeSchemaType,
    normalizeEnumOptions: app.domains.spec.normalizeEnumOptions,
    isValidFieldPath: app.domains.spec.isValidFieldPath,
    toInt: app.utils.toInt,
    showStatus: app.showStatus,
    normalizeSpec: app.domains.spec.normalizeSpec,
    normalizeVariantLayouts: app.domains.spec.normalizeVariantLayouts,
    flattenSchemaFields: app.domains.spec.flattenSchemaFields,
    isObject: app.utils.isObject,
    addToLibrary: app.services.libraryStore.addToLibrary,
    isTemplateNameTaken: app.services.libraryStore.isTemplateNameTaken,
    loadStoredLibrary: app.services.libraryStore.loadStoredLibrary,
  };
}

export function createTemplateEditor() {
  var deps = arguments.length > 0 ? arguments[0] : buildTemplateEditorDeps();
  var ctx = deps.ctx;
  var state = ctx.state;

  // 一个 binding 只能绑定到一个标签，避免生成含糊的模板语义。
  function hasLabelBinding(spec, binding, ignoreId) {
    var normalized = deps.trim(binding);
    var i;

    if (normalized.length == 0) {
      return false;
    }

    for (i = 0; i < spec.labels.length; i++) {
      if (
        spec.labels[i].id != ignoreId &&
        deps.trim(spec.labels[i].binding) == normalized
      ) {
        return true;
      }
    }

    return false;
  }

  // 变体 key 需要在模板内部保持唯一，后续实例切换才可靠。
  function hasVariantKey(key, ignoreId) {
    var normalized = deps.trim(key);
    var i;

    if (normalized.length == 0) {
      return false;
    }

    for (i = 0; i < state.variantItems.length; i++) {
      if (
        state.variantItems[i].id != ignoreId &&
        deps.trim(state.variantItems[i].key) == normalized
      ) {
        return true;
      }
    }

    return false;
  }

  function findVariantItem(id) {
    var i;

    for (i = 0; i < state.variantItems.length; i++) {
      if (state.variantItems[i].id == id) {
        return state.variantItems[i];
      }
    }

    return null;
  }

  function getPreviewLayoutStore(spec) {
    if (state.previewVariantId != null && state.previewVariantId.length > 0) {
      var variantItem = findVariantItem(state.previewVariantId);

      if (variantItem != null) {
        variantItem.ports = deps.normalizePortLayout(variantItem.ports);
        variantItem.labels = deps.normalizeLabels(variantItem.labels);
        return variantItem;
      }
    }

    spec.ports = deps.normalizePortLayout(spec.ports);
    spec.labels = deps.normalizeLabels(spec.labels);
    return spec;
  }

  function getPreviewSvg(spec) {
    var variantItem =
      state.previewVariantId != null && state.previewVariantId.length > 0
        ? findVariantItem(state.previewVariantId)
        : null;

    if (variantItem != null && deps.trim(variantItem.svg).length > 0) {
      return "data:image/svg+xml," + encodeURIComponent(variantItem.svg);
    }

    return deps.toSvgDataUri(spec);
  }

  function getPreviewTitle(spec) {
    var variantItem =
      state.previewVariantId != null && state.previewVariantId.length > 0
        ? findVariantItem(state.previewVariantId)
        : null;

    if (variantItem != null) {
      return deps.trim(variantItem.key).length > 0
        ? spec.title + " [" + deps.trim(variantItem.key) + "]"
        : spec.title + " [未命名变体]";
    }

    return spec.title;
  }

  function getEditorSchema() {
    return deps.buildSchemaFromFields(state.schemaFields || []);
  }

  function validateVariantField(showError) {
    if (!state.variantEnabled) {
      return "";
    }

    var field = deps.trim(
      state.variantFieldInput != null ? state.variantFieldInput.value : "",
    );

    if (field.length == 0) {
      if (showError) {
        deps.showStatus("请先填写变体字段", true);
      }

      return null;
    }

    try {
      var schema = getEditorSchema();

      if (!deps.isObject(schema)) {
        throw new Error("类型定义必须是对象");
      }

      if (!deps.hasSchemaPath(schema, field)) {
        if (showError) {
          deps.showStatus("变体字段必须先在 JSON 类型定义中声明", true);
        }

        return null;
      }

      return field;
    } catch (e) {
      if (showError) {
        deps.showStatus(e.message || "类型定义格式有误", true);
      }

      return null;
    }
  }

  function collectVariantMap() {
    var variants = {};
    var i;

    if (!state.variantEnabled) {
      return variants;
    }

    for (i = 0; i < state.variantItems.length; i++) {
      var item = state.variantItems[i];
      var key = deps.trim(item.key);

      if (key.length > 0 && deps.trim(item.svg).length > 0) {
        variants[key] = item.svg;
      }
    }

    return variants;
  }

  function collectVariantLayouts() {
    var layouts = {};
    var i;

    if (!state.variantEnabled) {
      return layouts;
    }

    for (i = 0; i < state.variantItems.length; i++) {
      var item = state.variantItems[i];
      var key = deps.trim(item.key);

      if (key.length == 0) {
        continue;
      }

      layouts[key] = {
        ports: deps.normalizePortLayout(item.ports),
        labels: deps.normalizeLabels(item.labels),
      };
    }

    return layouts;
  }

  function buildTemplateSpec() {
    if (deps.trim(state.uploadedPrimarySvg).length == 0) {
      throw new Error("请先上传默认SVG");
    }

    var schema = getEditorSchema();

    if (!deps.isObject(schema)) {
      throw new Error("类型定义必须是对象");
    }

    var current = state.currentSpec || {};
    var symbolId = deps.trim(
      state.symbolIdInput != null ? state.symbolIdInput.value : "",
    );
    var templateName = deps.trim(
      state.templateNameInput != null ? state.templateNameInput.value : "",
    );
    var variantField = "";
    var baseSize;

    if (symbolId.length == 0) {
      throw new Error("请先填写图元类型ID");
    }

    if (templateName.length == 0) {
      throw new Error("请先填写图元类型名称");
    }

    if (state.variantEnabled) {
      variantField = validateVariantField(true);

      if (variantField == null) {
        throw new Error("变体字段必须先在 JSON 类型定义中声明");
      }
    }

    baseSize =
      state.uploadedPrimarySvgSize || deps.extractSvgSize(state.uploadedPrimarySvg);

    return deps.normalizeSpec({
      symbolId,
      templateName,
      title: deps.trim(current.title) || templateName,
      svg: state.uploadedPrimarySvg,
      size: {
        width: Math.max(
          20,
          deps.toInt(
            state.templateWidthInput != null
              ? state.templateWidthInput.value
              : null,
            baseSize.width,
          ),
        ),
        height: Math.max(
          20,
          deps.toInt(
            state.templateHeightInput != null
              ? state.templateHeightInput.value
              : null,
            baseSize.height,
          ),
        ),
      },
      device: current.device || {},
      ports: current.ports || [],
      labels: current.labels || [],
      schema,
      data: current.data || {},
      variantField,
      svgVariants: collectVariantMap(),
      variantLayouts: collectVariantLayouts(),
    });
  }

  function parseEditorSpec() {
    try {
      var spec = buildTemplateSpec();
      state.currentSpec = spec;
      updatePreview(spec);
      deps.showStatus("预览已刷新", false);
      return spec;
    } catch (e) {
      deps.showStatus(e.message || String(e), true);
      throw e;
    }
  }

  function updateSelectedItem(type, id) {
    state.selectedItem =
      type != null && id != null ? { type, id } : null;
  }

  function deleteSelectedItem() {
    if (state.currentSpec == null || state.selectedItem == null) {
      return;
    }

    var next = deps.cloneJson(state.currentSpec);
    var layout = getPreviewLayoutStore(next);

    if (state.selectedItem.type == "port") {
      layout.ports = layout.ports.filter(function (item) {
        return item.id != state.selectedItem.id;
      });
    } else if (state.selectedItem.type == "label") {
      layout.labels = layout.labels.filter(function (item) {
        return item.id != state.selectedItem.id;
      });
    }

    state.currentSpec = deps.normalizeSpec(next);
    updateSelectedItem(null, null);
    updatePreview(state.currentSpec);
  }

  function getTemplateLabelText(label) {
    return deps.trim(label.binding).length > 0
      ? "{{" + label.binding + "}}"
      : label.text || "未绑定";
  }

  function updatePreview(spec) {
    if (state.preview == null) {
      return;
    }

    state.preview.innerHTML = "";

    if (spec == null || deps.trim(spec.svg).length == 0) {
      var empty = document.createElement("div");
      empty.style.height = "100%";
      empty.style.display = "flex";
      empty.style.alignItems = "center";
      empty.style.justifyContent = "center";
      empty.style.color = Editor.isDarkMode() ? "#c0c4cc" : "#57606a";
      empty.innerText = "请先上传默认SVG，再在这里添加连接点和文本框";
      state.preview.appendChild(empty);
      deps.scheduleEditorDraftSave();
      return;
    }

    state.currentSpec = deps.normalizeSpec(spec);
    deps.scheduleEditorDraftSave();

    var layoutStore = getPreviewLayoutStore(state.currentSpec);
    var selectedId = state.selectedItem != null ? state.selectedItem.id : null;
    var selectedType =
      state.selectedItem != null ? state.selectedItem.type : null;

    if (
      (selectedType == "port" &&
        findPreviewItemById(layoutStore.ports, selectedId) == null) ||
      (selectedType == "label" &&
        findPreviewItemById(layoutStore.labels, selectedId) == null)
    ) {
      updateSelectedItem(null, null);
    }

    var toolbar = document.createElement("div");
    toolbar.style.display = "flex";
    toolbar.style.alignItems = "center";
    toolbar.style.padding = "8px";
    toolbar.style.gap = "8px";
    toolbar.style.borderBottom = "1px solid #d0d7de";
    state.preview.appendChild(toolbar);

    function createModeButton(mode, label) {
      var btn = deps.createButton(label, function () {
        state.previewMode = mode;
        updatePreview(state.currentSpec);
      });
      btn.style.marginTop = "0";
      btn.style.marginRight = "0";
      btn.style.padding = "4px 10px";

      if (state.previewMode == mode) {
        btn.style.borderColor = "#1a73e8";
        btn.style.color = "#1a73e8";
      }

      return btn;
    }

    toolbar.appendChild(createModeButton("select", "选择"));
    toolbar.appendChild(createModeButton("port", "添加连接点"));
    toolbar.appendChild(createModeButton("label", "添加文本框"));

    if (state.variantEnabled && state.variantItems.length > 0) {
      var previewSelect = document.createElement("select");
      previewSelect.style.marginLeft = "8px";
      previewSelect.style.maxWidth = "180px";
      var defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.innerText = "编辑默认SVG";
      previewSelect.appendChild(defaultOption);

      for (var p = 0; p < state.variantItems.length; p++) {
        var previewItem = state.variantItems[p];
        var option = document.createElement("option");
        option.value = previewItem.id;
        option.innerText =
          deps.trim(previewItem.key).length > 0
            ? "编辑变体：" + deps.trim(previewItem.key)
            : "编辑未命名变体";
        previewSelect.appendChild(option);
      }

      previewSelect.value = state.previewVariantId || "";
      mxEvent.addListener(previewSelect, "change", function () {
        state.previewVariantId = previewSelect.value || "";
        updateSelectedItem(null, null);
        updatePreview(state.currentSpec);
      });
      toolbar.appendChild(previewSelect);
    }

    var deleteBtn = deps.createButton("删除选中", function () {
      deleteSelectedItem();
    });
    deleteBtn.style.marginTop = "0";
    deleteBtn.style.marginRight = "0";
    deleteBtn.style.padding = "4px 10px";
    toolbar.appendChild(deleteBtn);

    if (state.selectedItem != null && state.selectedItem.type == "port") {
      var selectedPort = findPreviewItemById(
        layoutStore.ports,
        state.selectedItem.id,
      );

      if (selectedPort != null) {
        var portEditor = document.createElement("div");
        portEditor.style.display = "flex";
        portEditor.style.alignItems = "center";
        portEditor.style.gap = "8px";
        portEditor.style.padding = "8px";
        portEditor.style.borderBottom = "1px solid #d0d7de";
        state.preview.appendChild(portEditor);

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
          updatePreview(state.currentSpec);
        });
        mxEvent.addListener(markerSelect, "change", function () {
          selectedPort.marker = deps.normalizePortMarker(markerSelect.value);
          updatePreview(state.currentSpec);
        });
        mxEvent.addListener(directionSelect, "change", function () {
          selectedPort.direction = deps.normalizePortDirection(
            directionSelect.value,
          );
          updatePreview(state.currentSpec);
        });
        mxEvent.addListener(ioSelect, "change", function () {
          selectedPort.ioMode = deps.normalizePortIoMode(ioSelect.value);
          updatePreview(state.currentSpec);
        });
      }
    }

    renderInteractivePreviewSurface(
      null,
      {
        container: state.preview,
        spec: state.currentSpec,
        height: 278,
        title: getPreviewTitle(state.currentSpec),
        svgDataUri: getPreviewSvg(state.currentSpec),
        mode: state.previewMode,
        selectedItem: state.selectedItem,
        ports: layoutStore.ports,
        labels: layoutStore.labels,
        getPortById: function (id) {
          return findPreviewItemById(
            getPreviewLayoutStore(state.currentSpec).ports,
            id,
          );
        },
        getLabelById: function (id) {
          return findPreviewItemById(
            getPreviewLayoutStore(state.currentSpec).labels,
            id,
          );
        },
        getLabelText: getTemplateLabelText,
        buildPortTitle: function (point) {
          return point.id;
        },
        onSelect: updateSelectedItem,
        onRequestRender: function () {
          updatePreview(state.currentSpec);
        },
        onDragMove: function (type, id, point) {
          var current = state.currentSpec;
          var nextLayout = getPreviewLayoutStore(current);

          if (type == "port") {
            var port = findPreviewItemById(nextLayout.ports, id);

            if (port != null) {
              port.x = point.x;
              port.y = point.y;
            }
          } else {
            var label = findPreviewItemById(nextLayout.labels, id);

            if (label != null) {
              label.x = point.x;
              label.y = point.y;
            }
          }
        },
        onDragEnd: function (type, id, metrics) {
          if (type != "port" || state.currentSpec == null) {
            return;
          }

          var finalLayout = getPreviewLayoutStore(state.currentSpec);
          var finalPort = findPreviewItemById(finalLayout.ports, id);

          if (finalPort != null) {
            var snappedPoint = snapPortPointToEdge(
              { x: finalPort.x, y: finalPort.y },
              metrics,
              deps.portEdgeSnapThresholdPx,
            );
            finalPort.x = snappedPoint.x;
            finalPort.y = snappedPoint.y;
          }
        },
        onSurfaceClick: function (point, metrics) {
          if (state.previewMode == "port") {
            point = snapPortPointToEdge(
              point,
              metrics,
              deps.portEdgeSnapThresholdPx,
            );
            layoutStore.ports.push({
              id: deps.nextItemId("port"),
              x: point.x,
              y: point.y,
            });
            updateSelectedItem(
              "port",
              layoutStore.ports[layoutStore.ports.length - 1].id,
            );
            updatePreview(state.currentSpec);
          } else if (state.previewMode == "label") {
            var binding = window.prompt(
              "输入绑定属性路径，例如 name 或 device.name",
              "name",
            );
            var labelId = deps.nextItemId("label");

            if (binding == null) {
              return;
            }

            binding = deps.trim(binding);

            if (hasLabelBinding({ labels: layoutStore.labels }, binding, null)) {
              deps.showStatus("同一个属性只能绑定一个文本框", true);
              return;
            }

            layoutStore.labels.push(
              deps.normalizeLabelItem(
                {
                  id: labelId,
                  text: "文本",
                  binding,
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
            updateSelectedItem(
              "label",
              layoutStore.labels[layoutStore.labels.length - 1].id,
            );
            updatePreview(state.currentSpec);
          } else {
            updateSelectedItem(null, null);
            updatePreview(state.currentSpec);
          }
        },
        onLabelDoubleClick: function (label) {
          var nextBinding = window.prompt(
            "输入绑定属性路径，例如 name 或 device.name",
            label.binding,
          );

          if (nextBinding == null) {
            return;
          }

          nextBinding = deps.trim(nextBinding);

          if (
            hasLabelBinding(
              { labels: getPreviewLayoutStore(state.currentSpec).labels },
              nextBinding,
              label.id,
            )
          ) {
            deps.showStatus("同一个属性只能绑定一个文本框", true);
            return;
          }

          label.binding = nextBinding;
          updateSelectedItem("label", label.id);
          updatePreview(state.currentSpec);
        },
      },
    );
  }

  function bindSvgUpload(
    input,
    nameNode,
    svgKey,
    nameKey,
    successMessage,
    updateSize,
    onLoaded,
  ) {
    mxEvent.addListener(input, "change", function () {
      if (input.files == null || input.files.length == 0) {
        return;
      }

      var reader = new FileReader();
      reader.onload = function () {
        try {
          var svg = deps.validateSvg(reader.result);
          var fileName = input.files[0].name;

          if (svgKey != null) {
            state[svgKey] = svg;
          }

          if (nameKey != null) {
            state[nameKey] = fileName;
          }

          if (typeof onLoaded === "function") {
            onLoaded(svg, fileName);
          }

          if (updateSize) {
            state.uploadedPrimarySvgSize = deps.extractSvgSize(svg);
          }

          if (nameNode != null && nameKey != null) {
            nameNode.innerText = state[nameKey];
          }

          if (deps.trim(state.uploadedPrimarySvg).length > 0) {
            parseEditorSpec();
          } else {
            updatePreview(null);
          }

          deps.scheduleEditorDraftSave();
          deps.showStatus(successMessage, false);
        } catch (e) {
          deps.showStatus(e.message || String(e), true);
        }
      };
      reader.readAsText(input.files[0], "utf-8");
    });
  }

  function createWindow() {
    deps.clearDraftSaveTimer();
    state.nextId = 1;
    state.symbolIdTouched = false;
    state.variantEnabled = false;
    state.lastValidVariantField = "";
    state.variantItems = [];
    state.currentSpec = null;
    state.selectedItem = null;
    state.previewVariantId = "";
    state.previewMode = "select";
    state.uploadedPrimarySvg = "";
    state.uploadedPrimarySvgName = "";
    state.uploadedPrimarySvgSize = null;

    var container = document.createElement("div");
    container.style.width = "100%";
    container.style.height = "100%";
    container.style.boxSizing = "border-box";
    container.style.padding = "12px";
    container.style.overflow = "auto";
    container.style.background = Editor.isDarkMode() ? "#1e1e1e" : "#ffffff";

    var title = document.createElement("div");
    title.style.fontWeight = "bold";
    title.style.marginBottom = "8px";
    title.innerText = "电气图元类型定义";
    container.appendChild(title);

    var symbolRow = document.createElement("div");
    symbolRow.style.display = "flex";
    symbolRow.style.alignItems = "center";
    symbolRow.style.marginBottom = "10px";
    container.appendChild(symbolRow);

    var symbolLabel = document.createElement("div");
    symbolLabel.style.width = "90px";
    symbolLabel.style.flex = "0 0 90px";
    symbolLabel.innerText = "图元类型ID";
    symbolRow.appendChild(symbolLabel);

    state.symbolIdInput = document.createElement("input");
    state.symbolIdInput.setAttribute("type", "text");
    state.symbolIdInput.style.flex = "1 1 auto";
    state.symbolIdInput.style.boxSizing = "border-box";
    state.symbolIdInput.value = deps.generateSymbolId("electrical-symbol");
    symbolRow.appendChild(state.symbolIdInput);
    mxEvent.addListener(state.symbolIdInput, "input", function () {
      state.symbolIdTouched = true;
      deps.scheduleEditorDraftSave();
    });

    var nameRow = document.createElement("div");
    nameRow.style.display = "flex";
    nameRow.style.alignItems = "center";
    nameRow.style.marginBottom = "10px";
    container.appendChild(nameRow);

    var nameLabel = document.createElement("div");
    nameLabel.style.width = "90px";
    nameLabel.style.flex = "0 0 90px";
    nameLabel.innerText = "图元类型名称";
    nameRow.appendChild(nameLabel);

    state.templateNameInput = document.createElement("input");
    state.templateNameInput.setAttribute("type", "text");
    state.templateNameInput.style.flex = "1 1 auto";
    state.templateNameInput.style.boxSizing = "border-box";
    state.templateNameInput.value = "电气图元";
    nameRow.appendChild(state.templateNameInput);

    var sizeRow = document.createElement("div");
    sizeRow.style.display = "flex";
    sizeRow.style.alignItems = "center";
    sizeRow.style.gap = "8px";
    sizeRow.style.marginBottom = "10px";
    container.appendChild(sizeRow);

    var sizeLabel = document.createElement("div");
    sizeLabel.style.width = "90px";
    sizeLabel.style.flex = "0 0 90px";
    sizeLabel.innerText = "默认宽高";
    sizeRow.appendChild(sizeLabel);

    state.templateWidthInput = document.createElement("input");
    state.templateWidthInput.setAttribute("type", "number");
    state.templateWidthInput.setAttribute("min", "20");
    state.templateWidthInput.style.width = "120px";
    state.templateWidthInput.value = "120";
    sizeRow.appendChild(state.templateWidthInput);

    var sizeSplit = document.createElement("div");
    sizeSplit.innerText = "x";
    sizeRow.appendChild(sizeSplit);

    state.templateHeightInput = document.createElement("input");
    state.templateHeightInput.setAttribute("type", "number");
    state.templateHeightInput.setAttribute("min", "20");
    state.templateHeightInput.style.width = "120px";
    state.templateHeightInput.value = "80";
    sizeRow.appendChild(state.templateHeightInput);

    var topRow = document.createElement("div");
    topRow.style.display = "flex";
    topRow.style.alignItems = "center";
    topRow.style.flexWrap = "wrap";
    topRow.style.rowGap = "8px";
    container.appendChild(topRow);

    var primaryInput = document.createElement("input");
    primaryInput.setAttribute("type", "file");
    primaryInput.setAttribute("accept", ".svg,image/svg+xml");
    primaryInput.style.display = "none";
    topRow.appendChild(primaryInput);

    var primaryButton = deps.createButton(
      mxResources.get("electricalUploadPrimarySvg"),
      function () {
        primaryInput.click();
      },
    );
    primaryButton.style.marginTop = "0";
    topRow.appendChild(primaryButton);

    var primaryName = document.createElement("div");
    primaryName.style.marginLeft = "8px";
    primaryName.style.marginRight = "12px";
    primaryName.style.color = Editor.isDarkMode() ? "#c0c4cc" : "#57606a";
    primaryName.innerText = "未选择默认SVG";
    topRow.appendChild(primaryName);

    var variantToggleRow = document.createElement("div");
    variantToggleRow.style.display = "flex";
    variantToggleRow.style.alignItems = "center";
    variantToggleRow.style.gap = "8px";
    variantToggleRow.style.marginTop = "10px";
    container.appendChild(variantToggleRow);

    var variantToggle = document.createElement("input");
    variantToggle.setAttribute("type", "checkbox");
    variantToggleRow.appendChild(variantToggle);

    var variantToggleLabel = document.createElement("div");
    variantToggleLabel.innerText = mxResources.get("electricalEnableVariants");
    variantToggleRow.appendChild(variantToggleLabel);

    var variantSection = document.createElement("div");
    variantSection.style.display = "none";
    container.appendChild(variantSection);

    var variantRow = document.createElement("div");
    variantRow.style.display = "flex";
    variantRow.style.alignItems = "center";
    variantRow.style.gap = "8px";
    variantRow.style.marginTop = "10px";
    variantSection.appendChild(variantRow);

    var variantLabel = document.createElement("div");
    variantLabel.style.width = "90px";
    variantLabel.style.flex = "0 0 90px";
    variantLabel.innerText = "变体字段";
    variantRow.appendChild(variantLabel);

    state.variantFieldInput = document.createElement("input");
    state.variantFieldInput.setAttribute("type", "text");
    state.variantFieldInput.style.flex = "1 1 auto";
    state.variantFieldInput.style.boxSizing = "border-box";
    state.variantFieldInput.value = "";
    state.variantFieldInput.setAttribute(
      "placeholder",
      "请输入类型定义里已存在的字段路径",
    );
    variantRow.appendChild(state.variantFieldInput);

    var addVariantButton = deps.createButton(
      mxResources.get("electricalAddVariantSvg"),
      function () {
        if (state.variantEnabled && validateVariantField(true) == null) {
          return;
        }

        state.variantItems.push({
          id: deps.nextItemId("variant"),
          key: "",
          svg: "",
          name: "",
          ports: deps.cloneJson(
            state.currentSpec != null ? state.currentSpec.ports || [] : [],
          ),
          labels: deps.cloneJson(
            state.currentSpec != null ? state.currentSpec.labels || [] : [],
          ),
        });
        renderVariantList();
        updateSelectedItem(null, null);
        updatePreview(state.currentSpec);
        deps.scheduleEditorDraftSave();
      },
    );
    addVariantButton.style.marginTop = "0";
    addVariantButton.style.marginRight = "0";
    variantRow.appendChild(addVariantButton);

    var variantList = document.createElement("div");
    variantList.style.marginTop = "10px";
    variantSection.appendChild(variantList);

    function refreshVariantSection() {
      variantSection.style.display = state.variantEnabled ? "block" : "none";
      variantToggle.checked = state.variantEnabled;
    }

    function renderVariantList() {
      variantList.innerHTML = "";

      if (state.variantItems.length == 0) {
        return;
      }

      state.variantItems.forEach(function (item) {
        var row = document.createElement("div");
        row.style.display = "flex";
        row.style.alignItems = "center";
        row.style.gap = "8px";
        row.style.marginTop = "8px";
        variantList.appendChild(row);

        var keyInput = document.createElement("input");
        keyInput.setAttribute("type", "text");
        keyInput.setAttribute(
          "placeholder",
          "变体值，如 standby / large / medium",
        );
        keyInput.style.width = "180px";
        keyInput.style.boxSizing = "border-box";
        keyInput.value = item.key;
        row.appendChild(keyInput);

        var uploadInput = document.createElement("input");
        uploadInput.setAttribute("type", "file");
        uploadInput.setAttribute("accept", ".svg,image/svg+xml");
        uploadInput.style.display = "none";
        row.appendChild(uploadInput);

        var uploadButton = deps.createButton("上传变体SVG", function () {
          uploadInput.click();
        });
        uploadButton.style.marginTop = "0";
        uploadButton.style.marginRight = "0";
        row.appendChild(uploadButton);

        var fileName = document.createElement("div");
        fileName.style.flex = "1 1 auto";
        fileName.style.color = Editor.isDarkMode() ? "#c0c4cc" : "#57606a";
        fileName.innerText = item.name || "未选择变体SVG";
        row.appendChild(fileName);

        var deleteButton = deps.createButton("删除", function () {
          state.variantItems = state.variantItems.filter(function (entry) {
            return entry.id != item.id;
          });

          if (state.previewVariantId == item.id) {
            state.previewVariantId = "";
            updateSelectedItem(null, null);
          }

          renderVariantList();

          if (deps.trim(state.uploadedPrimarySvg).length > 0) {
            parseEditorSpec();
          }

          deps.scheduleEditorDraftSave();
        });
        deleteButton.style.marginTop = "0";
        deleteButton.style.marginRight = "0";
        row.appendChild(deleteButton);

        mxEvent.addListener(keyInput, "change", function () {
          var nextKey = deps.trim(keyInput.value);

          if (hasVariantKey(nextKey, item.id)) {
            deps.showStatus("同一个变体值只能绑定一张SVG", true);
            keyInput.value = item.key;
            return;
          }

          item.key = nextKey;

          if (state.variantEnabled) {
            validateVariantField(true);
          }

          if (deps.trim(state.uploadedPrimarySvg).length > 0) {
            parseEditorSpec();
          }

          deps.scheduleEditorDraftSave();
        });

        bindSvgUpload(
          uploadInput,
          null,
          null,
          null,
          "变体SVG 已加载",
          false,
          function (svg, fileNameText) {
            item.svg = svg;
            item.name = fileNameText;
            fileName.innerText = item.name || "未选择变体SVG";
            deps.scheduleEditorDraftSave();
          },
        );
      });
    }

    state.schemaFields = deps.getDefaultSchemaFields();

    var schemaSection = document.createElement("div");
    schemaSection.style.marginTop = "10px";
    container.appendChild(schemaSection);

    var schemaHeader = document.createElement("div");
    schemaHeader.style.display = "flex";
    schemaHeader.style.alignItems = "center";
    schemaHeader.style.marginBottom = "8px";
    schemaSection.appendChild(schemaHeader);

    var schemaTitle = document.createElement("div");
    schemaTitle.style.fontWeight = "bold";
    schemaTitle.innerText = "属性字段配置";
    schemaHeader.appendChild(schemaTitle);

    var addFieldButton = deps.createButton("新增字段", function () {
      state.schemaFields.push(
        deps.normalizeSchemaField({
          path: "",
          type: "string",
          required: false,
          enumValues: [],
        }),
      );
      renderSchemaFields();
      deps.scheduleEditorDraftSave();
    });
    addFieldButton.style.marginTop = "0";
    addFieldButton.style.marginLeft = "12px";
    schemaHeader.appendChild(addFieldButton);

    var schemaList = document.createElement("div");
    schemaSection.appendChild(schemaList);

    function renderSchemaFields() {
      schemaList.innerHTML = "";
      var hasEnumField = state.schemaFields.some(function (field) {
        return deps.normalizeSchemaType(field.type) == "enum";
      });

      var header = document.createElement("div");
      header.style.display = "grid";
      header.style.gridTemplateColumns = hasEnumField
        ? "minmax(0, 1.6fr) 110px minmax(0, 1.2fr) 80px auto"
        : "minmax(0, 1.6fr) 110px 80px auto";
      header.style.gap = "8px";
      header.style.alignItems = "center";
      header.style.marginBottom = "6px";
      header.style.fontSize = "12px";
      header.style.color = Editor.isDarkMode() ? "#c0c4cc" : "#57606a";
      (hasEnumField
        ? ["字段路径", "类型", "枚举值", "必填", "操作"]
        : ["字段路径", "类型", "必填", "操作"]
      ).forEach(function (text) {
        var cell = document.createElement("div");
        cell.innerText = text;
        header.appendChild(cell);
      });
      schemaList.appendChild(header);

      state.schemaFields.forEach(function (field) {
        var row = document.createElement("div");
        row.style.display = "grid";
        row.style.gap = "8px";
        row.style.alignItems = "center";
        row.style.marginBottom = "8px";
        schemaList.appendChild(row);

        var pathInput = document.createElement("input");
        pathInput.setAttribute("type", "text");
        pathInput.setAttribute(
          "placeholder",
          "字段路径，如 name 或 device.mode",
        );
        pathInput.value = field.path;
        row.appendChild(pathInput);

        var typeSelect = document.createElement("select");
        ["string", "number", "boolean", "enum"].forEach(function (type) {
          var option = document.createElement("option");
          option.value = type;
          option.innerText = type;
          typeSelect.appendChild(option);
        });
        typeSelect.value = field.type;
        row.appendChild(typeSelect);

        var enumWrap = document.createElement("div");
        enumWrap.style.minWidth = "0";
        row.appendChild(enumWrap);

        var enumInput = document.createElement("input");
        enumInput.setAttribute("type", "text");
        enumInput.setAttribute("placeholder", "枚举值，逗号分隔");
        enumInput.value = (field.enumValues || []).join(", ");
        enumInput.style.width = "100%";
        enumInput.style.boxSizing = "border-box";
        enumWrap.appendChild(enumInput);

        var requiredWrap = document.createElement("label");
        requiredWrap.style.display = "flex";
        requiredWrap.style.alignItems = "center";
        requiredWrap.style.gap = "4px";
        var requiredInput = document.createElement("input");
        requiredInput.setAttribute("type", "checkbox");
        requiredInput.checked = !!field.required;
        requiredWrap.appendChild(requiredInput);
        var requiredText = document.createElement("span");
        requiredText.innerText = "必填";
        requiredWrap.appendChild(requiredText);
        row.appendChild(requiredWrap);

        var deleteFieldButton = deps.createButton("删除", function () {
          state.schemaFields = state.schemaFields.filter(function (entry) {
            return entry.id != field.id;
          });
          renderSchemaFields();
          updateVariantFieldState(false);
          deps.scheduleEditorDraftSave();
        });
        deleteFieldButton.style.marginTop = "0";
        deleteFieldButton.style.marginRight = "0";
        deleteFieldButton.style.padding = "4px 8px";
        deleteFieldButton.style.minWidth = "64px";
        deleteFieldButton.style.whiteSpace = "nowrap";
        row.appendChild(deleteFieldButton);

        function refreshRowLayout() {
          var enumVisible = deps.normalizeSchemaType(typeSelect.value) == "enum";
          row.style.gridTemplateColumns = enumVisible
            ? "minmax(0, 1.6fr) 110px minmax(0, 1.2fr) 80px auto"
            : "minmax(0, 1.6fr) 110px 80px auto";
          enumWrap.style.display = enumVisible ? "" : "none";
        }

        function syncField(showError) {
          field.path = deps.trim(pathInput.value);
          field.type = deps.normalizeSchemaType(typeSelect.value);
          field.required = requiredInput.checked;
          field.enumValues = deps.normalizeEnumOptions(enumInput.value);

          var valid =
            field.path.length > 0 &&
            deps.isValidFieldPath(field.path) &&
            state.schemaFields.filter(function (entry) {
              return deps.trim(entry.path) == field.path;
            }).length == 1 &&
            (field.type != "enum" || field.enumValues.length > 0);

          pathInput.style.borderColor = valid ? "" : "#b3261e";
          enumInput.style.borderColor =
            field.type != "enum" || field.enumValues.length > 0
              ? ""
              : "#b3261e";

          if (!valid && showError) {
            deps.showStatus("字段配置有误，请检查路径唯一性和枚举值", true);
          }

          updateVariantFieldState(false);
          deps.scheduleEditorDraftSave();
        }

        mxEvent.addListener(pathInput, "input", function () {
          syncField(false);
        });
        mxEvent.addListener(typeSelect, "change", function () {
          refreshRowLayout();
          syncField(false);
        });
        mxEvent.addListener(enumInput, "input", function () {
          syncField(false);
        });
        mxEvent.addListener(requiredInput, "change", function () {
          syncField(false);
        });
        refreshRowLayout();
      });
    }

    renderSchemaFields();

    function rebuildEditorUi(specOrNull) {
      renderSchemaFields();
      refreshVariantSection();
      renderVariantList();
      updateTemplateNameState(false);
      updateVariantFieldState(false);

      if (specOrNull != null) {
        updatePreview(specOrNull);
      } else {
        updatePreview(null);
      }
    }

    function recalcNextItemId() {
      var maxId = 0;

      function scanId(id) {
        var match = /:(\d+)$/.exec(deps.trim(id));

        if (match != null) {
          maxId = Math.max(maxId, parseInt(match[1], 10) || 0);
        }
      }

      function scanLayout(layout) {
        var i;
        var ports = deps.normalizePortLayout(layout != null ? layout.ports : []);
        var labels = deps.normalizeLabels(layout != null ? layout.labels : []);

        for (i = 0; i < ports.length; i++) {
          scanId(ports[i].id);
        }

        for (i = 0; i < labels.length; i++) {
          scanId(labels[i].id);
        }
      }

      scanLayout(state.currentSpec);

      (state.variantItems || []).forEach(function (item) {
        scanId(item.id);
        scanLayout(item);
      });

      state.nextId = maxId + 1;
    }

    function loadTemplateIntoEditor(template, options) {
      var spec = deps.normalizeSpec(deps.cloneJson(template));
      var layouts = deps.normalizeVariantLayouts(spec.variantLayouts);
      var keys = Object.keys(spec.svgVariants || {});

      options = options || {};
      state.symbolIdTouched = !options.allowAutoSymbolId;
      state.symbolIdInput.value =
        deps.trim(spec.symbolId).length > 0
          ? spec.symbolId
          : deps.generateSymbolId(
              spec.templateName || spec.title || "electrical-symbol",
            );
      state.templateNameInput.value =
        deps.trim(spec.templateName || spec.title) || "电气图元";
      state.uploadedPrimarySvg = spec.svg || "";
      state.uploadedPrimarySvgName =
        deps.trim(options.primarySvgName || "") ||
        (deps.trim(spec.templateName || spec.title).length > 0
          ? deps.trim(spec.templateName || spec.title) + ".svg"
          : "已加载默认SVG");
      state.uploadedPrimarySvgSize =
        spec.size != null
          ? deps.cloneJson(spec.size)
          : deps.extractSvgSize(spec.svg || "");

      if (state.templateWidthInput != null) {
        state.templateWidthInput.value = String(spec.size.width);
      }

      if (state.templateHeightInput != null) {
        state.templateHeightInput.value = String(spec.size.height);
      }

      primaryName.innerText =
        deps.trim(state.uploadedPrimarySvg).length > 0
          ? state.uploadedPrimarySvgName
          : "未选择默认SVG";
      state.schemaFields = deps.flattenSchemaFields(spec.schema, "", []).map(
        function (field) {
          return deps.normalizeSchemaField(field);
        },
      );

      if (state.schemaFields.length == 0) {
        state.schemaFields = deps.getDefaultSchemaFields();
      }

      state.variantEnabled =
        deps.trim(spec.variantField).length > 0 ||
        Object.keys(spec.svgVariants || {}).length > 0;
      state.variantFieldInput.value = deps.trim(spec.variantField);
      state.lastValidVariantField = deps.trim(spec.variantField);
      state.previewVariantId = "";
      state.selectedItem = null;
      state.currentSpec = spec;
      state.variantItems = keys.map(function (key) {
        var variantLayout = layouts[key] || {};

        return {
          id: deps.nextItemId("variant"),
          key,
          svg: spec.svgVariants[key],
          name: key + ".svg",
          ports: deps.normalizePortLayout(variantLayout.ports || []),
          labels: deps.normalizeLabels(variantLayout.labels || []),
        };
      });
      recalcNextItemId();
      rebuildEditorUi(spec);
      deps.scheduleEditorDraftSave();
    }

    function restoreDraftIfExists() {
      var draft = deps.loadEditorDraft();
      var draftSpec;

      if (draft == null) {
        return false;
      }

      try {
        state.symbolIdTouched = !!draft.symbolIdTouched;
        state.symbolIdInput.value =
          deps.trim(draft.symbolId).length > 0
            ? draft.symbolId
            : deps.generateSymbolId("electrical-symbol");
        state.templateNameInput.value =
          deps.trim(draft.templateName).length > 0
            ? draft.templateName
            : "电气图元";
        state.uploadedPrimarySvg = deps.trim(draft.uploadedPrimarySvg);
        state.uploadedPrimarySvgName = deps.trim(draft.uploadedPrimarySvgName);
        state.uploadedPrimarySvgSize = deps.isObject(draft.uploadedPrimarySvgSize)
          ? deps.cloneJson(draft.uploadedPrimarySvgSize)
          : null;

        if (state.templateWidthInput != null) {
          state.templateWidthInput.value =
            deps.trim(draft.templateWidth).length > 0
              ? deps.trim(draft.templateWidth)
              : String(
                  draft.currentSpec != null && draft.currentSpec.size != null
                    ? draft.currentSpec.size.width
                    : state.uploadedPrimarySvgSize != null
                      ? state.uploadedPrimarySvgSize.width
                      : 120,
                );
        }

        if (state.templateHeightInput != null) {
          state.templateHeightInput.value =
            deps.trim(draft.templateHeight).length > 0
              ? deps.trim(draft.templateHeight)
              : String(
                  draft.currentSpec != null && draft.currentSpec.size != null
                    ? draft.currentSpec.size.height
                    : state.uploadedPrimarySvgSize != null
                      ? state.uploadedPrimarySvgSize.height
                      : 80,
                );
        }

        primaryName.innerText =
          deps.trim(state.uploadedPrimarySvg).length > 0
            ? state.uploadedPrimarySvgName || "已加载默认SVG"
            : "未选择默认SVG";
        state.variantEnabled = !!draft.variantEnabled;
        state.variantFieldInput.value = deps.trim(draft.variantField);
        state.lastValidVariantField = deps.trim(draft.variantField);
        state.previewVariantId = deps.trim(draft.previewVariantId);
        state.schemaFields = Array.isArray(draft.schemaFields)
          ? draft.schemaFields.map(function (field) {
              return deps.normalizeSchemaField(field);
            })
          : deps.getDefaultSchemaFields();
        state.variantItems = Array.isArray(draft.variantItems)
          ? draft.variantItems.map(function (item) {
              return {
                id: deps.trim(item.id) || deps.nextItemId("variant"),
                key: deps.trim(item.key),
                svg: deps.trim(item.svg),
                name: deps.trim(item.name),
                ports: deps.normalizePortLayout(item.ports || []),
                labels: deps.normalizeLabels(item.labels || []),
              };
            })
          : [];
        draftSpec =
          draft.currentSpec != null &&
          deps.trim(draft.currentSpec.svg || draft.uploadedPrimarySvg).length >
            0
            ? deps.normalizeSpec(deps.cloneJson(draft.currentSpec))
            : null;
        state.currentSpec = draftSpec;
        recalcNextItemId();
        rebuildEditorUi(draftSpec);
        deps.showStatus("已恢复上次未保存的草稿", false);
        return true;
      } catch (e) {
        deps.clearEditorDraft();
        return false;
      }
    }

    state.preview = document.createElement("div");
    state.preview.style.marginTop = "10px";
    state.preview.style.height = "328px";
    state.preview.style.border = "1px solid #d0d7de";
    state.preview.style.display = "block";
    state.preview.style.boxSizing = "border-box";
    state.preview.style.overflow = "hidden";
    state.preview.style.background = Editor.isDarkMode() ? "#111111" : "#fafafa";
    container.appendChild(state.preview);

    var buttons = document.createElement("div");
    buttons.style.marginTop = "10px";
    container.appendChild(buttons);

    var previewButton = deps.createButton(
      mxResources.get("electricalPreview"),
      function () {
        parseEditorSpec();
      },
    );
    buttons.appendChild(previewButton);

    var addLibraryButton = deps.createButton(
      mxResources.get("electricalAddLibrary"),
      function () {
        deps.addToLibrary(parseEditorSpec(), function () {
          deps.clearEditorDraft();

          if (state.window != null && state.window.window != null) {
            state.window.window.destroy();
          }
        });
      },
    );
    buttons.appendChild(addLibraryButton);

    state.status = document.createElement("div");
    state.status.style.marginTop = "10px";
    state.status.style.minHeight = "18px";
    container.appendChild(state.status);

    function setButtonEnabled(button, enabled) {
      button.disabled = !enabled;
      button.style.opacity = enabled ? "1" : "0.45";
      button.style.pointerEvents = enabled ? "auto" : "none";
    }

    function updateTemplateNameState(showError) {
      var name = deps.trim(
        state.templateNameInput != null ? state.templateNameInput.value : "",
      );
      var symbolId = deps.trim(
        state.symbolIdInput != null ? state.symbolIdInput.value : "",
      );
      var valid = name.length > 0 && !deps.isTemplateNameTaken(name, symbolId);

      if (state.templateNameInput != null) {
        state.templateNameInput.style.borderColor = !valid ? "#b3261e" : "";
        state.templateNameInput.style.boxShadow = !valid
          ? "0 0 0 1px rgba(179,38,30,0.2)"
          : "";
        state.templateNameInput.title =
          name.length == 0
            ? "图元类型名称不能为空"
            : !valid
              ? "图元类型名称不能重复"
              : "";
      }

      setButtonEnabled(addLibraryButton, valid);

      if (!valid && showError) {
        deps.showStatus(
          name.length == 0 ? "请先填写图元类型名称" : "图元类型名称不能重复",
          true,
        );
      }

      return valid;
    }

    function updateVariantFieldState(showError) {
      var valid = true;

      if (state.variantEnabled) {
        valid = validateVariantField(showError) != null;
      }

      if (state.variantFieldInput != null) {
        state.variantFieldInput.style.borderColor = !valid ? "#b3261e" : "";
        state.variantFieldInput.style.boxShadow = !valid
          ? "0 0 0 1px rgba(179,38,30,0.2)"
          : "";
        state.variantFieldInput.title = !valid
          ? "变体字段必须先在 JSON 类型定义中声明"
          : "";
      }

      setButtonEnabled(addVariantButton, !state.variantEnabled || valid);
      setButtonEnabled(previewButton, !state.variantEnabled || valid);
      setButtonEnabled(
        addLibraryButton,
        (!state.variantEnabled || valid) && updateTemplateNameState(false),
      );

      return valid;
    }

    bindSvgUpload(
      primaryInput,
      primaryName,
      "uploadedPrimarySvg",
      "uploadedPrimarySvgName",
      "默认SVG 已加载",
      true,
      function () {
        state.previewVariantId = "";
        updateSelectedItem(null, null);

        if (
          state.templateWidthInput != null &&
          state.uploadedPrimarySvgSize != null
        ) {
          state.templateWidthInput.value = String(
            state.uploadedPrimarySvgSize.width,
          );
        }

        if (
          state.templateHeightInput != null &&
          state.uploadedPrimarySvgSize != null
        ) {
          state.templateHeightInput.value = String(
            state.uploadedPrimarySvgSize.height,
          );
        }
      },
    );

    mxEvent.addListener(primaryInput, "change", function () {
      if (state.symbolIdInput != null && !state.symbolIdTouched) {
        state.symbolIdInput.value = deps.generateSymbolId(
          state.uploadedPrimarySvgName || "electrical-symbol",
        );
        updateTemplateNameState(false);
      }
    });
    mxEvent.addListener(state.templateNameInput, "input", function () {
      updateTemplateNameState(false);
      deps.scheduleEditorDraftSave();
    });
    mxEvent.addListener(state.templateNameInput, "blur", function () {
      updateTemplateNameState(true);
    });
    mxEvent.addListener(state.templateWidthInput, "change", function () {
      if (deps.trim(state.uploadedPrimarySvg).length > 0) {
        try {
          parseEditorSpec();
        } catch (e) {}
      } else {
        deps.scheduleEditorDraftSave();
      }
    });
    mxEvent.addListener(state.templateHeightInput, "change", function () {
      if (deps.trim(state.uploadedPrimarySvg).length > 0) {
        try {
          parseEditorSpec();
        } catch (e) {}
      } else {
        deps.scheduleEditorDraftSave();
      }
    });
    mxEvent.addListener(state.variantFieldInput, "change", function () {
      var currentValue = deps.trim(state.variantFieldInput.value);

      if (state.variantEnabled) {
        if (!updateVariantFieldState(true)) {
          return;
        }

        state.lastValidVariantField = currentValue;
      }

      if (deps.trim(state.uploadedPrimarySvg).length > 0) {
        parseEditorSpec();
      }

      deps.scheduleEditorDraftSave();
    });
    mxEvent.addListener(state.variantFieldInput, "input", function () {
      updateVariantFieldState(false);
      deps.scheduleEditorDraftSave();
    });
    mxEvent.addListener(state.variantFieldInput, "blur", function () {
      updateVariantFieldState(true);
    });
    mxEvent.addListener(variantToggle, "change", function () {
      state.variantEnabled = variantToggle.checked;

      if (state.variantEnabled) {
        var validField = validateVariantField(false);

        if (validField != null) {
          state.lastValidVariantField = validField;
        }
      } else {
        state.previewVariantId = "";
        updateSelectedItem(null, null);
      }

      refreshVariantSection();
      updateVariantFieldState(false);
      deps.scheduleEditorDraftSave();

      if (deps.trim(state.uploadedPrimarySvg).length > 0) {
        try {
          parseEditorSpec();
        } catch (e) {
          // keep editor open even if variant field is incomplete
        }
      }
    });
    refreshVariantSection();
    renderVariantList();
    updateTemplateNameState(false);
    updateVariantFieldState(false);
    restoreDraftIfExists();

    var x = Math.max(20, (document.body.offsetWidth - 560) / 2);
    var y = 80;
    var wnd = new mxWindow(
      mxResources.get("electricalSymbols"),
      container,
      x,
      y,
      560,
      620,
      true,
      true,
    );
    wnd.destroyOnClose = true;
    wnd.setClosable(true);
    wnd.setMaximizable(false);
    wnd.setResizable(true);
    wnd.setScrollable(true);
    wnd.addListener(mxEvent.DESTROY, function () {
      state.window = null;
      state.status = null;
      state.symbolIdInput = null;
      state.templateNameInput = null;
      state.templateWidthInput = null;
      state.templateHeightInput = null;
      state.variantFieldInput = null;
      state.schemaFields = [];
      state.preview = null;
      state.variantEnabled = false;
      state.lastValidVariantField = "";
      state.previewVariantId = "";
      state.variantItems = [];
      state.currentSpec = null;
      deps.clearDraftSaveTimer();
    });

    if (state.currentSpec == null) {
      updatePreview(null);
    }

    deps.loadStoredLibrary(null, true);

    return {
      window: wnd,
      container,
      loadTemplate: function (template) {
        loadTemplateIntoEditor(template);
      },
    };
  }

  function toggleWindow() {
    if (state.window == null) {
      state.window = createWindow();
      state.window.window.setVisible(true);
    } else {
      state.window.window.setVisible(!state.window.window.isVisible());
    }
  }

  function openEditorWithTemplate(template) {
    if (state.window == null) {
      state.window = createWindow();
    }

    state.window.window.setVisible(true);

    if (typeof state.window.loadTemplate === "function") {
      state.window.loadTemplate(template);
    }

    if (typeof state.window.window.toFront === "function") {
      state.window.window.toFront();
    }
  }

  return {
    createWindow,
    deleteSelectedItem,
    openEditorWithTemplate,
    toggleWindow,
    updatePreview,
    updateSelectedItem,
  };
}
