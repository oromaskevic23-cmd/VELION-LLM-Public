// Project author and founding architect: Alexander Nikolaevich Romaskevich (RomaskevicH).
// Offline, bounded report reviewer; does not authorize production or execute generated code.
import {readFile} from 'node:fs/promises';
import {evaluateIntelligenceEvidence} from './intelligence-quality-gate.mjs';

async function readJson(path) {
  if (typeof path !== 'string' || !path.trim()) throw Error('EVIDENCE_PATH_REQUIRED');
  const raw = await readFile(path);
  if (raw.length > 1024 * 1024) throw Error('EVIDENCE_FILE_TOO_LARGE');
  return JSON.parse(raw.toString('utf8'));
}

try {
  if (process.argv.length < 3 || process.argv.length > 4) throw Error('USAGE_REPORT_AND_OPTIONAL_REVIEW');
  const report = await readJson(process.argv[2]);
  const review = process.argv[3] ? await readJson(process.argv[3]) : null;
  const result = evaluateIntelligenceEvidence(report,review);
  console.log(JSON.stringify(result,null,2));
  if (result.status !== 'DEVELOPMENT_REVIEW_COMPLETE_NOT_AUTHORIZED') process.exitCode = 2;
} catch(error) {
  console.log(JSON.stringify({schema:'velion_quality_gate_v1',status:'INVALID_EVIDENCE',
    reason: error?.code === 'ENOENT' ? 'EVIDENCE_NOT_FOUND' :
      ['USAGE_REPORT_AND_OPTIONAL_REVIEW','EVIDENCE_FILE_TOO_LARGE','EVIDENCE_PATH_REQUIRED'].includes(error?.message)
      ? error.message : 'EVIDENCE_READ_OR_PARSE_FAILED',
    release:'DENIED',productionAuthorized:false,ownerApprovalGranted:false},null,2));
  process.exitCode=2;
}
