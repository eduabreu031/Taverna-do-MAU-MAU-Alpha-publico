import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
const load=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const original=load('../site/index.html');
const sha=s=>createHash('sha256').update(s).digest('hex');
if(sha(original)!=='610467a8dfe46c516f609b28dd943e4df367e9cf94cc813d85ceee90f21a2912')throw Error('Arquivo base v84 diferente, abortando atualização');
const old=original.split('\n');
const fragment=n=>load((n===4?'v5':'v3')+'-fragmento-'+n+'.txt');
const out=[
 ...old.slice(0,1501),fragment(1).slice(0,-1),
 old.slice(1506,1507).join('\n'),fragment(2).slice(0,-1),
 ...old.slice(1507,1997),fragment(3).slice(0,-1),
 ...old.slice(1997,3185),fragment(4).slice(0,-1),
 ...old.slice(3185)
].join('\n');
const expected=sha(out);
if(!out.includes('onlineFinishPanel')||!out.includes('guestFinishTimer'))throw Error('Controles de fim de jogo ausentes');
for(const id of ['onlineCreate','onlineJoin','onlineStart','onlineLobby','online-v84-controller'])if(!out.includes(id))throw Error('Menu multiplayer incompleto: '+id);
mkdirSync(new URL('../release-v5/',import.meta.url),{recursive:true});
writeFileSync(new URL('../release-v5/index.html',import.meta.url),out);
console.log('Candidata v5 produzida:',expected,'bytes',Buffer.byteLength(out));
