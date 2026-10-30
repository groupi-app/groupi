import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, relative } from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { createApiV1App } = require('../../../convex/api/v1/index.ts') as {
  createApiV1App: () => { request: (path: string) => Promise<Response> };
};
const { createApiV2App } = require('../../../convex/api/v2/index.ts') as {
  createApiV2App: () => { request: (path: string) => Promise<Response> };
};
import { guides, type Page } from '../src/content';
const root = fileURLToPath(new URL('../../../', import.meta.url));
const output = fileURLToPath(new URL('../public/exports/', import.meta.url));
const check = process.argv.includes('--check');
// Until a docs deployment is configured, exports explicitly target local preview.
if (
  process.env.VERCEL_ENV === 'production' &&
  !process.env.PORTAL_DOCS_ORIGIN
) {
  throw new Error(
    'Set PORTAL_DOCS_ORIGIN to the verified public documentation origin before production publication.'
  );
}
const docsOrigin = new URL(
  process.env.PORTAL_DOCS_ORIGIN ?? 'http://localhost:4173'
);
if (
  docsOrigin.pathname !== '/' ||
  docsOrigin.search ||
  docsOrigin.hash ||
  docsOrigin.username ||
  docsOrigin.password ||
  (docsOrigin.protocol !== 'https:' &&
    !(
      docsOrigin.protocol === 'http:' &&
      ['localhost', '127.0.0.1', '[::1]'].includes(docsOrigin.hostname)
    ))
)
  throw new Error(
    'PORTAL_DOCS_ORIGIN must be a verified HTTPS origin, or loopback for local preview.'
  );
const canonical = (path: string) => new URL(path, docsOrigin).href;
const publicArtifacts = new Map<string, string>();
const referenceRevision = 'ec33a44dce0ba9be828c3d8916d768ae81060a8c';

execFileSync(
  process.execPath,
  [resolve(root, 'packages/cli/scripts/generate-reference.js'), '--check'],
  { stdio: 'pipe' }
);
const cliPath = 'packages/cli/docs/command-reference.json';
const cli = JSON.parse(await readFile(resolve(root, cliPath), 'utf8')) as {
  package: string;
  version: string;
  commands: { path: string; help: string }[];
};
const pages: Page[] = [
  ...guides.filter(page => page.id !== 'contributor'),
  {
    id: 'cli-reference',
    path: `/cli/${cli.version}/reference`,
    title: `CLI ${cli.version} command reference`,
    audience: 'Reference',
    version: `cli-${cli.version}`,
    availability: 'Current',
    source: cliPath,
    passages: cli.commands.map(command => ({
      id: command.path.replaceAll(' ', '-'),
      title: command.path,
      text: `Generated ${cli.package} ${cli.version} command help. Source/local availability; registry release unverified.`,
      code: command.help.trimEnd(),
      language: 'text',
      keywords: command.help.match(/--[a-z][a-z-]*/g) ?? [],
    })),
  },
];
const evolution = pages.find(page => page.id === 'api-sdk-evolution');
if (!evolution) throw new Error('Missing API/SDK evolution guide');
const outline = await readFile(resolve(root, evolution.source), 'utf8');
const passageIds = new Set<string>();
evolution.passages = outline
  .split(/^## /m)
  .slice(1)
  .filter(section => !section.startsWith('Table of Contents\n'))
  .map(section => {
    const [title, ...lines] = section.split('\n');
    const id = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    if (!id || passageIds.has(id))
      throw new Error(`Invalid outline anchor: ${id}`);
    passageIds.add(id);
    const body = lines.join('\n');
    const examples = [...body.matchAll(/```([a-z]*)\n([\s\S]*?)```/g)];
    if (examples.length > 1) throw new Error(`Multiple examples in ${id}`);
    const references = [
      ...body.matchAll(/\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/g),
    ].map(match => ({ title: match[1], href: match[2] }));
    const text = body
      .replace(/```[a-z]*\n[\s\S]*?```/g, '')
      .replace(/\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/g, '')
      .replace(/\s+/g, ' ')
      .replace(/[,\s]+$/g, '')
      .trim();
    if (!text) throw new Error(`Empty outline passage: ${id}`);
    return {
      id,
      title,
      text,
      ...(examples[0]
        ? { language: examples[0][1], code: examples[0][2].trimEnd() }
        : {}),
      ...(references.length ? { references } : {}),
    };
  });
if (!evolution.passages.length)
  throw new Error('Empty API/SDK evolution outline');
const handlerExample = pages
  .find(page => page.id === 'addons')
  ?.passages.find(passage => passage.id === 'source-handlers');
if (!handlerExample) throw new Error('Missing source handler journey');
handlerExample.code = await readFile(
  resolve(root, 'convex/addons/handlers/bringList.ts'),
  'utf8'
);
const artifacts = new Map<string, string>();
for (const [version, app] of [
  ['v1', createApiV1App()],
  ['v2', createApiV2App()],
] as const) {
  const response = await app.request('/openapi.json');
  if (!response.ok) throw new Error(`Cannot generate ${version} OpenAPI`);
  const schema = (await response.json()) as {
    paths: Record<
      string,
      Record<
        string,
        {
          summary?: string;
          description?: string;
          parameters?: unknown;
          requestBody?: unknown;
          responses?: unknown;
        }
      >
    >;
  };
  artifacts.set(
    `openapi-${version}.json`,
    JSON.stringify(schema, null, 2) + '\n'
  );
  const passages = Object.entries(schema.paths).flatMap(([path, operations]) =>
    Object.entries(operations)
      .filter(([method]) =>
        ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'].includes(
          method
        )
      )
      .map(([method, operation]) => ({
        id: `${method}-${path.replace(/^\//, '').replaceAll('/', '-').replace(/[{}]/g, '')}`,
        title: `${method.toUpperCase()} /api/${version}${path}`,
        text: `${operation.summary ?? ''} ${operation.description ?? ''} Source-generated operation; schemas and per-operation responses are below. Deployment compatibility must be verified against the intended instance.`,
        code: JSON.stringify(
          {
            parameters: operation.parameters,
            requestBody: operation.requestBody,
            responses: operation.responses,
          },
          null,
          2
        ),
        language: 'json',
      }))
  );
  pages.push({
    id: `api-${version}`,
    path: `/${version}/reference/api`,
    title: `REST ${version} API reference`,
    audience: 'Reference',
    version,
    availability: 'Current',
    source: `convex/api/${version}/index.ts`,
    passages,
  });
}
async function sourceFiles(directory: string): Promise<string[]> {
  const entries = await readdir(resolve(root, directory), {
    withFileTypes: true,
  });
  const nested = await Promise.all(
    entries.map(entry =>
      entry.isDirectory()
        ? sourceFiles(`${directory}/${entry.name}`)
        : entry.name.endsWith('.ts')
          ? [`${directory}/${entry.name}`]
          : []
    )
  );
  return nested.flat();
}
const dependencies = [
  ...new Set([
    ...guides.map(page => page.source),
    'packages/portal/src/content.ts',
    'packages/portal/src/learning-content.ts',
    'packages/portal/src/learning-examples.ts',
    'docs/adr/0007-optional-convex-sdk-subscriptions.md',
    'packages/sdk/package.json',
    'packages/sdk/operations.json',
    'packages/sdk/type-audit.json',
    'packages/python-sdk/README.md',
    'packages/python-sdk/pyproject.toml',
    'convex/addons/handlers/bringList.ts',
    'convex/addons/registry.ts',
    'packages/web/features/addons/runtime/catalog.ts',
    'convex/lib/requestId.ts',
    'convex/events/rest.ts',
    cliPath,
    'packages/cli/docs/agent-workflows.json',
    'packages/cli/scripts/generate-reference.js',
    'packages/cli/src/command.js',
    ...(await sourceFiles('convex/api/v1')),
    ...(await sourceFiles('convex/api/v2')),
    ...(await sourceFiles('convex/authorization')),
    ...(await sourceFiles('convex/delegatedApps')),
  ]),
].sort();
const hashes = Object.fromEntries(
  await Promise.all(
    dependencies.map(async path => [
      path,
      createHash('sha256')
        .update(await readFile(resolve(root, path)))
        .digest('hex'),
    ])
  )
);
const corpus = {
  schemaVersion: 1,
  owner: '@TheiaSurette',
  evidence: 'source-generated; deployment and registry release unverified',
  referenceRevision,
  documentationOrigin: docsOrigin.origin,
  verifiedOn: '2026-10-30',
  sources: hashes,
  pages,
};
artifacts.set('corpus.json', JSON.stringify(corpus) + '\n');
const index = pages.flatMap(page =>
  page.passages.map(passage => ({
    id: `${page.id}:${passage.id}`,
    href: `${page.path}#${passage.id}`,
    title: passage.title,
    pageTitle: page.title,
    version: page.version,
    availability: page.availability,
    text: passage.text,
    identifiers: passage.title,
    keywords: passage.keywords ?? [],
  }))
);
artifacts.set(
  'search-index.json',
  JSON.stringify({ schemaVersion: 1, entries: index }) + '\n'
);
for (const page of pages) {
  const markdown =
    [
      `# ${page.title}`,
      '',
      `${page.version} · ${page.availability} · Source: ${page.source}`,
      `Canonical document: ${canonical(`${page.path}.md`)}`,
      `Public contract baseline: ${referenceRevision} · verified 2026-10-30`,
      '',
      'Source availability does not establish hosted deployment or registry publication.',
      '',
      ...(page.passages.length >= 3
        ? [
            '## Table of Contents',
            '',
            ...page.passages.map(
              passage => `- [${passage.title}](#${passage.id})`
            ),
            '',
          ]
        : []),
      ...page.passages.flatMap(passage => [
        `<a id="${passage.id}"></a>`,
        `## ${passage.title}`,
        `Canonical passage: ${canonical(`${page.path}#${passage.id}`)}`,
        '',
        passage.text,
        '',
        ...(passage.code
          ? [`\`\`\`${passage.language ?? 'text'}`, passage.code, '```', '']
          : []),
        ...(passage.references?.flatMap(reference => [
          `- [${reference.title}](${reference.href.startsWith('/') ? canonical(reference.href) : reference.href})`,
        ]) ?? []),
        ...(passage.references?.length ? [''] : []),
      ]),
    ]
      .join('\n')
      .trimEnd() + '\n';
  artifacts.set(`${page.id}.md`, markdown);
  publicArtifacts.set(`${page.path.slice(1)}.md`, markdown);
  if (page.id === 'agents') publicArtifacts.set('agents.md', markdown);
  artifacts.set(
    `${page.id}.txt`,
    markdown
      .replace(/^#{1,2} /gm, '')
      .replace(/^```[^\n]*\n/gm, '')
      .trimEnd() + '\n'
  );
}
await mkdir(output, { recursive: true });
for (const [name, value] of artifacts) {
  const path = resolve(output, name);
  if (check) {
    let previous = '';
    try {
      previous = await readFile(path, 'utf8');
    } catch {
      /* Missing output is stale. */
    }
    if (previous !== value)
      throw new Error(
        `Stale public export ${relative(root, path)}; run pnpm --filter @groupi/portal content:generate`
      );
  } else await writeFile(path, value);
}
const generated = fileURLToPath(new URL('../src/generated/', import.meta.url));
await mkdir(generated, { recursive: true });
for (const name of ['corpus.json', 'search-index.json']) {
  const value = artifacts.get(name)!;
  const path = resolve(generated, name);
  if (check) {
    if ((await readFile(path, 'utf8')) !== value)
      throw new Error(`Stale client corpus ${name}`);
  } else await writeFile(path, value);
}
const integrationPages = [
  'agents',
  'introduction',
  'integrator',
  'event-widget',
  'group-events',
  'event-updates',
  'connect-users',
  'concepts',
  'auth',
  'sdks',
  'versions',
  'cli',
  'cli-reference',
  'api-v2',
  'api-v1',
];
const llms = [
  '# Build with Groupi',
  '',
  'Public integration documentation. Start with the agent guide, then retrieve only the task and reference pages you need. Documentation does not grant account access.',
  '',
  `Public contract baseline: ${referenceRevision}. Source support, hosted deployment and registry publication are separate evidence.`,
  '',
  ...integrationPages.map(id => {
    const page = pages.find(candidate => candidate.id === id);
    if (!page) throw new Error(`Missing integration discovery page: ${id}`);
    return `- [${page.title}](${canonical(`${page.path}.md`)}): ${page.version}, ${page.availability}`;
  }),
  '',
].join('\n');
publicArtifacts.set('llms.txt', llms);
const introduction = artifacts.get('introduction.md');
if (introduction) {
  // Preserve old downloads while retiring the parallel contributor course.
  publicArtifacts.set('v2/contributor.md', introduction);
  publicArtifacts.set('exports/contributor.md', introduction);
  publicArtifacts.set(
    'exports/contributor.txt',
    artifacts.get('introduction.txt')!
  );
}
for (const [name, value] of publicArtifacts) {
  const path = resolve(output, '..', name);
  if (check) {
    let previous = '';
    try {
      previous = await readFile(path, 'utf8');
    } catch {
      /* Missing means stale. */
    }
    if (previous !== value) throw new Error(`Stale public document ${name}`);
  } else {
    await mkdir(resolve(path, '..'), { recursive: true });
    await writeFile(path, value);
  }
}
console.log(
  `${check ? 'Checked' : 'Generated'} ${pages.length} public pages, ${index.length} passages and ${artifacts.size + 1} exports.`
);
