/* Frequentadores da Taverna. Somente interface: servidor decide presença e acesso. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const portal=$('sceneMultiplayer'),lobby=$('onlineLobby'),auth=window.TavernaAuth;
if(!portal||!auth)return;
const API='https://taverna-multiplayer-servidor.edulopes941.workers.dev';
const el=(tag,cls='',text='')=>{const x=document.createElement(tag);if(cls)x.className=cls;if(text)x.textContent=text;return x};
const panel=el('section','tav-lounge');panel.id='tavLounge';
const heading=el('div','tav-lounge-heading');heading.append(el('h3','','Frequentadores'));
const field=el('input','tav-lounge-search');
field.type='search';field.placeholder='Buscar aventureiro...';field.maxLength=24;field.setAttribute('aria-label','Pesquisar jogadores pelo nome');
const top=el('div','tav-lounge-search-row');top.append(field);
const refreshBtn=el('button','tav-lounge-refresh','↻');refreshBtn.type='button';refreshBtn.setAttribute('aria-label','Atualizar frequentadores');refreshBtn.title='Atualizar lista';top.append(refreshBtn);
const state=el('p','tav-lounge-state','');state.setAttribute('role','status');
const list=el('div','tav-lounge-list');
panel.append(heading,top,state,list);
const originalParent=portal.querySelector('.multiplayer-panel')||portal;
const accountBar=$('alphaAccountsBar');
if(accountBar?.parentElement===originalParent)accountBar.after(panel);else originalParent.prepend(panel);
const roomToggle=el('button','tav-lounge-room-toggle','♠  Frequentadores · Convidar');
roomToggle.type='button';roomToggle.hidden=true;
lobby?.prepend(roomToggle);
roomToggle.onclick=()=>{panel.hidden=!panel.hidden;if(!panel.hidden){refresh();panel.scrollIntoView({behavior:'smooth',block:'nearest'});}};
const floating=el('div','tav-lounge-incoming');floating.hidden=true;floating.setAttribute('role','alert');document.body.append(floating);
const statusName={disponivel:'Disponível',em_sala:'Aguardando em sala',ocupado:'Ocupado',offline:'Offline'};
let lastSeenInvite='',lastQuery='',fetchEpoch=0,searchTimer=null;
const joining=new Set(),dismissed=new Set();
const mobileReady=()=>!portal.classList.contains('hidden')||!!lobby&&!lobby.classList.contains('hidden');
function syncPlacement(){
 const inRoom=!!lobby&&!lobby.classList.contains('hidden');
 if(inRoom){
  if(panel.parentElement!==lobby)lobby.append(panel);
  if(roomToggle.hidden){panel.hidden=true;roomToggle.hidden=false;}
 }else{
  if(panel.parentElement!==originalParent){if(accountBar?.parentElement===originalParent)accountBar.after(panel);else originalParent.prepend(panel);}
  panel.hidden=false;roomToggle.hidden=true;
 }
}
async function api(path,method='GET',body){
 const token=auth.getToken?.(),user=auth.getUser?.();
 if(!token||!user||user.role==='guest')throw Error('Entre com uma conta cadastrada para usar os convites.');
 const res=await fetch(API+'/api/lounge/'+path,{
  method,cache:'no-store',
  headers:{authorization:'Bearer '+token,...(body?{'content-type':'application/json'}:{})},
  ...(body?{body:JSON.stringify(body)}:{})
 });
 const obj=await res.json().catch(()=>({}));
 if(!res.ok)throw Error(obj.error||'Servidor indisponível');
 return obj;
}
function message(value){state.textContent=value;}
async function registerPresence(){
 // A própria área Multiplayer registra a conta antes de ler os frequentadores.
 // Não depende da ordem de execução do heartbeat administrativo.
 const code=currentCode();
 return api('ready','POST',{room:code==='TAVERN'?'TAVERN':code});
}
function canInvite(user){return user.inviteable===true}
function render(players,query){
 list.replaceChildren();
 const clean=Array.isArray(players)?players:[];
 message(query?clean.length+' encontrado(s)':clean.length+' conectado(s)');
 if(!clean.length){list.append(el('p','tav-lounge-empty',query?'Nenhum aventureiro encontrado.':'Nenhum outro jogador conectado neste momento.'));return;}
 for(const p of clean){
  const row=el('div','tav-lounge-player');
  const info=el('div','tav-lounge-player-info');
  info.append(el('strong','',p.username),el('small','tav-lounge-status '+p.status,statusName[p.status]||'Indisponível'));
  row.append(info);
  const button=el('button','tav-lounge-invite',canInvite(p)?'Convidar':'—');button.type='button';
  button.disabled=!canInvite(p);
  button.setAttribute('aria-label','Convidar '+p.username);
  button.onclick=async()=>{
   button.disabled=true;
   try{
    await registerPresence();
    const response=await api('invite','POST',{toId:p.id});
    button.textContent='Convite enviado';
    message('Convite enviado para '+p.username+'.');
    if(!response.id)throw Error('Convite inválido');
   }catch(error){message(error.message);button.textContent='Convidar';button.disabled=false;}
  };
  row.append(button);list.append(row);
 }
}
async function refresh(){
 if(!mobileReady()||document.hidden)return;
 let user=auth.getUser?.();
 if(!user)user=await auth.restoreSilently?.();
 if(!user||user.role==='guest'){message('Faça login numa conta cadastrada para ver os frequentadores.');list.replaceChildren();return;}
 const q=field.value.trim();
 if(q.length===1){message('Digite pelo menos duas letras para pesquisar.');list.replaceChildren();return;}
 const epoch=++fetchEpoch;lastQuery=q;
 try{await registerPresence();const result=await api('players'+(q?'?q='+encodeURIComponent(q):''));if(epoch===fetchEpoch)render(result.players,q)}
 catch(error){if(epoch===fetchEpoch)message(error.message)}
}
field.addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(refresh,360);});
refreshBtn.onclick=refresh;
function currentCode(){
 return !lobby?.classList.contains('hidden')?($('onlineCode')?.textContent||'').trim().toUpperCase():'';
}
function joinRoom(code,invitationId){
 if(!/^[A-HJ-NP-Z2-9]{6}$/.test(code)||code==='TAVERN')return;
 if(joining.has(invitationId))return;
 if(currentCode()===code){joining.add(invitationId);return;}
 if(currentCode()&&currentCode()!==code){message('Saia da sala atual antes de entrar na sala do convite.');return;}
 if(!$('onlineJoin')||!$('onlineRoomCode')){message('Entrada na sala indisponível.');return;}
 joining.add(invitationId);
 $('onlineRoomCode').value=code;
 $('onlineJoin').click(); // Usa exatamente a conexão autenticada já existente no jogo.
 message('Conectando à sala '+code+'...');
}
function hideIncoming(){floating.hidden=true;floating.replaceChildren();lastSeenInvite='';}
async function inbox(){
 if(document.hidden)return;
 const user=auth.getUser?.();
 if(!user||user.role==='guest'){hideIncoming();return;}
 try{
  const response=await api('inbox');
  const invites=Array.isArray(response.invitations)?response.invitations:[];
  for(const invite of invites){
   if(invite.status==='accepted'&&invite.room&&!joining.has(invite.id)){
    if(invite.fromId===user.id)joinRoom(invite.room,invite.id);
   }
  }
  const pending=invites.find(i=>i.toId===user.id&&i.status==='pending'&&!dismissed.has(i.id));
  if(!pending){hideIncoming();return;}
  if(lastSeenInvite===pending.id&&floating.firstChild)return;
  lastSeenInvite=pending.id;floating.replaceChildren();
  const title=el('strong','','Convite para jogar');
  const desc=el('p','',pending.fromName+' quer jogar uma partida com você!');
  const controls=el('div','tav-lounge-incoming-controls');
  const deny=el('button','','Recusar'),accept=el('button','','Aceitar');
  deny.type=accept.type='button';
  deny.onclick=async()=>{deny.disabled=accept.disabled=true;try{await api('decline','POST',{id:pending.id});dismissed.add(pending.id);hideIncoming();}catch(e){message(e.message);hideIncoming();}};
  accept.onclick=async()=>{
   deny.disabled=accept.disabled=true;
   try{
    await registerPresence();
    const result=await api('accept','POST',{id:pending.id});
    dismissed.add(pending.id);hideIncoming();
    if(result.accepted)joinRoom(result.room,pending.id);
   }catch(e){message(e.message);dismissed.add(pending.id);hideIncoming();}
  };
  controls.append(deny,accept);floating.append(title,desc,controls);floating.hidden=false;
 }catch{hideIncoming();}
}
let wasInRoom=false;
function reconcile(){
 syncPlacement();
 const inRoom=!!lobby&&!lobby.classList.contains('hidden');
 if(wasInRoom!==inRoom){wasInRoom=inRoom;refresh();}
}
setInterval(reconcile,900);
setInterval(refresh,6500);
setInterval(inbox,3500);
document.addEventListener('visibilitychange',()=>{if(!document.hidden){window.TavernaPresence?.tick?.();refresh();inbox();}});
$('chooseMultiplayer')?.addEventListener('click',()=>setTimeout(()=>{window.TavernaPresence?.tick?.();refresh();inbox()},500));
reconcile();
setTimeout(()=>{window.TavernaPresence?.tick?.();refresh();inbox()},1600);
window.TavernaLounge=Object.freeze({refresh,inbox});
})();