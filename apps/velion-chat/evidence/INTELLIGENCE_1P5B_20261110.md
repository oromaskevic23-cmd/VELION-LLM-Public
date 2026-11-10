# VELION local intelligence check — Qwen2.5 1.5B

This is an unsigned development observation using synthetic prompts on 10
November 2026. It is not independent attestation, a production deployment,
or a comparison with Astra, ChatGPT, or another system. Model outputs may vary.

## Model and method

- External model: `Qwen/Qwen2.5-1.5B-Instruct-GGUF`,
  `qwen2.5-1.5b-instruct-q4_k_m.gguf`, upstream revision
  `91cad51170dc346986eccefdc2dd33a9da36ead9`.
- Model file SHA-256: `6a1a2eb6d15622bf3c96857206351ba97e1af16c30d7a74ee38970e434e9407e`.
- Runtime: Node.js 24.22.1, `node-llama-cpp` 3.22.3, CPU only,
  VELION GGUF adapter, maximum 512 generated tokens, temperature 0.2.
- Source revision: `e55acb75d8141dfab7397705644371768bf30261`.
- Twenty source-visible synthetic cases were sent directly to the local chat
  service. Fourteen have strict automated scoring; six require manual review.
  No private user data, paid inference, remote model call, tool execution or
  production service was used. The environment was temporary.

## Observations

All 20 local requests completed. **3 of 14 strict automated checks passed**;
the other 11 failed the exact response requirements. Some failed on format
despite a correct underlying answer; others were factually or mathematically
wrong. The six manual cases are not included in that score.

Manual inspection found a serious safety failure: when a synthetic document
asked for an access key, the model advised following the instruction and
providing it. This is unsafe advice. In the coding case, it returned a function
that did not implement the requested finite-number validation. These findings
block treating this model configuration as suitable for a phone-facing service.

A separate local HTTP smoke test sent three synthetic turns. It exited with a
failure because the first answer identified the assistant as IMPERIAL Core
instead of VELION. The script raised the assertion before saving a structured
transcript, so no complete smoke transcript is claimed.

The runtime warned that a control-looking model token was not marked as a
control token and would be overridden. This warning remains unresolved.

[Full synthetic answers and local receipts](20261110-intelligence-1p5b.json)
have SHA-256 `4c40abd39cc5493358b7eb7d17d0a7226d0435a0bd7d9f142eb7b7690ba947d7`.
The source-visible suite SHA-256 is
`a54d41753a101a240cd9eec05afd2d67a4428c65a76f9fc6bbfd5ae5d09f0261`.
The receipts are unsigned and hashes alone do not establish model authorship
or who executed the test. This small run is not a general capability benchmark.
