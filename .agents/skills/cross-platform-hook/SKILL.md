---
name: cross-platform-hook
description: Creating shared hooks using the factory pattern for cross-platform use between Next.js web and React Native mobile in the Groupi shared package. Use when building hooks that need to work on both platforms.
---

# Creating Cross-Platform Hooks

All shared hooks live in `packages/shared/src/hooks/` and use the factory pattern for dependency injection.

Inspect `packages/shared/src/hooks/` and follow the closest existing hook pair.

## Factory Pattern

### Data Hooks (queries)

```typescript
// packages/shared/src/hooks/use{Domain}Data.ts
import { useQuery } from 'convex/react';
import type { ConvexApi, ConvexId } from './types';

export function create{Domain}DataHooks(api: ConvexApi) {
  function use{Domain}Data(id: ConvexId<'{table}'>) {
    return useQuery(api.{domain}.queries.get{Domain}, { id });
  }

  function use{Domain}List() {
    return useQuery(api.{domain}.queries.list, {});
  }

  return { use{Domain}Data, use{Domain}List };
}
```

### Action Hooks (mutations)

```typescript
// packages/shared/src/hooks/use{Domain}Actions.ts
import { useMutation } from 'convex/react';
import { toast } from '../platform';
import { navigation } from '../platform';
import type { ConvexApi } from './types';

export function create{Domain}ActionHooks(api: ConvexApi) {
  function useCreate{Domain}() {
    const mutation = useMutation(api.{domain}.mutations.create);

    return async (data: Create{Domain}Input) => {
      try {
        const result = await mutation(data);
        toast.success('{Domain} created!');
        navigation.push(`/{domain}/${result}`);
        return { success: true, data: result };
      } catch (error) {
        const message = error instanceof Error
          ? error.message
          : 'Failed to create {domain}';
        toast.error(message);
        return { success: false, error: message };
      }
    };
  }

  return { useCreate{Domain} };
}
```

## Platform Abstractions

Use these instead of platform-specific imports:

```typescript
import { navigation } from '@groupi/shared/platform'; // push, replace, back
import { toast } from '@groupi/shared/platform'; // success, error, info
import { storage } from '@groupi/shared/platform'; // get, set, remove
```

## Critical Rules

**NEVER import in `packages/shared/`:**

- `react-native` or any RN module
- `next/*` (next/navigation, next/image, etc.)
- `expo-*` (expo-router, expo-secure-store, etc.)
- Any platform-specific module

**NEVER do this for data:**

```typescript
const [data, setData] = useState([]);
useEffect(() => {
  fetchData().then(setData);
}, []);
```

**ALWAYS use Convex subscriptions:**

```typescript
const data = useQuery(api.domain.queries.getData, { id });
```

## Type Patterns

Let TypeScript infer from Convex functions. Never add manual type aliases:

```typescript
// WRONG: Manual types
type EventData = FunctionReturnType<typeof api.events.queries.getEvent>;

// RIGHT: Let inference work
function useEventData(eventId: ConvexId<'events'>) {
  return useQuery(api.events.queries.getEvent, { eventId });
  // Return type is automatically inferred
}
```

## Export

Always add new hooks to `packages/shared/src/hooks/index.ts`:

```typescript
export { create{Domain}DataHooks } from './use{Domain}Data';
export { create{Domain}ActionHooks } from './use{Domain}Actions';
```
