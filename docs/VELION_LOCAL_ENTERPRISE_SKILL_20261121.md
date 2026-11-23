# VELION ⚡️ — Local read-only Enterprise Skill: exact arithmetic

**Date:** 21 November 2026  
**Authority / authorship:** Alexander Nikolaevich Romaskevich (RomaskevicH), Founder · Owner · CEO · Chief Systems Architect of IMPERIAL Core  
**Scope:** stand-alone VELION chat prototype; temporary development branch `codex/velion-enterprise-skills-readonly-20261121`  
**Status:** executable synthetic-local skill and HTTP contract, **not** production Enterprise Skills, agent autonomy, or Astra 6.2 equivalence

## Implemented behavior

The VELION chat now contains a **user-triggered** calculator under **Settings → Enterprise Skills · exact calculator**. The user chooses an operation and enters two canonical signed decimal strings. On explicit form submission, the local browser calls the fixed loopback-only endpoint `POST /api/skills/run` using the same short-lived local chat session token. The result appears separately, never added to the model prompt, conversation history or browser storage.

Supported operations: `add`, `subtract`, `multiply` and `divide_with_remainder`. Each operand is a canonical signed base-10 integer string of up to **18 digits**; no exponent notation, leading zeros, `-0`, floats, arbitrary expressions, code evaluation or shell execution. Arithmetic uses JavaScript `BigInt`, and results are returned as **strings** to prevent floating-point loss.

A request requires an **exact** schema with tenant `velion-local`, skill identifier `velion.arithmetic.exact_v1`, `clientConsent: true`, and `arguments` with exactly `operation`, `left` and `right`. `clientConsent` is only a client-declared explicit-action marker; it is **NOT cryptographic user consent**, Owner authorization, FaceID, tenant IAM or an AI Passport.

Example manual API request (do not embed session tokens in source control):

```json
{
  "tenant": "velion-local",
  "skill": "velion.arithmetic.exact_v1",
  "clientConsent": true,
  "arguments": {
    "operation": "multiply",
    "left": "25",
    "right": "40"
  }
}
```

Returns an unsigned, local result with `{"integer":"1000"}` and a limited receipt. The receipt contains SHA-256 fingerprints of the canonical input/result, `LOCAL_DETERMINISTIC_READ_ONLY`, `externalSideEffects: false`, `toolNetworkAccess: false`, `filesystemAccess: false`, `approvedByGuardian: false`, `ownerApprovalGranted: false`, `aiPassportAuthenticated: false`, `auditScope: UNSIGNED_RESPONSE_ONLY`, and `productionRelease: NOT_AUTHORIZED`.

### Authentication and fail-closed controls

The endpoint is disabled unless the same explicit **local-only chat service** is configured. The HTTP server requires a loopback peer, exact local Host and Origin, a valid local bearer token, JSON content type, a **2,048-byte request limit**, and an exact allowlist of supported operations and request fields. Cross-tenant requests, foreign origins, malformed numbers, zero divisors, invalid JSON, extra keys, oversized requests and unauthorized methods are rejected.

This reference deliberately **does not allow VELION's model responses to invoke the endpoint** or execute arbitrary tools. Only the explicit browser form triggers it. The form uses `textContent` for result rendering and does not submit calculations to local model inference.

The local bearer check is a development-session boundary, not externally attested identity. A local process with access to the session token can submit the same request; there is no independent human-intent attestation. The receipt is **unsigned**; no immutable independent Audit Ledger or protected off-host Owner Authority exists.

## Exact-source verification actually executed

**Source:** GitHub branch `codex/velion-enterprise-skills-readonly-20261121` after UI commit `a791844ceb856e02d6bd41da7b1f85c105f14c92`.

A free disposable Node.js **22.23.4** VM reconstructed **15** GitHub files: the new arithmetic skill, HTTP server, existing chat and answer-review adapters, three test modules, HTML/CSS/JS assets, manifest and PNG icons. The Git canonical blob SHA-1 for each byte-for-byte file was checked against GitHub before executing. Files were deleted from the test environment afterwards.

The actual commands:

```bash
node --check enterprise-skills.mjs
node --check server.mjs
node --check public/app.mjs
node --test test/chat.test.mjs test/*-mode.test.mjs test/enterprise-skills.test.mjs
```

**Actual results:** all three syntax checks exited **0**; the integrated Node test runner reported **25 tests / 25 passed / 0 failed / 0 skipped**, exit **0**. The test-run stdout SHA-256 was:

```text
7c9b0bb01dab36180cf8ac02623ba8fe2cd0d9d2c5a6252002fd330f731122ed
```

The seven new tests include BigInt precision, negative-number division, schema and consent rejection, invalid/prototype input, disabled-service behavior, authenticated real loopback HTTP success, raw HTTP spoofed Host rejection, wrong Origin/bearer/content-type rejection and oversized-request denial. The existing 10 chat and 8 MAX local regression cases remained green.

**Failed first attempt disclosed:** the first new suite run had **6/7** passing because `fetch()` did not transmit a crafted Host header as assumed by the test. The test was corrected to use a raw `node:http` request that actually sent the malicious Host; **7/7** and integrated **25/25** subsequently passed. The HTTP server itself was not weakened to accommodate that test.

## Explicitly not verified or provided

- No trained proprietary VELION weights, real LLM quality benchmark, comparison with a verifiable Astra 6.2 release, or live GGUF/Ollama inference in this run.
- No hands-on iPhone, Safari or full-browser UI interaction test for the new Settings form. The UI was source-reviewed and syntax-checked; local real HTTP tests exercised its backend contract.
- No network, filesystem, mailbox, browsing, remote skill, payment, deployment, client data, autonomous agent tool execution or external calls.
- No production federated Multi-Orchestrator runtime, AI Passport enrollment, Guardian Core, Approval Gateway, tamper-resistant Audit Ledger, Enterprise Skill delegation, independently controlled Owner Stop, signed receipts or compliance certification.
- No production release or merge authorization. This scope is an **isolated draft change** for review, not an enterprise-security claim.

## Next engineering acceptance gates

1. Add real browser/iPhone accessibility tests for the explicit calculator form and preserve local-only behavior.
2. Introduce a **proposal-only** skill plan contract with bounded tenant/NCA intent and source-bound evidence, without executing a skill from untrusted model text.
3. Integrate independently authorized capabilities through AI Passport, Guardian Core, Approval Gateway, Audit Ledger and Owner Stop, in a Federated Multi-Orchestrator Architecture. Independent negative QA is required before enabling non-read-only actions.
4. Run a fair, unseen, independently graded VELION STANDARD/REVIEW vs a specific inspectable Astra 6.2 build; report actual task correctness, security and p50/p95 latency separately.

**Architecture → Implementation → Integration → Verification → Evidence → Release.** Current stage: developer-verified local implementation; *release not authorized*.
