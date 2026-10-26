/* Taverna UI: diálogos do próprio jogo, seletores e acabamento sem alterar regras. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const create=(tag,cls,content)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(content!==undefined)e.textContent=content;return e;};
const overlay=create('section','tav-native-sheet');overlay.id='tavNativeSheet';overlay.hidden=true;
overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-labelledby','tavNativeTitle');
const card=create('div','tav-native-card');
const ornament=create('span','tav-native-rune','✦  T A V E R N A  ✦');
const title=create('h2','tav-native-title');title.id='tavNativeTitle';
const desc=create('p','tav-native-desc');
const content=create('div','tav-native-content');
const actions=create('div','tav-native-actions');
card.append(ornament,title,desc,content,actions);overlay.append(card);document.body.append(overlay);
let current=null,previousFocus=null;
function finish(value){
 if(!current)return;
 const resolve=current;current=null;overlay.hidden=true;content.replaceChildren();actions.replaceChildren();
 document.removeEventListener('keydown',onKey,true);
 try{previousFocus?.focus?.({preventScroll:true})}catch{}
 previousFocus=null;resolve(value);
}
function onKey(e){
 if(e.key==='Escape'){e.preventDefault();e.stopPropagation();finish(null);}
 if(e.key==='Tab'&&!overlay.hidden){
  const focusables=Array.from(card.querySelectorAll('button:not([disabled]),input:not([disabled])'));
  if(!focusables.length)return;
  const first=focusables[0],last=focusables[focusables.length-1];
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
 }
}
overlay.addEventListener('click',e=>{if(e.target===overlay)finish(null)});
const button=(label,primary=false)=>{const b=create('button','tav-native-btn'+(primary?' primary':''),label);b.type='button';return b};
function open(opts){
 if(current)return Promise.resolve(null);
 return new Promise(resolve=>{
  current=resolve;previousFocus=document.activeElement;
  title.textContent=opts.title||'A Taverna pergunta';
  desc.textContent=opts.message||'';desc.hidden=!opts.message;
  content.replaceChildren();actions.replaceChildren();overlay.hidden=false;
  if(opts.options){
   const grid=create('div','tav-native-options');content.append(grid);
   for(const option of opts.options){
    const b=button(option.label,option.value===opts.value);
    b.classList.add('tav-native-option');b.setAttribute('aria-pressed',String(option.value===opts.value));
    b.onclick=()=>finish(option.value);
    grid.append(b);
   }
  }
  if(opts.shareText!==undefined){
   const label=create('label','tav-native-share-label','Convite da sala');label.setAttribute('for','tavNativeShare');
   const input=create('input','tav-native-share');input.id='tavNativeShare';input.readOnly=true;input.value=opts.shareText;input.autocomplete='off';
   input.addEventListener('focus',()=>input.select());
   content.append(label,input);
   const copy=button('Copiar convite',true);
   copy.onclick=async()=>{try{await navigator.clipboard.writeText(input.value);toast('Convite copiado');finish(true)}
    catch{input.focus();input.select();toast('Selecione e copie o endereço')}};
   actions.append(copy);
  }
  if(!opts.shareText&&!opts.options){
   const cancel=button(opts.cancelLabel||'Cancelar');cancel.onclick=()=>finish(false);
   const ok=button(opts.confirmLabel||'Confirmar',true);
   if(opts.danger)ok.classList.add('danger');
   ok.onclick=()=>finish(true);actions.append(cancel,ok);
  }else{
   const cancel=button(opts.options?'Fechar':'Concluído');cancel.onclick=()=>finish(null);actions.prepend(cancel);
  }
  document.addEventListener('keydown',onKey,true);
  (content.querySelector('.tav-native-option[aria-pressed="true"]')||
    actions.querySelector('.primary')||actions.querySelector('button'))?.focus();
 });
}
const toastElement=create('div','tav-native-toast');toastElement.setAttribute('role','status');
toastElement.setAttribute('aria-live','polite');toastElement.hidden=true;document.body.append(toastElement);
let toastTimer=0;
function toast(message){
 clearTimeout(toastTimer);toastElement.textContent=message;toastElement.hidden=false;
 toastTimer=setTimeout(()=>{toastElement.hidden=true},2800);
}
const ui=Object.freeze({
 confirm:({title,message,confirmLabel,cancelLabel,danger}={})=>open({title,message,confirmLabel,cancelLabel,danger}),
 choose:(title,options,value)=>open({title,options,value}),
 share:text=>open({title:'Convite da Taverna',message:'Compartilhe o endereço abaixo.',shareText:String(text)}),
 toast
});
window.TavernaUI=ui;

// O jogo continua lendo os próprios <select>; o botão é só uma representação visual.
for(const id of ['playerCount','difficulty','alphaReportType']){
 const select=$(id);if(!select||select.dataset.tavCustom==='1')continue;
 select.dataset.tavCustom='1';select.classList.add('tav-select-source');select.tabIndex=-1;
 const trigger=create('button','tav-choice-trigger');trigger.type='button';
 trigger.id=id+'Choice';trigger.setAttribute('aria-label',select.getAttribute('aria-label')||'Escolher opção');
 const sync=()=>{
  const choice=Array.from(select.options).find(o=>o.value===select.value);
  trigger.textContent=(choice?.textContent||'Escolher')+'  ▾';
  trigger.disabled=select.disabled;
 };
 select.insertAdjacentElement('afterend',trigger);
 async function choose(){
  if(select.disabled)return;
  const options=Array.from(select.options).filter(o=>!o.disabled).map(o=>({label:o.textContent.trim(),value:o.value}));
  if(!options.length){toast('Nenhuma opção disponível');return}
  const label=document.querySelector('label[for="'+id+'"]');
  const result=await ui.choose(label?.textContent?.trim()||'Escolha na Taverna',options,select.value);
  if(result===null)return;
  if(select.value!==result){select.value=result;select.dispatchEvent(new Event('change',{bubbles:true}));select.dispatchEvent(new Event('input',{bubbles:true}))}
  sync();
 }
 trigger.addEventListener('click',choose);
 const label=document.querySelector('label[for="'+id+'"]');
 label?.addEventListener('click',e=>{e.preventDefault();choose()});
 select.addEventListener('change',sync);
 if(typeof MutationObserver==='function'){new MutationObserver(sync).observe(select,{childList:true,subtree:true,attributes:true,attributeFilter:['disabled','selected']})}
 sync();
}
const scene=$('sceneMultiplayer'),lobby=$('onlineLobby');
if(scene){
 scene.classList.add('tav-mp-premium');
 const createRoom=$('onlineCreate'),join=$('onlineJoin'),code=$('onlineRoomCode');
 if(createRoom){createRoom.textContent='✦  Criar sala';createRoom.title='Criar uma nova mesa para convidar amigos'}
 if(join){join.textContent='Entrar';join.title='Entrar na mesa pelo código'}
 if(code){code.placeholder='CÓDIGO';code.inputMode='text';code.autocapitalize='characters';code.setAttribute('aria-label','Código de seis caracteres da sala')}
 const eyebrow=scene.querySelector('.multiplayer-eyebrow');
 if(eyebrow)eyebrow.textContent='✦  ENCONTROS DA TAVERNA  ✦';
 const header=scene.querySelector('#multiplayerTitle');
 if(header)header.textContent='Escolha sua mesa';
 const back=$('multiplayerBackBtn');
 if(back){back.textContent='←  Voltar';back.title='Voltar ao início'}
 const leave=$('onlineLeave');
 if(leave){
  let acknowledged=false;
  leave.addEventListener('click',async e=>{
   if(acknowledged||!lobby||lobby.classList.contains('hidden'))return;
   e.preventDefault();e.stopImmediatePropagation();
   const approved=await ui.confirm({title:'Sair da sala?',message:'Você deixará esta mesa. Os outros jogadores poderão continuar.',confirmLabel:'Sair da sala',danger:true});
   if(!approved)return;
   acknowledged=true;
   try{leave.click()}finally{acknowledged=false}
  },true);
 }
}
})();