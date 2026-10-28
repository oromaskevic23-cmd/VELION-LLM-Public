"""Loopback-only HMAC-signed interface to VELION's verified Nemotron router.

Reviewed synthetic tasks only. No external URL, arbitrary prompt, customer
payload, shell execution, credential logging, payment or production dispatch.
"""
import hashlib, hmac, json, os, re, sys, threading, time, urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
from velion_model_router import RoutingDenied, canonical_task, route

PATH="/v1/model/proposals"
VERSION="velion_private_request_v1"
MAX_BYTES=512
NONCE=re.compile(r"^[A-Za-z0-9_-]{12,80}$")
SHA=re.compile(r"^[a-f0-9]{64}$")
def signed_payload(timestamp,nonce,raw):
    return ("POST\n"+PATH+"\n"+timestamp+"\n"+nonce+"\n"+hashlib.sha256(raw).hexdigest()).encode("ascii")
def model_api(path,body=None):
    if path not in ("/api/tags","/api/generate"):
        raise RoutingDenied("MODEL_ENDPOINT_NOT_ALLOWED")
    raw=None if body is None else json.dumps(body).encode()
    req=urllib.request.Request("http://127.0.0.1:11434"+path,data=raw,
        headers={"Content-Type":"application/json"} if raw else {},
        method="POST" if raw else "GET")
    with urllib.request.urlopen(req,timeout=180 if raw else 10) as response:
        if response.status!=200:
            raise RoutingDenied("MODEL_ENDPOINT_FAILED")
        data=response.read(12001)
        if len(data)>12000:
            raise RoutingDenied("MODEL_RESPONSE_OVERSIZE")
    return json.loads(data)
def reply(handler,status,data):
    body=json.dumps(data,separators=(",",":"),sort_keys=True).encode()
    handler.send_response(status)
    handler.send_header("Content-Type","application/json")
    handler.send_header("Content-Length",str(len(body)))
    handler.send_header("Cache-Control","no-store")
    handler.send_header("X-Content-Type-Options","nosniff")
    handler.end_headers()
    handler.wfile.write(body)
class PrivateServer(ThreadingHTTPServer):
    daemon_threads=True
    allow_reuse_address=True
    def __init__(self,host,port,*,secret,model_call=model_api,clock=time.time):
        if host!="127.0.0.1":
            raise ValueError("LOOPBACK_ONLY")
        if not isinstance(secret,str) or not 32<=len(secret.encode())<=4096:
            raise ValueError("STRONG_SECRET_REQUIRED")
        self.secret=secret.encode()
        self.model_call=model_call
        self.clock=clock
        self.nonces={}
        self.guard=threading.Lock()
        super().__init__((host,port),PrivateHandler)
    def authorize(self,handler,body):
        timestamp=handler.headers.get("X-Velion-Timestamp","")
        nonce=handler.headers.get("X-Velion-Nonce","")
        signature=handler.headers.get("X-Velion-Signature","")
        if not timestamp.isdecimal() or len(timestamp)>14 or not NONCE.fullmatch(nonce) or not SHA.fullmatch(signature):
            raise RoutingDenied("SIGNATURE_REQUIRED")
        now=int(self.clock())
        if abs(now-int(timestamp))>60:
            raise RoutingDenied("SIGNATURE_EXPIRED")
        expected=hmac.new(self.secret,signed_payload(timestamp,nonce,body),hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected,signature):
            raise RoutingDenied("SIGNATURE_INVALID")
        with self.guard:
            self.nonces={key:expiry for key,expiry in self.nonces.items() if expiry>now}
            if nonce in self.nonces:
                raise RoutingDenied("NONCE_REPLAY")
            if len(self.nonces)>=1000:
                raise RoutingDenied("NONCE_CAPACITY")
            self.nonces[nonce]=now+90
class PrivateHandler(BaseHTTPRequestHandler):
    def log_message(self,format,*args):
        return
    def do_GET(self):
        if self.path!="/health":
            return reply(self,404,{"error":"NOT_FOUND"})
        return reply(self,200,{"status":"API_READY","model_status":"NOT_CHECKED_BY_HEALTH",
            "binding":"LOOPBACK_ONLY","execution":"PROPOSALS_ONLY"})
    def do_POST(self):
        if self.path!=PATH:
            return reply(self,404,{"error":"NOT_FOUND"})
        length=self.headers.get("Content-Length","")
        if not length.isdecimal() or not 1<=int(length)<=MAX_BYTES:
            return reply(self,413,{"error":"REQUEST_TOO_LARGE_OR_EMPTY"})
        raw=self.rfile.read(int(length))
        try:
            self.server.authorize(self,raw)
        except RoutingDenied as exc:
            return reply(self,403,{"error":str(exc)})
        try:
            request=json.loads(raw)
            if not isinstance(request,dict) or set(request)!={"schema","task_id","origin"}:
                raise RoutingDenied("REQUEST_SCHEMA_DENIED")
            task=canonical_task(request["task_id"])
            if request["schema"]!=VERSION or request["origin"]!=task["origin"]:
                raise RoutingDenied("ORIGIN_SCOPE_DENIED")
            tags=self.server.model_call("/api/tags")
            result=route(task,tags=tags,
                generate=lambda args:self.server.model_call("/api/generate",args))
        except (RoutingDenied,ValueError,KeyError,TypeError):
            return reply(self,422,{"error":"TASK_REJECTED_FAIL_CLOSED"})
        except Exception:
            return reply(self,503,{"error":"MODEL_UNAVAILABLE"})
        return reply(self,200,result)
def main():
    port=int(os.environ.get("VELION_LOCAL_PORT","8765"))
    with PrivateServer("127.0.0.1",port,secret=os.environ.get("VELION_LOCAL_HMAC_SECRET","")) as server:
        print("VELION_PRIVATE_API_READY: loopback only, non-executing",flush=True)
        server.serve_forever(poll_interval=0.1)
if __name__=="__main__":
    main()
