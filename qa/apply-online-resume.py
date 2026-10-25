#!/usr/bin/env python3
"""Ativa retomada ao recarregar sem alterar motor offline ou estado do servidor."""
from pathlib import Path
import sys

root=Path(__file__).resolve().parents[1]
site=Path(sys.argv[1]) if len(sys.argv)>1 else root/'site'
page=site/'index.html'
html=page.read_text(encoding='utf-8')
controller_tag='<script id="online-v84-controller">'
assert html.count(controller_tag)==1 and html.count('id="alpha-accounts-script"')==1
before,rest=html.split(controller_tag,1)
controller,after=rest.split('</script>',1)
assert 'taverna-online-resume-v1' not in controller

def change(old,new):
 global controller
 count=controller.count(old)
 assert count==1,(old[:140],count)
 controller=controller.replace(old,new,1)

helper=(root/'qa/online-resume-snippet.js').read_text(encoding='utf-8')
assert '</script' not in helper.lower()
change('const setStatus=s=>st.textContent=s;',helper+'\nconst setStatus=s=>st.textContent=s;')
change('function close(leave=false){closing=true;',
       'function close(leave=false){closing=true;++connectSerial;clearResume();')
change("async function connect(code,existingToken=''){",
       "async function connect(code,existingToken=''){\n const serial=++connectSerial;")
change('socket=new WebSocket(url)',
       'if(closing||serial!==connectSerial||room!==code)return;socket=new WebSocket(url)')
change("catch(e){message('Não foi possível criar a conexão: '+e.message);return;}",
       "catch(e){if(restorePending)failedResume('Não foi possível retomar a sala: '+e.message);"
       "else message('Não foi possível criar a conexão: '+e.message);return;}")
change('socket.onmessage=event=>{',
       'socket.onmessage=event=>{if(ws!==socket)return;')
change("if(m.type==='welcome'){uid=m.id;token=m.token;",
       "if(m.type==='welcome'){uid=m.id;token=m.token;saveResume(code,token);restorePending=false;")
change("if(e.code===4000||e.code===1008||retries>=5){message('Sessão encerrada. Volte ao menu e tente novamente.');return;}",
       "if(e.code===4000||e.code===1008||retries>=5){"
       "if(restorePending)failedResume('A sessão anterior foi encerrada ou a sala expirou.');"
       "else message('Sessão encerrada. Volte ao menu e tente novamente.');return;}")
change("window.__tavOnlineTest={isOnline:",
       "queueMicrotask(()=>restoreRoomOnStartup().catch(e=>{"
       "console.warn('Falha na retomada online',e);if(restorePending)failedResume('Não foi possível recuperar a partida.');}));\n"
       "window.__tavOnlineTest={isOnline:")

page.write_text(before+controller_tag+controller+'</script>'+after,encoding='utf-8')
print('ONLINE_REFRESH_RESUME_READY',len(controller))
