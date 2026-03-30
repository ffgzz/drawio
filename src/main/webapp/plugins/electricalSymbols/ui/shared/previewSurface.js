function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function findPreviewItemById(list, id) {
  var i;

  for (i = 0; Array.isArray(list) && i < list.length; i++) {
    if (list[i].id == id) {
      return list[i];
    }
  }

  return null;
}

export function getPreviewMetrics(spec, surface) {
  var surfaceWidth = Math.max(200, surface.clientWidth || 520);
  var surfaceHeight = Math.max(200, surface.clientHeight || 260);
  var padding = 52;
  var scale = Math.min(
    (surfaceWidth - padding * 2) / spec.size.width,
    (surfaceHeight - padding * 2) / spec.size.height,
  );
  var width;
  var height;

  scale = clamp(scale, 0.35, 2.5);
  width = spec.size.width * scale;
  height = spec.size.height * scale;

  return {
    left: Math.round((surfaceWidth - width) / 2),
    top: Math.round((surfaceHeight - height) / 2),
    width: width,
    height: height,
    scale: scale,
  };
}

export function getRelativePoint(evt, surface, metrics, clampToBody) {
  var rect = surface.getBoundingClientRect();
  var x = (evt.clientX - rect.left - metrics.left) / metrics.width;
  var y = (evt.clientY - rect.top - metrics.top) / metrics.height;

  return {
    x: clampToBody ? clamp(x, 0, 1) : clamp(x, -1.5, 2.5),
    y: clampToBody ? clamp(y, 0, 1) : clamp(y, -1.5, 2.5),
  };
}

export function snapPortPointToEdge(point, metrics, thresholdPx) {
  var thresholdX;
  var thresholdY;
  var distances = [];
  var snapped;

  thresholdPx = Math.max(0, thresholdPx == null ? 12 : thresholdPx);
  thresholdX = thresholdPx / Math.max(1, metrics.width);
  thresholdY = thresholdPx / Math.max(1, metrics.height);

  if (point.x <= thresholdX) {
    distances.push({ edge: "left", distance: point.x });
  }

  if (1 - point.x <= thresholdX) {
    distances.push({ edge: "right", distance: 1 - point.x });
  }

  if (point.y <= thresholdY) {
    distances.push({ edge: "top", distance: point.y });
  }

  if (1 - point.y <= thresholdY) {
    distances.push({ edge: "bottom", distance: 1 - point.y });
  }

  if (distances.length == 0) {
    return point;
  }

  distances.sort(function (a, b) {
    return a.distance - b.distance;
  });

  snapped = {
    x: point.x,
    y: point.y,
  };

  if (distances[0].edge == "left") {
    snapped.x = 0;
  } else if (distances[0].edge == "right") {
    snapped.x = 1;
  } else if (distances[0].edge == "top") {
    snapped.y = 0;
  } else if (distances[0].edge == "bottom") {
    snapped.y = 1;
  }

  return snapped;
}

function positionPortTarget(target, metrics, point) {
  target.style.left = metrics.left + point.x * metrics.width - 7 + "px";
  target.style.top = metrics.top + point.y * metrics.height - 7 + "px";
}

function positionLabelTarget(target, metrics, label) {
  target.style.left =
    metrics.left + label.x * metrics.width - label.width / 2 + "px";
  target.style.top =
    metrics.top + label.y * metrics.height - label.height / 2 + "px";
}

export function renderInteractivePreviewSurface(deps, options) {
  var resolvePreviewMetrics =
    deps != null && typeof deps.getPreviewMetrics === "function"
      ? deps.getPreviewMetrics
      : getPreviewMetrics;
  var resolveRelativePoint =
    deps != null && typeof deps.getRelativePoint === "function"
      ? deps.getRelativePoint
      : getRelativePoint;
  var surface = document.createElement("div");
  surface.style.position = "relative";
  surface.style.height = String(options.height || 278) + "px";
  surface.style.overflow = "hidden";
  surface.style.cursor =
    options.mode == "port" || options.mode == "label"
      ? "crosshair"
      : "default";
  surface.style.background =
    options.background ||
    (Editor.isDarkMode()
      ? "linear-gradient(180deg, #111111, #171717)"
      : "linear-gradient(180deg, #fafafa, #f3f4f6)");
  options.container.appendChild(surface);

  var metrics = resolvePreviewMetrics(options.spec, surface);
  var img = document.createElement("img");
  img.setAttribute("alt", options.title || "");
  img.setAttribute("src", options.svgDataUri || "");
  img.style.position = "absolute";
  img.style.left = metrics.left + "px";
  img.style.top = metrics.top + "px";
  img.style.width = metrics.width + "px";
  img.style.height = metrics.height + "px";
  img.style.objectFit = "fill";
  img.style.pointerEvents = "none";
  surface.appendChild(img);

  function getPort(id) {
    return typeof options.getPortById === "function"
      ? options.getPortById(id)
      : findPreviewItemById(options.ports, id);
  }

  function getLabel(id) {
    return typeof options.getLabelById === "function"
      ? options.getLabelById(id)
      : findPreviewItemById(options.labels, id);
  }

  function requestRender() {
    if (typeof options.onRequestRender === "function") {
      options.onRequestRender();
    }
  }

  function isSelected(type, id) {
    return (
      options.selectedItem != null &&
      options.selectedItem.type == type &&
      options.selectedItem.id == id
    );
  }

  function startDrag(type, id, target) {
    return function (evt) {
      evt.preventDefault();
      evt.stopPropagation();

      if (typeof options.onSelect === "function") {
        options.onSelect(type, id);
      }

      function moveHandler(moveEvt) {
        var point = resolveRelativePoint(
          moveEvt,
          surface,
          metrics,
          type == "port",
        );
        var item;

        if (typeof options.onDragMove === "function") {
          options.onDragMove(type, id, point, metrics, target);
        }

        item = type == "port" ? getPort(id) : getLabel(id);

        if (item == null) {
          return;
        }

        if (type == "port") {
          positionPortTarget(target, metrics, item);
        } else {
          positionLabelTarget(target, metrics, item);
        }
      }

      function upHandler() {
        document.removeEventListener("mousemove", moveHandler);
        document.removeEventListener("mouseup", upHandler);

        if (typeof options.onDragEnd === "function") {
          options.onDragEnd(type, id, metrics, target);
        }

        requestRender();
      }

      document.addEventListener("mousemove", moveHandler);
      document.addEventListener("mouseup", upHandler);
    };
  }

  (options.ports || []).forEach(function (point, index) {
    var handle = document.createElement("div");
    handle.style.position = "absolute";
    handle.style.width = "14px";
    handle.style.height = "14px";
    handle.style.lineHeight = "14px";
    handle.style.textAlign = "center";
    handle.style.color = "#1a73e8";
    handle.style.fontSize = point.marker == "circle" ? "12px" : "16px";
    handle.style.fontWeight = "700";
    handle.style.cursor = "move";
    handle.style.userSelect = "none";
    handle.style.zIndex = "2";
    handle.style.opacity = point.marker == "hidden" ? "0.35" : "1";
    handle.innerText =
      point.marker == "circle" ? "●" : point.marker == "hidden" ? "" : "×";
    handle.title =
      typeof options.buildPortTitle === "function"
        ? options.buildPortTitle(point, index)
        : point.id || "";

    if (isSelected("port", point.id)) {
      handle.style.textShadow = "0 0 6px rgba(26,115,232,0.45)";
    }

    positionPortTarget(handle, metrics, point);
    mxEvent.addListener(
      handle,
      "mousedown",
      startDrag("port", point.id, handle),
    );
    mxEvent.addListener(handle, "click", function (evt) {
      evt.stopPropagation();

      if (typeof options.onSelect === "function") {
        options.onSelect("port", point.id);
      }

      requestRender();
    });
    surface.appendChild(handle);
  });

  (options.labels || []).forEach(function (label) {
    var box = document.createElement("div");
    box.style.position = "absolute";
    box.style.width = label.width + "px";
    box.style.minHeight = label.height + "px";
    box.style.padding = "2px 6px";
    box.style.boxSizing = "border-box";
    box.style.background = Editor.isDarkMode() ? "#1f1f1f" : "#ffffff";
    box.style.border = isSelected("label", label.id)
      ? "2px solid #1a73e8"
      : "1px dashed #9aa4b2";
    box.style.borderRadius = "4px";
    box.style.fontSize = "12px";
    box.style.lineHeight = "20px";
    box.style.textAlign = label.align;
    box.style.cursor = "move";
    box.style.userSelect = "none";
    box.style.zIndex = "2";
    box.innerText =
      typeof options.getLabelText === "function"
        ? options.getLabelText(label)
        : label.text || "";

    positionLabelTarget(box, metrics, label);
    mxEvent.addListener(box, "mousedown", startDrag("label", label.id, box));
    mxEvent.addListener(box, "click", function (evt) {
      evt.stopPropagation();

      if (typeof options.onSelect === "function") {
        options.onSelect("label", label.id);
      }

      requestRender();
    });

    if (typeof options.onLabelDoubleClick === "function") {
      mxEvent.addListener(box, "dblclick", function (evt) {
        evt.stopPropagation();
        options.onLabelDoubleClick(label, evt);
      });
    }

    surface.appendChild(box);
  });

  mxEvent.addListener(surface, "click", function (evt) {
    if (evt.target !== surface) {
      return;
    }

    if (typeof options.onSurfaceClick === "function") {
      options.onSurfaceClick(
        resolveRelativePoint(evt, surface, metrics, options.mode == "port"),
        metrics,
        evt,
      );
    }
  });

  return {
    metrics: metrics,
    surface: surface,
  };
}
