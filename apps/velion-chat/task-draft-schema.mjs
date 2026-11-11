// Fixed, local-only output contract. It grants no authority to execute code.
import {createHash} from 'node:crypto';

export const TASK_DRAFT_FORMAT = 'constructor_draft_v1';
const str = {type:'string',minLength:1};
const step = {type:'object',properties:{id:{const:'build'},action:str,acceptance:str},
  required:['id','action','acceptance'],additionalProperties:false};
const file = path => ({type:'object',properties:{path:{const:path},content:str},
  required:['path','content'],additionalProperties:false});
const deepFreeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){
  for(const child of Object.values(value))deepFreeze(child);Object.freeze(value);}return value;};
export const TASK_DRAFT_SCHEMA = deepFreeze({type:'object',properties:{
  schema:{const:TASK_DRAFT_FORMAT},summary:str,
  steps:{type:'array',items:step,minItems:1,maxItems:1},
  files:{type:'array',prefixItems:[file('app.mjs'),file('test/app.test.mjs')],minItems:2,maxItems:2},
},required:['schema','summary','steps','files'],additionalProperties:false});
export const TASK_DRAFT_SCHEMA_SHA256 = createHash('sha256').update(JSON.stringify(TASK_DRAFT_SCHEMA)).digest('hex');

// Independent post-generation validation; grammar is only a format constraint.
export function validateTaskDraftText(text){
  let draft;try{draft=JSON.parse(text);}catch{return false;}
  const keys=(o,expected)=>o&&typeof o==='object'&&!Array.isArray(o)&&
    Object.keys(o).sort().join('|')===expected.slice().sort().join('|');
  const printable=(s,max)=>typeof s==='string'&&s.trim().length>0&&s.length<=max&&
    !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(s);
  if(!keys(draft,['schema','summary','steps','files'])||draft.schema!==TASK_DRAFT_FORMAT||
     !printable(draft.summary,1500)||!Array.isArray(draft.steps)||draft.steps.length!==1||
     !Array.isArray(draft.files)||draft.files.length!==2)return false;
  const seen=new Set();
  for(const step of draft.steps){
    if(!keys(step,['id','action','acceptance'])||!printable(step.id,40)||
       step.id!=='build'||seen.has(step.id)||
       !printable(step.action,900)||!printable(step.acceptance,900))return false;
    seen.add(step.id);
  }
  return draft.files.every((f,i)=>keys(f,['path','content'])&&
    f.path===['app.mjs','test/app.test.mjs'][i]&&typeof f.content==='string'&&
    !!f.content.trim()&&f.content.length<=20000&&!f.content.includes('\u0000'))&&
    draft.files.reduce((n,f)=>n+Buffer.byteLength(f.content,'utf8'),0)<=32768;
}
