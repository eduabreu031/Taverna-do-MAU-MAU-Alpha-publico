#!/usr/bin/env python3
"""Inclui comunicação e votação apenas no controlador multiplayer da Alpha."""
from pathlib import Path
import sys

site=Path(sys.argv[1]) if len(sys.argv)>1 else Path('site')
page=site/'index.html'
html=page.read_text(encoding='utf8')
assert 'id="online-v84-controller"' in html
assert "skipFinalPanel.id='onlineSkipFinalPanel'" in html
assert 'tavSocialLauncher' not in html

def once(a,b):
 global html
 count=html.count(a)
 assert count==1,(a[:120],count)
 html=html.replace(a,b,1)

css=(Path(__file__).with_name('social-client-style.css')).read_text(encoding='utf8')
code=(Path(__file__).with_name('social-client-snippet.js')).read_text(encoding='utf8')
assert '</style>' not in css and '</script>' not in code
once('</head>','<style id="tav-social-feature-styles">\n'+css+'\n</style>\n</head>')
once('document.body.append(finishPanel);','document.body.append(finishPanel);\n'+code)
once("if(m.type==='error'){startPending=false;finishLobby.disabled=false;",
     "if(m.type==='social_event'){tavIncomingSocial(m);return;}\n"+
     "  if(m.type==='removed_by_vote'){tavRemovedByVote(m);return;}\n"+
     "  if(m.type==='error'){startPending=false;finishLobby.disabled=false;")
once("showFinished(game);showSkipFinal(m.skipFinal);",
     "showFinished(game);showSkipFinal(m.skipFinal);tavUpdateSocialFromState(m);")
once("if(!m.game&&game){\n   showSkipFinal(null);",
     "if(!m.game&&game){\n   showSkipFinal(null);tavUpdateSocialFromState(m);")
page.write_text(html,encoding='utf8')
print('SOCIAL_FEATURES_READY',len(html))
