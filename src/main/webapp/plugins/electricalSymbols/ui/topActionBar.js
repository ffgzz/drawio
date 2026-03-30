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
    var button = createButton(mxResources.get(item.resourceKey), function () {
      ui.actions.get(item.actionKey).funct();
    });
    button.style.marginTop = "0";
    button.style.marginRight = "0";
    button.style.padding = "6px 16px";
    bar.appendChild(button);
  });

  ui.menubarContainer.appendChild(bar);
}

