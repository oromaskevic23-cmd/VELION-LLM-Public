# VELION / NCA — CPU LoRA Research Pilot

**Executed:** 30 October 2026 · **Scope:** synthetic research, no deployment

A standard GitHub-hosted CPU runner trained a small LoRA adapter on the external
[HuggingFaceTB SmolLM2-135M-Instruct model](https://huggingface.co/HuggingFaceTB/SmolLM2-135M-Instruct/tree/8065371cb317383b7a3ea72b72ab5affe24bd30f)
using 48 hand-authored synthetic task examples. The base model is a third-party
Apache-2.0 model, not VELION-owned foundation weights.

## Reproducible record

- [Actual GitHub Actions run 41002552289](https://github.com/oromaskevic23-cmd/VELION-LLM-Public/actions/runs/41002552289): completed successfully.
- Source commit used by the run: [`37c2c5a3a11f36d7d2ba52e5ff637a8aadb086c7`](https://github.com/oromaskevic23-cmd/VELION-LLM-Public/commit/37c2c5a3a11f36d7d2ba52e5ff637a8aadb086c7).
- Base model revision: `8065371cb317383b7a3ea72b72ab5affe24bd30f`.
- Python 3.11; CPU; 48 training examples; two epochs; 24 optimizer steps;
  **460,800 trainable adapter parameters**; seed 20261030.
- Dataset SHA-256: `94f094da6e15c02220ec9695a0b1b253ce191881d2541fa0012abc968048fa57`.
- Additional abstain examples SHA-256: `c85cf7ff67371799d6a7016911169fb9b525eb179ab2068fe877c0e608b75cc3`.
- Adapter parameter digest before training:
  `99d2d150fe1ea08b2075144e5600f02a83948941ac75cbaa4e4f3bcc7fb79d8e`.
- Adapter parameter digest after training:
  `680f4bc8bd10a9d163a48def378ad8d1601127d7959478df1d2b9aa0f913e314`.
  The different digests show that the trainable parameters changed during this
  run; a digest is not an audit or an identity claim for the base model.

The workflow pins the model revision and direct dependencies, but transitive
packages are not hash-locked and the downloaded base-model bytes were not
independently hashed in this run. It runs with no project secrets and uses a
standard runner. It does not upload or retain model weights.

## Same held-out exercise before and after

The scoring method selects the label with the highest mean token
log-likelihood from six fixed candidate labels. This is **forced-choice
scoring**, not free-form generation or an agent executing a real task.

| Synthetic held-out outcome | Before | After |
| --- | ---: | ---: |
| All cases | 3/27 | 13/27 |
| Correct abstentions on seven ambiguous / out-of-domain cases | 0/7 | 1/7 |

The result rose by 10 cases on this particular set, but **14/27 remained
incorrect after training**, including six of seven intended abstentions. The
training and test examples are very small, synthetic, hand-authored together
and have been examined by the same developer. They are not an independent,
representative or frozen external benchmark and cannot establish real-world
generalization or safety. The code and logs retain every case result.

## Operational boundary

- The adapter existed only during the ephemeral runner job and was **not saved**.
- No NCA agent was trained or activated; no deployment, customer work, payment,
  wallet operation, customer messaging or 24-hour service occurred.
- The adapter must not be used as an approval, security, privacy or payment gate.
- Future work requires a larger rights-cleared corpus, independently authored
  frozen evaluations and a private, authorized path to retain a candidate
  adapter; compare it with a baseline before considering integration.
