/**
 * 电气图元 graph 子模块。
 * 负责 root/body/label 三层结构在 mxGraph 中的创建、提取和同步刷新。
 */
import { createSymbolCore } from "./symbolCore.js";

export function createSymbolDomain(deps) {
  var model = deps.model;
  var core = createSymbolCore(deps);

  function addChild(root, child) {
    var index = arguments.length > 2 ? arguments[2] : null;

    if (root.parent != null) {
      model.add(root, child, index);
    } else {
      root.insert(child, index);
    }
  }

  function ensureRootGeometry(root, spec) {
    var geometry = model.getGeometry(root);

    if (geometry == null) {
      geometry = new mxGeometry(0, 0, spec.size.width, spec.size.height);
    } else {
      geometry = geometry.clone();
      geometry.width = spec.size.width;
      geometry.height = spec.size.height;
    }

    if (root.parent != null) {
      model.setGeometry(root, geometry);
    } else {
      root.geometry = geometry;
    }
  }

  function ensureRootValue(root, spec, layout) {
    var value = core.applyValueMetadata(deps.cloneValue(root.value), spec, layout);

    if (root.parent != null) {
      model.setValue(root, value);
      model.setStyle(root, core.makeRootStyle());
    } else {
      root.value = value;
      root.style = core.makeRootStyle();
      root.setConnectable(false);
    }
  }

  function createBodyCell(spec) {
    var geometry = new mxGeometry(0, 0, spec.size.width, spec.size.height);
    geometry.relative = true;
    geometry.offset = new mxPoint(0, 0);

    var cell = new mxCell(
      deps.createMetaCell(deps.BODY_TAG, deps.BODY_KIND, "main", ""),
      geometry,
      core.makeBodyStyle(spec),
    );
    cell.vertex = true;
    cell.setConnectable(false);
    return cell;
  }

  function applyBodyCell(cell, spec) {
    var geometry = model.getGeometry(cell);

    if (geometry == null) {
      geometry = new mxGeometry();
    } else {
      geometry = geometry.clone();
    }

    geometry.x = 0;
    geometry.y = 0;
    geometry.width = spec.size.width;
    geometry.height = spec.size.height;
    geometry.relative = true;
    geometry.offset = new mxPoint(0, 0);
    model.setGeometry(cell, geometry);

    var value = deps.cloneValue(cell.value);
    value.setAttribute("esKind", deps.BODY_KIND);
    value.setAttribute("esKey", "main");
    value.setAttribute("label", "");
    model.setValue(cell, value);
    model.setStyle(cell, core.makeBodyStyle(spec));
    cell.setConnectable(false);
  }

  function createLabelCell(label) {
    var geometry = new mxGeometry(label.x, label.y, label.width, label.height);
    geometry.relative = true;
    geometry.offset = new mxPoint(-label.width / 2, -label.height / 2);

    var cell = new mxCell(
      deps.createMetaCell(deps.LABEL_TAG, deps.LABEL_KIND, label.id, label.text),
      geometry,
      core.makeLabelStyle(label.align),
    );
    cell.vertex = true;
    cell.setConnectable(false);
    return cell;
  }

  function applyLabelCell(cell, label) {
    var geometry = model.getGeometry(cell);

    if (geometry == null) {
      geometry = new mxGeometry();
    } else {
      geometry = geometry.clone();
    }

    geometry.x = label.x;
    geometry.y = label.y;
    geometry.width = label.width;
    geometry.height = label.height;
    geometry.relative = true;
    geometry.offset = new mxPoint(-label.width / 2, -label.height / 2);
    model.setGeometry(cell, geometry);

    var value = deps.cloneValue(cell.value);
    value.setAttribute("esKind", deps.LABEL_KIND);
    value.setAttribute("esKey", label.id);
    value.setAttribute("label", label.text);
    model.setValue(cell, value);
    model.setStyle(cell, core.makeLabelStyle(label.align));
    cell.setConnectable(false);
  }

  function mapChildren(root) {
    var children = {
      body: {},
      label: {},
    };
    var i;

    for (i = 0; i < model.getChildCount(root); i++) {
      var child = model.getChildAt(root, i);
      var kind = deps.getAttr(child, "esKind");
      var key = deps.getAttr(child, "esKey");

      if (kind != null && key != null && children[kind] != null) {
        children[kind][key] = child;
      }
    }

    return children;
  }

  function removeUnused(map, keep) {
    for (var key in map) {
      if (map.hasOwnProperty(key) && keep[key] == null) {
        model.remove(map[key]);
      }
    }
  }

  function syncRoot(root, spec, baseLayout) {
    var layout = deps.buildPortLayout(spec, baseLayout);
    var resolvedLabels = deps.buildResolvedLabels(spec.labels, spec.data);
    var mapped;
    var keepBodies = {};
    var keepLabels = {};
    var child;
    var i;

    ensureRootGeometry(root, spec);
    ensureRootValue(root, spec, layout);
    mapped = mapChildren(root);
    child = mapped.body.main;

    if (child != null) {
      applyBodyCell(child, spec);
    } else {
      addChild(root, createBodyCell(spec), 0);
    }

    keepBodies.main = true;

    for (i = 0; i < resolvedLabels.length; i++) {
      var label = resolvedLabels[i];
      child = mapped.label[label.id];

      if (child != null) {
        applyLabelCell(child, label);
      } else {
        addChild(root, createLabelCell(label));
      }

      keepLabels[label.id] = true;
    }

    if (root.parent != null) {
      removeUnused(mapped.body, keepBodies);
      removeUnused(mapped.label, keepLabels);
    }

    root.setConnectable(true);
    return root;
  }

  function buildSymbolCell(spec) {
    var root = new mxCell(
      deps.createNode(deps.ROOT_TAG),
      new mxGeometry(0, 0, spec.size.width, spec.size.height),
      "",
    );
    root.vertex = true;
    root.setConnectable(true);

    return syncRoot(root, spec, null);
  }

  function extractSpec(root) {
    var raw = deps.getAttr(root, "symbolPayload");
    var spec;
    var portsRaw;
    var labelsRaw;
    var schemaJson;
    var dataJson;
    var paramsJson;
    var geo;

    if (raw == null || raw.length == 0) {
      throw new Error("缺少 symbolPayload 数据");
    }

    spec = JSON.parse(raw);

    if (!deps.isObject(spec.device)) {
      spec.device = {};
    }

    spec.ports = deps.normalizePortLayout(spec.ports);
    spec.labels = deps.normalizeLabels(spec.labels);
    spec.symbolId = deps.trim(deps.getAttr(root, "symbolId")) || spec.symbolId;
    spec.instanceId =
      deps.trim(deps.getAttr(root, "instanceId")) || deps.trim(spec.instanceId);
    spec.title = deps.trim(deps.getAttr(root, "title")) || spec.title;
    spec.device.name =
      deps.trim(deps.getAttr(root, "deviceName")) || deps.trim(spec.device.name);
    spec.device.code =
      deps.trim(deps.getAttr(root, "deviceCode")) || deps.trim(spec.device.code);
    spec.device.power =
      deps.trim(deps.getAttr(root, "devicePower")) || deps.trim(spec.device.power);
    spec.device.mode = deps.normalizeMode(
      deps.getAttr(root, "mode") || spec.device.mode,
    );
    spec.variantField =
      deps.trim(deps.getAttr(root, "variantField")) ||
      deps.trim(spec.variantField || "mode");

    portsRaw = deps.getAttr(root, "portsJson");

    if (portsRaw == null || portsRaw.length == 0) {
      portsRaw = deps.getAttr(root, "portLayout");
    }

    if (portsRaw != null && portsRaw.length > 0) {
      spec.ports = deps.parsePortLayout(portsRaw);
    }

    labelsRaw = deps.getAttr(root, "labelsJson");

    if (labelsRaw != null && labelsRaw.length > 0) {
      try {
        spec.labels = deps.normalizeLabels(JSON.parse(labelsRaw));
      } catch (e) {
        // ignore malformed labels override
      }
    }

    schemaJson = deps.getAttr(root, "schemaJson");

    if (schemaJson != null && schemaJson.length > 0) {
      try {
        spec.schema = JSON.parse(schemaJson);
      } catch (e) {
        // ignore malformed schema override
      }
    }

    dataJson = deps.getAttr(root, "dataJson");

    if (dataJson != null && dataJson.length > 0) {
      try {
        spec.data = JSON.parse(dataJson);
      } catch (e) {
        // ignore malformed data override
      }
    }

    paramsJson = deps.getAttr(root, "paramsJson");

    if (paramsJson != null && paramsJson.length > 0) {
      try {
        spec.device.params = JSON.parse(paramsJson);
      } catch (e) {
        // ignore malformed params override
      }
    }

    geo = model.getGeometry(root);

    if (geo != null) {
      spec.size = {
        width: Math.max(20, Math.round(geo.width)),
        height: Math.max(20, Math.round(geo.height)),
      };
    }

    return deps.normalizeSpec(spec);
  }

  function refreshRoot(root) {
    var spec = extractSpec(root);
    var portLayout = deps.parsePortLayout(deps.getAttr(root, "portLayout"));
    syncRoot(root, spec, portLayout);
    return spec;
  }

  return {
    buildSymbolCell,
    extractSpec,
    refreshRoot,
    syncRoot,
  };
}
