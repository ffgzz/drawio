/**
 * 插件按钮工厂。
 * 用统一样式创建插件内部常用按钮，避免各窗口重复写样式。
 */
// 统一按钮样式可以让不同窗口保持一致的视觉和间距。
export function createPluginButton(label, fn) {
  var button = mxUtils.button(label, fn);
  button.className = "geBtn";
  button.style.marginRight = "8px";
  button.style.marginTop = "8px";
  return button;
}
