import test from 'node:test';
import assert from 'node:assert/strict';
import {scoreGgufSmoke} from '../tools/gguf-smoke-cases.mjs';

test('local model smoke reports each failed check without discarding other observations',()=>{
  const checks=scoreGgufSmoke(['I am IMPERIAL Core','Ирина','4']);
  assert.deepEqual(checks,[{id:'identity',passed:false},{id:'conversation-context',passed:true},
    {id:'basic-arithmetic',passed:true}]);
  assert.ok(scoreGgufSmoke(['VELION','Ирина','четыре']).every(item=>item.passed));
  assert.throws(()=>scoreGgufSmoke(['only one']),/THREE_MODEL_ANSWERS_REQUIRED/);
});
