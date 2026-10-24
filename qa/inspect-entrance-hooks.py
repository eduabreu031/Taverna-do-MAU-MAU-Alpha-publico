from pathlib import Path
s = Path('site/index.html').read_text(encoding='utf8')
for key in ['radioBtn', 'musicBtn', 'soundBtn', 'Arauto', 'narrat', 'music', 'radio']:
 print(key,s.count(key))
 p=s.find(key)
 if p>=0: print(s[max(0,p-160):p+300])
