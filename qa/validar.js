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
test('Sala VIP entra apenas pelo menu específico e não exibe código',()=>{
 assert(html.includes("vipMenuEntry=true"),'Menu VIP não habilita fluxo dedicado');
 assert(html.includes("event.stopImmediatePropagation()"),'Entrada manual pelo código VIP não é interceptada');
 assert(html.includes("vipCodeLabel.hidden=inVip"),'Código interno ainda visível na sala VIP');
 assert(html.includes("window.TavernaVipPrompt"),'Autenticação VIP foi removida');
});
test('Revanche preserva bots e lobby recebe transição do servidor',()=>{
 assert(html.includes('id="onlineFinishLobby"'),'Botão Voltar ao lobby ausente');
 assert(html.includes("type:'return_lobby'"),'Comando coletivo de retorno ao lobby ausente');
 assert(html.includes('g.players.length===players.length'),'Revanche sem conferência da formação anterior');
 assert(html.includes('if(!m.game&&game){'),'Cliente não limpa a partida ao regressar ao lobby');
 assert(html.includes("if(bot.token)url.searchParams.set('token',bot.token);"),'Bot não preserva identidade ao reconectar');
});
test('Pular para o final é consenso entre humanos apenas no modo online',()=>{
 assert(html.includes("skipFinalPanel.id='onlineSkipFinalPanel'"),'Painel de aceleração online ausente');
 assert(html.includes("type:'skip_final_vote'"),'Botão não envia voto ao servidor');
 assert(html.includes("showSkipFinal(m.skipFinal)"),'Votação não recebe estado autoritativo');
 assert(html.includes("showSkipFinal(null)"),'Lobby não limpa votação antiga');
 assert(html.includes("state.votes+'/'+state.needed"),'Contagem de confirmações ausente');
 assert(html.includes('function placeSkipFinalNearHand()'),'Falta reposicionamento para a área da mão');
 assert(html.includes("document.getElementById('humanHand')"),'Posicionamento não referencia a mão');
 assert(html.includes('requestAnimationFrame(placeSkipFinalNearHand)'),'Reposicionamento não acompanha os votos');
 assert(html.includes('bottom:auto'),'Botão continua preso à borda inferior da tela');
});
test('Comunicação multiplayer: balões, limite, microfone e expulsão',()=>{
 assert(html.includes("tavSocialLauncher.id='tavSocialLauncher'"),'Botão de comunicação ausente');
 assert(html.includes("type:'social_send'"),'Comunicação não chama servidor');
 assert(html.includes("kind:'audio'"),'Falta envio de áudio');
 assert(html.includes('getUserMedia'),'Captura de microfone ausente');
 assert(html.includes('pcm16'),'Falta PCM padronizado para Android/iPhone');
 assert(html.includes('tavIncomingSocial(m)'),'Evento não recebido em tempo real');
 assert(html.includes('tavRemovedByVote(m)'),'Expulsão não recebida');
 assert(html.includes('tavUpdateSocialFromState(m)'),'Controle não acompanha eliminação');
 assert(html.includes("type:'vote_kick_start'"),'Falta início da votação');
 assert(html.includes("type:'vote_kick_cast'"),'Falta votação de expulsão');
 assert(html.includes("showFinished(game);showSkipFinal(m.skipFinal);tavUpdateSocialFromState(m);"),'Sincronização da interface incompleta');
 assert(html.includes('if(!alive){tavSocialMenu.hidden=true;tavStopRecord(false);}' ),'Eliminado ainda pode gravar');
 assert(html.includes("if(!ac||ac.state!=='running')return;"),'Áudio bloqueado precisa ser ignorado');
 assert(!html.includes('Reproduzir áudio manualmente'),'Não mostrar botão de reprodução');
 assert(html.includes('id="soundBtn"'),'Controle de efeitos sonoros original ausente');
 assert(html.includes("btn.setAttribute('aria-pressed',String(!!on))"),'Controle de som não informa o estado do áudio');
 assert(html.includes("'#soundBtn'"),'Voz não acompanha a preferência de efeitos sonoros');
});
test('Cache busca versão nova e mantém offline',()=>{
 const sw=fs.readFileSync(path.join(site,'sw.js'),'utf8');
 new vm.Script(sw,{filename:'sw.js'});
 assert(/fetch\s*\(\s*event\.request\b/.test(sw), 'Service Worker não consulta a rede');
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
 const manifest=JSON.parse(fs.readFileSync(path.join(site,'manifest.webmanifest'),'utf8'));assert.equal(manifest.name,'Taverna do MAU MAU');assert(manifest.icons.length>=2);for(const ico of manifest.icons)assert(fs.existsSync(path.join(site,new URL(ico.src,'https://taverna.local/').pathname.slice(1))));const sw=fs.readFileSync(path.join(site,'sw.js'),'utf8');assert(sw.includes('self.addEventListener'));assert(sw.includes('const CACHE = '));
});
console.log('\nVerificação concluída:',process.exitCode?'FALHAS':'SEM FALHAS DETECTADAS');
process.exit(process.exitCode||0);
