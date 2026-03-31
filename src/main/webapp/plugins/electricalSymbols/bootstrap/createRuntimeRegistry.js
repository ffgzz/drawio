/**
 * runtime 注册器。
 * 负责先创建纯 runtime API，再提供激活函数去安装 graph hook 和 listener。
 */
import { createPortSwapMode } from "../runtime/portSwapMode.js";
import { createComposeMode } from "../runtime/composeMode.js";
import { createModelSync } from "../runtime/modelSync.js";
import { ACTION_ITEMS, installCanvasFeatures } from "../runtime/canvasFeatures.js";
import { installTopActionBar } from "../ui/topActionBar.js";

export function createRuntimeRegistry(app) {
  var runtimeApi = {};

  var portSwapMode = createPortSwapMode({
    ctx: app.ctx,
    trim: app.utils.trim,
    cloneJson: app.utils.cloneJson,
    parsePortLayout: app.domains.spec.parsePortLayout,
    getAttr: app.utils.getAttr,
    findCabinetSegments: app.domains.cabinet.findCabinetSegments,
    findPortHostRoot: app.helpers.findPortHostRoot,
    isCabinetSegment: app.helpers.isCabinetSegment,
    isMovableConnectedTerminal:
      app.domains.connectionConstraints.isMovableConnectedTerminal,
    closeGapDialogWindow: function () {
      return app.callUi("closeGapDialogWindow");
    },
    setSelectedCabinetGap: app.domains.cabinet.setSelectedCabinetGap,
    showStatus: app.showStatus,
    setCanvasStatus: app.setCanvasStatus,
    getPortAbsolutePosition: app.domains.cabinet.getPortAbsolutePosition,
    getPortMetaByConstraint:
      app.domains.connectionConstraints.getPortMetaByConstraint,
    mapPortDirectionToConstraint:
      app.domains.connectionConstraints.mapPortDirectionToConstraint,
    clearEdgePoints: app.domains.connectionConstraints.clearEdgePoints,
    moveConnectedGroupToCabinetPort:
      app.domains.connectionConstraints.moveConnectedGroupToCabinetPort,
    setConnectionConstraint: function (edge, root, source, constraint) {
      app.domains.connectionConstraints.applyNativeConnectionConstraint(
        edge,
        root,
        source,
        constraint,
      );
    },
  });

  runtimeApi.applyEdgePortConstraintMetadata =
    portSwapMode.applyEdgePortConstraintMetadata;
  runtimeApi.clearPortSwapOverlay = portSwapMode.clearPortSwapOverlay;
  runtimeApi.commitPortSwap = portSwapMode.commitPortSwap;
  runtimeApi.enterPortSwapMode = portSwapMode.enterPortSwapMode;
  runtimeApi.exitPortSwapMode = portSwapMode.exitPortSwapMode;
  runtimeApi.getNearestCabinetPortFromClick =
    portSwapMode.getNearestCabinetPortFromClick;

  var composeMode = createComposeMode({
    ctx: app.ctx,
    trim: app.utils.trim,
    clamp: app.utils.clamp,
    padding: app.constants.INSTANCE_COMPOSE_ZONE_PADDING,
    minWidth: app.constants.INSTANCE_COMPOSE_ZONE_MIN_WIDTH,
    minHeight: app.constants.INSTANCE_COMPOSE_ZONE_MIN_HEIGHT,
    showStatus: app.showStatus,
    setCanvasStatus: app.setCanvasStatus,
    closeGapDialogWindow: function () {
      return app.callUi("closeGapDialogWindow");
    },
    exitPortSwapMode: function (clearStatus) {
      return app.callRuntime("exitPortSwapMode", clearStatus);
    },
    isDrawingFrame: app.helpers.isDrawingFrame,
    isCabinetSegment: app.helpers.isCabinetSegment,
    isCabinetGap: app.helpers.isCabinetGap,
    isPluginInternalCell: app.domains.snapshot.isPluginInternalCell,
    isElectricalRoot: app.helpers.isElectricalRoot,
    shouldExportGenericObject: app.domains.snapshot.shouldExportGenericObject,
    findElectricalRoot: app.helpers.findElectricalRoot,
  });

  runtimeApi.collectComposeDragCandidates =
    composeMode.collectComposeDragCandidates;
  runtimeApi.enterInstanceComposeMode = composeMode.enterInstanceComposeMode;
  runtimeApi.exitInstanceComposeMode = composeMode.exitInstanceComposeMode;
  runtimeApi.isBlockedComposeTarget = composeMode.isBlockedComposeTarget;
  runtimeApi.isLockedComposedChild = composeMode.isLockedComposedChild;
  runtimeApi.refreshInstanceComposeOverlay =
    composeMode.refreshInstanceComposeOverlay;

  var modelSync = createModelSync({
    ctx: app.ctx,
    isObject: app.utils.isObject,
    cloneJson: app.utils.cloneJson,
    exportDiagramSnapshot: app.domains.snapshot.exportDiagramSnapshot,
    computeSnapshotChanges: app.domains.snapshot.computeSnapshotChanges,
    isElectricalRoot: app.helpers.isElectricalRoot,
    refreshRoot: app.domains.symbol.refreshRoot,
  });

  runtimeApi.recordCanvasOperation = modelSync.recordCanvasOperation;
  runtimeApi.handleModelChange = modelSync.handleModelChange;

  function activateRuntime() {
    portSwapMode.installGraphClickBehavior({
      isCabinetGap: app.helpers.isCabinetGap,
      openCabinetGapDialog: function () {
        var args = ["openCabinetGapDialog"].concat(
          Array.prototype.slice.call(arguments),
        );

        return app.callUi.apply(null, args);
      },
      closeGapDialogWindow: function () {
        return app.callUi("closeGapDialogWindow");
      },
      setSelectedCabinetGap: app.domains.cabinet.setSelectedCabinetGap,
    });

    app.domains.connectionConstraints.installGraphBehavior({
      applyEdgePortConstraintMetadata: runtimeApi.applyEdgePortConstraintMetadata,
      setCanvasStatus: app.setCanvasStatus,
    });

    installCanvasFeatures(app);
    installTopActionBar({
      ui: app.ctx.ui,
      createButton: app.utils.createButton,
      items: ACTION_ITEMS,
    });
    app.ctx.ui.addListener("languageChanged", function () {
      installTopActionBar({
        ui: app.ctx.ui,
        createButton: app.utils.createButton,
        items: ACTION_ITEMS,
      });
    });
    app.ctx.ui.addListener("currentThemeChanged", function () {
      installTopActionBar({
        ui: app.ctx.ui,
        createButton: app.utils.createButton,
        items: ACTION_ITEMS,
      });
    });
  }

  return {
    activateRuntime,
    runtimeApi,
  };
}
