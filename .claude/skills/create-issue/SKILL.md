---
name: create-issue
description: Create a well-structured GitHub issue with enough detail for automated fix workflows. Use when the user reports a bug, wants a feature, or describes something that needs fixing.
---

# Create GitHub Issue

Create issues structured for the `fix-issue` workflow to pick up and execute automatically.

## Process

### 1. Understand the request

The user's input is passed as `$ARGUMENTS`. It may be brief ("the invite page crashes when you click join twice") or detailed. Either way, you need to enrich it.

### 2. Investigate the codebase

Before writing the issue, search for relevant context:

```
!grep -rn "<keywords from the user's description>" convex/ packages/web/ --include='*.ts' --include='*.tsx' -l | head -20
```

Read the most relevant files to understand current behavior:

```
!cat <most-relevant-file> | head -100
```

Check for related existing issues:

```
!gh issue list --repo groupi-app/groupi --search "<keywords>" --limit 5 --json number,title,state --jq '.[] | "\(.number) [\(.state)] \(.title)"'
```

### 3. Classify the issue

Determine:

- **Type**: `bug`, `feature`, `refactor`, `docs`, or `chore`
- **Area**: `backend` (convex/), `frontend` (packages/web/), `both`, or `config`
- **Severity** (bugs only): `critical` (data loss, auth bypass), `high` (broken feature), `medium` (degraded UX), `low` (cosmetic)
- **Complexity estimate**: `trivial`, `simple`, `moderate`, `complex`

### 4. Write the issue

Use this template — every section matters for the `fix-issue` workflow:

```markdown
## Description

<1-2 sentences: what's wrong or what's needed>

## Current Behavior

<What happens now — be specific. Include error messages, wrong values, or missing functionality.>

## Expected Behavior

<What should happen instead.>

## Affected Area

- **Type**: bug | feature | refactor
- **Area**: backend | frontend | both | config
- **Severity**: critical | high | medium | low
- **Complexity**: trivial | simple | moderate | complex

## Affected Files

<List the specific files involved, found during investigation. This is critical for the fix-issue workflow.>

- `path/to/file1.ts` — <why this file is relevant>
- `path/to/file2.tsx` — <why this file is relevant>

## Reproduction Steps (bugs only)

1. Step one
2. Step two
3. Observe: <what goes wrong>

## Technical Context

<What you learned from reading the code. Include:>
- Current implementation details
- Related functions/components
- Database tables or schema involved
- Any constraints or gotchas

## Acceptance Criteria

- [ ] <Specific, testable criterion>
- [ ] <Another criterion>
- [ ] Existing tests pass (`pnpm test:run`)
- [ ] Type check passes (`pnpm check`)
```

### 5. Choose labels

Map to existing repo labels. Common ones:

- `bug`, `enhancement`, `documentation`
- `backend`, `frontend`
- `priority: critical`, `priority: high`, `priority: medium`, `priority: low`

Check available labels:

```
!gh label list --repo groupi-app/groupi --limit 30 --json name --jq '.[].name'
```

### 6. Create the issue

```
!gh issue create --repo groupi-app/groupi --title "<type>: <concise title>" --label "<label1>,<label2>" --body "<full body>"
```

Show the user the issue URL when done.

### 7. Offer next steps

After creating, ask if the user wants to:

- Run `fix-issue` workflow on it immediately
- Assign it to someone
- Add it to a project board

## Quality checklist

Before creating, verify the issue has:

- [ ] Specific affected files (not just "somewhere in the backend")
- [ ] Clear acceptance criteria (testable, not vague)
- [ ] Technical context from actually reading the code
- [ ] Correct classification (type, area, severity, complexity)
- [ ] No duplicate of an existing open issue

## Examples

**User says**: "the member count shows 0 on old events"

**Good issue title**: `bug: events without backfilled memberCount display 0 members`

**Good affected files section**:

- `convex/events/queries.ts` — `getEventById` returns `event.memberCount ?? 0` which is 0 for pre-migration events
- `convex/schema.ts` — `memberCount` is `v.optional(v.number())`, undefined for old events
- `packages/web/app/(event)/event/[eventId]/page.tsx` — displays the count from the query

**Bad affected files section**:

- "Some file in convex/"
- "The event page"
