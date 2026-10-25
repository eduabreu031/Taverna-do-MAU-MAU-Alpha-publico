import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const BASE='http://127.0.0.1:8765/';
const REMOTE='https://taverna-multiplayer-servidor.edulopes941.workers.dev';
try{
 for(const width of [320,390,768,1280]){
  const context=await browser.newContext({viewport:{width,height:850},isMobile:width<=390,hasTouch:width<=390});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>{
   window.TavernaEntrance?.skipVisualOnly?.();
   document.getElementById('alphaInformationOverlay')?.remove();
  });
  assert.equal(await page.evaluate(()=>window.TavernaCronicas.catalogSize()),60);
  assert(await page.locator('#sceneWelcome .tav-cronicas-trigger').isVisible());
  await page.locator('#sceneWelcome .tav-cronicas-trigger').click();
  await page.waitForSelector('#tavCronicasOverlay:not([hidden])');
  const dialog=page.locator('#tavCronicasOverlay');
  assert(await dialog.getByText('Livro das Glórias').count()>0);
  await page.waitForFunction(()=>document.querySelector('#tavCronicasStatus')?.textContent?.includes('Visitantes'));
  assert((await dialog.innerText()).includes('— / 1.000 G'));
  await dialog.getByRole('button',{name:'Livro das Glórias'}).click();
  assert.equal(await dialog.locator('.tav-cronicas-achievement').count(),12);
  await dialog.locator('#tavCronicasCategory').selectOption('trapaceiro');
  await dialog.locator('#tavCronicasTier').selectOption('ouro');
  assert.equal(await dialog.locator('.tav-cronicas-achievement').count(),2);
  await dialog.getByRole('button',{name:'Ordens',exact:true}).click();
  assert.equal(await dialog.locator('.tav-cronicas-order').count(),4);
  assert.equal(await dialog.locator('.tav-cronicas-order-select:disabled').count(),4);
  for(const theme of await page.evaluate(()=>window.TavernaThemeSystem.getChoices().map(x=>x.id))){
   await page.evaluate(id=>window.TavernaThemeSystem.setPalette(id),theme);
   const state=await page.evaluate(()=>{
    const dialog=document.querySelector('#tavCronicasOverlay');
    const panel=dialog.querySelector('.tav-cronicas-panel');
    const box=panel.getBoundingClientRect();
    return {palette:window.TavernaThemeSystem.getPalette().id,
      viewport:document.documentElement.clientWidth,boxLeft:box.left,boxRight:box.right,
      ink:getComputedStyle(panel).color,visible:getComputedStyle(dialog).display!=='none'};
   });
   assert.equal(state.palette,theme);
   assert(state.visible && state.ink!=='rgba(0, 0, 0, 0)',theme+' unreadable');
   assert(state.boxLeft>=-3 && state.boxRight<=state.viewport+3,
    theme+' clipped on '+width+'px: '+JSON.stringify(state));
   if(width===390&&['classic','neon-blue','neon-aero','neon-porcelain'].includes(theme))
    await page.screenshot({path:'/tmp/cronicas-'+theme+'-'+width+'.png'});
  }
  await page.keyboard.press('Escape');
  assert.equal(await dialog.isVisible(),false,'Escape did not dismiss overlay');
  assert.equal(errors.length,0,'JS error at '+width+': '+errors.join('; '));
  console.log('CRONICAS_12_PALETTES_NAVIGATION_OK',width);
  await context.close();
 }
 const context=await browser.newContext({viewport:{width:390,height:844}});
 const page=await context.newPage();
 const seen=[];
 const original={
  activeOrder:'reis',
  orders:['corvos','laminas','errantes','reis'].map((id,i)=>({
   id,points:i===0?125:i===1?3040:0,level:i===0?3:i===1?20:1
  }))
 };
 await page.route(REMOTE+'/api/cronicas/**',async route=>{
  const path=new URL(route.request().url()).pathname;
  seen.push({path,method:route.request().method(),headers:route.request().headers()});
  let data,status=200;
  if(path==='/api/cronicas/me')data={profile:{renown:{level:7,totalXp:1825},dobroes:40}};
  else if(path==='/api/cronicas/achievements')data={book:{unlockedCount:1,glory:5,
   platinum:{unlocked:false},achievements:[
    {id:'EST_01',progress:1,unlocked:true},{id:'CON_01',progress:3,unlocked:false}
   ]}};
  else if(path==='/api/cronicas/orders')data={book:original};
  else if(path==='/api/cronicas/orders/activate'&&route.request().method()==='POST'){
   const body=JSON.parse(route.request().postData());
   if(!['corvos','laminas','errantes','reis'].includes(body.orderId))throw Error('Invalid selected Order');
   original.activeOrder=body.orderId;data={book:{...original}};
  }else{status=404;data={error:'Not mocked'};}
  await route.fulfill({status,contentType:'application/json',
   headers:{'access-control-allow-origin':'*'},body:JSON.stringify(data)});
 });
 await page.goto(BASE,{waitUntil:'domcontentloaded'});
 await page.evaluate(()=>{
  window.TavernaEntrance?.skipVisualOnly?.();
  document.getElementById('alphaInformationOverlay')?.remove();
  window.TavernaAuth.getUser=()=>({id:'test-account',username:'tester',role:'player'});
  window.TavernaAuth.getToken=()=> 'x'.repeat(32);
  window.TavernaCronicas.open();
 });
 await page.waitForFunction(()=>document.querySelector('#tavCronicasStatus')?.textContent?.includes('confirmados'));
 const dialog=page.locator('#tavCronicasOverlay');
 assert((await dialog.innerText()).includes('5 / 1.000 G'));
 assert((await dialog.innerText()).includes('40'));
 await dialog.getByRole('button',{name:'Livro das Glórias'}).click();
 assert.equal(await dialog.locator('.tav-cronicas-unlocked').count(),1);
 assert((await dialog.innerText()).includes('1 / 1'));
 await dialog.getByRole('button',{name:'Ordens',exact:true}).click();
 assert((await dialog.innerText()).includes('Nível 20 / 20'));
 await dialog.locator('.tav-cronicas-order-select').first().click();
 await page.waitForFunction(()=>document.querySelector('.tav-cronicas-order-select')?.textContent==='Ordem ativa');
 assert.equal(original.activeOrder,'corvos');
 assert.equal(original.orders.find(x=>x.id==='laminas').points,3040,'Other Order lost progress');
 assert(seen.some(x=>x.path.endsWith('/activate')&&x.method==='POST'));
 assert(seen.filter(x=>x.path==='/api/cronicas/orders/activate').every(x=>x.headers.authorization==='Bearer '+ 'x'.repeat(32)));
 assert.equal(await page.locator('#sceneGame').count(),1,'Gameplay screen removed');
 console.log('CRONICAS_VERIFIED_PROFILE_ORDER_SELECTION_OK');
 await context.close();
}finally{await browser.close();}
