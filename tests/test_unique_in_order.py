import importlib.util
from pathlib import Path
import unittest

modulepath=Path(__file__).resolve().parents[1]/"src"/"unique_in_order.py"
spec=importlib.util.spec_from_file_location("ordered_dedupe",modulepath)
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class UniqueEventIdTests(unittest.TestCase):
    def test_integer_events(self):
        self.assertEqual(module.unique_in_order([1,2,1,3,2]),[1,2,3])
    def test_string_events(self):
        self.assertEqual(module.unique_in_order(["a","b","a","c"]),["a","b","c"])
    def test_empty(self):
        self.assertEqual(module.unique_in_order([]),[])
    def test_no_mutation(self):
        orig=["a","a","b"]; expected=orig[:]
        module.unique_in_order(orig)
        self.assertEqual(orig,expected)
    def test_types(self):
        self.assertEqual(module.unique_in_order([True, False, True]),[True,False])
    def test_tuple_keys(self):
        self.assertEqual(module.unique_in_order([("q",1),("q",1),("q",2)]),[("q",1),("q",2)])

if __name__=="__main__":unittest.main()
