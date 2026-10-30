# VELION / NCA — Synthetic Intent Training Lab

**Status: local experiment; not an LLM, production router or agent training service.**

This laboratory fits a small multinomial naive Bayes text classifier from 40
hand-authored, public synthetic examples across five task categories. It then
scores a separate hand-authored 27-case held-out set, including seven cases
intended to expose out-of-domain, negation and multi-intent weaknesses.
The model emits only a label or `ABSTAIN`. It has no execution, publication,
network, spending, customer access or approval capability.

## Reproduce

Requires Python 3.11+ standard library, no downloads, GPU, paid provider,
secrets or network:

```sh
python3 training/intent_lab/intent_lab.py
python3 -m unittest discover -s tests -p 'test_*.py'
# Optional: create a new model file in a private, operator-selected directory.
python3 training/intent_lab/intent_lab.py --model-out /tmp/velion-intent-model.json
```

The output includes SHA-256 for the exact dataset and canonical model JSON,
per-case predictions and a confusion matrix. The export fails if the output
path already exists. SHA-256 shows byte identity, not independent authorship.
Training reads only the `train` split; duplicate normalized train/held-out
texts and duplicate held-out IDs are rejected. Exact duplicate detection does
not establish independence or rule out paraphrase leakage.

## Observed local experiment — 30 October 2026

- Training: **40** synthetic examples, eight per class.
- Held-out: **23/27** expected labels; 20/20 category examples and 3/7
  intended abstentions. Four negation or mixed-intent cases were not abstained
  from. The cases and results are available directly in the script output.
- The data and evaluation were hand-authored together and repeatedly examined;
  this is a tiny, non-independent set, not a valid real-world performance claim.
- Dataset SHA-256:
  `94f094da6e15c02220ec9695a0b1b253ce191881d2541fa0012abc968048fa57`.
- Canonical in-memory model SHA-256:
  `71793d2b63105af4acf36287d96ade70c2fa33a53511b311769932c6a51e55a9`.

These weaknesses are a reason to keep this model **out of authorization,
privacy filtering, payment confirmation and live task routing**. It does not
understand negation or establish whether a real request, payment, identity or
consent is valid. Its threshold and scores are not calibrated probabilities.
The word features, weights and dataset belong to a small classifier: **no
VELION LLM foundation weights or adapter were trained** in this experiment.

## Next evidence gates

Build a rights-cleared and privacy-reviewed training corpus, obtain an
independently authored and frozen evaluation set with negation, prompt
injection and multi-intent examples, define class-specific error costs, and
compare against baselines before any integration proposal. For LLM fine-tuning,
separately verify a suitable licensed base model, GPU/compute, training stack,
data provenance, reproducible baseline and held-out safety/quality evaluation.
Do not submit private data or weights to public CI.

The wider architecture remains federated. AI Passport, Enterprise Skills,
Guardian Core, Approval Gateway, Audit Ledger, Zero Trust, Public/Private and
CRYPTO IMPERIAL boundaries remain requirements; this standalone lab does not
implement or replace them. **MAX is a mode; VELION is the project name.**
