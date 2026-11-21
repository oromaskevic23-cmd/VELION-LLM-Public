# VELION ⚡️ — Enterprise Skills reference: exact local arithmetic

**Checkpoint:** 2026-11-21  
**Project:** VELION, standalone from CONSTRUCTOR AI  
**Owner:** Alexander Nikolaevich Romaskevich (RomaskevicH), Founder · Owner · CEO · Final Architectural Authority  
**Branch:** `codex/velion-readonly-enterprise-skills-20261121` (based on pre-change `main` at `9654a7a8bca6ec8af082f675161b6f0e2425d3d2`)  
**Actual source revision tested:** `d9a812093d0aac1a3fe76e453a543d4edd93c28e`  
**Status:** developer-tested local reference only. **Not merged, deployed, independently audited or security-certified.**

## Executable functionality

New `apps/velion-chat/read-only-skills.mjs` implements an exact, deterministic integer/rational calculator. It accepts only the latest user-authored `/calc EXPR` command under a fixed `arithmetic.v1` skill ID; it is NEVER selected from model output. It supports `+`, `-`, `*`, `/`, parentheses and unary signs with precedence. All arithmetic uses bounded BigInt integer numerators and denominators, so `1/3 + 1/6` returns the **exact fraction `1/2`**, not an approximation.

A user may opt in on the **local Ollama chat adapter** by setting `VELION_LOCAL_SKILLS=YES` in addition to the pre-existing local-only model and token configuration. The optional GGUF adapter is not enabled for this skill. The feature is off by default. The browser recognizes the explicit `/calc` command, and the existing localhost HTTP authentication, Origin/Host controls and bounded JSON validation still apply.

All operations are read-only and pure: no `eval`, arbitrary JavaScript execution, file access, subprocesses, network calls, agent control, account changes or financial operations. The skill cannot combine with the structured draft or MAX model mode; an explicit calculator command overrides the UI's MAX selection and uses **zero model requests** to preserve exact results. Unsupported commands, float and function syntax, overly large arithmetic, division by zero, model-initiated skill requests and write-capable tool IDs fail closed.

The response's non-persistent receipt includes the fixed skill identity, `modelCalls:0`, `toolAccess:BOUNDED_LOCAL_READ_ONLY`, `approval:NOT_GRANTED`, `externalEffects:NONE` and input/output SHA-256 hashes. These are **unsigned developer telemetry**, not an independent or tamper-proof Audit Ledger, a real AI Passport, or an Approval Gateway permit.

## Exact executed tests

In a free disposable Floot compute VM running Node.js **v22.23.4**, 15 original source, test, static HTML/CSS/JS and binary PNG files were reconstructed from the user's GitHub connector. Before execution **every file** was verified against its returned Git blob SHA-1 (canonical byte-prefix Git hashing). Sources were mounted only in a temporary directory, deleted after testing. No secrets, real customer data, production API calls or paid resources were used.

Commands issued in that source-matched directory:

```bash
node --check chat-service.mjs
node --check server.mjs
node --check read-only-skills.mjs
node --check public/app.mjs
node --test test/chat.test.mjs test/max-mode.test.mjs test/read-only-skills.test.mjs
```

**Actual result:** four syntax checks exit **0** and the combined Node test suite **25/25 PASS**, exit **0**, no skips. Captured combined test stdout SHA-256:

```text
8dc6db96b2460c34f2ef0a5bcc6f47dcb49e8b8ce0166ebd9f7788528abdd703
```

Test groups: 10 existing local chat/API cases; 8 VELION MAX regression cases; 7 new deterministic skill tests. They cover arithmetic correctness, precedence, exact rational simplification, malformed/untrusted expressions, denial of unknown capabilities, explicit opt-in, proof of zero model calls, authenticated localhost operation, cross-origin and invalid token refusal, and unchanged STANDARD/MAX behavior.

An earlier 7-test development run had **6 passed / 1 failed** due to the ordering of invalid skill/structured-format checks. The code was corrected (commit `e2f2ea9c1bcb59be094246cced9fd32b38cbb2db`); the pinned 25-test run above is the successful retest. **Do not report the earlier attempt as a PASS.**

## Trust boundaries and what remains unverified

This is **a deterministic arithmetic skill**, not a model reasoning upgrade, autonomous tool-use system, Asta/Astra 6.2 equivalence, professional calculator certification or an enterprise deployment. The local receipt is not independently signed; the local chat still does not maintain a durable Audit Ledger, independent Owner Stop enforcement, per-tenant AI Passport or integrated Guardian Core / Approval Gateway. The browser UI slash-command wiring is source-level and syntax-checked; real iPhone/Safari UX, remote HTTPS, external security assessment and full-repository CI were **not executed** in this bounded run.

The existing Federated Multi-Orchestrator Architecture and governance boundaries remain canonical: AI Passport, Enterprise Skills, Guardian Core, Approval Gateway, Audit Ledger, Zero Trust, Public/Private Boundary and CRYPTO IMPERIAL Ecosystem Boundary. No production authority is inferred from this reference.

**Next acceptance gate:** separately audited read-only skill registry with per-agent capabilities and a verifiable audit chain, then owner-approved non-read-only tools only under a real Guardian Core + Approval Gateway + durable Owner Stop. Real model/tool quality comparison against an identified Astra 6.2 build requires the same inputs, budgets and independent graders. No parity claim.

**Disposition:** PR should remain DRAFT / UNMERGED pending reviewer validation; no paid services or automatic public deployment.
