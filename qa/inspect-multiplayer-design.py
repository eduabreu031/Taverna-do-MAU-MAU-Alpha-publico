from pathlib import Path
import re
h=Path('site/index.html').read_text('utf-8')
for marker in ['id="sceneMultiplayer"','id="onlineLobby"','id="onlineCreate"','id="onlineJoin"','id="onlineRoomCode"','id="onlineBotsDEV"','id="onlineLeave"']:
 p=h.find(marker)
 print('LAYOUT_MARKER',marker,'AT',p)
 if p>=0: print('LAYOUT_HTML',h[max(0,p-190):p+(2200 if marker=='id="sceneMultiplayer"' else 650)].replace(chr(10),' ')[:2500])
for pattern in ['confirm(', 'window.confirm(', 'prompt(', 'window.prompt(', 'alert(', 'window.alert(', '<select']:
 pos=0; hits=[]
 while True:
  p=h.find(pattern,pos)
  if p<0:break
  hits.append(p);pos=p+len(pattern)
 print('NATIVE_PATTERN',pattern,'COUNT',len(hits))
 for p in hits[:23]: print('NATIVE_CONTEXT',h[max(0,p-170):p+210].replace(chr(10),' '))
