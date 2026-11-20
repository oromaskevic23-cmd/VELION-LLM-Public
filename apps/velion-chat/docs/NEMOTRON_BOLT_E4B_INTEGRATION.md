# VELION ⚡️ × NVIDIA Nemotron 3.5 Bolt E4B 4GB — opt-in evaluation

**Status (2026-11-20):** code-level preflight and a real-inference test runner are prepared. The NVIDIA model has NOT been downloaded to the user's VELION server or tested on a live model in this change. The local test suite uses mocked responses. No public VELION endpoint, iPhone compatibility or production approval is established.

**Owner:** Alexander Nikolaevich Romaskevich (RomaskevicH), Founder · Owner · CEO · Final Architectural Decision Authority, IMPERIAL Core.

## Model provenance and usage

Official source: https://huggingface.co/nvidia/NVIDIA-Nemotron-3.5-Bolt-E4B-4GB

- Third-party NVIDIA model derived from Gemma 4 E4B, not VELION-owned model weights.
- Quantization: GGUF Q4_K_M; NVIDIA reports 8B total / 4B effective parameters and up to 64K token context. Real usable context depends on hardware and server settings.
- Text input/text output only; voice input requires STT, playback requires TTS.
- License: OpenMDW 1.1, subject to its conditions; verify terms and attribution before redistribution or commercial release.
- **Exact Ollama model tag:** `hf.co/nvidia/NVIDIA-Nemotron-3.5-Bolt-E4B-4GB:Q4_K_M`.

## Real operator-controlled installation

On an authorized computer with sufficient available storage and RAM, an installed recent Ollama, and confirmed FREE_ONLY capacity:

```sh
export OLLAMA_HOST=127.0.0.1:11434
# Start ollama serve in a separate terminal if it is not already running.
ollama pull hf.co/nvidia/NVIDIA-Nemotron-3.5-Bolt-E4B-4GB:Q4_K_M
ollama list
```

**Independent upstream GGUF integrity reference (NVIDIA Hugging Face file page, 2026-11-20):** `Nemotron-3.5-Bolt-E4B-Q4_K_M.gguf` file SHA-256 is `c8af2b8aea10a690a1d9491db744a9446660173cb38fc489612b556615a69612` (source: https://huggingface.co/nvidia/NVIDIA-Nemotron-3.5-Bolt-E4B-4GB/blob/main/Nemotron-3.5-Bolt-E4B-Q4_K_M.gguf). This is the SHA-256 of the official GGUF **file**, not of an Ollama model manifest. The one-off Ollama inventory digest `139e7d57c1c319f8a244800512f359394c7a4dd6ae52c90bf4c2ae5a4d56cff1` is different and must not be treated as a mismatch or an independently verified file hash. Before persistent deployment, securely locate and hash the actual model blob, compare it to the trusted upstream checksum for the pinned release, and fail closed on any disagreement. This check was **not performed** by the initial 3-case workflow.

Downloading weights is **never automatic in this repository**. Do not run repeated weight downloads on short-lived CI runners; do not enable Val Town, chargeable providers or paid fallback.

## Test VELION against the installed model

From `apps/velion-chat`:

```sh
export IMPERIAL_CHAT_LOCAL_ONLY=YES
export VELION_LOCAL_BACKEND=ollama
export VELION_LOCAL_MODEL=hf.co/nvidia/NVIDIA-Nemotron-3.5-Bolt-E4B-4GB:Q4_K_M
export VELION_BOLT_SMOKE_CONSENT=YES
npm run smoke:bolt
```

Preflight reads ONLY `http://127.0.0.1:11434/api/tags` and requires one exact model tag, plausible model size and a lowercase 64-digit Ollama digest. **This does not verify an independent upstream model hash or guarantee model safety.** It then performs three real locally configured requests through the existing VELION chat adapter: an arithmetic case, a JSON format case, and short multi-turn memory recall. It emits per-case answers, result flags, timestamps and receipt hashes. It stops after the first transport error and returns nonzero on failure. No system commands, payments or agent tools are exposed to generated text.

For broader optional evaluation, set the same Ollama configuration, generate a separate private session token according to `apps/velion-chat/README.md`, then run `npm run evaluate:intelligence` (up to 20 real inference requests, potentially expensive in CPU time). Keep historical comparison conditions identical; human-reviewed and safety-critical cases are not automatically scored.

To use the existing UI, follow the existing README token/session instructions and keep the server bound to loopback only. A phone-accessible HTTPS service, Safari microphone tests, real-time voice, production auth and actual target-device performance remain **separate unverified milestones**.

## VELION integration boundaries

VELION remains the intelligence core. HANTER is the AI Command Center; federated orchestrators and scoped Nano Core Agents remain independently governed. The optional NVIDIA backend does not receive privileges or alter AI Passport, Enterprise Skills, Guardian Core, Approval Gateway, Audit Ledger, Zero Trust, Owner Kill Switch, Public/Private Boundary or CRYPTO IMPERIAL Ecosystem Boundary.

**Acceptance:** record exact source commit, installed local digest, hardware, RAM, model/runner versions, latency, output-token counts, pass/fail results and any free-tier resource costs. Treat code-level checks as code-level checks, not inference benchmarks. Keep release and deployments denied until independent QA and Owner authorization.
