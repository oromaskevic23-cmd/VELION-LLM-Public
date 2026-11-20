// Project author and founding architect: Alexander Nikolaevich Romaskevich (RomaskevicH).
// Operator-initiated real inference. Never downloads weights or calls paid APIs.
import {randomBytes} from 'node:crypto';
import {createLocalChatService} from '../chat-service.mjs';
import {intelligenceCases, scoreIntelligenceCase} from './intelligence-cases.mjs';
import {BOLT_MODEL_ID, checkLocalBolt} from './nemotron-bolt-preflight.mjs';

if (process.env.VELION_BOLT_SMOKE_CONSENT !== 'YES' || process.env.IMPERIAL_CHAT_LOCAL_ONLY !== 'YES') {
  console.error('BOLT_SMOKE_NOT_AUTHORIZED');
  process.exitCode = 2;
} else {
  try {
    const inventory = await checkLocalBolt();
    const service = createLocalChatService({accessToken:randomBytes(32).toString('base64url'),model:BOLT_MODEL_ID});
    const results=[];
    for (const id of ['inventory','json_object','context']) {
      const test = intelligenceCases.find(item=>item.id===id);
      try {
        const response = await service.chat(structuredClone(test.messages), {signal:AbortSignal.timeout(90000)});
        results.push({id,passed:scoreIntelligenceCase(test,response.answer),answer:response.answer,receipt:response.receipt});
      } catch (error) {
        results.push({id,passed:false,error:typeof error?.code==='string'?error.code:'BOLT_INFERENCE_FAILED'});
        break; // avoid repeated compute after failure
      }
    }
    const report={suite:'velion-nemotron-bolt-local-smoke-v1', at:new Date().toISOString(),
      model:inventory, completed:results.length===3, passed:results.filter(x=>x.passed===true).length,
      possible:3, results, release:'NOT_AUTHORIZED',
      note:'Live model smoke on three source-visible cases only. Not production/safety/voice performance certification.'};
    console.log(JSON.stringify(report,null,2));
    if (report.passed!==3) process.exitCode = 1;
  } catch (error) {
    console.error(typeof error?.code==='string'?error.code:'BOLT_PREFLIGHT_FAILED');
    process.exitCode = 2;
  }
}
