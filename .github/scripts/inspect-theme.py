from pathlib import Path
import re, collections, html
source=Path('site/index.html').read_text(encoding='utf8')
print('SOURCE_LENGTH',len(source),'style_blocks',source.count('<style'),'canvas_elements',len(re.findall(r'<canvas\b',source,re.I)),'imgs',len(re.findall(r'<img\b',source,re.I)),'data_image',source.count('data:image/'),'svg',len(re.findall(r'<svg\b',source,re.I)))
for scene in ['sceneWelcome','sceneMenu','sceneGame','sceneMultiplayer','sceneTable','table','felt','tableFelt','gameTable']:
 i=source.find('id="'+scene+'"')
 print('SCENE_TAG',scene,source[max(0,i-280):i+260].replace('\n',' ')[:540] if i>=0 else 'MISSING')
for s in ['data:image/svg+xml','data:image/png','url(data:',"style.background",'canvas.getContext','drawImage','ctx.draw','backgroundImage','--felt','--table','.felt','.table','#sceneGame','.table-felt','.game-table','#sceneWelcome','linear-gradient','radial-gradient','wood','textura']:
 print('STRING_COUNT',s,source.lower().count(s.lower()))
css_blocks=re.findall(r'<style\b[^>]*>(.*?)</style>',source,re.I|re.S)
print('INLINE_CSS_BLOCKS',len(css_blocks),[len(x) for x in css_blocks][:30])
css='\n'.join(css_blocks)
print('CSS_TOTAL_LENGTH',len(css))
bg=[]
for m in re.finditer(r'([^{}]{1,220})\{([^{}]{0,6000})\}',css):
 selector=' '.join(m.group(1).strip().split())
 body=m.group(2)
 if re.search(r'(background|mask-image|filter|border-image)\s*:',body,re.I):
  bgs=re.findall(r'((?:background(?:-[a-z]+)?|mask-image|border-image|filter)\s*:\s*[^;}{]+)',body,re.I)
  if bgs:bg.append((selector,bgs))
print('CSS_BACKGROUND_RULES',len(bg))
for sel,attrs in bg[:110]:
 if not sel.startswith('@') and not sel.startswith('--'):
  print('BG_RULE',repr(sel[-180:]),repr(';'.join(attrs)[:250]))
words=['sceneWelcome','sceneMenu','sceneGame','sceneMultiplayer','table','felt','arena','stage','board','tavern','lobby','background','wood','texture','panel','game-room','shell','svg','canvas']
for word in words:
 matches=[(s,a) for s,a in bg if word.lower() in s.lower()]
 print('BG_MATCH',word,len(matches))
 for s,a in matches[:12]:print('BG_DETAIL',word,repr(s[-180:]),repr(';'.join(a)[:320]))
ids=collections.Counter(re.findall(r'id=["\']([A-Za-z][A-Za-z0-9_-]{1,80})["\']',source))
print('DOM_IDS_SCENES',[x for x in ids if re.search(r'table|felt|board|bg|back|wood|scene|sky|stage|avatar',x,re.I)][:90])
classes=collections.Counter(' '.join(re.findall(r'class=["\']([^"\']{1,600})["\']',source)).split())
print('DOM_CLASSES_MATCH',[(k,v) for k,v in classes.most_common() if re.search(r'table|felt|board|bg|back|wood|stage|menu|panel|scene|tavern|frame|scene',k,re.I)][:110])
for m in list(re.finditer(r'<(?:img|svg|canvas)\b',source,re.I))[:40]:
 print('IMAGE_ELEMENT',re.sub(r'data:image/[^"\']{400,}',"[DATA]",source[m.start():m.start()+480])[:350])
