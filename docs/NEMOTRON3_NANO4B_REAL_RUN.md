# VELION — NVIDIA Nemotron 3 Nano 4B: real-model CPU test

**Owner-approved engineering task (2026-10-28):** Install and run the model shown on NVIDIA's Nemotron 3 project page. Strict FREE_ONLY, with verification.

## Scope

- Independent third-party checkpoint: **NVIDIA Nemotron 3 Nano 4B** through the official Ollama tag \`nemotron-3-nano:4b\`. The larger Nemotron 3 Nano 30B model is not selected by default: its quantized model size is substantially larger.
- Runner: GitHub Actions Ubuntu, Dockerized Ollama, **localhost-only HTTP port 11434**, no model API key and no external service writes.
- Minimal prompts, maximum output tokens and wall-clock time.
- Evidence verifier reads the **real installed model registry**, checks size and digest, executes a local text generation and requires a nonempty response with nonzero generated token count. Saves a JSON receipt and SHA-256 of the output without publishing customer data.
- Workflow is **on-demand and isolated**: GitHub-hosted runners terminate after jobs. A successful run would prove a real one-off inference, **not a persistent 24/7 deployment**. No VELION-owned model weights are claimed.
- Model use is subject to [NVIDIA Nemotron Open Model License](https://huggingface.co/nvidia/NVIDIA-Nemotron-3-Nano-4B-GGUF). Source weights belong to NVIDIA. Preserve their license and attribution.

## Execution

Open [nemotron3-nano4b-real-inference.yml](../.github/workflows/nemotron3-nano4b-real-inference.yml) in **Actions** and use \`Run workflow\`, or push to the feature branch used for this initial installation. A successful job attaches \`velion-nemotron3-cpu-receipt\`.

Local command for an **owner-authorized, suitable machine** with Ollama installed:

\`\`\`sh
ollama pull nemotron-3-nano:4b
ollama run nemotron-3-nano:4b
\`\`\`

This is a command guide, not evidence that the owner's personal machine was changed or that any GPU is available. A machine should have adequate memory and disk (the 4-bit weights are about 2.8–2.9 GB). There is no persistent server in this change.

## Result contract

- \`REAL_EXTERNAL_MODEL_INFERENCE_VERIFIED\`: Only after official weights are registered and **the local model actually generated output**.
- \`FAILED\`: Any failure to download, start, generate, authenticate or verify the response. Do not substitute mock responses.
- \`PENDING\`: Workflow defined, but not yet observed successful.
- \`PERSISTENT_SERVICE\`: **NOT DELIVERED** by this job.

**Architecture:** VELION routes to external approved models; this does not rename the VELION LLM or claim proprietary trained weights. HANTER, ASTRA, NCA, Guardian Core and Approval Gateway remain separate boundaries. The new test grants none of them execution rights.


## Verified first run — 2026-10-28

**Status: REAL_EXTERNAL_MODEL_INFERENCE_VERIFIED**, scope limited to one isolated CPU-runner test.

- [GitHub Actions run 40669452722](https://github.com/oromaskevic23-cmd/VELION-LLM-Public/actions/runs/40669452722): full job SUCCESS; model pull SUCCESS; actual inference SUCCESS.
- Source SHA: \`f9cf9761d1e42ada6cf135079554180f7db85164\`.
- Installed local model registry tag: \`nemotron-3-nano:4b\`.
- Ollama-reported installed weight size: **2,837,597,147 bytes**.
- Actual generated tokens: **11**.
- Actual output excerpt from independent CI log: \`NEMOTRON The test passed successfully.\`
- SHA-256 of exact model output: \`b64dc8090ff67a786564613601d3c3c9c7a20b5dbf9350160aa4d4bce57fc618\`.
- [Seven-day evidence artifact](https://github.com/oromaskevic23-cmd/VELION-LLM-Public/actions/runs/40669452722) \`velion-nemotron3-cpu-receipt\`; archive SHA-256: \`f7005b45cfffd3ed36796603d19418ea3a425ae45c9e62d67391f9908c24b0ab\`.
- Provenance: zero credentials, localhost-only Ollama runtime, GitHub hosted Ubuntu CPU; weights were intentionally excluded from Git.
- **Not claimed:** continuous hosting, production API service, VELION-proprietary LLM weights, NVIDIA endorsement, independently tested accuracy, or dedicated user-PC installation.
