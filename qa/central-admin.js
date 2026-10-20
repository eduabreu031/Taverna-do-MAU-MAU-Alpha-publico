/* Central da Taverna — apenas administração; não altera o motor da partida. */
(()=>{'use strict';
const auth=window.TavernaAuth,root=document.getElementById('sceneWelcome');
if(!auth||!root)return;
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n;};
const button=el('button','tav-central-open','♜ Central da Taverna');button.id='tavCentralOpen';button.type='button';button.hidden=true;
const main=root.querySelector('main')||root;main.insertAdjacentElement('afterbegin',button);
const overlay=el('section','tav-central-overlay');overlay.id='tavCentralOverlay';overlay.hidden=true;overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','Central administrativa da Taverna');
const panel=el('div','tav-central-panel');
const header=el('header','tav-central-header'),title=el('h2','','Central da Taverna'),exit=el('button','tav-central-close','Voltar');
exit.type='button';header.append(title,exit);
const detail=el('p','tav-central-status','');
const counters=el('div','tav-central-counters');
const keys=[['online','Pessoas online'],['playing','Em partidas'],['activeMatches','Partidas ativas'],['openRooms','Salas abertas']];
const countersUI={};
for(const [key,label] of keys){const card=el('div','tav-central-counter'),n=el('strong','','—');card.append(n,el('span','',label));counters.append(card);countersUI[key]=n;}
const tabs=el('nav','tav-central-tabs'),liveTab=el('button','tav-central-tab selected','Partidas ao vivo'),reportsTab=el('button','tav-central-tab','Relatos da comunidade');
liveTab.type=reportsTab.type='button';tabs.append(liveTab,reportsTab);
const matches=el('div','tav-central-matches'),reports=el('div','tav-central-reports');reports.hidden=true;
const viewer=el('div','tav-central-viewer');viewer.hidden=true;
const viewBack=el('button','tav-central-back','← Voltar às partidas');viewBack.type='button';
const viewTitle=el('h3','','Partida ao vivo'),viewStatus=el('p','tav-central-view-status',''),table=el('div','tav-central-table');
viewer.append(viewBack,viewTitle,viewStatus,table);
panel.append(header,detail,counters,tabs,matches,reports,viewer);overlay.append(panel);document.body.append(overlay);
let interval=null,activeRoom='',mode='matches',updating=false,serial=0;
const allowed=()=>auth.getUser()?.role==='admin';
async function api(path){return auth.roomRequest(path,'GET');}
function close(){overlay.hidden=true;activeRoom='';serial++;resetWatch();if(interval)clearInterval(interval);interval=null;viewer.hidden=true;matches.hidden=mode==='reports';reports.hidden=mode!=='reports';}
exit.onclick=close;viewBack.onclick=()=>{activeRoom='';resetWatch();viewer.hidden=true;matches.hidden=false;};
overlay.addEventListener('click',e=>{if(e.target===overlay)close();});
function switchMode(next){mode=next;activeRoom='';resetWatch();viewer.hidden=true;matches.hidden=next!=='matches';reports.hidden=next!=='reports';liveTab.classList.toggle('selected',next==='matches');reportsTab.classList.toggle('selected',next==='reports');update();}
liveTab.onclick=()=>switchMode('matches');reportsTab.onclick=()=>switchMode('reports');
function renderMatch(room){
 const line=el('div','tav-central-match'),meta=el('div','tav-central-match-meta'),watch=el('button','tav-central-watch','Assistir');
 meta.append(el('strong','',room.code==='TAVERN'?'Sala VIP':room.code),el('small','',(room.players||0)+' pessoas · '+(room.bots||0)+' bots · Rodada '+(room.round||1)));
 watch.type='button';watch.onclick=()=>{activeRoom=room.code;resetWatch();matches.hidden=true;viewer.hidden=false;viewStatus.textContent='Carregando partida ao vivo…';viewTitle.textContent=(room.code==='TAVERN'?'Sala VIP':room.code)+' — Ao vivo';update();};
 line.append(meta,watch);return line;
}
function makeCard(card){
 const node=el('span','tav-central-card',card?card.rank+' '+card.suit:'🂠');
 if(card?.suit==='♥'||card?.suit==='♦')node.classList.add('red');
 return node;
}
let lastWatch=null,lastWatchLayout='',lastWatchRevision=null,lastWatchTop='',watchBusy=false,watchDeadline=null,watchServerOffset=0;
const watchParts={};
function resetWatch(){
 lastWatch=null;lastWatchLayout='';lastWatchRevision=null;lastWatchTop='';watchDeadline=null;
 table.replaceChildren();
}
function renderTable(data){
 const game=data?.game;if(!game||!Array.isArray(game.players))return;
 const seats=(data.players||[]).filter(p=>game.players.some(x=>x.id===p.id));
 const layout=seats.map(p=>p.id).join('|');
 if(layout!==lastWatchLayout){
  table.replaceChildren();
  const felt=el('div','tav-central-felt');
  const board=el('div','tav-central-board');
  const phase=el('p','tav-central-board-meta','');
  const top=el('div','tav-central-top');
  const discard=makeCard(game.top);
  discard.classList.add('tav-central-discard');
  top.append(el('span','','Descarte'),discard);
  const deck=el('div','tav-central-deck','');
  const suit=el('div','tav-central-suit','');
  board.append(phase,top,deck,suit);
  const grid=el('div','tav-central-player-grid');
  grid.style.setProperty('--seat-columns',String(seats.length<=3?Math.max(1,seats.length):3));
  for(const p of seats){
   const seat=el('div','tav-central-seat');
   seat.dataset.playerId=p.id;
   const label=el('strong','tav-central-seat-name',p.name+(p.isBot?' · Bot':''));
   const count=el('span','tav-central-seat-count','');
   const backs=el('div','tav-central-card-backs');
   seat.append(label,count,backs);grid.append(seat);
  }
  felt.append(board,grid);table.append(felt);
  watchParts.felt=felt;watchParts.grid=grid;watchParts.phase=phase;watchParts.discard=discard;
  watchParts.deck=deck;watchParts.suit=suit;
  lastWatchLayout=layout;lastWatchRevision=null;lastWatchTop='';
 }
 const topKey=game.top?.id||[game.top?.rank,game.top?.suit].join(':');
 const changedTop=lastWatchTop&&lastWatchTop!==topKey;
 const changedRev=lastWatchRevision!==null&&lastWatchRevision!==game.revision;
 if(changedTop){
  const newDiscard=makeCard(game.top);newDiscard.classList.add('tav-central-discard','new');
  watchParts.discard.replaceWith(newDiscard);watchParts.discard=newDiscard;
 }else if(!lastWatchTop){
  watchParts.discard.textContent=game.top?game.top.rank+' '+game.top.suit:'—';
 }
 lastWatchTop=topKey;lastWatchRevision=game.revision;
 watchParts.phase.textContent='Rodada '+game.round+' · '+(game.direction===1?'↻ Sentido horário':'↺ Sentido anti-horário');
 watchParts.deck.textContent='Baralho · '+game.deckCount+' cartas';
 watchParts.suit.textContent='Naipe ativo: '+(game.activeSuit||game.top?.suit||'—');
 for(const p of seats){
  const g=game.players.find(x=>x.id===p.id);
  const seat=[...watchParts.grid.children].find(x=>x.dataset.playerId===p.id);
  if(!seat||!g)continue;
  const isTurn=game.turnPlayerId===p.id&&g.alive;
  const hadTurn=seat.classList.contains('active');
  seat.classList.toggle('active',isTurn);seat.classList.toggle('eliminated',g.alive===false);
  seat.querySelector('.tav-central-seat-count').textContent=g.alive?'Cartas na mão: '+g.count:'Eliminado';
  seat.querySelector('.tav-central-seat-name').textContent=p.name+(p.isBot?' · Bot':'');
  const backs=seat.querySelector('.tav-central-card-backs');
  const wanted=Math.min(5,g.count);
  if(backs.children.length!==wanted){
   backs.replaceChildren(...Array.from({length:wanted},()=>makeCard(null)));
   if(changedRev)seat.classList.add('hand-changed');
  }
  if(isTurn&&!hadTurn)seat.classList.add('turn-changed');
  if(seat.classList.contains('turn-changed')||seat.classList.contains('hand-changed')){
   seat.addEventListener('animationend',()=>{seat.classList.remove('turn-changed','hand-changed')},{once:true});
  }
 }
 watchDeadline=Number.isFinite(data.turnDeadline)?data.turnDeadline:null;
 watchServerOffset=(data.serverNow||Date.now())-Date.now();
 lastWatch=game;
 refreshWatchClock();
}
function refreshWatchClock(){
 if(!activeRoom||!lastWatch||viewer.hidden)return;
 const deadline=watchDeadline;
 const remaining=deadline?Math.max(0,Math.ceil((deadline-(Date.now()+watchServerOffset))/1000)):null;
 viewStatus.textContent='Ao vivo · '+(remaining===null?'Aguardando ação…':'Próxima ação em '+remaining+'s');
}
async function refreshWatch(){
 if(!activeRoom||overlay.hidden||watchBusy||!allowed())return;
 watchBusy=true;const room=activeRoom,epoch=serial;
 try{
  const data=await api('/api/central/watch?room='+encodeURIComponent(room));
  if(room!==activeRoom||epoch!==serial||overlay.hidden)return;
  renderTable(data);
 }catch(error){
  if(room!==activeRoom||epoch!==serial||overlay.hidden)return;
  activeRoom='';resetWatch();viewer.hidden=true;matches.hidden=false;
  detail.textContent=/não está em andamento|encerrad|404|não existe/i.test(error.message||'')?'Partida encerrada ou sala esvaziada.':'Visualização indisponível: '+(error.message||'Falha de conexão');
  await update();
 }finally{watchBusy=false;}
}
setInterval(()=>{if(!overlay.hidden&&activeRoom&&!document.hidden)refreshWatch();},1800);
setInterval(refreshWatchClock,500);
let lastReportsAt=0;
async function update(){
 if(!allowed()){close();button.hidden=true;return;}
 if(updating||overlay.hidden)return;
 updating=true;const epoch=serial;
 try{
  const status=await api('/api/central/dashboard');if(epoch!==serial||overlay.hidden)return;
  keys.forEach(([k])=>countersUI[k].textContent=String(status[k]??0));
  detail.textContent='Atualizado automaticamente · '+new Date(status.updatedAt||Date.now()).toLocaleTimeString('pt-BR');
  if(mode==='matches'){
   if(activeRoom){
    await refreshWatch();
   }else{
    const rooms=status.rooms||[];matches.replaceChildren(...(rooms.length?rooms.map(renderMatch):[el('p','tav-central-empty','Nenhuma partida online no momento.')]));
   }
  }else if(Date.now()-lastReportsAt>14000||!reports.childElementCount){
   const result=await api('/api/central/feedback');if(epoch!==serial||overlay.hidden)return;
   const items=result.items||[];reports.replaceChildren();
   for(const kind of ['bug','sugestao']){
    reports.append(el('h3','',kind==='bug'?'Bugs reportados':'Sugestões de melhorias'));
    const section=el('div','tav-central-report-list');
    const filtered=items.filter(x=>x.type===kind);
    if(!filtered.length)section.append(el('p','','Nenhum relato nesta categoria.'));
    for(const item of filtered){
     const card=el('article','tav-central-report');
     card.append(el('strong','',(item.name||'Anônimo')+' · '+(item.version||'')),el('small','',new Date(item.at||Date.now()).toLocaleString('pt-BR')),el('p','',item.message||''));
     section.append(card);
    }
    reports.append(section);
   }
   lastReportsAt=Date.now();
  }
 }catch(e){if(epoch===serial)detail.textContent='Não foi possível atualizar: '+(e.message||'Erro de conexão');}
 finally{updating=false;}
}
button.onclick=async()=>{
 if(!allowed()){button.hidden=true;return;}
 overlay.hidden=false;mode='matches';activeRoom='';resetWatch();serial++;lastReportsAt=0;
 viewer.hidden=true;reports.hidden=true;matches.hidden=false;liveTab.classList.add('selected');reportsTab.classList.remove('selected');
 await update();if(!overlay.hidden)interval=setInterval(update,9000);
};
function visibility(){button.hidden=!allowed();if(!allowed()&&!overlay.hidden)close();}
setInterval(visibility,1000);visibility();auth.restoreSilently?.().then(visibility).catch(()=>{});
})();