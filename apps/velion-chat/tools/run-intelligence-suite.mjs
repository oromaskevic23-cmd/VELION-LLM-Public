// Explicit opt-in only. The paired Ollama run permits at most 60 inference requests.
import {localIntelligenceService} from './local-intelligence-service.mjs';
import {runIntelligenceSuite,runPairedIntelligenceSuite} from './intelligence-suite.mjs';

const args = process.argv.slice(2);
const paired = args.length === 1 && args[0] === '--paired';
if (args.length && !paired) throw Error('USAGE: npm run evaluate:intelligence -- [--paired]');
if (paired && (process.env.VELION_LOCAL_BACKEND ?? 'ollama') !== 'ollama')
  throw Error('PAIRED_INTELLIGENCE_REQUIRES_LOCAL_OLLAMA');
const service = await localIntelligenceService();
try {
  const report = await (paired ? runPairedIntelligenceSuite(service) : runIntelligenceSuite(service));
  console.log(JSON.stringify(report, null, 2));
  if (!report.completed || (!paired && report.scoredPassed !== report.scoredTotal)) process.exitCode = 1;
} finally {
  await service.dispose?.();
}
