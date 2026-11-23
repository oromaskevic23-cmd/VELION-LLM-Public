// VELION answer review — bounded local self-review regression; NO paid models or tools.
// Author and founding architect: Alexander Nikolaevich Romaskevich (RomaskevicH).
import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createLocalChatService } from '../chat-service.mjs';
import { createAppServer } from '../server.mjs';

const TOKEN = 'velion-review-test-token-local-123456789';
const MODEL = 'synthetic:1b';
const MESSAGE = [{ role: 'user', content: 'What is 2 + 2?' }];
const reply = (text, extra = {}) => new Response(JSON.stringify({
  model: MODEL, done: true, done_reason: 'stop',
  message: { role: 'assistant', content: text }, ...extra,
}), { headers: { 'content-type': 'application/json' } });
const build = (fetchImpl) => createLocalChatService({ accessToken: TOKEN, model: MODEL, fetchImpl });

test('STANDARD makes one local inference and does not claim independent quality', async () => {
  let calls = 0;
  const service = build(async () => { calls++; return reply('4'); });
  const result = await service.chat(MESSAGE);
  assert.equal(calls, 1);
  assert.equal(result.answer, '4');
  assert.equal(result.receipt.responseMode, 'STANDARD');
  assert.equal(result.receipt.modelCalls, 1);
  assert.equal(result.receipt.qualityVerified, false);
  assert.equal(result.receipt.toolAccess, 'NONE');
  assert.equal(result.receipt.approval, 'NOT_GRANTED');
});

test('REVIEW makes exactly two requests to the SAME local model and returns only final text', async () => {
  const requests = [];
  const service = build(async (url, options) => {
    requests.push({ url, ...JSON.parse(options.body), signal: options.signal });
    return reply(requests.length === 1 ? 'Maybe five' : '2 + 2 = 4.');
  });
  const result = await service.chat(MESSAGE, { responseMode: 'REVIEW' });
  assert.equal(requests.length, 2);
  assert.ok(requests.every((r) => r.url === 'http://127.0.0.1:11434/api/chat'));
  assert.ok(requests.every((r) => r.stream === false && r.model === MODEL));
  assert.equal(requests[0].signal, requests[1].signal);
  assert.match(requests[1].messages[0].content, /same model/i);
  assert.match(requests[1].messages[1].content, /UNTRUSTED DRAFT/);
  assert.match(requests[1].messages[1].content, /Maybe five/);
  assert.match(requests[1].messages[1].content, /What is 2 \+ 2/);
  assert.equal(result.answer, '2 + 2 = 4.');
  assert.equal(result.receipt.modelCalls, 2);
  assert.equal(result.receipt.responseMode, 'REVIEW');
  assert.equal(result.receipt.reviewScope, 'SAME_MODEL_LOCAL_SELF_REVIEW_ONLY');
  assert.equal(result.receipt.qualityVerified, false);
  assert.match(result.receipt.draftSha256, /^[a-f0-9]{64}$/);
  assert.equal(result.receipt.toolAccess, 'NONE');
});

test('REVIEW rejects privileged requests, structured mode combinations, and long input before model call', async () => {
  let calls = 0;
  const service = build(async () => { calls++; return reply('ok'); });
  for (const opts of [{responseMode:'ADMIN'}, {responseMode:'review'},
    {responseMode:'REVIEW',responseFormat:'constructor_draft_v1'}]) {
    await assert.rejects(service.chat(MESSAGE,opts), { code: 'CHAT_MODE_INVALID' });
  }
  await assert.rejects(service.chat([{role:'user',content:'x'.repeat(1801)}],
    {responseMode:'REVIEW'}), {code:'CHAT_REVIEW_CONTEXT_TOO_LARGE'});
  assert.equal(calls, 0);
});

test('REVIEW rejects overlong draft without making a second inference', async () => {
  let calls = 0;
  const service = build(async () => { calls++; return reply('x'.repeat(1801)); });
  await assert.rejects(service.chat(MESSAGE, {responseMode:'REVIEW'}),
    {code:'CHAT_REVIEW_CONTEXT_TOO_LARGE'});
  assert.equal(calls, 1);
});

test('second-pass wrong model fails closed and releases busy lock', async () => {
  let calls = 0;
  const service = build(async () => {
    calls++;
    return calls === 2 ? reply('fake', {model:'untrusted:2b'}) : reply('draft');
  });
  await assert.rejects(service.chat(MESSAGE, {responseMode:'REVIEW'}),
    {code:'CHAT_MODEL_RESPONSE_INVALID'});
  assert.equal((await service.chat(MESSAGE)).answer, 'draft');
  assert.equal(calls, 3);
});

test('abort during REVIEW verification cancels the whole turn without returning a draft', async () => {
  let entered;
  const begun = new Promise(resolve => { entered = resolve; });
  let calls = 0;
  const service = build(async (_url, {signal}) => {
    calls++;
    if(calls === 1) return reply('draft');
    entered();
    return new Promise((_resolve, reject) => {
      if (signal.aborted) return reject(Error('aborted'));
      signal.addEventListener('abort', () => reject(Error('aborted')), {once:true});
    });
  });
  const ctrl = new AbortController();
  const pending = service.chat(MESSAGE, {responseMode:'REVIEW',signal:ctrl.signal});
  await begun;
  await assert.rejects(service.chat(MESSAGE), {code:'CHAT_BUSY'});
  ctrl.abort();
  await assert.rejects(pending, {code:'CHAT_CANCELLED'});
  assert.equal(calls, 2);
});

test('HTTP accepts only explicit REVIEW schema, and returning JSON still carries no tool permission', async t => {
  let calls = 0;
  const service = build(async () => { calls++; return reply(calls % 2 ? 'draft' : 'final'); });
  const server = createAppServer({ localChatService: service });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => server.close());
  const origin = 'http://127.0.0.1:' + server.address().port;
  const send = input => fetch(origin + '/api/chat', {
    method:'POST',
    headers:{Origin:origin,'Content-Type':'application/json',Authorization:'Bearer '+TOKEN},
    body:JSON.stringify(input),
  });
  for (const input of [
    {messages:MESSAGE,responseMode:'ADMIN'},
    {messages:MESSAGE,responseMode:'REVIEW',responseFormat:'constructor_draft_v1'},
    {messages:MESSAGE,responseMode:'REVIEW',tool:'send_email'},
  ]) {
    const response = await send(input);
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {code:'INVALID_REQUEST'});
  }
  assert.equal(calls, 0);
  const response = await send({messages:MESSAGE,responseMode:'REVIEW'});
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.answer, 'final');
  assert.equal(data.receipt.modelCalls, 2);
  assert.equal(data.receipt.toolAccess, 'NONE');
  assert.equal(data.receipt.approval, 'NOT_GRANTED');
  assert.equal(calls, 2);
});

test('HTTP rejects oversize REVIEW context without contacting the local model', async t => {
  let calls = 0;
  const service = build(async () => { calls++; return reply('draft'); });
  const server = createAppServer({localChatService:service});
  server.listen(0,'127.0.0.1');
  await once(server,'listening');
  t.after(()=>server.close());
  const origin='http://127.0.0.1:'+server.address().port;
  const response=await fetch(origin+'/api/chat',{
    method:'POST',
    headers:{Origin:origin,'Content-Type':'application/json',Authorization:'Bearer '+TOKEN},
    body:JSON.stringify({messages:[{role:'user',content:'x'.repeat(1801)}],responseMode:'REVIEW'}),
  });
  assert.equal(response.status,400);
  assert.deepEqual(await response.json(),{code:'CHAT_REVIEW_CONTEXT_TOO_LARGE'});
  assert.equal(calls,0);
});
