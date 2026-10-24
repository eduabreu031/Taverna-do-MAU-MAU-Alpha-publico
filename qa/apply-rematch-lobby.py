#!/usr/bin/env python3
"""Revanche mantém assentos; voltar ao lobby altera somente a sessão multiplayer."""
from pathlib import Path
import sys

site=Path(sys.argv[1]) if len(sys.argv)>1 else Path('site')
page=site/'index.html'
html=page.read_text(encoding='utf8')
assert 'id="tav-visitor-entry"' in html and 'id="online-v84-controller"' in html

def replace_exact(before,after):
 global html
 n=html.count(before)
 assert n==1,(before[:110],n)
 html=html.replace(before,after,1)

replace_exact(
 '<button type="button" id="onlineFinishExit" class="engraved-btn">Sair da sala</button>',
 '<button type="button" id="onlineFinishLobby" class="engraved-btn">Voltar ao lobby</button><button type="button" id="onlineFinishExit" class="engraved-btn">Sair da sala</button>'
)
replace_exact(
 "rematchBtn=finishPanel.querySelector('#onlineRematch'),finishExit=finishPanel.querySelector('#onlineFinishExit');",
 "rematchBtn=finishPanel.querySelector('#onlineRematch'),finishLobby=finishPanel.querySelector('#onlineFinishLobby'),finishExit=finishPanel.querySelector('#onlineFinishExit');"
)
replace_exact(
 "const host=uid===hostId,ready=players.length>=2&&players.every(p=>p.online)&&areAllBotsReady(players);",
 "const host=!!uid&&(uid===hostId||(room==='TAVERN'&&players.some(p=>p.id===uid&&!p.isBot))),ready=players.length>=2&&players.every(p=>p.online)&&areAllBotsReady(players)&&g.players.length===players.length&&g.players.every(p=>players.some(m=>m.id===p.id));"
)
replace_exact(
 "rematchBtn.classList.toggle('hidden',!host);finishExit.classList.toggle('hidden',!host);",
 "rematchBtn.classList.toggle('hidden',!host);finishLobby.classList.toggle('hidden',!host);finishExit.classList.toggle('hidden',!host);"
)
replace_exact(
 "if(!online||game?.phase!=='finished'||uid!==hostId)return;\n if(!areAllBotsReady(players))",
 "if(!online||game?.phase!=='finished'||!(uid===hostId||(room==='TAVERN'&&players.some(p=>p.id===uid&&!p.isBot))))return;\n if(game.players.length!==players.length||!game.players.every(p=>players.some(m=>m.id===p.id&&m.online))){message('A mesa mudou: volte ao lobby para reorganizar.');return;}\n if(!areAllBotsReady(players))"
)
replace_exact(
 "finishExit.addEventListener('click',()=>{close(true);",
 """finishLobby.addEventListener('click',()=>{
 if(!online||game?.phase!=='finished'||!(uid===hostId||(room==='TAVERN'&&players.some(p=>p.id===uid&&!p.isBot))))return;
 finishLobby.disabled=true;
 if(!send({type:'return_lobby'}))finishLobby.disabled=false;
});
finishExit.addEventListener('click',()=>{close(true);"""
)
replace_exact(
 "if(m.type==='error'){startPending=false;refreshReadyAfterBots();message('Servidor: '+(m.message||'Ação rejeitada'));return;}",
 "if(m.type==='error'){startPending=false;finishLobby.disabled=false;refreshReadyAfterBots();message('Servidor: '+(m.message||'Ação rejeitada'));return;}"
)
replace_exact(
 "players=m.players||[];hostId=m.hostId;opa=m.opa;",
 """players=m.players||[];hostId=m.hostId;opa=m.opa;
  if(!m.game&&game){
   // Transição autoritativa para o lobby: ambos os humanos saem da mesa
   // sem fechar a conexão ou perder o controle dos bots que continuam online.
   cancelOnlineEffects();lastRenderedRound=null;resetFinishNotice();
   game=null;revision=-1;firstGameState=true;lastEventIds.clear();comboReset();
  }"""
)
page.write_text(html,encoding='utf8')
print('VIP_REMATCH_LOBBY_READY',len(html))
