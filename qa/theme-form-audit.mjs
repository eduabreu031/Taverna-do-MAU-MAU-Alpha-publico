import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 for(const width of [390,1024]){
  const page=await browser.newPage({viewport:{width,height:844}});
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>window.TavernaEntrance?.skipVisualOnly());
  await page.waitForFunction(()=>window.TavernaThemeSystem);
  const values=await page.evaluate(()=>{
   const selectors=[
    '#sceneMultiplayer #alphaAccountsBar',
    '#sceneMultiplayer #alphaAccountsLogout',
    '#sceneMultiplayer #alphaAccountsStatus',
    '#alphaAccountsOverlay .alpha-accounts-panel',
    '#alphaAccountsOverlay input',
    '#alphaAccountsOverlay #alphaAccountCancel',
    '#alphaAccountsOverlay #alphaAccountGuest',
    '#alphaFeedbackForm textarea',
    '#sceneWelcome #playerName',
    '#sceneMenu select',
    '#sceneMultiplayer input'
   ];
   const output={};
   for(const theme of ['classic','neon-blue','neon-green','neon-pink']){
    window.TavernaThemeSystem.setPalette(theme);
    output[theme]={};
    for(const selector of selectors){
      const n=document.querySelector(selector);
      if(!n)continue;
      const s=getComputedStyle(n);
      output[theme][selector]={background:s.backgroundImage+'|'+s.backgroundColor,
       border:s.borderTopColor,text:s.color,caret:s.caretColor,
       rawStyle:n.getAttribute('style')||''};
    }
   }
   return {output,selectors};
  });
  const required=[
   '#sceneMultiplayer #alphaAccountsBar',
   '#sceneMultiplayer #alphaAccountsLogout',
   '#alphaAccountsOverlay .alpha-accounts-panel',
   '#alphaAccountsOverlay input'
  ];
  for(const selector of required)
   assert(values.output.classic[selector],'Campo essencial não existe: '+selector);
  const found=Object.keys(values.output.classic);
  assert(found.length>=6,'Insuficientes superfícies reais de formulários para auditoria');
  for(const theme of ['neon-blue','neon-green','neon-pink']){
   for(const selector of found.filter(x=>!x.includes('Status'))){
    const a=values.output.classic[selector],b=values.output[theme][selector];
    assert.notEqual(b.background,a.background,'Fundo não responde à paleta '+theme+': '+selector);
   }
  }
  for(const selector of ['#sceneMultiplayer #alphaAccountsLogout','#alphaAccountsOverlay input']){
   assert.notEqual(values.output['neon-blue'][selector].background,values.output['neon-green'][selector].background,
    'Azul e verde idênticos em '+selector);
   assert.notEqual(values.output['neon-green'][selector].background,values.output['neon-pink'][selector].background,
    'Verde e rosa idênticos em '+selector);
  }
  console.log('THEME_FORM_AUDIT_OK',width,JSON.stringify({found,themed:values.output['neon-green']}));
  await page.close();
 }
}finally{await browser.close();}
