# Mobile Component Guide

Guide for building and maintaining UI components in the Groupi mobile app.

## Table of Contents

- [Component Library](#component-library)
- [Design System Customization](#design-system-customization)
- [Customization Checklist](#customization-checklist)
- [Theming](#theming)
- [File Organization](#file-organization)

## Component Library

The mobile app uses [React Native Reusables](https://reactnativereusables.com), which follows shadcn/ui patterns for React Native. Components are located in `src/components/ui/` and follow the same patterns as the web app's shadcn components.

### Adding New Components

```bash
cd packages/mobile
pnpm dlx @react-native-reusables/cli@latest add <component-name>
```

After adding, customize the component to match the Groupi design system (see below).

### Available Components

| Component   | Web (shadcn)                 | Mobile (RN Reusables)        | Status     |
| ----------- | ---------------------------- | ---------------------------- | ---------- |
| Button      | `components/ui/button`       | `components/ui/button`       | Customized |
| Card        | `components/ui/card`         | `components/ui/card`         | Customized |
| Input       | `components/ui/input`        | `components/ui/input`        | Customized |
| Textarea    | `components/ui/textarea`     | `components/ui/textarea`     | Installed  |
| Avatar      | `components/ui/avatar`       | `components/ui/avatar`       | Installed  |
| Badge       | `components/ui/badge`        | `components/ui/badge`        | Customized |
| Skeleton    | `components/ui/skeleton`     | `components/ui/skeleton`     | Installed  |
| Dialog      | `components/ui/dialog`       | `components/ui/dialog`       | Customized |
| AlertDialog | `components/ui/alert-dialog` | `components/ui/alert-dialog` | Installed  |
| Select      | `components/ui/select`       | `components/ui/select`       | Installed  |
| Switch      | `components/ui/switch`       | `components/ui/switch`       | Installed  |
| Separator   | `components/ui/separator`    | `components/ui/separator`    | Installed  |
| Progress    | `components/ui/progress`     | `components/ui/progress`     | Installed  |
| Tabs        | `components/ui/tabs`         | `components/ui/tabs`         | Installed  |
| Text        | N/A (native)                 | `components/ui/text`         | Installed  |

### Custom Groupi Components

These are mobile-specific components not from RN Reusables:

| Component       | Purpose                                                  |
| --------------- | -------------------------------------------------------- |
| `SafeAreaView`  | `withUniwind`-wrapped SafeAreaView for className support |
| `EmptyState`    | Empty state placeholder with icon, title, action         |
| `SectionHeader` | Section title with count badge and action link           |
| `BackButton`    | Consistent back navigation button                        |

## Design System Customization

When adding or modifying components, apply these Groupi design tokens:

### Border Radius

Use semantic radius tokens instead of default Tailwind values:

| Default        | Groupi Token     | Usage                   |
| -------------- | ---------------- | ----------------------- |
| `rounded-md`   | `rounded-button` | Buttons                 |
| `rounded-xl`   | `rounded-card`   | Cards, containers       |
| `rounded-md`   | `rounded-input`  | Inputs, textareas       |
| `rounded-lg`   | `rounded-modal`  | Dialogs, modals, sheets |
| `rounded-full` | `rounded-badge`  | Badges, pills           |

### Shadows

| Default     | Groupi Token      | Usage           |
| ----------- | ----------------- | --------------- |
| `shadow-sm` | `shadow-raised`   | Filled actions  |
| `shadow-md` | `shadow-floating` | Dropdowns       |
| `shadow-lg` | `shadow-overlay`  | Modals, dialogs |

Ordinary `Card` surfaces use `shadow-none`. Apply raised or overlay treatments
only to the interaction or surface that calls for them.

### Status Colors

Use the existing badge variants, which pair a subtle status background with a
semantic foreground rather than assuming white text works in every theme:

| Variant   | Background             | Text                |
| --------- | ---------------------- | ------------------- |
| `success` | `bg-bg-success-subtle` | `text-text-success` |
| `warning` | `bg-bg-warning-subtle` | `text-text-warning` |
| `error`   | `bg-bg-error-subtle`   | `text-text-error`   |

### Third-Party Components

Components from `react-native-safe-area-context` and other third-party libraries need `withUniwind` to support `className`:

```tsx
import { withUniwind } from 'uniwind';
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context';

export const SafeAreaView = withUniwind(RNSafeAreaView);
```

Core React Native components (`View`, `Text`, `Pressable`, `ScrollView`, etc.) already support `className` through the configured Uniwind integration. Do not wrap them with `withUniwind`.

## Customization Checklist

When adding a new RN Reusables component:

1. Install: `pnpm dlx @react-native-reusables/cli@latest add <name>`
2. Replace default `rounded-*` classes with Groupi tokens (`rounded-button`, `rounded-card`, etc.)
3. Choose the appropriate shadow treatment: quiet cards use `shadow-none`, filled actions use `shadow-raised`, and overlays use `shadow-overlay`.
4. Add Groupi-specific variants if needed (success, warning, error for badges/alerts)
5. Export from `src/components/ui/index.ts`
6. Use `cn()` from `@/lib/utils` for class merging (already set up in RN Reusables components)

## Theming

All components automatically adapt to the active theme via CSS variables. The theme provider (`src/theme/theme-provider.tsx`) syncs with Uniwind using `Uniwind.setTheme()` and `Uniwind.updateCSSVariables()`.

Native components that don't use `className` (like React Navigation's tab bar) should use `useCSSVariable()` from Uniwind:

```tsx
import { useCSSVariable } from 'uniwind';

const primaryColor = useCSSVariable('--color-primary') as string;
```

## File Organization

```text
src/components/
  ui/           # Base components (RN Reusables + custom)
  atoms/        # Smallest elements (logo, indicators)
  events/       # Event-specific components
  posts/        # Post/reply components
  attachments/  # File upload/gallery components
  notifications/# Notification components
  profile/      # User profile components
  friends/      # Friend system components
  settings/     # Settings components
```
