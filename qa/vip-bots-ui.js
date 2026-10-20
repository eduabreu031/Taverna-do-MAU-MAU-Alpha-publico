/* Interface VIP e seleção de bots: não altera o motor de cartas. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const portal=$('sceneMultiplayer'),sel=$('onlineBotsDEV'),botPanel=$('botsLabDEV');
if(!portal||!sel||!botPanel||!window.TavernaAuth)return;
const make=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text)e.textContent=text;return e;};
const passwordSheet=make('section','tav-bots-sheet tav-vip-password-sheet');
passwordSheet.hidden=true;passwordSheet.setAttribute('role','dialog');passwordSheet.setAttribute('aria-modal','true');
const passwordPanel=make('div','tav-bots-sheet-inner');
const passwordHeading=make('h2','','Senha da Sala VIP');
const passwordLabel=make('label','','Senha');
const passwordInput=make('input','tav-vip-password-input');passwordInput.type='password';passwordInput.maxLength=72;passwordInput.autocomplete='off';
const passwordActions=make('div','tav-bots-actions'),passwordCancel=make('button','engraved-btn','Cancelar'),passwordSubmit=make('button','engraved-btn primary','Confirmar');
passwordCancel.type=passwordSubmit.type='button';
passwordActions.append(passwordCancel,passwordSubmit);passwordPanel.append(passwordHeading,passwordLabel,passwordInput,passwordActions);passwordSheet.append(passwordPanel);document.body.append(passwordSheet);
window.TavernaVipPrompt=(heading='Senha da Sala VIP')=>new Promise(resolve=>{
 if(!passwordSheet.hidden){resolve(null);return;}
 passwordHeading.textContent=heading;passwordInput.value='';passwordSheet.hidden=false;
 const finish=value=>{passwordSheet.hidden=true;passwordCancel.onclick=null;passwordSubmit.onclick=null;passwordInput.onkeydown=null;resolve(value);};
 passwordCancel.onclick=()=>finish(null);
 passwordSubmit.onclick=()=>finish(passwordInput.value);
 passwordInput.onkeydown=e=>{if(e.key==='Enter')finish(passwordInput.value);if(e.key==='Escape')finish(null);};
 passwordInput.focus();
});
const vipButton=make('button','engraved-btn tav-vip-enter','✦ Sala VIP');
vipButton.type='button';vipButton.id='tavVipEnter';
const entrance=portal.querySelector('.multiplayer-preview');
if(entrance)entrance.insertAdjacentElement('beforebegin',vipButton);
const status=make('p','tav-vip-status','');vipButton.after(status);
const requestAccess=make('button','engraved-btn tav-vip-request-access','Solicitar acesso à Sala VIP');
requestAccess.type='button';requestAccess.id='tavVipRequestAccess';
status.after(requestAccess);
requestAccess.hidden=true;
let lastAccessUser='', lastAccessCheck=0, accessChecking=false;
async function refreshAccess(force=false){
 const account=window.TavernaAuth.getUser();
 const id=account?.id||'';
 if(!id||account?.role==='admin'||account?.role==='guest'){
  requestAccess.hidden=true;lastAccessUser=id;return;
 }
 if(accessChecking||(!force&&id===lastAccessUser&&Date.now()-lastAccessCheck<7000))return;
 accessChecking=true;requestAccess.hidden=true;
 try{
  const grant=await window.TavernaAuth.roomRequest('/api/vip/access/status','GET');
  if(window.TavernaAuth.getUser()?.id!==id)return;
  requestAccess.hidden=grant.status==='approved'||grant.status==='pending';
  lastAccessUser=id;lastAccessCheck=Date.now();
 }catch{
  requestAccess.hidden=true;lastAccessCheck=Date.now();
 }finally{accessChecking=false;}
}
setInterval(refreshAccess,3500);
document.getElementById('chooseMultiplayer')?.addEventListener('click',()=>setTimeout(()=>refreshAccess(true),500));
refreshAccess(true);
requestAccess.onclick=async()=>{
 requestAccess.disabled=true;status.textContent='Registrando solicitação de acesso…';
 try{
  const account=await window.TavernaAuth.requireUser();
  if(!account)throw Error('Entre na sua conta para solicitar acesso.');
  if(account.role==='guest')throw Error('Crie uma conta para solicitar acesso duradouro. Visitantes podem entrar com a senha.');
  const result=await window.TavernaAuth.roomRequest('/api/vip/access/request','POST');
  status.textContent=result.status==='approved'?'Seu acesso já está autorizado.':'Solicitação enviada. O administrador poderá aprovar quando estiver online.';
  await refreshAccess(true);
 }catch(e){status.textContent=e.message||'Falha ao enviar solicitação';}
 finally{requestAccess.disabled=false;}
};

vipButton.onclick=async()=>{
 vipButton.disabled=true;status.textContent='Consultando sala VIP…';
 try{
  const vip=await window.TavernaAuth.roomRequest('/api/vip','GET');
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
const title=make('h3','','Presença na Sala VIP'),members=make('ul','tav-vip-member-list');
const management=make('div','tav-vip-management');
const passwordButton=make('button','engraved-btn tav-vip-change-password','Alterar senha da Sala VIP');
const adminInfo=make('p','tav-vip-admin-info','');passwordButton.type='button';management.append(passwordButton,adminInfo);management.hidden=true;
presence.append(title,management,members);
passwordButton.onclick=async()=>{
 const password=await window.TavernaVipPrompt('Criar ou alterar a senha da Sala VIP');
 if(password===null)return;
 if(password.length<8){adminInfo.textContent='A senha precisa de pelo menos 8 caracteres.';return;}
 passwordButton.disabled=true;adminInfo.textContent='Salvando nova senha…';
 try{await window.TavernaAuth.roomRequest('/api/vip/password','POST',{password});adminInfo.textContent='Senha da Sala VIP atualizada com sucesso.';}
 catch(e){adminInfo.textContent=e.message||'Não foi possível atualizar a senha';}
 finally{passwordButton.disabled=false;}
};
$('onlineLobby')?.insertAdjacentElement('afterbegin',presence);
async function updatePresence(){
 const inVip=!$('onlineLobby')?.classList.contains('hidden')&&$('onlineCode')?.textContent.trim()==='TAVERN';
 presence.hidden=!inVip;
 if(!inVip)return;
 try{
  const res=await window.TavernaAuth.roomRequest('/api/vip','GET');
  const people=Array.isArray(res.members)?res.members:[];
  management.hidden=!res.canManage;
  members.replaceChildren(...people.map(p=>{
   const li=make('li','',p.name+' — '+p.status);
   li.classList.toggle('offline',!p.online);
   if(res.canManage&&p.id&&p.name!==window.TavernaAuth.getUser()?.username&&res.phase!=='playing'&&res.phase!=='scoring'){
    const kick=make('button','engraved-btn tav-vip-kick','Remover');
    kick.type='button';kick.setAttribute('aria-label','Remover '+p.name+' da Sala VIP');
    kick.onclick=async()=>{
     if(!window.confirm('Remover '+p.name+' da Sala VIP?'))return;
     kick.disabled=true;adminInfo.textContent='Removendo participante…';
     try{await window.TavernaAuth.roomRequest('/api/vip/kick','POST',{id:p.id});adminInfo.textContent='Participante removido da Sala VIP.';await updatePresence();}
     catch(e){adminInfo.textContent=e.message||'Não foi possível remover';kick.disabled=false;}
    };
    li.append(kick);
   }
   return li;
  }));
  if(!people.length)members.append(make('li','','Nenhum amigo conectado ainda'));
 }catch{members.replaceChildren(make('li','','Presença indisponível momentaneamente'));}
}
setInterval(updatePresence,6000);
updatePresence();
})();
