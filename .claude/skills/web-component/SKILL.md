---
name: web-component
description: Creating web UI components for Groupi following the atomic architecture (atoms/molecules/organisms/templates), design token system, and shadcn/ui patterns. Use when building or modifying any frontend component.
---

# Creating Web Components

## Level Selection

| If the component...                    | Level    | Location                |
| -------------------------------------- | -------- | ----------------------- |
| Is a single, indivisible element       | Atom     | `components/atoms/`     |
| Combines 2-3 atoms into a pattern      | Molecule | `components/molecules/` |
| Is a complex, feature-specific section | Organism | `components/organisms/` |
| Defines page layout structure          | Template | `components/templates/` |

Existing components:

```
!`echo "=== Atoms ===" && ls packages/web/components/atoms/ && echo "=== Molecules ===" && ls packages/web/components/molecules/`
```

## Templates by Level

### Atom (pure presentation, no data fetching, no business logic)

```tsx
import { cn } from '@/lib/utils';

interface StatusDotProps {
  status: 'online' | 'offline' | 'away';
  size?: 'sm' | 'md' | 'lg';
}

export function StatusDot({ status, size = 'md' }: StatusDotProps) {
  return (
    <span
      className={cn(
        'rounded-full',
        size === 'sm' && 'size-2',
        size === 'md' && 'size-3',
        size === 'lg' && 'size-4',
        status === 'online' && 'bg-success',
        status === 'offline' && 'bg-muted-foreground/50',
        status === 'away' && 'bg-warning'
      )}
    />
  );
}
```

### Molecule (compose 2-3 atoms, minimal logic)

```tsx
import { StatusDot } from '@/components/atoms';
import { Avatar, AvatarImage } from '@/components/ui/avatar';

interface UserStatusProps {
  name: string;
  image: string;
  status: 'online' | 'offline' | 'away';
}

export function UserStatus({ name, image, status }: UserStatusProps) {
  return (
    <div className='flex items-center gap-2'>
      <div className='relative'>
        <Avatar>
          <AvatarImage src={image} alt={name} />
        </Avatar>
        <StatusDot status={status} />
      </div>
      <span className='text-sm text-foreground'>{name}</span>
    </div>
  );
}
```

### Organism (feature-specific, may fetch data)

```tsx
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { UserInfoCard } from '@/components/molecules';
import { Card } from '@/components/ui/card';

export function MemberList({ eventId }: { eventId: string }) {
  const members = useQuery(api.events.queries.getEventAttendeesData, {
    eventId,
  });

  if (!members) return <LoadingState />;

  return (
    <Card className='rounded-card shadow-raised p-4'>
      <div className='space-y-3'>
        {members.map(member => (
          <UserInfoCard key={member.id} user={member} />
        ))}
      </div>
    </Card>
  );
}
```

## Token Quick Reference

**Always use semantic tokens. Never use hardcoded Tailwind colors, shadows, radius, or z-index.**

| Category  | Use                                                     | Never                                 |
| --------- | ------------------------------------------------------- | ------------------------------------- |
| Status bg | `bg-success`, `bg-warning`, `bg-error`, `bg-info`       | `bg-green-*`, `bg-red-*`, `bg-blue-*` |
| Subtle bg | `bg-bg-success-subtle`, `bg-bg-error-subtle`            | `bg-green-100`, `bg-red-100`          |
| Surfaces  | `bg-card`, `bg-muted`, `bg-bg-elevated`, `bg-bg-sunken` | `bg-gray-*`, `bg-white`               |
| Shadows   | `shadow-raised`, `shadow-floating`, `shadow-overlay`    | `shadow-sm`, `shadow-md`, `shadow-lg` |
| Radius    | `rounded-card`, `rounded-button`, `rounded-input`       | `rounded-xl`, `rounded-2xl`           |
| Z-index   | `z-modal`, `z-popover`, `z-tooltip`, `z-dropdown`       | `z-10`, `z-50`, `z-[100]`             |

Run `pnpm lint:tokens` after editing TSX files to check for violations.

## Import Pattern

```tsx
import { api } from '@/convex/_generated/api';
import { useQuery, useMutation } from 'convex/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
```

## Checklist

- [ ] Correct atomic level chosen
- [ ] File placed in correct directory
- [ ] Semantic design tokens used (no hardcoded colors/shadows/radius/z-index)
- [ ] Exported from level's `index.ts`
- [ ] `cn()` used for conditional classes
- [ ] All components are client components (no `"use server"`, no SSR)
- [ ] `pnpm lint:tokens` passes
