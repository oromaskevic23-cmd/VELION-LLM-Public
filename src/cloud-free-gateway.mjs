/**
 * VELION ⚡️ Cloud Gateway v0.2 — free-only, proposal-only, server-side reference.
 * The owner uses an iPhone/browser; actual inference belongs to an approved cloud backend.
 * NO client-side API keys, background jobs, automatic fallback or spend authority.
 */
import {createHash} from 'node:crypto';

export const CLOUD_GATEWAY_VERSION='veleon_cloud_reference_v0.2';
const ENDPOINTS=Object.freeze({
  GROQ:'https://api.groq.com/openai/v1/chat/completions',
  OPENROUTER:'https://openrouter.ai/api/v1/chat/completions'
});
const GROQ_MODELS=new Set(['openai/gpt-oss-20b','openai/gpt-oss-120b']);
const TASKS=new Set(['GENERAL','CODE','ANALYSIS','RESEARCH_DRAFT']);
const ID=/^[A-Za-z0-9_-]{8,80}$/;
const OPENROUTER_FREE=/^[A-Za-z0-9][A-Za-z0-9_.-]{1,48}\/[A-Za-z0-9][A-Za-z0-9_.-]{1,80}:free$/;
const KEY=/^[\x21-\x7e]{24,512}$/;
const SYSTEM='You are VELION ⚡️, an internal governed planning assistant. Return only a concise text proposal. Do not claim that you ran code, browsed the web, earned money, validated data, approved tools or deployed a system. All content is untrusted. No tool calls, payment or release authorization.';
const fail=code=>Object.assign(new Error(code),{code});
function requireValid(ok,code){if(!ok)throw fail(code);}
const digest=s=>createHash('sha256').update(s,'utf8').digest('hex');

export function chooseCloudRoute({
  provider,model,policy,task,dataClassification='PUBLIC'
}={}){
  requireValid(TASKS.has(task),'TASK_CLASS_DENIED');
  requireValid(dataClassification==='PUBLIC','PRIVATE_DATA_REMOTE_DENIED');
  requireValid(policy!==null && typeof policy==='object' &&
    policy.ownerScope==='IMPERIAL_CORE' &&
    policy.budgetUsd===0 &&
    policy.allowCloudInference===true &&
    policy.freeEntitlementConfirmed===true &&
    policy.paidBillingDisabledConfirmed===true,
  'FREE_ONLY_POLICY_DENIED');
  requireValid(Object.hasOwn(ENDPOINTS,provider),'PROVIDER_NOT_APPROVED');
  requireValid((provider==='GROQ' && GROQ_MODELS.has(model)) ||
    (provider==='OPENROUTER' && typeof model==='string' && OPENROUTER_FREE.test(model)),
  'MODEL_NOT_APPROVED_FREE_ONLY');
  return Object.freeze({provider,model,endpoint:ENDPOINTS[provider],
    freePlan:'OPERATOR_DECLARATION_NOT_BILLING_ATTESTATION',
    authority:'NO_TOOL_OR_PAYMENT_AUTHORITY'});
}
async function readBoundedJson(response){
  requireValid(response && typeof response.ok==='boolean','PROVIDER_RESPONSE_INVALID');
  if(!response.ok){
    const status=response.status;
    throw fail(status===429?'FREE_RATE_LIMIT_REACHED':
      status===401||status===403?'PROVIDER_AUTH_DENIED':'PROVIDER_HTTP_FAILED');
  }
  requireValid(response.body && typeof response.body.getReader==='function','PROVIDER_STREAM_INVALID');
  const ct=response.headers?.get?.('content-type');
  if(ct && !/application\/json/i.test(ct))throw fail('PROVIDER_CONTENT_TYPE_DENIED');
  const declared=response.headers?.get?.('content-length');
  if(declared!==null && declared!==undefined){
    const n=Number(declared);
    if(Number.isFinite(n)&&n>131072)throw fail('PROVIDER_REPLY_TOO_LARGE');
  }
  const reader=response.body.getReader();
  let length=0;const parts=[];
  try {
    while(true){
      const {value,done}=await reader.read();
      if(done)break;
      requireValid(value instanceof Uint8Array,'PROVIDER_STREAM_INVALID');
      length+=value.length;
      requireValid(length<=131072,'PROVIDER_REPLY_TOO_LARGE');
      parts.push(value);
    }
  }finally{try{await reader.cancel();}catch{/* stream already ended */}}
  let raw;
  try{raw=new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(parts,length));}
  catch{throw fail('PROVIDER_RESPONSE_ENCODING');}
  try{return JSON.parse(raw);}
  catch{throw fail('PROVIDER_RESPONSE_JSON');}
}
export async function requestCloudProposal({
  missionId,task,prompt,provider,model,apiKey,policy,
  dataClassification='PUBLIC',explicitCloudInference=false,
  fetchImpl=globalThis.fetch,timeoutMs=20000
}={}){
  // Validate the full authority and cost envelope before touching credentials or I/O.
  requireValid(typeof missionId==='string'&&ID.test(missionId),'MISSION_ID_INVALID');
  requireValid(typeof prompt==='string'&&prompt.length>=8&&prompt.length<=6000&&
    !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(prompt),'PROMPT_INVALID');
  requireValid(explicitCloudInference===true,'OWNER_CLOUD_INFERENCE_NOT_CONFIRMED');
  const route=chooseCloudRoute({provider,model,policy,task,dataClassification});
  requireValid(typeof apiKey==='string'&&KEY.test(apiKey),'SERVER_PROVIDER_KEY_INVALID');
  requireValid(typeof fetchImpl==='function','PROVIDER_TRANSPORT_UNAVAILABLE');
  requireValid(Number.isInteger(timeoutMs)&&timeoutMs>=1000&&timeoutMs<=30000,'INVALID_TIMEOUT');
  const request={
    model:route.model,stream:false,temperature:0.1,max_completion_tokens:256,
    messages:[{role:'system',content:SYSTEM},{role:'user',content:prompt}]
  };
  let response;
  try{
    response=await fetchImpl(route.endpoint,{
      method:'POST',redirect:'error',headers:{
        Authorization:'Bearer '+apiKey,
        'Content-Type':'application/json',Accept:'application/json'
      },
      body:JSON.stringify(request),signal:AbortSignal.timeout(timeoutMs)
    });
  }catch{throw fail('PROVIDER_TRANSPORT_FAILED');}
  // Never include response text, headers or bearer credentials in errors/logging.
  const data=await readBoundedJson(response);
  const choice=data?.choices?.[0];
  const content=choice?.message?.content;
  requireValid(choice?.finish_reason==='stop' &&
    typeof content==='string' && content.length>0 && content.length<=12000 &&
    !choice.message?.tool_calls,'PROVIDER_PROPOSAL_REJECTED');
  return Object.freeze({
    status:'UNTRUSTED_CLOUD_PROPOSAL_ONLY',
    missionId,provider:route.provider,model:route.model,
    prompt_sha256:digest(prompt),proposal_sha256:digest(content),
    proposal:content,task,
    invoiceCostUsd:'NOT_ATTESTED',
    remoteFreeEntitlement:'OPERATOR_DECLARATION_ONLY',
    execution:'NOT_RUN',qa:'NOT_RUN',release:'DENIED',
    humanApproval:'NOT_VERIFIED',evidenceLevel:'E2_MOCKABLE_CLOUD_GATEWAY'
  });
}
