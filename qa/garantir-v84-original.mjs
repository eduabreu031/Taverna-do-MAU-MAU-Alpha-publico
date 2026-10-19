import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const file=new URL('../site/index.html',import.meta.url);
const digest=createHash('sha256').update(readFileSync(file)).digest('hex');
// Cópia v84 oficial auditada, nunca deve ser alterada por integração da branch.
assert.equal(digest,'610467a8dfe46c516f609b28dd943e4df367e9cf94cc813d85ceee90f21a2912','REGRESSÃO: o HTML original da v84 mudou. Trabalhe somente em arquivos separados até revisão explícita.');
console.log('OK: HTML v84 original preservado byte a byte');
