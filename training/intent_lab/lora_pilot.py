#!/usr/bin/env python3
"""Tiny CPU-only LoRA research pilot on a third-party 135M model and synthetic data.

No private data, live router, financial action, production service, or retained weights.
"""
from __future__ import annotations

import hashlib
import json
import math
from pathlib import Path
import random
import sys

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from intent_lab import ABSTAIN, LABELS, load_dataset, words  # noqa: E402

MODEL = "HuggingFaceTB/SmolLM2-135M-Instruct"
REVISION = "8065371cb317383b7a3ea72b72ab5affe24bd30f"
SEED = 20261030
ALL_LABELS = (*LABELS, ABSTAIN)
EXTRA = HERE / "lora_abstain_train.json"


def training_examples(data, extra_path=EXTRA):
    extra = json.loads(extra_path.read_text(encoding="utf-8"))
    if not isinstance(extra, list) or len(extra) != 8 or not all(isinstance(x, str) and words(x) for x in extra):
        raise ValueError("ABSTAIN_TRAINING_INVALID")
    examples = [(text, label) for label in LABELS for text in data["train"][label]]
    examples += [(text, ABSTAIN) for text in extra]
    train_norm = [" ".join(words(text)) for text, _ in examples]
    heldout_norm = {" ".join(words(x["text"])) for x in data["heldout"]}
    if len(set(train_norm)) != len(train_norm) or set(train_norm) & heldout_norm:
        raise ValueError("TRAIN_EVALUATION_OVERLAP")
    return examples


def prompt_ids(tokenizer, text):
    instruction = ("Choose exactly one label: " + ", ".join(ALL_LABELS)
                   + ".\nTask: " + text + "\nLabel:")
    return tokenizer.apply_chat_template([{"role": "user", "content": instruction}],
                                         tokenize=True, add_generation_prompt=True)


def response_ids(tokenizer, label):
    return tokenizer.encode(label, add_special_tokens=False) + [tokenizer.eos_token_id]


def weight_digest(model):
    digest = hashlib.sha256()
    for name, parameter in sorted(model.named_parameters()):
        if parameter.requires_grad:
            digest.update(name.encode("utf-8"))
            digest.update(parameter.detach().cpu().contiguous().numpy().tobytes())
    return digest.hexdigest()


def score_examples(model, tokenizer, heldout, torch):
    """Forced-choice mean token log-likelihood, not free-form generation accuracy."""
    model.eval()
    outcomes = []
    with torch.no_grad():
        for item in heldout:
            prompt = prompt_ids(tokenizer, item["text"])
            completions = [response_ids(tokenizer, label) for label in ALL_LABELS]
            sequences = [prompt + completion for completion in completions]
            width = max(map(len, sequences))
            input_ids = torch.tensor([seq + [tokenizer.pad_token_id] * (width-len(seq)) for seq in sequences])
            mask = torch.tensor([[1] * len(seq) + [0] * (width-len(seq)) for seq in sequences])
            logits = model(input_ids=input_ids, attention_mask=mask, use_cache=False).logits
            scores = []
            for i, completion in enumerate(completions):
                score = 0.0
                for j, token in enumerate(completion):
                    row = logits[i, len(prompt) + j - 1].float()
                    score += (row[token] - torch.logsumexp(row, dim=0)).item()
                scores.append(score / len(completion))
            chosen = ALL_LABELS[max(range(len(scores)), key=lambda i: scores[i])]
            outcomes.append({"id": item["id"], "expected": item["label"], "predicted": chosen})
    return {"correct": sum(x["expected"] == x["predicted"] for x in outcomes),
            "total": len(outcomes), "cases": outcomes}


def main():
    # Dependencies are imported only when the explicitly started pilot runs.
    import torch
    from peft import LoraConfig, TaskType, get_peft_model
    from transformers import AutoModelForCausalLM, AutoTokenizer

    torch.manual_seed(SEED)
    torch.set_num_threads(2)
    data, data_hash = load_dataset()
    examples = training_examples(data)
    extra_hash = hashlib.sha256(EXTRA.read_bytes()).hexdigest()
    tokenizer = AutoTokenizer.from_pretrained(MODEL, revision=REVISION, trust_remote_code=False)
    if tokenizer.pad_token_id is None:
        tokenizer.pad_token = tokenizer.eos_token
    base = AutoModelForCausalLM.from_pretrained(MODEL, revision=REVISION, trust_remote_code=False,
                                                 use_safetensors=True, torch_dtype=torch.float32)
    config = LoraConfig(task_type=TaskType.CAUSAL_LM, r=8, lora_alpha=16,
                        lora_dropout=0.0, target_modules=["q_proj", "v_proj"])
    model = get_peft_model(base, config)
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    if trainable < 1:
        raise RuntimeError("NO_TRAINABLE_PARAMETERS")
    before_hash = weight_digest(model)
    print("BASELINE_EVALUATION_START", flush=True)
    before = score_examples(model, tokenizer, data["heldout"], torch)
    print("BASELINE_RESULT", json.dumps({"correct": before["correct"], "total": before["total"]}), flush=True)
    optimizer = torch.optim.AdamW((p for p in model.parameters() if p.requires_grad), lr=0.0005)
    rng = random.Random(SEED)
    losses = []
    model.train()
    for epoch in range(2):
        order = list(examples)
        rng.shuffle(order)
        for start in range(0, len(order), 4):
            batch = order[start:start+4]
            items = []
            for text, label in batch:
                prompt = prompt_ids(tokenizer, text)
                completion = response_ids(tokenizer, label)
                items.append((prompt + completion, [-100] * len(prompt) + completion))
            width = max(len(seq) for seq, _ in items)
            ids = torch.tensor([seq + [tokenizer.pad_token_id] * (width-len(seq)) for seq, _ in items])
            masks = torch.tensor([[1]*len(seq) + [0]*(width-len(seq)) for seq, _ in items])
            labels = torch.tensor([labels + [-100]*(width-len(labels)) for _, labels in items])
            optimizer.zero_grad(set_to_none=True)
            loss = model(input_ids=ids, attention_mask=masks, labels=labels, use_cache=False).loss
            if not math.isfinite(loss.item()):
                raise RuntimeError("NONFINITE_LOSS")
            loss.backward()
            optimizer.step()
            losses.append(loss.item())
        print("EPOCH_COMPLETE", epoch + 1, "steps", len(losses), flush=True)
    after_hash = weight_digest(model)
    if before_hash == after_hash:
        raise RuntimeError("TRAINABLE_PARAMETERS_UNCHANGED")
    print("POST_TRAINING_EVALUATION_START", flush=True)
    after = score_examples(model, tokenizer, data["heldout"], torch)
    report = {"status": "COMPLETED_RESEARCH_EXPERIMENT", "base_model": MODEL,
              "base_revision": REVISION, "seed": SEED, "training_examples": len(examples),
              "training_epochs": 2, "optimizer_steps": len(losses),
              "trainable_parameters": trainable, "first_loss": losses[0], "last_loss": losses[-1],
              "dataset_sha256": data_hash, "abstain_training_sha256": extra_hash,
              "adapter_before_sha256": before_hash, "adapter_after_sha256": after_hash,
              "baseline": before, "after_training": after,
              "evaluation_method": "FORCED_CHOICE_MEAN_TOKEN_LOG_LIKELIHOOD",
              "dataset_limitation": "TINY_HAND_AUTHORED_NONINDEPENDENT_SYNTHETIC_DATA",
              "base_weights_owned_by_velion": False, "adapter_saved": False,
              "deployed": False, "real_agents_trained": False, "actions_allowed": False}
    print("EXPERIMENT_JSON", json.dumps(report, sort_keys=True), flush=True)


if __name__ == "__main__":
    main()
