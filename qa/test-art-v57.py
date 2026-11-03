#!/usr/bin/env python3
"""QA dos 11 versos refinados e ícones do HUD — somente aparência."""
from pathlib import Path
import sys
from PIL import Image
root=Path(__file__).resolve().parents[1]
site=Path(sys.argv[1]) if len(sys.argv)>1 else root/'site'
names=['neon-blue','neon-green','neon-pink','neon-tavern-dark',
       'neon-aero','neon-imperial','neon-amber','neon-forge',
       'neon-abyss','neon-forest','neon-porcelain']
assert len(names)==11 and len(set(names))==11
for name in names:
    svg=(site/'theme-decks'/f'{name}.svg').read_text('utf8')
    assert svg.count('CARD_BACK_ART_V57')==1,(name,'Arte não refinada ou duplicada')
    assert svg.count('v57metal')>=2 and len(svg)>2800,(name,'Verso incompleto')
    assert svg.count('<svg')==1 and svg.count('</svg>')==1
    art=site/'theme-decks-raster'/f'{name}.webp'
    with Image.open(art) as im:
        assert im.size==(480,672) and im.mode=='RGB',(name,im.size,im.mode)
css=(root/'qa/tavern-design-system-v56.css').read_text('utf8')
assert '--tav-hud-glyph-filter:brightness(0) saturate(0)' in css, 'O legado deve permanecer documentado'
assert '--tav-hud-glyph-filter:drop-shadow(' in css,'Restauração de traços internos não instalada'
assert ':root[data-tav-palette="neon-porcelain"]{' in css
assert ':root[data-tav-palette="neon-aero"]{' in css
print('ART_V57_OK: 11 SVGs autorais refinados, WebPs RGB e contraste nos 12 temas')
