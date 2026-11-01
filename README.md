# Groupi

[![CI](https://github.com/groupi-app/groupi/actions/workflows/test.yml/badge.svg?branch=test)](https://github.com/groupi-app/groupi/actions/workflows/test.yml)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE)

Groupi is an event planning app for web and mobile. It supports event dates and
RSVPs, Groups with separate membership and admission rules, discussions,
notifications, and optional event and Group tools.

This README describes the source on this branch. Work on `test` can include
features that have not reached `main`, a hosted deployment, or a public package
registry. See the [CLI](packages/cli/README.md),
[TypeScript SDK](packages/sdk/README.md), and
[Python SDK](packages/python-sdk/README.md) for their availability and limitations.

## Table of Contents

- [Repository](#repository)
- [Local development](#local-development)
- [Validation](#validation)
- [Architecture](#architecture)
- [Deployment and distribution](#deployment-and-distribution)
- [Contributing and security](#contributing-and-security)

## Repository

| Location                                     | Purpose                                                          |
| -------------------------------------------- | ---------------------------------------------------------------- |
| [convex/](convex/)                           | Backend functions, schema, REST API, and Better Auth integration |
| [packages/web/](packages/web/)               | Next.js web app with Tailwind CSS and Radix UI                   |
| [packages/mobile/](packages/mobile/)         | React Native app with Expo and Uniwind                           |
| [packages/shared/](packages/shared/)         | Shared hooks, platform adapters, design tokens, and date parsing |
| [packages/cli/](packages/cli/)               | Command-line and terminal interfaces                             |
| [packages/sdk/](packages/sdk/)               | TypeScript REST client                                           |
| [packages/python-sdk/](packages/python-sdk/) | Python REST client                                               |
| [packages/portal/](packages/portal/)         | Developer documentation portal                                   |
| [docs/](docs/)                               | Setup, architecture, contracts, and operations guides            |

The workspace uses TypeScript, pnpm, and Turborepo. Web and mobile share business
logic while providing platform-specific UI.

## Local development

Use Node.js 22 or 24, the runtime majors in CI, and the pnpm version pinned in
[root package.json](package.json). Git and access to a Convex development project
are required. Mobile testing needs a native development build; Expo Go is not
supported. See [iOS testing](docs/ios-testing.md) and
[mobile release setup](docs/mobile-release.md) for native prerequisites.

```bash
git clone https://github.com/groupi-app/groupi.git
cd groupi
pnpm install
cp .env.example .env.local
```

Configure the frontend environment and the matching Convex deployment before
starting the app. Backend secrets belong in that deployment's environment, not
only in `.env.local`. Follow [Getting started](docs/getting-started.md) for the
variables and setup sequence.

For contributors managing their own local runtimes:

```bash
pnpm dev              # Web and Convex together
pnpm dev:web          # Web only, with an existing backend
pnpm dev:mobile       # Mobile, with an existing backend
pnpm dev:all          # Web, Convex, and mobile together
```

The web app normally listens at <http://localhost:3000>. Agents must follow the
[script policy](.agents/rules/scripts.md), which restricts starting runtimes,
building, and deploying without explicit authorization.

## Validation

Run from the repository root:

```bash
pnpm check                   # Lint, types, contracts, and formatting
pnpm test:run                # All package tests once
pnpm test:convex             # Backend tests
pnpm test:web                # Web tests
pnpm test:shared             # Shared tests
pnpm test:mobile             # Mobile tests
pnpm check:workspace-source  # Shared source resolution
pnpm generate               # Regenerate Convex contracts after API/schema changes
```

Use `pnpm exec prettier --write <changed-files>` for targeted formatting.
See [Testing](docs/testing.md) for fixtures, coverage, and integration checks.

## Architecture

Application data uses Convex queries, mutations, and subscriptions. Better Auth
stores authentication records in its Convex component; app profiles live in
`persons`. Native app functions and versioned REST endpoints share domain-owned
operations, with permissions enforced inside write transactions.

The Next.js application renders interactive app data in client components. It
also has an authentication proxy and an API documentation redirect under
`app/api`; the REST API itself lives in Convex. Shared hooks receive platform
adapters for navigation, storage, and feedback. Workspace imports resolve shared
TypeScript source without a shared prebuild.

Read [Architecture](docs/architecture.md),
[Authentication](docs/auth-architecture.md),
[UI design system](docs/ui-design-system.md), and the
[architecture decisions](docs/adr/) before changing these boundaries.

## Deployment and distribution

Web hosting uses Vercel configuration in the repository. Mobile signing, EAS
builds, store submission, and native update boundaries are covered by
[Mobile release](docs/mobile-release.md) and
[Mobile update boundary](docs/mobile-update-boundary.md). Backend deployment is a
separate operation; a frontend deployment does not prove backend compatibility.
[Self-hosting](docs/self-hosting.md) remains a proposal, not an available Docker
installation path.

For shared package distribution, compile through the release/CI build path, then
pack with pnpm so `publishConfig` overrides select compiled CommonJS, ES modules,
and declarations:

```bash
pnpm --dir packages/shared pack --pack-destination <output-directory>
node scripts/check-shared-package.mjs <tarball-path>
```

Use pnpm for packing and publishing; npm does not apply these manifest overrides.
See [workspace source ownership](docs/workspace-source-ownership-design.md).

## Contributing and security

Read [Contributing](CONTRIBUTING.md) for branches, commits, changesets, and review.
Report vulnerabilities privately using the [Security policy](SECURITY.md).
Participation follows the [Code of conduct](CODE_OF_CONDUCT.md).

Groupi is licensed under [GNU GPL v3](LICENSE).
