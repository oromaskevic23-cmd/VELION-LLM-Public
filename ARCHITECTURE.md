# Architecture (Public)

This document records the public-facing architecture for the VELION project. It describes concepts, planned components, and governance relationships. Architecture statements are documentation of intent and design; they are NOT evidence that implementations are complete or production operational.

Core conceptual components (public names):

- VELION LLM — the planned agent-native LLM subsystem (status: PLANNED / SPECIFIED)
- VELION Code — code and engineering artifacts supporting the system (status: IMPLEMENTED / TESTED)
- VELION Memory — persistence and memory management (status: PLANNED)
- VELION Network — federated runtime and communication layer (status: PLANNED)
- VELION Council — governance and policy layer (status: SPECIFIED)
- VELION Forge — build, CI/CD, and artifact generation (status: IMPLEMENTED)

Execution concept (public):

MISSION_INPUT → MEMORY_BOOTSTRAP → COMPLEXITY_ASSESSMENT → TASK_GRAPH → NCA_CAPACITY_PLAN → CAPABILITY_ROUTING → EXECUTION → TEST → EVIDENCE → SYNTHESIS → MEMORY_COMMIT

Governance model (public):

- Architect → HANTER → Federated Multi-Orchestrator Layer → Runtime Domains → governed agents/tools

NCA scale documentation

- See docs/architecture/NCA-SCALE-ARCHITECTURE.md for the VELION NCA scale taxonomy and evidence-gated roadmap. The 1,000 → 1,000,000 NCA range is a TARGET_CAPACITY and DESIGN_CAPACITY; it is not evidence of live deployment unless explicitly labeled LIVE_VERIFIED.

Notes on claims

- ARCHITECTURE != IMPLEMENTATION
- IMPLEMENTATION != TESTED
- TESTED != DEPLOYED
- DEPLOYED != LIVE_VERIFIED

Any statement implying production readiness, trained proprietary model weights, distributed live weights, AGI/superintelligence, or universal benchmark superiority is explicitly disallowed in this repository.
