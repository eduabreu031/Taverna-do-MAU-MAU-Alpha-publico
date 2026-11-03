#!/usr/bin/env python3
"""Generate compatible opaque raster card backs for Android/iOS.

Source SVGs remain in site/theme-decks; RGB WebP variants are produced only
for the deploy build. No game state, card data, or JS changes.
"""
from pathlib import Path
from io import BytesIO
from PIL import Image
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

# CARD_BACK_ART_V57 — acabamento autoral para TODAS as 11 variantes.
# Trabalha somente pixels/vetores do verso; dados de cartas, regras e eventos
# do jogo permanecem completamente fora do escopo.
ART_V57 = {
 'neon-blue': ('#c5eaff','#83abff','#27316e','arcane'),
 'neon-green': ('#d6ffdf','#6ddab0','#103c37','leaves'),
 'neon-pink': ('#ffe2f6','#ee91d7','#4f2058','jewel'),
 'neon-tavern-dark': ('#e4b6af','#a87881','#25101d','gothic'),
 'neon-aero': ('#edfff7','#77d2cd','#2d7f96','waves'),
 'neon-imperial': ('#ffe1b0','#c49b6a','#35233b','crown'),
 'neon-amber': ('#ffe1a0','#cd9b52','#4a301e','sun'),
 'neon-forge': ('#ffd4a0','#db8456','#291518','forge'),
 'neon-abyss': ('#c8fff1','#76cfd0','#073c50','ocean'),
 'neon-forest': ('#eff5cf','#9ebc82','#233c2c','branches'),
 'neon-porcelain': ('#2d668f','#79a1c4','#edf3f4','ceramic'),
}
def motif_v57(key,metal,light):
    """Detalhe exclusivamente secundário, próprio do material de cada tema."""
    m = {
     'arcane': '<path d="M45 124l8-17 8 17-8 16zM179 212l8-17 8 17-8 16z" fill="none" stroke="{m}" stroke-width="1.5"/><path d="M53 114v20M187 202v20" stroke="{l}" stroke-width="1"/>',
     'leaves': '<path d="M43 139q3-18 20-21q-1 18-20 21zm153 56q-19 3-22 22q19-1 22-22z" fill="{m}" fill-opacity=".3" stroke="{m}" stroke-width="1.4"/><path d="M43 139l20-21M196 195l-22 22" stroke="{l}" stroke-width=".9"/>',
     'jewel': '<path d="M44 142l10-14 10 14-10 15zm132 52l10-14 10 14-10 15z" fill="{m}" fill-opacity=".22" stroke="{l}" stroke-width="1.5"/><path d="M54 129v27M186 181v28" stroke="{m}" stroke-width=".9"/>',
     'gothic': '<path d="M47 124v47l9-12-9-12M193 212v-47l-9 12 9 12" fill="none" stroke="{l}" stroke-width="1.6"/><path d="M43 116h9M188 220h9" stroke="{m}" stroke-width="2"/>',
     'waves': '<path d="M39 133q12-13 24 0t-24 13M177 202q12-13 24 0t-24 13M39 157q12-13 24 0M177 225q12-13 24 0" fill="none" stroke="{l}" stroke-width="1.5"/>',
     'crown': '<path d="M42 153l2-20 9 10 10-12 2 22zM175 190l2-20 9 10 10-12 2 22z" fill="{m}" fill-opacity=".28" stroke="{l}" stroke-width="1.3"/>',
     'sun': '<path d="M50 132l7-7 7 7-7 7zM176 204l7-7 7 7-7 7zM38 132h7M68 132h7M183 189v7M183 214v7" stroke="{l}" stroke-width="1.5" fill="none"/>',
     'forge': '<path d="M43 120l18-13 9 16-18 13zM170 207l18-13 9 16-18 13z" stroke="{m}" stroke-width="2" fill="none"/><path d="M45 123l23 1M174 210l21 0" stroke="{l}" stroke-width="1.4"/>',
     'ocean': '<path d="M43 141q10-22 21 0q-11 20-21 0zm132 54q10-22 21 0q-11 20-21 0z" fill="{m}" fill-opacity=".2" stroke="{l}" stroke-width="1.3"/><path d="M45 170q8-8 16 0M178 171q8-8 16 0" stroke="{m}" stroke-width="1.4" fill="none"/>',
     'branches': '<path d="M46 115q18 30 1 65M194 221q-18-30-1-65M48 142q-17-8-10-20q15 3 10 20M191 183q15-6 13-18q-17 5-13 18" stroke="{l}" stroke-width="1.5" fill="none"/>',
     'ceramic': '<path d="M42 130q15-18 22 0q-7 17-22 0zM175 210q15-18 22 0q-7 17-22 0zM40 158q13-7 26 0M173 183q13-7 26 0" stroke="{m}" stroke-width="1.5" fill="none"/>',
    }[key]
    return m.replace('{m}',metal).replace('{l}',light).replace('{m}',metal).replace('{l}',light)

def upgrade_svg_v57(original, ident):
    if b'CARD_BACK_ART_V57' in original:
        return original  # Seguro em rebuilds; jamais duplica ornamentação.
    light,metal,dark,key = ART_V57[ident]
    s=original.decode('utf-8')
    assert s.count('</svg>')==1 and 'viewBox="0 0 240 336"' in s
    # Quatro cantos gravados e simétricos, filetes de metal, rebites, incisões,
    # detalhes de material específicos e relevo de impressão.
    corner = '''<g fill="none" stroke="url(#v57metal)" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">
      <path d="M0 27V6Q0 0 6 0H27M6 23Q7 10 20 8Q20 20 8 23M10 30Q23 27 27 14"/>
      <path d="M5 17Q13 16 15 8M17 5L22 10L17 15" stroke-width="1.15"/>
      <path d="M4 31l6 6 6-6M31 4l6 6-6 6" stroke-width="1.15"/>
    </g><path d="M7 7l5 0M7 7l0 5" stroke="{light}" stroke-width=".8"/>'''.replace('{light}',light)
    corners = ''.join('<g transform="%s">%s</g>' % (transform,corner) for transform in (
      'translate(28 28)','translate(212 28) scale(-1 1)',
      'translate(28 308) scale(1 -1)','translate(212 308) scale(-1 -1)'))
    edge_jewels=''.join(f'<path d="M{x} {y-4}l4 4-4 4-4-4z" fill="none" stroke="{metal}" stroke-width="1.1" opacity=".86"/>' for x in (34,206) for y in (78,258))
    side_dashes=''.join(f'<path d="M{x} {y}v9" stroke="{metal}" stroke-width=".8" opacity=".45"/>' for x in (23,217) for y in range(68,265,24))
    center_fillets=f'''<path d="M56 60Q82 48 105 58M135 58Q158 48 184 60M56 276Q82 288 105 278M135 278Q158 288 184 276"
        fill="none" stroke="{light}" stroke-width="1.25" opacity=".65"/>
      <path d="M49 72l7-9 7 9M177 72l7-9 7 9M49 264l7 9 7-9M177 264l7 9 7-9"
        fill="none" stroke="{metal}" stroke-width="1.25"/>'''
    embellishment = f'''<!-- CARD_BACK_ART_V57: impressão detalhada, acabamento independente -->
      <defs><linearGradient id="v57metal" x1="0" y1="0" x2="1" y2="1">
        <stop stop-color="{light}"/><stop offset=".43" stop-color="{metal}"/>
        <stop offset=".72" stop-color="{dark}"/><stop offset="1" stop-color="{light}"/>
      </linearGradient></defs>
      <g pointer-events="none">
        <rect x="10.5" y="10.5" width="219" height="315" rx="11" fill="none" stroke="{light}" stroke-width="1.2" opacity=".83"/>
        <rect x="14.5" y="14.5" width="211" height="307" rx="10" fill="none" stroke="{metal}" stroke-width="2" opacity=".86"/>
        <rect x="19" y="19" width="202" height="298" rx="8" fill="none" stroke="{light}" stroke-width=".7" opacity=".5"/>
        <path d="M34 65V271M206 65V271M58 42H182M58 294H182" fill="none" stroke="{metal}" stroke-width="1.1" opacity=".52"/>
        <path d="M38 80V256M202 80V256" fill="none" stroke="{light}" stroke-width=".55" opacity=".4"/>
        {corners}{edge_jewels}{side_dashes}{center_fillets}
        {motif_v57(key,metal,light)}
        <path d="M73 42h30m34 0h30M73 294h30m34 0h30" stroke="{light}" stroke-width=".55" opacity=".45"/>
        <path d="M101 45l5-4 5 4M129 45l5-4 5 4M101 291l5 4 5-4M129 291l5 4 5-4"
          fill="none" stroke="{metal}" stroke-width="1.05" opacity=".8"/>
        <g fill="{metal}" opacity=".75">
          <circle cx="29" cy="50" r="1.45"/><circle cx="211" cy="50" r="1.45"/>
          <circle cx="29" cy="286" r="1.45"/><circle cx="211" cy="286" r="1.45"/>
        </g>
      </g>'''
    # Apenas acrescenta decoração aos arquivos originais de identidade única.
    result=s.replace('</svg>',embellishment+'</svg>')
    assert len(result)>len(s)+2000
    return result.encode('utf-8')

folder=site/'theme-decks-raster'
folder.mkdir(exist_ok=True)
css=['<style id="tav-opaque-cardbacks">',
     '/* Full-alpha-free RGB WebP images, local and offline.',
     '   SVG art remains in source, while mobile GPU receives raster textures. */']
for ident in ids:
    source=site/'theme-decks'/f'{ident}.svg'
    svg=upgrade_svg_v57(source.read_bytes(),ident)
    source.write_bytes(svg)  # Assets SVG e WebP saem com a MESMA arte.
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
    ':root[data-tav-palette^="neon-"] :is(.card-back,.big-card.card-back,.mini-card),',
    ':root[data-tav-palette^="neon-"] #sceneGame:is(#sceneGame) :is(.card-back,.big-card.card-back,.mini-card),',
    ':root[data-tav-palette^="neon-"] #sceneGame:is(#sceneGame) #seats .seat .mini-card{',
    'background-color:var(--deck-core,#13283a)!important;',
    'background-size:100% 100%!important;background-repeat:no-repeat!important;',
    'background-position:center!important;}',
    '</style>',
])
page=html_file.read_text(encoding='utf-8')
assert page.count('</head>')==1
assert 'tav-opaque-cardbacks' not in page
page=page.replace('</head>','\n'.join(css)+'\n</head>',1)
html_file.write_text(page,encoding='utf-8')

print('OPAQUE_DECKS_OK:',len(ids),'RGB WebP cards; original SVG assets preserved')
