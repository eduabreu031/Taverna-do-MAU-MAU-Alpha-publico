#!/usr/bin/env python3
from pathlib import Path
import sys
site=Path(sys.argv[1]) if len(sys.argv)>1 else Path('site')
file=site/'index.html'
h=file.read_text(encoding='utf8')
replacements=[
("function connectBot(bot){","async function connectBot(bot){"),
("let sock;try{sock=new WebSocket(url)}catch(e)","let sock;try{url.searchParams.set('pass',await window.TavernaAuth.pass());sock=new WebSocket(url)}catch(e)")
]
for old,new in replacements:
 assert h.count(old)==1,(old,h.count(old))
 h=h.replace(old,new,1)
js=Path('qa/vip-bots-ui.js').read_text(encoding='utf8')
css=Path('qa/vip-bots-ui.css').read_text(encoding='utf8')
assert 'id="online-v84-controller"' in h
assert 'id="alpha-accounts-script"' in h
assert '</script' not in js.lower()
h=h.replace('</head>','<style id="tav-vip-bots-css">\n'+css+'\n</style>\n</head>',1)
h=h.replace('</body>','<script id="tav-vip-bots-ui">\n'+js+'\n</script>\n</body>',1)
file.write_text(h,encoding='utf8')
print('VIP_BOTS_UI_READY',len(h))
