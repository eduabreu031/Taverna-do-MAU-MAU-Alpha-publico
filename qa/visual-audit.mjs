import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
await mkdir('qa/screenshots',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 for(const width of [320,360,390,430,768]){
  const page=await browser.newPage({viewport:{width,height:800},deviceScaleFactor:1,isMobile:width<=430,hasTouch:width<=430});
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForSelector('#chooseMultiplayer',{timeout:15000});
  await page.evaluate(()=>{const news=document.getElementById('alphaInformationOverlay');if(news)news.hidden=true;});
  const root=await page.evaluate(()=>({body:document.body.scrollWidth,screen:document.documentElement.clientWidth}));
  assert(root.body<=root.screen+3,'Rolagem horizontal em '+width+': '+JSON.stringify(root));
  await page.screenshot({path:'qa/screenshots/welcome-'+width+'.png',fullPage:false});
  await page.click('#chooseMultiplayer');
  await page.waitForTimeout(350);
  await page.waitForSelector('#alphaAccountsOverlay:not([hidden])');
  const auth=await page.locator('.alpha-accounts-panel').boundingBox();
  assert(auth&&auth.x>=-1&&auth.x+auth.width<=width+2,'Modal de conta fora da tela '+width);
  await page.screenshot({path:'qa/screenshots/auth-'+width+'.png'});
  await page.click('#alphaAccountCancel');
  await page.evaluate(()=>{const news=document.getElementById('alphaInformationOverlay');if(news)news.hidden=true;});
  await page.evaluate(()=>{
   document.querySelector('#sceneWelcome')?.classList.add('hidden');
   document.querySelector('#sceneMultiplayer')?.classList.remove('hidden');
   const lobby=document.querySelector('#onlineLobby');lobby.classList.remove('hidden');
   document.querySelector('#onlineCode').textContent='TAVERN';
   const bots=document.querySelector('#botsLabDEV');bots.hidden=false;bots.classList.remove('hidden');
   const select=document.querySelector('#onlineBotsDEV');select.disabled=false;
  });
  await page.waitForTimeout(1000);
  assert(await page.locator('.multiplayer-preview').isVisible()===false,'Entrada deve desaparecer no lobby');
  assert(await page.locator('#tavBotsOpen').isVisible(),'Botão temático ausente');
  await page.click('#tavBotsOpen');
  await page.waitForSelector('#tavBotsSheet:not([hidden])');
  await page.locator('.tav-bots-choice[data-count="1"]').click();
  await page.getByRole('button',{name:'Confirmar',exact:true}).click();
  assert.equal(await page.locator('#onlineBotsDEV').inputValue(),'1');
  await page.screenshot({path:'qa/screenshots/lobby-'+width+'.png'});
  const box=await page.locator('#alphaAccountsBar').boundingBox();
  const panel=await page.locator('#sceneMultiplayer .multiplayer-panel').boundingBox();
  assert(box&&panel&&box.x>=panel.x-1&&box.x+box.width<=panel.x+panel.width+1,'Barra de conta fora do painel '+width);
  await page.close();
  console.log('VISUAL_VIEWPORT_OK',width);
 }
}finally{await browser.close();}
