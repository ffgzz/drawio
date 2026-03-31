/**
 * 领域层注册器。
 * 负责按依赖顺序创建 spec/symbol/frame/cabinet/snapshot/connectionConstraints 这些 domain。
 */
import { createSpecDomain } from "../domain/spec.js";
import { createSymbolDomain } from "../domain/symbol.js";
import { createFrameDomain } from "../domain/frame.js";
import { createCabinetDomain } from "../domain/cabinet.js";
import { createSnapshotDomain } from "../domain/snapshot.js";
import { createConnectionConstraints } from "../runtime/connectionConstraints.js";

export function createDomainRegistry(app) {
  var ctx = app.ctx;
  var constants = app.constants;
  var utils = app.utils;
  var helpers = app.helpers;
  var domains = {};

  domains.spec = createSpecDomain({
    trim: utils.trim,
    isObject: utils.isObject,
    cloneJson: utils.cloneJson,
    validateSvg: app.utils.validateSvg,
    generateSymbolId: helpers.generateSymbolId,
    clamp: utils.clamp,
    toInt: utils.toInt,
    toFloat: utils.toFloat,
    nextItemId: helpers.nextItemId,
    normalizeMode: helpers.normalizeMode,
    deepMerge: utils.deepMerge,
    generateInstanceId: helpers.generateInstanceId,
  });

  domains.symbol = createSymbolDomain({
    model: ctx.model,
    ROOT_TAG: constants.ROOT_TAG,
    ROOT_TYPE: constants.ROOT_TYPE,
    BODY_TAG: constants.BODY_TAG,
    BODY_KIND: constants.BODY_KIND,
    LABEL_TAG: constants.LABEL_TAG,
    LABEL_KIND: constants.LABEL_KIND,
    trim: utils.trim,
    isObject: utils.isObject,
    normalizeMode: helpers.normalizeMode,
    normalizeSpec: domains.spec.normalizeSpec,
    normalizePortLayout: domains.spec.normalizePortLayout,
    normalizeLabels: domains.spec.normalizeLabels,
    parsePortLayout: domains.spec.parsePortLayout,
    getAttr: utils.getAttr,
    createNode: utils.createNode,
    createMetaCell: utils.createMetaCell,
    cloneValue: utils.cloneValue,
    toStyleImageUri: domains.spec.toStyleImageUri,
    serializePortLayout: domains.spec.serializePortLayout,
    buildPortLayout: domains.spec.buildPortLayout,
    buildResolvedLabels: domains.spec.buildResolvedLabels,
  });

  domains.frame = createFrameDomain({
    graph: ctx.graph,
    model: ctx.model,
    state: ctx.state,
    frameTag: constants.FRAME_TAG,
    frameType: constants.FRAME_TYPE,
    frameLabelTag: constants.FRAME_LABEL_TAG,
    frameLabelKind: constants.FRAME_LABEL_KIND,
    frameMarginRatio: constants.FRAME_MARGIN_RATIO,
    defaultWidth: constants.FRAME_DEFAULT_WIDTH,
    defaultHeight: constants.FRAME_DEFAULT_HEIGHT,
    trim: utils.trim,
    toInt: utils.toInt,
    isObject: utils.isObject,
    getAttr: utils.getAttr,
    createNode: utils.createNode,
    createMetaCell: utils.createMetaCell,
    generateFrameId: helpers.generateFrameId,
    isDrawingFrame: helpers.isDrawingFrame,
    showStatus: app.showStatus,
    setCanvasStatus: app.setCanvasStatus,
  });

  domains.connectionConstraints = createConnectionConstraints({
    ctx,
    trim: utils.trim,
    clamp: utils.clamp,
    parsePortLayout: domains.spec.parsePortLayout,
    getAttr: utils.getAttr,
    buildPortLayout: domains.spec.buildPortLayout,
    findPortHostRoot: helpers.findPortHostRoot,
    normalizePortDirection: domains.spec.normalizePortDirection,
    normalizePortIoMode: domains.spec.normalizePortIoMode,
    isDrawingFrame: helpers.isDrawingFrame,
    isCabinetSegment: helpers.isCabinetSegment,
    isCabinetGap: helpers.isCabinetGap,
    findDrawingFrame: domains.frame.findDrawingFrame,
    getCellAbsoluteGeometry: function (cell) {
      return domains.cabinet.getCellAbsoluteGeometry(cell);
    },
    getPortAbsolutePosition: function (root, port) {
      return domains.cabinet.getPortAbsolutePosition(root, port);
    },
  });

  domains.cabinet = createCabinetDomain({
    model: ctx.model,
    state: ctx.state,
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
      ctx.graph.setConnectionConstraint(edge, root, source, constraint);
    },
  });

  domains.snapshot = createSnapshotDomain({
    graph: ctx.graph,
    model: ctx.model,
    state: ctx.state,
    ui: ctx.ui,
    BODY_KIND: constants.BODY_KIND,
    LABEL_KIND: constants.LABEL_KIND,
    FRAME_LABEL_KIND: constants.FRAME_LABEL_KIND,
    CABINET_BODY_KIND: constants.CABINET_BODY_KIND,
    CABINET_GAP_KIND: constants.CABINET_GAP_KIND,
    FRAME_MARGIN_RATIO: constants.FRAME_MARGIN_RATIO,
    trim: utils.trim,
    toInt: utils.toInt,
    isObject: utils.isObject,
    cloneJson: utils.cloneJson,
    createNode: utils.createNode,
    getAttr: utils.getAttr,
    uniqueStrings: utils.uniqueStrings,
    isCabinetGap: helpers.isCabinetGap,
    isDrawingFrame: helpers.isDrawingFrame,
    isCabinetSegment: helpers.isCabinetSegment,
    isElectricalRoot: helpers.isElectricalRoot,
    extractSpec: domains.symbol.extractSpec,
    getFrameConfig: domains.frame.getFrameConfig,
    getFramePageNumber: domains.frame.getFramePageNumber,
    getFrameGroupId: domains.frame.getFrameGroupId,
    findFrameById: domains.frame.findFrameById,
    extractCabinetModel: domains.cabinet.extractCabinetModel,
    findCabinetSegments: domains.cabinet.findCabinetSegments,
    getPortMetaById: domains.connectionConstraints.getPortMetaById,
    findDrawingFrame: domains.frame.findDrawingFrame,
    findPortHostRoot: helpers.findPortHostRoot,
    parsePortLayout: domains.spec.parsePortLayout,
    getAllDrawingFrames: domains.frame.getAllDrawingFrames,
    exitInstanceComposeMode: function (clearStatus) {
      return app.callRuntime("exitInstanceComposeMode", clearStatus);
    },
    closeGapDialogWindow: function () {
      return app.callUi("closeGapDialogWindow");
    },
    setSelectedCabinetGap: function (logicalCabinetId, gapIndex) {
      return domains.cabinet.setSelectedCabinetGap(logicalCabinetId, gapIndex);
    },
    exitPortSwapMode: function (clearStatus) {
      return app.callRuntime("exitPortSwapMode", clearStatus);
    },
    createDrawingFrameCell: domains.frame.createDrawingFrameCell,
    addTopLevelCell: domains.frame.addTopLevelCell,
    relayoutCabinetByModel: domains.cabinet.relayoutCabinetByModel,
    normalizeSpec: domains.spec.normalizeSpec,
    buildSymbolCell: domains.symbol.buildSymbolCell,
    resetPendingChangeRecords: helpers.resetPendingChangeRecords,
  });

  return domains;
}
