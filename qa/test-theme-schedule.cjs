'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const root=path.resolve(__dirname,'..'),base=path.resolve(process.argv[2]||path.join(root,'site'));
const html=fs.readFileSync(path.join(base,'index.html'),'utf8');
const config=JSON.parse(fs.readFileSync(path.join(root,'qa/theme-schedule.json'),'utf8'));
const release=JSON.parse(fs.readFileSync(path.join(root,'qa/alpha-releases.json'),'utf8'));
const trial=config.themes.find(e=>e.id==='neon-test');
assert(trial);
const start=Date.parse(trial.start),end=Date.parse(trial.end);
assert.equal(end-start,7200000,'O teste sazonal mantém 120 minutos absolutos');
assert.equal(trial.start,'2026-10-24T15:50:00-03:00');
assert.equal(trial.end,'2026-10-24T17:50:00-03:00');
assert.equal(release.entries[0].id,release.current);
assert(release.entries[0].items.some(s=>/aparência|neon|tema/i.test(s)));
const script=html.match(/<script id="tav-theme-manager">([\s\S]*?)<\/script>/)?.[1];
const menuScript=html.match(/<script id="tav-appearance-menu">([\s\S]*?)<\/script>/)?.[1];
const css=html.match(/<style id="tav-seasonal-themes">([\s\S]*?)<\/style>/)?.[1];
assert(script&&css&&menuScript,'As duas camadas e as opções do jogador precisam estar no build');

/* Garantir que a textura final sobreviva à montagem e preserve a geometria
   original: zero imagens, zero mudanças em cartas, naipes, turnos ou cliques. */
const materials=fs.readFileSync(path.join(root,'qa/theme-materials.css'),'utf8').trim();
assert(css.includes(materials),'Camada dos materiais não foi embutida no HTML gerado');
assert(!materials.includes(':root[data-tav-palette="classic"]'),'Taverna Clássica deve ficar intocada');
const backdropIds=['neon-blue','neon-green','neon-pink','neon-tavern-dark','neon-aero','neon-imperial','neon-amber'];
const backdropPaths=backdropIds.map(id=>'./theme-backdrops/'+id+'.svg');
const assetUrls=[...materials.matchAll(/url\("([^"]+)"\)/g)].map(m=>m[1]);
assert.deepEqual(assetUrls,backdropPaths,'CSS do cenário só pode referenciar os sete SVG locais');
assert(!materials.includes('https://')&&!materials.includes('http://'),'Cenário não deve baixar imagens remotas');
const sw=fs.readFileSync(path.join(base,'sw.js'),'utf8');
assert(sw.includes('taverna-pwa-'+release.current),'O PWA precisa atualizar o cache para esta versão');
for(const id of backdropIds){
 const svg=fs.readFileSync(path.join(base,'theme-backdrops',id+'.svg'),'utf8');
 assert(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')&&svg.trimEnd().endsWith('</svg>'),'Fundo SVG inválido: '+id);
 assert(svg.length>15000,'Fundo demasiado simples: '+id);
 assert(!/<script|foreignObject|<image|href=/i.test(svg),'O fundo SVG não pode executar ou carregar recursos externos: '+id);
 assert(sw.includes("'./theme-backdrops/"+id+".svg'"),'Imagem não incluída no cache offline: '+id);
 const n=(svg.match(/<circle\s/g)||[]).length;
 if(['neon-blue','neon-green','neon-pink'].includes(id))
  assert(n>600,'Céu deveria ter centenas de estrelas: '+id+' ('+n+')');
 else
  assert(svg.includes('filter="url(#grain)"')||id==='neon-aero','Material sem granulação fina: '+id);
}
for(const id of backdropIds)
 assert(materials.includes('url("./theme-backdrops/'+id+'.svg")'),'Paleta sem arte de fundo: '+id);
assert(materials.includes('#tavEntrance')&&materials.includes('#sceneWelcome')&&materials.includes('#sceneMultiplayer')&&materials.includes('#sceneMenu')&&materials.includes('#sceneGame'),
 'O fundo precisa cobrir todas as cenas e não apenas os cartões internos');
assert(!materials.includes('#overlay:has(.suit-list)'),'O seletor original de naipes não pode mudar');
assert(!materials.includes('animation:')&&!materials.includes('pointer-events:auto'),'Tema não pode iniciar animações nem interceptar toques');
for(const id of ['neon-blue','neon-green','neon-pink','neon-tavern-dark','neon-aero','neon-imperial','neon-amber']){
 const start=materials.indexOf(':root[data-tav-palette="'+id+'"]{');
 assert(start!==-1,'Textura ausente: '+id);
 const end=materials.indexOf('\n}',start);
 assert(end>start,'Bloco de material sem fechamento: '+id);
 const block=materials.slice(start,end);
 for(const token of ['--tm-scene:','--tp-panel:','--tp-button:','--tp-felt:','--tp-shadow:'])
  assert(block.includes(token),'Material incompleto ('+token+'): '+id);
}
for(const id of ['neon-blue','neon-green','neon-pink'])
 assert(materials.includes(':root[data-tav-palette="'+id+'"]{'),'Céu noturno ausente: '+id);
assert(materials.includes('backdrop-filter:blur(8px)'),'Faltou vidro fosco Aero');
assert(materials.includes('#sceneGame .action-list button'),'Acabamento de botões da partida ausente');

new vm.Script(script);new vm.Script(menuScript);
for(const id of ['neon-blue','neon-green','neon-pink',...["neon-tavern-dark","neon-aero","neon-imperial","neon-amber"]])
 assert(css.includes(':root[data-tav-palette="'+id+'"]'),'Paleta ausente '+id);
assert(css.includes(':root[data-tav-event="neon-test"]'),'Evento de administrador ausente');
assert(!css.includes(':root[data-tav-theme="neon-test"]'),'CSS antigo misturado com paletas');
for(const token of ['--tp-wood','--tp-felt','--tp-panel','--tp-button','--tp-input','--tp-screen'])
 assert(css.includes(token),'Token de cor ausente '+token);
for(const selector of ['#tavCentralOpen','#alphaAccountsBar','#alphaAccountsLogout',
 '.human-leather','.control-bar','.leather-name','#sceneMenu .book','.tav-central-panel',
 '.tav-admin-panel','#tavSocialMenu','#tavAbandonOverlay','.tav-bots-sheet-inner'])
 assert(css.includes(selector),'Falta cobertura de tela/submenu '+selector);
assert(!css.includes('[data-card-id]'),'Skins nunca podem identificar cartas por ID');
for(const cls of ['.card-back','.card-face','.card-face.red','.mini-card','.playing-card.selected .big-card']){
 assert(css.includes(cls),'Baralho especial incompleto: '+cls);
}
assert(css.includes('#sceneGame #seats :is(.seat,.seat-inner,.opphand,.bot-fan)'), 'Assentos transparentes ausentes');
assert(!css.includes('#overlay:has(.suit-list) #dialog .suit-list>.suit-choice'),
 'NÃO redesenhar os botões ou a geometria do seletor de naipes');
assert(!css.includes('#overlay:has(.suit-list) #dialog .parchment-modal'),
 'NÃO redesenhar o painel original de naipes');
assert(css.includes('#alphaAccountsOverlay')&&css.includes('#alphaAccountsLogout'),
 'Temas precisam cobrir entrada, troca de conta e formulários');
assert(css.includes('animation:none!important')&&css.includes('.seat.active .bot-avatar .portrait-medallion'),
 'Falta desativar a animação amarela herdada dos retratos');
for(const selector of [
 '#sceneGame #seats .seat .leather-name',
 '#sceneGame #seats .seat.active .bot-avatar',
 '#sceneGame #seats .seat.active .portrait-medallion',
 '#sceneGame #humanZone.turn-active',
 '#overlay:has(.suit-list)'
]){
 assert(css.includes(selector),'Ajuste de turno/avatares ausente: '+selector);
}
assert(html.includes('function themeNotice()'),'Aviso do calendário ausente');
assert(html.includes('themeNotice()+'),'Aviso não foi incluído no pergaminho');
assert(html.includes('tav-appearance-options'),'Seleção de aparência não incluída');

let clock=start-1000,interval=null,events=[],timers=[];
const listeners={},attrs=new Map(),store=new Map();
const localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v))};
const document={
 documentElement:{setAttribute:(a,b)=>attrs.set(a,String(b)),removeAttribute:a=>attrs.delete(a)},
 hidden:false,baseURI:'https://local.test/',
 addEventListener:(a,fn)=>{(listeners[a]??=[]).push(fn)}
};
const window={addEventListener:(a,fn)=>{(listeners[a]??=[]).push(fn)},dispatchEvent:e=>events.push(e)};
class FakeDate extends Date{static now(){return clock;}}
class FakeEvent{constructor(type,opts){this.type=type;this.detail=opts.detail}}
vm.runInNewContext(script,{
 Date:FakeDate,Intl,window,document,localStorage,navigator:{onLine:false},CustomEvent:FakeEvent,
 URL,console,setInterval:fn=>{interval=fn;return 1},setTimeout:(fn,t)=>{timers.push(t);return 8},clearTimeout(){},
},{timeout:1200});
const api=window.TavernaThemeSystem;assert(api);
assert.equal(api.getChoices().length,8);
assert.equal(typeof interval,'function');
function assertState(at,expectedPalette,active){
 clock=at;api.refresh();
 const palette=api.getPalette();
 assert.equal(palette.id,expectedPalette);
 assert.equal(api.getStatus().active,active);
 assert.equal(attrs.get('data-tav-palette'),expectedPalette==='classic'?undefined:expectedPalette);
 assert.equal(attrs.get('data-tav-event'),active?'neon-test':undefined);
 assert.equal(attrs.has('data-tav-theme'),false,'Marcação legada removida');
}
assertState(start-1,'classic',false);
assertState(start,'neon-blue',true);
assert(api.getPalette().temporary,'Compatibilidade com o ensaio neon');
assert(api.setPalette('neon-green'));
assertState(start+180000,'neon-green',true);
assert(api.setPalette('neon-pink'));
assertState(end-1,'neon-pink',true);
assertState(end,'neon-pink',false);
assertState(end+DAY(),'neon-pink',false);
assert.equal(store.get('taverna:appearance:palette:v1'),'neon-pink');
for(const id of ["neon-tavern-dark","neon-aero","neon-imperial","neon-amber"]){
 assert(api.setPalette(id),'Novo tema não selecionável: '+id);
 assertState(end+3600000,id,false);
 assert.equal(store.get('taverna:appearance:palette:v1'),id,'Tema não persistiu: '+id);
}
assert(api.setPalette('classic'));
assertState(end+3600000,'classic',false);
assert.equal(api.setPalette('not-a-palette'),false);
assertState(end+3600000,'classic',false);
assert.equal(api.getStatus(end-1000).endsAt,end);
assert.equal(api.getSchedule()[0].end,end);
assert(!script.includes('GameEngine')&&!script.includes('game.players')&&!script.includes('WebSocket'),'Motor não pode ser tocado pelo tema');
console.log('THEME_SCHEDULE_OK: 8 paletas, usuário persistente, evento independente, prazo absoluto, Clássico original');
function DAY(){return 86400000}