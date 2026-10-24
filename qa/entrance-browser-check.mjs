import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 for(const width of [390,1024]){
  const context=await browser.newContext({viewport:{width,height:844},isMobile:width===390,hasTouch:width===390});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
  await page.waitForSelector('#tavEntranceDoor');
  assert(await page.locator('#tavEntrance').isVisible(),'Fachada não abriu');
  assert(await page.locator('#tavEntranceIdentity').isHidden(),'Identificação abriu antes do toque');
  await page.screenshot({path:'/tmp/tav-entrance-facade-'+width+'.png'});
  await page.locator('#tavEntranceDoor').click();
  assert.equal(await page.locator('#tavEntrance').evaluate(x=>x.classList.contains('tav-gate-opened')),true);
  await page.waitForSelector('#tavEntranceIdentity:not([hidden])');
  assert(await page.locator('#tavEntranceGuest').isVisible());
  assert(await page.locator('#tavEntranceAccount').isVisible());
  await page.screenshot({path:'/tmp/tav-entrance-identity-'+width+'.png'});
  await context.setOffline(true);
  await page.locator('#tavEntranceGuest').click();
  await page.waitForFunction(()=>!document.getElementById('tavEntrance'),{timeout:5000});
  assert.equal(await page.locator('#playerName').inputValue(),'Forasteiro');
  await page.evaluate(()=>{const news=document.getElementById('alphaInformationOverlay');if(news)news.hidden=true;});
  await page.locator('#chooseOffline').click();
  assert(await page.locator('#sceneMenu').isVisible(),'Modo offline bloqueado pela fachada');
  await page.locator('#offlineBackBtn').click();
  assert(await page.locator('#sceneWelcome').isVisible(),'Retorno não exibiu interior');
  assert.equal(await page.locator('#tavEntrance').count(),0,'Porta apareceu ao voltar ao menu');
  assert(errors.length===0,'Erros JS no fluxo visitante: '+errors.join('; '));
  await context.close();
  console.log('TAVERN_ENTRANCE_GUEST_OK',width);
 }
 const page=await browser.newPage({viewport:{width:390,height:844}});
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
 await page.evaluate(()=>{
  window.TavernaAuth.getUser=()=>({role:'user',username:'JogadorQA'});
  window.TavernaAuth.restoreSilently=async()=>({role:'user',username:'JogadorQA'});
  window.TavernaAuth.syncAdventureName=()=>{};
 });
 await page.locator('#tavEntranceDoor').click();
 await page.waitForSelector('#tavEntranceIdentity:not([hidden])');
 assert.equal(await page.locator('#tavEntrancePrimary').innerText(),'Continuar como JogadorQA');
 assert.equal(await page.locator('#tavEntranceAccount').innerText(),'Trocar conta');
 await page.locator('#tavEntrancePrimary').click();
 await page.waitForFunction(()=>!document.getElementById('tavEntrance'));
 console.log('TAVERN_ENTRANCE_ACCOUNT_OK');
 await page.close();
}finally{await browser.close();}
