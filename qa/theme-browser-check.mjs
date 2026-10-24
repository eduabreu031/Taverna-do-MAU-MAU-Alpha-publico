import {chromium} from 'playwright';
import assert from 'node:assert/strict';

const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 for(const width of [390,1024]){
  const page=await browser.newPage({viewport:{width,height:840},deviceScaleFactor:1});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>!!window.TavernaThemeSystem&&!!window.TavernaAppearance,{timeout:20000});
  const data=await page.evaluate(()=>{
   const themes=['classic','neon-blue','neon-green','neon-pink'];
   const selectors=[
    '#sceneWelcome .welcome-panel','#tavCentralOpen',
    '#sceneMultiplayer .multiplayer-panel','#sceneMultiplayer #alphaAccountsBar',
    '#sceneMultiplayer #alphaAccountsLogout',
    '#sceneMenu .book','#sceneMenu .book-page',
    '#sceneGame #tableShell','#sceneGame #tableShell>.felt',
    '#sceneGame .game-header','#sceneGame .control-bar',
    '#sceneGame #humanZone','#sceneGame .action-list',
    '#tavAppearanceOverlay .tav-appearance-card',
    '#tavSocialMenu','#tavAbandonOverlay .tav-abandon-card'
   ];
   const faces=[...document.querySelectorAll('.card-face')].slice(0,2);
   function get(selector){
    const node=document.querySelector(selector);
    if(!node)return null;
    const computed=getComputedStyle(node);
    return [computed.backgroundImage,computed.backgroundColor,computed.borderTopColor].join('|');
   }
   const samples={};
   for(const id of themes){
    window.TavernaThemeSystem.setPalette(id);
    samples[id]=Object.fromEntries(selectors.map(sel=>[sel,get(sel)]));
   }
   const facesColorBefore=faces.map(node=>getComputedStyle(node).backgroundImage);
   window.TavernaThemeSystem.setPalette('neon-pink');
   const facesColorAfter=faces.map(node=>getComputedStyle(node).backgroundImage);
   const count=document.querySelectorAll('.tav-appearance-trigger').length;
   const options=document.querySelectorAll('.tav-palette-option').length;
   return {samples,facesColorBefore,facesColorAfter,count,options};
  });
  assert.equal(data.options,4,'O menu de aparência precisa listar quatro escolhas');
  assert(data.count>=3,'Faltam atalhos de aparência nas cenas');
  const must=[
   '#sceneWelcome .welcome-panel','#tavCentralOpen',
   '#sceneMultiplayer .multiplayer-panel','#sceneMultiplayer #alphaAccountsBar',
   '#sceneMenu .book','#sceneMenu .book-page',
   '#sceneGame #tableShell','#sceneGame #tableShell>.felt',
   '#sceneGame .game-header','#sceneGame .control-bar',
    '#sceneGame #humanZone','#sceneGame .action-list',
   '#tavAppearanceOverlay .tav-appearance-card'
  ];
  for(const selector of must){
   const classic=data.samples.classic[selector];
   assert(classic!==null,'Falta componente real: '+selector);
   for(const variant of ['neon-blue','neon-green','neon-pink']){
    assert.notEqual(data.samples[variant][selector],classic,'Tema '+variant+' não alterou '+selector);
   }
  }
  for(const selector of must.slice(0,9)){
   assert.notEqual(data.samples['neon-blue'][selector],data.samples['neon-green'][selector],'Verde igual ao azul em '+selector);
   assert.notEqual(data.samples['neon-pink'][selector],data.samples['neon-green'][selector],'Rosa igual ao verde em '+selector);
  }
  assert.deepEqual(data.facesColorBefore,data.facesColorAfter,'As cartas não devem mudar visualmente');
  const pref=await page.evaluate(()=>localStorage.getItem('taverna:appearance:palette:v1'));
  assert.equal(pref,'neon-pink');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!window.TavernaThemeSystem);
  assert.equal(await page.evaluate(()=>window.TavernaThemeSystem.getPalette().id),'neon-pink','Paleta não persistiu');
  const selected=await page.locator('.tav-palette-option.selected').getAttribute('data-palette');
  assert.equal(selected,'neon-pink');
  await page.evaluate(()=>window.TavernaAppearance.open());
  assert.equal(await page.locator('#tavAppearanceOverlay').isVisible(),true);
  await page.locator('.tav-palette-option[data-palette="neon-green"]').click();
  assert.equal(await page.evaluate(()=>window.TavernaThemeSystem.getPalette().id),'neon-green');
  await page.locator('.tav-appearance-finish').click();
  assert.equal(await page.locator('#tavAppearanceOverlay').isHidden(),true);
  await page.evaluate(()=>window.TavernaThemeSystem.setPalette('classic'));
  assert.equal(await page.evaluate(()=>document.documentElement.hasAttribute('data-tav-palette')),false);
  // Estilos não devem afetar entradas ou a mesa; nenhuma exceção JS do gerenciador.
  assert(errors.filter(x=>/theme|appearance|palette/i.test(x)).length===0,'Erro de runtime: '+errors.join('; '));
  const hierarchy=await page.evaluate(()=>{
   const hand=document.getElementById('humanHand');
   const parents=[];
   for(let node=hand,i=0;node&&i<7;node=node.parentElement,i++){
    const s=getComputedStyle(node);
    parents.push({tag:node.tagName,id:node.id,cls:node.className?.toString().slice(0,140),
     bg:s.backgroundImage.slice(0,100),color:s.backgroundColor});
   }
   const related=[...document.querySelectorAll('#sceneGame [class]')].filter(n=>/human|hand|action|control|seat|bot/i.test(n.className.toString())).slice(0,110)
    .map(n=>({tag:n.tagName,id:n.id,cls:n.className.toString().slice(0,110)}));
   return {parents,related};
  });
  if(width===390)console.log('THEME_HAND_AUDIT',JSON.stringify(hierarchy));
  console.log('THEME_BROWSER_OK',width,must.length,'áreas; 4 paletas; preferências; menu interativo');
  await page.evaluate(()=>window.TavernaThemeSystem.setPalette('neon-green'));
  await page.screenshot({path:'/tmp/tav-theme-neon-'+width+'.png'});
  // Hotfix: player wrappers must be transparent, whilst visual chips are themed.
  const hotfix=await page.evaluate(()=>{
    const root=document.documentElement;
    const seat=document.createElement('div');seat.className='seat';
    const inner=document.createElement('div');inner.className='seat-inner';
    const fan=document.createElement('div');fan.className='bot-fan';
    const label=document.createElement('div');label.className='leather-name';label.textContent='Bot';
    inner.append(fan,label);seat.append(inner);
    document.getElementById('seats').append(seat);
    const cardBox=document.createElement('div');cardBox.id='tavDeckTest';
    const back=document.createElement('div');back.className='big-card card-back';
    back.innerHTML='<span class="coat">🍺</span>';
    const front=document.createElement('div');front.className='big-card card-face red';
    front.innerHTML='<span class="corner">9<small>♥</small></span><span class="suit-center">♥</span><span class="orn"></span>';
    const mini=document.createElement('div');mini.className='mini-card';
    cardBox.append(back,front,mini);document.getElementById('sceneGame').append(cardBox);
    const pick=[];
    for(const palette of ['classic','neon-blue','neon-green','neon-pink']){
      window.TavernaThemeSystem.setPalette(palette);
      const get=node=>getComputedStyle(node);
      pick.push({
       palette,seat:get(seat).backgroundColor,inner:get(inner).backgroundColor,fan:get(fan).backgroundColor,
       labelBg:get(label).backgroundImage,back:get(back).backgroundImage,
       front:get(front).backgroundImage,
       red:get(front).color,
       mini:get(mini).backgroundImage,
       symbol:getComputedStyle(back.querySelector('.coat'),'::before').content
      });
    }
    seat.remove();cardBox.remove();
    return pick;
  });
  for(const item of hotfix.filter(p=>p.palette!=='classic')){
    assert.equal(item.seat,'rgba(0, 0, 0, 0)','Assento ainda tem bloco de fundo: '+item.palette);
    assert.equal(item.inner,'rgba(0, 0, 0, 0)','Container ainda tem bloco de fundo: '+item.palette);
    assert.equal(item.fan,'rgba(0, 0, 0, 0)','Leque dos bots ainda tem bloco: '+item.palette);
    if(width<=760)assert.equal(item.labelBg,'none','O painel quadrado do retrato ainda aparece: '+item.palette);
    else assert(item.labelBg.includes('gradient'),'No desktop, a placa do nome deve continuar tematizada');
    assert.notEqual(item.front,hotfix[0].front,'Frente da carta não mudou '+item.palette);
    assert.notEqual(item.back,hotfix[0].back,'Verso da carta não mudou '+item.palette);
    assert.notEqual(item.mini,hotfix[0].mini,'Verso pequeno do bot não mudou '+item.palette);
    assert(item.red.startsWith('rgb('),'Naipe vermelho sem cor');
    assert(item.symbol!=='none','Verso não tem símbolo exclusivo '+item.palette);
  }
  for(let i=1;i<hotfix.length;i++)for(let j=i+1;j<hotfix.length;j++)
    assert.notEqual(hotfix[i].back,hotfix[j].back,'Baralhos com versos idênticos');
  // Simula o HTML EXATO de escolha de naipe que ambos os motores usam:
  // Não é um screenshot de partida, mas garante geometria/estilo e alvos clicáveis.
  const choose=await page.evaluate(()=>{
    const overlay=document.getElementById('overlay'),dialog=document.getElementById('dialog');
    window.TavernaThemeSystem.setPalette('neon-green');
    dialog.innerHTML='<div class="parchment-modal" role="dialog"><div class="modal-kicker">Livro das escolhas</div><h2 id="modalTitle">Escolha o naipe</h2><div class="suit-list">'+
     ['♥','♠','♣','♦'].map(s=>'<button class="suit-choice '+(['♥','♦'].includes(s)?'red':'')+'"><b>'+s+'</b></button>').join('')+'</div></div>';
    overlay.classList.remove('hidden');
    const panel=dialog.querySelector('.parchment-modal'),buttons=[...dialog.querySelectorAll('.suit-choice')];
    const p=panel.getBoundingClientRect();
    return {
     panel:{x:p.x,y:p.y,width:p.width,height:p.height},
     bg:getComputedStyle(panel).backgroundImage,
     border:getComputedStyle(panel).borderTopColor,
     buttonRects:buttons.map(b=>{const r=b.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,events:getComputedStyle(b).pointerEvents,bg:getComputedStyle(b).backgroundImage};}),
     titleVisible:getComputedStyle(dialog.querySelector('h2')).display,
     overlayVisible:getComputedStyle(overlay).display
    };
  });
  console.log('THEME_SUIT_GEOMETRY',JSON.stringify({width,geometry:choose}));
  assert(choose.panel.width>=250&&choose.panel.width<430,'Painel de naipe vazio/estreito');
  assert(choose.panel.height>180&&choose.panel.height<650,'Painel de naipe ocupa a tela inteira');
  assert(choose.bg!=='none','Painel de escolha precisa ter aparência temática');
  assert(choose.buttonRects.every(b=>b.width>90&&b.height>50&&b.events!=='none'),'Naipes perderam alvo de toque');
  assert(choose.buttonRects.every(b=>b.x>=choose.panel.x-2&&b.x+b.width<=choose.panel.x+choose.panel.width+2&&b.y>=choose.panel.y-2&&b.y+b.height<=choose.panel.y+choose.panel.height+2),
   'Símbolos de naipe escaparam do painel');
  await page.screenshot({path:'/tmp/tav-suit-hotfix-green-'+width+'.png'});
  await page.evaluate(()=>{document.getElementById('overlay').classList.add('hidden');document.getElementById('dialog').replaceChildren();});
  console.log('THEME_CARD_HOTFIX_OK',width,'bot seat sem retângulo, 3 baralhos diferentes, escolha de naipe em painel');
  await page.close();
 }
}finally{await browser.close();}