# ESLint setup for Convex

Install and configure `@convex-dev/eslint-plugin` so the rules in the best practices skill fail at lint time instead of in production.

## Install

```bash
npm i --save-dev @convex-dev/eslint-plugin
```

For type aware rules (needed by `explicit-table-ids`) also install typescript-eslint:

```bash
npm i --save-dev typescript-eslint
```

## Flat config (ESLint 9)

Minimal:

```js
// eslint.config.js
import { defineConfig } from "eslint/config";
import convexPlugin from "@convex-dev/eslint-plugin";

export default defineConfig([...convexPlugin.configs.recommended]);
```

With TypeScript rules that catch the two bugs TypeScript itself misses in Convex code, missing awaits and stray `any`:

```js
// eslint.config.js
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import convexPlugin from "@convex-dev/eslint-plugin";

export default defineConfig([
  ...tseslint.configs.recommendedTypeChecked,
  ...convexPlugin.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  { ignores: ["convex/_generated/**", "dist/**", "node_modules/**"] },
]);
```

`no-floating-promises` is the one to care about most. A missing `await` on `ctx.db.patch` or `ctx.scheduler.runAfter` can drop a write with no error.

## Legacy config (.eslintrc.js)

```bash
npm i --save-dev @typescript-eslint/eslint-plugin @convex-dev/eslint-plugin
```

```js
module.exports = {
  extends: [
    "plugin:@typescript-eslint/recommended",
    "plugin:@convex-dev/recommended",
  ],
  ignorePatterns: ["node_modules/", "dist/", "build/"],
};
```

## Rules in the plugin

| Rule | In recommended | Fixable | What it catches |
| --- | --- | --- | --- |
| `no-old-registered-function-syntax` | Yes | Yes | `query(async (ctx) => ...)` instead of `query({ handler })` |
| `require-argument-validators` | Yes | Yes | Functions with no `args` |
| `explicit-table-ids` | Yes | Yes | `ctx.db.get(id)` without a table name (see note) |
| `no-filter-in-query` | Yes | No | `.filter()` on a database query |
| `no-top-of-hour-crons` | Yes | No | Crons scheduled at minute 0, when load spikes |
| `import-wrong-runtime` | No | No | Default runtime files importing from `"use node"` files |
| `no-collect-in-query` | No | No | `.collect()` in a query where `.take()` or `.paginate()` fits |

Turn on the two opt in rules in projects with large tables or mixed runtimes:

```js
{
  files: ["convex/**/*.ts"],
  rules: {
    "@convex-dev/import-wrong-runtime": "error",
    "@convex-dev/no-collect-in-query": "warn",
  },
}
```

Note on `explicit-table-ids`: the rule wants `ctx.db.get("tasks", id)` and `ctx.db.patch("tasks", id, fields)`, a form available since `convex` 1.31. The skills in this repo use `ctx.db.get(id)`. Pick one style per codebase. If you keep the implicit form, turn the rule off; if you move to the explicit form, `npx @convex-dev/codemod@latest explicit-ids` rewrites the calls for you.

Allow functions that take no arguments to skip `args`:

```js
{
  files: ["convex/**/*.ts"],
  rules: {
    "@convex-dev/require-argument-validators": [
      "error",
      { ignoreUnusedArguments: true },
    ],
  },
}
```

## Custom convex directory

The plugin only applies to `convex/` by default. For `src/convex/`:

```js
import { defineConfig } from "eslint/config";
import convexPlugin from "@convex-dev/eslint-plugin";

const recommendedRules = convexPlugin.configs.recommended[0].rules;

export default defineConfig([
  {
    files: ["**/src/convex/**/*.ts"],
    plugins: { "@convex-dev": convexPlugin },
    rules: recommendedRules,
  },
]);
```

For `next lint`, add `"convex"` to `eslint.dirs` in `next.config.ts`.

## Scripts

```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "typecheck": "tsc --noEmit",
    "check": "npm run lint && npm run typecheck"
  }
}
```

Run `npm run check` in CI before `npx convex deploy`. For a pre commit hook, `lint-staged` with `eslint --fix` on `*.{ts,tsx}` keeps commits fast.

## Disabling a rule on one line

```ts
// eslint-disable-next-line @convex-dev/no-collect-in-query
const all = await ctx.db.query("settings").collect();
```

Only do this when the table is bounded by design, such as a settings table with a handful of rows.

## Docs

- https://docs.convex.dev/eslint
- https://www.npmjs.com/package/@convex-dev/eslint-plugin
