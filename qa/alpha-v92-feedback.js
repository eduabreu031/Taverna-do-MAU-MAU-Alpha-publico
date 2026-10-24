/* Taverna do MAU MAU — Alpha v92: modais informativos e encaminhamento de relatos, sem alterar o motor. */
(()=>{'use strict';
const DATA=/*ALPHA_RELEASES_JSON*/;
const current=DATA.entries.find(e=>e.id===DATA.current);
const welcome=document.getElementById('sceneWelcome');
if(!welcome||!current)return;
const SEEN_KEY='taverna-alpha:ultima-versao-lida';
const $=id=>document.getElementById(id);
const tools=document.createElement('div');
tools.id='alphaTopTools';tools.setAttribute('aria-label','Informações e feedback da Alpha');
tools.innerHTML='<button type="button" id="alphaOpenNews" title="Novidades da versão" aria-label="Novidades da Taverna">📜</button><button type="button" id="alphaOpenFeedback" title="Reportar bug ou sugerir melhoria" aria-label="Reportar bug ou sugerir melhoria">🐞</button>';
welcome.appendChild(tools);
const version=document.createElement('span');
version.id='alphaVersionStamp';version.textContent=current.label+' · testes públicos';
welcome.appendChild(version);
const overlay=document.createElement('section');
overlay.id='alphaInformationOverlay';overlay.className='alpha-information-overlay';
overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-labelledby','alphaInformationTitle');
overlay.hidden=true;document.body.appendChild(overlay);
let opened=null,previousFocus=null;
function safeSeen(){try{return localStorage.getItem(SEEN_KEY)}catch{return null}}
function recordSeen(){try{localStorage.setItem(SEEN_KEY,current.id)}catch{}}
function openModal(kind){
 if(!welcome||welcome.classList.contains('hidden'))return;
 opened=kind;previousFocus=document.activeElement;overlay.hidden=false;
 overlay.innerHTML=kind==='news'?renderNews():renderFeedback();
 const close=$('alphaModalClose');
 close?.addEventListener('click',closeModal);
 if(kind==='feedback')attachFeedback();
 overlay.querySelector('button,input,select')?.focus();
}
function closeModal(){
 if(opened==='news')recordSeen();
 opened=null;overlay.hidden=true;overlay.replaceChildren();
 if(previousFocus?.isConnected)previousFocus.focus();
 previousFocus=null;
}
function themeNotice(){
 const state=window.TavernaThemeSystem?.getStatus();
 if(!state?.active)return '';
 const safe=value=>String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 const until=window.TavernaThemeSystem.displayDate(state.endsAt);
 return '<div class="alpha-theme-notice" role="status"><strong>✦ TESTE DE TEMAS EM ANDAMENTO ✦</strong>'+
 '<p>'+safe(state.notice)+'</p>'+
 '<small>O evento termina automaticamente em '+safe(until)+' (Brasília). A paleta escolhida pelo jogador será preservada, assim como partidas e funcionalidades.</small></div>';
}
function renderNews(){
 return '<div class="alpha-info-card" tabindex="-1"><div class="alpha-info-head"><span class="alpha-kicker">✦ MENSAGEM DO ARAUTO ✦</span><button type="button" class="alpha-dismiss" id="alphaModalClose" aria-label="Fechar">×</button></div>'+
 '<h2 id="alphaInformationTitle">Novidades da Taverna</h2><p class="alpha-lead">'+current.label+' · '+current.title+'</p>'+
 themeNotice()+
 DATA.entries.slice(0,4).map((entry,index)=>'<details class="alpha-release" '+(index===0?'open':'')+'><summary>'+entry.label+' — '+entry.title+'</summary><ul>'+entry.items.map(item=>'<li>'+item+'</li>').join('')+'</ul></details>').join('')+
 '<p class="alpha-note">As notas descrevem mudanças publicadas; recursos multiplayer ainda estão em testes públicos.</p>'+
 '<button type="button" class="alpha-primary" id="alphaNewsContinue">Entrar na Taverna</button></div>';
}
function renderFeedback(){
 return '<div class="alpha-info-card alpha-form-card" tabindex="-1"><div class="alpha-info-head"><span class="alpha-kicker">✦ OUVIDORIA DA TAVERNA ✦</span><button type="button" class="alpha-dismiss" id="alphaModalClose" aria-label="Fechar">×</button></div>'+
 '<h2 id="alphaInformationTitle">Bugs e sugestões</h2><p class="alpha-lead">Sua voz ajuda a melhorar a Taverna. Não é preciso criar conta ou se identificar.</p>'+
 '<form id="alphaFeedbackForm">'+
 '<label for="alphaReportName">Nome ou apelido</label><input id="alphaReportName" name="nickname" type="text" maxlength="32" required autocomplete="nickname" placeholder="Pode inventar um nome!">'+
 '<label for="alphaReportType">Tipo de mensagem</label><select id="alphaReportType"><option value="bug">🐞 Encontrei um bug</option><option value="sugestao">💡 Tenho uma sugestão</option></select>'+
 '<label for="alphaReportBody">Seu relato</label><textarea id="alphaReportBody" name="report" required minlength="10" maxlength="1200" rows="6" placeholder="Conte o que aconteceu ou o que gostaria de ver no jogo..."></textarea>'+
 '<div class="alpha-honeypot" aria-hidden="true"><label for="alphaWebsiteTrap">Deixe este campo vazio</label><input id="alphaWebsiteTrap" type="text" name="website" tabindex="-1" autocomplete="off"></div>'+
 '<p class="alpha-note">Só pedimos um apelido e o texto. Seu relato poderá aparecer publicamente na lista de melhorias. Não escreva dados pessoais, senhas nem códigos de sala.</p>'+
 '<div id="alphaFeedbackStatus" role="status" aria-live="polite"></div>'+
 '<div class="alpha-form-actions"><button type="submit" id="alphaSendFeedback" class="alpha-primary">Enviar à Taverna</button></div></form></div>';
}
const FEEDBACK_ENDPOINT='https://taverna-multiplayer-servidor.edulopes941.workers.dev/api/feedback';
function buildReport(){
 const type=$('alphaReportType').value;
 const name=$('alphaReportName').value.trim();
 const message=$('alphaReportBody').value.trim();
 if(name.length<1||name.length>32||message.length<10||message.length>1200){
  $('alphaFeedbackStatus').textContent='Informe um apelido e escreva pelo menos 10 caracteres.';return null;
 }
 return {type,name,message,version:current.label,website:$('alphaWebsiteTrap').value};
}
async function sendReport(){
 const data=buildReport();if(!data)return;
 const status=$('alphaFeedbackStatus'),button=$('alphaSendFeedback');
 button.disabled=true;button.textContent='Enviando…';status.textContent='';
 try{
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),12000);
  let response;
  try{
   response=await fetch(FEEDBACK_ENDPOINT,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data),signal:controller.signal});
  }finally{clearTimeout(timeout)}
  let info={};try{info=await response.json()}catch{}
  if(!response.ok||!info.ok)throw Error(info.error||'O servidor não recebeu a mensagem. Tente mais tarde.');
  $('alphaFeedbackForm').reset();
  $('alphaFeedbackForm').innerHTML='<div class="alpha-feedback-success"><span class="alpha-success-symbol" aria-hidden="true">✓</span><h3>Mensagem recebida!</h3><p>Obrigado por ajudar a melhorar a Taverna. Seu relato foi guardado e será encaminhado à lista de melhorias.</p><button type="button" class="alpha-primary" id="alphaSendAnother">Escrever outro relato</button></div>';
  $('alphaSendAnother').addEventListener('click',()=>openModal('feedback'));
 }catch(error){
  status.textContent=error?.name==='AbortError'?'A conexão demorou demais. Tente novamente.':(error?.message||'Falha ao enviar. Tente novamente.');
  button.disabled=false;button.textContent='Tentar novamente';
 }
}
function attachFeedback(){
 $('alphaFeedbackForm').addEventListener('submit',event=>{event.preventDefault();sendReport()});
}
$('alphaOpenNews').addEventListener('click',()=>openModal('news'));
$('alphaOpenFeedback').addEventListener('click',()=>openModal('feedback'));
overlay.addEventListener('click',event=>{
 if(event.target===overlay)closeModal();
 if(event.target?.id==='alphaNewsContinue')closeModal();
});
document.addEventListener('keydown',event=>{
 if(overlay.hidden)return;
 if(event.key==='Escape'){event.preventDefault();closeModal();return}
 if(event.key==='Tab'){
  const focusable=[...overlay.querySelectorAll('button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),summary')];
  if(!focusable.length)return;
  if(event.shiftKey&&document.activeElement===focusable[0]){event.preventDefault();focusable.at(-1).focus();}
  else if(!event.shiftKey&&document.activeElement===focusable.at(-1)){event.preventDefault();focusable[0].focus();}
 }
});
for(const id of ['chooseOffline','chooseMultiplayer']){
 const btn=$(id);if(btn)btn.addEventListener('click',()=>{if(!overlay.hidden)closeModal();},true);
}
setTimeout(()=>{if(safeSeen()!==current.id&&!welcome.classList.contains('hidden')&&overlay.hidden)openModal('news')},300);
})();