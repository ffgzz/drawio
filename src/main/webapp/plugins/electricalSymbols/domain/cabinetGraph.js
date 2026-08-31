/**
 * 配电柜 graph 子模块。
 * 负责分页片段 cell 构建、块 cell 生成、附着恢复和重排，是 cabinet 的边缘适配层。
 */
import {
  buildCabinetNameLabel,
  buildCabinetPageDescriptors,
  buildSegmentPortLayout,
  computeSwitchPlacementInBlock,
  insertBlockAfter,
  makeCabinetBlockStyle,
  makeCabinetBusbarStyle,
  makeCabinetDesignationLabelStyle,
  makeCabinetLocationLabelStyle,
  makeCabinetNameLabelStyle,
  makeCabinetRootStyle,
  makeCabinetSwitchLinkStyle,
  normalizeCabinetModel,
  setBlockSwitchBinding,
} from "./cabinetCore.js";
import { getApp } from "../core/appRuntime.js";
import {
  clamp,
  cloneJson,
  isObject,
  toFloat,
  toInt,
  trim,
} from "../utils/base.js";
import { createMetaCell, createNode, getAttr } from "../utils/xml.js";
import {
  generateLogicalCabinetId,
  isCabinetBlock,
  isCabinetGap,
  isCabinetSegment,
  isCabinetSwitchLink,
  isElectricalRoot,
} from "../core/runtimeHelpers.js";
import { connectionConstraintsApi } from "../runtime/connectionConstraints.js";
import { frameDomainApi } from "./frame.js";
import { snapshotDomainApi } from "./snapshot.js";
import { specDomainApi } from "./spec.js";
import { symbolDomainApi } from "./symbol.js";

function buildCabinetDeps() {
  var app = getApp();
  var ctx = app.ctx;
  var constants = ctx.constants;

  return {
    graph: ctx.graph,
    model: ctx.model,
    state: ctx.state,
    cabinetTag: constants.CABINET_TAG,
    cabinetType: constants.CABINET_TYPE,
    cabinetBodyTag: constants.CABINET_BODY_TAG,
    cabinetBodyKind: constants.CABINET_BODY_KIND,
    cabinetBlockTag: constants.CABINET_BLOCK_TAG,
    cabinetBlockKind: constants.CABINET_BLOCK_KIND,
    cabinetBusbarTag: constants.CABINET_BUSBAR_TAG,
    cabinetBusbarKind: constants.CABINET_BUSBAR_KIND,
    cabinetTextTag: constants.CABINET_TEXT_TAG,
    cabinetNameLabelKind: constants.CABINET_NAME_LABEL_KIND,
    cabinetLocationLabelKind: constants.CABINET_LOCATION_LABEL_KIND,
    cabinetDesignationLabelKind: constants.CABINET_DESIGNATION_LABEL_KIND,
    busbarWidth: constants.CABINET_BUSBAR_WIDTH,
    cabinetSwitchLinkTag: constants.CABINET_SWITCH_LINK_TAG,
    cabinetSwitchLinkKind: constants.CABINET_SWITCH_LINK_KIND,
    cabinetGapTag: constants.CABINET_GAP_TAG,
    cabinetGapType: constants.CABINET_GAP_TYPE,
    cabinetGapKind: constants.CABINET_GAP_KIND,
    frameLabelKind: constants.FRAME_LABEL_KIND,
    frameContentRatio: constants.FRAME_CONTENT_RATIO,
    frameMarginRatio: constants.FRAME_MARGIN_RATIO,
    frameHorizontalGap: constants.FRAME_HORIZONTAL_GAP,
    minPortFollowSpaceRatio: constants.CABINET_MIN_PORT_FOLLOW_SPACE_RATIO,
    defaultWidth: constants.CABINET_DEFAULT_WIDTH,
    minWidth: constants.CABINET_MIN_WIDTH,
    defaultBlockCount: constants.CABINET_DEFAULT_BLOCK_COUNT,
    blockMinHeight: constants.CABINET_BLOCK_MIN_HEIGHT,
    blockMaxHeight: constants.CABINET_BLOCK_MAX_HEIGHT,
    defaultX: constants.CABINET_DEFAULT_X,
    tailPadding: constants.CABINET_TAIL_PADDING,
    trim,
    toInt,
    toFloat,
    clamp,
    isObject,
    cloneJson,
    normalizePortPoint: specDomainApi.normalizePortPoint,
    generateLogicalCabinetId,
    createNode,
    createMetaCell,
    serializePortLayout: specDomainApi.serializePortLayout,
    getAttr,
    isCabinetSegment,
    isCabinetBlock,
    isCabinetGap,
    isCabinetSwitchLink,
    isElectricalRoot,
    buildSymbolCell: function (spec) {
      return symbolDomainApi.buildSymbolCell(spec);
    },
    getNormalizedFrameConfig: frameDomainApi.normalizeFrameConfig,
    getAllDrawingFrames: frameDomainApi.getAllDrawingFrames,
    getFrameConfig: frameDomainApi.getFrameConfig,
    getFrameGroupId: frameDomainApi.getFrameGroupId,
    getFramePageNumber: frameDomainApi.getFramePageNumber,
    getMaxFramePageNumberInGroup: frameDomainApi.getMaxFramePageNumberInGroup,
    getRightmostFrameInGroup: frameDomainApi.getRightmostFrameInGroup,
    findFrameById: frameDomainApi.findFrameById,
    findDrawingFrame: frameDomainApi.findDrawingFrame,
    createDrawingFrameCell: frameDomainApi.createDrawingFrameCell,
    addTopLevelCell: frameDomainApi.addTopLevelCell,
    getEdgePortId: function (edge, root, source) {
      return snapshotDomainApi.getEdgePortId(edge, root, source);
    },
    getPortMetaById: connectionConstraintsApi.getPortMetaById,
    getPortLayoutForRoot: connectionConstraintsApi.getPortLayoutForRoot,
    parsePortLayout: specDomainApi.parsePortLayout,
    isMovableConnectedTerminal: connectionConstraintsApi.isMovableConnectedTerminal,
    moveCellToFrameByDelta: connectionConstraintsApi.moveCellToFrameByDelta,
    moveConnectedGroupByDelta:
      connectionConstraintsApi.moveConnectedGroupByDelta,
    setConnectionConstraint: function (edge, root, source, constraint) {
      ctx.graph.setConnectionConstraint(edge, root, source, constraint);
    },
  };
}

export function createCabinetDomain() {
  var deps = arguments.length > 0 ? arguments[0] : buildCabinetDeps();
  var model = deps.model;
  var state = deps.state;

  function getPortsForRoot(cell) {
    return typeof deps.getPortLayoutForRoot == "function"
      ? deps.getPortLayoutForRoot(cell)
      : deps.parsePortLayout(deps.getAttr(cell, "portsJson"));
  }

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

    var segmentPorts = deps.serializePortLayout(buildSegmentPortLayout(descriptor));
    node.setAttribute("portsJson", segmentPorts);
    node.setAttribute("portLayout", segmentPorts);
    node.setAttribute("label", "");
    return node;
  }

  /**
   * 标签样式带 html=1：换行必须用 <br>，尖括号和 & 必须转义。
   */
  function escapeLabelHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  /**
   * 柜内装饰：母线、纵向名称、位置标注、编号。
   * 全部带 esKind，自动继承"不可复制/不可删/不参与图框绑定"的保护。
   */
  function createCabinetDecorationCell(kind, style, geometry, label, tag) {
    var value = deps.createNode(tag || deps.cabinetTextTag);
    value.setAttribute("esKind", kind);
    value.setAttribute("label", label != null ? String(label) : "");
    var cell = new mxCell(value, geometry, style);
    cell.vertex = true;
    cell.setConnectable(false);
    return cell;
  }

  /**
   * 按 descriptor 生成柜内的全部装饰 cell，按绘制顺序返回。
   */
  function buildCabinetDecorations(cabinetModel, descriptor) {
    var cells = [];
    var busbarX = descriptor.busbar.x;

    // 母线
    cells.push(
      createCabinetDecorationCell(
        deps.cabinetBusbarKind,
        makeCabinetBusbarStyle(),
        new mxGeometry(
          busbarX - Math.round(deps.busbarWidth / 2),
          descriptor.busbar.y,
          deps.busbarWidth,
          descriptor.busbar.height,
        ),
        "",
        deps.cabinetBusbarTag,
      ),
    );

    // 纵向名称：摆在左壁与母线之间
    var nameLabel = buildCabinetNameLabel(cabinetModel);

    if (nameLabel.length > 0 && busbarX > 8) {
      cells.push(
        createCabinetDecorationCell(
          deps.cabinetNameLabelKind,
          makeCabinetNameLabelStyle(),
          new mxGeometry(
            0,
            descriptor.busbar.y,
            Math.max(12, busbarX - Math.round(deps.busbarWidth / 2) - 2),
            descriptor.busbar.height,
          ),
          escapeLabelHtml(nameLabel),
        ),
      );
    }

    // 编号：柜内靠上，母线右侧
    var designation = deps.trim(cabinetModel.designation);

    if (designation.length > 0 && cabinetModel.headPadding > 0) {
      cells.push(
        createCabinetDecorationCell(
          deps.cabinetDesignationLabelKind,
          makeCabinetDesignationLabelStyle(),
          new mxGeometry(
            busbarX,
            // 续接页的顶边折断会压到这块区域，编号要整体下移让开它
            (descriptor.topBreakDepth || 0) + 2,
            Math.max(20, descriptor.width - busbarX),
            Math.max(12, cabinetModel.headPadding - 6),
          ),
          escapeLabelHtml(designation),
        ),
      );
    }

    // 位置标注：柜体上方，y 取负值。mxGraph 默认不裁剪子节点，这些 cell 又是
    // 直接 insert 进去的，不走 constrainChild，所以负坐标是安全的。
    if (descriptor.showLocation) {
      var lines = [];

      if (deps.trim(cabinetModel.locationNote).length > 0) {
        lines.push(deps.trim(cabinetModel.locationNote));
      }

      if (deps.trim(cabinetModel.location).length > 0) {
        lines.push(deps.trim(cabinetModel.location));
      }

      if (lines.length > 0) {
        var lineHeight = 14;
        var boxHeight = lines.length * lineHeight;
        var li;

        for (li = 0; li < lines.length; li++) {
          lines[li] = escapeLabelHtml(lines[li]);
        }

        cells.push(
          createCabinetDecorationCell(
            deps.cabinetLocationLabelKind,
            makeCabinetLocationLabelStyle(),
            new mxGeometry(0, -(boxHeight + 6), Math.max(80, descriptor.width), boxHeight),
            lines.join("<br>"),
          ),
        );
      }
    }

    return cells;
  }

  /**
   * 一个可独立调高的矩形块。块自己是端口宿主：右边缘垂直居中一个出线端口。
   * 跨页续接的首块/末块改用带缺口的 SVG 描边。
   */
  function createCabinetBlockCell(cabinetModel, block) {
    var value = deps.createNode(deps.cabinetBlockTag);
    value.setAttribute("esKind", deps.cabinetBlockKind);
    value.setAttribute("esKey", deps.trim(block.id));
    value.setAttribute("blockId", deps.trim(block.id));
    value.setAttribute("portId", deps.trim(block.portId));
    value.setAttribute(
      "logicalCabinetId",
      deps.trim(cabinetModel.logicalCabinetId),
    );
    value.setAttribute("switchInstanceId", deps.trim(block.switchInstanceId));
    value.setAttribute("switchSymbolId", deps.trim(block.switchSymbolId));
    value.setAttribute("blockOrder", String(block.order));
    value.setAttribute("blockHeight", String(Math.round(block.height)));
    value.setAttribute("portOffsetY", String(block.portOffsetY || 0));
    value.setAttribute("label", deps.trim(block.title));
    value.setAttribute(
      "portsJson",
      JSON.stringify([
        {
          // 出线接口在母线上，不在柜壁上
          id: block.portId,
          x: block.portX,
          y:
            block.height > 0
              ? 0.5 + Number(block.portOffsetY || 0) / block.height
              : 0.5,
          marker: "cross",
          direction: "right",
          ioMode: "out",
          order: block.order,
        },
      ]),
    );

    var cell = new mxCell(
      value,
      new mxGeometry(0, block.localY, block.width, block.height),
      makeCabinetBlockStyle(),
    );

    cell.vertex = true;
    cell.setConnectable(true);
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
      // 柜段本身就是外框（含换页折断标识）
      makeCabinetRootStyle(descriptor),
    );
    var decorations = buildCabinetDecorations(cabinetModel, descriptor);
    var i;

    root.vertex = true;
    root.setConnectable(true);

    // 柜段本身是唯一的端口宿主。blocks 只保留在 cabinetModelJson
    // 里作为回路布局数据，不再物化成 mxCell。
    for (i = 0; i < decorations.length; i++) {
      root.insert(decorations[i]);
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

    var frame = deps.findDrawingFrame(root);

    return normalizeCabinetModel(
      JSON.parse(raw),
      frame != null ? deps.getFrameConfig(frame) : null,
    );
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

  /**
   * 列出一个柜段下面的所有块，按纵向顺序。
   */
  function getSegmentBlocks(segment) {
    var result = [];
    var count = model.getChildCount(segment);
    var i;

    // 新图不再创建块 cell；这里只保留对过渡期旧 XML 的读取能力。
    for (i = 0; i < count; i++) {
      var child = model.getChildAt(segment, i);

      if (deps.isCabinetBlock(child)) {
        result.push(child);
      }
    }

    return result;
  }

  function collectCabinetAttachments(segments) {
    var seen = {};
    var attachments = [];
    var i;
    var j;

    for (i = 0; i < segments.length; i++) {
      var host = segments[i];
      var edgeCount = model.getEdgeCount(host);

      for (j = 0; j < edgeCount; j++) {
          var edge = model.getEdgeAt(host, j);
          var sourceIsHost = model.getTerminal(edge, true) == host;
          var targetIsHost = model.getTerminal(edge, false) == host;

          if (!sourceIsHost && !targetIsHost) {
            continue;
          }

          var key = mxCellPath.create(edge) + ":" + (sourceIsHost ? "S" : "T");

          if (seen[key]) {
            continue;
          }

          seen[key] = true;

          var source = sourceIsHost;
          var portId = deps.getEdgePortId(edge, host, source);
          var port = deps.getPortMetaById(host, portId);

          if (port == null) {
            continue;
          }

          attachments.push({
            edge,
            source,
            portId,
            oldPortPosition: getPortAbsolutePosition(host, port),
            otherTerminal: model.getTerminal(edge, !source),
          });
      }
    }

    return attachments;
  }

  function buildCabinetPortMap(segments) {
    var result = {};
    var i;
    var j;

    for (i = 0; i < segments.length; i++) {
      var segment = segments[i];
      var frame = deps.findDrawingFrame(segment);
      var ports = getPortsForRoot(segment);

      for (j = 0; j < ports.length; j++) {
          result[deps.trim(ports[j].id)] = {
            segment,
            host: segment,
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

      model.setTerminal(attachment.edge, target.host, attachment.source);
      deps.setConnectionConstraint(
        attachment.edge,
        target.host,
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
          var deltaX =
            target.absolutePosition.x - attachment.oldPortPosition.x;
          var deltaY =
            target.absolutePosition.y - attachment.oldPortPosition.y;
          var movedGroup =
            typeof deps.moveConnectedGroupByDelta == "function"
              ? deps.moveConnectedGroupByDelta(
                  attachment.otherTerminal,
                  target.frame,
                  deltaX,
                  deltaY,
                )
              : null;

          if (
            movedGroup != null &&
            Array.isArray(movedGroup.vertices) &&
            movedGroup.vertices.length > 0
          ) {
            var movedIndex;

            for (
              movedIndex = 0;
              movedIndex < movedGroup.vertices.length;
              movedIndex++
            ) {
              movedTerminals[
                mxObjectIdentity.get(movedGroup.vertices[movedIndex])
              ] = true;
            }
          } else {
            // 兼容注入旧 deps 的测试/宿主。
            if (typeof deps.moveCellToFrameByDelta == "function") {
              deps.moveCellToFrameByDelta(
                attachment.otherTerminal,
                target.frame,
                deltaX,
                deltaY,
              );
            }
            movedTerminals[moveKey] = true;
          }
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
    var probe = normalizeCabinetModel(cabinetModel);
    var originFrame = deps.findFrameById(probe.originFrameId);

    if (originFrame == null) {
      throw new Error("未找到配电柜所属的起始图框");
    }

    // 归一化要用真实图框尺寸再走一遍：旧模型迁移成块高时依赖页面可用高度
    var frameConfig = deps.getFrameConfig(originFrame);
    var normalized = normalizeCabinetModel(cabinetModel, frameConfig);
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

    // 开关与柜体平级，不会被重排销毁，但要显式跟着新的块位置走
    syncBoundSwitches(newSegments);

    return newSegments;
  }

  // ─── 开关绑定 ─────────────────────────────────────────────────────────
  //
  // 开关是画在图框上的普通图元，与柜段平级，只是位置由柜体控制。
  // 这样柜体每次销毁重建时开关根本不参与，它和下游之间的连线零风险。
  // 代价是柜体动的时候要显式把开关带着走，收口在 syncBoundSwitches 里。

  /**
   * 按 instanceId 找已经画在图上的开关图元。
   */
  function findSwitchCellByInstanceId(instanceId) {
    var target = deps.trim(instanceId);

    if (target.length == 0) {
      return null;
    }

    var frames = deps.getAllDrawingFrames();
    var i;
    var j;

    for (i = 0; i < frames.length; i++) {
      for (j = 0; j < model.getChildCount(frames[i]); j++) {
        var child = model.getChildAt(frames[i], j);

        if (
          deps.isElectricalRoot(child) &&
          deps.trim(deps.getAttr(child, "instanceId")) == target
        ) {
          return child;
        }
      }
    }

    return null;
  }

  /**
   * 已绑定开关的位置和生命周期必须由 CabinetModel 管理。
   * 先走托管连线快速路径，再扫描块属性，这样即使连线暂时缺失，
   * 也不会让用户直接拖动或删除一个仍被模型引用的开关。
   */
  function findBoundCabinetBlockForSwitch(switchCell) {
    if (switchCell == null || !deps.isElectricalRoot(switchCell)) {
      return null;
    }

    var edgeCount = model.getEdgeCount(switchCell);
    var i;

    for (i = 0; i < edgeCount; i++) {
      var edge = model.getEdgeAt(switchCell, i);

      if (!deps.isCabinetSwitchLink(edge)) {
        continue;
      }

      var source = model.getTerminal(edge, true);
      var target = model.getTerminal(edge, false);
      var other = source == switchCell ? target : source;

      if (deps.isCabinetBlock(other) || deps.isCabinetSegment(other)) {
        return other;
      }
    }

    var instanceId = deps.trim(deps.getAttr(switchCell, "instanceId"));
    var key;

    if (instanceId.length == 0) {
      return null;
    }

    var frames = deps.getAllDrawingFrames();
    var i;
    var j;

    for (i = 0; i < frames.length; i++) {
      for (j = 0; j < model.getChildCount(frames[i]); j++) {
        var segment = model.getChildAt(frames[i], j);

        if (!deps.isCabinetSegment(segment)) {
          continue;
        }

        var cabinetModel = extractCabinetModel(segment);
        var blockIndex;

        for (blockIndex = 0; blockIndex < cabinetModel.blocks.length; blockIndex++) {
          if (
            deps.trim(cabinetModel.blocks[blockIndex].switchInstanceId) == instanceId
          ) {
            return segment;
          }
        }
      }
    }

    return null;
  }

  function isSwitchBoundToCabinet(switchCell) {
    return findBoundCabinetBlockForSwitch(switchCell) != null;
  }

  /**
   * 开关的输入端子：端口布局里第一个 ioMode 为 in 的端口；
   * 没有明确输入端子时退回最靠左的端口。
   */
  function findSwitchInputPort(switchCell) {
    var ports = deps.parsePortLayout(deps.getAttr(switchCell, "portsJson"));
    var fallback = null;
    var i;

    for (i = 0; i < ports.length; i++) {
      if (deps.trim(ports[i].ioMode) == "in") {
        return ports[i];
      }

      if (fallback == null || ports[i].x < fallback.x) {
        fallback = ports[i];
      }
    }

    return fallback;
  }

  /**
   * 把开关摆到块内：右边缘贴块的右边界，垂直居中。
   * 同时保证开关排在柜段之后，不会被柜体盖住。
   */
  function getDescriptorForSegment(segment) {
    var frame = deps.findDrawingFrame(segment);

    if (frame == null) {
      return null;
    }

    var descriptors = buildCabinetPageDescriptors(
      extractCabinetModel(segment),
      deps.getFrameConfig(frame),
    );
    var index = deps.toInt(deps.getAttr(segment, "segmentIndex"), 0);
    return descriptors[index] || null;
  }

  function findBlockByPortId(cabinetModel, portId) {
    var target = deps.trim(portId);
    var i;

    for (i = 0; i < cabinetModel.blocks.length; i++) {
      if (deps.trim(cabinetModel.blocks[i].portId) == target) {
        return cabinetModel.blocks[i];
      }
    }

    return null;
  }

  function placeSwitchInBlock(segment, descriptorBlock, switchCell) {
    var frame = deps.findDrawingFrame(segment);

    if (frame == null || descriptorBlock == null) {
      return;
    }

    var segmentRect = getCellAbsoluteGeometry(segment);
    var blockRect = {
      x: segmentRect.x,
      y: segmentRect.y + descriptorBlock.localY,
      width: descriptorBlock.width,
      height: descriptorBlock.height,
    };
    var switchGeometry = model.getGeometry(switchCell);

    if (switchGeometry == null) {
      return;
    }

    var cabinetModel = extractCabinetModel(segment);
    var busbarX = Math.round(blockRect.width * cabinetModel.busbarRatio);
    var inputPort = findSwitchInputPort(switchCell);
    var segmentPort = deps.getPortMetaById(segment, descriptorBlock.portId);
    var targetPortYRatio =
      segmentPort != null && blockRect.height > 0
        ? (segmentRect.y + segmentPort.y * segmentRect.height - blockRect.y) /
          blockRect.height
        : 0.5;
    var placement = computeSwitchPlacementInBlock(
      blockRect,
      { width: switchGeometry.width, height: switchGeometry.height },
      {
        busbarX: busbarX,
        switchLead: cabinetModel.switchLead,
        inputPortYRatio: inputPort != null ? Number(inputPort.y) : 0.5,
        targetPortYRatio,
      },
    );
    var frameRect = getCellAbsoluteGeometry(frame);
    var nextGeometry = switchGeometry.clone();

    nextGeometry.x = blockRect.x + placement.x - frameRect.x;
    nextGeometry.y = blockRect.y + placement.y - frameRect.y;
    nextGeometry.width = placement.width;
    nextGeometry.height = placement.height;

    if (model.getParent(switchCell) !== frame) {
      model.add(frame, switchCell);
    }

    model.setGeometry(switchCell, nextGeometry);
    ensureSwitchAboveCabinet(frame, switchCell);
  }

  /**
   * 开关与柜段同为图框的子节点，谁压谁只看子节点顺序。
   * 重排会把新柜段追加到末尾，所以之后必须把开关重新排到柜段后面。
   */
  function ensureSwitchAboveCabinet(frame, switchCell) {
    var count = model.getChildCount(frame);
    var lastSegmentIndex = -1;
    var switchIndex = -1;
    var i;

    for (i = 0; i < count; i++) {
      var child = model.getChildAt(frame, i);

      if (deps.isCabinetSegment(child)) {
        lastSegmentIndex = i;
      } else if (child === switchCell) {
        switchIndex = i;
      }
    }

    if (switchIndex >= 0 && switchIndex < lastSegmentIndex) {
      model.add(frame, switchCell);
    }
  }

  /**
   * 找到挂在某个块上的托管连线。
   */
  function findSwitchLink(segment, portId) {
    var edgeCount = model.getEdgeCount(segment);
    var i;

    for (i = 0; i < edgeCount; i++) {
      var edge = model.getEdgeAt(segment, i);

      if (
        deps.isCabinetSwitchLink(edge) &&
        model.getTerminal(edge, true) == segment &&
        deps.trim(deps.getEdgePortId(edge, segment, true)) == deps.trim(portId)
      ) {
        return edge;
      }
    }

    return null;
  }

  /**
   * 建立（或修复）块与开关之间的托管连线。不绘制，只为拓扑完整。
   */
  function ensureSwitchLink(segment, descriptorBlock, switchCell) {
    var frame = deps.findDrawingFrame(segment);

    if (frame == null || descriptorBlock == null || switchCell == null) {
      return null;
    }

    var blockPortId = deps.trim(descriptorBlock.portId);
    var blockPort = deps.getPortMetaById(segment, blockPortId);
    var switchPort = findSwitchInputPort(switchCell);
    var edge = findSwitchLink(segment, blockPortId);

    if (edge == null) {
      var value = deps.createNode(deps.cabinetSwitchLinkTag);
      value.setAttribute("esKind", deps.cabinetSwitchLinkKind);
      value.setAttribute("label", "");
      edge = new mxCell(value, new mxGeometry(), makeCabinetSwitchLinkStyle());
      edge.edge = true;
      model.add(frame, edge);
    }

    if (
      edge.value == null ||
      typeof edge.value.setAttribute != "function"
    ) {
      edge.value = deps.createNode(deps.cabinetSwitchLinkTag);
    }

    if (model.getParent(edge) !== frame) {
      model.add(frame, edge);
    }

    model.setStyle(edge, makeCabinetSwitchLinkStyle());

    edge.value.setAttribute("esKind", deps.cabinetSwitchLinkKind);
    edge.value.setAttribute("label", "");
    edge.value.setAttribute("blockId", deps.trim(descriptorBlock.id));
    edge.value.setAttribute(
      "logicalCabinetId",
      deps.trim(deps.getAttr(segment, "logicalCabinetId")),
    );
    edge.value.setAttribute(
      "switchInstanceId",
      deps.trim(deps.getAttr(switchCell, "instanceId")),
    );

    model.setTerminal(edge, segment, true);
    model.setTerminal(edge, switchCell, false);

    if (blockPort != null) {
      deps.setConnectionConstraint(
        edge,
        segment,
        true,
        new mxConnectionConstraint(
          new mxPoint(blockPort.x, blockPort.y),
          false,
          blockPortId,
        ),
      );
    }

    if (switchPort != null) {
      deps.setConnectionConstraint(
        edge,
        switchCell,
        false,
        new mxConnectionConstraint(
          new mxPoint(switchPort.x, switchPort.y),
          false,
          deps.trim(switchPort.id),
        ),
      );
    }

    return edge;
  }

  /**
   * 重排之后把所有已绑定的开关重新摆位、重新排 z 序、修复托管连线。
   * 这是"开关与柜体平级"这条设计唯一需要显式维护的地方。
   */
  function syncBoundSwitches(segments) {
    var logicalCabinetIds = {};
    var retainedLinks = {};
    var i;
    var j;

    for (i = 0; i < segments.length; i++) {
      var logicalCabinetId = deps.trim(
        deps.getAttr(segments[i], "logicalCabinetId"),
      );

      if (logicalCabinetId.length > 0) {
        logicalCabinetIds[logicalCabinetId] = true;
      }
      var descriptor = getDescriptorForSegment(segments[i]);
      var blocks = descriptor != null ? descriptor.blocks : [];

      for (j = 0; j < blocks.length; j++) {
        var descriptorBlock = blocks[j];
        var instanceId = deps.trim(descriptorBlock.switchInstanceId);

        if (instanceId.length == 0) {
          continue;
        }

        var switchCell = findSwitchCellByInstanceId(instanceId);

        if (switchCell == null) {
          continue;
        }

        placeSwitchInBlock(segments[i], descriptorBlock, switchCell);
        var link = ensureSwitchLink(segments[i], descriptorBlock, switchCell);

        if (link != null) {
          retainedLinks[mxObjectIdentity.get(link)] = true;
        }
      }
    }

    // 同一个 block 只允许一条托管连线。快照、旧 XML 或中途失败都可能
    // 留下 segment→switch 旧连线或重复连线，在这个统一收口一并清理。
    var staleLinks = [];
    var key;

    var allCells = model.cells || {};

    for (key in allCells) {
      if (!Object.prototype.hasOwnProperty.call(allCells, key)) {
        continue;
      }

      var candidate = allCells[key];

      if (!deps.isCabinetSwitchLink(candidate)) {
        continue;
      }

      var sourceTerminal = model.getTerminal(candidate, true);
      var candidateLogicalId = deps.trim(
        deps.getAttr(candidate, "logicalCabinetId"),
      );

      if (
        candidateLogicalId.length == 0 &&
        (deps.isCabinetBlock(sourceTerminal) ||
          deps.isCabinetSegment(sourceTerminal))
      ) {
        candidateLogicalId = deps.trim(
          deps.getAttr(sourceTerminal, "logicalCabinetId"),
        );
      }

      if (
        logicalCabinetIds[candidateLogicalId] &&
        !retainedLinks[mxObjectIdentity.get(candidate)]
      ) {
        staleLinks.push(candidate);
      }
    }

    for (i = 0; i < staleLinks.length; i++) {
      model.remove(staleLinks[i]);
    }
  }

  /**
   * 快照恢复会先建柜体、再建开关、最后建边。因此必须在恢复末尾
   * 再做一次 reconcile，才能补齐缺失连线、修正端点并清掉重复连线。
   */
  function reconcileCabinetSwitchLinks() {
    var segments = [];
    var key;
    var allCells = model.cells || {};

    for (key in allCells) {
      if (
        Object.prototype.hasOwnProperty.call(allCells, key) &&
        deps.isCabinetSegment(allCells[key])
      ) {
        segments.push(allCells[key]);
      }
    }

    syncBoundSwitches(segments);
    return segments;
  }

  /**
   * 给块绑定一个开关：按模板建实例、摆位、连托管线、写回模型并重排。
   *
   * @param {Object} blockCell 目标块
   * @param {Object} spec      已经 buildInstanceSpec 过的图元 spec
   * @returns {Object|null} {segments, switchCell}；块不属于配电柜时返回 null
   */
  function bindSwitchToBlock(blockCell, spec) {
    var segment = findCabinetSegment(blockCell);
    var frame = deps.findDrawingFrame(blockCell);

    if (segment == null || frame == null || spec == null) {
      return null;
    }

    var blockId = deps.trim(deps.getAttr(blockCell, "blockId"));
    var nextModel = setBlockSwitchBinding(extractCabinetModel(segment), blockId, {
      instanceId: deps.trim(spec.instanceId),
      symbolId: deps.trim(spec.symbolId),
    });

    if (nextModel == null) {
      return null;
    }

    // 先摘掉旧开关，再放新的：更换开关时不留孤儿
    unbindSwitchFromBlock(blockCell, true, true);

    var switchCell = deps.buildSymbolCell(spec);
    model.add(frame, switchCell);
    placeSwitchInBlock(blockCell, switchCell);

    var segments = relayoutCabinetByModel(nextModel);

    return { segments: segments, switchCell: switchCell };
  }

  /**
   * 解除绑定。
   *
   * @param {Object}  blockCell     目标块
   * @param {boolean} removeSwitch  是否连开关图元一起删掉
   * @param {boolean} skipRelayout  内部换绑时用：跳过重排，由调用方统一收尾
   */
  function unbindSwitchFromBlock(blockCell, removeSwitch, skipRelayout) {
    var segment = findCabinetSegment(blockCell);

    if (segment == null) {
      return null;
    }

    var instanceId = deps.trim(deps.getAttr(blockCell, "switchInstanceId"));
    var link = findSwitchLink(blockCell);

    if (link != null) {
      model.remove(link);
    }

    if (removeSwitch && instanceId.length > 0) {
      var switchCell = findSwitchCellByInstanceId(instanceId);

      if (switchCell != null) {
        model.remove(switchCell);
      }
    }

    if (skipRelayout) {
      return null;
    }

    var blockId = deps.trim(deps.getAttr(blockCell, "blockId"));
    var nextModel = setBlockSwitchBinding(extractCabinetModel(segment), blockId, null);

    return nextModel != null ? relayoutCabinetByModel(nextModel) : null;
  }

  function unbindSwitchFromCabinetSwitch(
    segment,
    switchCell,
    removeSwitch,
    skipRelayout,
  ) {
    if (!deps.isCabinetSegment(segment) || switchCell == null) {
      return null;
    }

    var instanceId = deps.trim(deps.getAttr(switchCell, "instanceId"));
    var cabinetModel = extractCabinetModel(segment);
    var block = null;
    var i;

    for (i = 0; i < cabinetModel.blocks.length; i++) {
      if (deps.trim(cabinetModel.blocks[i].switchInstanceId) == instanceId) {
        block = cabinetModel.blocks[i];
        break;
      }
    }

    if (block == null) {
      return null;
    }

    var link = findSwitchLink(segment, block.portId);

    if (link != null) {
      model.remove(link);
    }

    if (removeSwitch) {
      model.remove(switchCell);
    }

    var nextModel = setBlockSwitchBinding(cabinetModel, block.id, null);
    return !skipRelayout && nextModel != null
      ? relayoutCabinetByModel(nextModel)
      : nextModel;
  }

  /**
   * 在指定块的下方插入一个新块（连带一个新的出线端口）。
   *
   * 这是"改配电柜属性"的操作，会走完整的重排 + 变更记录链路。
   *
   * @param {Object} blockCell 参照块，新块插在它下面
   * @param {Object} [blockInit] 新块的初始属性（title / height / params）
   * @returns {Array|null} 重排后的柜段；参照块不属于任何配电柜时返回 null
   */
  function insertCabinetBlockAfter(blockCell, blockInit) {
    var segment = findCabinetSegment(blockCell);

    if (segment == null) {
      return null;
    }

    var nextModel = insertBlockAfter(
      extractCabinetModel(segment),
      deps.getAttr(blockCell, "blockId"),
      blockInit,
    );

    if (nextModel == null) {
      return null;
    }

    return relayoutCabinetByModel(nextModel);
  }

  function cloneCellElementValue(cell) {
    var value = cell != null ? cell.value : null;

    return value != null && typeof value.cloneNode == "function"
      ? value.cloneNode(true)
      : value;
  }

  function setCellElementAttributes(cell, attributes) {
    var value = cloneCellElementValue(cell);
    var key;

    if (value == null || typeof value.setAttribute != "function") {
      return;
    }

    for (key in attributes) {
      if (Object.prototype.hasOwnProperty.call(attributes, key)) {
        value.setAttribute(key, String(attributes[key]));
      }
    }

    model.setValue(cell, value);
  }

  function findDescriptorBlock(descriptor, blockId) {
    var blocks = descriptor != null ? descriptor.blocks : null;
    var i;

    if (!Array.isArray(blocks)) {
      return null;
    }

    for (i = 0; i < blocks.length; i++) {
      if (deps.trim(blocks[i].id) == deps.trim(blockId)) {
        return blocks[i];
      }
    }

    return null;
  }

  /**
   * 把柜体一个出线端口与它后面的整条回路一起纵向平移。
   *
   * 这不是柜块重排：块的 geometry / height 不变，其他块和其他回路
   * 都不动，因此允许回路互相覆盖。唯一持久化的布局量是模型中的
   * block.portOffsetY，快照重开后仍能复原。
   *
   * @returns {Object|null} {deltaY, blockCell, switchCell, movedGroup}
   */
  function moveCabinetPortByDelta(blockCell, deltaY) {
    var segment = findCabinetSegment(blockCell);
    var requestedDelta = Number(deltaY);

    if (
      segment == null ||
      !deps.isCabinetBlock(blockCell) ||
      !isFinite(requestedDelta) ||
      Math.abs(requestedDelta) < 0.0001
    ) {
      return null;
    }

    var blockPorts = getPortsForRoot(blockCell);
    var blockPort = blockPorts.length > 0 ? blockPorts[0] : null;
    var frame = deps.findDrawingFrame(segment);

    if (blockPort == null || frame == null) {
      return null;
    }

    var segmentRect = getCellAbsoluteGeometry(segment);
    var currentPortPosition = getPortAbsolutePosition(blockCell, blockPort);
    var verticalInset = Math.min(2, Math.max(0, segmentRect.height / 2));
    var boundedPortY = deps.clamp(
      currentPortPosition.y + requestedDelta,
      segmentRect.y + verticalInset,
      segmentRect.y + segmentRect.height - verticalInset,
    );
    var boundedDelta = boundedPortY - currentPortPosition.y;

    if (Math.abs(boundedDelta) < 0.0001) {
      return {
        deltaY: 0,
        blockCell,
        switchCell: null,
        movedGroup: null,
      };
    }

    var switchInstanceId = deps.trim(
      deps.getAttr(blockCell, "switchInstanceId"),
    );
    var switchCell = findSwitchCellByInstanceId(switchInstanceId);
    var movedGroup = null;
    var actualDelta = boundedDelta;
    var cabinetModel;
    var logicalCabinetId;
    var blockId = deps.trim(deps.getAttr(blockCell, "blockId"));
    var descriptors;
    var segments;
    var targetModelBlock = null;
    var targetDescriptorBlock = null;
    var i;
    var j;

    model.beginUpdate();

    try {
      if (
        switchCell != null &&
        typeof deps.moveConnectedGroupByDelta == "function"
      ) {
        movedGroup = deps.moveConnectedGroupByDelta(
          switchCell,
          frame,
          0,
          boundedDelta,
          { lockX: true },
        );

        if (movedGroup != null && movedGroup.delta != null) {
          actualDelta = Number(movedGroup.delta.y) || 0;
        }
      }

      if (Math.abs(actualDelta) < 0.0001) {
        return {
          deltaY: 0,
          blockCell,
          switchCell,
          movedGroup,
        };
      }

      cabinetModel = extractCabinetModel(segment);
      logicalCabinetId = deps.trim(cabinetModel.logicalCabinetId);

      for (i = 0; i < cabinetModel.blocks.length; i++) {
        if (deps.trim(cabinetModel.blocks[i].id) == blockId) {
          targetModelBlock = cabinetModel.blocks[i];
          targetModelBlock.portOffsetY =
            Number(targetModelBlock.portOffsetY || 0) + actualDelta;
          break;
        }
      }

      if (targetModelBlock == null) {
        return null;
      }

      descriptors = buildCabinetPageDescriptors(
        cabinetModel,
        deps.getFrameConfig(frame),
      );
      segments = findCabinetSegments(logicalCabinetId);

      for (i = 0; i < segments.length; i++) {
        var segmentIndex = deps.toInt(
          deps.getAttr(segments[i], "segmentIndex"),
          i,
        );
        var descriptor = descriptors[segmentIndex];

        if (descriptor == null) {
          continue;
        }

        var serializedSegmentPorts = deps.serializePortLayout(
          buildSegmentPortLayout(descriptor),
        );

        setCellElementAttributes(segments[i], {
          cabinetModelJson: JSON.stringify(cabinetModel),
          portsJson: serializedSegmentPorts,
          portLayout: serializedSegmentPorts,
        });

        var segmentBlocks = getSegmentBlocks(segments[i]);

        for (j = 0; j < segmentBlocks.length; j++) {
          if (deps.trim(deps.getAttr(segmentBlocks[j], "blockId")) != blockId) {
            continue;
          }

          targetDescriptorBlock = findDescriptorBlock(descriptor, blockId);

          if (targetDescriptorBlock == null) {
            continue;
          }

          var blockGeometry = model.getGeometry(segmentBlocks[j]);
          var displayHeight =
            blockGeometry != null && blockGeometry.height > 0
              ? blockGeometry.height
              : targetDescriptorBlock.height;
          var serializedBlockPorts = JSON.stringify([
            {
              id: targetDescriptorBlock.portId,
              x: targetDescriptorBlock.portX,
              y:
                displayHeight > 0
                  ? 0.5 + targetModelBlock.portOffsetY / displayHeight
                  : 0.5,
              marker: "cross",
              direction: "right",
              ioMode: "out",
              order: targetDescriptorBlock.order,
            },
          ]);

          setCellElementAttributes(segmentBlocks[j], {
            portOffsetY: targetModelBlock.portOffsetY,
            portsJson: serializedBlockPorts,
          });
        }
      }

      // 块 cell 本身没有重建，所以原指针仍有效。把托管边的源端
      // 约束更新到新端口，并清掉历史折点，保证支线仍是直线。
      blockPorts = getPortsForRoot(blockCell);
      blockPort = blockPorts.length > 0 ? blockPorts[0] : null;
      var link = findSwitchLink(blockCell);

      if (link != null && blockPort != null) {
        deps.setConnectionConstraint(
          link,
          blockCell,
          true,
          new mxConnectionConstraint(
            new mxPoint(blockPort.x, blockPort.y),
            false,
            blockPort.id,
          ),
        );

        var linkGeometry = model.getGeometry(link);

        if (linkGeometry != null && linkGeometry.points != null) {
          linkGeometry = linkGeometry.clone();
          linkGeometry.points = null;
          model.setGeometry(link, linkGeometry);
        }
      }
    } finally {
      model.endUpdate();
    }

    return {
      deltaY: actualDelta,
      blockCell,
      switchCell,
      movedGroup,
    };
  }

  /** Segment-hosted variant used by the current canvas model. */
  function moveCabinetSegmentPortByDelta(segment, portId, deltaY) {
    var requestedDelta = Number(deltaY);
    var frame = deps.findDrawingFrame(segment);
    var port = deps.getPortMetaById(segment, portId);

    if (
      !deps.isCabinetSegment(segment) ||
      frame == null ||
      port == null ||
      !isFinite(requestedDelta) ||
      Math.abs(requestedDelta) < 0.0001
    ) {
      return null;
    }

    var segmentRect = getCellAbsoluteGeometry(segment);
    var currentPosition = getPortAbsolutePosition(segment, port);
    var nextAbsoluteY = deps.clamp(
      currentPosition.y + requestedDelta,
      segmentRect.y + Math.min(2, segmentRect.height / 2),
      segmentRect.y + segmentRect.height - Math.min(2, segmentRect.height / 2),
    );
    var boundedDelta = nextAbsoluteY - currentPosition.y;
    var cabinetModel = extractCabinetModel(segment);
    var modelBlock = findBlockByPortId(cabinetModel, portId);

    if (modelBlock == null || Math.abs(boundedDelta) < 0.0001) {
      return { deltaY: 0, segment, portId, switchCell: null, movedGroup: null };
    }

    var switchCell = findSwitchCellByInstanceId(modelBlock.switchInstanceId);
    var directTerminal = switchCell;
    var edgeCount = model.getEdgeCount(segment);
    var i;

    if (directTerminal == null) {
      for (i = 0; i < edgeCount; i++) {
        var candidateEdge = model.getEdgeAt(segment, i);
        var candidateSource = model.getTerminal(candidateEdge, true) == segment;

        if (
          deps.trim(deps.getEdgePortId(candidateEdge, segment, candidateSource)) ==
          deps.trim(portId)
        ) {
          directTerminal = model.getTerminal(candidateEdge, !candidateSource);
          break;
        }
      }
    }

    var movedGroup = null;
    var actualDelta = boundedDelta;
    model.beginUpdate();

    try {
      if (
        directTerminal != null &&
        typeof deps.moveConnectedGroupByDelta == "function"
      ) {
        movedGroup = deps.moveConnectedGroupByDelta(
          directTerminal,
          frame,
          0,
          boundedDelta,
          { lockX: true },
        );

        if (movedGroup != null && movedGroup.delta != null) {
          actualDelta = Number(movedGroup.delta.y) || 0;
        }
      }

      if (Math.abs(actualDelta) < 0.0001) {
        return { deltaY: 0, segment, portId, switchCell, movedGroup };
      }

      modelBlock.portOffsetY = Number(modelBlock.portOffsetY || 0) + actualDelta;
      var descriptors = buildCabinetPageDescriptors(
        cabinetModel,
        deps.getFrameConfig(frame),
      );
      var segments = findCabinetSegments(cabinetModel.logicalCabinetId);

      for (i = 0; i < segments.length; i++) {
        var descriptor = descriptors[
          deps.toInt(deps.getAttr(segments[i], "segmentIndex"), i)
        ];

        if (descriptor == null) {
          continue;
        }

        var serializedPorts = deps.serializePortLayout(
          buildSegmentPortLayout(descriptor),
        );
        setCellElementAttributes(segments[i], {
          cabinetModelJson: JSON.stringify(cabinetModel),
          portsJson: serializedPorts,
          portLayout: serializedPorts,
        });

        var refreshedPort = deps.getPortMetaById(segments[i], portId);
        var refreshedEdgeCount = model.getEdgeCount(segments[i]);
        var edgeIndex;

        if (refreshedPort == null) {
          continue;
        }

        for (edgeIndex = 0; edgeIndex < refreshedEdgeCount; edgeIndex++) {
          var edge = model.getEdgeAt(segments[i], edgeIndex);
          var source = model.getTerminal(edge, true) == segments[i];

          if (
            deps.trim(deps.getEdgePortId(edge, segments[i], source)) !=
            deps.trim(portId)
          ) {
            continue;
          }

          deps.setConnectionConstraint(
            edge,
            segments[i],
            source,
            new mxConnectionConstraint(
              new mxPoint(refreshedPort.x, refreshedPort.y),
              false,
              refreshedPort.id,
            ),
          );
          var edgeGeometry = model.getGeometry(edge);

          if (edgeGeometry != null && edgeGeometry.points != null) {
            edgeGeometry = edgeGeometry.clone();
            edgeGeometry.points = null;
            model.setGeometry(edge, edgeGeometry);
          }
        }
      }
    } finally {
      model.endUpdate();
    }

    return { deltaY: actualDelta, segment, portId, switchCell, movedGroup };
  }

  /**
   * 把某一块的新高度写回模型并重排。
   * 模型是唯一真相：拖拽只是提出一个新高度，实际几何由重排决定。
   *
   * @returns {Array|null} 重排后的柜段；未命中该块时返回 null
   */
  function applyCabinetBlockHeight(blockCell, height) {
    var segment = findCabinetSegment(blockCell);

    if (segment == null) {
      return null;
    }

    var cabinetModel = extractCabinetModel(segment);
    var blockId = deps.trim(deps.getAttr(blockCell, "blockId"));
    var nextHeight = deps.clamp(
      Math.round(height),
      deps.blockMinHeight,
      deps.blockMaxHeight,
    );
    var i;

    for (i = 0; i < cabinetModel.blocks.length; i++) {
      if (cabinetModel.blocks[i].id != blockId) {
        continue;
      }

      if (cabinetModel.blocks[i].height == nextHeight) {
        return null;
      }

      cabinetModel.blocks[i].height = nextHeight;
      return relayoutCabinetByModel(cabinetModel);
    }

    return null;
  }

  /**
   * 把新柜宽写回模型并重排——柜宽是整柜共享的，所有块跟着变。
   */
  function applyCabinetWidth(cell, width) {
    var segment = findCabinetSegment(cell);

    if (segment == null) {
      return null;
    }

    var cabinetModel = extractCabinetModel(segment);
    var nextWidth = Math.max(deps.minWidth, Math.round(width));

    if (cabinetModel.cabinetWidth == nextWidth) {
      return null;
    }

    cabinetModel.cabinetWidth = nextWidth;
    return relayoutCabinetByModel(cabinetModel);
  }

  return {
    applyCabinetBlockHeight,
    applyCabinetWidth,
    bindSwitchToBlock,
    findBoundCabinetBlockForSwitch,
    findSwitchCellByInstanceId,
    findSwitchLink,
    insertCabinetBlockAfter,
    moveCabinetPortByDelta: moveCabinetSegmentPortByDelta,
    syncBoundSwitches,
    unbindSwitchFromBlock,
    unbindSwitchFromCabinetSwitch,
    buildCabinetPageDescriptors,
    buildCabinetPortMap,
    buildCabinetSegmentCell,
    collectCabinetAttachments,
    extractCabinetModel,
    findCabinetSegment,
    findCabinetSegments,
    getSegmentBlocks,
    getCellAbsoluteGeometry,
    getPortAbsolutePosition,
    normalizeCabinetModel,
    reconcileCabinetSwitchLinks,
    relayoutCabinetByModel,
    restoreCabinetAttachments,
    isSwitchBoundToCabinet,
  };
}
