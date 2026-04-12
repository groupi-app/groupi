# Mobile Component Rules

Rules for building UI components in the React Native mobile app.

## Component Library

The mobile app uses **React Native Reusables** (shadcn/ui for React Native) with **Uniwind** (Tailwind CSS for React Native).

### Adding Components

1. **Always check RN Reusables first**: Before building a custom component, check if it exists in [React Native Reusables](https://reactnativereusables.com/docs/components/). Install with:
   ```bash
   cd packages/mobile
   pnpm dlx @react-native-reusables/cli@latest add <component-name>
   ```

2. **Customize after adding**: Replace default Tailwind values with Groupi design tokens (see below).

3. **Export from index**: Add exports to `src/components/ui/index.ts`.

### Design Token Mapping

When adding or modifying components, always use Groupi semantic tokens:

| Replace | With | Context |
|---------|------|---------|
| `rounded-md`, `rounded-lg` | `rounded-button` | Buttons |
| `rounded-xl` | `rounded-card` | Cards |
| `rounded-md` | `rounded-input` | Inputs |
| `rounded-lg`, `rounded-2xl` | `rounded-modal` | Dialogs, sheets |
| `rounded-full` | `rounded-badge` | Badges, pills |
| `shadow-sm` | `shadow-raised` | Cards, buttons |
| `shadow-md` | `shadow-floating` | Dropdowns |
| `shadow-lg` | `shadow-overlay` | Modals |

### Third-Party Components

- **DO** wrap third-party components with `withUniwind()` for `className` support
- **DO NOT** wrap core React Native components (`View`, `Text`, `Pressable`, etc.) — they already support `className`
- Wrap once in a shared module, not per-file

### Styling Rules

- Use `className` for all styling — no `StyleSheet.create()`
- Use `cn()` from `@/lib/utils` when merging className props
- Use `useCSSVariable()` from `uniwind` for native props that need theme colors (tab bar, navigation headers)
- Never construct className dynamically: `bg-${color}` will NOT work
- Use complete string literals, ternaries, or mapping objects for dynamic styles

### Component Hierarchy

| Level | Location | Purpose |
|-------|----------|---------|
| UI | `components/ui/` | Base components (RN Reusables + custom) |
| Feature | `components/{domain}/` | Domain-specific (events, posts, etc.) |

See `packages/mobile/COMPONENTS.md` for the full guide.
