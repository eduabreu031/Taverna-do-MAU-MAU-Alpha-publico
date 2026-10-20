/* Entrada sem nome e confirmação de remoção VIP. Não altera o motor de cartas. */
(()=>{'use strict';
 const $=id=>document.getElementById(id);
 const welcome=$('sceneWelcome');
 const nameLabel=welcome?.querySelector('label[for="playerName"]'),nameInput=$('playerName');
 if(nameLabel)nameLabel.textContent='Nome de aventureiro (opcional)';
 if(nameInput)nameInput.placeholder='Sem nome, você será Forasteiro';
 function autoName(){
  if(!welcome)return;
  const inputs=Array.from(welcome.querySelectorAll('input[type="text"],input:not([type])'));
  for(const input of inputs){
   const ref=((input.id||'')+' '+(input.name||'')+' '+(input.placeholder||'')+' '+(input.getAttribute('aria-label')||'')).toLowerCase();
   if(!/nome|name|jogador|apelido/.test(ref)||input.value.trim())continue;
   input.value='Forasteiro';
   input.dispatchEvent(new Event('input',{bubbles:true}));
   input.dispatchEvent(new Event('change',{bubbles:true}));
  }
 }
 for(const id of ['chooseOffline','chooseMultiplayer','chooseRules']){
  $(id)?.addEventListener('click',autoName,{capture:true});
 }
 function clearGuestStore(){
  if(window.TavernaAuth?.getUser()?.role!=='guest')return;
  try{
   for(const storage of [localStorage,sessionStorage])for(let i=storage.length-1;i>=0;i--){
    const key=storage.key(i);
    if(key&&(key.startsWith('taverna-beta-session-')||key.startsWith('taverna-beta-bots-')||key.startsWith('taverna-guest-runtime-')))storage.removeItem(key);
   }
  }catch{}
 }
 window.addEventListener('pagehide',clearGuestStore);
 const notice=document.createElement('section');
 notice.id='tavRemovedNotice';notice.className='tav-removed-notice';notice.hidden=true;
 notice.setAttribute('role','alert');notice.setAttribute('aria-live','assertive');
 const panel=document.createElement('div');panel.className='tav-removed-card';
 const title=document.createElement('h2');title.textContent='Aviso da Taverna';
 const message=document.createElement('p');message.textContent='Você foi removido da Sala VIP pelo administrador.';
 const button=document.createElement('button');button.type='button';button.className='engraved-btn';
 button.textContent='Entendi';button.onclick=()=>{notice.hidden=true;};
 panel.append(title,message,button);notice.append(panel);document.body.append(notice);
 window.TavernaRemovalNotice=()=>{
  $('sceneGame')?.classList.add('hidden');
  $('sceneMultiplayer')?.classList.add('hidden');
  $('sceneWelcome')?.classList.remove('hidden');
  document.getElementById('tavVipAdminOverlay')?.setAttribute('hidden','');
  message.textContent='Você foi removido da Sala VIP pelo administrador.';
  notice.hidden=false;button.focus();
 };
 window.TavernaRoomExpiredNotice=()=>{
  window.TavernaRemovalNotice();
  message.textContent='Esta sala foi encerrada após um minuto sem jogadores conectados. Você voltou às boas-vindas.';
 };
})();
