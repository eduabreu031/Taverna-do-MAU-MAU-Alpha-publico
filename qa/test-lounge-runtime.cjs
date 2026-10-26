/* Executa JS do painel em DOM simulado; não apenas valida strings. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'lounge-ui.js'),'utf8');
class Node {
 constructor(tag='div'){
  this.tagName=tag;this.children=[];this.parentElement=null;this.className='';
  this.textContent='';this.value='';this.hidden=false;this.disabled=false;this.listeners={};
  this.classList={contains:name=>this.className.split(/\s+/).includes(name)};
 }
 append(...nodes){for(const node of nodes){if(node.parentElement)node.parentElement.children=node.parentElement.children.filter(n=>n!==node);node.parentElement=this;this.children.push(node)}}
 prepend(...nodes){for(const node of nodes.reverse()){if(node.parentElement)node.parentElement.children=node.parentElement.children.filter(n=>n!==node);node.parentElement=this;this.children.unshift(node)}}
 after(node){assert(this.parentElement);const p=this.parentElement;if(node.parentElement)node.parentElement.children=node.parentElement.children.filter(n=>n!==node);node.parentElement=p;p.children.splice(p.children.indexOf(this)+1,0,node)}
 replaceChildren(...nodes){for(const node of this.children)node.parentElement=null;this.children=[];this.append(...nodes)}
 addEventListener(event,cb){this.listeners[event]=cb}
 setAttribute(name,value){this[name]=value}
 scrollIntoView(){}
 get firstChild(){return this.children[0]||null}
 querySelector(selector){return selector==='.multiplayer-panel'?this.children.find(n=>n.className==='multiplayer-panel')||null:null}
}
const accounts=[
 {id:'11111111-1111-4111-8111-111111111111',username:'Corvo',role:'user'},
 {id:'22222222-2222-4222-8222-222222222222',username:'Dama',role:'user'},
 {id:'44444444-4444-4444-8444-444444444444',username:'Admin',role:'admin'}
];
async function session(user){
 const portal=new Node(),lobby=new Node(),area=new Node(),bar=new Node(),body=new Node();
 portal.className='';lobby.className='hidden';area.className='multiplayer-panel';
 area.append(bar);portal.append(area);
 const elements=new Map([['sceneMultiplayer',portal],['onlineLobby',lobby],['alphaAccountsBar',bar]]);
 const requested=[];
 const TavernaAuth={
  getUser:()=>user,getToken:()=>('token-'+user.id),
  restoreSilently:async()=>user
 };
 const win={TavernaAuth,TavernaPresence:{tick:async()=>true}};
 const document={body,hidden:false,getElementById:id=>elements.get(id)||null,
  createElement:tag=>new Node(tag),addEventListener:()=>{}};
 const context={document,window:win,console,setInterval:()=>0,setTimeout:()=>0,clearTimeout:()=>{},
  fetch:async(url,options={})=>{
   assert(String(options.headers.authorization||'').includes(user.id),'Login diferente da conta ativa');
   const endpoint=new URL(url).pathname.split('/').pop();
   requested.push(endpoint);
   if(endpoint==='ready')return {ok:true,json:async()=>({ok:true,available:true})};
   if(endpoint==='players'){
    const q=new URL(url).searchParams.get('q')||'';
    return {ok:true,json:async()=>({players:accounts.filter(a=>a.id!==user.id&&(!q||a.username.toLowerCase().includes(q.toLowerCase())))
     .map(a=>({id:a.id,username:a.username,status:'disponivel',inviteable:true}))})};
   }
   throw new Error('Chamada inesperada '+endpoint);
  }
 };
 new vm.Script(source,{filename:'lounge-ui.js'}).runInNewContext(context,{timeout:1000});
 assert(win.TavernaLounge?.refresh,'Painel não inicializou');
 await win.TavernaLounge.refresh();
 assert.deepEqual(requested.slice(0,2),['ready','players'],'Painel não confirmou presença antes da lista');
 const panel=area.children.find(n=>n.id==='tavLounge');
 assert(panel,'Painel não montado no menu multiplayer');
 const list=panel.children.find(n=>n.className==='tav-lounge-list');
 assert(list,'Lista não montada');
 const names=()=>list.children.map(row=>row.children[0]?.children[0]?.textContent).filter(Boolean);
 assert.equal(names().length,2,'Lista de conectados deve aparecer sem busca');
 assert(!names().includes(user.username),'Não mostrar própria conta');
 const field=panel.children.find(n=>n.className==='tav-lounge-search-row').children[0];
 field.value='Adm';
 await win.TavernaLounge.refresh();
 assert.deepEqual(names(),['Admin'].filter(n=>n!==user.username),'Pesquisa por administrador não renderizou');
 return {user:user.username,available:2,search:names().length,requests:requested.length};
}
(async()=>{
 const a=await session(accounts[0]),b=await session(accounts[1]);
 console.log('LOUNGE_BROWSER_RUNTIME_OK: duas contas renderizam lista + pesquisa e presença,',a.user,b.user);
})().catch(e=>{console.error(e);process.exitCode=1});
