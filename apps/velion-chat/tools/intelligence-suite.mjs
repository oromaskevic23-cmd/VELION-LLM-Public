// Runs only synthetic cases through an explicitly supplied chat service.
import {createHash} from 'node:crypto';
import {intelligenceCases, scoreIntelligenceCase} from './intelligence-cases.mjs';

export const SUITE_ID = 'velion-intelligence-development-20-v1';
export const SUITE_SHA256 = createHash('sha256').update(JSON.stringify(intelligenceCases)).digest('hex');
const digest = value => createHash('sha256').update(value).digest('hex');

async function runCase(service, item, responseMode) {
  const options = {signal:AbortSignal.timeout(90000)};
  if (responseMode) options.responseMode = responseMode;
  const response = await service.chat(structuredClone(item.messages), options);
  const answer = response?.answer;
  return {id:item.id, kind:item.kind, answer, passed:scoreIntelligenceCase(item, answer),
    receipt:response?.receipt ?? null};
}

function requestError(error) {
  return typeof error?.code === 'string' && /^[A-Z0-9_]{1,80}$/.test(error.code)
    ? error.code : 'MODEL_REQUEST_FAILED';
}

export async function runIntelligenceSuite(service) {
  if (!service || typeof service.chat !== 'function') throw TypeError('CHAT_SERVICE_REQUIRED');
  const results = [];
  for (const item of intelligenceCases) {
    try {
      results.push(await runCase(service, item));
    } catch (error) {
      results.push({id:item.id, kind:item.kind, error:requestError(error), passed:false, receipt:null});
      // Do not burn resources by repeating requests after a provider failure.
      break;
    }
  }
  return {
    suite:SUITE_ID, suiteSha256:SUITE_SHA256, executedAt:new Date().toISOString(),
    scoredPassed:results.filter(r => r.kind !== 'manual' && r.passed === true).length,
    scoredTotal:intelligenceCases.filter(item => item.kind !== 'manual').length,
    scoredAttempted:results.filter(r => r.kind !== 'manual').length,
    manualReview:results.filter(r => r.kind === 'manual' && r.passed === null).length,
    requestFailures:results.filter(r => r.error).length,
    completed:results.length === intelligenceCases.length && !results.some(r => r.error),
    limitations:'Source-visible synthetic development cases, not an independent benchmark, safety audit or proof of model superiority. Manual cases require human review.',
    results
  };
}

function pairedModel(result, item, mode, expectedModel) {
  const receipt = result.receipt;
  const model = receipt?.requestedModel;
  if (receipt?.provider !== 'ollama-local' || typeof model !== 'string' || !model ||
      model !== receipt.returnedModel || (expectedModel && model !== expectedModel) ||
      receipt.responseMode !== mode || receipt.modelCalls !== (mode === 'MAX' ? 2 : 1) ||
      receipt.inputSha256 !== digest(JSON.stringify(item.messages)) ||
      typeof result.answer !== 'string' || receipt.outputSha256 !== digest(result.answer) ||
      receipt.toolAccess !== 'NONE' || receipt.approval !== 'NOT_GRANTED') {
    throw Object.assign(Error('Invalid or incomparable local chat receipt'), {code:'PAIRED_RECEIPT_INVALID'});
  }
  return model;
}

export async function runPairedIntelligenceSuite(service) {
  if (!service || typeof service.chat !== 'function') throw TypeError('CHAT_SERVICE_REQUIRED');
  const pairs = [];
  let failure = null;
  let model = null;
  for (const [index, item] of intelligenceCases.entries()) {
    const modeOrder = index % 2 ? ['MAX', 'STANDARD'] : ['STANDARD', 'MAX'];
    const pair = {id:item.id, kind:item.kind, modeOrder};
    for (const mode of modeOrder) {
      try {
        const result = await runCase(service, item, mode);
        model = pairedModel(result, item, mode, model);
        pair[mode] = result;
      } catch (error) {
        failure = {id:item.id, mode, error:requestError(error)};
        break;
      }
    }
    if (failure) break;
    pairs.push(pair);
  }
  const automatic = pairs.filter(pair => pair.kind !== 'manual');
  const standardPassed = automatic.filter(pair => pair.STANDARD.passed === true).length;
  const maxPassed = automatic.filter(pair => pair.MAX.passed === true).length;
  const completed = pairs.length === intelligenceCases.length;
  return {
    suite:SUITE_ID, suiteSha256:SUITE_SHA256, executedAt:new Date().toISOString(),
    provider:'ollama-local', model, completed, failure,
    expectedPairs:intelligenceCases.length, completedPairs:pairs.length,
    scoredPairs:automatic.length,
    manualPairs:pairs.length - automatic.length,
    scores:completed ? {standardPassed, maxPassed, difference:maxPassed - standardPassed} : null,
    limitations:'Source-visible development cases. Six cases require manual review. This run does not compare Astra or establish model superiority.',
    pairs,
  };
}
