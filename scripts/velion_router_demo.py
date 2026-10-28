#!/usr/bin/env python3
"""One-shot VELION governed model routing on a local CPU runner.

Only source-controlled fixtures; never accepts shell commands, caller URLs,
client prompts, private data, permissions or spending requests.
"""
import json
import os
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"src"))
from velion_model_router import TASKS, RoutingDenied, canonical_task, model_registry, route
from nemotron3_cpu_probe import request_json

OUTPUT=Path("artifacts/nemotron3/velion_router_receipt.json")
def generate(body):
  return request_json("/api/generate",body,timeout=190)

def main():
  tags=request_json("/api/tags",timeout=12)
  confirmed=model_registry(tags)
  evidence=[]
  for tid in TASKS:
    try:
      receipt=route(canonical_task(tid),tags=tags,generate=generate)
      evidence.append(receipt)
      print(json.dumps({"task_id":tid,"origin":receipt["origin"],
        "status":receipt["status"],"decision":receipt["decision"],
        "recommendation":receipt["recommendation"],
        "generated_tokens":receipt["generated_tokens"],
        "output_sha256":receipt["output_sha256"],
        "execution":receipt["execution"]},sort_keys=True),flush=True)
    except Exception as exc:
      # No model body, prompt or user data in logs.
      code=str(exc) if isinstance(exc,RoutingDenied) else type(exc).__name__
      evidence.append({"task_id":tid,"status":"FAILED_CLOSED","reason_code":code[:120]})
      print(json.dumps({"task_id":tid,"status":"FAILED_CLOSED","reason_code":code[:120]}),flush=True)
  verified=sum(x["status"]=="VERIFIED_PROPOSAL_ONLY" for x in evidence)
  summary={"status":"PASS" if verified==len(TASKS) else "PARTIAL_OR_FAILED",
    "model":"NVIDIA Nemotron 3 Nano 4B",
    "model_tag":"nemotron-3-nano:4b",
    "model_registry":confirmed,
    "task_count":len(TASKS),"verified_proposals":verified,
    "source_commit":os.environ.get("GITHUB_SHA","unknown"),
    "tasks":evidence,
    "security_boundary":"REVIEWED_SYNTHETIC_FIXTURES_ONLY",
    "execution":"NO_EXTERNAL_ACTIONS_NO_DEPLOYMENTS_NO_PAYMENTS",
    "runtime":"EPHEMERAL_LOCAL_CPU_NOT_24_7",
    "production_integrations":"CONSTRUCTOR_AND_NCA_NOT_CONNECTED_TO_PERSISTENT_RUNTIME"}
  OUTPUT.parent.mkdir(parents=True,exist_ok=True)
  OUTPUT.write_text(json.dumps(summary,indent=2,sort_keys=True)+"\n",encoding="utf8")
  print("VELION_ROUTER_SUMMARY: "+json.dumps({"status":summary["status"],
    "verified_proposals":verified,"total":len(TASKS),
    "production_integrations":summary["production_integrations"]}),flush=True)
  print("EVIDENCE_WRITTEN: "+str(OUTPUT),flush=True)
  if verified!=len(TASKS):
    raise SystemExit(1)

if __name__=="__main__":
  main()
