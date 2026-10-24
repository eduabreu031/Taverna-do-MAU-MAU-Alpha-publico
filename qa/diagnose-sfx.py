from pathlib import Path
import re,sys
s=(Path(sys.argv[1])/'index.html').read_text(encoding='utf8')
for needle in ['sfx','effectsEnabled','soundEnabled','somAtivo','soundToggle','audioEnabled','somBtn','soundBtn','somHabilitado','sfxEnabled','fxEnabled','Som']:
 print('AUDIO_REF',needle,'COUNT',len(list(re.finditer(re.escape(needle),s,re.I))))
 matches=list(re.finditer(re.escape(needle),s,re.I))
 for m in matches[:4]:print('AUDIO_NEAR',needle,repr(s[max(0,m.start()-110):m.end()+150])[:320])
