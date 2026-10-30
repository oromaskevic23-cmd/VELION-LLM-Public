import copy
import importlib.util
from pathlib import Path
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "training" / "intent_lab"))
from intent_lab import load_dataset  # noqa: E402
spec = importlib.util.spec_from_file_location("lora_pilot", ROOT / "training" / "intent_lab" / "lora_pilot.py")
pilot = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pilot)


class PilotInputTests(unittest.TestCase):
    def test_has_six_balanced_classes(self):
        data, _ = load_dataset()
        examples = pilot.training_examples(data)
        self.assertEqual(len(examples), 48)
        for label in pilot.ALL_LABELS:
            self.assertEqual(sum(y == label for _, y in examples), 8)

    def test_abstain_train_heldout_collision_is_rejected(self):
        data, _ = load_dataset()
        altered = copy.deepcopy(data)
        altered["heldout"][0]["text"] = pilot.training_examples(data)[-1][0]
        with self.assertRaisesRegex(ValueError, "TRAIN_EVALUATION_OVERLAP"):
            pilot.training_examples(altered)

    def test_base_model_is_pinned(self):
        self.assertEqual(len(pilot.REVISION), 40)
        self.assertEqual(pilot.MODEL, "HuggingFaceTB/SmolLM2-135M-Instruct")


if __name__ == "__main__":
    unittest.main()
