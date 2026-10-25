# Run, test and submit a contribution

v2 · Current · Source: package.json

Source availability does not establish hosted deployment or registry publication.

## Start with general programming prerequisites
Canonical passage: /v2/contributor#setup

Use Git, Node.js 22 or 24 and pnpm 10.12.1 (the root packageManager). React/TypeScript familiarity helps for UI work; Convex knowledge is introduced progressively. Clone the current repository and install its locked dependencies. A focused shared-package test does not require a live account or credentials.

```sh
git clone https://github.com/groupi-app/groupi.git
cd groupi
corepack enable
pnpm install --frozen-lockfile
```

## Run one focused check
Canonical passage: /v2/contributor#tests

The shared GDL conformance suite is a useful first success with no service credentials. Run the workspace quality checks before submission. If pnpm reports an unsupported runtime, use Node 22 or 24; if the lock is stale, confirm the branch instead of rewriting it blindly. Humans can follow the repository development setup for servers; automated agents must use already-running services and must never run dev, start, build or Convex deployment commands.

```sh
pnpm --filter @groupi/shared exec vitest run src/gdl/conformance.test.ts
pnpm check
pnpm lint:tokens
```

## Submit a reviewed contribution
Canonical passage: /v2/contributor#submit

Create a focused branch, explain the affected user flow and tests in your pull request, and follow CONTRIBUTING.md. Include a changeset for a user-facing change after agreeing its summary with the maintainer. Review permissions, compatibility and accessibility before requesting review. Never commit environment files or credentials.
