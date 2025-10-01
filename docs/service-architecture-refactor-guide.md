# Service Architecture Refactor Guide

This document outlines the standardized service architecture pattern we've established and provides a step-by-step plan for refactoring existing services to follow this structure.

## 🎯 **Overview**

We've moved from a mixed approach (try/catch, manual reporting, `tryPromise`) to a consistent, functional architecture using Effect with integrated logging and error handling.

## 📋 **Reference Implementation**

Our two reference functions demonstrate the complete pattern:

- `fetchPostDetailPageData` - Complex multi-step operation with validation
- `createPost` - Simple operation with membership check and side effects

## 🏗️ **Architecture Pattern**

### **1. Function Signature Structure**

```typescript
export const functionName = async (
  inputData: InputType,
  userId: string
): Promise<
  ResultTuple<
    SpecificError1 | SpecificError2 | DatabaseError | UnauthorizedError,
    SuccessDataType
  >
> => {
```

**Why this pattern:**

- ✅ **Immediate visibility** - All possible errors and success types are clear
- ✅ **Type safety** - Compiler ensures all error cases are handled
- ✅ **Self-documenting** - No need to look up type definitions
- ✅ **Consistency** - Same pattern across all services

### **2. Effect Structure**

```typescript
const effect = Effect.gen(function* () {
  // 1. Initial debug logging
  yield* Effect.logDebug('Operation description', {
    key1: value1,
    key2: value2,
  });

  // 2. Database operations with pipe-based error handling
  const data = yield* Effect.promise(() => db.operation(...))
    .pipe(
      // Map error to DatabaseError
      Effect.mapError(
        cause => new DatabaseError('Operation description', cause)
      ),
      // Log error if database operation encounters error
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'functionName.stepName',
          key1: value1,
          error: error.message,
          errorType: error.constructor.name,
          willRetry: error instanceof DatabaseError,
        })
      ),
      // Retry on DatabaseError with exponential backoff
      Effect.retry({
        schedule: Schedule.exponential(1000).pipe(
          Schedule.intersect(Schedule.recurs(3))
        ),
        while: error => error instanceof DatabaseError,
      })
    );

  // 3. Validation with clean error handling
  if (!data) {
    yield* Effect.fail(new SpecificError('reason'));
    return;
  }

  // 4. Business logic and result construction
  const result: ResultType = {
    // ... construct result
  };

  // 5. Success logging (level depends on operation type)
  // For mutations (create/update/delete) - use info level
  yield* Effect.logInfo('Entity created successfully', {
    key1: value1,
    entityId: result.id,
    operation: 'create',
  });

  // For reads/queries - use debug level
  yield* Effect.logDebug('Data fetched successfully', {
    key1: value1,
    recordCount: result.length,
  });

  return result;
});
```

### **3. Error Handling Pipeline**

```typescript
}).pipe(
  Effect.catchAll(err => {
    return Effect.gen(function* () {
      // Log expected errors at info level
      if (err instanceof ExpectedError1) {
        yield* Effect.logInfo('Expected error description', {
          key1: value1,
          reason: 'specific_reason',
          operation: 'functionName',
        });
        return [err, undefined] as const;
      }

      if (err instanceof ExpectedError2) {
        yield* Effect.logInfo('Another expected error description', {
          key1: value1,
          reason: 'another_reason',
          operation: 'functionName',
        });
        return [err, undefined] as const;
      }

      // For unexpected errors, return appropriate error type
      return [
        new UnexpectedErrorType('Failed to complete operation'),
        undefined,
      ] as const;
    });
  }),
  // Map result to tuple
  Effect.map(result => [null, result] as [null, SuccessDataType])
);
```

### **4. Effect Execution**

```typescript
return Effect.runPromise(
  Effect.provide(effect, createEffectLoggerLayer('domain'))
);
```

## 🔄 **Refactoring Plan**

Follow this step-by-step process to refactor any existing service function:

### **Step 1: Update Function Signature**

**Before:**

```typescript
export const oldFunction = async (
  data: InputType,
  userId: string
): Promise<OldResultType> => {
```

**After:**

```typescript
export const oldFunction = async (
  data: InputType,
  userId: string
): Promise<
  ResultTuple<
    Error1 | Error2 | DatabaseError | UnauthorizedError,
    SuccessType
  >
> => {
```

### **Step 2: Replace try/catch with Effect.gen**

**Before:**

```typescript
try {
  const data = await db.operation();
  // ... logic
  return [null, result];
} catch (err) {
  return [new ErrorType(err), undefined];
}
```

**After:**

```typescript
const effect = Effect.gen(function* () {
  yield* Effect.logDebug('Starting operation', { userId, inputData });

  const data = yield* Effect.promise(() => db.operation())
    .pipe(
      Effect.mapError(cause => new DatabaseError('Description', cause)),
      Effect.tapError(error => Effect.logError('DB error', { ... })),
      Effect.retry({ while: error => error instanceof DatabaseError })
    );

  // ... rest of logic
  return result;
});
```

### **Step 3: Convert Database Operations**

**Replace:**

- `await db.operation()` → `yield* Effect.promise(() => db.operation())`
- Add `.pipe()` with error handling, logging, and retry logic
- Use specific operation names in logging: `'functionName.stepName'`

### **Step 4: Convert Validation Logic**

**Before:**

```typescript
if (!data) {
  return [new ErrorType('message'), undefined];
}
```

**After:**

```typescript
if (!data) {
  yield * Effect.fail(new ErrorType('message'));
  return;
}
```

### **Step 5: Add Comprehensive Logging**

- **Start:** `Effect.logDebug('Operation description', { context })`
- **Database errors:** `Effect.logError('Database operation encountered error', { detailed context })`
- **Success (Mutations):** `Effect.logInfo('Entity created/updated/deleted', { entityId, operation })`
- **Success (Reads):** `Effect.logDebug('Data fetched successfully', { recordCount })`
- **Expected errors:** `Effect.logInfo('Expected error description', { userId, context })` in catchAll

### **Step 6: Implement Error Pipeline**

```typescript
}).pipe(
  Effect.catchAll(err => {
    return Effect.gen(function* () {
      // Handle each expected error type with info logging
      if (err instanceof ExpectedError) {
        yield* Effect.logInfo('Description', { context });
        return [err, undefined] as const;
      }
      // Default case for unexpected errors
      return [new DefaultError('message'), undefined] as const;
    });
  }),
  Effect.map(result => [null, result] as [null, SuccessType])
);
```

### **Step 7: Add Effect Provider**

```typescript
return Effect.runPromise(
  Effect.provide(effect, createEffectLoggerLayer('domain'))
);
```

## 📝 **Checklist for Each Function**

- [ ] Function signature uses inline `ResultTuple<Errors, Success>`
- [ ] Uses `Effect.gen(function* () { ... })`
- [ ] Initial debug logging with context
- [ ] Database operations use `Effect.promise()` with pipe
- [ ] Error handling: `mapError` → `tapError` → `retry`
- [ ] Validation uses `Effect.fail()` with early return
- [ ] Success logging: **Info level for mutations**, debug level for reads
- [ ] Mutation logs include explicit `userId`, `entityId`, and `operation` field
- [ ] `catchAll` with `Effect.gen` for error handling
- [ ] Expected errors logged at info level
- [ ] Final `Effect.map` to tuple format
- [ ] `Effect.provide` with appropriate logger layer

## 🎯 **Key Benefits**

### **Consistency**

- Same structure across all services
- Predictable error handling patterns
- Uniform logging approach

### **Observability**

- Automatic Sentry integration based on log levels
- Comprehensive error context
- Clear operation tracking

### **Reliability**

- Type-safe error handling
- Automatic retries for transient failures
- No silent failures

### **Maintainability**

- Self-documenting function signatures
- Clear separation of concerns
- Easy to add new operations

## 🚀 **Implementation Strategy**

1. **Start with simple functions** - Single database operation functions first
2. **Move to complex functions** - Multi-step operations with validation
3. **Test thoroughly** - Ensure all error paths are covered
4. **Update incrementally** - One service file at a time
5. **Maintain consistency** - Use this guide as the single source of truth

## 📚 **Domain-Specific Logger Layers**

Use appropriate logger layers for automatic categorization:

- `createEffectLoggerLayer('posts')` - Post operations
- `createEffectLoggerLayer('events')` - Event operations
- `createEffectLoggerLayer('auth')` - Authentication operations
- `createEffectLoggerLayer('notifications')` - Notification operations
- `createEffectLoggerLayer('memberships')` - Membership operations

## 📊 **Logging Level Guidelines**

### **Info Level - Significant Actions**

Use `Effect.logInfo` for:

- **Database mutations:** Create, update, delete operations
- **Authentication events:** Login, logout, permission changes
- **Business events:** Order placed, payment processed, user registered
- **State changes:** Status updates, workflow transitions

**Always include:**

- `userId` - Who performed the action (explicit field for audit trail)
- `operation: 'create' | 'update' | 'delete'` for mutations
- Primary entity ID (e.g., `postId`, `eventId`, `membershipId`)
- Key business context fields:
  - `authorId` - Who owns/created the entity (may differ from userId for updates/deletes)
  - `targetUserId` - Who is being affected (for role changes, invites, etc.)
  - `eventId` - Related event context
  - Other relevant entity relationships

```typescript
// Examples
yield *
  Effect.logInfo('Post created successfully', {
    userId, // Who performed the action
    authorId: userId, // Who authored the post (same as userId for create)
    postId: result.id,
    eventId: postData.eventId,
    operation: 'create',
  });

yield *
  Effect.logInfo('Post deleted by moderator', {
    userId, // Who performed the action (moderator)
    authorId: post.authorId, // Who originally authored the post
    postId,
    eventId: post.eventId,
    operation: 'delete',
  });

yield *
  Effect.logInfo('User role updated', {
    userId, // Who performed the action
    targetUserId: membershipUserId, // Who is being affected
    membershipId,
    eventId,
    oldRole: 'ATTENDEE',
    newRole: 'MODERATOR',
    operation: 'update',
  });
```

### **Debug Level - Operational Details**

Use `Effect.logDebug` for:

- **Database reads:** Fetch, query, search operations
- **Operation start/end:** Function entry and completion
- **Validation steps:** Data validation, business rule checks
- **Processing details:** Calculations, transformations

```typescript
// Examples
yield *
  Effect.logDebug('Fetching post detail data', {
    postId,
    userId,
  });

yield *
  Effect.logDebug('Post detail data fetched successfully', {
    postId,
    userId,
    repliesCount: result.replies.length,
  });
```

### **Error Level - Problems**

Use `Effect.logError` for:

- **Database errors:** Connection failures, query errors
- **External service failures:** API calls, third-party integrations
- **Unexpected exceptions:** System errors, infrastructure issues

### **Warning Level - Potential Issues**

Use `Effect.logWarning` for:

- **Retry attempts:** Database retries, failed requests
- **Performance issues:** Slow queries, timeouts
- **Deprecated usage:** Old API versions, legacy features

## 🔒 **Audit Trail Requirements**

**All info-level logs MUST include `userId`:**

- For successful actions: Who performed the action
- For failed attempts: Who attempted the action
- For unauthorized access: Who was denied access

This ensures complete audit trails for:

- **Security monitoring** - Track who accessed what
- **Compliance** - Meet audit requirements
- **Debugging** - Understand user context for issues
- **Analytics** - User behavior patterns

```typescript
// ✅ Correct - Include both userId and authorId for complete context
yield *
  Effect.logInfo('Post deleted successfully', {
    userId, // Who performed the deletion (could be moderator)
    authorId: post.authorId, // Who originally created the post
    postId,
    eventId,
    operation: 'delete',
  });

// ❌ Incorrect - Missing userId
yield *
  Effect.logInfo('Post deleted successfully', {
    postId,
    eventId,
    operation: 'delete',
  });
```

### **🔍 Key Field Distinctions:**

**`userId`** - Always the person performing the current action

- Create: The creator
- Update: The person making changes (could be author or moderator)
- Delete: The person deleting (could be author or moderator)

**`authorId`** - The original creator/owner of the entity

- Useful for understanding ownership vs. action performer
- Critical for moderation scenarios (who deleted whose content)

**`targetUserId`** - The person being affected by the action

- Role changes: The person whose role is changing
- Invitations: The person being invited
- Bans/suspensions: The person being acted upon

This architecture provides a robust, observable, and maintainable foundation for all service operations.
