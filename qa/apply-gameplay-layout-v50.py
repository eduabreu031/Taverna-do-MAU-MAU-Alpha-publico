#!/usr/bin/env python3
"""Alpha v50: acabamento visual da partida, sem alterar motor, regras ou Worker."""
from pathlib import Path
import sys

root=Path(__file__).resolve().parents[1]
site=Path(sys.argv[1]) if len(sys.argv)>1 else root/'site'
page=site/'index.html'
html=page.read_text(encoding='utf-8')
assert len(html)>4_000_000,'Frontend Alpha incompleto'
assert 'id="tav-offline-score-theme"' in html,'Apuracao tematica v49 deve vir primeiro'
assert 'id="tav-gameplay-v50-style"' not in html

def replace_once(old,new):
 global html
 assert html.count(old)==1,('Ancora ambigua/ausente',old[:120],html.count(old))
 html=html.replace(old,new,1)

helpers=r"""
// A mesma contagem de conquistas dos NPCs, agora visivel ao jogador humano.
function tavRoundStars(count){
 const wins=Math.max(0,Math.trunc(Number(count)||0));
 return wins?('✦'.repeat(Math.min(5,wins))+(wins>5?' +'+(wins-5):'')):'';
}
function tavRenderSessionDetails(s){
 const avatar=$('humanAvatar');
 if(avatar){
  let trophy=avatar.querySelector('.tav-human-trophy');
  const wins=ui.sessionWins.get(0)||0;
  if(wins>0){
   if(!trophy){
    trophy=document.createElement('span');
    trophy.className='tav-human-trophy';
    avatar.append(trophy);
   }
   trophy.textContent=tavRoundStars(wins);
   trophy.setAttribute('aria-label',wins+' vitórias nesta mesa');
   trophy.title=wins+' vitórias nesta mesa';
  }else trophy?.remove();
 }
 // O motor mantem uma unica mao plana. Somente o CSS muda a disposicao.
 const zone=$('humanZone'),hand=$('humanHand');
 if(zone&&hand){
  const count=s.players[0].hand.length;
  zone.classList.toggle('tav-double-hand',count>10);
  hand.style.setProperty('--tav-hand-cols',String(Math.max(1,Math.ceil(count/2))));
 }
 const scene=$('sceneGame');
 if(!scene)return;
 let gallery=scene.querySelector('#tavGhostGallery');
 if(!gallery){
  gallery=document.createElement('section');
  gallery.id='tavGhostGallery';
  gallery.className='tav-ghost-gallery';
  gallery.setAttribute('aria-label','Jogadores eliminados nesta mesa');
  const header=scene.querySelector('.game-header');
  scene.insertBefore(gallery,header||scene.firstChild);
 }
 const eliminated=s.players.map((p,i)=>({p,i})).filter(x=>!x.p.alive);
 gallery.hidden=!eliminated.length;
 const signature=eliminated.map(x=>x.i).join(',');
 if(gallery.dataset.eliminated!==signature){
  gallery.dataset.eliminated=signature;
  gallery.innerHTML=eliminated.map(x=>
   '<div class="tav-ghost-card" title="'+escapeHtml(x.p.name)+' eliminado">'+
   portraitHTML(x.i===0?heroChoice:x.p.name)+
   '<small>'+escapeHtml(x.p.name)+'</small></div>'
  ).join('');
 }
}
"""
replace_once('function renderHumanHand(){',helpers+'\nfunction renderHumanHand(){')
replace_once(
 "const avatar=$('humanAvatar');if(avatar&&!avatar.firstElementChild)avatar.innerHTML=portraitHTML(heroChoice);}",
 "const avatar=$('humanAvatar');if(avatar&&!avatar.firstElementChild)avatar.innerHTML=portraitHTML(heroChoice);tavRenderSessionDetails(s);}"
)
css=(root/'qa/gameplay-layout-v50.css').read_text('utf-8')
assert '</style' not in css.lower()
replace_once('</head>','<style id="tav-gameplay-v50-style">\n'+css+'\n</style>\n</head>')
page.write_text(html,encoding='utf-8')
print('ALPHA_GAMEPLAY_V50_READY',len(html))
