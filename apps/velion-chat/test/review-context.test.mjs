import test from 'node:test';
import assert from 'node:assert/strict';
import {createLocalChatService} from '../chat-service.mjs';

function fixture() {
  const calls = [];
  const service = createLocalChatService({
    accessToken:'a'.repeat(32), model:'fixture',
    fetchImpl:async (_url, options) => {
      const p = JSON.parse(options.body);
      calls.push(p);
      return new Response(JSON.stringify({model:'fixture',done:true,done_reason:'stop',message:{role:'assistant',content:'fixture response'}}));
    }
  });
  return {calls,service};
}
const messages = [
  {role:'user',content:'Project code SOLAR-7.'},
  {role:'assistant',content:'Project code SOLAR-7.'},
  {role:'user',content:'What is the project code?'}
];
test('review receives prior turns as bounded data, not privileged messages', async () => {
  const {calls,service} = fixture();
  const result = await service.chat(messages,{responseMode:'REVIEW'});
  assert.equal(calls.length,2);
  assert.equal(calls[1].messages.length,2);
  assert.equal(calls[1].messages[1].role,'user');
  assert.ok(calls[1].messages[1].content.includes(JSON.stringify(messages.slice(0,-1))));
  assert.ok(calls[1].messages[1].content.includes(messages.at(-1).content));
  assert.equal(result.receipt.qualityVerified,false);
  assert.equal(result.receipt.approval,'NOT_GRANTED');
});
test('oversized review context fails before any inference', async () => {
  const {calls,service}=fixture();
  await assert.rejects(service.chat([{role:'user',content:'x'.repeat(1800)},{role:'assistant',content:'ok'},messages.at(-1)],{responseMode:'REVIEW'}),{code:'CHAT_REVIEW_CONTEXT_TOO_LARGE'});
  assert.equal(calls.length,0);
});
test('standard mode retains ordinary multi-turn behavior',async()=>{
  const {calls,service}=fixture();
  await service.chat(messages);
  assert.equal(calls.length,1);
  assert.deepEqual(calls[0].messages.slice(1),messages);
});
test('single turn review does not inject empty prior history',async()=>{
  const {calls,service}=fixture();
  await service.chat([messages.at(-1)],{responseMode:'REVIEW'});
  assert.equal(calls.length,2);
  assert.ok(!calls[1].messages[1].content.includes('PRIOR CONVERSATION'));
});
