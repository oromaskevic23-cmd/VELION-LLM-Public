# VELION Signed Local API × CONSTRUCTOR AI — Verified Integration

**Date:** 2026-10-28  
**Mission:** Provide an authenticated, bounded VELION proposal API that existing CONSTRUCTOR AI can call without acquiring unapproved rights.  
**Status:** Real end-to-end inference PASS; ephemeral localhost deployment only.

## Verified engineering outcome

- New [VELION signed loopback API](../scripts/velion_private_api.py) listens **only** on `127.0.0.1:8765`. Public / remote binding is prohibited in code. The server accepts **POST /v1/model/proposals**, with a strictly bounded request body containing exactly `schema`, `task_id`, `origin`—no client data, arbitrary prompt or custom endpoint.
- Each request uses a separate 32+-byte **HMAC-SHA256 bridge secret** bound to HTTP method, path, timestamp, nonce, and exact body SHA-256. Requests older than 60 seconds, invalid signatures, repeated nonces and unknown tasks **fail closed**. The secrets are generated per CI run; never committed.
- API reuses [VELION's source-reviewed allowlist](../src/velion_model_router.py); `CONSTRUCTOR_AI` can only request the fixed synthetic `IC-CONSTRUCTOR-ORDER-001` task. NCA has a separate reviewed incident task. User-supplied arbitrary instructions, user data, spending, browser control, client delivery and runtime execution are not accepted.
- New CONSTRUCTOR AI [signed adapter](https://github.com/oromaskevic23-cmd/CONSTRUCTOR-AI/blob/main/engineering/velion-proposal-client.mjs) wraps the **existing single-use local HMAC draft permit** and only then submits a separate signed request to VELION. It independently validates reply origin, task, model, hash, positive generated-token count, no execution/payment and release denied. It does not replace the original Groq plan-only gateway for other missions.
- Node [cross-repository real-model smoke](https://github.com/oromaskevic23-cmd/CONSTRUCTOR-AI/blob/main/tools/velion-bridge-smoke.mjs) proves authentic local CONSTRUCTOR AI → signed VELION API → NVIDIA Nemotron 3 Nano 4B → independently verified non-executing proposal.

## Evidence (observed)

**GitHub Actions:** [VELION run 40683989519](https://github.com/oromaskevic23-cmd/VELION-LLM-Public/actions/runs/40683989519). Both jobs **SUCCESS**.

- VELION security suite: **34/34 offline tests PASS** (including HMAC signature, nonce replay, expiry, wrong origin, unknown task, private-field rejection, loopback binding and dishonest health-state detection).
- CONSTRUCTOR AI existing main CI: [run 40683871813](https://github.com/oromaskevic23-cmd/CONSTRUCTOR-AI/actions/runs/40683871813), **72/72 PASS**.
- Real model installed: `nemotron-3-nano:4b`. Actual signed CONSTRUCTOR request returned `REAL_VELION_TO_CONSTRUCTOR_BRIDGE_PASS` with **38 genuine generated tokens**.
- Actual result: `ORDER_LOSS` → `PRESERVE_INSERTION_ORDER`; exact model-output SHA-256 `538cd7582027c2eb9735c886662ef90e7dc7f6f4e79bfa803768bc9c48fcc86a`.
- Artifact from verified GitHub run `velion-signed-constructor-real-model-proof`, artifact archive SHA-256 `a71ef3511b9a928bcdc32e3aeb83cfb958d1c48ed4ec081d73b516b98a7fc35b`; expires 2026-11-04.
- The response explicitly states `release=DENIED` and `execution=NOT_RUN`. No customer or payment was created and no real software was released.

## What is NOT deployed

**No continuous 24/7 Nemotron API**, shared cross-cloud runtime, permanent public endpoint, authenticated real customers, actual live NCA fleet assignment, payment authorization or full enterprise AI Passport has been established. An ephemeral GitHub Actions CPU container is removed when the run ends. The HMAC localhost bridge is a limited engineering integration and not a substitute for production identity or isolated multi-tenant execution.

Future server activation requires a confirmed eligible FREE_ONLY host, owner-controlled secret storage, persistent runtime lifecycle, auth identity and per-task approvals, monitoring, and a repeatable 24-hour reliability observation. Render workspace has not been selected by the owner and cannot be assumed. No Val Town, no paid services.

**Operational gate:** never expose this localhost-only demo to the public internet; never forward the HMAC key to browsers, publish it in GitHub or replace it with a static key. The reviewed public synthetic task is not a real buyer assignment.
