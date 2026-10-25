# Groupi Convex backend

Convex owns Groupi's application data, queries, mutations, actions, storage,
scheduled jobs, and versioned REST endpoints. Better Auth runs as a Convex
component.

## Table of Contents

- [Structure](#structure)
- [Authentication and permissions](#authentication-and-permissions)
- [Schema and tests](#schema-and-tests)
- [Development](#development)

## Structure

| Location                                                      | Purpose                                                |
| ------------------------------------------------------------- | ------------------------------------------------------ |
| `_generated/`                                                 | Generated function references and data types           |
| `schema.ts`                                                   | Root application schema                                |
| `auth.ts`, `betterAuth/`                                      | Auth configuration, helpers, and component integration |
| `events/`, `groups/`, `posts/`, `replies/`, and other domains | Native functions and domain operations                 |
| `api/v1/`, `api/v2/`                                          | Versioned HTTP routes and OpenAPI schemas              |
| `api/`                                                        | Shared REST authentication and transport support       |
| `tests/`                                                      | Backend fixtures and tests                             |

Reusable writes belong to domains. Native functions and domain REST adapters
call those operations; domains must not import versioned HTTP folders. Preserve
public function paths and wire contracts when moving implementations. See the
[backend ownership decision](../docs/adr/0003-domain-owned-backend-operations.md).

## Authentication and permissions

Use `requireAuth(ctx)` for authenticated operations and `getCurrentPerson(ctx)`
for optional query authentication. Both live in `auth.ts`. Authentication alone
does not grant access to an event or Group: check current membership, roles,
grants, and admission rules for the requested operation.

Enforce write permissions inside the mutation transaction. An HTTP preflight
query cannot replace that check. Validate arguments and return contracts using
Convex validators. REST credentials retain their action and resource limits;
an API method never grants authority by itself.

## Schema and tests

`persons.userId` is a string referring to a Better Auth component user. The root
schema has no `users` table. Events use `memberships`; Groups use separate
`groupMemberships`. Group membership does not automatically create event
membership or an RSVP.

Use [`schema.ts`](schema.ts) and the
[database reference](../docs/database-schema.md) for fields and indexes, and
[Authentication](../docs/auth-architecture.md) for identity boundaries.
Prefer the existing helpers in [`tests/test_helpers.ts`](tests/test_helpers.ts)
to hand-written fixture schemas. Never copy an example that omits required
fields into a public function.

## Development

From the repository root:

```bash
pnpm generate      # After schema, function name, or signature changes
pnpm test:convex    # Backend tests once
pnpm check         # Lint, types, contracts, and formatting
```

The [script policy](../.agents/rules/scripts.md) restricts agent runtime, build,
and deployment commands. Backend logs appear in the selected Convex deployment;
keep credentials and private user content out of logs.

See [Testing](../docs/testing.md) and [Convex rules](../.agents/rules/convex.md).
