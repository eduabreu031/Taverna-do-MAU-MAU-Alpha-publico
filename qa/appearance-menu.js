/* Configurações de Aparência — não altera autenticação, jogos, sockets nem áudio. */
(()=>{'use strict';
const service=window.TavernaThemeSystem;
if(!service)return;
const doc=document;
const targets=[
 ['sceneWelcome','#alphaTopTools'],
 ['sceneMenu','.offline-setup-heading'],
 ['sceneMultiplayer','.multiplayer-panel'],
 ['sceneGame','.game-header']
];
const menu=doc.createElement('section');
menu.id='tavAppearanceOverlay';menu.hidden=true;
menu.setAttribute('role','dialog');menu.setAttribute('aria-modal','true');
menu.setAttribute('aria-labelledby','tavAppearanceTitle');
menu.innerHTML='<div class="tav-appearance-card">'+
 '<div class="tav-appearance-head"><div><small>✦ TAVERNA DO MAU MAU ✦</small><h2 id="tavAppearanceTitle">Aparência</h2></div>'+
 '<button type="button" class="tav-appearance-close" aria-label="Fechar aparência">×</button></div>'+

 '<div class="tav-appearance-options" role="group" aria-label="Escolher paleta de cores"></div>'+


 '<button type="button" class="tav-appearance-finish">Concluir</button></div>';
doc.body.append(menu);
const buttons=[];
for(const [sceneId,selector] of targets){
 const scene=doc.getElementById(sceneId),parent=scene?.querySelector(selector);
 if(!scene||!parent)continue;
 const b=doc.createElement('button');
 b.type='button';b.className='tav-appearance-trigger';
 b.textContent='🎨';b.title='Escolher aparência';b.setAttribute('aria-label','Escolher aparência');
 b.setAttribute('aria-haspopup','dialog');
 b.setAttribute('aria-controls','tavAppearanceOverlay');
 parent.appendChild(b);buttons.push(b);
 b.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();open(b);});
}
const group=menu.querySelector('.tav-appearance-options');
const choices=service.getChoices();
const paletteButtons=[];
for(const palette of choices){
 const b=doc.createElement('button');b.type='button';
 b.className='tav-palette-option';b.dataset.palette=palette.id;
 const swatch=doc.createElement('span');swatch.className='tav-palette-swatch';swatch.setAttribute('aria-hidden','true');
 const copy=doc.createElement('span');copy.className='tav-palette-copy';
 const name=doc.createElement('strong');name.textContent=palette.label;
 const detail=doc.createElement('small');detail.textContent=palette.description;
 copy.append(name,detail);
 const tick=doc.createElement('span');tick.className='tav-palette-check';tick.textContent='✓';tick.setAttribute('aria-hidden','true');
 b.append(swatch,copy,tick);
 group.append(b);paletteButtons.push(b);
 b.addEventListener('click',()=>{service.setPalette(palette.id);update();});
}
let previousFocus=null;
const escape=(e)=>{if(e.key==='Escape'&&!menu.hidden){e.stopPropagation();close();}};
function update(){
 const selected=service.getPalette();
 for(const b of paletteButtons){
  const active=b.dataset.palette===selected.id;
  b.classList.toggle('selected',active);
  b.setAttribute('aria-pressed',String(active));
 }

}
function open(trigger){
 previousFocus=trigger||doc.activeElement;
 update();menu.hidden=false;menu.querySelector('.tav-appearance-close').focus();
}
function close(){
 menu.hidden=true;
 if(previousFocus?.isConnected)previousFocus.focus();
 previousFocus=null;
}
menu.querySelector('.tav-appearance-close').addEventListener('click',close);
menu.querySelector('.tav-appearance-finish').addEventListener('click',close);
menu.addEventListener('click',e=>{if(e.target===menu)close();});
doc.addEventListener('keydown',escape);
window.addEventListener('taverna-theme-change',update);
update();
// Espelhos amigáveis para QA, sem incluir credenciais nem expor ações do motor.
window.TavernaAppearance=Object.freeze({open:()=>open(null),close,availableButtons:()=>buttons.length});
})();