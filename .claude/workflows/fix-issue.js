export const meta = {
  name: 'fix-issue',
  description:
    'End-to-end: analyze a GitHub issue, plan a fix, implement it, review, push, and verify deploy',
  whenToUse:
    'When you want to go from a GitHub issue to a verified fix branch. Pass args: {issue: 42} and optionally {base: "main", dryRun: true}',
  phases: [
    { title: 'Triage', detail: 'Read the issue and identify affected code' },
    { title: 'Plan', detail: 'Design the fix with specific file changes' },
    { title: 'Implement', detail: 'Apply the fix across affected files' },
    { title: 'Self-Review', detail: 'Run code review on the changes' },
    { title: 'Remediate', detail: 'Fix any issues caught by review' },
    { title: 'Commit & Push', detail: 'Create fix branch, commit, and push' },
    { title: 'Verify', detail: 'Wait for CI and Vercel to pass' },
  ],
};

const issueNumber = (args && args.issue) || null;
const baseBranch = (args && args.base) || 'main';
const dryRun = (args && args.dryRun) || false;
const repo = 'groupi-app/groupi';

if (!issueNumber) {
  return {
    error: 'Pass args.issue with the GitHub issue number. Example: {issue: 42}',
  };
}

// ── Schemas ──────────────────────────────────────────────────────────────────

const TRIAGE_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    issueType: {
      type: 'string',
      enum: ['bug', 'feature', 'refactor', 'docs', 'unknown'],
    },
    description: {
      type: 'string',
      description: 'Concise summary of what needs to happen',
    },
    area: {
      type: 'string',
      enum: ['backend', 'frontend', 'both', 'config', 'unknown'],
    },
    affectedFiles: {
      type: 'array',
      items: { type: 'string' },
      description:
        'Files likely involved based on issue description and code search',
    },
    relatedCode: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          file: { type: 'string' },
          relevance: { type: 'string', description: 'Why this file matters' },
          snippet: {
            type: 'string',
            description: 'Key code snippet from the file',
          },
        },
        required: ['file', 'relevance'],
      },
    },
    labels: { type: 'array', items: { type: 'string' } },
    complexity: {
      type: 'string',
      enum: ['trivial', 'simple', 'moderate', 'complex', 'too-complex'],
    },
    complexityReason: { type: 'string' },
    canAutoFix: {
      type: 'boolean',
      description:
        'Whether this can be safely auto-fixed without human judgment calls',
    },
    blockers: {
      type: 'array',
      items: { type: 'string' },
      description: 'Reasons this cannot be auto-fixed (empty if canAutoFix)',
    },
  },
  required: [
    'title',
    'issueType',
    'description',
    'area',
    'affectedFiles',
    'complexity',
    'canAutoFix',
  ],
};

const PLAN_SCHEMA = {
  type: 'object',
  properties: {
    branchName: {
      type: 'string',
      description: 'Branch name for the fix (e.g. fix/issue-42-auth-bypass)',
    },
    commitMessage: {
      type: 'string',
      description: 'Conventional commit message for the fix',
    },
    steps: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          order: { type: 'number' },
          file: { type: 'string' },
          action: { type: 'string', enum: ['create', 'modify', 'delete'] },
          description: {
            type: 'string',
            description: 'What to change and why',
          },
          changeDetail: {
            type: 'string',
            description:
              'Specific code changes — OLD/NEW for modifications, full content for creates',
          },
          testNeeded: { type: 'boolean' },
          testDescription: { type: 'string' },
        },
        required: ['order', 'file', 'action', 'description', 'changeDetail'],
      },
    },
    riskAssessment: {
      type: 'string',
      description: 'What could go wrong and how to mitigate',
    },
    testStrategy: {
      type: 'string',
      description: 'How to verify the fix works',
    },
  },
  required: ['branchName', 'commitMessage', 'steps', 'riskAssessment'],
};

const IMPL_SCHEMA = {
  type: 'object',
  properties: {
    filesModified: { type: 'array', items: { type: 'string' } },
    filesCreated: { type: 'array', items: { type: 'string' } },
    filesDeleted: { type: 'array', items: { type: 'string' } },
    typeCheckPassed: { type: 'boolean' },
    typeCheckErrors: { type: 'string' },
    issues: {
      type: 'array',
      items: { type: 'string' },
      description: 'Any problems encountered during implementation',
    },
    summary: { type: 'string' },
  },
  required: ['filesModified', 'filesCreated', 'typeCheckPassed', 'summary'],
};

const REMEDIATE_SCHEMA = {
  type: 'object',
  properties: {
    findingsAddressed: { type: 'number' },
    findingsSkipped: { type: 'number' },
    skippedReasons: { type: 'array', items: { type: 'string' } },
    typeCheckPassed: { type: 'boolean' },
    summary: { type: 'string' },
  },
  required: [
    'findingsAddressed',
    'findingsSkipped',
    'typeCheckPassed',
    'summary',
  ],
};

const COMMIT_SCHEMA = {
  type: 'object',
  properties: {
    branchName: { type: 'string' },
    commitSha: { type: 'string' },
    pushed: { type: 'boolean' },
    filesCommitted: { type: 'number' },
    diffStat: { type: 'string' },
    error: { type: 'string' },
  },
  required: ['branchName', 'pushed'],
};

// ── Phase 1: Triage ──────────────────────────────────────────────────────────

phase('Triage');
log('Analyzing issue #' + issueNumber + '...');

const triage = await agent(
  `Analyze GitHub issue #${issueNumber} in repo ${repo} and identify the affected code.

1. READ THE ISSUE:
   gh issue view ${issueNumber} --repo ${repo} --json title,body,labels,assignees --jq '{title: .title, body: .body, labels: [.labels[].name], assignees: [.assignees[].login]}'

2. Also check issue comments for additional context:
   gh issue view ${issueNumber} --repo ${repo} --comments

3. FIND AFFECTED CODE:
   Based on the issue description, search the codebase for relevant files:
   - grep -rn for keywords, function names, error messages mentioned in the issue
   - Read CLAUDE.md and .claude/rules/ files to understand project architecture
   - Read the most relevant source files to understand current behavior

4. ASSESS COMPLEXITY:
   - trivial: typo, config change, one-line fix
   - simple: single file, clear fix, < 20 lines changed
   - moderate: 2-5 files, some logic, needs testing
   - complex: many files, architecture impact, needs careful design
   - too-complex: requires human design decisions, unclear requirements, or risky changes

5. DETERMINE IF AUTO-FIXABLE:
   canAutoFix should be true ONLY if:
   - The fix is clearly defined (not ambiguous)
   - No design judgment required
   - The change won't break other features
   - Complexity is trivial, simple, or moderate
   If canAutoFix is false, list the specific blockers.

Return a thorough triage with affected files, related code snippets, and your assessment.`,
  { label: 'triage', phase: 'Triage', schema: TRIAGE_SCHEMA }
);

if (!triage) {
  return { error: 'Triage failed — could not analyze the issue' };
}

log(
  triage.issueType +
    ' | ' +
    triage.area +
    ' | complexity: ' +
    triage.complexity +
    ' | auto-fixable: ' +
    triage.canAutoFix
);

if (triage.complexity === 'too-complex') {
  log(
    'Issue is too complex for automated fixing. Returning triage for manual handling.'
  );
  return {
    outcome: 'needs-human',
    reason: triage.complexityReason,
    triage: triage,
    blockers: triage.blockers,
  };
}

if (!triage.canAutoFix) {
  log('Issue requires human judgment. Returning triage and blockers.');
  return {
    outcome: 'needs-human',
    reason: 'Cannot auto-fix: ' + (triage.blockers || []).join('; '),
    triage: triage,
    blockers: triage.blockers,
  };
}

// ── Phase 2: Plan ────────────────────────────────────────────────────────────

phase('Plan');
log('Planning fix for: ' + triage.title);

const plan = await agent(
  `Create a detailed fix plan for issue #${issueNumber}.

ISSUE TRIAGE:
${JSON.stringify(triage, null, 2)}

INSTRUCTIONS:
1. Read each affected file listed in the triage
2. Read any related test files to understand existing test patterns:
   find convex/tests -name '*.test.ts' | head -10
3. Read the project testing guide: .claude/rules/testing.md

Design a step-by-step fix plan:
- For each file that needs changing, specify the EXACT code change (OLD → NEW)
- If new files are needed, provide the full content
- If tests need updating, include the test changes
- Order steps so each one builds on the previous

Branch naming convention: fix/issue-${issueNumber}-<short-description>
Commit message convention: fix: <description> (fixes #${issueNumber})

Make every step specific enough that another agent can implement it without ambiguity.
Read the actual code before writing changes — don't guess at line numbers or code structure.`,
  { label: 'plan', phase: 'Plan', schema: PLAN_SCHEMA }
);

if (!plan || !plan.steps || plan.steps.length === 0) {
  return {
    error: 'Planning failed — could not produce a fix plan',
    triage: triage,
  };
}

log(plan.steps.length + ' step(s) planned → branch: ' + plan.branchName);

if (dryRun) {
  log('DRY RUN — returning plan without implementing');
  return { outcome: 'dry-run', triage: triage, plan: plan };
}

// ── Phase 3: Implement ──────────────────────────────────────────────────────

phase('Implement');
log('Implementing ' + plan.steps.length + ' step(s)...');

const implResult = await agent(
  `Implement the following fix plan for issue #${issueNumber}.

PLAN:
${JSON.stringify(plan, null, 2)}

INSTRUCTIONS:
1. You are working on branch: ${baseBranch} (do NOT create the fix branch yet — that happens after review)
2. For each step in order:
   - Read the file first to verify the code matches what the plan expects
   - Apply the change (create, modify, or delete)
   - If the code doesn't match the plan's expectations, adapt the change to fit the actual code
3. After all changes:
   - Run: pnpm generate (if any Convex files were added/changed)
   - Run: pnpm --filter @groupi/convex type-check (if backend files changed)
   - Run: pnpm --filter @groupi/web type-check (if frontend files changed)
   - Report pass/fail and any errors

RULES:
- Read before editing — always verify the current state of the file
- Do NOT create branches or commits — just make the file changes
- Do NOT run dev servers or builds
- If a step can't be applied as planned, adapt it and note the deviation in issues[]
- Follow the project's existing code style and patterns`,
  { label: 'implement', phase: 'Implement', schema: IMPL_SCHEMA }
);

if (!implResult) {
  return { error: 'Implementation failed', triage: triage, plan: plan };
}

log('Implemented: ' + implResult.summary);

if (!implResult.typeCheckPassed) {
  log(
    'WARNING: Type check failed — ' +
      (implResult.typeCheckErrors || 'unknown errors')
  );
}

// ── Phase 4: Self-Review ─────────────────────────────────────────────────────

phase('Self-Review');
log('Running code review on changes...');

const reviewResult = await workflow('code-review', {
  base: 'HEAD',
  head: '(working tree)',
  pr: null,
  autoFix: false,
});

log(
  'Review verdict: ' + (reviewResult ? reviewResult.overallVerdict : 'unknown')
);

// ── Phase 5: Remediate ───────────────────────────────────────────────────────

phase('Remediate');

let remediateResult = null;
const fixableFromReview =
  reviewResult && reviewResult.confirmedIssues
    ? reviewResult.confirmedIssues.filter(f => f.autoFixed !== true)
    : [];

if (fixableFromReview.length > 0) {
  log(fixableFromReview.length + ' review finding(s) to address...');

  remediateResult = await agent(
    `The self-review found issues with the fix for issue #${issueNumber}. Address what you can.

REVIEW FINDINGS:
${JSON.stringify(fixableFromReview, null, 2)}

For each finding:
1. Read the affected file
2. If the fix is mechanical and safe, apply it
3. If it requires design judgment, skip it and note the reason

After fixes:
- Run type-check on affected packages
- Report what was addressed vs skipped

Do NOT create branches or commits. Do NOT run dev servers.`,
    { label: 'remediate', phase: 'Remediate', schema: REMEDIATE_SCHEMA }
  );

  if (remediateResult) {
    log(
      'Remediated ' +
        remediateResult.findingsAddressed +
        ' finding(s), skipped ' +
        remediateResult.findingsSkipped
    );
  }
} else {
  log('No review findings to remediate');
}

// ── Phase 6: Commit & Push ───────────────────────────────────────────────────

phase('Commit & Push');

const commitResult = await agent(
  `Create a fix branch, commit all changes, and push.

BRANCH NAME: ${plan.branchName}
BASE BRANCH: origin/${baseBranch}
COMMIT MESSAGE: ${plan.commitMessage}

STEPS:
1. Fetch latest: git fetch origin ${baseBranch}
2. Create and switch to branch: git checkout -b ${plan.branchName} origin/${baseBranch}
   If the branch already exists, use: git checkout ${plan.branchName}
3. Stage all modified/created files (but NOT generated files like _generated-changelog.ts):
   - git add the specific files that were changed for the fix
   - Do NOT use git add -A (could pick up unrelated files)
   - Check git diff --cached --stat to verify only expected files are staged
4. Commit with the message (use HEREDOC for multi-line):
   git commit -m "$(cat <<'COMMITEOF'
${plan.commitMessage}

Closes #${issueNumber}

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
COMMITEOF
)"
5. Push: git push -u origin ${plan.branchName}
6. Report the commit SHA and diff stat

If any step fails, report the error and what was accomplished.
Do NOT force push or use --no-verify.`,
  { label: 'commit-push', phase: 'Commit & Push', schema: COMMIT_SCHEMA }
);

if (!commitResult || !commitResult.pushed) {
  return {
    outcome: 'commit-failed',
    error: commitResult ? commitResult.error : 'Commit agent returned null',
    triage: triage,
    plan: plan,
    implementation: implResult,
    review: reviewResult ? reviewResult.overallVerdict : null,
  };
}

log(
  'Pushed ' +
    commitResult.branchName +
    ' (' +
    (commitResult.commitSha || '?') +
    ')'
);

// ── Phase 7: Verify Deploy ──────────────────────────────────────────────────

phase('Verify');
log('Waiting for CI and Vercel...');

const verifyResult = await workflow('verify-deploy', {
  branch: plan.branchName,
});

const deployPassed = verifyResult && verifyResult.outcome === 'success';
log(
  'Deploy verification: ' + (verifyResult ? verifyResult.outcome : 'unknown')
);

// ── Return ───────────────────────────────────────────────────────────────────

return {
  outcome: deployPassed
    ? 'success'
    : verifyResult && verifyResult.outcome === 'failure'
      ? 'deploy-failed'
      : 'deploy-timeout',
  issue: {
    number: issueNumber,
    title: triage.title,
    type: triage.issueType,
    area: triage.area,
    complexity: triage.complexity,
  },
  fix: {
    branch: commitResult.branchName,
    commit: commitResult.commitSha,
    filesChanged: commitResult.filesCommitted,
    diffStat: commitResult.diffStat,
  },
  review: {
    verdict: reviewResult ? reviewResult.overallVerdict : 'unknown',
    confirmedIssues: reviewResult
      ? (reviewResult.confirmedIssues || []).length
      : 0,
    remediatedCount: remediateResult ? remediateResult.findingsAddressed : 0,
  },
  deploy: verifyResult
    ? {
        outcome: verifyResult.outcome,
        vercel: verifyResult.status ? verifyResult.status.vercel : null,
        ci: verifyResult.status ? verifyResult.status.ci : null,
      }
    : null,
  nextSteps: deployPassed
    ? [
        'Create PR from ' + plan.branchName + ' to ' + baseBranch,
        'Run backfill migration if schema changed',
      ]
    : ['Check deploy logs', 'Fix remaining issues manually'],
};
