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

## Design Tokens

Use design tokens instead of hardcoded Tailwind classes:

| Avoid        | Use Instead                         |
| ------------ | ----------------------------------- |
| `bg-red-*`   | `bg-error`, `bg-error-subtle`       |
| `bg-green-*` | `bg-success`, `bg-success-subtle`   |
| `bg-gray-*`  | `bg-muted`, `bg-surface`            |
| `shadow-lg`  | `shadow-floating`, `shadow-overlay` |
| `rounded-xl` | `rounded-card`, `rounded-modal`     |
| `z-50`       | `z-popover`, `z-modal`              |

Run `pnpm lint:tokens` to check for violations. See `.claude/rules/design-tokens.md` for details.

## Detailed Rules

- Architecture: `.claude/rules/architecture.md`
- Scripts: `.claude/rules/scripts.md`
- Testing: `.claude/rules/testing.md`
- Design Tokens: `.claude/rules/design-tokens.md`
- Documentation: `.claude/rules/documentation.md`
