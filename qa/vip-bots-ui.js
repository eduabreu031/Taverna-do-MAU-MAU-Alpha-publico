/* Interface VIP e seleção de bots: não altera o motor de cartas. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const portal=$('sceneMultiplayer'),sel=$('onlineBotsDEV'),botPanel=$('botsLabDEV');
if(!portal||!sel||!botPanel||!window.TavernaAuth)return;
const make=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text)e.textContent=text;return e;};
const vipButton=make('button','engraved-btn tav-vip-enter','✦ Sala VIP permanente');
vipButton.type='button';vipButton.id='tavVipEnter';
const entrance=portal.querySelector('.multiplayer-preview');
if(entrance)entrance.insertAdjacentElement('beforebegin',vipButton);
const status=make('p','tav-vip-status','');vipButton.after(status);
const security=make('section','tav-bots-sheet tav-vip-security');
security.id='tavVipSecurity';security.hidden=true;security.setAttribute('role','dialog');security.setAttribute('aria-modal','true');
const securityInside=make('div','tav-bots-sheet-inner');
const securityHeading=make('h2','','Senha da sala VIP');
const securityCaption=make('p','','A senha da sala é diferente da senha da sua conta.');
const securityInput=make('input','tav-vip-secret');securityInput.type='password';securityInput.autocomplete='off';securityInput.maxLength=96;
securityInput.placeholder='Senha VIP (mínimo 10 caracteres)';
const securityError=make('p','tav-vip-security-error','');
const securityActions=make('div','tav-bots-actions');
const securityCancel=make('button','engraved-btn','Cancelar'),securitySave=make('button','engraved-btn primary','Confirmar');
securityActions.append(securityCancel,securitySave);
securityInside.append(securityHeading,securityCaption,securityInput,securityError,securityActions);
security.append(securityInside);document.body.append(security);
function askVipSecret(changing=false){
 return new Promise(resolve=>{
  security.hidden=false;securityHeading.textContent=changing?'Alterar a senha da VIP':'Digite a senha da sala VIP';
  securityCaption.textContent=changing?'A mudança será exigida nos próximos acessos. Seus amigos já conectados não serão expulsos.':'Entre com a senha desta sala, fornecida pelo administrador.';
  securityInput.value='';securityError.textContent='';securityInput.focus();
  function finish(ok){security.hidden=true;securitySave.onclick=null;securityCancel.onclick=null;securityInput.onkeydown=null;resolve(ok);}
  securityCancel.onclick=()=>finish(false);
  securityInput.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();securitySave.click();}else if(e.key==='Escape')finish(false)};
  securitySave.onclick=async()=>{
   if(securitySave.disabled)return;
   securitySave.disabled=true;securityError.textContent='';
   try{
    await window.TavernaAuth.roomRequest(changing?'/api/vip/password':'/api/vip/unlock','POST',{password:securityInput.value});
    finish(true);
   }catch(error){securityError.textContent=error.message||'Não foi possível validar a senha.';}
   finally{securitySave.disabled=false;}
  };
 });
}
vipButton.onclick=async()=>{
 vipButton.disabled=true;status.textContent='Consultando sala VIP…';
 try{
  let vip;
  try{vip=await window.TavernaAuth.roomRequest('/api/vip','GET');}
  catch(err){
   if(err.code!=='VIP_PASSWORD_REQUIRED')throw err;
   const unlocked=await askVipSecret(false);
   if(!unlocked){status.textContent='Entrada na VIP cancelada.';return;}
   vip=await window.TavernaAuth.roomRequest('/api/vip','GET');
  }
  if(!vip.vip)throw Error('Sala VIP ainda não está disponível');
  $('onlineRoomCode').value=vip.code;
  status.textContent='Entrando na sala VIP…';
  $('onlineJoin').click();
 }catch(err){status.textContent=err.message||'Não foi possível entrar na sala VIP';}
 finally{vipButton.disabled=false;}
};
const sheet=make('section','tav-bots-sheet');
sheet.id='tavBotsSheet';sheet.hidden=true;sheet.setAttribute('role','dialog');sheet.setAttribute('aria-modal','true');sheet.setAttribute('aria-label','Escolha a quantidade de bots');
const inner=make('div','tav-bots-sheet-inner');
inner.append(make('h2','','Convocar aventureiros'),make('p','','Escolha quantos bots ocuparão lugares na mesa.'));
const grid=make('div','tav-bots-grid');grid.setAttribute('role','group');grid.setAttribute('aria-label','Quantidade de bots');
inner.append(grid);
const actions=make('div','tav-bots-actions'),cancel=make('button','engraved-btn','Cancelar'),confirm=make('button','engraved-btn primary','Confirmar');
cancel.type=confirm.type='button';actions.append(cancel,confirm);inner.append(actions);sheet.append(inner);document.body.append(sheet);
const open=make('button','engraved-btn tav-bots-open','Sem bots');
open.id='tavBotsOpen';open.type='button';
sel.insertAdjacentElement('afterend',open);
let chosen=0;
const available=()=>[...sel.options].filter(o=>!o.disabled).map(o=>Number(o.value));
const refresh=()=>{
 open.disabled=sel.disabled;open.textContent=Number(sel.value)>0?sel.value+' bot'+(Number(sel.value)>1?'s':''):'Sem bots';
};
function close(){sheet.hidden=true;document.body.classList.remove('tav-bots-selecting');}
function show(){
 if(sel.disabled)return;
 chosen=Number(sel.value)||0;grid.replaceChildren();
 for(const n of available()){
  const btn=make('button','tav-bots-choice',n===0?'Sem bots':String(n));
  btn.type='button';btn.dataset.count=String(n);
  btn.setAttribute('aria-pressed',String(chosen===n));
  if(chosen===n)btn.classList.add('selected');
  btn.onclick=()=>{chosen=n;for(const b of grid.children){b.classList.toggle('selected',Number(b.dataset.count)===n);b.setAttribute('aria-pressed',String(Number(b.dataset.count)===n));}};
  grid.append(btn);
 }
 sheet.hidden=false;document.body.classList.add('tav-bots-selecting');
}
open.onclick=show;cancel.onclick=close;
confirm.onclick=()=>{sel.value=String(chosen);sel.dispatchEvent(new Event('change',{bubbles:true}));refresh();close();};
sheet.addEventListener('click',e=>{if(e.target===sheet)close();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!sheet.hidden)close();});
new MutationObserver(refresh).observe(botPanel,{attributes:true,attributeFilter:['hidden']});
setInterval(refresh,750);refresh();
const presence=make('section','tav-vip-presence');presence.id='tavVipPresence';presence.hidden=true;
const title=make('h3','','Presença na sala VIP'),members=make('ul','tav-vip-member-list'),adminActions=make('div','tav-vip-admin-actions'),adminMessage=make('p','tav-vip-admin-message','');
const changePassword=make('button','engraved-btn tav-vip-change-password','Alterar senha VIP');
changePassword.type='button';changePassword.onclick=async()=>{if(await askVipSecret(true)){adminMessage.textContent='Senha de acesso alterada com sucesso.';updatePresence();}};
adminActions.append(changePassword);presence.append(title,members,adminActions,adminMessage);
$('onlineLobby')?.insertAdjacentElement('afterbegin',presence);
async function updatePresence(){
 const inVip=!$('onlineLobby')?.classList.contains('hidden')&&$('onlineCode')?.textContent.trim()==='TAVERN';
 presence.hidden=!inVip;
 if(!inVip)return;
 try{
  const res=await window.TavernaAuth.roomRequest('/api/vip','GET');
  const people=Array.isArray(res.members)?res.members:[];
  const admin=window.TavernaAuth.getUser()?.role==='admin';
  adminActions.hidden=!admin;
  members.replaceChildren(...people.map(p=>{
   const li=make('li','tav-vip-member-row'),info=make('span','',p.name+' — '+p.status);
   li.append(info);li.classList.toggle('offline',!p.online);
   if(admin&&p.id&&p.accountId!==window.TavernaAuth.getUser()?.id){
    const remove=make('button','engraved-btn tav-vip-remove','Remover');
    remove.type='button';remove.setAttribute('aria-label','Remover '+p.name+' da sala VIP');
    remove.onclick=async()=>{
     if(remove.dataset.confirm!=='yes'){remove.dataset.confirm='yes';remove.textContent='Confirmar remoção';return;}
     remove.disabled=true;adminMessage.textContent='';
     try{
      await window.TavernaAuth.roomRequest('/api/vip/kick','POST',{memberId:p.id});
      adminMessage.textContent=p.name+' foi retirado da VIP nesta sessão.';
      updatePresence();
     }catch(error){adminMessage.textContent=error.message||'Não foi possível remover jogador';remove.disabled=false;}
    };
    li.append(remove);
   }
   return li;
  }));
  if(!people.length)members.append(make('li','','Nenhum amigo conectado ainda'));
 }catch(error){members.replaceChildren(make('li','',error.code==='VIP_PASSWORD_REQUIRED'?'Senha VIP alterada. Entre novamente na sala.':'Presença indisponível momentaneamente'));}
}
setInterval(updatePresence,6000);
updatePresence();
})();
