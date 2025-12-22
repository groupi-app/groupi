# Groupi

A modern event planning and group coordination platform built with Next.js, TypeScript, and a monorepo architecture.

## Overview

Groupi is a full-stack application for organizing events, managing group memberships, and facilitating real-time communication. The platform enables users to create events, invite members, coordinate availability, and engage in discussions through posts and replies.

### Key Features

- **Event Management**: Create and manage events with date/time coordination
- **Group Coordination**: Manage memberships, roles, and permissions
- **Real-time Communication**: Posts, replies, and notifications with real-time updates
- **Availability Tracking**: Coordinate member availability for events
- **Cross-platform Ready**: Architecture designed for web and mobile (React Native)

## Architecture

The project follows a monorepo structure with clear separation of concerns:

```
groupi/
├── apps/
│   └── web/              # Next.js web application
├── packages/
│   ├── schema/           # TypeScript types, DTOs, and validation schemas
│   ├── services/         # Server-side business logic (Effect-based)
│   └── ui/               # Shared UI components and utilities
└── prisma/               # Database schema and migrations
```

### Data Flow

1. **Schema** (`@groupi/schema`) - Defines types, DTOs, and validation schemas
2. **Services** (`@groupi/services`) - Implements business logic using Effect for error handling
3. **Web App** (`@groupi/web`) - Next.js application that orchestrates everything
4. **UI** (`@groupi/ui`) - Shared components and utilities

## Development

### Prerequisites

- Node.js 18+
- pnpm 10.12.1+
- PostgreSQL (via Supabase CLI for local development)
- Environment variables configured (see `.env.example`)

### Quick Start

```bash
# Install dependencies
pnpm install

# Start development environment
pnpm dev
```

This starts:

- Next.js web app (http://localhost:3000)
- Prisma Studio (http://localhost:5555)
- Database (Supabase local stack)
- Package watch mode for hot reloading

### Development Scripts

```bash
# Development
pnpm dev              # Start web app with all services
pnpm dev:prisma       # Start Prisma Studio
pnpm dev:db           # Start local database (Supabase)

# Building
pnpm build            # Build all packages and apps
pnpm build --filter=@groupi/web  # Build specific package/app

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

### Package Development

When working on packages:

1. Make changes to source files in `packages/*/src/`
2. Watch mode automatically rebuilds on file changes
3. Next.js picks up changes and hot reloads
4. TypeScript provides full type safety across packages

## Production

### Building

```bash
# Build all packages and apps
pnpm build

# Start production server
pnpm start
```

### Environment Variables

Ensure all required environment variables are set for production. See `.env.example` for reference.

### Database Migrations

```bash
# Deploy migrations to production
pnpm prisma:migrate-deploy
```

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Better Auth
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query
- **Real-time**: Pusher
- **Error Handling**: Effect.ts
- **Monorepo**: Turborepo with pnpm workspaces
- **Testing**: Cypress for E2E

## Project Structure

- [`apps/web`](./apps/web/README.md) - Next.js web application
- [`packages/schema`](./packages/schema/README.md) - Types and validation schemas
- [`packages/services`](./packages/services/README.md) - Business logic layer
- [`packages/ui`](./packages/ui/README.md) - Shared UI components

## Getting Help

For detailed information about each package or app, see their respective README files in the directories above.
