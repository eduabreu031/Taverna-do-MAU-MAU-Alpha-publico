/* Taverna — aparência do jogador + calendário administrativo, independentes do motor. */
(()=>{'use strict';
const CONFIG=/*TAVERNA_THEME_SCHEDULE*/;
const root=document.documentElement;
const DAY=86400000;
const KEY='taverna:appearance:palette:v1';
const PALETTES=Object.freeze([
 Object.freeze({id:'classic',label:'Taverna Clássica',description:'Feltro vinho, madeira e luz de velas'}),
 Object.freeze({id:'neon-blue',label:'Noite Neon Azul',description:'Azul elétrico e roxo arcano'}),
 Object.freeze({id:'neon-green',label:'Noite Neon Verde',description:'Esmeralda, verde e magia alquímica'}),
 Object.freeze({id:'neon-pink',label:'Noite Neon Rosa',description:'Rosa luminoso e violeta encantado'}),
 Object.freeze({id:'neon-tavern-dark',label:'Taverna Sombria',description:'Madeira negra e feltro vermelho intenso'}),
 Object.freeze({id:'neon-aero',label:'Brisa Aero',description:'Azul céu, água e natureza, brilho discreto'}),
 Object.freeze({id:'neon-imperial',label:'Veludo Imperial',description:'Veludo púrpura, ouro antigo e elegância'}),
 Object.freeze({id:'neon-amber',label:'Âmbar do Deserto',description:'Areia dourada, bronze e luz de âmbar'})
]);
const validIds=new Set(PALETTES.map(p=>p.id));
function validate(config){
 if(!config||config.schema!==1||config.defaultTheme!=='classic'||!Array.isArray(config.themes))throw Error('Calendário de temas inválido');
 const entries=config.themes.map(item=>{
  if(!/^[a-z][a-z0-9-]*$/.test(item.id)||!item.label||!item.notice)throw Error('Tema sazonal inválido');
  const start=Date.parse(item.start),end=Date.parse(item.end);
  if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start||end-start>366*DAY)throw Error('Período sazonal inválido');
  return {...item,startMs:start,endMs:end};
 });
 const sorted=[...entries].sort((a,b)=>a.startMs-b.startMs);
 for(let i=1;i<sorted.length;i++)if(sorted[i].startMs<sorted[i-1].endMs)throw Error('Calendário sazonal sobreposto');
 return entries;
}
const events=validate(CONFIG);
let serverDeltaMs=0,serverClockSeen=false,clockBusy=false,boundaryTimer=null,lastStateId='';
let userSelection=null;
try{const stored=localStorage.getItem(KEY);if(validIds.has(stored))userSelection=stored;}catch{}
const now=()=>Date.now()+serverDeltaMs;
function eventAt(t){return events.find(e=>t>=e.startMs&&t<e.endMs)||null;}
function getStatus(t=now()){
 const e=eventAt(t);
 return e?{active:true,id:e.id,label:e.label,notice:e.notice,startsAt:e.startMs,endsAt:e.endMs,
  remainingMs:Math.max(0,e.endMs-t),timeZone:CONFIG.timeZone,source:serverClockSeen?'online':'aparelho'}:
  {active:false,id:CONFIG.defaultTheme,label:'Sem tema comemorativo',timeZone:CONFIG.timeZone,source:serverClockSeen?'online':'aparelho'};
}
function getPalette(t=now()){
 // Compatibilidade com o ensaio já iniciado: usuários sem escolha mantêm azul
 // só até o horário original de término. Uma escolha explícita sempre vence.
 const e=eventAt(t);
 const id=userSelection||(e?.id==='neon-test'?'neon-blue':'classic');
 return {...PALETTES.find(p=>p.id===id),saved:userSelection!==null,temporary:!userSelection&&e?.id==='neon-test'};
}
function displayDate(ms){
 return new Intl.DateTimeFormat('pt-BR',{timeZone:CONFIG.timeZone,day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(ms));
}
function scheduleBoundary(){
 if(boundaryTimer!==null){clearTimeout(boundaryTimer);boundaryTimer=null;}
 const time=now(),next=events.flatMap(e=>[e.startMs,e.endMs]).filter(t=>t>time).sort((a,b)=>a-b)[0];
 if(Number.isFinite(next))boundaryTimer=setTimeout(refresh,Math.min(2147483000,Math.max(1,next-time+20)));
}
function refresh(){
 const event=getStatus(),palette=getPalette();
 // O clássico não ganha CSS. A data sazonal nunca modifica o valor salvo.
 if(palette.id==='classic')root.removeAttribute('data-tav-palette');
 else root.setAttribute('data-tav-palette',palette.id);
 if(event.active)root.setAttribute('data-tav-event',event.id);
 else root.removeAttribute('data-tav-event');
 root.removeAttribute('data-tav-theme'); // marcador da antiga implementação, descontinuado
 const stateId=palette.id+'|'+event.id;
 if(stateId!==lastStateId){
  lastStateId=stateId;
  try{window.dispatchEvent(new CustomEvent('taverna-theme-change',{detail:{palette,event}}));}catch{}
 }
 scheduleBoundary();
 return {palette,event};
}
function setPalette(id){
 if(!validIds.has(id))return false;
 userSelection=id;
 try{localStorage.setItem(KEY,id);}catch{}
 refresh();
 return true;
}
async function syncClockFromServer(){
 if(clockBusy||typeof fetch!=='function'||!navigator.onLine)return;
 clockBusy=true;
 try{
  const start=Date.now();
  const response=await fetch(new URL('./sw.js?clock='+Math.floor(start/60000),document.baseURI),{method:'HEAD',cache:'no-store'});
  const stamp=response.headers.get('Date'),end=Date.now();
  if(response.ok&&stamp&&end>=start&&end-start<12000){
   const server=Date.parse(stamp),delta=server-(start+end)/2;
   if(Number.isFinite(delta)&&Math.abs(delta)<366*DAY){serverDeltaMs=delta;serverClockSeen=true;refresh();}
  }
 }catch{}finally{clockBusy=false;}
}
window.TavernaThemeSystem=Object.freeze({
 getStatus,getPalette,getChoices:()=>PALETTES,getSchedule:()=>events.map(e=>({id:e.id,start:e.startMs,end:e.endMs})),
 setPalette,refresh,displayDate
});
refresh();
setInterval(refresh,10000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden){refresh();syncClockFromServer();}});
window.addEventListener('pageshow',()=>{refresh();syncClockFromServer();});
window.addEventListener('focus',()=>{refresh();syncClockFromServer();});
syncClockFromServer();
})();