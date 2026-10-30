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
  '../artifacts/content-refinement/action-menu-correction',
  phase
);
await mkdir(output, { recursive: true });
const boundary = join(root, 'action-menu-boundaries.tsx');
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
async function settleAnimations(page) {
  await page.evaluate(async () => {
    await new Promise(resolve =>
      requestAnimationFrame(() => requestAnimationFrame(resolve))
    );
    await Promise.all(
      document
        .getAnimations()
        .filter(
          animation =>
            animation.effect?.getComputedTiming().iterations !== Infinity
        )
        .map(animation => animation.finished.catch(() => {}))
    );
  });
}
const report = {
  browser: browser.version(),
  assertions: [],
  screenshots: [],
  metrics: [],
  errors: [],
  limits: [
    'Real shared ActionMenu, ActionMenuButton, useActionMenu, useMobile, Radix and Vaul run unchanged.',
    'Data/owner hooks and Next route boundaries are synthetic; this is not authenticated/backend acceptance.',
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
    for (const owner of ['group', 'event']) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${origin}/?kind=form&view=participant&owner=${owner}`);
      const trigger = page.getByRole('button', {
        name: 'Form actions',
        exact: true,
      });
      await expect(trigger).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      expect(
        await page
          .getByRole('button', { name: /^(Responses|Hide responses)$/ })
          .count()
      ).toBe(0);
      expect(await page.evaluate(() => window.fixture.resultsReads)).toBe(0);
      await trigger.focus();
      await page.keyboard.press('Enter');
      const surface =
        width === 1440 ? page.getByRole('menu') : page.getByRole('dialog');
      await expect(surface).toBeVisible();
      await settleAnimations(page);
      await page.screenshot({
        path: join(output, `${owner}-form-actions-${width}.png`),
        fullPage: true,
      });
      await page.keyboard.press('Escape');
      await expect(surface).not.toBeVisible();
      await expect(trigger).toBeFocused();
      report.assertions.push(
        `${owner} ${width}: real ${width === 1440 ? 'dropdown' : 'drawer'} keyboard open/Escape restores focus`
      );
      await trigger.click();
      const view = page.getByRole(width === 1440 ? 'menuitem' : 'button', {
        name: 'View responses',
        exact: true,
      });
      await expect(view).toBeVisible();
      await view.click();
      const dialog = page.getByRole('dialog', {
        name: 'Responses',
        exact: true,
      });
      await expect(dialog).toBeVisible();
      await expect(
        page.getByRole('dialog', { name: 'Form actions', exact: true })
      ).not.toBeVisible();
      await expect(page.getByRole('menu')).not.toBeVisible();
      await expect(page.getByRole('dialog')).toHaveCount(1);
      await settleAnimations(page);
      const bounds = await dialog.boundingBox();
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(width + 1);
      report.assertions.push(
        `${owner} ${width}: response dialog replaces menu/drawer with one active overlay and fits viewport`
      );

      await expect(
        dialog.getByText('A quiet space to catch up and meet new people.', {
          exact: true,
        })
      ).toBeVisible();
      expect(
        await page.evaluate(() => window.fixture.resultsReads)
      ).toBeGreaterThan(0);
      await page.screenshot({
        path: join(output, `${owner}-form-responses-${width}.png`),
        fullPage: true,
      });
      await dialog.getByRole('button', { name: 'Close', exact: true }).click();
      await expect(dialog).not.toBeVisible();
      await expect(trigger).toBeFocused();
      report.assertions.push(
        `${owner} ${width}: manager menu opens existing response dialog lazily; Close restores focus`
      );
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth
      );
      expect(overflow).toBe(false);
      for (const role of ['normal', 'denied', 'manager-denied']) {
        await page.goto(
          `${origin}/?kind=form&view=participant&owner=${owner}&role=${role}`
        );
        const actions = page.getByRole('button', {
          name: 'Form actions',
          exact: true,
        });
        if (await actions.count()) {
          await actions.click();
          expect(
            await page
              .getByRole('menuitem', { name: 'View responses', exact: true })
              .count()
          ).toBe(0);
          expect(
            await page
              .getByRole('button', { name: 'View responses', exact: true })
              .count()
          ).toBe(0);
          await page.keyboard.press('Escape');
        }
        expect(
          await page
            .getByRole('button', { name: /^(Responses|Hide responses)$/ })
            .count()
        ).toBe(0);
        expect(await page.evaluate(() => window.fixture.resultsReads)).toBe(0);
        report.assertions.push(
          `${owner} ${width}: ${role} participant has no response UI/query`
        );
      }
      await page.goto(
        `${origin}/?kind=poll&view=feed&owner=${owner}&scenario=short`
      );
      const resultButton = page.getByRole('button', {
        name: 'View poll results',
        exact: true,
      });
      await expect(resultButton).toBeVisible();
      const target = await resultButton.boundingBox();
      report.metrics.push({
        owner,
        width,
        target,
        ...(await resultButton.evaluate(e => ({
          paddingInline: getComputedStyle(e).paddingInline,
          paddingBlock: getComputedStyle(e).paddingBlock,
        }))),
      });
      expect(target.height).toBeGreaterThanOrEqual(24);
      await page
        .locator('article')
        .first()
        .screenshot({ path: join(output, `${owner}-poll-${width}.png`) });
      report.assertions.push(
        `${owner} ${width}: poll result action retains minimum24px reachable target`
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
    { assertions: report.assertions, errors: report.errors },
    null,
    2
  )
);
