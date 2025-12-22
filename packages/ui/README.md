# @groupi/ui

Shared UI components and utilities for the Groupi application.

## Overview

This package provides reusable UI components, utilities, and design tokens that can be used across the web application and future React Native mobile app.

## Architecture

### Package Structure

```
packages/ui/src/
├── core/               # Core utilities and tokens
│   ├── utils.ts        # Utility functions (cn, etc.)
│   └── tokens.ts       # Design tokens
├── web/                # Web-specific components (future)
└── email/              # Email template components (future)
```

### Key Responsibilities

1. **Design System**: Provides design tokens and utilities
2. **Shared Components**: Reusable UI components (when added)
3. **Utilities**: Helper functions like `cn()` for className merging
4. **Cross-platform**: Designed to work across web and mobile

### Data Flow

```
@groupi/ui (design tokens, utilities)
    ↓
@groupi/web (uses utilities in components)
    ↓
User Interface
```

### Integration Points

- **@groupi/web**: Imports utilities and components for use in React components
- **Future React Native App**: Will use same utilities and tokens

## Usage

### Utilities

```typescript
import { cn } from '@groupi/ui';

// Merge classNames with Tailwind merge
const className = cn('base-class', condition && 'conditional-class');
```

### Design Tokens

```typescript
import { tokens } from '@groupi/ui/core';

// Access design tokens
const primaryColor = tokens.colors.primary;
```

## Development

### Type Checking

```bash
pnpm type-check --filter=@groupi/ui
```

### Linting

```bash
pnpm lint --filter=@groupi/ui
```

## Current Status

The package currently provides:

- **Utilities**: `cn()` function for className merging
- **Design Tokens**: Foundation for design system

Future additions:

- Shared component library
- Web-specific components
- Email template components

## Best Practices

1. **Keep it simple**: Utilities should be lightweight and focused
2. **Cross-platform**: Consider React Native compatibility
3. **No dependencies**: Minimize external dependencies
4. **Type safety**: All exports should be properly typed
5. **Documentation**: Add JSDoc comments for public APIs
