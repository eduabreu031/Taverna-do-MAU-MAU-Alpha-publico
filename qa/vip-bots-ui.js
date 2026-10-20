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
const title=make('h3','','Presença na sala VIP'),members=make('ul','tav-vip-member-list');presence.append(title,members);
$('onlineLobby')?.insertAdjacentElement('afterbegin',presence);
async function updatePresence(){
 const inVip=!$('onlineLobby')?.classList.contains('hidden')&&$('onlineCode')?.textContent.trim()==='TAVERN';
 presence.hidden=!inVip;
 if(!inVip)return;
 try{
  const res=await window.TavernaAuth.roomRequest('/api/vip','GET');
  const people=Array.isArray(res.members)?res.members:[];
  members.replaceChildren(...people.map(p=>{
   const li=make('li','',p.name+' — '+p.status);
   li.classList.toggle('offline',!p.online);return li;
  }));
  if(!people.length)members.append(make('li','','Nenhum amigo conectado ainda'));
 }catch{members.replaceChildren(make('li','','Presença indisponível momentaneamente'));}
}
setInterval(updatePresence,6000);
updatePresence();
})();
