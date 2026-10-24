import test from 'node:test';
import assert from 'node:assert/strict';
import {chooseCloudRoute,requestCloudProposal,CLOUD_GATEWAY_VERSION} from '../src/cloud-free-gateway.mjs';

const policy=Object.freeze({
  ownerScope:'IMPERIAL_CORE',budgetUsd:0,allowCloudInference:true,
  freeEntitlementConfirmed:true,paidBillingDisabledConfirmed:true
});
const props=()=>({
  missionId:'VELEON-CLOUD-0001',task:'CODE',
  prompt:'Prepare an offline design for a tested task manager.',
  provider:'GROQ',model:'openai/gpt-oss-20b',
  apiKey:'server-test-placeholder-credential-0123456789',
  policy,explicitCloudInference:true
});
const reply=(content='Create isolated tests and review code.',model='openai/gpt-oss-20b')=>
  new Response(JSON.stringify({model,choices:[{
    finish_reason:'stop',message:{role:'assistant',content}
  }]}),{status:200,headers:{'content-type':'application/json'}});
const fake=(fn=()=>reply())=>async (url,init)=>fn(url,init);
const rejectCode=async(args,code)=>assert.rejects(requestCloudProposal({
  ...props(),fetchImpl:fake(),...args
}),e=>e.code===code);
test('cloud adapter is explicit v0.2 reference',()=>assert.match(CLOUD_GATEWAY_VERSION,/v0\.2/));
test('Groq free route selected without API use or costs',()=>{
 const v=chooseCloudRoute({provider:'GROQ',model:'openai/gpt-oss-20b',policy,task:'CODE'});
 assert.equal(v.endpoint,'https://api.groq.com/openai/v1/chat/completions');
 assert.equal(v.authority,'NO_TOOL_OR_PAYMENT_AUTHORITY');
});
test('alternate approved Groq 120b route',()=>assert.equal(
 chooseCloudRoute({provider:'GROQ',model:'openai/gpt-oss-120b',policy,task:'ANALYSIS'}).provider,'GROQ'));
test('OpenRouter exact :free model route allowed after policy declaration',()=>{
 const x=chooseCloudRoute({provider:'OPENROUTER',model:'vendor/model:free',policy,task:'GENERAL'});
 assert.equal(x.endpoint,'https://openrouter.ai/api/v1/chat/completions');
 assert.match(x.freePlan,/NOT_BILLING_ATTESTATION/);
});
test('OpenRouter non-free suffix denied before any network',()=>assert.throws(()=>chooseCloudRoute({
 provider:'OPENROUTER',model:'vendor/model',policy,task:'CODE'}),/MODEL_NOT_APPROVED_FREE_ONLY/));
test('OpenRouter model strings containing URL control cannot become endpoints',()=>assert.throws(()=>chooseCloudRoute({
 provider:'OPENROUTER',model:'evil/../../pay:free',policy,task:'CODE'}),/MODEL_NOT_APPROVED_FREE_ONLY/));
test('unknown provider is denied',()=>assert.throws(()=>chooseCloudRoute({
 provider:'RANDOM',model:'x',policy,task:'GENERAL'}),/PROVIDER_NOT_APPROVED/));
test('unknown Groq model including paid variants denied',()=>assert.throws(()=>chooseCloudRoute({
 provider:'GROQ',model:'secret-paid-premium',policy,task:'CODE'}),/MODEL_NOT_APPROVED_FREE_ONLY/));
test('secret/private user prompts cannot be sent to free cloud',()=>assert.throws(()=>chooseCloudRoute({
 provider:'GROQ',model:'openai/gpt-oss-20b',policy,task:'CODE',dataClassification:'PRIVATE'
}),/PRIVATE_DATA_REMOTE_DENIED/));
test('all cost control conditions required independently',()=>{
 for(const broken of [
  {...policy,ownerScope:'ANOTHER'}, {...policy,budgetUsd:1},
  {...policy,freeEntitlementConfirmed:false},{...policy,paidBillingDisabledConfirmed:false},
  {...policy,allowCloudInference:false},{}
 ])assert.throws(()=>chooseCloudRoute({
  provider:'GROQ',model:'openai/gpt-oss-20b',policy:broken,task:'CODE'}),/FREE_ONLY_POLICY_DENIED/);
});
test('explicit owner cloud-inference act required, no fetch on denial',async()=>{
 let count=0;
 await assert.rejects(requestCloudProposal({...props(),explicitCloudInference:false,
  fetchImpl:async()=>{count++;return reply();}}),/OWNER_CLOUD_INFERENCE_NOT_CONFIRMED/);
 assert.equal(count,0);
});
test('invalid mission and prompt fail before API use',async()=>{
 await rejectCode({missionId:'x'},'MISSION_ID_INVALID');
 await rejectCode({prompt:'hi'},'PROMPT_INVALID');
 await rejectCode({prompt:'a'.repeat(6100)},'PROMPT_INVALID');
});
test('malformed server-only key denied before I/O',async()=>{
 let count=0;
 await assert.rejects(requestCloudProposal({...props(),apiKey:'short',
  fetchImpl:async()=>{count++;return reply();}}),/SERVER_PROVIDER_KEY_INVALID/);
 assert.equal(count,0);
});
test('fixed HTTPS endpoint, no tools, no hidden retry or paid fallback',async()=>{
 let count=0;
 const x=await requestCloudProposal({...props(),fetchImpl:fake((url,init)=>{
  count++;
  assert.equal(url,'https://api.groq.com/openai/v1/chat/completions');
  assert.equal(init.redirect,'error');
  assert.equal(init.method,'POST');
  assert.equal(init.headers.Authorization,'Bearer '+props().apiKey);
  const obj=JSON.parse(init.body);
  assert.equal(obj.model,'openai/gpt-oss-20b');
  assert.equal(obj.tools,undefined);
  assert.equal(obj.stream,false);
  assert.equal(obj.max_completion_tokens,256);
  return reply();
 })});
 assert.equal(count,1);
 assert.equal(x.status,'UNTRUSTED_CLOUD_PROPOSAL_ONLY');
 assert.equal(x.proposal,'Create isolated tests and review code.');
 assert.match(x.proposal_sha256,/^[a-f0-9]{64}$/);
 assert.equal(x.release,'DENIED');assert.equal(x.qa,'NOT_RUN');
 assert.equal(x.execution,'NOT_RUN');
 assert.equal(x.invoiceCostUsd,'NOT_ATTESTED');
 assert.equal(JSON.stringify(x).includes(props().apiKey),false);
});
test('OpenRouter uses separate fixed host with supplied free model',async()=>{
 const x=await requestCloudProposal({...props(),provider:'OPENROUTER',model:'approved/sample:free',fetchImpl:fake((url,init)=>{
  assert.equal(url,'https://openrouter.ai/api/v1/chat/completions');
  assert.equal(JSON.parse(init.body).model,'approved/sample:free');
  return reply();
 })});
 assert.equal(x.provider,'OPENROUTER');
});
test('HTTP 429 returns explicit rate-limit error and no paid retry',async()=>{
 let n=0;
 await assert.rejects(requestCloudProposal({...props(),fetchImpl:fake(()=>{n++;return new Response('secret',{status:429});})}),e=>
  e.code==='FREE_RATE_LIMIT_REACHED' && !e.message.includes('secret'));
 assert.equal(n,1);
});
test('401/403 redact provider response and deny access',async()=>{
 for(const status of [401,403])await rejectCode({
  fetchImpl:fake(()=>new Response('authorization leaked',{status}))
 },'PROVIDER_AUTH_DENIED');
});
test('server errors expose no provider body',async()=>await rejectCode({
 fetchImpl:fake(()=>new Response('private raw server logs',{status:500}))
},'PROVIDER_HTTP_FAILED'));
test('malformed response JSON denied',async()=>await rejectCode({
 fetchImpl:fake(()=>new Response('this is not JSON'))
},'PROVIDER_RESPONSE_JSON'));
test('content-type text instead of JSON denied',async()=>await rejectCode({
 fetchImpl:fake(()=>new Response('ok',{headers:{'content-type':'text/plain'}}))
},'PROVIDER_CONTENT_TYPE_DENIED'));
test('overlarge response rejected while reading stream',async()=>await rejectCode({
 fetchImpl:fake(()=>new Response('X'.repeat(131073)))
},'PROVIDER_REPLY_TOO_LARGE'));
test('overlarge declared content-length fails before streaming',async()=>await rejectCode({
 fetchImpl:fake(()=>new Response('ok',{headers:{'content-length':'9999999'}}))
},'PROVIDER_REPLY_TOO_LARGE'));
test('incomplete model output rejected as success',async()=>await rejectCode({
 fetchImpl:fake(()=>new Response(JSON.stringify({choices:[{finish_reason:'length',message:{content:'partial'}}]})))
},'PROVIDER_PROPOSAL_REJECTED'));
test('model tool-calls rejected, never executed',async()=>await rejectCode({
 fetchImpl:fake(()=>new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{content:'run command',tool_calls:[{function:{name:'shell'}}]}}]})))
},'PROVIDER_PROPOSAL_REJECTED'));
test('network errors are redacted, including secrets',async()=>{
 const key=props().apiKey;
 await assert.rejects(requestCloudProposal({...props(),fetchImpl:async()=>{throw new Error('network failed '+key)}}),e=>
  e.code==='PROVIDER_TRANSPORT_FAILED'&&!e.message.includes(key));
});
test('time limits are strictly bounded',async()=>{
 for(const ms of [0,500,30001,'20000'])await rejectCode({timeoutMs:ms},'INVALID_TIMEOUT');
});
test('no automatic arbitrary task classes',()=>assert.throws(()=>chooseCloudRoute({
 provider:'GROQ',model:'openai/gpt-oss-20b',policy,task:'PAYMENTS'
}),/TASK_CLASS_DENIED/));
