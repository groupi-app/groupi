---
name: code-review
description: Perform a comprehensive Groupi branch, pull-request, commit, or working-tree review with parallel review dimensions, adversarial verification, deduplication, and optional mechanical fixes. Use for thorough pre-merge reviews, quality audits, or requests to review a diff against a base branch.
---

# Code Review

Review changed behavior, verify every material finding against the actual code, and return an evidence-first report. Remain read-only unless the user explicitly asks for fixes.

## Resolve the Review Range

1. Accept a PR number, explicit `base` and `head`, or a working-tree review.
2. For a PR, inspect it with `gh pr view` and `gh pr diff` without switching branches.
3. For an explicit range, use `git diff <base>...<head>` unless the user requests two-dot semantics.
4. Otherwise, compare the current branch and working tree with `origin/main`. Fetch only if required and safe.
5. Read `AGENTS.md` and the relevant files under `.agents/rules/`.
6. Record changed files, additions/deletions, and whether the diff affects backend, frontend, schema, tests, configuration, or documentation.

Preserve dirty worktree changes. Do not check out another branch during a review.

## Review the Diff

For a substantive diff, delegate independent dimensions to `reviewer` agents in parallel and wait for all results. Keep small diffs local when delegation adds no value. Select only dimensions relevant to the changed files:

- Correctness: runtime errors, bad control flow, nullability, races, and broken data flow.
- Security: authentication, authorization, event isolation, input validation, unsafe defaults, and information disclosure.
- Data integrity: schema compatibility, denormalized fields, cascades, and partial multi-step writes.
- Performance: missing indexes, N+1 reads, hot-path work, unnecessary renders, bundle impact, and cleanup leaks.
- Architecture/UI: project boundaries, client-only constraints, shared factories, atomic composition, and semantic tokens.
- Build/config: dependency safety, patches, overrides, lockfiles, CI, and deployment configuration.
- Tests: regression coverage and missing high-risk scenarios.

Read the full changed file for context before reporting an issue. Ignore style preferences and pre-existing issues unless the diff materially worsens or exposes them.

For each candidate finding, record severity (`critical`, `high`, `medium`, or `low`), path, line, title, concrete failure scenario, evidence, and smallest safe remediation. Mark a finding mechanically fixable only when it has one unambiguous answer, stays local, and requires no product or architecture judgment.

## Verify and Deduplicate

1. Deduplicate candidates by root cause and affected code path.
2. Adversarially verify every critical, high, and medium finding, preferably with a fresh `reviewer` agent for nontrivial cases.
3. Ask the verifier to refute the finding: read the file, inspect the exact diff, search for handling elsewhere, confirm the code changed in this diff, and establish runtime impact.
4. Dismiss uncertain, unchanged-code, or fully mitigated findings.
5. Keep low findings clearly labeled as unverified unless you verify them too.

## Apply Explicitly Requested Fixes

Only enter this section when the user asked to fix findings.

1. Limit automatic changes to confirmed mechanical fixes.
2. Re-read the current file and skip the fix if its target no longer matches.
3. Make the smallest change and do not combine it with unrelated cleanup.
4. Run `pnpm generate` when Convex schema or function signatures changed, then `pnpm check`, relevant targeted tests, and `pnpm lint:tokens` for TSX changes.
5. Report skipped fixes and validation failures; never hide them by weakening tests.

## Report

Lead with findings ordered by severity. Include exact file and line references, failure conditions, and remediation. Then give:

- Overall verdict: `approve`, `comment`, or `request changes`.
- Risk level and a concise executive summary.
- Confirmed versus refuted counts and dimensions reviewed.
- Fixes applied, skipped, and validation results when applicable.
- Remaining work and a few concrete positives.

If there are no actionable findings, say so explicitly and mention any validation or coverage limits.
