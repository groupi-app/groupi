"""Subprocess public SDK driver for real protocol integration (never a production helper)."""

import json
import sys
import time
import urllib.request
from groupi_sdk import Groupi, DelegatedSession

client = session = None
state = None
real_now = time.time


def store(value):
    global state
    state = value


for line in sys.stdin:
    try:
        command = json.loads(line)
        operation = command["operation"]
        if operation == "initialize":
            config = command["config"]

            def assertion(*, token_endpoint, client_id):
                with urllib.request.urlopen(
                    config["instance"] + "/test/client-assertion"
                ) as response:
                    return json.load(response)["client_assertion"]

            session = DelegatedSession(
                instance=config["instance"],
                issuer=config["issuer"],
                audience=config["audience"],
                client_id=config["clientId"],
                actions=config["actions"],
                client_type=config["clientType"],
                store_tokens=store,
                get_client_assertion=(
                    assertion if config["clientType"] == "confidentialWeb" else None
                ),
            )
            exchange = command["exchange"]
            session.exchange_authorization_code(
                code=exchange["code"],
                code_verifier=exchange["codeVerifier"],
                redirect_uri=exchange["redirectUri"],
                state=exchange["state"],
                expected_state=exchange["expectedState"],
                background=exchange["background"],
            )
            client = Groupi(
                instance=config["instance"],
                audience=config["audience"],
                token_provider=session.get_token,
            )
            result = {"initialized": True, "grantedActions": state["granted_actions"]}
        elif operation == "bounded":
            client = Groupi(
                instance=command["instance"], bounded_api_key=command["key"]
            )
            result = {"initialized": True}
        elif operation == "community":
            result = client.read_own_community_context(path={"groupId": command["groupId"]})
        elif operation == "read":
            result = client.get_event(path={"eventId": command["eventId"]})
        elif operation == "write":
            result = client.update_event(
                path={"eventId": command["eventId"]}, body={"title": "Not approved"}
            )
        elif operation == "renew":
            before = state["refresh_token"]
            time.time = lambda: real_now() + 301
            event = client.get_event(path={"eventId": command["eventId"]})
            result = {
                "id": event["id"],
                "rotated": before != state["refresh_token"],
                "grantedActions": state["granted_actions"],
            }
        elif operation == "refresh":
            session.refresh()
            result = {"grantedActions": state["granted_actions"]}
        else:
            raise ValueError("Unknown operation")
        print(json.dumps({"ok": True, "result": result}), flush=True)
    except BaseException as error:
        print(
            json.dumps(
                {
                    "ok": False,
                    "status": getattr(error, "status", 0),
                    "code": getattr(error, "code", type(error).__name__),
                    "uncertain": getattr(error, "uncertain", False),
                }
            ),
            flush=True,
        )
