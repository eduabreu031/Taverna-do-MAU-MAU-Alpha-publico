#!/usr/bin/env python3
"""Aplicar UI Alpha v93 depois do merge Beta e das melhorias v91; sem modificar regras/Worker."""
from pathlib import Path
import json,re,sys
root=Path(__file__).resolve().parents[1]
site=Path(sys.argv[1]) if len(sys.argv)>1 else root/'site'
index=site/'index.html'
html=index.read_text(encoding='utf-8')
assert len(html)>4_000_000,'HTML da Alpha incompleto'
assert html.count('</head>')==1 and html.count('</body>')==1
assert 'id="chooseRules"' in html and 'betaSpectatorBanner' in html, 'Atualização v91 ausente'
assert 'https://taverna-multiplayer-servidor.edulopes941.workers.dev' in html
assert 'taverna-multiplayer-beta.edulopes941.workers.dev' not in html
assert 'alphaTopTools' not in html and 'alphaInformationOverlay' not in html,'UI v92 duplicada'
data=json.loads((root/'qa/alpha-releases.json').read_text('utf-8'))
assert data['current']=='alpha-0.4.98.0'
assert data['entries'][0]['id']==data['current']
assert all(isinstance(r['items'],list) and r['items'] for r in data['entries'])
assert data['issuesRepo']=='eduabreu031/Taverna-do-MAU-MAU-Alpha-publico'
css=(root/'qa/alpha-v92-feedback.css').read_text('utf-8')
js=(root/'qa/alpha-v92-feedback.js').read_text('utf-8')
assert js.count('/*ALPHA_RELEASES_JSON*/')==1
dump=json.dumps(data,ensure_ascii=False,separators=(',',':')).replace('</','<\\/')
js=js.replace('/*ALPHA_RELEASES_JSON*/',dump)
assert '</script' not in js.lower(), 'Script HTML poderia ser encerrado prematuramente'
html=html.replace('</head>','<style id="alpha-v92-style">\n'+css+'\n</style>\n</head>',1)
html=html.replace('</body>','<script id="alpha-v92-script">\n'+js+'\n</script>\n</body>',1)
html=html.replace('Taverna do MAU MAU — TESTES PÚBLICOS v91','Taverna do MAU MAU — 0.4.98.0-alpha',1)
assert html.count("betaTag.textContent='BETA · TAVERNA';betaTag.hidden=true")==1, 'Selo Beta esperado no multiplayer'
html=html.replace("betaTag.textContent='BETA · TAVERNA';betaTag.hidden=true", "betaTag.textContent='';betaTag.hidden=true;betaTag.style.display='none'")
index.write_text(html,encoding='utf-8')
sw=site/'sw.js'
content=sw.read_text(encoding='utf-8')
updated,num=re.subn(r"const CACHE = '[^']+';","const CACHE = 'taverna-pwa-alpha-0.4.98.0-01';",content,count=1)
assert num==1
sw.write_text(updated,encoding='utf-8')
print('ALPHA_0_4_96_0_READY: changelog, reports, GitHub issues, version, cache')
