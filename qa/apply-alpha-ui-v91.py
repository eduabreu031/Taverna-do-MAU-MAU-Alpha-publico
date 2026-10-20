#!/usr/bin/env python3
"""Aplia somente livro de regras e icone da v91 na Alpha atual; nao toca no motor, salas ou conexao."""
from pathlib import Path
import sys,re,io
import cairosvg

base=Path(sys.argv[1] if len(sys.argv)>1 else 'site')
index=base/'index.html'
data=index.read_text(encoding='utf-8')
assert len(data)>4_000_000, 'Alpha original incompleta'
assert 'https://taverna-multiplayer-servidor.edulopes941.workers.dev' in data, 'Endpoint de producao ausente'
assert 'https://taverna-multiplayer-beta.edulopes941.workers.dev' not in data, 'Beta nao pode substituir servidor da Alpha'
assert 'id="chooseRules"' not in data, 'Livro de regras ja aplicado'
assert data.count('</head>')==1 and data.count('</body>')==1, 'Estrutura HTML inesperada'

RULES_CSS="<style id=\"rules-dev-style\">#rulesModalDEV{position:fixed;inset:0;z-index:500;overflow:auto;display:grid;place-items:center;padding:20px;background:radial-gradient(ellipse,#4b2a34,#120b12);color:#3a261c}#rulesModalDEV.hidden{display:none!important}.rules-book{width:min(650px,96vw);max-height:92vh;overflow:auto;padding:24px clamp(16px,5vw,38px);border:8px ridge #7f572e;border-radius:15px;background:linear-gradient(145deg,#f3dfbb,#dabb86);box-shadow:0 20px 90px #090407}.rules-book h2{text-align:center;font:small-caps 34px Georgia,serif;margin:7px 0 17px}.rules-kicker{text-align:center;font:13px Georgia,serif;letter-spacing:2px}.rules-tabs{display:flex;gap:9px;justify-content:center}.rules-tabs button{padding:10px 14px;background:#6a393d;color:#ffebc6;border:1px solid #9b703a;border-radius:6px;cursor:pointer}.rules-tabs button.active{background:#30202a}.rules-content{line-height:1.55;font:15px Georgia,serif;margin:18px 0}.rules-content h3{font-size:18px;margin:17px 0 4px}.rules-content p{margin:0 0 12px}.rules-content.hidden{display:none!important}#rulesCloseDEV{display:block;margin:auto}</style>"
RULES_MODAL="<section id=\"rulesModalDEV\" class=\"rules-dev hidden\" aria-label=\"Livro de regras\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"rulesTitleDEV\">\n  <div class=\"rules-book\"><p class=\"rules-kicker\">✦ O CÓDIGO DA TAVERNA ✦</p><h2 id=\"rulesTitleDEV\">Regras &amp; Malandragens</h2><div class=\"rules-tabs\" role=\"tablist\"><button id=\"rulesTabDEV\" class=\"active\" type=\"button\">Leis da Mesa</button><button id=\"tricksTabDEV\" type=\"button\">Malandragens</button></div>\n  <div class=\"rules-content\" id=\"rulesLawDEV\"><h3>A partida</h3><p>Combine naipe ou valor da carta visível, ou use um Valete para mudar o naipe. Na sua vez, você pode comprar uma carta; depois, jogar ou passar. Cada carta representa um objeto único, mesmo quando duas possuem o mesmo valor e naipe.</p><h3>O poder das cartas</h3><p><b>Ás:</b> pula o próximo jogador. <b>Dama:</b> inverte o sentido da partida; no duelo final, mantém a vez de quem a jogou. <b>7:</b> impõe cinco cartas; o adversário responde com 7 ou Valete, ou aceita a compra. <b>9:</b> obriga o jogador anterior a comprar uma carta; no duelo final, mantém a vez. <b>Valete:</b> permite escolher o naipe, mesmo contra uma dívida do 7.</p><h3>Relógio e blefes</h3><p>São 15 segundos por ação. O fim do prazo aplica duas cartas e passa a vez. No duelo entre dois jogadores há possibilidade de jogada irregular como blefe, sujeita ao OPA!!!. Os supercombos no duelo final envolvem Ás, Dama, 7 e 9.</p><h3>MAU MAU e OPA!!!</h3><p>Anuncie MAU MAU com exatamente duas cartas. Se a jogada deixar apenas uma carta sem anúncio, os adversários podem acusar com OPA!!! durante cinco segundos. Jogadas irregulares também podem ser acusadas.</p><h3>Rodadas e vitória</h3><p>Quem termina suas cartas vence a rodada. Nas rodadas com mais de dois participantes, a maior pontuação nas cartas restantes determina a eliminação. Ao restarem dois, vence a partida quem ficar sem cartas.</p></div>\n  <div class=\"rules-content hidden\" id=\"rulesTricksDEV\"><h3>O segredo está na observação</h3><p>Observe quem acabou de comprar e quais naipes parecem faltar na mão dos rivais. Guardar um Valete para emergências pode salvar sua rodada.</p><h3>Um Ás na hora certa</h3><p>Quando o próximo jogador tem poucas cartas, o Ás pode impedir sua vitória. A Dama pode afastar a vez de um oponente perigoso.</p><h3>O blefe tem preço</h3><p>No duelo final, uma carta irregular pode ser uma aposta: se o outro perceber a infração e apertar OPA!!!, haverá consequência. Não confunda uma jogada arriscada com um erro do sistema.</p><h3>Olhos no OPA!!!</h3><p>Fique atento às cartas finais sem anúncio. Acusar sem razão desperdiça a oportunidade e não prova infração.</p></div>\n  <button id=\"rulesCloseDEV\" class=\"engraved-btn primary\" type=\"button\">← Voltar aos modos de jogo</button></div></section>\n"
RULES_BUTTON="<button class=\"welcome-mode\" id=\"chooseRules\" type=\"button\"><span class=\"mode-icon\" aria-hidden=\"true\">📜</span><strong>Regras &amp; Malandragens</strong><small>Aprenda as leis e os truques da Taverna</small><span class=\"mode-footer\">Abrir o livro <span aria-hidden=\"true\">→</span></span></button>"
RULES_SCRIPT="(()=>{'use strict';const $=id=>document.getElementById(id);const modal=$('rulesModalDEV');function tab(which){$('rulesLawDEV').classList.toggle('hidden',which!=='law');$('rulesTricksDEV').classList.toggle('hidden',which!=='tricks');$('rulesTabDEV').classList.toggle('active',which==='law');$('tricksTabDEV').classList.toggle('active',which==='tricks');}$('chooseRules').addEventListener('click',()=>{tab('law');modal.classList.remove('hidden');$('rulesCloseDEV').focus();});$('rulesCloseDEV').addEventListener('click',()=>{modal.classList.add('hidden');$('chooseRules').focus();});$('rulesTabDEV').onclick=()=>tab('law');$('tricksTabDEV').onclick=()=>tab('tricks');modal.addEventListener('keydown',e=>{if(e.key==='Escape')$('rulesCloseDEV').click();});})();"
ICON_SVG="<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"512\" height=\"512\" viewBox=\"0 0 512 512\">\n<defs>\n<radialGradient id=\"bg\"><stop stop-color=\"#64152e\"/><stop offset=\".72\" stop-color=\"#350e21\"/><stop offset=\"1\" stop-color=\"#210914\"/></radialGradient>\n<linearGradient id=\"gold\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop stop-color=\"#fff2bd\"/><stop offset=\".28\" stop-color=\"#e9bb67\"/><stop offset=\".6\" stop-color=\"#9d6232\"/><stop offset=\".82\" stop-color=\"#efc47b\"/><stop offset=\"1\" stop-color=\"#6a341f\"/></linearGradient>\n<linearGradient id=\"center\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop stop-color=\"#8f3451\"/><stop offset=\"1\" stop-color=\"#3b1127\"/></linearGradient>\n</defs>\n<rect width=\"512\" height=\"512\" rx=\"86\" fill=\"url(#bg)\"/>\n<rect x=\"21\" y=\"21\" width=\"470\" height=\"470\" rx=\"71\" fill=\"none\" stroke=\"#b1834b\" stroke-width=\"4\" opacity=\".78\"/>\n<rect x=\"36\" y=\"36\" width=\"440\" height=\"440\" rx=\"61\" fill=\"none\" stroke=\"#ddbe84\" stroke-width=\"1.6\" opacity=\".26\"/>\n<path d=\"M256 146 C231 177 186 198 156 233 C133 258 127 287 149 313 C176 344 215 333 242 305 C237 355 220 381 198 415 L314 415 C291 381 275 355 270 305 C297 333 336 344 363 313 C385 287 379 258 356 233 C326 198 281 177 256 146Z\" fill=\"url(#gold)\" stroke=\"#4a261c\" stroke-width=\"8\" stroke-linejoin=\"round\"/>\n<path d=\"M256 173 C235 198 186 224 164 251 C150 269 150 292 162 307 C181 324 221 305 248 283 C247 342 230 374 220 399 L292 399 C281 374 265 342 264 283 C291 305 331 324 350 307 C362 292 362 269 348 251 C326 224 277 198 256 173Z\" fill=\"url(#center)\" opacity=\".82\"/>\n<path d=\"M178 163 L164 105 L213 130 L256 82 L299 130 L348 105 L334 163 Z\" fill=\"url(#gold)\" stroke=\"#5d321f\" stroke-width=\"7\" stroke-linejoin=\"round\"/>\n<path d=\"M185 170 L327 170 L324 193 L188 193 Z\" fill=\"url(#gold)\" stroke=\"#5d321f\" stroke-width=\"5\"/>\n<circle cx=\"256\" cy=\"168\" r=\"9\" fill=\"#6d1529\" stroke=\"#f4d799\" stroke-width=\"3\"/>\n</svg>"

data=data.replace('</head>',RULES_CSS+'\n</head>',1)
rx=re.compile(r'<button class="welcome-mode" id="chooseMultiplayer"[^>]*>[\\s\\S]*?</button>')
# A expressao compilada acima e fixada aqui para nao depender de reescrita do botao multiplayer.
rx=re.compile(r'<button class="welcome-mode" id="chooseMultiplayer"[^>]*>.*?</button>',re.S)
match=rx.search(data)
assert match, 'Botao multiplayer nao encontrado - publicar bloqueado'
assert len(rx.findall(data))==1, 'Botao multiplayer ambiguo'
data=data[:match.end()]+'\n      '+RULES_BUTTON+data[match.end():]
data=data.replace('</body>',RULES_MODAL+'\n<script id="rules-dev-script">'+RULES_SCRIPT+'</script>\n</body>',1)
assert data.count('id="chooseRules"')==1
assert data.count('id="rulesModalDEV"')==1
assert data.count('id="rules-dev-script"')==1
assert 'const API=\'https://taverna-multiplayer-servidor.edulopes941.workers.dev\'' in data, 'Endpoint de producao alterado'
index.write_text(data,encoding='utf-8')

assets=base/'icons'
assert assets.is_dir(), 'Pasta de icones ausente'
for size in (72,96,144,180,192,512):
  cairosvg.svg2png(bytestring=ICON_SVG.encode('utf-8'),write_to=str(assets/f'icon-{size}.png'),output_width=size,output_height=size)
for size in (192,512):
  cairosvg.svg2png(bytestring=ICON_SVG.encode('utf-8'),write_to=str(assets/f'icon-maskable-{size}.png'),output_width=size,output_height=size)

sw=base/'sw.js'
previous=sw.read_text(encoding='utf-8')
updated,n=re.subn(r"const CACHE = '[^']+';", "const CACHE = 'taverna-pwa-alpha-ui-v91-01';",previous,count=1)
assert n==1, 'Service Worker sem CACHE para atualizar'
sw.write_text(updated,encoding='utf-8')
print('ALPHA_UI_V91_OK: livro de regras, 8 icones, PWA atualizado, multiplayer mantido')
