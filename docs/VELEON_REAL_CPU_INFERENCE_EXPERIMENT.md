# VELEON — real inference on free public CI (proposed experiment)

**Canonical product:** VELEON ⚡. MAX = an inference mode, not a separately owned model. The repository's historical URL contains VELION.

This controlled test downloads **third-party Qwen3-0.6B-Q4_0** (Apache-2.0 base model; quantization hosted by ggml-org) and the pinned **llama.cpp b11896 CPU build**, checks both SHA-256 digests, then performs two actual inference calls over `127.0.0.1`. No credentials, external user prompts or private NCA code are sent to the model provider: inference runs on the GitHub CPU runner after model download.

This proves a usable **VELEON inference adapter**, not VELEON-owned weights. Actual success is contingent on the end-to-end workflow passing and receiving nonempty model responses. Local mocked unit tests alone are insufficient. Public standard GitHub-hosted runners are free under GitHub's published pricing; no larger runner or model API is used.

**Security:** no untrusted generated code is executed. The generated code proposal remains untrusted text. No release, agent tool execution, payments, background job or owner signing occurs.

**Provenance:**
- llama.cpp b11896 Linux Ubuntu x64 CPU SHA-256: `b02ed815efe497c0e818aadaae1b2538309f25424034555dcc1b7211c783e25c`.
- Qwen3-0.6B-Q4_0.gguf SHA-256: `da2572f16c06133561ce56accaa822216f2391ef4d37fba427801cd6736417d4`.
- For compliance, base model and quantization license details must remain visible; third-party inference is not proprietary IP or a trained VELEON checkpoint.
