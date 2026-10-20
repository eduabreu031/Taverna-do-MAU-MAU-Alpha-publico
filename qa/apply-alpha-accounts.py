#!/usr/bin/env python3
"""Integra autenticação ao multiplayer já montado da Alpha, sem tocar no motor offline."""
from pathlib import Path
import sys
root=Path(__file__).resolve().parents[1]
site=Path(sys.argv[1]) if len(sys.argv)>1 else root/'site'
file=site/'index.html'
html=file.read_text(encoding='utf-8')
assert len(html)>4_000_000, 'HTML incompleto; abortando'
assert 'alphaAccountsOverlay' not in html, 'Auth já injetada'
controller='<script id="online-v84-controller">'
assert html.count(controller)==1, 'Controlador online não encontrado ou duplicado'
replacements={
    'function connect(code,existingToken=\'\'){': 'async function connect(code,existingToken=\'\'){',
    'let socket;try{socket=new WebSocket(url)}catch(e)':"let socket;try{url.searchParams.set('pass',await window.TavernaAuth.pass(code));socket=new WebSocket(url)}catch(e)",
    "const res=await fetch(API+'/api/room',{method:'POST'});if(!res.ok)throw Error('Servidor respondeu '+res.status);const m=await res.json();connect(m.code);":"const m=await window.TavernaAuth.roomRequest('/api/room');connect(m.code);",
}
for before,after in replacements.items():
    qty=html.count(before)
    assert qty==1,(before,qty)
    html=html.replace(before,after,1)
js=(root/'qa/alpha-accounts.js').read_text(encoding='utf-8')
css=(root/'qa/alpha-accounts.css').read_text(encoding='utf-8')
assert '</script' not in js.lower()
html=html.replace(controller,'<script id="alpha-accounts-script">\n'+js+'\n</script>\n'+controller,1)
assert html.count('</head>')==1
html=html.replace('</head>','<style id="alpha-accounts-style">\n'+css+'\n</style>\n</head>',1)
file.write_text(html,encoding='utf-8')
print('ALPHA_AUTH_INTEGRATED',len(html))
