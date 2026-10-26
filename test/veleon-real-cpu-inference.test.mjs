import test from "node:test";
import assert from "node:assert/strict";
import {infer,parseLlamaResponse,MODEL,MODEL_SHA256} from "../scripts/veleon-real-cpu-inference.mjs";
test("provenance pins exact model checksum",()=>{
 assert.equal(MODEL,"ggml-org/Qwen3-0.6B-GGUF/Qwen3-0.6B-Q4_0.gguf");
 assert.match(MODEL_SHA256,/^[a-f0-9]{64}$/);
});
test("deny by default when owner opt-in absent",async()=>{
 const flag=process.env.VELEON_CPU_INFERENCE_OPT_IN;
 delete process.env.VELEON_CPU_INFERENCE_OPT_IN;
 try{await assert.rejects(()=>infer({prompt:"Safe public test task."}),/OPT_IN/);}
 finally{if(flag===undefined)delete process.env.VELEON_CPU_INFERENCE_OPT_IN;else process.env.VELEON_CPU_INFERENCE_OPT_IN=flag}
});
test("reject empty or malformed transport result",()=>{
 for(const response of [null,{},[],{content:""},{content:"  "}]){
  assert.throws(()=>parseLlamaResponse(response));
 }
});
test("mock only for policy unit test, receipt marks local model not owned",async()=>{
 process.env.VELEON_CPU_INFERENCE_OPT_IN="1";
 try{
  const r=await infer({prompt:"Explain unit testing briefly.",fetcher:async(url,req)=>{
   assert.equal(url,"http://127.0.0.1:8899/completion");
   assert.equal(req.method,"POST");
   return{ok:true,text:async()=>JSON.stringify({content:"A unit test checks a function.",tokens_predicted:8})};
  }});
  assert.equal(r.veleon_owned_weights,false);
  assert.equal(r.predicted_tokens,8);
 }finally{delete process.env.VELEON_CPU_INFERENCE_OPT_IN}
});
