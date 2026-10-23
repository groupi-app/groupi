from typing import Literal, NotRequired, Protocol, TypedDict, Self
from .client import DelegatedToken

DelegatedAction = Literal[
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
]

class DelegatedState(TypedDict):
    instance: str
    issuer: str
    audience: str
    client_id: str
    client_type: Literal["native", "confidentialWeb"]
    background: bool
    access_token: str
    expires_at: float
    refresh_token: NotRequired[str | None]
    granted_actions: list[DelegatedAction]

class AuthorizationRequest(TypedDict):
    url: str
    state: str
    nonce: str
    code_verifier: str
    redirect_uri: str
    background: bool

class ClientAssertionProvider(Protocol):
    def __call__(self, *, token_endpoint: str, client_id: str) -> str: ...

class TokenStore(Protocol):
    def __call__(self, state: DelegatedState | None) -> None: ...

class DelegatedSession:
    def __init__(
        self,
        *,
        instance: str,
        issuer: str,
        audience: str,
        client_id: str,
        actions: list[DelegatedAction],
        client_type: Literal["native", "confidentialWeb"] = ...,
        get_client_assertion: ClientAssertionProvider | None = ...,
        store_tokens: TokenStore | None = ...
    ) -> None: ...
    @classmethod
    def restore(
        cls,
        *,
        state: DelegatedState,
        instance: str,
        issuer: str,
        audience: str,
        client_id: str,
        actions: list[DelegatedAction],
        client_type: Literal["native", "confidentialWeb"] = ...,
        get_client_assertion: ClientAssertionProvider | None = ...,
        store_tokens: TokenStore | None = ...
    ) -> Self: ...
    def authorization_request(
        self, *, redirect_uri: str, background: bool = ...
    ) -> AuthorizationRequest: ...
    def exchange_authorization_code(
        self,
        *,
        code: str,
        code_verifier: str,
        redirect_uri: str,
        state: str,
        expected_state: str,
        background: bool = ...
    ) -> Self: ...
    def refresh(self) -> None: ...
    def get_token(self, *, instance: str, audience: str) -> DelegatedToken: ...
