#!/usr/bin/env python3
"""Offline synthetic supervised intent classifier; strictly advisory, never executes actions."""
from __future__ import annotations

import argparse
from collections import Counter
import hashlib
import json
import math
from pathlib import Path
import re
import sys

HERE = Path(__file__).resolve().parent
DATASET = HERE / "dataset.json"
LABELS = ("CODE_REVIEW", "RATE_LIMIT", "PRIVACY_REVIEW", "APPROVAL_REQUIRED", "PAYMENT_EVIDENCE")
ABSTAIN = "ABSTAIN"
TOKEN = re.compile(r"[a-z0-9]+")


def words(text: str) -> list[str]:
    return TOKEN.findall(text.lower())


def load_dataset(path=DATASET):
    raw = path.read_bytes()
    if len(raw) > 262_144:
        raise ValueError("DATASET_TOO_LARGE")
    data = json.loads(raw)
    if data.get("schema") != "velion.synthetic-intent-dataset.v1":
        raise ValueError("DATASET_SCHEMA_INVALID")
    train, heldout = data.get("train"), data.get("heldout")
    if not isinstance(train, dict) or set(train) != set(LABELS) or not isinstance(heldout, list):
        raise ValueError("DATASET_SPLITS_INVALID")
    seen = set()
    for label in LABELS:
        if not isinstance(train[label], list) or len(train[label]) < 2:
            raise ValueError("TRAIN_CLASS_TOO_SMALL")
        for text in train[label]:
            if not isinstance(text, str) or not words(text) or len(text) > 2000:
                raise ValueError("TRAIN_TEXT_INVALID")
            norm = " ".join(words(text))
            if norm in seen:
                raise ValueError("DUPLICATE_TRAIN_TEXT")
            seen.add(norm)
    ids = set()
    for item in heldout:
        if not isinstance(item, dict) or set(item) != {"id", "label", "text"}:
            raise ValueError("HELDOUT_RECORD_INVALID")
        if not isinstance(item["id"], str) or not item["id"] or item["id"] in ids:
            raise ValueError("HELDOUT_ID_INVALID")
        ids.add(item["id"])
        if item["label"] not in (*LABELS, ABSTAIN) or not isinstance(item["text"], str) or not words(item["text"]):
            raise ValueError("HELDOUT_CONTENT_INVALID")
        norm = " ".join(words(item["text"]))
        if norm in seen:
            raise ValueError("DUPLICATE_OR_LEAKED_TEXT")
        seen.add(norm)
    if {item["label"] for item in heldout} != set((*LABELS, ABSTAIN)):
        raise ValueError("HELDOUT_LABELS_INCOMPLETE")
    return data, hashlib.sha256(raw).hexdigest()


def train(data):
    """Fit multinomial naive Bayes counts from synthetic training records only."""
    counts = {label: Counter() for label in LABELS}
    vocabulary = set()
    doc_counts = {}
    for label in LABELS:
        doc_counts[label] = len(data["train"][label])
        for text in data["train"][label]:
            tokens = words(text)
            counts[label].update(tokens)
            vocabulary.update(tokens)
    return {"schema": "velion.synthetic-intent-model.v1", "labels": list(LABELS),
            "doc_counts": doc_counts, "counts": {label: dict(sorted(counts[label].items())) for label in LABELS},
            "vocabulary": sorted(vocabulary), "alpha": 1.0, "minimum_known_tokens": 2,
            "minimum_score_margin": 0.7, "usage": "OFFLINE_SYNTHETIC_ADVISORY_ONLY"}


def predict(model, text):
    if not isinstance(text, str) or len(text) > 2000:
        raise ValueError("TEXT_INVALID")
    vocab = set(model["vocabulary"])
    known = [w for w in words(text) if w in vocab]
    if len(known) < model["minimum_known_tokens"]:
        return ABSTAIN
    scores = {}
    total_docs = sum(model["doc_counts"].values())
    for label in LABELS:
        counts = model["counts"][label]
        denominator = sum(counts.values()) + model["alpha"] * len(vocab)
        scores[label] = math.log(model["doc_counts"][label] / total_docs) + sum(
            math.log((counts.get(w, 0) + model["alpha"]) / denominator) for w in known)
    ranked = sorted(scores, key=lambda label: (-scores[label], label))
    return ranked[0] if scores[ranked[0]] - scores[ranked[1]] >= model["minimum_score_margin"] else ABSTAIN


def evaluate(data, model):
    rows = []
    matrix = {label: {pred: 0 for pred in (*LABELS, ABSTAIN)} for label in (*LABELS, ABSTAIN)}
    for item in data["heldout"]:
        guess = predict(model, item["text"])
        matrix[item["label"]][guess] += 1
        rows.append({"id": item["id"], "expected": item["label"], "predicted": guess})
    correct = sum(r["expected"] == r["predicted"] for r in rows)
    assigned = [r for r in rows if r["predicted"] != ABSTAIN]
    return {"examples": len(rows), "correct": correct, "assigned": len(assigned),
            "assigned_correct": sum(r["expected"] == r["predicted"] for r in assigned),
            "confusion_matrix": matrix, "cases": rows}


def canonical_json(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode("utf-8")


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model-out", type=Path, help="Create a new synthetic model JSON; never overwrites")
    args = parser.parse_args(argv)
    data, dataset_hash = load_dataset()
    model = train(data)
    metrics = evaluate(data, model)
    model_hash = hashlib.sha256(canonical_json(model)).hexdigest()
    if args.model_out:
        with args.model_out.open("x", encoding="utf-8") as output:
            json.dump(model, output, sort_keys=True, indent=2)
            output.write("\n")
    print(json.dumps({"experiment": "SYNTHETIC_SUPERVISED_CLASSIFIER", "dataset_sha256": dataset_hash,
                      "model_canonical_sha256": model_hash, "train_examples": sum(model["doc_counts"].values()),
                      "metrics": metrics, "model_weights_are_llm": False,
                      "deployment_authorized": False, "actions_allowed": False}, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(f"LAB_FAILED: {type(exc).__name__}: {exc}", file=sys.stderr)
        sys.exit(1)
