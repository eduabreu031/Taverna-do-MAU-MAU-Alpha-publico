import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';

const palettes=['classic','neon-blue','neon-green','neon-pink','neon-tavern-dark','neon-aero','neon-imperial','neon-amber','neon-forge','neon-abyss','neon-forest','neon-porcelain'];
await mkdir('qa/screenshots-offline-premium',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 for(const width of [320,390,768]){
  const page=await browser.newPage({viewport:{width,height:850},isMobile:width<=390,hasTouch:width<=390});
  const nativeDialogs=[];
  page.on('dialog',d=>{nativeDialogs.push(d.type());d.dismiss()});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForSelector('#tavNativeSheet',{state:'attached'});
  await page.evaluate(()=>{
   window.TavernaEntrance?.skipVisualOnly?.();
   const news=document.getElementById('alphaInformationOverlay');
   if(news)news.hidden=true;
  });
  await page.waitForSelector('#chooseOffline',{state:'visible'});
  for(const theme of palettes){
   await page.evaluate(name=>{if(name==='classic')document.documentElement.removeAttribute('data-tav-palette');
    else document.documentElement.setAttribute('data-tav-palette',name)},theme);
   const welcome=await page.evaluate(()=>{
    const r=document.querySelector('#sceneWelcome .welcome-panel')?.getBoundingClientRect();
    const buttons=[...document.querySelectorAll('#chooseOffline,#chooseMultiplayer,#chooseRules')].map(el=>el.getBoundingClientRect());
    return {r:r&&[r.left,r.right],buttons:buttons.map(v=>[v.left,v.right,v.height]),
      scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth};
   });
   assert(welcome.r,'O saguão perdeu o painel central');
   assert(welcome.scroll<=width+3,'Saguão com rolagem horizontal: '+width+' '+theme+' '+JSON.stringify(welcome));
   assert(welcome.r[0]>=-2&&welcome.r[1]<=width+2,'Painel do saguão fora da tela: '+width+' '+theme);
   for(const b of welcome.buttons)assert(b[0]>=-2&&b[1]<=width+2&&b[2]>=42,'Ação do saguão fora da tela: '+width+' '+theme);
   if(width===390)await page.screenshot({path:'qa/screenshots-offline-premium/saguao-'+theme+'.png'});
   console.log('WELCOME_PREMIUM_PALETTE_OK',width,theme);
  }
  // O aviso de novidades automático não deve interceptar o toque da auditoria.
  await page.evaluate(()=>{const news=document.getElementById('alphaInformationOverlay');if(news)news.hidden=true});
  await page.locator('#chooseOffline').click();
  assert(await page.locator('#sceneMenu').isVisible(),'O offline deixou de abrir');
  assert(await page.locator('#playerCountChoice').isVisible(),'Escolha de jogadores ausente');
  assert(await page.locator('#difficultyChoice').isVisible(),'Escolha de dificuldade ausente');
  for(const theme of palettes){
   await page.evaluate(name=>{if(name==='classic')document.documentElement.removeAttribute('data-tav-palette');
    else document.documentElement.setAttribute('data-tav-palette',name)},theme);
   const offline=await page.evaluate(()=>{
    const count=document.getElementById('playerCount');
    const difficulty=document.getElementById('difficulty');
    const controls=[count,difficulty];
    const visible=controls.map(e=>getComputedStyle(e).display);
    const choices=['playerCountChoice','difficultyChoice'].map(id=>{
     const e=document.getElementById(id);
     const box=e.getBoundingClientRect();return {left:box.left,right:box.right,height:box.height,visible:!!e.offsetParent};
    });
    const book=document.querySelector('#sceneMenu .book-page')?.getBoundingClientRect();
    const hero=document.getElementById('heroChoiceCards')?.getBoundingClientRect();
    return {display:visible,choices,book:book&&[book.left,book.right],hero:hero&&[hero.left,hero.right],
     count:document.querySelectorAll('#playerCount').length,difficulty:document.querySelectorAll('#difficulty').length,
     countChoice:document.querySelectorAll('#playerCountChoice').length,difficultyChoice:document.querySelectorAll('#difficultyChoice').length,
     scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth};
   });
   assert.deepEqual(offline.display,['none','none'],'O navegador Android ainda pode abrir selectors nativos: '+theme+' '+JSON.stringify(offline));
   assert.equal(offline.count,1);assert.equal(offline.difficulty,1);
   assert.equal(offline.countChoice,1);assert.equal(offline.difficultyChoice,1);
   assert(offline.choices.every(c=>c.visible&&c.height>=35&&c.left>=-2&&c.right<=width+2),
     'Controles duplicados/invisíveis ou fora da tela: '+width+' '+theme+' '+JSON.stringify(offline));
   assert(offline.book&&offline.hero,'Estrutura offline incompleta');
   assert(offline.book[0]>=-2&&offline.book[1]<=width+2,'Painel offline transborda: '+theme+' '+width);
   assert(offline.scroll<=width+3,'Offline com rolagem horizontal '+theme+' '+width+' '+JSON.stringify(offline));
   if(width===390)await page.screenshot({path:'qa/screenshots-offline-premium/offline-'+theme+'.png'});
   console.log('OFFLINE_PREMIUM_PALETTE_OK',width,theme);
  }
  await page.locator('#difficultyChoice').click();
  assert(await page.locator('#tavNativeSheet').isVisible(),'Dificuldade deve abrir diálogo temático');
  await page.locator('#tavNativeSheet .tav-native-option').last().click();
  assert.equal(await page.locator('#difficulty').inputValue(),'hard','Valor escolhido não foi refletido no motor');
  const selectCount=await page.locator('#playerCount option').count();
  assert(selectCount>=2,'Opções de jogadores originais sumiram');
  await page.locator('#playerCountChoice').click();
  assert(await page.locator('#tavNativeSheet').isVisible(),'Quantidade deve abrir diálogo temático');
  const option=page.locator('#tavNativeSheet .tav-native-option').nth(1);
  const value=await page.locator('#playerCount option').nth(1).getAttribute('value');
  await option.click();
  assert.equal(await page.locator('#playerCount').inputValue(),value,'Quantidade não foi enviada ao select original');
  assert.deepEqual(nativeDialogs,[],'Janela nativa aberta no Android');
  assert(!errors.some(msg=>/tavern-ui-shell|offline-welcome-premium|ReferenceError/.test(msg)),'Erro JS dos menus: '+errors.join(' / '));
  await page.locator('#offlineBackBtn').click();
  assert(await page.locator('#sceneWelcome').isVisible(),'Voltar do offline quebrou navegação');
  console.log('OFFLINE_NATIVE_SELECT_DUPLICATION_FIXED',width);
  await page.close();
 }
}finally{await browser.close()}
