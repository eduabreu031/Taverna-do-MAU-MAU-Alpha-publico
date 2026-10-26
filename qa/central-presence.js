/* Presença autenticada dos Frequentadores; promessa compartilhada evita corrida.
 * A conta admin aparece no salão, mas não altera a contagem da Central. */
(()=>{'use strict';
const auth=window.TavernaAuth;
const API='https://taverna-multiplayer-servidor.edulopes941.workers.dev';
const KEY='tav-presence-tab-v1';
const session=(()=>{
 let previous='';try{previous=sessionStorage.getItem(KEY)||''}catch{}
 if(/^tab_[a-f0-9]{40}$/.test(previous))return previous;
 const fresh='tab_'+Array.from(crypto.getRandomValues(new Uint8Array(20)),x=>x.toString(16).padStart(2,'0')).join('');
 try{sessionStorage.setItem(KEY,fresh)}catch{}
 return fresh;
})();
const visible=id=>{const n=document.getElementById(id);return !!n&&!n.classList.contains('hidden');};
let pending=null;
function ready(){
 const current=auth?.getUser?.(),lobby=visible('onlineLobby'),menu=visible('sceneMultiplayer');
 const game=visible('sceneGame'),onTable=game&&document.getElementById('sceneGame')?.classList.contains('online-live');
 const room=(lobby||onTable)?(document.getElementById('onlineCode')?.textContent||'').trim().toUpperCase():'';
 return {current,room:/^[A-Z0-9]{6}$/.test(room)?room:'',playingOffline:game&&!onTable,
  inviteAvailable:!!current&&current.role!=='guest'&&!game&&(menu||lobby)};
}
async function tick(force=false){
 if(pending){await pending;if(!force)return true;}
 if(document.hidden||!navigator.onLine){if(force)throw Error('Abra o jogo com conexão à internet para enviar convites.');return false;}
 const status=ready(),token=status.current?auth?.getToken?.():'';
 if(force&&!status.inviteAvailable){
  throw Error('Volte ao menu multiplayer para convidar outros jogadores.');
 }
 const work=(async()=>{
  const res=await fetch(API+'/api/central/presence',{
   method:'POST',headers:{'content-type':'application/json',...(token?{authorization:'Bearer '+token}:{})},
   body:JSON.stringify({session,room:status.room,playingOffline:status.playingOffline,inviteAvailable:status.inviteAvailable}),
   cache:'no-store'});
  if(!res.ok)throw Error('Não foi possível confirmar sua presença no servidor.');
  return true;
 })();
 pending=work;
 try{return await work;}catch(e){if(force)throw e;return false;}finally{if(pending===work)pending=null;}
}
window.TavernaPresence=Object.freeze({tick,ensureAvailable:()=>tick(true),getLocal:ready});
auth?.restoreSilently?.().then(()=>tick()).catch(()=>{});
setInterval(()=>tick(),15000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)tick()});
tick();
})();