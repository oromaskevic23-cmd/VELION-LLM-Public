# VELION — document intelligence evaluation, 15 November 2026

## Status: actual inference verified; model quality acceptance failed

A developer-operated research experiment compared two external, instruction-tuned language models using the same eight synthetic text-layer invoices and five required fields per document. The source texts and answer keys were frozen before the first inference run. Only document text and a separate example were supplied to the model; expected answers and precomputed discrepancy flags were withheld.

| Metric, original scoring contract | SmolLM2-360M-Instruct | Qwen2.5-0.5B-Instruct |
| --- | ---: | ---: |
| Actual model responses | 8/8 | 8/8 |
| Responses passing schema and lexical checks | 1/8 | 4/8 |
| Exact fields (rejected records score zero) | 4/40 | 18/40 |
| Fully correct documents | 0/8 | 2/8 |
| Correct abstention on absent or ambiguous fields | 0/3 | 0/3 |
| Quality gate | FAIL | FAIL |

Both model artifacts were downloaded at pinned revisions and executed in isolated CPU experiments. Native generated text, not constrained classification or a deterministic answer oracle, was scored. These are third-party weights, not trained proprietary VELION weights.

## Governance hardening

Two targeted deterministic consistency checks were added after inspecting failures: explicitly conflicting final totals require abstention; a proposed non-null amount must agree with a single recognized explicit final total. The Qwen outputs were replayed without additional model inference. Two review-only candidates remained, both fully correct on this known set; six were rejected. All 21 contract tests passed (12 baseline, five conflict tests, four final-total tests). All candidates require human review, and no execution or payment connector is enabled.

This is a post-hoc guard improvement, not proof of model generalization or universal document-security coverage. Lexical grounding cannot establish semantic validity. Both models failed to abstain correctly; neither configuration is approved for production.

## Next acceptance gates

- Frozen, previously unseen document layouts and a better approved model.
- Field-level provenance and explicit ambiguity reporting, measured independently from deterministic safeguards.
- Separate PDF text-layer ingestion and OCR evaluation, including visual layouts, tables and scans.
- Independent QA, controlled deployment and measured task value.

Only aggregate results are published. The private research implementation, fixture texts, model outputs and runtime details are not disclosed. No live service, OCR capability, actual financial execution, independent QA or contest eligibility is claimed.

**Author and project owner: Alexander Romaskevich — Founder, Owner, CEO, IMPERIAL Core.**
