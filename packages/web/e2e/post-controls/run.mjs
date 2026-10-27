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
const reuse = process.argv.includes('--reuse');
const errorOnly = process.argv.includes('--error-only');
const phase = process.argv.includes('--before') ? 'before' : 'after';
const output = join(
  repo,
  '../artifacts/post-controls',
  phase,
  ...(reuse ? ['reuse'] : errorOnly ? ['error-cap'] : [])
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
        build.onResolve({ filter: /^@\/features\/content$/ }, () => ({
          path: boundary,
        }));
        build.onResolve(
          {
            filter:
              /^@\/hooks\/convex\/(use-group-posts|use-groups|use-post-controls|use-presence|use-file-upload|use-muting|use-posts)$/,
          },
          () => ({ path: boundary })
        );
        build.onResolve(
          {
            filter:
              /^@\/(providers\/visibility-provider|context\/global-user-context|lib\/auth-client|hooks\/use-invite-list-navigation-guard)$/,
          },
          () => ({ path: boundary })
        );
        build.onResolve({ filter: /^convex\/react$/ }, () => ({
          path: boundary,
        }));
        build.onResolve({ filter: /^\.\/rich-text-editor$/ }, () => ({
          path: boundary,
        }));
        build.onResolve(
          { filter: /^next\/(navigation|link|dynamic)$/ },
          args => ({ path: args.path, namespace: 'fixture-next' })
        );
        build.onLoad({ filter: /.*/, namespace: 'fixture-next' }, args => ({
          contents:
            args.path === 'next/dynamic'
              ? `import {Editor} from ${JSON.stringify(boundary)}; export default ()=>Editor;`
              : `export ${args.path === 'next/link' ? '{Link as default}' : '{useRouter,usePathname,useSearchParams}'} from ${JSON.stringify(boundary)}`,
          loader: 'js',
          resolveDir: root,
        }));
        build.onResolve(
          { filter: /^@\/components\/organisms\/group-polls$/ },
          () => ({ path: 'poll-unrelated', namespace: 'empty' })
        );
        build.onResolve(
          {
            filter:
              /^@\/components\/(profile-view-dialog|member-icon|replies-icons|report-dialog|delete-post-dialog)$/,
          },
          () => ({ path: 'profile-unrelated', namespace: 'empty' })
        );
        build.onLoad({ filter: /.*/, namespace: 'empty' }, () => ({
          contents:
            'export const GroupPollFeed=()=>"Synthetic poll boundary"; export const ProfileViewDialog=()=>null; export const ReportDialog=()=>null; export const DeletePostDialog=()=>null; export default ()=>null;',
          loader: 'js',
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
  layouts: [],
  assertions: [],
  errors: [],
  limits: [
    'Actual Group thread/editor/feed and Event PostCard/FullPost/PostFeed with shared responsive menus, actual CSS and Geologica; data, permission projections, mutations, upload/presence/router are synthetic. Rich editor is a textarea boundary. No authenticated/backend acceptance. Event RepliesSection is not mounted; old locked replies are verified through actual Group reply components. Poll is a labeled boundary marker for ordering.',
  ],
};
try {
  const context = await browser.newContext();
  await context.route('**/*', route => {
    const u = new URL(route.request().url());
    if (u.origin !== origin) {
      report.errors.push(`Blocked external: ${u.origin}`);
      return route.abort();
    }
    return route.fulfill({
      contentType:
        u.pathname === '/fixture.js'
          ? 'text/javascript'
          : u.pathname === '/fixture.css'
            ? 'text/css'
            : 'text/html',
      body:
        u.pathname === '/fixture.js'
          ? result.outputFiles[0].text
          : u.pathname === '/fixture.css'
            ? css
            : html,
    });
  });
  const page = await context.newPage();
  page.on('pageerror', error => report.errors.push(error.message));
  async function open(query = '') {
    await page.goto(`${origin}/fixture?${query}`);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await expect(page.locator('main,section').first()).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
  }
  async function capture(name) {
    await settle(page);
    const bounds = await page.evaluate(() => ({
      width: innerWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    expect(bounds.scroll).toBeLessThanOrEqual(bounds.width);
    report.layouts.push({ name, ...bounds });
    await page.screenshot({
      path: join(output, `${name}.png`),
      fullPage: true,
    });
  }
  const ok = message => report.assertions.push(message);
  async function openMenu() {
    const trigger = page
      .getByRole('button', { name: /^(Post actions|Actions for post)/ })
      .first();
    await trigger.focus();
    await trigger.press('Enter');
    await settle(page);
    return trigger;
  }
  function action(name) {
    return page
      .getByRole('menuitem', { name, exact: true })
      .or(page.getByRole('button', { name, exact: true }));
  }
  for (const width of reuse || errorOnly ? [] : [1440, 320, 375, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await open('locked=1');
    await expect(
      page.getByText(
        'This existing reply remains readable after replies are locked.',
        { exact: true }
      )
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Send reply', exact: true })
    ).toBeHidden();
    ok(`Locked existing reply readable; composer hidden ${width}`);
    await capture(`locked-manager-${width}`);
    const trigger = await openMenu();
    await expect(action('Open replies')).toBeVisible();
    await expect(action('Pin post')).toBeVisible();
    await capture(`manager-menu-${width}`);
    await page.keyboard.press('Escape');
    await settle(page);
    await expect(trigger).toBeFocused();
    ok(`Keyboard menu Escape restores trigger ${width}`);
    await openMenu();
    await action('Open replies').click();
    await expect
      .poll(() =>
        page.evaluate(
          () => window.postControlsFixture.state().post.repliesDisabled
        )
      )
      .toBe(false);
    await page.keyboard.press('Escape');
    await settle(page);
    await expect(
      page.getByRole('button', { name: 'Send reply', exact: true })
    ).toBeVisible();
    ok(`Unlock restores composer ${width}`);
    await openMenu();
    await action('Pin post').click();
    await expect
      .poll(() =>
        page.evaluate(() => !!window.postControlsFixture.state().post.pinnedAt)
      )
      .toBe(true);
    await page.keyboard.press('Escape');
    await settle(page);
    await openMenu();
    await expect(action('Unpin post')).toBeVisible();
    await action('Unpin post').click();
    await expect
      .poll(() =>
        page.evaluate(() => !!window.postControlsFixture.state().post.pinnedAt)
      )
      .toBe(false);
    await page.keyboard.press('Escape');
    ok(`Pin and unpin acknowledged ${width}`);
    await open('normal=1&locked=1');
    await expect(
      page.getByRole('button', { name: /^(Post actions|Actions for post)/ })
    ).toHaveCount(0);
    await capture(`locked-member-${width}`);
    ok(`Member has no manager actions ${width}`);
    await open('editor=1');
    await expect(
      page.getByRole('checkbox', { name: 'Allow replies' })
    ).toBeChecked();
    await capture(`new-post-${width}`);
    await page
      .getByLabel('Title', { exact: true })
      .fill('A synthetic post with replies closed');
    await page
      .getByRole('textbox', { name: 'Synthetic rich text editor' })
      .fill('Synthetic body only, no shared backend.');
    await page.getByRole('checkbox', { name: 'Allow replies' }).uncheck();
    await page
      .getByRole('button', { name: 'Publish post', exact: true })
      .click();
    await expect
      .poll(() =>
        page.evaluate(() =>
          window.postControlsFixture
            .state()
            .calls.some(
              call =>
                call.kind === 'create' && call.args.repliesDisabled === true
            )
        )
      )
      .toBe(true);
    ok(`New post option persists repliesDisabled ${width}`);
  }
  for (const width of reuse || errorOnly ? [] : [1440, 320, 375, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await open('normal=1&author=1');
    await openMenu();
    await expect(action('Lock replies')).toBeVisible();
    await expect(action('Pin post')).toHaveCount(0);
    await page.keyboard.press('Escape');
    ok(`Normal author has reply toggle only ${width}`);
    await open('feed=1&pins=1');
    await capture(`group-pinned-feed-${width}`);
    for (const n of [1, 2, 3])
      await expect(
        page.getByRole('link', {
          name: `Pinned announcement ${n}`,
          exact: true,
        })
      ).toHaveCount(1);
    expect(
      await page
        .getByRole('link', { name: /Pinned announcement/ })
        .allTextContents()
    ).toEqual([
      'Pinned announcement 3',
      'Pinned announcement 2',
      'Pinned announcement 1',
    ]);
    const order = await page.locator('section').innerText();
    expect(order.indexOf('Pinned announcement 1')).toBeLessThan(
      order.indexOf('Synthetic poll boundary')
    );
    ok(`Three newest pins precede poll and are deduplicated ${width}`);
    await open('event=1&feed=1&pins=1');
    await capture(`event-pinned-feed-${width}`);
    for (const n of [1, 2, 3])
      await expect(
        page.getByText(`Pinned announcement ${n}`, { exact: true })
      ).toHaveCount(1);
    const eventOrder = await page.locator('main').innerText();
    expect(eventOrder.indexOf('Pinned announcement 1')).toBeLessThan(
      eventOrder.indexOf('Synthetic poll boundary')
    );
    ok(`Event pins precede poll without duplicate ${width}`);
    await open('event=1&locked=1');
    await capture(`event-full-post-${width}`);
    await openMenu();
    await expect(action('Open replies')).toBeVisible();
    await expect(action('Pin post')).toBeVisible();
    await page.keyboard.press('Escape');
    ok(`Event full post uses real shared controls ${width}`);
    await open('event=1&card=1&locked=1');
    await capture(`event-card-${width}`);
    const cardTrigger = page.getByRole('button', { name: /Actions for post/ });
    await cardTrigger.focus();
    await cardTrigger.press('Enter');
    await settle(page);
    await expect(action('Open replies')).toBeVisible();
    await expect(action('Pin post')).toBeVisible();
    await page.keyboard.press('Escape');
    ok(`Event card exposes lock and pin ${width}`);
  }
  if (!reuse) {
    await page.setViewportSize({ width: 390, height: 1000 });
    await open();
    await page.evaluate(() => window.postControlsFixture.delay(500));
    await openMenu();
    await action('Lock replies').click();
    await expect(action('Lock replies')).toBeDisabled();
    await expect(action('Pin post')).toBeDisabled();
    await expect
      .poll(() =>
        page.evaluate(
          () => window.postControlsFixture.state().post.repliesDisabled
        )
      )
      .toBe(true);
    expect(
      await page.evaluate(() => window.postControlsFixture.state().calls.length)
    ).toBe(1);
    ok('One pending mutation disables both actions without duplicate writes');
    await page.keyboard.press('Escape');
    await openMenu();
    await page.evaluate(() =>
      window.postControlsFixture.fail(
        'Three posts are already pinned. Unpin one before pinning another.'
      )
    );
    await action('Pin post').click();
    await expect(page.getByRole('alert').first()).toContainText(
      'Three posts are already pinned'
    );
    expect(
      await page.evaluate(
        () => !!window.postControlsFixture.state().post.pinnedAt
      )
    ).toBe(false);
    await capture('pin-cap-error-390');
    ok('Pin cap failure stays unpinned and readable error');
    await action('Pin post').click();
    await expect
      .poll(() =>
        page.evaluate(() => !!window.postControlsFixture.state().post.pinnedAt)
      )
      .toBe(true);
    ok('Deliberate retry succeeds after cap boundary rejection');
    await page.keyboard.press('Escape');
    await page.reload();
    await openMenu();
    await expect(action('Unpin post')).toBeVisible();
    await expect(action('Open replies')).toBeVisible();
    ok('Lock and pin acknowledged state persists through reload');
  } else {
    await page.setViewportSize({ width: 390, height: 1000 });
    await open('event=1');
    await openMenu();
    await action('Lock replies').click();
    await expect
      .poll(() =>
        page.evaluate(
          () => window.postControlsFixture.state().post.repliesDisabled
        )
      )
      .toBe(true);
    await openMenu();
    await action('Pin post').click();
    await expect
      .poll(() =>
        page.evaluate(() => !!window.postControlsFixture.state().post.pinnedAt)
      )
      .toBe(true);
    await openMenu();
    await page.evaluate(() =>
      window.postControlsFixture.fail('A rejected old-post action')
    );
    await action('Unpin post').click();
    await expect(page.getByRole('alert').first()).toContainText(
      'A rejected old-post action'
    );
    await page.keyboard.press('Escape');
    await settle(page);
    await page.evaluate(() => window.postControlsFixture.switchPost());
    await expect(
      page.getByRole('heading', {
        name: 'A different post on the same component',
        exact: true,
      })
    ).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
    await openMenu();
    await expect(action('Lock replies')).toBeVisible();
    await expect(action('Pin post')).toBeVisible();
    await capture('fresh-post-menu-390');
    await action('Lock replies').click();
    await expect
      .poll(() =>
        page.evaluate(
          () => window.postControlsFixture.state().calls.at(-1).args
        )
      )
      .toEqual({
        postId: 'post-two',
        repliesDisabled: true,
        expectedRevision: 0,
      });
    ok(
      'Reused actual FullPost clears previous post acknowledgements/errors and submits fresh revision zero'
    );
  }
  expect(report.errors).toEqual([]);
} finally {
  await writeFile(join(output, 'report.json'), JSON.stringify(report, null, 2));
  await browser.close();
}
console.log(JSON.stringify(report, null, 2));
