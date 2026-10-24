/* Entrada da Taverna. Nenhuma alteração de cartas, timers, sockets ou cenas originais. */
(()=>{'use strict';
const welcome=document.getElementById('sceneWelcome');
if(!welcome||document.getElementById('tavEntrance'))return;
const auth=()=>window.TavernaAuth;
const el=document.createElement('section');
el.id='tavEntrance';el.setAttribute('role','region');el.setAttribute('aria-label','Entrada da Taverna do Mau Mau');
el.innerHTML=`
 <div class="tav-gate-art">
  <div class="tav-gate-threshold" aria-hidden="true"></div>
  <div class="tav-gate-embers" aria-hidden="true"></div>
  <button type="button" id="tavEntranceDoor" class="tav-gate-door" aria-label="Abrir a porta da Taverna" aria-haspopup="dialog" aria-controls="tavEntranceIdentity">
   <span>TAVERNA DO MAU MAU</span>
  </button>
 </div>
 <div class="tav-gate-caption" aria-hidden="true"><span>TOQUE NA PORTA PARA ENTRAR</span></div>
 <div class="tav-gate-identity" id="tavEntranceIdentity" role="dialog" aria-modal="true" aria-labelledby="tavEntranceTitle" hidden>
  <div class="tav-gate-identity-card">
   <div class="tav-gate-crest" aria-hidden="true">♠</div>
   <div class="tav-gate-eyebrow">✦ SEJA BEM-VINDO À TAVERNA ✦</div>
   <h2 id="tavEntranceTitle">Quem bate à porta?</h2>
   <div class="tav-gate-rule" aria-hidden="true"></div>
   <p>As portas estão abertas. Escolha como deseja se apresentar aos demais aventureiros.</p>
   <div class="tav-gate-actions">
    <button type="button" id="tavEntrancePrimary">Entrar com minha conta</button>
    <button type="button" id="tavEntranceAccount">Entrar ou criar conta</button>
    <button type="button" id="tavEntranceGuest">Entrar como Forasteiro</button>
    <button type="button" id="tavEntranceBack">Voltar à porta</button>
   </div>
   <p id="tavEntranceError" class="tav-gate-error" role="status" aria-live="polite"></p>
  </div>
 </div>`;
document.body.appendChild(el);
const door=el.querySelector('#tavEntranceDoor');
const identity=el.querySelector('#tavEntranceIdentity');
const primary=el.querySelector('#tavEntrancePrimary');
const accountBtn=el.querySelector('#tavEntranceAccount');
const guestBtn=el.querySelector('#tavEntranceGuest');
const back=el.querySelector('#tavEntranceBack');
const error=el.querySelector('#tavEntranceError');
const buttons=[primary,accountBtn,guestBtn,back];
let stage='door',busy=false,voiceOnce=false,opened=false;
function current(){const found=auth()?.getUser?.();return found?.role!=='guest'?found:null;}
function labels(){
 const user=current();
 if(user){
  primary.textContent='Continuar como '+(user.username||'aventureiro');
  primary.hidden=false;
  accountBtn.textContent='Trocar conta';
 }else{
  primary.hidden=true;
  accountBtn.textContent='Entrar ou criar conta';
 }
}
function setBusy(v){busy=v;buttons.forEach(b=>{b.disabled=v;});}
function setVisitorName(){
 const name=document.getElementById('playerName');
 if(!name)return;
 name.readOnly=false;name.value='Forasteiro';
 name.dispatchEvent(new Event('input',{bubbles:true}));
 name.dispatchEvent(new Event('change',{bubbles:true}));
}
function dismissVisualOnly(){
 if(stage==='done')return;
 stage='done';el.hidden=true;el.remove();observer.disconnect();
}
function onInterior(){
 if(voiceOnce)return;voiceOnce=true;
 // A voz e o rádio são serviços do jogo; esta UI nunca sintetiza
 // uma voz genérica nem altera a preferência de efeitos sonoros.
 try{window.dispatchEvent(new CustomEvent('taverna-interior-entered'));}catch{}
}
function ensureRadio(){
 let pref=null;try{pref=localStorage.getItem('tavern-radio-preference');}catch{}
 const radio=document.getElementById('musicBtn');
 if(pref!=='false'&&radio&&!radio.classList.contains('audio-on')){
  // Aciona o controle ORIGINAL; não cria outro sistema de áudio.
  try{radio.click();}catch{}
 }
}
function finish(){
 if(stage==='done'||busy&&stage==='entering')return;
 ensureRadio();
 stage='entering';identity.hidden=true;el.classList.add('tav-gate-departing');
 const done=()=>{dismissVisualOnly();onInterior();};
 if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)done();
 else setTimeout(done,950);
}
async function enterGuest(){
 if(busy)return;
 setBusy(true);error.textContent='';
 try{
  if(auth()?.getToken?.()||current())await auth().logout();
  if(navigator.onLine&&auth()?.enterAsGuest){
   const ctl=new AbortController();
   const timeout=setTimeout(()=>ctl.abort(),1600);
   try{await auth().enterAsGuest(ctl.signal);}catch{/* Conexão indisponível: o modo offline continua acessível. */}
   finally{clearTimeout(timeout);}
  }
  setVisitorName();finish();
 }catch(e){error.textContent='Não foi possível preparar a entrada. Tente novamente.';}
 finally{setBusy(false);}
}
async function enterAccount(replace){
 if(busy)return;setBusy(true);error.textContent='';
 const accountOverlay=document.getElementById('alphaAccountsOverlay');
 const previousZ=accountOverlay?.style.zIndex||'';
 if(accountOverlay)accountOverlay.style.zIndex='2147480010';
 try{
  if(replace){await auth()?.logout?.();}
  const user=await auth()?.requireUser?.();
  if(user){auth()?.syncAdventureName?.();finish();}
  else{labels();error.textContent='Escolha uma conta ou entre como Forasteiro.';}
 }catch(e){error.textContent=e?.message||'Não foi possível entrar na conta.';}
 finally{if(accountOverlay)accountOverlay.style.zIndex=previousZ;setBusy(false);}
}
function openDoor(){
 if(stage!=='door')return;
 opened=true;stage='identity';el.classList.add('tav-gate-opened');
 labels();setTimeout(()=>{if(stage==='identity'){identity.hidden=false;(primary.hidden?accountBtn:primary).focus();}},1030);
 Promise.resolve(auth()?.restoreSilently?.()).then(()=>{if(stage==='identity')labels();}).catch(()=>{});
}
door.addEventListener('click',openDoor);
primary.addEventListener('click',()=>{if(current()){auth()?.syncAdventureName?.();finish();}else enterAccount(false);});
accountBtn.addEventListener('click',()=>enterAccount(!!current()));
guestBtn.addEventListener('click',enterGuest);
back.addEventListener('click',()=>{
 if(busy)return;
 identity.hidden=true;el.classList.remove('tav-gate-opened');stage='door';door.focus();
});
el.addEventListener('keydown',event=>{
 if(event.key==='Escape'&&stage==='identity'&&!busy){event.preventDefault();back.click();}
 if(event.key!=='Tab'||identity.hidden)return;
 const tabbable=buttons.filter(b=>!b.disabled&&!b.hidden);
 const idx=tabbable.indexOf(document.activeElement);
 if(event.shiftKey&&idx===0){event.preventDefault();tabbable.at(-1).focus();}
 else if(!event.shiftKey&&idx===tabbable.length-1){event.preventDefault();tabbable[0].focus();}
});
const observer=new MutationObserver(()=>{
 if(stage==='done'||stage==='entering')return;
 const live=Array.from(['sceneGame','sceneMultiplayer','sceneMenu'],id=>document.getElementById(id))
  .some(node=>node&&!node.classList.contains('hidden')&&getComputedStyle(node).display!=='none');
 if(live)dismissVisualOnly(); // Retomada de sessão nunca bloqueada pela fachada.
});
observer.observe(document.body,{subtree:true,attributes:true,attributeFilter:['class']});
window.TavernaEntrance=Object.freeze({
 isOpen:()=>stage!=='done',
 skipVisualOnly:dismissVisualOnly,
 openDoor
});
if(welcome.classList.contains('hidden'))dismissVisualOnly();
})();