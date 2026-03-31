/**
 * 本地图元库服务。
 * 负责模板保存、删除、加载以及从图上提取模板规格。
 */
// 图库底层仍然使用 draw.io 现有格式存储，但外部只暴露统一接口。
export function createLibraryStore(deps) {
  var ctx = deps.ctx;
  var ui = ctx.ui;
  var graph = ctx.graph;
  var state = ctx.state;
  var libraryTitle = ctx.constants.LIBRARY_TITLE;
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

  function isTemplateNameTaken(name, ignoreSymbolId) {
    var target = trim(name);
    var ignoreId = trim(ignoreSymbolId);
    var i;

    if (target.length == 0) {
      return false;
    }

    for (i = 0; i < state.libraryImages.length; i++) {
      try {
        var spec = getLibraryEntrySpec(state.libraryImages[i]);

        if (
          trim(spec.templateName || spec.title) == target &&
          trim(spec.symbolId) != ignoreId
        ) {
          return true;
        }
      } catch (e) {
        // ignore malformed entry
      }
    }

    return false;
  }

  function loadStoredLibrary(callback, openInSidebar) {
    StorageFile.getFileContent(
      ui,
      libraryTitle,
      function (data) {
        var images = [];

        if (data != null && data.length > 0) {
          try {
            var doc = mxUtils.parseXml(data);

            if (
              doc.documentElement != null &&
              doc.documentElement.nodeName == "mxlibrary"
            ) {
              images = JSON.parse(mxUtils.getTextContent(doc.documentElement));
            }
          } catch (e) {
            images = [];
          }
        }

        state.libraryImages = images;

        if (openInSidebar && data != null && data.length > 0) {
          ui.libraryLoaded(
            new StorageLibrary(ui, data, libraryTitle),
            images,
            libraryTitle,
            true,
          );
        }

        if (callback != null) {
          callback(images);
        }
      },
      function () {
        state.libraryImages = [];

        if (callback != null) {
          callback([]);
        }
      },
    );
  }

  function saveLibraryImages(images, callback) {
    var xml = ui.createLibraryDataFromImages(images);
    var file = new StorageLibrary(ui, xml, libraryTitle);

    ui.libraryLoaded(file, images, libraryTitle, true);
    file.save(
      false,
      function () {
        state.libraryImages = images;

        if (callback != null) {
          callback(file, images, xml);
        }
      },
      function (err) {
        ui.handleError(err || { message: "保存电气图库失败" });
      },
    );
  }

  function addToLibrary(spec, onSaved) {
    loadStoredLibrary(function (images) {
      var next = images.slice();
      var entry = createLibraryEntry(spec);
      var index = findLibraryEntryIndex(next, spec.symbolId);
      var i;

      for (i = 0; i < next.length; i++) {
        try {
          var currentSpec = getLibraryEntrySpec(next[i]);

          if (
            trim(currentSpec.templateName || currentSpec.title) ==
              trim(spec.templateName || spec.title) &&
            trim(currentSpec.symbolId) != trim(spec.symbolId)
          ) {
            deps.showStatus("图元类型名称不能重复", true);
            return;
          }
        } catch (e) {
          // ignore malformed entry
        }
      }

      if (index >= 0) {
        next[index] = entry;
      } else {
        next.push(entry);
      }

      saveLibraryImages(next, function () {
        deps.showStatus(index >= 0 ? "已更新图库模板" : "已加入图库", false);

        if (typeof onSaved === "function") {
          onSaved();
        }
      });
    });
  }

  function removeTemplateFromLibrary(symbolId, onRemoved) {
    loadStoredLibrary(function (images) {
      var next = [];
      var removed = false;
      var i;

      for (i = 0; i < images.length; i++) {
        try {
          if (
            trim(getLibraryEntrySpec(images[i]).symbolId) == trim(symbolId)
          ) {
            removed = true;
            continue;
          }
        } catch (e) {
          // keep malformed entries untouched
        }

        next.push(images[i]);
      }

      if (!removed) {
        deps.showStatus("未找到要删除的图元模板", true);
        return;
      }

      saveLibraryImages(next, function () {
        deps.showStatus("已删除图元模板", false);

        if (typeof onRemoved === "function") {
          onRemoved(next);
        }
      });
    });
  }

  return {
    addToLibrary,
    getLibraryEntrySpec,
    isTemplateNameTaken,
    loadStoredLibrary,
    removeTemplateFromLibrary,
    saveLibraryImages,
  };
}
