// Saída voluntária do MULTIPLAYER: jogo e sala são entidades diferentes.
const tavAbandonOverlay=document.createElement('div');
tavAbandonOverlay.id='tavAbandonOverlay';tavAbandonOverlay.hidden=true;
tavAbandonOverlay.setAttribute('role','dialog');
tavAbandonOverlay.setAttribute('aria-modal','true');
tavAbandonOverlay.setAttribute('aria-labelledby','tavAbandonTitle');
const tavAbandonCard=document.createElement('section');tavAbandonCard.className='tav-abandon-card';
const tavAbandonTitle=document.createElement('h2');tavAbandonTitle.id='tavAbandonTitle';tavAbandonTitle.textContent='Abandonar a partida?';
const tavAbandonDescription=document.createElement('p');
tavAbandonDescription.textContent='Você será retirado da disputa. A partida continuará para os demais e você permanecerá no lobby desta sala.';
const tavAbandonActions=document.createElement('div');tavAbandonActions.className='tav-abandon-actions';
const tavAbandonNo=document.createElement('button');tavAbandonNo.type='button';tavAbandonNo.textContent='Não, continuar';
const tavAbandonYes=document.createElement('button');tavAbandonYes.type='button';tavAbandonYes.className='danger';tavAbandonYes.textContent='Sim, abandonar';
tavAbandonActions.append(tavAbandonNo,tavAbandonYes);
tavAbandonCard.append(tavAbandonTitle,tavAbandonDescription,tavAbandonActions);
tavAbandonOverlay.append(tavAbandonCard);document.body.append(tavAbandonOverlay);
let tavAbandonPending=false,tavAbandonedMatchNo=0,tavLatestMatchNo=0;
function tavStayInLobby(m){
 if(!tavAbandonedMatchNo)return false;
 if(!m?.game){tavAbandonedMatchNo=0;return false;}
 if(m.matchNo===tavAbandonedMatchNo)return true;
 // O usuário só reentra na mesa de uma nova partida se recebeu uma cadeira.
 if(m.role==='spectator')return true;
 tavAbandonedMatchNo=0;return false;
}
function tavDismissAbandon(){
 if(tavAbandonPending)return;
 tavAbandonOverlay.hidden=true;
}
tavAbandonNo.addEventListener('click',tavDismissAbandon);
tavAbandonOverlay.addEventListener('click',e=>{if(e.target===tavAbandonOverlay)tavDismissAbandon();});
tavAbandonYes.addEventListener('click',()=>{
 if(tavAbandonPending)return;
 const isActive=game&&['playing','scoring'].includes(game.phase)&&game.players?.some(p=>p.id===uid&&p.alive!==false);
 if(!isActive){tavAbandonOverlay.hidden=true;tavOpenRoomLobby(tavLatestMatchNo);return;}
 if(!send({type:'abandon_match'}))return;
 tavAbandonPending=true;
 tavAbandonNo.disabled=true;tavAbandonYes.disabled=true;
 tavAbandonDescription.textContent='Confirmando sua saída da partida no servidor…';
});
function tavResetAbandonDialog(){
 tavAbandonPending=false;tavAbandonOverlay.hidden=true;
 tavAbandonNo.disabled=false;tavAbandonYes.disabled=false;
 tavAbandonDescription.textContent='Você será retirado da disputa. A partida continuará para os demais e você permanecerá no lobby desta sala.';
}
function tavOpenRoomLobby(matchNo){
 tavAbandonedMatchNo=Number(matchNo)||tavLatestMatchNo||0;
 tavResetAbandonDialog();
 cancelOnlineEffects();lastRenderedRound=null;resetFinishNotice();
 tavClearBubbles();tavStopRecord(false);tavSocialMenu.hidden=true;
 tavSocialLauncher.hidden=true;tavVotePanel.hidden=true;
 showSkipFinal(null);
 if(online){try{window.__tavOriginalOnline?.reset();}catch(e){console.warn('Falha ao limpar mesa',e);}}
 online=false;game=null;revision=-1;firstGameState=true;lastEventIds.clear();comboReset();
 const table=el('sceneGame'),multiplayer=el('sceneMultiplayer');
 table?.classList.remove('online-live','beta-spectating');table?.classList.add('hidden');
 multiplayer?.classList.remove('hidden');el('sceneWelcome')?.classList.add('hidden');
 lobby.classList.remove('hidden');
 betaBanner.hidden=true;betaScoreBtn.hidden=true;betaScore.hidden=true;betaTag.hidden=true;
 setStatus('Você está no lobby da sala. A partida dos demais continua.');
}
function tavHandleAbandonAcknowledgement(m){
 // Não basta sair visualmente: só volta ao lobby após o servidor retirar a cadeira.
 tavOpenRoomLobby(m.matchNo);
}
function tavRequestLeaveMatch(){
 if(!room||!uid)return;
 const active=!!(game&&['playing','scoring'].includes(game.phase)&&game.players?.some(p=>p.id===uid&&p.alive!==false));
 if(!active){tavOpenRoomLobby(tavLatestMatchNo);return;}
 tavResetAbandonDialog();tavAbandonOverlay.hidden=false;tavAbandonNo.focus();
}
function tavAbandonError(){
 if(!tavAbandonPending)return;
 tavAbandonPending=false;tavAbandonNo.disabled=false;tavAbandonYes.disabled=false;
 tavAbandonDescription.textContent='Não foi possível confirmar a saída. Você continua na partida. Tente novamente ou escolha Não.';
}
function tavLeaveToMainMenu(){
 tavResetAbandonDialog();tavAbandonedMatchNo=0;tavLatestMatchNo=0;
 close(true);
 el('sceneGame')?.classList.add('hidden');
 el('sceneMultiplayer')?.classList.add('hidden');
 el('sceneWelcome')?.classList.remove('hidden');
}
