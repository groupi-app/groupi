"""Generate named public clients and types from the checked-in REST OpenAPI contract."""

import json, re
import sys, subprocess, hashlib
from pathlib import Path

root = Path(__file__).resolve().parents[3]
spec = json.loads((root / "packages/sdk/openapi.json").read_text())
outputs = {}
check = "--check" in sys.argv


def save(path, content):
    outputs[path] = content
    if not check:
        path.write_text(content)


schemas = spec["components"]["schemas"]
stable_names = json.loads((root / "packages/sdk/operation-names.json").read_text())


def ts(s):
    if s.get("nullable") and (
        not any(
            (
                key in s
                for key in [
                    "type",
                    "$ref",
                    "enum",
                    "properties",
                    "allOf",
                    "anyOf",
                    "oneOf",
                ]
            )
        )
    ):
        return "null"
    if s.get("x-sdk-no-content"):
        return "void"
    if "allOf" in s:
        return ts(deref(s))
    if "$ref" in s:
        return s["$ref"].split("/")[-1] + (" | null" if s.get("nullable") else "")
    if "enum" in s:
        return " | ".join((json.dumps(x) for x in s["enum"]))
    if "anyOf" in s or "oneOf" in s:
        return "(" + " | ".join((ts(x) for x in s.get("anyOf", s.get("oneOf")))) + ")"
    t = s.get("type")
    nullable = " | null" if s.get("nullable") else ""
    if isinstance(t, list):
        return "(" + " | ".join((ts({**s, "type": x}) for x in t)) + ")"
    if t == "object" or "properties" in s:
        props = s.get("properties", {})
        req = s.get("required", [])
        return (
            "{ "
            + "; ".join(
                (
                    json.dumps(k) + ("" if k in req else "?") + ": " + ts(v)
                    for k, v in props.items()
                )
            )
            + " }"
            if props
            else "Record<string, "
            + ts(
                s.get("additionalProperties", {})
                if isinstance(s.get("additionalProperties"), dict)
                else {}
            )
            + ">"
        ) + nullable
    if t == "array":
        return "Array<" + ts(s.get("items", {})) + ">" + nullable
    return {
        "integer": "number",
        "number": "number",
        "string": "string",
        "boolean": "boolean",
        "null": "null",
    }.get(t, "unknown") + nullable


def deref(schema):
    if "$ref" in schema:
        resolved = deref(schemas[schema["$ref"].split("/")[-1]])
        return {**resolved, **{k: v for k, v in schema.items() if k != "$ref"}}
    if "allOf" in schema:
        merged = {k: v for k, v in schema.items() if k != "allOf"}
        properties = {}
        required = []
        for branch in schema["allOf"]:
            branch = deref(branch)
            properties.update(branch.get("properties", {}))
            required.extend(branch.get("required", []))
            merged.update(
                {k: v for k, v in branch.items() if k not in ("properties", "required")}
            )
        if properties:
            merged["properties"] = properties
            merged["required"] = list(dict.fromkeys(required))
            merged["type"] = "object"
        return merged
    return schema


def paging(schema):
    schema = deref(schema)
    for branch in schema.get("anyOf", schema.get("oneOf", [])):
        found = paging(branch)
        if found:
            return found
    props = schema.get("properties", {})
    if "nextCursor" in props and "items" in props:
        return {
            "items": "items",
            "cursor": "nextCursor",
            "itemType": ts(deref(props["items"]).get("items", {})),
        }
    if "continueCursor" in props and "page" in props:
        return {
            "items": "page",
            "cursor": "continueCursor",
            "done": "isDone",
            "itemType": ts(deref(props["page"]).get("items", {})),
        }
    return None


used = set()
operations = []
for path, entries in spec["paths"].items():
    for method, op in entries.items():
        if method not in ["get", "post", "put", "patch", "delete", "head"]:
            continue
        if (method, path) in [("post", "/uploads"), ("delete", "/uploads/{storageId}")]:
            continue
        key = method.upper() + " " + path
        if key not in stable_names:
            raise SystemExit("Review and name new public operation: " + key)
        name = stable_names[key]
        if name in used:
            raise SystemExit("Duplicate public method name: " + name)
        used.add(name)
        params = op.get("parameters", [])
        fields = []
        for loc in ["path", "query"]:
            pp = [p for p in params if p["in"] == loc]
            if pp:
                fields.append(
                    loc
                    + ("" if any((p.get("required") for p in pp)) else "?")
                    + ": { "
                    + "; ".join(
                        (
                            json.dumps(p["name"])
                            + ("" if p.get("required") else "?")
                            + ": "
                            + ts(p["schema"])
                            for p in pp
                        )
                    )
                    + " }"
                )
        body = (
            op.get("requestBody", {})
            .get("content", {})
            .get("application/json", {})
            .get("schema")
        )
        if body:
            fields.append(
                "body"
                + ("" if op.get("requestBody", {}).get("required") else "?")
                + ": "
                + ts(body)
            )
        responses = [
            (
                v
                if v.get("content")
                else {
                    **v,
                    "content": {"application/json": {"schema": {"type": "null"}}},
                }
            )
            for k, v in op["responses"].items()
            if k.startswith("2")
        ]
        result = (
            " | ".join(
                dict.fromkeys(
                    (
                        ts(
                            r.get("content", {})
                            .get("application/json", {})
                            .get("schema", {})
                        )
                        for r in responses
                    )
                )
            )
            or "unknown"
        )
        page = (
            next(
                (
                    found
                    for response in responses
                    if (
                        found := paging(
                            response.get("content", {})
                            .get("application/json", {})
                            .get("schema", {})
                        )
                    )
                ),
                None,
            )
            if method == "get" and any((p["name"] == "cursor" for p in params))
            else None
        )
        operations.append(
            dict(
                paging=page,
                name=name,
                method=method.upper(),
                path=path,
                summary=op.get("summary", ""),
                fields=fields,
                result=result,
            )
        )
if len(used) != len(stable_names):
    raise SystemExit(
        "Operation names include removed or unsupported catalog entries; review manifest"
    )
js = "// Generated by scripts/generate-clients.py; public REST operations only.\nimport { Transport, GroupiError } from './transport.js';\nexport { GroupiError };\nexport { DelegatedSession, delegatedActions } from './delegated.js';\nexport class Groupi extends Transport {\n"
dts = "// Generated public REST v2 types.\n"
for name, s in schemas.items():
    dts += "export type " + name + " = " + ts(s) + ";\n"
dts += "export type DelegatedAction = 'groups.context.read' | 'groups.events.read' | 'identity.display-name' | 'identity.email' | 'events.read' | 'events.update' | 'members.read' | 'discussion.read' | 'discussion.create' | 'discussion.update' | 'discussion.delete' | 'files.read' | 'files.upload' | 'profiles.read';\nexport interface DelegatedState {instance: string; issuer: string; audience: string; clientId: string; clientType: 'native' | 'confidentialWeb'; background: boolean; accessToken: string; expiresAt: number; refreshToken?: string; grantedActions: DelegatedAction[]}\nexport interface DelegatedConfig {instance: string; issuer: string; audience: string; clientId: string; clientType: 'native' | 'confidentialWeb'; actions: DelegatedAction[]; getClientAssertion?(input: {tokenEndpoint: string; clientId: string; signal?: AbortSignal}): Promise<string>; storeTokens?(state: DelegatedState | null): Promise<void>}\nexport interface AuthorizationRequest {url: string; state: string; nonce: string; codeVerifier: string; redirectUri: string; background: boolean}\nexport const delegatedActions: readonly DelegatedAction[];\nexport class DelegatedSession {\n constructor(config: DelegatedConfig);\n static restore(config: DelegatedConfig, state: DelegatedState): DelegatedSession;\n static authorizationRequest(config: DelegatedConfig, input: {redirectUri: string; background?: boolean; selectedGroupId?: string}): Promise<AuthorizationRequest>;\n static fromAuthorizationCode(config: DelegatedConfig, input: {code: string; codeVerifier: string; redirectUri: string; state: string; expectedState: string; background?: boolean}, options?: RequestOptions): Promise<DelegatedSession>;\n refresh(options?: RequestOptions): Promise<void>;\n getToken(input: {instance: string; audience: string; signal?: AbortSignal}): Promise<{accessToken: string; instance: string; audience: string; expiresAt: number}>;\n credential(): Extract<Credential, {type: 'delegated'}>;\n}\n"
dts += "export interface RequestOptions { signal?: AbortSignal; idempotencyKey?: string; maxPages?: number }\nexport type Credential = {type: 'apiKey' | 'boundedApiKey'; key: string} | {type: 'delegated'; audience: string; getToken(input: {instance: string; audience: string; signal?: AbortSignal}): Promise<{accessToken: string; instance: string; audience: string; expiresAt?: number}>};\nexport interface ClientOptions {instance: string; credential: Credential; retries?: number; timeoutMs?: number; maxResponseBytes?: number}\nexport class GroupiError extends Error {status: number; code: string; details: unknown; uncertain: boolean}\nexport class Groupi {\n constructor(options: ClientOptions);\n upload(data: Uint8Array, metadata: {filename: string; mimeType?: string; purpose?: 'attachment' | 'avatar' | 'cover'; eventId?: string}, options?: RequestOptions): Promise<{storageId: string; filename: string; mimeType: string; size: number}>;\n discardUpload(storageId: string, options?: RequestOptions): Promise<void>;\n health(options?: RequestOptions): Promise<{status: string; version: string; capabilities: Record<string, {version: number}>}>;\n requireCapability(name: string, version?: number, options?: RequestOptions): ReturnType<Groupi['health']>;\n iterateEvents(query?: {limit?: number}, options?: RequestOptions): AsyncIterable<EventSummary>;\n"
py = '"""Generated named public REST v2 operations. Do not edit manually."""\nfrom .transport import Transport, AsyncTransport\n\nclass Groupi(Transport):\n'
apy = "\nclass AsyncGroupi(AsyncTransport):\n"
for op in operations:
    name = op["name"]
    inp = (
        "{ " + "; ".join(op["fields"]) + " }"
        if op["fields"]
        else "Record<string, never>"
    )
    js += f"  /** {op['summary']} */\n  {name}(input = {{}}, options = {{}}) {{ return this.request({json.dumps(op['method'])}, {json.dumps(op['path'])}, input, options); }}\n"
    dts += (
        f" /** {op['summary']} */\n {name}(input"
        + (
            ""
            if any((not f.split(":", 1)[0].endswith("?") for f in op["fields"]))
            else "?"
        )
        + f": {inp}, options?: RequestOptions): Promise<{op['result']}>;\n"
    )
    if op["paging"]:
        adapter = {k: v for k, v in op["paging"].items() if k != "itemType"}
        if any(
            (
                p["name"] == "pagination"
                for p in spec["paths"][op["path"]][op["method"].lower()].get(
                    "parameters", []
                )
            )
        ):
            adapter["mode"] = "cursor"
        js += f"  {name}Items(input = {{}}, options = {{}}) {{ return this.iterate({json.dumps(op['path'])}, input, {json.dumps(adapter)}, options); }}\n"
        dts += (
            f" {name}Items(input"
            + (
                ""
                if any((not f.split(":", 1)[0].endswith("?") for f in op["fields"]))
                else "?"
            )
            + f": {inp}, options?: RequestOptions): AsyncIterable<{op['paging']['itemType']}>;\n"
        )
    snake = re.sub("(?<!^)(?=[A-Z])", "_", name).lower()
    py += f'''    def {snake}(self, *, path=None, query=None, body=None, idempotency_key=None):\n        """{op['summary']}."""\n        return self.request({op['method']!r}, {op['path']!r}, path=path, query=query, body=body, idempotency_key=idempotency_key)\n\n'''
    if op["paging"]:
        py += f"    def {snake}_items(self, *, path=None, query=None, max_pages=10000):\n        return self.iterate({op['path']!r}, path=path, query=query, adapter={adapter!r}, max_pages=max_pages)\n\n"
        apy += f"    def {snake}_items(self, **kwargs):\n        return self.iterate({op['path']!r}, adapter={adapter!r}, **kwargs)\n\n"
    apy += f'''    async def {snake}(self, **kwargs):\n        """{op['summary']}."""\n        return await self.request({op['method']!r}, {op['path']!r}, **kwargs)\n\n'''
save(root / "packages/sdk/src/index.js", js + "}\n")
save(root / "packages/sdk/src/index.d.ts", dts + "}\n")
save(root / "packages/python-sdk/groupi_sdk/client.py", py + apy)
save(
    root / "packages/sdk/operations.json",
    json.dumps(
        [
            {k: v for k, v in op.items() if k not in ["fields", "result"]}
            for op in operations
        ],
        indent=2,
    )
    + "\n",
)
print(
    f"Generated {len(operations)} named operations per SDK and {len(schemas)} TypeScript schema types"
)
inline_schemas = {}


def pytype(s):
    if s.get("nullable") and (
        not any(
            (
                key in s
                for key in [
                    "type",
                    "$ref",
                    "enum",
                    "properties",
                    "allOf",
                    "anyOf",
                    "oneOf",
                ]
            )
        )
    ):
        return "None"
    if s.get("x-sdk-no-content"):
        return "None"
    if "allOf" in s:
        return pytype(deref(s))
    if "$ref" in s:
        return s["$ref"].split("/")[-1] + (" | None" if s.get("nullable") else "")
    if "enum" in s:
        return "Literal[" + ", ".join((repr(v) for v in s["enum"])) + "]"
    if "anyOf" in s or "oneOf" in s:
        return " | ".join((pytype(v) for v in s.get("anyOf", s.get("oneOf"))))
    t = s.get("type")
    suffix = " | None" if s.get("nullable") else ""
    if isinstance(t, list):
        return " | ".join((pytype({**s, "type": v}) for v in t))
    if t == "array":
        return "list[" + pytype(s.get("items", {})) + "]" + suffix
    if t == "object" or "properties" in s:
        if s.get("properties"):
            import hashlib

            name = (
                "Object"
                + hashlib.sha256(json.dumps(s, sort_keys=True).encode()).hexdigest()[
                    :12
                ]
            )
            inline_schemas[name] = s
            return name + suffix
        return (
            "dict[str, "
            + pytype(
                s.get("additionalProperties", {})
                if isinstance(s.get("additionalProperties"), dict)
                else {}
            )
            + "]"
            + suffix
        )
    return {
        "string": "str",
        "integer": "int",
        "number": "float",
        "boolean": "bool",
        "null": "None",
    }.get(t, "object") + suffix


stub = "from typing import AsyncIterator, Iterator, Literal, NotRequired, TypedDict, Protocol\n\n"
stub += "class DelegatedToken(TypedDict):\n    access_token: str\n    instance: str\n    audience: str\n    expires_at: NotRequired[float]\n\nclass TokenProvider(Protocol):\n    def __call__(self, *, instance: str, audience: str) -> DelegatedToken: ...\n\n"
for name, s in schemas.items():
    if s.get("type") == "object" and s.get("properties"):
        stub += "class " + name + "(TypedDict):\n"
        for key, value in s["properties"].items():
            if key.isidentifier():
                stub += (
                    "    "
                    + key
                    + ": "
                    + (
                        pytype(value)
                        if key in s.get("required", [])
                        else "NotRequired[" + pytype(value) + "]"
                    )
                    + "\n"
                )
        stub += "\n"
    else:
        stub += name + " = " + pytype(s) + "\n"
for cls, async_ in [("Groupi", False), ("AsyncGroupi", True)]:
    stub += "\nclass " + cls + ":\n"
    stub += "    def __init__(self, *, instance: str, api_key: str | None = ..., bounded_api_key: str | None = ..., token_provider: TokenProvider | None = ..., audience: str | None = ..., retries: int = ..., timeout: float = ..., max_response_bytes: int = ...) -> None: ...\n"
    stub += (
        "    "
        + ("async " if async_ else "")
        + "def upload(self, data: bytes, *, filename: str, mime_type: str = ..., purpose: Literal['attachment', 'avatar', 'cover'] = ..., event_id: str | None = ...) -> dict[str, object]: ...\n"
    )
    stub += (
        "    "
        + ("async " if async_ else "")
        + "def discard_upload(self, storage_id: str) -> None: ...\n"
    )
    stub += (
        "    "
        + ("async " if async_ else "")
        + "def health(self) -> dict[str, object]: ...\n"
    )
    stub += (
        "    "
        + ("async " if async_ else "")
        + "def require_capability(self, name: str, version: int = ...) -> dict[str, object]: ...\n"
    )
    stub += (
        "    def iterate_events(self, *, limit: int = ..., max_pages: int = ...) -> "
        + ("AsyncIterator" if async_ else "Iterator")
        + "[EventSummary]: ...\n"
    )
    for op in operations:
        snake = re.sub("(?<!^)(?=[A-Z])", "_", op["name"]).lower()
        wire = spec["paths"][op["path"]][op["method"].lower()]
        body = (
            wire.get("requestBody", {})
            .get("content", {})
            .get("application/json", {})
            .get("schema", {})
        )
        responses = [
            (
                v
                if v.get("content")
                else {
                    **v,
                    "content": {"application/json": {"schema": {"type": "null"}}},
                }
            )
            for k, v in wire["responses"].items()
            if k.startswith("2")
        ]
        result = (
            " | ".join(
                dict.fromkeys(
                    (
                        pytype(
                            r.get("content", {})
                            .get("application/json", {})
                            .get("schema", {})
                        )
                        for r in responses
                    )
                )
            )
            or "object"
        )
        parameter_types = {}
        for location in ["path", "query"]:
            params = [v for v in wire.get("parameters", []) if v["in"] == location]
            parameter_types[location] = (
                pytype(
                    {
                        "type": "object",
                        "properties": {v["name"]: v["schema"] for v in params},
                        "required": [v["name"] for v in params if v.get("required")],
                    }
                )
                if params
                else "None"
            )
        required_path = any(
            (
                v["in"] == "path" and v.get("required")
                for v in wire.get("parameters", [])
            )
        )
        path_arg = f"path: {parameter_types['path']}" + (
            "" if required_path else " | None = ..."
        )
        required_query = any(
            (
                v["in"] == "query" and v.get("required")
                for v in wire.get("parameters", [])
            )
        )
        query_arg = f"query: {parameter_types['query']}" + (
            "" if required_query else " | None = ..."
        )
        body_arg = f"body: {(pytype(body) if wire.get('requestBody') else 'None')}" + (
            "" if wire.get("requestBody", {}).get("required") else " | None = ..."
        )
        stub += (
            "    "
            + ("async " if async_ else "")
            + f"def {snake}(self, *, {path_arg}, {query_arg}, {body_arg}, idempotency_key: str | None = ...) -> {result}: ...\n"
        )
        if op["paging"]:

            def item_type(schema):
                schema = deref(schema)
                for branch in schema.get("anyOf", schema.get("oneOf", [])):
                    found = item_type(branch)
                    if found:
                        return found
                props = schema.get("properties", {})
                for key in ["items", "page"]:
                    if key in props and (
                        "nextCursor" in props or "continueCursor" in props
                    ):
                        return pytype(deref(props[key]).get("items", {}))
                return None

            item = next(
                (
                    found
                    for response in responses
                    if (
                        found := item_type(
                            response.get("content", {})
                            .get("application/json", {})
                            .get("schema", {})
                        )
                    )
                ),
                "object",
            )
            stub += f"    def {snake}_items(self, *, {path_arg}, {query_arg}, max_pages: int = ...) -> {('AsyncIterator' if async_ else 'Iterator')}[{item}]: ...\n"
written = set()
while len(written) < len(inline_schemas):
    for name, schema in list(inline_schemas.items()):
        if name in written:
            continue
        written.add(name)
        stub += "\nclass " + name + "(TypedDict):\n"
        for key, value in schema["properties"].items():
            if key.isidentifier():
                stub += (
                    "    "
                    + key
                    + ": "
                    + (
                        pytype(value)
                        if key in schema.get("required", [])
                        else "NotRequired[" + pytype(value) + "]"
                    )
                    + "\n"
                )
save(root / "packages/python-sdk/groupi_sdk/client.pyi", stub)
save(root / "packages/python-sdk/groupi_sdk/py.typed", "")
model_prefix = stub.split("\nclass Groupi:")[0]
model_tail = stub[stub.index("\nclass Object", stub.index("\nclass AsyncGroupi:")) :]
runtime_types = (
    "from __future__ import annotations\n"
    + model_prefix.replace("Protocol\n", "Protocol, TypeAlias\n")
    + model_tail
)
aliases = dict(re.findall("^(\\w+) = (.+)$", runtime_types, flags=re.M))
runtime_types = re.sub("^\\w+ = .+$", "", runtime_types, flags=re.M)
pending = dict(aliases)
while pending:
    ready = [
        name
        for name, expression in pending.items()
        if not set(re.findall("\\b\\w+\\b", expression)) & set(pending)
    ]
    if not ready:
        for name, expression in pending.items():
            runtime_types += f"\n{name}: TypeAlias = {expression!r}\n"
        break
    for name in ready:
        runtime_types += f"\n{name}: TypeAlias = {pending.pop(name)}\n"
save(root / "packages/python-sdk/groupi_sdk/types.py", runtime_types)
model_names = list(schemas) + ["DelegatedToken", "TokenProvider"] + list(inline_schemas)
imports = (
    "from .types import (\n"
    + "".join(("    " + name + ",\n" for name in model_names))
    + ")\n"
)
save(root / "packages/python-sdk/groupi_sdk/client.py", imports + py + apy)

unknown_operations = [
    op["name"]
    for op in operations
    if "unknown" in op["result"] or any("unknown" in field for field in op["fields"])
]
unknown_schemas = [name for name, schema in schemas.items() if "unknown" in ts(schema)]
if unknown_operations or unknown_schemas:
    raise SystemExit(
        "Public SDK contracts must have known types: "
        + str({"operations": unknown_operations, "schemas": unknown_schemas})
    )
save(
    root / "packages/sdk/type-audit.json",
    json.dumps(
        {
            "openapiSha256": hashlib.sha256(
                json.dumps(spec, sort_keys=True, separators=(",", ":")).encode()
            ).hexdigest(),
            "documentedOperations": sum(len(v) for v in spec["paths"].values()),
            "generatedOperations": len(operations),
            "transportAdapters": 2,
            "schemaTypes": len(schemas),
            "unknownOperationTypes": unknown_operations,
            "unknownSchemaTypes": unknown_schemas,
            "nonDomainOpaqueFields": [
                "GroupiError.details: arbitrary external error cause"
            ],
        },
        indent=2,
    )
    + "\n",
)
if check:
    stale = []

    def canonical(path, content):
        if path.suffix in (".js", ".ts"):
            return subprocess.run(
                ["node", str(root / "packages/sdk/scripts/canonical-tokens.mjs")],
                input=content,
                text=True,
                capture_output=True,
                check=True,
                cwd=root / "packages/sdk",
            ).stdout
        if path.suffix == ".json":
            return json.dumps(json.loads(content), sort_keys=True)
        return content

    for path, expected in outputs.items():
        if not path.exists() or canonical(path, expected) != canonical(
            path, path.read_text()
        ):
            stale.append(str(path.relative_to(root)))
    if stale:
        raise SystemExit("Stale generated SDK contracts: " + ", ".join(stale))
    print("Generated SDK contracts are fresh")
