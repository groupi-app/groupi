# Groupi 🎉

A modern, cross-platform event planning and group coordination application built with **Convex**, **Next.js**, and **React Native**.

## ✨ Overview

Groupi is a real-time, cross-platform application for organizing events, managing group memberships, and facilitating seamless communication. Built with a **client-only architecture** powered by Convex for lightning-fast real-time synchronization across web and mobile.

### 🚀 Key Features

- **📅 Event Management**: Create and coordinate events with real-time updates
- **👥 Group Coordination**: Manage memberships, roles, and permissions
- **💬 Real-time Communication**: Posts, replies, and notifications with instant sync
- **📱 Cross-Platform**: Single codebase for **Web** (Next.js) and **Mobile** (React Native + Expo)
- **⚡ Real-time First**: All data syncs instantly across devices via Convex
- **🎨 Beautiful UI**: Consistent design system with Tailwind CSS and Radix UI

## 🏗️ Architecture

**Modern Client-Only Architecture** with cross-platform business logic:

```
groupi/
├── packages/
│   ├── web/              # Next.js web application (client-only)
│   ├── mobile/           # React Native + Expo mobile app
│   └── shared/           # Cross-platform business logic & hooks
├── convex/               # Convex backend (real-time database)
└── groupi.code-workspace # VS Code workspace configuration
```

### 🔄 Data Flow

1. **Convex Backend** - Real-time database with built-in auth and subscriptions
2. **Shared Package** - Platform-agnostic business logic hooks
3. **Platform Adapters** - Navigation, storage, and UI abstractions
4. **Apps** - Web (Next.js) and Mobile (React Native) consume shared logic

### 🎯 Benefits

- ⚡ **Real-time Everything**: No manual cache invalidation needed
- 📱 **True Cross-Platform**: 95% code reuse between web and mobile
- 🚀 **Fast Development**: Client-only with hot reload everywhere
- 🔒 **Type Safety**: End-to-end TypeScript with auto-generated types
- 🎨 **Consistent UX**: Shared business logic, platform-specific UI

## 🛠️ Development

### Prerequisites

- **Node.js** 18+
- **pnpm** 10.12.1+
- **Convex CLI** (`npm install -g convex`)
- **Expo CLI** for mobile development (`npm install -g @expo/cli`)

### 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Start Convex development server
pnpm convex:dev

# In another terminal - start web development
pnpm dev

# Optional: Start mobile development
pnpm dev:mobile

# Or start both web and mobile together
pnpm dev:full
```

This starts:
- **Web App**: http://localhost:3000
- **Mobile App**: Expo dev tools (scan QR code with Expo Go)
- **Convex Dashboard**: Real-time database admin
- **Hot Reload**: Instant updates across all platforms

### 📋 Development Scripts

```bash
# 🚀 Development
pnpm dev              # Web app only
pnpm dev:mobile       # Mobile app only
pnpm dev:full         # Both web and mobile (recommended)
pnpm convex:dev       # Convex backend

# 🏗️ Building
pnpm build            # Build all apps
pnpm build:web        # Web app only
pnpm build:mobile     # Mobile app only

# ✅ Code Quality
pnpm check            # Run all checks (lint + type + format)
pnpm lint             # Lint all packages
pnpm lint:fix         # Fix linting issues
pnpm format           # Format code with Prettier
pnpm type-check       # TypeScript check all packages

# 🧹 Maintenance
pnpm clean            # Clean all build artifacts
pnpm clean:deps       # Clean and reinstall all dependencies

# ⚡ Convex
pnpm convex:dev       # Start Convex development server
pnpm convex:deploy    # Deploy to production
```

### 💡 Development Tips

1. **Open Workspace**: Use `groupi.code-workspace` in VS Code for best experience
2. **Real-time Debugging**: Use Convex Dashboard to see data changes in real-time
3. **Cross-Platform Testing**: Use `pnpm dev:full` to test both platforms simultaneously
4. **Shared Logic**: All business logic lives in `packages/shared/` - no duplication!

## 📱 Cross-Platform Development

### Shared Business Logic

All core functionality is in `packages/shared/`:

```typescript
// Platform-agnostic hooks
import { createEventHooks, createAuthHooks } from '@groupi/shared/hooks';

// Cross-platform utilities
import { formatDate, validateEmail } from '@groupi/shared';

// Platform abstractions
import { navigation, storage, toast } from '@groupi/shared/platform';
```

### Platform-Specific Implementation

**Web App** (Next.js):
```typescript
// Uses Next.js router, localStorage, Sonner
setupWebPlatformAdapters();
const { useCurrentUser } = createAuthHooks(api);
```

**Mobile App** (React Native):
```typescript
// Uses React Navigation, Expo SecureStore, React Native Toast
setupMobilePlatformAdapters();
const { useCurrentUser } = createAuthHooks(api);  // Same hook!
```

## 📚 Tech Stack

### Core
- **Backend**: [Convex](https://convex.dev/) - Real-time database with built-in auth
- **Web**: [Next.js 16](https://nextjs.org/) with App Router (client-only)
- **Mobile**: [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/)
- **Language**: [TypeScript](https://typescriptlang.org/) with strict mode
- **Monorepo**: [Turborepo](https://turbo.build/) with pnpm workspaces

### UI & Styling
- **Web UI**: [Radix UI](https://radix-ui.com/) + [Tailwind CSS](https://tailwindcss.com/)
- **Mobile UI**: [Uniwind](https://uniwind.dev/) (Tailwind for React Native)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Animations**: [Framer Motion](https://framer.com/motion/)

### Development
- **Package Manager**: [pnpm](https://pnpm.io/) with workspaces
- **Linting**: [ESLint](https://eslint.org/) + [Prettier](https://prettier.io/)
- **Git Hooks**: [Husky](https://typicode.github.io/husky/) + [lint-staged](https://github.com/okonet/lint-staged)
- **VS Code**: Configured workspace with recommended extensions

## 📂 Project Structure

### Apps
- **[`packages/web/`](./packages/web/)** - Next.js web application (client-only)
- **[`packages/mobile/`](./packages/mobile/)** - React Native mobile app with Expo

### Packages
- **[`packages/shared/`](./packages/shared/)** - Cross-platform business logic
- **[`packages/ui/`](./packages/ui/)** - Shared UI components and utilities

### Backend
- **[`convex/`](./convex/)** - Convex backend functions and schema

## 🚀 Deployment

### Web App (Vercel)
```bash
# Build and deploy web app
pnpm build:web
# Deploy to Vercel (configured in project)
```

### Mobile App (Expo + App Stores)
```bash
# Build for App Store / Play Store
cd packages/mobile
pnpm build:ios
pnpm build:android
```

### Convex Backend
```bash
# Deploy backend
pnpm convex:deploy
```

## 🤝 Contributing

1. **Clone & Setup**:
   ```bash
   git clone <repo>
   pnpm install
   ```

2. **Start Development**:
   ```bash
   pnpm convex:dev    # Terminal 1
   pnpm dev:full      # Terminal 2
   ```

3. **Make Changes**:
   - Business logic → `packages/shared/`
   - Web UI → `packages/web/`
   - Mobile UI → `packages/mobile/`
   - Backend → `convex/`

4. **Test & Submit**:
   ```bash
   pnpm check        # Lint, type, format
   git commit -m "feat: your changes"
   ```

## 📖 Learn More

- **[Convex Docs](https://docs.convex.dev/)** - Real-time database
- **[Next.js Docs](https://nextjs.org/docs)** - Web app framework
- **[React Native Docs](https://reactnative.dev/docs/getting-started)** - Mobile development
- **[Expo Docs](https://docs.expo.dev/)** - Mobile app platform

---

Built with ❤️ by the Groupi team