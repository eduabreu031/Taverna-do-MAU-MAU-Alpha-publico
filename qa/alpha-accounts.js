/* Cadastro e sessão online. Isolado do motor offline. */
(()=>{'use strict';
const API='https://taverna-multiplayer-servidor.edulopes941.workers.dev';
const KEY='taverna-alpha-auth-token';
let token=localStorage.getItem(KEY)||sessionStorage.getItem(KEY)||'',user=null,resolveForm=null,authPending=null,createPending=null;
const el=(tag,attrs={},content='')=>{const node=document.createElement(tag);for(const [k,v] of Object.entries(attrs))node.setAttribute(k,v);if(content)node.textContent=content;return node;};
const overlay=el('section',{id:'alphaAccountsOverlay',role:'dialog','aria-modal':'true','aria-label':'Acesse sua conta'});
overlay.hidden=true;overlay.innerHTML='<div class="alpha-accounts-panel"><h2>Conta da Taverna</h2><p>Crie sua conta ou entre para jogar com seus amigos.</p><label for="alphaAccountUser">Usuário</label><input id="alphaAccountUser" autocomplete="username" maxlength="24" placeholder="3 a 24 caracteres"><label for="alphaAccountPassword">Senha</label><input id="alphaAccountPassword" type="password" autocomplete="current-password" maxlength="128" placeholder="Pelo menos 10 caracteres"><p id="alphaAccountError" role="alert"></p><div class="alpha-account-actions"><button id="alphaAccountLogin" type="button">Entrar</button><button id="alphaAccountCreate" type="button">Criar conta</button></div><button id="alphaAccountGuest" type="button">Entrar como visitante</button><button id="alphaAccountCancel" type="button">Voltar</button></div>';
document.body.appendChild(overlay);
const query=id=>document.getElementById(id);
const err=x=>query('alphaAccountError').textContent=x||'';
async function request(path,method='GET',data,opts={}){
 const headers={'authorization':'Bearer '+token};
 if(data!==undefined)headers['content-type']='application/json';
 if(opts.key)headers['x-idempotency-key']=opts.key;
 const max=opts.retries||0;
 for(let attempt=0;attempt<=max;attempt++){
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),18000);
  try{
   const res=await fetch(API+path,{method,headers,signal:controller.signal,...(data!==undefined?{body:JSON.stringify(data)}:{})});
   const body=await res.json().catch(()=>({}));
   if(res.ok)return body;
   const failure=Object.assign(new Error(body.error||'Servidor indisponível (HTTP '+res.status+')'),{code:body.code,status:res.status});
   if(attempt===max||![429,502,503,504].includes(res.status))throw failure;
  }catch(error){
   if(attempt===max||error.status&&!([429,502,503,504].includes(error.status)))
    throw error.name==='AbortError'?new Error('A conexão demorou. Confira sua internet e tente novamente.'):error instanceof TypeError?new Error('Não foi possível conectar. Confira sua internet e tente novamente.'):error;
  }finally{clearTimeout(timeout);}
  await new Promise(resolve=>setTimeout(resolve,350*(2**attempt)+Math.floor(Math.random()*240)));
 }
 throw Error('Não foi possível concluir a solicitação.');
}
const show=()=>{overlay.hidden=false;err('');};
const hide=()=>{overlay.hidden=true;query('alphaAccountPassword').value='';};
const settle=value=>{const done=resolveForm;resolveForm=null;hide();if(done)done(value);};
query('alphaAccountCancel').onclick=()=>settle(null);
async function submit(register){
 const username=query('alphaAccountUser').value.trim(),password=query('alphaAccountPassword').value;
 const a=query('alphaAccountLogin'),b=query('alphaAccountCreate'),g=query('alphaAccountGuest');
 a.disabled=b.disabled=g.disabled=true;err('');
 try{
  if(register)await request('/api/auth/register','POST',{username,password});
  const value=await request('/api/auth/login','POST',{username,password});
  token=value.token;user=value.user;localStorage.setItem(KEY,token);settle(user);
 }catch(e){err(e.message);}finally{a.disabled=b.disabled=g.disabled=false;}
}
query('alphaAccountLogin').onclick=()=>submit(false);
query('alphaAccountCreate').onclick=()=>submit(true);
query('alphaAccountGuest').onclick=async()=>{
 const guestButton=query('alphaAccountGuest');guestButton.disabled=true;err('');
 try{
  const value=await request('/api/auth/guest','POST');
  token=value.token;user=value.user;sessionStorage.setItem(KEY,token);
  localStorage.removeItem(KEY);settle(user);
 }catch(e){err(e.message);}finally{guestButton.disabled=false;}
};
async function requireUser(){
 if(user)return user;
 if(token)try{const data=await request('/api/auth/me');user=data.user;return user;}catch{token='';localStorage.removeItem(KEY);sessionStorage.removeItem(KEY);}
 if(authPending)return authPending;
 show();
 authPending=new Promise(resolve=>{resolveForm=resolve;}).finally(()=>{authPending=null;});
 return authPending;
}
async function roomRequest(path,method='POST',body){
 const found=await requireUser();if(!found)throw Error('Entre na sua conta para jogar');
 if(path==='/api/room'&&method==='POST'){
  if(!createPending){
   const key='room_'+(crypto.randomUUID?crypto.randomUUID().replaceAll('-',''):String(Date.now())+String(Math.random()).slice(2));
   createPending=request(path,method,undefined,{key,retries:3}).finally(()=>{createPending=null;});
  }
  return createPending;
 }
 return request(path,method,body,{retries:path==='/api/room/pass'?2:0});
}
async function pass(){
 const p=await roomRequest('/api/room/pass');
 return p.pass;
}
async function logout(){
 try{if(token)await request('/api/auth/logout','POST');}catch{}
 token='';user=null;localStorage.removeItem(KEY);sessionStorage.removeItem(KEY);
}
window.TavernaAuth={requireUser,roomRequest,pass,logout,getUser:()=>user};
const portal=document.getElementById('sceneMultiplayer');
if(portal){
 const bar=el('div',{id:'alphaAccountsBar'});
 const status=el('span',{id:'alphaAccountsStatus'});
 const btn=el('button',{type:'button',id:'alphaAccountsLogout'},'Trocar conta');
 bar.append(status,btn);
 btn.onclick=async()=>{if(!document.getElementById('onlineLobby')?.classList.contains('hidden')){status.textContent='Saia da sala antes de trocar de conta.';return;}await logout();status.textContent='Você saiu da conta.';await requireUser();status.textContent=user?(user.role==='guest'?'Visitante':user.role==='admin'?'Administrador geral · '+user.username:'Conta: '+user.username):'Entre para jogar.';};
 const panel=portal.querySelector('.multiplayer-panel')||portal;
 const state=panel.querySelector('.multiplayer-state');
 if(state)panel.insertBefore(bar,state);else panel.prepend(bar);
 const go=document.getElementById('chooseMultiplayer');
 if(go)go.addEventListener('click',()=>{queueMicrotask(async()=>{const current=await requireUser();status.textContent=current?(current.role==='guest'?'Visitante · sessão temporária':current.role==='admin'?'Administrador geral · '+current.username:'Conta: '+current.username):'Entre para jogar.';});});
}
})();
