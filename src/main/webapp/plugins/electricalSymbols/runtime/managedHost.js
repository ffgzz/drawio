/** Opt-in integration with the ship-electric-design host. Standalone Draw.io keeps its original behavior. */
export function isManagedHost() {
  return new URLSearchParams(window.location.search).get("eidHost") === "1";
}
export function managedHostOrigin() {
  try { const origin = new URL(document.referrer || window.location.href).origin; return origin === "null" ? window.location.origin : origin; }
  catch { return window.location.origin; }
}
export function configureManagedHost(ctx, payload) {
  if (!isManagedHost()) return { managedHost: false };
  ctx.shipHostState = ctx.shipHostState || { readonly: true };
  ctx.shipHostState.readonly = payload.readonly !== false;
  ctx.graph.setConnectable(!ctx.shipHostState.readonly);
  if (ctx.shipHostState.readonly && ctx.graph.isEditing()) ctx.graph.stopEditing(true);
  if (typeof payload.dark === "boolean" && typeof ctx.ui.setDarkMode === "function") {
    const previous = ctx.shipHostState.suppressChanges; ctx.shipHostState.suppressChanges = true;
    try { ctx.ui.setDarkMode(payload.dark); } finally { ctx.shipHostState.suppressChanges = previous; }
  }
  return {managedHost: true, readonly: ctx.shipHostState.readonly};
}
export function requestManagedSave(ctx) {
  if (!isManagedHost() || ctx.shipHostState?.readonly !== false || ctx.shipHostState?.suppressChanges) return;
  window.parent.postMessage(JSON.stringify({event: "eid-save-requested"}), managedHostOrigin());
}
export function installManagedHost(ctx) {
  if (!isManagedHost()) return;
  configureManagedHost(ctx, {readonly: true});
  const graph = ctx.graph;
  const readonly = () => ctx.shipHostState.readonly || ctx.shipHostState.suppressChanges;
  for (const name of ["isCellEditable", "isCellMovable", "isCellResizable", "isCellDeletable", "isCellCloneable", "isCellConnectable", "isCellBendable", "isCellDisconnectable", "isCellRotatable"]) {
    const original = graph[name];
    if (typeof original === "function") graph[name] = function(...args) { return !readonly() && original.apply(this, args); };
  }
  for (const [name, action] of Object.entries(ctx.ui.actions.actions || {})) {
    if (!action || typeof action.funct !== "function") continue;
    const original = action.funct;
    const saveAction = ["save", "saveAs", "saveToBackend"].includes(name);
    const readAction = /^(zoom|fit|select|copy|export|print|fullscreen|pageView|layers|outline|help|about)/i.test(name);
    action.funct = function(...args) {
      if (saveAction) { requestManagedSave(ctx); return; }
      if (/backend|rollback/i.test(name)) return;
      if (readonly() && !readAction) return;
      return original.apply(this, args);
    };
  }
  document.addEventListener("keydown", function(event) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
      event.preventDefault(); event.stopImmediatePropagation(); requestManagedSave(ctx); return;
    }
    if (readonly() && (event.key === "Delete" || event.key === "Backspace" || ((event.ctrlKey || event.metaKey) && ["v", "x", "z", "y", "d"].includes(event.key.toLowerCase())))) {
      event.preventDefault(); event.stopImmediatePropagation();
    }
  }, true);
  for (const eventName of ["paste", "cut", "drop"]) document.addEventListener(eventName, function(event) {
    if (readonly()) { event.preventDefault(); event.stopImmediatePropagation(); }
  }, true);
}
