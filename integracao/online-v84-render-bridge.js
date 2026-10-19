window.__tavOriginalOnline={
 active:false,
 apply(g,members,selfId,meta={}){
  if(!g||!Array.isArray(g.players)||!g.players.some(p=>p.id===selfId))throw Error('Jogador não encontrado na partida');
  // O servidor mantém todos os valores ocultos. São só marcadores para contagem, nunca cartas jogáveis.
  const back=(id,count)=>Array.from({length:count},(_,i)=>({id:'hidden-'+id+'-'+i,rank:'2',suit:'♠'}));
  const ix=g.players.findIndex(p=>p.id===selfId);
  const ordered=g.players.slice(ix).concat(g.players.slice(0,ix));
  const players=ordered.map(p=>({name:members.find(x=>x.id===p.id)?.name||'Jogador',alive:p.alive!==false,
   hand:p.id===selfId?g.hand.map(c=>({...c})):back(p.id,p.count),saidMau:!!g.mauAnnouncements?.[p.id],penaltyDebt:0,duelBluffUsed:false}));
  const turn=ordered.findIndex(p=>p.id===g.turnPlayerId),top={...g.top};
  const incident=meta.opa?{open:true,actor:ordered.findIndex(p=>p.id===meta.opa.playerId)}:null;
  const next={phase:g.phase,round:g.round||1,players,turn:Math.max(0,turn),direction:g.direction,
   deck:back('deck',g.deckCount||0),discard:[top],activeSuit:g.activeSuit,
   turnNo:g.revision,drewThisTurn:!!g.drawn,pendingSeven:g.pendingSeven||0,incident,history:[]};
  const prev=this.active?ui.game?.state:null;
  const prevRev=this.revision;
  this.active=true;this.revision=g.revision;
  clearTimeout(ui.introTimer);ui.introTimer=null;ui.introActive=false;
  pauseSchedulers();ui.selected=[];ui.clockCarry=null;ui.game={state:next};
  if(this.clockTicker)clearInterval(this.clockTicker);
  const offset=Date.now()-(Number(meta.serverNow)||Date.now());
  const deadline=Number(meta.deadline)||0;
  const remaining=deadline?Math.max(0,deadline-(Date.now()-offset)):0;
  if(next.phase==='playing'&&deadline){ui.timerLength=15000;ui.timerEnd=performance.now()+remaining;ui.botActionDeadline=performance.now()+remaining;}
  else{ui.timerEnd=0;ui.botActionDeadline=0;}
  this.clockTicker=setInterval(()=>{if(!this.active){clearInterval(this.clockTicker);return;}renderClock();if(next.phase==='playing'&&deadline&&next.turn===0){const seconds=Math.max(0,Math.ceil((ui.timerEnd-performance.now())/1000));$('clockText').textContent=seconds+'s';}},300);
  currentName=players[0].name;
  $('overlay').classList.add('hidden');$('sceneMenu').classList.add('hidden');$('sceneWelcome').classList.add('hidden');$('sceneMultiplayer').classList.add('hidden');$('sceneGame').classList.remove('hidden');
  render();
  if(!prev){window.dispatchEvent(new Event('taverna:match-visible'));animateDealFromState(next);}
  else if(prevRev!==g.revision){
   const geo=motionPositions(),before=new Map(prev.players[0].hand.map(c=>[c.id,c])),after=new Map(next.players[0].hand.map(c=>[c.id,c]));
   for(const [id,c] of before)if(!after.has(id))flight({from:geo.players[0],to:geo.discard,card:c,duration:480});
   for(const [id,c] of after)if(!before.has(id))flight({from:geo.draw,to:geo.players[0],card:c,duration:440,impact:'draw'});
   if(prev.discard[0]?.id!==top.id&&prev.players[0].hand.every(c=>c.id!==top.id)){
    const actor=ordered.findIndex(p=>p.id===g.players.find(x=>x.id===g.turnPlayerId)?.id);
    // Carta revelada do descarte sempre é a carta verdadeira, independente do baralho oculto.
    flight({from:geo.players[Math.max(0,actor)]||geo.draw,to:geo.discard,card:top,duration:480});
   }
  }
  ui.lastMsg=next.phase==='playing'?(turn===0?'Sua vez de jogar!':'Aguarde a vez de '+players[turn]?.name):next.phase==='scoring'?'Apuração da rodada…':'Fim da partida';
  ui.lastMsgError=false;renderMessage();
  return true;
 },
 reset(){this.active=false;this.revision=null;if(this.clockTicker)clearInterval(this.clockTicker);this.clockTicker=null;pauseSchedulers();cancelMotion();ui.game=null;ui.selected=[];$('sceneGame').classList.add('hidden');$('sceneMultiplayer').classList.remove('hidden');}
 ,
 showOnlineEvent(e,members,playerIds){
  const actor=playerIds.indexOf(e.playerId);
  const name=members.find(p=>p.id===e.playerId)?.name||'Jogador';
  const labels={mau:'MAU MAU!',accuse:'OPA!!!',timeout:'TEMPO ESGOTADO!',elimination:'ELIMINADO!',round_start:'NOVA RODADA',champion:'VITÓRIA!'};
  if(labels[e.type])effect(e.type==='timeout'?'alert':'',labels[e.type],name,actor<0?null:actor);
  if(e.type==='play'&&e.card){const geo=motionPositions();const from=geo?.players?.[Math.max(actor,0)];if(from&&geo?.discard)stampNotice(e.card,geo.discard);}
 }
};