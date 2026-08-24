# Mobile E2E smoke suite

The initial Maestro suite intentionally covers deterministic, credential-free
behavior on both iOS and Android:

- Native app startup and authentication UI
- Invalid email validation without sending email
- Signed-out invite deep links and preserved sign-in routing
- Authentication guards for event creation, settings, and event details
- Recovery after native process termination

Run the suite against an installed local build and booted simulator/emulator:

```bash
pnpm --filter @groupi/mobile test:e2e:local
```

The local command requires Java 17+ and the official Maestro CLI. On macOS:

```bash
brew tap mobile-dev-inc/tap
brew install mobile-dev-inc/tap/maestro
```

Run the same flows through EAS Workflows:

```bash
pnpm --filter @groupi/mobile test:e2e
```

## Authenticated event and post flow

The authenticated flow creates a unique user, session, event, membership, and
post in an isolated preview Convex deployment. It signs in through a five-minute
one-time code and deletes the fixture from `onFlowComplete`, including when the
UI portion fails.

Never point this flow at production. For local use, copy the example and fill in
preview-only values:

```bash
cp packages/mobile/.env.e2e.example packages/mobile/.env.e2e.local
```

The same `E2E_FIXTURE_KEY` (at least 32 random characters) must be configured on
the preview Convex deployment together with `E2E_TESTING=true`. The preview web
and mobile builds must use that deployment. Build and run locally with:

```bash
pnpm --filter @groupi/mobile ios:test:e2e
pnpm --filter @groupi/mobile test:e2e:authenticated
```

Both commands refuse URLs that match the normal mobile `.env.local` services.
The credential-free smoke suite remains the default local command.

For EAS preview jobs, configure:

- `EXPO_PUBLIC_CONVEX_URL` — preview Convex URL (plain text)
- `EXPO_PUBLIC_BETTER_AUTH_URL` — preview web/auth origin (plain text)
- `EXPO_PUBLIC_E2E_TESTING=true` — enables the one-time native route (plain text)
- `MAESTRO_E2E_CONVEX_URL` — the same preview Convex URL (plain text)
- `MAESTRO_E2E_FIXTURE_KEY` — the preview fixture key (secret)

Do not define `EXPO_PUBLIC_E2E_TESTING` or either fixture variable in the
production EAS environment. Attachment, notification, add-on, and settings
journeys remain future expansions of this authenticated foundation.
