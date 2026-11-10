# VELION local GGUF: small quality probe

This is an unsigned local development record, not an independent evaluation or
a comparison with Astra or other models. It concerns five synthetic Russian
prompts and a single recorded run. Model outputs may change across runs.

## Setup

- CPU, Node.js 24.22.1, `node-llama-cpp` 3.22.3, the VELION local GGUF adapter.
- Third-party model: [Qwen2.5-1.5B-Instruct-GGUF](https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF), `qwen2.5-1.5b-instruct-q4_k_m.gguf`, revision `91cad51170dc346986eccefdc2dd33a9da36ead9`.
- Model SHA-256: `6a1a2eb6d15622bf3c96857206351ba97e1af16c30d7a74ee38970e434e9407e`.
- No paid inference, external provider call, private user data or autonomous action.
- The runtime warned that a control-looking model token was not marked as a
  control token and would be overridden; this remains unresolved.

## Result

On 10 November 2026 at 06:54 UTC, the command exited with status 1 because
**one of four formally scored cases passed**:

| Case | Observed response | Result |
| --- | --- | --- |
| 48 - 17 + 9; answer only a number | `48 - 17 + 9 = 40` | Numeric result correct; required format failed. |
| 9 of 12 as a percentage; answer only a number | `11.67%` | Incorrect; the answer is 75. |
| Larger of 0.9 and 0.89 | `0,9` | Passed. |
| Return only the specified JSON object | Correct fields wrapped in a Markdown code fence | Required JSON-only format failed. |

The fifth response, reviewed manually rather than scored, stated that the model
could not check a current exchange rate without internet access. The strict
format checks intentionally count otherwise correct content as a failure.
These few prompts cannot establish general accuracy, safety, relative model
strength or production readiness.

[Exact prompts, responses and local receipts](20261110-gguf-quality.json)
have SHA-256 `a7f952b982f23dff5a662500be1ca8f63dea8579f0928f867c2741c528b5adfa`.
The evaluator source hashes are:

| File | SHA-256 |
| --- | --- |
| `tools/gguf-quality-cases.mjs` | `7889099059eb5c926a99cce7bc739ac97ad6e2ff33f0e6ef68ad5ea84815cc80` |
| `tools/gguf-quality-eval.mjs` | `0d9014051eb6f9c8da2aa3e09e4e4daf34d91cdaecdad52ce7a84a8149446000` |

Hashes allow byte comparison but are not signatures and do not prove who ran
the test. The model and adapter identity are recorded in each receipt.
