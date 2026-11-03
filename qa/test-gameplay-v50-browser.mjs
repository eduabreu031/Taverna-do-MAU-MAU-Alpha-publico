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
  // v51: 5 cartas deixam a mesa expandir, sem deslocar o cabeçalho para baixo.
  // Com 20, ambas as últimas cartas devem aparecer sem rolagem.
  // Com 32, a última fica alcançável deslizando a própria mão.
  const adaptive=await page.evaluate(()=>{
   const scene=document.querySelector('#sceneGame'),header=scene.querySelector('.game-header');
   const table=scene.querySelector('.table-viewport');
   const zone=scene.querySelector('#humanZone'),hand=scene.querySelector('#humanHand');
   const fake=(n)=>Array.from({length:n},(_,i)=>
    '<button type="button" class="playing-card" data-card="'+i+'">'+i+'</button>'
   ).join('');
   zone.classList.remove('tav-double-hand');
   hand.innerHTML=fake(5);
   const five={headerTop:header.getBoundingClientRect().top,tableHeight:table.getBoundingClientRect().height};
   zone.classList.add('tav-double-hand');
   hand.style.setProperty('--tav-hand-cols','10');
   hand.innerHTML=fake(20);
   const rects=[...hand.children].map(e=>e.getBoundingClientRect());
   const twenty={tableHeight:table.getBoundingClientRect().height,
    allVisible:rects.every(r=>r.left>=-1&&r.right<=innerWidth+2),
    twoRows:rects[9].top===rects[0].top&&rects[19].top===rects[10].top&&rects[10].top>rects[9].top+70};
   hand.style.setProperty('--tav-hand-cols','16');
   hand.innerHTML=fake(32);
   const scrollRange=hand.scrollWidth-hand.clientWidth;
   hand.scrollLeft=hand.scrollWidth;
   const last=hand.lastElementChild.getBoundingClientRect();
   const handRight=hand.getBoundingClientRect().right;
   return {five,twenty,scrollRange,lastReachable:last.right<=handRight+2&&last.left>=-1};
  });
  assert(adaptive.five.headerTop<110,'Cabeçalho empurrado para baixo: '+width+' '+JSON.stringify(adaptive));
  assert(adaptive.five.tableHeight>adaptive.twenty.tableHeight+65,
   'A mesa não aproveitou a altura liberada pela mão curta: '+width+' '+JSON.stringify(adaptive));
  assert(adaptive.twenty.allVisible&&adaptive.twenty.twoRows,
   'A mão de 20 cartas é cortada ou está fora de duas linhas: '+width+' '+JSON.stringify(adaptive));
  if(width===320)assert(adaptive.scrollRange>0,'Mão de 32 cartas deveria poder rolar em 320px');
  assert(adaptive.lastReachable,'Última carta inacessível mesmo após deslizar: '+width+' '+JSON.stringify(adaptive));
  // v52: galeria curta após eliminar jogadores, sem reservar grandes vazios.
  // Os versos dos bots precisam continuar em leque em vez de virar 1 carta.
  const visuals=await page.evaluate(()=>{
    const root=document.documentElement,scene=document.querySelector('#sceneGame');
    root.setAttribute('data-tav-palette','neon-green');
    const zone=scene.querySelector('#humanZone'),hand=scene.querySelector('#humanHand');
    zone.classList.remove('tav-double-hand');
    hand.innerHTML='<button class="playing-card">A</button><button class="playing-card">7</button><button class="playing-card">4</button>';
    const header=scene.querySelector('.game-header'),table=scene.querySelector('.table-viewport');
    let gallery=scene.querySelector('.tav-ghost-gallery');
    if(!gallery){
      gallery=document.createElement('section');
      gallery.className='tav-ghost-gallery';
      scene.insertBefore(gallery,header);
    }
    gallery.hidden=true;
    const noGhostHeight=table.getBoundingClientRect().height;
    const markup=(n)=>Array.from({length:n},(_,i)=>
      '<div class="tav-ghost-card"><span class="portrait-medallion"></span><small>NPC'+i+'</small></div>'
    ).join('');
    gallery.hidden=false;
    gallery.innerHTML=markup(1);
    const oneGhostHeight=gallery.getBoundingClientRect().height;
    const oneTableHeight=table.getBoundingClientRect().height;
    gallery.innerHTML=markup(8);
    const eightGhostHeight=gallery.getBoundingClientRect().height;
    const eightTableHeight=table.getBoundingClientRect().height;
    const headerTop=header.getBoundingClientRect().top;
    const headerBottom=header.getBoundingClientRect().bottom;
    const galleryTop=gallery.getBoundingClientRect().top;
    const tableTop=table.getBoundingClientRect().top;
    const buttonBoxes=[...header.querySelectorAll('button')].map(x=>x.getBoundingClientRect());
    const buttonsEqual=buttonBoxes.length>1&&buttonBoxes.every(
      b=>Math.abs(b.width-buttonBoxes[0].width)<2&&Math.abs(b.height-buttonBoxes[0].height)<2
    );
    scene.querySelector('#seats').innerHTML=
      '<div class="seat"><div class="bot-pocket">'+
      Array.from({length:5},(_,i)=>'<span class="mini-card" style="left:'+i*3+'px"></span>').join('')+
      '<span class="bot-card-count">5</span></div></div>';
    const mini=[...scene.querySelectorAll('.bot-pocket .mini-card')];
    const miniVisible=mini.every(x=>getComputedStyle(x).display!=='none');
    const backs=mini.map(x=>getComputedStyle(x).backgroundImage);
    return {noGhostHeight,oneGhostHeight,oneTableHeight,eightGhostHeight,eightTableHeight,
      headerTop,headerBottom,galleryTop,tableTop,buttonsEqual,buttonCount:buttonBoxes.length,
      miniCount:mini.length,miniVisible,backs};
  });
  assert(visuals.headerTop<110,'Cabeçalho foi deslocado na eliminação: '+width+' '+JSON.stringify(visuals));
  assert(visuals.oneGhostHeight<=46&&visuals.eightGhostHeight<=46,
    'Eliminados ocupam espaço demais: '+width+' '+JSON.stringify(visuals));
  assert(Math.abs(visuals.oneTableHeight-visuals.eightTableHeight)<12,
    'Mais eliminados encolhem a mesa: '+width+' '+JSON.stringify(visuals));
  assert(visuals.noGhostHeight-visuals.eightTableHeight<=65,
    'A galeria roubou altura excessiva: '+width+' '+JSON.stringify(visuals));
  assert(visuals.galleryTop>=visuals.headerBottom-3&&visuals.tableTop>=visuals.galleryTop+25,
    'Faixa de eliminados não está entre cabeçalho e mesa: '+width+' '+JSON.stringify(visuals));
  assert(visuals.buttonCount>=5&&visuals.buttonsEqual,
    'Botões da barra com tamanhos divergentes: '+width+' '+JSON.stringify(visuals));
  assert(visuals.miniCount===5&&visuals.miniVisible&&visuals.backs.every(x=>x.includes('neon-green')),
    'O tema esconde cartas dos NPCs ou usa verso incorreto: '+width+' '+JSON.stringify(visuals));
  await page.close();
  console.log('GAMEPLAY_V50_BROWSER_OK',width);
 }
}finally{
 await browser.close();
}
