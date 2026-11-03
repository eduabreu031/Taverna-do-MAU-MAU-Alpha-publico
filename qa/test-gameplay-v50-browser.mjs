import {chromium} from 'playwright';
import assert from 'node:assert/strict';

const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 for(const width of [320,390,430]){
  const page=await browser.newPage({viewport:{width,height:1280},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
  const result=await page.evaluate(()=>{
   const root=document.documentElement,scene=document.querySelector('#sceneGame');
   root.setAttribute('data-tav-palette','neon-blue');
   document.querySelectorAll('.scene').forEach(el=>el.classList.add('hidden'));
   scene.classList.remove('hidden');
   const zone=document.querySelector('#humanZone'),hand=document.querySelector('#humanHand');
   zone.classList.add('tav-double-hand');
   hand.style.setProperty('--tav-hand-cols','6');
   hand.innerHTML=Array.from({length:12},(_,i)=>
    '<button type="button" class="playing-card" data-card="t'+i+'"><div class="big-card card-face">'+i+'</div></button>'
   ).join('');
   const cards=[...hand.querySelectorAll('.playing-card')];
   const rects=cards.map(el=>el.getBoundingClientRect());
   const first=rects.slice(0,6),second=rects.slice(6);
   const handStyle=getComputedStyle(hand),zoneBox=zone.getBoundingClientRect();
   const withinHorizontal=rects.every(r=>r.left>=-1&&r.right<=innerWidth+25);
   const twoRows=first.every(r=>Math.abs(r.top-first[0].top)<3)
    &&second.every(r=>Math.abs(r.top-second[0].top)<3)
    &&second[0].top-first[0].top>80;
   const gapBottom=innerHeight-zoneBox.bottom;
   document.querySelector('#seats').innerHTML='<div class="seat active"><div class="seat-inner"><div class="leather-name"><span class="bot-avatar"><span class="portrait-medallion"></span></span></div></div></div>';
   const portrait=scene.querySelector('.seat.active .portrait-medallion');
   const blueShadow=getComputedStyle(portrait).boxShadow;
   const blueAnimation=getComputedStyle(portrait).animationName;
   root.setAttribute('data-tav-palette','neon-pink');
   const pinkShadow=getComputedStyle(portrait).boxShadow;
   const overlay=document.querySelector('#overlay'),dialog=document.querySelector('#dialog');
   overlay.classList.remove('hidden');
   dialog.innerHTML='<div class="parchment-modal"><h2>TEMOS UM CAMPEÃO</h2><div class="champion-banner"><strong>Jogador</strong></div></div>';
   const banner=dialog.querySelector('.champion-banner');
   const bannerImage=getComputedStyle(banner).backgroundImage;
   const stage=document.createElement('div');
   stage.id='v28-score-stage';
   stage.innerHTML='<div class="score-pending-back">✥</div>';
   document.body.append(stage);
   const miniImage=getComputedStyle(stage.firstElementChild).backgroundImage;
   stage.remove();
   return {twoRows,withinHorizontal,grid:getComputedStyle(hand).display,
    gapBottom,handHeight:handStyle.height,firstTop:first[0].top,secondTop:second[0].top,
    blueShadow,pinkShadow,blueAnimation,bannerImage,miniImage};
  });
  assert(result.twoRows,'A mão de 12 cartas não formou duas linhas: '+width+' '+JSON.stringify(result));
  assert(result.grid==='grid','Layout da mão não é grade: '+width);
  assert(result.withinHorizontal,'Cartas de 12 unidades fora do viewport: '+width+' '+JSON.stringify(result));
  assert(result.gapBottom>=-2&&result.gapBottom<=90,
   'A mão ficou longe da borda inferior: '+width+' '+JSON.stringify(result));
  assert.equal(result.blueAnimation,'none','Retrato ainda herda halo dourado animado: '+width);
  assert.notEqual(result.blueShadow,result.pinkShadow,'Halo não responde à troca de tema: '+width);
  assert(result.bannerImage!=='none','Campeão ainda tem fundo de material legado: '+width);
  assert(result.miniImage!=='none','Miniatura de apuração sem verso temático: '+width);
  await page.close();
  console.log('GAMEPLAY_V50_BROWSER_OK',width);
 }
}finally{
 await browser.close();
}
