import test from 'node:test';
import assert from 'node:assert/strict';
import {intelligenceCases, scoreIntelligenceCase} from '../tools/intelligence-cases.mjs';
import {runIntelligenceSuite, SUITE_SHA256} from '../tools/intelligence-suite.mjs';

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
