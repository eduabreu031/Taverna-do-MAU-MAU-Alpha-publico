'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const root=path.resolve(__dirname,'..'),base=path.resolve(process.argv[2]||path.join(root,'site'));
const html=fs.readFileSync(path.join(base,'index.html'),'utf8');
const config=JSON.parse(fs.readFileSync(path.join(root,'qa','theme-schedule.json'),'utf8'));
const release=JSON.parse(fs.readFileSync(path.join(root,'qa','alpha-releases.json'),'utf8'));
assert(config.themes.length>=1);
const event=config.themes.find(e=>e.id==='neon-test');
assert(event,'O tema de teste não pode desaparecer antes do fim do ensaio');
const start=Date.parse(event.start),end=Date.parse(event.end);
assert.equal(end-start,7200000,'Duração do ensaio neon deve ser exatamente duas horas');
assert.equal(event.start,'2026-10-24T15:50:00-03:00');
assert.equal(event.end,'2026-10-24T17:50:00-03:00');
assert.equal(release.entries[0].id,release.current);
assert(release.entries[0].items.some(s=>/tema|neon/i.test(s)),'Versão não anuncia o ensaio');

const script=html.match(/<script id="tav-theme-manager">([\s\S]*?)<\/script>/)?.[1];
const style=html.match(/<style id="tav-seasonal-themes">([\s\S]*?)<\/style>/)?.[1];
assert(script&&style,'O tema deve entrar no produto final montado');
new vm.Script(script,{filename:'tav-theme-manager.js'});
assert(style.includes(':root[data-tav-theme="neon-test"]'),'Aparência deve ser escopada');
assert(style.includes('#sceneGame')&&style.includes('#sceneMultiplayer')&&style.includes('#sceneWelcome'));
assert(style.includes('tav-theme-board'),'A mesa também deve mudar a cor');
assert(!style.includes('pointer-events:none!important'),'Tema não pode desabilitar jogadas');
assert(html.includes('function themeNotice()'),'Changelog dinâmico ausente');
assert(html.includes('themeNotice()+'),'Changelog não exibe aviso durante a janela');
assert(html.includes('alpha-theme-notice'),'Estilo do aviso não foi incorporado');

let clock=start-1000, interval=null,events=[],listeners={};
const attributes=new Map();
const rootNode={
 setAttribute(k,v){attributes.set(k,String(v));},
 removeAttribute(k){attributes.delete(k);}
};
const document={
 documentElement:rootNode,baseURI:'https://taverna.local/',
 hidden:false,
 addEventListener(name,cb){(listeners[name]??=[]).push(cb);}
};
const window={
 addEventListener(name,cb){(listeners[name]??=[]).push(cb);},
 dispatchEvent(e){events.push(e);}
};
class FakeDate extends Date{static now(){return clock;}}
class FakeEvent{constructor(type,opts){this.type=type;this.detail=opts.detail;}}
const context={document,window,navigator:{onLine:false},Date:FakeDate,
 Intl,CustomEvent:FakeEvent,URL,setInterval(fn){interval=fn;return 1;},
 setTimeout(fn){return 2;},clearTimeout(){},console};
vm.runInNewContext(script,context,{timeout:1000});
assert.equal(typeof interval,'function','Verificação periódica ausente');
function check(at,active){
 clock=at;interval();
 const s=window.TavernaThemeSystem.getStatus();
 assert.equal(s.active,active,'Estado errado em '+new Date(at).toISOString());
 assert.equal(attributes.get('data-tav-theme'),active?'neon-test':undefined,'Visual errado em '+new Date(at).toISOString());
 return s;
}
check(start-1,false);
check(start,true);
check(start+60_000,true);
let middle=check(start+3600_000,true);
assert.equal(middle.remainingMs,3600_000);
assert.equal(middle.endsAt,end);
check(end-1,true);
check(end,false);
check(end+24*3600_000,false);
check(end+30*24*3600_000,false);
assert.equal(events.filter(x=>x.type==='taverna-theme-change').length,2,'Esperadas ativação e desativação');
assert.deepEqual([...attributes.keys()],[],'O tema padrão precisa ser o HTML original, sem substituição');
assert(!script.includes('GameEngine')&&!script.includes('game.players')&&!script.includes('webSocket'),'Gerenciador não deve tocar motor online/offline');
const notice=window.TavernaThemeSystem.getStatus(end-2000);
assert(notice.notice.includes('voltará automaticamente'),'Aviso sem retorno programado');
console.log('THEME_SCHEDULE_OK: 120 minutos, entrada, expiração, menu/mesa, changelog e motor intocado');