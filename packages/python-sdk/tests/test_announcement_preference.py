import json
import sys
import threading
import unittest
from pathlib import Path
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from groupi_sdk import Groupi

class AnnouncementPreferenceTests(unittest.TestCase):
    def test_generated_own_preference_wire_contract(self):
        requests = []
        class Handler(BaseHTTPRequestHandler):
            def do_GET(self):
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(b'{"version":"2.0.0","capabilities":{"groups":{"version":1}}}')
            def do_PUT(self):
                body = json.loads(self.rfile.read(int(self.headers['Content-Length'])))
                requests.append((self.path, self.headers['Idempotency-Key'], body))
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'operationId':'intent','outcome':'committed','result':{'subscribed':body['subscribed']},'effects':{'email':'not-requested','cleanup':'not-requested'}}).encode())
            def log_message(self,*args):
                pass
        server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            client = Groupi(instance=f'http://127.0.0.1:{server.server_port}', api_key='grp_test')
            result = client.set_community_announcement_preference(path={'groupId':'community'},body={'subscribed':False},idempotency_key='intent')
            self.assertEqual(result['result'], {'subscribed':False})
            self.assertEqual(requests, [('/api/v2/groups/community/announcement-preference','intent',{'subscribed':False})])
        finally:
            server.shutdown()
            server.server_close()
            thread.join()
