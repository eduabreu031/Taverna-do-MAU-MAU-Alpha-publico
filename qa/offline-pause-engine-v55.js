/* Alpha v55 — pausa exclusiva do motor offline. Mantém prazos restantes. */
ui.offlinePaused=false;
ui.offlinePauseMode=null;
ui.offlinePauseSnapshot=null;
ui.tavIncidentDeadline=0;
const tavPauseLayer=document.createElement('section');
tavPauseLayer.id='tavOfflinePauseLayer';
tavPauseLayer.hidden=true;
tavPauseLayer.setAttribute('role','dialog');
tavPauseLayer.setAttribute('aria-modal','true');
tavPauseLayer.setAttribute('aria-labelledby','tavOfflinePauseTitle');
tavPauseLayer.innerHTML='<div class="tav-offline-pause-panel"><div class="tav-offline-pause-mark" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false" aria-hidden="true"><rect x="5" y="3" width="5" height="18" rx="1.5"></rect><rect x="14" y="3" width="5" height="18" rx="1.5"></rect></svg></div><small>✦ TAVERNA DO MAU MAU ✦</small><h2 id="tavOfflinePauseTitle">Partida pausada</h2><p>Os relógios e os adversários estão parados. Você não perde a vez nem recebe punições enquanto estiver aqui.</p><button type="button" id="tavOfflineResumeBtn">▶ CONTINUAR PARTIDA</button></div>';
document.body.append(tavPauseLayer);
const tavPauseNav=document.querySelector('#sceneGame .game-header .utility-toolbar');
if(!tavPauseNav)throw Error('Cabeçalho offline não encontrado para pausa');
const tavPauseBtn=document.createElement('button');
tavPauseBtn.type='button';
tavPauseBtn.id='tavOfflinePauseBtn';
tavPauseBtn.className='engraved-btn slim tavern-float-icon tav-offline-pause-btn';
tavPauseBtn.title='Pausar partida offline';
tavPauseBtn.setAttribute('aria-label','Pausar partida offline');
tavPauseBtn.setAttribute('aria-haspopup','dialog');
tavPauseBtn.setAttribute('aria-controls','tavOfflinePauseLayer');
tavPauseBtn.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="6" y="4" width="4" height="16" rx="1.3" fill="currentColor"></rect><rect x="14" y="4" width="4" height="16" rx="1.3" fill="currentColor"></rect></svg>';
tavPauseNav.append(tavPauseBtn);
function tavOfflineRemaining(deadline,now){return deadline>0?Math.max(1,deadline-now):null;}
function tavOfflinePause(mode='manual'){
 const scene=$('sceneGame');
 if(ui.offlinePaused||!ui.game||scene.classList.contains('hidden')||ui.introActive||ui.modal)return false;
 const state=ui.game.state;
 if(state.phase!=='playing')return false;
 const now=performance.now();
 ui.offlinePauseSnapshot={
  serial:ui.gameSerial,revision:state.revision,turn:state.turn,
  humanMs:tavOfflineRemaining(ui.timerEnd,now),
  botMs:tavOfflineRemaining(ui.botActionDeadline,now),
  thinkMs:tavOfflineRemaining(ui.botThinkUntil,now),
  incidentMs:state.incident?.open?tavOfflineRemaining(ui.tavIncidentDeadline,now):null
 };
 ui.offlinePaused=true;
 ui.offlinePauseMode=mode;
 pauseSchedulers(); // invalida callbacks pendentes e interrompe os relógios.
 scene.inert=true;
 document.body.classList.add('tav-offline-is-paused');
 if(mode==='manual'){
  tavPauseLayer.hidden=false;
  $('tavOfflineResumeBtn').focus({preventScroll:true});
 }
 return true;
}
function tavOfflineResume(expectedMode=null){
 if(!ui.offlinePaused||(expectedMode&&ui.offlinePauseMode!==expectedMode))return false;
 const snapshot=ui.offlinePauseSnapshot;
 ui.offlinePaused=false;
 ui.offlinePauseMode=null;
 ui.offlinePauseSnapshot=null;
 tavPauseLayer.hidden=true;
 $('sceneGame').inert=false;
 document.body.classList.remove('tav-offline-is-paused');
 if(ui.game&&snapshot&&ui.gameSerial===snapshot.serial&&!$('sceneGame').classList.contains('hidden')){
  if(ui.game.state.phase==='playing'){
   if(ui.game.state.turn===0&&snapshot.humanMs!==null)
    ui.clockCarry={ms:snapshot.humanMs};
   schedule('normal',snapshot);
   renderClock();
  }
 }
 if(expectedMode==='manual')tavPauseBtn.focus({preventScroll:true});
 return true;
}
function tavOfflineReset(){
 ui.offlinePaused=false;
 ui.offlinePauseMode=null;
 ui.offlinePauseSnapshot=null;
 ui.tavIncidentDeadline=0;
 tavPauseLayer.hidden=true;
 $('sceneGame').inert=false;
 document.body.classList.remove('tav-offline-is-paused');
}
tavPauseBtn.addEventListener('click',()=>tavOfflinePause('manual'));
$('tavOfflineResumeBtn').addEventListener('click',()=>tavOfflineResume('manual'));
document.addEventListener('keydown',event=>{
 if(!ui.offlinePaused||ui.offlinePauseMode!=='manual')return;
 if(event.key==='Escape'){
  event.preventDefault();event.stopImmediatePropagation();tavOfflineResume('manual');
 }
},true);
window.TavernaOfflinePause=Object.freeze({
 pause:()=>tavOfflinePause('manual'),
 resume:()=>tavOfflineResume('manual'),
 holdForCronicas:()=>tavOfflinePause('cronicas'),
 releaseCronicas:()=>tavOfflineResume('cronicas'),
 isPaused:()=>ui.offlinePaused
});
