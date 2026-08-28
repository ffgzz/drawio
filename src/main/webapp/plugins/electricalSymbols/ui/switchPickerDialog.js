/**
 * 开关选择器。
 *
 * 从图元库里挑一个模板绑定到配电柜的块上：建实例 → 摆进块内（右边缘贴柜壁）
 * → 建立托管连线。一个块只绑一个开关，重复绑定会替换掉原来的。
 *
 * 说明：插件的图元模板没有稳定的"类别"字段，所以这里不做类别过滤，
 * 而是给一个搜索框——按名称/编号筛选比伪造一套分类可靠。
 */
import { getApp } from "../core/appRuntime.js";
import { trim } from "../utils/base.js";
import { getAttr } from "../utils/xml.js";
import { setCanvasStatus, showStatus } from "../core/runtimeHelpers.js";
import { commandApi } from "../application/commands.js";
import { libraryStoreApi } from "../services/libraryStore.js";
import { specDomainApi } from "../domain/spec.js";
import { getCabinetPopupPosition } from "./cabinetDialog.js";

var DIALOG_WIDTH = 360;
var DIALOG_HEIGHT = 420;

function getState() {
  return getApp().ctx.state;
}

export function closeSwitchPickerDialog() {
  var state = getState();

  if (state.switchPickerWindow != null) {
    var wnd = state.switchPickerWindow;
    state.switchPickerWindow = null;
    wnd.destroy();
  }
}

function loadTemplates(onReady) {
  libraryStoreApi.loadStoredLibrary(function (images) {
    var templates = [];
    var i;

    for (i = 0; i < images.length; i++) {
      try {
        templates.push(libraryStoreApi.getLibraryEntrySpec(images[i]));
      } catch (e) {
        // 跳过损坏的库条目
      }
    }

    onReady(templates);
  });
}

function createTemplateRow(template, onPick) {
  var row = document.createElement("div");
  row.style.display = "flex";
  row.style.alignItems = "center";
  row.style.gap = "10px";
  row.style.padding = "6px 8px";
  row.style.border = "1px solid transparent";
  row.style.borderRadius = "4px";
  row.style.cursor = "pointer";

  row.onmouseenter = function () {
    row.style.background = Editor.isDarkMode() ? "#2a2a2a" : "#f0f3f7";
    row.style.borderColor = "#2a5c9c";
  };
  row.onmouseleave = function () {
    row.style.background = "transparent";
    row.style.borderColor = "transparent";
  };

  var thumb = document.createElement("div");
  thumb.style.width = "40px";
  thumb.style.height = "32px";
  thumb.style.flex = "0 0 auto";
  thumb.style.display = "flex";
  thumb.style.alignItems = "center";
  thumb.style.justifyContent = "center";
  thumb.style.overflow = "hidden";

  if (trim(template.svg).length > 0) {
    var img = document.createElement("img");
    // 不能用 ;base64,——drawio 的 XML 解析会破坏这种 data URL
    img.setAttribute("src", "data:image/svg+xml," + encodeURIComponent(template.svg));
    img.style.maxWidth = "100%";
    img.style.maxHeight = "100%";
    thumb.appendChild(img);
  }

  row.appendChild(thumb);

  var text = document.createElement("div");
  text.style.flex = "1 1 auto";
  text.style.minWidth = "0";

  var title = document.createElement("div");
  title.innerText = trim(template.title) || trim(template.symbolId) || "未命名";
  title.style.fontSize = "13px";
  title.style.overflow = "hidden";
  title.style.textOverflow = "ellipsis";
  title.style.whiteSpace = "nowrap";
  text.appendChild(title);

  var subtitle = document.createElement("div");
  subtitle.innerText = trim(template.symbolId);
  subtitle.style.fontSize = "11px";
  subtitle.style.color = Editor.isDarkMode() ? "#9aa0a6" : "#6b7280";
  subtitle.style.overflow = "hidden";
  subtitle.style.textOverflow = "ellipsis";
  subtitle.style.whiteSpace = "nowrap";
  text.appendChild(subtitle);

  row.appendChild(text);

  mxEvent.addListener(row, "click", function () {
    onPick(template);
  });

  return row;
}

/**
 * @param {Object} blockCell   要绑开关的块
 * @param {Object} nativeEvent 触发点击的原生事件，用来把窗口贴到入口附近
 */
export function openSwitchPickerDialog(blockCell, nativeEvent) {
  if (blockCell == null) {
    return;
  }

  closeSwitchPickerDialog();

  loadTemplates(function (templates) {
    var div = document.createElement("div");
    div.style.padding = "10px";
    div.style.display = "flex";
    div.style.flexDirection = "column";
    div.style.gap = "8px";
    div.style.boxSizing = "border-box";
    div.style.width = "100%";
    div.style.height = "100%";

    var search = document.createElement("input");
    search.setAttribute("type", "text");
    search.setAttribute("placeholder", "按名称或编号筛选");
    search.style.flex = "0 0 auto";
    div.appendChild(search);

    var list = document.createElement("div");
    list.style.flex = "1 1 auto";
    list.style.overflow = "auto";
    list.style.display = "flex";
    list.style.flexDirection = "column";
    list.style.gap = "2px";
    div.appendChild(list);

    // 图库为空是常见的首次使用状态，要给出下一步怎么走，而不是一个空列表
    function renderEmptyState(message, hint) {
      var box = document.createElement("div");
      box.style.padding = "16px 8px";
      box.style.color = Editor.isDarkMode() ? "#9aa0a6" : "#6b7280";
      box.style.fontSize = "12.5px";
      box.style.lineHeight = "1.7";

      var title = document.createElement("div");
      title.innerText = message;
      title.style.marginBottom = "6px";
      box.appendChild(title);

      if (hint != null) {
        var tip = document.createElement("div");
        tip.innerText = hint;
        box.appendChild(tip);
      }

      list.appendChild(box);
    }

    function pick(template) {
      try {
        commandApi.bindCabinetSwitch(
          blockCell,
          specDomainApi.buildInstanceSpec({}, template),
        );
      } catch (e) {
        var message = e.message || String(e);
        showStatus(message, true);
        setCanvasStatus(message);
        return;
      }

      closeSwitchPickerDialog();
    }

    function render() {
      var keyword = trim(search.value).toLowerCase();
      var shown = 0;
      var i;

      list.innerHTML = "";

      for (i = 0; i < templates.length; i++) {
        var template = templates[i];
        var haystack = (
          trim(template.title) + " " + trim(template.symbolId)
        ).toLowerCase();

        if (keyword.length > 0 && haystack.indexOf(keyword) < 0) {
          continue;
        }

        list.appendChild(createTemplateRow(template, pick));
        shown++;
      }

      if (shown > 0) {
        return;
      }

      if (templates.length == 0) {
        renderEmptyState(
          "电气图元库还是空的。",
          "开关是从图元库里选的：先在 Extras 菜单点「定义电气图元」打开编辑器，画好开关后点「加入库」，它就会出现在这里。",
        );
      } else {
        renderEmptyState("没有匹配的图元类型。", "换个关键词，或者清空搜索框看全部。");
      }
    }

    mxEvent.addListener(search, "input", render);
    render();

    var position = getCabinetPopupPosition(nativeEvent, DIALOG_WIDTH, DIALOG_HEIGHT);
    var wnd = new mxWindow(
      "选择开关",
      div,
      position.x,
      position.y,
      DIALOG_WIDTH,
      DIALOG_HEIGHT,
      true,
      true,
    );

    wnd.destroyOnClose = true;
    wnd.setClosable(true);
    wnd.setMaximizable(false);
    wnd.setResizable(true);
    wnd.setScrollable(false);
    wnd.addListener(mxEvent.DESTROY, function () {
      getState().switchPickerWindow = null;
    });

    getState().switchPickerWindow = wnd;
    wnd.setVisible(true);
    search.focus();
  });
}

export var switchPickerApi = {
  closeSwitchPickerDialog,
  openSwitchPickerDialog,
};
