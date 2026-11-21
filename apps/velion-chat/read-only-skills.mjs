// VELION ⚡️ — bounded deterministic Enterprise Skill reference.
// Author: Alexander Nikolaevich Romaskevich (RomaskevicH).
// Public, local, read-only reference. No eval, FS, network, model, payment, or side effects.
// This is NOT Guardian Core, Approval Gateway, AI Passport or independent Audit Ledger.
import { createHash } from 'node:crypto';

export const CALCULATOR_SKILL_ID = 'arithmetic.v1';
const MAX_EXPRESSION_LENGTH = 96;
const MAX_DIGITS = 12;
const MAX_TOKENS = 48;
const MAX_NESTING = 8;
const MAX_RESULT_DIGITS = 80;
const deny = code => { throw Object.assign(new Error(code), { code }); };
const sha256 = data => createHash('sha256').update(data).digest('hex');

function gcd(a, b) {
  while (b !== 0n) [a, b] = [b, a % b];
  return a < 0n ? -a : a;
}
function rational(numerator, denominator = 1n) {
  if (denominator === 0n) deny('CHAT_SKILL_DIV_ZERO');
  if (denominator < 0n) { numerator = -numerator; denominator = -denominator; }
  const common = gcd(numerator, denominator);
  const n = numerator / common, d = denominator / common;
  if (n.toString().replace('-', '').length > MAX_RESULT_DIGITS ||
      d.toString().length > MAX_RESULT_DIGITS)
    deny('CHAT_SKILL_RESOURCE_LIMIT');
  return { n, d };
}
function apply(a, op, b) {
  if (op === '+') return rational(a.n * b.d + b.n * a.d, a.d * b.d);
  if (op === '-') return rational(a.n * b.d - b.n * a.d, a.d * b.d);
  if (op === '*') return rational(a.n * b.n, a.d * b.d);
  if (op === '/') return rational(a.n * b.d, a.d * b.n);
  deny('CHAT_SKILL_INVALID_EXPRESSION');
}

export function exactArithmetic(expression) {
  if (typeof expression !== 'string' || expression.length < 1 ||
      expression.length > MAX_EXPRESSION_LENGTH || !/^[0-9+\-*/()\s]+$/.test(expression))
    deny('CHAT_SKILL_INVALID_EXPRESSION');
  const tokens = expression.match(/\d+|[()+\-*/]/g) ?? [];
  if (!tokens.length || tokens.length > MAX_TOKENS ||
      tokens.some(token => /^\d+$/.test(token) && token.length > MAX_DIGITS))
    deny('CHAT_SKILL_RESOURCE_LIMIT');
  let offset = 0;
  function factor(depth) {
    if (depth > MAX_NESTING) deny('CHAT_SKILL_RESOURCE_LIMIT');
    const token = tokens[offset++];
    if (token === '+' || token === '-') {
      const value = factor(depth + 1);
      return token === '-' ? rational(-value.n, value.d) : value;
    }
    if (token === '(') {
      const value = expressionParser(depth + 1);
      if (tokens[offset++] !== ')') deny('CHAT_SKILL_INVALID_EXPRESSION');
      return value;
    }
    if (token && /^\d+$/.test(token)) return rational(BigInt(token));
    deny('CHAT_SKILL_INVALID_EXPRESSION');
  }
  function term(depth) {
    let value = factor(depth);
    while (tokens[offset] === '*' || tokens[offset] === '/') {
      const op = tokens[offset++];
      value = apply(value, op, factor(depth));
    }
    return value;
  }
  function expressionParser(depth) {
    let value = term(depth);
    while (tokens[offset] === '+' || tokens[offset] === '-') {
      const op = tokens[offset++];
      value = apply(value, op, term(depth));
    }
    return value;
  }
  const result = expressionParser(0);
  if (offset !== tokens.length) deny('CHAT_SKILL_INVALID_EXPRESSION');
  return result.d === 1n ? result.n.toString() : result.n + '/' + result.d;
}

export function executeReadOnlySkill({ skillId, userText } = {}) {
  // Explicit user slash-command only. Model-generated text is never a permit.
  if (skillId !== CALCULATOR_SKILL_ID || typeof userText !== 'string' ||
      !userText.startsWith('/calc ') || userText.length > 103)
    deny('CHAT_SKILL_INVALID');
  const expression = userText.slice(6);
  const value = exactArithmetic(expression);
  const answer = 'Exact result: ' + value;
  return Object.freeze({
    answer,
    skillReceipt: Object.freeze({
      skillId: CALCULATOR_SKILL_ID,
      category: 'DETERMINISTIC_LOCAL_READ_ONLY',
      authorization: 'EXPLICIT_USER_COMMAND_AND_LOCAL_OPT_IN',
      execution: 'PURE_ARITHMETIC_ONLY',
      externalEffects: 'NONE',
      inputSha256: sha256(expression),
      outputSha256: sha256(answer),
      receiptTrust: 'UNSIGNED_LOCAL_EPHEMERAL',
    }),
  });
}
