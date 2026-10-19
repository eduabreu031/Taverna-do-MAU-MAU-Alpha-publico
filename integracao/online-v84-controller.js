(()=>{
'use strict';
const API='https://taverna-multiplayer-servidor.edulopes941.workers.dev';
const el=id=>document.getElementById(id);
const st=el('onlineStatusText'),notice=el('onlineNotice'),lobby=el('onlineLobby');
let ws=null,room='',uid='',token='',game=null,players=[],hostId='',opa=null,online=false,closing=false,reconnectTimer=0,retries=0,revision=-1;
let lastEventIds=new Set();
const name=()=>String(el('playerName')?.value||'Viajante').trim().slice(0,22)||'Viajante';
const key=c=>'taverna-session-'+c;
const store={get(k){try{return sessionStorage.getItem(k)}catch{return null}},set(k,v){try{sessionStorage.setItem(k,v)}catch{}},del(k){try{sessionStorage.removeItem(k)}catch{}}};
const setStatus=s=>st.textContent=s;
const message=s=>{notice.textContent=s;const strip=el('message');if(online&&strip){strip.textContent=s;strip.classList.add('error')}};
function send(data){if(ws?.readyState!==WebSocket.OPEN){message('Conexão indisponível. Aguarde reconexão.');return false}ws.send(JSON.stringify(data));return true;}
function close(leave=false){closing=true;clearTimeout(reconnectTimer);if(leave&&ws?.readyState===1)send({type:'leave'});if(ws){ws.onclose=null;ws.close();ws=null;}if(leave&&room)store.del(key(room));if(online){online=false;window.__tavOriginalOnline?.reset();}room='';uid='';game=null;revision=-1;lastEventIds.clear();lobby.classList.add('hidden');setStatus('Aguardando conexão');}
function connect(code,existingToken=''){
 if(ws){ws.onclose=null;ws.close();ws=null;}
 clearTimeout(reconnectTimer);closing=false;room=code;token=existingToken;setStatus('Conectando à sala '+code+'…');
 const url=new URL(API.replace(/^http/,'ws')+'/api/room/'+code+'/ws');url.searchParams.set('name',name());if(token)url.searchParams.set('token',token);
 let socket;try{socket=new WebSocket(url)}catch(e){message('Não foi possível criar a conexão: '+e.message);return;}ws=socket;
 socket.onopen=()=>{retries=0;setStatus('Conectado à sala '+code)};
 socket.onmessage=event=>{
  let m;try{m=JSON.parse(event.data)}catch{return;}
  if(m.type==='welcome'){uid=m.id;token=m.token;store.set(key(code),token);lobby.classList.remove('hidden');el('onlineCode').textContent=code;}
  if(m.type==='error'){message('Servidor: '+(m.message||'Ação rejeitada'));return;}
  if(m.type!=='state')return;
  players=m.players||[];hostId=m.hostId;opa=m.opa;
  el('onlinePlayers').replaceChildren(...players.map(p=>{const li=document.createElement('li');li.textContent=p.name+(p.id===hostId?' (anfitrião)':'')+(p.id===uid?' · você':'')+(p.online?' · conectado':' · desconectado');return li;}));
  const canStart=uid===hostId&&players.length>=2&&players.every(p=>p.online)&&!m.game;
  el('onlineStart').disabled=!canStart;el('onlineStart').classList.toggle('hidden',!!m.game);
  el('onlineStartHint').textContent=m.game?'Partida iniciada.':canStart?'A sala está pronta para começar.':uid===hostId?'Aguarde pelo menos dois participantes conectados.':'Aguarde o anfitrião iniciar.';
  if(m.game){
   if(game&&m.game.revision<revision)return;
   game=m.game;revision=game.revision;
   try{online=true;window.__tavOriginalOnline.apply(game,players,uid,{opa,deadline:m.turnDeadline,serverNow:m.serverNow});}catch(e){online=false;console.error(e);message('Falha ao abrir a mesa: '+e.message);return;}
   if(m.events)for(const ev of m.events){if(!ev?.id||lastEventIds.has(ev.id))continue;const wasEmpty=lastEventIds.size===0;lastEventIds.add(ev.id);if(!wasEmpty)try{window.__tavOriginalOnline.showOnlineEvent(ev,players,game.players.map(x=>x.id).slice(game.players.findIndex(x=>x.id===uid)).concat(game.players.slice(0,game.players.findIndex(x=>x.id===uid)).map(x=>x.id)));}catch(err){console.warn('Efeito online',err);}if(lastEventIds.size>200)lastEventIds=new Set([...lastEventIds].slice(-160));}
   if(m.opa){el('opaBtn').disabled=m.opa.playerId===uid;}
   else el('opaBtn').disabled=false;
   if(m.turnDeadline&&game.turnPlayerId===uid){const secs=Math.max(0,Math.ceil((m.turnDeadline-m.serverNow)/1000));el('clockText').textContent=secs+'s';}
   if(game.phase==='finished'||game.phase==='game_over'){setStatus('Partida encerrada');}
  }else if(online){online=false;window.__tavOriginalOnline.reset();}
  if(!online)setStatus(players.filter(p=>p.online).length+' participante(s) conectado(s)');
 };
 socket.onerror=()=>{setStatus('Sem conexão ao servidor');if(!online)message('Não foi possível conectar à sala.');};
 socket.onclose=e=>{
  if(closing||ws!==socket)return;
  setStatus('Conexão interrompida');
  if(e.code===4000||e.code===1008||retries>=5){message('Sessão encerrada. Volte ao menu e tente novamente.');return;}
  const pause=Math.min(12000,1200*2**retries++);reconnectTimer=setTimeout(()=>connect(code,store.get(key(code))||token),pause);
 };
}
const action=(action,cardId=null,suit=null)=>{if(!game||game.phase!=='playing')return;const payload={type:'action',action,revision:game.revision};if(cardId)payload.cardId=cardId;if(suit)payload.suit=suit;send(payload);};
el('onlineCreate').onclick=async()=>{const btn=el('onlineCreate');btn.disabled=true;try{setStatus('Criando sala…');const res=await fetch(API+'/api/room',{method:'POST'});if(!res.ok)throw Error('Servidor respondeu '+res.status);const m=await res.json();connect(m.code);}catch(e){message('Falha ao criar sala: '+e.message);}finally{btn.disabled=false;}};
el('onlineJoin').onclick=()=>{const code=el('onlineRoomCode').value.toUpperCase().trim();if(!/^[A-HJ-NP-Z2-9]{6}$/.test(code)){message('Código inválido: são seis caracteres.');return;}connect(code,store.get(key(code))||'');};
el('onlineStart').onclick=()=>send({type:'start'});
el('onlineLeave').onclick=()=>close(true);
el('onlineCopy').onclick=async()=>{const url=new URL(location.href);url.searchParams.set('sala',room);try{await navigator.clipboard.writeText(url.href);setStatus('Convite copiado');}catch{prompt('Copie o convite',url.href)}};
el('multiplayerBackBtn').addEventListener('click',()=>close(true));
// Captura ANTES dos listeners offline. Nunca propagar ações online ao motor local.
const controls=new Set(['drawPile','passBtn','sevenBtn','mauBtn','opaBtn','discardPile','humanHand','returnMenu']);
function intercept(e){
 if(!online)return;
 const hit=e.target.closest?.('[data-card],#drawPile,#passBtn,#sevenBtn,#mauBtn,#opaBtn,#discardPile,#humanHand,#returnMenu');
 if(!hit)return;
 const card=e.target.closest?.('[data-card]');
 e.stopImmediatePropagation();e.preventDefault();
 if(e.type==='dragstart'||e.type==='drop'||e.type==='dragover'||e.type==='dblclick'||e.type==='keydown')return;
 if(e.type!=='click')return;
 if(hit.id==='returnMenu'){close(false);el('sceneWelcome').classList.remove('hidden');el('sceneMultiplayer').classList.add('hidden');return;}
 if(card){
  if(game.turnPlayerId!==uid){message('Aguarde sua vez.');return;}
  const own=game.hand.find(c=>c.id===card.dataset.card);if(!own)return;
  if(own.rank==='J'&&game.hand.length>1){const suit=prompt('Naipe para o Valete: ♠ ♥ ♦ ♣',own.suit);if(['♠','♥','♦','♣'].includes(suit))action('play',own.id,suit);}
  else action('play',own.id);
 }else if(hit.id==='drawPile')action('draw');
 else if(hit.id==='passBtn')action('pass');
 else if(hit.id==='sevenBtn')action('take_seven');
 else if(hit.id==='mauBtn')action('mau');
 else if(hit.id==='opaBtn'){if(!opa){message('Nenhum evento OPA!!! disponível.');return;}send({type:'accuse',eventId:opa.id});}
}
for(const type of ['click','dblclick','dragstart','dragover','drop','keydown'])document.addEventListener(type,intercept,true);
const code=new URLSearchParams(location.search).get('sala');if(code&&/^[A-HJ-NP-Z2-9]{6}$/.test(code.toUpperCase()))el('onlineRoomCode').value=code.toUpperCase();
window.__tavOnlineTest={isOnline:()=>online,injectWelcome:(id='a',t='abc')=>{uid=id;token=t;},injectState:m=>ws?.onmessage?.({data:JSON.stringify(m)}),getState:()=>game};
})();