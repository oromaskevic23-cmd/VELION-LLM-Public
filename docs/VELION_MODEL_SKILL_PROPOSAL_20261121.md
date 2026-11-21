# VELION ⚡️ — Model-assisted Enterprise Skill proposals (no execution)

**Date:** 2026-11-21  
**Author / authority:** Alexander Nikolaevich Romaskevich (RomaskevicH), Founder · Owner · CEO · Chief Systems Architect of IMPERIAL Core  
**Repository:** `oromaskevic23-cmd/VELION-LLM-Public`  
**Working branch:** `codex/velion-enterprise-skills-readonly-20261121`; draft PR #32 stacked on `main`  
**Source snapshot used for final test run:** code commit `1c8c277cf48d2f2e1ee38e2992b16acb08816986`  
**Status:** developer-tested local proposal-only prototype; **not** autonomous Enterprise Skills or Astra 6.2 parity

## Executable implementation

An explicitly user-triggered form in **Settings → VELION · suggest a Skill** sends a bounded plain-language task (3–300 characters) to an authenticated localhost endpoint, `POST /api/skills/propose`. That endpoint asks the existing locally configured Ollama or GGUF chat adapter for **one non-executing model proposal**.

The accepted model reply is a plain JSON object with **exactly** the following schema:

```json
{
  "skill": "velion.arithmetic.exact_v1",
  "tenant": "velion-local",
  "arguments": {
    "operation": "add",
    "left": "12",
    "right": "3"
  }
}
```

The dedicated `skill-proposal.mjs` parser rejects invalid or duplicated JSON members, unsupported skills, different tenants, tool or privilege fields, invalid numeric strings, zero divisors, non-JSON/Markdown, oversized answers and malformed model receipts. It copies only allowlisted primitive values into the result. Neither the model prompt nor JSON fields are an authorization channel.

A valid response is marked `PROPOSAL_ONLY` and has an unsigned receipt with SHA-256 hashes of the task, raw model text and sanitized proposal, plus:

- `execution: NOT_EXECUTED`;
- `clientConsent: false`;
- `humanConfirmationRequired: true`;
- `guardianApproved: false`, `approvalGatewayApproved: false`;
- `aiPassportAuthenticated: false`, `independentReview: false`;
- `auditScope: UNSIGNED_RESPONSE_ONLY`;
- `productionRelease: NOT_AUTHORIZED`.

**The proposal intentionally lacks the `clientConsent: true` field required by the existing separate manual `/api/skills/run` calculator**, and has an incompatible top-level schema. Posting the proposal directly to the executor is denied. There is no callback or internal code path from model inference to skill execution.

The browser shows the proposed operation/operands only with `textContent` and a prominent **NOT EXECUTED** warning. It does **not** auto-fill the calculator, implicitly approve, change the chat transcript, write to persistent memory or trigger arbitrary local/remote actions.

## Threat boundary and important non-claims

- Authentication/transport: one already-configured localhost bearer token, exact loopback Host/Origin, JSON content type and maximum 2,048-byte HTTP request. This is local development authentication, **not** independently verified user identity, AI Passport or Zero Trust production IAM.
- Model proposal: one bounded, local model call through the existing chat adapter, with global chat mutex/timeout, no arbitrary tool APIs, no network fallback besides the separately operated local Ollama endpoint. **Tests used synthetic fake model replies.** Actual model inference from this feature was **NOT RUN**.
- Content accuracy: `operation`, `left`, `right` are schema-checked but **NOT semantically proven** to correspond to the task. The model may misunderstand or hallucinate numbers. Independent human review is required before a separate manual calculation.
- Model output is untrusted. Prompt constraints can fail; code-level allowlists are the actual enforcement boundary for this one skill. Arbitrary model skill proposals and enterprise permissions are **NOT** supported.
- Receipts are **not signed**, durable, tamper-resistant or owner-authorized. No production Guardian Core, Approval Gateway, Audit Ledger, Owner Kill Switch, cross-tenant authority, independent execution gateway, payment, email, filesystem, browser automation or external enterprise action is enabled.
- This is **not** a validated quality improvement, Astra 6.2 feature-equivalence result, independently audited release, iPhone/Safari acceptance or public hosted VELION service.

## Actual source-verified execution

A disposable free Node.js **v22.23.4** VM received exactly **17 source, test and UI asset files** directly from the linked GitHub repository. Before execution it recomputed and verified the canonical Git blob SHA-1 of **every file**, including the original binary PNG assets. The temporary working directory was removed after execution.

Commands actually executed:

```sh
node --check skill-proposal.mjs
node --check server.mjs
node --check public/app.mjs
node --test test/chat.test.mjs test/max-mode.test.mjs \
  test/enterprise-skills.test.mjs test/skill-proposal.test.mjs
```

Results:

| Verification | Observed |
| --- | --- |
| 17 Git blob SHA-1 checks | 17/17 matched GitHub |
| JavaScript syntax | 3/3 exit 0 |
| Existing chat regression | 10/10 |
| Existing VELION MAX regression | 8/8 |
| Manual read-only Enterprise Skill regression | 7/7 |
| New model proposal regression | 10/10 |
| **Combined Node test run** | **35/35 PASS, exit 0, no skips** |

Captured combined-test stdout SHA-256:

```text
a3733a842a3e2f1005c092d58a7ab55bac5122c9718c4c9ec66b198d51462de3
```

Stderr stream was empty, SHA-256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`.

The new tests exercise authentic localhost HTTP request/response behavior (with **mocked model inference**), exact schema acceptance, privilege-field attacks, duplicate JSON member rejection, tenant scope, forged model receipts, model outage, abort, authentication, malicious Origin/Host, oversized payload, and direct refusal to execute the returned proposal.

### Failed intermediate attempts, corrected before final passing run

1. The initial proposal endpoint used an accidentally over-escaped JavaScript content-type regular expression; Node returned a syntax error. The server reused the existing verified MIME regex in commit `1313f34e81b8341713bd875e72536488091bab57`.
2. The first runnable 10-case suite returned **9/10 PASS**, revealing that plain `JSON.parse` silently accepted duplicate JSON keys. The fail-closed duplicate-field check was added in commit `8cffa0f1b6859bb5612f3a467c2f4848d78075b6`, and the exact tests then passed **10/10**, followed by the comprehensive **35/35**.

No hidden errors were promoted as PASS and no runtime production claim is made.

## Next acceptance gates

1. Run true local model inference and test whether proposals match unseen human-authored task requirements (correct operator, operands, disambiguation, false-positive refusal and prompt-injection resilience).
2. Verify the new visible form and its text-only preview in real Chromium and iPhone Safari, including accessibility and abort behavior.
3. Before any *model-originated* task execution, engineer an independent, non-bypassable, signed authorization path involving AI Passport, Guardian Core, Approval Gateway, immutable Audit Ledger and Owner Stop, preserving the Federated Multi-Orchestrator Architecture.
4. Run externally graded quality and latency comparisons against a specific inspectable Astra 6.2 environment. No parity figure can currently be substantiated.

**Architecture → Implementation → Integration → Verification → Evidence → Release.** Current position: bounded developer-verified proposal interface only; production release NOT AUTHORIZED.
