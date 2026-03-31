/**
 * 图库 graph 编解码子模块。
 * 负责模板 spec 与 mxLibrary entry 之间的互转，不直接读写 storage。
 */
export function createLibraryGraphCodec(deps) {
  var graph = deps.graph;
  var ui = deps.ui;
  var trim = deps.trim;

  function createLibraryEntry(spec) {
    var root = deps.buildSymbolCell(spec);
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
      spec: deps.cloneJson(spec),
    };
  }

  function getLibraryEntrySpec(image) {
    var xml;
    var cells;
    var i;

    if (image != null && deps.isObject(image.spec)) {
      return deps.normalizeSpec(deps.cloneJson(image.spec));
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
      if (deps.isElectricalRoot(cells[i])) {
        return deps.extractSpec(cells[i]);
      }
    }

    throw new Error("库条目中未找到电气图元");
  }

  function findLibraryEntryIndex(images, symbolId) {
    var id = trim(symbolId);
    var i;

    for (i = 0; i < images.length; i++) {
      try {
        if (trim(getLibraryEntrySpec(images[i]).symbolId) == id) {
          return i;
        }
      } catch (e) {
        // ignore malformed entry
      }
    }

    return -1;
  }

  return {
    createLibraryEntry,
    findLibraryEntryIndex,
    getLibraryEntrySpec,
  };
}
