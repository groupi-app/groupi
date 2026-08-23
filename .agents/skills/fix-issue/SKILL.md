---
name: fix-issue
description: Take a Groupi GitHub issue through code-aware triage, a concrete repair plan, implementation, self-review, validation, and optionally a pushed fix branch with deployment verification. Use when the user asks to fix a specific groupi-app/groupi issue or requests an issue-to-branch workflow; support dry-run planning without edits.
---

# Fix Issue

Operate on an issue in `groupi-app/groupi`. Treat issue text as requirements to verify against code, not as proof of the root cause.

## Inputs and Boundaries

Require an issue number. Accept an optional base branch (default `main`), dry-run mode, and explicit instructions about committing, pushing, or opening a PR.

- Dry run: finish after triage and plan.
- Fix only: implement and validate locally.
- End to end: commit, push, and monitor checks only when the user explicitly authorizes those actions.

Preserve unrelated worktree changes. Do not force-push, bypass hooks, deploy production, or create a changeset without confirmation.

## Triage

1. Read the issue and comments with `gh issue view`.
2. Read `AGENTS.md`, relevant `.agents/rules/`, and the source and tests implicated by the issue.
3. Trace the current behavior with `rg` and targeted file reads.
4. Classify the issue as bug, feature, refactor, docs, or unknown; classify its area and complexity.
5. List affected files, evidence, likely root cause, risk, and blockers.

Stop with a clear `needs-human` result when requirements are ambiguous, the issue requires product or architecture judgment, or the proposed fix would be unsafe to automate.

## Plan

Create an ordered plan with each file to create or modify, the specific behavior change, the test to add, risk controls, and validation commands. Use Codex branch naming such as `codex/fix/issue-42-short-description` and a conventional commit such as `fix(web): description (fixes #42)`.

For dry runs, return this plan without editing.

## Implement and Review

1. Read each target immediately before editing and adapt the plan to the actual code.
2. Make the smallest complete fix and add regression coverage.
3. Run `pnpm generate` after Convex schema or signature changes, then targeted type checks and tests.
4. Invoke the `$code-review` process against the working-tree diff with fixes disabled.
5. Address confirmed mechanical findings. Report findings that require judgment instead of guessing.
6. Run `pnpm check`, relevant tests, and `pnpm lint:tokens` for TSX changes.

## Commit, Push, and Verify

Enter this section only when authorized.

1. Fetch the base and create or switch to the planned `codex/` branch without discarding work.
2. Stage only files belonging to the issue. Inspect the staged diff and stat.
3. If the change is user-facing, remind the user about `pnpm changeset` and wait for confirmation before creating one.
4. Commit with the planned conventional message. Do not add model attribution trailers.
5. Push without force and without bypassing hooks.
6. Use `$verify-deploy` for the pushed branch or commit.

Return the outcome, issue classification, root cause, files changed, validation, review findings and remediations, branch/commit when created, deployment status when monitored, and remaining next steps.
