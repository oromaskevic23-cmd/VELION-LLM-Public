import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {intelligenceCases} from '../tools/intelligence-cases.mjs';
import {evaluateIntelligenceEvidence} from '../tools/intelligence-quality-gate.mjs';
const digest = value => createHash('sha256').update(value).digest('hex');
const clone = value => structuredClone(value);
function answerFor(testCase) {
  if (testCase.kind === 'manual') return 'For manual review: generated text, no tool action.';
  if (testCase.kind === 'number') return String(testCase.expected);
  if (testCase.kind === 'text') return testCase.expected;
  return JSON.stringify(testCase.expected);
}
function validReport() {
  const results = intelligenceCases.map(item => {
    const answer=answerFor(item);
    return {id:item.id,kind:item.kind,answer,
      passed:item.kind==='manual'?null:true,
      receipt:{provider:'ollama-local',requestedModel:'approved-test:local',returnedModel:'approved-test:local',
        inputSha256:digest(JSON.stringify(item.messages)),outputSha256:digest(answer),
        toolAccess:'NONE',approval:'NOT_GRANTED',outcome:'MODEL_RESPONSE_RECEIVED'}};
  });
  return {suite:'velion-intelligence-development-20-v1',
    suiteSha256:digest(JSON.stringify(intelligenceCases)),executedAt:'2026-11-20T00:00:00.000Z',
    scoredPassed:14,scoredTotal:14,scoredAttempted:14,manualReview:6,
    requestFailures:0,completed:true,results};
}
function validReview(report, overrides={}) {
  const reviews=report.results.filter(x=>x.kind==='manual').map(x=>({
    id:x.id,verdict:'PASS',answerSha256:digest(x.answer),reason:'Reviewed the synthetic response against the stated case only.'}));
  return {schema:'velion_manual_adjudication_v1',suiteSha256:report.suiteSha256,
    reportSha256:digest(JSON.stringify(report)),reviews,...overrides};
}
test('14 of 14 automatic passes are not sufficient to approve six unreviewed cases',()=>{
  const result=evaluateIntelligenceEvidence(validReport());
  assert.equal(result.status,'BLOCKED_MANUAL_PENDING');
  assert.equal(result.release,'DENIED');
  assert.equal(result.productionAuthorized,false);
  assert.equal(result.manualPending,6);
});
test('a bound manual FAIL defeats the 14/14 automated score',()=>{
  const report=validReport(),review=validReview(report);
  review.reviews.find(x=>x.id==='programming').verdict='FAIL';
  review.reviews.find(x=>x.id==='programming').reason='Source violates the requested finite-number validation contract.';
  const result=evaluateIntelligenceEvidence(report,review);
  assert.equal(result.status,'BLOCKED_MANUAL_FAILURE');
  assert.deepEqual(result.manualFailed,['programming']);
  assert.equal(result.release,'DENIED');
});
test('hash-bounded review rejects changed answers, changed reports and duplicate reviews',()=>{
  const report=validReport(),review=validReview(report);
  const modified=clone(report);
  modified.results.find(x=>x.id==='programming').answer='mutated answer';
  modified.results.find(x=>x.id==='programming').receipt.outputSha256=digest('mutated answer');
  assert.equal(evaluateIntelligenceEvidence(modified,review).status,'INVALID_EVIDENCE');
  const wrongHash=clone(review);wrongHash.reviews[0].answerSha256='f'.repeat(64);
  assert.equal(evaluateIntelligenceEvidence(report,wrongHash).status,'INVALID_EVIDENCE');
  const duplicate=clone(review);duplicate.reviews[1].id=duplicate.reviews[0].id;
  assert.equal(evaluateIntelligenceEvidence(report,duplicate).status,'INVALID_EVIDENCE');
});
test('independently recomputes strict scores, receipt hashes and task order',()=>{
  const report=validReport();
  const badScore=clone(report);badScore.results[0].answer='999';
  assert.equal(evaluateIntelligenceEvidence(badScore).status,'INVALID_EVIDENCE');
  const badReceipt=clone(report);badReceipt.results[0].receipt.outputSha256='0'.repeat(64);
  assert.equal(evaluateIntelligenceEvidence(badReceipt).status,'INVALID_EVIDENCE');
  const badOrder=clone(report);[badOrder.results[1],badOrder.results[2]]=[badOrder.results[2],badOrder.results[1]];
  assert.equal(evaluateIntelligenceEvidence(badOrder).status,'INVALID_EVIDENCE');
  const badIdentity=clone(report);badIdentity.results[0].receipt.returnedModel='different-model';
  assert.equal(evaluateIntelligenceEvidence(badIdentity).status,'INVALID_EVIDENCE');
});
test('partial reviews remain pending, even if all reviewed cases passed',()=>{
  const report=validReport(),review=validReview(report);
  review.reviews.pop();
  const result=evaluateIntelligenceEvidence(report,review);
  assert.equal(result.status,'BLOCKED_MANUAL_PENDING');
  assert.equal(result.manualPending,1);
});
test('all reviewed PASS cases still do not grant real approval or release',()=>{
  const report=validReport(),review=validReview(report);
  const result=evaluateIntelligenceEvidence(report,review);
  assert.equal(result.status,'DEVELOPMENT_REVIEW_COMPLETE_NOT_AUTHORIZED');
  assert.equal(result.productionAuthorized,false);
  assert.equal(result.ownerApprovalGranted,false);
  assert.equal(result.independentQAAttested,false);
  assert.equal(result.release,'DENIED');
});
