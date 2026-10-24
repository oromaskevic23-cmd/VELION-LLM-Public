import test from 'node:test';
import assert from 'node:assert/strict';
import {selectLocalModel,generateLocalProposal,VERSION} from '../src/free-llm-gateway.mjs';
const POLICY=Object.freeze({ownerScope:'IMPERIAL_CORE',localOnly:true,allowLocalNetwork:true,budgetUsd:0});
const INVENTORY=['qwen3.5:4b','qwen3.5:2b'];
const input=()=>({missionId:'VELEON-TEST-001',task:'CODE',prompt:'Write a verified plan for a small task app.',installedModels:INVENTORY,policy:POLICY,explicitLocalInference:true});
const response=(model='qwen3.5:4b',content='Prepare design and verify tests.')=>
 new Response(JSON.stringify({model,message:{role:'assistant',content},done:true}),{status:200});
const mock=(fn=()=>response())=>async(url,options)=>fn(url,options);
test('gateway declares nonproduction reference version',()=>assert.match(VERSION,/veleon_local_proposal/));
test('selection prefers approved small local model available on device',()=>{
 const out=selectLocalModel({task:'CODE',installedModels:INVENTORY,policy:POLICY});
 assert.equal(out.model,'qwen3.5:4b');assert.equal(out.authority,'NONE');assert.equal(out.estimatedCostUsd,0);
});
test('selection falls back to installed vetted lightweight model',()=>{
 const out=selectLocalModel({task:'GENERAL',installedModels:['qwen3.5:2b'],policy:POLICY});
 assert.equal(out.model,'qwen3.5:2b');
});
test('no model available returns no selection and never invokes network',()=>{
 assert.equal(selectLocalModel({task:'CODE',installedModels:[],policy:POLICY}).status,'NO_APPROVED_LOCAL_MODEL');
});
test('rejects remote-only / paid policy',()=>{
 for(const bad of [{...POLICY,budgetUsd:1},{...POLICY,localOnly:false},{...POLICY,ownerScope:'UNTRUSTED'},{}]){
  assert.throws(()=>selectLocalModel({task:'CODE',installedModels:INVENTORY,policy:bad}),/LOCAL_POLICY_DENIED/);
 }
});
test('model injection and malformed local inventory fail closed',()=>{
 for(const inventory of [['qwen3.5:4b','qwen3.5:4b'],['https://host/a'],['qwen3.5:4b;shutdown'],[42],null]){
  assert.throws(()=>selectLocalModel({task:'CODE',installedModels:inventory,policy:POLICY}),/INVALID_LOCAL_INVENTORY|DUPLICATE_LOCAL_MODEL/);
 }
});
test('unapproved arbitrary Ollama model cannot be selected',()=>{
 const out=selectLocalModel({task:'CODE',installedModels:['malicious:unapproved'],policy:POLICY});
 assert.equal(out.model,null);
});
test('requires explicit local inference permission before any I/O',async()=>{
 let calls=0;
 await assert.rejects(generateLocalProposal({...input(),explicitLocalInference:false,fetchImpl:async()=>{calls++;return response();}}),/LOCAL_INFERENCE_NOT_AUTHORIZED/);
 assert.equal(calls,0);
});
test('rejects invalid mission ids before I/O',async()=>{
 let calls=0;
 await assert.rejects(generateLocalProposal({...input(),missionId:'bad',fetchImpl:async()=>{calls++;return response();}}),/INVALID_MISSION_ID/);
 assert.equal(calls,0);
});
test('rejects unsupported tasks and insufficient prompt',async()=>{
 for(const obj of [{task:'PAYMENT'},{prompt:'short'},{prompt:'A'.repeat(8001)}]){
  await assert.rejects(generateLocalProposal({...input(),...obj,fetchImpl:mock()}),/UNSUPPORTED_TASK|INVALID_PROMPT/);
 }
});
test('only calls fixed loopback Ollama endpoint without credentials, tools or remote host',async()=>{
 let calls=0;
 const result=await generateLocalProposal({...input(),fetchImpl:mock((url,opt)=>{
  calls++;
  assert.equal(url,'http://127.0.0.1:11434/api/chat');
  assert.equal(opt.method,'POST');assert.equal(opt.redirect,'error');
  assert.equal(opt.headers.Authorization,undefined);
  const body=JSON.parse(opt.body);
  assert.equal(body.stream,false);assert.equal(body.model,'qwen3.5:4b');
  assert.equal(body.tools,undefined);assert.equal(body.options.num_ctx,4096);
  assert.equal(body.options.num_predict,256);
  return response();
 })});
 assert.equal(calls,1);
 assert.equal(result.status,'PROPOSAL_ONLY_NOT_EXECUTED');
 assert.equal(result.release,'DENIED');
 assert.equal(result.execution,'NOT_RUN');
 assert.equal(result.qa,'NOT_RUN');
 assert.equal(result.proposal,'Prepare design and verify tests.');
 assert.equal(result.claimedCostUsd,0);
 assert.match(result.proposal_sha256,/^[0-9a-f]{64}$/);
});
test('transport error is returned only as stable redacted code',async()=>{
 await assert.rejects(generateLocalProposal({...input(),fetchImpl:async()=>{throw new Error('supersecret in transport');}}),err=>{
  assert.equal(err.code,'LOCAL_PROVIDER_UNAVAILABLE');assert.doesNotMatch(err.message,/supersecret/);return true;
 });
});
test('HTTP errors do not expose body or provider credentials',async()=>{
 await assert.rejects(generateLocalProposal({...input(),fetchImpl:mock(()=>new Response('external private token',{status:401}))}),err=>{
  assert.equal(err.code,'LOCAL_PROVIDER_HTTP_ERROR');assert.doesNotMatch(err.message,/token/);return true;
 });
});
test('untrusted model id in response fails closed',async()=>{
 await assert.rejects(generateLocalProposal({...input(),fetchImpl:mock(()=>response('another:model'))}),/LOCAL_PROVIDER_INVALID_PAYLOAD/);
});
test('missing proposal content or tool calls never give execution authority',async()=>{
 for(const data of [
  {model:'qwen3.5:4b',message:{role:'assistant',content:''},done:true},
  {model:'qwen3.5:4b',message:{role:'assistant',content:'run',tool_calls:[{function:{name:'exec'}}]},done:true}
 ]){
  await assert.rejects(generateLocalProposal({...input(),fetchImpl:mock(()=>new Response(JSON.stringify(data)))}),/LOCAL_PROVIDER_INVALID_PAYLOAD/);
 }
});
test('malformed provider JSON fails closed without raw text disclosure',async()=>{
 await assert.rejects(generateLocalProposal({...input(),fetchImpl:mock(()=>new Response('{this is secret'))}),/LOCAL_PROVIDER_BAD_JSON/);
});
test('large response header fails before body read',async()=>{
 await assert.rejects(generateLocalProposal({...input(),fetchImpl:mock(()=>new Response('ok',{headers:{'content-length':'300000'}}))}),/LOCAL_PROVIDER_RESPONSE_LIMIT/);
});
test('streamed oversized body is rejected',async()=>{
 await assert.rejects(generateLocalProposal({...input(),fetchImpl:mock(()=>new Response('a'.repeat(262145)))}),/LOCAL_PROVIDER_RESPONSE_LIMIT/);
});
test('invalid timeout fails before I/O',async()=>{
 await assert.rejects(generateLocalProposal({...input(),timeoutMs:0,fetchImpl:mock()}),/INVALID_TIMEOUT/);
});
test('model selection does not grant real identity approval or autonomous actions',async()=>{
 const out=await generateLocalProposal({...input(),fetchImpl:mock()});
 assert.equal(out.humanAuthority,'NOT_VERIFIED');assert.equal(out.proofLevel,'E2_ADAPTER_LOCAL_MOCK');
});
