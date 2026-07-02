export const meta = {
  name: 'test-coverage-gap',
  description:
    'Find untested Convex functions and generate prioritized coverage recommendations',
  whenToUse:
    'When you want to identify which backend functions lack test coverage and prioritize what to test next. Pass args: {domain: "events"} to scope to a specific domain, or no args for full scan.',
  phases: [
    {
      title: 'Inventory',
      detail: 'Catalog all Convex functions and existing tests',
    },
    { title: 'Analyze', detail: 'Assess risk and coverage gaps per domain' },
    {
      title: 'Prioritize',
      detail: 'Rank gaps by risk and generate test skeletons',
    },
  ],
};

const targetDomain = (args && args.domain) || null;
const generateSkeletons = args && args.skeletons === false ? false : true;

const INVENTORY_SCHEMA = {
  type: 'object',
  properties: {
    functions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description:
              'Full function path like events/mutations.ts:createEvent',
          },
          file: { type: 'string' },
          type: {
            type: 'string',
            enum: [
              'query',
              'mutation',
              'action',
              'internalQuery',
              'internalMutation',
              'internalAction',
            ],
          },
          domain: {
            type: 'string',
            description: 'Domain folder name (events, posts, users, etc.)',
          },
          hasAuth: {
            type: 'boolean',
            description: 'Whether it requires authentication',
          },
          mutatesData: {
            type: 'boolean',
            description: 'Whether it writes to the database',
          },
          isInternal: { type: 'boolean' },
        },
        required: [
          'name',
          'file',
          'type',
          'domain',
          'hasAuth',
          'mutatesData',
          'isInternal',
        ],
      },
    },
    testFiles: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          file: { type: 'string' },
          testedFunctions: {
            type: 'array',
            items: { type: 'string' },
            description:
              'Function names referenced in the test (from api.domain.type.name patterns)',
          },
          testCount: { type: 'number' },
        },
        required: ['file', 'testedFunctions', 'testCount'],
      },
    },
    totalFunctions: { type: 'number' },
    totalTests: { type: 'number' },
    totalTestFiles: { type: 'number' },
  },
  required: [
    'functions',
    'testFiles',
    'totalFunctions',
    'totalTests',
    'totalTestFiles',
  ],
};

const ANALYSIS_SCHEMA = {
  type: 'object',
  properties: {
    domain: { type: 'string' },
    totalFunctions: { type: 'number' },
    testedFunctions: { type: 'number' },
    coveragePercent: { type: 'number' },
    untestedFunctions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          type: { type: 'string' },
          riskLevel: {
            type: 'string',
            enum: ['critical', 'high', 'medium', 'low'],
          },
          riskReason: {
            type: 'string',
            description:
              'Why this risk level — e.g. "auth-gated mutation that deletes data"',
          },
          hasAuth: { type: 'boolean' },
          mutatesData: { type: 'boolean' },
          complexity: {
            type: 'string',
            enum: ['simple', 'moderate', 'complex'],
            description:
              'How complex the function is based on LOC and branching',
          },
        },
        required: ['name', 'type', 'riskLevel', 'riskReason'],
      },
    },
    partiallyTestedFunctions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          missingScenarios: {
            type: 'array',
            items: { type: 'string' },
            description: 'Test scenarios that are missing',
          },
        },
        required: ['name', 'missingScenarios'],
      },
    },
    domainSummary: { type: 'string' },
  },
  required: [
    'domain',
    'totalFunctions',
    'testedFunctions',
    'coveragePercent',
    'untestedFunctions',
    'domainSummary',
  ],
};

const PRIORITY_SCHEMA = {
  type: 'object',
  properties: {
    prioritizedGaps: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          rank: { type: 'number' },
          functionName: { type: 'string' },
          domain: { type: 'string' },
          riskLevel: { type: 'string' },
          riskReason: { type: 'string' },
          testScenarios: {
            type: 'array',
            items: { type: 'string' },
            description:
              'Specific test cases to write (e.g. "should reject unauthenticated access", "should cascade delete replies")',
          },
          skeleton: {
            type: 'string',
            description:
              'Test skeleton code using convex-test patterns from the project',
          },
        },
        required: [
          'rank',
          'functionName',
          'domain',
          'riskLevel',
          'testScenarios',
        ],
      },
    },
    coverageSummary: {
      type: 'object',
      properties: {
        totalFunctions: { type: 'number' },
        tested: { type: 'number' },
        untested: { type: 'number' },
        coveragePercent: { type: 'number' },
        criticalGaps: { type: 'number' },
        highGaps: { type: 'number' },
      },
      required: ['totalFunctions', 'tested', 'untested', 'coveragePercent'],
    },
    domainBreakdown: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          domain: { type: 'string' },
          coverage: { type: 'string', description: 'e.g. "5/8 (62%)"' },
          worstGap: {
            type: 'string',
            description: 'Most important untested function',
          },
        },
        required: ['domain', 'coverage'],
      },
    },
    executiveSummary: {
      type: 'string',
      description: '2-3 sentence assessment of test coverage health',
    },
  },
  required: [
    'prioritizedGaps',
    'coverageSummary',
    'domainBreakdown',
    'executiveSummary',
  ],
};

// Phase 1: Inventory all functions and tests
phase('Inventory');

const scopeFilter = targetDomain
  ? `Only scan the "${targetDomain}" domain (convex/${targetDomain}/).`
  : 'Scan ALL domains under convex/.';

const inventory = await agent(
  `Catalog all Convex functions and existing tests in this project.

FUNCTIONS:
${scopeFilter}
Run these to find all exported functions:
1. grep -rn 'export const.*= query\\|export const.*= mutation\\|export const.*= action\\|export const.*= internalQuery\\|export const.*= internalMutation\\|export const.*= internalAction' convex/ --include='*.ts' | grep -v _generated | grep -v node_modules | grep -v test

For each function found:
- name: the full path (e.g. events/mutations.ts:createEvent)
- type: query, mutation, action, or internal variant
- domain: the folder name
- hasAuth: grep for requireAuth, getCurrentPerson, requireEventRole, requireEventMembership in the function
- mutatesData: true for mutations/actions, false for queries
- isInternal: true for internal* variants

TESTS:
Find all test files:
1. find convex/tests -name '*.test.ts' 2>/dev/null
2. Also check: find convex -name '*.test.ts' 2>/dev/null

For each test file:
- file: path
- testedFunctions: grep for api.* patterns to identify which functions are tested
- testCount: count 'it(' or 'test(' occurrences

Be thorough — don't miss functions in subdirectories like convex/addons/, convex/api/, etc.`,
  { label: 'inventory', phase: 'Inventory', schema: INVENTORY_SCHEMA }
);

if (!inventory || !inventory.functions) {
  return { error: 'Inventory phase failed', details: inventory };
}

log(
  inventory.totalFunctions +
    ' functions found, ' +
    inventory.totalTests +
    ' tests across ' +
    inventory.totalTestFiles +
    ' test files'
);

// Phase 2: Analyze coverage gaps per domain
phase('Analyze');

const testedSet = new Set();
if (inventory.testFiles) {
  for (const tf of inventory.testFiles) {
    for (const fn of tf.testedFunctions) {
      testedSet.add(fn);
    }
  }
}

const domains = new Map();
for (const fn of inventory.functions) {
  if (!domains.has(fn.domain)) {
    domains.set(fn.domain, []);
  }
  domains.get(fn.domain).push(fn);
}

const domainList = Array.from(domains.entries()).map(([domain, fns]) => ({
  domain,
  functions: fns,
  testedNames: fns
    .filter(f => {
      const shortName = f.name.split(':').pop();
      return Array.from(testedSet).some(t => t.includes(shortName));
    })
    .map(f => f.name),
}));

const analyses = await pipeline(domainList, d =>
  agent(
    `Analyze test coverage for the "${d.domain}" domain.

FUNCTIONS IN THIS DOMAIN:
${JSON.stringify(d.functions, null, 2)}

FUNCTIONS THAT APPEAR TO BE TESTED (matched by name in test files):
${JSON.stringify(d.testedNames)}

For each UNTESTED function, assess risk:
- critical: auth-gated mutation that deletes/modifies important data, or handles money/permissions
- high: mutation with complex business logic, cascading effects, or multi-table writes
- medium: query with auth checks or complex joins, or simple mutation
- low: simple query, internal helper, or read-only operation

Also check for PARTIALLY tested functions — read the actual test files to see if important scenarios are missing:
${
  inventory.testFiles
    .filter(tf => tf.file.includes(d.domain))
    .map(tf => '- ' + tf.file)
    .join('\n') || '(no test files for this domain)'
}

Read the test files if they exist, and the source functions, to assess completeness.`,
    {
      label: 'analyze:' + d.domain,
      phase: 'Analyze',
      schema: ANALYSIS_SCHEMA,
      agentType: 'reviewer',
    }
  )
);

const validAnalyses = analyses.filter(Boolean);
log(validAnalyses.length + ' domains analyzed');

// Phase 3: Prioritize and generate skeletons
phase('Prioritize');

const allGaps = validAnalyses.flatMap(a =>
  a.untestedFunctions.map(f => ({ ...f, domain: a.domain }))
);

log(
  allGaps.length +
    ' untested functions found, ' +
    allGaps.filter(g => g.riskLevel === 'critical' || g.riskLevel === 'high')
      .length +
    ' are high/critical risk'
);

const prioritized = await agent(
  `Produce a prioritized list of test coverage gaps with test skeletons.

ALL UNTESTED FUNCTIONS (by domain):
${JSON.stringify(
  validAnalyses.map(a => ({
    domain: a.domain,
    coverage:
      a.testedFunctions +
      '/' +
      a.totalFunctions +
      ' (' +
      a.coveragePercent +
      '%)',
    gaps: a.untestedFunctions,
    partiallyTested: a.partiallyTestedFunctions,
  })),
  null,
  2
)}

EXISTING TEST PATTERNS — read these files to understand the project's testing conventions:
- convex/tests/test_helpers.ts (TestScenarios, createTestInstance, etc.)
- One existing test file for reference: find convex/tests -name '*.test.ts' | head -1 (read it)

PRIORITIZATION RULES:
1. Critical risk first, then high, then medium, then low
2. Within same risk level: mutations before queries, auth-gated before public
3. Top 20 gaps maximum — focus on what matters most

${generateSkeletons ? "FOR EACH GAP: Generate a test skeleton using the project's convex-test patterns (TestScenarios, t.withIdentity, etc.). The skeleton should include:\n- Proper imports\n- Test setup using test_helpers\n- describe/it blocks for each scenario\n- Placeholder assertions with TODO comments\n\nMake skeletons realistic — use actual function names from the api object." : 'Skip skeleton generation (args.skeletons: false)'}

Also produce:
- coverageSummary with overall stats
- domainBreakdown showing coverage per domain and worst gap
- executiveSummary: 2-3 sentences on overall test health and where to focus`,
  { label: 'prioritize', phase: 'Prioritize', schema: PRIORITY_SCHEMA }
);

return prioritized;
