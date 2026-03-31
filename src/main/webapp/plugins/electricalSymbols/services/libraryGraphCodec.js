/**
 * 图库 graph 编解码子模块。
 * 负责模板 spec 与 mxLibrary entry 之间的互转，不直接读写 storage。
 */
import { cloneJson, isObject, trim } from "../utils/base.js";

export function createLibraryEntry(graph, buildSymbolCell, spec) {
  var root = buildSymbolCell(spec);
  var bounds = graph.getBoundingBoxFromGeometry([root]);
  var xml;

  if (bounds != null) {
    root.geometry = root.geometry.clone();
    root.geometry.x = -bounds.x;
    root.geometry.y = -bounds.y;
  }

  xml = mxUtils.getXml(graph.encodeCells([root]));

  if (Editor.defaultCompressed) {
    xml = Graph.compress(xml);
  }

  return {
    xml,
    w: bounds != null ? Math.round(bounds.width) : spec.size.width,
    h: bounds != null ? Math.round(bounds.height) : spec.size.height,
    title: spec.templateName || spec.title,
    spec: cloneJson(spec),
  };
}

export function getLibraryEntrySpec(
  ui,
  image,
  normalizeSpec,
  isElectricalRoot,
  extractSpec,
) {
  var xml;
  var cells;
  var i;

  if (image != null && isObject(image.spec)) {
    return normalizeSpec(cloneJson(image.spec));
  }

  if (image == null || image.xml == null) {
    throw new Error("模板条目缺少 xml");
  }

  xml = image.xml;

  if ("<" != xml.charAt(0)) {
    xml = Graph.decompress(xml);
  }

  cells = ui.stringToCells(xml);

  for (i = 0; i < cells.length; i++) {
    if (isElectricalRoot(cells[i])) {
      return extractSpec(cells[i]);
    }
  }

  throw new Error("库条目中未找到电气图元");
}

export function findLibraryEntryIndex(images, symbolId, getLibraryEntrySpecFn) {
  var id = trim(symbolId);
  var i;

  for (i = 0; i < images.length; i++) {
    try {
      if (trim(getLibraryEntrySpecFn(images[i]).symbolId) == id) {
        return i;
      }
    } catch (e) {
      // ignore malformed entry
    }
  }

  return -1;
}
