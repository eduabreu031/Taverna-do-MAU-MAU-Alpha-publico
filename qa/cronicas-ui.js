/* Crônicas da Taverna — Fase 3C, interface privada; sem tocar no gameplay. */
(()=>{'use strict';
if(window.TavernaCronicas||document.getElementById('tavCronicasOverlay'))return;
const CATALOG=/*TAV_CRONICAS_CATALOG*/ null;
const API='https://taverna-multiplayer-servidor.edulopes941.workers.dev';
const ORDERS=[
 {id:'corvos',name:'Ordem dos Corvos',mark:'◈',desc:'OPA!!!, MAU MAU e malandragens desmascaradas'},
 {id:'laminas',name:'Ordem das Lâminas',mark:'⚔',desc:'Inversões, pulos, naipes e combinações'},
 {id:'errantes',name:'Ordem dos Errantes',mark:'✧',desc:'Jornadas pelas mesas da Taverna'},
 {id:'reis',name:'Ordem dos Reis',mark:'♛',desc:'Vitórias, duelos e grandes salões'}
];
const ORDER_REWARDS=['Título','Emblema','Moldura','Baralho'];
const labels={estrategista:'Estrategista',trapaceiro:'Trapaceiro',conquistador:'Conquistador',aventureiro:'Aventureiro'};
const tiers={bronze:'Bronze',prata:'Prata',ouro:'Ouro',lendaria:'Lendária'};
const doc=document;
const overlay=doc.createElement('section');
overlay.id='tavCronicasOverlay';overlay.hidden=true;
overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');
overlay.setAttribute('aria-labelledby','tavCronicasTitle');
overlay.innerHTML=
 '<div class="tav-cronicas-panel">'+
  '<header class="tav-cronicas-header"><div><small>✦ REGISTROS DA TAVERNA ✦</small>'+
   '<h2 id="tavCronicasTitle">Crônicas da Taverna</h2>'+
   '<p>Seu legado, suas conquistas e as Ordens de Maestria.</p></div>'+
   '<button type="button" id="tavCronicasClose" class="tav-cronicas-close" aria-label="Fechar Crônicas">×</button></header>'+
  '<div id="tavCronicasStatus" role="status" aria-live="polite"></div>'+
  '<nav class="tav-cronicas-tabs" aria-label="Seções das Crônicas">'+
   '<button type="button" data-cronicas-tab="overview" aria-pressed="true">Resumo</button>'+
   '<button type="button" data-cronicas-tab="achievements" aria-pressed="false">Livro das Glórias</button>'+
   '<button type="button" data-cronicas-tab="orders" aria-pressed="false">Ordens</button>'+
  '</nav>'+
  '<div id="tavCronicasView" class="tav-cronicas-body"></div>'+
  '<footer class="tav-cronicas-footer"><span>Glória não se compra. Dobrões e cosméticos não afetam as partidas.</span>'+
   '<button type="button" id="tavCronicasRefresh">Atualizar dados</button></footer>'+
 '</div>';
doc.body.append(overlay);
const qs=selector=>overlay.querySelector(selector);
const view=qs('#tavCronicasView'),status=qs('#tavCronicasStatus');
let active='overview',previousFocus=null,requestIndex=0,busy=false;
let profile=null,book=null,orders=null,notice='',filterCategory='all',filterTier='all',shown=12;
const triggers=[];
const previewCatalog=Object.freeze(CATALOG.achievements.map(item=>Object.freeze(item)));
const achievementIds=new Set(previewCatalog.map(a=>a.id));
function node(tag,className,text){
 const element=doc.createElement(tag);
 if(className)element.className=className;
 if(text!==undefined)element.textContent=String(text);
 return element;
}
function elementButton(text,className,callback){
 const button=node('button',className,text);
 button.type='button';button.addEventListener('click',callback);return button;
}
function safeNumber(value){return Number.isSafeInteger(value)&&value>=0?value:null;}
function number(value){return safeNumber(value)===null?'—':Number(value).toLocaleString('pt-BR');}
function authenticated(){const u=window.TavernaAuth?.getUser?.();return u&&u.role!=='guest'&&!!window.TavernaAuth?.getToken?.()?u:null;}
function setStatus(message='',state='info'){status.textContent=message;status.dataset.state=state;status.hidden=!message;}
function showError(message){notice=message;setStatus(message,'warning');}
async function jsonGet(endpoint,token){
 const response=await fetch(API+endpoint,{method:'GET',headers:{authorization:'Bearer '+token},cache:'no-store'});
 if(!response.ok){const err=Error(response.status===404?'NOT_ENABLED':'HTTP '+response.status);
  err.status=response.status;throw err;}
 return response.json();
}
async function refresh(){
 const index=++requestIndex;
 if(busy)return;
 const account=authenticated();
 profile=null;book=null;orders=null;
 if(!account){showError('Entre com uma conta cadastrada para consultar progresso confirmado. Visitantes podem explorar as metas.');render();return;}
 const token=window.TavernaAuth.getToken();
 busy=true;setStatus('Consultando registros confirmados da sua conta…');render();
 try{
  const results=await Promise.allSettled([
   jsonGet('/api/cronicas/me',token),
   jsonGet('/api/cronicas/achievements',token),
   jsonGet('/api/cronicas/orders',token)
  ]);
  if(index!==requestIndex)return;
  const [p,b,o]=results;
  profile=p.status==='fulfilled'?p.value?.profile:null;
  const possibleBook=b.status==='fulfilled'?b.value?.book:null;
  book=possibleBook&&Array.isArray(possibleBook.achievements)?possibleBook:null;
  const possibleOrders=o.status==='fulfilled'?o.value?.book:null;
  orders=possibleOrders&&Array.isArray(possibleOrders.orders)?possibleOrders:null;
  if(profile||book||orders){setStatus('Dados confirmados pelo servidor. Recompensas cosméticas ainda em desenvolvimento.','ok');}
  else{
   const first=[p,b,o].find(x=>x.status==='rejected')?.reason;
   showError(first?.status===401?'Sua sessão expirou. Entre novamente na conta.':
    'Crônicas ainda não estão habilitadas no servidor. As metas abaixo são uma prévia, sem progresso inventado.');
  }
 }catch{if(index===requestIndex)showError('Não foi possível consultar as Crônicas agora.');}
 finally{if(index===requestIndex){busy=false;render();}}
}
function currentProgress(){
 const list=Array.isArray(book?.achievements)?book.achievements:[];
 const byId=new Map(list.filter(a=>achievementIds.has(a.id)).map(a=>[a.id,a]));
 return previewCatalog.map(a=>{
  const saved=byId.get(a.id);
  const progress=safeNumber(saved?.progress);
  return {...a,progress,unlocked:!!saved?.unlocked,verified:progress!==null};
 });
}
function metricCard(parent,title,value,hint){
 const c=node('section','tav-cronicas-metric');
 c.append(node('small','',title),node('strong','',value),node('span','',hint));
 parent.append(c);
}
function title(parent,head,sub){
 const h=node('h3','',head);parent.append(h);
 if(sub)parent.append(node('p','tav-cronicas-intro',sub));
}
function overview(){
 const wrap=node('div','tav-cronicas-overview');
 title(wrap,'Seu legado','A Glória é permanente. Dobrões são cosméticos e só aparecerão quando a economia for liberada.');
 const row=node('div','tav-cronicas-metrics');
 metricCard(row,'GLÓRIA',book?number(book.glory)+' / 1.000 G':'— / 1.000 G','60 conquistas de base');
 metricCard(row,'TROFÉUS',book?number(book.unlockedCount)+' / 60':'— / 60','Rumo à Lenda da Taverna');
 metricCard(row,'RENOME',profile?.renown?('Nível '+number(profile.renown.level)):'—','Até nível 50');
 metricCard(row,'DOBRÕES',profile?number(profile.dobroes):'—','Saldo do servidor; compras indisponíveis');
 wrap.append(row);
 const platinum=node('section','tav-cronicas-platinum');
 platinum.append(node('span','tav-cronicas-platinum-icon','♛'));
 const copy=node('div');
 copy.append(node('strong','', 'Lenda da Taverna'),
  node('p','','Complete as 60 conquistas para alcançar o marco supremo. A Platina não soma G extras.'));
 copy.append(node('small','',book?.platinum?.unlocked?'Desbloqueada e confirmada':
  'Platina: progresso '+(book?number(book.unlockedCount)+'/60':'indisponível')));
 platinum.append(copy);wrap.append(platinum);
 const note=node('p','tav-cronicas-note',
  'Títulos, baralhos e molduras das Ordens são marcos planejados. Nenhum item é liberado ou cobrado nesta prévia.');
 wrap.append(note);
 wrap.append(elementButton('Consultar as 60 conquistas','tav-cronicas-primary',()=>switchTab('achievements')));
 return wrap;
}
function categoryOptions(){
 const bar=node('div','tav-cronicas-filters');
 const labelCat=node('label','', 'Caminho');
 const category=node('select');category.id='tavCronicasCategory';
 for(const [value,text] of Object.entries({all:'Todos',...labels})){
  const op=node('option','',text);op.value=value;category.append(op);
 }
 category.value=filterCategory;
 category.addEventListener('change',()=>{filterCategory=category.value;shown=12;render();});
 labelCat.append(category);
 const labelTier=node('label','', 'Raridade');
 const tier=node('select');tier.id='tavCronicasTier';
 for(const [value,text] of Object.entries({all:'Todas',...tiers})){
  const op=node('option','',text);op.value=value;tier.append(op);
 }
 tier.value=filterTier;tier.addEventListener('change',()=>{filterTier=tier.value;shown=12;render();});
 labelTier.append(tier);
 bar.append(labelCat,labelTier);return bar;
}
function achievements(){
 const wrap=node('div','tav-cronicas-achievements');
 title(wrap,'Livro das Glórias','36 Bronze · 16 Prata · 6 Ouro · 2 Lendárias. Exatamente 1.000 G possíveis.');
 wrap.append(categoryOptions());
 const all=currentProgress().filter(a=>(filterCategory==='all'||a.category===filterCategory)&&
  (filterTier==='all'||a.tier===filterTier));
 wrap.append(node('p','tav-cronicas-results',all.length+' conquistas encontradas'));
 const cards=node('div','tav-cronicas-achievement-grid');
 for(const item of all.slice(0,shown)){
  const c=node('article','tav-cronicas-achievement');
  c.dataset.tier=item.tier;
  if(item.unlocked)c.classList.add('tav-cronicas-unlocked');
  const top=node('div','tav-cronicas-achievement-top');
  top.append(node('span','tav-cronicas-rarity',tiers[item.tier]),
   node('span','tav-cronicas-glory','+'+item.glory+' G'));
  c.append(top,node('strong','',item.title),
   node('small','',labels[item.category]+' · '+item.id));
  const footer=node('div','tav-cronicas-progress');
  const bar=node('div','tav-cronicas-progress-bar');
  const fill=node('span');fill.style.width=item.verified?
   Math.max(0,Math.min(100,100*item.progress/item.goal))+'%':'0%';
  bar.append(fill);
  footer.append(bar,node('span','',item.verified?number(item.progress)+' / '+number(item.goal):'— / '+number(item.goal)));
  c.append(footer,node('em','',item.unlocked?'Conquista confirmada':
   item.verified?'Em andamento':'Aguardando verificação'));
  cards.append(c);
 }
 wrap.append(cards);
 if(all.length>shown)wrap.append(elementButton('Mostrar mais conquistas ('+(all.length-shown)+')',
  'tav-cronicas-more',()=>{shown+=12;render();}));
 return wrap;
}
function ordersView(){
 const wrap=node('div','tav-cronicas-orders');
 title(wrap,'Quatro Ordens de Maestria','Todas evoluem em paralelo. Escolher uma Ordem ativa não apaga progresso das outras.');
 const cards=node('div','tav-cronicas-order-grid');
 const byId=new Map((orders?.orders||[]).map(o=>[o.id,o]));
 for(const meta of ORDERS){
  const data=byId.get(meta.id);
  const current=data?.points;
  const level=safeNumber(data?.level);
  const c=node('article','tav-cronicas-order');
  const head=node('div','tav-cronicas-order-head');
  head.append(node('span','tav-cronicas-order-mark',meta.mark));
  const name=node('div');name.append(node('strong','',meta.name),node('p','',meta.desc));head.append(name);
  c.append(head);
  const advance=node('div','tav-cronicas-order-level');
  advance.append(node('strong','',level===null?'Nível — / 20':'Nível '+level+' / 20'),
   node('span','',current===undefined?'Pontos indisponíveis':number(current)+' pontos'));
  c.append(advance);
  const milestones=node('div','tav-cronicas-milestones');
  [5,10,15,20].forEach((rank,i)=>{
   const m=node('span','',rank+' · '+ORDER_REWARDS[i]);m.title='Recompensa cosmética planejada';
   milestones.append(m);
  });
  c.append(milestones);
  const equipped=orders?.activeOrder===meta.id;
  const choose=elementButton(equipped?'Ordem ativa':!orders?'Escolha indisponível':'Escolher esta Ordem',
   'tav-cronicas-order-select',()=>selectOrder(meta.id));
  choose.disabled=!orders||busy||equipped;
  choose.setAttribute('aria-pressed',String(equipped));
  c.append(choose);cards.append(c);
 }
 wrap.append(cards,node('p','tav-cronicas-note','Os quatro baralhos especiais das Ordens ainda não foram produzidos ou disponibilizados para equipar.'));
 return wrap;
}
async function selectOrder(id){
 if(busy||!orders||!ORDERS.some(o=>o.id===id)||!authenticated())return;
 const token=window.TavernaAuth.getToken();
 busy=true;render();setStatus('Salvando Ordem ativa…');
 try{
  const response=await fetch(API+'/api/cronicas/orders/activate',{method:'POST',
   headers:{authorization:'Bearer '+token,'content-type':'application/json'},
   cache:'no-store',body:JSON.stringify({orderId:id})});
  if(!response.ok)throw Error('API '+response.status);
  const data=await response.json();
  if(!data.book||!Array.isArray(data.book.orders))throw Error('INVALID_ORDERS');
  orders=data.book;setStatus('Ordem escolhida. Seu progresso nas demais foi preservado.','ok');
 }catch{showError('Não foi possível salvar esta Ordem. Nenhum progresso foi alterado na interface.');}
 finally{busy=false;render();}
}
function render(){
 for(const b of overlay.querySelectorAll('[data-cronicas-tab]'))
  b.setAttribute('aria-pressed',String(b.dataset.cronicasTab===active));
 view.replaceChildren(active==='orders'?ordersView():active==='achievements'?achievements():overview());
 qs('#tavCronicasRefresh').disabled=busy;
}
function switchTab(next){
 if(!['overview','achievements','orders'].includes(next))return;
 active=next;render();
 view.scrollTop=0;
}
function open(trigger){
 if(!overlay.hidden)return;
 previousFocus=trigger||doc.activeElement;
 active='overview';overlay.hidden=false;
 setStatus('');render();qs('#tavCronicasClose').focus();
 refresh();
}
function close(){
 if(overlay.hidden)return;
 ++requestIndex;busy=false;
 overlay.hidden=true;profile=null;book=null;orders=null;
 if(previousFocus?.isConnected)previousFocus.focus();
 previousFocus=null;
}
function trap(event){
 if(overlay.hidden)return;
 if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close();return;}
 if(event.key!=='Tab')return;
 const focusable=[...overlay.querySelectorAll('button:not(:disabled),select:not(:disabled)')]
  .filter(el=>!el.hidden&&el.offsetParent!==null);
 if(!focusable.length)return;
 const first=focusable[0],last=focusable.at(-1);
 if(event.shiftKey&&doc.activeElement===first){event.preventDefault();last.focus();}
 if(!event.shiftKey&&doc.activeElement===last){event.preventDefault();first.focus();}
}
qs('#tavCronicasClose').addEventListener('click',close);
qs('#tavCronicasRefresh').addEventListener('click',refresh);
for(const b of overlay.querySelectorAll('[data-cronicas-tab]'))
 b.addEventListener('click',()=>switchTab(b.dataset.cronicasTab));
overlay.addEventListener('click',event=>{if(event.target===overlay)close();});
doc.addEventListener('keydown',trap);
function install(sceneSelector,locationSelector){
 const scene=doc.querySelector(sceneSelector),parent=scene?.querySelector(locationSelector);
 if(!parent)return;
 const button=elementButton('✦ Crônicas','tav-cronicas-trigger',()=>open(button));
 button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-controls','tavCronicasOverlay');
 parent.append(button);triggers.push(button);
}
install('#sceneWelcome','#alphaTopTools');
install('#sceneMenu','.offline-setup-heading');
window.TavernaCronicas=Object.freeze({
 open:()=>open(null),close,refresh,
 availableButtons:()=>triggers.length,
 isOpen:()=>!overlay.hidden,
 catalogSize:()=>previewCatalog.length
});
})();