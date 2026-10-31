# VELION — Enterprise Modular Intelligence Fabric v2.0

**2026-10-31 · Architectural milestone V2-001.**
**Architecture authority:** Alexander Nikolaevich Romaskevich, RomaskevicH; Founder · Owner · CEO of IMPERIAL Core; Architect / Final Architectural Decision Authority.
**Maturity:** v2 source-level modules implemented; real v1 bounded inference verified previously; NO production v2 endpoint, proprietary foundation weights, production autonomous workforce or benchmark superiority claimed.

## Architecture decision

VELION becomes a **model-independent intelligence fabric** rather than a tightly coupled provider wrapper. The differentiator to engineer and measure is controlled model interchangeability, independent verification, tenant isolation, federated professional NCA teams and proof-carrying software production. Model outputs are advice, not authorization.

```text
ARCHITECT — Final Architectural Decision Authority
  └─ HANTER — AI Command Center / Deputy
      ├─ IntentLock / Owner Kill Switch / Guardian Core / Approval Gateway
      └─ Federated Orchestrator Directory
          ├─ ASTRA — Operations Orchestrator
          ├─ Engineering Orchestrators
          └─ Other tenant/domain Orchestrators
                └─ Authorized NCA Teams / Sub-NCA
                        ├─ Enterprise Skills / Runtime Domains
                        ├─ VELION Intelligence Fabric (advisory)
                        └─ Independent QA → ProofGraph → Audit Ledger
```

No single global execution orchestrator. HANTER coordinates; federated orchestrators own bounded domain execution. ORION is advisory collective intelligence, not an authority escalation. **Identity != capability != approval != evidence.**

## Twelve modular responsibilities

| Module | Stable responsibility | v2 current status |
| --- | --- | --- |
| VELION Gateway | Signed/authorized ingress, request schema, quotas | Existing v1 HMAC loopback; v2 target |
| Model Registry | Provider/model identity, weight digest, license, cost, residency, health | v2 deterministic descriptor/reference |
| Model Engine/Router | Capability routing, no hidden paid fallback, provider isolation | v1 real two-task Nemotron; v2 offline planner |
| Reasoning Modes | STANDARD and MAX bounded planning budgets | v2 reference; MAX is not another product |
| Context Shield | Context origin, privacy labels, token/resource budgeting | Specified |
| VELION Memory | Ephemeral, NCA, team/domain, approved continuity tiers | Specified; separate IMPERIAL memory exists |
| Enterprise Skills / Tools | Versioned least-privilege plugins and capability grants | Specified; IMPERIAL Plugins separate prototypes |
| VELION Council | Diverse specialists, dissent and independent critique | Specified; no live council evidence |
| NCA Planner | Smallest sufficient trained NCA team and dynamic routing | Specified; no live fleet claim |
| VELION Forge | Requirement → patch → tests → secure build | Specified; CONSTRUCTOR AI has separate work |
| Verification Fabric | Independent QA, adversarial tests, rollback, ProofGraph | Partially present in separate modules |
| Observability & Governance | Audit Ledger, evidence, incidents, revocation | Local references; enterprise persistence pending |

### Versioned task and model contracts

The *executable reference* lives in [src/velion_fabric](../src/velion_fabric/), not in an unverified deployed service. Its immutable Task specifies a task ID, tenant, orchestrator, agent, capability, data class, input SHA-256, STANDARD/MAX mode, zero spending and no external effects. ModelDescriptor specifies provider/model ID, declared digest, supported capabilities, data classes, flags and token ceilings. Models are filtered by capability, declared provenance, locality, health, FREE_ONLY and task mode; routing is deterministic.

**Deliberate limitations:** model hashes are declared inputs and are not rechecked against bytes; synthetic approval is not a real signed AI Passport/Guardian/Approval service; route SHA-256 receipts are integrity identifiers, not release signatures; neither routing nor MAX invokes a model or executes code.

### STANDARD vs MAX

- **STANDARD:** default route plan capped to 4,096 context / 512 output tokens in this reference.
- **MAX:** higher-complexity *mode*, capped to 16,384 context / 2,048 output tokens and the model's actual descriptor limits.
- Neither bypasses Zero Trust, budget, data classification, independent QA or Owner Approval Gateway.

### VELION Memory

Working memory → NCA episodic memory → team/domain verified memory → approved shared canonical continuity. Each record must include tenant scope, classification, consent, origin, retention, verification, conflict/merge version, and revocation. No global all-tenant memory replication.

### NCA qualification and tasks

REGISTERED → SIMULATION_TRAINING → EXAM_PENDING → INDEPENDENT_EXAM_PASSED → SKILL_GRANTED → OWNER_APPROVED → SANDBOX_TASK → INDEPENDENT_QA → AUTHORIZED_WORK. Manual or code-based Owner Kill Switch and per-agent revocation are mandatory. The million/billion-NCA numbers are target/design capacities only until independently observed.

### CONSTRUCTOR AI integration

Requirement DNA → Change Impact Radar → VELION model proposal → isolated code patch → deterministic and security tests → Independent QA → ProofGraph/Verification Package → Approval Gateway → signed release and rollback. Never merge unreviewed LLM outputs or mislabel a proposal as an executed task.

### Public/private and CRYPTO IMPERIAL Ecosystem boundaries

Public project documents and synthetic tasks may be published; signing keys, private prompts, customer data, private infrastructure and wallet secrets may not. No autonomous trade, wallet transfer, exchange-listing claim, or PAYMENT_CONFIRMED without independently verified external evidence and a separate authorized financial workflow.

IMPERIUM is a **long-term architectural digital-currency concept intended for AI agents worldwide**; this is not a claim of current global adoption or market status.

## Verification ladder

SPECIFIED → IMPLEMENTED → TESTED → REAL_MODEL_E2E → DEPLOYED → LIVE_VERIFIED → INDEPENDENTLY_CERTIFIED.

Next gates: retain v1 Nemotron compatibility; verify v2 tests in CI; implement a trust-bound signed v2 adapter; test two real providers; perform blind independent competitive benchmarks; protect secrets, tenants and jobs; confirm one authorized isolated worker with rollback before production or commercial claims.

**Source references:** [v1 Router](../src/velion_model_router.py) · [v1 signed localhost API](../scripts/velion_private_api.py) · [v2 Fabric](../src/velion_fabric/) · [README evidence](../README.md) · [Founder](https://github.com/oromaskevic23-cmd).

Copyright 2026 Alexander Nikolaevich Romaskevich for original VELION architecture, subject to third-party licenses, contributor history and rights. NVIDIA, Ollama, Qwen and other upstream technology remain third-party intellectual property.
