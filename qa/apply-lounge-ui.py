#!/usr/bin/env python3
"""Injeta Frequentadores da Taverna por cima do build Alpha estável."""
from pathlib import Path
import sys
root=Path(__file__).resolve().parents[1]
site=Path(sys.argv[1]) if len(sys.argv)>1 else root/'site'
path=site/'index.html'
html=path.read_text(encoding='utf-8')
assert len(html)>4_000_000, 'Build incompleto'
assert 'id="alpha-accounts-script"' in html and 'id="onlineLobby"' in html
assert 'id="tav-lounge-script"' not in html
js=(root/'qa/lounge-ui.js').read_text(encoding='utf-8')
css=(root/'qa/lounge-ui.css').read_text(encoding='utf-8')
assert '</script' not in js.lower() and '</style' not in css.lower()
html=html.replace('</head>','<style id="tav-lounge-style">\n'+css+'\n</style>\n</head>',1)
html=html.replace('</body>','<script id="tav-lounge-script">\n'+js+'\n</script>\n</body>',1)
path.write_text(html,encoding='utf-8')
print('TAVERN_LOUNGE_UI_READY')
