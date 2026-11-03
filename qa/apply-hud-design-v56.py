#!/usr/bin/env python3
"""Instala o contrato visual do HUD v56 depois de todos os módulos de UI."""
from pathlib import Path
import sys
root=Path(__file__).resolve().parents[1]
site=Path(sys.argv[1]) if len(sys.argv)>1 else root/'site'
path=site/'index.html'
html=path.read_text(encoding='utf-8')
assert len(html)>4_000_000
assert 'id="tav-offline-pause-v55-style"' in html, 'A pausa precisa existir primeiro'
assert 'id="tav-cronicas-style"' in html, 'As Crônicas precisam existir primeiro'
assert 'id="tav-hud-design-v56-style"' not in html, 'Contrato visual duplicado'
css=(root/'qa/hud-design-v56.css').read_text(encoding='utf-8')
assert '</style' not in css.lower()
assert html.count('</head>')==1
html=html.replace('</head>','<style id="tav-hud-design-v56-style">\n'+css+'\n</style>\n</head>',1)
path.write_text(html,encoding='utf-8')
print('HUD_DESIGN_V56_READY',len(html))
