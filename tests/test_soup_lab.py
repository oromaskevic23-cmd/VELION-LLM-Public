"""No network, GPU, training or external services are needed for these gates."""
import importlib.util
from pathlib import Path
import unittest
from unittest.mock import patch

MODULE_PATH = Path(__file__).resolve().parents[1] / "training" / "soup" / "soup_lab.py"
spec = importlib.util.spec_from_file_location("velion_soup_lab", MODULE_PATH)
lab = importlib.util.module_from_spec(spec)
spec.loader.exec_module(lab)


class SoupLabSafetyTests(unittest.TestCase):
    def test_python_support_contract(self):
        for p in ((3, 11), (3, 12), (3, 13)):
            self.assertTrue(lab.python_supported(p))
        self.assertFalse(lab.python_supported((3, 10)))
        self.assertFalse(lab.python_supported((3, 14)))

    def test_pinned_version(self):
        self.assertEqual(lab.SOUP_VERSION, "0.77.0")
        for req in ("requirements-cli.txt", "requirements-train.txt"):
            content = (lab.HERE / req).read_text()
            self.assertIn("==0.77.0", content)
            self.assertNotIn("git+", content)

    def test_train_deps_are_opt_in(self):
        with patch.object(lab, "python_supported", return_value=True):
            with patch.object(lab, "ENV") as mock_env:
                result = lab.install("train", False)
        self.assertEqual(result, 3)
        self.assertFalse(mock_env.exists.called)

    def test_no_model_or_secret_deployment(self):
        source = MODULE_PATH.read_text()
        self.assertNotIn("soup train --yes", source)
        self.assertNotIn("api/pull", source)
        self.assertNotIn("GITHUB_TOKEN", source)
        self.assertNotIn("service_role", source)

    def test_ignore_private_artifacts(self):
        ignore = (lab.HERE / ".gitignore").read_text()
        for path in ("/datasets-private/", "/adapters/", "/checkpoints/", "/.venv/"):
            self.assertIn(path, ignore)


if __name__ == "__main__":
    unittest.main()
