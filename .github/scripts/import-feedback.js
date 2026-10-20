// Importa relatos sem conta a partir do Worker para Issues via GITHUB_TOKEN automático do Actions.
// NÃO colocar GitHub Token, credencial ou chave no cliente.
const {owner,repo}=context.repo;
const endpoint='https://taverna-multiplayer-servidor.edulopes941.workers.dev/api/feedback/feed';
const response=await fetch(endpoint,{headers:{accept:'application/json'},signal:AbortSignal.timeout(20000)});
if(!response.ok)throw Error('Worker de feedback indisponível: HTTP '+response.status);
const data=await response.json();
if(!Array.isArray(data.items))throw Error('Formato inesperado da caixa de relatos');
const items=data.items.filter(x=>x&&/^[a-f0-9-]{20,50}$/.test(String(x.id))).slice(-350);
const issues=await github.paginate(github.rest.issues.listForRepo,{owner,repo,state:'all',per_page:100,labels:'origem: jogo'});
const ids=new Set();
for(const issue of issues){
 if(issue.pull_request)continue;
 const found=String(issue.body||'').match(/<!-- alpha-feedback-id:([a-f0-9-]{20,50}) -->/);
 if(found)ids.add(found[1]);
}
const protect=s=>String(s||'').replace(/@/g,'＠').replace(/<!--/g,'＜!--').replace(/-->/g,'--＞');
const quote=s=>protect(s).split(/\r?\n/).map(line=>'> '+line).join('\n');
let created=0;
for(const item of items){
 if(ids.has(item.id))continue;
 if(!['bug','sugestao'].includes(item.type))continue;
 const nickname=String(item.name||'').trim().slice(0,32);
 const message=String(item.message||'').trim().slice(0,1200);
 const version=/^Alpha v\d{1,4}$/.test(item.version)?item.version:'Alpha (não informada)';
 if(!nickname||message.length<10)continue;
 const first=message.split(/\r?\n/).find(x=>x.trim())||'Relato de jogador';
 const title=(item.type==='bug'?'[Bug] ':'[Sugestão] ')+first.slice(0,88);
 const body=[
 '<!-- taverna-relato-alpha -->',
 '<!-- alpha-feedback-id:'+item.id+' -->',
 '**Tipo:** '+(item.type==='bug'?'Bug':'Sugestão'),
 '**Apelido informado:** '+protect(nickname),
 '**Versão:** '+version,
 '**Enviado:** '+new Date(item.at).toISOString(),
 '**Origem:** formulário dentro da Taverna (sem login)',
 '',
 '### Relato',
 quote(message),
 '',
 '_O autor escolheu livremente o apelido. Não foram solicitados e-mail, conta GitHub ou telefone._'
 ].join('\n');
 const labels=['origem: jogo','alpha-publica','triagem-pendente',item.type==='bug'?'tipo: bug':'tipo: sugestao'];
 await github.rest.issues.create({owner,repo,title,body,labels});
 created++;ids.add(item.id);
 if(created>=100)break;
}
core.info('Relatos no Worker: '+items.length+'; novos Issues: '+created+'; já importados: '+(items.length-created));
