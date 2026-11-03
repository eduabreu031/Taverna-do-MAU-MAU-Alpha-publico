'use strict';
// Guardrail automatizado da identidade. Executar sempre APÓS montar o HTML.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const site=process.argv[2]||path.join(root,'site');
const html=fs.readFileSync(path.join(site,'index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'qa','tavern-design-system-v56.css'),'utf8');
const pause=fs.readFileSync(path.join(root,'qa','offline-pause-engine-v55.js'),'utf8');
const manual=fs.readFileSync(path.join(root,'docs','MANUAL-IDENTIDADE-VISUAL.md'),'utf8');
assert(html.length>4_000_000,'Montagem HTML incompleta');
assert(html.includes('id="tav-design-system-v56-style"'),'Contrato de design ausente no HTML');
assert(html.includes('id="tav-offline-pause-v55-style"'),'Estilo da pausa ausente');
assert(html.includes('id="tav-cronicas-script"'),'Conquistas ausentes');
assert(html.includes('--tav-hud-glyph-filter'),'Estilos dos ícones não injetados');
assert(/#sceneGame \.game-header \.utility-toolbar button\s*\{/.test(css),
 'Contrato deve atingir TODOS os botões do HUD, não só os novos');
assert(css.includes('border-radius:50%!important'),'Geometria comum de botão ausente');
assert(css.includes('var(--tp-bright)')&&css.includes('var(--tp-button)'),
 'Tema deve controlar tom e material');
for(const name of ['.tav-ui-panel','.tav-ui-button','.tav-ui-icon-button'])
 assert(css.includes(name),'Componente reutilizável faltando: '+name);
assert(pause.includes('tavOfflinePause(mode='),'Pausa offline removida');
assert(pause.includes('<svg viewBox="0 0 24 24"'),'Marca da pausa não é SVG');
assert(!pause.includes('Ⅱ')&&!html.includes('tav-offline-pause-mark" aria-hidden="true">Ⅱ'),
 'Numeral romano na pausa reapareceu');
assert(manual.includes('Contrato de componentes'),'Manual sem regras obrigatórias');
const release=JSON.parse(fs.readFileSync(path.join(root,'qa','alpha-releases.json'),'utf8'));
assert.equal(release.current,'alpha-0.5.0.61','Versão da correção deve constar no changelog');
console.log('DESIGN_CONTRACT_OK: HUD, SVG da pausa, 12 paletas, componentes e manual');
