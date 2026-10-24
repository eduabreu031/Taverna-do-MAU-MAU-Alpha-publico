import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 for(const width of [390,1024]){
  const page=await browser.newPage({viewport:{width,height:840},deviceScaleFactor:1});
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>!!window.TavernaThemeSystem,{timeout:20000});
  // Force both states without changing the real time-based scheduling.
  const data=await page.evaluate(()=>{
   const selectors=[
    '#sceneWelcome .welcome-panel',
    '#sceneMultiplayer .multiplayer-panel',
    '#sceneMenu .book',
    '#sceneMenu .book-page',
    '#sceneGame #tableShell',
    '#sceneGame #tableShell>.felt',
    '#sceneGame .game-header'
   ];
   function snapshot(){
    return selectors.map(selector=>{
     const el=document.querySelector(selector);
     if(!el)return {selector,missing:true};
     const style=getComputedStyle(el);
     return {selector,background:style.backgroundImage,backgroundColor:style.backgroundColor,
      borderColor:style.borderTopColor,boxShadow:style.boxShadow};
    });
   }
   const root=document.documentElement;
   root.removeAttribute('data-tav-theme');
   const classic=snapshot();
   root.setAttribute('data-tav-theme','neon-test');
   const neon=snapshot();
   root.removeAttribute('data-tav-theme');
   const reverted=snapshot();
   const missing=classic.filter(s=>s.missing).map(s=>s.selector);
   return {classic,neon,reverted,missing};
  });
  assert.deepEqual(data.missing,[],'Superfícies da Taverna ausentes: '+JSON.stringify(data.missing));
  for(let i=0;i<data.classic.length;i++){
   const a=data.classic[i],b=data.neon[i],c=data.reverted[i];
   assert.notEqual(a.background,b.background,a.selector+': visual não mudou com o tema ativo');
   assert.equal(a.background,c.background,a.selector+': visual padrão não voltou');
  }
  console.log('THEME_BROWSER_OK',width,data.neon.map(x=>x.selector+':'+x.background.slice(0,65)));
  await page.evaluate(()=>document.documentElement.setAttribute('data-tav-theme','neon-test'));
  await page.screenshot({path:'/tmp/tav-theme-neon-'+width+'.png'});
  // Controls remain accessible; theme doesn't intercept touches.
  assert.equal(await page.locator('#chooseOffline').isEnabled(),true);
  await page.close();
 }
}finally{await browser.close();}