import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
await mkdir('qa/screenshots',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 for(const width of [320,360,390,430,768,1024,1440]){
  const page=await browser.newPage({viewport:{width,height:800},deviceScaleFactor:1,isMobile:width<=430,hasTouch:width<=430});
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:30000});
  await page.evaluate(()=>{window.TavernaEntrance?.skipVisualOnly?.();document.getElementById('tavEntrance')?.remove();});
  await page.waitForSelector('#chooseMultiplayer',{timeout:15000});
  await page.waitForTimeout(450);
  await page.evaluate(()=>{const news=document.getElementById('alphaInformationOverlay');if(news)news.hidden=true;});
  await page.locator('#alphaOpenNews').click();
  assert.equal(await page.locator('#alphaInformationOverlay details.alpha-release').count(),4,'O changelog deve exibir somente quatro versões');
  await page.locator('#alphaModalClose').click();

  const root=await page.evaluate(()=>({body:document.body.scrollWidth,screen:document.documentElement.clientWidth}));
  assert(root.body<=root.screen+3,'Rolagem horizontal em '+width+': '+JSON.stringify(root));
  await page.screenshot({path:'qa/screenshots/welcome-'+width+'.png',fullPage:false});
  // Qualquer porta da Taverna funciona com nome em branco.
  await page.locator('#playerName').fill('');
  await page.locator('#chooseOffline').click();
  assert(await page.locator('#sceneMenu').isVisible(),'Modo offline exigiu apelido em branco');
  assert.equal(await page.locator('#playerName').inputValue(),'Forasteiro');
  await page.locator('#offlineBackBtn').click();
  await page.locator('#playerName').fill('');
  await page.locator('#chooseRules').click();
  assert(await page.locator('#rulesModalDEV').isVisible(),'Livro de regras bloqueou visitante sem nome');
  await page.locator('#rulesCloseDEV').click();
  await page.locator('#playerName').fill('');
  await page.click('#chooseMultiplayer');
  assert(await page.locator('#sceneMultiplayer').isVisible(),'Multiplayer exigiu apelido');
  assert.equal(await page.locator('#playerName').inputValue(),'Forasteiro');
  assert.equal(await page.evaluate(()=>localStorage.getItem('mau2_player_name')),null,'Nome provisório não pode persistir no navegador');
  await page.waitForTimeout(350);
  await page.waitForSelector('#alphaAccountsOverlay:not([hidden])');
  // Cadastro deve abrir uma TELA nova; formulário de login não valida cadastro.
  await page.locator('#alphaAccountCreate').click();
  assert(await page.locator('#alphaRegisterFields').isVisible(),'Confirmar senha e telefone não apareceram');
  assert(await page.locator('#alphaAccountPhone').isVisible(),'Campo telefone ausente');
  await page.locator('#alphaAccountUser').fill('qa_teste');
  await page.locator('#alphaAccountPassword').fill('SenhaLonga123');
  await page.locator('#alphaAccountConfirmPassword').fill('SenhaDiferente');
  await page.locator('#alphaAccountPhone').fill('31987654321');
  await page.locator('#alphaAccountCreate').click();
  assert.match(await page.locator('#alphaAccountError').innerText(),/senhas/i);
  await page.locator('#alphaAccountLogin').click();
  assert(await page.locator('#alphaRegisterFields').isHidden(),'Botão voltar não retornou ao login');
  const auth=await page.locator('.alpha-accounts-panel').boundingBox();
  assert(auth&&auth.x>=-1&&auth.x+auth.width<=width+2,'Modal de conta fora da tela '+width);
  await page.screenshot({path:'qa/screenshots/auth-'+width+'.png'});
  await page.click('#alphaAccountCancel');
  await page.evaluate(()=>{const news=document.getElementById('alphaInformationOverlay');if(news)news.hidden=true;});
  await page.evaluate(()=>{
   document.querySelector('#sceneWelcome')?.classList.add('hidden');
   document.querySelector('#sceneMultiplayer')?.classList.remove('hidden');
   const lobby=document.querySelector('#onlineLobby');lobby.classList.remove('hidden');
   document.querySelector('#onlineCode').textContent='TAVERN';
   const bots=document.querySelector('#botsLabDEV');bots.hidden=false;bots.classList.remove('hidden');
   const select=document.querySelector('#onlineBotsDEV');select.disabled=false;
  });
  await page.waitForTimeout(1000);
  assert(await page.locator('.multiplayer-preview').isVisible()===false,'Entrada deve desaparecer no lobby');
  assert(await page.locator('#tavBotsOpen').isVisible(),'Botão temático ausente');
  await page.click('#tavBotsOpen');
  await page.waitForSelector('#tavBotsSheet:not([hidden])');
  await page.locator('.tav-bots-choice[data-count="1"]').click();
  await page.getByRole('button',{name:'Confirmar',exact:true}).click();
  assert.equal(await page.locator('#onlineBotsDEV').inputValue(),'1');
  await page.screenshot({path:'qa/screenshots/lobby-'+width+'.png'});
  // Central administrativa: usuários comuns não recebem o botão.
  assert(await page.locator('#tavCentralOpen').isHidden(),'Central visível a conta não administradora');
  assert(await page.locator('#tavVipRequestAccess').isHidden(),'Visitante sem conta não deve ver botão de pedido');
  // Painel VIP: acesso só com conta administrativa, inclusive fora do lobby.
  assert(await page.locator('#tavVipAdminOpen').isHidden(),'Controle administrativo indevidamente exposto');
  await page.evaluate(()=>{
   const administrator={id:'account_admin',username:'gedetheboss',role:'admin'};
   window.TavernaAuth.getUser=()=>administrator;
   window.TavernaAuth.requireUser=async()=>administrator;
   window.TavernaAuth.roomRequest=async(path,method)=>{
    if(path==='/api/vip'&&method==='GET')return {
     canManage:true,phase:'waiting',passwordProtected:false,
     members:[{id:'player_a',name:'Amigo',online:true,status:'aguardando'}],
     bots:[{id:'bot_a',name:'Bot da Taverna',online:true,status:'conectado'}]
    };
    if(path==='/api/vip/password')return {ok:true};
    if(path==='/api/vip/kick')return {ok:true};
    if(path==='/api/vip/access/requests')return {requests:[{id:'requester-01',name:'Aventureiro',requestedAt:Date.now()}]};
    if(path==='/api/vip/access/decide')return {ok:true,status:'approved'};
    if(path==='/api/vip/access/status')return {status:'none'};
    if(path==='/api/vip/access/request')return {status:'pending'};

    throw Error('Rota de teste inesperada: '+path);
   };
  });
  await page.evaluate(()=>{document.getElementById('sceneWelcome').classList.remove('hidden');document.getElementById('sceneMultiplayer').classList.add('hidden');});
  await page.waitForSelector('#tavCentralOpen:not([hidden])',{timeout:3000});
  await page.evaluate(()=>{
    const previous=window.TavernaAuth.roomRequest;
    window.TavernaAuth.roomRequest=async(path,method)=>{
      if(path==='/api/central/dashboard')return {online:11,playing:4,activeMatches:1,openRooms:2,rooms:[{code:'TAVERN',round:2,players:4,bots:1}],updatedAt:Date.now()};
      if(path==='/api/central/feedback')return {items:[{type:'bug',name:'Forasteiro',message:'Erro de teste',version:'0.4.97',at:Date.now()}]};
      if(path==='/api/central/watch?room=TAVERN'){
        const count=window.__spectatorSeatCount||2,revision=window.__spectatorRevision||1;
        const seats=Array.from({length:count},(_,i)=>({id:'seat'+i,name:'Aventureiro '+i,isBot:i>0&&i%2===1}));
        return {game:{phase:'playing',round:2,direction:1,revision,deckCount:30,top:{id:'card'+revision,rank:revision>1?'Q':'9',suit:'♠'},activeSuit:'♠',players:seats.map((p,i)=>({id:p.id,alive:true,count:i===0?3:4})),hand:[],turnPlayerId:seats[revision%count].id},players:seats,serverNow:Date.now(),turnDeadline:Date.now()+15000};
      }
      return previous(path,method);
    };
  });
  await page.locator('#tavCentralOpen').click();
  await page.waitForSelector('#tavCentralOverlay:not([hidden])');
  assert.equal(await page.locator('.tav-central-counter strong').first().innerText(),'11');
  await page.locator('.tav-central-watch').click();
  await page.waitForSelector('.tav-central-felt');
  assert(await page.locator('.tav-central-felt').getByText('Cartas na mão: 3').count()>0);
  await page.locator('.tav-central-seat').first().evaluate(node=>{window.__seatNodeOriginal=node;});
  await page.evaluate(()=>{window.__spectatorRevision=2;});
  await page.waitForTimeout(2150);
  assert.equal(await page.locator('.tav-central-discard').innerText(),'Q ♠');
  assert(await page.evaluate(()=>document.querySelector('.tav-central-seat')===window.__seatNodeOriginal),'Espectador reconstruiu assentos sem necessidade');
  await page.evaluate(()=>{window.__spectatorSeatCount=10;window.__spectatorRevision=3;});
  await page.waitForTimeout(2150);
  assert.equal(await page.locator('.tav-central-seat').count(),10,'Espectador ocultou participantes em mesa cheia');
  const screenCheck=await page.evaluate(()=>{
    const felt=document.querySelector('.tav-central-felt').getBoundingClientRect();
    const seats=[...document.querySelectorAll('.tav-central-seat')].map(x=>x.getBoundingClientRect());
    return {allWithin:seats.every(r=>r.left>=felt.left-1&&r.right<=felt.right+1),
      noOverlap:seats.every((r,i)=>seats.slice(i+1).every(p=>r.right<=p.left+1||p.right<=r.left+1||r.bottom<=p.top+1||p.bottom<=r.top+1))};
  });
  assert(screenCheck.allWithin&&screenCheck.noOverlap,'Mesa de 10 pessoas sem organização: '+JSON.stringify(screenCheck));
  await page.screenshot({path:'qa/screenshots/spectator-'+width+'.png'});
  await page.locator('.tav-central-back').click();
  await page.locator('.tav-central-tab').nth(1).click();
  await page.waitForSelector('.tav-central-report');
  await page.locator('.tav-central-close').click();
  assert(await page.locator('#tavCentralOverlay').isHidden());
  await page.evaluate(()=>{document.getElementById('sceneWelcome').classList.add('hidden');document.getElementById('sceneMultiplayer').classList.remove('hidden');});
  assert(await page.locator('#tavVipRequestAccess').isHidden(),'Administrador não pode ver botão de solicitar acesso');
  await page.waitForSelector('#tavVipAdminOpen:not([hidden])',{timeout:3000});
  await page.locator('#tavVipAdminOpen').click();
  await page.waitForSelector('#tavVipAdminOverlay:not([hidden])');
  assert(await page.locator('#tavVipAdminOverlay').getByText('Amigo').count()>0,'Membro ausente da administração');
  assert(await page.locator('#tavVipAdminOverlay').getByText('Bot da Taverna').count()>0,'Bot ausente da administração');
  assert(await page.locator('.tav-admin-approve').count()===1,'Solicitação VIP não exibida');
  await page.locator('.tav-admin-approve').click();
  assert.equal(await page.locator('.tav-admin-approve').count(),0,'Aprovação não removeu pedido pendente');

  await page.screenshot({path:'qa/screenshots/admin-'+width+'.png'});
  await page.locator('.tav-admin-password').click();
  await page.waitForSelector('.tav-vip-password-sheet:not([hidden])');
  const above=await page.evaluate(()=>{
   const pwd=document.querySelector('.tav-vip-password-sheet'),adm=document.querySelector('#tavVipAdminOverlay');
   return Number(getComputedStyle(pwd).zIndex)>Number(getComputedStyle(adm).zIndex);
  });
  assert(above,'Formulário de senha deve ficar acima do painel VIP');
  await page.locator('.tav-vip-password-sheet').getByRole('button',{name:'Cancelar'}).click();
  await page.locator('.tav-admin-close').click();
  assert(await page.locator('#tavVipAdminOverlay').isHidden(),'Painel VIP não fechou');
  const box=await page.locator('#alphaAccountsBar').boundingBox();
  const panel=await page.locator('#sceneMultiplayer .multiplayer-panel').boundingBox();
  assert(box&&panel&&box.x>=panel.x-1&&box.x+box.width<=panel.x+panel.width+1,'Barra de conta fora do painel '+width);
  await page.evaluate(()=>window.TavernaRemovalNotice());
  assert(await page.locator('#sceneWelcome').isVisible(),'Pessoa removida não retornou às boas-vindas');
  assert(await page.locator('#tavRemovedNotice').isVisible(),'Aviso da remoção ausente');
  assert.match(await page.locator('#tavRemovedNotice').innerText(),/removido.*administrador/i);
  await page.locator('#tavRemovedNotice button').click();
  assert(await page.locator('#tavRemovedNotice').isHidden(),'Aviso não foi dispensado');
  await page.close();
  console.log('VISUAL_VIEWPORT_OK',width);
 }

 // Visitante: sessão existe somente na memória e desaparece ao reabrir o app.
 const guestPage=await browser.newPage({viewport:{width:390,height:844}});
 await guestPage.route('**/api/auth/guest',async route=>{
  const cors={'access-control-allow-origin':'*','access-control-allow-methods':'GET,POST,OPTIONS','access-control-allow-headers':'content-type, authorization'};
  if(route.request().method()==='OPTIONS')return route.fulfill({status:204,headers:cors});
  return route.fulfill({status:201,headers:{...cors,'content-type':'application/json'},body:JSON.stringify({
   token:'temporary-guest-token-of-test',user:{id:'testGuest',username:'guest_session123',role:'guest'}
  })});
 });
 await guestPage.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
 await guestPage.evaluate(()=>{
  localStorage.setItem('taverna-alpha:ultima-versao-lida','alpha-0.4.99.0');
  document.getElementById('alphaInformationOverlay').hidden=true;
 });
 await guestPage.locator('#playerName').fill('');
 await guestPage.locator('#chooseMultiplayer').click();
 await guestPage.waitForSelector('#alphaAccountsOverlay:not([hidden])');
 await guestPage.locator('#alphaAccountGuest').click();
 await guestPage.locator('#alphaAccountsOverlay').waitFor({state:'hidden'});
 assert.deepEqual(await guestPage.evaluate(()=>({
  storedLocal:localStorage.getItem('taverna-alpha-auth-token'),
  storedSession:sessionStorage.getItem('taverna-alpha-auth-token'),
  name:localStorage.getItem('mau2_player_name')
 })),{storedLocal:null,storedSession:null,name:null});
 await guestPage.reload({waitUntil:'domcontentloaded'});
 await guestPage.locator('#chooseMultiplayer').click();
 await guestPage.waitForSelector('#alphaAccountsOverlay:not([hidden])');
 console.log('VISITOR_EPHEMERAL_SESSION_OK');
 await guestPage.close();

 // Uma conta cadastrada já autenticada assume seu username como nome de aventureiro.
 const memberPage=await browser.newPage({viewport:{width:390,height:844}});
 await memberPage.route('**/api/auth/me',async route=>{
  const headers={'access-control-allow-origin':'*','content-type':'application/json'};
  return route.fulfill({status:200,headers,body:JSON.stringify({user:{id:'regular-member',username:'aventureiro_real',role:'player'}})});
 });
 await memberPage.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
 await memberPage.evaluate(()=>{localStorage.setItem('taverna-alpha-auth-token','registered-token-testing');localStorage.setItem('taverna-alpha:ultima-versao-lida','alpha-0.4.99.0')});
 await memberPage.reload({waitUntil:'domcontentloaded'});
 await memberPage.waitForFunction(()=>document.getElementById('playerName')?.value==='aventureiro_real',{timeout:6000});
 assert(await memberPage.locator('#playerName').evaluate(x=>x.readOnly),'Nome autenticado deveria ser fixo');
 await memberPage.locator('#chooseOffline').click();
 assert.equal(await memberPage.locator('#playerName').inputValue(),'aventureiro_real');
 await memberPage.evaluate(()=>{
  window.__vipStatus='none';
  window.TavernaAuth.roomRequest=async(path)=>{
   if(path==='/api/vip/access/status')return {status:window.__vipStatus};
   throw new Error('Requisição não simulada: '+path);
  };
 });
 await memberPage.waitForFunction(()=>document.querySelector('#tavVipRequestAccess')&&!document.querySelector('#tavVipRequestAccess').hidden,{timeout:10000});
 await memberPage.evaluate(()=>{window.__vipStatus='approved'});
 await memberPage.waitForFunction(()=>document.querySelector('#tavVipRequestAccess').hidden,{timeout:10000});
 await memberPage.evaluate(()=>{window.__vipStatus='none'});
 await memberPage.waitForFunction(()=>!document.querySelector('#tavVipRequestAccess').hidden,{timeout:10000});
 await memberPage.evaluate(()=>{window.__vipStatus='pending'});
 await memberPage.waitForFunction(()=>document.querySelector('#tavVipRequestAccess').hidden,{timeout:10000});
 await memberPage.close();
 console.log('REGISTERED_NAME_AUTOFILL_OK');
 console.log('VIP_REQUEST_BUTTON_VISIBILITY_OK');

}finally{await browser.close();}
