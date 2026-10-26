import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
await mkdir('qa/screenshots-premium',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const palettes=['classic','neon-blue','neon-green','neon-pink','neon-tavern-dark','neon-aero','neon-imperial','neon-amber','neon-forge','neon-abyss','neon-forest','neon-porcelain'];
try{
 for(const width of [320,390,768]){
  const page=await browser.newPage({viewport:{width,height:850},isMobile:width<500,hasTouch:width<500});
  const nativeDialogs=[];
  page.on('dialog',d=>{nativeDialogs.push(d.type());d.dismiss()});
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForSelector('#tavNativeSheet',{state:'attached',timeout:20000});
  await page.evaluate(()=>{
   window.TavernaEntrance?.skipVisualOnly?.();
   document.getElementById('sceneWelcome')?.classList.add('hidden');
   document.getElementById('sceneMenu')?.classList.add('hidden');
   document.getElementById('sceneMultiplayer')?.classList.remove('hidden');
   const acc=document.getElementById('alphaAccountsOverlay');if(acc)acc.hidden=true;
  });
  await page.waitForSelector('#sceneMultiplayer.tav-mp-premium');
  for(const palette of palettes){
   await page.evaluate(id=>{if(id==='classic')document.documentElement.removeAttribute('data-tav-palette');else document.documentElement.setAttribute('data-tav-palette',id)},palette);
   const geometry=await page.evaluate(()=>{
    const panel=document.querySelector('#sceneMultiplayer .multiplayer-panel').getBoundingClientRect();
    const create=document.querySelector('#onlineCreate').getBoundingClientRect();
    const join=document.querySelector('#onlineJoin').getBoundingClientRect();
    const code=document.querySelector('#onlineRoomCode').getBoundingClientRect();
    const entrance=document.querySelector('.multiplayer-preview').getBoundingClientRect();
    return {screen:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,
      panel:[panel.left,panel.right],entry:[entrance.left,entrance.right],
      create:[create.left,create.right],join:[join.left,join.right],code:[code.left,code.right],
      thematic:getComputedStyle(document.querySelector('#sceneMultiplayer .multiplayer-panel')).backgroundImage};
   });
   assert(geometry.scroll<=width+4,'Rolagem horizontal '+palette+' '+width+' '+JSON.stringify(geometry));
   for(const [name,rect] of [['painel',geometry.panel],['entrada',geometry.entry],['criar',geometry.create],['entrar',geometry.join],['código',geometry.code]]){
    assert(rect[0]>=-4&&rect[1]<=width+4,'Controle '+name+' fora da tela '+palette+' '+width+' '+JSON.stringify(geometry));
   }
   assert(geometry.code[1]<=geometry.join[0]+2,'Campo de código invade botão '+palette+' '+width);
   if(width===390)await page.screenshot({path:'qa/screenshots-premium/multiplayer-'+palette+'.png',fullPage:false});
   console.log('PREMIUM_PALETTE_LAYOUT_OK',width,palette);
  }
  await page.evaluate(()=>{
   const lobby=document.getElementById('onlineLobby');lobby.classList.remove('hidden');
   document.getElementById('onlineCode').textContent='AB7C9D';
  });
  assert(await page.locator('.multiplayer-preview').isHidden(),'Os cartões de entrada devem sumir no lobby');
  await page.locator('#onlineLeave').click();
  assert(await page.locator('#tavNativeSheet').isVisible(),'Sair da sala não abriu modal interno');
  await page.locator('#tavNativeSheet .tav-native-actions button').first().click();
  assert(await page.locator('#tavNativeSheet').isHidden(),'Cancelamento não fechou o modal');
  assert(await page.locator('#onlineLobby').isVisible(),'Cancelar saída não deve fechar lobby');
  await page.evaluate(()=>{document.getElementById('onlineLobby').classList.add('hidden');
   document.getElementById('sceneMultiplayer').classList.add('hidden');
   document.getElementById('sceneMenu').classList.remove('hidden');});
  const choice=page.locator('#difficultyChoice');
  assert(await choice.count()===1,'Seletor próprio de dificuldade não existe');
  await choice.click();
  assert(await page.locator('#tavNativeSheet').isVisible(),'Seletor abriu fora do jogo');
  const selectButtons=page.locator('#tavNativeSheet .tav-native-option');
  assert(await selectButtons.count()===3,'Opções de dificuldade incompletas');
  await selectButtons.last().click();
  assert.equal(await page.locator('#difficulty').inputValue(),'hard','Escolha não refletiu no motor');
  assert.equal(nativeDialogs.length,0,'Diálogo nativo inesperado '+nativeDialogs.join(','));
  await page.close();
  console.log('PREMIUM_BROWSER_FLOW_OK',width);
 }
}finally{await browser.close()}
