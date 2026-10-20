from pathlib import Path
h=Path('site/index.html').read_text()
for name in ['onlineCreate','onlineJoin','onlineRoomCode','onlineLobby','sceneMultiplayer','function connect(code','if(m.type===\'welcome\')','function reset','el(\'onlineCreate\').onclick']:
 print('TARGET',name)
 at=0
 for k in range(3):
  i=h.find(name,at)
  if i<0:break
  print('FRAGMENT',repr(h[max(0,i-700):i+1200]))
  at=i+len(name)
