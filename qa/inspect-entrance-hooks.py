from pathlib import Path
import re
s=Path('site/index.html').read_text(encoding='utf8')
s=re.sub(r'data:image/[^"\s]+','[image]',s)
for key in ["musicBtn","arautoBtn","musicOn","radioOn","audio-on","narrator","narrate","araUto","arauto","Rádio","musicEnabled","musicOn","playMusic","playArauto","tavernRadio","radioEnabled","audioEnabled"]:
 ms=list(re.finditer(re.escape(key),s,re.I))
 print('KEY',key,'COUNT',len(ms))
 for m in ms[-5:]:
  print('HIT',s[max(0,m.start()-175):m.end()+240].replace('\n',' ')[:450])
