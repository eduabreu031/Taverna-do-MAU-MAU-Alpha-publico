import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
const load=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const original=load('../site/index.html');
const sha=s=>createHash('sha256').update(s).digest('hex');
if(sha(original)!=='610467a8dfe46c516f609b28dd943e4df367e9cf94cc813d85ceee90f21a2912')throw Error('Arquivo base v84 diferente, abortando atualização');
const old=original.split('\n');
const fragment=n=>load('v3-fragmento-'+n+'.txt');
const out=[
 ...old.slice(0,1501),fragment(1).slice(0,-1),
 old.slice(1506,1507).join('\n'),fragment(2).slice(0,-1),
 ...old.slice(1507,1997),fragment(3).slice(0,-1),
 ...old.slice(1997,3185),fragment(4).slice(0,-1),
 ...old.slice(3185)
].join('\n');
const expected='5440c5bb5015af0e46467b3fe4f65590d18ca9e749cc1ba89dfd91ef5fedf4d2';
if(sha(out)!==expected)throw Error('V3 não reproduz o HTML testado: '+sha(out));
for(const id of ['onlineCreate','onlineJoin','onlineStart','onlineLobby','online-v84-controller'])if(!out.includes(id))throw Error('Menu multiplayer incompleto: '+id);
mkdirSync(new URL('../release/',import.meta.url),{recursive:true});
writeFileSync(new URL('../release/index.html',import.meta.url),out);
console.log('V3 exata verificada:',expected,'bytes',Buffer.byteLength(out));
