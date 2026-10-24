#!/usr/bin/env python3
"""Votação para acelerar bots; modifica só a interface online já integrada."""
from pathlib import Path
import sys

site=Path(sys.argv[1]) if len(sys.argv)>1 else Path('site')
page=site/'index.html'
html=page.read_text(encoding='utf8')
assert 'id="online-v84-controller"' in html
assert 'id="onlineFinishLobby"' in html
assert 'onlineSkipFinalPanel' not in html

def replace_once(before,after):
 global html
 qty=html.count(before)
 assert qty==1,(before[:120],qty)
 html=html.replace(before,after,1)

style="""
<style id="online-skip-final-style">
#onlineSkipFinalPanel[hidden]{display:none!important}
#onlineSkipFinalPanel{
 position:fixed;z-index:620;left:50%;top:50vh;bottom:auto;
 transform:translateX(-50%);width:min(450px,calc(100vw - 24px));
 border:2px solid #b18d58;border-radius:12px;padding:12px 14px;
 text-align:center;color:#f8e7c5;background:linear-gradient(155deg,#41202a,#25141d);
 box-shadow:0 10px 38px #000b;font:14px Georgia,serif
}
#onlineSkipFinalPanel button{margin:0 auto 7px;display:block;min-height:44px;max-width:100%}
#onlineSkipFinalPanel p{margin:4px 0 0;line-height:1.35;color:#f8e7c5}
@media(max-width:480px){
 #onlineSkipFinalPanel{padding:9px 11px;width:calc(100vw - 20px);font-size:13px}
 #onlineSkipFinalPanel button{margin-bottom:4px}
}
</style>
"""
replace_once('</head>',style+'</head>')

panel="""
const skipFinalPanel=document.createElement('section');
skipFinalPanel.id='onlineSkipFinalPanel';skipFinalPanel.hidden=true;
skipFinalPanel.setAttribute('role','group');skipFinalPanel.setAttribute('aria-label','Acelerar final entre bots');
const skipFinalButton=document.createElement('button');skipFinalButton.id='onlineSkipFinalButton';
skipFinalButton.className='engraved-btn primary';skipFinalButton.type='button';
skipFinalButton.textContent='Pular para o final';
const skipFinalInfo=document.createElement('p');skipFinalInfo.id='onlineSkipFinalInfo';
skipFinalInfo.setAttribute('aria-live','polite');
skipFinalPanel.append(skipFinalButton,skipFinalInfo);
document.body.append(skipFinalPanel);
let skipFinalState=null;
function placeSkipFinalNearHand(){
 if(skipFinalPanel.hidden)return;
 // Usa o espaço livre junto à mão, não a extremidade inferior da página.
 // Calcula usando a janela visível para funcionar em celulares com rolagem.
 const viewHeight=window.visualViewport?.height||window.innerHeight;
 const panelHeight=skipFinalPanel.getBoundingClientRect().height;
 const upperLimit=70;
 const lowerLimit=Math.max(upperLimit,viewHeight-panelHeight-Math.max(52,viewHeight*0.1));
 const hand=document.getElementById('humanHand');
 const rect=hand?.getBoundingClientRect();
 let desired=viewHeight*0.52-panelHeight*0.5;
 if(rect&&rect.height>4&&rect.bottom>upperLimit&&rect.top<viewHeight){
  const below=rect.bottom+10;
  const above=rect.top-panelHeight-10;
  // Abaixo da mão quando couber na parte visível da mesa;
  // caso contrário, imediatamente acima dela, sem cobrir as cartas.
  desired=below<=lowerLimit?below:above>=upperLimit?above:desired;
 }
 skipFinalPanel.style.top=Math.round(Math.max(upperLimit,Math.min(desired,lowerLimit)))+'px';
}
window.addEventListener('resize',placeSkipFinalNearHand);
window.addEventListener('scroll',placeSkipFinalNearHand,{passive:true});
window.visualViewport?.addEventListener('resize',placeSkipFinalNearHand);
function showSkipFinal(state){
 skipFinalState=state||null;
 const eligible=!!(online&&game?.phase==='playing'&&state?.eligible&&state?.canVote);
 skipFinalPanel.hidden=!eligible;
 if(!eligible)return;
 const voted=!!state.voted;
 skipFinalButton.disabled=voted;
 skipFinalButton.textContent=voted?'Voto registrado ✓':'Pular para o final';
 skipFinalInfo.textContent='Confirmações: '+state.votes+'/'+state.needed+
  (voted?' · Aguardando os demais jogadores.':' · Só avança se todos concordarem.');
 requestAnimationFrame(placeSkipFinalNearHand);
}
skipFinalButton.addEventListener('click',()=>{
 if(!skipFinalState?.eligible||!skipFinalState?.canVote||skipFinalState?.voted)return;
 if(send({type:'skip_final_vote'})){
  skipFinalButton.disabled=true;skipFinalInfo.textContent='Registrando sua confirmação…';
 }
});
"""
replace_once('document.body.append(finishPanel);','document.body.append(finishPanel);\n'+panel)
replace_once(
 "if(game.phase==='finished'||game.phase==='game_over'){setStatus('Partida encerrada');}showFinished(game);",
 "if(game.phase==='finished'||game.phase==='game_over'){setStatus('Partida encerrada');}showFinished(game);showSkipFinal(m.skipFinal);"
)
replace_once(
 "if(!m.game&&game){\n   // Transição autoritativa",
 "if(!m.game&&game){\n   showSkipFinal(null);\n   // Transição autoritativa"
)
page.write_text(html,encoding='utf8')
print('ONLINE_SKIP_FINAL_READY',len(html))
