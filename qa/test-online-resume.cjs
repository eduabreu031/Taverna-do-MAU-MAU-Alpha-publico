/* Segurança de retomada: tests sem HTTP real nem efeitos no motor offline. */
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const path=require('node:path');
const site=process.argv[2]||'site';
const html=fs.readFileSync(path.join(site,'index.html'),'utf8');
const helper=fs.readFileSync('qa/online-resume-snippet.js','utf8');
function extract(id){
 const match=html.match(new RegExp('<script id="'+id+'">([\\s\\S]*?)<\\/script>'));
 assert(match,'Script ausente: '+id);
 return match[1];
}
const controller=extract('online-v84-controller'),auth=extract('alpha-accounts-script');
new vm.Script(controller,{filename:'online-v84-controller.js'});
new vm.Script(auth,{filename:'alpha-accounts-script.js'});
assert(controller.includes('restoreRoomOnStartup().catch('),'retomada não inicia ao carregar');
assert(controller.includes('saveResume(code,token);restorePending=false;'),'credencial não é salva após welcome');
assert(controller.includes('function close(leave=false){++connectSerial;clearResume();'),'saída deve desabilitar retomada');
assert(controller.includes('if(closing||serial!==connectSerial||room!==code)return;socket=new WebSocket(url)'),'corrida entre reconexão e saída');
assert(controller.includes('if(ws!==socket)return;'),'state de socket antigo não deve sobrescrever mesa');
assert(auth.includes('async function resumeGuestForRoom(savedToken)'),'visitor não restaurável');
assert(!helper.includes('game.hand')&&!helper.includes('ui.game'),'retomada nunca recria cartas');

function harness(storage,user,override={}){
 const events=[],nodes=new Map();
 const node=(id)=>{if(!nodes.has(id))nodes.set(id,{value:'',textContent:'',classList:{add(x){events.push('add:'+id+':'+x)},remove(x){events.push('remove:'+id+':'+x)}}});return nodes.get(id);};
 const store={getItem(k){return storage.get(k)??null},setItem(k,v){storage.set(k,v)},removeItem(k){storage.delete(k)}};
 const auth={getUser:()=>user,getToken:()=>user?.role==='guest'?'guest-bearer':null,
   restoreSilently:async()=>override.restored??user,
   resumeGuestForRoom:async(saved)=>{events.push('guest:'+saved);return override.restored??user;},
   syncAdventureName:()=>{}};
 const sandbox={sessionStorage:store,window:{TavernaAuth:auth},
   name:()=>user?.role==='guest'?'Forasteiro':'Jogador',
   el:node,notice:node('onlineNotice'),setStatus:(s)=>events.push('status:'+s),
   connect:(code,token)=>events.push('connect:'+code+':'+token),
   close:()=>events.push('closed'),message:(s)=>events.push('message:'+s),console};
 vm.createContext(sandbox);
 vm.runInContext(helper,sandbox,{filename:'online-resume-snippet.js'});
 return {events,sandbox};
}
(async()=>{
 const goodRoom='ABC123',token='server-seat';
 const storage=new Map();
 const account={username:'alice',role:'player'};
 let a=harness(storage,account);
 vm.runInContext("saveResume('ABC123','server-seat')",a.sandbox);
 assert.equal(JSON.parse(storage.get('taverna-online-resume-v1')).room,goodRoom);
 a=harness(storage,account);
 await vm.runInContext('restoreRoomOnStartup()',a.sandbox);
 assert(a.events.includes('connect:'+goodRoom+':'+token),'conta não retomou sala com token original');
 assert(a.events.includes('remove:sceneMultiplayer:hidden'),'lobby não foi exibido');

 const outsider={username:'bob',role:'player'};
 a=harness(storage,outsider);
 await vm.runInContext('restoreRoomOnStartup()',a.sandbox);
 assert(!a.events.some(x=>x.startsWith('connect:')),'conta distinta tentou ocupar cadeira');
 assert(!storage.has('taverna-online-resume-v1'),'marcador de conta inválida deve sumir');

 const guest={username:'guest_abc',role:'guest'},guestStore=new Map();
 a=harness(guestStore,guest);
 vm.runInContext("saveResume('ABC123','server-seat')",a.sandbox);
 assert.equal(JSON.parse(guestStore.get('taverna-online-resume-v1')).guestToken,'guest-bearer');
 a=harness(guestStore,guest);
 await vm.runInContext('restoreRoomOnStartup()',a.sandbox);
 assert(a.events.includes('guest:guest-bearer'),'credencial de visitante não reutilizada');
 assert(a.events.includes('connect:ABC123:server-seat'),'visitante não retomou a mesma cadeira');
 vm.runInContext('clearResume()',a.sandbox);
 assert.equal(guestStore.size,0,'sair explicitamente deve limpar retomada');
 console.log('ONLINE_RESUME_OK: conta, Forasteiro, troca de identidade, encerramento, isolamento e sintaxe');
})().catch(err=>{console.error(err);process.exitCode=1});
