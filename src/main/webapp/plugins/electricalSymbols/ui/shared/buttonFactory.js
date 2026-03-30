export function createPluginButton(label, fn) {
  var button = mxUtils.button(label, fn);
  button.className = "geBtn";
  button.style.marginRight = "8px";
  button.style.marginTop = "8px";
  return button;
}
