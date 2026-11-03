#!/usr/bin/env python3
"""Valida a fidelidade das 4 prévias aprovadas e a distinção dos 11 versos.
Sem alterar regras, DOM, botões nem armazenamento do multiplayer."""
from pathlib import Path
from io import BytesIO
from PIL import Image, ImageChops, ImageStat
import sys,base64,hashlib
root=Path(__file__).resolve().parents[1]
site=Path(sys.argv[1]) if len(sys.argv)>1 else root/'site'
source=(root/'qa/premium-preview-art-v58.b64').read_text('utf8').splitlines()
refs={k:Image.open(BytesIO(base64.b64decode(b))).convert('RGB') for k,b in (line.split(':',1) for line in source)}
assert set(refs)=={'blue','green','pink','porcelain'}
files=list((site/'theme-decks-raster').glob('neon-*.webp'))
assert len(files)==11,f'Esperados 11 versos, encontrados {len(files)}'
fingerprints=[]
for f in files:
    with Image.open(f) as im:
        assert im.size==(480,672) and im.mode=='RGB',(f.name,im.size,im.mode)
        assert f.stat().st_size<135000,('Arquivo pesado demais',f.name)
        fingerprints.append(hashlib.sha256(im.tobytes()).hexdigest())
assert len(set(fingerprints))==11,'Pelo menos dois baralhos são idênticos'
for key,id in {'blue':'neon-blue','green':'neon-green','pink':'neon-pink','porcelain':'neon-porcelain'}.items():
    with Image.open(site/'theme-decks-raster'/(id+'.webp')) as raster:
        target=raster.convert('RGB')
    baseline=refs[key].resize((480,672),Image.Resampling.LANCZOS)
    diff=ImageStat.Stat(ImageChops.difference(baseline,target)).mean
    assert max(diff)<17,(id,'Não reproduz a prévia aprovada',diff)
style=(root/'qa/tavern-design-system-v56.css').read_text('utf8')
trophy=(root/'qa/cronicas-ui.js').read_text('utf8')
pause=(root/'qa/offline-pause-engine-v55.js').read_text('utf8')
assert 'tavTrophyMetal58' in trophy and 'tav-trophy-engraving' in trophy
assert 'tavPauseMetal58' in pause and 'tavOfflinePauseBtn' in pause
assert 'svg path[fill]' not in style and 'tav-trophy-cup' in style
assert 'tav-metal-hi' in style and 'neon-porcelain' in style
print('PREVIEW_FIDELITY_V58_OK: 4 prévias reproduzidas + 7 exclusivos + pausa/troféu detalhados')
