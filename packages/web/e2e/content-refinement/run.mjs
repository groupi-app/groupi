import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
const root = dirname(fileURLToPath(import.meta.url));
const web = join(root, '../..');
const repo = join(web, '../..');
const require = createRequire(join(web, 'package.json'));
const { chromium, expect } = require('@playwright/test');
const esbuild = createRequire(require.resolve('vitest/package.json'))(
  'esbuild'
);
const postcss = createRequire(require.resolve('@tailwindcss/postcss'))(
  'postcss'
);
const tailwind = require('@tailwindcss/postcss');
const phase = process.argv.includes('--before') ? 'before' : 'after';
const output = join(repo, '../artifacts/content-refinement', phase);
await mkdir(output, { recursive: true });
const boundary = join(root, 'boundaries.tsx');
const result = await esbuild.build({
  entryPoints: [join(root, 'entry.tsx')],
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'browser',
  jsx: 'automatic',
  absWorkingDir: web,
  tsconfig: join(web, 'tsconfig.json'),
  define: { 'process.env.NODE_ENV': '"development"' },
  nodePaths: [join(web, 'node_modules')],
  plugins: [
    {
      name: 'synthetic-local-boundaries',
      setup(build) {
        build.onResolve(
          { filter: /^@\/hooks\/convex\/use-group-(forms|polls|lists)$/ },
          () => ({ path: boundary })
        );
        build.onResolve(
          { filter: /^@\/features\/content\/tool-scope$/ },
          () => ({ path: boundary })
        );
        build.onResolve({ filter: /^next\/(navigation|link)$/ }, args => ({
          path: args.path,
          namespace: 'fixture-next',
        }));
        build.onLoad({ filter: /.*/, namespace: 'fixture-next' }, args => ({
          contents: `export ${args.path === 'next/link' ? '{Link as default}' : '{useRouter,usePathname}'} from ${JSON.stringify(boundary)}`,
          loader: 'js',
          resolveDir: root,
        }));
        build.onResolve({ filter: /^(react|react-dom)(\/.*)?$/ }, args => ({
          path: require.resolve(args.path),
        }));
        if (phase === 'before')
          build.onLoad(
            {
              filter:
                /components\/organisms\/(group-(forms|polls|lists)|application-question-fields)\.tsx$/,
            },
            args => ({
              contents: execFileSync(
                'git',
                ['show', `5832fe64:${args.path.slice(repo.length + 1)}`],
                { cwd: repo, encoding: 'utf8' }
              ),
              loader: 'tsx',
              resolveDir: dirname(args.path),
            })
          );
      },
    },
  ],
});
const font = await readFile(join(repo, 'assets/fonts/Geologica.woff2'));
const css =
  (
    await postcss([tailwind({ base: web })]).process(
      await readFile(join(web, 'styles/globals.css'), 'utf8'),
      { from: join(web, 'styles/globals.css') }
    )
  ).css +
  `
@font-face { font-family: 'Fixture Geologica'; src: url(data:font/woff2;base64,${font.toString('base64')}) format('woff2'); font-weight: 100 900; font-display: block; } :root { --font-heading: 'Fixture Geologica'; }`;
const html =
  '<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Synthetic Groupi content fixture</title><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>';
const origin = 'https://groupi-content.test';
const browser = await chromium.launch({
  headless: true,
  channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
});
const report = {
  phase,
  browser: browser.version(),
  screenshots: [],
  layouts: [],
  assertions: [],
  errors: [],
  limitations: [
    'Production components and generated CSS run in Chromium; Next router and data hooks are synthetic.',
    'Saved drafts and revisions persist in fixture localStorage only; no live API, authentication, deployed route lifecycle, external notification or real user data was exercised.',
    'Headings use the bundled Geologica font; body text uses the system fallback because Inter is loaded through Next.',
    'Creator pages had no existing cancellation/back navigation guard; browser traversal evidence covers the synthetic router boundary only.',
  ],
};
try {
  const context = await browser.newContext();
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin !== origin) {
      report.errors.push(`External request blocked: ${url.origin}`);
      return route.abort();
    }
    const value =
      url.pathname === '/fixture.js'
        ? ['text/javascript', result.outputFiles[0].text]
        : url.pathname === '/fixture.css'
          ? ['text/css', css]
          : ['text/html', html];
    return route.fulfill({
      status: 200,
      contentType: value[0],
      body: value[1],
    });
  });
  const page = await context.newPage();
  page.on('pageerror', error => report.errors.push(error.message));
  for (const width of [1440, 320, 375, 390])
    for (const owner of ['group', 'event'])
      for (const kind of ['form', 'list', 'poll'])
        for (const view of [
          'editor',
          'participant',
          ...(kind === 'poll'
            ? ['results', ...(phase === 'after' ? ['feed'] : [])]
            : []),
        ]) {
          await page.setViewportSize({ width, height: 1000 });
          await page.goto(
            `${origin}/?kind=${kind}&view=${view}&owner=${owner}`
          );
          await page.locator('h1,h2').first().waitFor({ timeout: 10000 });
          await page.evaluate(() => document.fonts.ready);
          const file = `${owner}-${kind}-${view}-${width}.png`;
          await page.screenshot({ path: join(output, file), fullPage: true });
          report.screenshots.push(file);
          if (view === 'editor') {
            await page.goto(
              `${origin}/?kind=${kind}&view=editor&owner=${owner}&edit=1`
            );
            await page.locator('h1,h2').first().waitFor();
            const populated = `${owner}-${kind}-editor-populated-${width}.png`;
            await page.screenshot({
              path: join(output, populated),
              fullPage: true,
            });
            report.screenshots.push(populated);
          }
          const layout = await page.evaluate(() => ({
            width: innerWidth,
            scroll: document.documentElement.scrollWidth,
            overflow: [
              ...document.querySelectorAll(
                'main,section,article,input,textarea,select,button'
              ),
            ]
              .filter(e => {
                const r = e.getBoundingClientRect();
                return r.width && (r.right > innerWidth + 1 || r.left < -1);
              })
              .map(e => ({ tag: e.tagName, text: e.textContent?.slice(0, 80) }))
              .slice(0, 10),
          }));
          report.layouts.push({ owner, kind, view, ...layout });
        }
  for (const kind of ['form', 'list', 'poll'])
    for (const view of [
      'hub',
      'participant',
      ...(kind === 'poll' ? ['results'] : []),
    ]) {
      await page.goto(`${origin}/?kind=${kind}&view=${view}&empty=1`);
      await page.locator('h1,h2').first().waitFor();
      await page.screenshot({
        path: join(output, `group-${kind}-${view}-empty.png`),
        fullPage: true,
      });
    }
  if (phase === 'after')
    for (const owner of ['group', 'event']) {
      await page.goto(`${origin}/?kind=poll&view=feed&owner=${owner}`);
      await page.getByRole('radio').last().check();
      await page
        .getByRole('button', { name: 'Save vote', exact: true })
        .click();
      await expect(page.getByRole('status')).toContainText('Vote saved.');
      await page
        .getByRole('button', { name: 'View poll results', exact: true })
        .click();
      await expect(
        page.getByRole('heading', { name: 'Latest votes', exact: true })
      ).toBeVisible();
      await page.screenshot({
        path: join(output, `${owner}-poll-feed-results-390.png`),
        fullPage: true,
      });
      report.assertions.push(
        `${owner} poll feed: vote saves and results open inline in actual GroupPollFeed`
      );
    }
  for (const kind of ['form', 'poll']) {
    await page.goto(`${origin}/?kind=${kind}&view=participant&owner=group`);
    const label = kind === 'form' ? 'Save response' : 'Save vote';
    if (kind === 'form')
      await page
        .getByLabel(
          'What would make this gathering welcoming and memorable for you?',
          { exact: true }
        )
        .fill('A persisted synthetic answer from the local browser fixture.');
    else await page.getByRole('radio').last().check();
    await page.getByRole('button', { name: label, exact: true }).click();
    await expect(page.getByRole('status')).toContainText(
      kind === 'form' ? 'Response saved.' : 'Vote saved.'
    );
    await page.getByRole('button', { name: label, exact: true }).click();
    await page.reload();
    if (kind === 'form')
      await expect(
        page.getByLabel(
          'What would make this gathering welcoming and memorable for you?',
          { exact: true }
        )
      ).toHaveValue(
        'A persisted synthetic answer from the local browser fixture.'
      );
    else await expect(page.getByRole('radio').last()).toBeChecked();
    report.assertions.push(
      `${kind}: two saves and reload retain authored response through synthetic reactive revisions`
    );
    await page.keyboard.press('Tab');
    report.assertions.push(
      `${kind}: keyboard Tab focus reaches ${await page.evaluate(() => document.activeElement?.tagName)}`
    );
  }
  for (const kind of ['form', 'poll']) {
    await page.goto(`${origin}/?kind=${kind}&view=participant&owner=group`);
    await page
      .locator('details')
      .evaluateAll(nodes => nodes.forEach(node => (node.open = true)));
    const trigger = page.getByRole('button', {
      name: kind === 'form' ? 'Remove my response' : 'Remove my vote',
      exact: true,
    });
    const beforeCalls = await page.evaluate(
      () => window.fixture.getState().calls.length
    );
    await trigger.click();
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(trigger).toBeFocused();
    expect(
      await page.evaluate(() => window.fixture.getState().calls.length)
    ).toBe(beforeCalls);
    report.assertions.push(
      `${kind}: cancelling removal makes no mutation and restores trigger focus`
    );
    await page.goto(
      `${origin}/?kind=${kind}&view=participant&owner=group&error=1`
    );
    await page
      .getByRole('button', {
        name: kind === 'form' ? 'Save response' : 'Save vote',
        exact: true,
      })
      .click();
    await expect(page.getByRole('status')).toContainText(
      'Synthetic save failure'
    );
    report.assertions.push(
      `${kind}: failed save reports the error and keeps the participant screen`
    );
  }
  await page.goto(`${origin}/?kind=list&view=participant&owner=group`);
  await page
    .getByLabel('New entry', { exact: true })
    .fill('Synthetic local addition');
  await page.getByRole('button', { name: 'Add entry', exact: true }).click();
  await page.reload();
  await expect(
    page.getByLabel('Entry text', { exact: true }).last()
  ).toHaveValue('Synthetic local addition');
  report.assertions.push('list: add and reload persist synthetic entry');
  await page.goto(`${origin}/?kind=poll&view=editor&owner=group&edit=1`);
  await page
    .getByLabel('Poll title', { exact: true })
    .fill('A local unsaved title');
  await page.evaluate(() =>
    history.pushState({}, '', `${location.href}&next=1`)
  );
  await page.goBack();
  await expect(page.getByLabel('Poll title', { exact: true })).toHaveValue(
    'A local unsaved title'
  );
  await page.goForward();
  await expect(page.getByLabel('Poll title', { exact: true })).toHaveValue(
    'A local unsaved title'
  );
  report.assertions.push(
    'poll editor: same-document back/forward preserves local draft; this does not establish Next route unmount behavior'
  );
  if (phase === 'after')
    for (const owner of ['group', 'event']) {
      await page.goto(`${origin}/?kind=form&view=editor&owner=${owner}&edit=1`);
      await page
        .getByLabel('Question 2 option 1', { exact: true })
        .fill(
          'A revised long option welcoming everyone to the community picnic'
        );
      await page
        .getByRole('button', { name: 'Add answer option', exact: true })
        .click();
      await page
        .getByLabel('Question 2 option 3', { exact: true })
        .fill('A new accessible option added directly in the answer layout');
      await page
        .getByRole('button', {
          name: 'Remove question 2 option 2',
          exact: true,
        })
        .click();
      await page
        .getByRole('button', { name: 'Save form settings', exact: true })
        .click();
      await page.goto(`${origin}/?kind=form&view=editor&owner=${owner}&edit=1`);
      await expect(
        page.getByLabel('Question 2 option 1', { exact: true })
      ).toHaveValue(
        'A revised long option welcoming everyone to the community picnic'
      );
      await expect(
        page.getByLabel('Question 2 option 2', { exact: true })
      ).toHaveValue(
        'A new accessible option added directly in the answer layout'
      );
      await expect(
        page.getByLabel('Question 2 option 3', { exact: true })
      ).toHaveCount(0);
      report.assertions.push(
        `${owner} form: checkbox answer label edit, add and remove persist after settings save/reload`
      );
    }
  if (phase === 'after')
    for (const owner of ['group', 'event'])
      for (const kind of ['form', 'list', 'poll']) {
        await page.goto(`${origin}/?kind=${kind}&view=editor&owner=${owner}`);
        const titleLabel = `${kind[0].toUpperCase() + kind.slice(1)} title`;
        await page
          .getByLabel(titleLabel, { exact: true })
          .fill('Unsaved synthetic draft');
        const calls = await page.evaluate(
          () => window.fixture.getState().calls.length
        );
        await page.getByRole('button', { name: 'Cancel', exact: true }).click();
        expect(
          await page.evaluate(() => window.fixture.getState().calls.length)
        ).toBe(calls);
        report.assertions.push(
          `${owner} ${kind}: creator Cancel returns to collection without mutation`
        );
        await page.goto(`${origin}/?kind=${kind}&view=editor&owner=${owner}`);
        await page
          .getByLabel(titleLabel, { exact: true })
          .fill(`Synthetic created ${kind}`);
        if (kind === 'form') {
          await page
            .getByRole('button', { name: 'Add question', exact: true })
            .click();
          await page
            .getByLabel('Question text', { exact: true })
            .fill('A synthetic authored question');
        }
        await page
          .getByRole('button', { name: `Create ${kind}`, exact: true })
          .click();
        expect(
          await page.evaluate(() => window.fixture.getState().tool.title)
        ).toBe(`Synthetic created ${kind}`);
        report.assertions.push(
          `${owner} ${kind}: direct creator fields save through fixture mutation`
        );
      }
} catch (error) {
  report.errors.push(error.stack || String(error));
  process.exitCode = 1;
} finally {
  await writeFile(join(output, 'report.json'), JSON.stringify(report, null, 2));
  await browser.close();
}
console.log(
  JSON.stringify(
    {
      phase,
      screenshots: report.screenshots.length,
      overflows: report.layouts.filter(l => l.scroll > l.width).length,
      assertions: report.assertions,
      errors: report.errors,
    },
    null,
    2
  )
);
