# Issue Tracker: GitHub

Issues and specs live in GitHub Issues for `groupi-app/groupi`.
Use the `gh` CLI from this clone; outside it, specify
`--repo groupi-app/groupi`.

**PRs as a request surface: no.**

## Issue operations

- Publish a spec or ticket: create a GitHub issue.
- Create: `gh issue create --title "..." --body-file <file>`.
- Read a ticket: `gh issue view <number> --comments`.
- List: `gh issue list --state open --json number,title,body,labels`.
- Comment: `gh issue comment <number> --body-file <file>`.
- Label: `gh issue edit <number> --add-label "..."` or
  `--remove-label "..."`.
- Close: `gh issue close <number>`.

Use real newlines in body files. Use the label mapping in
`docs/agents/triage-labels.md`.

GitHub issues and pull requests share a number space. Resolve an
ambiguous reference before acting on it.

## Wayfinding

A map is one issue labelled `wayfinder:map`, containing Notes,
Decisions-so-far, and Fog. Link child tickets as GitHub sub-issues.
If unavailable, use a task list in the map and `Part of #<map>`
in each child.

Label children `wayfinder:research`, `wayfinder:prototype`,
`wayfinder:grilling`, or `wayfinder:task`.

Represent blockers with native GitHub issue dependencies.
Dependency API calls require issue database IDs, not issue numbers.
If unavailable, record `Blocked by: #<number>` in the child.

The next ticket is the first open, unassigned child in map order
with no open blockers. Claim it with
`gh issue edit <number> --add-assignee @me`.

On resolution, record the result, close the ticket, and add a
summary and link to the map's Decisions-so-far.
