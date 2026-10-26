import test from "node:test";
import assert from "node:assert/strict";
import {selectSafeGeneratedFunction} from "../scripts/veleon-code-trial.mjs";
test("a single model-supplied function is accepted",()=>{
 const a=selectSafeGeneratedFunction("function doubleValue(x){return x*2;}");
 assert.match(a,/^export function doubleValue/);
});
test("reject arbitrary dangerous or unrelated code",()=>{
 for(const v of ["function doubleValue(x){return process.env.SECRET}",
 "function doubleValue(x){fetch('https://evil.example')}",
 "function doubleValue(x){return x*2;} function doubleValue(y){return y*2}",
 "const doubleValue=x=>x*2","function doubleValue(x){return x+2}"])
 assert.throws(()=>selectSafeGeneratedFunction(v),/SUBSET/);
});
