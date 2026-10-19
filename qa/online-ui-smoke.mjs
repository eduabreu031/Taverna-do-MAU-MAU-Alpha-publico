import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';
const html=readFileSync(new URL('../preview/index.html',import.meta.url));
const server=createServer((req,res)=>{res.writeHead(200,{'content-type':'text/html; charset=utf-8'});res.end(html);});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const port=server.address().port;
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
let errors=0;
const game=(selfId='a')=>({type:'state',hostId:'a',players:[{id:'a',name:'Ana',online:true},{id:'b',name:'Beto',online:true}],
 serverNow:Date.now(),turnDeadline:Date.now()+15000,game:{phase:'playing',revision:2,round:1,players:[{id:'a',alive:true,count:2},{id:'b',alive:true,count:5}],
 hand:selfId==='a'?[{id:'a1',rank:'9',suit:'♠'},{id:'a2',rank:'2',suit:'♥'}]:[{id:'b1',rank:'9',suit:'♥'},{id:'b2',rank:'A',suit:'♣'}],
 top:{id:'z',rank:'9',suit:'♦'},turnPlayerId:'a',direction:1,deckCount:34,activeSuit:'♦',drawn:false,pendingSeven:0},events:[]});
try{
for(const width of [1280,390]){
 const page=await browser.newPage({viewport:{width,height:850}});
 page.on('pageerror',e=>{errors++;console.error('ERROR',e.message);});
 await page.addInitScript(()=>{
  window.__sent=[];
  window.WebSocket=class MockWebSocket{
   static OPEN=1;
   constructor(url){this.url=url;this.readyState=1;window.__sock=this;queueMicrotask(()=>this.onopen?.());}
   send(s){window.__sent.push(JSON.parse(s));}
   close(){this.readyState=3;}
  };
 });
 await page.goto('http://127.0.0.1:'+port+'/',{waitUntil:'load'});
 await page.locator('#playerName').fill('Ana');
 await page.locator('#chooseMultiplayer').click();
 assert.equal(await page.locator('#sceneMultiplayer').isVisible(),true);
 await page.locator('#onlineRoomCode').fill('ABC234');
 await page.locator('#onlineJoin').click();
 await page.evaluate(()=>window.__sock.onmessage({data:JSON.stringify({type:'welcome',id:'a',token:'tok'})}));
 await page.evaluate(g=>window.__sock.onmessage({data:JSON.stringify(g)}),game());
 assert.equal(await page.locator('#sceneGame').isVisible(),true,'Mesa original deve abrir');
 assert.equal(await page.locator('#humanHand [data-card]').count(),2,'Cartas verdadeiras da mão');
 assert.equal(await page.locator('#seats .seat').count(),1,'Um oponente no duelo');
 await page.locator('#humanHand [data-card="a1"]').click({force:true});
 const messages=await page.evaluate(()=>window.__sent);
 assert.equal(messages.length,1,'Um clique deve gerar uma única ação de rede');
 assert.deepEqual(messages[0],{type:'action',action:'play',revision:2,cardId:'a1'});
 await page.locator('#returnMenu').click({force:true});
 assert.equal(await page.locator('#sceneWelcome').isVisible(),true,'Volta à seleção inicial');
 assert.equal(await page.evaluate(()=>window.__tavOnlineTest.isOnline()),false,'Online deve desligar');
 await page.locator('#chooseOffline').click();
 assert.equal(await page.locator('#sceneMenu').isVisible(),true,'Modo offline deve continuar disponível');
 await page.close();
 console.log('OK interface e separação online/offline:',width);
}
assert.equal(errors,0,'Nenhum erro de execução no navegador');
}finally{await browser.close();await new Promise(ok=>server.close(ok));}