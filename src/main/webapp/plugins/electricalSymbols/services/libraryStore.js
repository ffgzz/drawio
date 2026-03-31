/**
 * 本地图元库服务。
 * 这里作为组合层，连接图库 storage 和 graph 编解码模块，对外暴露统一图库接口。
 */
import { createLibraryStorage } from "./libraryStorage.js";
import { createLibraryGraphCodec } from "./libraryGraphCodec.js";

export function createLibraryStore(deps) {
  var state = deps.state;
  var trim = deps.trim;
  var storage = createLibraryStorage(deps);
  var codec = createLibraryGraphCodec(deps);

  function isTemplateNameTaken(name, ignoreSymbolId) {
    var target = trim(name);
    var ignoreId = trim(ignoreSymbolId);
    var i;

    if (target.length == 0) {
      return false;
    }

    for (i = 0; i < state.libraryImages.length; i++) {
      try {
        var spec = codec.getLibraryEntrySpec(state.libraryImages[i]);

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

  function addToLibrary(spec, onSaved) {
    storage.loadStoredLibrary(function (images) {
      var next = images.slice();
      var entry = codec.createLibraryEntry(spec);
      var index = codec.findLibraryEntryIndex(next, spec.symbolId);
      var i;

      for (i = 0; i < next.length; i++) {
        try {
          var currentSpec = codec.getLibraryEntrySpec(next[i]);

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

      storage.saveLibraryImages(next, function () {
        deps.showStatus(index >= 0 ? "已更新图库模板" : "已加入图库", false);

        if (typeof onSaved === "function") {
          onSaved();
        }
      });
    });
  }

  function removeTemplateFromLibrary(symbolId, onRemoved) {
    storage.loadStoredLibrary(function (images) {
      var next = [];
      var removed = false;
      var i;

      for (i = 0; i < images.length; i++) {
        try {
          if (
            trim(codec.getLibraryEntrySpec(images[i]).symbolId) == trim(symbolId)
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

      storage.saveLibraryImages(next, function () {
        deps.showStatus("已删除图元模板", false);

        if (typeof onRemoved === "function") {
          onRemoved(next);
        }
      });
    });
  }

  return {
    addToLibrary,
    getLibraryEntrySpec: codec.getLibraryEntrySpec,
    isTemplateNameTaken,
    loadStoredLibrary: storage.loadStoredLibrary,
    removeTemplateFromLibrary,
    saveLibraryImages: storage.saveLibraryImages,
  };
}
