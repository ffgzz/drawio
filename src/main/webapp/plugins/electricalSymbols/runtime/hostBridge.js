/**
 * 宿主桥接层。
 * 负责接收宿主页面通过 postMessage 发来的图元/图框/配电柜请求，
 * 在 draw.io 插件内直接走原生命令链路完成插入。
 */
import { commandApi } from "../application/commands.js";
import { selectionApi } from "../application/selection.js";
import { frameDomainApi } from "../domain/frame.js";
import { snapshotDomainApi } from "../domain/snapshot.js";
import { makeFrameLabelStyle } from "../domain/frameCore.js";
import { clearEdgePoints, getPortMetaById } from "./connectionConstraints.js";
import { createMetaCell } from "../utils/xml.js";
import { getAttr } from "../utils/xml.js";

function parseHostMessage(data) {
  if (data == null) {
    return null;
  }

  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch (e) {
      return null;
    }
  }

  if (typeof data === "object") {
    return data;
  }

  return null;
}

function resolveGraphInsertPoint(ctx, payload) {
  var graph = ctx.graph;
  var diagramContainer = ctx.ui != null ? ctx.ui.diagramContainer : null;
  var scale = graph.view != null ? graph.view.scale || 1 : 1;
  var translate = graph.view != null ? graph.view.translate : null;
  var viewportX = Number(payload.viewportX);
  var viewportY = Number(payload.viewportY);

  if (
    diagramContainer == null ||
    !isFinite(viewportX) ||
    !isFinite(viewportY) ||
    translate == null
  ) {
    return graph.getFreeInsertPoint();
  }

  return new mxPoint(
    viewportX / scale + diagramContainer.scrollLeft / scale - translate.x,
    viewportY / scale + diagramContainer.scrollTop / scale - translate.y,
  );
}

function clamp(value, min, max) {
  if (!isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

function buildSvgExportPayload(ctx, format) {
  var graph = ctx.graph;
  var bounds = graph.getGraphBounds();
  var viewScale = graph.view != null ? graph.view.scale || 1 : 1;
  var width;
  var height;
  var svgRoot;
  var data;

  if (bounds == null || bounds.width <= 0 || bounds.height <= 0) {
    throw new Error("画布上没有可导出的图形");
  }

  width = Math.max(1, Math.ceil(bounds.width / viewScale));
  height = Math.max(1, Math.ceil(bounds.height / viewScale));
  svgRoot = graph.getSvg(
    null,
    1,
    0,
    false,
    null,
    true,
    null,
    null,
    null,
    null,
    true,
    null,
  );

  if (graph.shadowVisible) {
    graph.addSvgShadow(svgRoot);
  }

  if (graph.mathEnabled) {
    Editor.prototype.addMathCss(svgRoot);
  }

  svgRoot.setAttribute("width", String(width));
  svgRoot.setAttribute("height", String(height));
  svgRoot.setAttribute("preserveAspectRatio", "xMidYMid meet");
  data = mxUtils.getXml(svgRoot);

  return {
    data: data,
    format: format,
    xml: "",
  };
}

export function emitHostEvent(eventName, payload) {
  var targetWindow = window.opener || window.parent;

  if (
    targetWindow == null ||
    targetWindow === window ||
    typeof targetWindow.postMessage !== "function"
  ) {
    return;
  }

  targetWindow.postMessage(
    JSON.stringify(
      Object.assign(
        {
          event: eventName,
        },
        payload || {},
      ),
    ),
    "*",
  );
}

export function installHostBridge(ctx) {
  if (window.__eidElectricalHostBridgeInstalled) {
    return;
  }

  var validSource = window.opener || window.parent;
  var graph = ctx.graph;
  var model =
    ctx.model != null
      ? ctx.model
      : graph != null && typeof graph.getModel === "function"
        ? graph.getModel()
        : null;
  var runtimeState = ctx.state != null ? ctx.state : {};
  var constants = ctx.constants;

  function createFrameTemplateLabelCell(frame, label) {
    var frameConfig = frameDomainApi.getFrameConfig(frame);
    var width = Math.max(40, Math.round(Number(label.width) || 120));
    var height = Math.max(20, Math.round(Number(label.height) || 26));
    var maxX = Math.max(0, frameConfig.width - width);
    var maxY = Math.max(0, frameConfig.height - height);
    var geometry = new mxGeometry(
      clamp(Math.round(Number(label.x) || 0), 0, maxX),
      clamp(Math.round(Number(label.y) || 0), 0, maxY),
      width,
      height,
    );
    var value = createMetaCell(
      constants.FRAME_LABEL_TAG,
      "frameTemplateLabel",
      label.id != null ? String(label.id) : "",
      label.text != null ? String(label.text) : "",
    );
    var style = mxUtils.setStyle(
      makeFrameLabelStyle(),
      "align",
      label.align != null ? String(label.align) : "center",
    );
    var fieldPath =
      label.fieldPath != null ? String(label.fieldPath) : "";
    var cell;

    if (fieldPath.length > 0) {
      value.setAttribute("fieldPath", fieldPath);
    }

    cell = new mxCell(value, geometry, style);
    cell.vertex = true;
    cell.setConnectable(false);
    return cell;
  }

  function resetEdgeAutoStyle(edge) {
    var style = model.getStyle(edge) || "";

    style = mxUtils.setStyle(style, "noEdgeStyle", null);
    style = mxUtils.setStyle(style, "edgeStyle", "orthogonalEdgeStyle");
    style = mxUtils.setStyle(style, "entryX", null);
    style = mxUtils.setStyle(style, "entryY", null);
    style = mxUtils.setStyle(style, "exitX", null);
    style = mxUtils.setStyle(style, "exitY", null);
    style = mxUtils.setStyle(style, "jettySize", "auto");
    style = mxUtils.setStyle(style, "sourceJettySize", "auto");
    style = mxUtils.setStyle(style, "targetJettySize", "auto");
    style = mxUtils.setStyle(style, "rounded", "0");
    model.setStyle(edge, style);
  }

  function clearLayoutRouteMetadata(edge) {
    var style = model.getStyle(edge) || "";

    style = mxUtils.setStyle(style, "eidLayoutManaged", null);
    style = mxUtils.setStyle(style, "sourcePortId", null);
    style = mxUtils.setStyle(style, "targetPortId", null);
    style = mxUtils.setStyle(style, "sourcePortConstraint", null);
    style = mxUtils.setStyle(style, "targetPortConstraint", null);
    model.setStyle(edge, style);
  }

  function isLayoutManagedEdge(edge) {
    var style;

    if (edge == null || model == null) {
      return false;
    }

    style = model.getStyle(edge) || "";
    return mxUtils.getValue(style, "eidLayoutManaged", "0") === "1";
  }

  function applyEdgeConstraintByPortId(edge, source, portId) {
    var terminal;
    var port;
    var constraint;

    if (
      edge == null ||
      portId == null ||
      String(portId).length == 0 ||
      graph == null ||
      model == null
    ) {
      return;
    }

    terminal = model.getTerminal(edge, source);

    if (terminal == null) {
      return;
    }

    port = getPortMetaById(terminal, String(portId));

    if (port == null) {
      return;
    }

    constraint = new mxConnectionConstraint(
      new mxPoint(Number(port.x) || 0, Number(port.y) || 0),
      false,
      port.id != null ? String(port.id) : "",
    );

    graph.setConnectionConstraint(edge, terminal, source, constraint);
  }

  function clearConnectedEdgesForCells(cells) {
    var edgeMap = {};
    var i;
    var j;

    if (!Array.isArray(cells) || cells.length == 0) {
      return;
    }

    for (i = 0; i < cells.length; i++) {
      var cell = cells[i];

      if (cell == null || !model.isVertex(cell)) {
        continue;
      }

      var edges = graph.getConnections(cell) || [];

      for (j = 0; j < edges.length; j++) {
        if (
          edges[j] != null &&
          edges[j].id != null &&
          isLayoutManagedEdge(edges[j])
        ) {
          edgeMap[String(edges[j].id)] = edges[j];
        }
      }
    }

    for (var edgeId in edgeMap) {
      if (edgeMap.hasOwnProperty(edgeId)) {
        var edge = edgeMap[edgeId];
        var edgeStyle = model.getStyle(edge) || "";
        var sourcePortId = mxUtils.getValue(edgeStyle, "sourcePortId", "");
        var targetPortId = mxUtils.getValue(edgeStyle, "targetPortId", "");

        clearEdgePoints(edge);
        resetEdgeAutoStyle(edge);
        applyEdgeConstraintByPortId(edge, true, sourcePortId);
        applyEdgeConstraintByPortId(edge, false, targetPortId);
      }
    }
  }

  function postReply(targetWindow, payload) {
    if (targetWindow != null && typeof targetWindow.postMessage === "function") {
      targetWindow.postMessage(JSON.stringify(payload), "*");
    }
  }

  function postResult(targetWindow, payload, extra) {
    postReply(
      targetWindow,
      Object.assign(
        {
          event: "eid-host-result",
          action: payload != null ? payload.action : "",
          actionId: payload != null ? payload.actionId : "",
        },
        extra || {},
      ),
    );
  }

  function postError(targetWindow, payload, error) {
    postReply(targetWindow, {
      event: "eid-host-error",
      action: payload != null ? payload.action : "",
      actionId: payload != null ? payload.actionId : "",
      error: error != null && error.message != null ? error.message : String(error),
    });
  }

  function resolveSelectedFrame(payload) {
    var targetFrameId =
      payload != null && payload.selectedFrameId != null
        ? String(payload.selectedFrameId)
        : "";
    var targetGroupId =
      payload != null && payload.selectedGroupId != null
        ? String(payload.selectedGroupId)
        : "";
    var frames;
    var i;

    if (targetFrameId.length > 0) {
      return frameDomainApi.findFrameById(targetFrameId);
    }

    if (targetGroupId.length == 0) {
      return null;
    }

    frames = frameDomainApi.getAllDrawingFrames();

    for (i = 0; i < frames.length; i++) {
      if (frameDomainApi.getFrameGroupId(frames[i]) == targetGroupId) {
        return frames[i];
      }
    }

    return null;
  }

  function resolveFrameCell(payload) {
    var explicitFrameCellId =
      payload != null && payload.frameCellId != null
        ? String(payload.frameCellId)
        : "";
    var explicitFrame = null;

    if (explicitFrameCellId.length > 0) {
      explicitFrame = ctx.model.getCell(explicitFrameCellId);

      if (explicitFrame != null && frameDomainApi.findDrawingFrame(explicitFrame) === explicitFrame) {
        return explicitFrame;
      }
    }

    return resolveSelectedFrame(payload);
  }

  function collectDescendants(parent, result) {
    var childCount;
    var i;

    if (parent == null || model == null) {
      return;
    }

    result.push(parent);
    childCount = model.getChildCount(parent);

    for (i = 0; i < childCount; i++) {
      collectDescendants(model.getChildAt(parent, i), result);
    }
  }

  function resolveLayoutCell(cellId) {
    var target = cellId != null ? String(cellId) : "";
    var defaultParent;
    var cells = [];
    var i;
    var cell;

    if (target.length == 0 || model == null) {
      return null;
    }

    cell = model.getCell(target);

    if (cell != null) {
      return cell;
    }

    defaultParent = graph != null ? graph.getDefaultParent() : null;
    collectDescendants(defaultParent, cells);

    for (i = 0; i < cells.length; i++) {
      cell = cells[i];

      if (cell == null) {
        continue;
      }

      if (
        getAttr(cell, "pluginType") == constants.FRAME_TYPE &&
        getAttr(cell, "frameId") == target
      ) {
        return cell;
      }

      if (
        getAttr(cell, "pluginType") == constants.ROOT_TYPE &&
        ((getAttr(cell, "instanceId") == target) || (cell.id != null && String(cell.id) == target))
      ) {
        return cell;
      }

      if (
        getAttr(cell, "pluginType") == constants.CABINET_TYPE &&
        getAttr(cell, "logicalCabinetId") == target
      ) {
        return cell;
      }
    }

    return null;
  }

  window.addEventListener(
    "message",
    function (evt) {
      if (validSource != null && evt.source !== validSource) {
        return;
      }

      var payload = parseHostMessage(evt.data);

      if (payload == null || payload.action == null) {
        return;
      }

      try {
        if (payload.action === "createSymbol" && payload.spec != null) {
          evt.stopImmediatePropagation();
          var point = resolveGraphInsertPoint(ctx, payload);
          commandApi.insertIntoGraphAt(payload.spec, point);
          postResult(evt.source, payload, {
            cellId: getAttr(ctx.graph.getSelectionCell(), "id"),
          });
          return;
        }

        if (payload.action === "exportDiagram") {
          evt.stopImmediatePropagation();

          if (payload.format === "svg" || payload.format === "xmlsvg") {
            postResult(evt.source, payload, buildSvgExportPayload(ctx, payload.format));
            return;
          }

          if (payload.format === "png" || payload.format === "xmlpng") {
            throw new Error("当前宿主桥仅支持 SVG 导出");
          }

          throw new Error("不支持的导出格式");
        }

        if (payload.action === "insertFrame" && payload.config != null) {
          evt.stopImmediatePropagation();
          var selectedFrame = resolveSelectedFrame(payload);
          commandApi.insertFrame(
            payload.config,
            selectedFrame,
            frameDomainApi.getAllDrawingFrames(),
          );
          var insertedFrame = frameDomainApi.findDrawingFrame(
            ctx.graph.getSelectionCell(),
          );

          if (
            insertedFrame != null &&
            Array.isArray(payload.frameLabels) &&
            payload.frameLabels.length > 0
          ) {
            var frameLabels = payload.frameLabels;
            var insertedCells = [];
            var labelIndex;

            runtimeState.updatingModel = true;

            if (model != null) {
              model.beginUpdate();
            }
            try {
              for (labelIndex = 0; labelIndex < frameLabels.length; labelIndex++) {
                var frameLabel = frameLabels[labelIndex];

                if (frameLabel == null) {
                  continue;
                }

                insertedCells.push(
                  createFrameTemplateLabelCell(insertedFrame, frameLabel),
                );
              }

              for (labelIndex = 0; labelIndex < insertedCells.length; labelIndex++) {
                if (model != null) {
                  model.add(insertedFrame, insertedCells[labelIndex]);
                } else {
                  insertedFrame.insert(insertedCells[labelIndex]);
                }
              }
            } finally {
              if (model != null) {
                model.endUpdate();
              }
              runtimeState.updatingModel = false;
            }
          }

          postResult(evt.source, payload, {
            frameId: insertedFrame != null ? getAttr(insertedFrame, "frameId") : "",
            groupId:
              insertedFrame != null
                ? frameDomainApi.getFrameGroupId(insertedFrame)
                : "",
            frameCellId:
              insertedFrame != null && insertedFrame.id != null
                ? String(insertedFrame.id)
                : "",
          });
          return;
        }

        if (payload.action === "insertCabinet" && payload.cabinetModel != null) {
          evt.stopImmediatePropagation();
          commandApi.insertCabinet(payload.cabinetModel);
          postResult(evt.source, payload, {
            logicalCabinetId:
              payload.cabinetModel.logicalCabinetId != null
                ? String(payload.cabinetModel.logicalCabinetId)
                : "",
          });
          return;
        }

        if (payload.action === "getSelectionInfo") {
          evt.stopImmediatePropagation();
          var selectedCell = selectionApi.getSelectedCell();
          var selectedFrame = selectionApi.getSelectedFrame();

          postResult(evt.source, payload, {
            selectedCellId:
              selectedCell != null && selectedCell.id != null
                ? String(selectedCell.id)
                : "",
            selectedFrameCellId:
              selectedFrame != null && selectedFrame.id != null
                ? String(selectedFrame.id)
                : "",
            selectedFrameId:
              selectedFrame != null ? getAttr(selectedFrame, "frameId") : "",
            selectedGroupId:
              selectedFrame != null
                ? frameDomainApi.getFrameGroupId(selectedFrame)
                : "",
          });
          return;
        }

        if (payload.action === "getDiagramSnapshot") {
          evt.stopImmediatePropagation();
          postResult(evt.source, payload, {
            snapshot: snapshotDomainApi.exportDiagramSnapshot(),
          });
          return;
        }

        if (
          payload.action === "applyLayoutPositions" &&
          Array.isArray(payload.positions)
        ) {
          evt.stopImmediatePropagation();
          var frame = resolveFrameCell(payload);
          var graph = ctx.graph;
          var model =
            ctx.model != null
              ? ctx.model
              : graph != null && typeof graph.getModel === "function"
                ? graph.getModel()
                : null;
          var state = ctx.state != null ? ctx.state : runtimeState;
          var movedCells = [];
          var edgeMap = {};
          var frameGeometry;
          var frameOrigin;
          var isSnakeLayout = payload.layoutMode === "snake-wrap";
          var i;

          if (frame == null) {
            throw new Error("未找到要布局的图框");
          }

          frameGeometry = model.getGeometry(frame);
          frameOrigin = {
            x: frameGeometry != null ? frameGeometry.x : 0,
            y: frameGeometry != null ? frameGeometry.y : 0,
          };

          if (window.console != null) {
            console.log(
              "[electricalSymbols host bridge][request][json]",
              JSON.stringify(
                {
                  frameCellId: payload.frameCellId || "",
                  frameId: getAttr(frame, "frameId"),
                  positions: payload.positions,
                  edgeRoutes: payload.edgeRoutes,
                  frameOrigin: frameOrigin,
                  frameGeometry:
                    frameGeometry != null
                      ? {
                          x: frameGeometry.x,
                          y: frameGeometry.y,
                          width: frameGeometry.width,
                          height: frameGeometry.height,
                          relative: !!frameGeometry.relative,
                        }
                      : null,
                },
                null,
                2,
              ),
            );
          }

          runtimeState.updatingModel = true;
          model.beginUpdate();

          try {
            for (i = 0; i < payload.positions.length; i++) {
              var item = payload.positions[i] || {};
              var cellId = item.cellId != null ? String(item.cellId) : "";
              var x = Number(item.x);
              var y = Number(item.y);
              var cell;
              var geometry;
              var nextGeometry;
              var edges;
              var j;

              if (cellId.length == 0 || !isFinite(x) || !isFinite(y)) {
                continue;
              }

              cell = resolveLayoutCell(cellId);

              if (cell == null) {
                continue;
              }

              geometry = model.getGeometry(cell);

              if (geometry == null) {
                continue;
              }

              nextGeometry = geometry.clone();
              if (model.getParent(cell) === frame) {
                nextGeometry.x = x;
                nextGeometry.y = y;
              } else {
                nextGeometry.x = x + frameOrigin.x;
                nextGeometry.y = y + frameOrigin.y;
              }
              model.setGeometry(cell, nextGeometry);
              movedCells.push(cell);

              edges = graph.getConnections(cell) || [];

              for (j = 0; j < edges.length; j++) {
                if (edges[j] != null && edges[j].id != null) {
                  edgeMap[String(edges[j].id)] = edges[j];
                }
              }
            }

            for (var edgeId in edgeMap) {
              if (edgeMap.hasOwnProperty(edgeId)) {
                clearEdgePoints(edgeMap[edgeId]);
                if (!isSnakeLayout) {
                  clearLayoutRouteMetadata(edgeMap[edgeId]);
                  resetEdgeAutoStyle(edgeMap[edgeId]);
                }
              }
            }

            if (Array.isArray(payload.edgeRoutes)) {
              for (i = 0; i < payload.edgeRoutes.length; i++) {
                var route = payload.edgeRoutes[i] || {};
                var edgeId = route.edgeId != null ? String(route.edgeId) : "";
                var edge = edgeId.length > 0 ? model.getCell(edgeId) : null;
                var edgeGeometry;
                var nextPoints = [];
                var edgeParent;
                var parentGeometry;
                var parentOriginX;
                var parentOriginY;
                var points;
                var j;

                if (edge == null || !Array.isArray(route.points)) {
                  continue;
                }

                edgeGeometry = model.getGeometry(edge);

                if (edgeGeometry == null) {
                  continue;
                }

                edgeParent = model.getParent(edge);
                parentGeometry = edgeParent != null ? model.getGeometry(edgeParent) : null;
                parentOriginX = parentGeometry != null ? parentGeometry.x : 0;
                parentOriginY = parentGeometry != null ? parentGeometry.y : 0;
                points = route.points;

                for (j = 0; j < points.length; j++) {
                  var point = points[j] || {};
                  var px = Number(point.x);
                  var py = Number(point.y);

                  if (!isFinite(px) || !isFinite(py)) {
                    continue;
                  }

                  nextPoints.push(
                    new mxPoint(
                      px + frameOrigin.x - parentOriginX,
                      py + frameOrigin.y - parentOriginY,
                    ),
                  );
                }

                edgeGeometry = edgeGeometry.clone();
                edgeGeometry.points = nextPoints.length > 0 ? nextPoints : null;
                model.setGeometry(edge, edgeGeometry);
                var nextStyle = model.getStyle(edge) || "";

                if (
                  isSnakeLayout &&
                  route.manual &&
                  route.sourcePortId != null &&
                  String(route.sourcePortId).length > 0
                ) {
                  applyEdgeConstraintByPortId(edge, true, route.sourcePortId);
                  nextStyle = mxUtils.setStyle(
                    nextStyle,
                    "sourcePortId",
                    String(route.sourcePortId),
                  );
                }

                if (
                  isSnakeLayout &&
                  route.manual &&
                  route.targetPortId != null &&
                  String(route.targetPortId).length > 0
                ) {
                  applyEdgeConstraintByPortId(edge, false, route.targetPortId);
                  nextStyle = mxUtils.setStyle(
                    nextStyle,
                    "targetPortId",
                    String(route.targetPortId),
                  );
                }

                nextStyle = mxUtils.setStyle(nextStyle, "entryX", null);
                nextStyle = mxUtils.setStyle(nextStyle, "entryY", null);
                nextStyle = mxUtils.setStyle(nextStyle, "exitX", null);
                nextStyle = mxUtils.setStyle(nextStyle, "exitY", null);
                if (isSnakeLayout && route.manual) {
                  nextStyle = mxUtils.setStyle(nextStyle, "jettySize", "0");
                  nextStyle = mxUtils.setStyle(
                    nextStyle,
                    "sourceJettySize",
                    "0",
                  );
                  nextStyle = mxUtils.setStyle(
                    nextStyle,
                    "targetJettySize",
                    "0",
                  );
                  nextStyle = mxUtils.setStyle(nextStyle, "noEdgeStyle", "1");
                  nextStyle = mxUtils.setStyle(nextStyle, "edgeStyle", null);
                  nextStyle = mxUtils.setStyle(nextStyle, "eidLayoutManaged", "1");
                } else {
                  nextStyle = mxUtils.setStyle(nextStyle, "eidLayoutManaged", null);
                  nextStyle = mxUtils.setStyle(nextStyle, "sourcePortId", null);
                  nextStyle = mxUtils.setStyle(nextStyle, "targetPortId", null);
                  nextStyle = mxUtils.setStyle(nextStyle, "sourcePortConstraint", null);
                  nextStyle = mxUtils.setStyle(nextStyle, "targetPortConstraint", null);
                  nextStyle = mxUtils.setStyle(nextStyle, "jettySize", "auto");
                  nextStyle = mxUtils.setStyle(
                    nextStyle,
                    "sourceJettySize",
                    "auto",
                  );
                  nextStyle = mxUtils.setStyle(
                    nextStyle,
                    "targetJettySize",
                    "auto",
                  );
                  nextStyle = mxUtils.setStyle(nextStyle, "noEdgeStyle", null);
                  nextStyle = mxUtils.setStyle(
                    nextStyle,
                    "edgeStyle",
                    "orthogonalEdgeStyle",
                  );
                }

                nextStyle = mxUtils.setStyle(nextStyle, "rounded", "0");
                model.setStyle(edge, nextStyle);

                if (window.console != null) {
                  console.log(
                    "[electricalSymbols host bridge][edge-applied][json]",
                    JSON.stringify(
                      {
                        edgeId: edgeId,
                        routePoints: route.points,
                        sourcePortId:
                          route.sourcePortId != null ? String(route.sourcePortId) : "",
                        targetPortId:
                          route.targetPortId != null ? String(route.targetPortId) : "",
                        manual: !!route.manual,
                        geometryPoints: nextPoints.map(function (point) {
                          return { x: point.x, y: point.y };
                        }),
                        style: model.getStyle(edge) || "",
                      },
                      null,
                      2,
                    ),
                  );
                }
              }
            }
          } finally {
            model.endUpdate();
            runtimeState.updatingModel = false;
          }

          if (movedCells.length > 0) {
            graph.setSelectionCells(movedCells);
            graph.scrollCellToVisible(movedCells[0]);
          }

          postResult(evt.source, payload, {
            movedCount: movedCells.length,
          });

          if (window.console != null) {
            console.log(
              "[electricalSymbols host bridge][result][json]",
              JSON.stringify(
                {
                  movedCount: movedCells.length,
                  movedCellIds: movedCells.map(function (cell) {
                    return cell != null && cell.id != null ? String(cell.id) : "";
                  }),
                },
                null,
                2,
              ),
            );
          }
        }
      } catch (e) {
        postError(evt.source, payload, e);
        if (window.console != null) {
          console.error("[electricalSymbols] host bridge failed", e);
        }
      }
    },
    true,
  );

  graph.addListener(mxEvent.CELLS_MOVED, function (_sender, evt) {
    if (runtimeState.updatingModel) {
      return;
    }

    clearConnectedEdgesForCells(evt != null ? evt.getProperty("cells") : null);
  });

  window.__eidElectricalHostBridgeInstalled = true;
  emitHostEvent("eid-ready");
}
