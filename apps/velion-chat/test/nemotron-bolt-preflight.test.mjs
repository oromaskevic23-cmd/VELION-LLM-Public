import {test} from 'node:test';
import assert from 'node:assert/strict';
import {BOLT_MODEL_ID,checkLocalBolt,validateBoltInventory} from '../tools/nemotron-bolt-preflight.mjs';
const valid=()=>({models:[{name:BOLT_MODEL_ID,size:4_400_000_000,digest:'a'.repeat(64)}]});
const mock=(data, opts={})=>async (url, init)=>{
  assert.equal(url,'http://127.0.0.1:11434/api/tags');
  assert.equal(init.method,'GET'); assert.equal(init.redirect,'error');
  return new Response(JSON.stringify(data),{status:opts.status??200, headers:{'content-type':opts.contentType??'application/json'}});
};
test('checks exact local model identity without trusting a similarly named model',async()=>{
  const result=await checkLocalBolt({fetchImpl:mock(valid())});
  assert.equal(result.model,BOLT_MODEL_ID);
  assert.equal(result.verifiedScope,'LOCAL_OLLAMA_INVENTORY_ONLY');
});
test('rejects missing, duplicate and unverified digests',()=>{
  for(const change of [
    (v)=>v.models[0].name='nemotron-3-nano:4b',
    (v)=>v.models.push({...v.models[0]}),
    (v)=>v.models[0].digest='NOT_A_SHA',
    (v)=>v.models[0].size=-1
  ]){const v=valid();change(v);assert.throws(()=>validateBoltInventory(v),/BOLT_/)}
});
test('refuses HTTP errors, non-JSON and oversized responses',async()=>{
  await assert.rejects(checkLocalBolt({fetchImpl:mock(valid(),{status:500})}),/BOLT_/);
  await assert.rejects(checkLocalBolt({fetchImpl:mock(valid(),{contentType:'text/html'})}),/BOLT_/);
  await assert.rejects(checkLocalBolt({fetchImpl:mock({models:Array(300).fill(null)})}),/BOLT_/);
  await assert.rejects(checkLocalBolt({fetchImpl:mock({many:'x'.repeat(70000)})}),/BOLT_INVENTORY_TOO_LARGE/);
});
test('refuses unavailable Ollama, malformed inventories and invalid configuration',async()=>{
  await assert.rejects(checkLocalBolt({fetchImpl:async()=>{throw Error('network')}}),/BOLT_LOCAL_OLLAMA_UNAVAILABLE/);
  await assert.rejects(checkLocalBolt({fetchImpl:mock({models:'not-list'})}),/BOLT_INVENTORY_INVALID/);
  await assert.rejects(checkLocalBolt({timeoutMs:-1,fetchImpl:mock(valid())}),/BOLT_PREFLIGHT_INVALID/);
});
