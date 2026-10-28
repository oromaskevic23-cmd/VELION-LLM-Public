#!/usr/bin/env python3
"""Verify an actual local Ollama inference from NVIDIA Nemotron 3 Nano 4B.

Offline tests cover response validation; running this script calls only
127.0.0.1, after the isolated runner has installed the official model.
No private prompts, API keys or paid inference.
"""
from __future__ import annotations

import hashlib
import json
import os
import pathlib
import re
import time
import urllib.error
import urllib.request

MODEL = "nemotron-3-nano:4b"
BASE_URL = "http://127.0.0.1:11434"
PROMPT = "For a model execution smoke test, reply with the word NEMOTRON and one short sentence."
OUTPUT = pathlib.Path("artifacts/nemotron3/nemotron3_cpu_receipt.json")


class InferenceVerificationError(RuntimeError):
    pass


def validate_response(payload: object) -> dict:
    if not isinstance(payload, dict):
        raise InferenceVerificationError("NON_OBJECT_RESPONSE")
    if payload.get("model") != MODEL:
        raise InferenceVerificationError("WRONG_MODEL_IDENTITY")
    response = payload.get("response")
    if not isinstance(response, str) or not response.strip():
        raise InferenceVerificationError("EMPTY_GENERATION")
    if payload.get("done") is not True:
        raise InferenceVerificationError("GENERATION_NOT_COMPLETE")
    count = payload.get("eval_count")
    if not isinstance(count, int) or isinstance(count, bool) or count < 1:
        raise InferenceVerificationError("NO_GENERATED_TOKENS")
    if len(response) > 40000:
        raise InferenceVerificationError("UNEXPECTED_OUTPUT_SIZE")
    return {
        "generated_tokens": count,
        "response_sha256": hashlib.sha256(response.encode("utf-8")).hexdigest(),
        "output_excerpt": re.sub(r"[\r\n\t]", " ", response.strip())[:240],
        "total_duration_ns": payload.get("total_duration"),
    }


def request_json(path: str, body: dict | None = None, timeout=180) -> object:
    url = BASE_URL + path
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(
        url, data=data, method="POST" if data is not None else "GET",
        headers={"Content-Type": "application/json"} if data else {},
    )
    with urllib.request.urlopen(req, timeout=timeout) as response:
        if response.status != 200:
            raise InferenceVerificationError("LOCAL_RUNTIME_HTTP_ERROR")
        raw = response.read(5_000_001)
        if len(raw) > 5_000_000:
            raise InferenceVerificationError("LOCAL_RUNTIME_RESPONSE_OVERSIZE")
    return json.loads(raw)


def validate_installed_model(tags: object) -> dict:
    if not isinstance(tags, dict) or not isinstance(tags.get("models"), list):
        raise InferenceVerificationError("NO_LOCAL_MODEL_REGISTRY")
    for entry in tags["models"]:
        if not isinstance(entry, dict):
            continue
        if entry.get("name") != MODEL:
            continue
        size = entry.get("size")
        digest = entry.get("digest")
        if not isinstance(size, int) or size < 1_500_000_000 or not isinstance(digest, str):
            raise InferenceVerificationError("MODEL_WEIGHTS_NOT_CONFIRMED")
        if not re.fullmatch(r"[a-f0-9]{64}", digest):
            raise InferenceVerificationError("BAD_MODEL_DIGEST")
        return {"model_size_bytes": size, "ollama_digest": digest}
    raise InferenceVerificationError("EXPECTED_MODEL_NOT_INSTALLED")


def main() -> None:
    tags = validate_installed_model(request_json("/api/tags", timeout=12))
    t0 = time.monotonic()
    response = request_json("/api/generate", {
        "model": MODEL,
        "prompt": PROMPT,
        "stream": False,
        "think": False,
        "options": {"temperature": 0.1, "num_ctx": 2048, "num_predict": 128},
        "keep_alive": 0,
    }, timeout=300)
    verified = validate_response(response)
    receipt = {
        "status": "REAL_EXTERNAL_MODEL_INFERENCE_VERIFIED",
        "verified_model": "NVIDIA Nemotron 3 Nano 4B",
        "model_registry_name": MODEL,
        "execution": "LOCALHOST_CPU_EPHEMERAL_CI_ONLY",
        "runtime": "Ollama Docker on GitHub Actions runner",
        "source_commit": os.environ.get("GITHUB_SHA", "unknown"),
        "evaluation_elapsed_ms": round((time.monotonic() - t0) * 1000),
        **tags,
        **verified,
        "cost_boundary": "FREE_ONLY_NO_PAID_PROVIDER",
        "authorization": "NO_EXTERNAL_ACTIONS_OR_CUSTOMER_DATA",
        "limitations": "Not VELION-owned weights, not a persistent model server, not proof of production availability",
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(receipt, sort_keys=True, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({k: receipt[k] for k in
        ("status", "verified_model", "model_size_bytes", "generated_tokens",
         "response_sha256", "output_excerpt", "execution", "limitations")}, ensure_ascii=False))
    print("EVIDENCE_WRITTEN: " + str(OUTPUT))


if __name__ == "__main__":
    main()
