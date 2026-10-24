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
css=(root/'qa/tavern-entrance.css').read_text(encoding='utf-8')
js=(root/'qa/tavern-entrance.js').read_text(encoding='utf-8')
assert '</style' not in css.lower() and '</script' not in js.lower()
html=html.replace('</head>','<style id="tav-entrance-style">\n'+css+'\n</style>\n</head>',1)
html=html.replace('</body>','<script id="tav-entrance-script">\n'+js+'\n</script>\n</body>',1)
path.write_text(html,encoding='utf-8')
print('TAVERN_ENTRANCE_READY: gate, identity, guest, account; no engine modifications')
