#!/usr/bin/env python3
from pathlib import Path
import re
s=Path('site/index.html').read_text('utf8')
queries={
 "pauseSchedulers()":(100,500),
 "function startClock(":(120,1000),
 "function scheduleTurn(":(150,2300),
 "function scheduleNext(":(150,2300),
 "function scheduleAI(":(150,2300),
 "ui.botTimeout=setTimeout(":(1900,700),
 "ui.incidentTimer=setTimeout(":(2100,650),
 "ui.accusationBot=setTimeout(":(850,750),
 "function handleResult(":(200,1600),
 "function showHelp()":(100,900),
 "function closeOverlay(":(100,850),
 "function finishModal(":(100,850),
 "function closeDialog(":(100,850),
 "function beginMatch(":(100,1200),
 "function startMatch(":(100,1200),
 "function scheduleTurn":(100,2200),
 "function resumeSchedulers(":(100,900),
 "function runBots(":(100,900),
 "function renderAll(":(150,1000),
 "function render(":(150,1000),
 "function humanTurn(":(100,350),
 "function renderControls(":(100,450),
 "function goMenu()":(100,850),
 "ui.introTimer=setTimeout(":(250,450),
 "function showModal(":(100,550)
}
for q,(before,after) in queries.items():
 m=s.find(q)
 print('FOCUS',q,'COUNT',s.count(q),'POSITION',m)
 if m!=-1:print('CODE',repr(s[max(0,m-before):m+len(q)+after]))
