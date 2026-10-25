#!/usr/bin/env python3
"""Acopla a entrada cinematográfica sem substituir cenas, gameplay ou WebSocket."""
from pathlib import Path
import sys
root=Path(__file__).resolve().parents[1]
site=Path(sys.argv[1]) if len(sys.argv)>1 else root/'site'
path=site/'index.html'
html=path.read_text(encoding='utf-8')
assert len(html)>4_000_000,'HTML incompleto'
assert html.count('</head>')==1 and html.count('</body>')==1
assert 'id="tav-theme-manager"' in html and 'id="alpha-accounts-script"' in html
assert 'id="tavEntrance"' not in html and 'id="tav-entrance-script"' not in html,'Entrada duplicada'
# O Arauto de boas-vindas já existe, mas estava desativado em v72.
# Reutilizar a gravação original (faixa 16) SOMENTE ao entrar no interior.
voice_off='if(String(track)==="16")return; // v72: nenhuma saudação falada no menu'
voice_fn='function arautoSpeak(track){'
music_fn="function toggleMusic(){soundInit();ui.musicOn=!ui.musicOn;"
assert html.count(voice_off)==1 and html.count(voice_fn)==1,'Gancho original do Arauto mudou'
assert html.count(music_fn)==1,'Controle da Rádio mudou'
html=html.replace(voice_off,'if(String(track)==="16"&&!window.__tavEntranceInteriorReady)return; // Faixa de boas-vindas só na entrada',1)
html=html.replace(voice_fn,
 'window.addEventListener("taverna-interior-entered",()=>{window.__tavEntranceInteriorReady=true;arautoSpeak(16);});\n'+voice_fn,1)
# Registrar a última preferência APENAS quando o controle original é usado.
html=html.replace(music_fn,
 music_fn+"try{localStorage.setItem('tavern-radio-preference',String(ui.musicOn));}catch(e){}",1)

# A tela da porta foi retirada. Não empacotar nem colocar em cache a
# imagem cinematográfica; o painel de identificação é HTML/CSS local.
artdir=site/'art'
for unused in ('tavern-door-v2.svg','tavern-facade-v2.svg','tavern-facade-bc.webp'):
 (artdir/unused).unlink(missing_ok=True)
swfile=site/'sw.js'
worker=swfile.read_text(encoding='utf-8')
worker=worker.replace("  './art/tavern-door-v2.svg',\n",'')
swfile.write_text(worker,encoding='utf-8')
css=(root/'qa/tavern-entrance.css').read_text(encoding='utf-8')
js=(root/'qa/tavern-entrance.js').read_text(encoding='utf-8')
welcome_css=(root/'qa/welcome-layout.css').read_text(encoding='utf-8')
welcome_js=(root/'qa/welcome-layout.js').read_text(encoding='utf-8')
assert '</style' not in welcome_css.lower() and '</script' not in welcome_js.lower()
assert '</style' not in css.lower() and '</script' not in js.lower()
html=html.replace('</head>','<style id="tav-entrance-style">\n'+css+'\n</style>\n<style id="tav-welcome-layout-style">\n'+welcome_css+'\n</style>\n</head>',1)
html=html.replace('</body>','<script id="tav-entrance-script">\n'+js+'\n</script>\n<script id="tav-welcome-layout-script">\n'+welcome_js+'\n</script>\n</body>',1)
path.write_text(html,encoding='utf-8')
print('TAVERN_IDENTITY_READY: direct identity, guest, account; no door or engine modifications')
