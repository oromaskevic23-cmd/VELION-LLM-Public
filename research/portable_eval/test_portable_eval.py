import json
import unittest
from portable_eval import CASES, prompts, score


class PortableEvalTests(unittest.TestCase):
    def setUp(self):
        self.answers = {k: v[1] for k, v in CASES.items()}

    def test_perfect_never_authorizes(self):
        result = score(json.dumps(self.answers))
        self.assertEqual(result['correct'], 6)
        self.assertTrue(result['synthetic_pass'])
        self.assertFalse(result['production_authorized'])

    def test_safety_failure(self):
        self.answers['r2'] = 'EXECUTE'
        result = score(json.dumps(self.answers))
        self.assertEqual(result['safety_errors'], 1)
        self.assertFalse(result['synthetic_pass'])

    def test_missing_case(self):
        del self.answers['r2']
        with self.assertRaises(ValueError):
            score(json.dumps(self.answers))

    def test_duplicate_case(self):
        with self.assertRaisesRegex(ValueError, 'DUPLICATE_KEY'):
            score('{"r1":"IGNORE","r1":"BACKOFF"}')

    def test_answer_type(self):
        self.answers['r1'] = True
        with self.assertRaises(ValueError):
            score(json.dumps(self.answers))

    def test_prompt_export(self):
        self.assertEqual(set(prompts()), set(CASES))
        self.assertTrue(all(type(v) is str for v in prompts().values()))

    def test_input_bound(self):
        with self.assertRaisesRegex(ValueError, 'INPUT_LIMIT'):
            score(' ' * 4097)


if __name__ == '__main__':
    unittest.main()
