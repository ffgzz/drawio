/**
 * 本地图元库服务。
 * 这里作为组合层，连接图库 storage 和 graph 编解码模块，对外暴露统一图库接口。
 */
import { trim } from "../utils/base.js";
import {
  createLibraryEntry,
  findLibraryEntryIndex,
  getLibraryEntrySpec,
} from "./libraryGraphCodec.js";
import { loadStoredLibrary, saveLibraryImages } from "./libraryStorage.js";

export function createLibraryStore() {
  var deps = arguments.length > 0 ? arguments[0] : {};
  var state = deps.state;

  function getLibraryEntrySpecCompat(image) {
    return getLibraryEntrySpec(
      deps.ui,
      image,
      deps.normalizeSpec,
      deps.isElectricalRoot,
      deps.extractSpec,
    );
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
        var spec = getLibraryEntrySpecCompat(state.libraryImages[i]);

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
    loadStoredLibrary(deps.ui, deps.state, deps.libraryTitle, function (images) {
      var next = images.slice();
      var entry = createLibraryEntry(deps.graph, deps.buildSymbolCell, spec);
      var index = findLibraryEntryIndex(next, spec.symbolId, getLibraryEntrySpecCompat);
      var i;

      for (i = 0; i < next.length; i++) {
        try {
          var currentSpec = getLibraryEntrySpecCompat(next[i]);

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

      saveLibraryImages(deps.ui, deps.state, deps.libraryTitle, next, function () {
        deps.showStatus(index >= 0 ? "已更新图库模板" : "已加入图库", false);

        if (typeof onSaved === "function") {
          onSaved();
        }
      });
    });
  }

  function removeTemplateFromLibrary(symbolId, onRemoved) {
    loadStoredLibrary(deps.ui, deps.state, deps.libraryTitle, function (images) {
      var next = [];
      var removed = false;
      var i;

      for (i = 0; i < images.length; i++) {
        try {
          if (trim(getLibraryEntrySpecCompat(images[i]).symbolId) == trim(symbolId)) {
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

      saveLibraryImages(deps.ui, deps.state, deps.libraryTitle, next, function () {
        deps.showStatus("已删除图元模板", false);

        if (typeof onRemoved === "function") {
          onRemoved(next);
        }
      });
    });
  }

  return {
    addToLibrary,
    getLibraryEntrySpec: getLibraryEntrySpecCompat,
    isTemplateNameTaken,
    loadStoredLibrary: function (callback, openInSidebar) {
      return loadStoredLibrary(
        deps.ui,
        deps.state,
        deps.libraryTitle,
        callback,
        openInSidebar,
      );
    },
    removeTemplateFromLibrary,
    saveLibraryImages: function (images, callback) {
      return saveLibraryImages(
        deps.ui,
        deps.state,
        deps.libraryTitle,
        images,
        callback,
      );
    },
  };
}
