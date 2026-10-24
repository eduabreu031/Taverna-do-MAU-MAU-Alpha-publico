/* Taverna: gerenciador visual sazonal. Não importa nem altera o motor do jogo. */
(()=>{'use strict';
const CONFIG=/*TAVERNA_THEME_SCHEDULE*/;
const root=document.documentElement;
const DAY=24*60*60*1000;
function validate(config){
 if(!config||config.schema!==1||config.defaultTheme!=='classic'||!Array.isArray(config.themes))throw Error('Configuração de temas inválida');
 const entries=[];
 for(const item of config.themes){
  if(!/^[a-z][a-z0-9-]*$/.test(item.id)||typeof item.label!=='string'||typeof item.notice!=='string')throw Error('Tema inválido');
  const start=Date.parse(item.start),end=Date.parse(item.end);
  if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start||end-start>366*DAY)throw Error('Período do tema inválido');
  entries.push({...item,startMs:start,endMs:end});
 }
 // Evita resultados diferentes entre navegadores quando campanhas se sobrepõem.
 const sorted=[...entries].sort((a,b)=>a.startMs-b.startMs);
 for(let i=1;i<sorted.length;i++)if(sorted[i].startMs<sorted[i-1].endMs)throw Error('Períodos de temas sobrepostos');
 return entries;
}
const events=validate(CONFIG);
let serverDeltaMs=0,serverClockSeen=false,lastId='',clockBusy=false;
const localNow=()=>Date.now();
const now=()=>localNow()+serverDeltaMs;
function choose(instant){
 return events.find(e=>instant>=e.startMs&&instant<e.endMs)||null;
}
function status(at=now()){
 const event=choose(at);
 return event?{active:true,id:event.id,label:event.label,notice:event.notice,
  startsAt:event.startMs,endsAt:event.endMs,remainingMs:Math.max(0,event.endMs-at),
  timeZone:CONFIG.timeZone,source:serverClockSeen?'online':'aparelho'}:
  {active:false,id:CONFIG.defaultTheme,label:'Tema padrão',timeZone:CONFIG.timeZone,source:serverClockSeen?'online':'aparelho'};
}
function displayDate(ms){
 return new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(ms));
}
function sync(){
 const next=status(),id=next.active?next.id:'';
 if(id)root.setAttribute('data-tav-theme',id);
 else root.removeAttribute('data-tav-theme');
 if(id!==lastId){
  lastId=id;
  try{window.dispatchEvent(new CustomEvent('taverna-theme-change',{detail:next}));}catch{}
 }
 return next;
}
async function syncClockFromServer(){
 if(clockBusy||typeof fetch!=='function'||!navigator.onLine)return;
 clockBusy=true;
 try{
  const start=localNow();
  const url=new URL('./sw.js?clock='+Math.floor(start/60000),document.baseURI);
  // Só lê o cabeçalho Date do próprio site; não envolve o Worker nem contas.
  const response=await fetch(url.toString(),{method:'HEAD',cache:'no-store'});
  const date=response.headers.get('Date');
  if(response.ok&&date){
   const server=Date.parse(date),end=localNow();
   if(Number.isFinite(server)&&end>=start&&end-start<12000){
    const delta=server-(start+end)/2;
    if(Math.abs(delta)<366*DAY){serverDeltaMs=delta;serverClockSeen=true;sync();}
   }
  }
 }catch{}finally{clockBusy=false;}
}
window.TavernaThemeSystem=Object.freeze({getStatus:status,displayDate,getSchedule:()=>events.map(e=>Object.freeze({id:e.id,start:e.startMs,end:e.endMs})),refresh:sync});
sync();
setInterval(sync,10000); // O tema expira mesmo sem recarregar o aplicativo.
document.addEventListener('visibilitychange',()=>{if(!document.hidden){sync();syncClockFromServer();}});
window.addEventListener('pageshow',()=>{sync();syncClockFromServer();});
window.addEventListener('focus',()=>{sync();syncClockFromServer();});
syncClockFromServer();
})();