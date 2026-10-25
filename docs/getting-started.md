# Getting started

Set up a local Groupi development environment with a matching Convex backend.
These instructions describe repository source; they do not establish production
or package-registry availability.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Install](#install)
- [Configure the environment](#configure-the-environment)
- [Run locally](#run-locally)
- [Make and validate changes](#make-and-validate-changes)
- [Repository guidance](#repository-guidance)

## Prerequisites

- Node.js 22 or 24, matching the CI runtime matrix.
- The pnpm version in the root `package.json` `packageManager` field.
- Git and access to a Convex development project.
- For mobile, a native development build and platform toolchain. Follow
  [iOS testing](ios-testing.md) and [mobile release setup](mobile-release.md).
  Expo Go does not support this app's native modules.

The Convex and Expo CLIs are workspace dependencies; global installations are
not required for the commands below.

## Install

```bash
git clone https://github.com/groupi-app/groupi.git
cd groupi
pnpm install
cp .env.example .env.local
```

Create a feature branch from the maintainer's intended target. `test` can include
work ahead of `main`; check the target before submitting a PR.

## Configure the environment

The web configuration loads root `.env.local` and `.env` in
[`next.config.mjs`](../packages/web/next.config.mjs). Its required frontend
configuration is validated in [`env.mjs`](../packages/web/env.mjs).

| Variable                                     | Where to configure it                              | Meaning                                                                         |
| -------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------- |
| `CONVEX_DEPLOYMENT`                          | Local Convex CLI environment                       | Deployment identifier such as `dev:your-deployment`, not a URL                  |
| `NEXT_PUBLIC_CONVEX_URL`                     | Frontend `.env.local`                              | Matching deployment's `https://…convex.cloud` URL                               |
| `NEXT_PUBLIC_CONVEX_SITE_URL`                | Frontend `.env.local` when used                    | Matching HTTP action origin, normally `https://…convex.site`                    |
| `BETTER_AUTH_SECRET`                         | Web `.env.local` validation and Convex environment | Authentication secret; generate a random value rather than keeping the template |
| `SITE_URL`                                   | Convex environment                                 | Trusted web origin used by backend auth                                         |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`   | Convex environment when using Google               | OAuth credentials                                                               |
| `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET` | Convex environment when using Discord              | OAuth credentials                                                               |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL`        | Convex environment for email delivery              | Email service credentials and verified sender                                   |

Generate an authentication secret with:

```bash
openssl rand -base64 32
```

Copying the template does not configure backend secrets. Use the Convex dashboard
or CLI environment settings for the selected deployment. Keep secrets out of
`NEXT_PUBLIC_*` and `EXPO_PUBLIC_*` variables, commits, screenshots, and logs.
The template contains placeholder optional services; configure or remove those
values as needed. For authentication details and provider callbacks, see
[Authentication architecture](auth-architecture.md).

## Run locally

These commands are for contributors managing their own runtimes. Agents follow
the repository [script policy](../.agents/rules/scripts.md), which restricts
runtime, build, and deployment commands without explicit authorization.

For first-time Convex project selection, run the workspace CLI from the root and
follow its prompts:

```bash
pnpm convex:dev
```

Stop that process before starting the combined root command, or keep it running
and use the web-only command in another terminal:

```bash
pnpm dev:web
```

For later sessions, start web and Convex together:

```bash
pnpm dev
```

Open <http://localhost:3000>. To add mobile against the same backend, configure
its environment using the [mobile guide](mobile-release.md), then run
`pnpm dev:mobile`. `pnpm dev:all` starts web, Convex, and mobile together.

## Make and validate changes

Backend functions live in `convex/`; shared hooks and platform adapters live in
`packages/shared/`. Web features own their modules under `packages/web/features/`.
Interactive app data uses Convex subscriptions. Next.js also provides an auth
proxy and API documentation redirect; versioned REST endpoints live in Convex.
See [Architecture](architecture.md) for ownership boundaries.

```bash
pnpm generate       # After schema or public function changes
pnpm check          # Lint, types, contracts, and formatting
pnpm test:run       # Run package tests once
pnpm test:convex    # Backend tests only
pnpm test:web       # Web tests only
pnpm test:shared    # Shared tests only
pnpm test:mobile    # Mobile tests only
```

For targeted formatting, use `pnpm exec prettier --write <changed-files>`.
Add tests for changed behavior and follow [Contributing](../CONTRIBUTING.md) for
conventional commits, changesets, and review. Documentation-only changes do not
need a changeset.

## Repository guidance

[AGENTS.md](../AGENTS.md) links repository rules and scoped workflows in
`.agents/skills/`. Restore the third-party skill catalog from `skills-lock.json`
when needed:

```bash
pnpm dlx skills experimental_install
```

Use the [domain glossary](../GLOSSARY.md),
[architecture decisions](adr/), [testing guide](testing.md), and
[UI design system](ui-design-system.md) for implementation details.
