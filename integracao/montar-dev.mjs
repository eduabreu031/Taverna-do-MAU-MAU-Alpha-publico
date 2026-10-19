// Gera artefato DEV a partir da v84, sem alterar site/index.html.
// node integracao/montar-dev.mjs
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const original=read('../site/index.html');
const hash=createHash('sha256').update(original).digest('hex');
if(hash!=='610467a8dfe46c516f609b28dd943e4df367e9cf94cc813d85ceee90f21a2912')throw Error('A v84 mudou. Abortando build da integração.');
const before=String.raw`
    <div class="multiplayer-state" role="status"><span class="multiplayer-state-dot"></span>Salas online em preparação</div>
    <p class="multiplayer-copy">Aqui você poderá criar uma mesa privada ou entrar em uma mesa usando um código. A conexão entre jogadores ainda não está implementada nesta versão.</p>
    <div class="multiplayer-preview" aria-label="Recursos planejados">
      <div><span aria-hidden="true">♜</span><strong>Criar mesa</strong><small>Hospedar uma partida com amigos</small></div>
      <div><span aria-hidden="true">✉</span><strong>Entrar com código</strong><small>Encontrar a mesa de outro aventureiro</small></div>
    </div>`;
const after=String.raw`
    <div class="multiplayer-state" role="status"><span class="multiplayer-state-dot"></span><span id="onlineStatusText">Aguardando conexão</span></div>
    <p class="multiplayer-copy" id="onlineNotice">Crie uma sala privada ou entre pelo código de um amigo.</p>
    <div class="multiplayer-preview" aria-label="Controles de sala">
      <div><button type="button" class="engraved-btn primary" id="onlineCreate">♜ Criar sala</button><small>Convide seus amigos pelo código</small></div>
      <div><label for="onlineRoomCode">Código da sala</label><input id="onlineRoomCode" maxlength="6" placeholder="ABC123" autocomplete="off" spellcheck="false"><button type="button" class="engraved-btn" id="onlineJoin">Entrar na sala</button></div>
    </div>
    <section id="onlineLobby" class="hidden" aria-label="Participantes na sala">
      <p class="multiplayer-copy">Código: <strong id="onlineCode">—</strong></p>
      <ol id="onlinePlayers" aria-live="polite"></ol>
      <div class="modal-actions"><button type="button" class="engraved-btn primary" id="onlineStart" disabled>Iniciar partida</button><button type="button" class="engraved-btn" id="onlineCopy">Copiar convite</button><button type="button" class="engraved-btn" id="onlineLeave">Sair da sala</button></div>
      <p id="onlineStartHint" class="multiplayer-copy">O anfitrião pode iniciar com dois ou mais participantes.</p>
    </section>`;
if(original.split(before).length!==2)throw Error('Menu original diferente do esperado');
const marker='function formatHistory(e,s)';
if(original.split(marker).length!==2)throw Error('Renderizador original diferente do esperado');
const bridge=read('online-v84-render-bridge.js'),controller=read('online-v84-controller.js');
const styling=String.raw`<style id="online-v84-style">
#sceneMultiplayer #onlineRoomCode{width:min(130px,90%);padding:9px;border:2px solid #a67b4d;border-radius:6px;background:#ecd4a3;color:#352118;font-weight:bold;text-transform:uppercase}
#sceneMultiplayer #onlineLobby{margin:14px auto;padding:14px;max-width:540px;border:1px solid #aa8150;background:#2d1b19;border-radius:10px}
#sceneMultiplayer #onlinePlayers{text-align:left;color:#e4cca8;padding:9px 22px;line-height:1.8}
#sceneMultiplayer #onlineLobby .modal-actions{gap:8px}
#sceneMultiplayer #onlineLobby .engraved-btn{min-width:0}
#sceneMultiplayer .multiplayer-preview button{max-width:100%}
</style>`;
const tag='<script id="pwa-registration">';
let html=original.replace(before,after).replace(marker,bridge+'
'+marker);
if(html.split(tag).length!==2)throw Error('Entrada de script PWA não encontrada');
html=html.replace(tag,styling+'
<script id="online-v84-controller">
'+controller+'
</script>
'+tag);
const scripts=t=>[...t.matchAll(/<script[^>]*>([sS]*?)</script>/gi)].map(x=>x[1]);
const old=scripts(original),neo=scripts(html);
if(neo.length!==old.length+1)throw Error('Número incorreto de scripts');
for(let i=0;i<old.length;i++){if(i===4)continue; /* o script principal foi estendido */ }
mkdirSync(new URL('../preview/',import.meta.url),{recursive:true});
writeFileSync(new URL('../preview/index.html',import.meta.url),html);
console.log('Preview integrada criada:',Buffer.byteLength(html),'bytes; original preservado.');
