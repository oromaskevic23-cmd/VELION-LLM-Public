// Runs only synthetic cases through an explicitly supplied chat service.
import {createHash} from 'node:crypto';
import {intelligenceCases, scoreIntelligenceCase} from './intelligence-cases.mjs';

export const SUITE_ID = 'velion-intelligence-development-20-v1';
export const SUITE_SHA256 = createHash('sha256').update(JSON.stringify(intelligenceCases)).digest('hex');

export async function runIntelligenceSuite(service) {
  if (!service || typeof service.chat !== 'function') throw TypeError('CHAT_SERVICE_REQUIRED');
  const results = [];
  for (const item of intelligenceCases) {
    try {
      const response = await service.chat(structuredClone(item.messages), {signal:AbortSignal.timeout(90000)});
      const answer = response?.answer;
      results.push({id:item.id, kind:item.kind, answer, passed:scoreIntelligenceCase(item, answer), receipt:response?.receipt ?? null});
    } catch (error) {
      const code = typeof error?.code === 'string' && /^[A-Z0-9_]{1,80}$/.test(error.code) ? error.code : 'MODEL_REQUEST_FAILED';
      results.push({id:item.id, kind:item.kind, error:code, passed:false, receipt:null});
    }
  }
  return {
    suite:SUITE_ID, suiteSha256:SUITE_SHA256, executedAt:new Date().toISOString(),
    scoredPassed:results.filter(r => r.kind !== 'manual' && r.passed === true).length,
    scoredTotal:results.filter(r => r.kind !== 'manual').length,
    manualReview:results.filter(r => r.kind === 'manual' && r.passed === null).length,
    requestFailures:results.filter(r => r.error).length,
    limitations:'Source-visible synthetic development cases, not an independent benchmark, safety audit or proof of model superiority. Manual cases require human review.',
    results
  };
}
