/**
 * 应用装配入口。
 * 这里负责创建 ctx 之上的稳定 app 对象，把 domain/services/runtime/ui 需要的共享能力组织起来。
 */
import {
  clamp,
  cloneJson,
  createBaseUtils,
  deepMerge,
  generateUuid,
  isObject,
  stripFileExtension,
  toFloat,
  toInt,
  toSlug,
  trim,
  uniqueStrings,
} from "../utils/base.js";
import {
  cloneValue,
  createMetaCell,
  createNode,
  createXmlUtils,
  extractSvgSize,
  getAttr,
  validateSvg,
} from "../utils/xml.js";
import { createAppContext } from "../core/appContext.js";
import { createGraphApi } from "../core/graphApi.js";
import { createRuntimeHelpers } from "../core/runtimeHelpers.js";
import { createDomainRegistry } from "./createDomains.js";
import { createServiceRegistry } from "./createServices.js";
import { createPluginButton } from "../ui/shared/buttonFactory.js";
import { createRuntimeBridge } from "../application/runtimeBridge.js";
import { createUiBridge } from "../application/uiBridge.js";
import { createSelectionApi } from "../application/selection.js";
import { createCommandApi } from "../application/commands.js";
import { createActionApi } from "../application/actions.js";

export function createApp(ctx) {
  var constants = ctx.constants;
  var app = {
    ctx,
    constants,
    appContext: createAppContext(ctx),
    graphApi: createGraphApi(ctx),
    runtimeBridge: createRuntimeBridge(),
    uiBridge: createUiBridge(),
  };

  app.callUi = function (name) {
    var fn = app.uiBridge != null ? app.uiBridge[name] : null;

    if (typeof fn !== "function") {
      return null;
    }

    return fn.apply(null, Array.prototype.slice.call(arguments, 1));
  };

  app.callRuntime = function (name) {
    var fn = app.runtimeBridge != null ? app.runtimeBridge[name] : null;

    if (typeof fn !== "function") {
      return null;
    }

    return fn.apply(null, Array.prototype.slice.call(arguments, 1));
  };

  app.utils = {
    clamp,
    cloneJson,
    createBaseUtils,
    createButton: createPluginButton,
    createMetaCell,
    createNode,
    createXmlUtils,
    deepMerge,
    extractSvgSize: function (svg) {
      return extractSvgSize(svg, toFloat, trim);
    },
    generateUuid,
    getAttr,
    isObject,
    normalizeSvg: function (svg) {
      return validateSvg(svg, trim);
    },
    stripFileExtension,
    toFloat,
    toInt,
    toSlug,
    trim,
    uniqueStrings,
    cloneValue: function (node) {
      return cloneValue(node, constants.ROOT_TAG);
    },
    validateSvg: function (svg) {
      return validateSvg(svg, trim);
    },
  };

  app.helpers = createRuntimeHelpers({
    ctx,
    constants,
    trim,
    cloneJson,
    getAttr,
    toSlug,
    stripFileExtension,
    generateUuid,
    shouldExportGenericObject: function (cell) {
      return (
        app.domains != null &&
        app.domains.snapshot != null &&
        typeof app.domains.snapshot.shouldExportGenericObject === "function" &&
        app.domains.snapshot.shouldExportGenericObject(cell)
      );
    },
  });
  app.showStatus = app.helpers.showStatus;
  app.setCanvasStatus = app.helpers.setCanvasStatus;

  app.domains = createDomainRegistry(app);
  app.services = createServiceRegistry(app);

  app.selection = createSelectionApi({
    ctx,
    findElectricalRoot: app.helpers.findElectricalRoot,
    findDrawingFrame: app.domains.frame.findDrawingFrame,
    findCabinetSegment: app.domains.cabinet.findCabinetSegment,
    isCabinetGap: app.helpers.isCabinetGap,
  });
  app.commands = createCommandApi({
    ctx,
    selection: app.selection,
    frame: app.domains.frame,
    symbol: app.domains.symbol,
    cabinet: app.domains.cabinet,
    helpers: app.helpers,
    cloneJson,
    uiBridge: app.uiBridge,
    runtimeBridge: app.runtimeBridge,
    showStatus: app.showStatus,
    setCanvasStatus: app.setCanvasStatus,
  });
  app.actions = createActionApi(app);

  return app;
}
