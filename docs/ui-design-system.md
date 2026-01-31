# Groupi UI Design System

Comprehensive guide to the Groupi design system, including design tokens, component architecture, and best practices for building consistent, maintainable UI.

## Table of Contents

- [Overview](#overview)
- [Design Tokens](#design-tokens)
- [Atomic Component Architecture](#atomic-component-architecture)
- [Token Categories](#token-categories)
- [Building New Components](#building-new-components)
- [Building New Pages](#building-new-pages)
- [Tailwind Integration](#tailwind-integration)
- [Token Enforcement](#token-enforcement)
- [Best Practices](#best-practices)
- [Quick Reference](#quick-reference)

## Overview

The Groupi UI is built on three foundational pillars:

1. **Design Tokens**: A three-layer token system (Primitives → Semantic → Component) that ensures visual consistency
2. **Atomic Architecture**: Components organized by complexity (Atoms → Molecules → Organisms → Templates)
3. **shadcn/ui Foundation**: Base components from shadcn/ui, customized with our design tokens

### Design Philosophy

Inspired by Duolingo's fun-first aesthetic:

- **Dramatically rounded corners** - Buttons, cards, and modals use generous border radii
- **Bouncy animations** - Playful easing functions for micro-interactions
- **Semantic colors** - Purpose-driven color choices, not arbitrary values
- **Dark mode first** - Full dark mode support with automatic switching

## Design Tokens

### Three-Layer Token System

```
┌─────────────────────────────────────────────────────────────┐
│ LAYER 3: Component Tokens                                    │
│ Component-specific values (button.radius, card.padding)      │
├─────────────────────────────────────────────────────────────┤
│ LAYER 2: Semantic Tokens                                     │
│ Purpose-based values (bg-success, text-error, shadow-raised) │
├─────────────────────────────────────────────────────────────┤
│ LAYER 1: Primitives                                          │
│ Raw values (purple.700, spacing.4, fontSize.base)            │
│ ⚠️ Never use directly in components                          │
└─────────────────────────────────────────────────────────────┘
```

### Source of Truth

| File                                                | Purpose                                |
| --------------------------------------------------- | -------------------------------------- |
| `packages/shared/src/design/tokens.ts`              | Token definitions and TypeScript types |
| `packages/shared/src/design/themes/groupi-light.ts` | Light theme values                     |
| `packages/shared/src/design/themes/groupi-dark.ts`  | Dark theme values                      |
| `packages/web/scripts/generate-tokens.ts`           | Generates CSS from themes              |
| `packages/web/styles/_generated-tokens.css`         | Auto-generated Tailwind CSS            |

### Regenerating Tokens

After modifying theme files, regenerate the CSS tokens:

```bash
pnpm generate:tokens
```

This updates `_generated-tokens.css` with all CSS custom properties.

## Atomic Component Architecture

Components are organized by complexity level:

### Atoms (`components/atoms/`)

The smallest, most fundamental UI elements. Cannot be broken down further.

**Examples:**

- `PresenceIndicator` - Online status dot
- `UnreadIndicator` - Unread message badge

**Characteristics:**

- Single responsibility
- No dependencies on other custom components
- May use shadcn/ui primitives
- Pure presentation, no business logic

### Molecules (`components/molecules/`)

Simple combinations of atoms that form reusable UI patterns.

**Examples:**

- `UserInfoCard` - Avatar + name + email
- `RsvpStatus` - Icon + status text
- `RoleBadge` - Role icon + formatted label
- `TimestampBadge` - Relative time display
- `ConfirmationDialog` - Standard confirmation modal
- `EmptyState` - Empty content placeholder
- `LoadingState` - Loading indicator with message

**Characteristics:**

- Compose 2-3 atoms
- Reusable across features
- May accept data props
- Minimal business logic

### Organisms (`components/organisms/`)

Complex components made of molecules and atoms that form distinct UI sections.

**Examples:**

- `PostCard` - Complete post preview
- `MemberIcon` - Avatar with presence, dropdown menu
- `NotificationSlate` - Full notification item
- `ProfileSlate` - User profile card

**Characteristics:**

- Feature-specific
- May contain business logic
- Often connected to data (Convex queries)
- Compose multiple molecules

### Templates (`components/templates/`)

Page-level layout components that define structure without specific content.

**Available Templates:**

| Template               | Use Case                               |
| ---------------------- | -------------------------------------- |
| `ListPageTemplate`     | Pages displaying lists (events, posts) |
| `DetailPageTemplate`   | Single item detail pages               |
| `FormPageTemplate`     | Form-heavy pages (create, edit)        |
| `SettingsPageTemplate` | Settings/preferences pages             |
| `ErrorPageTemplate`    | Error states and 404 pages             |

**Characteristics:**

- Define page layout structure
- Accept children for content areas
- Handle responsive layouts
- No data fetching

### UI Components (`components/ui/`)

shadcn/ui base components customized with our design tokens.

**Examples:** Button, Card, Dialog, Input, Avatar, Badge, Alert, Dropdown, etc.

These are the building blocks used by all atomic levels.

## Token Categories

### Colors

**Status Colors** (use for semantic meaning):

```tsx
// Background variants
className = 'bg-success'; // Green - positive actions, online
className = 'bg-warning'; // Orange - caution, maybe
className = 'bg-error'; // Red - errors, destructive
className = 'bg-info'; // Blue - informational

// Subtle backgrounds (for containers)
className = 'bg-bg-success-subtle';
className = 'bg-bg-error-subtle';

// Text variants
className = 'text-success'; // Green text
className = 'text-warning'; // Orange text
className = 'text-error'; // Red text

// Border variants
className = 'border-border-success';
className = 'border-border-error';
```

**Brand Colors**:

```tsx
className = 'bg-primary'; // Purple - primary actions
className = 'bg-brand-primary'; // Same, explicit naming
className = 'text-primary'; // Purple text
className = 'bg-secondary'; // Secondary actions
```

**Surface Colors**:

```tsx
className = 'bg-background'; // Page background
className = 'bg-card'; // Card surfaces
className = 'bg-muted'; // Muted backgrounds
className = 'bg-bg-elevated'; // Elevated surfaces
className = 'bg-bg-sunken'; // Recessed areas
className = 'bg-bg-interactive'; // Interactive elements
```

**Text Colors**:

```tsx
className = 'text-foreground'; // Primary text
className = 'text-muted-foreground'; // Secondary text
className = 'text-text-tertiary'; // Tertiary text
className = 'text-text-disabled'; // Disabled state
```

### Border Radius

**Semantic radius tokens** (Duolingo-inspired, dramatically rounded):

```tsx
className = 'rounded-button'; // 16px - very rounded buttons
className = 'rounded-card'; // 20px - friendly cards
className = 'rounded-input'; // 12px - rounded inputs
className = 'rounded-modal'; // 24px - soft modals
className = 'rounded-badge'; // Pill shape
className = 'rounded-avatar'; // Circular
className = 'rounded-tooltip'; // 12px
className = 'rounded-dropdown'; // 16px
className = 'rounded-sheet'; // 24px - bottom sheets
```

### Shadows

**Elevation system**:

```tsx
className = 'shadow-raised'; // Cards, buttons (subtle)
className = 'shadow-floating'; // Dropdowns, popovers
className = 'shadow-overlay'; // Modals, sheets
className = 'shadow-popup'; // Tooltips, toasts
```

**Fun shadows**:

```tsx
className = 'shadow-pop'; // Playful depth effect
className = 'shadow-glow'; // Colored glow
className = 'shadow-bounce'; // Active state
```

### Z-Index

**Local stacking** (within components):

```tsx
className = 'z-lifted'; // 1 - slightly above siblings
className = 'z-float'; // 2 - floating above local content
className = 'z-top'; // 3 - topmost in local context
```

**Global stacking** (overlays, fixed elements):

```tsx
className = 'z-sticky'; // 40 - sticky headers
className = 'z-popover'; // 50 - popovers
className = 'z-dropdown'; // 60 - dropdowns
className = 'z-modal'; // 70 - modals
className = 'z-toast'; // 80 - toast notifications
className = 'z-tooltip'; // 90 - tooltips
className = 'z-overlay'; // 100 - full overlays
```

### Animation

**Duration tokens**:

```tsx
className = 'duration-instant'; // 0ms
className = 'duration-micro'; // 100ms
className = 'duration-fast'; // 150ms
className = 'duration-normal'; // 200ms
className = 'duration-slow'; // 300ms
className = 'duration-slower'; // 500ms
```

**Easing tokens**:

```tsx
className = 'ease-default'; // Standard ease
className = 'ease-enter'; // Enter animations
className = 'ease-exit'; // Exit animations
className = 'ease-bounce'; // Bouncy (Duolingo-style)
className = 'ease-spring'; // Spring effect
```

## Building New Components

### Step 1: Determine Component Level

Ask yourself:

- Is it a single, indivisible element? → **Atom**
- Does it combine 2-3 atoms? → **Molecule**
- Is it a complex, feature-specific section? → **Organism**
- Does it define page layout? → **Template**

### Step 2: Create the Component

**Atom Example:**

```tsx
// components/atoms/status-dot.tsx
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

**Molecule Example:**

```tsx
// components/molecules/user-status.tsx
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { StatusDot } from '@/components/atoms';

interface UserStatusProps {
  name: string;
  image?: string;
  status: 'online' | 'offline' | 'away';
}

export function UserStatus({ name, image, status }: UserStatusProps) {
  return (
    <div className='flex items-center gap-2'>
      <div className='relative'>
        <Avatar>
          <AvatarImage src={image} />
          <AvatarFallback>{name[0]}</AvatarFallback>
        </Avatar>
        <StatusDot
          status={status}
          size='sm'
          className='absolute bottom-0 right-0 border-2 border-background'
        />
      </div>
      <span className='text-sm font-medium'>{name}</span>
    </div>
  );
}
```

### Step 3: Export from Index

Add to the appropriate index file:

```tsx
// components/atoms/index.ts
export * from './status-dot';

// components/molecules/index.ts
export * from './user-status';
```

### Step 4: Use Design Tokens

Always use semantic tokens, never hardcoded values:

```tsx
// ❌ Bad - hardcoded colors
className = 'bg-green-500 text-gray-700 rounded-xl shadow-lg';

// ✅ Good - semantic tokens
className = 'bg-success text-foreground rounded-card shadow-raised';
```

## Building New Pages

### Step 1: Choose a Template

```tsx
// app/(feature)/my-page/page.tsx
import { DetailPageTemplate } from '@/components/templates';

export default function MyPage() {
  return (
    <DetailPageTemplate
      title='Page Title'
      description='Optional description'
      backHref='/previous-page'
    >
      {/* Page content */}
    </DetailPageTemplate>
  );
}
```

### Step 2: Handle Loading States

With Convex, queries return `undefined` while loading:

```tsx
'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { LoadingState } from '@/components/molecules';

export function MyPageContent({ id }: { id: string }) {
  const data = useQuery(api.myFeature.queries.getData, { id });

  if (data === undefined) {
    return <LoadingState message='Loading...' />;
  }

  if (!data) {
    return <EmptyState title='Not found' />;
  }

  return <div>{/* Render data */}</div>;
}
```

### Step 3: Compose with Organisms

```tsx
import { PostCard } from '@/components/post-card';
import { EmptyState } from '@/components/molecules';

export function PostList({ posts }) {
  if (posts.length === 0) {
    return (
      <EmptyState title='No posts yet' description='Create your first post' />
    );
  }

  return (
    <div className='space-y-4'>
      {posts.map(post => (
        <PostCard key={post._id} post={post} />
      ))}
    </div>
  );
}
```

## Tailwind Integration

### Tailwind v4 Theme Configuration

Tokens are defined in `@theme` blocks in `_generated-tokens.css`:

```css
@theme inline {
  /* Color tokens */
  --color-success: var(--bg-success);
  --color-primary: var(--primary);

  /* Radius tokens */
  --radius-button: 1rem;
  --radius-card: 1.25rem;

  /* Shadow tokens */
  --shadow-raised: var(--shadow-raised);
  --shadow-floating: var(--shadow-floating);

  /* Z-index tokens */
  --z-index-lifted: 1;
  --z-index-modal: 70;
}
```

### How Tailwind Tokens Work

The `--color-{name}` pattern enables multiple utilities:

- `--color-success` → `bg-success`, `text-success`, `border-success`
- `--color-primary` → `bg-primary`, `text-primary`, `border-primary`

The `--radius-{name}` pattern enables radius utilities:

- `--radius-button` → `rounded-button`
- `--radius-card` → `rounded-card`

## Token Enforcement

### Linting for Token Violations

Run the token linter to find violations:

```bash
pnpm lint:tokens
```

This scans for:

- Hardcoded colors (`bg-red-500`, `text-blue-400`)
- Default shadows (`shadow-lg`, `shadow-md`)
- Numeric z-index (`z-50`, `z-[100]`)
- Default border radius (`rounded-xl`, `rounded-2xl`)
- Arbitrary values (`[color]`, `[#hex]`)

### Allowed Exceptions

Some classes are globally allowed:

- `bg-white`, `bg-black`, `text-white`, `text-black` (semantic)
- `bg-transparent`, `border-transparent`
- `shadow-none`, `rounded-none`, `rounded-full`, `z-0`

## Best Practices

### Do's

1. **Use semantic tokens** - Choose tokens by purpose, not by color

   ```tsx
   // ✅ "This indicates success"
   className = 'bg-success text-success';
   ```

2. **Compose from atoms up** - Build complex components from simpler ones

   ```tsx
   // ✅ Molecule uses atoms
   <StatusDot status='online' />
   ```

3. **Keep components focused** - Single responsibility per component

4. **Use templates for pages** - Consistent page layouts

5. **Handle all states** - Loading, empty, error states

### Don'ts

1. **Don't use hardcoded colors**

   ```tsx
   // ❌ Bad
   className = 'bg-purple-700 text-gray-500';
   ```

2. **Don't skip the hierarchy** - Don't use atoms in templates, use organisms

3. **Don't add business logic to atoms** - Keep them pure presentation

4. **Don't use arbitrary values**

   ```tsx
   // ❌ Bad
   className = 'bg-[#ff00ff] rounded-[13px]';
   ```

5. **Don't use numeric z-index directly**

   ```tsx
   // ❌ Bad
   className = 'z-50';

   // ✅ Good
   className = 'z-popover';
   ```

## Quick Reference

### Common Token Mappings

| Need              | Token                                               |
| ----------------- | --------------------------------------------------- |
| Primary button    | `bg-primary text-primary-foreground rounded-button` |
| Card container    | `bg-card rounded-card shadow-raised`                |
| Error message     | `text-error` or `bg-error-subtle text-error`        |
| Success indicator | `bg-success`                                        |
| Modal overlay     | `bg-bg-overlay z-modal`                             |
| Dropdown menu     | `rounded-dropdown shadow-floating z-dropdown`       |
| Tooltip           | `rounded-tooltip shadow-popup z-tooltip`            |
| Input field       | `rounded-input border-border`                       |

### Component Import Paths

```tsx
// Atoms
import { PresenceIndicator, UnreadIndicator } from '@/components/atoms';

// Molecules
import {
  UserInfoCard,
  RsvpStatus,
  EmptyState,
  LoadingState,
} from '@/components/molecules';

// Templates
import { DetailPageTemplate, ListPageTemplate } from '@/components/templates';

// UI (shadcn)
import { Button, Card, Dialog, Input } from '@/components/ui/...';
```

### Commands

```bash
pnpm generate:tokens  # Regenerate CSS tokens from theme files
pnpm lint:tokens      # Check for token violations
pnpm check            # Full validation (lint + types + format)
```
