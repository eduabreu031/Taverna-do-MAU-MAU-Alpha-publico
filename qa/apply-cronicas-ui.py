#!/usr/bin/env python3
"""Injeta apenas interface de Crônicas no build de QA; não publica e não altera regras."""
from pathlib import Path
import json,sys
root=Path(__file__).resolve().parents[1]
site=Path(sys.argv[1]) if len(sys.argv)>1 else root/'site'
path=site/'index.html'
html=path.read_text(encoding='utf-8')
assert len(html)>4_000_000,'O build original do jogo ainda não foi montado'
assert html.count('</head>')==1 and html.count('</body>')==1
for anchor in ('id="alpha-accounts-script"','id="tav-theme-manager"','id="tav-entrance-script"',
               'id="sceneWelcome"','id="sceneMenu"','alphaTopTools'):
    assert anchor in html, 'Âncora de integração ausente: '+anchor
assert 'id="tav-cronicas-script"' not in html and 'id="tav-cronicas-style"' not in html,'Crônicas duplicadas'
catalog=json.loads((root/'qa/cronicas-catalog-preview.json').read_text(encoding='utf-8'))
assert catalog['schema']==1 and len(catalog['achievements'])==60
assert sum(x['glory'] for x in catalog['achievements'])==1000
assert len(set(x['id'] for x in catalog['achievements']))==60
js=(root/'qa/cronicas-ui.js').read_text(encoding='utf-8')
css=(root/'qa/cronicas-ui.css').read_text(encoding='utf-8')
assert js.count('/*TAV_CRONICAS_CATALOG*/')==1
assert '</script' not in js.lower() and '</style' not in css.lower()
serialized=json.dumps(catalog,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')
js=js.replace('/*TAV_CRONICAS_CATALOG*/',serialized)
html=html.replace('</head>','<style id="tav-cronicas-style">\n'+css+'\n</style>\n</head>',1)
html=html.replace('</body>','<script id="tav-cronicas-script">\n'+js+'\n</script>\n</body>',1)
path.write_text(html,encoding='utf-8')
print('CRONICAS_UI_PREVIEW_READY: 60 metas, 1000 G, 4 Ordens, 12 temas; nenhum deploy')
