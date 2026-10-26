/* Administração da VIP independente de estar conectado ao lobby. */
(()=>{'use strict';
 const auth=window.TavernaAuth,bar=document.getElementById('alphaAccountsBar');
 if(!auth||!bar)return;
 const make=(tag,cls,txt)=>{const element=document.createElement(tag);if(cls)element.className=cls;if(txt)element.textContent=txt;return element;};
 const trigger=make('button','engraved-btn tav-admin-trigger','Administração VIP');
 trigger.id='tavVipAdminOpen';trigger.type='button';trigger.hidden=true;bar.append(trigger);
 const overlay=make('section','tav-admin-overlay');overlay.id='tavVipAdminOverlay';overlay.hidden=true;
 overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','Administração da Sala VIP');
 const panel=make('div','tav-admin-panel');
 const heading=make('h2','','Administração da Sala VIP');
 const intro=make('p','tav-admin-intro','Gerencie o acesso, a senha e os participantes da sala sem precisar entrar na mesa.');
 const summary=make('p','tav-admin-summary','');
 const actions=make('div','tav-admin-actions');
 const password=make('button','engraved-btn tav-admin-password','Alterar senha');
 const reload=make('button','engraved-btn tav-admin-reload','Atualizar presença');
 const close=make('button','engraved-btn tav-admin-close','Fechar');
 [password,reload,close].forEach(b=>b.type='button');
 actions.append(password,reload,close);
 const notice=make('p','tav-admin-notice','');
 notice.setAttribute('role','status');
 const peopleTitle=make('h3','','Participantes');
 const peopleList=make('ul','tav-admin-list');
 const botsTitle=make('h3','','Bots da sala');
 const botsList=make('ul','tav-admin-list');
 const requestTitle=make('h3','','Solicitações de acesso');
 const requestList=make('ul','tav-admin-list tav-access-list');
 panel.append(heading,intro,summary,actions,notice,requestTitle,requestList,peopleTitle,peopleList,botsTitle,botsList);
 overlay.append(panel);document.body.append(overlay);
 const admin=()=>auth.getUser()?.role==='admin';
 function closed(){overlay.hidden=true;notice.textContent='';}
 close.onclick=closed;
 overlay.addEventListener('click',e=>{if(e.target===overlay)closed();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!overlay.hidden&&!document.querySelector('.tav-vip-password-sheet:not([hidden])'))closed();});
 const safePhase={waiting:'Aguardando jogadores',playing:'Partida em andamento',scoring:'Apuração da rodada',finished:'Partida finalizada',game_over:'Partida finalizada'};
 function entry(person,canKick){
  const li=make('li','tav-admin-person');
  const identity=make('span','',person.name+' — '+(person.status||'aguardando'));
  li.append(identity);
  if(canKick&&person.id&&person.name!==auth.getUser()?.username){
   const remove=make('button','engraved-btn tav-admin-remove','Remover');
   remove.type='button';
   remove.setAttribute('aria-label','Remover '+person.name+' da Sala VIP');
   remove.onclick=async()=>{
    if(!await window.TavernaUI.confirm({title:'Remover participante?',message:'Remover '+person.name+' da Sala VIP?',confirmLabel:'Remover',danger:true}))return;
    remove.disabled=true;notice.textContent='Removendo '+person.name+'…';
    try{await auth.roomRequest('/api/vip/kick','POST',{id:person.id});notice.textContent='Participante removido.';await refresh();}
    catch(err){notice.textContent=err.message||'Não foi possível remover o participante.';remove.disabled=false;}
   };
   li.append(remove);
  }
  return li;
 }
 let reading=false;
 async function refresh(){
  if(reading||overlay.hidden)return;
  reading=true;reload.disabled=true;
  try{
   const data=await auth.roomRequest('/api/vip','GET');
   if(!data.canManage){closed();trigger.hidden=true;return;}
   const access=await auth.roomRequest('/api/vip/access/requests','GET');
   requestList.replaceChildren();
   for(const person of access.requests||[]){
    const li=make('li','tav-admin-person'),name=make('span','',person.name+' · aguardando autorização');
    const approve=make('button','engraved-btn tav-admin-approve','Aprovar'),deny=make('button','engraved-btn tav-admin-deny','Recusar');
    for(const [control,decision] of [[approve,'approved'],[deny,'denied']]){
     control.type='button';
     control.onclick=async()=>{
      approve.disabled=deny.disabled=true;
      try{
       await auth.roomRequest('/api/vip/access/decide','POST',{id:person.id,decision});
       notice.textContent=decision==='approved'?'Acesso autorizado até a próxima troca de senha.':'Pedido recusado.';
       li.remove();
      }catch(e){notice.textContent=e.message||'Erro ao decidir solicitação';approve.disabled=deny.disabled=false;}
     };
    }
    li.append(name,approve,deny);requestList.append(li);
   }
   if(!requestList.childElementCount)requestList.append(make('li','','Nenhuma solicitação pendente.'));
   const participants=Array.isArray(data.members)?data.members:[];
   const bots=Array.isArray(data.bots)?data.bots:[];
   const canKick=!['playing','scoring'].includes(data.phase);
   summary.textContent=(safePhase[data.phase]||'Sala VIP')+' · '+(data.passwordProtected?'Senha protegida':'Senha ainda não definida')+' · '+participants.filter(p=>p.online).length+' jogadores conectados · '+bots.filter(p=>p.online).length+' bots conectados';
   peopleList.replaceChildren(...(participants.length?participants.map(x=>entry(x,canKick)):[make('li','','Nenhum participante na sala.')]));
   botsList.replaceChildren(...(bots.length?bots.map(x=>entry(x,canKick)):[make('li','','Nenhum bot na sala.')]));
   if(!canKick)notice.textContent='Partida em andamento: remova participantes somente no lobby.';
  }catch(err){notice.textContent=err.message||'Falha ao consultar a sala VIP.';}
  finally{reading=false;reload.disabled=false;}
 }
 reload.onclick=()=>{notice.textContent='';refresh();};
 password.onclick=async()=>{
  if(!admin()){closed();return;}
  const passwordValue=await window.TavernaVipPrompt('Criar ou alterar senha da Sala VIP');
  if(passwordValue===null)return;
  if(passwordValue.length<8){notice.textContent='Use uma senha com pelo menos 8 caracteres.';return;}
  password.disabled=true;notice.textContent='Salvando senha…';
  try{
   await auth.roomRequest('/api/vip/password','POST',{password:passwordValue});
   notice.textContent='Senha da Sala VIP alterada com sucesso.';
   await refresh();
  }catch(err){notice.textContent=err.message||'Não foi possível atualizar a senha.';}
  finally{password.disabled=false;}
 };
 trigger.onclick=async()=>{
  const account=await auth.requireUser();
  if(account?.role!=='admin'){trigger.hidden=true;return;}
  overlay.hidden=false;notice.textContent='Carregando administração da Sala VIP…';
  await refresh();
 };
 const update=()=>{
  const allowed=admin();
  trigger.hidden=!allowed;
  if(!allowed&&!overlay.hidden)closed();
 };
 setInterval(update,1000);update();
})();
