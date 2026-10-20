import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:360,height:780},isMobile:true,hasTouch:true});
try{
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
 await page.waitForTimeout(450);
 await page.evaluate(()=>{
  const news=document.getElementById('alphaInformationOverlay');if(news)news.hidden=true;
  document.getElementById('sceneWelcome').classList.add('hidden');
  document.getElementById('sceneMultiplayer').classList.remove('hidden');
  window.__tavVipTest={unlocked:false,changes:[],kicks:[]};
  window.TavernaAuth.getUser=()=>({id:'admin',role:'admin',username:'gedetheboss'});
  window.TavernaAuth.roomRequest=async(path,method,body)=>{
   if(path==='/api/vip'&&!window.__tavVipTest.unlocked)throw Object.assign(new Error('Senha VIP necessária'),{code:'VIP_PASSWORD_REQUIRED'});
   if(path==='/api/vip/unlock'){window.__tavVipTest.unlocked=true;return {ok:true};}
   if(path==='/api/vip/password'){window.__tavVipTest.changes.push(body.password);return {ok:true};}
   if(path==='/api/vip/kick'){window.__tavVipTest.kicks.push(body.memberId);return {ok:true};}
   if(path==='/api/vip')return {vip:true,code:'TAVERN',members:[
     {id:'e5592355-42b8-40df-9984-f14d047d9ed1',name:'Amigo',online:true,status:'aguardando'},
     {id:'f441b547-87b3-454e-97d7-c69359707986',name:'GedeTheBoss',online:true,status:'aguardando'}]};
   throw Error('Unknown URL '+path);
  };
  document.getElementById('onlineJoin').onclick=()=>{};
 });
 await page.locator('#tavVipEnter').click();
 await page.waitForSelector('#tavVipSecurity:not([hidden])');
 await page.locator('#tavVipSecurity .tav-vip-secret').fill('correct-password');
 await page.locator('#tavVipSecurity .tav-bots-actions button').last().click();
 await page.waitForSelector('#tavVipSecurity[hidden]');
 assert.equal(await page.locator('#onlineRoomCode').inputValue(),'TAVERN');
 await page.evaluate(()=>{
  document.getElementById('onlineLobby').classList.remove('hidden');
  document.getElementById('onlineCode').textContent='TAVERN';
 });
 await page.waitForTimeout(6200);
 assert(await page.locator('.tav-vip-change-password').isVisible());
 assert.equal(await page.locator('.tav-vip-remove').count(),1);
 await page.locator('.tav-vip-change-password').click();
 await page.waitForSelector('#tavVipSecurity:not([hidden])');
 await page.locator('#tavVipSecurity .tav-vip-secret').fill('another-test-password');
 await page.locator('#tavVipSecurity .tav-bots-actions button').last().click();
 assert.deepEqual(await page.evaluate(()=>window.__tavVipTest.changes),['another-test-password']);
 await page.locator('.tav-vip-remove').first().click();
 await page.locator('.tav-vip-remove').first().click();
 assert.deepEqual(await page.evaluate(()=>window.__tavVipTest.kicks),['e5592355-42b8-40df-9984-f14d047d9ed1']);
 console.log('VIP_ADMIN_UNLOCK_PASSWORD_AND_KICK_UI_OK');
}finally{await browser.close();}
