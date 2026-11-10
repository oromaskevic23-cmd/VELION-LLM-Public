// Explicit opt-in only: this runs up to twenty local inference requests.
import {localIntelligenceService} from './local-intelligence-service.mjs';
import {runIntelligenceSuite} from './intelligence-suite.mjs';

const service = await localIntelligenceService();
try {
  const report = await runIntelligenceSuite(service);
  console.log(JSON.stringify(report, null, 2));
  if (!report.completed || report.scoredPassed !== report.scoredTotal) process.exitCode = 1;
} finally {
  await service.dispose?.();
}
