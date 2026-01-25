# Groupi Architecture Rules

## Project Architecture

You are working on Groupi, a cross-platform event planning application with the following architecture:

- **Backend**: Convex real-time database with Better Auth Convex Component for authentication
- **Frontend**: Next.js 16 (web) and React Native + Expo (mobile) in `packages/`
- **Shared Logic**: Platform-agnostic business logic in `packages/shared`
- **Philosophy**: Client-only applications with real-time data synchronization

## Core Design Principles

### 1. Real-Time First Architecture

- ALL data operations use Convex subscriptions for real-time updates
- Use `useQuery` from Convex React, never `useState` + `useEffect` for data fetching
- Use `useMutation` from Convex React for all write operations
- Never manually manage cache or state - Convex handles real-time synchronization

### 2. Cross-Platform by Design

- 95% of business logic is shared between web and mobile platforms
- Use dependency injection pattern: `createDomainHooks(api: ConvexApi)`
- Platform differences are abstracted through adapter interfaces
- Shared package must NEVER import platform-specific modules

### 3. Client-Only Applications

- No server-side rendering, API routes, or server actions in Next.js
- No middleware or server-side data fetching
- Pure client applications that consume Convex backend functions

### 4. TypeScript & Convex Best Practices

- **CRITICAL**: When TypeScript can't infer types, fix the source function, don't add manual interfaces or `any` types
- **Work Top-Down**: Let TypeScript infer types naturally from properly typed Convex functions, never work bottom-up with manual types
- If a hook/component has type errors, the issue is likely in the underlying Convex function naming or structure
- Never create manual interfaces when Convex auto-generates the correct types
- **NEVER use**: `FunctionReturnType<typeof api.domain.queries.functionName>` or manual type aliases - let inference work
- **Debugging Pattern**: Hook calling wrong function name → Fix function reference → Types auto-infer correctly
- **Example Success**: `useEventMembers` calling `getEventAttendeesData` → Fix to `getEventAttendeesPageData` → All types work
- **Anti-Pattern**: Adding `type AvailabilityData = FunctionReturnType<...>` or manual parameter types in callbacks

## Package Responsibilities

### `/convex/` - Backend Functions

- Define database schema in `convex/schema.ts`
- Organize functions by domain: `convex/users/`, `convex/events/`, `convex/posts/`, etc.
- Always validate inputs using `convex/values`
- Require authentication with `await getCurrentPerson(ctx)` from `../auth`
- Use `authComponent.getAnyUserById()` to look up Better Auth user data
- Use `console.log` for logging (Convex's official logging method)

### `/packages/shared/` - Cross-Platform Business Logic

**CRITICAL RULES:**

- NEVER import from: `react-native`, `next/*`, `expo-*`, or any platform-specific modules
- ALL hooks must use factory pattern for dependency injection
- ALL business logic must be platform-agnostic
- Platform interactions go through abstraction layer in `platform/` directory

**File Organization:**

- `hooks/use{Domain}Data.ts` - Data fetching with useQuery
- `hooks/use{Domain}Actions.ts` - Mutations with error handling and user feedback
- `platform/*.ts` - Platform abstraction interfaces
- `utils/*.ts` - Cross-platform utility functions
- `types/index.ts` - Shared type definitions

### `/packages/web/` - Next.js Web Application

- Use shared hooks via factory pattern: `const { useEventData } = createEventHooks(api)`
- Implement platform adapters in `lib/platform.ts`
- Use App Router with client components in `app/` directory
- Style with Tailwind CSS and shadcn/ui components
- NO server components, API routes, or server actions

### `/packages/mobile/` - React Native Mobile Application

- Use identical shared hooks as web: `const { useEventData } = createEventHooks(api)`
- Implement platform adapters in `lib/platform-setup.ts`
- Use React Native components with StyleSheet
- Access Expo APIs only through platform adapters
- Configure with Expo for build and deployment

## Feature Development Pattern

When adding any new feature, follow this exact order:

### Step 1: Backend (Convex)

1. Define schema in `convex/schema.ts`
2. Create queries in `convex/{domain}/queries.ts`
3. Create mutations in `convex/{domain}/mutations.ts`
4. Add proper validation and authentication

### Step 2: Shared Business Logic

1. Create data hooks in `packages/shared/src/hooks/use{Domain}Data.ts`
2. Create action hooks in `packages/shared/src/hooks/use{Domain}Actions.ts`
3. Export from `packages/shared/src/hooks/index.ts`
4. Add error handling with platform toast abstraction

### Step 3: Platform UI Implementation

1. Implement web components using shared hooks
2. Implement mobile components using same shared hooks
3. Ensure consistent UX across platforms
4. Handle loading and error states appropriately

## Code Patterns & Standards

### Shared Hook Factory Pattern

```typescript
export function createEventHooks(api: ConvexApi) {
  function useEventData(eventId: string) {
    return useQuery(api.events.queries.getEvent, { eventId });
  }

  function useCreateEvent() {
    const mutation = useMutation(api.events.mutations.createEvent);

    return async (data: CreateEventInput) => {
      try {
        const result = await mutation(data);
        toast.success('Event created successfully!');
        navigation.push(`/event/${result}`);
        return { success: true, data: result };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown error';
        toast.error(`Failed to create event: ${message}`);
        return { success: false, error: message };
      }
    };
  }

  return { useEventData, useCreateEvent };
}
```

### Platform Abstraction Pattern

```typescript
// Platform adapter interface
export interface NavigationAdapter {
  push(path: string): void;
  replace(path: string): void;
  back(): void;
  canGoBack(): boolean;
}

// Usage in shared code
import { navigation } from '@groupi/shared/platform';
navigation.push('/events/new'); // Works on both platforms
```

### Error Handling Pattern

```typescript
function useCreateComment() {
  const mutation = useMutation(api.comments.mutations.createComment);

  return async (data: CreateCommentInput) => {
    try {
      const result = await mutation(data);
      toast.success('Comment posted successfully!');
      return { success: true, data: result };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to post comment';
      toast.error(message);
      return { success: false, error: message };
    }
  };
}
```

## Import Patterns

### Correct Shared Package Imports

```typescript
import { createEventHooks, createAuthHooks } from '@groupi/shared/hooks';
import { navigation, storage, toast } from '@groupi/shared/platform';
import { formatDate, validateEmail } from '@groupi/shared';
```

### Correct Web App Imports

```typescript
import { api } from '@/lib/convex';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
```

### Correct Mobile App Imports

```typescript
import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
```

### Forbidden Patterns

```typescript
// ❌ NEVER in packages/shared/
import { useRouter } from 'next/navigation';
import { NavigationContainer } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';

// ❌ NEVER manual state management for data
const [events, setEvents] = useState([]);
useEffect(() => {
  fetchEvents().then(setEvents);
}, []);

// ❌ NEVER direct platform detection
if (Platform.OS === 'web') {
  /* ... */
}
```

## File Naming Conventions

- Hooks: `use{Domain}Data.ts`, `use{Domain}Actions.ts`
- Components: `PascalCase.tsx`
- Utilities: `camelCase.ts`
- Convex functions: `{domain}/queries.ts`, `{domain}/mutations.ts`
- Platform adapters: `platform-setup.ts` (mobile), `platform.ts` (web)

## Performance Guidelines

- Use Convex indexes for all database queries
- Leverage Convex optimistic updates for instant UI feedback
- Avoid N+1 queries by fetching related data in single query
- Use React.memo for expensive UI components
- Implement proper loading states for better UX

## Testing Strategy

- Test shared hooks with mock Convex API
- Test platform adapters independently
- Use Convex test environment for integration tests
- Test both web and mobile UI components
- Validate cross-platform behavior

## Common Anti-Patterns to Avoid

1. **❌ Platform-specific imports in shared package**
2. **❌ Manual data fetching with useState + useEffect**
3. **❌ Unhandled errors in action hooks**
4. **❌ Business logic in UI components**
5. **❌ Server-side patterns in client-only architecture**
6. **❌ Direct platform detection instead of abstraction**
7. **❌ Inconsistent error handling across platforms**

## Development Workflow

1. Start Convex: `pnpm convex:dev`
2. Start development: `pnpm dev` (web) or `pnpm dev:all` (web + mobile)
3. Implement backend functions first
4. Create shared business logic hooks
5. Implement platform-specific UI
6. Regenerate types after schema changes: `pnpm generate`
7. Test on both platforms
8. Run quality checks: `pnpm check`

For complete documentation of all available scripts, see [scripts.md](./scripts.md).

When implementing features, always prioritize:

- Real-time data synchronization
- Cross-platform code reuse
- Type safety throughout the stack
- Consistent user experience
- Proper error handling and user feedback
