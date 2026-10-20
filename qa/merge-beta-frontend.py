#!/usr/bin/env python3
"""Apply the reviewed Beta v91 delta via a three-way merge onto current Alpha HTML.
This never replaces the original from an old Alpha commit directly.
Keep the existing Alpha's PWA/icon/rules release step afterwards.
"""
from pathlib import Path
import hashlib
import json
import subprocess
import tempfile

root=Path(__file__).resolve().parents[1]
current=root/'site'/'index.html'
data=json.loads((root/'qa'/'full-beta-delta-v91.json').read_text('utf-8'))
base=subprocess.check_output(['git','show',data['source_commit']+':site/index.html'],cwd=root)
assert hashlib.sha256(base).hexdigest()==data['source_sha256'], 'Base da Beta divergente'
assert len(current.read_bytes())>4_000_000
lines=base.decode('utf-8').splitlines(keepends=True)
# Livro e ícones já são adicionados pelo script independente da Alpha v91.
skip={2,5,6,36}
for i,op in reversed(list(enumerate(data['ops']))):
    if i in skip:continue
    assert 0<=op['start']<=op['end']<=len(lines), (i,op['start'],op['end'])
    lines[op['start']:op['end']]=[op['insert']]
beta=''.join(lines).encode('utf-8')
with tempfile.TemporaryDirectory() as tmp:
    basefile=Path(tmp)/'base.html'
    betafile=Path(tmp)/'beta.html'
    basefile.write_bytes(base)
    betafile.write_bytes(beta)
    # Prefer Beta only where a 3-way merge truly conflicts.
    # All non-conflicting changes since Alpha v3 are retained.
    result=subprocess.run(['git','merge-file','--theirs','-p',
                str(current),str(basefile),str(betafile)],
                cwd=root,capture_output=True)
    assert result.returncode in (0,1),result.stderr.decode()[:2000]
    html=result.stdout.decode('utf-8')
    assert '<<<<<<<' not in html and '=======' not in html and '>>>>>>>' not in html,'Merge não resolvido'
    print('MERGE_RESULT',result.returncode, len(html))
beta_url='https://taverna-multiplayer-beta.edulopes941.workers.dev'
prod_url='https://taverna-multiplayer-servidor.edulopes941.workers.dev'
assert html.count(beta_url)==1, 'Endpoint Beta ausente ou multiplicado'
html=html.replace(beta_url,prod_url)
assert html.count("const API='"+prod_url+"'")==1
for item in ['betaSpectatorBanner','onlineBotsDEV','betaScorePanel','botStoreKey','showFinished','guestFinishTimer']:
    assert item in html,'Faltando recurso '+item
assert 'id="chooseRules"' not in html,'O livro duplicaria o menu'
html=html.replace('Taverna do MAU MAU — BETA v91','Taverna do MAU MAU — TESTES PÚBLICOS v91',1)
current.write_text(html,encoding='utf-8')
print('FRONTEND_BETA_MERGED',len(html),'chars, endpoint Alpha original preservado')
