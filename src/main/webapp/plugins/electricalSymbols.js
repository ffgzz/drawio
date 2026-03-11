Draw.loadPlugin(function (ui) {
  // 当前 draw.io 编辑器里的核心图对象
  var graph = ui.editor.graph;
  // graph 底层的数据模型
  var model = graph.getModel();
  // 统一定义插件里会用到的节点标签和类型，避免字符串散落在各处
  var LIBRARY_TITLE = "电气图元库";
  var ROOT_TAG = "ElectricalSymbol";
  var BODY_TAG = "ElectricalBody";
  var LABEL_TAG = "ElectricalLabel";
  var BADGE_TAG = "ElectricalBadge";
  var ROOT_TYPE = "electricalSymbol";
  var BODY_KIND = "body";
  var LABEL_KIND = "label";
  var BADGE_KIND = "badge";
  // 保存插件窗口和运行期缓存
  var state = {
    libraryImages: [],
    updatingModel: false,
    window: null,
    status: null,
    jsonArea: null,
    preview: null,
    widthInput: null,
    heightInput: null,
    currentSpec: null,
    previewMode: "select",
    selectedItem: null,
    nextId: 1,
  };

  mxResources.parse(
    [
      "electricalSymbols=电气图元...",
      "electricalRefresh=刷新电气图元",
      "electricalPreview=刷新预览",
      "electricalInsert=插入图元",
      "electricalAddLibrary=加入库",
      "electricalExportLibrary=导出库",
    ].join("\n"),
  );

  // 把任意输入安全转成去首尾空格的字符串
  function trim(value) {
    return value != null ? mxUtils.trim(String(value)) : "";
  }

  // 判断值是否为普通对象，用来保护 JSON 结构解析
  function isObject(value) {
    return value != null && typeof value === "object" && !Array.isArray(value);
  }

  // 把数值限制在给定区间内
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  // 把输入转成整数，失败时回退到默认值
  function toInt(value, defaultValue) {
    var parsed = parseInt(value, 10);

    return isNaN(parsed) ? defaultValue : parsed;
  }

  // 把输入转成浮点数，失败时回退到默认值
  function toFloat(value, defaultValue) {
    var parsed = parseFloat(value);

    return isNaN(parsed) ? defaultValue : parsed;
  }

  // 深拷贝 JSON 兼容数据，避免后续修改原对象
  function cloneJson(value) {
    return JSON.parse(JSON.stringify(value));
  }

  // 创建一个新的 XML 元素节点，作为 mxCell.value 使用
  function createNode(tagName) {
    return mxUtils.createXmlDocument().createElement(tagName);
  }

  // 克隆已有的 value 节点；如果没有，就创建一个新的根节点
  function cloneValue(node) {
    if (node != null && node.nodeType == mxConstants.NODETYPE_ELEMENT) {
      return node.cloneNode(true);
    }

    return createNode(ROOT_TAG);
  }

  // 读取 mxCell.value XML 上的属性，屏蔽空值和非元素节点情况
  function getAttr(cell, name) {
    return cell != null &&
      cell.value != null &&
      cell.value.nodeType == mxConstants.NODETYPE_ELEMENT
      ? cell.value.getAttribute(name)
      : null;
  }

  // 判断一个 cell 是否是电气图元根节点
  function isElectricalRoot(cell) {
    return getAttr(cell, "pluginType") == ROOT_TYPE;
  }

  // 从任意子节点向上查找所属的电气图元根节点
  function findElectricalRoot(cell) {
    while (cell != null) {
      if (isElectricalRoot(cell)) {
        return cell;
      }

      cell = model.getParent(cell);
    }

    return null;
  }

  // 校验传入的 svg 文本是否合法，并返回规范化后的根节点 XML
  function validateSvg(svg) {
    var text = trim(svg);

    if (text.length == 0) {
      throw new Error("缺少 svg 字段");
    }

    var doc = mxUtils.parseXml(text);
    var root = doc.documentElement;

    if (root == null || root.nodeName.toLowerCase() != "svg") {
      throw new Error("svg 内容必须包含根节点 <svg>");
    }

    return mxUtils.getXml(root);
  }

  function normalizeMode(mode) {
    mode = trim(mode).toLowerCase();

    return mode == "primary" || mode == "standby" ? mode : "";
  }

  function normalizeLabelAlign(align) {
    align = trim(align).toLowerCase();

    return align == "left" || align == "right" ? align : "center";
  }

  // 把外部 JSON 规范化成统一的数据结构
  // 这里会做默认值填充、字段裁剪和 svg 校验
  function normalizeSpec(raw) {
    if (!isObject(raw)) {
      throw new Error("JSON 根节点必须是对象");
    }

    var device = isObject(raw.device) ? raw.device : {};
    var ports = raw.ports;
    var variants = isObject(raw.svgVariants) ? raw.svgVariants : {};
    var size = isObject(raw.size) ? raw.size : {};
    var params = isObject(device.params) ? cloneJson(device.params) : {};
    var spec = {
      symbolId: trim(raw.symbolId) || "symbol-" + Date.now(),
      title: trim(raw.title) || trim(device.name) || "电气图元",
      svg: validateSvg(raw.svg),
      size: {
        width: Math.max(20, toInt(size.width, 120)),
        height: Math.max(20, toInt(size.height, 80)),
      },
      device: {
        name: trim(device.name),
        code: trim(device.code),
        power: trim(device.power),
        mode: normalizeMode(device.mode),
        params: params,
      },
      ports: normalizePortLayout(ports),
      labels: normalizeLabels(raw.labels),
      svgVariants: {},
    };

    if (variants.primary != null && trim(variants.primary).length > 0) {
      spec.svgVariants.primary = validateSvg(variants.primary);
    }

    if (variants.standby != null && trim(variants.standby).length > 0) {
      spec.svgVariants.standby = validateSvg(variants.standby);
    }

    return spec;
  }

  // 根据 mode 和 svgVariants 选出当前真正要渲染的 svg
  function getActiveSvg(spec) {
    if (
      spec.device.mode.length > 0 &&
      spec.svgVariants[spec.device.mode] != null
    ) {
      return spec.svgVariants[spec.device.mode];
    }

    return spec.svg;
  }

  // 生成预览区使用的 svg data uri
  function toSvgDataUri(spec) {
    return Graph.clipSvgDataUri(Editor.createSvgDataUri(getActiveSvg(spec)));
  }

  // 生成写入 mxCell.style 的 image data uri
  function toStyleImageUri(spec) {
    return "data:image/svg+xml," + encodeURIComponent(getActiveSvg(spec));
  }

  // 统一更新弹窗底部状态栏颜色和文案
  function showStatus(message, isError) {
    if (state.status != null) {
      state.status.style.color = isError ? "#b3261e" : "#2e7d32";
      state.status.innerText = message || "";
    }
  }

  // 从弹窗编辑区读取并合成当前 spec，同时把宽高输入覆盖回 spec.size
  function getSpecFromEditor() {
    var raw = JSON.parse(state.jsonArea.value);
    var spec = normalizeSpec(raw);
    spec.size.width = Math.max(
      20,
      toInt(state.widthInput.value, spec.size.width),
    );
    spec.size.height = Math.max(
      20,
      toInt(state.heightInput.value, spec.size.height),
    );

    return spec;
  }

  function nextItemId(prefix) {
    var id = prefix + ":" + state.nextId;
    state.nextId += 1;
    return id;
  }

  function findPort(spec, id) {
    var i;

    for (i = 0; i < spec.ports.length; i++) {
      if (spec.ports[i].id == id) {
        return spec.ports[i];
      }
    }

    return null;
  }

  function findLabel(spec, id) {
    var i;

    for (i = 0; i < spec.labels.length; i++) {
      if (spec.labels[i].id == id) {
        return spec.labels[i];
      }
    }

    return null;
  }

  function syncEditorJson(spec) {
    if (state.jsonArea != null) {
      state.jsonArea.value = JSON.stringify(spec, null, 2);
    }
  }

  function getPreviewMetrics(spec, surface) {
    var surfaceWidth = Math.max(200, surface.clientWidth || 520);
    var surfaceHeight = Math.max(200, surface.clientHeight || 260);
    var padding = 52;
    var scale = Math.min(
      (surfaceWidth - padding * 2) / spec.size.width,
      (surfaceHeight - padding * 2) / spec.size.height,
    );

    scale = clamp(scale, 0.35, 2.5);

    var width = spec.size.width * scale;
    var height = spec.size.height * scale;

    return {
      left: Math.round((surfaceWidth - width) / 2),
      top: Math.round((surfaceHeight - height) / 2),
      width: width,
      height: height,
      scale: scale,
    };
  }

  function getRelativePoint(evt, surface, metrics, clampToBody) {
    var rect = surface.getBoundingClientRect();
    var x = (evt.clientX - rect.left - metrics.left) / metrics.width;
    var y = (evt.clientY - rect.top - metrics.top) / metrics.height;

    return {
      x: clampToBody ? clamp(x, 0, 1) : clamp(x, -1.5, 2.5),
      y: clampToBody ? clamp(y, 0, 1) : clamp(y, -1.5, 2.5),
    };
  }

  function updateSelectedItem(type, id) {
    state.selectedItem =
      type != null && id != null ? { type: type, id: id } : null;
  }

  function deleteSelectedItem() {
    if (state.currentSpec == null || state.selectedItem == null) {
      return;
    }

    var next = cloneJson(state.currentSpec);

    if (state.selectedItem.type == "port") {
      next.ports = next.ports.filter(function (item) {
        return item.id != state.selectedItem.id;
      });
    } else if (state.selectedItem.type == "label") {
      next.labels = next.labels.filter(function (item) {
        return item.id != state.selectedItem.id;
      });
    }

    state.currentSpec = normalizeSpec(next);
    updateSelectedItem(null, null);
    syncEditorJson(state.currentSpec);
    updatePreview(state.currentSpec);
  }

  // 预览区是一个轻量交互编辑面板。
  // 用户可以直接在这里添加/拖动连接点和文本框，修改会实时写回 JSON。
  function updatePreview(spec) {
    state.currentSpec = normalizeSpec(spec);
    state.preview.innerHTML = "";
    var selectedId = state.selectedItem != null ? state.selectedItem.id : null;
    var selectedType =
      state.selectedItem != null ? state.selectedItem.type : null;

    if (
      (selectedType == "port" &&
        findPort(state.currentSpec, selectedId) == null) ||
      (selectedType == "label" &&
        findLabel(state.currentSpec, selectedId) == null)
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
      var btn = createButton(label, function () {
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
    var deleteBtn = createButton("删除选中", function () {
      deleteSelectedItem();
    });
    deleteBtn.style.marginTop = "0";
    deleteBtn.style.marginRight = "0";
    deleteBtn.style.padding = "4px 10px";
    toolbar.appendChild(deleteBtn);

    var hint = document.createElement("div");
    hint.style.marginLeft = "auto";
    hint.style.fontSize = "12px";
    hint.style.color = Editor.isDarkMode() ? "#c0c4cc" : "#57606a";
    hint.innerText =
      state.previewMode == "port"
        ? "点击图元添加连接点，拖动可微调"
        : state.previewMode == "label"
          ? "点击空白处添加文本框，双击可编辑文本"
          : "拖动连接点或文本框调整位置";
    toolbar.appendChild(hint);

    var surface = document.createElement("div");
    surface.style.position = "relative";
    surface.style.height = "278px";
    surface.style.overflow = "hidden";
    surface.style.cursor =
      state.previewMode == "port" || state.previewMode == "label"
        ? "crosshair"
        : "default";
    surface.style.background = Editor.isDarkMode()
      ? "linear-gradient(180deg, #111111, #171717)"
      : "linear-gradient(180deg, #fafafa, #f3f4f6)";
    state.preview.appendChild(surface);

    var metrics = getPreviewMetrics(state.currentSpec, surface);
    var img = document.createElement("img");
    img.setAttribute("alt", state.currentSpec.title);
    img.setAttribute("src", toSvgDataUri(state.currentSpec));
    img.style.position = "absolute";
    img.style.left = metrics.left + "px";
    img.style.top = metrics.top + "px";
    img.style.width = metrics.width + "px";
    img.style.height = metrics.height + "px";
    img.style.objectFit = "fill";
    img.style.pointerEvents = "none";
    surface.appendChild(img);

    function startDrag(type, id, target) {
      return function (evt) {
        evt.preventDefault();
        evt.stopPropagation();
        updateSelectedItem(type, id);

        function moveHandler(moveEvt) {
          var point = getRelativePoint(
            moveEvt,
            surface,
            metrics,
            type == "port",
          );
          var current = state.currentSpec;

          if (type == "port") {
            var port = findPort(current, id);
            if (port != null) {
              port.x = point.x;
              port.y = point.y;
              target.style.left =
                metrics.left + port.x * metrics.width - 7 + "px";
              target.style.top =
                metrics.top + port.y * metrics.height - 7 + "px";
            }
          } else {
            var label = findLabel(current, id);
            if (label != null) {
              label.x = point.x;
              label.y = point.y;
              target.style.left =
                metrics.left + label.x * metrics.width - label.width / 2 + "px";
              target.style.top =
                metrics.top +
                label.y * metrics.height -
                label.height / 2 +
                "px";
            }
          }
        }

        function upHandler() {
          document.removeEventListener("mousemove", moveHandler);
          document.removeEventListener("mouseup", upHandler);
          syncEditorJson(state.currentSpec);
          updatePreview(state.currentSpec);
        }

        document.addEventListener("mousemove", moveHandler);
        document.addEventListener("mouseup", upHandler);
      };
    }

    function renderPort(point) {
      var handle = document.createElement("div");
      handle.style.position = "absolute";
      handle.style.left = metrics.left + point.x * metrics.width - 7 + "px";
      handle.style.top = metrics.top + point.y * metrics.height - 7 + "px";
      handle.style.width = "14px";
      handle.style.height = "14px";
      handle.style.lineHeight = "14px";
      handle.style.textAlign = "center";
      handle.style.color = "#1a73e8";
      handle.style.fontSize = "16px";
      handle.style.fontWeight = "700";
      handle.style.cursor = "move";
      handle.style.userSelect = "none";
      handle.style.zIndex = "2";
      handle.innerText = "×";
      handle.title = point.id;
      if (
        state.selectedItem != null &&
        state.selectedItem.type == "port" &&
        state.selectedItem.id == point.id
      ) {
        handle.style.textShadow = "0 0 6px rgba(26,115,232,0.45)";
      }
      mxEvent.addListener(
        handle,
        "mousedown",
        startDrag("port", point.id, handle),
      );
      mxEvent.addListener(handle, "click", function (evt) {
        evt.stopPropagation();
        updateSelectedItem("port", point.id);
        updatePreview(state.currentSpec);
      });
      surface.appendChild(handle);
    }

    function renderLabel(label) {
      var box = document.createElement("div");
      box.style.position = "absolute";
      box.style.left =
        metrics.left + label.x * metrics.width - label.width / 2 + "px";
      box.style.top =
        metrics.top + label.y * metrics.height - label.height / 2 + "px";
      box.style.width = label.width + "px";
      box.style.minHeight = label.height + "px";
      box.style.padding = "2px 6px";
      box.style.boxSizing = "border-box";
      box.style.background = Editor.isDarkMode() ? "#1f1f1f" : "#ffffff";
      box.style.border =
        state.selectedItem != null &&
        state.selectedItem.type == "label" &&
        state.selectedItem.id == label.id
          ? "2px solid #1a73e8"
          : "1px dashed #9aa4b2";
      box.style.borderRadius = "4px";
      box.style.fontSize = "12px";
      box.style.lineHeight = "20px";
      box.style.textAlign = label.align;
      box.style.cursor = "move";
      box.style.userSelect = "none";
      box.style.zIndex = "2";
      box.innerText = label.text;
      mxEvent.addListener(box, "mousedown", startDrag("label", label.id, box));
      mxEvent.addListener(box, "click", function (evt) {
        evt.stopPropagation();
        updateSelectedItem("label", label.id);
        updatePreview(state.currentSpec);
      });
      mxEvent.addListener(box, "dblclick", function (evt) {
        evt.stopPropagation();
        var nextText = window.prompt("输入文本框内容", label.text);
        if (nextText == null) {
          return;
        }
        label.text = trim(nextText) || label.text;
        syncEditorJson(state.currentSpec);
        updateSelectedItem("label", label.id);
        updatePreview(state.currentSpec);
      });
      surface.appendChild(box);
    }

    for (var i = 0; i < state.currentSpec.ports.length; i++) {
      renderPort(state.currentSpec.ports[i]);
    }

    for (var j = 0; j < state.currentSpec.labels.length; j++) {
      renderLabel(state.currentSpec.labels[j]);
    }

    mxEvent.addListener(surface, "click", function (evt) {
      if (evt.target !== surface) {
        return;
      }

      var point = getRelativePoint(
        evt,
        surface,
        metrics,
        state.previewMode == "port",
      );

      if (state.previewMode == "port") {
        state.currentSpec.ports.push({
          id: nextItemId("port"),
          x: point.x,
          y: point.y,
        });
        syncEditorJson(state.currentSpec);
        updateSelectedItem(
          "port",
          state.currentSpec.ports[state.currentSpec.ports.length - 1].id,
        );
        updatePreview(state.currentSpec);
      } else if (state.previewMode == "label") {
        var text = window.prompt("输入文本框内容", "文本");
        var labelId = nextItemId("label");

        if (text == null) {
          return;
        }

        state.currentSpec.labels.push(
          normalizeLabelItem(
            {
              id: labelId,
              text: trim(text) || "文本",
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
        syncEditorJson(state.currentSpec);
        updateSelectedItem(
          "label",
          state.currentSpec.labels[state.currentSpec.labels.length - 1].id,
        );
        updatePreview(state.currentSpec);
      } else {
        updateSelectedItem(null, null);
        updatePreview(state.currentSpec);
      }
    });
  }

  // 根节点只作为透明容器和连接点宿主
  function makeRootStyle() {
    return (
      "fillColor=none;strokeColor=none;html=1;whiteSpace=wrap;" +
      "connectable=1;container=1;collapsible=0;foldable=0;recursiveResize=0;rotatable=0;"
    );
  }

  // 主图元本体作为 root 的背景子节点存在。
  function makeBodyStyle(spec) {
    return (
      "shape=image;image=" +
      toStyleImageUri(spec) +
      ";imageAspect=0;aspect=fixed;html=1;strokeColor=none;fillColor=none;" +
      "part=1;connectable=0;editable=0;movable=0;resizable=0;rotatable=0;" +
      "cloneable=0;deletable=0;pointerEvents=0;"
    );
  }

  // 创建文本子节点的统一样式。
  function makeLabelStyle(align) {
    return (
      "text;part=1;html=1;whiteSpace=wrap;strokeColor=none;fillColor=none;" +
      "align=" +
      align +
      ";verticalAlign=middle;spacing=2;rotatable=0;connectable=0;"
    );
  }

  // 创建主/备徽标的统一样式，颜色随模式变化。
  function makeBadgeStyle(mode) {
    var fillColor = mode == "standby" ? "#ffe9d6" : "#e6f4ea";
    var strokeColor = mode == "standby" ? "#b06000" : "#1e8e3e";

    return (
      "rounded=1;arcSize=18;part=1;html=1;whiteSpace=wrap;align=center;" +
      "verticalAlign=middle;fontStyle=1;strokeColor=" +
      strokeColor +
      ";fillColor=" +
      fillColor +
      ";connectable=0;rotatable=0;"
    );
  }

  function defaultPortPosition(index, count) {
    return count <= 0 ? 0.5 : (index + 1) / (count + 1);
  }

  // 规范化单个端口点位，最终格式为 {id, x, y}，x/y 都在 0..1。
  function normalizePortPoint(raw, fallbackId, fallbackX, fallbackY) {
    var id = fallbackId;
    var x = fallbackX;
    var y = fallbackY;

    if (isObject(raw)) {
      id = trim(raw.id || raw.key || raw.name) || fallbackId;
      x = toFloat(raw.x, fallbackX);
      y = toFloat(raw.y, fallbackY);
    } else if (typeof raw == "number") {
      y = raw;
    }

    return {
      id: id,
      x: clamp(x, 0, 1),
      y: clamp(y, 0, 1),
    };
  }

  // 规范化单个文本框定义，位置使用相对坐标，可落在图元外部。
  function normalizeLabelItem(raw, fallbackId, fallbackText) {
    var text = fallbackText;
    var id = fallbackId;
    var x = 0.5;
    var y = -0.18;
    var width = 120;
    var height = 26;
    var align = "center";

    if (isObject(raw)) {
      text = trim(raw.text || raw.label) || fallbackText;
      id = trim(raw.id || raw.key || raw.name) || fallbackId;
      x = toFloat(raw.x, x);
      y = toFloat(raw.y, y);
      width = Math.max(40, toInt(raw.width, width));
      height = Math.max(20, toInt(raw.height, height));
      align = normalizeLabelAlign(raw.align);
    } else {
      text = trim(raw) || fallbackText;
    }

    return {
      id: id,
      text: text,
      x: clamp(x, -1.5, 2.5),
      y: clamp(y, -1.5, 2.5),
      width: width,
      height: height,
      align: align,
    };
  }

  // 统一把 ports 解析成端口点位数组。
  // 新格式：
  // ports: [{ id: "p1", x: 0, y: 0.3 }, ...]
  // 兼容格式：
  // ports: { items: [...] } / ports: { left: [0.3], right: [0.7] } / ports: { leftCount, rightCount }。
  function normalizePortLayout(rawPorts) {
    var points = [];
    var i;

    if (Array.isArray(rawPorts)) {
      for (i = 0; i < rawPorts.length; i++) {
        points.push(
          normalizePortPoint(
            rawPorts[i],
            "port:" + i,
            0.5,
            (i + 1) / (rawPorts.length + 1),
          ),
        );
      }
      return points;
    }

    if (!isObject(rawPorts)) {
      return points;
    }

    if (Array.isArray(rawPorts.items)) {
      for (i = 0; i < rawPorts.items.length; i++) {
        points.push(
          normalizePortPoint(
            rawPorts.items[i],
            "port:" + i,
            0.5,
            (i + 1) / (rawPorts.items.length + 1),
          ),
        );
      }
      return points;
    }

    if (Array.isArray(rawPorts.left) || Array.isArray(rawPorts.right)) {
      var left = Array.isArray(rawPorts.left) ? rawPorts.left : [];
      var right = Array.isArray(rawPorts.right) ? rawPorts.right : [];

      for (i = 0; i < left.length; i++) {
        points.push(
          normalizePortPoint(
            { id: "left:" + i, x: 0, y: left[i] },
            "left:" + i,
            0,
            defaultPortPosition(i, left.length),
          ),
        );
      }

      for (i = 0; i < right.length; i++) {
        points.push(
          normalizePortPoint(
            { id: "right:" + i, x: 1, y: right[i] },
            "right:" + i,
            1,
            defaultPortPosition(i, right.length),
          ),
        );
      }

      return points;
    }

    // 兼容旧格式：按数量自动生成左右默认位置
    var leftCount = Math.max(0, toInt(rawPorts.leftCount, 0));
    var rightCount = Math.max(0, toInt(rawPorts.rightCount, 0));

    for (i = 0; i < leftCount; i++) {
      points.push({
        id: "left:" + i,
        x: 0,
        y: defaultPortPosition(i, leftCount),
      });
    }

    for (i = 0; i < rightCount; i++) {
      points.push({
        id: "right:" + i,
        x: 1,
        y: defaultPortPosition(i, rightCount),
      });
    }

    return points;
  }

  function normalizeLabels(rawLabels) {
    var labels = [];
    var i;

    if (!Array.isArray(rawLabels)) {
      return labels;
    }

    for (i = 0; i < rawLabels.length; i++) {
      labels.push(
        normalizeLabelItem(rawLabels[i], "label:" + i, "文本" + (i + 1)),
      );
    }

    return labels;
  }

  // 从根节点属性读取端口点位数组。
  function parsePortLayout(raw) {
    if (raw == null || raw.length == 0) {
      return [];
    }

    try {
      return normalizePortLayout(JSON.parse(raw));
    } catch (e) {
      return [];
    }
  }

  // 根据 spec 以及历史布局，生成当前图元应使用的端口点位。
  // spec.ports 有值时优先使用；为空时回退到 base。
  function buildPortLayout(spec, base) {
    var current = normalizePortLayout(spec.ports);
    var fallback = normalizePortLayout(base);

    return current.length > 0 ? current : fallback;
  }

  // 把端口点位数组序列化回根节点属性，便于保存和刷新时复用。
  function serializePortLayout(layout) {
    return JSON.stringify(normalizePortLayout(layout));
  }

  // 所有业务属性都挂在根节点 value 上，便于 Edit Data 后再执行“刷新电气图元”。
  function applyValueMetadata(node, spec, layout) {
    node.setAttribute("pluginType", ROOT_TYPE);
    node.setAttribute("symbolId", spec.symbolId);
    node.setAttribute("title", spec.title);
    node.setAttribute("label", "");
    node.setAttribute("deviceName", spec.device.name);
    node.setAttribute("deviceCode", spec.device.code);
    node.setAttribute("devicePower", spec.device.power);
    node.setAttribute("mode", spec.device.mode);
    node.setAttribute("paramsJson", JSON.stringify(spec.device.params || {}));
    node.setAttribute("portsJson", serializePortLayout(layout));
    node.setAttribute("portLayout", serializePortLayout(layout));
    node.setAttribute(
      "labelsJson",
      JSON.stringify(normalizeLabels(spec.labels)),
    );
    node.setAttribute("symbolPayload", JSON.stringify(spec));

    return node;
  }

  // 统一创建子节点 value。子节点本身都是 mxCell，
  function createMetaCell(tagName, kind, key, label) {
    var value = createNode(tagName);
    value.setAttribute("esKind", kind);
    value.setAttribute("esKey", key);
    value.setAttribute("label", label || "");

    return value;
  }

  // 背景图元是 root 的第一个子节点，采用相对定位，保证整体插入/拖动时能和 root 一起移动。
  function createBodyCell(spec) {
    var geometry = new mxGeometry(0, 0, spec.size.width, spec.size.height);
    geometry.relative = true;
    geometry.offset = new mxPoint(0, 0);
    var cell = new mxCell(
      createMetaCell(BODY_TAG, BODY_KIND, "main", ""),
      geometry,
      makeBodyStyle(spec),
    );
    cell.vertex = true;
    cell.setConnectable(false);

    return cell;
  }

  function applyBodyCell(cell, spec) {
    var geometry = model.getGeometry(cell);

    if (geometry == null) {
      geometry = new mxGeometry();
    } else {
      geometry = geometry.clone();
    }

    geometry.x = 0;
    geometry.y = 0;
    geometry.width = spec.size.width;
    geometry.height = spec.size.height;
    geometry.relative = true;
    geometry.offset = new mxPoint(0, 0);
    model.setGeometry(cell, geometry);

    var value = cloneValue(cell.value);
    value.setAttribute("esKind", BODY_KIND);
    value.setAttribute("esKey", "main");
    value.setAttribute("label", "");
    model.setValue(cell, value);
    model.setStyle(cell, makeBodyStyle(spec));
    cell.setConnectable(false);
  }

  // 文本框和主/备标记都实现为 root 的相对子节点。
  function createLabelCell(label) {
    var geometry = new mxGeometry(label.x, label.y, label.width, label.height);
    geometry.relative = true;
    geometry.offset = new mxPoint(-label.width / 2, -label.height / 2);
    var cell = new mxCell(
      createMetaCell(LABEL_TAG, LABEL_KIND, label.id, label.text),
      geometry,
      makeLabelStyle(label.align),
    );
    cell.vertex = true;
    cell.setConnectable(false);

    return cell;
  }

  function applyLabelCell(cell, label) {
    var geometry = model.getGeometry(cell);

    if (geometry == null) {
      geometry = new mxGeometry();
    } else {
      geometry = geometry.clone();
    }

    geometry.x = label.x;
    geometry.y = label.y;
    geometry.width = label.width;
    geometry.height = label.height;
    geometry.relative = true;
    geometry.offset = new mxPoint(-label.width / 2, -label.height / 2);
    model.setGeometry(cell, geometry);

    var value = cloneValue(cell.value);
    value.setAttribute("esKind", LABEL_KIND);
    value.setAttribute("esKey", label.id);
    value.setAttribute("label", label.text);
    model.setValue(cell, value);
    model.setStyle(cell, makeLabelStyle(label.align));
    cell.setConnectable(false);
  }

  // 创建“主/备”徽标子节点。
  function createBadgeCell(mode) {
    var text = mode == "standby" ? "\u5907" : "\u4e3b";
    var geometry = new mxGeometry(1, 0, 24, 18);
    geometry.relative = true;
    geometry.offset = new mxPoint(-32, 8);
    var cell = new mxCell(
      createMetaCell(BADGE_TAG, BADGE_KIND, "mode", text),
      geometry,
      makeBadgeStyle(mode),
    );
    cell.vertex = true;
    cell.setConnectable(false);

    return cell;
  }

  // 更新已有主/备徽标子节点的几何、文案和样式。
  function applyBadgeCell(cell, mode) {
    var geometry = model.getGeometry(cell);

    if (geometry == null) {
      geometry = new mxGeometry();
    } else {
      geometry = geometry.clone();
    }

    geometry.x = 1;
    geometry.y = 0;
    geometry.width = 24;
    geometry.height = 18;
    geometry.relative = true;
    geometry.offset = new mxPoint(-32, 8);
    model.setGeometry(cell, geometry);

    var value = cloneValue(cell.value);
    value.setAttribute("esKind", BADGE_KIND);
    value.setAttribute("esKey", "mode");
    value.setAttribute("label", mode == "standby" ? "\u5907" : "\u4e3b");
    model.setValue(cell, value);
    model.setStyle(cell, makeBadgeStyle(mode));
    cell.setConnectable(false);
  }

  // 把 root 当前已有子节点按 kind/key 建索引，后续同步逻辑依赖它做“增量对账”。
  function mapChildren(root) {
    var children = {
      body: {},
      label: {},
      badge: {},
    };

    for (var i = 0; i < model.getChildCount(root); i++) {
      var child = model.getChildAt(root, i);
      var kind = getAttr(child, "esKind");
      var key = getAttr(child, "esKey");

      if (kind != null && key != null && children[kind] != null) {
        children[kind][key] = child;
      }
    }

    return children;
  }

  // 删除当前不再需要保留的子节点
  function removeUnused(map, keep) {
    for (var key in map) {
      if (map.hasOwnProperty(key) && keep[key] == null) {
        model.remove(map[key]);
      }
    }
  }

  // addChild 同时兼容两种场景：
  // 1. 复合图元还没插入画布时，直接用 root.insert 组装对象树；
  // 2. 图元已在模型里时，必须走 model.add，才能触发视图刷新。
  function addChild(root, child) {
    var index = arguments.length > 2 ? arguments[2] : null;

    if (root.parent != null) {
      model.add(root, child, index);
    } else {
      root.insert(child, index);
    }
  }

  // 保证根节点几何和 spec.size 一致。
  function ensureRootGeometry(root, spec) {
    var geometry = model.getGeometry(root);

    if (geometry == null) {
      geometry = new mxGeometry(0, 0, spec.size.width, spec.size.height);
    } else {
      geometry = geometry.clone();
      geometry.width = spec.size.width;
      geometry.height = spec.size.height;
    }

    if (root.parent != null) {
      model.setGeometry(root, geometry);
    } else {
      root.geometry = geometry;
    }
  }

  // root 自身不显示文字，只保存业务数据和 connection constraints 所需信息。
  function ensureRootValue(root, spec, layout) {
    var value = applyValueMetadata(cloneValue(root.value), spec, layout);

    if (root.parent != null) {
      model.setValue(root, value);
      model.setStyle(root, makeRootStyle());
    } else {
      root.value = value;
      root.style = makeRootStyle();
      root.setConnectable(false);
    }
  }

  // 同步函数：
  // 根据 spec 把 root 调整为“背景图 + 文本 + 徽标 + 元数据”一致状态。
  function syncRoot(root, spec, baseLayout) {
    var layout = buildPortLayout(spec, baseLayout);
    ensureRootGeometry(root, spec);
    ensureRootValue(root, spec, layout);
    var mapped = mapChildren(root);
    var keepBodies = {};
    var keepLabels = {};
    var keepBadges = {};
    var child;
    var i;

    child = mapped.body.main;

    if (child != null) {
      applyBodyCell(child, spec);
    } else {
      addChild(root, createBodyCell(spec), 0);
    }

    keepBodies.main = true;

    for (i = 0; i < spec.labels.length; i++) {
      var label = spec.labels[i];
      child = mapped.label[label.id];

      if (child != null) {
        applyLabelCell(child, label);
      } else {
        addChild(root, createLabelCell(label));
      }

      keepLabels[label.id] = true;
    }

    if (
      spec.device.mode.length > 0 &&
      spec.svgVariants[spec.device.mode] == null
    ) {
      child = mapped.badge.mode;

      if (child != null) {
        applyBadgeCell(child, spec.device.mode);
      } else {
        addChild(root, createBadgeCell(spec.device.mode));
      }

      keepBadges.mode = true;
    }

    if (root.parent != null) {
      removeUnused(mapped.body, keepBodies);
      removeUnused(mapped.label, keepLabels);
      removeUnused(mapped.badge, keepBadges);
    }

    root.setConnectable(true);
    return root;
  }

  // 新建一个完整电气图元时，从 root 开始组装整棵子树。
  function buildSymbolCell(spec) {
    var root = new mxCell(
      createNode(ROOT_TAG),
      new mxGeometry(0, 0, spec.size.width, spec.size.height),
      "",
    );
    root.vertex = true;
    root.setConnectable(true);

    return syncRoot(root, spec, null);
  }

  // 从图元根节点反向提取 spec，以便 Edit Data 后重新刷新图元时使用。
  function extractSpec(root) {
    var raw = getAttr(root, "symbolPayload");

    if (raw == null || raw.length == 0) {
      throw new Error("缺少 symbolPayload 数据");
    }

    var spec = JSON.parse(raw);

    if (!isObject(spec.device)) {
      spec.device = {};
    }

    spec.ports = normalizePortLayout(spec.ports);
    spec.labels = normalizeLabels(spec.labels);

    spec.symbolId = trim(getAttr(root, "symbolId")) || spec.symbolId;
    spec.title = trim(getAttr(root, "title")) || spec.title;
    spec.device.name =
      trim(getAttr(root, "deviceName")) || trim(spec.device.name);
    spec.device.code =
      trim(getAttr(root, "deviceCode")) || trim(spec.device.code);
    spec.device.power =
      trim(getAttr(root, "devicePower")) || trim(spec.device.power);
    spec.device.mode = normalizeMode(getAttr(root, "mode") || spec.device.mode);

    var portsRaw = getAttr(root, "portsJson");

    if (portsRaw == null || portsRaw.length == 0) {
      portsRaw = getAttr(root, "portLayout");
    }

    if (portsRaw != null && portsRaw.length > 0) {
      spec.ports = parsePortLayout(portsRaw);
    }

    var labelsRaw = getAttr(root, "labelsJson");

    if (labelsRaw != null && labelsRaw.length > 0) {
      try {
        spec.labels = normalizeLabels(JSON.parse(labelsRaw));
      } catch (e) {
        // ignore malformed labels override
      }
    }

    var paramsJson = getAttr(root, "paramsJson");

    if (paramsJson != null && paramsJson.length > 0) {
      try {
        spec.device.params = JSON.parse(paramsJson);
      } catch (e) {
        // ignore malformed params override
      }
    }

    var geo = model.getGeometry(root);

    if (geo != null) {
      spec.size = {
        width: Math.max(20, Math.round(geo.width)),
        height: Math.max(20, Math.round(geo.height)),
      };
    }

    return normalizeSpec(spec);
  }

  // “刷新电气图元”的底层实现：读取当前 root 状态并重新同步整棵结构
  function refreshRoot(root) {
    var spec = extractSpec(root);
    var portLayout = parsePortLayout(getAttr(root, "portLayout"));
    syncRoot(root, spec, portLayout);
    return spec;
  }

  // 监听模型变化，目前只处理图元尺寸变化。
  // 当用户直接拖拽改变根图元宽高时，需要重算背景和文本默认布局。
  function handleModelChange(sender, evt) {
    if (state.updatingModel) {
      return;
    }

    var changes = evt.getProperty("edit").changes;
    var resizeRoots = {};

    for (var i = 0; i < changes.length; i++) {
      var change = changes[i];

      if (change.constructor == mxGeometryChange && change.cell != null) {
        if (isElectricalRoot(change.cell)) {
          var previous = change.previous;
          var geometry = model.getGeometry(change.cell);

          if (
            previous != null &&
            geometry != null &&
            (previous.width != geometry.width ||
              previous.height != geometry.height)
          ) {
            resizeRoots[change.cell.id] = change.cell;
          }
        }
      }
    }

    var hasResize = false;

    for (var key in resizeRoots) {
      if (resizeRoots.hasOwnProperty(key)) {
        hasResize = true;
        break;
      }
    }

    if (!hasResize) {
      return;
    }

    state.updatingModel = true;
    model.beginUpdate();

    try {
      for (var id in resizeRoots) {
        if (resizeRoots.hasOwnProperty(id)) {
          refreshRoot(resizeRoots[id]);
        }
      }
    } finally {
      model.endUpdate();
      state.updatingModel = false;
    }
  }

  // 根据根节点元数据动态生成左右两侧的连接点。
  function getElectricalConstraints(cell) {
    var root = findElectricalRoot(cell);

    if (root == null) {
      return null;
    }

    var layout = buildPortLayout(
      { ports: parsePortLayout(getAttr(root, "portsJson")) },
      parsePortLayout(getAttr(root, "portLayout")),
    );
    var constraints = [];
    var i;

    for (i = 0; i < layout.length; i++) {
      var point = layout[i];
      constraints.push(
        new mxConnectionConstraint(
          new mxPoint(point.x, point.y),
          false,
          point.id || "port:" + i,
        ),
      );
    }

    return constraints;
  }

  var oldGetAllConnectionConstraints = graph.getAllConnectionConstraints;

  // 用 mxConnectionConstraint 动态生成 draw.io 原生连接点。
  // 只拦截电气图元，其他普通图元仍走 draw.io 原生连接点逻辑。
  graph.getAllConnectionConstraints = function (terminal, source) {
    var root = findElectricalRoot(terminal != null ? terminal.cell : null);

    if (root != null) {
      return getElectricalConstraints(root);
    }

    return oldGetAllConnectionConstraints.apply(this, arguments);
  };

  function createLibraryEntry(spec) {
    var root = buildSymbolCell(spec);
    var bounds = graph.getBoundingBoxFromGeometry([root]);

    if (bounds != null) {
      root.geometry = root.geometry.clone();
      root.geometry.x = -bounds.x;
      root.geometry.y = -bounds.y;
    }

    var xml = mxUtils.getXml(graph.encodeCells([root]));

    if (Editor.defaultCompressed) {
      xml = Graph.compress(xml);
    }

    return {
      xml: xml,
      w: bounds != null ? Math.round(bounds.width) : spec.size.width,
      h: bounds != null ? Math.round(bounds.height) : spec.size.height,
      title: spec.title,
    };
  }

  // 从本地存储读取“电气图元库”，并在需要时同步打开到左侧 Sidebar。
  function loadStoredLibrary(callback, openInSidebar) {
    StorageFile.getFileContent(
      ui,
      LIBRARY_TITLE,
      function (data) {
        var images = [];

        if (data != null && data.length > 0) {
          try {
            var doc = mxUtils.parseXml(data);

            if (
              doc.documentElement != null &&
              doc.documentElement.nodeName == "mxlibrary"
            ) {
              images = JSON.parse(mxUtils.getTextContent(doc.documentElement));
            }
          } catch (e) {
            images = [];
          }
        }

        state.libraryImages = images;

        if (openInSidebar && data != null && data.length > 0) {
          ui.libraryLoaded(
            new StorageLibrary(ui, data, LIBRARY_TITLE),
            images,
            LIBRARY_TITLE,
            true,
          );
        }

        if (callback != null) {
          callback(images);
        }
      },
      function () {
        state.libraryImages = [];

        if (callback != null) {
          callback([]);
        }
      },
    );
  }

  // 保存图库后，立即通知 Sidebar 重新加载，保证左侧马上可见
  function saveLibraryImages(images, callback) {
    var xml = ui.createLibraryDataFromImages(images);
    var file = new StorageLibrary(ui, xml, LIBRARY_TITLE);
    ui.libraryLoaded(file, images, LIBRARY_TITLE, true);
    file.save(
      false,
      function () {
        state.libraryImages = images;

        if (callback != null) {
          callback(file, images, xml);
        }
      },
      function (err) {
        ui.handleError(err || { message: "保存电气图库失败" });
      },
    );
  }

  // 把当前 spec 转成一个新的图库条目并追加到电气图库
  function addToLibrary(spec) {
    loadStoredLibrary(function (images) {
      var next = images.slice();
      next.push(createLibraryEntry(spec));
      saveLibraryImages(next, function () {
        showStatus("已加入图库", false);
      });
    });
  }

  // 导出 .drawiolib
  function exportLibrary() {
    loadStoredLibrary(function (images) {
      if (images.length == 0) {
        showStatus("电气图库为空", true);
        return;
      }

      var xml = ui.createLibraryDataFromImages(images);
      ui.saveLocalFile(
        xml,
        "electrical-symbols.drawiolib",
        "text/xml",
        null,
        null,
        true,
        null,
        "drawiolib",
      );
      showStatus("已开始导出图库", false);
    });
  }

  // 插入画布时只需要导入 root，子节点会随 root 一起进入图模型。
  function insertIntoGraph(spec) {
    var root = buildSymbolCell(spec);
    var pt = graph.getFreeInsertPoint();
    graph.setSelectionCells(graph.importCells([root], pt.x, pt.y));
    graph.scrollCellToVisible(graph.getSelectionCell());
    showStatus("已插入图元", false);
  }

  // 菜单里的“刷新电气图元”动作
  // 手工 Edit Data 后，让图形外观重新和元数据对齐
  function refreshSelection() {
    var root = findElectricalRoot(graph.getSelectionCell());

    if (root == null) {
      showStatus("请先选择一个电气图元", true);
      return;
    }

    state.updatingModel = true;
    model.beginUpdate();

    try {
      refreshRoot(root);
    } catch (e) {
      showStatus(e.message || String(e), true);
      return;
    } finally {
      model.endUpdate();
      state.updatingModel = false;
    }

    showStatus("电气图元已刷新", false);
  }

  // 从编辑器文本框读取 JSON，校验通过后同时刷新预览和状态栏
  function parseEditorSpec() {
    try {
      var spec = getSpecFromEditor();
      state.currentSpec = spec;
      syncEditorJson(spec);
      updatePreview(spec);
      showStatus("预览已刷新", false);
      return spec;
    } catch (e) {
      showStatus(e.message || String(e), true);
      throw e;
    }
  }

  // 文件导入
  function loadJsonText(text) {
    var spec = normalizeSpec(JSON.parse(text));
    state.currentSpec = spec;
    state.jsonArea.value = JSON.stringify(spec, null, 2);
    state.widthInput.value = spec.size.width;
    state.heightInput.value = spec.size.height;
    updatePreview(spec);
    showStatus("JSON 已加载", false);
  }

  // 统一生成插件窗口里的按钮样式和点击行为。
  function createButton(label, fn) {
    var button = mxUtils.button(label, fn);
    button.className = "geBtn";
    button.style.marginRight = "8px";
    button.style.marginTop = "8px";
    return button;
  }

  // 插件窗口是一个轻量 mxWindow
  // 把“JSON 输入、预览、插入、入库、导出、刷新”几个核心操作集中在一个面板里。
  function createWindow() {
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
    title.innerText = "电气图元 JSON";
    container.appendChild(title);

    var topRow = document.createElement("div");
    topRow.style.display = "flex";
    topRow.style.alignItems = "center";
    container.appendChild(topRow);

    var fileInput = document.createElement("input");
    fileInput.setAttribute("type", "file");
    fileInput.setAttribute("accept", ".json,application/json");
    fileInput.style.marginRight = "8px";
    topRow.appendChild(fileInput);

    state.widthInput = document.createElement("input");
    state.widthInput.setAttribute("type", "number");
    state.widthInput.setAttribute("min", "20");
    state.widthInput.style.width = "80px";
    state.widthInput.style.marginRight = "8px";
    state.widthInput.value = "120";
    topRow.appendChild(state.widthInput);

    var widthLabel = document.createElement("span");
    widthLabel.innerText = "宽";
    topRow.insertBefore(widthLabel, state.widthInput);

    state.heightInput = document.createElement("input");
    state.heightInput.setAttribute("type", "number");
    state.heightInput.setAttribute("min", "20");
    state.heightInput.style.width = "80px";
    state.heightInput.style.marginRight = "8px";
    state.heightInput.value = "80";
    topRow.appendChild(state.heightInput);

    var heightLabel = document.createElement("span");
    heightLabel.innerText = "高";
    topRow.insertBefore(heightLabel, state.heightInput);

    state.jsonArea = document.createElement("textarea");
    state.jsonArea.spellcheck = false;
    state.jsonArea.style.width = "100%";
    state.jsonArea.style.height = "220px";
    state.jsonArea.style.marginTop = "10px";
    state.jsonArea.style.boxSizing = "border-box";
    state.jsonArea.value = JSON.stringify(
      {
        symbolId: "motor-starter",
        title: "\u7535\u673a\u542f\u52a8\u5668",
        svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80"><rect x="10" y="10" width="100" height="60" rx="8" ry="8" fill="#fff2e8" stroke="#c96a28" stroke-width="4"/><circle cx="60" cy="40" r="16" fill="#fffdfb" stroke="#c96a28" stroke-width="3"/></svg>',
        size: { width: 120, height: 80 },
        device: {
          name: "\u8bbe\u5907\u540d",
          code: "M-01",
          power: "15kW",
          mode: "primary",
          params: { "\u5176\u4ed6\u53c2\u6570": "\u793a\u4f8b" },
        },
        labels: [],
        svgVariants: {},
      },
      null,
      2,
    );
    container.appendChild(state.jsonArea);

    state.preview = document.createElement("div");
    state.preview.style.marginTop = "10px";
    state.preview.style.height = "328px";
    state.preview.style.border = "1px solid #d0d7de";
    state.preview.style.display = "block";
    state.preview.style.boxSizing = "border-box";
    state.preview.style.overflow = "hidden";
    state.preview.style.background = Editor.isDarkMode()
      ? "#111111"
      : "#fafafa";
    container.appendChild(state.preview);

    var buttons = document.createElement("div");
    buttons.style.marginTop = "10px";
    container.appendChild(buttons);

    buttons.appendChild(
      createButton(mxResources.get("electricalPreview"), function () {
        parseEditorSpec();
      }),
    );

    buttons.appendChild(
      createButton(mxResources.get("electricalInsert"), function () {
        insertIntoGraph(parseEditorSpec());
      }),
    );

    buttons.appendChild(
      createButton(mxResources.get("electricalAddLibrary"), function () {
        addToLibrary(parseEditorSpec());
      }),
    );

    buttons.appendChild(
      createButton(mxResources.get("electricalExportLibrary"), function () {
        exportLibrary();
      }),
    );

    buttons.appendChild(
      createButton(mxResources.get("electricalRefresh"), function () {
        refreshSelection();
      }),
    );

    state.status = document.createElement("div");
    state.status.style.marginTop = "10px";
    state.status.style.minHeight = "18px";
    container.appendChild(state.status);

    mxEvent.addListener(fileInput, "change", function () {
      if (fileInput.files == null || fileInput.files.length == 0) {
        return;
      }

      var reader = new FileReader();
      reader.onload = function () {
        try {
          loadJsonText(reader.result);
        } catch (e) {
          showStatus(e.message || String(e), true);
        }
      };
      reader.readAsText(fileInput.files[0], "utf-8");
    });

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
    wnd.destroyOnClose = false;
    wnd.setClosable(true);
    wnd.setMaximizable(false);
    wnd.setResizable(true);
    wnd.setScrollable(true);
    parseEditorSpec();
    loadStoredLibrary(null, true);

    return { window: wnd, container: container };
  }

  // 菜单项再次点击时直接复用已有窗口实例，避免重复创建事件和 DOM
  function toggleWindow() {
    if (state.window == null) {
      state.window = createWindow();
      state.window.window.setVisible(true);
    } else {
      state.window.window.setVisible(!state.window.window.isVisible());
    }
  }

  ui.actions.addAction("electricalSymbols", function () {
    toggleWindow();
  });

  ui.actions.addAction("electricalRefresh", function () {
    refreshSelection();
  });

  var menu = ui.menus.get("extras");
  var oldExtrasMenu = menu.funct;

  menu.funct = function (menu, parent) {
    oldExtrasMenu.apply(this, arguments);
    ui.menus.addMenuItems(
      menu,
      ["-", "electricalSymbols", "electricalRefresh"],
      parent,
    );
  };

  model.addListener(mxEvent.CHANGE, handleModelChange);
});
