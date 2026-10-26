# VELEON — Real LLM Execution Gate / Cloud-first / FREE_ONLY

Date: 2026-10-26.
Architect and final authority: Alexander Romaskevich / RomaskevicH.

**VELEON is the LLM project. MAX is only one mode of VELEON, not the model name.** The historic repository URL VELION-LLM-Public is retained.

**Evidence: guarded serverless code and local mocked tests. Provider-live inference, deployment, and independently trained VELEON weights are NOT VERIFIED.**

## Architecture

Owner iPhone browser -> authenticated Netlify Function -> fixed approved free provider endpoint -> untrusted model text proposal -> SHA-256 receipt.

The entry point is netlify/functions/veleon-inference.mjs and imports the existing src/cloud-free-gateway.mjs. It can make a real Groq HTTP request if and only if separately deployed and supplied with actual authorized server-only credentials. It does not confer tool, payment, release, website editing, shell, background job, or agent authority.

MAX is a provisional mode profile: it permits an ANALYSIS request routed to the allowlisted Groq model openai/gpt-oss-120b. An unlabeled request uses openai/gpt-oss-20b. Both are third-party model weights, NOT trained or owned VELEON checkpoints. This model choice is an engineering hypothesis, not a verified performance increase.

Preserve federated Multi-Orchestrator Architecture, AI Passport, Enterprise Skills, Guardian Core, Approval Gateway, Audit Ledger, Zero Trust, Public/Private Boundary and CRYPTO IMPERIAL Ecosystem Boundary. Identity != authority; capability != approval. Do not send private IMPERIAL Core materials to remote free model APIs.

## Secure server environment, never commit secrets

- VELEON_OWNER_TOKEN: high-entropy token, minimum 40 ASCII characters, owner-only pilot.
- VELEON_GROQ_API_KEY: genuine provider API key, server-side only.
- VELEON_ALLOWED_ORIGIN: exact approved HTTPS browser origin.
- VELEON_FREE_ENTITLEMENT_CONFIRMED: true ONLY after an actual owner free-plan confirmation.
- VELEON_PAID_BILLING_DISABLED_CONFIRMED: true ONLY after billing safety confirmation.
- VELEON_GROQ_MODEL: optional allowlisted ordinary model ID.
- VELEON_GROQ_MODEL_MAX: optional allowlisted MAX model ID.

The two *_CONFIRMED flags are **operator declarations**, not provider billing or quota attestations. This prototype has no distributed quota meter or production mobile login UX. It is NOT safe to release to untrusted end users or unattended fleets. GitHub Actions is not an always-on inference server. Do not put the token into mobile public JavaScript, URL parameters or chat.

## Endpoint and example

HTTP POST /.netlify/functions/veleon-inference; Content-Type application/json; Authorization: Bearer [owner secret]; browser Origin must match the allowlist.

Example body (public prompt only):

    {
      "missionId": "VELEON-DEMO-0001",
      "task": "ANALYSIS",
      "mode": "MAX",
      "dataClassification": "PUBLIC",
      "prompt": "Draft a bounded non-confidential engineering analysis."
    }

Omit mode for ordinary GENERAL, CODE, ANALYSIS or RESEARCH_DRAFT requests. Other mode names denied until Architect approval. Response remains proposal-only: execution NOT_RUN, QA NOT_RUN, release DENIED. No paid fallback. HTTP 429 is an explicit limit error, no retry.

GET route discloses only generic status: serverless gateway present does not mean verified model or live inference.

## Acceptance gates

1. E2 source and local tests: 17/17 isolated tests PASS against simulated provider responses; this is not provider-live proof.
2. E3 run current GitHub CI on exact feature-branch commit and verify all tests with no skips.
3. E4 perform a separately owner-authorized real provider request, using server-secret custody, and record model ID, response hash, actual usage, quota and billing evidence. Mark BLOCKED if not available.
4. Owned VELEON model: approve lawful base weights, training data lineage/license, reproducible fine-tuning configuration, train a checkpoint on verified free compute, hash weights, load in independent real inference, compare to base model. None of these milestones is proved by this gateway.
5. E5/E6 durable quotas, authentication, audit, external security QA, mobile UX, release evidence and production approvals before any deployment claim.

No Val Town changes. No paid service calls. No production merge without review.
