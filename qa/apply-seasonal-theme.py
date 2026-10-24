#!/usr/bin/env python3
"""Instala camada visual independente do motor na Alpha gerada pelo pipeline."""
from pathlib import Path
import json,sys,re,datetime
root=Path(__file__).resolve().parents[1]
site=Path(sys.argv[1]) if len(sys.argv)>1 else root/'site'
path=site/'index.html'
html=path.read_text(encoding='utf-8')
assert len(html)>4_000_000,'HTML completo da Alpha não foi montado'
assert html.count('</head>')==1 and html.count('</body>')==1
assert 'id="alpha-v92-script"' in html and 'id="online-v84-controller"' in html
assert 'data-tav-theme' not in html and 'id="tav-theme-manager"' not in html, 'Tema duplicado'
config=json.loads((root/'qa/theme-schedule.json').read_text(encoding='utf-8'))
assert config.get('schema')==1 and config.get('defaultTheme')=='classic'
assert config.get('timeZone')=='America/Sao_Paulo'
known=set()
ranges=[]
for e in config['themes']:
 assert re.fullmatch('[a-z][a-z0-9-]*',e['id'])
 assert e['id'] not in known
 known.add(e['id'])
 start=datetime.datetime.fromisoformat(e['start'])
 end=datetime.datetime.fromisoformat(e['end'])
 assert start.tzinfo and end.tzinfo and end>start
 assert (end-start).total_seconds()<=366*24*3600
 ranges.append((start.astimezone(datetime.timezone.utc),end.astimezone(datetime.timezone.utc)))
for a,b in zip(sorted(ranges),sorted(ranges)[1:]):
 assert a[1]<=b[0],'Temas com datas sobrepostas'
styles=(root/'qa/theme-neon.css').read_text(encoding='utf-8')
manager=(root/'qa/theme-manager.js').read_text(encoding='utf-8')
assert styles.count(':root[data-tav-theme="neon-test"]')>=8,'Tema deve manter estilos escopados'
assert '</style' not in styles.lower() and '</script' not in manager.lower()
assert manager.count('/*TAVERNA_THEME_SCHEDULE*/')==1
serialized=json.dumps(config,ensure_ascii=False,separators=(',',':')).replace('</','<\\/')
manager=manager.replace('/*TAVERNA_THEME_SCHEDULE*/',serialized)
html=html.replace('</head>','<style id="tav-seasonal-themes">\n'+styles+'\n</style>\n</head>',1)
html=html.replace('</body>','<script id="tav-theme-manager">\n'+manager+'\n</script>\n</body>',1)
path.write_text(html,encoding='utf-8')
print('SEASONAL_THEME_READY',','.join(known),'base=classic','periods='+str(len(ranges)))
