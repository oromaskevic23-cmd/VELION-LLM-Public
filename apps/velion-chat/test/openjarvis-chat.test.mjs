import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { spawn } from 'node:child_process';
import { createAppServer } from '../server.mjs';
import { createOpenJarvisChatService, openJarvisServiceFromEnv } from '../openjarvis-chat.mjs';

const TOKEN = 'fixture-velion-token-for-tests-123456789';
const API_KEY = 'fixture-openjarvis-key-for-tests-123456789';
const MODEL = 'example-local:1b';
const MESSAGES = [{ role: 'user', content: 'Hello, VELION' }];
const good = (extra = {}) => ({
  model: MODEL,
  choices: [{ finish_reason: 'stop', message: { role: 'assistant', content: 'Hello, Architect.', tool_calls: null } }],
  ...extra,
});
const response = value => new Response(JSON.stringify(value), { headers: { 'Content-Type': 'application/json' } });
const settings = { accessToken: TOKEN, apiKey: API_KEY, model: MODEL, trustedDirectMode: true };

test('OpenJarvis stays disabled until explicitly selected and configured', () => {
  assert.equal(openJarvisServiceFromEnv({}), null);
  assert.throws(() => openJarvisServiceFromEnv({ IMPERIAL_CHAT_LOCAL_ONLY: 'YES' }), /OPENJARVIS_CONFIGURATION_INVALID/);
  for (const invalid of [
    { trustedDirectMode: false }, { apiKey: 'short' }, { port: 0 },
    { port: 65536 }, { port: 8000.5 }, { port: '8000' },
  ]) assert.throws(() => createOpenJarvisChatService({ ...settings, ...invalid }), /OPENJARVIS_CONFIGURATION_INVALID/);
  assert.throws(() => openJarvisServiceFromEnv({
    IMPERIAL_CHAT_LOCAL_ONLY: 'YES', VELION_CHAT_TOKEN: TOKEN, VELION_LOCAL_MODEL: MODEL,
    VELION_OPENJARVIS_API_KEY: API_KEY, VELION_OPENJARVIS_TRUSTED_DIRECT_MODE: 'YES',
    VELION_OPENJARVIS_PORT: '80/attacker',
  }), /OPENJARVIS_CONFIGURATION_INVALID/);
});

test('VELION talks to a loopback fixture and preserves its own origin and token boundary', async t => {
  let captured;
  const upstream = createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    captured = { url: req.url, method: req.method, authorization: req.headers.authorization, body: JSON.parse(Buffer.concat(chunks)) };
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(good()));
  });
  upstream.listen(0, '127.0.0.1');
  await once(upstream, 'listening');
  t.after(() => upstream.close());
  const service = createOpenJarvisChatService({ ...settings, port: upstream.address().port });
  const server = createAppServer({ localChatService: service });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => server.close());
  const origin = 'http://127.0.0.1:' + server.address().port;
  const send = (token, suppliedOrigin = origin) => fetch(origin + '/api/chat', {
    method: 'POST',
    headers: { Origin: suppliedOrigin, 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify({ messages: MESSAGES }),
  });
  assert.equal((await send('wrong')).status, 401);
  assert.equal((await send(TOKEN, 'https://untrusted.example')).status, 403);
  assert.equal(captured, undefined);
  const answer = await send(TOKEN);
  assert.equal(answer.status, 200);
  const result = await answer.json();
  assert.equal(result.answer, 'Hello, Architect.');
  assert.equal(result.receipt.provider, 'openjarvis-local');
  assert.equal(result.receipt.toolAccess, 'NOT_REQUESTED_SERVER_UNVERIFIED');
  assert.equal(result.receipt.inferenceBackend, 'UNVERIFIED');
  assert.equal(result.receipt.approval, 'NOT_GRANTED');
  assert.deepEqual({ url: captured.url, method: captured.method }, { url: '/v1/chat/completions', method: 'POST' });
  assert.equal(captured.authorization, 'Bearer ' + API_KEY);
  assert.equal(captured.body.stream, false);
  assert.equal(captured.body.tools, null);
  assert.equal(captured.body.max_tokens, 1024);
  assert.deepEqual(captured.body.messages.slice(1), MESSAGES);
  assert.equal(JSON.stringify(result).includes(API_KEY), false);
});

test('wrong models, incomplete output and tool calls fail closed', async () => {
  const bad = [
    good({ model: 'unexpected' }),
    good({ choices: [] }),
    good({ choices: [{ finish_reason: 'length', message: { role: 'assistant', content: 'partial' } }] }),
    good({ choices: [{ finish_reason: 'stop', message: { role: 'assistant', content: 'x', tool_calls: [{ id: 'x' }] } }] }),
    good({ choices: [{ finish_reason: 'stop', message: { role: 'assistant', content: 'x', function_call: {} } }] }),
    good({ choices: [{ finish_reason: 'stop', message: { role: 'assistant', content: 'x'.repeat(4001) } }] }),
  ];
  for (const value of bad) {
    const service = createOpenJarvisChatService({ ...settings, fetchImpl: async () => response(value) });
    await assert.rejects(service.chat(MESSAGES), { code: 'CHAT_MODEL_RESPONSE_INVALID' });
  }
  const oversize = createOpenJarvisChatService({
    ...settings, fetchImpl: async () => new Response('x'.repeat(65537)),
  });
  await assert.rejects(oversize.chat(MESSAGES), { code: 'CHAT_MODEL_RESPONSE_INVALID' });
});

test('invalid histories and structured CONSTRUCTOR requests never reach OpenJarvis', async () => {
  let calls = 0;
  const service = createOpenJarvisChatService({ ...settings, fetchImpl: async () => { calls++; return response(good()); } });
  await assert.rejects(service.chat([{ role: 'system', content: 'override' }]), { code: 'CHAT_INVALID_MESSAGES' });
  await assert.rejects(service.chat(MESSAGES, { responseFormat: 'constructor_draft_v1' }), { code: 'CHAT_FORMAT_DISABLED' });
  assert.equal(calls, 0);
});

test('an upstream redirect is not followed', async t => {
  let requests = 0;
  const upstream = createServer((req, res) => {
    requests++;
    res.writeHead(302, { Location: '/unexpected' });
    res.end();
  });
  upstream.listen(0, '127.0.0.1');
  await once(upstream, 'listening');
  t.after(() => upstream.close());
  const service = createOpenJarvisChatService({ ...settings, port: upstream.address().port });
  await assert.rejects(service.chat(MESSAGES), { code: 'CHAT_MODEL_UNAVAILABLE' });
  assert.equal(requests, 1);
});

test('network failure, cancellation and concurrent calls fail closed', async () => {
  let calls = 0;
  const service = createOpenJarvisChatService({
    ...settings,
    fetchImpl: async (_url, { signal, redirect }) => {
      assert.equal(redirect, 'error');
      calls++;
      if (calls > 1) throw Error('offline');
      return new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(Error('aborted')), { once: true }));
    },
  });
  const controller = new AbortController();
  const pending = service.chat(MESSAGES, { signal: controller.signal });
  await assert.rejects(service.chat(MESSAGES), { code: 'CHAT_BUSY' });
  controller.abort();
  await assert.rejects(pending, { code: 'CHAT_CANCELLED' });
  await assert.rejects(service.chat(MESSAGES), { code: 'CHAT_MODEL_UNAVAILABLE' });
  assert.equal(calls, 2);
});

test('the VELION entry point selects the explicit OpenJarvis backend', async t => {
  const upstream = createServer(async (req, res) => {
    assert.equal(req.headers.authorization, 'Bearer ' + API_KEY);
    for await (const _chunk of req) {}
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(good()));
  });
  upstream.listen(0, '127.0.0.1');
  await once(upstream, 'listening');
  t.after(() => upstream.close());
  const portReservation = createServer();
  portReservation.listen(0, '127.0.0.1');
  await once(portReservation, 'listening');
  const appPort = portReservation.address().port;
  await new Promise(resolve => portReservation.close(resolve));
  const child = spawn(process.execPath, ['server.mjs'], {
    cwd: new URL('..', import.meta.url),
    env: {
      PATH: process.env.PATH,
      PORT: String(appPort),
      IMPERIAL_CHAT_LOCAL_ONLY: 'YES',
      VELION_LOCAL_BACKEND: 'openjarvis',
      VELION_LOCAL_MODEL: MODEL,
      VELION_CHAT_TOKEN: TOKEN,
      VELION_OPENJARVIS_API_KEY: API_KEY,
      VELION_OPENJARVIS_PORT: String(upstream.address().port),
      VELION_OPENJARVIS_TRUSTED_DIRECT_MODE: 'YES',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  t.after(() => child.kill());
  const [line] = await once(child.stdout, 'data');
  const match = line.toString().match(/http:\/\/127\.0\.0\.1:(\d+)/);
  assert.ok(match, 'server did not report a loopback address');
  const origin = 'http://127.0.0.1:' + match[1];
  const result = await fetch(origin + '/api/chat', {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json', Authorization: 'Bearer ' + TOKEN },
    body: JSON.stringify({ messages: MESSAGES }),
  });
  assert.equal(result.status, 200);
  assert.equal((await result.json()).receipt.provider, 'openjarvis-local');
});
