export const meta = {
  name: 'verify-deploy',
  description:
    'Poll Vercel and CI status until all checks resolve, then report',
  whenToUse:
    'After pushing code to verify the build passes. Pass args: {branch: "test"} or {commit: "abc1234"} or {pr: 171}',
  phases: [
    { title: 'Resolve', detail: 'Determine the commit SHA to monitor' },
    { title: 'Poll', detail: 'Check Vercel and CI status until resolved' },
    { title: 'Report', detail: 'Summarize results' },
  ],
};

const branch = (args && args.branch) || null;
const commit = (args && args.commit) || null;
const pr = (args && args.pr) || null;
const repo = 'groupi-app/groupi';

const RESOLVE_SCHEMA = {
  type: 'object',
  properties: {
    sha: { type: 'string', description: 'Full or short commit SHA to monitor' },
    ref: {
      type: 'string',
      description: 'Human-readable ref (branch name, PR number, or raw SHA)',
    },
    error: { type: 'string' },
  },
  required: ['sha', 'ref'],
};

const STATUS_SCHEMA = {
  type: 'object',
  properties: {
    allPassed: { type: 'boolean' },
    anyFailed: { type: 'boolean' },
    stillPending: { type: 'boolean' },
    vercel: {
      type: 'object',
      properties: {
        state: {
          type: 'string',
          description: 'success, failure, pending, or none',
        },
        description: { type: 'string' },
        url: { type: 'string' },
      },
      required: ['state'],
    },
    ci: {
      type: 'object',
      properties: {
        total: { type: 'number' },
        passed: { type: 'number' },
        failed: { type: 'number' },
        pending: { type: 'number' },
        failedNames: { type: 'array', items: { type: 'string' } },
        pendingNames: { type: 'array', items: { type: 'string' } },
      },
      required: ['total', 'passed', 'failed', 'pending'],
    },
    summary: { type: 'string', description: 'One-line human-readable status' },
  },
  required: [
    'allPassed',
    'anyFailed',
    'stillPending',
    'vercel',
    'ci',
    'summary',
  ],
};

// Phase 1: Resolve the commit SHA
phase('Resolve');

let resolvePrompt;
if (commit) {
  resolvePrompt = `The commit SHA is: ${commit}. Set sha to "${commit}" and ref to "commit ${commit}".`;
} else if (pr) {
  resolvePrompt = `Find the HEAD commit SHA for PR #${pr} in repo ${repo}. Run: gh pr view ${pr} --repo ${repo} --json headRefOid --jq '.headRefOid'`;
} else if (branch) {
  resolvePrompt = `Find the HEAD commit SHA for branch "${branch}" in repo ${repo}. Run: git rev-parse origin/${branch} (fetch first with git fetch origin ${branch})`;
} else {
  resolvePrompt = `Find the HEAD commit SHA for the current branch. Run: git rev-parse HEAD`;
}

const resolved = await agent(
  resolvePrompt + '\n\nReturn the sha and a human-readable ref string.',
  { label: 'resolve-sha', phase: 'Resolve', schema: RESOLVE_SCHEMA }
);

if (!resolved || !resolved.sha) {
  return { error: 'Could not resolve commit SHA', details: resolved };
}

log('Monitoring ' + resolved.ref + ' (' + resolved.sha.slice(0, 7) + ')');
const sha = resolved.sha;

// Phase 2: Poll until resolved
phase('Poll');

let attempts = 0;
let lastStatus = null;

while (attempts < 30) {
  attempts++;

  lastStatus = await agent(
    `Check deployment and CI status for commit ${sha} in repo ${repo}.

Run these two commands:
1. gh api repos/${repo}/commits/${sha}/status --jq '{state: .state, statuses: [.statuses[] | {context: .context, state: .state, description: .description, target_url: .target_url}]}'
2. gh api repos/${repo}/commits/${sha}/check-runs --jq '[.check_runs[] | {name: .name, status: .status, conclusion: .conclusion}]'

Parse the results:

VERCEL:
- Look for a status with context "Vercel"
- state: its state field (success/failure/pending), or "none" if no Vercel status exists
- description: its description
- url: its target_url

CI:
- Count check-runs by status/conclusion
- total: all check-runs
- passed: conclusion === "success"
- failed: conclusion === "failure"
- pending: status !== "completed"
- failedNames: names of failed checks
- pendingNames: names of pending checks

OVERALL:
- allPassed: true only if Vercel is "success" AND all CI checks have conclusion "success"
- anyFailed: true if Vercel is "failure"/"error" OR any CI check has conclusion "failure"
- stillPending: true if Vercel hasn't posted OR any CI check is still pending

If stillPending is true, sleep 30 seconds and check again. Repeat up to 6 times (3 minutes).

Write a one-line summary like "Vercel: success, CI: 9/10 passed (1 pending)" or "All 10 checks passed".`,
    {
      label: 'poll-' + attempts,
      phase: 'Poll',
      schema: STATUS_SCHEMA,
      effort: 'low',
    }
  );

  if (!lastStatus) {
    log('Poll ' + attempts + ': no response, retrying...');
    continue;
  }

  log('Poll ' + attempts + ': ' + lastStatus.summary);

  if (lastStatus.allPassed || lastStatus.anyFailed) {
    break;
  }
}

// Phase 3: Report
phase('Report');

const result = {
  commit: sha,
  ref: resolved.ref,
  pollAttempts: attempts,
  status: lastStatus,
  outcome: !lastStatus
    ? 'unknown'
    : lastStatus.allPassed
      ? 'success'
      : lastStatus.anyFailed
        ? 'failure'
        : 'timeout',
};

if (result.outcome === 'success') {
  log('ALL CHECKS PASSED for ' + resolved.ref);
} else if (result.outcome === 'failure') {
  log('FAILED: ' + (lastStatus.summary || 'unknown error'));
} else {
  log('TIMED OUT after ' + attempts + ' attempts — some checks still pending');
}

return result;
