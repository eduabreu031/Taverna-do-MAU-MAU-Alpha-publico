from pathlib import Path
import re,json
s=Path('site/index.html').read_text(encoding='utf-8')
styles='\n'.join(re.findall(r'<style\b[^>]*>(.*?)</style>',s,re.I|re.S))
def clean(x):
 x=re.sub(r'data:image/[^"\'\s)]+','<EMBEDDED_IMAGE>',x)
 x=re.sub(r'url\([^)]{300,}\)','url(<IMAGE>)',x)
 return ' '.join(x.replace('\n',' ').split())[:1500]
terms=['suit-overlay','suitOverlay','chooseSuit','choose-suit','suit-choice','suitPick','suit-picker','suit-screen','Escolha o naipe','suitChooser','card-back','card-face','playing-card','cardBack','renderCard','cardSvg','cardHTML','cardEl','buildCard','card-front','seat-panel','seat[data-seat','npc-seat','bot-seat','seat-portrait','seat .','seat{','tableShell','.felt','humanZone','drawPile','discardPile','card-art']
for term in terms:
 matches=list(re.finditer(re.escape(term),s,re.I))
 print('FIND',term,'COUNT',len(matches))
 for m in matches[:3]:
  print('EXAMPLE',term,m.start(),clean(s[max(0,m.start()-230):m.start()+850]))
# Real CSS rules, ignore huge embedded styles
for selector in ['suit','card','seat','human-zone','portrait','tableShell']:
 rules=[]
 for m in re.finditer(r'([^{}]{1,300})\{([^{}]{1,1700})\}',styles):
  sel,body=m.group(1).strip(),m.group(2)
  if selector.lower() in sel.lower() and not sel.startswith('@'):
   rules.append((clean(sel),clean(body)))
 print('CSSRULES',selector,'COUNT',len(rules))
 for a,b in rules[:38]: print('RULE',selector,repr(a),repr(b[:550]))
# ids/classes near choice markup
for pat in ['id="suit','class="suit','id="card','class="card']:
 for m in list(re.finditer(re.escape(pat),s,re.I))[:8]:
  print('HTMLTAG',pat,clean(s[max(0,m.start()-100):m.start()+470]))
