/* Adaptador puro de protocolo. Não modifica DOM, GameEngine nem timers. */
const SUITS=new Set(['♠','♥','♦','♣']);
const RANKS=new Set(['A','2','3','4','5','6','7','8','9','10','J','Q','K']);
const fail=m=>{throw new TypeError('Estado online inválido: '+m)};
const card=v=>{if(!v||typeof v.id!=='string'||!RANKS.has(v.rank)||!SUITS.has(v.suit))fail('carta');return Object.freeze({id:v.id,rank:v.rank,suit:v.suit})};
export function normalizeOnlineState(message,myId,previousRevision=-1){
 if(message?.type!=='state'||!message.game)fail('mensagem sem partida');
 const g=message.game;
 if(!Number.isInteger(g.revision)||g.revision<previousRevision)fail('revisão desatualizada');
 if(!Array.isArray(g.players)||g.players.length<2||g.players.length>10)fail('jogadores');
 if(!Array.isArray(g.hand)||!g.players.some(p=>p.id===myId))fail('identidade ou mão');
 const me=g.players.find(p=>p.id===myId);if(g.hand.length!==me.count)fail('contagem da própria mão');
 const ids=new Set(),hand=g.hand.map(v=>{const c=card(v);if(ids.has(c.id))fail('carta duplicada');ids.add(c.id);return c});
 const players=g.players.map((p,i)=>{if(typeof p.id!=='string'||!Number.isInteger(p.count)||p.count<0)fail('assento');return Object.freeze({id:p.id,name:message.players?.find(x=>x.id===p.id)?.name||'Jogador '+(i+1),alive:p.alive!==false,count:p.count,hand:p.id===myId?hand:null})});
 const top=card(g.top);if(!SUITS.has(g.activeSuit))fail('naipe ativo');
 const turn=players.findIndex(p=>p.id===g.turnPlayerId);if(g.phase==='playing'&&turn<0)fail('vez de jogador inexistente');
 return Object.freeze({revision:g.revision,phase:g.phase,round:g.round,players:Object.freeze(players),ownHand:Object.freeze(hand),myIndex:players.findIndex(p=>p.id===myId),top,activeSuit:g.activeSuit,turn,direction:g.direction,deckCount:g.deckCount,drawn:!!g.drawn,pendingSeven:g.pendingSeven||0,incident:message.opa||null,deadline:message.turnDeadline||null,serverNow:message.serverNow||null});
}
export function serverAction(state,action,cardId=null,suit=null){
 if(!state||state.phase!=='playing')fail('partida não iniciada');
 if(!['play','draw','pass','mau','take_seven'].includes(action))fail('ação');
 if(action==='play'&&!state.ownHand.some(c=>c.id===cardId))fail('carta não pertence ao jogador');
 if(action==='play'&&state.turn!==state.myIndex)fail('não é sua vez');
 return Object.freeze({type:'action',action,...(cardId?{cardId}:{}),...(suit?{suit}:{}),revision:state.revision});
}
