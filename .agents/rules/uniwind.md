# Uniwind

Uniwind provides Tailwind CSS utility classes for React Native. Use the `uniwind` MCP server (`search_uniwind` tool) to look up documentation, API references, code examples, and implementation details when working on mobile styling.

## Docs

- [CSS Parser](https://docs.uniwind.dev/api/css.md): Write custom CSS classes alongside Tailwind in your React Native app
- [CSS Functions](https://docs.uniwind.dev/api/css-functions.md): Use CSS functions to create dynamic styles
- [Data Selectors](https://docs.uniwind.dev/api/data-selectors.md): Style components based on prop values using data-[...] variants
- [metro.config.js](https://docs.uniwind.dev/api/metro-config.md): Configure Uniwind in your Metro bundler for React Native
- [Platform Selectors](https://docs.uniwind.dev/api/platform-select.md): Apply platform-specific styles with built-in selectors for iOS, Android, Web, and TV platforms
- [Scoped Themes](https://docs.uniwind.dev/api/scoped-themes.md): Apply a different theme to a subtree with `ScopedTheme`
- [useCSSVariable](https://docs.uniwind.dev/api/use-css-variable.md): Access CSS variable values in JavaScript with automatic theme updates
- [useResolveClassNames](https://docs.uniwind.dev/api/use-resolve-class-names.md): Convert Tailwind class names to React Native style objects at runtime
- [useUniwind](https://docs.uniwind.dev/api/use-uniwind.md): React hook for accessing the current theme and reacting to theme changes
- [withUniwind](https://docs.uniwind.dev/api/with-uniwind.md): Add `className` support to any React Native component
- [Responsive Breakpoints](https://docs.uniwind.dev/breakpoints.md): Use Tailwind's responsive breakpoints to build adaptive layouts in React Native
- [Supported classNames](https://docs.uniwind.dev/class-names.md): Comprehensive guide to Tailwind class names supported in Uniwind
- [Quickstart](https://docs.uniwind.dev/quickstart.md): Start building with Uniwind in 3 minutes
- [Tailwind Basics](https://docs.uniwind.dev/tailwind-basics.md): Learn how to use Tailwind CSS classes effectively with Uniwind
- [Monorepos](https://docs.uniwind.dev/monorepos.md): Configure Uniwind to work seamlessly in monorepo setups
- [Migration from Nativewind](https://docs.uniwind.dev/migration-from-nativewind.md): Migrate your React Native app from Nativewind to Uniwind
- [FAQ](https://docs.uniwind.dev/faq.md): Frequently asked questions about Uniwind

## Components

- [ActivityIndicator](https://docs.uniwind.dev/components/activity-indicator.md)
- [Button](https://docs.uniwind.dev/components/button.md)
- [FlatList](https://docs.uniwind.dev/components/flat-list.md)
- [Image](https://docs.uniwind.dev/components/image.md)
- [ImageBackground](https://docs.uniwind.dev/components/image-background.md)
- [InputAccessoryView](https://docs.uniwind.dev/components/input-accessory-view.md)
- [KeyboardAvoidingView](https://docs.uniwind.dev/components/keyboard-avoiding-view.md)
- [Modal](https://docs.uniwind.dev/components/modal.md)
- [Pressable](https://docs.uniwind.dev/components/pressable.md)
- [RefreshControl](https://docs.uniwind.dev/components/refresh-control.md)
- [SafeAreaView](https://docs.uniwind.dev/components/safe-area-view.md)
- [ScrollView](https://docs.uniwind.dev/components/scroll-view.md)
- [SectionList](https://docs.uniwind.dev/components/section-list.md)
- [Switch](https://docs.uniwind.dev/components/switch.md)
- [Text](https://docs.uniwind.dev/components/text.md)
- [TextInput](https://docs.uniwind.dev/components/text-input.md)
- [TouchableHighlight](https://docs.uniwind.dev/components/touchable-highlight.md)
- [TouchableNativeFeedback](https://docs.uniwind.dev/components/touchable-native-feedback.md)
- [TouchableOpacity](https://docs.uniwind.dev/components/touchable-opacity.md)
- [TouchableWithoutFeedback](https://docs.uniwind.dev/components/touchable-without-feedback.md)
- [View](https://docs.uniwind.dev/components/view.md)
- [VirtualizedList](https://docs.uniwind.dev/components/virtualized-list.md)
- [Third-Party Components](https://docs.uniwind.dev/components/other-components.md)

## Theming

- [Theming Basics](https://docs.uniwind.dev/theming/basics.md): Learn how to use and manage themes in Uniwind
- [Custom Themes](https://docs.uniwind.dev/theming/custom-themes.md): Create and manage custom themes beyond light and dark
- [Global CSS](https://docs.uniwind.dev/theming/global-css.md): Configure global styles, themes, and CSS variables
- [Style Based on Themes](https://docs.uniwind.dev/theming/style-based-on-themes.md): Create theme-aware styles
- [updateCSSVariables](https://docs.uniwind.dev/theming/update-css-variables.md): Dynamically update CSS variables at runtime

## Pro Features

- [Native Insets](https://docs.uniwind.dev/pro/native-insets.md): Safe area insets injected automatically from C++
- [Reanimated Animations](https://docs.uniwind.dev/pro/reanimated-animations.md): Tailwind classNames for high-performance native animations
- [Shadow Tree Updates](https://docs.uniwind.dev/pro/shadow-tree-updates.md): Update any style prop with zero re-renders
- [Shadow Tree Diagnostics](https://docs.uniwind.dev/pro/shadow-tree-diagnostics.md): Debug and monitor Shadow Tree updates
- [Theme Transitions](https://docs.uniwind.dev/pro/theme-transitions.md): Smooth animated theme transitions

## Usage Rule

When working on `packages/mobile/` styling, use the `search_uniwind` MCP tool to look up Uniwind-specific APIs, supported class names, and component usage patterns before writing code.
