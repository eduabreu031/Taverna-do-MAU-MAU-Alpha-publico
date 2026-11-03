#!/usr/bin/env python3
"""Inspect offline engine / header anchors for safe pause feature."""
from pathlib import Path
import re
s=Path('site/index.html').read_text('utf-8')
print('SIZE',len(s))
queries={
'engine':['class GameEngine','class MauMau','function renderGame','function renderSeats','function renderHumanHand','function renderNPC','function renderTurn','function renderHUD','function startGame','function startOffline','function goGame','function goMenu','const ui=','let ui=','class Offline'],
'clock':['timeExpired(','clockInterval','turnSeconds','remainingTime','timeLeft','game.tick','ui.game','setInterval(','setTimeout(','clearTimeout(','clockText','npc-timer','runBot','botTurn','botThink'],
'header':['utility-toolbar','game-header','alphaTopTools','returnMenu','soundBtn','id="sceneGame"','id="humanZone"','id="tavCronicasOverlay"']
}
for group,terms in queries.items():
 print('\nGROUP',group)
 for term in terms:
  matches=list(re.finditer(re.escape(term),s,re.I))
  print('\nTERM',term,'COUNT',len(matches))
  for m in matches[:(4 if group=='clock' else 3)]:
   span=(650,1450) if group=='clock' else (350,1350)
   excerpt=s[max(m.start()-span[0],0):min(m.end()+span[1],len(s))]
   print('POSITION',m.start(),'TEXT',repr(excerpt[:2300]))
print('\nSCRIPTS')
for m in re.finditer(r'<script\b[^>]*>',s,re.I):
 print('SCRIPT',m.start(),m.group(0)[:130])
