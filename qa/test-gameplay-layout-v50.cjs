'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const assert=require('node:assert/strict');
const site=process.argv[2]||path.join(__dirname,'..','site');
const html=fs.readFileSync(path.join(site,'index.html'),'utf8');
const source=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(x=>x[1]);
for(const part of source)if(part.trim())new vm.Script(part);
const app=source.find(x=>x.includes('Mau-Mau 2.0 — aplicação e interface.'));
assert(app,'Motor/render offline nao encontrado');
const style=html.match(/<style id="tav-gameplay-v50-style">([\s\S]*?)<\/style>/);
assert(style,'Folha visual v50 nao embutida');
const css=style[1];
for(const token of [
 '#humanZone.tav-double-hand','#humanHand',
 'grid-template-rows:repeat(2,96px)','overflow-x:auto',
 '.tav-human-trophy','.tav-ghost-gallery','.score-pending-back',
 '.bot-pocket .mini-card:first-child','.champion-banner',
 '.seat.active .portrait-medallion','var(--tp-bright)',
 'var(--tg-deck-image)',
 'height:100dvh!important','justify-content:flex-start!important',
 'grid-template-columns:repeat(var(--tav-hand-cols,6),minmax(22px,1fr))',
 'padding-right:71px!important'
]){
 assert(css.includes(token),'Regra visual ausente: '+token);
}
assert(!css.includes('#overlay:has(.suit-list) .suit-choice'),'Seletor de naipe nao pode ser alterado');
assert(app.includes('tavRenderSessionDetails(s);'),'Render nao atualiza mao, estrelas e eliminados');
assert(app.includes("zone.classList.toggle('tav-double-hand',count>10)"),'Limiar deveria ser 11 cartas');
assert(app.includes("String(Math.max(1,Math.ceil(count/2)))"),'Mao nao divide as cartas em duas linhas');
assert(app.includes('ui.sessionWins.get(0)'),'Contador de estrelas nao usa vitorias reais');
assert(app.includes("gallery.hidden=!eliminated.length"),'Galeria vazia nao deve ocupar espaco');
assert(app.includes('portraitHTML(x.i===0?heroChoice:x.p.name)'),'Retrato dos eliminados incorreto');
const a=app.indexOf('function tavRoundStars(');
const b=app.indexOf('function renderHumanHand(',a);
assert(a>=0&&b>a,'Auxiliares isolados nao encontrados');
const ctx=vm.createContext({});
vm.runInContext(app.slice(a,b),ctx);
assert.equal(vm.runInContext('tavRoundStars(0)',ctx),'');
assert.equal(vm.runInContext('tavRoundStars(1)',ctx),'✦');
assert.equal(vm.runInContext('tavRoundStars(3)',ctx),'✦✦✦');
assert.equal(vm.runInContext('tavRoundStars(7)',ctx),'✦✦✦✦✦ +2');
assert(app.includes("ui.game.advanceRound()"),'Rodadas nao podem ser afetadas');
assert(app.includes("ui.game.play(")||app.includes("ui.game.timeExpired("),'Motor de jogo ausente');
console.log('ALPHA_GAMEPLAY_V50_OK: duas linhas, estrelas do jogador, eliminados, campeao e cartas tematicas');
