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
  ...guides,
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
      '',
      'Source availability does not establish hosted deployment or registry publication.',
      '',
      ...page.passages.flatMap(passage => [
        `## ${passage.title}`,
        `Canonical passage: ${page.path}#${passage.id}`,
        '',
        passage.text,
        '',
        ...(passage.code
          ? [`\`\`\`${passage.language ?? 'text'}`, passage.code, '```', '']
          : []),
      ]),
    ]
      .join('\n')
      .trimEnd() + '\n';
  artifacts.set(`${page.id}.md`, markdown);
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
const llms =
  [
    '# Groupi developer documentation',
    '',
    'Public source-verified documentation. Availability and version labels are part of each page; package release and deployment are separate evidence.',
    '',
    ...pages.map(
      page =>
        `- [${page.title}](/exports/${page.id}.md): ${page.version}, ${page.availability}`
    ),
  ].join('\n') + '\n';
const llmsPath = resolve(output, '../llms.txt');
if (check) {
  if ((await readFile(llmsPath, 'utf8')) !== llms)
    throw new Error('Stale llms.txt');
} else await writeFile(llmsPath, llms);
console.log(
  `${check ? 'Checked' : 'Generated'} ${pages.length} public pages, ${index.length} passages and ${artifacts.size + 1} exports.`
);
