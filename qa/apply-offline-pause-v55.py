#!/usr/bin/env python3
"""Alpha 0.5.0.55: pausa do offline no motor + acesso a Crônicas no HUD."""
from pathlib import Path
import sys
root=Path(__file__).resolve().parents[1]
site=Path(sys.argv[1]) if len(sys.argv)>1 else root/'site'
path=site/'index.html'
html=path.read_text(encoding='utf8')
assert len(html)>4_000_000
assert 'id="tav-gameplay-v50-style"' in html and 'id="tav-cronicas-script"' in html
assert 'id="tav-offline-pause-v55-style"' not in html
def swap(old,new):
 global html
 n=html.count(old)
 assert n==1,('Âncora mudou',old[:115],n)
 html=html.replace(old,new,1)
# A pausa não muda as ações do motor: impede relógios e a IA de agir.
swap("function humanTurn(s){return !ui.introActive", "function humanTurn(s){return !ui.offlinePaused&&!ui.introActive")
swap("function botStrategy(player){const s=ui.game.state;",
     "function botStrategy(player){if(ui.offlinePaused)return;const s=ui.game.state;")
swap("function schedule(phase='normal'){if(!ui.game||ui.introActive)return;",
     "function schedule(phase='normal',resume=null){if(ui.offlinePaused||!ui.game||ui.introActive)return;")
# Preservar o restante da janela OPA!!! após a pausa.
old="ui.incidentTimer=setTimeout(()=>{if(token===ui.turnToken)handleResult(ui.game.closeAccusationWindow());},Core.RULES.accusationMs);"
new="const incidentMs=resume?.incidentMs??Core.RULES.accusationMs;ui.tavIncidentDeadline=performance.now()+incidentMs;ui.incidentTimer=setTimeout(()=>{if(token===ui.turnToken)handleResult(ui.game.closeAccusationWindow());},incidentMs);"
swap(old,new)
# Preservar tanto o tempo total dos bots quanto o momento da próxima jogada.
old="const token=ui.turnToken,delay=phase==='after_draw'?(620+Math.random()*630):(2700+Math.random()*1800);ui.botThinkDuration=delay;ui.botThinkUntil=performance.now()+delay;ui.botActionDeadline=performance.now()+Core.RULES.humanMainMs;"
new="const token=ui.turnToken,delay=resume?.thinkMs??(phase==='after_draw'?(620+Math.random()*630):(2700+Math.random()*1800));const botMs=resume?.botMs??Core.RULES.humanMainMs;ui.botThinkDuration=delay;ui.botThinkUntil=performance.now()+delay;ui.botActionDeadline=performance.now()+botMs;"
swap(old,new)
swap("},Core.RULES.humanMainMs);\nui.scheduler=setTimeout(()=>{if(token===ui.turnToken)botStrategy(s.turn);},delay);",
     "},botMs);\nui.scheduler=setTimeout(()=>{if(token===ui.turnToken)botStrategy(s.turn);},delay);")
# Fonte de verdade do estado fica dentro do mesmo escopo de ui, Core e schedule.
engine=(root/'qa/offline-pause-engine-v55.js').read_text(encoding='utf8')
assert '</script' not in engine.lower()
swap("function showMsg(message,error=false){",engine+"\nfunction showMsg(message,error=false){")
swap("function goMenu(){arautoStop();","function goMenu(){tavOfflineReset();arautoStop();")
css=(root/'qa/offline-pause-ui-v55.css').read_text(encoding='utf8')
assert '</style' not in css.lower()
swap('</head>','<style id="tav-offline-pause-v55-style">\n'+css+'\n</style>\n</head>')
path.write_text(html,encoding='utf8')
print('OFFLINE_PAUSE_V55_READY',len(html))
