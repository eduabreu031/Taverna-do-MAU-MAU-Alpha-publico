#!/usr/bin/env python3
"""Alpha 0.5.0.59: nomes oficiais e halo de tempo no retrato, sem mudar relógios."""
from pathlib import Path
import json, re, sys

root=Path(__file__).resolve().parents[1]
page=Path(sys.argv[1])/'index.html' if len(sys.argv)>1 else root/'site/index.html'
html=page.read_text(encoding='utf-8')
assert len(html)>4_000_000 and 'id="tav-offline-pause-v55-style"' in html
assert 'id="tav-bot-halo-v59-style"' not in html

def swap(old,new):
 global html
 n=html.count(old)
 assert n==1, ('Ancora mudou',old[:130],n)
 html=html.replace(old,new,1)

m=re.search(r'const ALL_BOTS=(\[[^;]+\]);',html)
assert m,'Elenco offline nao encontrado'
official=json.loads(m.group(1))[:9]
assert len(official)==9 and len(set(official))==9
legacy=['Bruxa Carmesim','Velho Corvo','Dama Rubra','Lobo Negro',
        'Monge Cinzento','Raposa Astuta','Cavaleiro Pálido',
        'Druida Noturno','Coruja Sombria']
old_roster="const BOT_NAMES=["+','.join("'"+n+"'" for n in legacy)+"];"
swap(old_roster,
     'const LEGACY_BOT_NAMES='+json.dumps(legacy,ensure_ascii=False)+';\n'
     'const BOT_NAMES='+json.dumps(official,ensure_ascii=False)+';')
swap("const BOT_PREFIX='Bot · ';",
     "const BOT_PREFIX='';\nconst LEGACY_BOT_PREFIX='Bot · ';")
# A retomada de salas já existentes conserva o nome real e token do bot antigo.
swap('b.name.startsWith(BOT_PREFIX)',
     '(BOT_NAMES.includes(b.name)||LEGACY_BOT_NAMES.some(n=>b.name===LEGACY_BOT_PREFIX+n))')
swap('const ix=BOT_NAMES.findIndex(n=>entry.name===BOT_PREFIX+n);',
     'let ix=BOT_NAMES.findIndex(n=>entry.name===BOT_PREFIX+n);\n'
     '  if(ix<0)ix=LEGACY_BOT_NAMES.findIndex(n=>entry.name===LEGACY_BOT_PREFIX+n);')
swap('function addBot(n,entry){',
     "function botNameForSlot(i){const legacy=LEGACY_BOT_PREFIX+LEGACY_BOT_NAMES[i];return bots.has(legacy)?legacy:BOT_PREFIX+BOT_NAMES[i];}\n"
     'function addBot(n,entry){')
assert html.count('BOT_PREFIX+BOT_NAMES[i]')==3, 'Ancoras do seletor de bots mudaram'
# A terceira ocorrencia e a definicao do helper; preservar somente essa.
parts=html.split('BOT_PREFIX+BOT_NAMES[i]')
assert len(parts)==4
html='BOT_PREFIX+BOT_NAMES[i]'.join(parts[:2])+parts[2].replace('', '', 1) if False else html
# Seletores de redução e ampliação usam o mesmo identificador da vaga.
needle='const name=BOT_PREFIX+BOT_NAMES[i]'
assert html.count(needle)==2,html.count(needle)
html=html.replace(needle,'const name=botNameForSlot(i)')

# Mesma identidade no retrato e no nome exibido, inclusive em salas antigas.
helper=(
 'const tavLegacyBotNames='+json.dumps(legacy,ensure_ascii=False)+';\n'
 'function tavOnlineDisplayBotName(member){\n'
 " const raw=String(member?.name||'');if(!member?.isBot)return raw;\n"
 " const clean=raw.startsWith('Bot · ')?raw.slice('Bot · '.length):raw;\n"
 ' const i=tavLegacyBotNames.indexOf(clean);\n'
 ' return i>=0?ALL_BOTS[i]:raw;\n'
 '}\n'
)
swap('const onlineBotPortraitCache=new Map();',helper+'const onlineBotPortraitCache=new Map();')
swap('const portrait=byId.get(p.id)?.name;',
     'const portrait=tavOnlineDisplayBotName(byId.get(p.id));')
swap("name:members.find(x=>x.id===p.id)?.name||'Jogador',alive:",
     "name:tavOnlineDisplayBotName(members.find(x=>x.id===p.id))||'Jogador',alive:")

# O relógio original continua calculando os segundos; agora alimenta apenas
# o aro do avatar, sem sobreposição sobre a imagem e sem números visíveis.
swap("el.classList.toggle('active',active);",
     "const avatar=el.closest('.leather-name')?.querySelector('.bot-avatar');"
     "if(avatar){avatar.style.setProperty('--tav-npc-progress',(ratio*100)+'%');"
     "avatar.title=active?'Tempo restante: '+Math.ceil(remaining/1000)+' segundos':'';}"
     "el.classList.toggle('active',active);")
pattern=r"el\.querySelector\('\.timer-mark'\)\.textContent=active\?[^;]+;"
html,count=re.subn(pattern,"el.querySelector('.timer-mark').textContent='';",html,count=1)
assert count==1, 'Contador legado nao encontrado'
css=(root/'qa/bot-halo-v59.css').read_text(encoding='utf-8')
assert '</style' not in css.lower()
swap('</body>','<style id="tav-bot-halo-v59-style">\n'+css+'\n</style>\n</body>')
page.write_text(html,encoding='utf-8')
print('BOT_HALO_NOMES_V59_OK',len(html),', '.join(official))
