import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';

/* Regressão da v60: a v59 passava nas inspeções textuais, mas desenhava
   um disco fora da foto porque o pseudo-elemento pertencia ao wrapper. */
await mkdir('qa/screenshots',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try {
 for(const width of [320,390,768]){
  const page=await browser.newPage({viewport:{width,height:800},isMobile:width<500,hasTouch:width<500});
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:30000});
  for(const palette of ['classic','neon-blue','neon-green']){
   const result=await page.evaluate(palette=>{
    const root=document.documentElement;
    if(palette==='classic')root.removeAttribute('data-tav-palette');
    else root.setAttribute('data-tav-palette',palette);
    const scene=document.getElementById('sceneGame');
    scene.classList.remove('hidden');
    scene.style.setProperty('display','block','important');
    const seats=document.getElementById('seats');
    seats.innerHTML='<div class="seat active"><div class="seat-inner"><div class="leather-name">'+
      '<span class="bot-avatar" style="display:inline-block;width:76px;height:76px">'+
      '<span class="portrait-medallion" style="display:inline-block;width:64px;height:64px;border-radius:50%"></span>'+
      '</span><span class="npc-timer"><span class="timer-mark">15</span></span></div></div></div>';
    const portrait=seats.querySelector('.portrait-medallion');
    portrait.style.setProperty('--tav-npc-progress','75%');
    const avatar=seats.querySelector('.bot-avatar');
    const after=getComputedStyle(portrait,'::after');
    const old=getComputedStyle(avatar,'::after');
    const timer=getComputedStyle(seats.querySelector('.npc-timer'));
    const rect=portrait.getBoundingClientRect();
    const state={
     palette,width:portrait.offsetWidth,height:portrait.offsetHeight,renderedWidth:rect.width,renderedHeight:rect.height,
     pos:getComputedStyle(portrait).position,
     afterDisplay:after.display,afterPosition:after.position,
     afterWidth:parseFloat(after.width),afterHeight:parseFloat(after.height),
     afterBackground:after.backgroundImage,afterInset:[after.top,after.right,after.bottom,after.left],
     oldDisplay:old.display,oldContent:old.content,timerDisplay:timer.display
    };
    seats.querySelector('.seat').classList.remove('active');
    state.inactiveDisplay=getComputedStyle(portrait,'::after').display;
    seats.querySelector('.seat').classList.add('active');
    return state;
   },palette);
   assert.equal(result.pos,'relative',JSON.stringify(result));
   assert.equal(result.oldDisplay,'none','Aro legado reapareceu: '+JSON.stringify(result));
   assert.equal(result.afterDisplay,'block',JSON.stringify(result));
   assert.equal(result.afterPosition,'absolute',JSON.stringify(result));
   assert.equal(result.timerDisplay,'none','Relógio ainda tapa o retrato: '+JSON.stringify(result));
   assert.equal(result.inactiveDisplay,'none','Halo continua após a vez: '+JSON.stringify(result));
   assert(result.afterBackground.includes('conic-gradient')&&result.afterBackground.includes('75%'),
     'Progresso não pintou o anel: '+JSON.stringify(result));
   assert(result.afterWidth>=result.width-10&&result.afterWidth<=result.width+1,
     'Aro extrapolou largura do medalhão: '+JSON.stringify(result));
   assert(result.afterHeight>=result.height-10&&result.afterHeight<=result.height+1,
     'Aro extrapolou altura do medalhão: '+JSON.stringify(result));
   if(width===390)await page.screenshot({path:'qa/screenshots/halo-v60-'+palette+'.png'});
   console.log('HALO_V60_ALINHADO',width,palette);
  }
  await page.close();
 }
} finally {await browser.close();}
