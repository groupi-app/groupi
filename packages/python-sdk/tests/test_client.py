import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import json
import threading
import unittest
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from groupi_sdk import Groupi


class PublicClientTests(unittest.TestCase):
    def test_events_follow_empty_continuation(self):
        class Handler(BaseHTTPRequestHandler):
            def do_GET(self):
                if self.headers.get("x-api-key") != "grp_test":
                    self.send_error(401)
                    return
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(
                    json.dumps(
                        {
                            "items": (
                                [{"title": "Dinner"}]
                                if "cursor=next" in self.path
                                else []
                            ),
                            "nextCursor": (
                                None if "cursor=next" in self.path else "next"
                            ),
                        }
                    ).encode()
                )

            def log_message(self, *args):
                pass

        server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            client = Groupi(
                instance=f"http://127.0.0.1:{server.server_port}", api_key="grp_test"
            )
            self.assertEqual(list(client.iterate_events()), [{"title": "Dinner"}])
        finally:
            server.shutdown()
            server.server_close()
            thread.join()

    def test_truncated_write_preserves_uncertainty(self):
        from groupi_sdk import GroupiError

        class Handler(BaseHTTPRequestHandler):
            def do_GET(self):
                self.send_response(200)
                self.end_headers()
                self.wfile.write(b'{"version":"2.0.0"}')

            def do_POST(self):
                self.send_response(200)
                self.send_header("Transfer-Encoding", "chunked")
                self.end_headers()
                self.wfile.write(b"10\r\nshort")
                self.wfile.flush()
                self.close_connection = True

            def log_message(self, *args):
                pass

        server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            client = Groupi(
                instance=f"http://127.0.0.1:{server.server_port}", api_key="test"
            )
            with self.assertRaises(GroupiError) as caught:
                client.create_event(body={"title": "Dinner"})
            self.assertTrue(caught.exception.uncertain)
        finally:
            server.shutdown()
            server.server_close()
            thread.join()

    def test_missing_page_cursor_is_rejected(self):
        from groupi_sdk import GroupiError

        class Handler(BaseHTTPRequestHandler):
            def do_GET(self):
                self.send_response(200)
                self.end_headers()
                self.wfile.write(b'{"items":[]}')

            def log_message(self, *args):
                pass

        server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            client = Groupi(
                instance=f"http://127.0.0.1:{server.server_port}", api_key="test"
            )
            with self.assertRaises(GroupiError) as caught:
                list(client.list_events_items())
            self.assertEqual(caught.exception.code, "INVALID_PAGE")
        finally:
            server.shutdown()
            server.server_close()
            thread.join()

    def test_async_client_reads_public_events(self):
        import asyncio
        from groupi_sdk import AsyncGroupi

        class Handler(BaseHTTPRequestHandler):
            def do_GET(self):
                self.send_response(200)
                self.end_headers()
                self.wfile.write(b"[]")

            def log_message(self, *args):
                pass

        server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()

        async def read():
            client = AsyncGroupi(
                instance=f"http://127.0.0.1:{server.server_port}", api_key="test"
            )
            return await client.list_events()

        try:
            self.assertEqual(asyncio.run(read()), [])
        finally:
            server.shutdown()
            server.server_close()
            thread.join()

    def test_async_write_cancellation_preserves_uncertainty(self):
        import asyncio
        from groupi_sdk import AsyncGroupi, GroupiCancelledError

        received, release = threading.Event(), threading.Event()

        class Handler(BaseHTTPRequestHandler):
            def do_GET(self):
                self.send_response(200)
                self.end_headers()
                self.wfile.write(b'{"version":"2.0.0"}')

            def do_POST(self):
                received.set()
                release.wait(2)
                self.send_response(201)
                self.end_headers()
                self.wfile.write(b'{"eventId":"event","membershipId":"member"}')

            def log_message(self, *args):
                pass

        server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()

        async def cancel():
            client = AsyncGroupi(
                instance=f"http://127.0.0.1:{server.server_port}", api_key="test"
            )
            task = asyncio.create_task(client.create_event(body={"title": "Dinner"}))
            self.assertTrue(await asyncio.to_thread(received.wait, 2))
            task.cancel()
            try:
                with self.assertRaises(GroupiCancelledError) as caught:
                    await task
                self.assertTrue(caught.exception.uncertain)
            finally:
                release.set()

        try:
            asyncio.run(cancel())
        finally:
            release.set()
            server.shutdown()
            server.server_close()
            thread.join()

    def test_whole_request_deadline_stops_a_slow_drip_response(self):
        import time
        from groupi_sdk import GroupiError

        class Handler(BaseHTTPRequestHandler):
            def do_GET(self):
                self.send_response(200)
                self.end_headers()
                try:
                    for byte in b'{"a":"a deliberately slow response"}':
                        self.wfile.write(bytes([byte]))
                        self.wfile.flush()
                        time.sleep(0.02)
                except OSError:
                    pass

            def log_message(self, *args):
                pass

        server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            client = Groupi(
                instance=f"http://127.0.0.1:{server.server_port}",
                api_key="test",
                timeout=0.05,
                retries=0,
            )
            started = time.monotonic()
            with self.assertRaises(GroupiError):
                client.list_events()
            self.assertLess(time.monotonic() - started, 0.2)
        finally:
            server.shutdown()
            server.server_close()
            thread.join()

    def test_stored_delegated_credentials_cannot_switch_instance_or_client(self):
        import time
        from groupi_sdk import DelegatedSession, GroupiError

        config = {
            "instance": "https://one.example",
            "issuer": "https://one.example/oauth",
            "audience": "https://one.example/api/v2",
            "client_id": "client-one",
            "actions": ["events.read"],
        }
        state = {
            **config,
            "client_type": "native",
            "background": True,
            "access_token": "access",
            "refresh_token": "refresh",
            "expires_at": time.time() + 300,
            "granted_actions": ["events.read"],
        }
        with self.assertRaises(GroupiError):
            DelegatedSession.restore(
                **{
                    **config,
                    "instance": "https://two.example",
                    "issuer": "https://two.example/oauth",
                    "audience": "https://two.example/api/v2",
                },
                state=state,
            )
        with self.assertRaises(GroupiError):
            DelegatedSession.restore(
                **{**config, "client_id": "client-two"}, state=state
            )
        session = DelegatedSession.restore(**config, state=state)
        self.assertEqual(
            session.get_token(instance=config["instance"], audience=config["audience"])[
                "access_token"
            ],
            "access",
        )
