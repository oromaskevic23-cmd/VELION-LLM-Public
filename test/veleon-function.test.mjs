import test from 'node:test';
import assert from 'node:assert/strict';
import {createVeleonHandler} from '../netlify/functions/veleon-inference.mjs';

const env={
 VELEON_OWNER_TOKEN:'owner-test-token-with-40-plus-random-characters-123456789',
 VELEON_ALLOWED_ORIGIN:'https://veleon.example',
 VELEON_FREE_ENTITLEMENT_CONFIRMED:'true',
 VELEON_PAID_BILLING_DISABLED_CONFIRMED:'true',
 VELEON_GROQ_API_KEY:'test-server-placeholder-credential-12345678',
 VELEON_GROQ_MODEL:'openai/gpt-oss-20b',
 VELEON_GROQ_MODEL_MAX:'openai/gpt-oss-120b'
};
const body={missionId:'VELEON-00001',task:'ANALYSIS',mode:'MAX',
 prompt:'Write a strictly bounded analysis proposal for this task.'};
const request=(data=body,{authorization=env.VELEON_OWNER_TOKEN,origin=null,method='POST',type='application/json'}={})=>new Request('https://veleon.example/.netlify/functions/veleon-inference',{
 method,headers:{'Content-Type':type,...(authorization?{'Authorization':'Bearer '+authorization}:{}),
 ...(origin?{Origin:origin}:{})},...(method==='POST'?{body:JSON.stringify(data)}:{})
});
const providerReply=(content='A bounded analysis proposal.')=>new Response(JSON.stringify({
 choices:[{finish_reason:'stop',message:{role:'assistant',content}}]
}),{status:200,headers:{'content-type':'application/json'}});
const network=()=>{let n=0;return {fetchImpl:async(u,init)=>{n++;
 assert.equal(u,'https://api.groq.com/openai/v1/chat/completions');
 assert.equal(init.redirect,'error');
 assert.equal(init.headers.Authorization,'Bearer '+env.VELEON_GROQ_API_KEY);
 assert.equal(JSON.parse(init.body).tools,undefined);
 assert.equal(JSON.parse(init.body).model,'openai/gpt-oss-120b');
 return providerReply();},count:()=>n}};
const code=async r=>(await r.json()).error;

test('GET is metadata only, no private configuration',async()=>{
 const r=await createVeleonHandler({env,fetchImpl:()=>{throw Error('network')}})(request(body,{method:'GET'}));
 assert.equal(r.status,200);assert.equal((await r.json()).training,'OWN_MODEL_WEIGHTS_NOT_VERIFIED');
});
test('other methods denied',async()=>{
 const h=createVeleonHandler({env});assert.equal((await h(new Request('https://veleon.example',{method:'DELETE'}))).status,405);
});
test('no token prevents all transport',async()=>{
 const n=network(),h=createVeleonHandler({env,fetchImpl:n.fetchImpl});
 const r=await h(request(body,{authorization:null}));assert.equal(r.status,401);assert.equal(n.count(),0);
});
test('mismatched and undersized owner token denied',async()=>{
 const h=createVeleonHandler({env,fetchImpl:()=>{throw Error('never')}});
 assert.equal((await h(request(body,{authorization:'wrong'}))).status,401);
 assert.equal((await h(request(body,{authorization:'X'.repeat(45)}))).status,401);
});
test('absent configured owner token fails closed',async()=>{
 const h=createVeleonHandler({env:{...env,VELEON_OWNER_TOKEN:''}});
 assert.equal((await h(request())).status,401);
});
test('foreign browser origin forbidden before provider access',async()=>{
 const n=network(),h=createVeleonHandler({env,fetchImpl:n.fetchImpl});
 assert.equal((await h(request(body,{origin:'https://evil.example'}))).status,403);assert.equal(n.count(),0);
});
test('same origin accepted when configured',async()=>{
 const n=network(),h=createVeleonHandler({env,fetchImpl:n.fetchImpl});
 assert.equal((await h(request(body,{origin:'https://veleon.example'}))).status,200);assert.equal(n.count(),1);
});
test('missing entitlement or disabled billing declaration blocks requests',async()=>{
 const n=network();for(const k of ['VELEON_FREE_ENTITLEMENT_CONFIRMED','VELEON_PAID_BILLING_DISABLED_CONFIRMED']){
  const h=createVeleonHandler({env:{...env,[k]:'false'},fetchImpl:n.fetchImpl});
  assert.equal((await h(request())).status,503);
 }assert.equal(n.count(),0);
});
test('reject unknown request fields',async()=>{
 const h=createVeleonHandler({env});assert.equal(await code(await h(request({...body,creditCard:'no'}))),'UNEXPECTED_FIELD');
});
test('MAX is one named mode, never entire model identity',async()=>{
 const n=network();const h=createVeleonHandler({env,fetchImpl:n.fetchImpl});
 const r=await h(request());assert.equal(r.status,200);
 const v=await r.json();assert.equal(v.system,'VELEON');assert.equal(v.mode,'MAX');
 assert.equal(v.result.status,'UNTRUSTED_CLOUD_PROPOSAL_ONLY');
 assert.equal(v.result.release,'DENIED');assert.equal(v.result.execution,'NOT_RUN');
 assert.equal(v.result.evidenceLevel,'PROVIDER_RESPONSE_UNATTESTED');
 assert.equal(JSON.stringify(v).includes(env.VELEON_GROQ_API_KEY),false);
});
test('without MAX, standard task uses ordinary approved provider route',async()=>{
 const h=createVeleonHandler({env,fetchImpl:async(_u,init)=>{
   assert.equal(JSON.parse(init.body).model,'openai/gpt-oss-20b');return providerReply();
 }});
 const r=await h(request({...body,mode:undefined,task:'CODE'}));
 assert.equal(r.status,200);assert.equal((await r.json()).mode,null);
});
test('unknown mode and wrong MAX task denied before transport',async()=>{
 const n=network();const h=createVeleonHandler({env,fetchImpl:n.fetchImpl});
 assert.equal(await code(await h(request({...body,mode:'SUPER'}))),'MODE_NOT_APPROVED');
 assert.equal(await code(await h(request({...body,task:'CODE'}))),'MAX_REQUIRES_ANALYSIS');
 assert.equal(n.count(),0);
});
test('PRIVATE data never sent to free provider',async()=>{
 const n=network();const h=createVeleonHandler({env,fetchImpl:n.fetchImpl});
 assert.equal((await h(request({...body,dataClassification:'PRIVATE'}))).status,403);
 assert.equal(n.count(),0);
});
test('provider rejection is sanitized and reports no secret',async()=>{
 const h=createVeleonHandler({env,fetchImpl:async()=>new Response('secret leaked',{status:401})});
 const r=await h(request());assert.equal(r.status,502);
 assert.equal(JSON.stringify(await r.json()).includes('secret'),false);
});
test('429 is surfaced without retry or paid fallback',async()=>{
 let count=0;const h=createVeleonHandler({env,fetchImpl:async()=>{count++;return new Response('slow',{status:429})}});
 const r=await h(request());assert.equal(r.status,429);assert.equal(count,1);
});
test('invalid content type not accepted',async()=>{
 const h=createVeleonHandler({env});const r=await h(request(body,{type:'text/plain'}));assert.equal(r.status,415);
});
test('JSON success never cached',async()=>{
 const h=createVeleonHandler({env,fetchImpl:async()=>providerReply()});const r=await h(request());
 assert.match(r.headers.get('cache-control'),/no-store/);
});
