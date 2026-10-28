import importlib.util
import unittest
from pathlib import Path

script = Path(__file__).resolve().parents[1] / "scripts" / "nemotron3_cpu_probe.py"
spec = importlib.util.spec_from_file_location("nemotron3_probe", script)
probe = importlib.util.module_from_spec(spec)
spec.loader.exec_module(probe)


class ModelEvidenceTests(unittest.TestCase):
    def good_output(self):
        return {
            "model": "nemotron-3-nano:4b",
            "response": "NEMOTRON. Hello from the model.",
            "done": True,
            "eval_count": 9,
            "total_duration": 1900000000,
        }

    def test_real_nonempty_output_is_hashed(self):
        result = probe.validate_response(self.good_output())
        self.assertEqual(len(result["response_sha256"]), 64)
        self.assertEqual(result["generated_tokens"], 9)

    def test_mock_or_empty_is_rejected(self):
        for change in (
            {"model": "qwen:3b"},
            {"response": ""},
            {"done": False},
            {"eval_count": 0},
            {"eval_count": True},
        ):
            p = self.good_output()
            p.update(change)
            with self.assertRaises(probe.InferenceVerificationError):
                probe.validate_response(p)

    def test_proves_installed_local_weights(self):
        out = probe.validate_installed_model({"models": [{
            "name": "nemotron-3-nano:4b",
            "size": 2840000000,
            "digest": "a" * 64,
        }]})
        self.assertEqual(out["model_size_bytes"], 2840000000)
        with self.assertRaises(probe.InferenceVerificationError):
            probe.validate_installed_model({"models": [{"name": "nemotron-3-nano:4b",
                "size": 1, "digest": "a" * 64}]})

    def test_wrong_model_is_not_accepted(self):
        with self.assertRaises(probe.InferenceVerificationError):
            probe.validate_installed_model({"models": [{"name": "other", "size": 2840000000,
                "digest": "a" * 64}]})


if __name__ == "__main__":
    unittest.main()
