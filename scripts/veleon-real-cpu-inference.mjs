/** VELEON governed local inference smoke (third-party Qwen GGUF through llama.cpp).
 * No VELEON model-weight ownership, API keys, outbound tool capability, or product release.
 */
import {createHash} from "node:crypto";
import {writeFile,mkdir} from "node:fs/promises";
import {performance} from "node:perf_hooks";
import {pathToFileURL} from "node:url";

export const MISSION="VELEON_REAL_CPU_INFERENCE_20261026";
export const MODEL="ggml-org/Qwen3-0.6B-GGUF/Qwen3-0.6B-Q4_0.gguf";
export const MODEL_SHA256="da2572f16c06133561ce56accaa822216f2391ef4d37fba427801cd6736417d4";
export const LLAMA_BINARY_SHA256="b02ed815efe497c0e818aadaae1b2538309f25424034555dcc1b7211c783e25c";
const ENDPOINT="http://127.0.0.1:8899/completion";
const hash=s=>createHash("sha256").update(s,"utf8").digest("hex");
const PREFIX="<|im_start|>system\nYou are a careful AI engineering assistant. Provide a concise answer, without falsely claiming a deployment.<|im_end|>\n<|im_start|>user\n";
const SUFFIX="<|im_end|>\n<|im_start|>assistant\n";
export function parseLlamaResponse(data){
 if(!data||typeof data!=="object"||Array.isArray(data)||typeof data.content!=="string")throw Error("LLAMA_RESPONSE_INVALID");
 if(data.content.trim().length<1||data.content.length>12000)throw Error("LLAMA_RESPONSE_EMPTY_OR_OVERSIZE");
 if(data.error||data.stop===false&&data.tokens_predicted===0)throw Error("LLAMA_INFERENCE_INVALID");
 return data.content;
}
export async function infer({prompt,fetcher=fetch}={}){
 if(process.env.VELEON_CPU_INFERENCE_OPT_IN!=="1")throw Error("OWNER_FREE_ONLY_OPT_IN_REQUIRED");
 if(typeof prompt!=="string"||prompt.length<8||prompt.length>900||
    /[\u0000-\u001f\u007f]/.test(prompt))throw Error("PROMPT_SCOPE_DENIED");
 const request={prompt:PREFIX+prompt+SUFFIX,n_predict:130,temperature:0.1,stop:["<|im_end|>"],stream:false};
 const start=performance.now();
 let response;
 try{response=await fetcher(ENDPOINT,{method:"POST",redirect:"error",headers:{"Content-Type":"application/json"},
  body:JSON.stringify(request),signal:AbortSignal.timeout(90000)})}
 catch{throw Error("LOCAL_CPU_TRANSPORT_FAILED")}
 if(!response.ok)throw Error("LOCAL_CPU_HTTP_"+response.status);
 const raw=await response.text();
 if(raw.length>90000)throw Error("MODEL_OUTPUT_TOO_LARGE");
 let data;try{data=JSON.parse(raw)}catch{throw Error("LOCAL_CPU_JSON_DENIED")}
 const answer=parseLlamaResponse(data);
 const result={
  schema:"veleon_real_llm_receipt_v1",mission:MISSION,
  adapter:"VELEON_LOCAL_LLAMA_CPP",runtime:"LLAMA_CPP_CPU",
  model_id:MODEL,third_party_weights:true,veleon_owned_weights:false,
  provider:"OPEN_SOURCE_GGUF_LOCAL_ONLY",
  model_sha256:MODEL_SHA256,binary_sha256:LLAMA_BINARY_SHA256,
  prompt_sha256:hash(prompt),answer_sha256:hash(answer),
  answer_excerpt:answer.replace(/[\u0000-\u001f\u007f]/g," ").slice(0,280),
  elapsed_ms:Math.round(performance.now()-start),
  predicted_tokens:Number.isSafeInteger(data.tokens_predicted)?data.tokens_predicted:null,
  execution:"REAL_CPU_PROVIDER_RESPONSE_NOT_MOCK",
  human_review:"NOT_PERFORMED",independent_qa:"NOT_PERFORMED",
  software_release:"DENIED",budget_policy:"FREE_ONLY_PUBLIC_STANDARD_RUNNER"
 };
 return result;
}
async function main(){
 const prompts=[
  "Explain what an integration test verifies in a single short sentence.",
  "Write one JavaScript function named doubleValue that returns an input number multiplied by two. Output code only."
 ];
 const receipts=[];
 for(const prompt of prompts)receipts.push(await infer({prompt}));
 await mkdir("artifacts/veleon-inference",{recursive:true});
 await writeFile("artifacts/veleon-inference/receipt.json",JSON.stringify({
  schema:"veleon_real_cpu_trial_v1",mission:MISSION,results:receipts,
  result:"REAL_LOCAL_THIRD_PARTY_INFERENCE_EVIDENCE",
  safety_note:"third-party open model; no proprietary VELEON checkpoint, not a production deployment"
 },null,2)+"\n");
 console.log(JSON.stringify({status:"REAL_INFERENCE_RECEIVED",responses:receipts.length,
  model:MODEL,predicted_tokens:receipts.map(x=>x.predicted_tokens),
  response_hashes:receipts.map(x=>x.answer_sha256),proprietary_model:false}));
 if(process.env.GITHUB_STEP_SUMMARY){
  await writeFile(process.env.GITHUB_STEP_SUMMARY,
  "# VELEON REAL CPU inference gate\n\n"+
  "2 real third-party open-model responses recorded on standard public GitHub runner.\n\n"+
  "Weights: Qwen3 0.6B GGUF (NOT VELEON proprietary), pinned SHA-256. "+
  "Binary: llama.cpp b11896, pinned SHA-256.\n\n"+
  "Live source testing: PASS only if job succeeds. No NCA arbitrary-code execution or owner authority.\n",{flag:"a"});
 }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)
 main().catch(e=>{console.error("VELEON_INFERENCE_BLOCKED: "+e.message);process.exitCode=1});
