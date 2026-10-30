import asyncio

class GroupiError(Exception):
    status: int
    code: str
    details: object
    uncertain: bool
    def __init__(
        self,
        message: str,
        *,
        status: int = ...,
        code: str = ...,
        details: object = ...,
        uncertain: bool = ...
    ) -> None: ...

class GroupiCancelledError(asyncio.CancelledError):
    status: int
    code: str
    uncertain: bool
