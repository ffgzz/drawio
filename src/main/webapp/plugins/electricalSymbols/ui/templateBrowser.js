export function openTemplateBrowserDialog(deps) {
  var ctx = deps.ctx;
  var state = ctx.state;

  if (state.templatesWindow != null) {
    state.templatesWindow.setVisible(!state.templatesWindow.isVisible());
    return;
  }

  deps.library.loadStoredLibrary(function (images) {
    var templates = [];
    var i;

    for (i = 0; i < images.length; i++) {
      try {
        templates.push(deps.getLibraryEntrySpec(images[i]));
      } catch (e) {
        // ignore malformed entry
      }
    }

    if (templates.length == 0) {
      deps.showStatus("电气图库为空，请先保存图元类型", true);
      return;
    }

    var div = document.createElement("div");
    div.style.padding = "12px";
    div.style.width = "100%";
    div.style.height = "100%";
    div.style.boxSizing = "border-box";
    div.style.display = "flex";
    div.style.flexDirection = "column";
    div.style.background = Editor.isDarkMode() ? "#1e1e1e" : "#ffffff";

    var title = document.createElement("div");
    title.style.fontWeight = "bold";
    title.style.marginBottom = "10px";
    title.innerText = "已定义图元";
    div.appendChild(title);

    var list = document.createElement("div");
    list.style.flex = "1 1 auto";
    list.style.overflow = "auto";
    list.style.display = "grid";
    list.style.gridTemplateColumns = "repeat(auto-fill, minmax(220px, 1fr))";
    list.style.gap = "12px";
    list.style.alignContent = "start";
    div.appendChild(list);

    function renderTemplateCardPreview(container, template) {
      container.innerHTML = "";
      container.style.position = "relative";
      container.style.overflow = "hidden";
      var ports = deps.normalizePortLayout(template.ports);
      var labels = deps.normalizeLabels(template.labels);
      var bounds = {
        minX: 0,
        minY: 0,
        maxX: template.size.width,
        maxY: template.size.height,
      };

      ports.forEach(function (point) {
        var x = point.x * template.size.width;
        var y = point.y * template.size.height;
        bounds.minX = Math.min(bounds.minX, x - 10);
        bounds.minY = Math.min(bounds.minY, y - 10);
        bounds.maxX = Math.max(bounds.maxX, x + 10);
        bounds.maxY = Math.max(bounds.maxY, y + 10);
      });

      labels.forEach(function (label) {
        var x = label.x * template.size.width;
        var y = label.y * template.size.height;
        bounds.minX = Math.min(bounds.minX, x - label.width / 2);
        bounds.minY = Math.min(bounds.minY, y - label.height / 2);
        bounds.maxX = Math.max(bounds.maxX, x + label.width / 2);
        bounds.maxY = Math.max(bounds.maxY, y + label.height / 2);
      });

      var contentWidth = Math.max(1, bounds.maxX - bounds.minX);
      var contentHeight = Math.max(1, bounds.maxY - bounds.minY);
      var rect = container.getBoundingClientRect();
      var surfaceWidth = Math.max(200, Math.round(rect.width) || 0);
      var surfaceHeight = Math.max(160, Math.round(rect.height) || 0);
      var padding = 18;
      var scale = Math.min(
        (surfaceWidth - padding * 2) / contentWidth,
        (surfaceHeight - padding * 2) / contentHeight,
      );

      scale = Math.max(0.05, scale);
      var left = Math.round(
        (surfaceWidth - contentWidth * scale) / 2 - bounds.minX * scale,
      );
      var top = Math.round(
        (surfaceHeight - contentHeight * scale) / 2 - bounds.minY * scale,
      );

      var img = document.createElement("img");
      img.setAttribute(
        "src",
        "data:image/svg+xml," + encodeURIComponent(template.svg),
      );
      img.setAttribute("alt", template.title);
      img.style.position = "absolute";
      img.style.left = left + "px";
      img.style.top = top + "px";
      img.style.width = Math.round(template.size.width * scale) + "px";
      img.style.height = Math.round(template.size.height * scale) + "px";
      img.style.objectFit = "fill";
      container.appendChild(img);

      ports.forEach(function (point) {
        var handle = document.createElement("div");
        handle.style.position = "absolute";
        handle.style.left =
          Math.round(left + point.x * template.size.width * scale - 7) + "px";
        handle.style.top =
          Math.round(top + point.y * template.size.height * scale - 7) + "px";
        handle.style.width = "14px";
        handle.style.height = "14px";
        handle.style.lineHeight = "14px";
        handle.style.textAlign = "center";
        handle.style.color = "#1a73e8";
        handle.style.fontSize = point.marker == "circle" ? "12px" : "16px";
        handle.style.fontWeight = "700";
        handle.style.userSelect = "none";
        handle.style.opacity = point.marker == "hidden" ? "0.35" : "1";
        handle.innerText =
          point.marker == "circle"
            ? "●"
            : point.marker == "hidden"
              ? ""
              : "×";
        container.appendChild(handle);
      });

      labels.forEach(function (label) {
        var box = document.createElement("div");
        box.style.position = "absolute";
        box.style.left =
          Math.round(
            left +
              label.x * template.size.width * scale -
              (label.width * scale) / 2,
          ) + "px";
        box.style.top =
          Math.round(
            top +
              label.y * template.size.height * scale -
              (label.height * scale) / 2,
          ) + "px";
        box.style.width = Math.max(36, Math.round(label.width * scale)) + "px";
        box.style.minHeight =
          Math.max(20, Math.round(label.height * scale)) + "px";
        box.style.padding = "1px 4px";
        box.style.boxSizing = "border-box";
        box.style.background = Editor.isDarkMode() ? "#1f1f1f" : "#ffffff";
        box.style.border = "1px dashed #9aa4b2";
        box.style.borderRadius = "4px";
        box.style.fontSize = Math.max(10, Math.round(12 * scale)) + "px";
        box.style.lineHeight = Math.max(14, Math.round(18 * scale)) + "px";
        box.style.textAlign = label.align;
        box.style.userSelect = "none";
        box.innerText =
          deps.trim(label.binding).length > 0
            ? "{{" + label.binding + "}}"
            : label.text || "";
        container.appendChild(box);
      });
    }

    templates.forEach(function (template) {
      var card = document.createElement("div");
      card.style.border = "1px solid #d0d7de";
      card.style.borderRadius = "8px";
      card.style.padding = "10px";
      card.style.background = Editor.isDarkMode() ? "#161616" : "#ffffff";
      card.style.display = "flex";
      card.style.flexDirection = "column";
      card.style.gap = "8px";
      card.style.alignSelf = "start";
      list.appendChild(card);

      var preview = document.createElement("div");
      preview.style.height = "220px";
      preview.style.border = "1px solid #e5e7eb";
      preview.style.borderRadius = "6px";
      preview.style.background = Editor.isDarkMode() ? "#111111" : "#f8fafc";
      card.appendChild(preview);
      renderTemplateCardPreview(preview, template);
      window.setTimeout(function () {
        renderTemplateCardPreview(preview, template);
      }, 0);

      var actions = document.createElement("div");
      actions.style.display = "flex";
      actions.style.justifyContent = "flex-start";
      actions.style.flexWrap = "wrap";
      card.appendChild(actions);

      var editBtn = deps.createButton("编辑模板", function () {
        if (state.templatesWindow != null) {
          state.templatesWindow.destroy();
        }

        deps.openEditorWithTemplate(template);
      });
      editBtn.style.marginTop = "0";
      actions.appendChild(editBtn);

      var createBtn = deps.createButton("创建实例", function () {
        if (state.templatesWindow != null) {
          state.templatesWindow.destroy();
        }
        deps.openCreateFromLibraryDialog(template.symbolId);
      });
      createBtn.style.marginTop = "0";
      actions.appendChild(createBtn);

      var deleteBtn = deps.createButton("删除模板", function () {
        if (
          !mxUtils.confirm(
            "确定删除图元模板“" +
              (template.templateName || template.title || template.symbolId) +
              "”吗？",
          )
        ) {
          return;
        }

        deps.library.removeTemplateFromLibrary(template.symbolId, function (
          nextImages,
        ) {
          if (state.templatesWindow != null) {
            state.templatesWindow.destroy();
          }

          if (nextImages != null && nextImages.length > 0) {
            openTemplateBrowserDialog(deps);
          }
        });
      });
      deleteBtn.style.marginTop = "0";
      actions.appendChild(deleteBtn);
    });

    var wnd = new mxWindow("已定义图元", div, 160, 120, 760, 560, true, true);
    wnd.destroyOnClose = true;
    wnd.setClosable(true);
    wnd.setMaximizable(false);
    wnd.setResizable(true);
    wnd.setScrollable(true);
    wnd.setVisible(true);
    wnd.addListener(mxEvent.DESTROY, function () {
      state.templatesWindow = null;
    });
    state.templatesWindow = wnd;
  });
}
