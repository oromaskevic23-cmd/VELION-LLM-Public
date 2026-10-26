/**
 * VELION ⚡️ owner-gated cloud inference API, E3 reference implementation.
 * Real provider transport is delegated to the existing bounded cloud gateway.
 * Public prompts ONLY. No payments, tools, background jobs or remote execution.
 * A passing mock test is NOT evidence of a live model deployment.
 */
import {createHash, timingSafeEqual} from 'node:crypto';
import {requestCloudProposal} from '../../src/cloud-free-gateway.mjs';

const JSON_HEADERS=Object.freeze({
  'content-type':'application/json; charset=utf-8',
  'cache-control':'no-store, max-age=0',
  'x-content-type-options':'nosniff',
  'referrer-policy':'no-referrer',
  'content-security-policy':"default-src 'none'; frame-ancestors 'none'"
});
const safeJson=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:JSON_HEADERS});
const isToken=x=>typeof x==='string'&&x.length>=40&&x.length<=512&&/^[\x21-\x7e]+$/.test(x);
function safeTokenEquals(provided,configured){
  if(!isToken(provided)||!isToken(configured))return false;
  const hash=x=>createHash('sha256').update(x,'utf8').digest();
  return timingSafeEqual(hash(provided),hash(configured));
}
function error(code,status=400){return safeJson({status:'DENIED',error:code},status);}
async function readBoundedRequestBody(request){
  if(!request.body||typeof request.body.getReader!=='function')throw Error('REQUEST_STREAM_INVALID');
  const reader=request.body.getReader();const chunks=[];let count=0;
  try{for(;;){const {value,done}=await reader.read();if(done)break;
   if(!(value instanceof Uint8Array))throw Error('REQUEST_STREAM_INVALID');
   count+=value.length;if(count>8192)throw Error('REQUEST_LIMIT');chunks.push(value);
  }}finally{try{await reader.cancel();}catch{}}
  return new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(chunks,count));
}
const MISSION=/^[A-Za-z0-9_-]{8,80}$/;
const TASKS=new Set(['GENERAL','CODE','ANALYSIS','RESEARCH_DRAFT']);

// Legacy handler/export and VELEON_* environment variable names remain stable for integrations.
export function createVeleonHandler({env=process.env,fetchImpl=globalThis.fetch}={}){
  return async function handler(request){
    if(request.method==='GET')return safeJson({system:'VELION',
      status:'GATEWAY_PRESENT_MODEL_INFERENCE_NOT_ATTESTED',
      training:'OWN_MODEL_WEIGHTS_NOT_VERIFIED',
      capability:'OWNER_AUTHENTICATED_PROPOSALS_ONLY'});
    if(request.method!=='POST')return error('METHOD_NOT_ALLOWED',405);
    const contentType=request.headers.get('content-type')||'';
    if(!/^application\/json(?:\s*;|\s*$)/i.test(contentType))return error('JSON_REQUIRED',415);
    const origin=request.headers.get('origin');
    if(origin){
      if(!env.VELEON_ALLOWED_ORIGIN||origin!==env.VELEON_ALLOWED_ORIGIN)return error('ORIGIN_DENIED',403);
    }
    const header=request.headers.get('authorization')||'';
    const provided=header.startsWith('Bearer ')?header.slice(7):'';
    if(!safeTokenEquals(provided,env.VELEON_OWNER_TOKEN))return error('OWNER_AUTH_DENIED',401);
    if(env.VELEON_FREE_ENTITLEMENT_CONFIRMED!=='true'||
       env.VELEON_PAID_BILLING_DISABLED_CONFIRMED!=='true')
      return error('FREE_ONLY_STATUS_NOT_VERIFIED',503);
    const length=request.headers.get('content-length');
    if(length && Number(length)>8192)return error('REQUEST_LIMIT',413);
    let body;
    try{
      const raw=await readBoundedRequestBody(request);
      body=JSON.parse(raw);
    }catch(e){return error(e?.message==='REQUEST_LIMIT'?'REQUEST_LIMIT':'INVALID_JSON',
      e?.message==='REQUEST_LIMIT'?413:400);}
    if(!body||typeof body!=='object'||Array.isArray(body))return error('INVALID_BODY');
    const allow=new Set(['missionId','task','prompt','mode','dataClassification']);
    if(Object.keys(body).some(k=>!allow.has(k)))return error('UNEXPECTED_FIELD');
    if(!MISSION.test(body.missionId||'')||!TASKS.has(body.task)||
       typeof body.prompt!=='string')return error('INVALID_MISSION');
    if(body.mode!==undefined&&body.mode!=='MAX')return error('MODE_NOT_APPROVED');
    if(body.mode==='MAX'&&body.task!=='ANALYSIS')return error('MAX_REQUIRES_ANALYSIS');
    if((body.dataClassification||'PUBLIC')!=='PUBLIC')return error('PRIVATE_REMOTE_DATA_DENIED',403);
    try{
      const result=await requestCloudProposal({
        missionId:body.missionId,task:body.task,prompt:body.prompt,
        provider:'GROQ',model:body.mode==='MAX'?
          (env.VELEON_GROQ_MODEL_MAX||'openai/gpt-oss-120b'):
          (env.VELEON_GROQ_MODEL||'openai/gpt-oss-20b'),
        apiKey:env.VELEON_GROQ_API_KEY,
        dataClassification:'PUBLIC',explicitCloudInference:true,
        policy:{ownerScope:'IMPERIAL_CORE',budgetUsd:0,allowCloudInference:true,
          freeEntitlementConfirmed:true,paidBillingDisabledConfirmed:true},
        fetchImpl,timeoutMs:20000
      });
      return safeJson({system:'VELION',mode:body.mode||null,
        result:{...result,evidenceLevel:'PROVIDER_RESPONSE_UNATTESTED',
          liveProviderVerification:'REQUIRES_REAL_SIGNED_RECEIPT_AND_OWNER_REVIEW'}});
    }catch(e){
      const code=typeof e?.code==='string'&&/^[A-Z_]{4,70}$/.test(e.code)?e.code:'INFERENCE_FAILED';
      const status=code==='FREE_RATE_LIMIT_REACHED'?429:
        code==='PROVIDER_AUTH_DENIED'?502:503;
      return error(code,status);
    }
  };
}
export default createVeleonHandler();
