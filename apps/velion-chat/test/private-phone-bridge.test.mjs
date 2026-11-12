// Project author and founding architect: Alexander Nikolaevich Romaskevich (RomaskevicH).
import test from 'node:test';
import assert from 'node:assert/strict';
import { request } from 'node:http';
import { createAppServer } from '../server.mjs';
import { privatePhoneBridgeFromEnv } from '../private-phone-bridge.mjs';

const origin = 'https://velion.example-tailnet.ts.net';
const login = 'owner@example.com';
const bridge = privatePhoneBridgeFromEnv({
  VELION_TAILNET_ORIGIN: origin,
  VELION_TAILNET_LOGIN: login,
});
const mockService = {
  authenticate(value) { return value === 'Bearer fixture-token'; },
  async chat() { return { reply: 'fixture answer', receipt: { fixture: true } }; },
};

async function withServer(privatePhoneBridge, task) {
  const server = createAppServer({ localChatService: mockService, privatePhoneBridge });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    return await task(server);
  } finally {
    await new Promise((resolve, reject) => server.close((err) => err ? reject(err) : resolve()));
  }
}

async function send(server, {
  host = bridge.host,
  requestOrigin = origin,
  requestLogin = login,
  bearer = 'Bearer fixture-token',
  method = 'POST',
  path = '/api/chat',
} = {}) {
  const port = server.address().port;
  const body = method === 'POST'
    ? JSON.stringify({ messages: [{ role: 'user', content: 'synthetic only' }] })
    : '';
  return new Promise((resolve, reject) => {
    const req = request({
      hostname: '127.0.0.1',
      port,
      path,
      method,
      headers: {
        Host: host,
        ...(requestOrigin ? { Origin: requestOrigin } : {}),
        ...(requestLogin ? { 'Tailscale-User-Login': requestLogin } : {}),
        ...(bearer ? { Authorization: bearer } : {}),
        ...(method === 'POST' ? {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        } : {}),
      },
    }, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.end(body);
  });
}

test('phone bridge is opt-in, private HTTPS only and fail-closed for malformed configuration', () => {
  assert.equal(privatePhoneBridgeFromEnv({}), null);
  assert.throws(
    () => privatePhoneBridgeFromEnv({ VELION_TAILNET_ORIGIN: origin }),
    /TAILNET_BRIDGE_INCOMPLETE/,
  );
  for (const candidate of [
    'http://velion.example-tailnet.ts.net',
    'https://example.org',
    'https://velion.example-tailnet.ts.net/path',
    'https://velion.example-tailnet.ts.net:8443',
    'https://velion.example-tailnet.ts.net?x=1',
  ]) {
    assert.throws(
      () => privatePhoneBridgeFromEnv({
        VELION_TAILNET_ORIGIN: candidate,
        VELION_TAILNET_LOGIN: login,
      }),
      /TAILNET_ORIGIN_INVALID/,
      candidate,
    );
  }
});

test('private HTTPS phone route needs matching proxy identity, origin and bearer', async () => {
  await withServer(bridge, async (server) => {
    assert.equal((await send(server)).status, 200);
    assert.equal((await send(server, { requestLogin: 'someone@example.com' })).status, 403);
    assert.equal((await send(server, { requestLogin: '' })).status, 403);
    assert.equal((await send(server, { requestOrigin: 'https://evil.example' })).status, 403);
    assert.equal((await send(server, { requestOrigin: '' })).status, 403);
    assert.equal((await send(server, { bearer: 'Bearer wrong' })).status, 401);
    assert.equal((await send(server, { host: 'other.example.ts.net' })).status, 403);
    assert.equal((await send(server, { method: 'GET', path: '/', requestLogin: '' })).status, 403);
    assert.equal((await send(server, { method: 'GET', path: '/' })).status, 200);
  });
});

test('phone origin remains disabled by default; previous localhost contract still works', async () => {
  await withServer(null, async (server) => {
    assert.equal((await send(server)).status, 403);
    const localOrigin = 'http://127.0.0.1:' + server.address().port;
    const localResult = await send(server, {
      host: '127.0.0.1:' + server.address().port,
      requestOrigin: localOrigin,
      requestLogin: '',
    });
    assert.equal(localResult.status, 200);
    assert.match(localResult.body, /fixture answer/);
  });
});
