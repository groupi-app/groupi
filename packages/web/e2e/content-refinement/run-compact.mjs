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
const output = join(
  repo,
  '../artifacts/content-refinement/compact-poll',
  phase
);
await mkdir(output, { recursive: true });
const delivery = join(
  repo,
  '../artifacts/content-refinement/compact-poll/delivery'
);
await mkdir(delivery, { recursive: true });
const boundary = join(root, 'compact-boundaries.tsx');
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
                ['show', `f941bb6c:${args.path.slice(repo.length + 1)}`],
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
  baseline: 'f941bb6ca7735626b365a8a2033e3294ed924013',
  browser: browser.version(),
  layouts: [],
  assertions: [],
  errors: [],
  limits: [
    'Actual components/CSS/Geologica run in Chromium; owner hooks, Next boundaries and persistence are synthetic localStorage.',
    'No authenticated session, real backend, real user data or notifications.',
  ],
};
try {
  const context = await browser.newContext();
  await context.route('**/*', route => {
    const u = new URL(route.request().url());
    if (u.origin !== origin) {
      report.errors.push(`External request blocked: ${u.origin}`);
      return route.abort();
    }
    const value =
      u.pathname === '/fixture.js'
        ? ['text/javascript', result.outputFiles[0].text]
        : u.pathname === '/fixture.css'
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
      for (const scenario of ['short', 'long']) {
        await page.setViewportSize({ width, height: 1000 });
        await page.goto(
          `${origin}/?kind=poll&view=feed&owner=${owner}&scenario=${scenario}`
        );
        await page.getByRole('radio').first().waitFor();
        await page.evaluate(() => document.fonts.ready);
        const stem = `${owner}-${scenario}-${width}`;
        const measure = async mode => {
          const value = await page
            .locator('article')
            .first()
            .evaluate(e => {
              const r = e.getBoundingClientRect();
              return {
                width: r.width,
                height: r.height,
                documentWidth: document.documentElement.scrollWidth,
                viewport: innerWidth,
              };
            });
          report.layouts.push({
            owner,
            scenario,
            viewport: width,
            mode,
            ...value,
          });
          await page.screenshot({
            path: join(output, `${stem}-${mode}.png`),
            fullPage: true,
          });
          if (
            phase === 'after' &&
            owner === 'group' &&
            scenario === 'short' &&
            width === 390
          )
            await page
              .locator('article')
              .first()
              .screenshot({ path: join(delivery, `poll-${mode}.png`) });
        };
        await measure('vote');
        await page
          .getByRole('button', { name: 'View poll results', exact: true })
          .click();
        await measure('results');
        if (phase === 'after') {
          expect(await page.getByRole('radio').count()).toBe(
            scenario === 'short' ? 4 : 2
          );
          expect(await page.getByRole('progressbar').count()).toBe(
            scenario === 'short' ? 4 : 2
          );
          expect(
            await page
              .getByRole('button', { name: 'Save vote', exact: true })
              .count()
          ).toBe(0);
          report.assertions.push(
            `${stem}: inline results reuse one set of option rows and omit Save control`
          );
        }
      }
  for (const width of [1440, 320, 375, 390])
    for (const owner of ['group', 'event'])
      for (const kind of ['form', 'list'])
        for (const view of ['editor', 'participant']) {
          await page.setViewportSize({ width, height: 1000 });
          await page.goto(
            `${origin}/?kind=${kind}&view=${view}&owner=${owner}${view === 'editor' ? '&edit=1' : ''}`
          );
          await page.locator('h1,h2').first().waitFor();
          await page.evaluate(() => document.fonts.ready);
          const box = await page
            .locator('main')
            .first()
            .evaluate(e => {
              const r = e.getBoundingClientRect();
              return {
                width: r.width,
                height: r.height,
                documentWidth: document.documentElement.scrollWidth,
                viewport: innerWidth,
              };
            });
          report.layouts.push({
            kind,
            owner,
            scenario: 'long',
            mode: view,
            ...box,
          });
          await page.screenshot({
            path: join(output, `${owner}-${kind}-${view}-${width}.png`),
            fullPage: true,
          });
          if (
            phase === 'after' &&
            owner === 'group' &&
            width === 390 &&
            view === 'participant'
          )
            await page
              .locator('main')
              .first()
              .screenshot({ path: join(delivery, `${kind}-participant.png`) });
        }
  if (phase === 'after') {
    await page.goto(
      `${origin}/?kind=poll&view=feed&owner=group&scenario=short&private=1`
    );
    await page.getByRole('radio').first().waitFor();
    expect(
      await page
        .getByRole('button', { name: 'View poll results', exact: true })
        .count()
    ).toBe(0);
    expect(await page.evaluate(() => window.fixture.resultsReads)).toBe(0);
    report.assertions.push(
      'Private poll: no result review control or result query'
    );
    await page.goto(
      `${origin}/?kind=poll&view=feed&owner=group&scenario=short&two=1&delay=1`
    );
    const cards = page.locator('article');
    await expect(cards).toHaveCount(2);
    await cards
      .nth(0)
      .getByRole('radio', { name: 'Cheese', exact: true })
      .check();
    await expect(cards.nth(0).getByRole('radio').first()).toBeDisabled();
    await cards
      .nth(0)
      .getByRole('radio')
      .first()
      .evaluate(node => node.click());
    expect(
      await page.evaluate(
        () =>
          window.fixture
            .getState()
            .calls.filter(call => call.name === 'submitPoll').length
      )
    ).toBe(1);
    report.assertions.push(
      'Pending direct vote disables choices and prevents a duplicate click mutation'
    );
    await expect
      .poll(() =>
        page.evaluate(
          () => window.fixture.getState().tools['tool-one']?.selections
        )
      )
      .toEqual(['no']);
    await expect(
      cards.nth(0).getByRole('radio', { name: 'Cheese', exact: true })
    ).toBeChecked();
    await expect(
      cards.nth(1).getByRole('radio', { name: 'Pepperoni', exact: true })
    ).toBeChecked();
    report.assertions.push(
      'Two polls: direct click persists first choice and leaves second radio group independent'
    );
    await cards
      .nth(0)
      .getByRole('radio', { name: 'Veggie', exact: true })
      .check();
    await expect
      .poll(() =>
        page.evaluate(
          () => window.fixture.getState().tools['tool-one']?.selections
        )
      )
      .toEqual(['veggie']);
    await page.reload();
    await expect(
      page
        .locator('article')
        .nth(0)
        .getByRole('radio', { name: 'Veggie', exact: true })
    ).toBeChecked();
    report.assertions.push(
      'Repeated direct votes survive synthetic authoritative revisions and reload'
    );
    await cards
      .nth(1)
      .getByRole('radio', { name: 'Pepperoni', exact: true })
      .focus();
    await page.keyboard.press('ArrowDown');
    await expect
      .poll(() =>
        page.evaluate(
          () => window.fixture.getState().tools['tool-two']?.selections
        )
      )
      .toEqual(['no']);
    report.assertions.push(
      'Keyboard arrow navigation directly persists second poll vote'
    );
  }
  if (phase === 'after') {
    await page.goto(
      `${origin}/?kind=poll&view=feed&owner=event&scenario=short&error=1`
    );
    await page.getByRole('radio', { name: 'Cheese', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText(
      'Synthetic save failure'
    );
    await expect(
      page.getByRole('radio', { name: 'Pepperoni', exact: true })
    ).toBeChecked();
    report.assertions.push(
      'Failed direct vote reports error and restores authoritative selection'
    );
  }
  if (phase === 'after')
    for (const owner of ['group', 'event']) {
      await page.goto(`${origin}/?kind=form&view=participant&owner=${owner}`);
      const answer = page.getByLabel(
        'What would make this gathering welcoming and memorable for you?',
        { exact: true }
      );
      await answer.fill('A revised response from the compact fixture');
      await page
        .getByRole('button', { name: 'Update response', exact: true })
        .click();
      await page.reload();
      await expect(answer).toHaveValue(
        'A revised response from the compact fixture'
      );
      report.assertions.push(
        `${owner} Form: essential Update response persists after reload`
      );
      await page.goto(`${origin}/?kind=list&view=participant&owner=${owner}`);
      await page.getByRole('checkbox').first().check();
      await expect
        .poll(() =>
          page.evaluate(() => window.fixture.getState().entries[0].completed)
        )
        .toBe(true);
      await page.reload();
      await expect(page.getByRole('checkbox').first()).toBeChecked();
      await page
        .getByRole('button', { name: /^Edit entry:/ })
        .first()
        .click();
      const calls = await page.evaluate(
        () => window.fixture.getState().calls.length
      );
      await page
        .getByLabel('Entry text', { exact: true })
        .fill('Discard this synthetic draft');
      await page.keyboard.press('Escape');
      expect(
        await page.evaluate(() => window.fixture.getState().calls.length)
      ).toBe(calls);
      await page
        .getByRole('button', { name: /^Edit entry:/ })
        .first()
        .click();
      await page
        .getByLabel('Entry text', { exact: true })
        .fill('A directly edited compact list entry');
      await page.keyboard.press('Enter');
      await expect
        .poll(() =>
          page.evaluate(() => window.fixture.getState().entries[0].text)
        )
        .toBe('A directly edited compact list entry');
      await page.reload();
      await expect(
        page.getByText('A directly edited compact list entry', { exact: true })
      ).toBeVisible();
      await page
        .getByLabel('New entry', { exact: true })
        .fill('Added through compact list plus button');
      await page
        .getByRole('button', { name: 'Add entry', exact: true })
        .click();
      await page.reload();
      await expect(
        page.getByText('Added through compact list plus button', {
          exact: true,
        })
      ).toBeVisible();
      report.assertions.push(
        `${owner} List: direct completion, pencil edit/Enter, Escape cancellation, add and reload persist`
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
      layouts: report.layouts.length,
      overflows: report.layouts.filter(x => x.documentWidth > x.viewport)
        .length,
      assertions: report.assertions,
      errors: report.errors,
    },
    null,
    2
  )
);
