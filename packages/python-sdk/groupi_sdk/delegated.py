"""Approved instance-pinned OAuth adapter for opaque API access, without identity fallback."""

import math
import http.client
import hashlib
import base64
import json
import secrets
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from .transport import Transport, GroupiError, _NoRedirect, _HTTPHandler, _HTTPSHandler

DELEGATED_ACTIONS = frozenset(
    (
        "groups.context.read",
        "groups.applications.submit",
        "groups.applications.edit",
        "groups.applications.withdraw",
        "identity.display-name",
        "identity.email",
        "events.read",
        "events.update",
        "members.read",
        "discussion.read",
        "discussion.create",
        "discussion.update",
        "discussion.delete",
        "files.read",
        "files.upload",
        "profiles.read",
    )
)


class DelegatedSession:
    def __init__(
        self,
        *,
        instance,
        issuer,
        audience,
        client_id,
        actions,
        client_type="native",
        get_client_assertion=None,
        store_tokens=None
    ):
        self.instance = Transport(
            instance=instance, token_provider=lambda **kwargs: {}, audience=audience
        ).instance
        if (
            issuer != self.instance + "/oauth"
            or audience != self.instance + "/api/v2"
            or not client_id
            or client_type not in ("native", "confidentialWeb")
        ):
            raise ValueError("Explicit instance-bound OAuth profile required")
        if client_type == "confidentialWeb" and not callable(get_client_assertion):
            raise ValueError("private_key_jwt signer required")
        if len(set(actions)) != len(actions) or any(
            action not in DELEGATED_ACTIONS for action in actions
        ):
            raise ValueError("Choose distinct supported delegated actions")
        self.issuer = issuer
        self.audience = audience
        self.client_id = client_id
        self.actions = list(actions)
        self.client_type = client_type
        self.get_client_assertion = get_client_assertion
        self.store_tokens = store_tokens
        self.tokens = None
        self.granted_actions = []
        self.background = False
        self._lock = threading.Lock()
        self._opener = urllib.request.build_opener(
            _NoRedirect, _HTTPHandler, _HTTPSHandler
        )

    @classmethod
    def restore(cls, *, state, **config):
        session = cls(**config)
        if (
            not isinstance(state, dict)
            or state.get("instance") != session.instance
            or state.get("issuer") != session.issuer
            or state.get("audience") != session.audience
            or state.get("client_id") != session.client_id
            or state.get("client_type") != session.client_type
            or not isinstance(state.get("background"), bool)
            or state["background"] != bool(state.get("refresh_token"))
            or not isinstance(state.get("access_token"), str)
            or not state["access_token"]
            or not isinstance(state.get("expires_at"), (int, float))
            or not math.isfinite(state["expires_at"])
            or not isinstance(state.get("granted_actions"), list)
            or any(action not in session.actions for action in state["granted_actions"])
            or (
                state.get("refresh_token") is not None
                and (
                    not isinstance(state["refresh_token"], str)
                    or not state["refresh_token"]
                )
            )
        ):
            raise GroupiError(
                "Invalid stored delegated state", code="INVALID_TOKEN_RESPONSE"
            )
        session.tokens = {
            "access_token": state["access_token"],
            "expires_at": state["expires_at"],
            "refresh_token": state.get("refresh_token"),
        }
        session.granted_actions = sorted(state["granted_actions"])
        session.background = bool(state.get("refresh_token"))
        return session

    def authorization_request(self, *, redirect_uri, background=False, selected_group_id=None):
        state, nonce, verifier = (
            secrets.token_urlsafe(32),
            secrets.token_urlsafe(32),
            secrets.token_urlsafe(32),
        )
        challenge = (
            base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest())
            .decode()
            .rstrip("=")
        )
        query = urllib.parse.urlencode(
            {
                "client_id": self.client_id,
                "redirect_uri": redirect_uri,
                "response_type": "code",
                "scope": " ".join(
                    [
                        "openid",
                        *self.actions,
                        *(["offline_access"] if background else []),
                    ]
                ),
                "state": state,
                "nonce": nonce,
                "prompt": "consent",
                "code_challenge": challenge,
                "code_challenge_method": "S256",
                "resource": self.audience,
            }
        )
        if selected_group_id:
            query += "&" + urllib.parse.urlencode({"group_id": selected_group_id})
        return {
            "url": self.issuer + "/auth?" + query,
            "state": state,
            "nonce": nonce,
            "code_verifier": verifier,
            "redirect_uri": redirect_uri,
            "background": background,
        }

    def exchange_authorization_code(
        self,
        *,
        code,
        code_verifier,
        redirect_uri,
        state,
        expected_state,
        background=False
    ):
        if not code or not code_verifier or not state or state != expected_state:
            raise GroupiError(
                "Authorization state mismatch", code="INVALID_AUTHORIZATION_RESPONSE"
            )
        self.tokens = None
        self.granted_actions = []
        self._persist()
        self.background = background
        response = self._token_request(
            {
                "grant_type": "authorization_code",
                "code": code,
                "code_verifier": code_verifier,
                "redirect_uri": redirect_uri,
            }
        )
        self._adopt(response, renewal=False)
        self._persist()
        return self

    def _adopt(self, response, *, renewal):
        scopes = (
            sorted(response["scope"].split())
            if isinstance(response, dict) and isinstance(response.get("scope"), str)
            else None
        )
        if (
            not isinstance(response, dict)
            or str(response.get("token_type", "")).lower() != "bearer"
            or not isinstance(response.get("access_token"), str)
            or not response["access_token"]
            or not isinstance(response.get("expires_in"), (int, float))
            or not 0 < response["expires_in"] <= 300
            or scopes is None
            or len(set(scopes)) != len(scopes)
            or any(scope not in self.actions for scope in scopes)
            or (renewal and scopes != self.granted_actions)
        ):
            raise GroupiError(
                "Token response exceeds approved grant", code="INVALID_TOKEN_RESPONSE"
            )
        refresh = response.get("refresh_token")
        if refresh is not None and (not isinstance(refresh, str) or not refresh):
            raise GroupiError("Malformed refresh token", code="INVALID_TOKEN_RESPONSE")
        if refresh and not self.background:
            raise GroupiError(
                "Background renewal was not selected",
                code="BACKGROUND_CONSENT_REQUIRED",
            )
        if renewal and (not refresh or refresh == self.tokens.get("refresh_token")):
            raise GroupiError(
                "Refresh token did not rotate", code="INVALID_TOKEN_RESPONSE"
            )
        self.granted_actions = scopes
        self.tokens = {
            "access_token": response["access_token"],
            "expires_at": time.time() + response["expires_in"],
            "refresh_token": refresh,
        }

    def _persist(self):
        if self.store_tokens:
            self.store_tokens(
                {
                    **self.tokens,
                    "granted_actions": list(self.granted_actions),
                    "instance": self.instance,
                    "issuer": self.issuer,
                    "audience": self.audience,
                    "client_id": self.client_id,
                    "client_type": self.client_type,
                    "background": bool(self.tokens.get("refresh_token")),
                }
                if self.tokens
                else None
            )

    def _token_request(self, fields):
        endpoint = self.issuer + "/token"
        fields = {**fields, "client_id": self.client_id}
        if self.client_type == "confidentialWeb":
            assertion = self.get_client_assertion(
                token_endpoint=endpoint, client_id=self.client_id
            )
            if not isinstance(assertion, str) or not assertion:
                raise GroupiError("Client assertion unavailable", code="INVALID_CLIENT")
            fields.update(
                client_assertion_type="urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
                client_assertion=assertion,
            )
        request = urllib.request.Request(
            endpoint,
            data=urllib.parse.urlencode(fields).encode(),
            headers={
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json",
            },
            method="POST",
        )
        try:
            response = self._opener.open(request, timeout=30)
        except urllib.error.HTTPError as error:
            response = error
        except (OSError, urllib.error.URLError, http.client.HTTPException) as error:
            raise GroupiError(
                "Token exchange outcome unknown",
                code="TOKEN_TRANSPORT_ERROR",
                uncertain=True,
            ) from error
        with response:
            if 300 <= response.code < 400:
                raise GroupiError(
                    "Token redirect refused",
                    status=response.code,
                    code="REDIRECT_REFUSED",
                )
            try:
                raw = response.read(65537)
            except (OSError, ValueError, http.client.HTTPException) as error:
                raise GroupiError(
                    "Incomplete token response",
                    code="INVALID_TOKEN_RESPONSE",
                    uncertain=True,
                ) from error
            if len(raw) > 65536:
                raise GroupiError(
                    "Token response exceeds limit",
                    code="INVALID_TOKEN_RESPONSE",
                    uncertain=True,
                )
            try:
                result = json.loads(raw)
            except (ValueError, UnicodeError) as error:
                raise GroupiError(
                    "Invalid token response",
                    code="INVALID_TOKEN_RESPONSE",
                    uncertain=True,
                ) from error
            if not 200 <= response.code < 300:
                raise GroupiError(
                    "Token endpoint denied request",
                    status=response.code,
                    code=(
                        result.get("error", "OAUTH_ERROR")
                        if isinstance(result, dict)
                        else "OAUTH_ERROR"
                    ),
                    uncertain=response.code >= 500,
                )
            return result

    def refresh(self):
        with self._lock:
            return self._refresh()

    def _refresh(self):
        if not self.tokens or not self.tokens.get("refresh_token"):
            raise GroupiError("No background renewal grant", code="UNAUTHORIZED")
        try:
            response = self._token_request(
                {
                    "grant_type": "refresh_token",
                    "refresh_token": self.tokens["refresh_token"],
                }
            )
            self._adopt(response, renewal=True)
            self._persist()
        except BaseException:
            self.tokens = None
            self._persist()
            raise

    def get_token(self, *, instance, audience):
        if instance != self.instance or audience != self.audience:
            raise GroupiError(
                "Delegated instance or audience mismatch", code="UNAUTHORIZED"
            )
        with self._lock:
            if not self.tokens:
                raise GroupiError(
                    "Delegated session is disconnected", code="UNAUTHORIZED"
                )
            if self.tokens["expires_at"] <= time.time() + 30:
                self._refresh()
            return {
                "access_token": self.tokens["access_token"],
                "expires_at": self.tokens["expires_at"],
                "instance": self.instance,
                "audience": self.audience,
            }
