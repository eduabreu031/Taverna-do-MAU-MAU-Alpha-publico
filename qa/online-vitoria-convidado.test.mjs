import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';
const html=readFileSync(new URL('../release-v5/index.html',import.meta.url));
const server=createServer((req,res)=>{res.writeHead(200,{'content-type':'text/html'});res.end(html)});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const browser=await chromium.launch({args:['--no-sandbox']});
const base={type:'state',hostId:'a',players:[{id:'a',name:'Ana',online:true},{id:'b',name:'Beto',online:true}]};
const g={phase:'playing',revision:2,round:1,players:[{id:'a',alive:true,count:2},{id:'b',alive:true,count:1}],hand:[{id:'a1',rank:'9',suit:'♠'},{id:'a2',rank:'2',suit:'♥'}],top:{id:'z',rank:'9',suit:'♦'},turnPlayerId:'a',direction:1,deckCount:30,activeSuit:'♦'};
try{
for(const [id,width] of [['a',390],['b',1280]]){
 const page=await browser.newPage({viewport:{width,height:850}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.__sent=[];window.WebSocket=class{static OPEN=1;constructor(){this.readyState=1;window.__sock=this;queueMicrotask(()=>this.onopen?.())}send(s){window.__sent.push(JSON.parse(s))}close(){this.readyState=3}}});
 await page.goto('http://127.0.0.1:'+server.address().port+'/');
 await page.locator('#playerName').fill(id==='a'?'Ana':'Beto');await page.locator('#chooseMultiplayer').click();await page.locator('#onlineRoomCode').fill('ABC234');await page.locator('#onlineJoin').click();
 await page.evaluate(v=>window.__sock.onmessage({data:JSON.stringify({type:'welcome',id:v,token:'t'})}),id);
 let view={...base,game:{...g,hand:id==='a'?g.hand:[{id:'b1',rank:'Q',suit:'♥'}]}};await page.evaluate(x=>window.__sock.onmessage({data:JSON.stringify(x)}),view);
 view={...view,game:{...view.game,phase:'finished',revision:3,winner:'a'}};
 await page.evaluate(x=>window.__sock.onmessage({data:JSON.stringify(x)}),view);
 assert.equal(await page.locator('#onlineFinishPanel').isVisible(),true,'Fim da partida precisa mostrar opções');
 assert.equal(await page.locator('#onlineRematch').isVisible(),id==='a','Só anfitrião vê revanche');
 if(id==='a'){
  await page.locator('#onlineRematch').click();
  assert.equal((await page.evaluate(()=>window.__sent)).at(-1).type,'start');
  const next={...view,game:{...view.game,phase:'playing',revision:1,winner:null}};
  await page.evaluate(x=>window.__sock.onmessage({data:JSON.stringify(x)}),next);
  assert.equal(await page.locator('#onlineFinishPanel').isVisible(),false,'Nova partida fecha painel');
 }else{
  assert.equal(await page.locator('#onlineFinishExit').isVisible(),false,'Convidado não recebe botões na vitória');
  assert.equal(await page.locator('#onlineFinishTitle').textContent(),'Vitória de Ana!');
  await page.evaluate(x=>window.__sock.onmessage({data:JSON.stringify(x)}),view);
  await page.locator('#onlineFinishPanel').waitFor({state:'hidden',timeout:6500});
  assert.equal(await page.locator('#sceneGame').isVisible(),true,'Convidado permanece na mesa após o aviso');
 }
 assert.deepEqual(errors,[],'Sem erros em '+width);
 await page.close();
}
}finally{await browser.close();await new Promise(ok=>server.close(ok))}
console.log('OK: revanche, reinício e saída no celular e desktop');
