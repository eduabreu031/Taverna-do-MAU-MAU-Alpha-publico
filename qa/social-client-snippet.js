// Comunicação rápida: executa exclusivamente no controlador multiplayer.
// Não interfere no estado da partida nem no motor de regras offline.
const tavSocialLauncher=document.createElement('button');
tavSocialLauncher.id='tavSocialLauncher';tavSocialLauncher.type='button';tavSocialLauncher.textContent='💬';
tavSocialLauncher.title='Reações, texto e voz';tavSocialLauncher.hidden=true;
tavSocialLauncher.setAttribute('aria-label','Abrir comunicação rápida');
const tavSocialMenu=document.createElement('section');
tavSocialMenu.id='tavSocialMenu';tavSocialMenu.hidden=true;tavSocialMenu.setAttribute('aria-label','Comunicação da mesa');
const tavEmojiRow=document.createElement('div');tavEmojiRow.className='tavEmojis';
for(const emoji of ['😂','😡','😏','🥳','😱','👏']){
 const button=document.createElement('button');button.type='button';button.textContent=emoji;button.setAttribute('aria-label','Reagir '+emoji);
 button.addEventListener('click',()=>{if(tavCanSpeak())send({type:'social_send',kind:'emoji',emoji});tavSocialMenu.hidden=true;});
 tavEmojiRow.append(button);
}
const tavTextLine=document.createElement('div');tavTextLine.className='tavTextLine';
const tavTextInput=document.createElement('input');tavTextInput.type='text';tavTextInput.maxLength=100;tavTextInput.placeholder='Mensagem (50 caracteres)';tavTextInput.setAttribute('aria-label','Mensagem curta');
const tavTextSend=document.createElement('button');tavTextSend.type='button';tavTextSend.textContent='➤';tavTextSend.setAttribute('aria-label','Enviar texto');
const tavTextCount=document.createElement('p');tavTextCount.className='tavFootnote';tavTextCount.textContent='0/50';
tavTextLine.append(tavTextInput,tavTextSend);
const tavMicLine=document.createElement('div');tavMicLine.className='tavRecordLine';
const tavMic=document.createElement('button');tavMic.id='tavSocialMic';tavMic.type='button';tavMic.textContent='🎙️ Segurar';
const tavMicNotice=document.createElement('span');tavMicNotice.textContent='Áudio de até 3 segundos';
tavMicLine.append(tavMic,tavMicNotice);
const tavVoteNew=document.createElement('div');tavVoteNew.className='tavVoteNew';tavVoteNew.hidden=true;
const tavVoteSelect=document.createElement('select');tavVoteSelect.setAttribute('aria-label','Jogador que será votado');
const tavVoteBegin=document.createElement('button');tavVoteBegin.type='button';tavVoteBegin.id='tavSocialVoteStart';tavVoteBegin.textContent='⚖ Votar';
tavVoteNew.append(tavVoteSelect,tavVoteBegin);
tavSocialMenu.append(tavEmojiRow,tavTextLine,tavTextCount,tavMicLine,tavVoteNew);
const tavVotePanel=document.createElement('aside');
tavVotePanel.id='tavSocialVote';tavVotePanel.hidden=true;
const tavVoteTitle=document.createElement('strong'),tavVoteClock=document.createElement('p'),tavVoteCount=document.createElement('p');
const tavVoteButtons=document.createElement('div');tavVoteButtons.className='tavVoteActions';
const tavVoteYes=document.createElement('button');tavVoteYes.type='button';tavVoteYes.textContent='Expulsar';
const tavVoteNo=document.createElement('button');tavVoteNo.type='button';tavVoteNo.textContent='Manter';
tavVoteButtons.append(tavVoteYes,tavVoteNo);
tavVotePanel.append(tavVoteTitle,tavVoteClock,tavVoteCount,tavVoteButtons);
document.body.append(tavSocialLauncher,tavSocialMenu,tavVotePanel);
let tavSocialGame=null,tavSocialVoteState=null,tavSocialRound='',tavSocialAudio=null,tavMicWanted=false,tavMicSession=null;
const tavSocialBubbles=new Map();let tavSeenVoteResult='';
function tavCanSpeak(){
 if(!online||!tavSocialGame||tavSocialGame.phase!=='playing')return false;
 const me=tavSocialGame.players?.find(p=>p.id===uid);
 return !!(me&&me.alive!==false&&players.some(p=>p.id===uid&&!p.isBot&&p.online));
}
function tavName(id){return players.find(p=>p.id===id)?.name||'Jogador';}
function tavRefreshTextCount(){
 const n=[...tavTextInput.value].length;
 tavTextCount.textContent=n+'/50';
 tavTextSend.disabled=!n||n>50||!tavCanSpeak();
}
tavTextInput.addEventListener('input',tavRefreshTextCount);
function tavSendText(){
 const text=tavTextInput.value.trim();
 if(!text||[...text].length>50||!tavCanSpeak())return;
 if(send({type:'social_send',kind:'text',text})){tavTextInput.value='';tavRefreshTextCount();tavSocialMenu.hidden=true;}
}
tavTextSend.addEventListener('click',tavSendText);
tavTextInput.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();tavSendText();}});
function tavPlaceSocial(){
 if(tavSocialLauncher.hidden)return;
 const hand=document.getElementById('humanHand');
 const bounds=hand?.getBoundingClientRect(),view=window.visualViewport?.height||window.innerHeight;
 const height=view||window.innerHeight;
 let top=height*0.70;
 if(bounds&&bounds.height>10&&bounds.top<height&&bounds.bottom>0)top=bounds.top-52;
 top=Math.max(70,Math.min(height-150,top));
 tavSocialLauncher.style.top=Math.round(top)+'px';
 if(!tavSocialMenu.hidden){
  const m=tavSocialMenu.getBoundingClientRect();
  const y=Math.max(55,Math.min(height-m.height-12,top-m.height-8));
  tavSocialMenu.style.top=Math.round(y)+'px';
 }
 for(const [id,record] of tavSocialBubbles)tavPositionBubble(id,record.node);
}
tavSocialLauncher.addEventListener('click',()=>{
 if(!tavCanSpeak())return;
 tavSocialMenu.hidden=!tavSocialMenu.hidden;
 tavRefreshTextCount();
 requestAnimationFrame(tavPlaceSocial);
});
window.addEventListener('resize',tavPlaceSocial);
window.addEventListener('scroll',tavPlaceSocial,{passive:true});
window.visualViewport?.addEventListener('resize',tavPlaceSocial);
function tavPositionBubble(id,node){
 const scene=document.getElementById('sceneGame'),viewHeight=window.visualViewport?.height||window.innerHeight;
 const name=tavName(id);
 let rect=null;
 if(scene){
  // Prefere o menor retrato/nome visível do participante, caso exista.
  const nodes=scene.querySelectorAll('[data-player-id],[data-id],[class*="seat"],[class*="portrait"],[class*="avatar"],[class*="player"]');
  let bestArea=Infinity;
  for(const el of nodes){
   const match=el.getAttribute('data-player-id')===id||el.getAttribute('data-id')===id||(name&&el.textContent?.trim()===name);
   if(!match)continue;
   const r=el.getBoundingClientRect(),area=r.width*r.height;
   if(area>=150&&area<bestArea&&r.height<220&&r.width<250&&r.top<viewHeight&&r.bottom>0){rect=r;bestArea=area;}
  }
 }
 if(!rect&&id===uid){const hand=document.getElementById('humanHand');rect=hand?.getBoundingClientRect();}
 if(rect){
  node.style.left=Math.round(Math.min(innerWidth-24,Math.max(24,rect.left+rect.width/2)))+'px';
  node.style.top=Math.round(Math.max(52,Math.min(viewHeight-70,rect.top-58)))+'px';
 }else{
  const all=tavSocialGame?.players||[],index=all.findIndex(p=>p.id===id),own=all.findIndex(p=>p.id===uid),n=all.length;
  const rel=(index-own+n)%Math.max(1,n);
  // Fallback: perímetro da mesa, nunca sobre os baralhos centrais.
  const pos=rel===0?[50,73]:rel<(n+1)/3?[12,72-14*rel]:rel<2*(n+1)/3?[Math.min(80,15+65*(rel/(n-1))),12]:[88,24+45*(rel/(n-1))];
  node.style.left=pos[0]+'vw';node.style.top=pos[1]+'vh';
 }
}
function tavBubble(e){
 if(!online||!tavSocialGame||!tavSocialGame.players?.some(p=>p.id===e.playerId))return;
 const prev=tavSocialBubbles.get(e.playerId);
 if(prev){clearTimeout(prev.timer);prev.node.remove();}
 const node=document.createElement('div');node.className='tavSocialBubble '+(e.kind==='emoji'?'emoji':e.kind==='audio'?'voice':'');
 if(e.kind==='emoji')node.textContent=e.emoji;
 else if(e.kind==='audio')node.textContent='🔊 Áudio · '+Math.min(3,Math.round(e.samples/16000))+'s';
 else node.textContent=e.text;
 document.body.append(node);tavPositionBubble(e.playerId,node);
 const timer=setTimeout(()=>{node.remove();if(tavSocialBubbles.get(e.playerId)?.node===node)tavSocialBubbles.delete(e.playerId);},e.kind==='audio'?3200:e.kind==='emoji'?3000:5000);
 tavSocialBubbles.set(e.playerId,{node,timer});
}
function tavClearBubbles(){
 for(const x of tavSocialBubbles.values()){clearTimeout(x.timer);x.node.remove();}
 tavSocialBubbles.clear();
}
function tavSoundAllowed(){
 // A voz acompanha a preferência de efeitos sonoros quando o controle
 // da interface existente expõe um estado consultável.
 const controls=['#sfxToggle','#soundToggle','#soundBtn','#sfxBtn','#toggleSfx','#somBtn'];
 const button=controls.map(s=>document.querySelector(s)).find(Boolean);
 if(button){
  if(button.getAttribute('aria-pressed')==='false'||button.getAttribute('aria-checked')==='false'||button.checked===false)return false;
  if(button.classList.contains('muted')||button.classList.contains('off'))return false;
 }
 return true;
}
function tavGetAudioContext(){
 if(tavSocialAudio)return tavSocialAudio;
 const AC=window.AudioContext||window.webkitAudioContext;
 if(!AC)return null;
 try{tavSocialAudio=new AC();return tavSocialAudio;}catch{return null;}
}
function tavUnlockAudio(){
 const ac=tavGetAudioContext();
 if(ac?.state==='suspended')ac.resume().catch(()=>{});
}
document.addEventListener('pointerdown',tavUnlockAudio,{capture:true,passive:true});
async function tavPlayVoice(e){
 if(!tavSoundAllowed()||!online||e.playerId===uid)return;
 const ac=tavGetAudioContext();
 if(!ac||ac.state!=='running')return; // Sem reprodução manual, conforme combinado.
 if(e.format!=='pcm16'||e.sampleRate!==16000||!e.samples||e.samples>48000||!e.data)return;
 try{
  const raw=atob(e.data);
  if(raw.length!==e.samples*2)return;
  const bytes=new Uint8Array(raw.length);
  for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
  const pcm=new DataView(bytes.buffer),buffer=ac.createBuffer(1,e.samples,16000),channel=buffer.getChannelData(0);
  for(let i=0;i<e.samples;i++)channel[i]=pcm.getInt16(i*2,true)/32768;
  const src=ac.createBufferSource();src.buffer=buffer;src.connect(ac.destination);src.start();
 }catch{} // Falha de codec/autoplay simplesmente ignora o áudio.
}
async function tavStartRecord(ev){
 if(ev.button!==undefined&&ev.button!==0)return;
 if(!tavCanSpeak()||tavMicSession)return;
 ev.preventDefault();tavUnlockAudio();tavMicWanted=true;
 try{tavMic.setPointerCapture(ev.pointerId);}catch{}
 if(!navigator.mediaDevices?.getUserMedia){tavMicNotice.textContent='Microfone não disponível neste aparelho';tavMicWanted=false;return;}
 let stream;
 try{stream=await navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:true,noiseSuppression:true},video:false});}
 catch{tavMicNotice.textContent='Permita o uso do microfone para gravar';tavMicWanted=false;return;}
 if(!tavMicWanted){stream.getTracks().forEach(t=>t.stop());tavMicNotice.textContent='Segure novamente para falar';return;}
 const AC=window.AudioContext||window.webkitAudioContext;
 if(!AC){stream.getTracks().forEach(t=>t.stop());tavMicWanted=false;return;}
 let ac,processor,gain,source;
 try{
  ac=new AC();await ac.resume();
  if(!tavMicWanted){await ac.close();stream.getTracks().forEach(t=>t.stop());return;}
  source=ac.createMediaStreamSource(stream);
  processor=ac.createScriptProcessor(2048,1,1);
  gain=ac.createGain();gain.gain.value=0;
  const frames=[];
  processor.onaudioprocess=event=>{
   if(!tavMicSession)return;
   frames.push(new Float32Array(event.inputBuffer.getChannelData(0)));
  };
  source.connect(processor);processor.connect(gain);gain.connect(ac.destination);
  tavMicSession={stream,ac,source,processor,gain,frames,rate:ac.sampleRate,timer:setTimeout(()=>tavStopRecord(true),3000)};
  tavMic.classList.add('recording');tavMicNotice.textContent='🔴 Gravando... solte para enviar';
 }catch{
  stream.getTracks().forEach(t=>t.stop());try{await ac?.close();}catch{}
  tavMicWanted=false;tavMicNotice.textContent='Não foi possível iniciar a gravação';
 }
}
function tavStopRecord(deliver){
 tavMicWanted=false;
 const s=tavMicSession;tavMicSession=null;tavMic.classList.remove('recording');
 if(!s)return;
 clearTimeout(s.timer);
 s.processor.onaudioprocess=null;
 try{s.source.disconnect();s.processor.disconnect();s.gain.disconnect();}catch{}
 s.stream.getTracks().forEach(t=>t.stop());
 s.ac.close().catch(()=>{});
 tavMicNotice.textContent='Áudio de até 3 segundos';
 if(!deliver||!tavCanSpeak())return;
 const count=s.frames.reduce((n,x)=>n+x.length,0);
 const wanted=Math.min(48000,Math.floor(count*16000/s.rate));
 if(wanted<800)return;
 const values=new Float32Array(count);let offset=0;
 for(const frame of s.frames){values.set(frame,offset);offset+=frame.length;}
 const pcm=new Uint8Array(wanted*2),view=new DataView(pcm.buffer);
 for(let i=0;i<wanted;i++){
  const pos=i*s.rate/16000,low=Math.floor(pos),frac=pos-low;
  const a=values[low]||0,b=values[Math.min(values.length-1,low+1)]||0;
  const value=Math.max(-1,Math.min(1,a+(b-a)*frac));
  view.setInt16(i*2,value<0?Math.round(value*32768):Math.round(value*32767),true);
 }
 let binary='';
 for(let i=0;i<pcm.length;i+=8192)binary+=String.fromCharCode(...pcm.subarray(i,i+8192));
 const data=btoa(binary);
 send({type:'social_send',kind:'audio',audio:{format:'pcm16',sampleRate:16000,samples:wanted,data}});
 tavSocialMenu.hidden=true;
}
tavMic.addEventListener('pointerdown',tavStartRecord);
tavMic.addEventListener('pointerup',()=>tavStopRecord(true));
tavMic.addEventListener('pointercancel',()=>tavStopRecord(false));
tavMic.addEventListener('lostpointercapture',()=>{if(tavMicWanted)tavStopRecord(true);});
function tavRenderVote(){
 const v=tavSocialVoteState,g=tavSocialGame;
 if(!online||!g||g.phase!=='playing'){tavVotePanel.hidden=true;return;}
 const canVote=!!v?.active;
 tavVotePanel.hidden=!canVote;
 if(!canVote)return;
 tavVoteTitle.textContent='⚖ Expulsar '+tavName(v.targetId)+'?';
 tavVoteClock.textContent='Tempo restante: '+Math.max(0,Math.ceil((v.endsAt-Date.now())/1000))+'s';
 tavVoteCount.textContent='Votos pela expulsão: '+v.yes+'/'+v.needed;
 tavVoteButtons.hidden=!!v.myChoice||!v.canVote;
 if(v.myChoice)tavVoteCount.textContent+=' · Seu voto foi registrado.';
 if(!v.canVote&&!v.myChoice)tavVoteCount.textContent+=' · Você não participa desta votação.';
}
tavVoteYes.addEventListener('click',()=>{
 const v=tavSocialVoteState;if(v?.canVote&&send({type:'vote_kick_cast',id:v.id,choice:'yes'})){tavVoteYes.disabled=true;tavVoteNo.disabled=true;}
});
tavVoteNo.addEventListener('click',()=>{
 const v=tavSocialVoteState;if(v?.canVote&&send({type:'vote_kick_cast',id:v.id,choice:'no'})){tavVoteYes.disabled=true;tavVoteNo.disabled=true;}
});
tavVoteBegin.addEventListener('click',()=>{
 if(!tavCanSpeak()||!tavSocialVoteState?.canStart)return;
 const targetId=tavVoteSelect.value;
 if(targetId&&send({type:'vote_kick_start',targetId}))tavSocialMenu.hidden=true;
});
setInterval(()=>{if(!tavVotePanel.hidden)tavRenderVote();},600);
function tavUpdateSocialFromState(m){
 const g=m.game||null;
 const match=String(m.matchNo||0)+'/'+String(g?.round||0);
 if(match!==tavSocialRound){tavClearBubbles();tavSocialRound=match;tavSocialMenu.hidden=true;}
 tavSocialGame=g;tavSocialVoteState=m.socialVote||null;
 const me=g?.players?.find(p=>p.id===uid);
 const alive=!!(online&&g?.phase==='playing'&&me&&me.alive!==false&&m.players?.some(p=>p.id===uid&&!p.isBot&&p.online));
 tavSocialLauncher.hidden=!alive;
 if(!alive){tavSocialMenu.hidden=true;tavStopRecord(false);}
 const readyToVote=alive&&!!m.socialVote?.canStart&&!m.socialVote?.active;
 tavVoteNew.hidden=!readyToVote;
 if(readyToVote){
  const prev=tavVoteSelect.value;
  tavVoteSelect.replaceChildren();
  for(const p of (g.players||[])){
   const member=m.players?.find(x=>x.id===p.id);
   if(p.alive===false||p.id===uid||!member||member.isBot||!member.online)continue;
   const o=document.createElement('option');o.value=p.id;o.textContent=member.name;tavVoteSelect.append(o);
  }
  if([...tavVoteSelect.options].some(x=>x.value===prev))tavVoteSelect.value=prev;
 }
 tavVoteYes.disabled=false;tavVoteNo.disabled=false;
 tavRenderVote();tavRefreshTextCount();
 if(m.socialVote?.recent?.id&&m.socialVote.recent.id!==tavSeenVoteResult){
  const res=m.socialVote.recent;
  tavSeenVoteResult=res.id;
  if(Date.now()-res.at<13000)message(res.approved?'⚖ Expulsão aprovada. O jogador deixou a mesa.':'⚖ Votação encerrada sem expulsão.');
 }
 requestAnimationFrame(tavPlaceSocial);
}
function tavIncomingSocial(e){
 if(!e||e.type!=='social_event'||!['text','emoji','audio'].includes(e.kind))return;
 tavBubble(e);
 if(e.kind==='audio')tavPlayVoice(e);
}
function tavRemovedByVote(m){
 tavStopRecord(false);tavClearBubbles();tavSocialMenu.hidden=true;tavVotePanel.hidden=true;tavSocialLauncher.hidden=true;
 message(m.message||'Você foi expulso da partida.');
 close(true);el('sceneGame').classList.add('hidden');el('sceneMultiplayer').classList.add('hidden');el('sceneWelcome').classList.remove('hidden');
}
