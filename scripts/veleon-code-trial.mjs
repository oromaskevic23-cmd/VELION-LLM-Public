import {createHash} from "node:crypto";
import {writeFile,mkdir} from "node:fs/promises";
import {parseLlamaResponse,MODEL,MODEL_SHA256} from "./veleon-real-cpu-inference.mjs";
const hash=s=>createHash("sha256").update(s).digest("hex");
export function selectSafeGeneratedFunction(content){
 if(typeof content!=="string"||content.length>12000)throw Error("MODEL_CODE_CONTENT_INVALID");
 const normalized=content.replace(/<think>[\s\S]*?<\/think>/g,"");
 const re=/\bfunction\s+doubleValue\s*\(\s*([A-Za-z_$][\w$]*)\s*\)\s*\{\s*return\s+\1\s*\*\s*2\s*;?\s*\}/g;
 const matches=[...normalized.matchAll(re)];
 if(matches.length!==1)throw Error("GENERATED_CODE_NOT_IN_ALLOWED_SUBSET");
 const variable=matches[0][1],chosen=matches[0][0];
 if(!/^[a-zA-Z]+$/.test(variable)||chosen.length>150)throw Error("GENERATED_CODE_BOUNDARY_DENIED");
 return "export "+chosen.trim()+"\n";
}
async function main(){
 if(process.env.VELEON_CPU_INFERENCE_OPT_IN!=="1")throw Error("NOT_AUTHORIZED");
 const prompt="<|im_start|>system\nYou generate a single JavaScript function only, no explanation.<|im_end|>\n"+
 "<|im_start|>user\nWrite function doubleValue(x) returning x multiplied by 2. Output only JavaScript code. /no_think<|im_end|>\n"+
 "<|im_start|>assistant\n<think>\n\n</think>\n\n";
 const start=Date.now();
 const response=await fetch("http://127.0.0.1:8899/completion",
  {method:"POST",redirect:"error",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({prompt,n_predict:180,temperature:0.0,stop:["<|im_end|>"],stream:false}),
    signal:AbortSignal.timeout(90000)});
 if(!response.ok)throw Error("LOCAL_MODEL_HTTP_FAILED");
 const raw=await response.text();
 if(raw.length>80000)throw Error("MODEL_OUTPUT_LIMIT");
 const answer=parseLlamaResponse(JSON.parse(raw));
 const functionCode=selectSafeGeneratedFunction(answer);
 await mkdir("artifacts/veleon-inference/code-trial",{recursive:true});
 const testCode=[
 'import test from "node:test";',
 'import assert from "node:assert/strict";',
 'import {doubleValue} from "./generated.mjs";',
 'test("generated function returns expected arithmetic",()=>{',
 ' for(const [x,y] of [[0,0],[1,2],[2,4],[-3,-6],[4.5,9]])assert.equal(doubleValue(x),y);',
 '});',''
 ].join("\n");
 await writeFile("artifacts/veleon-inference/code-trial/generated.mjs",functionCode);
 await writeFile("artifacts/veleon-inference/code-trial/generated.test.mjs",testCode);
 const receipt={schema:"veleon_generated_code_trial_v1",status:"MODEL_GENERATED_VALIDATED_ARITHMETIC_CANDIDATE",
   model_id:MODEL,model_sha256:MODEL_SHA256,source:"REAL_LOCAL_LLM_RESPONSE",
   prompt_sha256:hash(prompt),original_model_output_sha256:hash(answer),
   accepted_source_sha256:hash(functionCode),elapsed_ms:Date.now()-start,
   accepted_boundary:"ONE_PURE_ARITHMETIC_FUNCTION",
   private_nca_agent_execution:"NOT_PROVEN",independent_qa:"NOT_PERFORMED",
   unrestricted_code_execution:"DENIED",production_release:"DENIED"};
 await writeFile("artifacts/veleon-inference/code-trial/trial-receipt.json",JSON.stringify(receipt,null,2)+"\n");
 console.log(JSON.stringify(receipt));
}
if(process.argv[1]&&import.meta.url.endsWith(process.argv[1]))main().catch(e=>{console.error("CODE_TRIAL_BLOCKED:"+e.message);process.exitCode=1});
