/* Menu de boas-vindas: identidade da conta + três escolhas compactas.
   Não altera navegação, autenticação, motor ou elementos da mesa. */
(()=>{'use strict';
const root=document.getElementById('sceneWelcome');
const field=document.getElementById('playerName');
const ids=['chooseOffline','chooseMultiplayer','chooseRules'];
const buttons=ids.map(id=>document.getElementById(id));
if(!root||!field||buttons.some(b=>!b))return;
const group=buttons[0].parentElement;
if(group&&buttons.every(b=>b.parentElement===group)){
 group.classList.add('tav-welcome-modes-column');
 for(const b of buttons)group.appendChild(b); // Ordem exata: Offline, Multiplayer, Regras
}
const captions=['Jogar offline','Multiplayer','Regras & Malandragens'];
buttons.forEach((b,i)=>{
 b.classList.add('tav-welcome-mode-compact');
 b.querySelectorAll('small,.mode-footer').forEach(x=>x.hidden=true);
 const strong=b.querySelector('strong');if(strong)strong.textContent=captions[i];
});
const authenticLabel=field.closest('label')||root.querySelector('label[for="playerName"]');
// Nunca esconder o pai do campo: ele também contém os botões do menu.
// NUNCA substituir textContent de um contêiner: isso remove seus botões e inputs.
const greeting=Array.from(root.querySelectorAll('h1,h2,h3,p,span,strong'))
 .find(e=>e.children.length===0&&/seja bem.vindo/i.test(e.textContent||''))||null;
const originalGreeting=greeting?.textContent||'';
function update(){
 const u=window.TavernaAuth?.getUser?.();
 const signed=!!u&&u.role!=='guest'&&!!u.username;
 root.classList.toggle('tav-welcome-account',signed);
 if(greeting){
  const txt=signed?'Seja bem-vindo, '+u.username+'!':originalGreeting;
  if(greeting.textContent!==txt)greeting.textContent=txt;
 }
 // Ocultar somente o input e a label exata, sem afetar seus ancestrais.
 field.classList.toggle('tav-welcome-name-disabled',signed);
 if(authenticLabel)authenticLabel.classList.toggle('tav-welcome-name-disabled',signed);
 field.readOnly=signed;
 if(signed&&field.value!==u.username){
  field.value=u.username;field.dispatchEvent(new Event('change',{bubbles:true}));
 }
}
window.addEventListener('taverna-interior-entered',update);
window.addEventListener('pageshow',update);
field.addEventListener('change',update);
const observer=new MutationObserver(()=>{
 if(!root.classList.contains('hidden'))update();
});
observer.observe(root,{attributes:true,attributeFilter:['class']});
update();
window.TavernaWelcomeLayout={refresh:update};
})();