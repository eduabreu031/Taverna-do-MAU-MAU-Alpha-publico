import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
await mkdir('qa/screenshots',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
async function open(width){
 const page=await browser.newPage({viewport:{width,height:820},isMobile:width<=430,hasTouch:width<=430});
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
 await page.waitForTimeout(500);
 await page.evaluate(()=>{const modal=document.getElementById('alphaInformationOverlay');if(modal)modal.hidden=true;});
 return page;
}
async function geometry(page){
 return page.evaluate(()=>{
  const box=sel=>{const e=document.querySelector(sel);if(!e)return null;const b=e.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height};};
  return {viewport:innerWidth,table:box('#sceneGame .table-shell'),felt:box('#sceneGame .felt'),hand:box('#humanHand'),draw:box('#drawPile'),discard:box('#discardPile'),center:box('#centerZone'),humanZone:box('#humanZone'),viewportBox:box('#sceneGame .table-viewport'),scroll:document.documentElement.scrollWidth};
 });
}
try{
 for(const width of [320,360,390,430]){
  const offline=await open(width);
  await offline.evaluate(()=>{
   document.querySelector('#sceneWelcome')?.classList.add('hidden');
   document.querySelector('#sceneMultiplayer')?.classList.add('hidden');
   document.querySelector('#sceneMenu')?.classList.remove('hidden');
   const count=document.getElementById('playerCount');count.value='2';count.dispatchEvent(new Event('change',{bubbles:true}));
  });
  await offline.waitForSelector('#sceneMenu:not(.hidden) #startGameBtn');
  await offline.click('#startGameBtn');
  await offline.waitForSelector('#sceneGame:not(.hidden)');
  const ref=await geometry(offline);
  assert(ref.table?.width>150,'Mesa offline ausente '+width);
  await offline.screenshot({path:'qa/screenshots/mesa-offline-'+width+'.png',fullPage:false});
  await offline.locator('#sceneGame .table-shell').screenshot({path:'qa/screenshots/mesa-offline-recorte-'+width+'.png'});
  await offline.close();
  const online=await open(width);
  const result=await online.evaluate(()=>{
   const hand=[
    {id:'hand-1',rank:'2',suit:'♥'},{id:'hand-2',rank:'5',suit:'♣'},
    {id:'hand-3',rank:'9',suit:'♠'},{id:'hand-4',rank:'A',suit:'♦'},
    {id:'hand-5',rank:'7',suit:'♣'}];
   const g={players:[{id:'human',alive:true,count:5},{id:'bot',alive:true,count:5}],hand,top:{id:'top-1',rank:'9',suit:'♦'},
    phase:'playing',round:1,revision:1,turnPlayerId:'human',direction:1,activeSuit:'♦',deckCount:50,mauAnnouncements:{},scoring:null,pendingSeven:0,drawn:false};
   return window.__tavOriginalOnline.apply(g,[{id:'human',name:'Jogador'},{id:'bot',name:'Bot'}],'human',{serverNow:Date.now(),deadline:Date.now()+15000});
  });
  assert.equal(result,true,'Adaptador online não conseguiu renderizar mesa');
  await online.waitForSelector('#sceneGame:not(.hidden)');
  await online.waitForTimeout(3500); // termina a distribuição animada antes de comparar a mesa estável
  const rendered=await geometry(online);
  assert(rendered.table&&rendered.table.width>150,'Mesa online ausente '+width);
  assert(Math.abs(rendered.table.width-ref.table.width)<3,'Escala da mesa difere offline/online '+width+': '+ref.table.width+' vs '+rendered.table.width);
  assert(Math.abs(rendered.felt.width-ref.felt.width)<3,'Tecido da mesa difere offline/online '+width);
  assert(rendered.scroll<=width+4,'Rolagem horizontal na mesa online '+width);
  console.log('MESA_GEOMETRIA',width,JSON.stringify({offline:ref,online:rendered}));
  await online.screenshot({path:'qa/screenshots/mesa-online-'+width+'.png',fullPage:false});
  await online.locator('#sceneGame .table-shell').screenshot({path:'qa/screenshots/mesa-online-recorte-'+width+'.png'});
  console.log('PARIDADE_MESA_OFFLINE_ONLINE',width,'largura=',Math.round(rendered.table.width));
  await online.close();
 }
}finally{await browser.close();}
