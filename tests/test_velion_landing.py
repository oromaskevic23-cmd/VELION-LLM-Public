"""Offline validation for a public VELION HTML identity/JSON-LD page."""
import json
import re
import unittest
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse

PATH = Path(__file__).resolve().parents[1] / "docs" / "index.html"
class Parser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
        self.meta = []
    def handle_starttag(self, tag, attrs):
        data = dict(attrs)
        if tag == "a": self.links.append(data.get("href", ""))
        if tag == "meta": self.meta.append(data)

class LandingTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.html = PATH.read_text(encoding="utf-8")
        cls.parser = Parser(); cls.parser.feed(cls.html)
        found = re.search(r'<script type="application/ld\\+json">\\s*(.*?)\\s*</script>',cls.html,re.S)
        if not found: raise ValueError("JSON-LD script missing")
        cls.data = json.loads(found.group(1))
    def test_two_structured_entities(self):
        self.assertEqual({n["@type"] for n in self.data["@graph"]},{"Person","SoftwareSourceCode"})
    def test_visible_person_matches_structured_person(self):
        self.assertIn("Alexander Nikolaevich Romaskevich",self.html)
        self.assertEqual(self.data["@graph"][0]["name"],"Alexander Nikolaevich Romaskevich")
    def test_creator_is_real_github_profile(self):
        self.assertEqual(self.data["@graph"][1]["creator"]["@id"],self.data["@graph"][0]["@id"])
        self.assertEqual(self.data["@graph"][0]["url"],"https://github.com/oromaskevic23-cmd")
    def test_exact_source_reference(self):
        self.assertEqual(self.data["@graph"][1]["codeRepository"],"https://github.com/oromaskevic23-cmd/VELION-LLM-Public")
    def test_no_false_production_claim(self):
        self.assertIn("does not itself run a model",self.html)
    def test_no_private_or_paid_contact(self):
        self.assertNotIn("service_role",self.html.lower())
        self.assertNotIn("private key",self.html.lower())
    def test_absolute_public_links(self):
        self.assertTrue(self.parser.links)
        self.assertTrue(all(urlparse(link).scheme=="https" and urlparse(link).netloc=="github.com"
            for link in self.parser.links))
    def test_no_noindex(self):
        robots=[m.get("content","").lower() for m in self.parser.meta if m.get("name")=="robots"]
        self.assertTrue(robots)
        self.assertNotIn("noindex",",".join(robots))
    def test_no_fabricated_canonical_before_deploy(self):
        self.assertNotRegex(self.html,r'<link\\s+rel="canonical"')
if __name__=="__main__":unittest.main()
