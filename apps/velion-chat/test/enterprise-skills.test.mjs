// VELION local deterministic Enterprise Skills — synthetic security regression.
// Founder and author: Alexander Nikolaevich Romaskevich (RomaskevicH).
import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createHash } from 'node:crypto';
import { createLocalChatService } from '../chat-service.mjs';
import { createAppServer } from '../server.mjs';
import { runReadOnlySkill, SKILL_ID, LOCAL_TENANT } from '../enterprise-skills.mjs';

const TOKEN = 'velion-read-only-test-session-token-123456';
const MODEL = 'synthetic:1b';
const example = (operation = 'add', left = '2', right = '3') => ({
  tenant: LOCAL_TENANT, skill: SKILL_ID, clientConsent: true,
  arguments: { operation, left, right },
});
const sha = text => createHash('sha256').update(text).digest('hex');

test('exact integer operations preserve precision without floating-point arithmetic', () => {
  const cases = [
    [example('add', '999999999999999999', '1'), { integer: '1000000000000000000' }],
    [example('subtract', '5', '9'), { integer: '-4' }],
    [example('multiply', '-300000000000000000', '20'), { integer: '-6000000000000000000' }],
    [example('divide_with_remainder', '14', '4'), { quotient: '3', remainder: '2' }],
    [example('divide_with_remainder', '-14', '4'), { quotient: '-3', remainder: '-2' }],
  ];
  for (const [input, expected] of cases) {
    const reply = runReadOnlySkill(input);
    assert.deepEqual(reply.result, expected);
    assert.equal(reply.receipt.inputSha256, sha(JSON.stringify([
      SKILL_ID, LOCAL_TENANT, input.arguments.operation, input.arguments.left, input.arguments.right,
    ])));
    assert.equal(reply.receipt.outputSha256, sha(JSON.stringify(expected)));
    assert.equal(reply.receipt.execution, 'LOCAL_DETERMINISTIC_READ_ONLY');
    assert.equal(reply.receipt.externalSideEffects, false);
    assert.equal(reply.receipt.toolNetworkAccess, false);
    assert.equal(reply.receipt.filesystemAccess, false);
    assert.equal(reply.receipt.ownerApprovalGranted, false);
    assert.equal(reply.receipt.aiPassportAuthenticated, false);
    assert.equal(reply.receipt.auditScope, 'UNSIGNED_RESPONSE_ONLY');
    assert.equal(reply.receipt.productionRelease, 'NOT_AUTHORIZED');
  }
});

test('invalid or missing tenant scope and declared client consent fail closed', () => {
  const cases = [
    { ...example(), clientConsent: false },
    { ...example(), clientConsent: 1 },
    { ...example(), tenant: 'other-tenant' },
    { ...example(), tenant: '../velion-local' },
    { ...example(), skill: 'execute.shell' },
    { ...example(), extra: true },
    { ...example(), arguments: { operation: 'add', left: '1' } },
    { ...example(), arguments: { operation: 'add', left: '1', right: '2', approval: true } },
    { ...example(), arguments: { operation: 'eval', left: '1', right: '2' } },
    { ...example(), arguments: { operation: 'divide_with_remainder', left: '5', right: '0' } },
    null, [], '',
  ];
  for (const input of cases) assert.throws(() => runReadOnlySkill(input), { code: 'SKILL_REQUEST_DENIED' });
});

test('rejects numbers, scientific notation, unsafe precision, noncanonical input and prototype tricks', () => {
  for (const value of [
    2, 2.5, true, null, '', '01', '-0', '+2', '1e8', '1.5',
    '1 '.repeat(9), '9999999999999999999', '__proto__', '0x10', '1\n2',
  ]) {
    assert.throws(() => runReadOnlySkill(example('add', value, '2')), {
      code: 'SKILL_REQUEST_DENIED',
    });
  }
  const proto = JSON.parse('{"tenant":"velion-local","skill":"velion.arithmetic.exact_v1","clientConsent":true,"arguments":{"operation":"add","left":"1","right":"2"},"__proto__":{"admin":true}}');
  assert.throws(() => runReadOnlySkill(proto), { code: 'SKILL_REQUEST_DENIED' });
});

const start = async (localChatService, t) => {
  const server = createAppServer({ localChatService });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => server.close());
  return 'http://127.0.0.1:' + server.address().port;
};
const skillPost = (origin, input, headers = {}) => fetch(origin + '/api/skills/run', {
  method: 'POST',
  headers: {
    Origin: origin, 'Content-Type': 'application/json',
    Authorization: 'Bearer ' + TOKEN,
    ...headers,
  },
  body: typeof input === 'string' ? input : JSON.stringify(input),
});

test('local skill endpoint is disabled without a configured chat session', async t => {
  const origin = await start(null, t);
  const result = await skillPost(origin, example());
  assert.equal(result.status, 503);
  assert.deepEqual(await result.json(), { code: 'CHAT_DISABLED' });
});

test('local skill endpoint executes the fixed calculator with no model calls', async t => {
  let modelCalls = 0;
  const chat = createLocalChatService({
    model: MODEL, accessToken: TOKEN,
    fetchImpl: async () => { modelCalls++; throw Error('must not call model'); },
  });
  const origin = await start(chat, t);
  const response = await skillPost(origin, example('multiply', '25', '40'));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const result = await response.json();
  assert.deepEqual(result.result, { integer: '1000' });
  assert.equal(result.receipt.clientDeclaredConsent, true);
  assert.equal(result.receipt.approvedByGuardian, false);
  assert.equal(result.receipt.externalSideEffects, false);
  assert.equal(modelCalls, 0);
});

test('wrong local origin, token, content-type and HTTP method are denied', async t => {
  const chat = createLocalChatService({ model: MODEL, accessToken: TOKEN, fetchImpl: async () => { throw Error('unexpected'); } });
  const origin = await start(chat, t);
  for (const [headers, code, status] of [
    [{ Origin: 'http://evil.example' }, 'LOCAL_ORIGIN_REQUIRED', 403],
    [{ Host: 'malicious.example' }, 'LOCAL_ORIGIN_REQUIRED', 403],
    [{ Authorization: 'Bearer unauthorized' }, 'LOCAL_ACCESS_TOKEN_REQUIRED', 401],
    [{ 'Content-Type': 'text/plain' }, 'JSON_REQUIRED', 415],
  ]) {
    const r = await skillPost(origin, example(), headers);
    assert.equal(r.status, status);
    assert.deepEqual(await r.json(), { code });
  }
  const get = await fetch(origin + '/api/skills/run', { method: 'GET' });
  assert.equal(get.status, 405);
});

test('skill endpoint rejects malformed, unsafe, oversized or unapproved requests', async t => {
  const chat = createLocalChatService({ model: MODEL, accessToken: TOKEN });
  const origin = await start(chat, t);
  const examples = [
    example('subtract', '1', '0'),
    { ...example(), clientConsent: false },
    { ...example(), tenant: 'foreign' },
    { ...example(), arguments: { ...example().arguments, operation: 'shell' } },
    '{"tenant":',
  ];
  // The allowed subtract case is a positive control.
  const positive = await skillPost(origin, examples[0]);
  assert.equal(positive.status, 200);
  for (const input of examples.slice(1)) {
    const response = await skillPost(origin, input);
    assert.equal(response.status, 400);
    assert.ok(['SKILL_REQUEST_DENIED', 'INVALID_JSON'].includes((await response.json()).code));
  }
  const tooLarge = await skillPost(origin, 'X'.repeat(2049));
  assert.equal(tooLarge.status, 413);
  assert.deepEqual(await tooLarge.json(), { code: 'SKILL_REQUEST_TOO_LARGE' });
});
