import json
import sys
import threading
import unittest
from pathlib import Path
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from groupi_sdk import Groupi
from groupi_sdk.delegated import DELEGATED_ACTIONS

class GroupDiscordTests(unittest.TestCase):
    def test_named_status_and_hosted_connect_transport(self):
        seen = []
        class Handler(BaseHTTPRequestHandler):
            def do_GET(self):
                if self.path == '/api/v2/health':
                    self.send_response(200)
                    self.end_headers()
                    self.wfile.write(json.dumps({"version": "2.0.0", "capabilities": {"groups": {"version": 1}}}).encode())
                    return
                seen.append((self.command, self.path))
                self.send_response(200)
                self.end_headers()
                self.wfile.write(json.dumps({"mode": "role", "status": "pending", "openUrl": "https://discord.com/channels/123"}).encode())
            def do_POST(self):
                body = json.loads(self.rfile.read(int(self.headers['Content-Length'])))
                seen.append((self.command, self.path, body))
                self.send_response(200)
                self.end_headers()
                self.wfile.write(json.dumps({"url": "https://groupi.example/oauth/discord?state=opaque", "expiresAt": 12345}).encode())
            def log_message(self, *args):
                pass
        server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            client = Groupi(instance=f"http://127.0.0.1:{server.server_port}", api_key="grp_test")
            status = client.read_own_group_discord_status(path={"groupId": "group"})
            self.assertEqual(status['status'], 'pending')
            journey = client.begin_own_group_discord_connect(path={"groupId": "group"}, body={"returnUrl": "https://app.example/callback"})
            self.assertEqual(journey['url'], 'https://groupi.example/oauth/discord?state=opaque')
            self.assertEqual(seen, [('GET', '/api/v2/groups/group/discord'), ('POST', '/api/v2/groups/group/discord/connect', {"returnUrl": "https://app.example/callback"})])
            self.assertIn('groups.discord.read', DELEGATED_ACTIONS)
            self.assertIn('groups.discord.connect', DELEGATED_ACTIONS)
        finally:
            server.shutdown()
            server.server_close()
            thread.join()
