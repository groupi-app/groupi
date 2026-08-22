---
name: verify-deploy
description: Resolve a Groupi branch, commit, or pull request to a commit SHA and monitor GitHub check runs plus the Vercel commit status until success, failure, or timeout. Use after a push when the user asks to verify CI, deployment, or merge readiness.
---

# Verify Deploy

Monitor checks without changing repository or deployment state.

## Resolve the Commit

Accept one of:

- A commit SHA: use it directly.
- A PR number: read `headRefOid` with `gh pr view`.
- A branch: resolve its remote head with `gh api` or a narrow fetch that does not switch branches.
- No selector: use `git rev-parse HEAD`.

Record the full SHA and a human-readable ref. Fail clearly if resolution is ambiguous.

## Poll Status

For `groupi-app/groupi`, query both:

```bash
gh api repos/groupi-app/groupi/commits/<sha>/status
gh api repos/groupi-app/groupi/commits/<sha>/check-runs
```

On each poll:

1. Find the Vercel context in combined commit statuses and record state, description, and target URL. Treat a missing status as pending, not success.
2. Count completed-success, completed-failure, cancelled/timed-out, and pending check runs. Include failed and pending names.
3. Succeed only when Vercel is successful and every check run has completed successfully.
4. Fail immediately when Vercel errors/fails or any check reaches a failing terminal conclusion.
5. Otherwise, wait about 30 seconds and poll again, sharing concise progress at least once per minute.

Default to a 15-minute timeout unless the user provides another bound. Do not wait indefinitely.

## Report

Return the ref, SHA, outcome (`success`, `failure`, or `timeout`), elapsed time or poll count, Vercel state and link, CI totals, and names or links for failed and pending checks. On failure, include the next diagnostic command; do not modify, rerun, approve, or deploy anything unless separately requested.
