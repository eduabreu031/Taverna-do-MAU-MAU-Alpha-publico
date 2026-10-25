/* Retomada de sala na mesma aba: nunca serializar cartas ou estado de jogo.
   O Worker é a única fonte do jogo; o armazenamento guarda só credenciais efêmeras. */
const TAV_RESUME_KEY='taverna-online-resume-v1';
let connectSerial=0,restorePending=false;
function readResume(){
 try{
  const rec=JSON.parse(sessionStorage.getItem(TAV_RESUME_KEY)||'null');
  if(rec&&/^[A-HJ-NP-Z2-9]{6}$/.test(rec.room)&&typeof rec.seatToken==='string'&&rec.seatToken&&
     typeof rec.identity==='string'&&['guest','user','admin'].includes(rec.role))return rec;
 }catch{}
 return null;
}
function clearResume(){try{sessionStorage.removeItem(TAV_RESUME_KEY);}catch{}}
function saveResume(code,seatToken){
 const actor=window.TavernaAuth?.getUser?.();
 if(!actor||!seatToken)return;
 const guestToken=actor.role==='guest'?window.TavernaAuth?.getToken?.():null;
 if(actor.role==='guest'&&!guestToken)return;
 try{sessionStorage.setItem(TAV_RESUME_KEY,JSON.stringify({
  room:code,seatToken,identity:actor.username||'',role:actor.role,
  guestToken,name:name()
 }));}catch{}
}
function failedResume(reason='A sessão anterior não está mais disponível.'){
 restorePending=false;
 close(false);
 el('sceneGame')?.classList.add('hidden');
 el('sceneMenu')?.classList.add('hidden');
 el('sceneMultiplayer')?.classList.add('hidden');
 el('sceneWelcome')?.classList.remove('hidden');
 message(reason);
}
async function restoreRoomOnStartup(){
 const saved=readResume();
 if(!saved)return;
 const auth=window.TavernaAuth;
 let actor=null;
 try{
  actor=saved.role==='guest'?await auth?.resumeGuestForRoom?.(saved.guestToken):
                             await auth?.restoreSilently?.();
 }catch{}
 if(!actor||actor.username!==saved.identity||actor.role!==saved.role){clearResume();return;}
 // A identidade vem da conta validada; a mão nunca é restaurada localmente.
 if(saved.role==='guest'){
  const field=el('playerName');
  if(field){field.value=saved.name||'Forasteiro';field.readOnly=false;}
 }else auth?.syncAdventureName?.();
 el('sceneWelcome')?.classList.add('hidden');
 el('sceneMenu')?.classList.add('hidden');
 el('sceneGame')?.classList.add('hidden');
 el('sceneMultiplayer')?.classList.remove('hidden');
 el('onlineRoomCode').value=saved.room;
 el('multiplayerGreeting').textContent='Reconectando seu lugar na Taverna…';
 setStatus('Retomando sala '+saved.room+'…');
 notice.textContent='Recuperando a partida no servidor; suas cartas serão sincronizadas.';
 restorePending=true;
 connect(saved.room,saved.seatToken);
}
