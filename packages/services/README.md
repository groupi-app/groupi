# @groupi/services

A modern service layer built with Effect.ts, providing robust error handling, logging, and observability for the Groupi application.

## Features

- **Effect.ts Integration**: Type-safe error handling and composability
- **Pino Logging**: Structured logging with multiple layers
- **Sentry Monitoring**: Error tracking and performance monitoring
- **Backward Compatibility**: Legacy wrapper functions for gradual migration

## Sentry Integration

### Setup

1. Install Sentry:

```bash
pnpm add @sentry/node
```

2. Uncomment the Sentry import in `sentry.ts`:

```ts
import * as Sentry from '@sentry/node';
```

3. Replace `MockSentry` with `Sentry` in the `SentryClient` assignment.

### Usage

#### Basic Sentry Wrapper

```ts
import { withSentry } from '@groupi/services';

const myEffect = Effect.gen(function* (_) {
  // Your Effect logic here
  return yield* _(someOperation());
});

const wrappedEffect = withSentry(myEffect, {
  name: 'fetchUserData',
  op: 'service.fetch',
  tags: { userId: '123' },
  data: { context: 'user-profile' },
});
```

#### Service Helper Functions

```ts
import { SentryHelpers } from '@groupi/services';

// Database operations
const dbEffect = SentryHelpers.withDbOperation(
  prismaQuery,
  'findMany',
  'users'
);

// API operations
const apiEffect = SentryHelpers.withApiOperation(
  handleRequest,
  'POST',
  '/api/events'
);

// Service operations
const serviceEffect = SentryHelpers.withServiceOperation(
  businessLogic,
  'event',
  'create',
  'event-123'
);

// Authentication operations
const authEffect = SentryHelpers.withAuthOperation(
  verifyToken,
  'verify',
  'user-456'
);
```

#### Adding Context and Breadcrumbs

```ts
import {
  addSentryContext,
  addSentryBreadcrumb,
  setSentryTags,
} from '@groupi/services';

const complexOperation = Effect.gen(function* (_) {
  // Set global context
  yield* _(
    addSentryContext({
      user: { id: '123', role: 'admin' },
      event: { id: 'event-456', title: 'Team Meeting' },
    })
  );

  // Add breadcrumb
  yield* _(
    addSentryBreadcrumb({
      message: 'Starting data validation',
      category: 'validation',
      level: 'info',
    })
  );

  // Set tags
  yield* _(
    setSentryTags({
      feature: 'event-creation',
      version: '1.0.0',
    })
  );

  // Your business logic
  return yield* _(performOperation());
});
```

#### In API Routes

```ts
// app/api/events/[id]/route.ts
import { SentryHelpers } from '@groupi/services';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const result = await Effect.runPromise(
    SentryHelpers.withApiOperation(
      fetchEventDataEffect(params.id),
      'GET',
      '/api/events/[id]'
    )
  );

  return Response.json(result);
}
```

#### In Server Actions

```ts
// app/actions/events.ts
import { SentryHelpers } from '@groupi/services';

export async function createEventAction(formData: FormData) {
  const result = await Effect.runPromise(
    SentryHelpers.withServiceOperation(
      createEventEffect({
        title: formData.get('title') as string,
        description: formData.get('description') as string,
      }),
      'event',
      'create'
    )
  );

  return result;
}
```

### Advanced Usage

#### Custom Spans

```ts
import { withSentrySpan } from '@groupi/services';

const complexOperation = Effect.gen(function* (_) {
  // Main operation
  const data = yield* _(fetchData());

  // Separate span for processing
  const processedData = yield* _(
    withSentrySpan(processData(data), {
      name: 'process-data',
      op: 'data.transform',
      tags: { recordCount: data.length },
    })
  );

  return processedData;
});
```

#### Error Handling with Sentry

```ts
const robustOperation = Effect.gen(function* (_) {
  return yield* _(dangerousOperation());
}).pipe(
  withSentry(_, {
    name: 'robust-operation',
    op: 'business.logic',
    tags: { critical: true },
  }),
  Effect.catchAll(error => {
    // Error is automatically captured by Sentry
    // Handle specific error types
    if (error instanceof ValidationError) {
      return Effect.succeed({ error: 'Invalid input' });
    }
    return Effect.succeed({ error: 'Operation failed' });
  })
);
```

## Current Integration

The following services are already integrated with Sentry:

- **Event Service**: `fetchEventData`, `createEvent`
- **Post Service**: `fetchPostPageData`, `createPost`

Example from the codebase:

```ts
// From event.ts
export const fetchEventData = cache(
  async (eventId: string): Promise<ActionResponse<EventData>> => {
    const result = await Effect.runPromise(
      SentryHelpers.withServiceOperation(
        Effect.gen(function* (_) {
          const data = yield* _(fetchEventDataEffect(eventId));
          return { success: data };
        }).pipe(
          Effect.catchAll(error => {
            // Error handling...
          }),
          Effect.provide(EventLoggerLayer)
        ),
        'event',
        'fetchData',
        eventId
      )
    );

    return result;
  }
);
```

## Benefits

1. **Error Tracking**: All errors are automatically captured with full context
2. **Performance Monitoring**: Track operation duration and identify bottlenecks
3. **Breadcrumb Trails**: Understand the sequence of operations leading to issues
4. **Contextual Metadata**: Rich tagging and data for debugging
5. **Integration with Effect**: Seamless integration with Effect's error handling

## Best Practices

1. **Use Descriptive Names**: Make operation names clear and searchable
2. **Include Relevant Tags**: Add context like user ID, event ID, etc.
3. **Avoid Sensitive Data**: Don't include passwords or tokens in tags/data
4. **Use Appropriate Levels**: Set correct severity levels for different operations
5. **Group Related Operations**: Use consistent naming conventions for related operations

## Migration Guide

To migrate existing services to use Sentry:

1. Import the Sentry helpers
2. Wrap your Effect operations with appropriate helpers
3. Add relevant tags and context
4. Test error scenarios to ensure proper capture
5. Monitor Sentry dashboard for insights

The integration maintains backward compatibility, so existing code will continue to work while gaining Sentry benefits.
