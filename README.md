# Groupi

A modern event planning and group coordination platform built with Next.js, React Native, and a monorepo architecture.

## Development Workflow

### Quick Start

```bash
# Install dependencies
pnpm install

# Start development environment (web app + package watches + Prisma Studio)
pnpm dev

# Start full development environment (includes database and ngrok)
pnpm dev:full
```

### Monorepo Development

This project uses a monorepo structure with the following packages:

- `@groupi/web` - Next.js web application
- `@groupi/hooks` - React hooks for data fetching
- `@groupi/services` - Server-side business logic
- `@groupi/schema` - TypeScript types and DTOs
- `@groupi/ui` - Shared UI components

#### Development Modes

**Option 1: Basic Development Mode (Recommended)**

```bash
# Start web app, Prisma Studio, and package watches
pnpm dev
```

**Option 2: Full Development Mode**

```bash
# Start everything: web app, Supabase (local Postgres + services), Prisma Studio, ngrok, and package watches
pnpm dev:full
```

**Option 3: Individual Services**

```bash
# Start just the web app
turbo dev --filter=@groupi/web

# Watch all packages for changes
pnpm dev:watch

# Start database (Supabase local stack)
pnpm dev:db

# Start Prisma Studio
pnpm dev:prisma
```

**Option 4: Manual Rebuild**

```bash
# When you make changes to packages, rebuild them
pnpm build --filter=@groupi/hooks
pnpm build --filter=@groupi/schema
# etc.
```

### Package Development

When working on packages:

1. **Make changes** to source files in `packages/*/src/`
2. **Watch mode** automatically rebuilds on file changes
3. **Next.js** picks up the changes and hot reloads
4. **TypeScript** provides full type safety across packages

### Available Scripts

```bash
# Development
pnpm dev              # Start web app with all services
pnpm dev:watch        # Watch all packages for changes
pnpm dev:prisma       # Start Prisma Studio
pnpm dev:db           # Start database

# Building
pnpm build            # Build all packages
pnpm build --filter=@groupi/hooks  # Build specific package

# Code Quality
pnpm lint             # Lint all packages
pnpm lint:fix         # Fix linting issues
pnpm format           # Format code
pnpm type-check       # Type check all packages

# Database
pnpm migrate          # Run database migrations
pnpm generate         # Generate Prisma client
pnpm seed-users       # Seed test users
```

## Architecture

### Package Structure

```
packages/
├── hooks/          # React hooks for data fetching
├── schema/         # TypeScript types and DTOs
├── services/       # Server-side business logic
└── ui/            # Shared UI components

apps/
└── web/           # Next.js web application
```

### Data Flow

1. **Schema** defines types and DTOs
2. **Services** implement business logic using schema types
3. **Hooks** provide React-friendly data fetching using services
4. **UI** components use hooks for data and schema for types
5. **Web app** orchestrates everything together

### Type Safety

All packages use proper TypeScript DTOs instead of `any`:

- `PostPageDTO` - For post page display
- `PostReplyFeedDTO` - For reply feed functionality
- `PostCardDTO` - For post cards and feeds

## Getting Started

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Set up environment variables (see `.env.example`)
4. Start development: `pnpm dev`

This will automatically:

- Start the web app
- Start Prisma Studio
- Watch all packages for changes

For full development environment (including database and ngrok):

```bash
pnpm dev:full
```

**Note**: The full development mode requires:

- Supabase CLI installed (for local Postgres stack)
- Ngrok authtoken configured for webhooks

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query
- **Monorepo**: Turborepo with pnpm workspaces
- **Real-time**: Pusher
- **Testing**: Cypress for E2E
