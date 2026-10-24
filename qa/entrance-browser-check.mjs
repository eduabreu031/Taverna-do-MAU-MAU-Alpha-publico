import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 for(const width of [320,390,1024,1440]){
  const context=await browser.newContext({viewport:{width,height:844},isMobile:width<=390,hasTouch:width<=390});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
  await page.waitForSelector('#tavEntranceDoor');
  assert(await page.locator('#tavEntrance').isVisible(),'Fachada não abriu');
  assert(await page.locator('#tavEntranceIdentity').isHidden(),'Identificação abriu antes do toque');
  const facade=await page.evaluate(async()=>{
   const urls=['./art/tavern-door-v2.svg'];
   const ok=await Promise.all(urls.map(async path=>{const r=await fetch(path);return r.ok&&(path.endsWith('.webp')?(await r.blob()).size>30000:(await r.text()).startsWith('<svg '));}));
   const art=getComputedStyle(document.querySelector('.tav-gate-art'));
   const box=document.querySelector('#tavEntranceDoor').getBoundingClientRect();
   return {ok,art:art.backgroundImage,door:[box.x,box.y,box.width,box.height],viewport:innerWidth};
  });
  assert(facade.ok.every(Boolean),'Recursos locais 2.5D não carregaram');
  assert(!facade.art.includes('tavern-facade'),'O fundo não deve carregar uma fachada ilustrada');
  assert(await page.locator('#tavEntranceDoor').evaluate(x=>getComputedStyle(x).backgroundImage.includes('tavern-door-v2.svg')),'Porta detalhada não está aplicada');
  assert(facade.door[2]>=width*(width<=390?.86:.25)&&facade.door[3]>=650,'Porta não ocupa a tela como previsto');
  assert(facade.door[0]>=0&&facade.door[0]+facade.door[2]<=width+1,'Porta fora da tela: '+width);

  await page.screenshot({path:'/tmp/tav-entrance-facade-'+width+'.png'});
  await page.locator('#tavEntranceDoor').click();
  assert.equal(await page.locator('#tavEntrance').evaluate(x=>x.classList.contains('tav-gate-opened')),true);
  assert.notEqual(await page.locator('#tavEntranceDoor').evaluate(x=>getComputedStyle(x).transform),'none','Porta não recebeu perspectiva');
  await page.waitForSelector('#tavEntranceIdentity:not([hidden])');
  assert(await page.locator('#tavEntranceGuest').isVisible());
  assert(await page.locator('#tavEntranceAccount').isVisible());
  await page.screenshot({path:'/tmp/tav-entrance-identity-'+width+'.png'});
  await context.setOffline(true);
  await page.locator('#tavEntranceGuest').click();
  await page.waitForFunction(()=>!document.getElementById('tavEntrance'),{timeout:5000});
  assert.equal(await page.locator('#playerName').inputValue(),'Forasteiro');
  assert(await page.locator('#chooseOffline').isVisible(),'Botão offline desapareceu após entrada');
  assert(await page.locator('#chooseMultiplayer').isVisible(),'Botão multiplayer desapareceu após entrada');
  assert(await page.locator('#chooseRules').isVisible(),'Regras desapareceram após entrada');
  assert(await page.locator('#sceneWelcome').innerText(),'Menu principal ficou vazio');
  assert.equal(await page.locator('#sceneWelcome .tav-welcome-name-disabled').count(),0,'O visitante deve poder editar seu nome');
  assert.deepEqual(await page.locator('#sceneWelcome .tav-welcome-mode-compact').evaluateAll(nodes=>nodes.map(n=>n.id)),['chooseOffline','chooseMultiplayer','chooseRules'],'Ordem de modos incorreta');
  assert(await page.locator('#sceneWelcome .tav-welcome-modes-column').isVisible(),'Modos não estão organizados em coluna');
  await page.evaluate(()=>{const news=document.getElementById('alphaInformationOverlay');news?.remove();});
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
 await page.waitForFunction(()=>document.getElementById('sceneWelcome').classList.contains('tav-welcome-account'));
 assert.equal(await page.locator('#chooseOffline').count(),1,'Botões foram destruídos após identificação');
 assert.equal(await page.locator('#chooseMultiplayer').count(),1,'Multiplayer desapareceu');
 assert.equal(await page.locator('#chooseRules').count(),1,'Regras desapareceram');
 assert.equal(await page.locator('#sceneWelcome .tav-welcome-name-disabled').count(),1,'O campo de nome deveria desaparecer para usuário autenticado');
 assert((await page.locator('#sceneWelcome').innerText()).includes('Seja bem-vindo, JogadorQA!'),'Saudação personalizada não encontrada');
 await page.waitForFunction(()=>!document.getElementById('tavEntrance'));
 console.log('TAVERN_ENTRANCE_ACCOUNT_OK');
 await page.close();
}finally{await browser.close();}
