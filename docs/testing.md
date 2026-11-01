# Groupi Testing Guide

Test setup, fixtures, and validation commands for Groupi.

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

The web, mobile, shared, portal, and Convex packages use **Vitest**. The SDK also uses Node's test runner and Python unittest; CLI package smoke checks run through a Node script. Inspect each package manifest for its commands. Supporting libraries include:

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
pnpm --filter @groupi/web test:watch  # Watch mode
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
import { canDeletePost } from './event-permissions';

describe('canDeletePost', () => {
  it('should allow organizers to delete any post', () => {
    const result = canDeletePost({
      userId: 'organizer',
      userRole: 'ORGANIZER',
      postAuthorId: 'author',
    });
    expect(result).toBe(true);
  });

  it('should allow authors to delete their own posts', () => {
    const result = canDeletePost({
      userId: 'author',
      userRole: 'ATTENDEE',
      postAuthorId: 'author',
    });
    expect(result).toBe(true);
  });

  it('should prevent attendees from deleting others posts', () => {
    const result = canDeletePost({
      userId: 'attendee',
      userRole: 'ATTENDEE',
      postAuthorId: 'author',
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

For Convex queries and mutations, use an existing authenticated scenario:

```typescript
// convex/tests/my-feature.test.ts
import { describe, it, expect } from 'vitest';
import { api } from '../_generated/api';
import { createTestInstance, TestScenarios } from './test_helpers';

describe('Posts', () => {
  it('creates and reads a post as an event member', async () => {
    const t = createTestInstance();
    const { auth, eventId } = await TestScenarios.singleEvent(t);
    const { postId } = await auth.mutation(api.posts.mutations.createPost, {
      eventId,
      title: 'Test post',
      content: 'Test content',
    });
    const post = await auth.query(api.posts.queries.getPost, { postId });
    expect(post.content).toBe('Test content');
  });

  it('rejects an unauthenticated write', async () => {
    const t = createTestInstance();
    const { eventId } = await TestScenarios.singleEvent(t);
    await expect(
      t.mutation(api.posts.mutations.createPost, {
        eventId,
        title: 'Unauthorized',
        content: 'Test content',
      })
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
vi.mock('../../../convex/_generated/api', () => ({
  api: {
    myModule: {
      mutations: {
        myMutation: 'myMutation',
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

[`packages/shared/src/test-helpers.ts`](../packages/shared/src/test-helpers.ts)
contains legacy UI mock factories and platform test utilities. It is not an
exported `@groupi/shared/test-helpers` package entry point. Its mock shapes are
not database documents: use the Convex helpers below for backend fixtures, and
match a component's actual props when making UI mocks. Avoid importing these
legacy factories as proof of the current application schema.

## Convex Test Helpers

For Convex backend tests, use the test helpers in `convex/tests/test_helpers.ts`:

```typescript
import {
  createTestInstance,
  createTestUser,
  createTestEventWithUser,
  createAuthenticatedUser,
  TestScenarios,
} from './test_helpers';

describe('My Convex Feature', () => {
  it('uses test scenarios', async () => {
    const t = createTestInstance();

    // Create a complete test scenario
    const { auth } = await TestScenarios.singleEvent(t);

    // Test with authenticated user
    const result = await auth.query(api.events.queries.getUserEvents, {});

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
const { userId, personId, eventId, membershipId, auth } =
  await TestScenarios.singleEvent(t);

// Multi-User Event - for permissions, notifications, user interactions
const { organizer, attendee, eventId, organizerAuth, attendeeAuth } =
  await TestScenarios.multiUser(t);

// Permission Testing - for testing unauthorized access, security boundaries
const { eventId, outsiderAuth } = await TestScenarios.outsiderUser(t);
```

### Custom Test Data

For specific requirements, use granular helpers:

```typescript
// Custom user
const { userId, personId } = await createTestUser(t, {
  email: 'specific@example.com',
  username: 'specificuser',
  name: 'Specific Name',
  bio: 'Custom bio',
});

// Custom event with specific settings
const setup = await createTestEventWithUser(t, {
  userEmail: 'organizer@company.com',
  eventTitle: 'Company Meetup',
  eventLocation: 'Office',
  userRole: 'MODERATOR',
  rsvpStatus: 'YES',
});
```

### Data Setup Chain Pattern

Use the helpers to create an application person, event, and membership:

```typescript
const { userId, personId, eventId, membershipId } =
  await createTestEventWithUser(t, {
    userEmail: 'test@example.com',
    eventTitle: 'Test Event',
    userRole: 'ATTENDEE',
    rsvpStatus: 'YES',
  });
const asUser = createAuthenticatedUser(t, userId);
```

`userId` is a mock Better Auth identity string. These helpers create `persons`
records, not a root `users` table. For custom application fixtures, perform
`ctx.db` operations inside `t.run()` and follow the current
[`convex/schema.ts`](../convex/schema.ts). Component-backed authentication tests
need their own registered component setup; see
[`convex/tests/auth.helpers.ts`](../convex/tests/auth.helpers.ts).

### Testing Authentication

`createAuthenticatedUser(t, userId)` uses `t.withIdentity({ subject: userId })`.
Compare an authenticated operation with a call through the unauthenticated test
instance, as in the post example above. Also test a signed-in outsider and
insufficient roles; a sign-in check alone does not verify resource authorization.

### Verifying Database State

```typescript
const { post, posts } = await t.run(async ctx => {
  const post = await ctx.db.get(postId);
  const posts = await ctx.db.query('posts').collect();
  return { post, posts };
});

expect(post).toBeTruthy();
expect(posts).toHaveLength(1);

// Verify notifications were created
const { notifications } = await t.run(async ctx => {
  const notifications = await ctx.db.query('notifications').collect();
  return { notifications };
});

expect(notifications).toHaveLength(1);
expect(notifications[0].type).toBe('NEW_POST');
```

## Advanced Testing Patterns

### Permission Testing

```typescript
test('should enforce event membership', async () => {
  const t = createTestInstance();
  const { eventId, outsiderAuth } = await TestScenarios.outsiderUser(t);

  await expect(
    outsiderAuth.mutation(api.posts.mutations.createPost, {
      eventId,
      title: 'Unauthorized',
      content: 'Should fail',
    })
  ).rejects.toThrow('You do not have permission for this event content.');
});

test('should allow organizer to moderate posts', async () => {
  const t = createTestInstance();
  const { organizer, attendee, eventId, organizerAuth, attendeeAuth } =
    await TestScenarios.multiUser(t);

  // Attendee creates content
  const resource = await attendeeAuth.mutation(api.posts.mutations.createPost, {
    eventId,
    title: 'User Post',
    content: 'Original content',
  });

  // Organizer can moderate it
  const result = await organizerAuth.mutation(api.posts.mutations.updatePost, {
    postId: resource.postId,
    content: 'Moderated content',
  });

  expect(result.post.content).toBe('Moderated content');
});
```

### Testing Cascade Operations

```typescript
test('should cascade delete related data', async () => {
  const t = createTestInstance();
  const { eventId, auth } = await TestScenarios.singleEvent(t);

  // Create post and replies
  const post = await auth.mutation(api.posts.mutations.createPost, {
    eventId,
    title: 'Main Post',
    content: 'Content',
  });

  await auth.mutation(api.replies.mutations.createReply, {
    postId: post.postId,
    text: 'Reply 1',
  });

  // Delete post should cascade to replies
  await auth.mutation(api.posts.mutations.deletePost, {
    postId: post.postId,
  });

  // Verify cascade worked
  const { replies } = await t.run(async ctx => {
    const replies = await ctx.db.query('replies').collect();
    return { replies };
  });

  expect(replies).toHaveLength(0);
});
```

### Testing Notifications

```typescript
test('should create notifications', async () => {
  const t = createTestInstance();
  const { organizer, attendee, eventId, organizerAuth } =
    await TestScenarios.multiUser(t);

  await organizerAuth.mutation(api.posts.mutations.createPost, {
    eventId,
    title: 'Team Update',
    content: 'Important news!',
  });

  // Verify notification was created for attendee
  const { notifications } = await t.run(async ctx => {
    const notifications = await ctx.db.query('notifications').collect();
    return { notifications };
  });

  expect(notifications).toHaveLength(1);
  expect(notifications[0].type).toBe('NEW_POST');
});
```

### Common Convex Test Mistakes

```typescript
// Incorrect: Direct database access outside t.run()
const person = await t.db.get(personId);

// Correct: Database access inside t.run()
const person = await t.run(ctx => ctx.db.get(personId));

// Incorrect: Missing modules parameter
const t = convexTest(schema, {});

// Correct: Include modules glob
const modules = import.meta.glob('../**/*.{ts,js}', { eager: false });
const t = convexTest(schema, modules);

// Incorrect: Using non-existent schema fields
await ctx.db.insert('memberships', {
  personId,
  eventId,
  role: 'ATTENDEE',
  rsvpStatus: 'YES',
  joinedAt: Date.now(), // Field doesn't exist!
});

// Correct: Only use fields that exist in schema
await ctx.db.insert('memberships', {
  personId,
  eventId,
  role: 'ATTENDEE',
  rsvpStatus: 'YES',
});
```

## Type-Safe Test IDs

For UI-only mock props, a branded string can stand in for an ID. These strings
are not valid stored Convex IDs; use IDs returned by fixture inserts for backend
queries and mutations:

```typescript
// Define a branded type for test IDs
type TestId<T extends string> = string & { __tableName: T };

// Create type-safe mock IDs
const notificationId = 'test-notification-id' as TestId<'notifications'>;
const personId = 'test-person-id' as TestId<'persons'>;
const eventId = 'test-event-id' as TestId<'events'>;
```

## Testing Better Auth Integration

The web test setup mocks Better Auth. For tests that need auth context, expose
`useSession` as a mock function so individual tests can change its result:

```typescript
// In the test file, before importing the component:
vi.mock('@/lib/auth-client', () => ({
  authClient: {
    signIn: vi.fn(),
    signOut: vi.fn(),
    signUp: vi.fn(),
    getSession: vi.fn(),
  },
  useSession: vi.fn(() => ({
    data: {
      user: {
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com',
      },
    },
  })),
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
it('should display error message when email is invalid');
it('prevents non-organizers from deleting events');

// Bad
it('works');
it('test 1');
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
screen.getByRole('button', { name: /submit/i });
screen.getByLabelText('Email');
screen.getByPlaceholderText('Enter email');
screen.getByText('Submit');
screen.getByTestId('submit-button'); // Last resort
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

Web and shared enforce baseline floors in `vitest.config.ts`. Vitest 4 expects
`branches`, `functions`, `lines`, and `statements` directly under `thresholds`.
The previous `thresholds.global` objects were interpreted as file-pattern thresholds
and did not enforce the intended global percentages.

The 2026-10-09 baseline was measured on `ce89496072d7fcb587268794db472ec90de2e895`
with Vitest 4.0.17, preserving the existing coverage include/exclude scope. Floors
are that baseline rounded down to one decimal place (less than 0.1 percentage
point of tolerance), not claims that the improvement targets have been met.

| Package | Metric     | Measured | Enforced floor | Improvement target |
| ------- | ---------- | -------- | -------------- | ------------------ |
| Web     | Branches   | 33.97%   | 33.9%          | 70%                |
| Web     | Functions  | 38.47%   | 38.4%          | 70%                |
| Web     | Lines      | 37.29%   | 37.2%          | 70%                |
| Web     | Statements | 36.95%   | 36.9%          | 70%                |
| Shared  | Branches   | 23.56%   | 23.5%          | 80%                |
| Shared  | Functions  | 52.90%   | 52.9%          | 80%                |
| Shared  | Lines      | 28.73%   | 28.7%          | 80%                |
| Shared  | Statements | 27.60%   | 27.6%          | 80%                |

Web measures all matching files under `hooks`, `components`, `lib`, `stores`,
and `features`, subject to its exclusions. The add-on ownership migration keeps
three specific sets of relocated route UI outside the report:
`features/addons/authoring/**`, `features/addons/creation/organisms/**`, and
`features/addons/runtime/organisms/**`. Their predecessors lived under `app/**`,
which the original baseline did not include. This preserves that existing scope
instead of reducing the floors to absorb previously unmeasured UI. Add-on models,
hooks, catalogs, gating, and direct-page adapters remain measured, including code
that previously lived under `lib` or `hooks`. This is a relocation boundary for
add-ons, not an exemption for future feature directories. Expanding route UI
coverage requires an explicit baseline review and behavior tests.

On `ab175523`, including all relocated UI measured 31.08% statements, 30.69%
functions, 31.62% lines, and 28.12% branches. Preserving the predecessor route UI
scope measured 38.28%, 39.61%, 38.59%, and 35.19%, respectively, before adding
completion-metadata and definition-validation cases; all four unchanged floors
passed. GDL grammar tests now run in shared alongside its conformance suite;
the original web baseline already measured a parser re-export, so this transfer
does not justify lowering web floors.

Shared has no explicit `coverage.include`, so Vitest measures files imported by
its tests; this is not whole-package coverage.
Do not shrink either denominator to pass a gate. Expanding the shared denominator
requires an explicit baseline review. Raise floors as coverage improves toward
the targets; reductions require a documented review of the coverage change.
Mobile's improvement target remains 70%. Its current `vitest.config.ts` enforces
7% branches, 6% functions, 7% lines, and 7% statements over its configured source
scope. These floors are not a claim that the target is met. Convex has no coverage
threshold.

Run the enforced reports:

```bash
pnpm --filter @groupi/web test:coverage
pnpm --filter @groupi/shared test:coverage
```

To check that the runner rejects insufficient coverage, temporarily override an
individual threshold above its measured value. The command below must exit
nonzero with a coverage threshold error even though the assertions pass:

```bash
pnpm --filter @groupi/shared exec vitest run --coverage.enabled --coverage.thresholds.lines=100
```

The repair was also verified with effective 70% web and 80% shared thresholds:
all assertions passed, while each command exited 1 with four global coverage
errors. Restoring the baseline floors makes the complete coverage runs pass.

For all package reports, use `pnpm test:coverage`.

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

Vitest module mocking does not intercept CommonJS `require()` in the same way
as ESM imports. Changing only a mock's relative path does not fix that boundary.
Check how the module loads its dependencies and use an existing test seam or an
integration test. Avoid claiming a mock verifies code it never intercepts.

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
# Run all tests once
pnpm test:run

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
pnpm --filter @groupi/web exec vitest run lib/event-permissions.test.ts
```
