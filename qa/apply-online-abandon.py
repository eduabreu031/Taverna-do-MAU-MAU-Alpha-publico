#!/usr/bin/env python3
"""Distingue abandonar PARTIDA de sair da SALA e preserva o lobby ao vivo."""
from pathlib import Path
import sys

site=Path(sys.argv[1]) if len(sys.argv)>1 else Path('site')
page=site/'index.html'
html=page.read_text(encoding='utf8')
assert 'id="online-v84-controller"' in html
assert "tavSocialLauncher.id='tavSocialLauncher'" in html
assert 'tavAbandonOverlay' not in html

def once(old,new):
 global html
 count=html.count(old)
 assert count==1,(old[:140],count)
 html=html.replace(old,new,1)

css=Path(__file__).with_name('online-abandon-style.css').read_text(encoding='utf8')
code=Path(__file__).with_name('online-abandon-snippet.js').read_text(encoding='utf8')
assert '</script>' not in code.lower() and '</style>' not in css.lower()
once('</head>','<style id="tav-online-abandon-style">\n'+css+'\n</style>\n</head>')
once('document.body.append(finishPanel);','document.body.append(finishPanel);\n'+code)
once("if(m.type==='social_event'){tavIncomingSocial(m);return;}",
     "if(m.type==='match_abandoned'){tavHandleAbandonAcknowledgement(m);return;}\n"+
     "  if(m.type==='social_event'){tavIncomingSocial(m);return;}")
once("if(m.type==='error'){startPending=false;finishLobby.disabled=false;",
     "if(m.type==='error'){tavAbandonError();startPending=false;finishLobby.disabled=false;")
once("players=m.players||[];hostId=m.hostId;opa=m.opa;",
     "players=m.players||[];hostId=m.hostId;opa=m.opa;tavLatestMatchNo=m.matchNo||0;")
once("if(m.game)startPending=false;\n  refreshReadyAfterBots();\n  if(m.game){",
     """if(m.game)startPending=false;
  refreshReadyAfterBots();
  if(tavStayInLobby(m)&&m.game){
   betaBanner.hidden=true;betaScoreBtn.hidden=true;betaScore.hidden=true;betaTag.hidden=true;
   el('onlineStart').disabled=true;
   el('onlineStartHint').textContent='Você está no lobby. Aguarde a partida atual terminar.';
  }
  if(m.game&&!tavStayInLobby(m)){""")
once("if(isSpectator){if(e.type==='click')message('Você está em modo espectador.');return;}",
     "if(hit.id==='returnMenu'&&e.type==='click'){tavRequestLeaveMatch();return;}\n "+
     "if(isSpectator){if(e.type==='click')message('Você está em modo espectador.');return;}")
once("if(hit.id==='returnMenu'){close(false);el('sceneWelcome').classList.remove('hidden');el('sceneMultiplayer').classList.add('hidden');return;}",
     "if(hit.id==='returnMenu')return;")
once("el('onlineLeave').onclick=()=>close(true);",
     "el('onlineLeave').onclick=tavLeaveToMainMenu;")
once("el('multiplayerBackBtn').addEventListener('click',()=>close(true));",
     "el('multiplayerBackBtn').addEventListener('click',tavLeaveToMainMenu);")
original="finishExit.addEventListener('click',()=>{close(true);el('sceneGame').classList.add('hidden');el('sceneMultiplayer').classList.add('hidden');el('sceneWelcome').classList.remove('hidden');});"
active="<script id=\"online-v84-controller\">"
before,after=html.split(active,1)
assert after.count(original)==1,('Controlador Alpha divergente',after.count(original))
html=before+active+after.replace(original,"finishExit.addEventListener('click',tavLeaveToMainMenu);",1)
page.write_text(html,encoding='utf8')
print('ONLINE_ABANDON_READY',len(html))
