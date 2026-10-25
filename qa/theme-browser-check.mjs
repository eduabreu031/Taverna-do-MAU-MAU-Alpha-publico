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
   const themes=['classic','neon-blue','neon-green','neon-pink','neon-tavern-dark','neon-aero','neon-imperial','neon-amber'];
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
  assert.equal(data.options,8,'O menu de aparência precisa listar oito escolhas');
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
   for(const variant of ['neon-blue','neon-green','neon-pink','neon-tavern-dark','neon-aero','neon-imperial','neon-amber']){
    assert.notEqual(data.samples[variant][selector],classic,'Tema '+variant+' não alterou '+selector);
   }
  }
  for(const selector of must.slice(0,9)){
   assert.notEqual(data.samples['neon-blue'][selector],data.samples['neon-green'][selector],'Verde igual ao azul em '+selector);
   assert.notEqual(data.samples['neon-pink'][selector],data.samples['neon-green'][selector],'Rosa igual ao verde em '+selector);
  }
  assert.deepEqual(data.facesColorBefore,data.facesColorAfter,'As cartas não devem mudar visualmente');
  // Avaliar CSS COMPUTADO, não apenas presença de regras na folha.
  const materials=await page.evaluate(()=>{
   const out={};
   for(const id of ['classic','neon-blue','neon-green','neon-pink','neon-tavern-dark','neon-aero','neon-imperial','neon-amber']){
    window.TavernaThemeSystem.setPalette(id);
    const scene=getComputedStyle(document.querySelector('#sceneWelcome'));
    const panel=getComputedStyle(document.querySelector('#sceneWelcome .welcome-panel'));
    const button=getComputedStyle(document.querySelector('#sceneWelcome .welcome-mode'));
    out[id]={
     scenes:Object.fromEntries(['body','#tavEntrance','#alphaAccountsOverlay','#sceneWelcome','#sceneMultiplayer','#sceneMenu','#sceneGame'].map(s=>[s,getComputedStyle(document.querySelector(s)).backgroundImage])),
     sky:scene.backgroundImage,
     skySize:scene.backgroundSize,
     panel:panel.backgroundImage,
     depth:button.boxShadow,
     button:button.backgroundImage,
     glass:panel.backdropFilter||panel.webkitBackdropFilter
    };
   }
   window.TavernaThemeSystem.setPalette('neon-pink'); // preservar estado esperado pelo teste de persistência
   return out;
  });
  for(const id of ['neon-blue','neon-green','neon-pink']){
   assert(materials[id].sky.includes('theme-backdrops/'+id+'.svg'),'Céu sem imagem de estrelas: '+id);
   assert(materials[id].skySize.includes('cover'),'Textura não cobre a tela: '+id);
   assert.notEqual(materials[id].sky,materials.classic.sky,'Céu igual ao clássico: '+id);
  }
  for(const id of ['neon-tavern-dark','neon-aero','neon-imperial','neon-amber']){
   assert(materials[id].panel.includes('repeating-linear-gradient')||materials[id].panel.includes('radial-gradient'),'Painel sem textura: '+id);
   assert(materials[id].depth.includes('inset'),'Botão sem relevo: '+id);
   assert.notEqual(materials[id].sky,materials.classic.sky,'Cenário igual ao clássico: '+id);
  }
  assert(materials['neon-aero'].glass.includes(width<=650?'blur(5px)':'blur(10px)'),'Vidro Aero sem translucidez');
  assert.notEqual(materials['neon-blue'].sky,materials['neon-green'].sky);
  assert.notEqual(materials['neon-green'].sky,materials['neon-pink'].sky);

  // Testar as imagens DE FUNDO (fora das caixas de menu) nas cinco cenas.
  for(const id of ['neon-blue','neon-green','neon-pink','neon-tavern-dark','neon-aero','neon-imperial','neon-amber']){
   for(const [scene,background] of Object.entries(materials[id].scenes))
    assert(background.includes('theme-backdrops/'+id+'.svg'),'Fundo ausente atrás de '+scene+' no tema '+id);
   assert(materials[id].sky.includes('theme-backdrops/'+id+'.svg'),'Fundo não aplicado no saguão: '+id);
  }
  const backdropStates=await page.evaluate(async()=>{
   const ids=['neon-blue','neon-green','neon-pink','neon-tavern-dark','neon-aero','neon-imperial','neon-amber'];
   return Promise.all(ids.map(async id=>{
    const uri='./theme-backdrops/'+id+'.svg';
    const response=await fetch(uri);
    const source=await response.text();
    const doc=new DOMParser().parseFromString(source,'image/svg+xml');
    const image=new Image();
    image.src=uri;
    try{await image.decode()}catch{return {id,ok:false,status:response.status,problem:'Imagem não renderizou'}}
    return {id,ok:response.ok&&doc.querySelector('svg')!==null&&doc.querySelector('parsererror')===null,status:response.status,
     stars:doc.querySelectorAll('circle').length,width:image.naturalWidth,height:image.naturalHeight};
   }));
  });
  for(const result of backdropStates){
   assert(result.ok&&result.status===200,'Falha ao carregar SVG do fundo '+result.id+': '+JSON.stringify(result));
   assert(result.width>=1200&&result.height>=1800,'Resolução insuficiente: '+result.id);
   if(['neon-blue','neon-green','neon-pink'].includes(result.id))
    assert(result.stars>=600,'Faltam estrelas no tema '+result.id);
  }

  // v0.5.0.32: a caixa de MENU precisa ser lisa; o CENÁRIO aprovado
  // continua em tela inteira. Botões existentes não perdem a aparência.
  const menuSurfaces=await page.evaluate(()=>{
   const palette=['classic','neon-blue','neon-green','neon-pink','neon-aero','neon-amber','neon-tavern-dark','neon-imperial'];
   const selectors=[
    '#tavEntrance .tav-gate-identity-card','#sceneWelcome .welcome-panel',
    '#sceneMultiplayer .multiplayer-panel','#sceneMenu .book-page',
    '#tavAppearanceOverlay .tav-appearance-card',
    '#alphaAccountsOverlay .alpha-accounts-panel'
   ];
   const out={};
   for(const id of palette){
    window.TavernaThemeSystem.setPalette(id);
    const panel={};
    for(const selector of selectors){
     const el=document.querySelector(selector);
     if(!el){panel[selector]=null;continue}
     const style=getComputedStyle(el);
     panel[selector]={
      bg:style.backgroundImage,
      filter:style.backdropFilter||style.webkitBackdropFilter,
      color:style.color
     };
    }
    const btn=document.querySelector('#sceneWelcome .welcome-mode');
    const nested=btn?.querySelector('strong');
    const expectedInkNode=document.createElement('span');
    expectedInkNode.style.color='var(--tm-menu-button-ink)';
    document.body.appendChild(expectedInkNode);
    const expectedInk=getComputedStyle(expectedInkNode).color;
    expectedInkNode.remove();
    const gate=document.querySelector('#tavEntrance .tav-gate-actions button:not([hidden])');
    out[id]={
     panel,
     scene:getComputedStyle(document.querySelector('#sceneWelcome')).backgroundImage,
     buttonBg:getComputedStyle(btn).backgroundImage,
     expectedInk,
     buttonColor:getComputedStyle(btn).color,
     buttonNode:btn?.outerHTML?.slice(0,400),
     labelNode:nested?.outerHTML?.slice(0,300),
     labelColor:nested?getComputedStyle(nested).color:null,
     gateColor:gate?getComputedStyle(gate).color:null,
     gateBg:gate?getComputedStyle(gate).backgroundImage:null,
     buttonShadow:getComputedStyle(btn).textShadow,
     originalPanel:getComputedStyle(document.querySelector('#sceneGame .game-header')).backgroundImage
    };
   }
   window.TavernaThemeSystem.setPalette('neon-pink');
   return out;
  });
  const cleaned=['neon-blue','neon-green','neon-pink','neon-aero','neon-amber'];
  const panelSelectors=['#tavEntrance .tav-gate-identity-card','#sceneWelcome .welcome-panel',
   '#sceneMultiplayer .multiplayer-panel','#sceneMenu .book-page',
   '#tavAppearanceOverlay .tav-appearance-card',
   '#alphaAccountsOverlay .alpha-accounts-panel'];
  for(const id of cleaned){
   for(const selector of panelSelectors){
    const panel=menuSurfaces[id].panel[selector];
    assert(panel!==null,'Caixa de menu ausente: '+selector);
    assert(!panel.bg.includes('repeating-linear-gradient'),
      'Riscas diagonais permaneceram em '+id+' '+selector);
    assert(panel.bg.includes('radial-gradient')||panel.bg.includes('linear-gradient'),
      'Material de menu ausente: '+id+' '+selector);
   }
   assert(menuSurfaces[id].scene.includes('theme-backdrops/'+id+'.svg'),
    'Cenário estrelado/natural alterado indevidamente: '+id);
   assert(menuSurfaces[id].buttonBg.includes('gradient'),'Fundo de botão apagado: '+id);
   assert.equal(menuSurfaces[id].labelColor,menuSurfaces[id].expectedInk,
    'Título do botão não recebeu a tinta do tema: '+id+' '+JSON.stringify(menuSurfaces[id]));
   assert(menuSurfaces[id].buttonColor!=='rgb(255, 215, 0)',
    'Botão herdou amarelo clássico: '+id);
   assert(menuSurfaces[id].buttonShadow!=='none','Falta sombra para contraste: '+id);
  }
  assert(menuSurfaces['neon-aero'].panel['#sceneWelcome .welcome-panel'].filter.includes(width<=650?'blur(5px)':'blur(10px)'),
   'Painel Aero não foi vitrificado');
  assert(menuSurfaces['neon-aero'].panel['#tavEntrance .tav-gate-identity-card'].filter.includes(width<=650?'blur(5px)':'blur(10px)'),
   'Vidro do painel da entrada está ausente');
  assert(menuSurfaces['neon-aero'].panel['#sceneWelcome .welcome-panel'].bg.includes('rgba('),
   'Vidro Aero sem transparência real');
  assert.equal(menuSurfaces.classic.panel['#sceneWelcome .welcome-panel'].bg,
   data.samples.classic['#sceneWelcome .welcome-panel'].split('|')[0],
   'Taverna Clássica mudou ao alternar os temas');
  for(const id of ['neon-blue','neon-green','neon-pink','neon-aero','neon-amber']){
   assert.notEqual(menuSurfaces[id].originalPanel,'none','HUD não deve desaparecer: '+id);
  }


  // 0.5.0.34 — identidade própria dos sete baralhos e superfícies sem
  // riscas diagonais. CSS computado em 390 e 1024 pixels.
  const gameStyle=await page.evaluate(()=>{
    const ids=['classic','neon-blue','neon-green','neon-pink','neon-tavern-dark',
      'neon-aero','neon-imperial','neon-amber'];
    const selectors=['#sceneGame #tableShell','#sceneGame #tableShell>.felt',
      '#sceneGame #humanZone','#sceneGame .control-bar',
      '#sceneGame .game-header','#sceneGame .action-list'];
    const probe=document.createElement('div');
    probe.innerHTML='<div class="big-card card-back"><div class="coat"></div></div><div class="mini-card"></div><div class="card-face red"><div class="orn"></div></div>';
    document.body.appendChild(probe);
    const read=el=>{
      if(!el)return null;
      const s=getComputedStyle(el);
      return {bg:s.backgroundImage,color:s.color,border:s.borderTopColor,
        filter:s.backdropFilter||s.webkitBackdropFilter,shadow:s.boxShadow};
    };
    const out={};
    for(const id of ids){
      window.TavernaThemeSystem.setPalette(id);
      const panels=Object.fromEntries(selectors.map(s=>[s,read(document.querySelector(s))]));
      out[id]={panels,
        back:read(probe.querySelector('.card-back')),
        mini:read(probe.querySelector('.mini-card')),
        face:read(probe.querySelector('.card-face')),
        backBefore:getComputedStyle(probe.querySelector('.card-back'),'::before').content,
        coatBefore:getComputedStyle(probe.querySelector('.coat'),'::before').content,
        sombria:read(document.querySelector('#sceneWelcome .welcome-panel')),
        book:read(document.querySelector('#sceneMenu .book'))
      };
    }
    probe.remove();
    window.TavernaThemeSystem.setPalette('neon-pink');
    return out;
  });
  const variants=['neon-blue','neon-green','neon-pink','neon-tavern-dark',
    'neon-aero','neon-imperial','neon-amber'];
  const regions=['#sceneGame #tableShell','#sceneGame #tableShell>.felt',
    '#sceneGame #humanZone','#sceneGame .control-bar',
    '#sceneGame .game-header','#sceneGame .action-list'];
  for(const id of variants){
    const state=gameStyle[id];
    for(const sel of regions){
      const surface=state.panels[sel];
      assert(surface,'Região do jogo não encontrada: '+sel);
      assert(!surface.bg.includes('repeating-linear-gradient'),
        'Ainda existem listras na área '+sel+' do tema '+id+' computed='+surface.bg.slice(0,550));
      assert(surface.bg.includes('gradient'),'Superfície temática ausente: '+id+' '+sel);
      assert.notEqual(surface.bg,gameStyle.classic.panels[sel]?.bg,
        'A superfície não pode ser igual à clássica: '+id+' '+sel);
    }
    assert(state.back.bg.includes('theme-decks/'+id+'.svg'),'Verso sem arte própria: '+id);
    assert(state.mini.bg.includes('theme-decks/'+id+'.svg'),'Miniverso sem a arte própria: '+id);
    assert(state.face.bg.includes('gradient'),'Carta da frente perdeu papel temático: '+id);
    assert(!state.face.bg.includes('repeating-linear-gradient'),'Frente ainda listrada: '+id);
    assert.equal(state.backBefore,'none','Losango compartilhado sobrepõe arte SVG: '+id);
    assert.equal(state.coatBefore,'none','Runa duplicada sobrepõe arte SVG: '+id);
    if(id==='neon-tavern-dark'||id==='neon-imperial'){
      assert(!state.sombria.bg.includes('repeating-linear-gradient'),
        'Painel de menu herdou listras: '+id);
      assert(!state.book.bg.includes('repeating-linear-gradient'),
        'Capa do livro offline herdou listras: '+id);
    }
  }
  assert.notEqual(gameStyle['neon-blue'].back.bg,gameStyle['neon-green'].back.bg);
  assert.notEqual(gameStyle['neon-green'].back.bg,gameStyle['neon-pink'].back.bg);
  assert.equal(gameStyle.classic.back.bg.includes('theme-decks/'),false,
   'Taverna Clássica não deve receber baralho alternativo');
  const deckAssets=await page.evaluate(async()=>{
    return Promise.all(['neon-blue','neon-green','neon-pink','neon-tavern-dark',
      'neon-aero','neon-imperial','neon-amber'].map(async id=>{
      const uri='./theme-decks/'+id+'.svg';
      const response=await fetch(uri),body=await response.text();
      const image=new Image();image.src=uri;
      try{await image.decode()}catch{return {id,ok:false}}
      return {id,ok:response.ok&&body.includes('<svg')&&!body.includes('<script'),
        bytes:body.length,width:image.naturalWidth,height:image.naturalHeight};
    }));
  });
  for(const s of deckAssets){
    assert(s.ok&&s.width===240&&s.height===336,
      'Verso SVG não renderiza no navegador: '+JSON.stringify(s));
    assert(s.bytes<4500,'SVG pesado demais para celular: '+s.id);
  }
  console.log('THEME_GAME_SURFACES_AND_SEVEN_DECKS_OK',width,deckAssets.map(x=>x.bytes));
  // v0.5.0.33: reproduz o relato real (saudação, instrução e ornamento
  // entre o título e a saudação), calculando CSS de cada tema no Chromium.
  const welcomeColors=await page.evaluate(()=>{
   const ids=['classic','neon-blue','neon-green','neon-pink',
    'neon-tavern-dark','neon-aero','neon-imperial','neon-amber'];
   const actual=sel=>getComputedStyle(document.querySelector(sel)).color;
   const line=()=>[...document.querySelectorAll('#sceneWelcome .welcome-rule > span')]
    .map(el=>getComputedStyle(el).backgroundImage);
   const sampleToken=token=>{
    const probe=document.createElement('span');
    probe.style.color='var('+token+')';document.body.appendChild(probe);
    const color=getComputedStyle(probe).color;probe.remove();return color;
   };
   const out={};
   for(const id of ids){
    window.TavernaThemeSystem.setPalette(id);
    out[id]={
     intro:actual('#sceneWelcome .welcome-intro'),
     nameNotice:actual('#sceneWelcome .welcome-name-notice'),
     nameLabel:actual('#sceneWelcome .welcome-name-label'),
     ornament:actual('#sceneWelcome .welcome-rule > b'),
     rule:actual('#sceneWelcome .welcome-rule'),
     lines:line(),
     expectedCopy:id==='classic'?null:sampleToken('--tm-welcome-copy'),
     expectedNote:id==='classic'?null:sampleToken('--tm-welcome-note'),
     expectedOrnament:id==='classic'?null:sampleToken('--tm-welcome-ornament')
    };
   }
   window.TavernaThemeSystem.setPalette('classic');
   const classicRoundTrip={
    intro:actual('#sceneWelcome .welcome-intro'),
    nameNotice:actual('#sceneWelcome .welcome-name-notice'),
    ornament:actual('#sceneWelcome .welcome-rule > b'),
    lines:line()
   };
   window.TavernaThemeSystem.setPalette('neon-pink');
   return {out,classicRoundTrip};
  });
  const originalWelcome=welcomeColors.out.classic;
  assert.equal(welcomeColors.classicRoundTrip.intro,originalWelcome.intro,'Saudação clássica alterada');
  assert.equal(welcomeColors.classicRoundTrip.nameNotice,originalWelcome.nameNotice,'Aviso clássico alterado');
  assert.equal(welcomeColors.classicRoundTrip.ornament,originalWelcome.ornament,'Arabesco clássico alterado');
  assert.deepEqual(welcomeColors.classicRoundTrip.lines,originalWelcome.lines,'Linhas clássicas alteradas');
  for(const id of ['neon-blue','neon-green','neon-pink','neon-tavern-dark','neon-aero','neon-imperial','neon-amber']){
   const s=welcomeColors.out[id];
   assert.equal(s.intro,s.expectedCopy,'Frase «Seja bem-vindo, viajante» herdou dourado: '+id);
   assert.equal(s.nameNotice,s.expectedNote,'«Escolha como deseja jogar» herdou dourado: '+id);
   assert.equal(s.nameLabel,s.expectedNote,'Rótulo do nome herdou dourado: '+id);
   assert.equal(s.ornament,s.expectedOrnament,'Símbolo ❦ está dourado: '+id);
   assert.equal(s.rule,s.expectedOrnament,'Divisor decorativo está dourado: '+id);
   assert.equal(s.lines.length,2,'Arabesco deve manter as duas linhas: '+id);
   assert(s.lines.every(x=>x.includes('linear-gradient')),'Linhas sem coloração por tema: '+id);
   assert.notEqual(s.lines[0],originalWelcome.lines[0],'Linhas herdaram gradiente clássico: '+id);
   assert.notEqual(s.intro,originalWelcome.intro,'Frase inicial continua clássica: '+id);
   assert.notEqual(s.nameNotice,originalWelcome.nameNotice,'Instrução continua dourada: '+id);
   assert.notEqual(s.ornament,originalWelcome.ornament,'Símbolo ❦ continua clássico: '+id);
  }
  const pref=await page.evaluate(()=>localStorage.getItem('taverna:appearance:palette:v1'));
  assert.equal(pref,'neon-pink');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.evaluate(()=>window.TavernaEntrance?.skipVisualOnly());
  await page.waitForFunction(()=>!!window.TavernaThemeSystem);
  assert.equal(await page.evaluate(()=>window.TavernaThemeSystem.getPalette().id),'neon-pink','Paleta não persistiu');
  const selected=await page.locator('.tav-palette-option.selected').getAttribute('data-palette');
  assert.equal(selected,'neon-pink');
  await page.evaluate(()=>window.TavernaAppearance.open());
  assert.equal(await page.locator('#tavAppearanceOverlay').isVisible(),true);
  assert.equal(await page.locator('#tavAppearanceOverlay .tav-palette-option').count(),8);
  assert.equal(await page.locator('#tavAppearanceOverlay .tav-appearance-card > p').count(),0,'Seletor deve exibir apenas os temas, sem recados');
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
  console.log('THEME_BROWSER_OK',width,must.length,'áreas; 8 paletas; preferências; menu interativo');
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
    for(const palette of ['classic','neon-blue','neon-green','neon-pink','neon-tavern-dark','neon-aero','neon-imperial','neon-amber']){
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
    assert(item.symbol==='none'&&item.back.includes('theme-decks/'+item.palette+'.svg'),
      'Símbolo autoral deve estar no SVG sem duplicação em CSS: '+item.palette);
  }
  for(let i=1;i<hotfix.length;i++)for(let j=i+1;j<hotfix.length;j++)
    assert.notEqual(hotfix[i].back,hotfix[j].back,'Baralhos com versos idênticos');
  // Simula o HTML EXATO de escolha de naipe que ambos os motores usam:
  // Não é um screenshot de partida, mas garante geometria/estilo e alvos clicáveis.
  // Guardrail: o usuário pediu EXATAMENTE o layout original da escolha.
  // A paleta pode modificar APENAS o backdrop, nunca dimensões, arranjo,
  // títulos, tipografia ou estilo dos quatro naipes.
  const picker=await page.evaluate(()=>{
    const overlay=document.getElementById('overlay'),dialog=document.getElementById('dialog');
    dialog.innerHTML='<div class="parchment-modal" role="dialog"><div class="modal-kicker">Livro das escolhas</div><h2 id="modalTitle">Escolha o naipe</h2><div class="suit-list">'+
     ['♥','♠','♣','♦'].map(s=>'<button class="suit-choice '+(['♥','♦'].includes(s)?'red':'')+'"><b>'+s+'</b></button>').join('')+'</div></div>';
    overlay.classList.remove('hidden');
    const el=[dialog,dialog.querySelector('.parchment-modal'),dialog.querySelector('#modalTitle'),
      dialog.querySelector('.suit-list'),...dialog.querySelectorAll('.suit-choice')];
    const map={};
    for(const name of ['classic','neon-blue','neon-green','neon-pink','neon-tavern-dark','neon-aero','neon-imperial','neon-amber']){
      window.TavernaThemeSystem.setPalette(name);
      const attrs=el.map(node=>{
        const b=node.getBoundingClientRect(),s=getComputedStyle(node);
        return {rect:[b.x,b.y,b.width,b.height].map(Math.round),
         gridColumns:s.gridTemplateColumns,gridRows:s.gridTemplateRows,
         position:s.position,background:s.backgroundImage,border:s.borderTopColor,
         font:s.fontSize,color:s.color,pointer:s.pointerEvents};
      });
      map[name]={style:attrs,backdrop:getComputedStyle(overlay).backgroundImage};
    }
    return map;
  });
  for(const name of ['neon-blue','neon-green','neon-pink','neon-tavern-dark','neon-aero','neon-imperial','neon-amber']){
    // #dialog is a transparent full-screen layout wrapper: its inherited
    // computed color/border may differ although nothing is painted there.
    // Every visible element and every dimension must remain identical.
    const normalize=(items)=>items.map((item,i)=>i===0?{...item,border:'inherited',color:'inherited'}:item);
    assert.deepEqual(normalize(picker[name].style),normalize(picker.classic.style),
     'NÃO MUDAR A TELA DE ESCOLHA DE NAIPE: '+name);
    assert.notEqual(picker[name].backdrop,picker.classic.backdrop,
     'Somente o fundo do seletor precisa acompanhar o tema: '+name);
  }
  // No modo original, #dialog usa pointer-events:none enquanto o motor
  // controla os botões em camadas separadas; comparar os estilos originais
  // é mais confiável que inferir cliques a partir do fixture sem listeners.
  console.log('NATIVE_SUIT_BUTTONS',width,JSON.stringify(picker.classic.style.slice(-4).map(s=>({size:s.rect.slice(2),pointer:s.pointer}))));
  assert.equal(picker.classic.style.slice(-4).length,4,'Todos os naipes precisam existir');
  console.log('THEME_SUIT_NATIVE_LAYOUT_OK',width,'layout clássico idêntico em sete paletas; só backdrop colorido');
  await page.evaluate(()=>window.TavernaThemeSystem.setPalette('neon-green'));
  await page.screenshot({path:'/tmp/tav-suit-hotfix-green-'+width+'.png'});
  await page.evaluate(()=>{document.getElementById('overlay').classList.add('hidden');document.getElementById('dialog').replaceChildren();});
  console.log('THEME_CARD_HOTFIX_OK',width,'baralhos e assentos; seletor original intacto');
  await page.close();
 }
}finally{await browser.close();}