import {chromium} from 'playwright';
import assert from 'node:assert/strict';
// Sem porta: identifica o jogador diretamente, em modo offline e autenticado.
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 for(const width of [320,390,1024,1440]){
  const context=await browser.newContext({viewport:{width,height:844},isMobile:width<=390,hasTouch:width<=390});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
  await page.waitForSelector('#tavEntranceIdentity');
  assert(await page.locator('#tavEntranceIdentity').isVisible(),'Identificação não apareceu diretamente');
  assert(await page.locator('#tavEntranceGuest').isVisible(),'Botão Forasteiro ausente');
  assert(await page.locator('#tavEntranceAccount').isVisible(),'Botão de conta ausente');
  assert.equal(await page.locator('#tavEntranceDoor').count(),0,'Porta antiga ainda está na página');
  assert.equal(await page.locator('.tav-gate-art').count(),0,'Cenário antigo ainda está na página');
  assert.equal(await page.locator('#tavEntranceBack').count(),0,'Botão de voltar à porta ainda está na página');
  const hasPhoto=await page.locator('#tavEntrance').evaluate(node=>
   getComputedStyle(node).backgroundImage.includes('tavern-door-v2.svg'));
  assert(!hasPhoto,'Imagem da porta ainda é carregada');
  await page.screenshot({path:'/tmp/tav-entrance-identity-'+width+'.png'});
  await context.setOffline(true);
  await page.locator('#tavEntranceGuest').click();
  await page.waitForFunction(()=>!document.getElementById('tavEntrance'),{timeout:5000});
  assert.equal(await page.locator('#playerName').inputValue(),'Forasteiro');
  for(const id of ['chooseOffline','chooseMultiplayer','chooseRules']){
   assert(await page.locator('#'+id).isVisible(),'Botão '+id+' desapareceu para Forasteiro');
  }
  assert.deepEqual(await page.locator('#sceneWelcome .tav-welcome-mode-compact')
   .evaluateAll(nodes=>nodes.map(node=>node.id)),
   ['chooseOffline','chooseMultiplayer','chooseRules'],'Ordem do menu incorreta');
  await page.evaluate(()=>document.getElementById('alphaInformationOverlay')?.remove());
  await page.locator('#chooseOffline').click();
  assert(await page.locator('#sceneMenu').isVisible(),'Jogo offline inacessível');
  await page.locator('#offlineBackBtn').click();
  assert(await page.locator('#sceneWelcome').isVisible(),'Retorno ao menu falhou');
  assert.equal(await page.locator('#tavEntrance').count(),0,'Identificação retornou indevidamente');
  assert.equal(errors.length,0,'Erro JS no visitante: '+errors.join('; '));
  await context.close();
  console.log('TAVERN_ENTRANCE_GUEST_OK',width);
 }
 const page=await browser.newPage({viewport:{width:390,height:844}});
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
 await page.waitForSelector('#tavEntranceIdentity');
 await page.evaluate(()=>{
  window.TavernaAuth.getUser=()=>({role:'user',username:'JogadorQA'});
  window.TavernaAuth.restoreSilently=async()=>({role:'user',username:'JogadorQA'});
  window.TavernaAuth.syncAdventureName=()=>{};
  window.TavernaEntrance.refreshLabels();
 });
 assert(await page.locator('#tavEntranceIdentity').isVisible(),'Identificação autenticada ausente');
 assert.equal(await page.locator('#tavEntrancePrimary').innerText(),'Continuar como JogadorQA');
 assert.equal(await page.locator('#tavEntranceAccount').innerText(),'Trocar conta');
 await page.locator('#tavEntrancePrimary').click();
 await page.waitForFunction(()=>!document.getElementById('tavEntrance'),{timeout:5000});
 await page.waitForFunction(()=>document.getElementById('sceneWelcome').classList.contains('tav-welcome-account'));
 for(const id of ['chooseOffline','chooseMultiplayer','chooseRules']){
  assert(await page.locator('#'+id).isVisible(),'Conta: botão '+id+' desapareceu');
 }
 assert(await page.locator('#playerName').evaluate(node=>getComputedStyle(node).display==='none'),
  'Campo de nome deve ficar oculto para conta');
 assert.equal(errors.length,0,'Erro JS com conta: '+errors.join('; '));
 console.log('TAVERN_ENTRANCE_ACCOUNT_OK');
 await page.close();
}finally{await browser.close();}
