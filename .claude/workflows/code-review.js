export const meta = {
  name: 'code-review',
  description:
    'Comprehensive multi-dimension code review with adversarial verification and auto-fix',
  whenToUse:
    'When you need a thorough code review of a branch or PR. Pass args: {base: "main", head: "test"} or {pr: 171}. Set args.autoFix: false to skip the quick-fix phase.',
  phases: [
    { title: 'Discover', detail: 'Identify changed files and project context' },
    { title: 'Review', detail: 'Parallel review across relevant dimensions' },
    {
      title: 'Verify',
      detail: 'Adversarially verify high and medium findings',
    },
    { title: 'Quick Fix', detail: 'Auto-apply mechanical fixes in a worktree' },
    {
      title: 'Validate',
      detail: 'Run type-check and tests to verify auto-fixes',
    },
    { title: 'Synthesize', detail: 'Produce final review report' },
  ],
};

const base = (args && args.base) || 'origin/main';
const head = (args && args.head) || 'origin/test';
const prNumber = (args && args.pr) || null;
const autoFixEnabled = args && args.autoFix === false ? false : true;

const FINDINGS_SCHEMA = {
  type: 'object',
  properties: {
    dimension: { type: 'string' },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          severity: {
            type: 'string',
            enum: ['critical', 'high', 'medium', 'low', 'info'],
          },
          file: { type: 'string', description: 'Relative path from repo root' },
          line: {
            type: 'number',
            description: 'Approximate line number, 0 if unknown',
          },
          title: { type: 'string' },
          description: { type: 'string' },
          suggestion: { type: 'string' },
          autoFixable: {
            type: 'boolean',
            description:
              'True ONLY if the fix is mechanical with one correct answer, local to a single file, and requires no design judgment. Examples: adding a missing guard clause, replacing a hardcoded value with a token, adding a missing cleanup call. NOT auto-fixable: architecture changes, security model changes, anything with tradeoffs.',
          },
          fixCode: {
            type: 'string',
            description:
              'If autoFixable is true, the exact code change needed. Show OLD code to find and NEW code to replace it with. Must be precise enough for a find-and-replace.',
          },
        },
        required: ['severity', 'file', 'title', 'description', 'autoFixable'],
      },
    },
    summary: {
      type: 'string',
      description: 'One-paragraph summary of findings for this dimension',
    },
  },
  required: ['dimension', 'findings', 'summary'],
};

const VERDICT_SCHEMA = {
  type: 'object',
  properties: {
    isReal: {
      type: 'boolean',
      description:
        'Whether the finding is a genuine issue in the code as written',
    },
    confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
    reasoning: { type: 'string' },
    adjustedSeverity: {
      type: 'string',
      enum: ['critical', 'high', 'medium', 'low', 'info', 'dismiss'],
    },
    autoFixStillValid: {
      type: 'boolean',
      description:
        'If the original finding was marked autoFixable, is the suggested fix still correct after verification? False if the fix was wrong or incomplete.',
    },
  },
  required: ['isReal', 'confidence', 'reasoning', 'adjustedSeverity'],
};

const DISCOVER_SCHEMA = {
  type: 'object',
  properties: {
    backend: { type: 'array', items: { type: 'string' } },
    frontend: { type: 'array', items: { type: 'string' } },
    config: { type: 'array', items: { type: 'string' } },
    schema: { type: 'array', items: { type: 'string' } },
    test: { type: 'array', items: { type: 'string' } },
    other: { type: 'array', items: { type: 'string' } },
    totalFilesChanged: { type: 'number' },
    totalLinesAdded: { type: 'number' },
    totalLinesRemoved: { type: 'number' },
    hasBackend: { type: 'boolean' },
    hasFrontend: { type: 'boolean' },
    hasConfig: { type: 'boolean' },
    hasSchema: { type: 'boolean' },
    projectRules: {
      type: 'string',
      description:
        'Key architecture/design rules from CLAUDE.md relevant to this diff',
    },
  },
  required: [
    'backend',
    'frontend',
    'config',
    'schema',
    'test',
    'other',
    'hasBackend',
    'hasFrontend',
    'hasConfig',
    'hasSchema',
    'totalFilesChanged',
  ],
};

// Phase 1: Discover
phase('Discover');
const fileMap = await agent(
  `Analyze the diff between ${base} and ${head}. Run:

1. git diff --stat ${base}..${head}
2. git diff --numstat ${base}..${head}

Categorize every changed file:
- backend: files under convex/ (excluding tests)
- frontend: files under packages/web/ or packages/mobile/ or packages/shared/
- config: package.json, pnpm-lock.yaml, *.config.*, vercel.json, .claude/ files
- schema: convex/schema.ts, migration files
- test: *.test.ts, test_helpers.ts, etc.
- other: patches, assets, changelogs, docs

Set hasBackend/hasFrontend/hasConfig/hasSchema to true if those categories have files.

Also read these files to extract key project rules relevant to reviewing the diff:
- CLAUDE.md (top-level project guide)
- .claude/rules/architecture.md (if backend changes)
- .claude/rules/ui-design-system.md (if frontend changes)
Summarize the most relevant rules in projectRules (keep under 500 chars).`,
  { label: 'discover', phase: 'Discover', schema: DISCOVER_SCHEMA }
);

if (!fileMap) {
  return { error: 'Discovery phase failed — could not analyze diff' };
}

log(
  fileMap.totalFilesChanged +
    ' files changed (' +
    (fileMap.totalLinesAdded || '?') +
    '+/' +
    (fileMap.totalLinesRemoved || '?') +
    '-)'
);

// Phase 2: Build dimensions based on what changed
phase('Review');

const projectContext = fileMap.projectRules || '';
const allSourceFiles = [
  ...(fileMap.backend || []),
  ...(fileMap.frontend || []),
  ...(fileMap.schema || []),
];
const diffCmd = `git diff ${base}..${head}`;

const autoFixInstructions = `

IMPORTANT — autoFixable tagging:
For each finding, set autoFixable: true ONLY if ALL of these are true:
1. The fix is mechanical — one correct answer, no design judgment needed
2. The change is local to a single file
3. You can provide the exact OLD and NEW code for a find-and-replace
4. The fix cannot introduce new bugs (e.g. adding a guard, replacing a value, adding a missing call)

If autoFixable: true, you MUST provide fixCode showing:
OLD: <exact code to find>
NEW: <exact replacement code>

Examples of auto-fixable: missing array size guard, hardcoded color replaced with token, missing useEffect cleanup, using denormalized field instead of table scan, adding a missing validator.
Examples of NOT auto-fixable: restructuring architecture, changing auth model, adding new shared helpers, anything requiring changes across multiple files.`;

const DIMENSIONS = [];

if (fileMap.hasBackend || fileMap.hasFrontend) {
  DIMENSIONS.push({
    key: 'correctness',
    prompt: `Review the diff for CORRECTNESS bugs. Focus on:
- Logic errors, off-by-one, wrong variable usage
- Missing null/undefined checks that could crash at runtime
- Incorrect function signatures or argument passing
- Race conditions in async code
- Broken data flow between components

Run: ${diffCmd} -- '*.ts' '*.tsx' '*.mjs' ':!pnpm-lock.yaml' ':!.claude/*' ':!.changeset/*'

Read the full diff carefully. For each file with substantive changes, also read the full file for context.
Focus on: ${allSourceFiles.slice(0, 20).join(', ')}
Only report issues you are confident about — no speculative findings.

Project context: ${projectContext}${autoFixInstructions}`,
  });
}

if (fileMap.hasBackend) {
  DIMENSIONS.push({
    key: 'security',
    prompt: `Review the diff for SECURITY issues. Focus on:
- Authentication/authorization bypasses (missing auth checks)
- Data leakage (returning more data than needed to clients)
- Input validation gaps
- Unsafe data access patterns (can user A access user B's data?)
- Insecure defaults

Run: ${diffCmd} -- 'convex/**/*.ts' 'packages/web/**/*.ts' 'packages/web/**/*.tsx' ':!*.test.*'

Only report real vulnerabilities with concrete exploit paths, not theoretical concerns.

Project context: ${projectContext}${autoFixInstructions}`,
  });

  DIMENSIONS.push({
    key: 'data-integrity',
    prompt: `Review the diff for DATA INTEGRITY issues. Focus on:
- Denormalized fields: are they kept in sync across ALL mutation paths?
- Schema changes: what happens to existing data?
- Missing cascading updates or deletes
- Partial failure scenarios in multi-step mutations

Run: ${diffCmd} -- 'convex/**/*.ts'

Search for all mutation sites that could affect consistency:
- grep -rn 'ctx.db.insert\\|ctx.db.delete\\|ctx.db.patch' convex/ | grep -v test | grep -v _generated

Read convex/schema.ts for the full schema. Verify every write path maintains consistency.

Project context: ${projectContext}${autoFixInstructions}`,
  });
}

if (fileMap.hasBackend || fileMap.hasFrontend) {
  DIMENSIONS.push({
    key: 'performance',
    prompt: `Review the diff for PERFORMANCE issues. Focus on:
- N+1 query patterns
- Missing or incorrect database indexes
- Unnecessary re-renders in React components
- Bundle size impact
- Expensive operations in hot paths
- Memory leaks (missing cleanup in useEffect)

Run: ${diffCmd} -- '*.ts' '*.tsx' ':!pnpm-lock.yaml' ':!.claude/*' ':!.changeset/*' ':!*.test.*'

Report both improvements and regressions.

Project context: ${projectContext}${autoFixInstructions}`,
  });

  DIMENSIONS.push({
    key: 'architecture',
    prompt: `Review the diff for ARCHITECTURE and code quality issues. Focus on:
- Does the code follow established project patterns?
- Are framework best practices followed?
- Component architecture violations
- Design token violations (hardcoded values instead of semantic tokens)
- Import pattern violations
- Unnecessary complexity

Run: ${diffCmd} -- '*.ts' '*.tsx' ':!pnpm-lock.yaml' ':!.claude/*' ':!.changeset/*'

Read the project rules files for context on what patterns are expected.

Project context: ${projectContext}${autoFixInstructions}`,
  });
}

if (fileMap.hasConfig) {
  DIMENSIONS.push({
    key: 'build-config',
    prompt: `Review the diff for BUILD AND CONFIG issues. Focus on:
- Are dependency changes justified and safe?
- Are version pins/overrides documented?
- Is the build pipeline correct?
- Any lockfile inconsistencies?
- Are patches necessary and correctly applied?

Run: ${diffCmd} -- 'package.json' 'pnpm-lock.yaml' '*.mjs' 'vercel.json' 'patches/*' '.github/*'

Check if dependency changes introduce vulnerabilities or break compatibility.

Project context: ${projectContext}${autoFixInstructions}`,
  });
}

log('Running ' + DIMENSIONS.length + ' review dimensions');

const reviews = await pipeline(DIMENSIONS, d =>
  agent(d.prompt, {
    label: 'review:' + d.key,
    phase: 'Review',
    schema: FINDINGS_SCHEMA,
    agentType: 'reviewer',
  })
);

const allFindings = reviews
  .filter(Boolean)
  .flatMap(r => r.findings.map(f => ({ ...f, dimension: r.dimension })))
  .filter(f => f.severity !== 'info');

// Deduplicate findings by file+title similarity
const seen = new Set();
const dedupedFindings = allFindings.filter(f => {
  const key =
    f.file +
    ':' +
    f.title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 40);
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

log(
  dedupedFindings.length +
    ' unique non-info findings (from ' +
    allFindings.length +
    ' raw)'
);

// Phase 3: Verify high, critical, AND medium findings
phase('Verify');

const findingsToVerify = dedupedFindings.filter(
  f =>
    f.severity === 'critical' ||
    f.severity === 'high' ||
    f.severity === 'medium'
);
log('Verifying ' + findingsToVerify.length + ' findings (high + medium)...');

const verified =
  findingsToVerify.length > 0
    ? await pipeline(findingsToVerify, f =>
        agent(
          `You are a skeptical code reviewer. Your job is to REFUTE this finding if possible. Default to isReal=false if uncertain.

FINDING:
- Dimension: ${f.dimension}
- Severity: ${f.severity}
- File: ${f.file}
- Title: ${f.title}
- Description: ${f.description}
${f.suggestion ? '- Suggestion: ' + f.suggestion : ''}
${f.autoFixable ? '- Marked as auto-fixable with fix:\n' + (f.fixCode || '(no fix code provided)') : ''}

To verify or refute:
1. Read the actual file at the path above
2. Read the diff: ${diffCmd} -- '${f.file}'
3. Check if the file is even part of this diff (findings about unchanged code should be dismissed)
4. Search for related code if needed

Consider:
- Does the code actually have this problem, or was it misread?
- Is there handling elsewhere that the reviewer missed?
- Is this about code that was changed in this diff, or pre-existing?
- What's the actual runtime impact?
${f.autoFixable ? '\nAlso verify the suggested auto-fix: Is the OLD code actually present in the file? Would the NEW code be correct? Set autoFixStillValid accordingly.' : ''}

Be rigorous. Only confirm findings that are real issues in changed code.`,
          {
            label:
              'verify:' +
              f.dimension +
              ':' +
              (f.file.split('/').pop() || 'unknown'),
            phase: 'Verify',
            schema: VERDICT_SCHEMA,
            agentType: 'reviewer',
          }
        ).then(v => (v ? { ...f, verdict: v } : null))
      )
    : [];

const confirmedFindings = verified
  .filter(Boolean)
  .filter(f => f.verdict.isReal);
const refutedFindings = verified.filter(Boolean).filter(f => !f.verdict.isReal);

log(
  'Verified: ' +
    confirmedFindings.length +
    ' confirmed, ' +
    refutedFindings.length +
    ' refuted'
);

// Phase 4: Quick Fix — auto-apply verified mechanical fixes
phase('Quick Fix');

const autoFixable = confirmedFindings.filter(
  f => f.autoFixable && f.fixCode && f.verdict.autoFixStillValid !== false
);

const FIX_RESULT_SCHEMA = {
  type: 'object',
  properties: {
    applied: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          file: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string', description: 'What was changed' },
        },
        required: ['file', 'title', 'description'],
      },
    },
    skipped: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          file: { type: 'string' },
          title: { type: 'string' },
          reason: { type: 'string' },
        },
        required: ['file', 'title', 'reason'],
      },
    },
    totalApplied: { type: 'number' },
    totalSkipped: { type: 'number' },
  },
  required: ['applied', 'skipped', 'totalApplied', 'totalSkipped'],
};

let fixResult = null;
if (autoFixEnabled && autoFixable.length > 0) {
  log('Applying ' + autoFixable.length + ' auto-fixes...');

  fixResult = await agent(
    `You are applying verified mechanical fixes to the codebase. Each fix has been reviewed AND adversarially verified as correct.

FIXES TO APPLY:
${JSON.stringify(
  autoFixable.map(f => ({
    file: f.file,
    title: f.title,
    severity: f.verdict.adjustedSeverity || f.severity,
    fixCode: f.fixCode,
    description: f.description,
  })),
  null,
  2
)}

For each fix:
1. Read the file
2. Find the OLD code from fixCode — if it doesn't match exactly, SKIP this fix (add to skipped with reason)
3. Apply the replacement
4. Move to the next fix

After applying all fixes, do NOT run any validation — that happens in the next phase.

Rules:
- Only apply fixes where the OLD code matches exactly
- Do not modify anything beyond what the fix specifies
- If two fixes target the same file, apply them sequentially
- Skip any fix that looks risky or where the code has changed since review
- Report what was applied and what was skipped`,
    { label: 'apply-fixes', phase: 'Quick Fix', schema: FIX_RESULT_SCHEMA }
  );

  if (fixResult) {
    log(
      'Applied ' +
        fixResult.totalApplied +
        ' fixes, skipped ' +
        fixResult.totalSkipped
    );
  }
} else if (!autoFixEnabled) {
  log('Auto-fix disabled (args.autoFix: false) — skipping');
} else {
  log('No auto-fixable findings to apply');
}

// Phase 5: Validate — run checks if any fixes were applied
phase('Validate');

const VALIDATE_SCHEMA = {
  type: 'object',
  properties: {
    typeCheck: { type: 'string', enum: ['pass', 'fail'] },
    typeCheckErrors: {
      type: 'string',
      description: 'Error output if type-check failed',
    },
    tests: { type: 'string', enum: ['pass', 'fail', 'skipped'] },
    testErrors: { type: 'string', description: 'Error output if tests failed' },
    lintTokens: { type: 'string', enum: ['pass', 'fail', 'skipped'] },
    allPassed: { type: 'boolean' },
    summary: { type: 'string' },
  },
  required: ['typeCheck', 'tests', 'allPassed', 'summary'],
};

let validateResult = null;
if (fixResult && fixResult.totalApplied > 0) {
  log('Validating ' + fixResult.totalApplied + ' applied fixes...');

  validateResult = await agent(
    `Auto-fixes were just applied to the codebase. Validate that nothing is broken.

Run these commands in order:
1. pnpm generate — regenerate types (in case new files were added)
2. pnpm check — lint + type-check + format verification
3. pnpm test:run — run all tests
4. pnpm lint:tokens — check design token compliance (if frontend files were changed)

For each command, report pass or fail. If anything fails, include the relevant error output.
Set allPassed: true only if everything passes.

Do NOT run dev servers or builds.`,
    { label: 'validate-fixes', phase: 'Validate', schema: VALIDATE_SCHEMA }
  );

  if (validateResult) {
    log(
      'Validation: ' +
        (validateResult.allPassed
          ? 'ALL PASSED'
          : 'FAILURES DETECTED — ' + validateResult.summary)
    );
  }
} else {
  log('No fixes applied — skipping validation');
}

// Phase 6: Synthesize
phase('Synthesize');

const REPORT_SCHEMA = {
  type: 'object',
  properties: {
    overallVerdict: {
      type: 'string',
      enum: ['approve', 'request-changes', 'comment'],
    },
    overallRiskLevel: { type: 'string', enum: ['low', 'medium', 'high'] },
    executiveSummary: {
      type: 'string',
      description: '2-3 sentence overall assessment',
    },
    confirmedIssues: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          severity: { type: 'string' },
          dimension: { type: 'string' },
          file: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          suggestion: { type: 'string' },
          autoFixed: {
            type: 'boolean',
            description: 'Whether this was auto-fixed',
          },
        },
        required: ['severity', 'dimension', 'file', 'title', 'description'],
      },
    },
    autoFixSummary: {
      type: 'object',
      properties: {
        applied: { type: 'number' },
        skipped: { type: 'number' },
        validationPassed: { type: 'boolean' },
        appliedFixes: {
          type: 'array',
          items: { type: 'string' },
          description: 'One-line descriptions of each applied fix',
        },
      },
    },
    remainingWork: {
      type: 'array',
      items: { type: 'string' },
      description:
        'Issues that still need manual attention (confirmed but not auto-fixed)',
    },
    positives: {
      type: 'array',
      items: { type: 'string' },
      description: '3-5 things the PR does well',
    },
    dimensionSummaries: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          dimension: { type: 'string' },
          summary: { type: 'string' },
          findingsCount: { type: 'number' },
        },
        required: ['dimension', 'summary'],
      },
    },
    stats: {
      type: 'object',
      properties: {
        filesChanged: { type: 'number' },
        totalFindings: { type: 'number' },
        confirmed: { type: 'number' },
        refuted: { type: 'number' },
        autoFixed: { type: 'number' },
        dimensionsReviewed: { type: 'number' },
      },
    },
  },
  required: [
    'overallVerdict',
    'overallRiskLevel',
    'executiveSummary',
    'confirmedIssues',
    'positives',
    'dimensionSummaries',
  ],
};

const autoFixedTitles = fixResult ? fixResult.applied.map(f => f.title) : [];

const reviewSummaries = reviews.filter(Boolean).map(r => ({
  dimension: r.dimension,
  summary: r.summary,
  findingCount: r.findings.length,
  findings: r.findings,
}));

const report = await agent(
  `Synthesize a final code review report${prNumber ? ' for PR #' + prNumber : ''} (${base} → ${head}).

DIMENSION REVIEWS:
${JSON.stringify(reviewSummaries, null, 2)}

ADVERSARIALLY VERIFIED FINDINGS:
Confirmed (include these): ${JSON.stringify(
    confirmedFindings.map(f => ({
      severity: f.verdict.adjustedSeverity || f.severity,
      dimension: f.dimension,
      file: f.file,
      title: f.title,
      description: f.description,
      suggestion: f.suggestion,
      confidence: f.verdict.confidence,
      wasAutoFixed: autoFixedTitles.includes(f.title),
    })),
    null,
    2
  )}

Refuted (EXCLUDE these): ${JSON.stringify(
    refutedFindings.map(f => ({
      title: f.title,
      file: f.file,
      reasoning: f.verdict.reasoning,
    })),
    null,
    2
  )}

AUTO-FIX RESULTS:
${fixResult ? JSON.stringify(fixResult, null, 2) : 'No auto-fixes applied'}

VALIDATION RESULTS:
${validateResult ? JSON.stringify(validateResult, null, 2) : 'No validation needed'}

UNVERIFIED LOW FINDINGS: ${dedupedFindings.filter(f => f.severity === 'low').length}

Rules:
- Include all confirmed findings in confirmedIssues, using adjustedSeverity
- Mark auto-fixed findings with autoFixed: true
- For the overallVerdict, consider auto-fixes as resolved — only unfixed confirmed critical/high issues warrant 'request-changes'
- List remaining work: confirmed findings that were NOT auto-fixed
- Include autoFixSummary with counts and one-line descriptions of applied fixes
- Include 3-5 positives
- Write dimensionSummaries as 1-2 sentences each
- Include stats about the full review process`,
  { label: 'synthesize', phase: 'Synthesize', schema: REPORT_SCHEMA }
);

return report;
