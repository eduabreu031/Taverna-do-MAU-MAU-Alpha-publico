#!/usr/bin/env python3
"""Acelera a apuracao offline e integra cartas, placar e eliminados as paletas."""
from pathlib import Path
import sys

root = Path(__file__).resolve().parents[1]
site = Path(sys.argv[1]) if len(sys.argv) > 1 else root / "site"
page = site / "index.html"
html = page.read_text(encoding="utf-8")
assert len(html) > 4_000_000, "HTML da Alpha incompleto"
assert 'id="tav-seasonal-themes"' in html, "Paletas devem ser aplicadas antes"

def replace(old, new, expected=1):
    global html
    count = html.count(old)
    assert count == expected, ("Trecho de apuracao divergente", old[:125], count, expected)
    html = html.replace(old, new)

replace(
 "let v28ScoreRunning=false;",
 """let v28ScoreRunning=false;
let v28ScoreSkip=null;
// Pula somente a apresentacao visual: o motor ja calculou os resultados.
function v28FastForward(){
 const task=v28ScoreSkip;
 if(!task||task.skip)return;
 task.skip=true;
 for(const finish of Array.from(task.waiters))finish();
}"""
)
replace(
 "function v28Wait(ms){return new Promise(resolve=>setTimeout(resolve,ms));}",
 """function v28Wait(ms){
 const task=v28ScoreSkip;
 return new Promise(resolve=>{
  if(task?.skip){resolve();return;}
  let timer;
  const finish=()=>{clearTimeout(timer);task?.waiters.delete(finish);resolve();};
  timer=setTimeout(finish,ms);
  task?.waiters.add(finish);
 });
}"""
)
replace(
 " const live=()=>!!ui.game&&ui.gameSerial===serial&&ui.game.state.phase==='scoring'&&stage.isConnected;",
 """ const live=()=>!!ui.game&&ui.gameSerial===serial&&ui.game.state.phase==='scoring'&&stage.isConnected;
 const scoreTask=v28ScoreSkip;
 const skip=document.createElement('button');
 skip.type='button';skip.className='engraved-btn score-fast-forward';
 skip.textContent='Pular contagem';
 skip.setAttribute('aria-label','Pular a animacao e ver o resultado da rodada');
 skip.onclick=()=>{
  if(!live()||scoreTask!==v28ScoreSkip)return;
  skip.disabled=true;skip.textContent='Abrindo resultado…';
  v28FastForward();
 };
 stage.append(skip);
 const totalScoreCards=v28ScoringOrder(s).reduce((sum,i)=>sum+s.players[i].hand.length,0);
 const flightDuration=totalScoreCards>=20?210:totalScoreCards>=10?300:390;"""
)
replace(
 "   remaining.innerHTML='<div class=\"score-pending-back\">✥</div><small>'+p.hand.length+' cartas</small>';",
 "   remaining.innerHTML='<div class=\"score-pending-back\" aria-hidden=\"true\">✥</div><small>'+p.hand.length+' cartas</small>';"
)
replace("  await v28Wait(350);\n  for(const i of order){",
        "  await v28Wait(160);\n  if(v28ScoreSkip?.skip)return true;\n  for(const i of order){")
replace("  for(const i of order){\n   if(!live())return false;\n   const p=s.players[i],item=spots.get(i);",
        "  for(const i of order){\n   if(v28ScoreSkip?.skip)return true;\n   if(!live())return false;\n   const p=s.players[i],item=spots.get(i);")
replace("   await v28Wait(230);\n   for(let j=0;j<p.hand.length;j++){",
        "   await v28Wait(90);\n   if(v28ScoreSkip?.skip)return true;\n   for(let j=0;j<p.hand.length;j++){")
replace("   for(let j=0;j<p.hand.length;j++){\n    if(!live())return false;",
        "   for(let j=0;j<p.hand.length;j++){\n    if(v28ScoreSkip?.skip)return true;\n    if(!live())return false;")
replace("     ],{duration:830,easing:'ease-in-out',fill:'forwards'});",
        "     ],{duration:flightDuration,easing:'ease-in-out',fill:'forwards'});")
replace("     await Promise.race([anim.finished.catch(()=>{}),v28Wait(950)]);\n     if(!live()){",
        "     await Promise.race([anim.finished.catch(()=>{}),v28Wait(flightDuration+90)]);\n     if(v28ScoreSkip?.skip){anim.cancel();piece.remove();return true;}\n     if(!live()){")
replace("     await v28Wait(820);\n     if(!live()){",
        "     await v28Wait(flightDuration);\n     if(v28ScoreSkip?.skip){piece.remove();return true;}\n     if(!live()){")
replace("    await v28Wait(110);\n   }\n   // Conserva o resultado",
        "    await v28Wait(35);\n   }\n   // Conserva o resultado")
replace("   await v28Wait(320);\n  }\n  if(!live())return false;\n  await v28Wait(1100);",
        "   await v28Wait(120);\n   if(v28ScoreSkip?.skip)return true;\n  }\n  if(v28ScoreSkip?.skip)return true;\n  if(!live())return false;\n  await v28Wait(220);")
replace(
 " const serial=ui.gameSerial,info=s.scoring;\n if(!ui.roundCounted.has(s.round)){",
 """ const serial=ui.gameSerial,info=s.scoring;
 const scoreTask={skip:false,waiters:new Set()};v28ScoreSkip=scoreTask;
 if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)v28FastForward();
 if(!ui.roundCounted.has(s.round)){"""
)
replace(
 " v28ScoreRunning=false;\n if(ui.gameSerial!==serial||!ui.game||ui.game.state.phase!=='scoring')return;",
 """ if(v28ScoreSkip===scoreTask)v28ScoreSkip=null;
 if(ui.gameSerial===serial)v28ScoreRunning=false;
 if(ui.gameSerial!==serial||!ui.game||ui.game.state.phase!=='scoring')return;"""
)
replace(
 "document.getElementById('v28-score-stage')?.remove();document.body.classList.remove('score-showing');v28ScoreRunning=false;",
 "v28FastForward();document.getElementById('v28-score-stage')?.remove();document.body.classList.remove('score-showing');v28ScoreRunning=false;",
 expected=2
)
css = (root / "qa" / "offline-scoring-theme.css").read_text(encoding="utf-8")
assert "</style" not in css.lower()
assert 'id="tav-offline-score-theme"' not in html
assert html.count("</head>") == 1
html = html.replace("</head>", '<style id="tav-offline-score-theme">\n' + css + '\n</style>\n</head>', 1)
page.write_text(html, encoding="utf-8")
print("OFFLINE_SCORE_THEME_SKIP_READY", len(html))
