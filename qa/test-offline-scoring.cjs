'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const assert=require('node:assert/strict');
const site=process.argv[2]||path.join(__dirname,'..','site');
const html=fs.readFileSync(path.join(site,'index.html'),'utf8');
const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(x=>x[1]);
const app=scripts.find(x=>x.includes('Mau-Mau 2.0 — aplicação e interface.'));
assert(app,'Aplicacao offline nao encontrada');
// Todos os scripts sao compilados: protege contra erros de sintaxe na montagem.
for(const s of scripts)if(s.trim())new vm.Script(s);
assert(html.includes('id="tav-offline-score-theme"'),'CSS de apuracao nao integrado');
const style=html.match(/<style id="tav-offline-score-theme">([\s\S]*?)<\/style>/);
assert(style,'Styles de apuracao ausentes');
const css=style[1];
for(const token of ['--tp-panel','--tp-edge','--tp-text','--tp-bright','--tg-deck-image']){
 assert(css.includes('var('+token+')'),'Paleta nao aplicada: '+token);
}
for(const selector of ['.score-pending-back','.score-tally','.score-fast-forward',
 '.wood-scoreboard','.wanted-person b','.wanted-picture img','.eliminated-cross:before']){
 assert(css.includes(selector),'Sem ajuste tematico para '+selector);
}
const a=app.indexOf('let v28ScoreRunning=false;');
const b=app.indexOf('function showChampion()',a);
assert(a>0&&b>a,'Fluxo de pontuacao offline ausente');
const flow=app.slice(a,b);
assert(flow.includes("skip.textContent='Pular contagem'"),'Botao de pular nao encontrado');
assert(flow.includes("skip.onclick=()=>"),'Botao sem handler');
assert(flow.includes('v28FastForward();'),'Pulo sem cancelamento');
assert(flow.includes('if(v28ScoreSkip?.skip)return true;'),'Animacao nao interrompivel');
assert(flow.includes('flightDuration=totalScoreCards>=20?210:totalScoreCards>=10?300:390'),
 'Duracao dinamica da contagem nao encontrada');
assert(flow.includes('const scoreMap=new Map(s.scoring.scores.map('),'Motor nao fornece pontuacao');
assert(flow.includes('const rows=order.map(i=>'),'Placar final ausente');
assert(flow.includes('info.eliminated.map(i=>'),'Cartaz de eliminados ausente');
assert(flow.includes("ui.modal='scoring'"),'Pulo nao retorna ao placar final');
assert(flow.includes('ui.game.advanceRound()'),'Avanco da rodada foi removido');
assert(app.includes('v28FastForward();document.getElementById('),
 'Cancelamento ao reiniciar/sair nao integrado');
const f=app.indexOf('function v28FastForward(){',a),end=app.indexOf('function v28ScoringOrder(',f);
const w=app.indexOf('function v28Wait(ms){',a),wend=app.indexOf('async function v28ScorePresentation',w);
assert(f>=a&&end>f&&w>=a&&wend>w,'Funcoes auxiliares de cancelamento ausentes');
const helpers=app.slice(a,end)+app.slice(w,wend);
const ctx=vm.createContext({Set,Array,Promise,setTimeout,clearTimeout});
vm.runInContext(helpers,ctx);
vm.runInContext('v28ScoreSkip={skip:false,waiters:new Set()};',ctx);
const wait=vm.runInContext('v28Wait(2500)',ctx);
assert.equal(vm.runInContext('v28ScoreSkip.waiters.size',ctx),1);
vm.runInContext('v28FastForward();v28FastForward();',ctx);
const limit=new Promise((_,reject)=>setTimeout(()=>reject(new Error('Pulo demorou demais')),300));
Promise.race([wait,limit]).then(()=>{
 assert.equal(vm.runInContext('v28ScoreSkip.waiters.size',ctx),0);
 assert.equal(vm.runInContext('v28ScoreSkip.skip',ctx),true);
 console.log('OFFLINE_SCORING_REGRESSION_OK: pulo imediato, cartas do tema, placar e eliminados');
}).catch(e=>{console.error(e);process.exitCode=1;});
