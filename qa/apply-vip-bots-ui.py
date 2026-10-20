#!/usr/bin/env python3
from pathlib import Path
import sys
site=Path(sys.argv[1]) if len(sys.argv)>1 else Path('site')
file=site/'index.html'
h=file.read_text(encoding='utf8')
vip_owner="(uid===hostId||(room==='TAVERN'&&players.some(p=>p.id===uid&&!p.isBot)))"
replacements=[
 ("if(bot.token)url.searchParams.set('token',bot.token);","if(bot.token&&game&&['playing','scoring'].includes(game.phase))url.searchParams.set('token',bot.token);else bot.token='';"),
 ("function connectBot(bot){","async function connectBot(bot){"),
 ("let sock;try{sock=new WebSocket(url)}catch(e)","let sock;try{url.searchParams.set('pass',await window.TavernaAuth.pass(code));if(bot.removed||room!==code)return;sock=new WebSocket(url)}catch(e)"),
 ("const host=uid&&uid===hostId;","const host=!!uid&&"+vip_owner+";"),
 ("const host=!!uid&&uid===hostId;","const host=!!uid&&"+vip_owner+";"),
 ("if(!room||uid!==hostId||bots.size)return;","if(!room||!uid||!"+vip_owner+"||bots.size)return;"),
 ("if(!room||uid!==hostId){resolve(false);return;}","if(!room||!uid||!"+vip_owner+"){resolve(false);return;}"),
 ("if(botChangeBusy||!room||uid!==hostId||game?.phase==='playing'||game?.phase==='scoring')return false;","if(botChangeBusy||!room||!uid||!"+vip_owner+"||game?.phase==='playing'||game?.phase==='scoring')return false;"),
 ("if(startingWithBots||startPending||!room||uid!==hostId||game)return;","if(startingWithBots||startPending||!room||!uid||!"+vip_owner+"||game)return;"),
 ("function waitForBots(desired,maxWait=14000){","function waitForBots(desired,maxWait=25000){"),
 ("if(e.code===4001){bot.removed=true;bots.delete(bot.name);persistBots();refreshReadyAfterBots();return;}","if(e.code===4001){bot.removed=true;bots.delete(bot.name);persistBots();refreshReadyAfterBots();return;}\n  if(!game||['finished','game_over'].includes(game.phase)){bot.token='';bot.id=null;persistBots();}")
]
for old,new in replacements:
 count=h.count(old)
 assert count==1,(old,count)
 h=h.replace(old,new,1)
js=Path('qa/vip-bots-ui.js').read_text(encoding='utf8')
css=Path('qa/vip-bots-ui.css').read_text(encoding='utf8')
admin_js=Path('qa/vip-admin-panel.js').read_text(encoding='utf8')
admin_css=Path('qa/vip-admin-panel.css').read_text(encoding='utf8')
assert 'id="online-v84-controller"' in h
assert 'id="alpha-accounts-script"' in h
assert '</script' not in js.lower() and '</script' not in admin_js.lower()
h=h.replace('</head>','<style id="tav-vip-bots-css">\n'+css+'\n</style>\n<style id="tav-vip-admin-css">\n'+admin_css+'\n</style>\n</head>',1)
h=h.replace('</body>','<script id="tav-vip-bots-ui">\n'+js+'\n</script>\n<script id="tav-vip-admin-ui">\n'+admin_js+'\n</script>\n</body>',1)
file.write_text(h,encoding='utf8')
print('VIP_BOTS_UI_READY',len(h))
