/* Testa a compilação e os fluxos internos sem depender de janelas do navegador. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),site=process.argv[2]||path.join(root,'site');
const html=fs.readFileSync(path.join(site,'index.html'),'utf8');
const js=fs.readFileSync(path.join(root,'qa/tavern-ui-shell.js'),'utf8');
const css=fs.readFileSync(path.join(root,'qa/tavern-ui-shell.css'),'utf8');
new vm.Script(js,{filename:'tavern-ui-shell.js'});
for(const id of ['onlineCreate','onlineJoin','onlineRoomCode','onlineLeave','onlineLobby','tavLounge','playerCount','difficulty','onlineBotsDEV','alphaReportType']){
 assert(html.includes('id="'+id+'"'),id+' desapareceu do HTML final');
}
assert(html.includes('id="tav-native-ui-style"'),'CSS premium não injetado');
assert(html.includes('id="tav-native-ui-script"'),'JS premium não injetado');
assert(html.includes("window.TavernaUI.confirm({title:'Remover participante?'"),'Confirmações VIP não migraram para modal');
assert(html.includes("window.TavernaUI.share(url.href)"),'Cópia sem clipboard não usa modal interno');
assert(html.includes("window.TavernaUI.confirm({title:'Deixar a mesa?'"),'Saída da partida ainda não usa confirmação interna');
assert(!html.includes('window.confirm('),'Restou confirmação nativa');
assert(!html.includes("prompt('Copie o convite'"),'Restou prompt nativo de convite');
assert(js.includes("for(const id of ['playerCount','difficulty','alphaReportType'])"),'Faltam seletores temáticos');
assert(js.includes("select.dispatchEvent(new Event('change'"),'Seletores devem preservar eventos do motor');
assert(js.includes("leave.addEventListener('click',async e=>"),'Sair da sala não tem confirmação interna');
assert(js.includes("back.addEventListener('click',async e=>"),'Voltar com sala aberta não tem confirmação');
assert(css.includes('--tm-menu-surface')&&css.includes('--tm-menu-ink')&&css.includes('--tp-button'),
 'Visuais não compartilham paleta com os 12 temas');
for(const block of ['.multiplayer-preview','.multiplayer-panel','#onlineLobby','#onlineRoomCode','#onlinePlayers','.tav-native-sheet','.tav-choice-trigger']){
 assert(css.includes(block),'Estilo de '+block+' ausente');
}
// Runtime do componente, incluindo confirmar, cancelar, escolha e campo para copiar.
class N{
 constructor(tag){this.tag=tag;this.children=[];this.attributes={};this.hidden=false;this.className='';this.textContent='';this.listeners={};this.classList={add:name=>{this.className+=' '+name}};}
 append(...a){this.children.push(...a);}
 prepend(...a){this.children.unshift(...a);}
 replaceChildren(...a){this.children=[...a];}
 setAttribute(k,v){this.attributes[k]=v;}
 addEventListener(k,fn){this.listeners[k]=fn;}
 querySelector(s){
  const all=[...this.children];while(all.length){const n=all.shift();if(s==='button'&&n.tag==='button')return n;
    if(s==='.primary'&&n.className.split(' ').includes('primary'))return n;
    if(s.includes('[aria-pressed="true"]')&&n.attributes['aria-pressed']==='true')return n;
    all.push(...n.children);}
  return null;
 }
 querySelectorAll(){return []}
 focus(){}
 select(){}
}
(async()=>{
 const body=new N('body'),doc={body,activeElement:null,hidden:false,
  createElement:t=>new N(t),getElementById:()=>null,querySelector:()=>null,
  addEventListener:()=>{},removeEventListener:()=>{}};
 const window={};
 const context={window,document:doc,console,clearTimeout,setTimeout:()=>0,
  navigator:{clipboard:{writeText:async()=>{}}},Event:class Event{}};
 new vm.Script(js).runInNewContext(context,{timeout:1000});
 const ui=window.TavernaUI;
 assert(ui?.confirm&&ui?.choose&&ui?.share&&ui?.toast,'Componente não inicializou');
 const sheet=body.children.find(n=>n.attributes.id==='tavNativeSheet'||n.tag==='section');
 assert(sheet,'Dialog não montado');
 const card=sheet.children[0],actions=card.children[4],slot=card.children[3];
 let answer=ui.confirm({title:'Deixar mesa?',message:'Você deseja sair?',confirmLabel:'Sair',danger:true});
 assert.equal(sheet.hidden,false);
 actions.children[0].onclick();
 assert.equal(await answer,false,'Cancelar deve impedir abandono');
 assert.equal(sheet.hidden,true);
 answer=ui.confirm({title:'Deixar mesa?',confirmLabel:'Sair'});
 actions.children[1].onclick();assert.equal(await answer,true,'Confirmar precisa permitir ação');
 answer=ui.choose('Número de jogadores',[{label:'Dois',value:'2'},{label:'Três',value:'3'}],'2');
 assert.equal(slot.children[0].children.length,2);
 slot.children[0].children[1].onclick();assert.equal(await answer,'3');
 answer=ui.share('https://example.test/sala');
 assert.equal(slot.children[1].value,'https://example.test/sala');
 actions.children[0].onclick();assert.equal(await answer,null);
 console.log('TAVERN_UI_RUNTIME_OK: modal, cancelamento, confirmação, seleção e cópia interna');
})().catch(e=>{console.error(e);process.exitCode=1});
console.log('TAVERN_UI_COMPILED_OK: HTML, 12 temas, menus, VIP, convites e seletores');
