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
 '.bot-pocket .mini-card','.champion-banner',
 '.seat.active .portrait-medallion','var(--tp-bright)',
 'var(--tg-deck-image)',
 'height:100dvh!important','justify-content:flex-start!important',
 'grid-template-columns:repeat(var(--tav-hand-cols,6),minmax(22px,1fr))',
 'padding-right:71px!important'
]){
 assert(css.includes(token),'Regra visual ausente: '+token);
}
assert(!/\.bot-pocket \.mini-card\s*\{\s*display:none!important/.test(css),'Leque dos bots nao pode esconder miniaturas');
assert(css.includes('order:1!important;')&&css.includes('max-height:42px!important'),'Retratos de eliminados nao devem empurrar o cabecalho');
assert(css.includes('#sceneGame .game-header .utility-toolbar button :is(img,svg)'),'Icones do HUD sem padrao de escala');
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

/* Regression: tema usa a cor do jogador ativo sem halo dourado legado. */
const v53=css.slice(css.indexOf('/* Alpha 0.5.0.53'));
assert(v53.includes('--tav-active-ring:var(--tp-edge)'),'Halo nao usa cor da paleta');
assert(v53.includes('--tav-active-aura:var(--tp-glow)'),'Brilho nao usa cor da paleta');
assert(v53.includes('.seat.active::before')&&v53.includes('.seat.active :is(.seat-inner,.bot-avatar,.portrait-medallion)::after'),'Pseudo-halos antigos nao neutralizados');
assert(v53.includes('.seat.active .portrait-medallion img'),'Filtro do retrato ainda pode herdar brilho');
const greenSvg=fs.readFileSync(path.join(site,'theme-decks','neon-green.svg'),'utf8');
assert(!greenSvg.includes('<circle cx="120" cy="172" r="19"'),'Verso verde ainda tem o medalhao central');
const iconGenerator=fs.readFileSync(path.join(__dirname,'apply-alpha-ui-v91.py'),'utf8');
assert(!iconGenerator.includes('<circle cx='),'Icone gerado ainda tem ponto circular na coroa');
const versions=JSON.parse(fs.readFileSync(path.join(__dirname,'alpha-releases.json'),'utf8'));
assert.equal(versions.current,'alpha-0.5.0.54');
const manifest=fs.readFileSync(path.join(site,'manifest.webmanifest'),'utf8');
assert(manifest.includes('alpha-icon-20261103-1'),'Icones PWA sem renovacao de URL');


// Regressao v54: contorno e pulso devem existir nos dois tipos de jogador.
const v54=css.slice(css.indexOf('/* Alpha 0.5.0.54'));
assert(v54.includes('tav-turn-breathe-v54'),'Pulso temático v54 ausente');
assert(v54.includes('.seat.active .bot-avatar::after'),'Pulso do bot ativo ausente');
assert(v54.includes('#humanZone.turn-active #humanAvatar::after'),'Pulso do jogador humano ausente');
assert(v54.includes('var(--tp-accent)')&&v54.includes('var(--tp-bright)')&&v54.includes('var(--tp-glow-hi)'),'Halo não acompanha paleta');
assert(v54.includes('prefers-reduced-motion:reduce'),'Redução de movimento ignorada');
assert(!/#[0-9a-f]{3,8}\b/i.test(v54),'Halo não pode usar uma cor fixa');

console.log('ALPHA_GAMEPLAY_V50_OK: duas linhas, estrelas do jogador, eliminados, campeao e cartas tematicas');
