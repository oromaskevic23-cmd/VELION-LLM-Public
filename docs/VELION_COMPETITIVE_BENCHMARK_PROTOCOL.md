# VELION — Independent Competitive Benchmark Protocol

**Status:** PRE-REGISTERED DESIGN ONLY, no superiority result. Competitors: Claude Code, Codex, Cursor, Google Antigravity and additional licensed coding agents at their contemporaneous versions. Names/trademarks belong to their owners.

## Fair test design (proposed 100 cases)

| Domain | Frozen cases | Objective acceptance |
| --- | ---: | --- |
| Bug repair | 20 | hidden regression + reviewer |
| Full-stack feature | 15 | functional acceptance |
| Refactoring and migration | 15 | equivalence/rollback |
| Security and prompt injection | 15 | unauthorized action denial |
| APIs, integrations, n8n | 10 | versioned contract tests |
| Incident triage/reliability | 10 | verified cause and fix |
| Provenance/documentation | 5 | sources and attribution |
| Long-horizon/context | 10 | correct recovery and completion |
| Total | 100 | independent frozen graders |

Use rights-cleared tasks; identical resource allowances when possible; published model/version dates, model and source revision hashes, run budgets, repeat seeds and failure cases. Grade verified completion, residual defects, security incidents, p50/p95 verified latency, cost per accepted task, recovery and audit integrity **separately**. Pre-register exclusions, use genuinely independent holdout graders, never cherry-pick. An LLM's marketing benchmark is not proof of VELION v2 quality.

B0: independently reviewed dataset → B1: reproducible actual VELION code execution → B2: adversarial evaluation → B3: blind comparison → B4: external replication. **Current status: design only.** Five-year lead or universal superiority is NOT established.
