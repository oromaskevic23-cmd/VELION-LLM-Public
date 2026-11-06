"""Bounded concurrency tests: signed localhost requests with synthetic model only.

Copyright (c) 2026 Alexander Nikolaevich Romaskevich (RomaskevicH).
No real inference, cloud worker, account access or production permit is claimed.
"""
import hashlib
import hmac
import http.client
import importlib.util
import json
import secrets
import threading
import time
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location(
    "velion_private_capacity", ROOT / "scripts" / "velion_private_api.py"
)
api = importlib.util.module_from_spec(spec)
spec.loader.exec_module(api)

SECRET = "synthetic-local-transport-key-" + "z" * 45
TASK = {"schema": api.VERSION, "task_id": "IC-NCA-HTTP429-001", "origin": "NCA"}


def signed_request(server):
    body = json.dumps(TASK).encode()
    ts = str(int(time.time()))
    nonce = secrets.token_urlsafe(18)
    digest = hmac.new(
        SECRET.encode(), api.signed_payload(ts, nonce, body),
        hashlib.sha256
    ).hexdigest()
    headers = {
        "Content-Type": "application/json", "X-Velion-Timestamp": ts,
        "X-Velion-Nonce": nonce, "X-Velion-Signature": digest,
    }
    conn = http.client.HTTPConnection(
        "127.0.0.1", server.server_port, timeout=10
    )
    try:
        conn.request("POST", api.PATH, body, headers)
        response = conn.getresponse()
        return response.status, json.loads(response.read())
    finally:
        conn.close()


class CapacityTest(unittest.TestCase):
    def test_second_signed_request_fails_fast_while_model_is_busy(self):
        entered = threading.Event()
        release = threading.Event()
        generated = []

        def delayed_model(path, args=None):
            if path == "/api/tags":
                return {"models": [{"name": "nemotron-3-nano:4b",
                                   "size": 2837597147, "digest": "a" * 64}]}
            generated.append(args["prompt"])
            entered.set()
            if not release.wait(5):
                raise RuntimeError("fixture timed out")
            return {"model": "nemotron-3-nano:4b", "done": True,
                    "eval_count": 32, "response": json.dumps({
                        "decision": "RATE_LIMIT",
                        "recommendation": "BACKOFF_WITH_JITTER",
                        "explanation": "Wait and retry slowly after an HTTP 429.",
                    })}
        server = api.PrivateServer(
            "127.0.0.1", 0, secret=SECRET, model_call=delayed_model
        )
        server_thread = threading.Thread(
            target=server.serve_forever, daemon=True
        )
        server_thread.start()
        output = []

        def first():
            output.append(signed_request(server))
        caller = threading.Thread(target=first)
        try:
            caller.start()
            self.assertTrue(entered.wait(3), "first model call never started")
            denied = signed_request(server)
            self.assertEqual(denied[0], 429)
            self.assertEqual(denied[1]["error"], "MODEL_AT_CAPACITY")
            self.assertEqual(len(generated), 1, "second call reached model")
            release.set()
            caller.join(8)
            self.assertFalse(caller.is_alive())
            self.assertEqual(output[0][0], 200)
            self.assertEqual(output[0][1]["execution"], "NOT_EXECUTED")
            # Slot must be released after success.
            self.assertEqual(signed_request(server)[0], 200)
        finally:
            release.set()
            caller.join(8)
            server.shutdown()
            server.server_close()
            server_thread.join(3)

    def test_model_failure_releases_slot(self):
        calls = []

        def unavailable(path, args=None):
            if path == "/api/tags":
                calls.append(path)
                raise OSError("synthetic backend unreachable")
            raise AssertionError("should not call generate")

        server = api.PrivateServer(
            "127.0.0.1", 0, secret=SECRET, model_call=unavailable
        )
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            self.assertEqual(signed_request(server)[0], 503)
            self.assertEqual(signed_request(server)[0], 503)
            self.assertEqual(len(calls), 2)
        finally:
            server.shutdown()
            server.server_close()
            thread.join(3)


if __name__ == "__main__":
    unittest.main()
