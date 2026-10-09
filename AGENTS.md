# Groupi — Agent Guide

Groupi is a cross-platform event planner: Convex backend, Next.js web, React Native/Expo mobile, and shared business logic.

## Table of Contents

- [Workflow](#workflow)
- [Implementation references](#implementation-references)
- [Skills and collaboration](#skills-and-collaboration)

## Workflow

- **Commands:** Read [script policy](.agents/rules/scripts.md) before running scripts. Use `pnpm check` for lint/types/format and one-shot tests for behavior. Local dev servers, verification builds, preview servers, and Convex deployment commands are prohibited under repository policy; explicit user authorization governs any exception.
- **Runtime verification:** At feature kickoff, use the [readiness procedure](docs/agents/workflow.md#runtime-readiness). Establish the matching frontend/backend and isolated test session before promising browser or device checks.
- **Architecture:** Before domain exploration, read [domain context](docs/agents/domain.md); before implementation, read [architecture rules](.agents/rules/architecture.md). Implement backend → generated declarations (`pnpm generate`) → shared hooks → platform UI.
- **Release notes:** For user-facing work, follow [changeset approval](docs/agents/workflow.md#changeset-approval). Prepare one reviewable batch for agreed scope; user confirmation is required before creation.
- **Integration:** For merge/deployment status or cross-session handoff, read and update [current integration status](docs/agents/integration/current-status.md). Check its as-of date before claiming it describes live branches.

## Implementation references

| Work                    | Read before editing                                                                            |
| ----------------------- | ---------------------------------------------------------------------------------------------- |
| Convex schema/functions | [Convex rules](.agents/rules/convex.md), [authentication helpers](convex/auth.ts)              |
| Tests                   | [Testing rules](.agents/rules/testing.md)                                                      |
| UI/components           | [UI rules](.agents/rules/ui-design-system.md), [design tokens](.agents/rules/design-tokens.md) |
| Presence                | [Presence rules](.agents/rules/presence.md)                                                    |
| Add-ons                 | [Add-on framework](.agents/rules/addons.md)                                                    |
| Documentation           | [Documentation style](.agents/rules/documentation.md)                                          |
| Tickets/specs           | [GitHub issue tracker](docs/agents/issue-tracker.md)                                           |
| Issue classification    | [Five triage labels](docs/agents/triage-labels.md)                                             |

Architecture invariants: Convex subscriptions/mutations own data synchronization; Next.js uses client components; shared logic stays platform-agnostic; types flow from Convex functions. Use `requireAuth(ctx)` for authenticated mutations and `getCurrentPerson(ctx)` for optional query auth. Business logic belongs in shared hooks with injected platform adapters. Use semantic design tokens and the atomic component hierarchy rather than hardcoded colors, radii, shadows, or z-indexes.

## Skills and collaboration

Choose relevant project workflows from [.agents/skills](.agents/skills): backend features, web components, shared hooks, add-ons, Convex tests, schema migrations, security review, code review, issue fixes, coverage gaps, dependency checks, and deployment verification. Specialized agents live in [.codex/agents](.codex/agents); hook configuration lives in [.codex/hooks.json](.codex/hooks.json).

For complex work with independent tracks, delegate to the named Codex agents and wait for their results. Assign each task an owned scope and checkable completion criterion. Keep overlapping writes sequential and preserve concurrent edits. Handoffs report changes/findings, validation, and uncertainty. The coordinator owns ticket publication and triage unless explicitly delegated.

Third-party skills are recorded in [skills-lock.json](skills-lock.json); restore with `pnpm dlx skills experimental_install`. Apply this repository's script and architecture policies to upstream examples. If an upstream router names an unavailable skill, use the corresponding project skill or official documentation.
