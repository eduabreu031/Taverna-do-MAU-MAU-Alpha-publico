/* Taverna do MAU MAU — Alpha v92: modais informativos e encaminhamento de relatos, sem alterar o motor. */
(()=>{'use strict';
const DATA=/*ALPHA_RELEASES_JSON*/;
const current=DATA.entries.find(e=>e.id===DATA.current);
const welcome=document.getElementById('sceneWelcome');
if(!welcome||!current)return;
const ISSUE_URL='https://github.com/'+DATA.issuesRepo+'/issues/new';
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
function renderNews(){
 return '<div class="alpha-info-card" tabindex="-1"><div class="alpha-info-head"><span class="alpha-kicker">✦ MENSAGEM DO ARAUTO ✦</span><button type="button" class="alpha-dismiss" id="alphaModalClose" aria-label="Fechar">×</button></div>'+
 '<h2 id="alphaInformationTitle">Novidades da Taverna</h2><p class="alpha-lead">'+current.label+' · '+current.title+'</p>'+
 DATA.entries.map((entry,index)=>'<details class="alpha-release" '+(index===0?'open':'')+'><summary>'+entry.label+' — '+entry.title+'</summary><ul>'+entry.items.map(item=>'<li>'+item+'</li>').join('')+'</ul></details>').join('')+
 '<p class="alpha-note">As notas descrevem mudanças publicadas; recursos multiplayer ainda estão em testes públicos.</p>'+
 '<button type="button" class="alpha-primary" id="alphaNewsContinue">Entrar na Taverna</button></div>';
}
function renderFeedback(){
 return '<div class="alpha-info-card alpha-form-card" tabindex="-1"><div class="alpha-info-head"><span class="alpha-kicker">✦ OUVIDORIA DA TAVERNA ✦</span><button type="button" class="alpha-dismiss" id="alphaModalClose" aria-label="Fechar">×</button></div>'+
 '<h2 id="alphaInformationTitle">Bugs e sugestões</h2><p class="alpha-lead">Conte o que ocorreu ou o que gostaria de ver no jogo.</p>'+
 '<form id="alphaFeedbackForm">'+
 '<label for="alphaReportType">Tipo do relato</label><select id="alphaReportType" required><option value="bug">🐞 Reportar um bug</option><option value="sugestao">💡 Sugerir uma melhoria</option></select>'+
 '<label for="alphaReportArea">Onde se aplica?</label><select id="alphaReportArea"><option>Multiplayer / conexão</option><option>Regras / cartas / penalidades</option><option>Menu / instalação / atualização</option><option>Visual / som / animações</option><option>Outro</option></select>'+
 '<label for="alphaReportTitle">Resumo do relato</label><input id="alphaReportTitle" type="text" maxlength="100" minlength="8" required placeholder="Ex.: O cronômetro não reinicia depois da compra">'+
 '<label for="alphaReportBody">Explique o problema ou a ideia</label><textarea id="alphaReportBody" required minlength="15" maxlength="1800" rows="4" placeholder="Descreva o que aconteceu ou como seria a melhoria..."></textarea>'+
 '<label for="alphaReportSteps">Contexto, passos ou exemplo (opcional)</label><textarea id="alphaReportSteps" maxlength="1000" rows="3" placeholder="Em qual momento, depois de qual carta ou ação?"></textarea>'+
 '<label for="alphaReportExpected">O que você esperava? (opcional)</label><textarea id="alphaReportExpected" maxlength="500" rows="2" placeholder="Como deveria ter funcionado?"></textarea>'+
 '<label class="alpha-check"><input id="alphaAttachEnvironment" type="checkbox"> Incluir navegador e tamanho de tela para ajudar na investigação.</label>'+
 '<p class="alpha-note">Seu relato ficará <strong>público no GitHub</strong>. Não inclua senha, token, código de sala, cartas privadas ou dados pessoais. Nada é enviado sem sua confirmação.</p>'+
 '<p class="alpha-note">Você precisará entrar numa conta gratuita do GitHub e confirmar a publicação na próxima tela. Lá também poderá anexar uma imagem.</p>'+
 '<div id="alphaFeedbackStatus" role="status" aria-live="polite"></div>'+
 '<div class="alpha-form-actions"><button type="button" id="alphaCopyReport" class="alpha-secondary">Copiar relato</button><button type="submit" class="alpha-primary">Continuar no GitHub ↗</button></div></form></div>';
}
function buildReport(){
 const type=$('alphaReportType').value,title=$('alphaReportTitle').value.trim(),description=$('alphaReportBody').value.trim();
 if(title.length<8||description.length<15){$('alphaFeedbackStatus').textContent='Preencha o resumo e a descrição antes de continuar.';return null}
 const area=$('alphaReportArea').value,steps=$('alphaReportSteps').value.trim(),expected=$('alphaReportExpected').value.trim();
 const lines=['<!-- taverna-relato-alpha -->','**Tipo:** '+(type==='bug'?'Bug':'Sugestão'),
 '**Área:** '+area,'**Versão:** '+current.label,
 '**Registrado em (UTC):** '+new Date().toISOString(),
 '', '### Descrição',description,'','### Passos / contexto',steps||'Não informado',
 '','### Comportamento esperado ou proposta',expected||'Não informado'];
 if($('alphaAttachEnvironment').checked){
  lines.push('','### Diagnóstico autorizado','**Navegador:** '+String(navigator.userAgent||'Não disponível').slice(0,230),
   '**Janela:** '+window.innerWidth+' × '+window.innerHeight);
 }
 lines.push('','---','Relato criado a partir da Taverna do MAU MAU '+current.label+'. Nenhuma mão, credencial ou código de sala foi anexado.');
 const issueTitle=(type==='bug'?'[Bug] ':'[Sugestão] ')+title;
 const body=lines.join('\n');
 const link=new URL(ISSUE_URL);link.searchParams.set('title',issueTitle);link.searchParams.set('body',body);
 return {body,issueTitle,link:link.href};
}
function attachFeedback(){
 $('alphaFeedbackForm').addEventListener('submit',event=>{
  event.preventDefault();const report=buildReport();if(!report)return;
  const status=$('alphaFeedbackStatus');
  if(report.link.length>7500){status.textContent='O relato ficou muito grande para o link. Reduza a descrição ou copie o texto.';return}
  const a=document.createElement('a');a.href=report.link;a.target='_blank';a.rel='noopener noreferrer';document.body.appendChild(a);a.click();a.remove();
  status.textContent='Próximo passo: entrar no GitHub e clicar em “Submit new issue”. O relato ainda não foi enviado.';
 });
 $('alphaCopyReport').addEventListener('click',async()=>{
  const report=buildReport();if(!report)return;
  const text=report.issueTitle+'\n\n'+report.body;
  try{await navigator.clipboard.writeText(text);$('alphaFeedbackStatus').textContent='Relato copiado. Você pode compartilhá-lo sem publicar dados pessoais.';}
  catch{
   const area=document.createElement('textarea');area.value=text;area.style.position='fixed';area.style.top='-9999px';document.body.appendChild(area);area.select();
   const copied=typeof document.execCommand==='function'&&document.execCommand('copy');area.remove();
   $('alphaFeedbackStatus').textContent=copied?'Relato copiado.':'Não foi possível copiar automaticamente.';
  }
 });
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