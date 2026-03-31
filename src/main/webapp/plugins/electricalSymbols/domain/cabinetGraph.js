/**
 * 配电柜 graph 子模块。
 * 负责分页片段 cell 构建、gap 高亮、附着恢复和重排，是 cabinet 的边缘适配层。
 */
import {
  buildCabinetPageDescriptors,
  makeCabinetBodyStyle,
  makeCabinetGapStyle,
  makeCabinetRootStyle,
  normalizeCabinetModel,
} from "./cabinetCore.js";
import { getApp } from "../core/appRuntime.js";

function buildCabinetDeps() {
  var app = getApp();
  var constants = app.constants;
  var utils = app.utils;
  var domains = app.domains;
  var helpers = app.helpers;
  var graphApi = app.graphApi;

  return {
    model: graphApi.model,
    state: graphApi.state,
    cabinetTag: constants.CABINET_TAG,
    cabinetType: constants.CABINET_TYPE,
    cabinetBodyTag: constants.CABINET_BODY_TAG,
    cabinetBodyKind: constants.CABINET_BODY_KIND,
    cabinetGapTag: constants.CABINET_GAP_TAG,
    cabinetGapType: constants.CABINET_GAP_TYPE,
    cabinetGapKind: constants.CABINET_GAP_KIND,
    frameLabelKind: constants.FRAME_LABEL_KIND,
    frameContentRatio: constants.FRAME_CONTENT_RATIO,
    frameMarginRatio: constants.FRAME_MARGIN_RATIO,
    frameHorizontalGap: constants.FRAME_HORIZONTAL_GAP,
    minPortFollowSpaceRatio: constants.CABINET_MIN_PORT_FOLLOW_SPACE_RATIO,
    defaultWidth: constants.CABINET_DEFAULT_WIDTH,
    defaultPortCount: constants.CABINET_DEFAULT_PORT_COUNT,
    defaultX: constants.CABINET_DEFAULT_X,
    tailPadding: constants.CABINET_TAIL_PADDING,
    trim: utils.trim,
    toInt: utils.toInt,
    toFloat: utils.toFloat,
    clamp: utils.clamp,
    isObject: utils.isObject,
    cloneJson: utils.cloneJson,
    normalizePortPoint: domains.spec.normalizePortPoint,
    generateLogicalCabinetId: helpers.generateLogicalCabinetId,
    createNode: utils.createNode,
    createMetaCell: utils.createMetaCell,
    serializePortLayout: domains.spec.serializePortLayout,
    getAttr: utils.getAttr,
    isCabinetSegment: helpers.isCabinetSegment,
    isCabinetGap: helpers.isCabinetGap,
    getNormalizedFrameConfig: domains.frame.normalizeFrameConfig,
    getAllDrawingFrames: domains.frame.getAllDrawingFrames,
    getFrameConfig: domains.frame.getFrameConfig,
    getFrameGroupId: domains.frame.getFrameGroupId,
    getFramePageNumber: domains.frame.getFramePageNumber,
    getMaxFramePageNumberInGroup:
      domains.frame.getMaxFramePageNumberInGroup,
    getRightmostFrameInGroup: domains.frame.getRightmostFrameInGroup,
    findFrameById: domains.frame.findFrameById,
    findDrawingFrame: domains.frame.findDrawingFrame,
    createDrawingFrameCell: domains.frame.createDrawingFrameCell,
    addTopLevelCell: domains.frame.addTopLevelCell,
    getEdgePortId: function (edge, root, source) {
      return domains.snapshot.getEdgePortId(edge, root, source);
    },
    getPortMetaById: domains.connectionConstraints.getPortMetaById,
    parsePortLayout: domains.spec.parsePortLayout,
    isMovableConnectedTerminal:
      domains.connectionConstraints.isMovableConnectedTerminal,
    moveCellToFrameByDelta:
      domains.connectionConstraints.moveCellToFrameByDelta,
    setConnectionConstraint: function (edge, root, source, constraint) {
      graphApi.graph.setConnectionConstraint(edge, root, source, constraint);
    },
  };
}

export function createCabinetDomain() {
  var deps = arguments.length > 0 ? arguments[0] : buildCabinetDeps();
  var model = deps.model;
  var state = deps.state;

  function findCabinetSegment(cell) {
    while (cell != null) {
      if (deps.isCabinetSegment(cell)) {
        return cell;
      }

      cell = model.getParent(cell);
    }

    return null;
  }

  function createCabinetValueMetadata(node, cabinetModel, descriptor, frameId) {
    node.setAttribute("pluginType", deps.cabinetType);
    node.setAttribute(
      "logicalCabinetId",
      deps.trim(cabinetModel.logicalCabinetId),
    );
    node.setAttribute("originFrameId", deps.trim(cabinetModel.originFrameId));
    node.setAttribute("frameId", deps.trim(frameId));
    node.setAttribute("segmentIndex", String(descriptor.segmentIndex));
    node.setAttribute(
      "segmentStartOffset",
      String(Math.round(descriptor.segmentStartOffset * 1000) / 1000),
    );
    node.setAttribute(
      "segmentEndOffset",
      String(Math.round(descriptor.segmentEndOffset * 1000) / 1000),
    );
    node.setAttribute("cabinetModelJson", JSON.stringify(cabinetModel));
    node.setAttribute("gapRatiosJson", JSON.stringify(cabinetModel.gapRatios));
    node.setAttribute("portsJson", deps.serializePortLayout(descriptor.ports));
    node.setAttribute("portLayout", deps.serializePortLayout(descriptor.ports));
    node.setAttribute("label", "");
    return node;
  }

  function createCabinetBodyCell(descriptor) {
    var cell = new mxCell(
      deps.createMetaCell(
        deps.cabinetBodyTag,
      deps.cabinetBodyKind,
      "main",
      "",
      ),
      new mxGeometry(0, 0, descriptor.width, descriptor.height),
      makeCabinetBodyStyle(descriptor),
    );
    cell.vertex = true;
    cell.setConnectable(false);
    return cell;
  }

  function isSelectedCabinetGap(logicalCabinetId, gapIndex) {
    return (
      state.selectedCabinetGap != null &&
      deps.trim(state.selectedCabinetGap.logicalCabinetId) ==
        deps.trim(logicalCabinetId) &&
      deps.toInt(state.selectedCabinetGap.gapIndex, -1) ==
        deps.toInt(gapIndex, -1)
    );
  }

  function createCabinetGapCell(cabinetModel, descriptor, gap) {
    var value = deps.createNode(deps.cabinetGapTag);
    value.setAttribute("pluginType", deps.cabinetGapType);
    value.setAttribute("esKind", deps.cabinetGapKind);
    value.setAttribute("esKey", String(gap.gapIndex));
    value.setAttribute(
      "logicalCabinetId",
      deps.trim(cabinetModel.logicalCabinetId),
    );
    value.setAttribute("gapIndex", String(gap.gapIndex));
    value.setAttribute("label", "");
    var geometry = new mxGeometry(1, gap.y, 14, gap.height);
    geometry.relative = true;
    geometry.offset = new mxPoint(-7, 0);
    var cell = new mxCell(
      value,
      geometry,
      makeCabinetGapStyle(
        isSelectedCabinetGap(cabinetModel.logicalCabinetId, gap.gapIndex),
      ),
    );
    cell.vertex = true;
    cell.setConnectable(false);
    return cell;
  }

  function getCellAbsoluteGeometry(cell) {
    var geometry = model.getGeometry(cell);
    var parent = model.getParent(cell);
    var x = geometry != null ? geometry.x : 0;
    var y = geometry != null ? geometry.y : 0;

    while (parent != null) {
      var parentGeometry = model.getGeometry(parent);

      if (parentGeometry != null) {
        x += parentGeometry.x;
        y += parentGeometry.y;
      }

      parent = model.getParent(parent);
    }

    return {
      x,
      y,
      width: geometry != null ? geometry.width : 0,
      height: geometry != null ? geometry.height : 0,
    };
  }

  function getPortAbsolutePosition(root, port) {
    var geometry = getCellAbsoluteGeometry(root);

    return {
      x: geometry.x + port.x * geometry.width,
      y: geometry.y + port.y * geometry.height,
    };
  }

  function buildCabinetSegmentCell(cabinetModel, frameId, descriptor) {
    var root = new mxCell(
      createCabinetValueMetadata(
        deps.createNode(deps.cabinetTag),
        cabinetModel,
        descriptor,
        frameId,
      ),
      new mxGeometry(
        descriptor.x,
        descriptor.y,
        descriptor.width,
        descriptor.height,
      ),
      makeCabinetRootStyle(),
    );
    var i;

    root.vertex = true;
    root.setConnectable(true);
    root.insert(createCabinetBodyCell(descriptor));

    for (i = 0; i < descriptor.gaps.length; i++) {
      root.insert(
        createCabinetGapCell(cabinetModel, descriptor, descriptor.gaps[i]),
      );
    }

    return root;
  }

  function extractCabinetModel(cell) {
    var root = findCabinetSegment(cell);
    var raw;

    if (root == null) {
      throw new Error("未找到配电柜片段");
    }

    raw = deps.getAttr(root, "cabinetModelJson");

    if (raw == null || raw.length == 0) {
      throw new Error("缺少 cabinetModelJson 数据");
    }

    return normalizeCabinetModel(JSON.parse(raw));
  }

  function findCabinetSegments(logicalCabinetId) {
    var target = deps.trim(logicalCabinetId);
    var frames = deps.getAllDrawingFrames();
    var result = [];
    var i;
    var j;

    for (i = 0; i < frames.length; i++) {
      for (j = 0; j < model.getChildCount(frames[i]); j++) {
        var child = model.getChildAt(frames[i], j);

        if (
          deps.isCabinetSegment(child) &&
          deps.trim(deps.getAttr(child, "logicalCabinetId")) == target
        ) {
          result.push(child);
        }
      }
    }

    return result;
  }

  function updateCabinetGapHighlight() {
    var frames = deps.getAllDrawingFrames();
    var i;
    var j;
    var k;

    model.beginUpdate();
    try {
      for (i = 0; i < frames.length; i++) {
        for (j = 0; j < model.getChildCount(frames[i]); j++) {
          var segment = model.getChildAt(frames[i], j);

          if (!deps.isCabinetSegment(segment)) {
            continue;
          }

          for (k = 0; k < model.getChildCount(segment); k++) {
            var child = model.getChildAt(segment, k);

            if (deps.isCabinetGap(child)) {
              var nextStyle = makeCabinetGapStyle(
                isSelectedCabinetGap(
                  deps.getAttr(child, "logicalCabinetId"),
                  deps.getAttr(child, "gapIndex"),
                ),
              );

              if (child.style != nextStyle) {
                model.setStyle(child, nextStyle);
              }
            }
          }
        }
      }
    } finally {
      model.endUpdate();
    }
  }

  function setSelectedCabinetGap(logicalCabinetId, gapIndex) {
    if (
      deps.trim(logicalCabinetId).length == 0 ||
      deps.toInt(gapIndex, -1) < 0
    ) {
      state.selectedCabinetGap = null;
    } else {
      state.selectedCabinetGap = {
        logicalCabinetId: deps.trim(logicalCabinetId),
        gapIndex: deps.toInt(gapIndex, -1),
      };
    }

    updateCabinetGapHighlight();
  }

  function collectCabinetAttachments(segments) {
    var seen = {};
    var attachments = [];
    var i;
    var j;

    for (i = 0; i < segments.length; i++) {
      var segment = segments[i];
      var edgeCount = model.getEdgeCount(segment);

      for (j = 0; j < edgeCount; j++) {
        var edge = model.getEdgeAt(segment, j);
        var sourceTerminal = model.getTerminal(edge, true);
        var targetTerminal = model.getTerminal(edge, false);
        var sourceIsSegment = sourceTerminal == segment;
        var targetIsSegment = targetTerminal == segment;

        if (!sourceIsSegment && !targetIsSegment) {
          continue;
        }

        var key = mxCellPath.create(edge) + ":" + (sourceIsSegment ? "S" : "T");

        if (seen[key]) {
          continue;
        }

        seen[key] = true;

        var source = sourceIsSegment;
        var portId = deps.getEdgePortId(edge, segment, source);
        var port = deps.getPortMetaById(segment, portId);

        if (port == null) {
          continue;
        }

        attachments.push({
          edge,
          source,
          portId,
          oldPortPosition: getPortAbsolutePosition(segment, port),
          otherTerminal: model.getTerminal(edge, !source),
        });
      }
    }

    return attachments;
  }

  function buildCabinetPortMap(segments) {
    var result = {};
    var i;

    for (i = 0; i < segments.length; i++) {
      var segment = segments[i];
      var frame = deps.findDrawingFrame(segment);
      var ports = deps.parsePortLayout(deps.getAttr(segment, "portsJson"));
      var j;

      for (j = 0; j < ports.length; j++) {
        result[deps.trim(ports[j].id)] = {
          segment,
          port: ports[j],
          frame,
          absolutePosition: getPortAbsolutePosition(segment, ports[j]),
        };
      }
    }

    return result;
  }

  function restoreCabinetAttachments(attachments, newPortMap) {
    var movedTerminals = {};
    var i;

    for (i = 0; i < attachments.length; i++) {
      var attachment = attachments[i];
      var target = newPortMap[deps.trim(attachment.portId)];

      if (target == null) {
        continue;
      }

      model.setTerminal(attachment.edge, target.segment, attachment.source);
      deps.setConnectionConstraint(
        attachment.edge,
        target.segment,
        attachment.source,
        new mxConnectionConstraint(
          new mxPoint(target.port.x, target.port.y),
          false,
          target.port.id,
        ),
      );

      var edgeGeometry = model.getGeometry(attachment.edge);

      if (edgeGeometry != null && edgeGeometry.points != null) {
        edgeGeometry = edgeGeometry.clone();
        edgeGeometry.points = null;
        model.setGeometry(attachment.edge, edgeGeometry);
      }

      if (deps.isMovableConnectedTerminal(attachment.otherTerminal)) {
        var moveKey = mxObjectIdentity.get(attachment.otherTerminal);

        if (!movedTerminals[moveKey]) {
          movedTerminals[moveKey] = true;
          deps.moveCellToFrameByDelta(
            attachment.otherTerminal,
            target.frame,
            target.absolutePosition.x - attachment.oldPortPosition.x,
            target.absolutePosition.y - attachment.oldPortPosition.y,
          );
        }
      }
    }
  }

  function findAutoFramesForCabinet(originFrameId, logicalCabinetId) {
    var frames = deps.getAllDrawingFrames();
    var result = [];
    var i;

    for (i = 0; i < frames.length; i++) {
      if (
        deps.trim(deps.getAttr(frames[i], "originFrameId")) ==
          deps.trim(originFrameId) &&
        deps.trim(deps.getAttr(frames[i], "autoFrameOwner")) ==
          deps.trim(logicalCabinetId)
      ) {
        result.push(frames[i]);
      }
    }

    result.sort(function (a, b) {
      return (
        deps.toInt(deps.getAttr(a, "autoFrameIndex"), 0) -
        deps.toInt(deps.getAttr(b, "autoFrameIndex"), 0)
      );
    });

    return result;
  }

  function frameHasOnlyCabinetChildren(frame, logicalCabinetId) {
    var i;

    for (i = 0; i < model.getChildCount(frame); i++) {
      var child = model.getChildAt(frame, i);

      if (deps.getAttr(child, "esKind") == deps.frameLabelKind) {
        continue;
      }

      if (
        deps.isCabinetSegment(child) &&
        deps.trim(deps.getAttr(child, "logicalCabinetId")) ==
          deps.trim(logicalCabinetId)
      ) {
        continue;
      }

      return false;
    }

    return true;
  }

  function ensureCabinetFrames(
    originFrame,
    cabinetModel,
    pageCount,
    skipCleanup,
  ) {
    var originFrameId = deps.trim(deps.getAttr(originFrame, "frameId"));
    var originGroupId = deps.getFrameGroupId(originFrame);
    var logicalCabinetId = deps.trim(cabinetModel.logicalCabinetId);
    var config = deps.getFrameConfig(originFrame);
    var autoFrames = findAutoFramesForCabinet(originFrameId, logicalCabinetId);
    var frames = [originFrame];
    var previousFrame = originFrame;
    var i;

    for (i = 1; i < pageCount; i++) {
      var frame = autoFrames.length >= i ? autoFrames[i - 1] : null;

      if (frame == null) {
        var rightmostInGroup = deps.getRightmostFrameInGroup(originGroupId);
        var rightmostGeometry =
          rightmostInGroup != null ? model.getGeometry(rightmostInGroup) : null;
        frame = deps.createDrawingFrameCell(
          config,
          Math.max(
            deps.getMaxFramePageNumberInGroup(originGroupId),
            deps.getFramePageNumber(previousFrame),
          ) + 1,
          {
            originFrameId,
            groupId: originGroupId,
            autoFrameOwner: logicalCabinetId,
            autoFrameIndex: i,
          },
        );
        frame.geometry = frame.geometry.clone();
        frame.geometry.x = Math.max(
          model.getGeometry(previousFrame).x +
            config.width +
            deps.frameHorizontalGap,
          rightmostGeometry != null
            ? rightmostGeometry.x +
                rightmostGeometry.width +
                deps.frameHorizontalGap
            : model.getGeometry(previousFrame).x +
                config.width +
                deps.frameHorizontalGap,
        );
        frame.geometry.y = model.getGeometry(previousFrame).y;
        deps.addTopLevelCell(frame);
      }

      frames.push(frame);
      previousFrame = frame;
    }

    if (!skipCleanup) {
      for (i = pageCount; i <= autoFrames.length; i++) {
        var extraFrame = autoFrames[i - 1];

        if (
          extraFrame != null &&
          frameHasOnlyCabinetChildren(extraFrame, logicalCabinetId)
        ) {
          model.remove(extraFrame);
        }
      }
    }

    return frames;
  }

  function relayoutCabinetByModel(cabinetModel) {
    var normalized = normalizeCabinetModel(cabinetModel);
    var originFrame = deps.findFrameById(normalized.originFrameId);

    if (originFrame == null) {
      throw new Error("未找到配电柜所属的起始图框");
    }

    var frameConfig = deps.getFrameConfig(originFrame);
    var descriptors = buildCabinetPageDescriptors(normalized, frameConfig);
    var oldSegments = findCabinetSegments(normalized.logicalCabinetId);
    var attachments = collectCabinetAttachments(oldSegments);
    var frames;
    var newSegments = [];
    var i;

    frames = ensureCabinetFrames(
      originFrame,
      normalized,
      descriptors.length,
      true,
    );

    for (i = 0; i < descriptors.length; i++) {
      var segment = buildCabinetSegmentCell(
        normalized,
        deps.trim(deps.getAttr(frames[i], "frameId")),
        descriptors[i],
      );
      model.add(frames[i], segment);
      newSegments.push(segment);
    }

    restoreCabinetAttachments(attachments, buildCabinetPortMap(newSegments));

    for (i = 0; i < oldSegments.length; i++) {
      model.remove(oldSegments[i]);
    }

    ensureCabinetFrames(originFrame, normalized, descriptors.length);
    return newSegments;
  }

  return {
    buildCabinetPageDescriptors,
    buildCabinetPortMap,
    buildCabinetSegmentCell,
    collectCabinetAttachments,
    extractCabinetModel,
    findCabinetSegment,
    findCabinetSegments,
    getCellAbsoluteGeometry,
    getPortAbsolutePosition,
    normalizeCabinetModel,
    relayoutCabinetByModel,
    restoreCabinetAttachments,
    setSelectedCabinetGap,
  };
}
