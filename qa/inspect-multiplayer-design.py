from pathlib import Path
import re
h=Path('site/index.html').read_text('utf-8')
for marker in ['id="sceneMultiplayer"','id="onlineLobby"','id="onlineCreate"','id="onlineJoin"','id="onlineRoomCode"','id="onlineBotsDEV"','id="onlineLeave"']:
 p=h.find(marker)
 print('LAYOUT_MARKER',marker,'AT',p)
 if p>=0: print('LAYOUT_HTML',h[max(0,p-190):p+(2200 if marker=='id="sceneMultiplayer"' else 650)].replace(chr(10),' ')[:2500])
for pattern in [r'(?:window[.])?(?:confirm|prompt|alert)\\s*\\(',r'<select\\b']:
 matches=list(re.finditer(pattern,h,re.I))
 print('NATIVE_PATTERN',pattern,'COUNT',len(matches))
 for m in matches[:38]: print('NATIVE_CONTEXT',h[max(0,m.start()-130):m.end()+180].replace(chr(10),' '))
