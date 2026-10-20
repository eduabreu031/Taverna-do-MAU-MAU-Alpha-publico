/* Contas cadastradas persistem; visitante existe somente até recarregar/fechar a página. */
(()=>{'use strict';
const API='https://taverna-multiplayer-servidor.edulopes941.workers.dev';
const KEY='taverna-alpha-auth-token';
let token=localStorage.getItem(KEY)||'',user=null,resolveForm=null,vipPassword='',vipPromptPending=null,mode='login',vipMenuSession=false,vipMenuArmed=false;
try{sessionStorage.removeItem(KEY);}catch{} // Elimina sessões antigas de visitantes sem afetar contas registradas.
const el=(tag,attrs={},content='')=>{const node=document.createElement(tag);for(const [k,v] of Object.entries(attrs))node.setAttribute(k,v);if(content)node.textContent=content;return node;};
const overlay=el('section',{id:'alphaAccountsOverlay',role:'dialog','aria-modal':'true','aria-label':'Acesse sua conta'});
overlay.hidden=true;
overlay.innerHTML='<div class="alpha-accounts-panel"><h2 id="alphaAccountHeading">Conta da Taverna</h2><p id="alphaAccountSubtitle">Entre com sua conta ou visite a Taverna sem cadastro.</p><label for="alphaAccountUser">Usuário</label><input id="alphaAccountUser" autocomplete="username" maxlength="24" placeholder="Seu usuário"><label for="alphaAccountPassword">Senha</label><input id="alphaAccountPassword" type="password" autocomplete="current-password" maxlength="128" placeholder="Sua senha"><div id="alphaRegisterFields" hidden><label for="alphaAccountConfirmPassword">Confirmar senha</label><input id="alphaAccountConfirmPassword" type="password" autocomplete="new-password" maxlength="128" placeholder="Repita a senha"><label for="alphaAccountPhone">Número de telefone com DDD</label><input id="alphaAccountPhone" type="tel" inputmode="tel" autocomplete="tel" maxlength="19" placeholder="(31) 98765-4321"><p class="alpha-phone-note">Usado apenas no cadastro. Não aparece nas salas nem no perfil público.</p></div><p id="alphaAccountError" role="alert"></p><div class="alpha-account-actions"><button id="alphaAccountLogin" type="button">Entrar</button><button id="alphaAccountCreate" type="button">Criar conta</button></div><button id="alphaAccountGuest" type="button">Entrar como visitante</button><button id="alphaAccountCancel" type="button">Voltar</button></div>';
document.body.appendChild(overlay);
const query=id=>document.getElementById(id);
const err=x=>query('alphaAccountError').textContent=x||'';
const loginButton=query('alphaAccountLogin'),createButton=query('alphaAccountCreate'),guestButton=query('alphaAccountGuest'),backButton=query('alphaAccountCancel');
async function request(path,method='GET',data){
 const headers={};if(token)headers.authorization='Bearer '+token;if(data!==undefined)headers['content-type']='application/json';
 const res=await fetch(API+path,{method,headers,...(data!==undefined?{body:JSON.stringify(data)}:{})});
 const body=await res.json().catch(()=>({}));
 if(!res.ok)throw Error(body.error||'Servidor indisponível (HTTP '+res.status+')');
 return body;
}
function switchMode(next){
 mode=next;err('');
 const isRegistration=mode==='register';
 query('alphaRegisterFields').hidden=!isRegistration;
 query('alphaAccountHeading').textContent=isRegistration?'Criar conta':'Conta da Taverna';
 query('alphaAccountSubtitle').textContent=isRegistration?'Preencha seus dados para criar uma conta.':'Entre com sua conta ou visite a Taverna sem cadastro.';
 query('alphaAccountPassword').setAttribute('autocomplete',isRegistration?'new-password':'current-password');
 loginButton.textContent=isRegistration?'Voltar para login':'Entrar';
 createButton.textContent=isRegistration?'Confirmar cadastro':'Criar conta';
 guestButton.hidden=isRegistration;
}
const show=()=>{switchMode('login');overlay.hidden=false;query('alphaAccountUser').focus();};
const hide=()=>{overlay.hidden=true;query('alphaAccountPassword').value='';query('alphaAccountConfirmPassword').value='';};
function syncAdventureName(){
 const account=user,field=document.getElementById('playerName');
 if(!field)return;
 field.readOnly=!!account&&account.role!=='guest';
 if(!account||account.role==='guest')return;
 if(field.value!==account.username){
  field.value=account.username;
  field.dispatchEvent(new Event('input',{bubbles:true}));
  field.dispatchEvent(new Event('change',{bubbles:true}));
 }
}
const settle=value=>{syncAdventureName();const done=resolveForm;resolveForm=null;hide();if(done)done(value);};
backButton.onclick=()=>{if(mode==='register')switchMode('login');else settle(null);};
async function login(){
 const username=query('alphaAccountUser').value.trim(),password=query('alphaAccountPassword').value;
 if(!username||!password){err('Informe seu usuário e sua senha para entrar.');return;}
 loginButton.disabled=createButton.disabled=guestButton.disabled=true;err('');
 try{
  const value=await request('/api/auth/login','POST',{username,password});
  token=value.token;user=value.user;localStorage.setItem(KEY,token);sessionStorage.removeItem(KEY);settle(user);
 }catch(e){err(e.message);}finally{loginButton.disabled=createButton.disabled=guestButton.disabled=false;}
}
async function create(){
 const username=query('alphaAccountUser').value.trim(),password=query('alphaAccountPassword').value,
  confirmPassword=query('alphaAccountConfirmPassword').value,phone=query('alphaAccountPhone').value.trim();
 if(!username||password.length<10||password!==confirmPassword){err('Confira o usuário e as senhas (mínimo de 10 caracteres, iguais nos dois campos).');return;}
 if(!/^(?:[1-9][0-9]{9,10}|55[1-9][0-9]{9,10})$/.test(phone.replace(/\D/g,''))){err('Informe um telefone válido com DDD.');return;}
 loginButton.disabled=createButton.disabled=guestButton.disabled=true;err('');
 try{
  await request('/api/auth/register','POST',{username,password,confirmPassword,phone});
  const value=await request('/api/auth/login','POST',{username,password});
  token=value.token;user=value.user;localStorage.setItem(KEY,token);sessionStorage.removeItem(KEY);settle(user);
 }catch(e){err(e.message);}finally{loginButton.disabled=createButton.disabled=guestButton.disabled=false;}
}
loginButton.onclick=()=>{if(mode==='register')switchMode('login');else login();};
createButton.onclick=()=>{if(mode==='register')create();else{switchMode('register');query('alphaAccountUser').focus();}};
guestButton.onclick=async()=>{
 guestButton.disabled=true;err('');
 try{
  const value=await request('/api/auth/guest','POST');
  token=value.token;user=value.user;localStorage.removeItem(KEY);sessionStorage.removeItem(KEY);
  // Nenhuma identidade de visitante é armazenada para um próximo acesso.
  try{for(const storage of [localStorage,sessionStorage])for(let i=storage.length-1;i>=0;i--){const k=storage.key(i);if(k&&(k.startsWith('taverna-beta-session-')||k.startsWith('taverna-beta-bots-')||k.startsWith('taverna-guest-runtime-')))storage.removeItem(k);}}catch{}
  settle(user);
 }catch(e){err(e.message);}finally{guestButton.disabled=false;}
};
async function requireUser(){
 if(user){syncAdventureName();return user;}
 if(token)try{
  const data=await request('/api/auth/me');
  if(data.user?.role==='guest'){token='';user=null;localStorage.removeItem(KEY);sessionStorage.removeItem(KEY);}
  else{user=data.user;syncAdventureName();return user;}
 }catch{token='';localStorage.removeItem(KEY);sessionStorage.removeItem(KEY);}
 show();return new Promise(resolve=>{resolveForm=resolve;});
}
async function roomRequest(path,method='POST',data){
 const found=await requireUser();if(!found)throw Error('Entre na sua conta ou escolha visitante');
 return request(path,method,data);
}
async function pass(code=''){
 const roomCode=String(code||'').trim().toUpperCase();
 if(roomCode==='TAVERN'&&!vipMenuSession)throw Error('Entre na Sala VIP pelo menu exclusivo.');
 if(roomCode!=='TAVERN')vipMenuSession=false;
 if(roomCode==='TAVERN'){
  const status=await roomRequest('/api/vip','GET');
  if(status.passwordProtected){
   const member=await requireUser();
   if(member?.role!=='admin'&&!vipPassword){
    const grant=member?.role==='guest'?{status:'none'}:await roomRequest('/api/vip/access/status','GET');
    // Mesmo com pedido pendente, quem conhece a senha pode entrar normalmente.
    if(grant.status==='approved')return (await roomRequest('/api/room/pass','POST',{roomCode,vipEntry:true})).pass;
    if(!vipPromptPending)vipPromptPending=(async()=>window.TavernaVipPrompt?await window.TavernaVipPrompt('Senha da Sala VIP'):null)().finally(()=>{vipPromptPending=null;});
    const value=await vipPromptPending;
    if(value===null||value==='')throw Error('Entrada na Sala VIP cancelada');
    vipPassword=value;
   }
  }
 }
 try{const p=await roomRequest('/api/room/pass','POST',{roomCode,vipEntry:roomCode==='TAVERN',vipPassword:roomCode==='TAVERN'?vipPassword:undefined});return p.pass;}
 catch(e){if(roomCode==='TAVERN'&&/senha|VIP/i.test(e.message))vipPassword='';throw e;}
}
async function logout(){
 try{if(token)await request('/api/auth/logout','POST');}catch{}
 token='';user=null;vipPassword='';localStorage.removeItem(KEY);sessionStorage.removeItem(KEY);
}
async function restoreSilently(){
 if(user){syncAdventureName();return user;}
 if(!token)return null;
 try{const data=await request('/api/auth/me');if(data.user?.role==='guest')return null;user=data.user;syncAdventureName();return user;}
 catch{return null;}
}
window.TavernaAuth={requireUser,restoreSilently,roomRequest,pass,logout,syncAdventureName,getUser:()=>user,getToken:()=>token,armVipEntrance:()=>{vipMenuArmed=true;},consumeVipEntrance:()=>{const ok=vipMenuArmed;vipMenuArmed=false;if(ok)vipMenuSession=true;return ok;}};
const portal=query('sceneMultiplayer');
if(portal){
 const bar=el('div',{id:'alphaAccountsBar'}),status=el('span',{id:'alphaAccountsStatus'}),
 btn=el('button',{type:'button',id:'alphaAccountsLogout'},'Trocar conta');
 bar.append(status,btn);
 btn.onclick=async()=>{
  if(!query('onlineLobby')?.classList.contains('hidden')){status.textContent='Saia da sala antes de trocar de conta.';return;}
  await logout();status.textContent='Você saiu da conta.';
  const current=await requireUser();updateStatus(current);
 };
 function updateStatus(current){status.textContent=current?(current.role==='guest'?'Visitante · nome temporário':current.role==='admin'?'Administrador geral · '+current.username:'Conta: '+current.username):'Entre para jogar.';}
 const panel=portal.querySelector('.multiplayer-panel')||portal,state=panel.querySelector('.multiplayer-state');
 if(state)panel.insertBefore(bar,state);else panel.prepend(bar);
 const go=query('chooseMultiplayer');
 if(go)go.addEventListener('click',()=>{queueMicrotask(async()=>{const current=await requireUser();updateStatus(current);});});
}
})();
