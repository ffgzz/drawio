export function createCabinetDomain(deps) {
  var ctx = deps.ctx;
  var model = ctx.model;
  var state = ctx.state;

  function makeCabinetRootStyle() {
    return (
      "fillColor=none;strokeColor=none;html=1;whiteSpace=wrap;" +
      "connectable=1;container=1;collapsible=0;foldable=0;recursiveResize=0;rotatable=0;resizable=0;"
    );
  }

  function createCabinetBodySvg(descriptor) {
    var width = Math.max(20, Math.round(descriptor.width));
    var height = Math.max(20, Math.round(descriptor.height));
    var strokeWidth = 4;
    var inset = strokeWidth / 2;
    var notchLeft = Math.max(14, Math.round(width * 0.16));
    var notchWidth = Math.max(18, Math.round(width * 0.16));
    var notchDepth = Math.max(8, Math.round(Math.min(height, 80) * 0.12));
    var path;

    if (!descriptor.continuesFromPrev && !descriptor.continuesToNext) {
      path =
        "M " +
        inset +
        " " +
        inset +
        " L " +
        (width - inset) +
        " " +
        inset +
        " L " +
        (width - inset) +
        " " +
        (height - inset) +
        " L " +
        inset +
        " " +
        (height - inset) +
        " Z";
    } else {
      var topY = descriptor.continuesFromPrev ? inset + notchDepth : inset;
      var bottomY = descriptor.continuesToNext
        ? height - inset - notchDepth
        : height - inset;

      path =
        "M " +
        inset +
        " " +
        topY +
        " " +
        "L " +
        notchLeft +
        " " +
        topY +
        " " +
        (descriptor.continuesFromPrev
          ? "L " + (notchLeft + notchWidth) + " " + inset + " "
          : "") +
        "L " +
        (width - inset) +
        " " +
        inset +
        " " +
        "L " +
        (width - inset) +
        " " +
        (height - inset) +
        " " +
        (descriptor.continuesToNext
          ? "L " +
            (notchLeft + notchWidth) +
            " " +
            (height - inset) +
            " " +
            "L " +
            notchLeft +
            " " +
            bottomY +
            " "
          : "") +
        "L " +
        inset +
        " " +
        bottomY +
        " Z";
    }

    return (
      '<svg xmlns="http://www.w3.org/2000/svg" width="' +
      width +
      '" height="' +
      height +
      '" viewBox="0 0 ' +
      width +
      " " +
      height +
      '">' +
      '<path d="' +
      path +
      '" fill="none" stroke="#111111" stroke-width="' +
      strokeWidth +
      '" stroke-linejoin="round" stroke-linecap="round"/>' +
      "</svg>"
    );
  }

  function makeCabinetBodyStyle(descriptor) {
    return (
      "shape=image;image=" +
      "data:image/svg+xml," +
      encodeURIComponent(createCabinetBodySvg(descriptor)) +
      ";imageAspect=0;aspect=fixed;html=1;strokeColor=none;fillColor=none;" +
      "part=1;connectable=0;editable=0;movable=0;resizable=0;rotatable=0;" +
      "cloneable=0;deletable=0;pointerEvents=0;"
    );
  }

  function makeCabinetGapStyle(selected) {
    return (
      "shape=rectangle;fillColor=#4dabf7;gradientColor=none;fillOpacity=" +
      (selected ? "38" : "14") +
      ";strokeColor=" +
      (selected ? "#1d4ed8" : "none") +
      ";strokeWidth=" +
      (selected ? "2" : "0") +
      ";connectable=0;editable=0;movable=0;resizable=0;rotatable=0;"
    );
  }

  function normalizeGapRatio(value, fallbackValue) {
    return deps.clamp(
      deps.toFloat(value, fallbackValue != null ? fallbackValue : 0.12),
      0,
      1,
    );
  }

  function normalizeCabinetPort(raw, index) {
    var base = deps.normalizePortPoint(
      raw,
      deps.trim(raw != null ? raw.id : "") || "cabinet-port:" + index,
      1,
      0,
    );

    base.direction = "right";
    base.ioMode = "out";
    base.order = index;
    return base;
  }

  function normalizeCabinetModel(raw) {
    raw = deps.isObject(raw) ? deps.cloneJson(raw) : {};
    var portCount = Math.max(
      2,
      Array.isArray(raw.ports)
        ? raw.ports.length
        : deps.toInt(raw.portCount, deps.defaultPortCount),
    );
    var ports = [];
    var i;
    var gapRatios = [];

    if (Array.isArray(raw.ports) && raw.ports.length > 0) {
      for (i = 0; i < raw.ports.length; i++) {
        ports.push(normalizeCabinetPort(raw.ports[i], i));
      }
    } else {
      for (i = 0; i < portCount; i++) {
        ports.push(
          normalizeCabinetPort(
            {
              id: "cabinet-port:" + i,
              x: 1,
              y: 0,
              marker: "cross",
              direction: "right",
              ioMode: "out",
            },
            i,
          ),
        );
      }
    }

    for (i = 0; i < Math.max(0, ports.length - 1); i++) {
      gapRatios.push(
        normalizeGapRatio(
          Array.isArray(raw.gapRatios) ? raw.gapRatios[i] : null,
          0.12,
        ),
      );
    }

    return {
      logicalCabinetId:
        deps.trim(raw.logicalCabinetId) || deps.generateLogicalCabinetId(),
      originFrameId: deps.trim(raw.originFrameId),
      title: deps.trim(raw.title) || "配电柜",
      cabinetWidth: Math.max(30, deps.toInt(raw.cabinetWidth, deps.defaultWidth)),
      cabinetX: Math.max(20, deps.toInt(raw.cabinetX, deps.defaultX)),
      tailPadding: Math.max(8, deps.toInt(raw.tailPadding, deps.tailPadding)),
      ports: ports,
      gapRatios: gapRatios,
    };
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

  function buildCabinetOffsets(cabinetModel, frameConfig) {
    var config = deps.getNormalizedFrameConfig(frameConfig);
    var modelData = normalizeCabinetModel(cabinetModel);
    var usableHeight = config.height * deps.frameContentRatio;
    var topMargin = config.height * deps.frameMarginRatio;
    var offsets = [];
    var minFollowSpace = Math.max(
      modelData.tailPadding * 2,
      usableHeight * deps.minPortFollowSpaceRatio,
    );
    var currentOffset = modelData.tailPadding;
    var i;

    if (modelData.ports.length == 0) {
      modelData.ports = normalizeCabinetModel({ portCount: 2 }).ports;
      modelData.gapRatios = [0.12];
    }

    for (i = 0; i < modelData.ports.length; i++) {
      if (i > 0) {
        var previousGap = modelData.gapRatios[i - 1] * usableHeight;
        var nextGap =
          i < modelData.gapRatios.length
            ? modelData.gapRatios[i] * usableHeight
            : 0;
        var candidateOffset = currentOffset + previousGap;
        var candidatePage = Math.floor(
          Math.max(0, candidateOffset - 0.0001) / usableHeight,
        );
        var candidateLocalOffset =
          candidateOffset - candidatePage * usableHeight;
        var remainingLocalSpace = usableHeight - candidateLocalOffset;

        if (
          i < modelData.gapRatios.length &&
          previousGap + nextGap > usableHeight &&
          candidateLocalOffset > modelData.tailPadding
        ) {
          currentOffset =
            (candidatePage + 1) * usableHeight + modelData.tailPadding;
        } else if (
          remainingLocalSpace < minFollowSpace &&
          candidateLocalOffset > modelData.tailPadding
        ) {
          currentOffset =
            (candidatePage + 1) * usableHeight + modelData.tailPadding;
        } else {
          currentOffset = candidateOffset;
        }
      }

      offsets.push(currentOffset);
    }

    return {
      frameConfig: config,
      cabinetModel: modelData,
      usableHeight: usableHeight,
      topMargin: topMargin,
      offsets: offsets,
      totalLogicalHeight:
        (offsets.length > 0
          ? offsets[offsets.length - 1]
          : modelData.tailPadding) + modelData.tailPadding,
    };
  }

  function getPageIndexForOffset(offset, usableHeight, pageCount) {
    if (pageCount <= 1 || offset <= 0) {
      return 0;
    }

    return deps.clamp(
      Math.floor((offset - 0.0001) / usableHeight),
      0,
      pageCount - 1,
    );
  }

  function buildCabinetPageDescriptors(cabinetModel, frameConfig) {
    var layout = buildCabinetOffsets(cabinetModel, frameConfig);
    var pageCount = Math.max(
      1,
      Math.ceil(layout.totalLogicalHeight / layout.usableHeight),
    );
    var descriptors = [];
    var pageIndex;
    var i;

    for (pageIndex = 0; pageIndex < pageCount; pageIndex++) {
      var pageStart = pageIndex * layout.usableHeight;
      var remaining = Math.max(0, layout.totalLogicalHeight - pageStart);
      var segmentHeight =
        pageCount > 1
          ? layout.usableHeight
          : Math.max(
              layout.cabinetModel.tailPadding,
              Math.min(layout.usableHeight, remaining),
            );
      var ports = [];
      var gaps = [];

      for (i = 0; i < layout.cabinetModel.ports.length; i++) {
        if (
          getPageIndexForOffset(
            layout.offsets[i],
            layout.usableHeight,
            pageCount,
          ) == pageIndex
        ) {
          var localOffset = layout.offsets[i] - pageStart;
          var port = deps.cloneJson(layout.cabinetModel.ports[i]);
          port.x = 1;
          port.y =
            segmentHeight > 0 ? deps.clamp(localOffset / segmentHeight, 0, 1) : 0;
          port.order = i;
          port.logicalOffset = layout.offsets[i];
          ports.push(port);
        }
      }

      for (i = 0; i < layout.cabinetModel.gapRatios.length; i++) {
        var gapAbsoluteStart = layout.offsets[i];
        var gapAbsoluteEnd =
          i + 1 < layout.offsets.length
            ? layout.offsets[i + 1]
            : gapAbsoluteStart;
        var visibleStart = Math.max(gapAbsoluteStart, pageStart);
        var visibleEnd = Math.min(gapAbsoluteEnd, pageStart + segmentHeight);

        if (visibleEnd > visibleStart) {
          var gapStart = deps.clamp(visibleStart - pageStart, 0, segmentHeight);
          var gapEnd = deps.clamp(visibleEnd - pageStart, gapStart, segmentHeight);

          if (gapEnd - gapStart < 12) {
            gapEnd = Math.min(segmentHeight, gapStart + 12);
          }

          gaps.push({
            id: "cabinet-gap:" + i + ":" + pageIndex,
            gapIndex: i,
            y: segmentHeight > 0 ? deps.clamp(gapStart / segmentHeight, 0, 1) : 0,
            height: Math.max(12, gapEnd - gapStart),
          });
        }
      }

      descriptors.push({
        segmentIndex: pageIndex,
        pageCount: pageCount,
        continuesFromPrev: pageIndex > 0,
        continuesToNext: pageIndex < pageCount - 1,
        x: layout.cabinetModel.cabinetX,
        y: layout.topMargin,
        width: layout.cabinetModel.cabinetWidth,
        height: segmentHeight,
        segmentStartOffset: pageStart,
        segmentEndOffset: pageStart + segmentHeight,
        ports: ports,
        gaps: gaps,
        frameConfig: layout.frameConfig,
        cabinetModel: layout.cabinetModel,
      });
    }

    return descriptors;
  }

  function createCabinetValueMetadata(node, cabinetModel, descriptor, frameId) {
    node.setAttribute("pluginType", deps.cabinetType);
    node.setAttribute("logicalCabinetId", deps.trim(cabinetModel.logicalCabinetId));
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
      deps.createMetaCell(deps.cabinetBodyTag, deps.cabinetBodyKind, "main", ""),
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
      deps.toInt(state.selectedCabinetGap.gapIndex, -1) == deps.toInt(gapIndex, -1)
    );
  }

  function createCabinetGapCell(cabinetModel, descriptor, gap) {
    var value = deps.createNode(deps.cabinetGapTag);
    value.setAttribute("pluginType", deps.cabinetGapType);
    value.setAttribute("esKind", deps.cabinetGapKind);
    value.setAttribute("esKey", String(gap.gapIndex));
    value.setAttribute("logicalCabinetId", deps.trim(cabinetModel.logicalCabinetId));
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
      x: x,
      y: y,
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
    if (deps.trim(logicalCabinetId).length == 0 || deps.toInt(gapIndex, -1) < 0) {
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
          edge: edge,
          source: source,
          portId: portId,
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
          segment: segment,
          port: ports[j],
          frame: frame,
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
        deps.trim(deps.getAttr(frames[i], "originFrameId")) == deps.trim(originFrameId) &&
        deps.trim(deps.getAttr(frames[i], "autoFrameOwner")) == deps.trim(logicalCabinetId)
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
        deps.trim(deps.getAttr(child, "logicalCabinetId")) == deps.trim(logicalCabinetId)
      ) {
        continue;
      }

      return false;
    }

    return true;
  }

  function ensureCabinetFrames(originFrame, cabinetModel, pageCount, skipCleanup) {
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
            originFrameId: originFrameId,
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

    frames = ensureCabinetFrames(originFrame, normalized, descriptors.length, true);

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
    buildCabinetPageDescriptors: buildCabinetPageDescriptors,
    buildCabinetPortMap: buildCabinetPortMap,
    buildCabinetSegmentCell: buildCabinetSegmentCell,
    collectCabinetAttachments: collectCabinetAttachments,
    extractCabinetModel: extractCabinetModel,
    findCabinetSegment: findCabinetSegment,
    findCabinetSegments: findCabinetSegments,
    getCellAbsoluteGeometry: getCellAbsoluteGeometry,
    getPortAbsolutePosition: getPortAbsolutePosition,
    normalizeCabinetModel: normalizeCabinetModel,
    relayoutCabinetByModel: relayoutCabinetByModel,
    restoreCabinetAttachments: restoreCabinetAttachments,
    setSelectedCabinetGap: setSelectedCabinetGap,
  };
}
