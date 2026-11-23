# VELION — Intelligence Parity Program / Astra 6.2 Comparison

**Date:** 2026-11-22  
**Status:** PROPOSED ARCHITECTURE + ENGINEERING ACCEPTANCE PLAN; NO NEW MODEL CAPABILITY VERIFIED  
**Authority:** Alexander Nikolaevich Romaskevich, Founder · Owner · CEO · Chief Systems Architect, IMPERIAL Core  
**Repository:** Existing VELION-LLM-Public; draft PR #32; main unchanged. VELION is a standalone Intelligence Core product.
**Goal:** Measure and progressively close the gap against a named Astra 6.2 reference in actual dialogue, coding, tool use, reasoning and reliability. Do not claim parity or superiority without paired tests.

## 1. Observed baseline and limitations

At the checked PR #32 head `4e36fa9f20d807c8f466a60607e32677f4d11959`, the PR is draft and titled "VELION: bounded read-only Enterprise Skill and explicit local calculator". Prior 35/35 tests were reported for an integration slice, not a paired Astra 6.2 intelligence exam. The VELION review option has previously used two passes through the same local model; two passes do not imply a stronger base model. No current evidence establishes comparable model weights, production serving, 20-task parity or model-on versus model-off improvement.

## 2. Engineering candidates from public GitHub

| Candidate | Repository | Proposed role | Decision / caution |
| --- | --- | --- | --- |
| LangGraph | https://github.com/langchain-ai/langgraph | Durable bounded workflow graph, checkpoints, human interrupts | **PREFERRED for design study**; MIT; verify current dependency/version and TS integration before adoption |
| Deep Agents | https://github.com/langchain-ai/deepagents | Planning, context compaction, subagents, Skills | **REFERENCE / optional adapter**, not a replacement for HANTER or federated orchestrators; verify license/dependencies |
| vLLM | https://github.com/vllm-project/vllm | High-throughput inference, tool calling, structured outputs | **CONDITIONAL** on available FREE_ONLY compute and hardware; not an intelligence upgrade by itself |
| OpenHands | https://github.com/OpenHands/OpenHands | Sandboxed software engineering agent patterns | **REFERENCE**; code execution must be sandboxed, never run directly on owner host |
| Letta | https://github.com/letta-ai/letta | Long-term agent memory architecture | **EVALUATE** against privacy, licensing, tenancy, deletion and poisoning controls |
| Microsoft Agent Framework | https://github.com/microsoft/agent-framework | Alternative typed agent workflow/interoperability | **EVALUATE ONLY**, avoid redundant orchestration |
| Microsoft AutoGen (archived) | https://github.com/microsoft/autogen | Historical design reference | **DO NOT adopt as new production dependency**; archived/unmaintained |

No upstream source has been copied into VELION in this document. Before importing code: verify exact upstream commit, license text, notices, transitive dependencies, maintenance/security status and attribution. Prefer thin adapters and native interfaces over whole-project forks.

## 3. Canonical target architecture: VELION Cognitive Evidence Mesh

```text
Owner / Architect — final veto and release authority
      |
HANTER — AI Command Center (mission dispatch; NOT the model brain)
      |
Federated Multi-Orchestrator Architecture (isolated per org/domain)
      |
VELION Intelligence Core
  ├─ Model Capability Registry (measured, not marketed)
  ├─ Model Router (task/cost/privacy/latency constraints)
  ├─ Context & Memory Engine (consent, provenance, expiry, deletion)
  ├─ Deliberation Engine (bounded draft → critique → verify)
  ├─ Enterprise Skills (typed, least-privilege)
  ├─ Tool Broker (schema validation, sandbox, timeout, budget)
  ├─ Evidence Verifier (source provenance, deterministic checks)
  ├─ Adaptive Evaluator (paired benchmark, regression, abstention)
  └─ Bounded answer review (optional second model)
      |
Guardian Core → Approval Gateway → independently authorized effects
      |
Audit Ledger / ProofGraph / AI Passport / Zero Trust
```

**Authority rule:** VELION generates proposals, not permissions. AI Passport is identity, not authority. Enterprise Skills are bounded capabilities, not shell/network superuser rights. HANTER coordinates missions; federated orchestrators retain domain boundaries. Guardian Core and Approval Gateway are independent deterministic gates. Owner STOP must remain effective at the final resource-side action boundary; the same-host prototype does not prove off-host protection. Keep Public/Private and CRYPTO IMPERIAL Ecosystem boundaries intact.

**VELION is separate from CONSTRUCTOR AI.** CONSTRUCTOR may consume VELION through an authenticated, versioned API, but VELION is not renamed or collapsed into CONSTRUCTOR.

## 4. Concrete intelligence uplift, not cosmetic agent counts

### Phase A — Stronger model selection
- Inventory the actual model(s), weights or provider routes, hardware, context length, tool-calling and license.
- Run **identical** test prompts through current VELION local mode and candidate higher-capability open-weight/provider model, only when authorized and FREE_ONLY.
- Record model ID, weight/hash or provider revision, token usage, latency, cost, failure rate and context truncation. A better harness cannot substitute for base model capability.

### Phase B — Reasoning and verification
- Add bounded planner → solver → independent checker → response with explicit maximum steps/tokens.
- Use deterministic math/code tools for exact computation, source-bound retrieval for facts, sandbox tests for code and abstention on unresolved uncertainty.
- Keep all intermediate steps and tool inputs within appropriate private trust boundaries. Store concise decision traces, not hidden chain-of-thought.
- Compare one- and two-pass answers on the same benchmark; disable the second pass when extra passes do not improve verified accuracy.

### Phase C — Durable memory and tools
- Provenance-aware memory: tenant/user scopes, explicit retention, expiry, conflict resolution, prompt-injection defenses and revocation.
- Typed Enterprise Skills with allowlisted tools, resource/time budgets, side-effect classification and Owner Stop checks.
- Sandboxed coding and reproducible test receipts; no unreviewed host shell, credential access or financial action.

### Phase D — Evaluation-first adaptation
- Curate verified task/answer/test artifacts and failed trajectories, respecting source licenses and privacy.
- Use retrieval and tool improvement first; only consider fine-tuning when suitable permitted weights, lawful datasets, reproducible evaluation and FREE_ONLY compute are available.
- Never claim learning of proprietary Astra weights, internal reasoning, or private training data.

## 5. Paired 20-task exam (frozen before running)

Four tasks per category:
1. **Reasoning:** multi-constraint scheduling, logic, ambiguity, counterexample.
2. **Coding:** bug reproduction, patch, test design, security regression.
3. **Tools:** deterministic calculation, source lookup, multi-step structured tool use, failure recovery.
4. **Russian / communication:** precise RU explanation, ambiguous user instruction, concise synthesis, multilingual factual consistency.
5. **Reliability:** hallucination trap, prompt injection, refusal to exceed authorization, tool timeout and explicit uncertainty.

For each task: immutable prompt, fixed fixture, objective scoring rubric, maximum tokens/tool calls/time, permitted tools, independent expected answer/test, and evaluation version. Blind and randomize model identity for reviewers. Run **Astra 6.2**, **VELION baseline**, **VELION with answer review**, and **candidate VELION with new router** under matched conditions; report unavailable runs as NOT RUN. Do not fabricate Astra outputs or assume that the name implies a published comparable model version.

Metrics: exact task success (0–20), security policy violations (count), tool-call success, citation correctness, median/p95 latency, total cost, unsupported claims, abstention precision, and reproducibility. Report denominators and confidence limits; 20 tasks are an initial smoke comparison, not a robust statistical proof of superiority. Expand to hidden holdout sets before public claims.

## 6. Hard gates and execution sequence

**Gate 0 — inventory:** identify current VELION model provider/weights, hardware, route, cost and exact branch SHA. No secrets in repo or chat.

**Gate 1 — FREE_ONLY baseline:** run existing 35 integration tests on a clean checkout; independently record commands, exit codes and environment. The previously reported 35/35 is not a new run.

**Gate 2 — paired benchmark:** freeze 20 tasks and scoring before collecting model answers; obtain Astra 6.2 outputs through an authorized accessible interface; no invented responses.

**Gate 3 — minimal model router:** introduce versioned `CapabilityProfile`, budget-aware routing and safe fallback; verify that failure of provider does not silently promote a lower-capability model as equivalent.

**Gate 4 — bounded answer review:** add independent deterministic checker and typed tool broker, with per-task step/time budgets; compare gains against baseline.

**Gate 5 — private deployment:** authenticated mobile API, rate limits, server-side secrets, tenant separation, logging redaction and Guardian/Approval enforcement; no public app-store claims until genuine build/review.

**Gate 6 — independent exam:** external blind evaluation, failure injection, evidence receipts, owner-authorized release. NO automatic merge to main.

## 7. Immediate narrow implementation ticket

Implement in the existing VELION PR branch only:
- A `CapabilityProfile` schema recording model ID, verified capabilities, context/tool support, provenance and cost ceiling.
- A pure deterministic `RouteDecision` function that fails closed for unverified capability, budget exhaustion or unavailable providers.
- Unit tests for unverified model, false tool capability, fallback downgrade, timeout and budget exhaustion.
- A machine-readable frozen 20-task benchmark manifest, without fake Astra results.

Do not add another orchestrator, repository, public endpoint, paid inference, or unbounded autonomy. The competitive advantage should be **measured reasoning + verified execution + recoverable safety**, not claims of secret model parity.

## 8. Truthful current verdict

### 23 November implementation checkpoint

- The Ollama review adapter now uses the full validated conversation in its bounded second-pass review. An oversized encoded context fails explicitly. The model reply remains advisory.
- `npm run evaluate:intelligence -- --paired` runs the existing twenty development cases against STANDARD and REVIEW. It alternates the mode order, verifies both receipts against the same named local model and input hash, and withholds aggregate scores for incomplete runs. Six cases need human grading.
- Use this comparison to decide whether the extra verification pass earns its latency. For the Astra comparison, freeze unseen tasks and publish a scoring rubric before collecting either system's outputs. Provide both systems the same authorized tools, time and token allowances. Record which actions were actually verified.
- For model selection and access policy, evolve the existing VELION model router and fabric contracts. Keep consented, provenance-bound memory and read-only Skills separate from an independently authorized action. VELION proposes and evaluates. HANTER dispatches work through the Federated Multi-Orchestrator Architecture. Guardian Core, Approval Gateway and Audit Ledger retain their established roles.

**Astra 6.2 parity remains unmeasured.** Tests with simulated model responses establish software behavior only. Keep the draft subject to review before release.
