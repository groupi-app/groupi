# @groupi/services

Server-side business logic layer built with Effect.ts, providing robust error handling, logging, and observability.

## Overview

This package contains all server-side business logic for the Groupi application. It uses Effect.ts for functional error handling, composability, and provides integration with logging (Pino) and monitoring (Sentry).

## Architecture

### Package Structure

```
packages/services/src/
├── domains/            # Domain-specific business logic
│   ├── event.ts
│   ├── post.ts
│   ├── membership.ts
│   └── ...
├── cache/              # Cache layer for frequently accessed data
├── infrastructure/     # Infrastructure concerns (DB, email, logging)
├── shared/             # Shared utilities and patterns
└── index.ts            # Main exports
```

### Key Responsibilities

1. **Business Logic**: Implements core business rules and workflows
2. **Database Operations**: Wraps Prisma queries with error handling
3. **Error Handling**: Uses Effect for composable error handling
4. **Logging**: Structured logging with Pino
5. **Monitoring**: Sentry integration for error tracking
6. **Caching**: Cache layer for performance optimization

### Data Flow

```
@groupi/web (Server Actions / tRPC)
    ↓
@groupi/services (business logic)
    ↓
@groupi/schema (validation)
    ↓
Database (Prisma)
```

### Integration Points

- **@groupi/schema**: Imports types, DTOs, and validation schemas
- **@groupi/web**: Exported functions used by server actions and tRPC procedures
- **Prisma**: Database access via Prisma Client
- **Effect.ts**: Functional error handling and composition

## Usage

### Basic Service Function

```typescript
import { Effect } from 'effect';
import { dbOperation } from '@groupi/services/infrastructure';
import { EventSchema } from '@groupi/schema';

export const fetchEvent = (eventId: string) =>
  Effect.gen(function* (_) {
    const event = yield* _(
      dbOperation(
        () => prisma.event.findUnique({ where: { id: eventId } }),
        'event.findUnique'
      )
    );

    if (!event) {
      return yield* _(Effect.fail(new EventNotFoundError()));
    }

    return EventSchema.parse(event);
  });
```

### With Sentry Integration

```typescript
import { SentryHelpers } from '@groupi/services';

const result = await Effect.runPromise(
  SentryHelpers.withServiceOperation(
    fetchEvent(eventId),
    'event',
    'fetch',
    eventId
  )
);
```

### Error Handling Pattern

Services return Effect types that can be composed:

```typescript
const result =
  yield *
  _(
    fetchEvent(eventId).pipe(
      Effect.catchAll(error => {
        // Handle specific error types
        if (error instanceof EventNotFoundError) {
          return Effect.succeed(null);
        }
        return Effect.fail(error);
      })
    )
  );
```

## Domain Services

### Event Service (`domains/event.ts`)

- Event creation and management
- Event data fetching
- Member coordination

### Post Service (`domains/post.ts`)

- Post creation and management
- Reply handling
- Feed generation

### Membership Service (`domains/membership.ts`)

- Membership management
- Role and permission handling
- RSVP coordination

### Other Domains

- `account.ts` - Account management
- `availability.ts` - Availability tracking
- `invite.ts` - Invitation handling
- `notification.ts` - Notification logic
- `settings.ts` - User settings

## Infrastructure

### Database (`infrastructure/db.ts`)

- Prisma client wrapper
- Database operation helpers
- Retry logic

### Logging (`infrastructure/logger.ts`)

- Pino logger setup
- Structured logging
- Log levels and formatting

### Sentry (`infrastructure/sentry.ts`)

- Error tracking
- Performance monitoring
- Context and breadcrumbs

### Real-time (`infrastructure/pusher-server.ts`)

- Pusher server integration
- Channel management
- Event broadcasting

## Development

### Type Checking

```bash
pnpm type-check --filter=@groupi/services
```

### Building

```bash
pnpm build --filter=@groupi/services
```

### Testing Services

Services use Effect, making them easy to test:

```typescript
import { Effect } from 'effect';
import { fetchEvent } from './domains/event';

const result = await Effect.runPromise(
  fetchEvent('event-id').pipe(Effect.provide(TestDatabaseLayer))
);
```

## Best Practices

1. **Use Effect**: All service functions should return Effect types
2. **Validate Input**: Use schema validation before processing
3. **Handle Errors**: Use discriminated unions for error types
4. **Add Logging**: Use structured logging for important operations
5. **Monitor**: Wrap critical operations with Sentry helpers
6. **Cache**: Use cache layer for frequently accessed data
7. **Compose**: Build complex operations from simple Effects

## Migration Notes

The package is transitioning to:

- Effect-based error handling (complete)
- Safe-wrapper tuple pattern for API boundaries (in progress)
- Full Sentry integration (partial)
