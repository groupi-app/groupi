---
name: test-coverage-gap
description: Inventory Groupi Convex functions and tests, identify untested or partially tested backend behavior, rank gaps by security and data risk, and propose realistic convex-test scenarios or skeletons. Use for backend coverage audits, domain-specific test-gap analysis, or deciding which Convex tests to write next.
---

# Test Coverage Gap

Produce a read-only, evidence-based coverage audit. Do not equate a referenced function name with complete behavioral coverage.

## Inventory

Accept an optional Convex domain and whether test skeletons are wanted.

1. Use `rg` to find exported `query`, `mutation`, `action`, and internal variants under `convex/`, excluding generated and test files.
2. Record function path, type, domain, authentication or role checks, database writes, and whether it is internal.
3. Find all Convex test files and count tests.
4. Map `api.<domain>...` and `internal.<domain>...` calls to functions, then read the matching tests to identify scenarios actually covered.

## Analyze Domains

When multiple domains are in scope, delegate independent domain analyses to read-only `reviewer` agents and wait for all results.

For every function, distinguish:

- Untested: no test exercises the function.
- Partially tested: some behavior is exercised, but important branches are absent.
- Covered: primary success and relevant failure paths are exercised.

Rank gaps:

- Critical: permissions, destructive operations, money, or severe cross-user/event impact.
- High: complex mutations, cascades, multi-table writes, or sensitive state transitions.
- Medium: authenticated queries, complex joins, or simple mutations.
- Low: simple read-only or internal helper behavior.

Read the production function before assigning risk. Consider unauthenticated access, wrong-role access, outsiders, cross-event IDs, missing records, validation boundaries, data side effects, notifications, cascades, and idempotency.

## Prioritize and Report

Read `convex/tests/test_helpers.ts`, `.agents/rules/testing.md`, `$test-convex`, and one analogous test file before drafting scenarios.

Return at most 20 gaps, ordered by risk, then mutations before queries, then authenticated before public behavior. For each include the exact function, domain, risk reason, missing scenarios, and a realistic `convex-test` skeleton when requested. Skeletons must use actual API paths and existing `TestScenarios`; use TODOs only for assertions that require implementation-specific values.

Also report overall counts, an explicitly labeled function-level coverage estimate, domain breakdown, critical/high totals, and a concise recommendation. Explain that this static inventory is not line or branch coverage.
