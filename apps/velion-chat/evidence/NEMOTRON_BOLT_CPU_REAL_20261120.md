# VELION ⚡ — Real NVIDIA Nemotron 3.5 Bolt E4B 4GB CPU verification

**Observed:** 2026-11-20 10:39–10:40 UTC.  
**Founder / Owner / CEO:** Alexander Nikolaevich Romaskevich (RomaskevicH).  
**Test:** one-time, free GitHub Actions, Ubuntu 24.04, CPU-only Ollama 0.40.11, Node 22, 4 CPU quota, 10 GB Docker memory limit, 2,048-token Ollama context.  
**Source revision:** `a49b1a82b304fafb5f30aafcc4ed8d1665c9102e`.  
**Run:** https://github.com/oromaskevic23-cmd/VELION-LLM-Public/actions/runs/44720940215  
**Evidence artifact:** https://github.com/oromaskevic23-cmd/VELION-LLM-Public/actions/runs/44720940215/artifacts/14621098733 (retained 7 days; exact result remains in immutable GitHub job log).

## Model and install receipt

Ollama model: `hf.co/nvidia/NVIDIA-Nemotron-3.5-Bolt-E4B-4GB:Q4_K_M`.

- Download step: **PASS**, log: `BOLT_MODEL_PULL_CONFIRMED`.
- Installed Ollama inventory reported **6,180,446,974 bytes** (approximately 5.76 GiB), NOT four gigabytes on disk.
- Local Ollama digest: `139e7d57c1c319f8a244800512f359394c7a4dd6ae52c90bf4c2ae5a4d56cff1`.
- Digest validated as a local model-inventory identifier, **not** independently checked against NVIDIA's upstream cryptographic release manifest.
- Model container was destroyed at the end of the job. This is **not** an installation on any continuously running VELION server or user's phone.

## Real-inference outcome

The exact existing VELION Ollama chat adapter was used. These are **actual generated answers**, not fixture responses.

| Source-visible case | Generated answer | Result | End-to-end request latency |
| --- | --- | --- | --- |
| `inventory` (84 − 27 + 13) | `70` | **PASS** | 19,044 ms |
| `json_object` | `{"agent_id":"NCA-014","mission":"Проверить отчёт"}` | **PASS** | 13,087 ms |
| `context` (short dialogue memory) | `SOLAR-7` | **PASS** | 5,654 ms |

**Real inference: 3/3 PASS**. Total three request latencies: **37,785 ms**; includes load/warm-up effects and is not a tokens-per-second, time-to-first-token or interactive UX benchmark. Model output had `toolAccess: NONE`, `approval: NOT_GRANTED`, and `release: NOT_AUTHORIZED`.

Preflight negative tests: **4/4 PASS** in the real runner. GitHub job conclusion: **success**. Five separate PR CI workflows covering the chat and repository policy checks completed successfully on the test branch at the checkpoint (CI evidence does **not** establish model quality or independent security certification).

## Scope and deficiencies to fix

- Three simple, source-visible tasks do not demonstrate broad language, code quality, tool-call reliability, safety or competitive model superiority.
- Benchmark next against the repository's existing 20-case development suite (14 scored + 6 human-review), with independent unseen cases, adversarial policy checks, Russian/English evaluations, and stable prompt settings.
- Record hardware, memory peak, tokens/sec, first-token latency and **streaming response** before selecting this as the mobile voice backend. A 6.18-GB reported local install requires explicit disk and RAM planning.
- Bolt is **text-only**. Microphone input and speech output need separate STT/TTS with user consent and privacy review.
- Use model only as an optional, non-privileged route under the canonical VELION fabric. HANTER and federated orchestrators retain scoped authority; AI Passport, Guardian Core, Approval Gateway, Audit Ledger, Zero Trust, Owner Kill Switch, Public/Private Boundary and CRYPTO IMPERIAL Ecosystem Boundary remain unchanged.
- License/source: NVIDIA https://huggingface.co/nvidia/NVIDIA-Nemotron-3.5-Bolt-E4B-4GB . Model weights remain third-party; review OpenMDW 1.1 and attribution before redistribution.
- No 24/7 deployment, iPhone/Safari verification, production authorization, signed Owner approval, or real voice session was exercised.

**Next release decision:** keep this work as a **draft PR**. Do not auto-merge, automatically install on persistent servers, or market it as a production VELION model before broader QA.
