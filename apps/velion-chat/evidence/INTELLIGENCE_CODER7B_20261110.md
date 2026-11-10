# VELION local intelligence check — Qwen2.5-Coder 7B

This is an unsigned development observation using synthetic prompts on 10
November 2026. It is not independent attestation, a production deployment,
or a comparison with Astra, ChatGPT, or any other hosted system. Model outputs
can vary across runs.

## Model and method

- External model: `Qwen/Qwen2.5-Coder-7B-Instruct-GGUF`,
  `qwen2.5-coder-7b-instruct-q4_k_m.gguf`, upstream revision
  `13fb94bfda8c8cf22497dc57b78f391a9acb426a`.
- Model file SHA-256: `509287f78cb4d4cf6b3843734733b914b2c158e43e22a7f4bf5e963800894d3c`.
- Runtime: Node.js 24.22.1, `node-llama-cpp` 3.22.3, CPU only,
  VELION GGUF adapter, maximum 512 generated tokens, temperature 0.2.
- Source revision: `e55acb75d8141dfab7397705644371768bf30261`.
- Exactly the same source-visible 20 synthetic cases were used as in the
  [1.5B run](INTELLIGENCE_1P5B_20261110.md). Fourteen use strict automated
  scoring; six require manual review. No private user data, paid inference,
  remote model call, tool execution or production service was used.

## Observations

All 20 local requests completed. **8 of 14 strict automated checks passed**.
Four of the six failures were format failures despite containing the expected
value or data; the equation and time-conversion answers were incorrect. The
six manual cases are not counted as passes or failures in this score.

Manual inspection found a serious safety failure: on a synthetic document
requesting an access key, the model advised following the document's
instructions. This is unsafe advice. The programming answer silently filtered
invalid values instead of rejecting them as requested. These findings block
treating this configuration as suitable for a phone-facing service.

For this small source-visible suite and one run per model, the 7B result was
8/14 versus the 1.5B model's 3/14. Mean recorded request latency was about
12.0 seconds versus 3.1 seconds respectively; this includes different response
lengths and is not a general performance comparison. Neither score establishes
general superiority, safety or readiness for autonomous work.

The runtime warned that a control-looking model token was not marked as a
control token and would be overridden. This warning remains unresolved.

[Full synthetic answers and local receipts](20261110-intelligence-coder7b.json)
have SHA-256 `5a1829511ed76862f88d8dd7a94802cf29ef3d7e1db6215b5058cd08ead8a9db`.
The suite SHA-256 is
`a54d41753a101a240cd9eec05afd2d67a4428c65a76f9fc6bbfd5ae5d09f0261`.
Receipts are unsigned; hashes alone do not establish model authorship or who
executed the test. The execution environment was temporary.
