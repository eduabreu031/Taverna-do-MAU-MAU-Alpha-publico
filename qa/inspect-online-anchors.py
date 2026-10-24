from pathlib import Path
import re,sys
s=(Path(sys.argv[1])/'index.html').read_text(encoding='utf8')
names=['id="returnMenu"','returnMenu','sceneGame','player-portrait','seat-portrait','seat-player','portrait','seatCard','online-v84-controller','function renderSeats','function renderPlayers','player-id','sceneMultiplayer','onlineLeave','onlineExit','const lobby=','function close(','if(m.game){','if(m.type===','if(m.type===\'state\')','function showBetaVisitors','lobby.hidden','close(true)']
for needle in names:
 total=s.count(needle)
 print('ANCHOR',repr(needle),'COUNT',total)
 idxs=[m.start() for m in re.finditer(re.escape(needle),s)]
 lim=3 if total>4 else 6
 for i in idxs[-lim:]:
  region=s[max(0,i-380):min(len(s),i+950)]
  region=re.sub(r'data:image/[^"\']+','<BINARY_IMG>',region)
  print('CONTEXT',repr(needle),repr(region[:1300]))
