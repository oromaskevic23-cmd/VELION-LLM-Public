import test from 'node:test';
import assert from 'node:assert/strict';
import {qualityCases, scoreQualityAnswer} from '../tools/gguf-quality-cases.mjs';

test('quality scoring requires correct answers and requested output formats', () => {
  assert.equal(qualityCases.length, 5);
  assert.equal(scoreQualityAnswer('inventory', '40'), true);
  assert.equal(scoreQualityAnswer('inventory', '48 - 17 + 9 = 40'), false);
  assert.equal(scoreQualityAnswer('percentage', '75'), true);
  assert.equal(scoreQualityAnswer('percentage', '11.67%'), false);
  assert.equal(scoreQualityAnswer('decimals', '0.9'), true);
  assert.equal(scoreQualityAnswer('decimals', '0,89'), false);
  assert.equal(scoreQualityAnswer('json', '{"agent_id":"NCA-007","mission":"Проверить отчёт"}'), true);
  assert.equal(scoreQualityAnswer('json', '```json\n{"agent_id":"NCA-007","mission":"Проверить отчёт"}\n```'), false);
  assert.equal(scoreQualityAnswer('json', '{"agent_id":"NCA-007","mission":"Проверить отчёт","extra":1}'), false);
  assert.equal(scoreQualityAnswer('no_internet', 'anything'), null);
  assert.throws(() => scoreQualityAnswer('unknown', 'x'), /UNKNOWN_QUALITY_CASE/);
});
