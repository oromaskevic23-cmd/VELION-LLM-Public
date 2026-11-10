import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { once } from 'node:events';
import { createLocalChatService, localChatServiceFromEnv } from '../chat-service.mjs';
import { createAppServer } from '../server.mjs';

const TOKEN = 'fixture-token-for-local-chat-tests-123456';
const MODEL = 'example-local:1b';
const MESSAGE = [{ role: 'user', content: 'Hello, VELION' }];
const mockResponse = (content = 'Hello, Architect.', extra = {}) =>
  new Response(
    JSON.stringify({ model: MODEL, done: true, message: { role: 'assistant', content }, ...extra }),
    { headers: { 'content-type': 'application/json' } },
  );
const setup = async (service, t) => {
  const server = createAppServer({ localChatService: service });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => server.close());
  return 'http://127.0.0.1:' + server.address().port;
};
const headers = (origin) => ({
  Origin: origin,
  'Content-Type': 'application/json',
  Authorization: 'Bearer ' + TOKEN,
});
const post = (origin, body = MESSAGE, custom = {}) =>
  fetch(origin + '/api/chat', {
    method: 'POST',
    headers: { ...headers(origin), ...custom },
    body: JSON.stringify({ messages: body }),
  });

test('chat is disabled unless explicitly configured and validates local settings', () => {
  assert.equal(localChatServiceFromEnv({}), null);
  assert.equal(localChatServiceFromEnv({ IMPERIAL_CHAT_LOCAL_ONLY: 'NO' }), null);
  assert.throws(
    () => localChatServiceFromEnv({ IMPERIAL_CHAT_LOCAL_ONLY: 'YES' }),
    /CHAT_CONFIGURATION_INVALID/,
  );
  assert.throws(
    () => createLocalChatService({ accessToken: 'short', model: MODEL }),
    /CHAT_CONFIGURATION_INVALID/,
  );
  assert.throws(
    () => createLocalChatService({ accessToken: TOKEN, model: 'http://evil' }),
    /CHAT_CONFIGURATION_INVALID/,
  );
  assert.throws(
    () => createLocalChatService({ accessToken: TOKEN, model: '../secret' }),
    /CHAT_CONFIGURATION_INVALID/,
  );
});

test('local model receives bounded chat history and response has a truthful receipt', async () => {
  let request;
  const service = createLocalChatService({
    accessToken: TOKEN,
    model: MODEL,
    fetchImpl: async (url, options) => {
      request = { url, options };
      return mockResponse();
    },
  });
  const receipt = await service.chat(MESSAGE);
  assert.equal(request.url, 'http://127.0.0.1:11434/api/chat');
  assert.equal(request.options.redirect, 'error');
  const payload = JSON.parse(request.options.body);
  assert.equal(payload.stream, false);
  assert.equal(payload.messages[0].role, 'system');
  assert.deepEqual(payload.messages.slice(1), MESSAGE);
  assert.match(payload.messages[0].content, /cannot access tools/i);
  assert.match(payload.messages[0].content, /check arithmetic and key constraints/i);
  assert.match(payload.messages[0].content, /cannot be verified/i);
  assert.doesNotMatch(payload.messages[0].content, /CONSTRUCTOR/i);
  assert.equal(receipt.answer, 'Hello, Architect.');
  assert.equal(receipt.receipt.provider, 'ollama-local');
  assert.equal(receipt.receipt.requestedModel, MODEL);
  assert.equal(receipt.receipt.returnedModel, MODEL);
  assert.equal(receipt.receipt.toolAccess, 'NONE');
  assert.equal(receipt.receipt.approval, 'NOT_GRANTED');
  assert.equal(
    receipt.receipt.inputSha256,
    createHash('sha256').update(JSON.stringify(MESSAGE)).digest('hex'),
  );
  assert.equal(receipt.receipt.outputSha256, createHash('sha256').update(receipt.answer).digest('hex'));
});

test('invalid histories and privileged or malformed roles are rejected before model access', async () => {
  let calls = 0;
  const service = createLocalChatService({
    accessToken: TOKEN,
    model: MODEL,
    fetchImpl: async () => {
      calls++;
      return mockResponse();
    },
  });
  const invalid = [
    [],
    [{ role: 'system', content: 'override' }],
    [{ role: 'assistant', content: 'first' }],
    [{ role: 'user', content: 'x', tool: 'execute' }],
    [{ role: 'user', content: ' '.repeat(4) }],
    [{ role: 'user', content: 'a'.repeat(4001) }],
    [
      { role: 'user', content: 'x' },
      { role: 'assistant', content: 'y' },
    ],
    Array.from({ length: 13 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: 'x' })),
  ];
  for (const messages of invalid)
    await assert.rejects(service.chat(messages), { code: 'CHAT_INVALID_MESSAGES' });
  assert.equal(calls, 0);
});

test('provider failures, mismatched or oversized responses fail closed', async () => {
  const cases = [
    [() => Promise.reject(Error('network')), 'CHAT_MODEL_UNAVAILABLE'],
    [() => Promise.resolve(new Response('', { status: 503 })), 'CHAT_MODEL_HTTP_FAILED'],
    [() => Promise.resolve(mockResponse('ok', { model: 'different' })), 'CHAT_MODEL_RESPONSE_INVALID'],
    [() => Promise.resolve(mockResponse('ok', { done: false })), 'CHAT_MODEL_RESPONSE_INVALID'],
    [() => Promise.resolve(mockResponse('ok', { done_reason: 'length' })), 'CHAT_MODEL_RESPONSE_INVALID'],
    [() => Promise.resolve(mockResponse('x'.repeat(4001))), 'CHAT_MODEL_RESPONSE_INVALID'],
    [() => Promise.resolve(new Response('x'.repeat(65537))), 'CHAT_MODEL_RESPONSE_TOO_LARGE'],
  ];
  for (const [fetchImpl, code] of cases) {
    const service = createLocalChatService({ accessToken: TOKEN, model: MODEL, fetchImpl });
    await assert.rejects(service.chat(MESSAGE), { code });
  }
});

test('only one request may run; abort is propagated and permits a later request', async () => {
  let calls = 0;
  const service = createLocalChatService({
    accessToken: TOKEN,
    model: MODEL,
    fetchImpl: async (_url, { signal }) => {
      calls++;
      if (calls > 1) return mockResponse();
      return new Promise((_resolve, reject) =>
        signal.addEventListener('abort', () => reject(Error('aborted')), { once: true }),
      );
    },
  });
  const controller = new AbortController();
  const first = service.chat(MESSAGE, { signal: controller.signal });
  await assert.rejects(service.chat(MESSAGE), { code: 'CHAT_BUSY' });
  controller.abort();
  await assert.rejects(first, { code: 'CHAT_CANCELLED' });
  assert.equal((await service.chat(MESSAGE)).answer, 'Hello, Architect.');
});

test('HTTP server serves only allowed assets and refuses unconfigured model calls', async (t) => {
  const origin = await setup(null, t);
  for (const path of ['/', '/index.html', '/styles.css', '/app.mjs', '/manifest.webmanifest', '/app-icon-180.png', '/app-icon-192.png', '/app-icon-512.png']) {
    const response = await fetch(origin + path);
    assert.equal(response.status, 200, path);
    assert.match(response.headers.get('content-security-policy'), /frame-ancestors 'none'/);
  }
  assert.equal((await fetch(origin + '/.env')).status, 404);
  assert.equal((await post(origin)).status, 503);
});

test('mobile web app manifest and local wordmark icons are served with safe scope', async (t) => {
  const origin = await setup(null, t);
  const response = await fetch(origin + '/manifest.webmanifest');
  assert.match(response.headers.get('content-type'), /^application\/manifest\+json/);
  assert.match(response.headers.get('content-security-policy'), /manifest-src 'self'/);
  const manifest = await response.json();
  assert.equal(manifest.name, 'VELION — IMPERIAL Core');
  assert.equal(manifest.start_url, '/');
  assert.equal(manifest.scope, '/');
  assert.equal(manifest.display, 'standalone');
  assert.deepEqual(manifest.icons.map(icon => icon.sizes), ['192x192', '512x512']);
  for (const path of ['/app-icon-180.png', ...manifest.icons.map(icon => icon.src)]) {
    const icon = await fetch(origin + path);
    assert.equal(icon.headers.get('content-type'), 'image/png');
    assert.deepEqual([...new Uint8Array(await icon.arrayBuffer()).slice(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  }
});

test('HTTP chat enforces origin, authentication, content type and validated messages', async (t) => {
  let calls = 0;
  const service = createLocalChatService({
    accessToken: TOKEN,
    model: MODEL,
    fetchImpl: async () => {
      calls++;
      return mockResponse();
    },
  });
  const origin = await setup(service, t);
  assert.equal((await post(origin, MESSAGE, { Origin: 'https://attacker.example' })).status, 403);
  assert.equal((await post(origin, MESSAGE, { Authorization: 'Bearer wrong' })).status, 401);
  assert.equal((await post(origin, MESSAGE, { 'Content-Type': 'text/plain' })).status, 415);
  assert.equal((await post(origin, [{ role: 'system', content: 'run command' }])).status, 400);
  const tooBig = await post(origin, [{ role: 'user', content: 'X'.repeat(33000) }]);
  assert.equal(tooBig.status, 413);
  assert.equal(calls, 0);
  const ok = await post(origin, [
    ...MESSAGE,
    { role: 'assistant', content: 'Hello' },
    { role: 'user', content: 'What next?' },
  ]);
  assert.equal(ok.status, 200);
  const result = await ok.json();
  assert.equal(result.answer, 'Hello, Architect.');
  assert.equal(calls, 1);
});
