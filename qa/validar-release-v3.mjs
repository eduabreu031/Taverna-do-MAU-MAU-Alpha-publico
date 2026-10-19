import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const html=readFileSync(new URL(process.env.TAVERNA_RELEASE || '../release/index.html',import.meta.url),'utf8');
const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
assert.ok(scripts.length>=10,'Scripts incompletos na versão v3');
scripts.forEach((s,i)=>new vm.Script(s,{filename:'release-script-'+(i+1)+'.js'}));
for(const key of ['onlineCreate','onlineJoin','onlineStart','onlineLobby','online-v84-controller'])assert.ok(html.includes(key),'Falta '+key);
console.log('OK: v3 possui '+scripts.length+' scripts válidos e menu multiplayer presente');
