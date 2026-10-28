"""VELION on-demand model router: reviewed fixtures, real local model, proposal only.

Task origin is NOT authorization. There is no arbitrary-prompt or customer-facing API.
"""
import hashlib
import json
import re

MODEL = "nemotron-3-nano:4b"
SCHEMA = "imperial_velion_task_v1"
TASKS = {
  "IC-CONSTRUCTOR-ORDER-001": {
    "origin": "CONSTRUCTOR_AI", "capability": "code:review",
    "prompt": (
      "OFFLINE SYNTHETIC CONSTRUCTOR AI CODE REVIEW. The function "
      "'def unique_in_order(items): return list(set(items))' loses input order. "
      "Return ONLY one JSON object, no markdown or extra keys. EXACT EXAMPLE: "
      "'{\"decision\":\"ORDER_LOSS\",\"recommendation\":\"PRESERVE_INSERTION_ORDER\","
      "\"explanation\":\"Maintain first-seen order by tracking visited items.\"}'. "
      "This is an untrusted proposal, "
      "never an executed fix or proof of a production deployment."),
    "decision": "ORDER_LOSS", "recommendation": "PRESERVE_INSERTION_ORDER"
  },
  "IC-NCA-HTTP429-001": {
    "origin": "NCA", "capability": "incident:triage",
    "prompt": (
      "OFFLINE SYNTHETIC NCA INCIDENT TRIAGE. A webhook client sees HTTP 429 "
      "Too Many Requests but retries immediately, worsening failures. "
      "Return ONLY one JSON object, no markdown or extra keys. EXACT EXAMPLE: "
      "'{\"decision\":\"RATE_LIMIT\",\"recommendation\":\"BACKOFF_WITH_JITTER\","
      "\"explanation\":\"HTTP 429 calls for delayed retries with jitter.\"}'. "
      "Do not execute, contact any customer, "
      "spend funds or claim an incident has been resolved."),
    "decision": "RATE_LIMIT", "recommendation": "BACKOFF_WITH_JITTER"
  }
}
class RoutingDenied(ValueError):
  """Fail closed. Return only a non-sensitive reason code."""

def digest(text):
  return hashlib.sha256(text.encode("utf8")).hexdigest()

def canonical_task(task_id):
  if not isinstance(task_id,str) or not re.fullmatch(r"IC-(CONSTRUCTOR|NCA)-[A-Z0-9-]{3,48}",task_id):
    raise RoutingDenied("TASK_ID_INVALID")
  task=TASKS.get(task_id)
  if task is None:
    raise RoutingDenied("UNREVIEWED_TASK_DENIED")
  return {"schema":SCHEMA,"task_id":task_id,"origin":task["origin"],
    "capability":task["capability"],"prompt":task["prompt"],
    "model":MODEL,"data_class":"PUBLIC_SYNTHETIC","execution":"PROPOSAL_ONLY"}

def validate_request(envelope):
  if not isinstance(envelope,dict) or set(envelope)!=set(canonical_task("IC-NCA-HTTP429-001")):
    raise RoutingDenied("ENVELOPE_SCHEMA_DENIED")
  expected=canonical_task(envelope.get("task_id"))
  if expected!=envelope:
    raise RoutingDenied("ENVELOPE_MUTATION_DENIED")
  return expected

def model_registry(tags):
  if not isinstance(tags,dict) or not isinstance(tags.get("models"),list):
    raise RoutingDenied("MODEL_REGISTRY_UNVERIFIED")
  for item in tags["models"]:
    if isinstance(item,dict) and item.get("name")==MODEL:
      size=item.get("size")
      sha=item.get("digest")
      if type(size) is int and size>=1500000000 and isinstance(sha,str) and re.fullmatch("[a-f0-9]{64}",sha):
        return {"model_size_bytes":size,"ollama_digest":sha}
      raise RoutingDenied("MODEL_WEIGHT_IDENTITY_UNVERIFIED")
  raise RoutingDenied("MODEL_NOT_PRESENT")

def normalize(label):
  if not isinstance(label,str) or len(label)>100:
    raise RoutingDenied("MODEL_LABEL_INVALID")
  return "_".join(part.strip() for part in label.strip().upper().split("_"))

def verify_decision(task_id, answer):
  task=TASKS[task_id]
  if not isinstance(answer,dict) or set(answer)!={"decision","recommendation","explanation"}:
    raise RoutingDenied("MODEL_RESPONSE_SCHEMA_DENIED")
  decision=normalize(answer["decision"])
  action=normalize(answer["recommendation"])
  if (decision,action)!=(task["decision"],task["recommendation"]):
    raise RoutingDenied("MODEL_UNSAFE_OR_INCORRECT")
  reason=answer["explanation"]
  if not isinstance(reason,str) or not 12<=len(reason.strip())<=1500:
    raise RoutingDenied("MODEL_REASON_MISSING")
  return {"decision":decision,"recommendation":action,"reason_sha256":digest(reason),
    "verification":"BOUNDED_SEMANTIC_PASS","execute_allowed":False,"payment_confirmed":False}

def route(envelope, *, tags, generate):
  request=validate_request(envelope)
  weights=model_registry(tags)
  if not callable(generate):
    raise RoutingDenied("MODEL_TRANSPORT_MISSING")
  answer=generate({"model":MODEL,"prompt":request["prompt"],
    "stream":False,"think":False,"format":"json",
    "options":{"temperature":0.0,"num_ctx":3072,"num_predict":200},
    "keep_alive":"3m"})
  if not isinstance(answer,dict) or answer.get("model")!=MODEL or answer.get("done") is not True:
    raise RoutingDenied("MODEL_IDENTITY_OR_COMPLETION_INVALID")
  tokens=answer.get("eval_count")
  raw=answer.get("response")
  if type(tokens) is not int or not 1<=tokens<=4096 or not isinstance(raw,str) or not 1<=len(raw)<=10000:
    raise RoutingDenied("MODEL_GENERATION_UNVERIFIED")
  try:
    parsed=json.loads(raw)
  except ValueError as exc:
    raise RoutingDenied("MODEL_RESPONSE_NOT_JSON") from exc
  result=verify_decision(request["task_id"],parsed)
  return {"schema":"imperial_velion_receipt_v1",
    "task_id":request["task_id"],"origin":request["origin"],
    "capability":request["capability"],"status":"VERIFIED_PROPOSAL_ONLY",
    "provider":"NVIDIA_NEMOTRON3_LOCAL_OLLAMA","model":MODEL,
    "request_sha256":digest(json.dumps(request,sort_keys=True,separators=(",",":"))),
    "output_sha256":digest(raw),"generated_tokens":tokens,
    **weights,**result,
    "execution":"NOT_EXECUTED","human_approval":"NOT_GRANTED_BY_ROUTER",
    "runtime":"EPHEMERAL_LOCALHOST_CPU"}
