from PIL import Image,ImageOps
from io import BytesIO
from pathlib import Path
import cairosvg, base64, sys
root=Path(__file__).resolve().parents[1]
site=Path(sys.argv[1]) if len(sys.argv)>1 else root/'site'
source_file=root/'qa/premium-preview-art-v58.b64'
BASE={}
for line in source_file.read_text('utf8').splitlines():
    name,data=line.split(':',1)
    BASE[name]=Image.open(BytesIO(base64.b64decode(data))).convert('RGB')
assert set(BASE)=={'porcelain','green','blue','pink'}
# Identidade visual de cada tema. Modelo original dos 4 aprovados preservado.
CONFIG={
 'neon-porcelain':('porcelain',None,None,None),
 'neon-green':('green',None,None,None),
 'neon-blue':('blue',None,None,None),
 'neon-pink':('pink',None,None,None),
 'neon-tavern-dark':('pink',('#160c17','#6e3742','#ebaca4'),'raven','#edbca4'),
 'neon-aero':('porcelain',('#0e5266','#3d9dad','#e3fff9'),'wave','#d5fff7'),
 'neon-imperial':('pink',('#1c1427','#56334b','#e1be86'),'crown','#ffdb91'),
 'neon-amber':('blue',('#23170e','#a3743d','#ffe2ac'),'sun','#fff1c8'),
 'neon-forge':('blue',('#1b1317','#8d3930','#f9b470'),'dragon','#ffcb8b'),
 'neon-abyss':('blue',('#061d30','#1c6989','#b8fff3'),'pearl','#aaf7ef'),
 'neon-forest':('green',('#101f19','#52724a','#d5dfa1'),'oak','#e4eab7')}
MOTIFS={
 'raven': '<path d="M67 183Q78 148 99 153Q99 129 120 118Q140 129 140 153Q164 146 173 183Q149 170 134 182L120 207L106 182Q90 170 67 183Z" fill="url(#metal)" stroke="#e3b0a2" stroke-width="2"/><path d="M104 153L120 166L136 153L127 175L120 190L113 175Z" fill="#28121e" stroke="#f9d5ca" stroke-width="2"/><path d="M84 164l19 9m53-9l-19 9" stroke="#ffd3c2" stroke-width="1.6"/><path d="M113 142l7-15 7 15" stroke="#e7b7a5" stroke-width="2" fill="none"/>',
 'wave': '<path d="M120 112Q83 153 88 174Q92 203 120 215Q149 204 152 174Q156 153 120 112Z" fill="url(#metal)" stroke="#e5fffd" stroke-width="2.5"/><path d="M103 168Q117 147 132 167M98 185q22-15 45-1M102 197q17-10 37-2" fill="none" stroke="#1e647b" stroke-width="3"/><circle cx="116" cy="153" r="6" fill="#f0ffff" opacity=".8"/>',
 'crown': '<path d="M76 158l-5-39 26 23 23-37 23 37 26-23-5 39Z" fill="url(#metal)" stroke="#ffe1a0" stroke-width="2.6"/><path d="M75 164h90v19H75Z" fill="#47243f" stroke="#ffe5ac" stroke-width="3"/><path d="M87 164h66M120 141v26" stroke="#fff0ca" stroke-width="1.3"/><path d="M120 189l27 24-27 28-27-28Z" fill="#3b2440" stroke="#e6bd86" stroke-width="2"/><path d="M120 201l9 12-9 14-9-14Z" fill="#efb77e"/>',
 'sun': '<circle cx="120" cy="165" r="43" fill="#7c4f1f" stroke="#ffe6a2" stroke-width="3"/><circle cx="120" cy="165" r="31" fill="url(#metal)" stroke="#fff1cb" stroke-width="2"/><circle cx="120" cy="165" r="18" fill="#8a5727" stroke="#ffe6a2" stroke-width="2"/><path d="M120 105v17M120 208v17M60 165h17M163 165h17M77 123l13 13M150 195l13 13M77 207l13-13M150 135l13-13" fill="none" stroke="#ffe6a2" stroke-width="5" stroke-linecap="round"/><path d="M120 143l8 22-8 22-8-22Z" fill="#ffeec1"/>',
 'dragon': '<path d="M86 217Q80 193 97 181Q72 176 74 151Q88 162 105 156Q104 137 126 119L148 101L143 127L163 136L143 145Q155 159 150 176L170 198L146 194Q122 215 86 217Z" fill="url(#metal)" stroke="#ffd0a0" stroke-width="2.5"/><path d="M122 138l-9 28 26-17M108 177Q126 188 143 174" stroke="#2d151d" stroke-width="3" fill="none"/><circle cx="140" cy="139" r="3" fill="#ffefbb"/><path d="M85 204q-12-21 0-36M97 221l-18 16" fill="none" stroke="#ffa05b" stroke-width="2"/>',
 'pearl': '<path d="M120 101Q166 138 164 177Q161 214 120 239Q79 214 76 177Q75 137 120 101Z" fill="#0e2d4d" stroke="#8beef0" stroke-width="2.6"/><circle cx="120" cy="166" r="33" fill="url(#metal)" stroke="#efffff" stroke-width="2.6"/><circle cx="111" cy="154" r="10" fill="#efffff" opacity=".7"/><path d="M85 208q35 22 70 0M96 220q24 17 48 0" stroke="#6de6eb" stroke-width="2" fill="none"/>',
 'oak': '<path d="M120 213v-74M120 186Q99 167 88 151M120 166Q149 155 155 137" stroke="#e5d7a1" stroke-width="3.5" fill="none"/><path d="M119 148Q82 141 85 117Q95 108 107 116Q118 96 133 114Q158 106 163 129Q159 147 135 148Z" fill="url(#metal)" stroke="#e4eab7" stroke-width="2.4"/><path d="M120 111v37M96 123l24 14 29-13" stroke="#314c32" stroke-width="2" fill="none"/><path d="M120 222q-9 13 0 20q10-7 0-20" fill="#c1a66b" stroke="#f9e7a4" stroke-width="1.6"/>'}
def recolor(base,cols):
    # No heavyweight numerical dependency; vector highlights stay crisp.
    img=base.resize((480,672),Image.Resampling.LANCZOS)
    if not cols:return img
    grey=ImageOps.autocontrast(ImageOps.grayscale(img),cutoff=0.3)
    colored=ImageOps.colorize(grey,black=cols[0],mid=cols[1],white=cols[2],midpoint=145)
    # A restrained share of print grain from the approved screenshot.
    return Image.blend(colored,img,.045)

def make_overlay(name,accent):
 metal={'raven':'#a65a61','wave':'#67d2d8','crown':'#c59c75','sun':'#f0bd62','dragon':'#dd7855','pearl':'#68d4e2','oak':'#91a36e'}
 icon=MOTIFS[name]
 dk={'raven':'#271322','wave':'#155d71','crown':'#2b1935','sun':'#513014','dragon':'#2d1619','pearl':'#0d2740','oak':'#1b3329'}[name]
 svg=f'''<svg xmlns="http://www.w3.org/2000/svg" width="240" height="336" viewBox="0 0 240 336"><defs><linearGradient id="metal" x1="0" y1="0" x2="1" y2="1"><stop stop-color="{accent}"/><stop offset=".44" stop-color="{metal[name]}"/><stop offset=".75" stop-color="{dk}"/><stop offset="1" stop-color="{accent}"/></linearGradient><radialGradient id="center"><stop stop-color="{dk}" stop-opacity="1"/><stop offset=".83" stop-color="{dk}" stop-opacity=".98"/><stop offset="1" stop-color="{dk}" stop-opacity="0"/></radialGradient></defs><ellipse cx="120" cy="168" rx="60" ry="99" fill="url(#center)"/><ellipse cx="120" cy="168" rx="58" ry="98" stroke="{accent}" stroke-width=".9" stroke-opacity=".73" fill="none"/><ellipse cx="120" cy="168" rx="53" ry="92" stroke="{metal[name]}" stroke-width=".8" fill="none"/><path d="M120 68l7 9-7 10-7-10Z M120 249l7 9-7 10-7-10Z" fill="{metal[name]}" stroke="{accent}" stroke-width=".8"/><path d="M56 166l9-8 9 8-9 8Z M166 166l9-8 9 8-9 8Z" stroke="{accent}" stroke-width=".75" fill="none"/>{icon}</svg>'''
 return Image.open(BytesIO(cairosvg.svg2png(bytestring=svg.encode(),output_width=480,output_height=672))).convert('RGBA')

def run():
    folder=site/'theme-decks-raster'
    folder.mkdir(exist_ok=True)
    for ident,(source,colors,motif,accent) in CONFIG.items():
        im=recolor(BASE[source],colors)
        if motif:
            im=Image.alpha_composite(im.convert('RGBA'),make_overlay(motif,accent)).convert('RGB')
        # Visual puro: substitui apenas o bitmap entregue ao CSS do verso.
        target=folder/(ident+'.webp')
        im.save(target,'WEBP',quality=89,method=6)
        with Image.open(target) as saved:
            assert saved.size==(480,672) and saved.mode=='RGB'
        assert target.stat().st_size<135000,(ident,'bitmap acima do orçamento mobile')
    print('PREMIUM_PREVIEWS_V58_OK:',len(CONFIG),'WebP RGB; 4 referências aprovadas, 7 materiais exclusivos')
if __name__=='__main__':run()