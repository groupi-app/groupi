# Getting Started with Groupi

This guide will help you set up Groupi for local development.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 18+** - [Download](https://nodejs.org/)
- **pnpm 10+** - Install with `npm install -g pnpm`
- **Git** - [Download](https://git-scm.com/)

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/TheiaSurette/groupi.git
cd groupi
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Set Up Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your own credentials. You'll need:

| Variable                 | Description           | How to Get                                                  |
| ------------------------ | --------------------- | ----------------------------------------------------------- |
| `CONVEX_DEPLOYMENT`      | Convex deployment URL | Created automatically when running `npx convex dev`         |
| `NEXT_PUBLIC_CONVEX_URL` | Public Convex URL     | Same as above                                               |
| `BETTER_AUTH_SECRET`     | Auth secret key       | Generate with `openssl rand -base64 32`                     |
| `GOOGLE_CLIENT_ID`       | Google OAuth          | [Google Cloud Console](https://console.cloud.google.com/)   |
| `GOOGLE_CLIENT_SECRET`   | Google OAuth          | Same as above                                               |
| `DISCORD_CLIENT_ID`      | Discord OAuth         | [Discord Developer Portal](https://discord.com/developers/) |
| `DISCORD_CLIENT_SECRET`  | Discord OAuth         | Same as above                                               |
| `RESEND_API_KEY`         | Email sending         | [Resend Dashboard](https://resend.com/)                     |

### 4. Set Up Convex

In one terminal, start Convex:

```bash
npx convex dev
```

This will:

- Create a new Convex project (first time only)
- Sync your schema and functions
- Generate TypeScript types
- Watch for changes

### 5. Start Development Server

In another terminal:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
groupi/
├── convex/              # Backend - Convex functions and schema
│   ├── schema.ts        # Database schema
│   ├── auth.ts          # Authentication setup
│   ├── events/          # Event-related functions
│   ├── persons/         # User profile functions
│   └── posts/           # Discussion functions
├── packages/
│   ├── web/             # Next.js web application
│   │   ├── app/         # App Router pages
│   │   ├── components/  # React components
│   │   └── hooks/       # Custom hooks
│   ├── mobile/          # React Native mobile app
│   └── shared/          # Cross-platform business logic
└── docs/                # Documentation
```

## AI Agent Skills

This project includes a curated set of [skills.sh](https://skills.sh/) skills that give AI coding agents (Claude Code, Cursor, Copilot, etc.) specialized knowledge about the tech stack. Skills are tracked in `skills-lock.json` so every contributor gets the same set.

### Install skills (first time setup)

```bash
npx skills experimental_install
```

This restores all project skills from `skills-lock.json` into your local agent directories.

### What's included

| Skill | Purpose |
| ----- | ------- |
| `convex` | General Convex patterns |
| `convex-best-practices` | Convex function best practices |
| `convex-schema-validator` | Schema validation patterns |
| `convex-realtime` | Real-time subscription patterns |
| `convex-cron-jobs` | Scheduled function patterns |
| `native-data-fetching` | Official Expo data fetching |
| `expo-react-native-typescript` | Expo + React Native + TypeScript |
| `expo-react-native-performance` | React Native performance optimization |
| `vitest` | Vitest testing patterns |
| `vercel-react-best-practices` | React/Next.js performance |
| `vercel-composition-patterns` | React composition patterns |
| `shadcn` | shadcn/ui component management |

### Managing skills

```bash
npx skills list              # See installed skills
npx skills check             # Check for updates
npx skills update            # Update all skills
npx skills find [query]      # Search for new skills
npx skills add <package>     # Add a new skill (omit -g to add to project)
```

When adding a new skill to the project (without `-g`), it updates `skills-lock.json` automatically. Commit that file so other contributors get the skill too.

## Development Workflow

### Running Commands

```bash
pnpm check          # Run lint, type-check, and format check
pnpm test:run       # Run all tests
pnpm lint:fix       # Auto-fix linting issues
pnpm format         # Format code with Prettier
pnpm generate       # Regenerate Convex types after schema changes
```

### Making Changes

1. **Create a branch** for your work:

   ```bash
   git checkout -b feat/my-feature
   ```

2. **Make your changes** following the architecture:
   - Backend first: Start with Convex schema and functions
   - Then shared logic: Add hooks in `packages/shared`
   - Finally UI: Implement components in `packages/web`

3. **Validate your changes**:

   ```bash
   pnpm check
   pnpm test:run
   ```

4. **Create a changeset** (for user-facing changes):

   ```bash
   pnpm changeset
   ```

5. **Commit with conventional commits**:
   ```bash
   pnpm commit
   # Or manually: git commit -m "feat(web): add new feature"
   ```

## Understanding the Architecture

### Real-Time First

Groupi uses Convex for real-time data synchronization. Instead of traditional REST APIs:

```typescript
// Use Convex hooks for data
const events = useQuery(api.events.queries.list);
const createEvent = useMutation(api.events.mutations.create);
```

### Cross-Platform Code

Business logic lives in `packages/shared` and works on both web and mobile:

```typescript
// Shared hooks work everywhere
import { useEventData } from '@groupi/shared/hooks';
```

### Client-Only Web App

The Next.js app is purely client-side - no server components, API routes, or server actions.

## Common Tasks

### Adding a New Feature

1. Define schema in `convex/schema.ts`
2. Run `pnpm generate` to update types
3. Create queries in `convex/{domain}/queries.ts`
4. Create mutations in `convex/{domain}/mutations.ts`
5. Add shared hooks in `packages/shared/src/hooks/`
6. Build UI in `packages/web/`

### Running Tests

```bash
pnpm test:run          # All tests
pnpm test:convex       # Backend only
pnpm test:web          # Web only
pnpm test:shared       # Shared package only
```

### Debugging

- Check browser console for client errors
- Check Convex dashboard for backend logs
- Use React DevTools for component inspection

## Getting Help

- Read the [CONTRIBUTING.md](../CONTRIBUTING.md) guide
- Check existing [GitHub Discussions](https://github.com/TheiaSurette/groupi/discussions)
- Review the [architecture documentation](../CLAUDE.md)

## Next Steps

- Explore the codebase structure
- Read the [UI Design System](../docs/ui-design-system.md) documentation
- Pick a [good first issue](https://github.com/TheiaSurette/groupi/labels/good%20first%20issue) to work on
