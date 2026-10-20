/* Batimento de presença leve, sem cartas ou dados de contas. */
(()=>{'use strict';
const auth=window.TavernaAuth;
const API='https://taverna-multiplayer-servidor.edulopes941.workers.dev';
const session='tab_'+Array.from(crypto.getRandomValues(new Uint8Array(20)),x=>x.toString(16).padStart(2,'0')).join('');
let busy=false;
async function tick(){
 if(busy||document.visibilityState==='hidden'||!navigator.onLine)return;
 busy=true;
 try{
  const logged=auth?.getUser();
  const token=logged?auth?.getToken?.():'';
  const lobby=document.getElementById('onlineLobby');
  const onTable=document.getElementById('sceneGame')?.classList.contains('online-live');
  const inLobby=!lobby?.classList.contains('hidden');
  const code=(onTable||inLobby)?(document.getElementById('onlineCode')?.textContent||'').trim().toUpperCase():'';
  await fetch(API+'/api/central/presence',{method:'POST',headers:{'content-type':'application/json',...(token?{authorization:'Bearer '+token}:{})},body:JSON.stringify({session,room:/^[A-Z0-9]{6}$/.test(code)?code:''}),cache:'no-store'});
 }catch{}finally{busy=false;}
}
setInterval(tick,15000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)tick();});tick();
})();