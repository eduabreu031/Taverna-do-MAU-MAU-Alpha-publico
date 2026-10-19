import assert from 'node:assert/strict';
import {translateOnlineEvents,changedOnlineCards} from '../integracao/online-event-bridge.mjs';
const msg={type:'state',players:[{id:'a',name:'Ana'},{id:'b',name:'Beto'}],game:{players:[{id:'a'},{id:'b'}]},events:[{id:'e1',type:'play',playerId:'a',card:'9♠'},{id:'e2',type:'draw',playerId:'b'}]};
const first=translateOnlineEvents(msg);
assert.equal(first.events.length,2);assert.equal(first.events[0].actor,0);assert.equal(first.events[1].actor,1);
assert.equal(translateOnlineEvents(msg,first.seenIds).events.length,0);
assert.equal(translateOnlineEvents({...msg,events:[{id:'bad',type:'play',playerId:'unknown'}]}).events.length,0);
assert.deepEqual(changedOnlineCards({ownHand:[{id:'x'},{id:'y'}]},{ownHand:[{id:'y'},{id:'z'}]}),{arrived:[{id:'z'}],departed:[{id:'x'}]});
assert.throws(()=>changedOnlineCards(null,{ownHand:null}));
