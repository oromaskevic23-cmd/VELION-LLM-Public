# VELION × NVIDIA Nemotron 3 — Governed On-Demand Model Router

**Engineering checkpoint:** 28 October 2026  
**Model:** NVIDIA Nemotron 3 Nano 4B, official Ollama tag `nemotron-3-nano:4b`.  
**Runtime:** isolated free GitHub Actions Ubuntu CPU runner, local-only Ollama container.

## What this actually enables

A real, testable, code-level VELION Model Router can accept two **fixed source-reviewed task IDs**, each tagged with its intended origin. Both route through the real installed model and produce a provenance-bound, bounded JSON proposal:

| Task ID | Origin | Capability | Action allowed |
| --- | --- | --- | --- |
| `IC-CONSTRUCTOR-ORDER-001` | `CONSTRUCTOR_AI` | `code:review` | proposal only |
| `IC-NCA-HTTP429-001` | `NCA` | `incident:triage` | proposal only |

The origin label alone is **not** an identity credential. A task can only be accepted if its **entire envelope** matches the exact reviewed, immutable Python catalog. Any attempt to change the prompt, origin, model, permission, data classification or task ID is rejected. No arbitrary external prompts or customer data are allowed.

**Review sources:** [Model Router](../src/velion_model_router.py), [offline security tests](../tests/test_velion_model_router.py), [real-model runner](../scripts/velion_router_demo.py), [GitHub Actions workflow](../.github/workflows/velion-governed-nemotron-router.yml).

## Execution chain

```
Repository-reviewed task catalog
  → VELION task envelope validation
  → Expected model and local weight digest verification
  → Local-only Ollama generation (NVIDIA Nemotron 3 Nano 4B)
  → JSON parsing and deterministic independent decision checks
  → Non-executable proposal with input/output SHA-256 and token count
  → Seven-day JSON artifact and complete GitHub Actions run evidence
```

This is a **bounded provider bridge**, not the general-purpose VELION inference API. It cannot execute model-generated code, write to Supabase, edit GitHub, send messages, operate a browser, move funds, use credentials or dispatch NCA. Human Approval Gateway, a real AI Passport, scoped runtime authentication, signed tasks, anti-replay and sandbox isolation remain required for any future customer-facing task execution.

## How to run

When this workflow is on `main`, open the repository Actions tab and select **VELION — Verified On-Demand Nemotron Model Router → Run workflow**. Every run starts a temporary local CPU container, downloads the actual model, evaluates the two reviewed samples, emits evidence and destroys its container. An ordinary GitHub Actions runner **is not a 24/7 free LLM server**; no claim of persistent production availability is made.

**FREE_ONLY:** no new paid services, Val Town, key collection, third-party customer outreach or real token payments.

## Proof expectations

The initial code and offline tests are already source-controlled. Real execution must be judged exclusively from the GitHub Actions job and evidence artifact:

- `VERIFIED_PROPOSAL_ONLY` per origin: model generated a response that passed independent checks and had real token counts.
- `FAILED_CLOSED`: invalid weights, malformed or unsafe model output, missing tokens or uncontrolled input. No simulated success.
- `PASS` only when **both** task routes succeeded. No inference from unit tests to production readiness.

This is an integration step toward CONSTRUCTOR AI and Nano Core Agents. **It does not mean that their separate deployed applications or NCA fleet have been connected, authorized or activated.**


## Verified real-model result — 28 October 2026

**Second real run: PASS.** [GitHub Actions run 40682366852](https://github.com/oromaskevic23-cmd/VELION-LLM-Public/actions/runs/40682366852) completed successfully with **24/24 offline tests** and **2/2 actual model-routed proposals**.

- `IC-CONSTRUCTOR-ORDER-001` (`CONSTRUCTOR_AI`): `ORDER_LOSS` → `PRESERVE_INSERTION_ORDER`; **38** genuine generated tokens. Exact output SHA-256: `538cd7582027c2eb9735c886662ef90e7dc7f6f4e79bfa803768bc9c48fcc86a`.
- `IC-NCA-HTTP429-001` (`NCA`): `RATE_LIMIT` → `BACKOFF_WITH_JITTER`; **39** genuine generated tokens. Exact output SHA-256: `12323b443e8d6b607e99045c802390becbe07d123a410aaf00ce5d7f45704500`.
- Saved evidence artifact: `velion-governed-nemotron-router-evidence`, [run attachment](https://github.com/oromaskevic23-cmd/VELION-LLM-Public/actions/runs/40682366852), artifact archive SHA-256 `0e4a895ea013cbf222503a87e34bc312e450be9bf2255c32375b6b0987f70062`. Artifact retention through 4 November 2026.
- Initial live run [40682044177](https://github.com/oromaskevic23-cmd/VELION-LLM-Public/actions/runs/40682044177) correctly **FAILED CLOSED 0/2** because Nemotron did not return the exact required JSON keys. The task prompt was revised to show the exact JSON example; independent schema enforcement was **not relaxed**.
- Verified environment: official model weights installed; local-only Ollama CPU container; explicit job cleanup. No private data and no paid provider.

**Truth boundary:** This confirms VELION can safely *route two reviewed task fixtures* to an external NVIDIA model and independently validate non-executable proposals. It **does not** prove that existing deployed CONSTRUCTOR AI or NCA clients can submit arbitrary authenticated tasks, or that an always-on API and full production model router have been launched.
