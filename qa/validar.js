'use strict';
// Auditoria e testes sem abrir uma partida real; Node.js, sem dependências.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const site=process.argv[2] ? path.resolve(process.argv[2]) : path.join(root,'site');
const htmlPath=path.join(site,'index.html');
const html=fs.readFileSync(htmlPath,'utf8');
const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
function test(name,fn){ try{fn();console.log('OK ',name);}catch(e){console.error('FALHOU',name,':',e.stack||e);process.exitCode=1;} }
const context={module:{exports:{}},console}; context.globalThis=context;
const coreScript=scripts.find(s=>s.includes('Mau-Mau 2.0 — núcleo novo')&&s.includes('GameEngine'));
test('HTML, scripts e motor presentes',()=>{
 assert(fs.statSync(htmlPath).size>100000,'index.html ausente, vazio ou incompleto');
 assert(!/taverna das sombras/i.test(html),'Nome antigo encontrado no HTML');
 assert(html.includes('Taverna do MAU MAU'),'Nome oficial ausente do HTML');
 assert(/<html\b/i.test(html),'Falta estrutura HTML');
 assert(/<link\b[^>]*rel=["']manifest["'][^>]*href=["'][^"']*manifest\.webmanifest["']/i.test(html),'Falta link PWA no head');
 assert(/<script\b[^>]*id=["']pwa-registration["']/i.test(html),'Falta registro PWA');
 assert(scripts.length>=7,'Scripts do jogo ausentes');
 assert(coreScript,'Motor do jogo ausente');
});
test('Cache busca versão nova e mantém offline',()=>{
 const sw=fs.readFileSync(path.join(site,'sw.js'),'utf8');
 new vm.Script(sw,{filename:'sw.js'});
 assert(sw.includes('fetch(event.request)'), 'Service Worker não consulta a rede');
 assert(sw.includes('caches.match'), 'Service Worker sem fallback offline');
 assert(sw.includes('skipWaiting'), 'Service Worker não ativa novas versões');
 assert(sw.includes('clients.claim'), 'Service Worker não assume clientes após ativação');
});
for(let i=0;i<scripts.length;i++)test(`Sintaxe de script ${i+1}/${scripts.length}`,()=>new vm.Script(scripts[i],{filename:`index-script-${i+1}.js` }));
if(coreScript){vm.runInNewContext(coreScript,context,{timeout:10000});}
const C=context.module.exports;
test('Núcleo exportado independentemente da interface',()=>{assert(C.GameEngine);assert(C.makeCard);assert(C.validateState);});
const card=(id,r,s)=>C.makeCard(id,r,s);
const make=(humanCards,top,botCards=[card('bot2','4','♠'),card('bot3','6','♣')], extras={})=>{
 const bot3=[card('third2','2','♣'),card('third3','K','♥')];
 return C.GameEngine.fromScenario({players:[{name:'Eu',human:true,hand:humanCards},{name:'Bot1',hand:botCards},{name:'Bot2',hand:bot3}],deck:[card('deck1','8','♦'),card('deck2','9','♠'),card('deck3','4','♦')],discard:[top],turn:0,direction:1,...extras});
};
test('Baralhos e identidade para 2, 5 e 10 participantes',()=>{
 for(const n of [2,5,10]){const g=C.GameEngine.newGame({names:Array.from({length:n},(_,i)=>'P'+i),humanIndex:0,rng:()=>0.51});const st=g.state;assert.equal(st.players.length,n);assert(C.validateState(st));}
});
test('Carta imutável por identidade, valor e naipe',()=>{
 const c=card('id-fixed','9','♠');assert(Object.isFrozen(c));assert.equal(c.rank,'9');assert.equal(c.suit,'♠');
});
test('9 sobre 9 de outro naipe',()=>{
 const g=make([card('h9','9','♥'),card('h3','3','♠')],card('top','9','♠'));let x=g.play(0,'h9');assert.equal(x.ok,true, x.message);assert.equal(g.state.discard.at(-1).id,'h9');
});
test('Mesma numeração em naipes distintos',()=>{
 const g=make([card('h5','5','♦'),card('h3','3','♠')],card('top','5','♠'));assert.equal(g.play(0,'h5').ok,true);assert.equal(g.state.discard.at(-1).rank,'5');
});
test('Dama inverte direção',()=>{
 const g=make([card('hQ','Q','♥'),card('h3','3','♠'),card('h4','4','♦')],card('top','5','♥'));assert.equal(g.play(0,'hQ').ok,true);assert.equal(g.state.direction,-1);assert.equal(g.state.turn,2);
});
test('Ás pula próximo jogador',()=>{
 const g=make([card('hA','A','♥'),card('h3','3','♠'),card('h4','4','♦')],card('top','5','♥'));assert.equal(g.play(0,'hA').ok,true);assert.equal(g.state.turn,2);
});
test('Compra e joga a mesma carta recém-comprada',()=>{
 const g=make([card('h2','2','♠'),card('h3','3','♠')],card('top','9','♥'),undefined,{deck:[card('deckx','4','♠'),card('drawn','9','♣')]});
 const x=g.draw(0);assert.equal(x.ok,true,x.message);assert(g.state.players[0].hand.some(c=>c.id==='drawn'));assert.equal(g.state.turn,0);const p=g.play(0,'drawn');assert.equal(p.ok,true,p.message);
});
test('Carta não pertencente não altera revisão nem mão',()=>{
 const g=make([card('h2','2','♠'),card('h3','3','♠')],card('top','9','♥'));const before=g.state;let a=g.play(0,'inexistente');assert.equal(a.ok,false);assert.equal(a.code,'CARD_NOT_OWNED');assert.equal(g.state.revision,before.revision);assert.deepEqual(g.state.players[0].hand.map(c=>c.id),before.players[0].hand.map(c=>c.id));
});
test('Manifest e SW íntegros, ícones disponíveis',()=>{
 const manifest=JSON.parse(fs.readFileSync(path.join(site,'manifest.webmanifest'),'utf8'));assert.equal(manifest.name,'Taverna do MAU MAU');assert(manifest.icons.length>=2);for(const ico of manifest.icons)assert(fs.existsSync(path.join(site,ico.src)));const sw=fs.readFileSync(path.join(site,'sw.js'),'utf8');assert(sw.includes('self.addEventListener'));assert(sw.includes('const CACHE = '));
});
console.log('\nVerificação concluída:',process.exitCode?'FALHAS':'SEM FALHAS DETECTADAS');
process.exit(process.exitCode||0);
