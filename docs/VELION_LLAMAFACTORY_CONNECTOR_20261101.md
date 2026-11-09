# VELION Training Backend — LLaMA-Factory Research Integration

**2026-11-01 · Canonical VELION architecture integration.**  
**Founder, Owner, CEO:** Alexander Nikolaevich Romaskevich (RomaskevicH).

## Architecture decision

LLaMA-Factory is accepted as an **optional third-party fine-tuning backend** for the VELION development pipeline. It is **not** a separate VELION foundation model, a HANTER orchestrator, an NCA professional examiner or a substitute for an actual AI Passport.

Canonical relationship:

Architect → HANTER AI Command Center → federated Engineering Orchestrator → VELION Intelligence Fabric → **VELION Training Adapter in IMPERIAL-Plugins** → optional approved LLaMA-Factory LoRA/QLoRA experiment → independently held-out model testing → ProofGraph / Audit Ledger → separate signed release.

VELION's **MAX is a mode**, never a new model or independent global orchestrator. All Runtime Domains, Guardian Core, Approval Gateway, Enterprise Skills, AI Passport, IntentLock, Owner Kill Switch, Zero Trust and Public/Private/CRYPTO IMPERIAL ecosystem boundaries remain intact.

## Implemented public integration

**Source of the adapter:** [IMPERIAL-Plugins / llamafactory_adapter.py](https://github.com/oromaskevic23-cmd/IMPERIAL-Plugins/blob/main/src/imperial_plugins/llamafactory_adapter.py).  
**Offline local preparation:** [private-file CLI](https://github.com/oromaskevic23-cmd/IMPERIAL-Plugins/blob/main/tools/prepare_velion_training.py).  
**Engineering specification:** [license-aware fine-tuning, safety and release criteria](https://github.com/oromaskevic23-cmd/IMPERIAL-Plugins/blob/main/docs/VELION_LLAMAFACTORY_TRAINING.md).  
**Smoke and adversarial CI:** [Security Kernel CI](https://github.com/oromaskevic23-cmd/IMPERIAL-Plugins/actions/workflows/security-kernel.yml).

The interface accepts only owner-asserted original synthetic data in a closed schema. It blocks repeated prompts/sources across training and validation, common token/email leak patterns, unreviewed base models/revisions, extra training parameters, hidden GPU spending and unwanted model downloads. It creates local LLaMA-Factory-compatible Alpaca JSON, dataset_info.json, and LoRA/QLoRA SFT YAML with SHA-256 evidence.

**Current result:** original offline planning, tests, synthetic demonstration, no training. It does not import or vendor third-party LLaMA-Factory, weights, checkpoints, datasets or licenses. The upstream code and reviewed Qwen reference checkpoint both disclose Apache-2.0 terms; model/dataset rights must still be independently checked before acquisition and any derivative release.

Pinned upstream **hiyouga/LlamaFactory** source SHA: 9997aa078b4da35e04bb492a8a27d45141f4b80b.  
Pinned reference model **Qwen/Qwen3-4B-Instruct-2507** SHA: cdbee75f17c01a7cc42f958dc650907174af0554.

## Existing model experiments are not overwritten

The previously verified [VELION CPU LoRA pilot (2026-10-30)](VELION_CPU_LORA_PILOT_20261030.md) used third-party SmolLM2-135M on synthetic data and showed **13/27 after training vs 3/27 before** on its small exercise. The pilot's adapter was not retained or deployed; 14 of 27 cases remained incorrect. This new source-only LLaMA-Factory adapter is an **additional prospective training option** and does not retroactively change, validate or supersede that old result.

The separate Nemotron and Qwen CI inference demonstrations also remain distinct from actual persistent VELION hosting.

## Missing release evidence

1. Verified real Owner Ed25519 approval and AI Passport with correct scope and revocation; no self-asserted approval substituted.
2. Dataset copyrights, source provenance and privacy independently reviewed; real production/customer materials prohibited without rights.
3. Physical or virtual training host, dependency lockfiles, CUDA/driver and GPU memory benchmark, verified zero-cost quota. A named 4B model does not guarantee feasibility on a specific 8GB GPU.
4. Actual LLaMA-Factory training run and artifact hashes on authorized compute with isolated network/secrets.
5. **Sealed independent holdout**, which must not be the validation dataset used for training-time tuning.
6. Baseline versus fine-tuned measurements, regressions, unsafe output and domain-specific professional quality checks, signed evidence and rollback.
7. Separate Model Registry admission; no automatic production NCA promotion, no live commercial agent claim.

## Rights and truth

VELION is an original IMPERIAL Core intelligence architecture; LLaMA-Factory and Qwen are external software and model projects, not IMPERIAL-owned foundation weights. Public attribution and upstream licenses are preserved. IMPERIUM is a long-term architectural digital currency for AI agents worldwide, not a claim of existing global use, value or market status.

**Architecture → Implementation → Evidence.**
