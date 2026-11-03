import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
 await page.evaluate(()=>window.TavernaEntrance?.skipVisualOnly());
 await page.waitForFunction(()=>window.TavernaOfflinePause&&window.TavernaCronicas);
 await page.evaluate(()=>document.getElementById('alphaInformationOverlay')?.remove());
 await page.locator('#chooseOffline').click({timeout:5000});
 await page.evaluate(()=>{const select=document.getElementById('playerCount');select.value='2';select.dispatchEvent(new Event('change',{bubbles:true}));});
 await page.locator('#startGameBtn').click({timeout:5000});
 await page.waitForFunction(()=>window.TavernaOfflinePause?.pause(),null,{timeout:22000});
 const started=await page.evaluate(()=>({
  pause:window.TavernaOfflinePause.isPaused(),
  layer:document.getElementById('tavOfflinePauseLayer').hidden,
  sceneInert:document.getElementById('sceneGame').inert,
  cnt:document.querySelectorAll('#sceneGame .utility-toolbar button').length,
  hand:document.querySelectorAll('#humanHand .playing-card').length
 }));
 assert(started.pause&&!started.layer&&started.sceneInert&&started.hand>0,
  'Pausa real não iniciou: '+JSON.stringify(started));
 await page.waitForTimeout(2500);
 const after=await page.evaluate(()=>({
  pause:window.TavernaOfflinePause.isPaused(),
  layer:document.getElementById('tavOfflinePauseLayer').hidden,
  sceneInert:document.getElementById('sceneGame').inert,
  cnt:document.querySelectorAll('#sceneGame .utility-toolbar button').length,
  hand:document.querySelectorAll('#humanHand .playing-card').length
 }));
 assert(after.pause&&!after.layer&&after.sceneInert&&after.hand===started.hand,
  'Estado alterado durante pausa: '+JSON.stringify({started,after}));
 await page.screenshot({path:'/tmp/tav-offline-paused-390.png'});
 await page.locator('#tavOfflineResumeBtn').click({timeout:3000});
 assert.equal(await page.evaluate(()=>window.TavernaOfflinePause.isPaused()),false,
  'Retomar não reativou a mesa');
 await page.locator('#sceneGame .tav-game-cronicas-trigger').click({timeout:4000});
 const trophies=await page.evaluate(()=>({
  open:window.TavernaCronicas.isOpen(),paused:window.TavernaOfflinePause.isPaused(),
  hudButton:!!document.querySelector('#sceneGame .tav-game-cronicas-trigger')
 }));
 assert(trophies.open&&trophies.paused&&trophies.hudButton,
  'Conquistas não pausaram offline: '+JSON.stringify(trophies));
 await page.locator('#tavCronicasClose').click({timeout:5000});
 assert.equal(await page.evaluate(()=>window.TavernaOfflinePause.isPaused()),false,
  'Fechar conquistas deixou o jogo pausado');
 await page.locator('#tavOfflinePauseBtn').click({timeout:5000});
 assert.equal(await page.evaluate(()=>window.TavernaOfflinePause.isPaused()),true,
  'Botão de pausa do cabeçalho não funcionou');
 const geometry=await page.evaluate(()=>{
  const nav=document.querySelector('#sceneGame .utility-toolbar');
  const buttons=[...nav.querySelectorAll('button')];
  const boxes=buttons.map(b=>b.getBoundingClientRect());
  return {count:buttons.length,minX:Math.min(...boxes.map(b=>b.left)),
   maxX:Math.max(...boxes.map(b=>b.right)),
   yRows:new Set(boxes.map(b=>Math.round(b.top/3))).size,
   toolbarWidth:nav.getBoundingClientRect().width,screen:innerWidth};
 });
 assert(geometry.count>=9,'Não há nove controles no cabeçalho: '+JSON.stringify(geometry));
 assert(geometry.minX>=-2&&geometry.maxX<=geometry.screen+3,
  'Barra da mesa ultrapassou a tela: '+JSON.stringify(geometry));
 assert(geometry.yRows<=2,'HUD repartido demais: '+JSON.stringify(geometry));
 console.log('OFFLINE_PAUSE_BROWSER_OK',JSON.stringify({started,after,trophies,geometry}));
 await page.close();
}finally{await browser.close();}
