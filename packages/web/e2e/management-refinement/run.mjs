import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
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
  '../artifacts/management-refinement/event-settings-account',
  phase
);
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
          {
            filter: /^@\/hooks\/convex\/(use-event-settings|use-file-upload)$/,
          },
          () => ({ path: boundary })
        );
        build.onResolve({ filter: /^@\/lib\/auth-client$/ }, () => ({
          path: boundary,
        }));
        build.onResolve({ filter: /^convex\/react$/ }, () => ({
          path: boundary,
        }));
        build.onResolve({ filter: /^\.\/hooks$/ }, args =>
          args.resolveDir.endsWith('/features/authorization')
            ? { path: boundary }
            : undefined
        );
        build.onResolve({ filter: /^@\/features\/authorization$/ }, () => ({
          path: join(web, 'features/authorization/settings-actions.tsx'),
        }));
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
  nativeBeforeUnloadWarnings: 0,
  limits: [
    'Actual Event draft provider, details, Shared With, Admission/Application components and shared menus/dialogs run with generated CSS/Geologica.',
    'Event save/reads and authorization/account queries are synthetic localStorage fixtures; modeled atomic rejection is not proof of backend transaction enforcement.',
    'Next routing is a synthetic history boundary. Full authenticated Account username/email/passkey providers, credentials issuance/revocation and actual backend acceptance are not mounted/executed.',
    'Cover image controls render, but file upload and real asset persistence are not exercised.',
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
  page.on('dialog', dialog => {
    if (dialog.type() === 'beforeunload') {
      report.nativeBeforeUnloadWarnings++;
      void dialog.accept();
    } else void dialog.dismiss();
  });
  const open = async (scene, view = 'details', empty = false, extra = '') => {
    const path =
      scene === 'event'
        ? `/event/event-one/settings/${view}`
        : `/settings/${scene}`;
    await page.goto(
      `${origin}${path}?scene=${scene}${empty ? '&empty=1' : ''}${extra}`
    );
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await expect(
      page.getByRole('heading', {
        name:
          scene === 'developer'
            ? 'Developer settings'
            : scene === 'account'
              ? 'Account'
              : 'Event settings',
        exact: true,
      })
    ).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
  };
  const capture = async stem => {
    await settle(page);
    const width = await page.evaluate(() => innerWidth);
    const scroll = await page.evaluate(
      () => document.documentElement.scrollWidth
    );
    expect(scroll).toBeLessThanOrEqual(width);
    report.layouts.push({ stem, viewport: width, scroll });
    await page.screenshot({
      path: join(output, `${stem}.png`),
      fullPage: true,
    });
  };
  for (const width of [1440, 320, 375, 390])
    for (const empty of [false, true]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const [scene, view] of [
        ['event', 'details'],
        ['event', 'access'],
        ['developer', ''],
        ['account', ''],
      ]) {
        await open(scene, view, empty);
        if (scene === 'account' && !empty) {
          await expect(
            page.getByRole('button', { name: /^Disconnect / })
          ).toHaveText('Disconnect');
          report.assertions.push(
            `${width}: Account connection action is concise while its accessible name retains app identity`
          );
        }

        await capture(
          `${scene}-${view || 'settings'}-${empty ? 'empty' : 'filled'}-${width}`
        );
        if (scene === 'event' && view === 'access') {
          const trigger = page.getByRole('button', {
            name: 'Shared with',
            exact: true,
          });
          await trigger.focus();
          await page.keyboard.press('Enter');
          await expect(
            page.getByLabel('Search audiences', { exact: true })
          ).toBeFocused();
          const checks = page.getByRole('checkbox');
          await expect(checks.first()).toHaveAccessibleName('Friends');
          await capture(`shared-with-${empty ? 'empty' : 'filled'}-${width}`);
          await page
            .getByLabel('Search audiences', { exact: true })
            .fill('Accessible');
          await expect(
            page.getByRole('checkbox', {
              name: 'Accessible afternoon walks and shared meals for everyone',
              exact: true,
            })
          ).toBeVisible();
          expect(
            await page
              .getByRole('checkbox', { name: 'Friends', exact: true })
              .count()
          ).toBe(0);
          await page
            .getByLabel('Search audiences', { exact: true })
            .fill('no matching audience');
          await expect(
            page.getByText('No matching groups.', { exact: true })
          ).toBeVisible();
          await page.getByLabel('Search audiences', { exact: true }).fill('');

          await page.keyboard.press('Escape');
          await expect(trigger).toBeFocused();
          report.assertions.push(
            `${width} ${empty ? 'empty' : 'filled'}: Shared With keyboard search opens Friends first, filters/empties coherently and Escape restores focus`
          );
          if (empty)
            await page
              .getByLabel('Admission', { exact: true })
              .selectOption('APPLY');
          const accordion = page
            .locator('summary')
            .filter({ hasText: 'Application questions' });
          await accordion.click();
          await capture(
            `application-expanded-${empty ? 'empty' : 'filled'}-${width}`
          );
        }
      }
    }
  for (const width of [1440, 320, 375, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await open('developer');
    const names = [
      'Community schedule reader with a deliberately long, recognizable identity 長い名前',
      'Community calendar companion for everyone in the neighborhood 長いアプリ名',
      'Older account automation retained for continuity and careful manual review',
    ];
    for (const name of names) {
      const trigger = page.getByRole('button', {
        name: `Actions for ${name}`,
        exact: true,
      });
      await expect(trigger).toBeVisible();
      await trigger.focus();
      await page.keyboard.press('Enter');
      const menu =
        width === 1440 ? page.getByRole('menu') : page.getByRole('dialog');
      await expect(menu).toBeVisible();
      await settle(page);
      await page.keyboard.press('Escape');
      await expect(menu).not.toBeVisible();
      await expect(trigger).toBeFocused();
      await trigger.click();
      await page
        .getByRole(width === 1440 ? 'menuitem' : 'button', {
          name: 'Details',
          exact: true,
        })
        .click();
      const dialog = page.getByRole('dialog', { name, exact: true });
      await expect(dialog).toBeVisible();
      await settle(page);
      await expect(page.getByRole('dialog')).toHaveCount(1);
      const bounds = await dialog.boundingBox();
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(width + 1);
      await page.screenshot({
        path: join(output, `details-${names.indexOf(name)}-${width}.png`),
        fullPage: true,
      });
      await dialog.getByRole('button', { name: 'Close', exact: true }).click();
      await expect(trigger).toBeFocused();
      report.assertions.push(
        `${width}: actual compact SettingsActions for identity ${names.indexOf(name) + 1} opens/dismisses safely and returns focus`
      );
    }
    const trigger = page.getByRole('button', {
      name: `Actions for ${names[0]}`,
      exact: true,
    });
    await trigger.click();
    await page
      .getByRole(width === 1440 ? 'menuitem' : 'button', {
        name: 'Revoke',
        exact: true,
      })
      .click();
    const revoke = page.getByRole('dialog', {
      name: 'Revoke this key?',
      exact: true,
    });
    await expect(revoke).toBeVisible();
    await revoke.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(trigger).toBeFocused();
    expect(
      await page.evaluate(
        () => window.managementFixture.state.credentialCalls.length
      )
    ).toBe(0);
    report.assertions.push(
      `${width}: revoke is separately confirmed; Cancel performs no credential write`
    );
  }
  await page.setViewportSize({ width: 390, height: 900 });
  await open('event', 'details', true);
  const original = await page.evaluate(() =>
    structuredClone(window.managementFixture.state.snapshot)
  );
  await page
    .getByLabel('Title', { exact: true })
    .fill('One coherent changed event title');
  await page.getByRole('link', { name: 'Access', exact: true }).click();
  await page.getByRole('button', { name: 'Shared with', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Friends', exact: true }).check();
  await page
    .getByRole('checkbox', {
      name: 'Accessible afternoon walks and shared meals for everyone',
      exact: true,
    })
    .check();
  await page.keyboard.press('Escape');
  await page.getByLabel('Admission', { exact: true }).selectOption('APPLY');
  const questions = page
    .locator('summary')
    .filter({ hasText: 'Application questions' });
  await expect(questions).toContainText('(0)');
  await questions.click();
  await page.getByRole('button', { name: 'Add question', exact: true }).click();
  await page
    .getByLabel('Question text', { exact: true })
    .fill('What should the organizer know before you join?');
  await page.getByRole('link', { name: 'Details', exact: true }).click();
  await expect(page.getByLabel('Title', { exact: true })).toHaveValue(
    'One coherent changed event title'
  );
  await page.goBack();
  await expect(page.getByLabel('Admission', { exact: true })).toHaveValue(
    'APPLY'
  );
  await page.goForward();
  await expect(page.getByLabel('Title', { exact: true })).toHaveValue(
    'One coherent changed event title'
  );
  expect(
    await page
      .getByRole('button', { name: 'Save changes', exact: true })
      .count()
  ).toBe(1);
  report.assertions.push(
    'One actual Event provider retains details/audiences/admission/question drafts across settings routes and Back/Forward with one Save'
  );
  await page.evaluate(() => window.managementFixture.failNext());
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText(
    'Synthetic atomic save failed'
  );
  expect(
    await page.evaluate(() => window.managementFixture.state.snapshot)
  ).toEqual(original);
  await expect(page.getByLabel('Title', { exact: true })).toHaveValue(
    'One coherent changed event title'
  );
  await capture('event-global-save-failure-390');
  report.assertions.push(
    'Failed atomic fixture save changes no snapshot section and retains all drafts for retry'
  );
  await page.evaluate(() => window.managementFixture.setDelay(true));
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Save changes', exact: true })
  ).toBeDisabled();
  await page
    .getByRole('button', { name: 'Save changes', exact: true })
    .evaluate(node => node.click());
  await expect(
    page.getByRole('button', { name: 'Save changes', exact: true })
  ).toHaveCount(0);
  const calls = await page.evaluate(() => window.managementFixture.state.calls);
  expect(calls.length).toBe(2);
  expect(Object.keys(calls[1].patch).sort()).toEqual([
    'admissionPolicy',
    'applications',
    'audiences',
    'details',
  ]);
  expect(calls[1].patch.details.imageUrl).toBeUndefined();
  await page.reload();
  await expect(page.getByLabel('Title', { exact: true })).toHaveValue(
    'One coherent changed event title'
  );
  report.assertions.push(
    'Retry submits all four sections once, pending duplicate click is ignored, clean state and saved fixture values survive reload'
  );
  await page
    .getByLabel('Title', { exact: true })
    .fill('Retained local conflict draft');
  await page.evaluate(() => window.managementFixture.conflict());
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Settings changed');
  await expect(page.getByLabel('Title', { exact: true })).toHaveValue(
    'Retained local conflict draft'
  );
  expect(
    await page.evaluate(
      () => window.managementFixture.state.snapshot.details.title
    )
  ).toBe('Remote competing title');
  await page.getByRole('button', { name: 'Revert', exact: true }).click();
  await expect(page.getByLabel('Title', { exact: true })).toHaveValue(
    'Remote competing title'
  );
  report.assertions.push(
    'Revision conflict never partially saves or falsely succeeds; Revert adopts latest authoritative snapshot'
  );
  await page
    .getByLabel('Title', { exact: true })
    .fill('Unsaved leave guard draft');
  await page.getByRole('link', { name: 'Outside event', exact: true }).click();
  const leave = page.getByRole('dialog', {
    name: 'Unsaved event settings',
    exact: true,
  });
  await expect(leave).toBeVisible();
  await leave
    .getByRole('button', { name: 'Keep editing', exact: true })
    .click();
  await expect(page.getByLabel('Title', { exact: true })).toHaveValue(
    'Unsaved leave guard draft'
  );
  await page.getByRole('link', { name: 'Event home', exact: true }).click();
  await page.goBack();
  await expect(page.getByLabel('Title', { exact: true })).toHaveValue(
    'Unsaved leave guard draft'
  );
  await page.evaluate(() => window.managementFixture.mountProvider(false));
  await expect(
    page.getByText('Provider unmounted fixture', { exact: true })
  ).toBeVisible();
  await page.evaluate(() => window.managementFixture.mountProvider(true));
  await expect(page.getByLabel('Title', { exact: true })).toHaveValue(
    'Unsaved leave guard draft'
  );
  report.assertions.push(
    'Actual Event provider unmount/remount recovers its actor/event-scoped memory-only draft'
  );
  await page.getByRole('button', { name: 'Revert', exact: true }).click();
  expect(
    await page
      .getByRole('button', { name: 'Save changes', exact: true })
      .count()
  ).toBe(0);
  report.assertions.push(
    'Outside-event navigation is guarded; Keep editing and Event-home Back retain the real provider draft; Revert clears dirty state'
  );

  await open('event', 'details', true);
  await page.getByLabel('Visibility', { exact: true }).selectOption('FRIENDS');
  await page.getByRole('link', { name: 'Access', exact: true }).click();
  await page.getByRole('button', { name: 'Shared with', exact: true }).click();
  await expect(
    page.getByRole('checkbox', { name: 'Friends', exact: true })
  ).toBeChecked();
  await page.getByRole('checkbox', { name: 'Friends', exact: true }).uncheck();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Save changes', exact: true })
  ).toHaveCount(0);
  expect(
    await page.evaluate(
      () => window.managementFixture.state.snapshot.details.visibility
    )
  ).toBe('FRIENDS');
  expect(
    await page.evaluate(
      () => window.managementFixture.state.snapshot.audiences.friendsShared
    )
  ).toBe(false);
  expect(
    await page.evaluate(
      () =>
        window.managementFixture.state.calls.at(-1).patch.audiences
          .friendsShared
    )
  ).toBe(false);
  await page.reload();
  await page.getByRole('button', { name: 'Shared with', exact: true }).click();
  await expect(
    page.getByRole('checkbox', { name: 'Friends', exact: true })
  ).not.toBeChecked();
  await page.keyboard.press('Escape');
  report.assertions.push(
    'Visibility FRIENDS then explicit Shared With Friends off retains false override in atomic patch and after reload'
  );
  await open('event', 'details', false, '&friendsBase=1');
  await page.getByLabel('Visibility', { exact: true }).selectOption('PRIVATE');
  await page.getByRole('link', { name: 'Access', exact: true }).click();
  await page.getByRole('button', { name: 'Shared with', exact: true }).click();
  await expect(
    page.getByRole('checkbox', { name: 'Friends', exact: true })
  ).not.toBeChecked();
  await page.getByRole('checkbox', { name: 'Friends', exact: true }).check();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Save changes', exact: true })
  ).toHaveCount(0);
  expect(
    await page.evaluate(
      () => window.managementFixture.state.snapshot.details.visibility
    )
  ).toBe('PRIVATE');
  expect(
    await page.evaluate(
      () => window.managementFixture.state.snapshot.audiences.friendsShared
    )
  ).toBe(true);
  expect(
    await page.evaluate(
      () =>
        window.managementFixture.state.calls.at(-1).patch.audiences
          .friendsShared
    )
  ).toBe(true);
  report.assertions.push(
    'Reverse visibility effect PRIVATE then explicit Friends on retains true override even when it matches original audience'
  );
  await page.getByRole('link', { name: 'Details', exact: true }).click();
  await page.getByLabel('Visibility', { exact: true }).selectOption('FRIENDS');
  await page.getByRole('link', { name: 'Access', exact: true }).click();
  await page.getByRole('button', { name: 'Shared with', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Friends', exact: true }).uncheck();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Revert', exact: true }).click();
  await page.getByRole('button', { name: 'Shared with', exact: true }).click();
  await expect(
    page.getByRole('checkbox', { name: 'Friends', exact: true })
  ).toBeChecked();
  await page.keyboard.press('Escape');
  await page.getByRole('link', { name: 'Details', exact: true }).click();
  await expect(page.getByLabel('Visibility', { exact: true })).toHaveValue(
    'PRIVATE'
  );
  expect(
    await page
      .getByRole('button', { name: 'Save changes', exact: true })
      .count()
  ).toBe(0);
  report.assertions.push(
    'Revert restores both saved Visibility and independent Friends sharing after coupled edits'
  );
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
