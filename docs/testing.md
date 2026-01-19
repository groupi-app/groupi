# Groupi Testing Guide

This document provides comprehensive guidance on writing tests for the Groupi application following established patterns and best practices.

## Table of Contents

- [Testing Framework Overview](#testing-framework-overview)
- [Package-Specific Testing](#package-specific-testing)
- [Writing Tests by Type](#writing-tests-by-type)
- [Mocking Patterns](#mocking-patterns)
- [Test Data Factories](#test-data-factories)
- [Convex Test Helpers](#convex-test-helpers)
- [Advanced Testing Patterns](#advanced-testing-patterns)
- [Type-Safe Test IDs](#type-safe-test-ids)
- [Testing Better Auth Integration](#testing-better-auth-integration)
- [Async Testing Patterns](#async-testing-patterns)
- [Best Practices](#best-practices)
- [Coverage Requirements](#coverage-requirements)
- [Common Issues and Solutions](#common-issues-and-solutions)
- [Running Tests](#running-tests)

## Testing Framework Overview

All packages use **Vitest** as the primary testing framework with the following supporting libraries:
- `@testing-library/react` - React component testing
- `@testing-library/jest-dom` - DOM assertions
- `@testing-library/user-event` - User interaction simulation
- `convex-test` - Convex backend function testing

## Package-Specific Testing

### Web Package (`packages/web`)

**Environment**: `jsdom` (browser simulation)

**Test Locations**:
- `hooks/**/*.test.ts` - Hook tests
- `components/**/*.test.tsx` - Component tests
- `lib/**/*.test.ts` - Utility function tests
- `__tests__/**/*.test.ts` - General tests

**Running Tests**:
```bash
pnpm test:web           # Run web tests
pnpm --filter @groupi/web test -- --watch  # Watch mode
```

### Convex Package (`convex/`)

**Environment**: `edge-runtime` (Convex Edge Runtime)

**Test Location**: `convex/tests/*.test.ts`

**Running Tests**:
```bash
pnpm test:convex        # Run convex tests
```

### Shared Package (`packages/shared`)

**Environment**: `node` (platform-agnostic)

**Test Location**: `packages/shared/src/**/*.test.ts`

**Running Tests**:
```bash
pnpm test:shared        # Run shared tests
```

### Mobile Package (`packages/mobile`)

**Environment**: `node` with React Native mocks

**Test Location**: `packages/mobile/src/**/*.test.ts`

**Running Tests**:
```bash
pnpm test:mobile        # Run mobile tests
```

## Writing Tests by Type

### 1. Utility Function Tests

For pure functions in `lib/` directories:

```typescript
// lib/event-permissions.test.ts
import { describe, it, expect } from 'vitest';
import { canDeletePost, isModerator } from './event-permissions';

describe('canDeletePost', () => {
  it('should allow organizers to delete any post', () => {
    const result = canDeletePost({
      userRole: 'ORGANIZER',
      isAuthor: false,
    });
    expect(result).toBe(true);
  });

  it('should allow authors to delete their own posts', () => {
    const result = canDeletePost({
      userRole: 'ATTENDEE',
      isAuthor: true,
    });
    expect(result).toBe(true);
  });

  it('should prevent attendees from deleting others posts', () => {
    const result = canDeletePost({
      userRole: 'ATTENDEE',
      isAuthor: false,
    });
    expect(result).toBe(false);
  });
});
```

### 2. React Component Tests

For components in `components/` directories:

```typescript
// components/my-component.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MyComponent } from './my-component';

// Mock dependencies BEFORE importing the component
vi.mock('convex/react', () => ({
  useMutation: () => vi.fn(),
  useQuery: () => undefined,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe('MyComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<MyComponent title="Test Title" />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('handles user interactions', async () => {
    const user = userEvent.setup();
    const onClickMock = vi.fn();

    render(<MyComponent onClick={onClickMock} />);

    await user.click(screen.getByRole('button'));
    expect(onClickMock).toHaveBeenCalledTimes(1);
  });
});
```

### 3. Convex Backend Tests

For Convex queries and mutations:

```typescript
// convex/tests/my-feature.test.ts
import { convexTest } from 'convex-test';
import { describe, it, expect, beforeEach } from 'vitest';
import { api } from '../_generated/api';
import schema from '../schema';

// Import all modules for testing
const modules = import.meta.glob('../**/*.ts', { eager: true });

describe('My Feature', () => {
  let t: ReturnType<typeof convexTest>;

  beforeEach(() => {
    t = convexTest(schema, modules);
  });

  it('should create a record', async () => {
    // Create test user with authentication
    const userId = 'test-user-id';
    const asUser = t.withIdentity({ subject: userId });

    // Create prerequisite data
    const personId = await asUser.mutation(api.persons.mutations.create, {
      userId,
    });

    // Test the feature
    const result = await asUser.mutation(api.myFeature.mutations.create, {
      personId,
      data: 'test data',
    });

    expect(result).toBeDefined();
    expect(result.data).toBe('test data');
  });

  it('should query records', async () => {
    const userId = 'test-user-id';
    const asUser = t.withIdentity({ subject: userId });

    // Setup test data
    const personId = await asUser.mutation(api.persons.mutations.create, {
      userId,
    });

    // Query and verify
    const results = await asUser.query(api.myFeature.queries.list, {
      personId,
    });

    expect(results).toEqual([]);
  });

  it('should enforce authentication', async () => {
    // Test without authentication
    await expect(
      t.query(api.myFeature.queries.getPrivateData, {})
    ).rejects.toThrow();
  });
});
```

### 4. Hook Tests

For custom React hooks:

```typescript
// hooks/use-my-hook.test.ts
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useMyHook } from './use-my-hook';

// Mock Convex
vi.mock('convex/react', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(() => vi.fn()),
}));

describe('useMyHook', () => {
  it('returns initial state', () => {
    const { result } = renderHook(() => useMyHook());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('handles state updates', async () => {
    const { result } = renderHook(() => useMyHook());

    await act(async () => {
      result.current.updateData('new value');
    });

    expect(result.current.data).toBe('new value');
  });
});
```

## Mocking Patterns

### Mocking Convex

The test setup (`test-setup.ts`) provides global mocks for Convex:

```typescript
// Already mocked in test-setup.ts:
// - convex/react (useQuery, useMutation, usePaginatedQuery, ConvexProvider)
// - @/convex/_generated/api
// - @/convex/_generated/dataModel

// To customize in your test:
import { vi } from 'vitest';
import { useQuery, useMutation } from 'convex/react';

vi.mocked(useQuery).mockReturnValue(mockData);
vi.mocked(useMutation).mockReturnValue(mockMutationFn);
```

### Mocking Next.js Navigation

```typescript
import { vi } from 'vitest';

const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
    back: vi.fn(),
  }),
  usePathname: () => '/test-path',
  useSearchParams: () => new URLSearchParams(),
}));
```

### Mocking External Modules with require()

When a component uses `require()` for dynamic imports, mock using the relative path:

```typescript
// If component uses: require("../../../convex/_generated/api")
// Mock with the SAME relative path from the test file:
vi.mock("../../../convex/_generated/api", () => ({
  api: {
    myModule: {
      mutations: {
        myMutation: "myMutation",
      },
    },
  },
}));
```

### Mocking Stores

```typescript
vi.mock('@/stores/my-store', () => ({
  useMyStore: () => ({
    value: 'test-value',
    setValue: vi.fn(),
  }),
}));
```

## Test Data Factories

Use the shared test helpers for consistent test data:

```typescript
import {
  TestDataFactory,
  MockConvexApi,
  PlatformTestHelpers,
} from '@groupi/shared/test-helpers';

// Create mock user
const mockUser = TestDataFactory.createUser({
  name: 'Test User',
  email: 'test@example.com',
});

// Create mock event
const mockEvent = TestDataFactory.createEvent({
  title: 'Test Event',
  creatorId: mockUser.personId,
});

// Create mock post
const mockPost = TestDataFactory.createPost({
  title: 'Test Post',
  eventId: mockEvent._id,
  authorId: mockUser.personId,
});
```

## Convex Test Helpers

For Convex backend tests, use the test helpers in `convex/tests/test_helpers.ts`:

```typescript
import {
  createTestInstance,
  createTestUser,
  createTestEventWithUser,
  TestScenarios,
} from './test_helpers';

describe('My Convex Feature', () => {
  it('uses test scenarios', async () => {
    const t = createTestInstance();

    // Create a complete test scenario
    const { auth, event, membership, person } =
      await TestScenarios.singleEvent(t);

    // Test with authenticated user
    const result = await auth.query(api.myFeature.queries.get, {
      eventId: event._id,
    });

    expect(result).toBeDefined();
  });
});
```

### Available Test Scenarios

Choose the helper that matches your test needs:

```typescript
// Simple User (No Events) - for user profile, settings, basic auth tests
const { userId, personId, auth } = await TestScenarios.simpleUser(t);

// Single Event Scenario - for post creation, event queries, basic operations
const { userId, personId, eventId, membershipId, auth } = await TestScenarios.singleEvent(t);

// Multi-User Event - for permissions, notifications, user interactions
const { organizer, attendee, eventId, organizerAuth, attendeeAuth } = await TestScenarios.multiUser(t);

// Permission Testing - for testing unauthorized access, security boundaries
const { eventId, outsiderAuth } = await TestScenarios.outsiderUser(t);
```

### Custom Test Data

For specific requirements, use granular helpers:

```typescript
// Custom user
const { userId, personId } = await createTestUser(t, {
  email: "specific@example.com",
  username: "specificuser",
  name: "Specific Name",
  bio: "Custom bio"
});

// Custom event with specific settings
const setup = await createTestEventWithUser(t, {
  userEmail: "organizer@company.com",
  eventTitle: "Company Meetup",
  eventLocation: "Office",
  userRole: "MODERATOR",
  rsvpStatus: "YES"
});
```

### Data Setup Chain Pattern

When manually setting up test data in `t.run()`:

```typescript
const { userId, personId, eventId, membershipId } = await t.run(async (ctx) => {
  // 1. Create user (authentication identity)
  const userId = await ctx.db.insert("users", {
    email: "test@example.com",
    emailVerified: false,
    banned: false,
    twoFactorEnabled: false,
    username: "testuser",
    name: "Test User",
  });

  // 2. Create person (app profile linked to user)
  const personId = await ctx.db.insert("persons", {
    userId: userId, // Required reference
    bio: "Test user bio",
  });

  // 3. Create event (user creates events)
  const eventId = await ctx.db.insert("events", {
    title: "Test Event",
    description: "A test event",
    creatorId: personId, // Required reference
    location: "Test Location",
    potentialDateTimes: [],
    chosenDateTime: undefined,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    timezone: "UTC",
  });

  // 4. Create membership (user joins event)
  const membershipId = await ctx.db.insert("memberships", {
    personId: personId,
    eventId: eventId,
    role: "ATTENDEE",
    rsvpStatus: "YES",
  });

  return { userId, personId, eventId, membershipId };
});
```

### Testing Authentication

```typescript
// Valid authentication (use subject as userId)
const asUser = t.withIdentity({ subject: userId });
const result = await asUser.mutation(api.some.mutation, { ... });

// Test unauthenticated access (should fail)
await expect(
  t.mutation(api.posts.mutations.createPost, { ... })
).rejects.toThrow("Authentication required");
```

### Verifying Database State

```typescript
const { post, posts } = await t.run(async (ctx) => {
  const post = await ctx.db.get(postId);
  const posts = await ctx.db.query("posts").collect();
  return { post, posts };
});

expect(post).toBeTruthy();
expect(posts).toHaveLength(1);

// Verify notifications were created
const { notifications } = await t.run(async (ctx) => {
  const notifications = await ctx.db.query("notifications").collect();
  return { notifications };
});

expect(notifications).toHaveLength(1);
expect(notifications[0].type).toBe("NEW_POST");
```

## Advanced Testing Patterns

### Permission Testing

```typescript
test("should enforce event membership", async () => {
  const t = createTestInstance();
  const { eventId, outsiderAuth } = await TestScenarios.outsiderUser(t);

  await expect(
    outsiderAuth.mutation(api.posts.mutations.createPost, {
      eventId,
      title: "Unauthorized",
      content: "Should fail"
    })
  ).rejects.toThrow("Access denied");
});

test("should allow organizer to moderate posts", async () => {
  const t = createTestInstance();
  const { organizer, attendee, eventId, organizerAuth, attendeeAuth } =
    await TestScenarios.multiUser(t);

  // Attendee creates content
  const resource = await attendeeAuth.mutation(api.posts.mutations.createPost, {
    eventId, title: "User Post", content: "Original content"
  });

  // Organizer can moderate it
  const result = await organizerAuth.mutation(api.posts.mutations.updatePost, {
    postId: resource.id,
    content: "Moderated content"
  });

  expect(result.post.content).toBe("Moderated content");
});
```

### Testing Cascade Operations

```typescript
test("should cascade delete related data", async () => {
  const t = createTestInstance();
  const { eventId, auth } = await TestScenarios.singleEvent(t);

  // Create post and replies
  const post = await auth.mutation(api.posts.mutations.createPost, {
    eventId, title: "Main Post", content: "Content"
  });

  await auth.mutation(api.replies.mutations.create, {
    postId: post.id, text: "Reply 1"
  });

  // Delete post should cascade to replies
  await auth.mutation(api.posts.mutations.deletePost, {
    postId: post.id
  });

  // Verify cascade worked
  const { replies } = await t.run(async (ctx) => {
    const replies = await ctx.db.query("replies").collect();
    return { replies };
  });

  expect(replies).toHaveLength(0);
});
```

### Testing Notifications

```typescript
test("should create notifications", async () => {
  const t = createTestInstance();
  const { organizer, attendee, eventId, organizerAuth } = await TestScenarios.multiUser(t);

  await organizerAuth.mutation(api.posts.mutations.createPost, {
    eventId,
    title: "Team Update",
    content: "Important news!"
  });

  // Verify notification was created for attendee
  const { notifications } = await t.run(async (ctx) => {
    const notifications = await ctx.db.query("notifications").collect();
    return { notifications };
  });

  expect(notifications).toHaveLength(1);
  expect(notifications[0].type).toBe("NEW_POST");
});
```

### Common Convex Test Mistakes

```typescript
// ❌ Wrong: Direct database access outside t.run()
const userId = await t.db.insert("users", { ... });

// ✅ Correct: Database access inside t.run()
const { userId } = await t.run(async (ctx) => {
  const userId = await ctx.db.insert("users", { ... });
  return { userId };
});

// ❌ Wrong: Missing modules parameter
const t = convexTest(schema, {});

// ✅ Correct: Include modules glob
const modules = import.meta.glob("./**/*.ts");
const t = convexTest(schema, modules);

// ❌ Wrong: Using non-existent schema fields
await ctx.db.insert("memberships", {
  personId,
  eventId,
  role: "ATTENDEE",
  rsvpStatus: "YES",
  joinedAt: Date.now(), // Field doesn't exist!
});

// ✅ Correct: Only use fields that exist in schema
await ctx.db.insert("memberships", {
  personId,
  eventId,
  role: "ATTENDEE",
  rsvpStatus: "YES",
});
```

## Type-Safe Test IDs

When creating mock IDs that need to match Convex ID types:

```typescript
// Define a branded type for test IDs
type TestId<T extends string> = string & { __tableName: T };

// Create type-safe mock IDs
const notificationId = 'test-notification-id' as TestId<'notifications'>;
const personId = 'test-person-id' as TestId<'persons'>;
const eventId = 'test-event-id' as TestId<'events'>;
```

## Testing Better Auth Integration

The test setup mocks Better Auth. For tests that need auth context:

```typescript
// Already mocked in test-setup.ts:
vi.mock('@/lib/auth-client', () => ({
  authClient: {
    signIn: vi.fn(),
    signOut: vi.fn(),
    signUp: vi.fn(),
    getSession: vi.fn(),
  },
  useSession: () => ({
    data: {
      user: {
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com',
      },
    },
  }),
}));

// To customize authentication state:
import { useSession } from '@/lib/auth-client';

vi.mocked(useSession).mockReturnValue({
  data: null, // Unauthenticated
});
```

## Async Testing Patterns

### Testing Loading States

```typescript
it('shows loading state initially', () => {
  vi.mocked(useQuery).mockReturnValue(undefined);

  render(<MyComponent />);

  expect(screen.getByText('Loading...')).toBeInTheDocument();
});
```

### Testing Data Loaded States

```typescript
it('shows data when loaded', () => {
  vi.mocked(useQuery).mockReturnValue([
    { id: '1', title: 'Item 1' },
    { id: '2', title: 'Item 2' },
  ]);

  render(<MyComponent />);

  expect(screen.getByText('Item 1')).toBeInTheDocument();
  expect(screen.getByText('Item 2')).toBeInTheDocument();
});
```

### Testing Mutations

```typescript
it('handles mutation success', async () => {
  const mockMutation = vi.fn().mockResolvedValue({ success: true });
  vi.mocked(useMutation).mockReturnValue(mockMutation);

  const user = userEvent.setup();
  render(<MyComponent />);

  await user.click(screen.getByRole('button', { name: /submit/i }));

  expect(mockMutation).toHaveBeenCalledWith({
    expectedArg: 'value',
  });
});

it('handles mutation errors', async () => {
  const mockMutation = vi.fn().mockRejectedValue(new Error('Failed'));
  vi.mocked(useMutation).mockReturnValue(mockMutation);

  const user = userEvent.setup();
  render(<MyComponent />);

  await user.click(screen.getByRole('button', { name: /submit/i }));

  expect(screen.getByText(/error/i)).toBeInTheDocument();
});
```

## Best Practices

### 1. Test Isolation

Each test should be independent and not rely on state from other tests:

```typescript
beforeEach(() => {
  vi.clearAllMocks();
  // Reset any global state
});

afterEach(() => {
  // Cleanup if needed
});
```

### 2. Descriptive Test Names

Use descriptive names that explain what is being tested:

```typescript
// Good
it('should display error message when email is invalid')
it('prevents non-organizers from deleting events')

// Bad
it('works')
it('test 1')
```

### 3. Arrange-Act-Assert Pattern

Structure tests clearly:

```typescript
it('should update the counter when clicked', async () => {
  // Arrange
  const user = userEvent.setup();
  render(<Counter initialValue={0} />);

  // Act
  await user.click(screen.getByRole('button', { name: /increment/i }));

  // Assert
  expect(screen.getByText('1')).toBeInTheDocument();
});
```

### 4. Test User-Visible Behavior

Focus on what users see and interact with, not implementation details:

```typescript
// Good - tests visible behavior
expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled();

// Avoid - tests implementation details
expect(component.state.isSubmitting).toBe(true);
```

### 5. Use Role-Based Queries

Prefer accessible queries that reflect how users interact:

```typescript
// Preferred order:
screen.getByRole('button', { name: /submit/i })
screen.getByLabelText('Email')
screen.getByPlaceholderText('Enter email')
screen.getByText('Submit')
screen.getByTestId('submit-button') // Last resort
```

### 6. Mock at the Right Level

Mock external dependencies, not internal implementation:

```typescript
// Good - mock external API
vi.mock('convex/react', () => ({ ... }));

// Avoid - mocking internal functions of the component under test
```

### 7. Test Edge Cases

Include tests for error states, empty states, and boundary conditions:

```typescript
describe('UserList', () => {
  it('shows empty state when no users', () => { ... });
  it('shows loading state while fetching', () => { ... });
  it('shows error state on fetch failure', () => { ... });
  it('shows users when data is loaded', () => { ... });
  it('handles pagination correctly', () => { ... });
});
```

## Coverage Requirements

| Package | Branches | Functions | Lines | Statements |
|---------|----------|-----------|-------|------------|
| Web     | 70%      | 70%       | 70%   | 70%        |
| Shared  | 80%      | 80%       | 80%   | 80%        |
| Mobile  | 70%      | 70%       | 70%   | 70%        |
| Convex  | No threshold (backend) |

Run coverage reports:
```bash
pnpm test:coverage
```

## Common Issues and Solutions

### Issue: Module Not Found in Tests

**Problem**: `Cannot find module '@/convex/_generated/api'`

**Solution**: Ensure the module is mocked in test-setup.ts or in your test file before the component import:

```typescript
vi.mock('@/convex/_generated/api', () => ({
  api: { ... },
}));
```

### Issue: require() Not Mocked Properly

**Problem**: `require()` calls bypass vitest mocking

**Solution**: Use relative paths in both the source file and mock:

```typescript
// Source file
const { api } = require('../../../convex/_generated/api');

// Test file - use same relative path
vi.mock('../../../convex/_generated/api', () => ({ ... }));
```

### Issue: AuthUserId Type Errors

**Problem**: `Id<'user'>` doesn't exist in schema

**Solution**: Use `AuthUserId` type from `convex/auth.ts`:

```typescript
import { AuthUserId } from '../auth';
const user = await authComponent.getAnyUserById(ctx, userId as AuthUserId);
```

### Issue: Unused Import Errors in Convex

**Problem**: TypeScript complains about unused imports

**Solution**: Remove unused imports or use them:

```typescript
// If you replaced Id<'user'> with AuthUserId, remove the Id import if unused
import { AuthUserId } from '../auth';
// Remove: import { Id } from '../_generated/dataModel';
```

## Running Tests

```bash
# Run all tests
pnpm test

# Run specific package
pnpm test:web
pnpm test:convex
pnpm test:shared
pnpm test:mobile

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage

# Run specific test file
pnpm --filter @groupi/web test -- lib/event-permissions.test.ts
```
