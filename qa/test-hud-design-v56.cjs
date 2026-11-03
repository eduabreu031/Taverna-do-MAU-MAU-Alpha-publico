'use strict';
/* QA contratual: qualquer botão novo no HUD deve aderir ao mesmo padrão. */
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const site=process.argv[2]||path.join(root,'site');
const css=fs.readFileSync(path.join(root,'qa/hud-design-v56.css'),'utf8');
const html=fs.readFileSync(path.join(site,'index.html'),'utf8');
const engine=fs.readFileSync(path.join(root,'qa/offline-pause-engine-v55.js'),'utf8');
const manual=fs.readFileSync(path.join(root,'docs/MANUAL-IDENTIDADE-VISUAL.md'),'utf8');
assert(css.includes('#sceneGame .game-header .utility-toolbar button'),'Nove botões sem contrato único');
assert(css.includes(':root[data-tav-palette^="neon-"]'),'Tema alternativo ignorado');
for(const token of ['--tav-hud-surface','--tav-hud-edge','--tav-hud-ink','--tav-hud-glow','--tav-pause-panel'])
 assert(css.includes(token), 'Token oficial do HUD ausente: '+token);
for(const state of [':focus-visible',':disabled',':active',':hover'])
 assert(css.includes(state),'Estado de controle ausente: '+state);
assert(css.includes('border-radius:50%!important'),'Moldura circular perdida');
assert(css.includes('clamp(27px,8.5vw,36px)'),'Escala móvel divergente do HUD');
assert(!css.includes('#tavAppearanceTrigger'),'Seletor de tema não pode ser redefinido pelo HUD');
assert(html.includes('id="tav-hud-design-v56-style"'),'CSS não foi aplicado ao HTML montado');
assert(html.includes('id="tav-offline-pause-v55-style"'),'Pausa offline não foi preservada');
assert(engine.includes('tav-offline-pause-mark')&&engine.includes('<svg viewBox="0 0 24 24"'),'Pausa sem ícone SVG');
assert(!engine.includes('Ⅱ</div>'),'Caracter numeral romano indevido');
assert(manual.includes('Contrato obrigatório dos componentes')&&manual.includes('320, 360, 390 e 430 px'),'Manual não define QA de consistência');
console.log('HUD_DESIGN_V56_OK: nove controles, pausa SVG, paletas, responsividade e manual');
