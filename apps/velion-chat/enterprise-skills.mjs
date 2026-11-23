// VELION ⚡️ / IMPERIAL Core — bounded Enterprise Skills reference.
// Author: Alexander Nikolaevich Romaskevich (RomaskevicH).
//
// Scope: a SINGLE deterministic LOCAL read-only arithmetic skill. This is
// NOT the production Enterprise Skills gateway, AI Passport, Guardian Core,
// Approval Gateway, Audit Ledger, or proof of human/Owner authorization.
// Never runs user-provided code or invokes models, files, network or payments.
import { createHash } from 'node:crypto';

export const SKILL_ID = 'velion.arithmetic.exact_v1';
export const LOCAL_TENANT = 'velion-local';
const REQUEST_KEYS = ['arguments', 'clientConsent', 'skill', 'tenant'];
const ARGUMENT_KEYS = ['left', 'operation', 'right'];
const OPERATIONS = ['add', 'subtract', 'multiply', 'divide_with_remainder'];
const DECIMAL = /^(?:0|[1-9][0-9]{0,17}|-[1-9][0-9]{0,17})$/;
const denied = () => Object.assign(new Error('SKILL_REQUEST_DENIED'), { code: 'SKILL_REQUEST_DENIED' });
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const exactKeys = (value, keys) =>
  value !== null && typeof value === 'object' && !Array.isArray(value) &&
  Object.keys(value).sort().join('|') === keys.slice().sort().join('|');

function decimal(value) {
  if (typeof value !== 'string' || !DECIMAL.test(value)) throw denied();
  return BigInt(value);
}

/** Accepts a client's explicit consent declaration, NOT a verified identity or approval. */
export function runReadOnlySkill(input) {
  if (!exactKeys(input, REQUEST_KEYS) ||
      input.skill !== SKILL_ID ||
      input.tenant !== LOCAL_TENANT ||
      input.clientConsent !== true ||
      !exactKeys(input.arguments, ARGUMENT_KEYS) ||
      !OPERATIONS.includes(input.arguments.operation)) throw denied();

  const { operation, left, right } = input.arguments;
  const a = decimal(left), b = decimal(right);
  if (operation === 'divide_with_remainder' && b === 0n) throw denied();

  let value;
  if (operation === 'add') value = { integer: (a + b).toString() };
  if (operation === 'subtract') value = { integer: (a - b).toString() };
  if (operation === 'multiply') value = { integer: (a * b).toString() };
  if (operation === 'divide_with_remainder') {
    value = { quotient: (a / b).toString(), remainder: (a % b).toString() };
  }
  const canonicalInput = JSON.stringify([SKILL_ID, LOCAL_TENANT, operation, left, right]);
  const canonicalResult = JSON.stringify(value);
  return {
    schema: 'velion-local-skill-result-v1',
    skill: SKILL_ID,
    tenant: LOCAL_TENANT,
    result: value,
    receipt: {
      inputSha256: sha256(canonicalInput),
      outputSha256: sha256(canonicalResult),
      clientDeclaredConsent: true,
      execution: 'LOCAL_DETERMINISTIC_READ_ONLY',
      externalSideEffects: false,
      toolNetworkAccess: false,
      filesystemAccess: false,
      approvedByGuardian: false,
      ownerApprovalGranted: false,
      aiPassportAuthenticated: false,
      auditScope: 'UNSIGNED_RESPONSE_ONLY',
      productionRelease: 'NOT_AUTHORIZED',
    },
  };
}
