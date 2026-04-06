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
pnpm changeset  # Create a changeset for your changes
pnpm commit     # Interactive conventional commit
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
5. **Create changeset** if the change affects users (see below)

## Changesets (Versioning)

Changesets track what changed for the CHANGELOG and version bumps. Create one per feature/fix, not per commit. See `docs/changesets.md` for comprehensive documentation.

### When to Create a Changeset

| Change Type                  | Needs Changeset? |
| ---------------------------- | ---------------- |
| New feature                  | ✅ Yes           |
| Bug fix                      | ✅ Yes           |
| Breaking change              | ✅ Yes           |
| Refactoring (no user impact) | ❌ No            |
| Docs/comments only           | ❌ No            |
| CI/tooling changes           | ❌ No            |

### Creating a Changeset

```bash
pnpm changeset
```

This prompts for:

1. Which packages changed (select with space)
2. Bump type: `patch` (fix), `minor` (feature), `major` (breaking)
3. Summary for CHANGELOG

Commit the generated `.changeset/*.md` file with your code.

### Enforcement

Changesets are enforced at two levels:

1. **Pre-push hook** - Blocks push if source code changed without a changeset
2. **CI check** - Fails PR if no changeset (unless `skip-changeset` label is added)

**Skipping the check** (for non-user-facing changes):

```bash
SKIP_CHANGESET=1 git push   # Skip pre-push hook
git push --no-verify        # Skip all hooks
```

### AI Agent Rule

**After completing a user-facing feature or fix**, remind the user to create a changeset or offer to guide them through it. Do NOT create changesets automatically without user confirmation since the summary should reflect their intent.

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

## AI Agent Skills

This project uses [skills.sh](https://skills.sh/) to provide specialized knowledge about the tech stack. Skills are tracked in `skills-lock.json` and installed to `.agents/`. Contributors restore them with:

```bash
npx skills experimental_install
```

Installed skills: Convex (general, best practices, schema validator, realtime, cron jobs), Expo (data fetching, TypeScript, performance), Vitest, Vercel (React best practices, composition patterns), and shadcn.

## Detailed Rules

- Architecture: `.claude/rules/architecture.md`
- Scripts: `.claude/rules/scripts.md`
- Testing: `.claude/rules/testing.md`
- UI Design System: `.claude/rules/ui-design-system.md`
- Presence System: `.claude/rules/presence.md`
- Add-on Framework: `.claude/rules/addons.md`
- Documentation: `.claude/rules/documentation.md`
