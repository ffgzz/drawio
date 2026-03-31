/**
 * 图库存储子模块。
 * 只负责 draw.io library 的读取、保存和 sidebar 同步，不处理图元编码细节。
 */
export function loadStoredLibrary(ui, state, libraryTitle, callback, openInSidebar) {
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
        ui.libraryLoaded(new StorageLibrary(ui, data, libraryTitle), images, libraryTitle, true);
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

export function saveLibraryImages(ui, state, libraryTitle, images, callback) {
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
