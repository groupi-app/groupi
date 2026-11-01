# Groupi architecture

Groupi uses a Convex backend, a Next.js web app, and a React Native/Expo mobile
app. Shared TypeScript modules supply business logic, hooks, and design tokens.
This guide describes the source in this branch; it does not establish which
features are deployed or released.

## Table of Contents

- [Overview](#overview)
- [Architecture Pattern](#architecture-pattern)
- [Package Structure](#package-structure)
- [Data Model](#data-model)
- [Authentication](#authentication)
- [Data Flow](#data-flow)
- [Real-Time Patterns](#real-time-patterns)
- [Feature Development](#feature-development)
- [Best Practices](#best-practices)

## Overview

Web and mobile use Convex queries and mutations for application data. Better Auth
runs as a Convex component. CLI and SDK clients use the versioned REST API hosted
by Convex; their request/response transport is distinct from app subscriptions.

The web UI uses client components. Next.js also hosts auth proxy and documentation
route handlers under `packages/web/app/api/`; application backend operations live
in Convex. The client-component convention does not mean the repository has no
server route handlers.

## Architecture Pattern

- Keep reusable business logic in `@groupi/shared`, with platform-specific UI in
  web and mobile. There is no measured code-reuse percentage for the repository.
- Inject the generated Convex API into shared hook factories.
- Supply navigation, storage, and toast adapters at the platform boundary. Shared
  modules must not import `next/*`, `react-native`, or `expo-*`.
- Infer application types from generated Convex contracts. Regenerate declarations
  after schema or function-contract changes.
- Keep permissions inside backend operations, including the transaction that writes
  data. Authenticating an HTTP request alone does not authorize its operation.

## Package Structure

| Location                        | Responsibility                                                       |
| ------------------------------- | -------------------------------------------------------------------- |
| `convex/`                       | Schema, domain operations, auth, scheduled work, and HTTP API        |
| `packages/web/app/`             | Next.js routes and layouts                                           |
| `packages/web/features/`        | Feature-owned application UI, hooks, logic, and tests                |
| `packages/web/components/`      | Reusable atomic UI and shadcn/ui components                          |
| `packages/web/providers/`       | Convex, theme, and visibility providers                              |
| `packages/mobile/app/`          | Expo Router routes                                                   |
| `packages/mobile/src/`          | Native UI, hooks, providers, and platform adapters                   |
| `packages/mobile/app.config.ts` | Expo application configuration                                       |
| `packages/shared/src/`          | Shared hooks, platform interfaces, design system, utilities, and GDL |
| `packages/cli/`                 | Command-line client using REST v2                                    |
| `packages/sdk/`                 | TypeScript SDK source                                                |
| `packages/python-sdk/`          | Python SDK source                                                    |
| `packages/portal/`              | Public developer documentation and generated exports                 |

Each backend domain owns reusable operations and its internal REST adapters.
Public native `queries.ts` and `mutations.ts` paths remain stable while focused
modules such as `events/writes.ts` own behavior. `convex/api/v1/` and
`convex/api/v2/` own HTTP schemas, envelopes, and status conventions. Shared
API-key verification and middleware live in `convex/api/auth.ts` and
`convex/api/middleware/auth.ts`.

Web features expose public entry points; routes compose them. Reusable UI stays
in the atomic hierarchy of atoms, molecules, organisms, and templates. Add-ons are
the first feature migration, with import boundaries enforced by ESLint; other
features adopt this convention incrementally. Runtime consumers must remain
independent of authoring code. See the [web feature decision](./adr/0002-feature-owned-application-modules.md)
and [backend ownership decision](./adr/0003-domain-owned-backend-operations.md).

Workspace consumers resolve shared TypeScript source without a shared prebuild.
Distribution uses compiled exports through pnpm publication overrides. See
[workspace source ownership](./workspace-source-ownership-design.md).

## Data Model

| Table or table family                                                        | Purpose                                                     |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `persons`                                                                    | Application profiles linked to Better Auth user IDs         |
| `events`, `memberships`                                                      | Events and their member roles and RSVP responses            |
| `potentialDateTimes`, `availabilities`                                       | Proposed date ranges and member availability                |
| `posts`, `replies`                                                           | Event discussions, including authorized Integration authors |
| `invites`, `eventInvites`                                                    | Invitation links and direct invitations                     |
| `groups`, `groupMemberships`                                                 | Formal communities with membership independent of events    |
| `notifications`                                                              | User notifications                                          |
| `authorizationPrincipals`, `authorizationGrants`, `authorizationCredentials` | Bounded API actors, grants, and credentials                 |

Better Auth owns accounts, users, and sessions in its component namespace.
`persons.userId` is a string linking to that component; it is not an
`Id<'users'>` in the application schema. Group membership, event audience,
event membership, admission, and RSVP are separate concepts. See the
[glossary](../GLOSSARY.md) and [schema reference](./database-schema.md).

## Authentication

Use the helpers exported by `convex/auth.ts`:

- `requireAuth(ctx)` returns the authenticated user and application person or
  throws. Use it for protected writes.
- `getCurrentPerson(ctx)` returns the current person or `null`, for queries that
  support unauthenticated access.
- `requireEventRole` and `requireEventPermission` enforce event authority.
- `authComponent.getAnyUserById(ctx, userId as AuthUserId)` reads a Better Auth
  user. Component tables are not queried through the application database.

An authenticated identity alone does not grant event or Group access. Domain
operations must enforce current membership, role, grant, and resource constraints.
See [authentication architecture](./auth-architecture.md) and
[bounded authorization](./bounded-authorization.md).

## Data Flow

App interaction flows from a platform UI through a shared or platform hook to a
Convex query or mutation. Queries subscribe to their dependencies; committed
changes update subscribed clients. Mutations run transactionally. Actions handle
external work and call queries/mutations as needed.

Shared event hooks expose existing operations without adding platform feedback:

```typescript
import { createEventHooks } from '@groupi/shared/hooks';

const { useEventHeader, useCreateEvent } = createEventHooks(api);
// Inside a component or hook:
const eventHeader = useEventHeader(eventId);
const createEvent = useCreateEvent();
```

The consuming UI handles mutation success, failure, navigation, and toasts.
Handle `undefined` query results as loading and follow each query's declared
missing-resource or permission result. Do not replace subscriptions with manual
`useState`/`useEffect` fetch loops for app data.

REST adapters verify credentials and call domain operations. They retain each
API version's declared wire contract. Source availability does not establish
API deployment or SDK publication; consult the relevant release and verification
guides before relying on an external client capability.

## Real-Time Patterns

`useQuery` maintains app data subscriptions. There is no manual cache invalidation
step for those subscribed query results. REST clients do not acquire a realtime
subscription by making an HTTP read.

Presence is implemented in `convex/presence.ts` using `@convex-dev/presence`.
Rooms include `app`, `event:{eventId}`, and `post:{postId}`. Presence writes derive
identity from the authenticated session and validate event-scoped room access;
the optional legacy `userId` argument is not trusted. Presence data supports online
status and typing indicators. Follow the [presence guide](./presence.md) for
heartbeat, visibility, status, and privacy behavior.

## Feature Development

1. Define backend contracts and indexes in the owning domain and schema. Validate
   inputs and enforce permissions for reads and writes.
2. Add queries/mutations and focused domain operations. Keep native and REST
   behavior consistent where they represent the same operation, preserving
   intentional versioned transport differences.
3. Run `pnpm generate` after schema, function signature, or function name changes.
4. Add shared hooks and exports for cross-platform behavior. Keep platform imports
   and user feedback in the consuming application.
5. Add web and mobile UI with loading, empty, and error states. Separate data
   access from reusable presentation components.
6. Add permission, validation, and behavior tests; run `pnpm check` and relevant
   one-shot test commands from the [testing guide](./testing.md).
7. For user-facing changes, follow the [changeset workflow](./changesets.md).

## Best Practices

- Validate arguments with concrete Convex validators and use indexes matching
  query access patterns. Avoid unbounded collection and repeated per-item reads
  when a bounded or batched operation is available.
- Keep write authorization and side effects in the same domain transaction.
  Permission checks must cover resources referenced by an operation, not just
  its entry point.
- Infer types from generated contracts rather than recreating database shapes
  in consumers. Never edit generated declarations by hand.
- Use semantic design tokens and reusable UI components. Keep application
  features behind their public entry points.
- Parse GDL through `@groupi/shared/gdl` with explicit reference time and timezone.
  Web/mobile supply the device zone; omitted REST timezone defaults to UTC.
  See [GDL ownership](./shared-gdl-design.md).
- Report failures to the user and preserve uncertain write outcomes where the
  client contract requires explicit recovery. A lost response is not evidence
  that a write failed.

Agents must follow the [script policy](../.agents/rules/scripts.md), including its
restrictions on dev servers, builds, and deployment commands.
