/**
 * 配电柜纯规则子模块。
 * 负责配电柜 SVG、gap/端口归一化以及分页 descriptor 计算，不直接访问 graph/model。
 */
export function createCabinetCore(deps) {
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
      cabinetWidth: Math.max(
        30,
        deps.toInt(raw.cabinetWidth, deps.defaultWidth),
      ),
      cabinetX: Math.max(20, deps.toInt(raw.cabinetX, deps.defaultX)),
      tailPadding: Math.max(8, deps.toInt(raw.tailPadding, deps.tailPadding)),
      ports,
      gapRatios,
    };
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
      usableHeight,
      topMargin,
      offsets,
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
            segmentHeight > 0
              ? deps.clamp(localOffset / segmentHeight, 0, 1)
              : 0;
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
          var gapEnd = deps.clamp(
            visibleEnd - pageStart,
            gapStart,
            segmentHeight,
          );

          if (gapEnd - gapStart < 12) {
            gapEnd = Math.min(segmentHeight, gapStart + 12);
          }

          gaps.push({
            id: "cabinet-gap:" + i + ":" + pageIndex,
            gapIndex: i,
            y:
              segmentHeight > 0
                ? deps.clamp(gapStart / segmentHeight, 0, 1)
                : 0,
            height: Math.max(12, gapEnd - gapStart),
          });
        }
      }

      descriptors.push({
        segmentIndex: pageIndex,
        pageCount,
        continuesFromPrev: pageIndex > 0,
        continuesToNext: pageIndex < pageCount - 1,
        x: layout.cabinetModel.cabinetX,
        y: layout.topMargin,
        width: layout.cabinetModel.cabinetWidth,
        height: segmentHeight,
        segmentStartOffset: pageStart,
        segmentEndOffset: pageStart + segmentHeight,
        ports,
        gaps,
        frameConfig: layout.frameConfig,
        cabinetModel: layout.cabinetModel,
      });
    }

    return descriptors;
  }

  return {
    buildCabinetOffsets,
    buildCabinetPageDescriptors,
    createCabinetBodySvg,
    getPageIndexForOffset,
    makeCabinetBodyStyle,
    makeCabinetGapStyle,
    makeCabinetRootStyle,
    normalizeCabinetModel,
    normalizeCabinetPort,
    normalizeGapRatio,
  };
}
