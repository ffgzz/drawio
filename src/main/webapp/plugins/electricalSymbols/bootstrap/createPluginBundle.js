import { createDraftStore } from "../services/draftStore.js";
import { createLibraryStore } from "../services/libraryStore.js";
import { createBackendService } from "../services/backend.js";
import { createSpecDomain } from "../domain/spec.js";
import { createFrameDomain } from "../domain/frame.js";
import { createCabinetDomain } from "../domain/cabinet.js";
import { createSymbolDomain } from "../domain/symbol.js";
import { createSnapshotDomain } from "../domain/snapshot.js";
import { createConnectionConstraints } from "../runtime/connectionConstraints.js";
import { createRuntimeHelpers } from "../core/runtimeHelpers.js";
import { createBaseUtils } from "../utils/base.js";
import { createXmlUtils } from "../utils/xml.js";
import { createPluginButton } from "../ui/shared/buttonFactory.js";

export function createPluginBundle(ctx) {
  var constants = ctx.constants;
  var bundle = {
    ctx: ctx,
    constants: constants,
    runtime: {},
    ui: {},
  };
  var baseUtils = createBaseUtils();
  var xmlUtils = createXmlUtils({
    trim: baseUtils.trim,
  });

  bundle.trim = baseUtils.trim;
  bundle.isObject = baseUtils.isObject;
  bundle.clamp = baseUtils.clamp;
  bundle.toInt = baseUtils.toInt;
  bundle.toFloat = baseUtils.toFloat;
  bundle.cloneJson = baseUtils.cloneJson;
  bundle.deepMerge = baseUtils.deepMerge;
  bundle.toSlug = baseUtils.toSlug;
  bundle.stripFileExtension = baseUtils.stripFileExtension;
  bundle.generateUuid = baseUtils.generateUuid;
  bundle.uniqueStrings = baseUtils.uniqueStrings;
  bundle.createNode = xmlUtils.createNode;
  bundle.createMetaCell = xmlUtils.createMetaCell;
  bundle.getAttr = xmlUtils.getAttr;
  bundle.validateSvg = xmlUtils.validateSvg;
  bundle.extractSvgSize = function (svg) {
    return xmlUtils.extractSvgSize(svg, bundle.toFloat);
  };
  bundle.cloneValue = function (node) {
    return xmlUtils.cloneValue(node, constants.ROOT_TAG);
  };
  bundle.createButton = createPluginButton;

  Object.assign(
    bundle,
    createRuntimeHelpers({
      ctx: ctx,
      constants: constants,
      trim: bundle.trim,
      cloneJson: bundle.cloneJson,
      getAttr: bundle.getAttr,
      toSlug: bundle.toSlug,
      stripFileExtension: bundle.stripFileExtension,
      generateUuid: bundle.generateUuid,
      shouldExportGenericObject: function (cell) {
        return (
          typeof bundle.shouldExportGenericObject === "function" &&
          bundle.shouldExportGenericObject(cell)
        );
      },
    }),
  );

  Object.assign(
    bundle,
    createSpecDomain({
      trim: bundle.trim,
      isObject: bundle.isObject,
      cloneJson: bundle.cloneJson,
      validateSvg: bundle.validateSvg,
      generateSymbolId: bundle.generateSymbolId,
      clamp: bundle.clamp,
      toInt: bundle.toInt,
      toFloat: bundle.toFloat,
      nextItemId: bundle.nextItemId,
      normalizeMode: bundle.normalizeMode,
      deepMerge: bundle.deepMerge,
      generateInstanceId: bundle.generateInstanceId,
    }),
  );

  Object.assign(
    bundle,
    createSymbolDomain({
      ctx: ctx,
      ROOT_TAG: constants.ROOT_TAG,
      ROOT_TYPE: constants.ROOT_TYPE,
      BODY_TAG: constants.BODY_TAG,
      BODY_KIND: constants.BODY_KIND,
      LABEL_TAG: constants.LABEL_TAG,
      LABEL_KIND: constants.LABEL_KIND,
      trim: bundle.trim,
      isObject: bundle.isObject,
      normalizeMode: bundle.normalizeMode,
      normalizeSpec: bundle.normalizeSpec,
      normalizePortLayout: bundle.normalizePortLayout,
      normalizeLabels: bundle.normalizeLabels,
      parsePortLayout: bundle.parsePortLayout,
      getAttr: bundle.getAttr,
      createNode: bundle.createNode,
      createMetaCell: bundle.createMetaCell,
      cloneValue: bundle.cloneValue,
      toStyleImageUri: bundle.toStyleImageUri,
      serializePortLayout: bundle.serializePortLayout,
      buildPortLayout: bundle.buildPortLayout,
      buildResolvedLabels: bundle.buildResolvedLabels,
    }),
  );

  Object.assign(
    bundle,
    createFrameDomain({
      ctx: ctx,
      frameTag: constants.FRAME_TAG,
      frameType: constants.FRAME_TYPE,
      frameLabelTag: constants.FRAME_LABEL_TAG,
      frameLabelKind: constants.FRAME_LABEL_KIND,
      frameMarginRatio: constants.FRAME_MARGIN_RATIO,
      defaultWidth: constants.FRAME_DEFAULT_WIDTH,
      defaultHeight: constants.FRAME_DEFAULT_HEIGHT,
      trim: bundle.trim,
      toInt: bundle.toInt,
      isObject: bundle.isObject,
      getAttr: bundle.getAttr,
      createNode: bundle.createNode,
      createMetaCell: bundle.createMetaCell,
      generateFrameId: bundle.generateFrameId,
      isDrawingFrame: bundle.isDrawingFrame,
      showStatus: bundle.showStatus,
      setCanvasStatus: bundle.setCanvasStatus,
    }),
  );

  bundle.connectionConstraints = createConnectionConstraints({
    ctx: ctx,
    trim: bundle.trim,
    clamp: bundle.clamp,
    parsePortLayout: bundle.parsePortLayout,
    getAttr: bundle.getAttr,
    buildPortLayout: bundle.buildPortLayout,
    findPortHostRoot: bundle.findPortHostRoot,
    normalizePortDirection: bundle.normalizePortDirection,
    normalizePortIoMode: bundle.normalizePortIoMode,
    isDrawingFrame: bundle.isDrawingFrame,
    isCabinetSegment: bundle.isCabinetSegment,
    isCabinetGap: bundle.isCabinetGap,
    findDrawingFrame: bundle.findDrawingFrame,
    getCellAbsoluteGeometry: function (cell) {
      return bundle.getCellAbsoluteGeometry(cell);
    },
    getPortAbsolutePosition: function (root, port) {
      return bundle.getPortAbsolutePosition(root, port);
    },
  });
  bundle.getElectricalConstraints =
    bundle.connectionConstraints.getElectricalConstraints;
  bundle.getPortMetaByConstraint =
    bundle.connectionConstraints.getPortMetaByConstraint;
  bundle.getPortMetaById = bundle.connectionConstraints.getPortMetaById;
  bundle.mapPortDirectionToConstraint =
    bundle.connectionConstraints.mapPortDirectionToConstraint;
  bundle.isMovableConnectedTerminal =
    bundle.connectionConstraints.isMovableConnectedTerminal;
  bundle.moveCellToFrameByDelta =
    bundle.connectionConstraints.moveCellToFrameByDelta;
  bundle.clearEdgePoints = bundle.connectionConstraints.clearEdgePoints;
  bundle.moveConnectedGroupToCabinetPort =
    bundle.connectionConstraints.moveConnectedGroupToCabinetPort;

  Object.assign(
    bundle,
    createCabinetDomain({
      ctx: ctx,
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
      trim: bundle.trim,
      toInt: bundle.toInt,
      toFloat: bundle.toFloat,
      clamp: bundle.clamp,
      isObject: bundle.isObject,
      cloneJson: bundle.cloneJson,
      normalizePortPoint: bundle.normalizePortPoint,
      generateLogicalCabinetId: bundle.generateLogicalCabinetId,
      createNode: bundle.createNode,
      createMetaCell: bundle.createMetaCell,
      serializePortLayout: bundle.serializePortLayout,
      getAttr: bundle.getAttr,
      isCabinetSegment: bundle.isCabinetSegment,
      isCabinetGap: bundle.isCabinetGap,
      getNormalizedFrameConfig: bundle.normalizeFrameConfig,
      getAllDrawingFrames: bundle.getAllDrawingFrames,
      getFrameConfig: bundle.getFrameConfig,
      getFrameGroupId: bundle.getFrameGroupId,
      getFramePageNumber: bundle.getFramePageNumber,
      getMaxFramePageNumberInGroup: bundle.getMaxFramePageNumberInGroup,
      getRightmostFrameInGroup: bundle.getRightmostFrameInGroup,
      findFrameById: bundle.findFrameById,
      findDrawingFrame: bundle.findDrawingFrame,
      createDrawingFrameCell: bundle.createDrawingFrameCell,
      addTopLevelCell: bundle.addTopLevelCell,
      getEdgePortId: function (edge, root, source) {
        return bundle.getEdgePortId(edge, root, source);
      },
      getPortMetaById: function (root, portId) {
        return bundle.getPortMetaById(root, portId);
      },
      parsePortLayout: bundle.parsePortLayout,
      isMovableConnectedTerminal: bundle.isMovableConnectedTerminal,
      moveCellToFrameByDelta: bundle.moveCellToFrameByDelta,
      setConnectionConstraint: function (edge, root, source, constraint) {
        ctx.graph.setConnectionConstraint(edge, root, source, constraint);
      },
    }),
  );

  Object.assign(
    bundle,
    createSnapshotDomain({
      ctx: ctx,
      BODY_KIND: constants.BODY_KIND,
      LABEL_KIND: constants.LABEL_KIND,
      FRAME_LABEL_KIND: constants.FRAME_LABEL_KIND,
      CABINET_BODY_KIND: constants.CABINET_BODY_KIND,
      CABINET_GAP_KIND: constants.CABINET_GAP_KIND,
      FRAME_MARGIN_RATIO: constants.FRAME_MARGIN_RATIO,
      trim: bundle.trim,
      toInt: bundle.toInt,
      isObject: bundle.isObject,
      cloneJson: bundle.cloneJson,
      createNode: bundle.createNode,
      getAttr: bundle.getAttr,
      uniqueStrings: bundle.uniqueStrings,
      isCabinetGap: bundle.isCabinetGap,
      isDrawingFrame: bundle.isDrawingFrame,
      isCabinetSegment: bundle.isCabinetSegment,
      isElectricalRoot: bundle.isElectricalRoot,
      extractSpec: bundle.extractSpec,
      getFrameConfig: bundle.getFrameConfig,
      getFramePageNumber: bundle.getFramePageNumber,
      getFrameGroupId: bundle.getFrameGroupId,
      findFrameById: bundle.findFrameById,
      extractCabinetModel: bundle.extractCabinetModel,
      findCabinetSegments: bundle.findCabinetSegments,
      getPortMetaById: bundle.getPortMetaById,
      findDrawingFrame: bundle.findDrawingFrame,
      findPortHostRoot: bundle.findPortHostRoot,
      parsePortLayout: bundle.parsePortLayout,
      getAllDrawingFrames: bundle.getAllDrawingFrames,
      exitInstanceComposeMode: function (clearStatus) {
        if (typeof bundle.runtime.exitInstanceComposeMode === "function") {
          return bundle.runtime.exitInstanceComposeMode(clearStatus);
        }

        return null;
      },
      closeGapDialogWindow: function () {
        if (typeof bundle.ui.closeGapDialogWindow === "function") {
          return bundle.ui.closeGapDialogWindow.apply(null, arguments);
        }

        return null;
      },
      setSelectedCabinetGap: function (logicalCabinetId, gapIndex) {
        if (typeof bundle.setSelectedCabinetGap === "function") {
          return bundle.setSelectedCabinetGap(logicalCabinetId, gapIndex);
        }

        return null;
      },
      exitPortSwapMode: function (clearStatus) {
        if (typeof bundle.runtime.exitPortSwapMode === "function") {
          return bundle.runtime.exitPortSwapMode(clearStatus);
        }

        return null;
      },
      createDrawingFrameCell: bundle.createDrawingFrameCell,
      addTopLevelCell: bundle.addTopLevelCell,
      relayoutCabinetByModel: bundle.relayoutCabinetByModel,
      normalizeSpec: bundle.normalizeSpec,
      buildSymbolCell: bundle.buildSymbolCell,
      resetPendingChangeRecords: bundle.resetPendingChangeRecords,
    }),
  );

  bundle.draftStore = createDraftStore({
    ctx: ctx,
    trim: bundle.trim,
    cloneJson: bundle.cloneJson,
  });
  bundle.clearDraftSaveTimer = bundle.draftStore.clearDraftSaveTimer;
  bundle.saveEditorDraftNow = bundle.draftStore.saveEditorDraftNow;
  bundle.scheduleEditorDraftSave = bundle.draftStore.scheduleEditorDraftSave;
  bundle.loadEditorDraft = bundle.draftStore.loadEditorDraft;
  bundle.clearEditorDraft = bundle.draftStore.clearEditorDraft;

  bundle.libraryStore = createLibraryStore({
    ctx: ctx,
    trim: bundle.trim,
    isObject: bundle.isObject,
    cloneJson: bundle.cloneJson,
    normalizeSpec: bundle.normalizeSpec,
    isElectricalRoot: bundle.isElectricalRoot,
    extractSpec: bundle.extractSpec,
    buildSymbolCell: bundle.buildSymbolCell,
    showStatus: bundle.showStatus,
  });
  bundle.loadStoredLibrary = bundle.libraryStore.loadStoredLibrary;
  bundle.saveLibraryImages = bundle.libraryStore.saveLibraryImages;
  bundle.addToLibrary = bundle.libraryStore.addToLibrary;
  bundle.removeTemplateFromLibrary =
    bundle.libraryStore.removeTemplateFromLibrary;

  bundle.backendService = createBackendService({
    ctx: ctx,
    trim: bundle.trim,
    toInt: bundle.toInt,
    cloneJson: bundle.cloneJson,
    isObject: bundle.isObject,
    normalizeSnapshotGenericIds: bundle.normalizeSnapshotGenericIds,
    exportDiagramSnapshot: bundle.exportDiagramSnapshot,
    resetPendingChangeRecords: bundle.resetPendingChangeRecords,
    computeSnapshotChanges: bundle.computeSnapshotChanges,
    collectChangeObjectIds: bundle.collectChangeObjectIds,
    uniqueStrings: bundle.uniqueStrings,
    showStatus: bundle.showStatus,
    restoreDiagramSnapshot: bundle.restoreDiagramSnapshot,
  });
  bundle.loadBackendSession = bundle.backendService.loadBackendSession;
  bundle.saveBackendSession = bundle.backendService.saveBackendSession;
  bundle.normalizeBackendBaseUrl =
    bundle.backendService.normalizeBackendBaseUrl;
  bundle.requestBackendJson = bundle.backendService.requestBackendJson;
  bundle.syncBackendState = bundle.backendService.syncBackendState;
  bundle.resetBackendBinding = bundle.backendService.resetBackendBinding;
  bundle.saveDiagramToBackend = bundle.backendService.saveDiagramToBackend;
  bundle.listDiagramsFromBackend = bundle.backendService.listDiagramsFromBackend;
  bundle.getDiagramHistoryFromBackend =
    bundle.backendService.getDiagramHistoryFromBackend;
  bundle.rollbackDiagramToVersion =
    bundle.backendService.rollbackDiagramToVersion;
  bundle.loadDiagramFromBackend = bundle.backendService.loadDiagramFromBackend;

  return bundle;
}
