/**
 * 顶部动作栏渲染器。
 * 负责把插件 action 以按钮形式铺到 draw.io 顶部菜单容器里。
 */
// 这里只渲染按钮，不负责 action 注册。
function destroyMenu(menu, onClose) {
  if (typeof onClose === "function") {
    onClose();
  }

  if (menu != null && menu.parentNode != null) {
    menu.parentNode.removeChild(menu);
  }
}

function createMenuItem(label, handler) {
  var item = document.createElement("button");
  item.setAttribute("type", "button");
  item.innerText = label;
  item.style.display = "block";
  item.style.width = "100%";
  item.style.padding = "8px 12px";
  item.style.border = "0";
  item.style.background = "transparent";
  item.style.textAlign = "left";
  item.style.cursor = "pointer";
  item.style.fontSize = "13px";
  item.onmouseenter = function () {
    item.style.background = Editor.isDarkMode() ? "#3a3a3a" : "#f5f7fa";
  };
  item.onmouseleave = function () {
    item.style.background = "transparent";
  };
  item.onclick = handler;
  return item;
}

function createExportDropdownButton(ui, createButton, label) {
  var button = createButton(label, function () {});
  var menu = null;
  var closeHandler = null;
  var escapeHandler = null;

  function closeMenu() {
    destroyMenu(menu, function () {
      if (closeHandler != null) {
        document.removeEventListener("mousedown", closeHandler, true);
        closeHandler = null;
      }

      if (escapeHandler != null) {
        document.removeEventListener("keydown", escapeHandler, true);
        escapeHandler = null;
      }
    });

    menu = null;
    button.setAttribute("aria-expanded", "false");
  }

  function openMenu() {
    var rect = button.getBoundingClientRect();

    menu = document.createElement("div");
    menu.style.position = "fixed";
    menu.style.left = rect.left + "px";
    menu.style.top = rect.bottom + 6 + "px";
    menu.style.minWidth = Math.max(140, rect.width) + "px";
    menu.style.padding = "6px 0";
    menu.style.border = "1px solid " + (Editor.isDarkMode() ? "#4b5563" : "#d0d7de");
    menu.style.borderRadius = "8px";
    menu.style.background = Editor.isDarkMode() ? "#2b2b2b" : "#ffffff";
    menu.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.16)";
    menu.style.zIndex = "10000";

    menu.appendChild(
      createMenuItem("SVG", function () {
        closeMenu();
        ui.actions.get("electricalExportSvg").funct();
      }),
    );
    menu.appendChild(
      createMenuItem("PDF", function () {
        closeMenu();

        if (ui.actions.get("exportPdf") == null) {
          ui.alert("当前环境缺少 PDF 导出动作。");
          return;
        }

        ui.actions.get("exportPdf").funct();
      }),
    );
    menu.appendChild(
      createMenuItem("DXF", function () {
        closeMenu();
        ui.alert("当前 draw.io 内核不支持 DXF 直接导出，请先导出 SVG 再转换为 DXF。");
      }),
    );

    document.body.appendChild(menu);
    button.setAttribute("aria-expanded", "true");

    closeHandler = function (evt) {
      if (evt.target !== button && !button.contains(evt.target) && !menu.contains(evt.target)) {
        closeMenu();
      }
    };
    escapeHandler = function (evt) {
      if (evt.key === "Escape") {
        closeMenu();
      }
    };

    document.addEventListener("mousedown", closeHandler, true);
    document.addEventListener("keydown", escapeHandler, true);
  }

  button.setAttribute("aria-haspopup", "menu");
  button.setAttribute("aria-expanded", "false");
  button.onclick = function (evt) {
    mxEvent.consume(evt);

    if (menu != null) {
      closeMenu();
    } else {
      openMenu();
    }
  };

  return button;
}

export function installTopActionBar(options) {
  var ui = options.ui;
  var createButton = options.createButton;
  var items = options.items || [];

  if (ui.menubarContainer == null) {
    return;
  }

  ui.menubarContainer.innerHTML = "";
  ui.menubarContainer.style.display = "flex";
  ui.menubarContainer.style.alignItems = "center";
  ui.menubarContainer.style.padding = "0 12px";

  var bar = document.createElement("div");
  bar.style.display = "flex";
  bar.style.alignItems = "center";
  bar.style.gap = "12px";
  bar.style.width = "100%";
  bar.style.height = "100%";

  items.forEach(function (item) {
    var button = null;

    if (item.actionKey === "electricalExport") {
      button = createExportDropdownButton(
        ui,
        createButton,
        mxResources.get(item.resourceKey),
      );
    } else {
      button = createButton(mxResources.get(item.resourceKey), function () {
        ui.actions.get(item.actionKey).funct();
      });
    }

    button.style.marginTop = "0";
    button.style.marginRight = "0";
    button.style.padding = "6px 16px";
    bar.appendChild(button);
  });

  ui.menubarContainer.appendChild(bar);
}
