from pathlib import Path
h=Path('site/index.html').read_text()
for p in ["new WebSocket","ownerToken","onlineBotsDEV","onlineSaveBotsDEV","startWithBots","botStoreKey","bot=1","bot='","function launchBot","function spawnBot","botCount"]:
 print('PATTERN',p,'COUNT',h.count(p))
 for k in range(min(h.count(p),5)):
  at=h.find(p,0 if k==0 else at+len(p))
  print('FRAGMENT',repr(h[max(0,at-900):at+1450]))
