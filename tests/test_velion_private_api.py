"""Integration contract tests with localhost API; fake model only in offline tests."""
import hashlib,hmac,http.client,importlib.util,json,secrets,threading,time,unittest
from pathlib import Path
p=Path(__file__).resolve().parents[1]/"scripts"/"velion_private_api.py"
spec=importlib.util.spec_from_file_location("velion_private",p)
mod=importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
from velion_model_router import TASKS
SECRET="test-only-velion-private-gate-"+"x"*40
def fake_model(path,args=None):
    if path=="/api/tags":
        return {"models":[{"name":"nemotron-3-nano:4b","size":2837597147,"digest":"a"*64}]}
    task="IC-NCA-HTTP429-001" if "HTTP 429" in args["prompt"] else "IC-CONSTRUCTOR-ORDER-001"
    t=TASKS[task]
    return {"model":"nemotron-3-nano:4b","done":True,"eval_count":32,
        "response":json.dumps({"decision":t["decision"],"recommendation":t["recommendation"],
        "explanation":"This is a verified proposal and cannot authorize execution."})}
class ApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server=mod.PrivateServer("127.0.0.1",0,secret=SECRET,model_call=fake_model)
        cls.thread=threading.Thread(target=cls.server.serve_forever,daemon=True)
        cls.thread.start()
    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown();cls.server.server_close();cls.thread.join(3)
    def request(self,data=None,secret=SECRET,nonce=None,when=None,wrong=False):
        data=data or {"schema":mod.VERSION,"task_id":"IC-NCA-HTTP429-001","origin":"NCA"}
        body=json.dumps(data).encode()
        timestamp=str(when if when is not None else int(time.time()))
        nonce=nonce or secrets.token_urlsafe(18)
        signature=hmac.new(secret.encode(),mod.signed_payload(timestamp,nonce,body),hashlib.sha256).hexdigest()
        if wrong:signature="f"*64
        headers={"Content-Type":"application/json","X-Velion-Timestamp":timestamp,
           "X-Velion-Nonce":nonce,"X-Velion-Signature":signature}
        c=http.client.HTTPConnection("127.0.0.1",self.server.server_port,timeout=10)
        c.request("POST",mod.PATH,body,headers)
        r=c.getresponse();data=json.loads(r.read());status=r.status;c.close()
        return status,data
    def test_nca_only_proposal(self):
        status,result=self.request()
        self.assertEqual(status,200)
        self.assertFalse(result["execute_allowed"])
        self.assertFalse(result["payment_confirmed"])
        self.assertEqual(result["status"],"VERIFIED_PROPOSAL_ONLY")
    def test_constructor_contract(self):
        status,doc=self.request({"schema":mod.VERSION,"task_id":"IC-CONSTRUCTOR-ORDER-001","origin":"CONSTRUCTOR_AI"})
        self.assertEqual(status,200)
        self.assertEqual(doc["decision"],"ORDER_LOSS")
    def test_bad_signature(self):
        self.assertEqual(self.request(wrong=True)[0],403)
        self.assertEqual(self.request(secret="wrong-secret-should-be-rejected-012345")[0],403)
    def test_replay(self):
        n=secrets.token_urlsafe(18)
        self.assertEqual(self.request(nonce=n)[0],200)
        self.assertEqual(self.request(nonce=n)[0],403)
    def test_expiry(self):
        self.assertEqual(self.request(when=int(time.time())-200)[0],403)
    def test_invalid_origin(self):
        self.assertEqual(self.request({"schema":mod.VERSION,"task_id":"IC-NCA-HTTP429-001","origin":"CONSTRUCTOR_AI"})[0],422)
    def test_unreviewed_task(self):
        self.assertEqual(self.request({"schema":mod.VERSION,"task_id":"IC-NCA-SHELL-001","origin":"NCA"})[0],422)
    def test_private_fields_denied(self):
        self.assertEqual(self.request({"schema":mod.VERSION,"task_id":"IC-NCA-HTTP429-001",
            "origin":"NCA","private_email":"secret@example.test"})[0],422)
    def test_health_never_claims_model_ready(self):
        c=http.client.HTTPConnection("127.0.0.1",self.server.server_port)
        c.request("GET","/health");r=c.getresponse();body=json.loads(r.read());c.close()
        self.assertEqual(body["model_status"],"NOT_CHECKED_BY_HEALTH")
    def test_no_public_bind(self):
        with self.assertRaises(ValueError):
            mod.PrivateServer("0.0.0.0",0,secret=SECRET)
if __name__=="__main__":unittest.main()
