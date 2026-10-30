"""Tests for the synthetic, offline VELION/NCA intent-classifier lab."""
import copy
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "training" / "intent_lab" / "intent_lab.py"
spec = importlib.util.spec_from_file_location("intent_lab", SCRIPT)
lab = importlib.util.module_from_spec(spec)
spec.loader.exec_module(lab)


class IntentLabTests(unittest.TestCase):
    def setUp(self):
        self.data, _ = lab.load_dataset()

    def test_training_is_deterministic_and_ignores_heldout_labels(self):
        first = lab.train(self.data)
        altered = copy.deepcopy(self.data)
        altered["heldout"][0]["label"] = "ABSTAIN"
        self.assertEqual(lab.canonical_json(first), lab.canonical_json(lab.train(altered)))
        self.assertEqual(first["usage"], "OFFLINE_SYNTHETIC_ADVISORY_ONLY")

    def test_unseen_vocabulary_abstains(self):
        self.assertEqual(lab.predict(lab.train(self.data), "Zebras graze beneath azure skies"), "ABSTAIN")

    def test_metrics_count_each_case_and_do_not_hide_errors(self):
        report = lab.evaluate(self.data, lab.train(self.data))
        matrix_total = sum(sum(row.values()) for row in report["confusion_matrix"].values())
        self.assertEqual(matrix_total, len(self.data["heldout"]))
        self.assertEqual(report["correct"], sum(x["expected"] == x["predicted"] for x in report["cases"]))
        self.assertEqual(report["assigned_correct"], sum(x["expected"] == x["predicted"] and x["predicted"] != "ABSTAIN" for x in report["cases"]))

    def test_train_holdout_duplicate_rejected(self):
        self.data["heldout"][0]["text"] = self.data["train"]["CODE_REVIEW"][0]
        with tempfile.TemporaryDirectory() as d:
            path = Path(d) / "data.json"
            path.write_text(json.dumps(self.data), encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "DUPLICATE_OR_LEAKED_TEXT"):
                lab.load_dataset(path)

    def test_duplicate_heldout_id_rejected(self):
        self.data["heldout"][1]["id"] = self.data["heldout"][0]["id"]
        with tempfile.TemporaryDirectory() as d:
            path = Path(d) / "data.json"
            path.write_text(json.dumps(self.data), encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "HELDOUT_ID_INVALID"):
                lab.load_dataset(path)

    def test_model_export_is_create_only(self):
        with tempfile.TemporaryDirectory() as d:
            target = Path(d) / "model.json"
            first = subprocess.run([sys.executable, str(SCRIPT), "--model-out", str(target)], capture_output=True, text=True)
            self.assertEqual(first.returncode, 0, first.stderr)
            before = target.read_bytes()
            second = subprocess.run([sys.executable, str(SCRIPT), "--model-out", str(target)], capture_output=True, text=True)
            self.assertNotEqual(second.returncode, 0)
            self.assertEqual(before, target.read_bytes())
            self.assertFalse(json.loads(first.stdout)["actions_allowed"])

    def test_long_or_non_text_input_rejected(self):
        for value in (None, "x" * 2001):
            with self.assertRaises(ValueError):
                lab.predict(lab.train(self.data), value)


if __name__ == "__main__":
    unittest.main()
