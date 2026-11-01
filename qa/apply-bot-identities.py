#!/usr/bin/env python3
"""Corrige identidades visuais dos bots online e preserva adversarios na revanche offline."""
from pathlib import Path
import sys

root = Path(__file__).resolve().parents[1]
site = Path(sys.argv[1]) if len(sys.argv) > 1 else root / "site"
page = site / "index.html"
html = page.read_text(encoding="utf-8")

def replace_once(old, new):
    global html
    count = html.count(old)
    assert count == 1, ("Falha ao localizar ponto unico", old[:120], count)
    html = html.replace(old, new, 1)

old_offline = """ui.difficulty=$('difficulty').value;const pool=shuffle(ALL_BOTS.filter(n=>!ui.seenBotNames.includes(n))),fallback=shuffle(ALL_BOTS),bots=[...pool,...fallback].filter((n,i,a)=>a.indexOf(n)===i).slice(0,count-1);ui.seenBotNames=bots.slice();"""
new_offline = """ui.difficulty=$('difficulty').value;const replayBots=replay&&ui.game?.state?.players?.slice(1).map(p=>p.name);const keepLineup=Array.isArray(replayBots)&&replayBots.length===count-1;const pool=keepLineup?[]:shuffle(ALL_BOTS.filter(n=>!ui.seenBotNames.includes(n))),fallback=keepLineup?[]:shuffle(ALL_BOTS),bots=keepLineup?replayBots.slice():[...pool,...fallback].filter((n,i,a)=>a.indexOf(n)===i).slice(0,count-1);ui.seenBotNames=bots.slice();"""
replace_once(old_offline, new_offline)

# Bots do servidor podem ter nomes diferentes dos NPCs offline. Sem esta
# associacao, portraitFor cai no heroi padrao para todos eles.
online_helpers = """
const onlineBotPortraitCache=new Map();
function onlineBotPortraits(ordered,members){
 const byId=new Map(members.map(m=>[m.id,m]));
 const bots=ordered.filter(p=>byId.get(p.id)?.isBot).slice()
  .sort((a,b)=>String(a.id).localeCompare(String(b.id)));
 const used=new Set(),assigned=new Map();
 // Quando o nome corresponde a um personagem ilustrado, use seu retrato real.
 for(const p of bots){
  const portrait=byId.get(p.id)?.name;
  if(ALL_BOTS.includes(portrait)&&!used.has(portrait)){
   assigned.set(p.id,portrait);onlineBotPortraitCache.set(p.id,portrait);used.add(portrait);
  }
 }
 // Para nomes novos, atribua personagens diferentes em vez do heroi padrao.
 // O cache por id mantem o retrato ao longo da rodada/revanche/reconexao.
 for(const p of bots){
  if(assigned.has(p.id))continue;
  const old=onlineBotPortraitCache.get(p.id);
  const portrait=old&&ALL_BOTS.includes(old)&&!used.has(old)?
   old:ALL_BOTS.find(name=>!used.has(name));
  if(portrait){assigned.set(p.id,portrait);onlineBotPortraitCache.set(p.id,portrait);used.add(portrait);}
 }
 return assigned;
}
"""
replace_once("window.__tavOriginalOnline={", online_helpers + "window.__tavOriginalOnline={")
replace_once(
 "const players=ordered.map(p=>({name:members.find(x=>x.id===p.id)?.name||'Jogador',alive:p.alive!==false,",
 "const botPortraits=onlineBotPortraits(ordered,members);\n  const players=ordered.map(p=>({name:members.find(x=>x.id===p.id)?.name||'Jogador',portraitName:botPortraits.get(p.id)||null,alive:p.alive!==false,"
)
replace_once("${portraitHTML(p.name)}", "${portraitHTML(p.portraitName||p.name)}")
page.write_text(html, encoding="utf-8")
print("BOT_IDENTITIES_FIXED", len(html))
