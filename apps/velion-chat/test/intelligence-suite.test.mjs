import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {intelligenceCases, scoreIntelligenceCase} from '../tools/intelligence-cases.mjs';
import {runIntelligenceSuite, runPairedIntelligenceSuite, SUITE_SHA256} from '../tools/intelligence-suite.mjs';
import {localIntelligenceService} from '../tools/local-intelligence-service.mjs';

test('evaluation requires opt-in and selects only a configured local backend', async () => {
  await assert.rejects(localIntelligenceService({}), /LOCAL_INTELLIGENCE_EVALUATION_NOT_ENABLED/);
  await assert.rejects(localIntelligenceService({IMPERIAL_CHAT_LOCAL_ONLY:'YES',VELION_LOCAL_BACKEND:'remote'}), /CHAT_BACKEND_INVALID/);
  const token='synthetic-local-evaluation-token-123456789';
  const service=await localIntelligenceService({IMPERIAL_CHAT_LOCAL_ONLY:'YES',VELION_LOCAL_BACKEND:'ollama',VELION_LOCAL_MODEL:'fixture:local',VELION_CHAT_TOKEN:token});
  assert.equal(service.authenticate('Bearer '+token),true);
});

test('development suite has twenty distinct cases with valid alternating conversation turns', () => {
  assert.equal(intelligenceCases.length, 20);
  assert.equal(new Set(intelligenceCases.map(item => item.id)).size, 20);
  assert.match(SUITE_SHA256, /^[a-f0-9]{64}$/);
  assert.equal(Object.isFrozen(intelligenceCases[0].messages[0]), true);
  for (const item of intelligenceCases) {
    assert.equal(item.messages.at(-1).role, 'user');
    item.messages.forEach((message, i) => assert.equal(message.role, i % 2 ? 'assistant' : 'user'));
  }
});

test('strict scoring rejects extra prose, malformed JSON and wrong answers', () => {
  const find = id => intelligenceCases.find(item => item.id === id);
  assert.equal(scoreIntelligenceCase(find('percentage'), '75'), true);
  assert.equal(scoreIntelligenceCase(find('percentage'), '75%'), false);
  assert.equal(scoreIntelligenceCase(find('decimal'), '0,1'), true);
  assert.equal(scoreIntelligenceCase(find('json_object'), '{"mission":"Проверить отчёт","agent_id":"NCA-014"}'), true);
  assert.equal(scoreIntelligenceCase(find('json_object'), '```json\n{}\n```'), false);
  assert.equal(scoreIntelligenceCase(find('json_sort'), '[-5,-2,3,10]'), true);
  assert.equal(scoreIntelligenceCase(find('json_sort'), '[-5,-2,10,3]'), false);
  assert.equal(scoreIntelligenceCase(find('honesty'), 'I cannot check it.'), null);
  assert.equal(scoreIntelligenceCase(find('honesty'), ''), false);
});

test('suite leaves manual cases for review without running tools', async () => {
  let calls = 0;
  const report = await runIntelligenceSuite({async chat() {
    calls++;
    return {answer:'example',receipt:{provider:'synthetic-fixture',toolAccess:'NONE'}};
  }});
  assert.equal(calls, 20);
  assert.equal(report.results.length, 20);
  assert.equal(report.scoredTotal, 14);
  assert.equal(report.manualReview, 6);
  assert.equal(report.requestFailures, 0);
  assert.equal(report.completed, true);
  assert.equal(report.results[14].passed, null);
});

test('suite stops on the first provider failure instead of spending on retries', async () => {
  let calls = 0;
  const report = await runIntelligenceSuite({async chat() {
    calls++;
    throw Object.assign(Error('provider details'), {code:'CHAT_MODEL_UNAVAILABLE'});
  }});
  assert.equal(calls, 1);
  assert.equal(report.results.length, 1);
  assert.equal(report.scoredTotal, 14);
  assert.equal(report.scoredAttempted, 1);
  assert.equal(report.completed, false);
  assert.equal(report.requestFailures, 1);
  assert.equal(report.results[0].error, 'CHAT_MODEL_UNAVAILABLE');
});

const hash = value => createHash('sha256').update(value).digest('hex');
function fixture(messages, responseMode, answer) {
  return {answer, receipt:{
    provider:'ollama-local', requestedModel:'fixture:local', returnedModel:'fixture:local',
    responseMode, modelCalls:responseMode === 'REVIEW' ? 2 : 1,
    inputSha256:hash(JSON.stringify(messages)), outputSha256:hash(answer),
    toolAccess:'NONE', approval:'NOT_GRANTED',
  }};
}

test('paired run uses identical tasks, alternates order and excludes manually scored cases', async () => {
  const calls = [];
  const report = await runPairedIntelligenceSuite({async chat(messages, {responseMode}) {
    const item = intelligenceCases[Math.floor(calls.length / 2)];
    assert.deepEqual(messages, item.messages);
    calls.push(responseMode);
    const answer = responseMode === 'REVIEW' && item.kind !== 'manual'
      ? item.kind === 'json' ? JSON.stringify(item.expected) : String(item.expected)
      : 'Synthetic response for reviewer';
    return fixture(messages, responseMode, answer);
  }});
  assert.deepEqual(calls.slice(0, 6), ['STANDARD','REVIEW','REVIEW','STANDARD','STANDARD','REVIEW']);
  assert.equal(calls.length, 40);
  assert.equal(report.completedPairs, 20);
  assert.equal(report.manualPairs, 6);
  assert.equal(report.scoredPairs, 14);
  assert.equal(report.completed, true);
  assert.deepEqual(report.scores, {standardPassed:0,reviewPassed:14,difference:14});
});

test('paired run rejects a mismatched model or a silently downgraded REVIEW with no score', async () => {
  const mutate = [
    receipt => {receipt.requestedModel = receipt.returnedModel = 'other:local';},
    receipt => {receipt.responseMode = 'STANDARD'; receipt.modelCalls = 1;},
    receipt => {receipt.inputSha256 = '0'.repeat(64);},
    receipt => {receipt.outputSha256 = '0'.repeat(64);},
  ];
  for (const change of mutate) {
    let calls = 0;
    const report = await runPairedIntelligenceSuite({async chat(messages, {responseMode}) {
      calls++;
      const result = fixture(messages, responseMode, '70');
      if (responseMode === 'REVIEW') change(result.receipt);
      return result;
    }});
    assert.equal(calls, 2);
    assert.deepEqual(report.failure, {id:'inventory',mode:'REVIEW',error:'PAIRED_RECEIPT_INVALID'});
    assert.equal(report.completedPairs, 0);
    assert.equal(report.scores, null);
  }
});
