import { createRequire } from 'node:module';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
const dir = dirname(fileURLToPath(import.meta.url));
const web = join(dir, '../../..');
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
const before = process.argv.includes('--before');
const output = join(
  repo,
  '../artifacts/management-refinement/builder',
  before ? 'before' : 'after'
);
await mkdir(output, { recursive: true });
const boundary = join(dir, 'boundaries.tsx');
const build = await esbuild.build({
  entryPoints: [join(dir, 'entry.tsx')],
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'browser',
  jsx: 'automatic',
  absWorkingDir: web,
  tsconfig: join(web, 'tsconfig.json'),
  define: { 'process.env': '{}', 'process.env.NODE_ENV': '"development"' },
  nodePaths: [join(web, 'node_modules')],
  plugins: [
    {
      name: 'synthetic-boundaries',
      setup(build) {
        // Select the BuilderPage public export without initializing unrelated library/account screens.
        build.onLoad({ filter: /features\/addons\/authoring\.ts$/ }, args => ({
          contents: "export { BuilderPage } from './authoring/builder-page';",
          loader: 'ts',
          resolveDir: dirname(args.path),
        }));
        build.onResolve({ filter: /hooks\/use-addon-templates$/ }, () => ({
          path: boundary,
        }));
        build.onResolve(
          { filter: /^next\/(navigation|link|dynamic)$|^next-themes$/ },
          args => ({ path: args.path, namespace: 'fixture' })
        );
        build.onLoad({ filter: /.*/, namespace: 'fixture' }, args => ({
          contents: `export ${args.path === 'next/link' ? '{Link as default}' : args.path === 'next/dynamic' ? '{dynamic as default}' : args.path === 'next-themes' ? '{useTheme}' : '{useRouter,usePathname}'} from ${JSON.stringify(boundary)}`,
          loader: 'js',
          resolveDir: dir,
        }));
        build.onResolve({ filter: /^(react|react-dom)(\/.*)?$/ }, args => ({
          path: require.resolve(args.path),
        }));
        if (before)
          build.onLoad(
            { filter: /features\/addons\/authoring\/.*\.tsx$/ },
            args => ({
              contents: execFileSync(
                'git',
                [
                  'show',
                  `62be9ebe98c7850f601d0048c1acdf80939f9e8e:${args.path.slice(repo.length + 1)}`,
                ],
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
  `\n@font-face{font-family:FixtureGeologica;src:url(data:font/woff2;base64,${font.toString('base64')}) format('woff2');font-weight:100 900;font-display:block}:root{--font-heading:FixtureGeologica}`;
const origin = 'https://groupi-builder.test';
const html =
  '<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/fixture.css"><title>Local builder fixture</title></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>';
const browser = await chromium.launch({
  headless: true,
  channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome',
});
const report = {
  source:
    'Actual builder/preview/provider and CSS; synthetic mutations, Next router and Monaco textarea boundary. No external requests, auth, backend writes or notifications.',
  before,
  screens: [],
  checks: [],
  errors: [],
};
try {
  for (const width of [1440, 320, 375, 390]) {
    const context = await browser.newContext({
      viewport: { width, height: 1000 },
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    page.setDefaultTimeout(12000);
    page.on('pageerror', error =>
      report.errors.push({ width, message: error.message })
    );
    await page.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.origin !== origin) return route.abort();
      if (url.pathname === '/fixture.js')
        return route.fulfill({
          contentType: 'application/javascript',
          body: build.outputFiles[0].text,
        });
      if (url.pathname === '/fixture.css')
        return route.fulfill({ contentType: 'text/css', body: css });
      return route.fulfill({ contentType: 'text/html', body: html });
    });
    await page.goto(`${origin}/addon-builder/template-one`);
    await page
      .getByRole('heading', {
        name: before ? 'Edit Add-on' : 'Edit add-on',
        exact: true,
      })
      .waitFor();
    await page.evaluate(() => document.fonts.ready);
    async function shot(state) {
      const file = `${width}-${state}.png`;
      await page.screenshot({
        path: join(output, file),
        fullPage: state !== 'mobile-preview',
      });
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth
      );
      report.screens.push({ width, state, file, overflow });
      if (!before) expect(overflow).toBe(false);
    }
    await shot('populated');
    if (before) {
      await context.close();
      continue;
    }
    const content = page.getByRole('button', {
      name: /^Dietary preferences.*1 field$/,
    });
    await content.focus();
    await page.keyboard.press('Enter');
    await expect(content).toHaveAttribute('aria-expanded', 'true');
    await shot('section-editing');
    await page.getByText('General settings', { exact: false }).click();
    await page
      .getByLabel('Name', { exact: true })
      .fill('Evening supper with friends');
    await page.evaluate(() => {
      window.builderFixture.failNext = true;
    });
    await page.getByRole('button', { name: 'Save draft', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText(
      'Synthetic save failed'
    );
    await expect(page.getByLabel('Name', { exact: true })).toHaveValue(
      'Evening supper with friends'
    );
    await shot('save-error');
    await page.evaluate(() => {
      window.builderFixture.holdNext = true;
    });
    await page.getByRole('button', { name: 'Save draft', exact: true }).click();
    await expect(
      page.getByRole('button', { name: 'Saving…', exact: true })
    ).toBeDisabled();
    await expect(page.getByLabel('Name', { exact: true })).toBeDisabled();
    await expect(page.getByText('Changes saved.', { exact: true })).toHaveCount(
      0
    );
    await shot('save-pending');
    await page.evaluate(() => window.builderFixture.release?.());
    await expect(
      page.getByText('Changes saved.', { exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Publish', exact: true })
    ).toBeEnabled();
    report.checks.push({
      width,
      check:
        'failed save retains draft; successful retry establishes checkpoint; publish stays separate',
    });
    await page.evaluate(() => {
      history.pushState({}, '', '?checkpoint=1');
      history.pushState({}, '', '?checkpoint=2');
      history.back();
    });
    await page.waitForURL(/checkpoint=1/);
    await page.getByRole('tab', { name: 'YAML', exact: true }).click();
    const raw = await page
      .getByRole('textbox', { name: 'YAML document' })
      .inputValue();
    await page
      .getByRole('textbox', { name: 'YAML document' })
      .fill(raw.replace('Evening supper with friends', 'Neighbourhood dinner'));
    await page.getByRole('tab', { name: 'Visual', exact: true }).click();
    await expect(page.getByLabel('Name', { exact: true })).toHaveValue(
      'Neighbourhood dinner'
    );
    await page.getByRole('tab', { name: 'YAML', exact: true }).click();
    await page.getByRole('textbox', { name: 'YAML document' }).fill('name: [');
    await page.getByRole('tab', { name: 'Visual', exact: true }).click();
    await expect(
      page.getByRole('button', { name: 'Save draft', exact: true })
    ).toBeDisabled();
    await page.getByRole('tab', { name: 'YAML', exact: true }).click();
    await expect(
      page.getByRole('textbox', { name: 'YAML document' })
    ).toHaveValue('name: [');
    await shot('invalid-yaml');
    await page.getByRole('link', { name: 'Back to add-ons' }).click();
    await expect(
      page.getByRole('dialog', { name: 'Leave without saving?' })
    ).toBeVisible();
    await page
      .getByRole('button', { name: 'Keep editing', exact: true })
      .click();
    await expect(
      page.getByRole('textbox', { name: 'YAML document' })
    ).toHaveValue('name: [');
    for (const direction of ['back', 'forward']) {
      await page.evaluate(direction => {
        if (direction === 'back') history.back();
        else history.forward();
      }, direction);
      await expect(
        page.getByRole('dialog', { name: 'Leave without saving?' })
      ).toBeVisible();
      await page
        .getByRole('button', { name: 'Keep editing', exact: true })
        .click();
      await expect(
        page.getByRole('textbox', { name: 'YAML document' })
      ).toHaveValue('name: [');
      await page.waitForURL(/checkpoint=1/);
    }
    report.checks.push({
      width,
      check:
        'native same-document Back and Forward restore position and retain raw draft when cancelled',
    });
    await page.getByRole('button', { name: 'Revert', exact: true }).click();
    await expect(
      page.getByRole('textbox', { name: 'YAML document' })
    ).toHaveValue(/Evening supper with friends/);
    report.checks.push({
      width,
      check:
        'pending YAML survives mode switch; invalid raw text retained; cancel navigation and Revert preserve saved checkpoint',
    });
    await page.getByRole('tab', { name: 'Visual', exact: true }).click();
    if (width < 1280) {
      await page.getByRole('button', { name: 'Preview', exact: true }).click();
      const dialog = page.getByRole('dialog', { name: 'Preview', exact: true });
      await expect(dialog).toBeVisible();
      for (const name of ['Config', 'Event', 'Page', 'Organizer']) {
        await dialog.getByRole('tab', { name, exact: true }).click();
        await expect(
          dialog.getByRole('tab', { name, exact: true })
        ).toHaveAttribute('aria-selected', 'true');
      }
      await shot('mobile-preview');
      await page.keyboard.press('Escape');
      await expect(dialog).not.toBeVisible();
    } else {
      for (const name of ['Config', 'Event', 'Page', 'Organizer'])
        await page.getByRole('tab', { name, exact: true }).click();
    }
    report.checks.push({
      width,
      check:
        'all four preview contexts reachable with keyboard/named mobile sheet',
    });
    await page.goto(`${origin}/addon-builder/new?empty=1`);
    await page
      .getByRole('heading', { name: 'New add-on', exact: true })
      .waitFor();
    await shot('empty');
    await context.close();
  }
  expect(report.errors).toEqual([]);
} finally {
  await writeFile(join(output, 'report.json'), JSON.stringify(report, null, 2));
  await browser.close();
}
console.log(
  JSON.stringify({
    output,
    screenshots: report.screens.length,
    checks: report.checks.length,
    errors: report.errors,
  })
);
