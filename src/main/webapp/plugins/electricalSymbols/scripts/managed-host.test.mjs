import {test} from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const source = await readFile(new URL("../runtime/managedHost.js", import.meta.url), "utf8");
const host = await import("data:text/javascript," + encodeURIComponent(source));
function setup(managed=true) {
  const events=[], messages=[], actions=[];
  globalThis.window={location:{search:managed?"?eidHost=1":"",origin:"https://canvas.example",href:"https://canvas.example/editor"},parent:{postMessage:(...args)=>messages.push(args)}};
  globalThis.document={referrer:"https://ship.example/projects/1",addEventListener:(...args)=>events.push(args)};
  const actionNames=["save","saveAs","saveToBackend","rollbackBackend","delete","zoomIn","exportPdf"];
  const ctx={graph:{setConnectable(){},isEditing:()=>false,isCellEditable:()=>true,isCellMovable:()=>true,isCellDeletable:()=>true},ui:{setDarkMode(){},actions:{actions:Object.fromEntries(actionNames.map(name=>[name,{funct:()=>actions.push(name)}]))}}};
  host.installManagedHost(ctx);return {ctx,actions,messages,events};
}
test("standalone behavior is unchanged",()=>{const x=setup(false);x.ctx.ui.actions.actions.save.funct();assert.deepEqual(x.actions,["save"]);assert.equal(x.events.length,0);});
test("readonly blocks graph edits while zoom and export remain usable",()=>{const x=setup();assert.equal(x.ctx.graph.isCellEditable(),false);x.ctx.ui.actions.actions.delete.funct();x.ctx.ui.actions.actions.zoomIn.funct();x.ctx.ui.actions.actions.exportPdf.funct();assert.deepEqual(x.actions,["zoomIn","exportPdf"]);});
test("managed save forwards once to the exact parent origin and never invokes legacy storage",()=>{const x=setup();host.configureManagedHost(x.ctx,{readonly:false});x.ctx.ui.actions.actions.save.funct();x.ctx.ui.actions.actions.rollbackBackend.funct();assert.equal(x.messages.length,1);assert.equal(x.messages[0][1],"https://ship.example");assert.deepEqual(x.actions,[]);assert.equal(x.ctx.graph.isCellMovable(),true);});
test("losing edit rights blocks save and mutation shortcuts",()=>{const x=setup();host.configureManagedHost(x.ctx,{readonly:false});host.configureManagedHost(x.ctx,{readonly:true});let prevented=0;const handler=x.events.find(e=>e[0]==="keydown")[1];handler({ctrlKey:true,key:"s",preventDefault(){prevented++;},stopImmediatePropagation(){}});assert.equal(prevented,1);assert.equal(x.messages.length,0);assert.equal(x.ctx.graph.isCellDeletable(),false);});

test("host operations freeze user edits and save shortcuts until the operation completes",()=>{const x=setup();host.configureManagedHost(x.ctx,{readonly:false});x.ctx.shipHostState.suppressChanges=true;assert.equal(x.ctx.graph.isCellMovable(),false);x.ctx.ui.actions.actions.save.funct();assert.equal(x.messages.length,0);x.ctx.shipHostState.suppressChanges=false;assert.equal(x.ctx.graph.isCellMovable(),true);});

// 执行真实消息分支，检查合并后的握手不会被另一份同名分支提前截走。
const bridgeSource = await readFile(new URL('../runtime/hostBridge.js', import.meta.url), 'utf8');
const start = bridgeSource.indexOf('        if (payload.action === "setHostOperation")');
const end = bridgeSource.indexOf('        if (isManagedHost() && ctx.shipHostState?.readonly', start);
assert.ok(start >= 0 && end > start);
assert.equal((bridgeSource.match(/payload.action === "setHostContext"/g) || []).length, 1);
assert.equal((bridgeSource.match(/payload.action === "setHostOperation"/g) || []).length, 1);
const handle = new Function('ctx', 'runtimeState', 'payload', 'managed', 'configureManagedHost', 'applyHostContext', `
  const replies = [], events = [];
  const evt = {source: {}, stopImmediatePropagation(){}};
  const isManagedHost = () => managed;
  const postResult = (_source, _payload, result) => replies.push(result);
  const emitHostEvent = (...args) => events.push(args);
  const clearTimeout = () => {};
  let modelChangeDebounce = 1, pendingStructuralModelChange = true;
  (function(){${bridgeSource.slice(start, end)}})();
  return {replies, events, modelChangeDebounce};
`);
for (const managed of [false, true]) {
  test(`host handshake and operation acknowledgements: managed=${managed}`, () => {
    const x = setup(managed), runtime = {};
    let legacyCalls = 0;
    const applyLegacy = payload => {legacyCalls++; runtime.hostReadonly = payload.readonly;};
    const context = handle(x.ctx, runtime, {action:'setHostContext', readonly:false}, managed, host.configureManagedHost, applyLegacy);
    assert.equal(context.replies.length, 1);
    assert.equal(context.replies[0].readonly, false);
    assert.equal(legacyCalls, managed ? 0 : 1);
    const started = handle(x.ctx, runtime, {action:'setHostOperation', suppressChanges:true}, managed, host.configureManagedHost, applyLegacy);
    assert.deepEqual(started.replies, [{suppressChanges:true}]);
    assert.equal(runtime.hostOperation, true);
    if (managed) {
      assert.equal(x.ctx.shipHostState.suppressChanges, true);
      assert.equal(x.ctx.graph.isCellMovable(), false);
      assert.equal(started.events.length, 1);
      assert.equal(started.modelChangeDebounce, null);
    }
    handle(x.ctx, runtime, {action:'setHostOperation', suppressChanges:false}, managed, host.configureManagedHost, applyLegacy);
    assert.equal(runtime.hostOperation, false);
    if (managed) assert.equal(x.ctx.graph.isCellMovable(), true);
  });
}
