/**
 * 配电柜出线端口纵向拖动。
 *
 * 端口是 portsJson 里的稳定元数据，不是独立 mxCell，原生 Draw.io
 * 不会为它提供拖动手柄。这里在画布捕获阶段命中可见端口，
 * 只消费这一个交互，其余点击/连线继续交给 Draw.io。
 */
import { getApp } from "../core/appRuntime.js";
import { cabinetDomainApi } from "../domain/cabinet.js";
import { frameDomainApi } from "../domain/frame.js";
import { isCabinetSegment } from "../core/runtimeHelpers.js";
import { connectionConstraintsApi } from "./connectionConstraints.js";
import { isOverviewMode, onLodChanged } from "./viewportVirtualization.js";
import { isPrintMode, onPrintModeChanged } from "./printMode.js";

var HIT_RADIUS = 18;
var GUIDE_SIZE = 18;
var session = null;
var guide = null;

function canDrag(ctx) {
  return (
    ctx != null &&
    ctx.graph != null &&
    ctx.model != null &&
    typeof ctx.graph.isEnabled == "function" &&
    ctx.graph.isEnabled() &&
    !isPrintMode() &&
    !isOverviewMode()
  );
}

function getPortViewPoint(ctx, segment, port) {
  var state = ctx.graph.view.getState(segment);

  if (state == null || port == null) {
    return null;
  }

  return {
    x: state.x + Number(port.x) * state.width,
    y: state.y + Number(port.y) * state.height,
  };
}

function findNearestPort(ctx, graphPoint) {
  var frames = frameDomainApi.getAllDrawingFrames();
  var nearest = null;
  var nearestDistance = HIT_RADIUS + 1;
  var i;
  var j;

  for (i = 0; i < frames.length; i++) {
    for (j = 0; j < ctx.model.getChildCount(frames[i]); j++) {
      var segment = ctx.model.getChildAt(frames[i], j);

      if (!isCabinetSegment(segment)) {
        continue;
      }

      var ports = connectionConstraintsApi.getPortLayoutForRoot(segment);
      var k;

      for (k = 0; k < ports.length; k++) {
        var point = getPortViewPoint(ctx, segment, ports[k]);

        if (point == null) {
          continue;
        }

        var dx = point.x - graphPoint.x;
        var dy = point.y - graphPoint.y;
        var distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= HIT_RADIUS && distance < nearestDistance) {
          nearestDistance = distance;
          nearest = {
            segment,
            port: ports[k],
            point,
          };
        }
      }
    }
  }

  return nearest;
}

function ensureGuide(ctx) {
  if (guide != null) {
    return guide;
  }

  guide = document.createElement("div");
  guide.setAttribute("data-eid-cabinet-port-drag-handle", "1");
  guide.setAttribute("title", "上下拖动该回路");
  guide.style.position = "absolute";
  guide.style.width = GUIDE_SIZE + "px";
  guide.style.height = GUIDE_SIZE + "px";
  guide.style.boxSizing = "border-box";
  guide.style.border = "2px solid #1677ff";
  guide.style.borderRadius = "50%";
  guide.style.background = "rgba(22, 119, 255, 0.12)";
  guide.style.boxShadow = "0 0 0 2px rgba(255, 255, 255, 0.9)";
  guide.style.pointerEvents = "none";
  guide.style.zIndex = "10000";
  guide.style.display = "none";
  ctx.graph.container.appendChild(guide);
  return guide;
}

function hideGuide(ctx) {
  if (guide != null) {
    guide.style.display = "none";
  }

  if (ctx != null && ctx.graph != null && ctx.graph.container != null) {
    ctx.graph.container.removeAttribute("data-eid-cabinet-port-hover");

    if (session == null) {
      ctx.graph.container.style.cursor = "";
    }
  }
}

function showGuide(ctx, hit, active) {
  var element = ensureGuide(ctx);
  var point = getPortViewPoint(ctx, hit.segment, hit.port) || hit.point;

  element.style.left = Math.round(point.x - GUIDE_SIZE / 2) + "px";
  element.style.top = Math.round(point.y - GUIDE_SIZE / 2) + "px";
  element.style.background = active
    ? "rgba(22, 119, 255, 0.32)"
    : "rgba(22, 119, 255, 0.12)";
  element.style.display = "block";
  ctx.graph.container.style.cursor = "ns-resize";
  ctx.graph.container.setAttribute("data-eid-cabinet-port-hover", "1");
}

function toGraphPoint(ctx, evt) {
  return mxUtils.convertPoint(
    ctx.graph.container,
    mxEvent.getClientX(evt),
    mxEvent.getClientY(evt),
  );
}

function consume(evt) {
  if (evt == null) {
    return;
  }

  if (typeof evt.preventDefault == "function") {
    evt.preventDefault();
  }

  if (typeof evt.stopPropagation == "function") {
    evt.stopPropagation();
  }

  if (typeof evt.stopImmediatePropagation == "function") {
    evt.stopImmediatePropagation();
  }
}

function refreshView(ctx) {
  ctx.graph.view.invalidate();
  ctx.graph.view.validate();
}

function moveSessionTo(ctx, clientY) {
  if (session == null) {
    return;
  }

  var scale = ctx.graph.view.scale || 1;
  var desiredTotal = (Number(clientY) - session.startClientY) / scale;
  var incremental = desiredTotal - session.appliedDeltaY;

  if (Math.abs(incremental) < 0.0001) {
    return;
  }

  var result = cabinetDomainApi.moveCabinetPortByDelta(
    session.segment,
    session.port.id,
    incremental,
  );

  if (result != null) {
    session.appliedDeltaY += Number(result.deltaY) || 0;
  }

  var ports = connectionConstraintsApi.getPortLayoutForRoot(session.segment);
  var i;

  for (i = 0; i < ports.length; i++) {
    if (String(ports[i].id) == String(session.port.id)) {
      session.port = ports[i];
      break;
    }
  }

  refreshView(ctx);
  showGuide(ctx, session, true);
}

function finishDrag(ctx, cancelled) {
  if (session == null) {
    return;
  }

  if (
    session.pointerId != null &&
    session.pointerTarget != null &&
    typeof session.pointerTarget.releasePointerCapture == "function"
  ) {
    try {
      session.pointerTarget.releasePointerCapture(session.pointerId);
    } catch (e) {
      // pointerup 会自动释放，此处只处理 Escape/blur 的提前结束。
    }
  }

  if (cancelled && Math.abs(session.appliedDeltaY) > 0.0001) {
    cabinetDomainApi.moveCabinetPortByDelta(
      session.segment,
      session.port.id,
      -session.appliedDeltaY,
    );
  }

  session = null;
  ctx.graph.container.removeAttribute("data-eid-cabinet-port-dragging");
  refreshView(ctx);
  hideGuide(ctx);
}

export function installCabinetPortDrag(ctx) {
  var container = ctx.graph.container;

  if (container == null) {
    return;
  }

  container.setAttribute("data-eid-cabinet-port-drag-enabled", "1");

  function handleHover(evt) {
    if (session != null || !canDrag(ctx)) {
      return;
    }

    var bounds = container.getBoundingClientRect();
    var clientX = mxEvent.getClientX(evt);
    var clientY = mxEvent.getClientY(evt);

    if (
      clientX < bounds.left ||
      clientX > bounds.right ||
      clientY < bounds.top ||
      clientY > bounds.bottom
    ) {
      hideGuide(ctx);
      return;
    }

    var hit = findNearestPort(ctx, toGraphPoint(ctx, evt));

    if (hit != null) {
      showGuide(ctx, hit, false);
    } else {
      hideGuide(ctx);
    }
  }

  function handleMouseDown(evt) {
    if (session != null) {
      return;
    }

    if (
      !canDrag(ctx) ||
      (evt.button != null && evt.button !== 0)
    ) {
      return;
    }

    var hit = findNearestPort(ctx, toGraphPoint(ctx, evt));

    if (hit == null) {
      return;
    }

    ctx.graph.stopEditing(false);
    session = {
      segment: hit.segment,
      port: hit.port,
      point: hit.point,
      pointerId:
        evt.pointerId != null && isFinite(Number(evt.pointerId))
          ? Number(evt.pointerId)
          : null,
      pointerTarget: evt.target || null,
      startClientY: Number(mxEvent.getClientY(evt)),
      appliedDeltaY: 0,
    };

    if (
      session.pointerId != null &&
      session.pointerTarget != null &&
      typeof session.pointerTarget.setPointerCapture == "function"
    ) {
      try {
        session.pointerTarget.setPointerCapture(session.pointerId);
      } catch (e) {
        // 极少数自定义 SVG 节点不允许 capture，window 监听仍可兜底。
      }
    }
    container.setAttribute("data-eid-cabinet-port-dragging", "1");
    showGuide(ctx, session, true);
    consume(evt);
  }

  function handleMouseMove(evt) {
    if (session == null) {
      return;
    }

    moveSessionTo(ctx, mxEvent.getClientY(evt));
    consume(evt);
  }

  function handleMouseUp(evt) {
    if (session == null) {
      return;
    }

    moveSessionTo(ctx, mxEvent.getClientY(evt));
    finishDrag(ctx, false);
    consume(evt);
  }

  function handleKeyDown(evt) {
    if (session != null && (evt.key == "Escape" || evt.keyCode == 27)) {
      finishDrag(ctx, true);
      consume(evt);
    }
  }

  function handleWindowBlur() {
    if (session != null) {
      finishDrag(ctx, true);
    }
  }

  function hideWhenUnavailable() {
    if (session != null && (!canDrag(ctx) || !ctx.model.contains(session.segment))) {
      finishDrag(ctx, true);
    } else if (!canDrag(ctx)) {
      hideGuide(ctx);
    }
  }

  // capture=true：在 mxConnectionHandler 把同一个端口解释为“新建连线”前拦截。
  // 原生连接约束命中后会把高亮节点挂到 graph.container 之外的
  // overlay pane。按下时 event.target 因此不一定是 container 子孙，必须在
  // iframe document 的捕获阶段接管；再用画布边界+端口命中限定作用域。
  if (typeof window.PointerEvent == "function") {
    document.addEventListener("pointerdown", handleMouseDown, true);
    document.addEventListener("pointermove", handleHover, true);
    window.addEventListener("pointermove", handleMouseMove, true);
    window.addEventListener("pointerup", handleMouseUp, true);
  } else {
    document.addEventListener("mousedown", handleMouseDown, true);
    document.addEventListener("mousemove", handleHover, true);
    window.addEventListener("mousemove", handleMouseMove, true);
    window.addEventListener("mouseup", handleMouseUp, true);
  }
  window.addEventListener("keydown", handleKeyDown, true);
  window.addEventListener("blur", handleWindowBlur);
  container.addEventListener("mouseleave", function () {
    if (session == null) {
      hideGuide(ctx);
    }
  });

  ctx.model.addListener(mxEvent.CHANGE, function () {
    if (session == null) {
      hideGuide(ctx);
    }
  });
  onLodChanged(hideWhenUnavailable);
  onPrintModeChanged(hideWhenUnavailable);
}

export var cabinetPortDragApi = {
  installCabinetPortDrag,
};
