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
const output = join(repo, '../artifacts/content-refinement/list-types', phase);
await mkdir(output, { recursive: true });
const boundary = join(root, 'list-type-boundaries.tsx');
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
async function settle(page) {
  await page.evaluate(async () => {
    await new Promise(resolve =>
      requestAnimationFrame(() => requestAnimationFrame(resolve))
    );
    await Promise.all(
      document
        .getAnimations()
        .filter(a => a.effect?.getComputedTiming().iterations !== Infinity)
        .map(a => a.finished.catch(() => {}))
    );
  });
}
const report = {
  browser: browser.version(),
  layouts: [],
  assertions: [],
  errors: [],
  limits: [
    'Actual List web components and shared Dialog/CSS run in Chromium; data/owner hooks and Next routing are synthetic.',
    'Permission projections and Bring claim acknowledgements are fixture models, not backend/auth acceptance. No network/data mutations outside localStorage.',
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
  page.on('pageerror', e => report.errors.push(e.message));
  const go = async query => {
    await page.goto(`${origin}/?kind=list&${query}`);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.locator('h1,h2,[role=alert]').first().waitFor();
    await page.evaluate(() => document.fonts.ready);
  };
  for (const width of [1440, 320, 375, 390])
    for (const owner of ['group', 'event'])
      for (const type of ['SIMPLE', 'CHECKLIST', 'BRING']) {
        await page.setViewportSize({ width, height: 1000 });
        await go(`view=participant&owner=${owner}&type=${type}`);
        if (type === 'SIMPLE') {
          expect(await page.getByRole('checkbox').count()).toBe(0);
          expect(await page.getByText(/Completed by/).count()).toBe(0);
        }
        if (type === 'CHECKLIST')
          await expect(page.getByRole('checkbox').first()).toBeVisible();
        if (type === 'BRING') {
          expect(await page.getByRole('checkbox').count()).toBe(0);
          await expect(
            page.getByRole('button', { name: /^Claim more/ })
          ).toBeVisible();
          await expect(page.getByText(/Evangeline Anastasia/)).toBeVisible();
        }
        await expect(
          page.getByText(/Added by Christopher-Alexander/)
        ).toBeVisible();
        const bounds = await page.locator('main').first().boundingBox();
        const scroll = await page.evaluate(
          () => document.documentElement.scrollWidth
        );
        expect(scroll).toBeLessThanOrEqual(width);
        report.layouts.push({
          owner,
          type,
          width,
          mode: 'participant',
          viewport: width,
          ...bounds,
        });
        await page
          .locator('main')
          .first()
          .screenshot({
            path: join(output, `${owner}-${type.toLowerCase()}-${width}.png`),
          });
        await go(`view=editor&edit=1&owner=${owner}&type=${type}`);
        await page
          .getByRole('button', { name: 'List settings', exact: true })
          .click();
        const dialog = page.getByRole('dialog', {
          name: 'List settings',
          exact: true,
        });
        await expect(dialog).toBeVisible();
        await settle(page);
        await expect(dialog.getByLabel('Type', { exact: true })).toHaveValue(
          type
        );
        expect(
          await dialog
            .getByLabel('Who can check off items?', { exact: true })
            .count()
        ).toBe(type === 'CHECKLIST' ? 1 : 0);
        const box = await dialog.boundingBox();
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(width + 1);
        await page.screenshot({
          path: join(
            output,
            `${owner}-${type.toLowerCase()}-settings-${width}.png`
          ),
          fullPage: true,
        });
        report.layouts.push({
          owner,
          type,
          viewport: width,
          mode: 'settings',
          ...box,
        });
        report.assertions.push(
          `${owner} ${type} ${width}: readable attributed content, fitting settings and type-specific controls`
        );
      }
  for (const owner of ['group', 'event']) {
    await go(
      `view=participant&owner=${owner}&type=CHECKLIST&role=normal&delay=1`
    );
    expect(
      await page
        .getByRole('link', { name: 'Manage list settings', exact: true })
        .count()
    ).toBe(0);
    expect(
      await page.getByRole('button', { name: /^Edit entry:/ }).count()
    ).toBe(0);
    const box = page.getByRole('checkbox').first();
    await box.click();
    await expect(box).toBeDisabled();
    await expect
      .poll(() =>
        page.evaluate(() => window.fixture.getState().entries[0].completed)
      )
      .toBe(true);
    await expect(page.getByText(/Completed by Alexandria/)).toBeVisible();
    await page.reload();
    await expect(box).toBeChecked();
    await expect(page.getByText(/Completed by Alexandria/)).toBeVisible();
    report.assertions.push(
      `${owner}: shared participant completes another author's entry without edit access; ack+attribution survive reload`
    );
    await go(`view=editor&edit=1&owner=${owner}&type=CHECKLIST&role=normal`);
    await expect(page.getByRole('alert')).toContainText('Only the creator');
    expect(
      await page
        .getByRole('button', { name: 'Save list settings', exact: true })
        .count()
    ).toBe(0);
    report.assertions.push(
      `${owner}: normal participant cannot mount list configuration directly`
    );
    await go(
      `view=participant&owner=${owner}&type=CHECKLIST&role=normal&completionPolicy=AUTHORS&addPolicy=CREATOR_MANAGERS`
    );
    await expect(page.getByRole('checkbox').first()).toBeDisabled();
    expect(await page.getByLabel('New entry', { exact: true }).count()).toBe(0);
    report.assertions.push(
      `${owner}: author-only completion and creator-only addition hide/disable unauthorized controls`
    );
    await go(`view=editor&edit=1&owner=${owner}&type=CHECKLIST`);
    await page
      .getByRole('button', { name: 'List settings', exact: true })
      .click();
    await page
      .getByLabel('Who can add items?', { exact: true })
      .selectOption('CREATOR_MANAGERS');
    await page
      .getByLabel('Who can check off items?', { exact: true })
      .selectOption('AUTHORS');
    await page.getByRole('button', { name: 'Done', exact: true }).click();
    await page
      .getByRole('button', { name: 'Save list settings', exact: true })
      .click();
    await page.goto(
      `${origin}/?kind=list&view=editor&edit=1&owner=${owner}&type=CHECKLIST`
    );
    expect(
      await page.evaluate(() => window.fixture.getState().tool.addPolicy)
    ).toBe('CREATOR_MANAGERS');
    expect(
      await page.evaluate(() => window.fixture.getState().tool.completionPolicy)
    ).toBe('AUTHORS');
    await page
      .locator('details')
      .evaluateAll(nodes => nodes.forEach(n => (n.open = true)));
    await expect(
      page.getByRole('button', { name: 'Delete list', exact: true })
    ).toBeVisible();
    report.assertions.push(
      `${owner}: manager add/completion policy edits persist and manager retains delete authority`
    );
    await go(
      `view=editor&edit=1&owner=${owner}&type=CHECKLIST&role=creator&done=1`
    );
    await expect(
      page.getByRole('button', { name: 'Save list settings', exact: true })
    ).toBeVisible();
    await page
      .locator('details')
      .evaluateAll(nodes => nodes.forEach(n => (n.open = true)));
    expect(
      await page
        .getByRole('button', { name: 'Delete list', exact: true })
        .count()
    ).toBe(0);
    await page
      .getByRole('button', { name: 'List settings', exact: true })
      .click();
    await page.getByLabel('Type', { exact: true }).selectOption('SIMPLE');
    await page.getByRole('button', { name: 'Done', exact: true }).click();
    await page
      .getByRole('button', { name: 'Save list settings', exact: true })
      .click();
    await page.goto(
      `${origin}/?kind=list&view=participant&owner=${owner}&role=creator`
    );
    expect(await page.getByRole('checkbox').count()).toBe(0);
    expect(await page.getByText(/Completed by/).count()).toBe(0);
    expect(
      await page.evaluate(() => window.fixture.getState().entries[0].completed)
    ).toBe(true);
    await page.goto(
      `${origin}/?kind=list&view=editor&edit=1&owner=${owner}&role=creator`
    );
    await page
      .getByRole('button', { name: 'List settings', exact: true })
      .click();
    await page.getByLabel('Type', { exact: true }).selectOption('CHECKLIST');
    await page.getByRole('button', { name: 'Done', exact: true }).click();
    await page
      .getByRole('button', { name: 'Save list settings', exact: true })
      .click();
    await page.goto(
      `${origin}/?kind=list&view=participant&owner=${owner}&role=creator`
    );
    await expect(page.getByRole('checkbox').first()).toBeChecked();
    await expect(page.getByText(/Completed by Alexandria/)).toBeVisible();
    report.assertions.push(
      `${owner}: creator configures without delete authority; Simple/Checklist switching preserves completion+identity`
    );
    await go(`view=editor&edit=1&owner=${owner}&type=CHECKLIST`);
    await page
      .getByRole('button', { name: 'List settings', exact: true })
      .click();
    await page.getByLabel('Type', { exact: true }).selectOption('BRING');
    await expect(
      page.getByRole('button', { name: 'Done', exact: true })
    ).toBeDisabled();
    await expect(
      page.getByText(/This change needs a separate list/)
    ).toBeVisible();
    report.assertions.push(
      `${owner}: existing-entry Bring boundary protects quantities/claims`
    );
    await go(`view=editor&owner=${owner}&empty=1`);
    await page
      .getByRole('button', { name: 'List settings', exact: true })
      .click();
    await page.getByLabel('Type', { exact: true }).selectOption('BRING');
    expect(
      await page.getByLabel('Who can check off items?', { exact: true }).count()
    ).toBe(0);
    await expect(
      page.getByLabel('Who can add items?', { exact: true })
    ).toHaveValue('CREATOR_MANAGERS');
    await page.getByRole('button', { name: 'Done', exact: true }).click();
    await page
      .getByRole('button', { name: 'Create list', exact: true })
      .click();
    expect(
      await page.evaluate(() => window.fixture.getState().tool.listType)
    ).toBe('BRING');
    report.assertions.push(
      `${owner}: new native Bring list creation sends type and creator/manager add policy`
    );
    await go(`view=participant&owner=${owner}&type=BRING&role=normal&delay=1`);
    const more = page.getByRole('button', { name: /^Claim more/ });
    await more.click();
    await expect(more).toBeDisabled();
    await more.evaluate(node => node.click());
    expect(
      await page.evaluate(
        () =>
          window.fixture.getState().calls.filter(c => c.name === 'setClaim')
            .length
      )
    ).toBe(1);
    await expect
      .poll(() =>
        page.evaluate(() => window.fixture.getState().claims[0].myQuantity)
      )
      .toBe(2);
    await expect(more).toBeEnabled();
    await more.click();
    await expect
      .poll(() =>
        page.evaluate(() => window.fixture.getState().claims[0].myQuantity)
      )
      .toBe(3);
    await page.reload();
    await expect(
      page.getByText('5 / 10 claimed', { exact: true })
    ).toBeVisible();
    await expect(page.getByText(/Alexandria.*\(3\)/)).toBeVisible();
    report.assertions.push(
      `${owner}: native Bring quantity claims ack, suppress duplicate pending clicks and retain multiple named quantities after reload`
    );
    await go(
      `view=participant&owner=${owner}&type=BRING&role=normal&failClaim=1`
    );
    await page.getByRole('button', { name: /^Claim more/ }).click();
    await expect(page.getByRole('alert')).toContainText(
      'Synthetic claim failure'
    );
    expect(
      await page.evaluate(() => window.fixture.getState().claims[0].myQuantity)
    ).toBe(1);
    await page.getByRole('button', { name: /^Claim more/ }).click();
    await expect
      .poll(() =>
        page.evaluate(() => window.fixture.getState().claims[0].myQuantity)
      )
      .toBe(2);
    report.assertions.push(
      `${owner}: failed Bring claim preserves acknowledged quantity and deliberate retry succeeds`
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
      layouts: report.layouts.length,
      assertions: report.assertions,
      errors: report.errors,
    },
    null,
    2
  )
);
