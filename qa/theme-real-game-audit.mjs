import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
try{
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.TavernaThemeSystem);
 await page.evaluate(()=>window.TavernaThemeSystem.setPalette('neon-green'));
 const init=await page.evaluate(()=>[...document.querySelectorAll('#sceneWelcome button,#sceneMenu button')].map(x=>({id:x.id,cls:x.className,text:x.textContent.trim().slice(0,65)})).slice(0,65));
 console.log('AUDIT_BUTTONS_INIT',JSON.stringify(init));
 await page.locator('#chooseOffline').click({timeout:3000});
 console.log('AUDIT_MENU',JSON.stringify(await page.evaluate(()=>({
  html:document.querySelector('#sceneMenu')?.innerText?.slice(0,1600),
  buttons:[...document.querySelectorAll('#sceneMenu button')].map(b=>({id:b.id,cls:b.className,text:b.innerText?.slice(0,50)})),
  selects:[...document.querySelectorAll('#sceneMenu select')].map(b=>({id:b.id,value:b.value,options:b.options.length}))
 }))));
 const buttons=await page.evaluate(()=>[...document.querySelectorAll('#sceneMenu button')].filter(b=>!b.disabled).map(b=>({id:b.id,text:b.innerText})));
 const candidate=buttons.find(b=>/iniciar|jogar|começar|partida/i.test(b.text));
 if(candidate){
  const sel=candidate.id?'#'+candidate.id:'';
  if(sel) await page.locator(sel).click({timeout:3000});
 }
 console.log('AUDIT_GAME',JSON.stringify(await page.evaluate(()=>{
  const scene=document.querySelector('#sceneGame');
  const attrs=node=>{if(!node)return null;const s=getComputedStyle(node),r=node.getBoundingClientRect();return {id:node.id,cls:node.className,tag:node.tagName,bg:s.backgroundImage.slice(0,135),bgc:s.backgroundColor,shadow:s.boxShadow.slice(0,200),filter:s.filter,display:s.display,rect:[r.x,r.y,r.width,r.height].map(x=>Math.round(x))}};
  return {
   visible:!!scene&&!scene.classList.contains('hidden'),
   html:scene?.innerText?.slice(0,750),
   seats:[...document.querySelectorAll('#seats .seat')].slice(0,4).map(seat=>({html:seat.outerHTML.slice(0,1250),attrs:[seat,seat.querySelector('.seat-inner'),...seat.querySelectorAll('div')].slice(0,15).map(attrs)})),
   human:[...['#humanZone','#humanHand','#humanSeatName','.human-topline','.action-list','#clockText','#tableShell']].map(s=>attrs(document.querySelector(s))),
   btns:[...scene.querySelectorAll('button')].filter(b=>b.offsetWidth>0).slice(0,25).map(b=>({id:b.id,text:b.textContent?.trim().slice(0,40),cls:b.className})),
   overlay:attrs(document.querySelector('#overlay')),
   dialog:attrs(document.querySelector('#dialog'))
  }
 })));
}finally{await browser.close()}
