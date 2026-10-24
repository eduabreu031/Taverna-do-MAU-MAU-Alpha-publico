import {chromium} from 'playwright';
import assert from 'node:assert/strict';

const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 for(const width of [390,1024]){
  const page=await browser.newPage({viewport:{width,height:840},deviceScaleFactor:1});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>!!window.TavernaThemeSystem&&!!window.TavernaAppearance,{timeout:20000});
  const data=await page.evaluate(()=>{
   const themes=['classic','neon-blue','neon-green','neon-pink'];
   const selectors=[
    '#sceneWelcome .welcome-panel','#tavCentralOpen',
    '#sceneMultiplayer .multiplayer-panel','#sceneMultiplayer #alphaAccountsBar',
    '#sceneMultiplayer #alphaAccountsLogout',
    '#sceneMenu .book','#sceneMenu .book-page',
    '#sceneGame #tableShell','#sceneGame #tableShell>.felt',
    '#sceneGame .game-header','#sceneGame .control-bar',
    '#tavAppearanceOverlay .tav-appearance-card',
    '#tavSocialMenu','#tavAbandonOverlay .tav-abandon-card'
   ];
   const faces=[...document.querySelectorAll('.card-face')].slice(0,2);
   function get(selector){
    const node=document.querySelector(selector);
    if(!node)return null;
    const computed=getComputedStyle(node);
    return [computed.backgroundImage,computed.backgroundColor,computed.borderTopColor].join('|');
   }
   const samples={};
   for(const id of themes){
    window.TavernaThemeSystem.setPalette(id);
    samples[id]=Object.fromEntries(selectors.map(sel=>[sel,get(sel)]));
   }
   const facesColorBefore=faces.map(node=>getComputedStyle(node).backgroundImage);
   window.TavernaThemeSystem.setPalette('neon-pink');
   const facesColorAfter=faces.map(node=>getComputedStyle(node).backgroundImage);
   const count=document.querySelectorAll('.tav-appearance-trigger').length;
   const options=document.querySelectorAll('.tav-palette-option').length;
   return {samples,facesColorBefore,facesColorAfter,count,options};
  });
  assert.equal(data.options,4,'O menu de aparência precisa listar quatro escolhas');
  assert(data.count>=3,'Faltam atalhos de aparência nas cenas');
  const must=[
   '#sceneWelcome .welcome-panel','#tavCentralOpen',
   '#sceneMultiplayer .multiplayer-panel','#sceneMultiplayer #alphaAccountsBar',
   '#sceneMenu .book','#sceneMenu .book-page',
   '#sceneGame #tableShell','#sceneGame #tableShell>.felt',
   '#sceneGame .game-header','#sceneGame .control-bar',
   '#tavAppearanceOverlay .tav-appearance-card'
  ];
  for(const selector of must){
   const classic=data.samples.classic[selector];
   assert(classic!==null,'Falta componente real: '+selector);
   for(const variant of ['neon-blue','neon-green','neon-pink']){
    assert.notEqual(data.samples[variant][selector],classic,'Tema '+variant+' não alterou '+selector);
   }
  }
  for(const selector of must.slice(0,9)){
   assert.notEqual(data.samples['neon-blue'][selector],data.samples['neon-green'][selector],'Verde igual ao azul em '+selector);
   assert.notEqual(data.samples['neon-pink'][selector],data.samples['neon-green'][selector],'Rosa igual ao verde em '+selector);
  }
  assert.deepEqual(data.facesColorBefore,data.facesColorAfter,'As cartas não devem mudar visualmente');
  const pref=await page.evaluate(()=>localStorage.getItem('taverna:appearance:palette:v1'));
  assert.equal(pref,'neon-pink');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!window.TavernaThemeSystem);
  assert.equal(await page.evaluate(()=>window.TavernaThemeSystem.getPalette().id),'neon-pink','Paleta não persistiu');
  const selected=await page.locator('.tav-palette-option.selected').getAttribute('data-palette');
  assert.equal(selected,'neon-pink');
  await page.evaluate(()=>window.TavernaAppearance.open());
  assert.equal(await page.locator('#tavAppearanceOverlay').isVisible(),true);
  await page.locator('.tav-palette-option[data-palette="neon-green"]').click();
  assert.equal(await page.evaluate(()=>window.TavernaThemeSystem.getPalette().id),'neon-green');
  await page.locator('.tav-appearance-finish').click();
  assert.equal(await page.locator('#tavAppearanceOverlay').isHidden(),true);
  await page.evaluate(()=>window.TavernaThemeSystem.setPalette('classic'));
  assert.equal(await page.evaluate(()=>document.documentElement.hasAttribute('data-tav-palette')),false);
  // Estilos não devem afetar entradas ou a mesa; nenhuma exceção JS do gerenciador.
  assert(errors.filter(x=>/theme|appearance|palette/i.test(x)).length===0,'Erro de runtime: '+errors.join('; '));
  const hierarchy=await page.evaluate(()=>{
   const hand=document.getElementById('humanHand');
   const parents=[];
   for(let node=hand,i=0;node&&i<7;node=node.parentElement,i++){
    const s=getComputedStyle(node);
    parents.push({tag:node.tagName,id:node.id,cls:node.className?.toString().slice(0,140),
     bg:s.backgroundImage.slice(0,100),color:s.backgroundColor});
   }
   const related=[...document.querySelectorAll('#sceneGame [class]')].filter(n=>/human|hand|action|control|seat|bot/i.test(n.className.toString())).slice(0,110)
    .map(n=>({tag:n.tagName,id:n.id,cls:n.className.toString().slice(0,110)}));
   return {parents,related};
  });
  if(width===390)console.log('THEME_HAND_AUDIT',JSON.stringify(hierarchy));
  console.log('THEME_BROWSER_OK',width,must.length,'áreas; 4 paletas; preferências; menu interativo');
  await page.evaluate(()=>window.TavernaThemeSystem.setPalette('neon-green'));
  await page.screenshot({path:'/tmp/tav-theme-neon-'+width+'.png'});
  await page.close();
 }
}finally{await browser.close();}