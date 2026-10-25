import {chromium} from 'playwright';
import assert from 'node:assert/strict';

const ids=['neon-forge','neon-abyss','neon-forest','neon-porcelain'];
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 for(const width of [390,1024]){
  const context=await browser.newContext({viewport:{width,height:844},deviceScaleFactor:1});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>!!window.TavernaThemeSystem&&!!window.TavernaAppearance);
  const themes=await page.evaluate(()=>window.TavernaThemeSystem.getChoices());
  assert.equal(themes.length,12,'A prévia deve permitir alternar entre os 12 temas');
  for(const name of ['Forja dos Dragões','Reino Abissal','Bosque dos Sussurros','Solar de Porcelana'])
    assert(themes.some(t=>t.label===name),'Novo tema não aparece no menu: '+name);
  const existing=await page.evaluate(()=>{
    window.TavernaThemeSystem.setPalette('classic');
    return getComputedStyle(document.querySelector('#sceneWelcome .welcome-panel')).backgroundImage;
  });
  const signatures=new Set(),backs=new Set(),scenes=new Set();
  for(const id of ids){
   const data=await page.evaluate(async id=>{
     window.TavernaThemeSystem.setPalette(id);
     const r=document.documentElement;
     const get=s=>document.querySelector(s);
     const computed=s=>getComputedStyle(get(s));
     const probe=document.createElement('div');
     probe.innerHTML='<div class="big-card card-back"><div class="coat"></div></div><div class="card-face"><div class="orn"></div></div>';
     document.body.appendChild(probe);
     const back=getComputedStyle(probe.querySelector('.card-back'));
     const face=getComputedStyle(probe.querySelector('.card-face'));
     const before=getComputedStyle(probe.querySelector('.card-back'),'::before').content;
     probe.remove();
     const assets=[];
     for(const dir of ['theme-backdrops','theme-decks']){
      const uri='./'+dir+'/'+id+'.svg',res=await fetch(uri);
      const body=await res.text(),img=new Image();img.src=uri;
      let loaded=true;try{await img.decode()}catch{loaded=false}
      assets.push({uri,ok:res.ok&&loaded,bytes:body.length,svg:body.includes('<svg'),
       width:img.naturalWidth,height:img.naturalHeight});
     }
     return {id,palette:r.getAttribute('data-tav-palette'),
       options:window.TavernaThemeSystem.getChoices().length,
       menu:computed('#sceneWelcome .welcome-panel').backgroundImage,
       scene:computed('#sceneWelcome').backgroundImage,
       table:computed('#sceneGame #tableShell>.felt').backgroundImage,
       rack:computed('#sceneGame #humanZone').backgroundImage,
       action:computed('#sceneGame .action-list').backgroundImage,
       controls:computed('#sceneGame .control-bar').backgroundImage,
       paper:face.backgroundImage,cardback:back.backgroundImage,before,
       mediaFilter:computed('#sceneWelcome .welcome-panel').backdropFilter,
       assets};
   },id);
   assert.equal(data.palette,id,'O tema selecionado deve persistir: '+id);
   assert.equal(data.options,12);
   assert(data.scene.includes('theme-backdrops/'+id+'.svg'),'Cenário próprio não aplicado: '+id);
   assert(data.menu.includes('gradient'),'Material do menu não aplicado: '+id);
   assert.notEqual(data.menu,existing,'O painel usa acabamento clássico: '+id);
   assert(data.table.includes('gradient')&&!data.table.includes('repeating-linear-gradient'),
     'Feltro ou mesa sem material próprio: '+id);
   assert(data.rack.includes('gradient'),'Bandeja da mão sem material próprio: '+id);
   assert.equal(data.action,'none','Há placa atrás de MAU MAU / OPA!!!: '+id);
   assert.equal(data.controls,'none','Faixa escura atrás dos controles: '+id);
   assert(data.paper.includes('gradient'),'Frente da carta não está no tema: '+id);
   assert(data.cardback.includes('theme-decks/'+id+'.svg'),'Verso SVG não aplicado: '+id);
   assert.equal(data.before,'none','Desenho genérico duplicado no verso: '+id);
   assert(data.assets.every(a=>a.ok&&a.svg&&a.bytes<4200),'SVG fora do orçamento: '+JSON.stringify(data.assets));
   assert(data.assets[1].width===240&&data.assets[1].height===336,'Carta SVG com dimensões incorretas: '+id);
   if(width<=390)assert.equal(data.mediaFilter,'none','Efeito de blur caro no celular: '+id);
   signatures.add(data.table);scenes.add(data.scene);backs.add(data.cardback);
   await page.evaluate(()=>window.TavernaThemeSystem.setPalette('classic'));
   assert.equal(await page.evaluate(()=>getComputedStyle(document.querySelector('#sceneWelcome .welcome-panel')).backgroundImage),existing,
     'Taverna Clássica não volta ao original após '+id);
   console.log('FOUR_THEME_PASS',width,id,data.assets.map(a=>a.bytes));
  }
  assert.equal(signatures.size,4,'Quatro mesas precisam de materiais diferentes');
  assert.equal(scenes.size,4,'Quatro fundos precisam ser diferentes');
  assert.equal(backs.size,4,'Quatro versos precisam ser diferentes');
  if(width===390){
   await page.evaluate(()=>window.TavernaEntrance?.skipVisualOnly?.());
   await page.locator('#chooseOffline').click({timeout:5000});
   for(const id of ids){
    await page.evaluate(id=>window.TavernaThemeSystem.setPalette(id),id);
    await page.screenshot({path:'/tmp/tav-four-'+id+'.png'});
   }
  }
  assert.deepEqual(errors,[],'Erro JS durante troca de tema: '+errors.join('; '));
  console.log('FOUR_PREVIEW_BROWSER_OK',width);
  await context.close();
 }
}finally{await browser.close()}
