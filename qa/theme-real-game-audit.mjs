import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
try{
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>window.TavernaEntrance?.skipVisualOnly());
 await page.waitForFunction(()=>window.TavernaThemeSystem);
 await page.evaluate(()=>window.TavernaThemeSystem.setPalette('neon-green'));
 await page.evaluate(()=>{const notes=document.getElementById('alphaInformationOverlay');notes?.remove();});
 const init=await page.evaluate(()=>[...document.querySelectorAll('#sceneWelcome button,#sceneMenu button')].map(x=>({id:x.id,cls:x.className,text:x.textContent.trim().slice(0,65)})).slice(0,65));
 console.log('AUDIT_BUTTONS_INIT',JSON.stringify(init));
 await page.locator('#chooseOffline').click({timeout:3000});
 // Testar seleção de personagem DE VERDADE, após abrir a cena offline.
 await page.locator('#sceneMenu #heroChoiceCards .hero-choice[data-hero="TAVERNEIRO"]').click({timeout:3000});
 const second=await page.evaluate(()=>[...document.querySelectorAll('#heroChoiceCards .hero-choice')]
  .map(el=>({hero:el.dataset.hero,pressed:el.getAttribute('aria-pressed'),chosen:el.classList.contains('chosen')})));
 assert(second.find(x=>x.hero==='TAVERNEIRO'&&x.pressed==='true'&&x.chosen),
  'Clique no retrato compacto deve escolher Taverneiro');
 await page.locator('#sceneMenu #heroChoiceCards .hero-choice[data-hero="HERÓI"]').click({timeout:3000});
 const first=await page.evaluate(()=>[...document.querySelectorAll('#heroChoiceCards .hero-choice')]
  .map(el=>({hero:el.dataset.hero,pressed:el.getAttribute('aria-pressed'),chosen:el.classList.contains('chosen')})));
 assert(first.find(x=>x.hero==='HERÓI'&&x.pressed==='true'&&x.chosen),
  'Voltar ao Herói deve restaurar seleção normal');
 console.log('OFFLINE_HERO_CLICK_REAL_OK',second,first);

 await page.locator('#playerCount').selectOption('2');
 console.log('AUDIT_MENU',JSON.stringify(await page.evaluate(()=>({
  html:document.querySelector('#sceneMenu')?.innerText?.slice(0,1600),
  buttons:[...document.querySelectorAll('#sceneMenu button')].map(b=>({id:b.id,cls:b.className,text:b.innerText?.slice(0,50)})),
  selects:[...document.querySelectorAll('#sceneMenu select')].map(b=>({id:b.id,value:b.value,options:b.options.length}))
 }))));
 const buttons=await page.evaluate(()=>[...document.querySelectorAll('#sceneMenu button')].filter(b=>!b.disabled).map(b=>({id:b.id,text:b.innerText})));
 const candidate=buttons.find(b=>b.id==='startGameBtn')||buttons.find(b=>/iniciar|jogar|começar|partida|sentar/i.test(b.text));
 if(candidate){
  const sel=candidate.id?'#'+candidate.id:'';
  if(sel) await page.locator(sel).click({timeout:3000});
 }
 await page.waitForTimeout(750);
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

 const samples=[];
 for(let i=0;i<23;i++){
  const st=await page.evaluate(()=>{
   const game=document.getElementById('sceneGame');
   const hand=document.getElementById('humanHand');
   const hu=document.getElementById('humanZone');
   const s=document.querySelector('#seats .seat.active');
   return {
    at:Math.round(performance.now()),hidden:game.classList.contains('hidden'),
    humanClass:hu.className,humanAttrs:[...hu.attributes].map(x=>[x.name,x.value]),
    humanCardClasses:[...hand.querySelectorAll('.playing-card')].slice(0,4).map(n=>n.className),
    seatActive:s?.getAttribute('data-seat')||'human',
    clock:document.getElementById('clockText')?.textContent,
    activeLabel:document.getElementById('turnLabel')?.textContent,
    roundText:document.getElementById('roundBadge')?.textContent,
    turn:document.getElementById('turnInfo')?.textContent,
    gameClasses:game.className
   };
  });
  samples.push(st);
  if(samples.some(s=>s.seatActive!=='human')&&samples.some(s=>s.humanClass.includes('turn-active')))break;
  await page.waitForTimeout(1000);
 }
 console.log('AUDIT_TURN_SAMPLES',JSON.stringify(samples));

 const botSample=samples.find(x=>x.seatActive!=='human'&&x.humanCardClasses.every(z=>z.includes('inactive')));
 const humanSample=samples.find(x=>x.humanClass.includes('turn-active')&&x.humanCardClasses.some(z=>!z.includes('inactive')));
 assert(botSample,'Não encontramos um turno adversário real');
 assert(humanSample,'Não encontramos a classe turn-active gerada pelo motor');
 const themeState=await page.evaluate(()=>{
  const seat=document.querySelector('#seats .seat');
  const label=seat.querySelector('.leather-name');
  const avatar=seat.querySelector('.bot-avatar');
  const hu=document.getElementById('humanZone');
  const before=[];
  for(const theme of ['neon-blue','neon-green','neon-pink','neon-tavern-dark','neon-aero','neon-imperial','neon-amber']){
   window.TavernaThemeSystem.setPalette(theme);
   const c=getComputedStyle(label),h=getComputedStyle(hu);
   const humanWasActive=hu.classList.contains('turn-active');
   hu.classList.remove('turn-active');
   const idleHumanShadow=getComputedStyle(hu).boxShadow;
   hu.classList.add('turn-active');
   const activeHumanShadow=getComputedStyle(hu).boxShadow;
   hu.classList.toggle('turn-active',humanWasActive);
   const actor=document.querySelector('#seats .seat');
   // Rendered turn classes are the game engine's own .active / .turn-active.
   const old=actor.classList.contains('active');
   actor.classList.add('active');
   const f=getComputedStyle(avatar).filter;
   const med=getComputedStyle(actor.querySelector('.portrait-medallion'));
   const bsh=med.boxShadow;
   const activeAnimation=med.animationName;
   const nameColor=getComputedStyle(actor.querySelector('.name-text')).color;
   actor.classList.toggle('active',old);
   before.push({theme,seatBackground:c.backgroundImage,seatShadow:c.boxShadow,seatBorder:c.borderTopColor,
    humanActiveBorder:h.borderTopColor,humanActiveShadow:activeHumanShadow,humanIdleShadow:idleHumanShadow,
    avatarActiveFilter:f,medallionActiveShadow:bsh,activeAnimation,nameColor});
  }
  return before;
 });
 console.log('AUDIT_ACTUAL_THEME_STATES',JSON.stringify(themeState));
 for(const state of themeState){
  assert.equal(state.seatBackground,'none','Bloco escuro ainda atrás do retrato: '+state.theme);
  assert.equal(state.seatShadow,'none','Brilho quadrado ao redor do nome: '+state.theme);
  assert.equal(state.avatarActiveFilter,'none','O avatar não pode duplicar o brilho do medalhão');
  assert(state.medallionActiveShadow.includes('rgb('),'Retrato ativo sem moldura brilhante');
  assert.equal(state.activeAnimation,'none','Animação amarela antiga não foi desligada: '+state.theme);
  assert.notEqual(state.humanActiveShadow,state.humanIdleShadow,'Moldura humana não mudou no turno: '+state.theme);
 }
 console.log('THEME_REAL_GAME_TURN_OK',themeState.map(x=>x.theme).join(','));

 // Exercise the actual overlay DOM in the visible scene and verify metrics.
 const ov=await page.evaluate(()=>{
  const el=document.getElementById('overlay'),dia=document.getElementById('dialog');
  dia.innerHTML='<div class="parchment-modal" role="dialog"><div class="modal-kicker">Livro das escolhas</div><h2 id="modalTitle">Escolha o naipe</h2><div class="suit-list">'+['♥','♠','♣','♦'].map(s=>'<button class="suit-choice '+(['♥','♦'].includes(s)?'red':'')+'"><b>'+s+'</b></button>').join('')+'</div></div>';
  el.classList.remove('hidden');
  const elements=[el,dia,dia.querySelector('.parchment-modal'),dia.querySelector('h2'),dia.querySelector('.suit-list'),...dia.querySelectorAll('button')];
  return elements.map(n=>{const r=n.getBoundingClientRect(),css=getComputedStyle(n);return {cls:n.className,id:n.id,rect:[r.x,r.y,r.width,r.height].map(v=>Math.round(v)),bg:css.backgroundImage.slice(0,100),position:css.position,z:css.zIndex}});
 });
 console.log('AUDIT_REAL_SUIT',JSON.stringify(ov));
 await page.screenshot({path:'/tmp/tav-live-modal-390.png'});
}finally{await browser.close()}
