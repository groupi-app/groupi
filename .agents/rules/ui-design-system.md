# UI Design System Rules

Rules for working with the Groupi design system, design tokens, and component architecture.

## Table of Contents

- [Overview](#overview)
- [Token Usage Rules](#token-usage-rules)
- [Component Architecture Rules](#component-architecture-rules)
- [Color Rules](#color-rules)
- [Layout Rules](#layout-rules)
- [Animation Rules](#animation-rules)
- [Common Patterns](#common-patterns)
- [Anti-Patterns](#anti-patterns)

## Overview

Groupi uses a three-layer design token system with atomic component architecture:

| Layer      | Purpose                         | Example                          |
| ---------- | ------------------------------- | -------------------------------- |
| Primitives | Raw values (never use directly) | `purple.700`, `spacing.4`        |
| Semantic   | Purpose-based tokens            | `bg-success`, `shadow-raised`    |
| Component  | Component-specific tokens       | `rounded-button`, `rounded-card` |

| Component Level | Purpose             | Location                |
| --------------- | ------------------- | ----------------------- |
| Atoms           | Smallest elements   | `components/atoms/`     |
| Molecules       | Simple combinations | `components/molecules/` |
| Organisms       | Complex sections    | `components/organisms/` |
| Templates       | Page layouts        | `components/templates/` |
| UI              | shadcn/ui base      | `components/ui/`        |

## Token Usage Rules

### Rule 1: Always Use Semantic Tokens

**NEVER** use hardcoded Tailwind color classes. Always use semantic tokens.

```tsx
// ❌ WRONG - hardcoded colors
className = 'bg-red-500 text-gray-700 border-blue-300';
className = 'bg-green-600 text-white';
className = 'shadow-lg rounded-xl';

// ✅ CORRECT - semantic tokens
className = 'bg-error text-foreground border-border';
className = 'bg-success text-primary-foreground';
className = 'shadow-raised rounded-card';
```

### Rule 2: Use Correct Token Naming

Follow the established naming conventions:

| Category           | Pattern                  | Examples                                             |
| ------------------ | ------------------------ | ---------------------------------------------------- |
| Status backgrounds | `bg-{status}`            | `bg-success`, `bg-warning`, `bg-error`, `bg-info`    |
| Subtle backgrounds | `bg-bg-{status}-subtle`  | `bg-bg-success-subtle`, `bg-bg-error-subtle`         |
| Status text        | `text-{status}`          | `text-success`, `text-warning`, `text-error`         |
| Status borders     | `border-border-{status}` | `border-border-success`, `border-border-error`       |
| Radius             | `rounded-{component}`    | `rounded-button`, `rounded-card`, `rounded-input`    |
| Shadows            | `shadow-{elevation}`     | `shadow-raised`, `shadow-floating`, `shadow-overlay` |
| Z-index (local)    | `z-{level}`              | `z-lifted`, `z-float`, `z-top`                       |
| Z-index (global)   | `z-{layer}`              | `z-modal`, `z-popover`, `z-tooltip`                  |

### Rule 3: Z-Index Hierarchy

Use local z-index for component-internal stacking:

```tsx
// ✅ For elements within a component
className = 'z-lifted'; // 1 - slightly above
className = 'z-float'; // 2 - floating element
className = 'z-top'; // 3 - topmost locally
```

Use global z-index for overlays and fixed elements:

```tsx
// ✅ For overlays, modals, tooltips
className = 'z-sticky'; // 40 - sticky headers
className = 'z-popover'; // 50 - popovers
className = 'z-dropdown'; // 60 - dropdowns (above popovers)
className = 'z-modal'; // 70 - modals
className = 'z-toast'; // 80 - toasts
className = 'z-tooltip'; // 90 - tooltips
className = 'z-overlay'; // 100 - full overlays
```

**NEVER** use numeric z-index:

```tsx
// ❌ WRONG
className = 'z-10 z-20 z-50 z-[100]';
```

### Rule 4: Border Radius

Use component-specific radius tokens:

```tsx
// ✅ CORRECT - semantic radius
className = 'rounded-button'; // 16px - for buttons
className = 'rounded-card'; // 20px - for cards
className = 'rounded-input'; // 12px - for inputs
className = 'rounded-modal'; // 24px - for modals
className = 'rounded-badge'; // pill - for badges
className = 'rounded-avatar'; // circle - for avatars

// ❌ WRONG - default Tailwind radius
className = 'rounded-xl rounded-2xl rounded-3xl';
```

### Rule 5: Shadows

Use elevation-based shadow tokens:

```tsx
// ✅ CORRECT - semantic shadows
className = 'shadow-raised'; // subtle - cards, buttons
className = 'shadow-floating'; // medium - dropdowns
className = 'shadow-overlay'; // heavy - modals
className = 'shadow-popup'; // tooltips, toasts

// ❌ WRONG - default Tailwind shadows
className = 'shadow-sm shadow-md shadow-lg shadow-xl';
```

### Rule 6: Regenerate Tokens After Theme Changes

After modifying theme files in `packages/shared/src/design/themes/`, always regenerate:

```bash
pnpm generate:tokens
```

## Component Architecture Rules

### Rule 7: Component Level Selection

Choose the correct level based on complexity:

| If the component...                    | Use      |
| -------------------------------------- | -------- |
| Is a single, indivisible element       | Atom     |
| Combines 2-3 atoms into a pattern      | Molecule |
| Is a complex, feature-specific section | Organism |
| Defines page layout structure          | Template |

### Rule 8: Atom Rules

Atoms are the smallest building blocks:

```tsx
// ✅ CORRECT atom structure
export function StatusDot({ status, size = 'md' }: StatusDotProps) {
  return (
    <span
      className={cn('rounded-full', sizeClasses[size], statusClasses[status])}
    />
  );
}

// ❌ WRONG - atom with business logic
export function StatusDot({ userId }) {
  const user = useQuery(api.users.get, { userId }); // NO! Atoms don't fetch data
  // ...
}
```

Atom rules:

- Single responsibility
- No data fetching
- No business logic
- Pure presentation only
- May use shadcn/ui primitives

### Rule 9: Molecule Rules

Molecules combine atoms:

```tsx
// ✅ CORRECT molecule - composes atoms
import { StatusDot } from '@/components/atoms';
import { Avatar } from '@/components/ui/avatar';

export function UserStatus({ name, image, status }: UserStatusProps) {
  return (
    <div className='flex items-center gap-2'>
      <div className='relative'>
        <Avatar>
          <AvatarImage src={image} />
        </Avatar>
        <StatusDot status={status} />
      </div>
      <span>{name}</span>
    </div>
  );
}
```

Molecule rules:

- Compose 2-3 atoms
- Reusable across features
- May accept data props
- Minimal business logic

### Rule 10: Organism Rules

Organisms are feature-specific:

```tsx
// ✅ CORRECT organism - complex, may have data
export function PostCard({ post }: { post: Post }) {
  const { person } = useGlobalUser();
  const deletePost = useMutation(api.posts.mutations.delete);

  return (
    <Card className='rounded-card shadow-raised'>
      <UserInfoCard user={post.author} /> {/* molecule */}
      <TimestampBadge date={post.createdAt} /> {/* molecule */}
      <RsvpStatus status={post.rsvp} /> {/* molecule */}
      {/* ... complex content */}
    </Card>
  );
}
```

Organism rules:

- May contain business logic
- May connect to data (Convex queries)
- Compose multiple molecules
- Feature-specific

### Rule 11: Template Rules

Templates define page structure:

```tsx
// ✅ CORRECT template usage
import { DetailPageTemplate } from '@/components/templates';

export default function EventPage({ params }) {
  return (
    <DetailPageTemplate title='Event Details' backHref='/events'>
      <EventContent eventId={params.eventId} />
    </DetailPageTemplate>
  );
}
```

Template rules:

- Define layout, not content
- Accept children for content areas
- Handle responsive layouts
- No data fetching in templates

### Rule 12: Export from Index Files

Always export new components from the appropriate index:

```tsx
// components/atoms/index.ts
export * from './presence-indicator';
export * from './status-dot'; // Add new atoms here

// components/molecules/index.ts
export * from './user-info-card';
export * from './user-status'; // Add new molecules here
```

## Color Rules

### Rule 13: Status Color Usage

Use the correct status color pattern:

```tsx
// For solid status backgrounds (buttons, badges)
className = 'bg-success'; // Green solid
className = 'bg-warning'; // Orange solid
className = 'bg-error'; // Red solid

// For subtle backgrounds (alerts, containers)
className = 'bg-bg-success-subtle'; // Light green
className = 'bg-bg-warning-subtle'; // Light orange
className = 'bg-bg-error-subtle'; // Light red

// For text
className = 'text-success'; // Green text
className = 'text-warning'; // Orange text
className = 'text-error'; // Red text

// For borders
className = 'border-border-success'; // Green border
className = 'border-border-error'; // Red border
```

### Rule 14: Surface Colors

Use semantic surface colors:

```tsx
className = 'bg-background'; // Page background
className = 'bg-card'; // Card surfaces
className = 'bg-muted'; // Muted areas
className = 'bg-bg-elevated'; // Raised surfaces
className = 'bg-bg-sunken'; // Recessed areas
className = 'bg-bg-interactive'; // Interactive elements
```

## Layout Rules

### Rule 15: Spacing Consistency

Use consistent spacing patterns:

```tsx
// ✅ CORRECT - consistent spacing
className = 'p-4 space-y-4'; // Standard card padding
className = 'gap-2'; // Icon-to-text gap
className = 'gap-4'; // Section gaps

// Prefer gap over margin for flex/grid
className = 'flex gap-2'; // ✅
className = 'flex [&>*]:mr-2'; // ❌ Avoid
```

## Animation Rules

### Rule 16: Use Token Durations and Easings

```tsx
// ✅ CORRECT - token-based animation
className = 'transition-all duration-fast ease-bounce';
className = 'duration-normal ease-default';

// For hover effects
className = 'hover:scale-[1.02] active:scale-[0.98] duration-fast ease-bounce';
```

## Common Patterns

### Pattern: Status Indicator

```tsx
<span
  className={cn(
    'size-3 rounded-full border-2 border-background',
    isOnline ? 'bg-success' : 'bg-muted-foreground/50'
  )}
/>
```

### Pattern: Card Component

```tsx
<div className='bg-card rounded-card shadow-raised p-4'>{/* content */}</div>
```

### Pattern: Modal/Dialog

```tsx
<DialogContent className='rounded-modal shadow-overlay'>
  {/* content */}
</DialogContent>
```

### Pattern: Dropdown Menu

```tsx
<DropdownMenuContent className='rounded-dropdown shadow-floating z-dropdown'>
  {/* items */}
</DropdownMenuContent>
```

### Pattern: Error State

```tsx
<div className='bg-bg-error-subtle border border-border-error rounded-card p-4'>
  <p className='text-error'>{errorMessage}</p>
</div>
```

### Pattern: Success State

```tsx
<div className='bg-bg-success-subtle border border-border-success rounded-card p-4'>
  <p className='text-success'>{successMessage}</p>
</div>
```

## Anti-Patterns

### Anti-Pattern 1: Hardcoded Colors

```tsx
// ❌ NEVER do this
className = 'bg-red-500 text-green-600 border-gray-300';
className = 'bg-purple-700'; // Even brand color!

// ✅ Always use tokens
className = 'bg-error text-success border-border';
className = 'bg-primary';
```

### Anti-Pattern 2: Numeric Z-Index

```tsx
// ❌ NEVER do this
className = 'z-10 z-20 z-50';
className = 'z-[999]';

// ✅ Use semantic z-index
className = 'z-float z-modal z-tooltip';
```

### Anti-Pattern 3: Default Shadows

```tsx
// ❌ NEVER do this
className = 'shadow-sm shadow-md shadow-lg';

// ✅ Use elevation shadows
className = 'shadow-raised shadow-floating shadow-overlay';
```

### Anti-Pattern 4: Default Radius

```tsx
// ❌ NEVER do this
className = 'rounded-xl rounded-2xl rounded-3xl';

// ✅ Use component radius
className = 'rounded-card rounded-button rounded-input';
```

### Anti-Pattern 5: Skipping Component Hierarchy

```tsx
// ❌ WRONG - using atoms directly in templates
<ListPageTemplate>
  <StatusDot status="online" />  {/* Atom directly in template */}
</ListPageTemplate>

// ✅ CORRECT - use organisms
<ListPageTemplate>
  <MemberIcon member={member} />  {/* Organism uses atoms internally */}
</ListPageTemplate>
```

### Anti-Pattern 6: Business Logic in Atoms

```tsx
// ❌ WRONG - data fetching in atom
function StatusDot({ userId }) {
  const user = useQuery(api.users.get, { userId });
  return <span className={user?.isOnline ? 'bg-success' : 'bg-muted'} />;
}

// ✅ CORRECT - atom receives data as props
function StatusDot({ isOnline }: { isOnline: boolean }) {
  return (
    <span className={isOnline ? 'bg-success' : 'bg-muted-foreground/50'} />
  );
}
```

### Anti-Pattern 7: Arbitrary Values

```tsx
// ❌ NEVER do this
className = 'bg-[#8b5cf6] rounded-[13px] shadow-[0_4px_6px_rgba(0,0,0,0.1)]';

// ✅ Use tokens - if a value doesn't exist, add it to the token system
className = 'bg-primary rounded-card shadow-raised';
```
