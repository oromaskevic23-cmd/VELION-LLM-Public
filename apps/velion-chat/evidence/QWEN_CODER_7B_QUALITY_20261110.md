# Local model comparison: Qwen2.5 Coder 7B

This is an unsigned local development observation from 10 November 2026, not
an independent benchmark, security audit, production deployment or comparison
with Astra. It uses the same four strictly scored synthetic prompts and one
manual-review prompt as the earlier Qwen2.5 1.5B check. Each result represents
one run; outputs can vary between runs.

## Model and runtime

- Third-party model: [Qwen2.5-Coder-7B-Instruct-GGUF](https://huggingface.co/Qwen/Qwen2.5-Coder-7B-Instruct-GGUF),
  `qwen2.5-coder-7b-instruct-q4_k_m.gguf` at revision
  `13fb94bfda8c8cf22497dc57b78f391a9acb426a`.
- File size: 4,683,073,536 bytes; SHA-256:
  `509287f78cb4d4cf6b3843734733b914b2c158e43e22a7f4bf5e963800894d3c`.
- The model card identifies Apache-2.0. This is not a complete review of all
  dependencies, third-party rights, intended use or commercial obligations.
- Node.js 24.22.1, `node-llama-cpp` 3.22.3, CPU-only local execution;
  context 2,048 tokens, maximum 512 generated tokens and temperature 0.2.
  No paid inference API or real user data was used. The model file is not
  included in this repository or installed as an always-on service.
- The runtime warned that a control-looking model token was not marked as a
  control token and would be overridden. The cause remains unresolved.

## Observed results

| Synthetic prompt | 7B response | Strict result |
| --- | --- | --- |
| Inventory: 48 - 17 + 9, answer only a number | `40` | Pass |
| 9 of 12 as a percentage, answer only a number | `75%` | Numeric answer correct; strict number-only format failed |
| Larger of 0.9 and 0.89 | `0,9` | Pass |
| Return only the specified JSON object | Correct fields wrapped in a Markdown code fence | Strict JSON-only format failed |

The fifth response, reviewed manually and not scored, correctly said the model
could not check a current exchange rate without internet access. The strict
score was **2/4**. The earlier [1.5B run](LOCAL_GGUF_QUALITY_20261110.md)
scored **1/4** and gave the wrong percentage. This tiny repeated set is not
enough to rank the models generally or establish readiness for autonomous
work; independent unseen tasks and repeated measurements are still needed.

[Exact prompts, outputs and receipts](20261110-qwen-coder-7b-quality.json)
have SHA-256 `914695403e197c9a44419ca7fb37628efdb9631aee3a525355bed8ea8721a187`.
The evaluator files were `tools/gguf-quality-eval.mjs`
(`0d9014051eb6f9c8da2aa3e09e4e4daf34d91cdaecdad52ce7a84a8149446000`)
and `tools/gguf-quality-cases.mjs`
(`7889099059eb5c926a99cce7bc739ac97ad6e2ff33f0e6ef68ad5ea84815cc80`);
the local adapter SHA-256 was
`95a3c5f0251ed4ad5815ef01d0dac8877627f8d2e2bfc3f651e9b32de7689683`.
Hashes allow byte comparison but are not signatures or proof of who ran a test.
