# @groupi/schema

TypeScript types, DTOs (Data Transfer Objects), and validation schemas for the Groupi application.

## Overview

This package serves as the single source of truth for all data structures and validation rules across the application. It provides type-safe schemas using Zod and exports Prisma-generated types.

## Architecture

### Package Structure

```
packages/schema/src/
├── generated/          # Prisma-generated Zod schemas
├── data/               # DTO schemas for API responses
├── params/             # Input parameter schemas
├── errors/             # Error type definitions
├── result-tuple.ts     # Result tuple utilities
└── index.ts            # Main exports
```

### Key Responsibilities

1. **Type Definitions**: Centralized TypeScript types for all data structures
2. **Validation**: Zod schemas for runtime validation
3. **DTOs**: Data Transfer Objects for API boundaries
4. **Error Types**: Discriminated union types for error handling
5. **Prisma Integration**: Exports Prisma-generated types and schemas

### Data Flow

```
Database (Prisma)
    ↓
Prisma Types (generated)
    ↓
@groupi/schema (exports types + Zod schemas)
    ↓
@groupi/services (uses types for business logic)
    ↓
@groupi/web (uses types in components)
```

### Integration Points

- **Prisma**: Generates base types from database schema
- **@groupi/services**: Imports types and schemas for validation
- **@groupi/web**: Imports types for component props and state

## Usage

### Importing Types

```typescript
import type { Event, Post, Membership } from '@groupi/schema';
```

### Importing Schemas

```typescript
import { EventSchema, PostSchema } from '@groupi/schema';
```

### Importing DTOs

```typescript
import type { EventPageDTO, PostCardDTO } from '@groupi/schema/data';
```

### Importing Error Types

```typescript
import type { EventNotFoundError, PostNotFoundError } from '@groupi/schema/errors';
```

### Validation

```typescript
import { EventSchema } from '@groupi/schema';

const result = EventSchema.safeParse(data);
if (result.success) {
  // result.data is typed as Event
}
```

## Development

### Type Checking

```bash
pnpm type-check --filter=@groupi/schema
```

### Linting

```bash
pnpm lint --filter=@groupi/schema
```

### Regenerating Prisma Types

When the Prisma schema changes:

```bash
# From root directory
pnpm generate
```

This regenerates Prisma client and Zod schemas.

## Schema Patterns

### DTO Pattern

DTOs (Data Transfer Objects) define the shape of data at API boundaries:

```typescript
// Example: EventPageDTO
export const EventPageDataSchema = z.object({
  event: EventSchema.pick({ id: true, title: true, ... }),
  userMembership: MembershipSchema.pick({ id: true, role: true, ... }),
});
```

### Error Pattern

Errors use discriminated unions for type-safe error handling:

```typescript
export const EventErrorSchema = z.discriminatedUnion('_tag', [
  z.object({ _tag: z.literal('EventNotFoundError'), message: z.string() }),
  z.object({ _tag: z.literal('EventUserNotMemberError'), message: z.string() }),
]);
```

### Result Tuple Pattern

Consistent pattern for returning `[error, data]` tuples:

```typescript
import type { ResultTuple } from '@groupi/schema';

type EventResult = ResultTuple<EventError, EventData>;
```

## Best Practices

1. **Always validate**: Use Zod schemas for runtime validation
2. **Use DTOs**: Define DTOs for API boundaries, not raw Prisma types
3. **Type safety**: Prefer discriminated unions for errors
4. **Single source**: All types should be defined here, not duplicated
5. **Documentation**: Add JSDoc comments for complex types

