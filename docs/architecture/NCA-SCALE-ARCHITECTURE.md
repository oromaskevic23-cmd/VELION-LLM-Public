# VELION NCA Scale Architecture — Nano Core Agent (NCA) Scale Model

Status: SPECIFIED / PLANNED

This document records the public target architecture and verification gating for Nano Core Agents (NCA). It does NOT claim that any target scale (1K–1M NCAs) is currently deployed, funded, or live-verified unless explicit evidence is provided and linked.

Definitions and truth taxonomy

- NCA = Nano Core Agent (plural: Nano Core Agents)
- CURRENT_VERIFIED_FLEET — number of NCAs with verifiable live evidence
- TARGET_CAPACITY — intended/planned capacity for architecture and design
- DESIGN_CAPACITY — capacity implied by design assumptions
- SIMULATED_CAPACITY — capacity demonstrated in simulation tests
- DEPLOYED_CAPACITY — capacity actually deployed in runtime environments (requires evidence)
- LIVE_VERIFIED_CAPACITY — capacity verified by independent evidence in live operation

Canonical security laws

- Identity != Authority
- Capability != Approval
- Intelligence != Privilege
- Default: DENY BY DEFAULT

1. Overview

NCA are governed, capability-scoped AI execution units within the VELION architecture. They must operate under a governed lifecycle: IDENTITY → CAPABILITY → TASK → POLICY → EXECUTION → TEST → EVIDENCE → MEMORY.

This document provides:
- a canonical NCA identity schema
- a public scale taxonomy (S1–S6)
- per-scale class guidance for orchestration, compute, memory, network, scheduling, observability, isolation, security, evidence, cost controls, and human approval boundaries
- dynamic allocation principles
- anti-fabrication rules to prevent phantom agents
- hierarchical orchestration topology
- failure domain design
- hierarchical memory model
- provider-independent model routing
- economic efficiency controls
- observability and metric aggregation
- security considerations at scale
- evidence-gated roadmap and testing plan

2. Canonical NCA lifecycle

MISSION_INPUT → MEMORY_BOOTSTRAP → COMPLEXITY_ASSESSMENT → TASK_GRAPH → CAPACITY_ESTIMATION → NCA_SELECTION → CAPABILITY_ROUTING → EXECUTION → TEST → EVIDENCE → SCALE_DECISION → SYNTHESIS → MEMORY_COMMIT

3. NCA identity schema (minimum fields)

- NCA_ID (UUID)
- NCA_CLASS (e.g., classifier, summarizer, orchestrator-helper)
- ROLE
- DOMAIN
- ORCHESTRATOR
- RUNTIME_DOMAIN
- CAPABILITY_SET (list)
- POLICY_PROFILE (reference)
- MISSION_ID
- TASK_ID
- EXECUTION_STATE (registered / allocated / executing / succeeded / failed / quarantined)
- MODEL_PROVIDER (if applicable)
- MEMORY_SCOPE
- APPROVAL_SCOPE
- EVIDENCE_STATE (none / collected / verified)
- HEARTBEAT (timestamp)
- CREATED_AT
- LAST_EXECUTION_AT

Notes: Identity does not grant authority. Approval scopes and policy profiles explicitly govern any privilege granting.

4. Scale taxonomy (public)

- S1 — Micro Team: 1–10 NCA
  - Use case: single specialist task group
- S2 — Specialist Fleet: 11–100 NCA
- S3 — Large Governed Fleet: 101–1,000 NCA
- S4 — Distributed Fleet: 1,001–10,000 NCA (target)
- S5 — Massive Distributed Fleet: 10,001–100,000 NCA (target)
- S6 — Planetary-Scale Target Architecture: 100,001–1,000,000 NCA (target)

For each scale class the repository documents the following template guidance (examples and quantitative estimates to be added in implementation-specific documentation):
- orchestration requirements: hierarchical, federated controllers, local autonomy with global policy constraints
- compute requirements: per-NCA baseline vCPU/GPU and aggregate reserves
- memory requirements: per-NCA working set, tiered memory, evidence/log retention
- network requirements: bandwidth/latency SLAs, partitioning by region/provider
- scheduling requirements: decentralized schedulers, local leases, leader-election timeouts tuned per scale
- observability requirements: aggregated metrics, sampling/aggregation strategies, trace retention policies
- failure isolation: provider/runtime isolation, NCA quarantine, circuit breakers
- security requirements: least privilege, short-lived credentials, signed evidence
- evidence requirements: link every live count to evidence artifacts
- cost controls: task/token budgets, quotas, backpressure
- human approval boundaries: thresholds for human sign-off and escalation paths

5. Dynamic NCA allocation principle

Principle: SMALLEST SUFFICIENT VERIFIED TEAM

Scale-out only when justified by:
- parallelizable workload
- dependency graph
- latency target
- specialization requirement
- verified bottleneck
- redundancy requirement
- evaluation demand

Scale-in when excess capacity is not required.

6. Anti-fabrication rules (No phantom agents)

- ALLOCATED_NCA != EXECUTING_NCA
- EXECUTING_NCA != SUCCESSFUL_NCA
- SUCCESSFUL_NCA != VERIFIED_NCA
- REGISTERED_NCA != LIVE_NCA
- TARGET_CAPACITY != DEPLOYED_CAPACITY
- SIMULATED_CAPACITY != LIVE_CAPACITY

All dashboard numbers must be labeled with their evidence category (e.g., CURRENT_VERIFIED_FLEET, SIMULATED_CAPACITY, TARGET_CAPACITY).

7. Hierarchical / federated orchestration topology

- ARCHITECT → HANTER → FEDERATED ORCHESTRATOR-DIRECTORS → RUNTIME DOMAINS → FLEET CONTROLLERS → NCA GROUPS → INDIVIDUAL NCA

HANTER: Chief Systems — AI Command Center / Deputy to the Architect. HANTER coordinates system-level intelligence and state but must NOT be a global execution orchestrator.

ORION remains ADVISORY_ONLY.

8. Failure domains and resilience

Design for:
- provider failure isolation
- runtime failure isolation
- NCA quarantine
- circuit breakers
- retry budgets
- dead-letter queues
- idempotency
- leases and task ownership
- duplicate execution prevention
- split-brain prevention
- backpressure and rate limiting
- degraded operation modes
- regional/provider failover
- evidence preservation

9. Memory hierarchy and rules

- NCA LOCAL MEMORY → TEAM MEMORY → RUNTIME DOMAIN MEMORY → VELION MEMORY → CANONICAL CONTINUITY MEMORY
- Memory must be scoped, versioned, provenance-aware, conflict-aware, auditable
- Memory does not grant authority
- PRIVATE_IMPLEMENTATION_BOUNDARY must be used to mark private memory/implementation details

10. Model routing and provider independence

TASK → CAPABILITY_REQUIREMENTS → MODEL_POLICY → PROVIDER_HEALTH → COST/LATENCY_POLICY → MODEL_SELECTION → EXECUTION → VERIFICATION

Do NOT claim proprietary model ownership or distributed model weights without explicit evidence.

11. Economic efficiency controls

- Task budgets, token budgets, compute budgets
- Concurrency limits, provider quotas
- Caching, deduplication, batching
- Smallest-sufficient-model routing and smallest-sufficient-team routing
- Idle shutdown and scale-to-zero
- Authorized financial execution paths only

12. Observability at scale

Aggregate metrics (examples):
- registered_nca, allocated_nca, executing_nca, blocked_nca, verified_nca, failed_nca, quarantined_nca
- tasks_ready, tasks_claimed, tasks_completed, tasks_failed
- evidence_pass, evidence_fail
- provider_health, queue_latency, execution_latency, cost_per_task, verification_rate, failure_rate

Aggregation dimensions: provider, region, runtime, orchestrator, domain, mission, capability, model

13. Security at scale

- DENY BY DEFAULT
- least privilege, capability-scoped execution
- short-lived authorization and credential isolation
- signed/traceable evidence and audit trails
- NCA quarantine and provider isolation
- human approval for high-impact operations

14. Roadmap gates (evidence-gated)

- GATE S3: Verified 1,000-NCA fleet control (evidence required)
- GATE S4: 10,000-NCA simulation → controlled deployment → evidence
- GATE S5: 100,000-NCA simulation → distributed stress testing → controlled deployment → evidence
- GATE S6: 1,000,000-NCA simulation → infrastructure & security qualification → economic feasibility → evidence

Gate advances require verifiable evidence, not mere documentation.

15. Testing and evaluation plan

Simulated and live tests for each gate measuring:
- scheduler throughput, queue latency, task completion rate
- duplicate execution rate, failure recovery
- memory consistency, provider failover
- evidence throughput, observability overhead
- cost projection and security isolation

Label simulation outputs as SIMULATED and live experiments as LIVE_VERIFIED.

16. Authorship and canonical identity

- Architect: Alexander Romaskevich / Александр Николаевич Ромаскевич — Founder • Owner • CEO of IMPERIAL Core; Architect / Final Architectural Decision Authority
- Public signature: RomaskevicH
- Do NOT assign “Chief Systems” to Alexander Romaskevich
- HANTER: Chief Systems — AI Command Center / Deputy to the Architect

17. Validation checklist

- Markdown lint
- Internal link validation
- Secret-pattern scan
- License/NOTICE consistency
- Canonical identity verification
- HANTER role verification
- Public/private boundary verification
- No claims of live 1M NCAs

18. Evidence and audit requirements

Every live fleet number must be backed by evidence: ID lists, timestamps, audit logs, sampled traces. If evidence is absent, label counts as TARGET_CAPACITY or SIMULATED_CAPACITY.

Appendix A — Example NCA JSON identity schema

```
{
  "nca_id": "uuid-v4",
  "nca_class": "summarizer",
  "role": "team-helper",
  "domain": "data-processing",
  "orchestrator": "fleet-controller-1",
  "runtime_domain": "us-east-1",
  "capability_set": ["summarize","extract"],
  "policy_profile": "restricted-v1",
  "mission_id": "mission-123",
  "task_id": "task-456",
  "execution_state": "registered",
  "model_provider": "provider-a",
  "memory_scope": "team",
  "approval_scope": "none",
  "evidence_state": "none",
  "heartbeat": "2026-08-29T00:00:00Z",
  "created_at": "2026-08-29T00:00:00Z",
  "last_execution_at": null
}
```
