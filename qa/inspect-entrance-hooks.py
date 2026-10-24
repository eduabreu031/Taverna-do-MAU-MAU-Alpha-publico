from pathlib import Path
import re
s=Path('site/index.html').read_text(encoding='utf8')
s=re.sub(r'data:image/[^"\s]+','[image]',s)
for key in ["musicBtn","arautoBtn","musicOn","radioOn","audio-on","narrator","narrate","araUto","arauto","Rádio","musicEnabled","musicOn","playMusic","playArauto","tavernRadio","radioEnabled","audioEnabled"]:
 ms=list(re.finditer(re.escape(key),s,re.I))
 print('KEY',key,'COUNT',len(ms))
 for m in ms[-5:]:
  print('HIT',s[max(0,m.start()-175):m.end()+240].replace('\n',' ')[:450])

print('AR_FUNCS')
for name in sorted(set(re.findall(r'\b(arauto[A-Z]\w*)\s*\(',s))):
 print('FUNC',name)
 m=re.search(r'function\s+'+re.escape(name)+r'\s*\(',s)
 if m:print('DEF',s[m.start():m.start()+950])
print('V63_OPEN',s[s.find('function v63OpeningAnnouncement'):s.find('function v63OpeningAnnouncement')+850])
print('TOGGLE_MUSIC',s[s.find('function toggleMusic'):s.find('function toggleMusic')+830])
print('AUDIO_PREFERENCES')
for key in ['localStorage.getItem','localStorage.setItem','ui.musicOn','arautoEnabled']:
 matches=list(re.finditer(re.escape(key),s))
 for m in matches[:4]:print(key,s[max(0,m.start()-105):m.end()+165].replace('\n',' '))
