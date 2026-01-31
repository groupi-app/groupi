# Groupi - AI Agent Guide

Cross-platform event planning app with Convex backend, Next.js web, and React Native mobile.

## Quick Reference

```bash
pnpm check      # Validate code (lint + types + format) - USE THIS
pnpm generate   # Regenerate Convex types after schema changes
pnpm test:run   # Run all tests
pnpm lint:fix   # Auto-fix linting issues
pnpm lint:tokens # Check design token usage
pnpm format     # Format code
```

**NEVER run:** `pnpm dev*`, `pnpm build*`, `pnpm start`, `pnpm convex:dev`, `pnpm convex:deploy`
Assume dev server is always running. See `.claude/rules/scripts.md` for details.

## Architecture

| Layer   | Location           | Purpose                                       |
| ------- | ------------------ | --------------------------------------------- |
| Backend | `convex/`          | Convex functions (queries, mutations, schema) |
| Web     | `packages/web/`    | Next.js 16 client-only app                    |
| Mobile  | `packages/mobile/` | React Native + Expo                           |
| Shared  | `packages/shared/` | Cross-platform business logic                 |

### Core Principles

1. **Real-time first**: Use `useQuery`/`useMutation` from Convex, never `useState` + `useEffect` for data
2. **Client-only**: No SSR, no API routes, no server actions in Next.js
3. **Cross-platform**: 95% of logic in shared package, platform-specific UI only
4. **Type inference**: Let TypeScript infer from Convex functions, never add manual type aliases

## Convex Patterns

### Authentication

```typescript
import { requireAuth, getCurrentPerson } from '../auth';

// In mutations - require auth
const { user, person } = await requireAuth(ctx);

// In queries - optional auth
const person = await getCurrentPerson(ctx);
```

### File Organization

```
convex/{domain}/
  queries.ts    # Read operations
  mutations.ts  # Write operations
```

### Key Tables

- `persons` - App profiles (linked to Better Auth users via `userId` string)
- `events` - Events with creator, dates, reminders
- `memberships` - Person-to-event relationships with roles (ORGANIZER/MODERATOR/ATTENDEE)
- `posts` / `replies` - Event discussion
- `notifications` - User notifications

## Web Patterns (packages/web)

### Imports

```typescript
import { api } from '@/convex/_generated/api';
import { useQuery, useMutation } from 'convex/react';
import { Button } from '@/components/ui/button';
```

### Components

- Use shadcn/ui components from `components/ui/`
- Style with Tailwind CSS
- All components are client components

## Shared Package Rules (packages/shared)

**NEVER import:** `react-native`, `next/*`, `expo-*`, or any platform-specific modules

```typescript
// Use platform abstractions
import { navigation, toast } from '@groupi/shared/platform';
```

## Feature Development Order

1. **Backend first**: Schema in `convex/schema.ts` → queries → mutations
2. **Run `pnpm generate`** after schema changes
3. **Shared logic**: Hooks in `packages/shared/src/hooks/`
4. **Platform UI**: Web and mobile components

## Testing

```bash
pnpm test:run          # All tests
pnpm test:convex       # Backend only
pnpm test:web          # Web only
```

Convex tests use `convex-test` with `t.withIdentity({ subject: userId })` for auth.

## UI & Design System

Groupi uses a **Duolingo-inspired** design philosophy with dramatically rounded corners, bouncy animations, and semantic color tokens. The UI is built on two foundational pillars:

### Design Tokens

A three-layer token system ensures visual consistency:

| Layer      | Purpose                         | Example                          |
| ---------- | ------------------------------- | -------------------------------- |
| Primitives | Raw values (never use directly) | `purple.700`, `spacing.4`        |
| Semantic   | Purpose-based tokens            | `bg-success`, `shadow-raised`    |
| Component  | Component-specific tokens       | `rounded-button`, `rounded-card` |

**Always use semantic tokens, never hardcoded Tailwind classes:**

| Avoid        | Use Instead                          |
| ------------ | ------------------------------------ |
| `bg-red-*`   | `bg-error`, `bg-bg-error-subtle`     |
| `bg-green-*` | `bg-success`, `bg-bg-success-subtle` |
| `bg-gray-*`  | `bg-muted`, `bg-bg-surface`          |
| `shadow-lg`  | `shadow-floating`, `shadow-overlay`  |
| `rounded-xl` | `rounded-card`, `rounded-modal`      |
| `z-50`       | `z-popover`, `z-modal`               |

Run `pnpm lint:tokens` to check for violations.

### Atomic Component Architecture

Components are organized by complexity:

| Level     | Purpose                   | Location                | Examples                             |
| --------- | ------------------------- | ----------------------- | ------------------------------------ |
| Atoms     | Smallest elements         | `components/atoms/`     | StatusDot, PresenceIndicator         |
| Molecules | Simple combinations       | `components/molecules/` | UserInfoCard, RsvpStatus             |
| Organisms | Complex sections          | `components/organisms/` | PostCard, MemberIcon                 |
| Templates | Page layouts              | `components/templates/` | DetailPageTemplate, ListPageTemplate |
| UI        | shadcn/ui base components | `components/ui/`        | Button, Card, Dialog                 |

**Key rules:**

- Atoms: Pure presentation, no data fetching, no business logic
- Molecules: Compose 2-3 atoms, minimal logic
- Organisms: Feature-specific, may have business logic and data
- Templates: Define layout structure, no data fetching

See `docs/ui-design-system.md` for comprehensive documentation.

## Detailed Rules

- Architecture: `.claude/rules/architecture.md`
- Scripts: `.claude/rules/scripts.md`
- Testing: `.claude/rules/testing.md`
- UI Design System: `.claude/rules/ui-design-system.md`
- Presence System: `.claude/rules/presence.md`
- Documentation: `.claude/rules/documentation.md`
