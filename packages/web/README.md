# @groupi/web

Groupi's Next.js App Router application uses Convex for application data and
Better Auth for authentication.

## Table of Contents

- [Structure](#structure)
- [Development](#development)
- [Data and authentication](#data-and-authentication)
- [UI and providers](#ui-and-providers)

## Structure

| Location                    | Purpose                                                         |
| --------------------------- | --------------------------------------------------------------- |
| `app/`                      | Route groups, pages, layouts, auth proxy, and API docs redirect |
| `features/`                 | Feature-owned UI, hooks, supporting logic, and tests            |
| `components/`               | Reusable UI, atoms, molecules, organisms, and templates         |
| `providers/`, `context/`    | Theme, Convex, visibility, and user contexts                    |
| `hooks/`, `lib/`, `stores/` | Shared web hooks, utilities, and local UI state                 |

Routes compose public feature entry points. Convex owns application data and
transactions; local stores hold UI state. See [Architecture](../../docs/architecture.md)
and the [feature ownership decision](../../docs/adr/0002-feature-owned-application-modules.md).

## Development

Follow [Getting started](../../docs/getting-started.md) for runtime versions,
root environment configuration, and Convex setup. From the repository root:

```bash
pnpm dev          # Web and Convex
pnpm dev:web      # Web only, with an existing backend
pnpm check        # Lint, types, contracts, and formatting
pnpm test:web     # Web tests once
pnpm lint:tokens  # Web and portal token checks
```

The web app normally listens at <http://localhost:3000>. Agents follow the
[script policy](../../.agents/rules/scripts.md) before starting runtimes.

## Data and authentication

Use generated Convex functions rather than hand-maintained transport types:

```typescript
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

const events = useQuery(api.events.queries.getUserEvents);
```

Handle `undefined` as loading and enforce authorization in backend functions.
The web app uses client components for interactive application data. It also
provides a Better Auth proxy at `app/api/auth/[...all]/route.ts` and a Convex API
docs redirect at `app/api/docs/route.ts`. Versioned REST APIs live in `convex/api/`.

Authentication supports configured Google/Discord providers, email magic links,
and passkeys. Password support on the backend does not imply a complete password
sign-in or reset UI. See [Authentication](../../docs/auth-architecture.md) for
provider configuration, account linking, API keys, and limitations.

## UI and providers

Use semantic design tokens and reusable UI components. The current Soft lift
treatment and interaction checks are documented in the
[Storybook guide](stories/design-system/README.md) and
[UI design system](../../docs/ui-design-system.md).

The root `app/layout.tsx` composes `ThemeProvider`, `ConvexClientProvider`,
`VisibilityProvider`, and `GlobalUserProvider`, alongside tooltip and navigation
guards. Providers live in `providers/` and `context/`; other app-level feedback
lives in `components/app-providers.tsx`.

Presence includes online status, typing indicators, and room participation. See
[Presence](../../docs/presence.md) and [Testing](../../docs/testing.md).
