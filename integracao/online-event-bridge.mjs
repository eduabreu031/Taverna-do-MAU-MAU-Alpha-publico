/* Ponte pura dos eventos online: não modifica DOM, timers nem motor offline. */
const known=new Set(['start','play','draw','pass','mau','accuse','false_accusation','timeout','elimination','round_start','round_won','suit','turn','direction','skip','combo','penalty','seven','nine','champion']);
export function translateOnlineEvents(message,previousIds=[]){
 if(message?.type!=='state')throw new TypeError('Estado do servidor esperado');
 const users=Array.isArray(message.players)?message.players:[];
 const index=new Map((message.game?.players??[]).map((p,i)=>[p.id,i]));
 const seen=new Set(previousIds),events=[];
 for(const e of Array.isArray(message.events)?message.events:[]){
  if(!e||typeof e.id!=='string'||seen.has(e.id))continue;seen.add(e.id);
  if(!known.has(e.type))continue;
  const actor=e.playerId==null?null:index.get(e.playerId);
  if(e.playerId!=null&&actor===undefined)continue;
  events.push(Object.freeze({id:e.id,type:e.type,actor,actorName:actor==null?null:(users.find(u=>u.id===e.playerId)?.name??'Jogador'),card:typeof e.card==='string'?e.card:null,at:Number.isFinite(e.at)?e.at:null,raw:Object.freeze({...e})}));
 }
 return Object.freeze({events:Object.freeze(events),seenIds:Object.freeze([...seen].slice(-160))});
}
export function changedOnlineCards(before,after){
 if(!Array.isArray(after?.ownHand))throw new TypeError('Mão online inválida');
 const old=new Set((before?.ownHand??[]).map(c=>c.id)),now=new Set(after.ownHand.map(c=>c.id));
 return Object.freeze({arrived:Object.freeze(after.ownHand.filter(c=>!old.has(c.id))),departed:Object.freeze((before?.ownHand??[]).filter(c=>!now.has(c.id)))});
}
