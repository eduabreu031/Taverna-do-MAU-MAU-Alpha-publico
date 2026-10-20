from pathlib import Path
import re
h=Path('site/index.html').read_text()
patterns=[r'const API=',r'new WebSocket',r'/api/room',r'function connect',r'function enter',r'async function',r'ownerToken',r'botStoreKey',r'betaSpectatorBanner']
for p in patterns:
 print('PATTERN',p,'COUNT',len(list(re.finditer(p,h))))
 for m in list(re.finditer(p,h))[:3]:
  print('CONTEXT',repr(h[max(0,m.start()-260):m.start()+430]))
