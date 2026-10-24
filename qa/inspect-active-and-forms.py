from pathlib import Path
import re
s=Path('site/index.html').read_text(encoding='utf8')
css='\n'.join(re.findall(r'<style\b[^>]*>(.*?)</style>',s,re.I|re.S))
# Skip our added theme rules; focus on the original code.
css=css.split('<style id="tav-seasonal-themes">')[0] if '<style id="tav-seasonal-themes">' in css else css.replace(Path('qa/theme-turn-highlights.css').read_text(encoding='utf8'),'')
def short(x):return ' '.join(x.split())[:600]
keys=['seat.active','active .','bot-avatar','portrait-medallion','npc-timer','leather-name','turn-active','#overlay','#dialog','.suit-list','.parchment-modal','#alphaAccountsBar','#alphaAccountsLogout','#alphaAccountsOverlay','input','textarea','.clock','humanZone']
for key in keys:
 print('PATTERN',key)
 n=0
 for m in re.finditer(r'([^{}]{1,320})\{([^{}]{1,1500})\}',css):
  selector,body=m.group(1),m.group(2)
  if key.lower() not in selector.lower():continue
  if 'data-tav-palette' in selector:continue
  if n>=30:break
  print('RULE',key,'SEL',short(selector),'DECL',short(body));n+=1
 print('COUNT_SHOWN',n)
