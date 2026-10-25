'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const dir=path.resolve(process.argv[2]||path.join(root,'site'));
const html=fs.readFileSync(path.join(dir,'index.html'),'utf8');
const catalog=JSON.parse(fs.readFileSync(path.join(root,'qa/cronicas-catalog-preview.json'),'utf8'));
assert.equal(catalog.achievements.length,60);
assert.equal(catalog.achievements.reduce((s,x)=>s+x.glory,0),1000);
assert.equal(new Set(catalog.achievements.map(x=>x.id)).size,60);
assert.deepEqual(Object.fromEntries(['bronze','prata','ouro','lendaria'].map(t=>
 [t,catalog.achievements.filter(x=>x.tier===t).length])),
 {bronze:36,prata:16,ouro:6,lendaria:2});
const source=fs.readFileSync(path.join(root,'qa/cronicas-ui.js'),'utf8');
const css=fs.readFileSync(path.join(root,'qa/cronicas-ui.css'),'utf8');
const scriptId='<script id="tav-cronicas-script">',styleId='<style id="tav-cronicas-style">';
assert.equal(html.split(scriptId).length-1,1,'UI Script must be injected once');
assert.equal(html.split(styleId).length-1,1,'UI Style must be injected once');
const script=html.split(scriptId)[1]?.split('</script>')[0];
const style=html.split(styleId)[1]?.split('</style>')[0];
assert(script?.includes('EST_01')&&script.includes('AVE_14'));
assert(style?.includes('#tavCronicasOverlay'));
assert(!script.includes('/*TAV_CRONICAS_CATALOG*/'));
assert.equal(html.includes('id="tav-theme-manager"'),true);
assert.equal(html.includes('id="tav-entrance-script"'),true);
assert.equal(html.includes('id="alpha-accounts-script"'),true);
assert(html.indexOf(scriptId)>html.indexOf('<script id="tav-entrance-script">'),
 'Crônicas must load after entrance/identity and theme manager');
assert(source.includes("const API='https://taverna-multiplayer-servidor.edulopes941.workers.dev'"));
assert(!source.includes('grantWallet('));
assert(!source.includes('localStorage.setItem('));
assert(!source.includes('sceneGame')||source.includes("install('#sceneWelcome'"),
 'Never insert a new control on the table');
assert(css.includes(':root[data-tav-palette^="neon-"] #tavCronicasOverlay'));
assert(css.includes('#tavCronicasOverlay[hidden]'));
const palette=fs.readFileSync(path.join(root,'qa/theme-manager.js'),'utf8');
assert.equal((palette.match(/Object.freeze\(\{id:'(?:classic|neon-[a-z-]+)'/g)||[]).length,12);
assert(source.includes('aria-modal'));
assert(source.includes('aria-pressed'));
assert(source.includes("event.key==='Escape'"));
console.log('CRONICAS_UI_STATIC_OK: 60 goals, 1000 G, 12 palettes, isolated source, no payouts');
