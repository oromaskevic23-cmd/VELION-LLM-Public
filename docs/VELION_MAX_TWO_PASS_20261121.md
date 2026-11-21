# VELION MAX — bounded local two-pass conversation checkpoint

**Date:** 2026-11-21  
**Owner and final architectural authority:** Alexander Nikolaevich Romaskevich (RomaskevicH), Founder · Owner · CEO · Chief Systems Architect of IMPERIAL Core  
**Product:** VELION ⚡️, a standalone AI conversation product, independent of CONSTRUCTOR AI  
**Status:** implemented in source, developer-tested with mocked model responses; **not** a trained VELION model, Astra 6.2 parity, production or an independently verified quality improvement

## What was implemented

The existing VELION chat now exposes an opt-in `STANDARD` / `VELION MAX` selector in its local web interface.

- `STANDARD` (default): one inference request to an explicitly configured local Ollama or GGUF adapter, preserving the prior local chat behavior.
- `MAX`: two **sequential** inference calls to the **same** local model. First generate a draft from the bounded conversation context; then submit the latest user request and untrusted draft for a second same-model review. The user sees the final pass only.
- Both calls share **one existing request deadline**, the existing single-active-request mutex and the fixed loopback-only model transport. The second pass has a lower 768-token generation cap. The request and draft used for MAX review are each limited to 1,800 JavaScript characters; if either exceeds this limit, the call is rejected instead of being silently truncated or presented as reviewed.
- MAX cannot be combined with the fixed structured Constructor draft format; unrecognized modes and extra API keys are denied. The front end refuses to label an answer as MAX when the server receipt does not record two local model calls.
- The receipt records `responseMode`, `modelCalls`, `qualityVerified=false` and, for MAX, `reviewScope=SAME_MODEL_LOCAL_SELF_REVIEW_ONLY` and the draft SHA-256. These digests are **not signatures, independent proof or a source-of-truth judgment**.
- MAX grants **no tool access, agent authority, runtime execution, payments or approvals**, and it never uses a paid or network fallback. The review prompt marks the draft as untrusted text. This prompt is advisory, **not** a security guarantee.

### Important constraints

The same model can confidently repeat an incorrect answer, introduce an error on review, or follow prompt injection inside the draft. VELION MAX does **not** increase model weights, reasoning architecture, training quality, independent fact checking or autonomous tool capability. The additional pass consumes more local CPU and may run slower. The time budget applies to the whole two-pass attempt; if the second call fails, the adapter rejects the request instead of claiming a reviewed answer. MAX is not enabled for a real phone service or customer deployment.

## Exact test evidence (executed)

Source: owner-connected GitHub `oromaskevic23-cmd/VELION-LLM-Public`, `main`, at code commit `beaa1b7c774601a417c718be4ed4b7b22ba1c195`. **Thirteen** original source, test, HTML/CSS/JS and PNG asset blobs were downloaded through authenticated GitHub and individually checked against Git's canonical blob SHA-1 before execution in a disposable free Node.js **22.23.4** environment. The test source files were:

- `apps/velion-chat/test/chat.test.mjs`: existing local chat/API regression, 10 cases
- `apps/velion-chat/test/max-mode.test.mjs`: new MAX and Standard modes regression, 8 cases

Command:

```bash
cd apps/velion-chat
node --test test/chat.test.mjs test/max-mode.test.mjs
```

**Result:** **18/18 PASS**, no failures, no skipped tests, process exit 0. Captured stdout SHA-256:

```text
196b3e737b532ba3902d5442a67b05b5d59b1e48b36cc60020e5c0e7e956bc73
```

A prior targeted test of the new MAX module had failures that revealed two implementation mistakes (receipt referenced an out-of-scope provider response, and mode/format validation ordering). Both were corrected before the successful exact-source regression. The final result above describes the **retest after those fixes**, not a claim that the first attempt passed.

Also checked `node --check` for the changed `chat-service.mjs`, `server.mjs` and `public/app.mjs`; all returned exit 0. The tests used **synthetic mock responses and an actual local HTTP server**, not a real model inference or iPhone/browser interaction. The additional UI selector's visual/interaction QA on Safari, iPhone or Chromium remains pending.

## Road to Astra 6.2-class functionality — evidence before parity claims

The owner-defined target is an Astra 6.2-class intelligent assistant **experience**, not the renaming of Astra or copying an undisclosed architecture. Current gates:

| Capability | Verified current VELION state | Required next proof |
| --- | --- | --- |
| Multi-turn text conversation | Bounded browser conversation and local adapter | Real model quality on unseen multi-turn tasks |
| Reflective MAX replies | Two synthetic-inference passes tested, untrusted receipts | Independent accuracy and latency evaluation vs STANDARD on identical prompts |
| Tool and skill use | No tool execution in chat | Scoped, human-approved Enterprise Skills via Guardian Core, Approval Gateway and Audit Ledger |
| Long-term task memory | Browser-optional local history; no trusted durable agent memory | Explicit consent, per-tenant isolation, verifiable memory provenance and deletion |
| Voice | Turn-based browser dictation and playback | iPhone/Safari device tests and privacy review |
| Mobile app | Phone-ready web app shell | Independently authenticated HTTPS, real phone QA, app-store compliance |
| Agent orchestration | Separate architecture and bounded proposal router | Federated Multi-Orchestrator integration, AI Passport, bounded NCA tasks, Owner Stop and evidence |
| Security/release | Loopback-only prototype with no production IAM | Zero Trust, Public/Private Boundary, non-bypassable Owner control, independent security QA |

### Recommended next acceptance gates

1. Run STANDARD vs MAX on the same 20-plus **unseen** tasks with actual local model inference and identical resource constraints; record accuracy, safety, p50/p95 latency, errors, token counts and regression cases. Human review is mandatory for unverifiable or safety-critical answers.
2. Measure against **a specific verified Astra 6.2 build** only if its runnable source, settings and evaluation provenance are available. Do not invent Astra feature or benchmark data.
3. Implement **read-only** tool proposals with strict schemas and no direct side effects, then introduce approval-backed Enterprise Skills, AI Passport, Guardian Core, Approval Gateway, Audit Ledger and trustworthy Owner Stop before real execution.
4. Preserve VELION as a separate product and federated Multi-Orchestrator Architecture. Do not use CRYPTO IMPERIAL Ecosystem actions, real money, private keys, live customer data or privileged permissions during prototype testing.

**Release disposition:** local prototype only. No superiority, safe autonomy, genuine mobile production, 24/7 cloud inference, tool authorization or independent QA established.
