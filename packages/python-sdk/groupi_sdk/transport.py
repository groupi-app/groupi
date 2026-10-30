"""Instance-bound stdlib HTTP transport; async profile runs blocking I/O in workers."""

import math
import socket
import threading
import http.client
import asyncio
import json
import time
import urllib.error
import urllib.parse
import urllib.request


class GroupiError(Exception):
    def __init__(
        self,
        message,
        *,
        status=0,
        code="TRANSPORT_ERROR",
        details=None,
        uncertain=False,
    ):
        super().__init__(message)
        self.status = status
        self.code = code
        self.details = details
        self.uncertain = uncertain


class GroupiCancelledError(asyncio.CancelledError):
    """An async write was cancelled while its worker may still be running."""

    status = 0
    code = "CANCELLED"
    uncertain = True


class _NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


class _DeadlineConnection:
    """Close the connected socket at the whole-attempt deadline, including slow peers."""

    def connect(self):
        deadline = time.monotonic() + self.timeout
        self._deadline_at = deadline
        super().connect()
        connection_socket = self.sock

        def expire():
            try:
                connection_socket.shutdown(socket.SHUT_RDWR)
            except OSError:
                pass
            connection_socket.close()

        remaining = deadline - time.monotonic()
        if remaining <= 0:
            expire()
            raise TimeoutError("Request deadline exceeded")
        self._deadline_timer = threading.Timer(remaining, expire)
        self._deadline_timer.daemon = True
        self._deadline_timer.start()

    def getresponse(self):
        try:
            response = super().getresponse()
        except BaseException:
            if hasattr(self, "_deadline_timer"):
                self._deadline_timer.cancel()
            raise
        response._groupi_deadline = self._deadline_at
        original_close = response.close

        def close():
            if hasattr(self, "_deadline_timer"):
                self._deadline_timer.cancel()
            original_close()

        response.close = close
        return response


class _HTTPConnection(_DeadlineConnection, http.client.HTTPConnection):
    pass


class _HTTPSConnection(_DeadlineConnection, http.client.HTTPSConnection):
    pass


class _HTTPHandler(urllib.request.HTTPHandler):
    def http_open(self, request):
        return self.do_open(_HTTPConnection, request)


class _HTTPSHandler(urllib.request.HTTPSHandler):
    def https_open(self, request):
        return self.do_open(_HTTPSConnection, request, context=self._context)


class Transport:
    def __init__(
        self,
        *,
        instance,
        api_key=None,
        bounded_api_key=None,
        token_provider=None,
        audience=None,
        retries=2,
        timeout=30,
        max_response_bytes=4194304,
    ):
        url = urllib.parse.urlsplit(instance)
        if (
            url.username
            or url.password
            or url.query
            or url.fragment
            or url.path not in ("", "/")
            or not url.hostname
        ):
            raise ValueError("instance must be an origin")
        if url.scheme != "https" and not (
            url.scheme == "http" and url.hostname in ("127.0.0.1", "localhost", "::1")
        ):
            raise ValueError("HTTPS required outside loopback")
        if (
            sum(bool(value) for value in (api_key, bounded_api_key, token_provider))
            != 1
        ):
            raise ValueError("Choose exactly one credential mode")
        if (
            not isinstance(retries, int)
            or not 0 <= retries <= 5
            or not math.isfinite(timeout)
            or timeout <= 0
            or not isinstance(max_response_bytes, int)
            or max_response_bytes <= 0
        ):
            raise ValueError("Invalid transport bounds")
        host = (
            url.hostname
            if ":" in url.hostname
            else url.hostname.encode("idna").decode("ascii")
        )
        host = "[" + host + "]" if ":" in host else host
        port = url.port
        netloc = host + (
            ":" + str(port)
            if port is not None and port != ({"https": 443, "http": 80}[url.scheme])
            else ""
        )
        self.instance = urllib.parse.urlunsplit((url.scheme, netloc, "", "", ""))
        if token_provider and (not isinstance(audience, str) or not audience):
            raise ValueError("Explicit delegated audience required")
        self.audience = audience
        self.api_key = api_key or bounded_api_key
        self.is_bounded = bool(bounded_api_key)
        if bounded_api_key and not bounded_api_key.startswith("grp_b_"):
            raise ValueError("Bounded API key required")
        if api_key and api_key.startswith("grp_b_"):
            raise ValueError("Select bounded_api_key explicitly")
        self.token_provider = token_provider
        self.retries = retries
        self.timeout = timeout
        self.max_response_bytes = max_response_bytes
        self._opener = urllib.request.build_opener(
            _NoRedirect, _HTTPHandler, _HTTPSHandler
        )

    def request(
        self,
        method,
        route,
        *,
        path=None,
        query=None,
        body=None,
        idempotency_key=None,
        raw_body=None,
        filename=None,
        mime_type=None,
    ):
        import re

        def param(match):
            key = match.group(1)
            if key not in (path or {}):
                raise ValueError("Missing path parameter: " + key)
            return urllib.parse.quote(str(path[key]), safe="")

        route = re.sub(r"\{([^}]+)\}", param, route)
        url = self.instance + "/api/v2" + route
        if query:
            url += "?" + urllib.parse.urlencode(
                {
                    k: ("true" if v is True else "false" if v is False else v)
                    for k, v in query.items()
                    if v is not None
                }
            )
        if method not in ("GET", "HEAD"):
            health = self.health()
            if not isinstance(health, dict) or health.get("version") != "2.0.0":
                raise GroupiError("Unsupported API version", code="INCOMPATIBLE_API")
            capability = (
                "groups"
                if route.startswith("/groups")
                else (
                    "addonAuthoring"
                    if route.startswith("/addon-template-definitions")
                    else (
                        "inviteWrites"
                        if "/member-invites" in route
                        else (
                            "inviteLists" if route.startswith("/invite-lists") else None
                        )
                    )
                )
            )
            if (
                capability
                and health.get("capabilities", {}).get(capability, {}).get("version", 0)
                < 1
            ):
                raise GroupiError(
                    "Unsupported API capability: " + capability, code="INCOMPATIBLE_API"
                )
            if (
                route == "/events"
                and idempotency_key
                and health.get("capabilities", {})
                .get("eventCreationIdempotency", {})
                .get("version", 0)
                < 1
            ):
                raise GroupiError(
                    "Event create replay unsupported", code="INCOMPATIBLE_API"
                )
        headers = {"Accept": "application/json"}
        if self.api_key:
            headers["x-api-key"] = self.api_key
        else:
            token = self.token_provider(instance=self.instance, audience=self.audience)
            if (
                token.get("instance") != self.instance
                or token.get("audience") != self.audience
                or not isinstance(token.get("access_token"), str)
                or token.get("expires_at", float("inf")) <= time.time()
            ):
                raise GroupiError(
                    "Invalid or expired delegated token", code="UNAUTHORIZED"
                )
            headers["Authorization"] = "Bearer " + token["access_token"]
        if idempotency_key:
            headers["Idempotency-Key"] = idempotency_key
        data = None if body is None else json.dumps(body).encode()
        if data is not None:
            headers["Content-Type"] = "application/json"
        if raw_body is not None:
            data = raw_body
            headers["Content-Type"] = mime_type
            headers["X-Filename"] = filename
        safe = method in ("GET", "HEAD")
        for attempt in range(self.retries + 1):
            request = urllib.request.Request(
                url, data=data, headers=headers, method=method
            )
            try:
                response = self._opener.open(request, timeout=self.timeout)
            except urllib.error.HTTPError as error:
                response = error
            except (OSError, urllib.error.URLError, http.client.HTTPException) as error:
                if safe and attempt < self.retries:
                    continue
                raise GroupiError("Request failed", uncertain=not safe) from error
            with response:
                status = response.code
                if 300 <= status < 400:
                    raise GroupiError(
                        "Redirect refused", status=status, code="REDIRECT_REFUSED"
                    )
                if safe and status in (429, 502, 503, 504) and attempt < self.retries:
                    try:
                        delay = float(response.headers.get("Retry-After", 0))
                    except ValueError:
                        delay = 0
                    if delay > 5:
                        raise GroupiError(
                            "Retry delay exceeds automatic retry bound",
                            status=status,
                            code="RATE_LIMITED",
                        )
                    if delay > 0:
                        time.sleep(delay)
                    continue
                deadline = getattr(
                    response,
                    "_groupi_deadline",
                    getattr(
                        getattr(response, "fp", None), "_groupi_deadline", float("inf")
                    ),
                )
                length_header = response.headers.get("Content-Length")
                try:
                    declared_length = (
                        int(length_header) if length_header is not None else None
                    )
                except ValueError:
                    raise GroupiError(
                        "Invalid response length",
                        code="INVALID_RESPONSE",
                        uncertain=not safe,
                    )
                if declared_length is not None and (
                    declared_length < 0 or declared_length > self.max_response_bytes
                ):
                    raise GroupiError(
                        "Invalid response length",
                        code="INVALID_RESPONSE",
                        uncertain=not safe,
                    )
                try:
                    raw = response.read(self.max_response_bytes + 1)
                except (OSError, http.client.HTTPException) as error:
                    raise GroupiError(
                        "Incomplete response", uncertain=not safe
                    ) from error
                if time.monotonic() >= deadline:
                    raise GroupiError(
                        "Request deadline exceeded", code="TIMEOUT", uncertain=not safe
                    )
                if declared_length is not None and len(raw) != declared_length:
                    raise GroupiError(
                        "Incomplete response",
                        code="INVALID_RESPONSE",
                        uncertain=not safe,
                    )
                if len(raw) > self.max_response_bytes:
                    raise GroupiError(
                        "Response exceeds byte limit",
                        code="INVALID_RESPONSE",
                        uncertain=not safe,
                    )
                try:
                    result = json.loads(raw) if raw else None
                except (ValueError, UnicodeError) as error:
                    raise GroupiError(
                        "Invalid JSON response",
                        status=status,
                        code="INVALID_RESPONSE",
                        uncertain=not safe,
                    ) from error
                if not 200 <= status < 300:
                    detail = result.get("error", {}) if isinstance(result, dict) else {}
                    raise GroupiError(
                        detail.get("message", "API request failed"),
                        status=status,
                        code=detail.get("code", "HTTP_ERROR"),
                        details=detail,
                        uncertain=not safe and status >= 500,
                    )
                return result

    def upload(
        self,
        data,
        *,
        filename,
        mime_type="application/octet-stream",
        purpose="attachment",
        event_id=None,
    ):
        if not isinstance(data, bytes) or not 1 <= len(data) <= 10485760:
            raise ValueError("Upload must contain 1 byte to 10 MiB")
        if (
            purpose not in ("attachment", "avatar", "cover")
            or not filename
            or "\r" in filename
            or "\n" in filename
        ):
            raise ValueError("Invalid upload metadata")
        return self.request(
            "POST",
            "/uploads",
            raw_body=data,
            filename=filename,
            mime_type=mime_type,
            query={"purpose": purpose, "eventId": event_id},
        )

    def discard_upload(self, storage_id):
        return self.request(
            "DELETE", "/uploads/{storageId}", path={"storageId": storage_id}
        )

    def health(self):
        return self.request("GET", "/health")

    def require_capability(self, name, version=1):
        health = self.health()
        if (
            health.get("version") != "2.0.0"
            or health.get("capabilities", {}).get(name, {}).get("version", 0) < version
        ):
            raise GroupiError(
                "Unsupported API capability: " + name, code="INCOMPATIBLE_API"
            )
        return health

    def iterate(self, route, *, path=None, query=None, adapter, max_pages=10000):
        query = dict(query or {})
        seen = set()
        if query.get("cursor"):
            seen.add(query["cursor"])
        if adapter.get("mode"):
            query["pagination"] = adapter["mode"]
        for _ in range(max_pages):
            page = self.request("GET", route, path=path, query=query)
            if not isinstance(page, dict) or adapter["cursor"] not in page:
                raise GroupiError("Malformed page", code="INVALID_PAGE")
            items = page.get(adapter["items"])
            cursor = page.get(adapter["cursor"])
            done = page.get(adapter["done"]) if adapter.get("done") else cursor is None
            if (
                not isinstance(items, list)
                or len(items) > query.get("limit", 100)
                or (adapter.get("done") and not isinstance(done, bool))
                or (
                    not done
                    and (
                        not isinstance(cursor, str)
                        or not 0 < len(cursor) <= 16384
                        or cursor in seen
                    )
                )
            ):
                raise GroupiError(
                    "Malformed or cyclic pagination page", code="INVALID_PAGE"
                )
            yield from items
            if done:
                return
            seen.add(cursor)
            query["cursor"] = cursor
        raise GroupiError("Page limit exceeded", code="INVALID_PAGE")

    def iterate_events(self, *, limit=20, max_pages=10000):
        if not isinstance(limit, int) or not 1 <= limit <= 100:
            raise ValueError("Event limit must be 1..100")
        cursor = None
        seen = set()
        for _ in range(max_pages):
            page = self.request(
                "GET",
                "/events",
                query={"pagination": "cursor", "limit": limit, "cursor": cursor},
            )
            if (
                not isinstance(page, dict)
                or not isinstance(page.get("items"), list)
                or len(page["items"]) > limit
                or "nextCursor" not in page
            ):
                raise GroupiError("Malformed event page", code="INVALID_PAGE")
            cursor = page["nextCursor"]
            if cursor is not None and (
                not isinstance(cursor, str)
                or not 0 < len(cursor) <= 16384
                or cursor in seen
            ):
                raise GroupiError(
                    "Invalid or cyclic pagination cursor", code="INVALID_PAGE"
                )
            yield from page["items"]
            if cursor is None:
                return
            seen.add(cursor)
        raise GroupiError("Page limit exceeded", code="INVALID_PAGE")


class AsyncTransport:
    def __init__(self, **kwargs):
        self._sync = Transport(**kwargs)

    async def request(self, method, route, **kwargs):
        try:
            return await asyncio.to_thread(self._sync.request, method, route, **kwargs)
        except asyncio.CancelledError as error:
            if method not in ("GET", "HEAD"):
                raise GroupiCancelledError(
                    "Write cancelled while worker may still commit"
                ) from error
            raise

    async def upload(self, data, **kwargs):
        try:
            return await asyncio.to_thread(self._sync.upload, data, **kwargs)
        except asyncio.CancelledError as error:
            raise GroupiCancelledError(
                "Upload cancelled while worker may still commit"
            ) from error

    async def discard_upload(self, storage_id):
        try:
            return await asyncio.to_thread(self._sync.discard_upload, storage_id)
        except asyncio.CancelledError as error:
            raise GroupiCancelledError(
                "Write cancelled while worker may still commit"
            ) from error

    async def health(self):
        return await asyncio.to_thread(self._sync.health)

    async def require_capability(self, name, version=1):
        return await asyncio.to_thread(self._sync.require_capability, name, version)

    async def iterate(self, route, **kwargs):
        iterator = self._sync.iterate(route, **kwargs)
        sentinel = object()
        while True:
            value = await asyncio.to_thread(next, iterator, sentinel)
            if value is sentinel:
                return
            yield value

    async def iterate_events(self, **kwargs):
        iterator = self._sync.iterate_events(**kwargs)
        sentinel = object()
        while True:
            value = await asyncio.to_thread(next, iterator, sentinel)
            if value is sentinel:
                return
            yield value
