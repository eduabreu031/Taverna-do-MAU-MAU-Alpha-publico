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
function close(){overlay.hidden=true;activeRoom='';serial++;if(interval)clearInterval(interval);interval=null;viewer.hidden=true;matches.hidden=mode==='reports';reports.hidden=mode!=='reports';}
exit.onclick=close;viewBack.onclick=()=>{activeRoom='';viewer.hidden=true;matches.hidden=false;};
overlay.addEventListener('click',e=>{if(e.target===overlay)close();});
function switchMode(next){mode=next;activeRoom='';viewer.hidden=true;matches.hidden=next!=='matches';reports.hidden=next!=='reports';liveTab.classList.toggle('selected',next==='matches');reportsTab.classList.toggle('selected',next==='reports');update();}
liveTab.onclick=()=>switchMode('matches');reportsTab.onclick=()=>switchMode('reports');
function renderMatch(room){
 const line=el('div','tav-central-match'),meta=el('div','tav-central-match-meta'),watch=el('button','tav-central-watch','Assistir');
 meta.append(el('strong','',room.code==='TAVERN'?'Sala VIP':room.code),el('small','',(room.players||0)+' pessoas · '+(room.bots||0)+' bots · Rodada '+(room.round||1)));
 watch.type='button';watch.onclick=()=>{activeRoom=room.code;matches.hidden=true;viewer.hidden=false;viewTitle.textContent=(room.code==='TAVERN'?'Sala VIP':room.code)+' — Ao vivo';update();};
 line.append(meta,watch);return line;
}
function makeCard(card){const node=el('span','tav-central-card',card?card.rank+' '+card.suit:'🂠');return node;}
function renderTable(data){
 const game=data.game;if(!game)return;
 viewStatus.textContent='Rodada '+game.round+' · '+(game.direction===1?'Sentido horário':'Sentido anti-horário')+' · Baralho: '+game.deckCount+' cartas';
 table.replaceChildren();
 const surface=el('div','tav-central-felt');
 const top=el('div','tav-central-top');top.append(el('span','','Descarte: '),makeCard(game.top),el('span','',' Naipe: '+game.activeSuit));
 surface.append(top);
 const players=el('div','tav-central-player-grid');
 for(const p of data.players||[]){
  const g=game.players.find(x=>x.id===p.id);if(!g)continue;
  const seat=el('div','tav-central-seat'+(game.turnPlayerId===p.id?' active':''));
  seat.append(el('strong','',p.name+(p.isBot?' · Bot':'')),el('span','',g.alive?'Cartas: '+g.count:'Eliminado'));
  const backs=el('div','tav-central-card-backs');
  for(let i=0;i<Math.min(5,g.count);i++)backs.append(makeCard(null));
  seat.append(backs);players.append(seat);
 }
 surface.append(players);table.append(surface);
}
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
    try{const watch=await api('/api/central/watch?room='+encodeURIComponent(activeRoom));if(epoch===serial&&activeRoom)renderTable(watch);}
    catch(e){activeRoom='';viewer.hidden=true;matches.hidden=false;detail.textContent=e.message||'Partida encerrada';}
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
 overlay.hidden=false;mode='matches';activeRoom='';serial++;lastReportsAt=0;
 viewer.hidden=true;reports.hidden=true;matches.hidden=false;liveTab.classList.add('selected');reportsTab.classList.remove('selected');
 await update();if(!overlay.hidden)interval=setInterval(update,9000);
};
function visibility(){button.hidden=!allowed();if(!allowed()&&!overlay.hidden)close();}
setInterval(visibility,1000);visibility();auth.restoreSilently?.().then(visibility).catch(()=>{});
})();