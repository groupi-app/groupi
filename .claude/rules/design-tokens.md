# Design Token Enforcement

Rules for working with Groupi's design token system and ensuring consistent styling.

## Table of Contents

- [Overview](#overview)
- [How Enforcement Works](#how-enforcement-works)
- [Running the Linter](#running-the-linter)
- [Token Reference](#token-reference)
- [Adding Exceptions](#adding-exceptions)
- [Common Migrations](#common-migrations)

## Overview

Groupi enforces a design token system to ensure visual consistency across the application. The system has two layers of enforcement:

1. **CSS-level**: Tailwind's default color palette, shadows, and other values are disabled
2. **Lint-level**: A custom linter warns about usage of non-token classes

## How Enforcement Works

### CSS-Level (Automatic)

Default Tailwind classes like `bg-red-500`, `shadow-lg`, `rounded-xl` are disabled in `_generated-tokens.css`. If you try to use them, they won't have any effect.

Disabled categories:

- Color palette (red, blue, green, gray, etc. with numeric values)
- Default shadows (shadow-sm, shadow-lg, etc.)
- Some border radius values (rounded-xl, rounded-2xl, etc.)
- Numeric z-index (z-10, z-20, etc.)

### Lint-Level (Manual Check)

Run `pnpm lint:tokens` to check for violations. This provides warnings but doesn't block builds (warn-only mode).

## Running the Linter

```bash
# From root
pnpm lint:tokens

# From packages/web
pnpm lint:tokens

# With suggestions for replacements
pnpm lint:tokens:suggestions
```

## Token Reference

### Colors

| Non-token (avoid) | Token (use instead)                               |
| ----------------- | ------------------------------------------------- |
| `bg-red-*`        | `bg-error`, `bg-error-subtle`, `bg-destructive`   |
| `bg-green-*`      | `bg-success`, `bg-success-subtle`                 |
| `bg-yellow-*`     | `bg-warning`, `bg-warning-subtle`                 |
| `bg-blue-*`       | `bg-info`, `bg-info-subtle`, `bg-brand-primary`   |
| `bg-gray-*`       | `bg-muted`, `bg-surface`, `bg-sunken`             |
| `text-red-*`      | `text-error`, `text-destructive`                  |
| `text-green-*`    | `text-success`                                    |
| `text-gray-*`     | `text-muted`, `text-secondary`, `text-tertiary`   |
| `border-gray-*`   | `border-border`, `border-subtle`, `border-strong` |

### Shadows

| Non-token (avoid) | Token (use instead) |
| ----------------- | ------------------- |
| `shadow-sm`       | `shadow-raised`     |
| `shadow`          | `shadow-raised`     |
| `shadow-md`       | `shadow-floating`   |
| `shadow-lg`       | `shadow-overlay`    |
| `shadow-xl`       | `shadow-popup`      |

### Border Radius

| Non-token (avoid) | Token (use instead)                   |
| ----------------- | ------------------------------------- |
| `rounded-xl`      | `rounded-card`, `rounded-rounded`     |
| `rounded-2xl`     | `rounded-modal`, `rounded-sheet`      |
| `rounded-3xl`     | `rounded-modal`                       |
| `rounded-sm`      | `rounded-sm` (kept), `rounded-subtle` |
| `rounded-md`      | `rounded-md` (kept), `rounded-input`  |
| `rounded-lg`      | `rounded-lg` (kept), `rounded-button` |

### Z-Index

| Non-token (avoid) | Token (use instead) |
| ----------------- | ------------------- |
| `z-10`            | `z-base`            |
| `z-20`            | `z-sticky`          |
| `z-30`            | `z-sticky`          |
| `z-40`            | `z-dropdown`        |
| `z-50`            | `z-popover`         |

Full z-index scale: `z-base`, `z-sticky`, `z-dropdown`, `z-popover`, `z-modal`, `z-toast`, `z-tooltip`, `z-overlay`

## Adding Exceptions

Exceptions can be added in `packages/web/scripts/lint-tokens.ts`:

```typescript
const EXCEPTIONS: Record<string, string[]> = {
  // Global exceptions (apply to all files)
  '*': [
    'bg-white',
    'bg-black',
    'text-white',
    'text-black',
    // Add more here
  ],

  // File-specific exceptions
  'components/legacy/OldComponent.tsx': ['bg-gray-100', 'text-gray-500'],
};
```

### When to Add Exceptions

- **Third-party integration**: External libraries that require specific classes
- **Legacy code**: Gradual migration - add exception, create ticket to fix later
- **Special cases**: One-off styling needs with documented reasoning

## Common Migrations

### Error States

```tsx
// Before
<div className="bg-red-100 text-red-600 border-red-300">

// After
<div className="bg-error-subtle text-error border-error">
```

### Success States

```tsx
// Before
<div className="bg-green-100 text-green-600">

// After
<div className="bg-success-subtle text-success">
```

### Muted/Gray Backgrounds

```tsx
// Before
<div className="bg-gray-100 text-gray-500">

// After
<div className="bg-muted text-muted-foreground">
// Or for more specific semantics:
<div className="bg-surface text-secondary">
```

### Shadows

```tsx
// Before
<Card className="shadow-md">

// After
<Card className="shadow-floating">
```

### Z-Index for Overlays

```tsx
// Before
<div className="fixed z-50">

// After
<div className="fixed z-popover">
// Or for modals:
<div className="fixed z-modal">
```

## Best Practices

1. **Check before adding new styles**: Run `pnpm lint:tokens` after adding Tailwind classes
2. **Use semantic tokens**: Choose tokens that describe purpose, not appearance
3. **Document exceptions**: When adding exceptions, add a comment explaining why
4. **Migrate gradually**: Don't block on fixing all 200+ violations at once
5. **New code should use tokens**: Enforce strictly on new components
