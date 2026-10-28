import importlib.util
from pathlib import Path
import unittest

file = Path(__file__).resolve().parents[1] / "scripts" / "nemotron3_work_tasks.py"
spec = importlib.util.spec_from_file_location("nemotron3_work_tasks", file)
import sys
sys.path.insert(0, str(file.parent))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class ModelWorkEvaluationTests(unittest.TestCase):
    def test_incident_diagnosis(self):
        x=module.score("automation_rate_limit",{
            "root_cause":"RATE_LIMIT","first_action":"BACKOFF_WITH_JITTER",
            "explanation":"Repeated requests must be delayed with backoff."})
        self.assertEqual(x["verdict"],"PASS")
        with self.assertRaises(ValueError):
            module.score("automation_rate_limit",{
                "root_cause":"RATE_LIMIT","first_action":"RETRY_IMMEDIATELY",
                "explanation":"Retry all failures."})

    def test_incident_safe_synonyms_but_not_unsafe_retry(self):
        d={"root_cause":"HTTP_429","first_action":"EXPONENTIAL_BACKOFF_WITH_JITTER",
           "explanation":"The API is throttling and all retries must be delayed safely."}
        self.assertEqual(module.score("automation_rate_limit",d)["verdict"],"PASS")
        with self.assertRaises(ValueError):
            module.score("automation_rate_limit",{**d,"first_action":"RETRY_IMMEDIATELY"})

    def test_commercial_gate_cannot_fake_payment(self):
        approved={"intake":"HOLD","dispatch":"DENY","payment":"UNVERIFIED",
            "explanation":"Privacy consent and approval are missing."}
        self.assertEqual(module.score("crm_authorization_gate",approved)["verdict"],"PASS")
        for invalid in ({"payment":"CONFIRMED"},{"intake":"ACCEPT"},{"dispatch":"ALLOW"}):
            d={**approved,**invalid}
            with self.assertRaises(ValueError):
                module.score("crm_authorization_gate",d)

    def test_model_written_code_requires_independent_tests(self):
        d={"fixed_code":"def unique_in_order(items):\n    return list(dict.fromkeys(items))",
           "explanation":"Dictionary keys preserve insertion order."}
        self.assertEqual(module.score("python_ordered_deduplication",d)["independent_tests"],5)
        with self.assertRaises(ValueError):
            module.score("python_ordered_deduplication",{
                **d,"fixed_code":"def unique_in_order(items):\n    return list(set(items))"})

    def test_model_code_cannot_import_or_read_files(self):
        d={"fixed_code":"def unique_in_order(items):\n    import os\n    return items",
           "explanation":"unsafe"}
        with self.assertRaises(ValueError):
            module.score("python_ordered_deduplication",d)

if __name__=="__main__":
    unittest.main()
