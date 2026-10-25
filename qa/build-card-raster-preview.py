#!/usr/bin/env python3
"""Private preview: raster card backs for Android/iOS compatibility.

Source SVGs remain in site/theme-decks; RGB WebP variants are produced only
for the preview build. No public deploy, game state, card data or JS changes.
"""
from pathlib import Path
from io import BytesIO
from PIL import Image
import base64
import re
import sys
import cairosvg

root=Path(__file__).resolve().parents[1]
site=Path(sys.argv[1]) if len(sys.argv)>1 else root/'site'
html_file=site/'index.html'
ids=['neon-blue','neon-green','neon-pink','neon-tavern-dark','neon-aero',
     'neon-imperial','neon-amber','neon-forge','neon-abyss','neon-forest',
     'neon-porcelain']
colors={'neon-blue':'#121f53','neon-green':'#0a3834','neon-pink':'#421c57',
        'neon-tavern-dark':'#25151c','neon-aero':'#246c83',
        'neon-imperial':'#30213e','neon-amber':'#533b27',
        'neon-forge':'#28191f','neon-abyss':'#092f43',
        'neon-forest':'#263b2e','neon-porcelain':'#e5eef2'}

def rgb(hex_value):
    return tuple(int(hex_value[n:n+2],16) for n in (1,3,5))

folder=site/'theme-decks-raster'
folder.mkdir(exist_ok=True)
css=['<style id="tav-private-preview-opaque-cardbacks">',
     '/* PRIVATE PREVIEW. Full-alpha-free RGB WebP images, local and offline.',
     '   SVG art remains in source, while mobile GPU receives raster textures. */']
for ident in ids:
    svg=(site/'theme-decks'/f'{ident}.svg').read_bytes()
    png=cairosvg.svg2png(bytestring=svg,output_width=480,output_height=672)
    sprite=Image.open(BytesIO(png)).convert('RGBA')
    bg=Image.new('RGBA',sprite.size,rgb(colors[ident])+(255,))
    bg.alpha_composite(sprite)
    target=folder/f'{ident}.webp'
    bg.convert('RGB').save(target,'WEBP',quality=86,method=6)
    assert Image.open(target).mode=='RGB'
    css.append(
        f':root[data-tav-palette="{ident}"]{{'
        f'--tg-deck-image:url("./theme-decks-raster/{ident}.webp"),'
        'radial-gradient(ellipse at center,var(--deck-accent) 0 10%,transparent 12%),'
        'linear-gradient(150deg,var(--deck-core2),var(--deck-core)) !important;}')
css.extend([
    ':root[data-tav-palette^="neon-"] :is(.card-back,.big-card.card-back,.mini-card){',
    ':root[data-tav-palette^="neon-"] #sceneGame:is(#sceneGame) :is(.card-back,.big-card.card-back,.mini-card),',
    ':root[data-tav-palette^="neon-"] #sceneGame:is(#sceneGame) #seats .seat .mini-card{',
    'background-color:var(--deck-core,#13283a)!important;',
    'background-size:100% 100%!important;background-repeat:no-repeat!important;',
    'background-position:center!important;}',
    '</style>',
])
page=html_file.read_text(encoding='utf-8')
assert page.count('</head>')==1
assert 'tav-private-preview-opaque-cardbacks' not in page
page=page.replace('</head>','\n'.join(css)+'\n</head>',1)
html_file.write_text(page,encoding='utf-8')

sw_file=site/'sw.js'
sw=sw_file.read_text(encoding='utf-8')
start=sw.find("'./theme-decks/neon-")
assert start>=0,'Service worker cache list changed'
sw=sw[:start]+''.join(
    f"  './theme-decks-raster/{ident}.webp',\n" for ident in ids
)+sw[start:]
sw=sw.replace('taverna-pwa-preview-4temas-v1',
              'taverna-pwa-preview-4temas-cardfix-v2')
sw_file.write_text(sw,encoding='utf-8')
print('PREVIEW_OPAQUE_DECKS_OK:',len(ids),'RGB WebP cards; original SVG assets preserved')
