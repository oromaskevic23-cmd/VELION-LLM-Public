// Explicit, CPU-only local quality probe; no customer data or external provider.
import { ggufServiceFromEnv } from '../native-gguf/gguf-chat.mjs';
import { qualityCases, scoreQualityAnswer } from './gguf-quality-cases.mjs';

if (process.env.IMPERIAL_CHAT_LOCAL_ONLY !== 'YES' || process.env.VELION_LOCAL_BACKEND !== 'gguf')
  throw Error('Explicitly enable the local GGUF backend before running this evaluation.');

const service = await ggufServiceFromEnv();
const results = [];
try {
  for (const item of qualityCases) {
    try {
      const response = await service.chat([{role:'user', content:item.prompt}], {signal:AbortSignal.timeout(90000)});
      results.push({...item, answer:response.answer, passed:scoreQualityAnswer(item.id, response.answer), receipt:response.receipt});
    } catch (error) {
      results.push({...item, error:String(error?.code || error?.message || error), passed:item.id === 'no_internet' ? null : false});
    }
  }
} finally {
  await service.dispose();
}
const scored = results.filter(result => result.passed !== null);
const passed = scored.filter(result => result.passed === true).length;
console.log(JSON.stringify({
  status:passed === scored.length ? 'SCOPED_CHECKS_PASSED' : 'SCOPED_CHECKS_NOT_PASSED',
  date:new Date().toISOString(), modelSha256:process.env.VELION_GGUF_SHA256,
  scoredPassed:passed, scoredTotal:scored.length,
  limitations:'Synthetic one-run checks only; not an independent audit, safety evaluation, general benchmark or model comparison. The no-internet response requires manual review.',
  results,
}, null, 2));
if (passed !== scored.length) process.exitCode = 1;
