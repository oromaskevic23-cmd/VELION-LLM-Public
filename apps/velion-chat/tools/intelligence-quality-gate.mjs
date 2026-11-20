// Project author and founding architect: Alexander Nikolaevich Romaskevich (RomaskevicH).
// Development evidence consistency and human-review gate. No model execution or release rights.
import {createHash} from 'node:crypto';
import {intelligenceCases,scoreIntelligenceCase} from './intelligence-cases.mjs';

const hash = text => createHash('sha256').update(text).digest('hex');
const hex64 = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const suiteSha = hash(JSON.stringify(intelligenceCases));
const suiteId = 'velion-intelligence-development-20-v1';
const result = (status, details = {}) => Object.freeze({
  schema:'velion_quality_gate_v1', status, release:'DENIED', productionAuthorized:false,
  independentQAAttested:false, ownerApprovalGranted:false,
  reviewAuthority:'UNSIGNED_DEVELOPMENT_OBSERVATION_ONLY', ...details
});
const reject = reason => result('INVALID_EVIDENCE', {reason});

export function evaluateIntelligenceEvidence(report, adjudication = null) {
  if (!report || typeof report !== 'object' || Array.isArray(report) ||
      report.suite !== suiteId || report.suiteSha256 !== suiteSha ||
      typeof report.executedAt !== 'string' || !Number.isFinite(Date.parse(report.executedAt)) ||
      !Array.isArray(report.results) || report.results.length > intelligenceCases.length)
    return reject('REPORT_SCHEMA_OR_SUITE_MISMATCH');
  const reportSha256 = hash(JSON.stringify(report));
  if (!report.completed || report.results.length !== intelligenceCases.length ||
      report.requestFailures !== 0 || report.scoredTotal !== 14 || report.manualReview !== 6 ||
      report.scoredAttempted !== 14)
    return result('BLOCKED_INCOMPLETE', {reportSha256});
  let strictPassed = 0;
  let modelId = null;
  for (let i = 0; i < intelligenceCases.length; i++) {
    const expected = intelligenceCases[i];
    const row = report.results[i];
    if (!row || row.id !== expected.id || row.kind !== expected.kind ||
        typeof row.answer !== 'string' || !row.answer.trim() || row.answer.length > 4000 ||
        row.error !== undefined)
      return reject('RESULT_MISSING_OR_MISORDERED');
    const originalScore = scoreIntelligenceCase(expected,row.answer);
    if (row.passed !== originalScore)
      return reject('REPORTED_SCORE_INCONSISTENT');
    if (originalScore === true && expected.kind !== 'manual') strictPassed++;
    const receipt=row.receipt;
    if (!receipt || typeof receipt !== 'object' || !hex64(receipt.inputSha256) ||
        receipt.inputSha256 !== hash(JSON.stringify(expected.messages)) ||
        receipt.outputSha256 !== hash(row.answer) ||
        receipt.toolAccess !== 'NONE' || receipt.approval !== 'NOT_GRANTED' ||
        receipt.outcome !== 'MODEL_RESPONSE_RECEIVED' ||
        !['ollama-local','llama-cpp-local'].includes(receipt.provider) ||
        typeof receipt.requestedModel !== 'string' || !receipt.requestedModel ||
        receipt.returnedModel !== receipt.requestedModel)
      return reject('RECEIPT_INCONSISTENT_OR_MISSING');
    if (modelId !== null && receipt.requestedModel !== modelId) return reject('MIXED_MODEL_IDS');
    modelId=receipt.requestedModel;
  }
  if (report.scoredPassed !== strictPassed) return reject('SCORE_TOTAL_INCONSISTENT');
  const baseline={reportSha256,modelId,scoredPassed:strictPassed,scoredTotal:14,manualTotal:6};
  if (strictPassed !== 14) return result('BLOCKED_SCORED_FAILURE',baseline);
  if (adjudication === null) return result('BLOCKED_MANUAL_PENDING',{
    ...baseline,manualReviewed:0,manualPending:6,manualFailed:[]
  });
  if (!adjudication || typeof adjudication !== 'object' || Array.isArray(adjudication) ||
      adjudication.schema !== 'velion_manual_adjudication_v1' ||
      adjudication.suiteSha256 !== suiteSha || adjudication.reportSha256 !== reportSha256 ||
      !Array.isArray(adjudication.reviews) || adjudication.reviews.length > 6)
    return reject('REVIEW_NOT_BOUND_TO_REPORT');
  const manualIds = new Set(intelligenceCases.filter(x=>x.kind==='manual').map(x=>x.id));
  const reviewed = new Set(), failures=[];
  for (const entry of adjudication.reviews) {
    if (!entry || typeof entry !== 'object' || !manualIds.has(entry.id) || reviewed.has(entry.id) ||
        !['PASS','FAIL'].includes(entry.verdict) ||
        typeof entry.reason !== 'string' || entry.reason.trim().length < 20 || entry.reason.length > 1000)
      return reject('REVIEW_INVALID_DUPLICATE_OR_UNREASONED');
    const answer = report.results.find(x=>x.id===entry.id).answer;
    if (entry.answerSha256 !== hash(answer)) return reject('REVIEW_ANSWER_HASH_MISMATCH');
    reviewed.add(entry.id);
    if (entry.verdict === 'FAIL') failures.push(entry.id);
  }
  const summary={...baseline,manualReviewed:reviewed.size,
    manualPending:6-reviewed.size,manualFailed:failures};
  if (failures.length) return result('BLOCKED_MANUAL_FAILURE',summary);
  if (reviewed.size < 6) return result('BLOCKED_MANUAL_PENDING',summary);
  return result('DEVELOPMENT_REVIEW_COMPLETE_NOT_AUTHORIZED',summary);
}
