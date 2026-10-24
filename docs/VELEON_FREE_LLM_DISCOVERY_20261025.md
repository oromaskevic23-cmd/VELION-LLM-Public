# VELEON — Verified Free LLM Discovery & Local Gateway v0.1

**Mission:** IC-VELEON-FREE-LLM-20261025-001  
**Date:** 2026-10-25  
**Owner:** Alexander Romaskevich / RomaskevicH  
**Classification:** PUBLIC engineering reference; proprietary mission logic/private prompts must remain in a PRIVATE repository  
**Canonical system name:** VELEON. The GitHub slug `VELION-LLM-Public` is a legacy spelling retained for stable URLs.  
**Priority:** P0 / FREE_ONLY $0 / EVIDENCE FIRST / NO VAL TOWN / Zero Trust / Fail Closed.

## 1. Actual repository and ecosystem inspection

GitHub `oromaskevic23-cmd/VELION-LLM-Public` at main `ac164c3ebf3eeef43451c72f8c090cad0cf35158` contained README and two Enterprise readiness files plus PR body; **no executable inference code, tests or CI** at the start of this mission. The 100 KB README describes architectural targets, not deployed models. Do not confuse 1B NCA identity ambition with live LLM capacity.

Related `CONSTRUCTOR-AI` contains an opt-in Groq draft gateway (`engineering/groq-gateway.mjs`), a mocked provider contract and a human-scoped local HMAC plan permit. It had no independently verified live Groq inference, operational sandbox or unrestricted actions. Do **not** duplicate provider credentials or treat a passing mock as remote inference proof. LEGION/NCA job dispatch is a separate governed layer.

**Important deprecated option:** GitHub Models playground and inference API were **fully retired on 2026-07-30**. Do not base VELEON on GitHub Models API; GitHub remains a code repository and CI platform.
Official evidence: https://github.blog/changelog/2026-07-30-github-models-is-now-retired/

## 2. Recommended model inventory, verified source pages (no vendor source copied)

| Priority | Candidate | Mode | Download/limit | Task use | Licensing / restrictions |
| --- | --- | --- | --- | --- | --- |
| P0 | `qwen3.5:4b` | Local Ollama | ~3.3–4.0 GB model; runtime + context extra | General instruction, coding, reasoning, text+image candidate | Qwen/Qwen3.5-4B model card Apache-2.0; preserve upstream credit/license |
| P0 fallback | `qwen3.5:2b` | Local Ollama | ~2.7–3.1 GB | Low-memory tasks, QA drafting and classification | Verify exact model-weight license at acquisition |
| P0 fallback | `qwen3:4b` | Local Ollama | ~2.5 GB | Lightweight text/code | Apache-2.0 original Qwen/Qwen3-4B |
| P1 alternate | `gemma3:4b` | Local Ollama | ~3.4 GB | Text/image understanding, multilingual | Google Gemma TERMS OF USE, not automatically Apache-2.0; review separate license |
| P1 evaluated backup | `openai/gpt-oss-20b` and `openai/gpt-oss-120b` on Groq Free | Remote API | Official examples ~30 RPM, 1,000 RPD and 8k TPM per model; exact account quotas vary | Larger remote planning tasks | Actual free entitlement, account secret and project usage rules must be separately verified; NO live call until authorized |
| P2 emergency experimental | OpenRouter `:free` eligible models | Remote API | Typical new free plan max 50 requests/day; no assured model stability | Experimental fallback only | API key/terms/data policy, account-specific access; no production assumption |
| P2 alternate | Cloudflare Workers AI free | Cloud | 10,000 neurons/day, non-billable hard stop on Workers Free | Narrow experimentation | Model choices, endpoint rights, pricing and user account need confirmation |
| P2 alternate | Gemini API free-tier model | Remote API | Free-tier rate limits vary; content may be used to improve provider products | Public or nonsensitive trial only | Privacy/data governance mandatory, no private IP export by default |

Sources, assessed Oct 2026:
- https://ollama.com/library/qwen3.5/tags
- https://ollama.com/library/qwen3
- https://ollama.com/library/gemma3
- https://huggingface.co/Qwen/Qwen3.5-4B
- https://huggingface.co/Qwen/Qwen3-4B
- https://github.com/ollama/ollama/blob/main/docs/gpu.mdx
- https://github.com/ollama/ollama/blob/main/docs/windows.mdx
- https://console.groq.com/docs/rate-limits
- https://openrouter.ai/pricing
- https://developers.cloudflare.com/workers-ai/platform/pricing/
- https://ai.google.dev/gemini-api/docs/pricing

**Free-to-download weights are not free compute.** Electricity, hardware time, RAM/VRAM and Internet bandwidth still have real costs. `FREE_ONLY` means **no platform charges, no automatic payments and no paid cloud services**, not zero power consumption.

## 3. Cloud-first owner correction — supersedes old workstation assumption

**2026-10-25 correction:** owner operates on **iPhone 12 and cloud services**. No Windows GPU workstation is available. The hardware-aware recommendation formerly in this section is **withdrawn** for this owner; local Ollama is an optional external reference, NOT the operational dependency. See [mobile-first cloud gateway architecture](VELEON_CLOUD_FIRST_20261025.md). Groq Free is the primary candidate only after official account confirmation; OpenRouter `:free` is optional and limited.

## 4. Implemented first engineering increment

`src/free-llm-gateway.mjs` introduces:
- Model selection from an **explicit trusted installed model inventory** and fixed task-to-model allowlist. Never attempt to download models or pick paid cloud endpoints automatically.
- Strict budget `0`, owner scope `IMPERIAL_CORE`, `localOnly=true` and explicit `allowLocalNetwork=true` / `explicitLocalInference=true` preconditions. These flags are **local intent gates, not proof of real human identity or a cryptographic Approval Gateway**.
- Fixed `http://127.0.0.1:11434/api/chat` endpoint, restricted output and context, bounded local HTTP responses, short timeouts and redacted stable errors.
- **Proposal-only output**, release always DENIED, execution always NOT_RUN; no actions, tools, shell, payments, private remote prompts or automatic provider fallback.
- Reproducible mocked-unit tests and read-only GitHub Actions; no actual model installation or inference runs in CI.

```bash
npm run verify
```

Proof ladder: implementation source = E2; verified tests on exact GitHub SHA = bounded E3; **real GPU-backed inference and resource benchmarking NOT VERIFIED**.

## 5. VELEON integration acceptance programme

1. E3: GitHub Actions test gateway with unsafe config, wrong role/identity, malicious model inventory, invalid endpoint, tool-call response, oversized JSON, timeout, unsupported task and malformed payload.
2. E4: owner workstation connects local Ollama using an explicitly authorized *actual* request, records model tag, digest, RAM/VRAM, latency and output hash. No credentials required for Ollama loopback.
3. E4 cloud alternative: secure provider credential connected via official app; verify account's real free tier, privacy restrictions, server-side storage and actual response. Reject invalid old Groq keys. No spending permitted.
4. E5: wire VELEON proposals to CONSTRUCTOR AI intent contract with distinct bounded task authority and LEGION job IDs. A model response never independently approves a task, release or code execution.
5. E5+: run independent quality benchmark on 30–100 representative cases (RU/UA/EN, coding, factuality, injection resistance, latency, tokens and failure rate), and compare free model variants to route by measured results rather than marketing claims.
6. E6: production requires hardened persistent queues, audited key custody, authenticated authorization, sanctions/terms compliance, human release gates, monitoring, failover and positive unit economics.

**Not yet implemented:** remote adapter, Groq/Gemini/OpenRouter login, actual LLM model hosting, 24/7 inference farm, live Universal NCA intelligence, business revenue, owned foundation model weights. No claims of tested hardware without owner-run proof.

**Integration principle:** VELEON = intelligence/planning; LEGION = numbered free-team dispatcher; CONSTRUCTOR = verified engineering executor; CYBER HAK/Guardian Core = independent security gate; ASTRA/HANTER = governed coordination, not unrestricted authority.
