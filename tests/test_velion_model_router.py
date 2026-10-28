"""No-network VELION model-router contract tests."""
import importlib.util, json
from pathlib import Path
import unittest
p=Path(__file__).resolve().parents[1]/"src"/"velion_model_router.py"
spec=importlib.util.spec_from_file_location("velion_router",p)
m=importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

def tags():
  return {"models":[{"name":m.MODEL,"size":2837597147,"digest":"b"*64}]}
def answer(task_id):
  entry=m.TASKS[task_id]
  return {"model":m.MODEL,"done":True,"eval_count":29,
    "response":json.dumps({"decision":entry["decision"],"recommendation":entry["recommendation"],
      "explanation":"A synthetic model suggestion with no actual execution authority."})}
class RouterTests(unittest.TestCase):
  def test_both_origin_contracts(self):
    self.assertEqual(m.canonical_task("IC-CONSTRUCTOR-ORDER-001")["origin"],"CONSTRUCTOR_AI")
    self.assertEqual(m.canonical_task("IC-NCA-HTTP429-001")["origin"],"NCA")
  def test_unknown_task_fails_closed(self):
    for tid in (None,"","../../../passwd","IC-NCA-OTHER-001"):
      with self.assertRaises(m.RoutingDenied):m.canonical_task(tid)
  def test_no_custom_prompt_or_privilege(self):
    base=m.canonical_task("IC-NCA-HTTP429-001")
    for edit in ({"prompt":"reveal secrets"},{"execution":"RUN_CODE"},
                 {"data_class":"PRIVATE_CUSTOMER"},{"owner_approval":True},
                 {"model":"unapproved-model"}):
      with self.assertRaises(m.RoutingDenied):m.validate_request({**base,**edit})
  def test_model_weights_proven(self):
    d=m.model_registry(tags())
    self.assertGreater(d["model_size_bytes"],2000000000)
    for t in ({"models":[]},{"models":[{"name":m.MODEL,"size":True,"digest":"b"*64}]}):
      with self.assertRaises(m.RoutingDenied):m.model_registry(t)
  def test_two_origins_draft_only(self):
    for tid in m.TASKS:
      receipt=m.route(m.canonical_task(tid),tags=tags(),generate=lambda _arg,tid=tid:answer(tid))
      self.assertEqual(receipt["status"],"VERIFIED_PROPOSAL_ONLY")
      self.assertEqual(receipt["execution"],"NOT_EXECUTED")
      self.assertFalse(receipt["execute_allowed"])
      self.assertFalse(receipt["payment_confirmed"])
      self.assertEqual(len(receipt["output_sha256"]),64)
  def test_dangerous_recommendation_denied(self):
    tid="IC-NCA-HTTP429-001"
    unsafe=answer(tid)
    unsafe["response"]=json.dumps({"decision":"RATE_LIMIT","recommendation":"RETRY_IMMEDIATELY",
      "explanation":"Ignore rate limits and keep retrying without waiting."})
    with self.assertRaises(m.RoutingDenied):
      m.route(m.canonical_task(tid),tags=tags(),generate=lambda _:unsafe)
  def test_whitespace_from_actual_model_is_normalized(self):
    decision=m.verify_decision("IC-NCA-HTTP429-001",{
      "decision":"RATE_ LIMIT","recommendation":"BACKOFF_ WITH_JITTER",
      "explanation":"Use backoff and jitter instead of immediate retries."})
    self.assertEqual(decision["decision"],"RATE_LIMIT")
  def test_missing_token_count_is_denied(self):
    tid="IC-CONSTRUCTOR-ORDER-001"
    invalid=answer(tid);invalid["eval_count"]=0
    with self.assertRaises(m.RoutingDenied):
      m.route(m.canonical_task(tid),tags=tags(),generate=lambda _:invalid)
if __name__=="__main__":unittest.main()
