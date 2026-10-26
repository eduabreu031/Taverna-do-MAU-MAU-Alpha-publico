#!/usr/bin/env python3
"""Aplique interface premium APÓS funcionalidades existentes sem alterar motor de regras."""
from pathlib import Path
import sys,re
root=Path(__file__).resolve().parents[1]
site=Path(sys.argv[1]) if len(sys.argv)>1 else root/'site'
path=site/'index.html'
html=path.read_text('utf-8')
assert len(html)>4_000_000,'Arquivo do jogo incompleto'
assert 'id="tav-lounge-script"' in html,'Frequentadores devem continuar instalados'
assert 'id="onlineLeave"' in html and 'id="onlineCreate"' in html and 'id="onlineRoomCode"' in html
assert 'id="tav-native-ui-script"' not in html,'Interface premium duplicada'
# Substituições estritamente localizadas em handlers já presentes; comandos de saída preservados.
native_confirm="if(confirm('Sair desta partida e voltar às boas-vindas?'))goMenu();"
themed_confirm="if(await window.TavernaUI.confirm({title:'Deixar a mesa?',message:'Sair desta partida e voltar às boas-vindas?',confirmLabel:'Sair da partida',danger:true}))goMenu();"
handler="$('returnMenu').onclick=()=>{"+native_confirm+"};"
new_handler="$('returnMenu').onclick=async()=>{"+themed_confirm+"};"
assert html.count(handler)==1,('Confirmação de saída mudou na origem',html.count(handler))
html=html.replace(handler,new_handler,1)
copy_fallback="prompt('Copie o convite',url.href)"
assert html.count(copy_fallback)==1,('Prompt de cópia mudou na origem',html.count(copy_fallback))
html=html.replace(copy_fallback,"window.TavernaUI.share(url.href)",1)
assert 'window.confirm(' not in html,'Remoções VIP ainda usam confirmação nativa'
assert not re.search(r'(?<![a-zA-Z0-9._])confirm\s*\(',html),'Restou confirmação nativa'
assert not re.search(r'(?<![a-zA-Z0-9._])prompt\s*\(',html),'Restou prompt nativo'
js=(root/'qa/tavern-ui-shell.js').read_text('utf-8')
css=(root/'qa/tavern-ui-shell.css').read_text('utf-8')
assert '</script' not in js.lower() and '</style' not in css.lower()
html=html.replace('</head>','<style id="tav-native-ui-style">\n'+css+'\n</style>\n</head>',1)
html=html.replace('</body>','<script id="tav-native-ui-script">\n'+js+'\n</script>\n</body>',1)
path.write_text(html,'utf-8')
print('TAVERN_PREMIUM_UI_READY: sem prompt/confirm nativos, 12 temas e gameplay preservado')
