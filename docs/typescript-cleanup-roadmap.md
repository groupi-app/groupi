# 🗺️ TypeScript Cleanup Roadmap

**Project**: Groupi  
**Date Created**: January 2025  
**Status**: Post-tRPC Migration Cleanup  
**Total Issues**: 326 TypeScript errors + 70 ESLint warnings

## 📊 Executive Summary

- **Total Issues**: 326 TypeScript errors + 70 ESLint warnings
- **Estimated Total Effort**: 12-16 hours
- **Priority**: Non-blocking (app builds and functions correctly)
- **Impact**: Developer experience, type safety, maintainability
- **Current State**: ✅ Application builds successfully and is fully functional

## 🎯 Phase 1: Critical Foundation Issues

**Priority**: 🔴 HIGH | **Effort**: 4-6 hours

### 1.1 Services Package Type Safety

**Files**: `packages/services/src/*.ts` (8 files, ~170 errors)  
**Root Cause**: `safe()` wrapper expects `(...args: unknown[]) => unknown` but receives strongly typed functions

**Issues**:

```typescript
// Current problem:
export const fetchEventData = safe(async (eventId: string, userId: string) => ...)
//                                  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Error: Type '(eventId: string, userId: string) => Promise<...>' is not assignable to parameter of type '(...args: unknown[]) => unknown'
```

**Solution Approaches**:

- **Option A**: Update `safe()` wrapper to accept typed functions
- **Option B**: Type assertion/casting for service exports
- **Option C**: Create typed service wrappers

**Files to Fix**:

- `event.ts` (35 errors) - Event operations
- `notification.ts` (26 errors) - Notification operations
- `invite.ts` (23 errors) - Invite operations
- `post.ts` (18 errors) - Post operations
- `reply.ts` (13 errors) - Reply operations
- `member.ts` (13 errors) - Member operations
- `settings.ts` (5 errors) - Settings operations
- `person.ts` (1 error) - Person operations

### 1.2 Sentry Integration Issues

**Files**: Multiple service files (~15 errors)  
**Root Cause**: Missing `operation: string` parameter in Sentry calls

**Pattern**:

```typescript
// Current issue:
SentryHelpers.withServiceOperation(/* operation missing */)

// Should be:
SentryHelpers.withServiceOperation('operation-name', ...)
```

**Quick Fix**: Add operation string to all Sentry calls

## 🎯 Phase 2: Component Data Access Issues

**Priority**: 🟡 MEDIUM | **Effort**: 2-3 hours

### 2.1 Server Component Data Pattern

**Files**: Various page components (~8 files, ~15 errors)  
**Root Cause**: Changed from `data.success.property` to tuple pattern `[error, data]`

**Pattern**:

```typescript
// Before:
const data = await fetchEventData(eventId);
if (data.success) {
  return <div>{data.success.event.title}</div>;
}

// After:
const [error, data] = await fetchEventData(eventId, userId);
if (!error && data) {
  return <div>{(data as any).event.title}</div>;
}
```

**Files Affected**:

- Event pages (5 files)
- Post pages (2 files)
- Settings pages (1 file)

### 2.2 Hook Data Access Issues

**Files**: Component files using hooks (~20 files, ~35 errors)  
**Root Cause**: Hook return types don't match expected data structures

**Common Issues**:

- `useEventMembers` returning different structure than expected
- Missing properties on hook return types
- Type mismatches in real-time sync

## 🎯 Phase 3: Hook Infrastructure

**Priority**: 🟠 MEDIUM-HIGH | **Effort**: 3-4 hours

### 3.1 Missing Hook Implementations

**Files**: `packages/hooks/src/*.ts` (~15 files, ~40 errors)

**Issues**:

- Missing or incomplete hook exports
- WebSocket provider type conflicts
- Real-time sync integration issues

**Example Issues**:

```typescript
// Missing hook exports
export { useEventPageData as useEventMembers } from './trpc-event-hooks-v2';
export { useEventPageData as useEventPosts } from './trpc-event-hooks-v2';

// Hook parameter type conflicts
export function usePersonMemberships(
  personId: string, // Type mismatch with API expectation
  wsProvider?: WebSocketProvider | null
);
```

### 3.2 WebSocket Provider Issues

**Files**: Provider implementations (~5 errors)  
**Root Cause**: Platform-specific WebSocket implementation conflicts

**Issues**:

- Missing pusher client imports
- React Native vs Web provider conflicts
- Type mismatches in provider interfaces

## 🎯 Phase 4: Module Dependencies

**Priority**: 🟠 MEDIUM | **Effort**: 1-2 hours

### 4.1 Missing Module Declarations

**Issues**:

```typescript
// Module not found errors:
import { NotificationEmailTemplate } from '@groupi/ui/email';
//                                         ~~~~~~~~~~~~~~~~~~
// Cannot find module '@groupi/ui/email' or its corresponding type declarations
```

**Files Affected**:

- `notification.ts` - Missing email template module
- Various components - Import path resolution issues

### 4.2 API Router Type Issues

**Files**: `packages/api/src/routers/*.ts` (~10 errors)

**Issues**:

- Input schema transformation conflicts
- Router endpoint type mismatches
- Parameter type incompatibilities

## 🎯 Phase 5: Code Quality Cleanup

**Priority**: 🟢 LOW | **Effort**: 1-2 hours

### 5.1 Unused Variables

**Count**: ~46 ESLint warnings

**Common Patterns**:

```typescript
// Unused function parameters
onSuccess: ([error, invite]: [any, any]) => {
  //                   ^^^^^^ unused
  if (error) {
    /* handle error */
  }
};

// Unused imports
import { MembershipWithAvailabilities } from '@/types';
//       ^^^^^^^^^^^^^^^^^^^^^^^^^^^ never used
```

**Action**: Prefix with `_` or remove unused code

### 5.2 Explicit Any Types

**Count**: ~24 ESLint warnings

**Pattern**:

```typescript
// Temporary any types from migration
const event = (data as any).event;
//                    ^^^ should be properly typed
```

**Action**: Replace with proper types or add suppression comments

## 📋 Detailed Issue Breakdown

| **Area**              | **Files** | **Errors** | **Effort** | **Priority**   |
| --------------------- | --------- | ---------- | ---------- | -------------- |
| Services Safe Wrapper | 8         | 170        | 4-5h       | 🔴 Critical    |
| Sentry Parameters     | 6         | 15         | 30m        | 🔴 Critical    |
| Component Data Access | 10        | 25         | 2h         | 🟡 Medium      |
| Hook Implementations  | 15        | 40         | 3h         | 🟠 Medium-High |
| WebSocket Providers   | 3         | 15         | 1h         | 🟠 Medium-High |
| Missing Modules       | 5         | 10         | 1h         | 🟠 Medium      |
| API Router Types      | 4         | 10         | 1h         | 🟡 Medium      |
| Unused Variables      | 25        | 46         | 1h         | 🟢 Low         |
| Any Types             | 15        | 24         | 30m        | 🟢 Low         |

## 🔧 Recommended Fix Order

### Session 1: Foundation (4-6 hours)

1. **Fix `safe()` wrapper type issues in services**
   - Update wrapper to accept typed functions OR
   - Add proper type assertions to service exports
2. **Add missing Sentry operation parameters**
   - Systematic pass through all `withServiceOperation` calls
3. **Test build to ensure no regressions**

### Session 2: Components (2-3 hours)

1. **Fix server component data access patterns**
   - Update all page components using service calls
   - Replace `data.success` pattern with tuple destructuring
2. **Update hook data access in client components**
   - Fix type mismatches in component usage
   - Update property access patterns
3. **Test key user flows**

### Session 3: Hooks & Infrastructure (3-4 hours)

1. **Complete hook implementations**
   - Add missing hook exports and aliases
   - Fix parameter type mismatches
   - Ensure all components have required hooks
2. **Fix WebSocket provider types**
   - Resolve import conflicts
   - Fix platform-specific provider issues
3. **Resolve missing module issues**
   - Add missing dependencies
   - Fix import path resolution

### Session 4: Polish (1-2 hours)

1. **Clean up unused variables**
   - Prefix unused parameters with `_`
   - Remove truly unused imports and variables
2. **Replace or suppress `any` types**
   - Add proper type definitions where possible
   - Add suppression comments for intentional any usage
3. **Final type check and build verification**

## 🎯 Success Metrics

- **TypeScript**: 0 errors (down from 326)
- **ESLint**: ≤10 warnings (down from 70)
- **Build**: Continues to work without type assertion hacks
- **Developer Experience**: Full IntelliSense and type safety

## 💡 Implementation Notes

### For Services Package (Phase 1)

The core issue is that the `safe()` wrapper needs to be updated to handle typed functions. Consider this approach:

```typescript
// Option 1: Generic safe wrapper
export function safe<TArgs extends any[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>
): (...args: TArgs) => Promise<[Error | null, TReturn | null]> {
  return async (...args: TArgs) => {
    try {
      const result = await fn(...args);
      return [null, result];
    } catch (error) {
      return [error as Error, null];
    }
  };
}

// Option 2: Type assertion approach
export const fetchEventData = safe(async (eventId: string, userId: string) => {
  // implementation
}) as (
  eventId: string,
  userId: string
) => Promise<[Error | null, EventData | null]>;
```

### For Component Data Access (Phase 2)

Create type-safe data access patterns:

```typescript
// Helper type for service results
type ServiceResult<T> = [Error | null, T | null];

// Type guard for successful results
function isSuccessResult<T>(result: ServiceResult<T>): result is [null, T] {
  return result[0] === null && result[1] !== null;
}

// Usage in components
const [error, data] = await fetchEventData(eventId, userId);
if (isSuccessResult([error, data])) {
  // data is now properly typed
  return <div>{data.event.title}</div>;
}
```

### Testing Strategy

1. **Unit Tests**: Ensure type fixes don't break functionality
2. **Integration Tests**: Test key user flows after each phase
3. **Build Verification**: Run `npx tsc --noEmit` after each session
4. **Runtime Testing**: Verify application behavior in development

## 📝 Session Tracking

### Completed Sessions

- [ ] Session 1: Foundation (4-6 hours)
- [ ] Session 2: Components (2-3 hours)
- [ ] Session 3: Hooks & Infrastructure (3-4 hours)
- [ ] Session 4: Polish (1-2 hours)

### Session Notes

_Add notes after each session about what was completed, any blockers encountered, and adjustments needed for subsequent sessions._

---

## 🚀 Current State Summary

**✅ What's Working:**

- Application builds successfully (`✓ Compiled successfully`)
- All core functionality operates correctly
- Modern tRPC architecture is fully implemented
- Real-time updates working via WebSockets
- Cross-platform hook patterns established

**🔧 What Needs Polish:**

- Type safety throughout the codebase
- Developer experience with IntelliSense
- Code maintainability and documentation
- Removal of temporary type assertions

This roadmap provides a clear path to achieve 100% type safety while maintaining the excellent functional foundation we've built! 🎯
