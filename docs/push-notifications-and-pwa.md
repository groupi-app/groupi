# Push Notifications & PWA Guide

A comprehensive guide to understanding how push notifications and Progressive Web App (PWA) functionality work in Groupi.

## 🎯 Overview

This document will focus on:

1. **Push Notifications**: Real-time notifications using Pusher Beams (works across all devices)
2. **PWA Installation**: Users can install the app on their devices like a native app

## 🔄 How Push Notifications Work

### The Big Picture

```
User enables notifications → Device registers with Pusher Beams → Server sends notifications → User receives them
```

### Step-by-Step Flow

1. **User visits Settings → Notifications**
2. **User toggles "Push Notifications" switch**
3. **Browser requests permission** (native browser popup)
4. **Device registers with Pusher Beams** (our push service provider)
5. **User ID gets linked to device** (so we know who to send notifications to)
6. **Server sends notifications** via Pusher Beams API
7. **User receives notifications** even when app is closed

### Key Components

#### `lib/pusher-notifications.ts` - The Brain 🧠

This is the main hook that manages everything:

- Detects if the browser supports push notifications
- Registers/unregisters devices with Pusher Beams
- Handles multiple users on the same device (with warnings)
- Maintains connection state across page refreshes

#### `components/global-push-notifications.tsx` - Auto-Restore 🔄

This component runs on every page to automatically restore push notification subscriptions when users refresh or navigate. It's invisible but essential.

#### `components/push-notification-settings.tsx` - The UI 🎛️

The settings panel where users can enable/disable push notifications. Shows warnings when another user has notifications enabled on the same device.

#### `components/providers/pusher-beams-context-provider.tsx` - State Management 📊

React context that shares push notification state across the entire app. Prevents duplicate connections and ensures consistency.

## 🏠 PWA (Progressive Web App) - Installation

### The Big Picture

```
User visits app → Browser evaluates PWA criteria → Browser shows install prompt → User installs → App works like native app
```

### How It Works

- **Automatic**: Modern browsers automatically detect when your app qualifies as a PWA
- **Native prompts**: Browsers show their own install UI (we don't need custom install buttons)
- **Cross-platform**: Works on desktop, mobile, iOS, Android

### Key Components

#### `app/manifest.ts` - App Metadata 📱

Tells browsers about your app:

- Name: "Groupi"
- Icons: Various sizes for different devices
- Display mode: "standalone" (looks like a native app)
- Start URL: Where the app opens when launched

#### `components/pwa-registration.tsx` - Service Worker Setup ⚙️

Registers the service worker that's required for both push notifications AND PWA functionality.

#### `public/service-worker.js` - Background Worker 🔧

Runs in the background to:

- Handle push notifications from Pusher Beams
- Enable PWA installation
- Provide basic caching for better performance

## 🚀 Multi-User Device Handling

### The Problem

What happens when User A enables notifications, then User B logs in on the same device?

### Our Solution (Respectful Approach)

1. **Don't automatically clear** User A's subscription
2. **Show User B a warning**: "Another user has notifications enabled on this device"
3. **Let User B choose**: They can override User A's subscription if they want
4. **Clear explanation**: User B knows exactly what will happen

### Why This Matters

- **Privacy**: We don't silently disable someone else's notifications
- **Transparency**: Users understand what's happening
- **Flexibility**: Users can make informed decisions

## 🔍 Code Architecture

### Directory Structure

```
lib/
  pusher-notifications.ts     # Core push notification logic
  logger.ts                   # Structured logging

components/
  global-push-notifications.tsx           # Auto-restore functionality
  push-notification-settings.tsx          # Settings UI
  pwa-registration.tsx                     # Service worker registration

  providers/
    pusher-beams-context-provider.tsx     # React context for state

app/
  layout.tsx                  # Wraps app with providers
  manifest.ts                 # PWA manifest
  viewport.ts                 # PWA-friendly viewport

public/
  service-worker.js           # Background worker for push + PWA
```

### Data Flow

```
User Action (Settings)
    ↓
PushNotificationSettings Component
    ↓
usePusherBeams Hook
    ↓
Pusher Beams Client
    ↓
Service Worker
    ↓
Push Notification Received
```

### State Management

- **React Context**: Shares state across components
- **Local State**: Each hook manages its own state
- **Persistent**: Subscriptions survive page refreshes
- **Global**: Works on all pages without setup

## 🧪 Testing the System

### Push Notifications Test Flow

1. Open **Settings → Notifications**
2. Toggle "Push Notifications" ON
3. Check browser console for success logs
4. Open a new tab → notifications should still be enabled
5. Test notifications by triggering an event (invite, RSVP, etc.)

### PWA Installation Test Flow

1. Visit the app in a modern browser (Chrome, Edge, Safari)
2. Use the app for a bit (browsers require "user engagement")
3. Look for install prompts:
   - **Chrome/Edge**: Install icon in address bar
   - **iOS Safari**: "Add to Home Screen" in share menu
   - **Android**: Native install prompt
4. Install and launch from home screen

### Multi-User Test Flow

1. User A enables notifications
2. Log out, log in as User B
3. Go to Settings → Notifications
4. Should see yellow warning about User A
5. Enable notifications as User B
6. Should override User A's subscription

## 🛠️ For Developers

### Adding New Notification Types

1. **Server-side**: Add new notification logic in `lib/actions/notification.ts`
2. **Send via Pusher Beams**: Use existing `sendPusherBeamsNotification` function
3. **Client automatically receives**: No client-side changes needed

### Debugging Push Notifications

- Check browser console for structured logs (using pino)
- Verify service worker is registered: DevTools → Application → Service Workers
- Test Pusher Beams connection: Look for "Pusher Beams started successfully" logs

### Debugging PWA Installation

- **Chrome DevTools**: Application → Manifest (check for errors)
- **PWA Criteria**: Application → Service Workers (must be registered)
- **Install Prompt**: Only appears when all criteria are met + user engagement

## 🔧 Configuration

### Environment Variables

```env
NEXT_PUBLIC_PUSHER_BEAMS_INSTANCE_ID=your_pusher_beams_instance_id
```

### Pusher Beams Setup

1. Create account at pusher.com
2. Create Beams instance
3. Configure authentication endpoint: `/api/pusher/beams-auth`
4. Add instance ID to environment variables

## ❓ Common Issues

### Push Notifications Not Working

- **Check browser support**: Safari on iOS requires iOS 16.4+
- **Verify HTTPS**: Required for production (localhost is OK for dev)
- **Check permissions**: User must grant notification permission
- **Service worker**: Must be registered and active

### PWA Install Prompt Not Showing

- **Use the app**: Browsers require user engagement before showing prompts
- **Check manifest**: No errors in browser DevTools
- **Service worker**: Must be registered
- **HTTPS**: Required (except localhost)

### Multiple Users Issues

- **Expected behavior**: System warns before overriding subscriptions
- **Not a bug**: One device can only have one active push subscription
- **Clear explanation**: Users see warnings before making changes

## 🎉 Success Indicators

When everything is working correctly:

- ✅ Users can enable/disable push notifications in settings
- ✅ Notifications persist across page refreshes and browser sessions
- ✅ Multiple users get clear warnings and can make informed choices
- ✅ Browsers automatically offer PWA installation when appropriate
- ✅ Installed PWA works like a native app with proper icons and standalone mode

## 🔧 Technical Features

### Push Notification Support

- **Pusher Beams Integration**: Uses Pusher Beams for cross-platform push notifications
- **Service Worker Registration**: Essential for both push notifications and PWA functionality
- **Browser Support Detection**: Comprehensive detection of push notification capabilities

### PWA Infrastructure (Simplified)

- **Native Install Prompts**: Browsers handle installation automatically when criteria are met
- **No Custom Install Logic**: Removed complex `beforeinstallprompt` handling for better compatibility
- **Essential Components Only**: Minimal setup with maximum compatibility

### Browser Support Detection

```typescript
const isSupported =
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window;
```

### Lazy Client Initialization

- Client only creates when actually needed
- Prevents unnecessary device registrations
- Proper error handling and state management

### Multi-User Conflict Detection

```typescript
const existingUserId = await client.getUserId();
if (existingUserId && existingUserId !== user.id) {
  // Show warning, don't auto-clear
  setState(prev => ({
    hasOtherUserSubscription: true,
    otherUserId: existingUserId,
    // ...
  }));
}
```

### Graceful Override Handling

```typescript
if (existingUserId && existingUserId !== user.id) {
  await client.clearAllState(); // Clear before setting new user
}
```

## 🧪 Testing Scenarios

### Push Notification Scenarios

### Scenario 1: Fresh Device

1. ✅ User visits app → No existing subscription detected
2. ✅ User enables notifications → Successfully registers device
3. ✅ User refreshes page → Subscription automatically restored

### Scenario 2: Device with Another User

1. ✅ User A has notifications enabled
2. ✅ User B logs in → Warning displayed about User A's subscription
3. ✅ User B enables notifications → Overrides User A's subscription
4. ✅ User B refreshes → Their subscription is restored

### Scenario 3: Multi-Session Handling

1. ✅ User enables notifications in one tab
2. ✅ User opens new tab → Notifications work in both tabs
3. ✅ User disables in one tab → Disabled across all tabs

### PWA Installation Scenarios

### Scenario 4: Native PWA Installation

1. ✅ User visits app on supported browser → Browser evaluates PWA criteria
2. ✅ Criteria met → Browser automatically shows native install prompt (when appropriate)
3. ✅ User installs → App appears on home screen/app drawer
4. ✅ User launches from home screen → App opens in standalone mode

### Scenario 5: Cross-Platform PWA Support

1. ✅ Chrome/Edge → Native install prompt appears in address bar
2. ✅ iOS Safari → Manual "Add to Home Screen" option available
3. ✅ All platforms → No custom install buttons needed

## 🚀 Usage

### Push Notifications

1. Navigate to **Settings > Notifications**
2. Toggle "Push Notifications" switch
3. If another user has notifications on the device, a warning will appear
4. Enabling will override the existing user's subscription
5. Notifications will persist across page refreshes and browser sessions

### PWA Installation

1. **Automatic**: Browsers will show native install prompts when ready
2. **Manual (iOS)**: Use Safari's "Add to Home Screen" option
3. **No custom buttons needed**: Let browsers handle the UX they're designed for

### For Developers

```typescript
// Access push notification state anywhere in the app
const {
  isSupported,
  isSubscribed,
  hasOtherUserSubscription,
  subscribe,
  unsubscribe,
} = usePusherBeams();
```

## 🔍 Logging

All push notification events are now logged with pino:

- Device initialization attempts
- User ID changes and conflicts
- Subscription enable/disable events
- Error conditions with full context

View logs in development with pretty formatting:

```bash
npm run dev
```

## ⚡ Key Benefits

### Push Notifications

1. **Privacy-First**: Only initializes when needed
2. **Multi-User Friendly**: Respectful of existing subscriptions with clear warnings
3. **Persistent**: Automatically restores across page refreshes
4. **Global**: Works on all pages without manual setup
5. **Robust Error Handling**: Comprehensive error states and user feedback

### PWA Implementation

1. **Modern Best Practices**: Follows Next.js and browser recommendations
2. **Cross-Platform**: Works consistently across all platforms and browsers
3. **Native UX**: Browsers provide the install experience they're designed for
4. **Simplified Maintenance**: No complex custom installation logic to maintain
5. **Future-Proof**: Relies on web standards rather than experimental APIs

### Technical Excellence

1. **Structured Logging**: Professional logging with pino integration
2. **Type Safe**: Full TypeScript support with comprehensive interfaces
3. **Minimal Dependencies**: Lean implementation focused on essential functionality

## 🔧 Architecture Decisions

### Push Notifications

- **Lazy Initialization**: Prevents unnecessary device registrations
- **Context Provider**: Single source of truth for state management
- **Global Component**: Ensures notifications work app-wide
- **Warning System**: User-friendly multi-user handling
- **Pino Logging**: Professional, structured logging for debugging and monitoring

### PWA Implementation

- **Native-First Approach**: Removed custom installation logic in favor of browser-native prompts
- **Essential Infrastructure Only**: Kept only the minimal components needed for PWA functionality
- **Standards-Based**: Relies on web standards (manifest, service worker) rather than experimental APIs
- **Cross-Platform Compatibility**: Works consistently across all browsers and platforms

## 📁 Key Files

### Push Notifications

- `lib/pusher-notifications.ts` - Core push notification hook with multi-user handling
- `components/global-push-notifications.tsx` - Global restoration component
- `components/providers/pusher-beams-context-provider.tsx` - Context provider for shared state
- `components/push-notification-settings.tsx` - Settings UI with multi-user warnings

### PWA Infrastructure

- `components/pwa-registration.tsx` - Service worker registration (essential for both push notifications and PWA)
- `app/manifest.ts` - PWA manifest for native browser install prompts
- `public/service-worker.js` - Service worker with Pusher Beams integration
- `app/viewport.ts` - PWA-friendly viewport configuration

### Removed Files (Cleaned Up)

- ~~`components/pwa-test.tsx`~~ - Custom PWA test component (unnecessary)
- ~~`components/pwa-install-button.tsx`~~ - Custom install button (replaced by native browser prompts)
- ~~`lib/hooks/use-pwa.ts`~~ - Custom PWA installation hook (unnecessary)
- ~~`lib/hooks/use-pwa-test.ts`~~ - PWA testing utilities (unnecessary)
- ~~`lib/pwa-utils.ts`~~ - PWA utility functions (redundant with Pusher Beams integration)
