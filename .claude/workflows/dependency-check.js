export const meta = {
  name: 'dependency-check',
  description:
    'Review a dependency update PR for breaking changes, fix simple blockers, and validate',
  whenToUse:
    'When a dependabot PR comes in or you manually bump a dependency. Pass args: {pr: 142} or {package: "next", from: "16.1.7", to: "16.3.0"}. Set args.autoFix: false to skip fixes.',
  phases: [
    { title: 'Gather', detail: 'Identify what changed and fetch changelogs' },
    {
      title: 'Analyze',
      detail:
        'Check for breaking changes, patch conflicts, and override issues',
    },
    {
      title: 'Fix',
      detail:
        'Auto-fix simple blockers (type errors, import changes, lockfile)',
    },
    { title: 'Validate', detail: 'Run type-check and tests to verify fixes' },
    { title: 'Report', detail: 'Produce upgrade safety report' },
  ],
};

const pr = (args && args.pr) || null;
const pkg = (args && args.package) || null;
const fromVersion = (args && args.from) || null;
const toVersion = (args && args.to) || null;
const autoFixEnabled = args && args.autoFix === false ? false : true;

const GATHER_SCHEMA = {
  type: 'object',
  properties: {
    packages: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          from: { type: 'string' },
          to: { type: 'string' },
          isDirect: {
            type: 'boolean',
            description: 'Whether this is a direct dependency (vs transitive)',
          },
          ecosystem: {
            type: 'string',
            enum: ['npm', 'github-actions', 'other'],
          },
        },
        required: ['name', 'from', 'to'],
      },
    },
    prTitle: { type: 'string' },
    prBody: { type: 'string', description: 'First 500 chars of PR body' },
    prBranch: { type: 'string', description: 'The PR branch name' },
    filesChanged: { type: 'array', items: { type: 'string' } },
    ciStatus: {
      type: 'string',
      enum: ['passing', 'failing', 'pending', 'unknown'],
    },
    ciErrors: { type: 'string', description: 'Summary of CI failures if any' },
  },
  required: ['packages'],
};

const ANALYSIS_SCHEMA = {
  type: 'object',
  properties: {
    packageName: { type: 'string' },
    fromVersion: { type: 'string' },
    toVersion: { type: 'string' },
    semverBump: {
      type: 'string',
      enum: ['patch', 'minor', 'major', 'unknown'],
    },
    breakingChanges: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          description: { type: 'string' },
          affectsUs: {
            type: 'boolean',
            description: 'Whether this breaking change affects our codebase',
          },
          evidence: {
            type: 'string',
            description: 'Why it does or does not affect us',
          },
          fixable: {
            type: 'boolean',
            description:
              'Whether this can be auto-fixed with a simple code change',
          },
          fixDescription: {
            type: 'string',
            description: 'What the fix would be, if fixable',
          },
        },
        required: ['description', 'affectsUs'],
      },
    },
    patchConflicts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          patchFile: { type: 'string' },
          conflict: {
            type: 'string',
            description: 'What might break in the patch',
          },
          severity: {
            type: 'string',
            enum: ['will-break', 'might-break', 'safe'],
          },
          fixable: {
            type: 'boolean',
            description: 'Can the patch be regenerated or removed?',
          },
          fixDescription: { type: 'string' },
        },
        required: ['patchFile', 'conflict', 'severity'],
      },
    },
    overrideConflicts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          override: {
            type: 'string',
            description: 'The override entry in package.json',
          },
          conflict: { type: 'string' },
          fixable: {
            type: 'boolean',
            description: 'Can the override be updated or removed?',
          },
          fixDescription: { type: 'string' },
        },
        required: ['override', 'conflict'],
      },
    },
    typeErrors: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          file: { type: 'string' },
          error: { type: 'string' },
          fixable: { type: 'boolean' },
          fixDescription: { type: 'string' },
        },
        required: ['file', 'error'],
      },
      description:
        'Type errors caused by the upgrade (from running type-check on the PR branch)',
    },
    notableChanges: {
      type: 'array',
      items: { type: 'string' },
      description: 'Notable non-breaking changes worth knowing about',
    },
    recommendation: {
      type: 'string',
      enum: ['safe-to-merge', 'needs-testing', 'needs-changes', 'do-not-merge'],
    },
    reasoning: { type: 'string' },
  },
  required: [
    'packageName',
    'fromVersion',
    'toVersion',
    'semverBump',
    'breakingChanges',
    'patchConflicts',
    'overrideConflicts',
    'recommendation',
    'reasoning',
  ],
};

const FIX_SCHEMA = {
  type: 'object',
  properties: {
    fixes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            enum: [
              'type-error',
              'import-change',
              'api-rename',
              'patch-update',
              'patch-remove',
              'override-update',
              'override-remove',
              'lockfile-regen',
              'config-update',
            ],
          },
          file: { type: 'string' },
          description: { type: 'string' },
          applied: { type: 'boolean' },
          skippedReason: {
            type: 'string',
            description: 'Why it was skipped, if not applied',
          },
        },
        required: ['category', 'description', 'applied'],
      },
    },
    totalApplied: { type: 'number' },
    totalSkipped: { type: 'number' },
    lockfileRegenerated: { type: 'boolean' },
    committed: { type: 'boolean' },
    commitSha: { type: 'string' },
  },
  required: ['fixes', 'totalApplied', 'totalSkipped'],
};

const VALIDATE_SCHEMA = {
  type: 'object',
  properties: {
    typeCheck: { type: 'string', enum: ['pass', 'fail'] },
    typeCheckErrors: { type: 'string' },
    tests: { type: 'string', enum: ['pass', 'fail', 'skipped'] },
    testErrors: { type: 'string' },
    lint: { type: 'string', enum: ['pass', 'fail', 'skipped'] },
    lintErrors: { type: 'string' },
    allPassed: { type: 'boolean' },
    summary: { type: 'string' },
  },
  required: ['typeCheck', 'tests', 'allPassed', 'summary'],
};

const REPORT_SCHEMA = {
  type: 'object',
  properties: {
    overallRecommendation: {
      type: 'string',
      enum: ['safe-to-merge', 'needs-testing', 'needs-changes', 'do-not-merge'],
    },
    summary: { type: 'string', description: '2-3 sentence summary' },
    packageResults: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          bump: { type: 'string' },
          recommendation: { type: 'string' },
          breakingChangesCount: { type: 'number' },
          affectsUs: {
            type: 'number',
            description: 'How many breaking changes actually affect us',
          },
          patchConflicts: { type: 'number' },
          keyPoints: { type: 'array', items: { type: 'string' } },
        },
        required: ['name', 'bump', 'recommendation'],
      },
    },
    fixesSummary: {
      type: 'object',
      properties: {
        applied: { type: 'number' },
        skipped: { type: 'number' },
        categories: {
          type: 'array',
          items: { type: 'string' },
          description: 'One-line per applied fix',
        },
        validationPassed: { type: 'boolean' },
      },
    },
    remainingBlockers: {
      type: 'array',
      items: { type: 'string' },
      description: 'Issues that still prevent merging (not auto-fixed)',
    },
    actionItems: {
      type: 'array',
      items: { type: 'string' },
      description: 'Concrete things to do before merging (or reasons not to)',
    },
  },
  required: [
    'overallRecommendation',
    'summary',
    'packageResults',
    'actionItems',
  ],
};

// Phase 1: Gather
phase('Gather');

let gatherPrompt;
if (pr) {
  gatherPrompt = `Analyze PR #${pr} to identify dependency updates.

Run:
1. gh pr view ${pr} --json title,body,files,headRefName --jq '{title: .title, body: (.body | .[0:500]), files: [.files[].path], branch: .headRefName}'
2. gh pr diff ${pr} -- package.json pnpm-lock.yaml

From the diff, extract every package that changed version. For each, note the old and new version.
Determine if each is a direct dependency (in dependencies/devDependencies) or transitive (only in lockfile).

Also check CI status:
3. gh pr checks ${pr} --json name,state --jq '[.[] | {name: .name, state: .state}]'

Set ciStatus to 'passing' if all checks pass, 'failing' if any failed, 'pending' if still running.
If failing, summarize the errors in ciErrors (check the failed check's logs if accessible).`;
} else if (pkg) {
  gatherPrompt = `The user wants to check upgrading "${pkg}" from ${fromVersion || '(current)'} to ${toVersion || '(latest)'}.

Run:
1. cat package.json and find the current version of ${pkg}
2. If no target version specified, check the latest: npm view ${pkg} version

Return a single package entry with the from/to versions. Set ciStatus to 'unknown'.`;
} else {
  return {
    error:
      'Pass either args.pr (PR number) or args.package + args.from + args.to',
  };
}

const gathered = await agent(gatherPrompt, {
  label: 'gather',
  phase: 'Gather',
  schema: GATHER_SCHEMA,
});

if (!gathered || !gathered.packages || gathered.packages.length === 0) {
  return { error: 'Could not identify any package updates', details: gathered };
}

log(
  gathered.packages.length +
    ' package(s): ' +
    gathered.packages.map(p => p.name + ' ' + p.from + '→' + p.to).join(', ')
);
if (gathered.ciStatus) {
  log(
    'CI status: ' +
      gathered.ciStatus +
      (gathered.ciErrors ? ' — ' + gathered.ciErrors : '')
  );
}

// Phase 2: Analyze each package
phase('Analyze');

const analyses = await pipeline(
  gathered.packages.filter(p => p.ecosystem !== 'github-actions'),
  p =>
    agent(
      `Analyze the upgrade of "${p.name}" from ${p.from} to ${p.to}.

1. CHANGELOG / RELEASE NOTES:
   Fetch the changelog or release notes. Try these in order:
   - npm view ${p.name} repository.url — then check GitHub releases
   - Search for CHANGELOG.md in the package
   - Web search: "${p.name} changelog ${p.from} ${p.to}"
   Look for breaking changes, deprecations, and notable fixes between ${p.from} and ${p.to}.

2. PATCH CONFLICTS:
   Check if we have any patches for this package or related packages:
   - ls patches/ and check for any patch file mentioning "${p.name}"
   - Read package.json patchedDependencies section
   If patches exist, read the patch file and assess whether the upgrade would break it.
   For each conflict, assess if it's fixable:
   - Can the patch be regenerated for the new version?
   - Is the upstream bug fixed, making the patch removable?

3. OVERRIDE CONFLICTS:
   Check package.json pnpm.overrides for entries related to "${p.name}" or its peers.
   For each conflict, assess if the override can be safely updated or removed.

4. TYPE ERRORS:
   ${pr ? 'Check out the PR branch and run type-check to find errors caused by the upgrade:\n   - git fetch origin ' + (gathered.prBranch || '') + '\n   - git checkout ' + (gathered.prBranch || 'FETCH_HEAD') + '\n   - pnpm install --frozen-lockfile 2>&1 | tail -5\n   - pnpm type-check 2>&1 | grep "error TS" | head -20\n   For each type error, determine if it is fixable (simple rename, new import path, added parameter).' : 'Skip — no PR branch to test.'}

5. USAGE IN CODEBASE:
   Search for how we use this package:
   - grep -rn "from '${p.name}" convex/ packages/ --include='*.ts' --include='*.tsx' | head -20
   Cross-reference breaking changes with our actual usage.

6. SEMVER:
   Classify the bump as patch/minor/major.

For each issue found, mark fixable: true if the fix is mechanical (rename, update import path, remove obsolete patch, update override version, regenerate lockfile). Mark fixable: false for anything requiring design decisions.`,
      {
        label: 'analyze:' + p.name,
        phase: 'Analyze',
        schema: ANALYSIS_SCHEMA,
        agentType: 'reviewer',
      }
    )
);

const validAnalyses = analyses.filter(Boolean);
log(validAnalyses.length + ' package(s) analyzed');

// Collect all fixable issues across analyses
const fixableIssues = [];
for (const a of validAnalyses) {
  for (const bc of a.breakingChanges || []) {
    if (bc.affectsUs && bc.fixable) {
      fixableIssues.push({
        category: 'api-rename',
        pkg: a.packageName,
        description: bc.fixDescription || bc.description,
      });
    }
  }
  for (const pc of a.patchConflicts || []) {
    if (pc.fixable) {
      fixableIssues.push({
        category:
          pc.fixDescription &&
          pc.fixDescription.toLowerCase().includes('remove')
            ? 'patch-remove'
            : 'patch-update',
        pkg: a.packageName,
        file: pc.patchFile,
        description: pc.fixDescription || pc.conflict,
      });
    }
  }
  for (const oc of a.overrideConflicts || []) {
    if (oc.fixable) {
      fixableIssues.push({
        category:
          oc.fixDescription &&
          oc.fixDescription.toLowerCase().includes('remove')
            ? 'override-remove'
            : 'override-update',
        pkg: a.packageName,
        description: oc.fixDescription || oc.conflict,
      });
    }
  }
  for (const te of a.typeErrors || []) {
    if (te.fixable) {
      fixableIssues.push({
        category: 'type-error',
        pkg: a.packageName,
        file: te.file,
        description: te.fixDescription || te.error,
      });
    }
  }
}

// Phase 3: Fix simple blockers
phase('Fix');

let fixResult = null;
if (autoFixEnabled && fixableIssues.length > 0 && pr) {
  log(fixableIssues.length + ' fixable issue(s) found — applying...');

  fixResult = await agent(
    `You are fixing simple blockers preventing a dependabot PR from merging.

PR BRANCH: ${gathered.prBranch || '(unknown)'}
PR NUMBER: ${pr}

FIXABLE ISSUES:
${JSON.stringify(fixableIssues, null, 2)}

STEPS:
1. Make sure you're on the PR branch:
   git fetch origin ${gathered.prBranch || ''}
   git checkout ${gathered.prBranch || 'FETCH_HEAD'}

2. For each fixable issue, apply the fix:

   TYPE ERRORS (type-error):
   - Read the file, find the error, apply the fix (rename, add parameter, update import)
   - These are typically: renamed exports, changed function signatures, moved modules

   IMPORT/API CHANGES (import-change, api-rename):
   - grep for the old import/API name across the codebase
   - Replace with the new name

   PATCH FIXES (patch-update, patch-remove):
   - If the upstream bug is fixed: remove the patch file AND the patchedDependencies entry in package.json
   - If the patch needs updating: read the new package source, regenerate the patch for the new code
   - After patch changes: run pnpm install to regenerate the lockfile

   OVERRIDE FIXES (override-update, override-remove):
   - Update the version in pnpm.overrides, or remove the entry if no longer needed
   - After override changes: run pnpm install to regenerate the lockfile

   LOCKFILE (lockfile-regen):
   - Run: pnpm install --no-frozen-lockfile
   - Stage the updated pnpm-lock.yaml

3. After all fixes, run pnpm install to ensure the lockfile is consistent.

4. Stage and commit all changes:
   git add -A
   git commit -m "fix: resolve compatibility issues for $(package name) upgrade"
   git push

5. Report what was applied and what was skipped (with reasons).

RULES:
- Only apply fixes that are mechanical and safe
- If a fix requires understanding business logic, SKIP it
- If the PR branch doesn't exist or can't be checked out, SKIP all fixes
- Do NOT modify test assertions or skip tests
- Do NOT run dev servers`,
    { label: 'apply-fixes', phase: 'Fix', schema: FIX_SCHEMA }
  );

  if (fixResult) {
    log(
      'Applied ' +
        fixResult.totalApplied +
        ' fix(es), skipped ' +
        fixResult.totalSkipped
    );
  }
} else if (!autoFixEnabled) {
  log('Auto-fix disabled (args.autoFix: false)');
} else if (!pr) {
  log('No PR specified — skipping fixes (can only fix on a PR branch)');
} else {
  log('No fixable issues found');
}

// Phase 4: Validate
phase('Validate');

let validateResult = null;
if (fixResult && fixResult.totalApplied > 0) {
  log('Validating fixes...');

  validateResult = await agent(
    `Validate that the dependency upgrade fixes are correct.

Make sure you're on the PR branch (${gathered.prBranch || 'the dependabot branch'}).

Run in order:
1. pnpm install --frozen-lockfile — verify lockfile is consistent
   If this fails, run pnpm install (without frozen) and stage the updated lockfile
2. pnpm check — lint + type-check + format
3. pnpm test:run — run all tests

For each command, report pass or fail with error output if failed.
Set allPassed: true only if everything passes.

Do NOT run dev servers or builds.`,
    { label: 'validate', phase: 'Validate', schema: VALIDATE_SCHEMA }
  );

  if (validateResult) {
    log(
      'Validation: ' +
        (validateResult.allPassed
          ? 'ALL PASSED'
          : 'ISSUES — ' + validateResult.summary)
    );
  }
} else {
  log('No fixes applied — skipping validation');
}

// Phase 5: Report
phase('Report');

const report = await agent(
  `Synthesize a dependency upgrade report.

PACKAGE ANALYSES:
${JSON.stringify(validAnalyses, null, 2)}

PR CONTEXT:
${gathered.prTitle ? 'Title: ' + gathered.prTitle : 'Manual upgrade check'}
${gathered.filesChanged ? 'Files changed: ' + gathered.filesChanged.join(', ') : ''}
CI status before fixes: ${gathered.ciStatus || 'unknown'}

FIXES APPLIED:
${fixResult ? JSON.stringify(fixResult, null, 2) : 'No fixes applied'}

VALIDATION RESULTS:
${validateResult ? JSON.stringify(validateResult, null, 2) : 'No validation run'}

Rules:
- overallRecommendation considers the state AFTER fixes:
  - safe-to-merge: all issues fixed, validation passes, no remaining concerns
  - needs-testing: fixes applied but should be manually verified
  - needs-changes: some issues couldn't be auto-fixed
  - do-not-merge: fundamental incompatibilities
- remainingBlockers: list issues that were NOT fixed (skipped or unfixable)
- If fixes were applied and validation passed, upgrade the recommendation accordingly
- actionItems: what the developer still needs to do (if anything)
- keyPoints per package: 2-3 most important things to know`,
  { label: 'report', phase: 'Report', schema: REPORT_SCHEMA }
);

return report;
