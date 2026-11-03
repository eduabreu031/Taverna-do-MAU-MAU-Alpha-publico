import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';

/* v61 — Teste REAL: inicie partida offline com bots, preserve o DOM e
   compare cada foto ANTES e DURANTE o turno. A v60 testava uma estrutura
   sintética com tamanhos fixos e por isso não detectou o deslocamento. */
await mkdir('qa/screenshots',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try {
 for(const width of [320,390,430,768]){
  const page=await browser.newPage({viewport:{width,height:940},isMobile:width<500,hasTouch:width<500,deviceScaleFactor:1});
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:30000});
  await page.evaluate(()=>window.TavernaEntrance?.skipVisualOnly?.());
  await page.evaluate(()=>document.getElementById('alphaInformationOverlay')?.remove());
  await page.locator('#chooseOffline').click({timeout:10000});
  await page.evaluate(()=>{
   const sel=document.getElementById('playerCount');
   sel.value='5';sel.dispatchEvent(new Event('change',{bubbles:true}));
  });
  await page.locator('#startGameBtn').click({timeout:10000});
  await page.waitForSelector('#sceneGame #seats .seat .bot-avatar .portrait-medallion',{state:'attached',timeout:15000});
  for(const palette of ['classic','neon-blue','neon-green']){
   const snapshots=await page.evaluate(palette=>{
    const root=document.documentElement;
    if(palette==='classic')root.removeAttribute('data-tav-palette');
    else root.setAttribute('data-tav-palette',palette);
    const seats=[...document.querySelectorAll('#sceneGame #seats .seat')].filter(s=>s.querySelector('.bot-avatar .portrait-medallion'));
    function measure(el){
     const r=el.getBoundingClientRect(),css=getComputedStyle(el);
     return {left:r.left,top:r.top,width:r.width,height:r.height,position:css.position,transform:css.transform};
    }
    return seats.map((seat,i)=>{
     const avatar=seat.querySelector('.bot-avatar'),med=avatar.querySelector('.portrait-medallion');
     const img=med.querySelector('img');
     const wasActive=seat.classList.contains('active');
     seat.classList.remove('active');
     const resting={med:measure(med),avatar:measure(avatar),img:img?measure(img):null};
     med.style.setProperty('--tav-npc-progress','60%');
     seat.classList.add('active');
     const active={med:measure(med),avatar:measure(avatar),img:img?measure(img):null};
     const after=getComputedStyle(med,'::after'),old=getComputedStyle(avatar,'::after');
     const ring={display:after.display,bg:after.backgroundImage,position:after.position,
        width:parseFloat(after.width),height:parseFloat(after.height),oldDisplay:old.display};
     seat.classList.toggle('active',wasActive);
     return {seat:i,resting,active,ring};
    });
   },palette);
   assert(snapshots.length>=3,'A partida real não montou 4 bots: '+JSON.stringify(snapshots));
   for(const s of snapshots){
    for(const el of ['med','avatar','img']){
     if(!s.resting[el])continue;
     for(const dim of ['left','top','width','height']){
      const d=Math.abs(s.resting[el][dim]-s.active[el][dim]);
      assert(d<=1,'Fotografia mudou de geometria durante turno '+width+' '+palette+' '+s.seat+
        ' '+el+'.'+dim+' Δ'+d.toFixed(2)+' '+JSON.stringify(s));
     }
    }
    assert(s.ring.display==='block'&&s.ring.bg.includes('conic-gradient'),
     'Aro regressivo sumiu: '+JSON.stringify(s));
    assert(s.ring.oldDisplay==='none','Halo antigo do wrapper reapareceu: '+JSON.stringify(s));
    assert(s.ring.width<=s.active.med.width+3&&s.ring.height<=s.active.med.height+3,
     'Aro extrapolou medalhão: '+JSON.stringify(s));
   }
   console.log('HALO_V61_SEM_DESLOCAMENTO',width,palette,snapshots.length,JSON.stringify(snapshots.map(s=>({seat:s.seat,inactive:s.resting.med.position,active:s.active.med.position,deltaX:Math.round((s.active.med.left-s.resting.med.left)*10)/10,deltaY:Math.round((s.active.med.top-s.resting.med.top)*10)/10}))));
   if(width===390){
    await page.screenshot({path:'qa/screenshots/halo-v61-real-'+palette+'.png'});
   }
  }
  await page.close();
 }
} finally {await browser.close();}
