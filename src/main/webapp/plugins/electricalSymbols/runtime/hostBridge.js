/**
 * 宿主桥接层。
 * 负责接收宿主页面通过 postMessage 发来的图元/图框/配电柜请求，
 * 在 draw.io 插件内直接走原生命令链路完成插入。
 */
import { commandApi } from "../application/commands.js";
import { selectionApi } from "../application/selection.js";
import { frameDomainApi } from "../domain/frame.js";
import { clearEdgePoints } from "./connectionConstraints.js";
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

export function installHostBridge(ctx) {
  if (window.__eidElectricalHostBridgeInstalled) {
    return;
  }

  var validSource = window.opener || window.parent;
  var graph = ctx.graph;
  var model = ctx.model;

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
        if (edges[j] != null && edges[j].id != null) {
          edgeMap[String(edges[j].id)] = edges[j];
        }
      }
    }

    for (var edgeId in edgeMap) {
      if (edgeMap.hasOwnProperty(edgeId)) {
        clearEdgePoints(edgeMap[edgeId]);
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
          postResult(evt.source, payload, {
            frameId: insertedFrame != null ? getAttr(insertedFrame, "frameId") : "",
            groupId:
              insertedFrame != null
                ? frameDomainApi.getFrameGroupId(insertedFrame)
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

        if (
          payload.action === "applyLayoutPositions" &&
          Array.isArray(payload.positions)
        ) {
          evt.stopImmediatePropagation();
          var frame = resolveFrameCell(payload);
          var graph = ctx.graph;
          var model = ctx.model;
          var state = ctx.state;
          var movedCells = [];
          var edgeMap = {};
          var frameGeometry;
          var frameOrigin;
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

          state.updatingModel = true;
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

              cell = model.getCell(cellId);

              if (cell == null || model.getParent(cell) !== frame) {
                continue;
              }

              geometry = model.getGeometry(cell);

              if (geometry == null) {
                continue;
              }

              nextGeometry = geometry.clone();
              nextGeometry.x = x;
              nextGeometry.y = y;
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
                model.setStyle(
                  edge,
                  mxUtils.setStyle(
                    mxUtils.setStyle(
                      mxUtils.setStyle(
                        mxUtils.setStyle(
                          mxUtils.setStyle(
                            mxUtils.setStyle(model.getStyle(edge) || "", "jettySize", "auto"),
                            "sourceJettySize",
                            "auto",
                          ),
                          "targetJettySize",
                          "auto",
                        ),
                        "noEdgeStyle",
                        null,
                      ),
                      "edgeStyle",
                      "orthogonalEdgeStyle",
                    ),
                    "rounded",
                    "0",
                  ),
                );

                if (window.console != null) {
                  console.log(
                    "[electricalSymbols host bridge][edge-applied][json]",
                    JSON.stringify(
                      {
                        edgeId: edgeId,
                        routePoints: route.points,
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
            state.updatingModel = false;
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
    if (ctx.state != null && ctx.state.updatingModel) {
      return;
    }

    clearConnectedEdgesForCells(evt != null ? evt.getProperty("cells") : null);
  });

  window.__eidElectricalHostBridgeInstalled = true;
}
