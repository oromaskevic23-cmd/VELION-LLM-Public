// Explicit opt-in only: this runs twenty local inference requests.
import {ggufServiceFromEnv} from '../native-gguf/gguf-chat.mjs';
import {runIntelligenceSuite} from './intelligence-suite.mjs';

if (process.env.IMPERIAL_CHAT_LOCAL_ONLY !== 'YES' || process.env.VELION_LOCAL_BACKEND !== 'gguf') {
  throw Error('Explicitly enable the local GGUF backend before running this evaluation.');
}
const service = await ggufServiceFromEnv();
try {
  const report = await runIntelligenceSuite(service);
  console.log(JSON.stringify(report, null, 2));
  if (report.scoredPassed !== report.scoredTotal || report.requestFailures) process.exitCode = 1;
} finally {
  await service.dispose();
}
