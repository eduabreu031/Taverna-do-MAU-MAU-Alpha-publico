#!/usr/bin/env python3
"""Adapta a interface Alpha gerada, preservando o motor offline e o multiplayer."""
from pathlib import Path
import re,sys
root=Path(__file__).resolve().parents[1]
site=Path(sys.argv[1]) if len(sys.argv)>1 else root/'site'
page=site/'index.html'
html=page.read_text(encoding='utf-8')
assert len(html)>4_000_000 and 'id="alpha-accounts-script"' in html and 'id="tav-vip-bots-ui"' in html

# A mensagem é confirmada pelo cliente antes de fechar o WebSocket.
needle="if(m.type==='error'){startPending=false;refreshReadyAfterBots();message('Servidor: '+(m.message||'Ação rejeitada'));return;}"
assert html.count(needle)==1,('Cliente multiplayer mudou',html.count(needle))
html=html.replace(needle,
 "if(m.type==='removed_by_admin'){close(false);el('sceneMultiplayer').classList.add('hidden');el('sceneWelcome').classList.remove('hidden');window.TavernaRemovalNotice?.();return;}\n  if(m.type==='room_expired'){close(true);el('sceneMultiplayer').classList.add('hidden');el('sceneWelcome').classList.remove('hidden');window.TavernaRoomExpiredNotice?.();return;}\n  "+needle,1)

# O apelido automático não vira preferência persistida do navegador.
# O PWA ainda mantém os assets estáticos necessários ao modo offline.
readName="const saved=localStorage.getItem('mau2_player_name');if(saved)$('playerName').value=saved;"
assert html.count(readName)==1,('Restaurador de nome inesperado',html.count(readName))
html=html.replace(readName,"const saved='';",1)
saveName="try{localStorage.setItem('mau2_player_name',name)}catch(_){ }"
assert html.count(saveName)==1,('Persistência de nome inesperada',html.count(saveName))
html=html.replace(saveName,"/* Apelidos de visitante não persistem após fechar a aba. */",1)

# O endereço no backend preserva a sessão só quando é uma conta real.
# Visitantes têm sessão efêmera em memória, inclusive para reconexão na mesma aba.
needle="const key=c=>'taverna-beta-session-'+c;"
assert html.count(needle)==1,('Chave de sessão inesperada',html.count(needle))
mem="""const volatileGuestSessions=new Map();
const guestSessionStore={
 get(k){return window.TavernaAuth?.getUser()?.role==='guest'?(volatileGuestSessions.get(k)||null):store.get(k);},
 set(k,v){if(window.TavernaAuth?.getUser()?.role==='guest')volatileGuestSessions.set(k,v);else store.set(k,v);},
 del(k){if(window.TavernaAuth?.getUser()?.role==='guest')volatileGuestSessions.delete(k);else store.del(k);}
};
"""
html=html.replace(needle,needle+'\n'+mem,1)
counts={}
for operation in ('get','set','del'):
 html,n=re.subn(r'\bstore\.'+operation+r'\(key\(', 'guestSessionStore.'+operation+'(key(',html)
 counts[operation]=n
assert any(counts.values()),('Nenhuma operação de sessão localizada',counts)
# Desabilitar armazenamento de robôs quando a conta é visitante.
needle="function persistBots(){if(!room)return;store.set(botStoreKey(room)"
assert html.count(needle)==1,('persistBots divergiu',html.count(needle))
html=html.replace(needle,"function persistBots(){if(!room||window.TavernaAuth?.getUser()?.role==='guest')return;store.set(botStoreKey(room)",1)
needle="function restoreBots(){"
assert html.count(needle)==1
html=html.replace(needle,"function restoreBots(){if(window.TavernaAuth?.getUser()?.role==='guest')return;",1)

js=(root/'qa/visitor-entry.js').read_text(encoding='utf-8')
assert '</script' not in js.lower()
html=html.replace('</body>','<script id="tav-visitor-entry">\n'+js+'\n</script>\n</body>',1)
page.write_text(html,encoding='utf-8')
print('VISITOR_UI_READY',len(html),'session_ops',counts)
