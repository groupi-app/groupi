/* eslint-disable @typescript-eslint/no-unused-vars */
// _react and _approuterinstance are lexical dependencies of the extracted Next handler.
import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';

const fixtureRoot = dirname(fileURLToPath(import.meta.url));
const webRoot = fileURLToPath(new URL('../../', import.meta.url));
const outputRoot = join(webRoot, 'test-results/history');
await mkdir(outputRoot, { recursive: true });
const require = createRequire(join(webRoot, 'package.json'));
const { chromium, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const esbuild = createRequire(require.resolve('vitest/package.json'))(
  'esbuild'
);
const tailwind = require('@tailwindcss/postcss');
const postcss = createRequire(require.resolve('@tailwindcss/postcss'))(
  'postcss'
);
const origin = 'https://invite-list-components.test';
const legacyHistory = process.argv.includes('--legacy-history');
const bootstrapHistory = process.argv.includes('--bootstrap-history');
const bootstrapGap = process.argv.includes('--bootstrap-gap');
const bootstrapRegression = process.argv.includes('--bootstrap-regression');
const unknownDiscard = process.argv.includes('--unknown-discard');
const headFixture =
  bootstrapHistory || bootstrapGap || bootstrapRegression || unknownDiscard;
const outputStem = unknownDiscard
  ? 'verification-components-unknown-discard-green'
  : bootstrapGap
    ? 'verification-components-bootstrap-gap'
    : bootstrapRegression
      ? legacyHistory
        ? 'verification-components-bootstrap-legacy'
        : 'verification-components-bootstrap-main'
      : bootstrapHistory
        ? 'verification-components-bootstrap'
        : legacyHistory
          ? 'verification-components-legacy-history'
          : 'verification-components-browser';
const evidence = {
  fixture:
    'Actual production Settings, UnifiedInviteDialog, NavigationGuardProvider, Radix controls and Zustand store; isolated reactive Convex and Next boundaries; no server/auth/external network',
  assertions: [],
  errors: [],
  blockedRequests: [],
  accessibilityNameChecks: [],
  mode: unknownDiscard
    ? 'unknown native fragment Settings Discard under actual installed Next null-state handler'
    : bootstrapGap
      ? 'production head bootstrap, scope gaps and earlier installed Next listener with Navigation API disabled'
      : bootstrapHistory
        ? 'production head bootstrap before native anchors/provider adoption with Navigation API disabled'
        : legacyHistory
          ? bootstrapRegression
            ? 'unattributed native hash with production head bootstrap and Navigation API disabled'
            : 'unattributed native hash with Navigation API disabled'
          : bootstrapRegression
            ? 'primary component checks with production root-head bootstrap'
            : 'primary component checks',
  limits: [
    'Convex queries/mutations and Next router/link boundaries use isolated synthetic fixtures; no deployed Next rendering, live authentication, account or backend behavior verified.',
    'Automated accessible-name rules and actual browser keyboard/focus behavior do not establish screen-reader or native-device behavior.',
  ],
};
let bootstrapText;
let installedNextPopstate;
if (headFixture) {
  const source = await readFile(
    join(webRoot, 'lib/navigation-history.ts'),
    'utf8'
  );
  const transformed = await esbuild.transform(source, {
    loader: 'ts',
    format: 'cjs',
    target: 'es2022',
  });
  const fixtureModule = { exports: {} };
  runInNewContext(transformed.code, {
    module: fixtureModule,
    exports: fixtureModule.exports,
  });
  bootstrapText = fixtureModule.exports.navigationHistoryBootstrapScript;
  if (typeof bootstrapText !== 'string')
    throw new Error(
      'Production navigationHistoryBootstrapScript export not found.'
    );
  const ts = require('typescript');
  const nextPath = require.resolve('next/dist/client/components/app-router');
  const nextSource = ts.createSourceFile(
    nextPath,
    await readFile(nextPath, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.JS
  );
  function visit(node) {
    if (
      ts.isVariableDeclaration(node) &&
      node.name.getText(nextSource) === 'onPopState'
    )
      installedNextPopstate = node.initializer.getText(nextSource);
    ts.forEachChild(node, visit);
  }
  visit(nextSource);
  if (!installedNextPopstate)
    throw new Error('Installed Next onPopState handler not found.');
  evidence.nextBoundary =
    bootstrapHistory || bootstrapGap || unknownDiscard
      ? 'Actual installed Next AppRouter onPopState function extracted from app-router.js and mounted before the active component guard; real location.reload, isolated startTransition and traversal recorder. Full Next routing/store/SSR is not mounted.'
      : 'Production head bootstrap mounted; standard isolated Next router/link boundary retained for these component regressions. Installed Next onPopState is not mounted in this mode.';
}
async function settleFocusWork(page) {
  await page.evaluate(
    () =>
      new Promise(resolve =>
        requestAnimationFrame(() => requestAnimationFrame(resolve))
      )
  );
}
async function inspectBootstrapHistory(page) {
  evidence.observations = [];
  evidence.documentRequests = [];
  page.on('request', request => {
    if (request.isNavigationRequest())
      evidence.documentRequests.push(request.url());
  });
  const observe = async step => {
    const result = await page.evaluate(() => ({
      url: location.href,
      state: history.state,
      length: history.length,
      singletonPresent: !!window.__groupiNavigationTracker,
      headPushRetained: history.pushState === window.fixtureHeadPush,
      headReplaceRetained: history.replaceState === window.fixtureHeadReplace,
      bubblingClicks: window.fixtureBubblingClicks,
      activeTag: document.activeElement?.tagName,
      activeId: document.activeElement?.id,
      nextTraversals: window.fixtureNextTraversals ?? [],
    }));
    evidence.observations.push({ step, ...result });
    return result;
  };
  const installNextBoundary = async () => {
    await page.evaluate(source => {
      window.fixtureNextTraversals = [];
      const _react = { startTransition: callback => callback() };
      const _approuterinstance = {
        dispatchTraverseAction: (url, tree) =>
          window.fixtureNextTraversals.push({ url, tree }),
      };
      // Execute the installed handler body, retaining its actual reload branch.
      const handler = eval(`(${source})`);
      window.addEventListener('popstate', handler);
    }, installedNextPopstate);
  };
  const loadComponents = async () => {
    if (!(await page.evaluate(() => !!window.componentFixture)))
      await page.addScriptTag({ type: 'module', url: `${origin}/fixture.js` });
    await page.waitForFunction(() => !!window.componentFixture);
  };
  await page.goto(`${origin}/docs/api`);
  await page.waitForFunction(() => window.fixtureBootstrapReady);
  const initial = await observe(
    'Head bootstrap before body anchor click and React'
  );
  expect(initial.state.__groupiNavigationIndex).toBe(0);
  expect(initial.state.__NA).toBeUndefined();
  expect(initial.state.__PRIVATE_NEXTJS_INTERNALS_TREE).toBeUndefined();
  expect(await page.evaluate(() => window.componentFixture)).toBeUndefined();
  await page
    .getByRole('link', { name: 'Profile early anchor', exact: true })
    .click();
  await expect.poll(() => page.url()).toBe(`${origin}/docs/api#profile`);
  await expect
    .poll(() => page.evaluate(() => history.state?.__groupiNavigationIndex))
    .toBe(1);
  const profile = await observe('Native Profile anchor before hydration');
  await page
    .getByRole('link', { name: 'Members early anchor', exact: true })
    .click();
  await expect.poll(() => page.url()).toBe(`${origin}/docs/api#members`);
  await expect
    .poll(() => page.evaluate(() => history.state?.__groupiNavigationIndex))
    .toBe(2);
  const members = await observe('Native Members anchor before hydration');
  for (const snapshot of [profile, members]) {
    expect(snapshot.state.__groupiNavigationScope).toBe(
      initial.state.__groupiNavigationScope
    );
    expect(snapshot.state.__NA).toBeUndefined();
    expect(snapshot.state.__PRIVATE_NEXTJS_INTERNALS_TREE).toBeUndefined();
    expect(snapshot.headPushRetained).toBe(true);
    expect(snapshot.headReplaceRetained).toBe(true);
  }
  expect(profile.length).toBe(initial.length + 1);
  expect(members.length).toBe(initial.length + 2);
  expect(members.bubblingClicks).toBe(2);
  evidence.assertions.push(
    'Actual production head text tracks two native docs anchors before React, stable scope, index0→1→2, exact native length increments; bubbling clicks remain delivered; no __NA/tree fabricated'
  );
  await installNextBoundary();
  await loadComponents();
  await page.evaluate(() => {
    history.replaceState(
      {
        __NA: true,
        __PRIVATE_NEXTJS_INTERNALS_TREE: ['supplied-settings-tree'],
        fixture: 'Next-supplied current entry',
      },
      '',
      '/settings/invite-lists'
    );
    window.componentFixture.mount('settings', true);
  });
  await expect(
    page.getByRole('button', { name: 'Create invite list', exact: true })
  ).toBeVisible();
  const adopted = await observe(
    'StrictMode provider adopts root-head singleton after supplied Settings replace'
  );
  expect(adopted.state.__groupiNavigationIndex).toBe(2);
  expect(adopted.state.__groupiNavigationScope).toBe(
    initial.state.__groupiNavigationScope
  );
  expect(adopted.state.__PRIVATE_NEXTJS_INTERNALS_TREE).toEqual([
    'supplied-settings-tree',
  ]);
  expect(adopted.length).toBe(members.length);
  expect(adopted.headPushRetained).toBe(true);
  expect(adopted.headReplaceRetained).toBe(true);
  evidence.assertions.push(
    'Actual StrictMode provider acquires head singleton without replacing wrappers/scope/index or adding entries; only supplied Next Settings tree is retained'
  );
  await page
    .getByRole('button', { name: 'Create invite list', exact: true })
    .click();
  await page
    .getByLabel('List name', { exact: true })
    .fill('Bootstrap dirty draft');
  expect(
    await page.evaluate(() => {
      const event = new Event('beforeunload', { cancelable: true });
      window.dispatchEvent(event);
      return event.defaultPrevented;
    })
  ).toBe(true);
  const requestsBeforeBack = evidence.documentRequests.length;
  await page.evaluate(() => history.back());
  await expect(
    page.getByRole('heading', { name: 'Discard this invite list?' })
  ).toBeFocused();
  await expect.poll(() => page.url()).toBe(`${origin}/settings/invite-lists`);
  const restored = await observe(
    'Dirty Back to early Profile is restored before decision; missing-tree Next reload blocked'
  );
  expect(restored.state).toEqual(adopted.state);
  expect(restored.length).toBe(adopted.length);
  expect(restored.nextTraversals).toEqual([]);
  expect(evidence.documentRequests.length).toBe(requestsBeforeBack);
  await page.getByRole('button', { name: 'Keep Editing', exact: true }).click();
  await settleFocusWork(page);
  await expect(page.getByLabel('List name', { exact: true })).toHaveValue(
    'Bootstrap dirty draft'
  );
  await expect(page.getByLabel('List name', { exact: true })).toBeFocused();
  expect(page.url()).toBe(`${origin}/settings/invite-lists`);
  evidence.assertions.push(
    'Dirty actual Settings Back restores exact Settings URL/state before choice, blocks installed Next missing-tree reload, Keep preserves input focus/draft; beforeunload still cancels'
  );
  await page.evaluate(() => history.back());
  await expect(
    page.getByRole('heading', { name: 'Discard this invite list?' })
  ).toBeFocused();
  await expect.poll(() => page.url()).toBe(`${origin}/settings/invite-lists`);
  await page.screenshot({
    path: join(outputRoot, `${outputStem}.png`),
    fullPage: true,
  });
  const reloaded = page.waitForEvent('load');
  await page.getByRole('button', { name: 'Discard', exact: true }).click();
  await reloaded;
  await page.waitForFunction(() => window.fixtureBootstrapReady);
  expect(page.url()).toBe(`${origin}/docs/api#profile`);
  const discarded = await observe(
    'Explicit Discard reaches early Profile; installed Next missing-__NA branch performs real synthetic-origin reload'
  );
  expect(discarded.state.__groupiNavigationIndex).toBe(0);
  expect(discarded.state.__groupiNavigationScope).not.toBe(
    profile.state.__groupiNavigationScope
  );
  expect(discarded.state.__NA).toBeUndefined();
  expect(discarded.state.__PRIVATE_NEXTJS_INTERNALS_TREE).toBeUndefined();
  expect(discarded.length).toBe(adopted.length);
  expect(evidence.documentRequests.length).toBe(requestsBeforeBack + 1);
  expect(evidence.documentRequests.at(-1)).toBe(`${origin}/docs/api`);
  expect(await page.evaluate(() => window.componentFixture)).toBeUndefined();
  evidence.assertions.push(
    'Explicit Discard alone releases metadata-only Profile traversal; installed Next non-__NA branch performs real reload. New document starts fresh scope/index0 without fabricating Next tree or adding entries'
  );

  // A separate same-document case supplies framework trees before provider
  // hydration. Cross-document metadata is intentionally not treated as a
  // known contiguous chain after the genuine reload above.
  await page.goto(`${origin}/docs/api`);
  await page.waitForFunction(() => window.fixtureBootstrapReady);
  await page
    .getByRole('link', { name: 'Profile early anchor', exact: true })
    .click();
  await expect
    .poll(() => page.evaluate(() => history.state?.__groupiNavigationIndex))
    .toBe(1);
  await page.evaluate(() =>
    history.replaceState(
      {
        __NA: true,
        __PRIVATE_NEXTJS_INTERNALS_TREE: ['supplied-profile-tree'],
      },
      '',
      location.href
    )
  );
  const validProfile = await observe(
    'Framework supplies Profile tree in same document before provider'
  );
  await page
    .getByRole('link', { name: 'Members early anchor', exact: true })
    .click();
  await expect
    .poll(() => page.evaluate(() => history.state?.__groupiNavigationIndex))
    .toBe(2);
  await installNextBoundary();
  await loadComponents();
  await page.evaluate(() => {
    history.replaceState(
      {
        __NA: true,
        __PRIVATE_NEXTJS_INTERNALS_TREE: ['supplied-settings-tree'],
      },
      '',
      '/settings/invite-lists'
    );
    window.componentFixture.mount('settings', true);
  });
  await page
    .getByRole('button', { name: 'Create invite list', exact: true })
    .click();
  await page
    .getByLabel('List name', { exact: true })
    .fill('Supplied tree guard draft');
  const validSettings = await observe(
    'Supplied Settings tree in same document'
  );
  const requestsBeforeValidBack = evidence.documentRequests.length;
  await page.evaluate(() => history.back());
  await expect(
    page.getByRole('heading', { name: 'Discard this invite list?' })
  ).toBeFocused();
  await expect.poll(() => page.url()).toBe(`${origin}/settings/invite-lists`);
  expect(await page.evaluate(() => window.fixtureNextTraversals)).toEqual([]);
  expect(evidence.documentRequests.length).toBe(requestsBeforeValidBack);
  await page.getByRole('button', { name: 'Keep Editing', exact: true }).click();
  await settleFocusWork(page);
  await expect(page.getByLabel('List name', { exact: true })).toHaveValue(
    'Supplied tree guard draft'
  );
  await expect(page.getByLabel('List name', { exact: true })).toBeFocused();
  expect(await page.evaluate(() => history.state)).toEqual(validSettings.state);
  await observe(
    'Supplied-tree Back blocked before Next; Keep retains exact Settings URL/state/draft/focus'
  );
  await page.evaluate(() => history.back());
  await expect(
    page.getByRole('heading', { name: 'Discard this invite list?' })
  ).toBeFocused();
  await expect.poll(() => page.url()).toBe(`${origin}/settings/invite-lists`);
  await page.screenshot({
    path: join(outputRoot, `${outputStem}.png`),
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Discard', exact: true }).click();
  await settleFocusWork(page);
  await expect.poll(() => page.url()).toBe(`${origin}/docs/api#profile`);
  await expect
    .poll(() => page.evaluate(() => window.fixtureNextTraversals))
    .toEqual([
      { url: `${origin}/docs/api#profile`, tree: ['supplied-profile-tree'] },
    ]);
  expect(await page.evaluate(() => history.state)).toEqual(validProfile.state);
  expect(evidence.documentRequests.length).toBe(requestsBeforeValidBack);
  await observe(
    'Deliberate Discard alone releases supplied Profile traversal without reload'
  );
  await page.goForward();
  await expect.poll(() => page.url()).toBe(`${origin}/settings/invite-lists`);
  expect(await page.evaluate(() => history.state)).toEqual(validSettings.state);
  expect(await page.evaluate(() => history.length)).toBe(validSettings.length);
  await observe(
    'Actual Forward preserves supplied Settings tree/index/scope/history length'
  );
  expect(
    await page.evaluate(() => window.componentFixture.fixture.calls)
  ).toEqual([]);
  evidence.assertions.push(
    'Same-document supplied-tree Back blocks earlier installed Next traversal until decision; Keep restores draft/input focus/exact state; Discard releases original Profile tree; real Forward restores original Settings state and length, with no reload or mutation'
  );
}

async function inspectBootstrapGap(page) {
  evidence.observations = [];
  evidence.documentRequests = [];
  page.on('request', request => {
    if (request.isNavigationRequest())
      evidence.documentRequests.push(request.url());
  });
  for (const operation of ['pushState', 'replaceState']) {
    await page.goto(`${origin}/docs/api`);
    await page.waitForFunction(() => window.fixtureBootstrapReady);
    await page
      .getByRole('link', { name: 'Profile early anchor', exact: true })
      .click();
    await expect
      .poll(() => page.evaluate(() => history.state?.__groupiNavigationIndex))
      .toBe(1);
    await page
      .getByRole('link', { name: 'Members early anchor', exact: true })
      .click();
    await expect
      .poll(() => page.evaluate(() => history.state?.__groupiNavigationIndex))
      .toBe(2);
    const older = await page.evaluate(() => ({
      state: history.state,
      url: location.href,
      length: history.length,
    }));
    await page.evaluate(() => {
      location.hash = 'unattributed-gap';
    });
    await expect
      .poll(() => page.url())
      .toBe(`${origin}/docs/api#unattributed-gap`);
    expect(await page.evaluate(() => history.state)).toBeNull();
    await page.evaluate(
      operation =>
        history[operation](
          {
            __NA: true,
            __PRIVATE_NEXTJS_INTERNALS_TREE: ['settings-after-gap'],
          },
          '',
          '/settings/invite-lists'
        ),
      operation
    );
    const settings = await page.evaluate(() => ({
      state: history.state,
      url: location.href,
      length: history.length,
    }));
    expect(settings.state.__groupiNavigationIndex).toBe(0);
    expect(settings.state.__groupiNavigationScope).not.toBe(
      older.state.__groupiNavigationScope
    );
    await page.evaluate(source => {
      window.fixtureNextTraversals = [];
      const _react = { startTransition: callback => callback() };
      const _approuterinstance = {
        dispatchTraverseAction: (url, tree) =>
          window.fixtureNextTraversals.push({ url, tree }),
      };
      window.addEventListener('popstate', eval(`(${source})`));
    }, installedNextPopstate);
    await page.addScriptTag({ type: 'module', url: `${origin}/fixture.js` });
    await page.waitForFunction(() => !!window.componentFixture);
    await page.evaluate(() => window.componentFixture.mount('settings', true));
    await page
      .getByRole('button', { name: 'Create invite list', exact: true })
      .click();
    await page
      .getByLabel('List name', { exact: true })
      .fill(`${operation} gap draft`);
    const requestsBefore = evidence.documentRequests.length;
    const distance = operation === 'pushState' ? 2 : 1;
    await page.evaluate(distance => history.go(-distance), distance);
    await expect(
      page.getByRole('heading', { name: 'Discard this invite list?' })
    ).toBeVisible();
    evidence.observations.push({
      operation,
      step: 'Unknown-gap confirmation entry',
      older,
      settings,
      current: await page.evaluate(() => ({
        url: location.href,
        state: history.state,
        length: history.length,
        activeTag: document.activeElement?.tagName,
        nextTraversals: window.fixtureNextTraversals,
      })),
    });
    await expect(
      page.getByRole('heading', { name: 'Discard this invite list?' })
    ).toBeFocused();
    // Mismatched scopes cannot prove a distance. The attempted Members URL
    // remains; no guessed compensating traversal/reload is permitted.
    expect(page.url()).toBe(`${origin}/docs/api#members`);
    expect(await page.evaluate(() => window.fixtureNextTraversals)).toEqual([]);
    expect(evidence.documentRequests.length).toBe(requestsBefore);
    await page
      .getByRole('button', { name: 'Keep Editing', exact: true })
      .click();
    await settleFocusWork(page);
    await expect(page.getByRole('alert')).toContainText(
      'Use the opposite browser history button'
    );
    await expect(page.getByLabel('List name', { exact: true })).toHaveValue(
      `${operation} gap draft`
    );
    await expect(page.getByLabel('List name', { exact: true })).toBeFocused();
    expect(page.url()).toBe(`${origin}/docs/api#members`);
    expect(await page.evaluate(() => history.length)).toBe(settings.length);
    evidence.observations.push({
      operation,
      step: 'Across unknown gap: no automatic direction guessed, Keep retains draft/focus/attempted URL',
      older,
      settings,
      current: await page.evaluate(() => ({
        url: location.href,
        state: history.state,
        length: history.length,
        activeTag: document.activeElement?.tagName,
        nextTraversals: window.fixtureNextTraversals,
      })),
    });
    await page.screenshot({
      path: join(outputRoot, `${outputStem}.png`),
      fullPage: true,
    });
    await page.evaluate(distance => history.go(distance), distance);
    await expect.poll(() => page.url()).toBe(settings.url);
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page.getByLabel('List name', { exact: true })).toHaveValue(
      `${operation} gap draft`
    );
    await expect(page.getByLabel('List name', { exact: true })).toBeFocused();
    expect(await page.evaluate(() => history.state)).toEqual(settings.state);
    expect(await page.evaluate(() => history.length)).toBe(settings.length);
    expect(await page.evaluate(() => window.fixtureNextTraversals)).toEqual([]);
    expect(
      await page.evaluate(() => window.componentFixture.fixture.calls)
    ).toEqual([]);
    evidence.observations.push({
      operation,
      step: 'Explicit opposite traversal restores exact Settings state/URL/draft/focus without history rewrite',
    });
    evidence.assertions.push(
      `${operation}: unattributed hash breaks chain; tracked Settings starts fresh scope0; dirty jump to older scope uses warning/retained draft and focus, blocks actual Next without guessing compensating direction; deliberate opposite traversal restores exact Settings state/URL/length without mutation`
    );
  }
}

async function inspectUnknownDiscard(page) {
  evidence.observations = [];
  evidence.documentRequests = [];
  evidence.behaviorFailures = [];
  page.on('request', request => {
    if (request.isNavigationRequest())
      evidence.documentRequests.push(request.url());
  });
  for (const mode of ['create', 'edit']) {
    await page.goto(`${origin}/settings/invite-lists`);
    await page.waitForFunction(() => window.fixtureBootstrapReady);
    await page.evaluate(source => {
      window.fixtureNextTraversals = [];
      window.fixtureNextDelivered = [];
      const _react = { startTransition: callback => callback() };
      const _approuterinstance = {
        dispatchTraverseAction: (url, tree) =>
          window.fixtureNextTraversals.push({ url, tree }),
      };
      window.addEventListener('popstate', eval(`(${source})`));
      window.addEventListener('popstate', event =>
        window.fixtureNextDelivered.push({
          url: location.href,
          state: event.state,
        })
      );
    }, installedNextPopstate);
    await page.addScriptTag({ type: 'module', url: `${origin}/fixture.js` });
    await page.waitForFunction(() => !!window.componentFixture);
    await page.evaluate(() => window.componentFixture.mount('settings', true));
    const savedLists = await page.evaluate(() =>
      structuredClone(window.componentFixture.fixture.lists)
    );
    if (mode === 'create') {
      await page
        .getByRole('button', { name: 'Create invite list', exact: true })
        .click();
      await page
        .getByRole('button', { name: 'Add Ada Friend', exact: true })
        .click();
    } else {
      await page
        .getByRole('button', { name: 'View Weekend, 2 people', exact: true })
        .click();
      await page
        .getByRole('button', { name: 'Edit list', exact: true })
        .click();
      await page
        .getByRole('button', { name: 'Remove Lee Friend', exact: true })
        .click();
    }
    await page
      .getByLabel('List name', { exact: true })
      .fill(`Unsaved ${mode} fragment draft`);
    await page.getByLabel('Search by username', { exact: true }).fill('sam');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page
      .getByRole('button', { name: 'Add Sam Other', exact: true })
      .click();
    await page.getByLabel('List name', { exact: true }).focus();
    const before = await page.evaluate(() => ({
      url: location.href,
      length: history.length,
      state: history.state,
    }));
    const requestsBefore = evidence.documentRequests.length;
    await page.evaluate(mode => {
      location.hash = `unknown-discard-${mode}`;
    }, mode);
    const confirmation =
      mode === 'create'
        ? 'Discard this invite list?'
        : 'Discard changes to this invite list?';
    await expect(
      page.getByRole('heading', { name: confirmation, exact: true })
    ).toBeFocused();
    const attempted = await page.evaluate(() => ({
      url: location.href,
      length: history.length,
      state: history.state,
    }));
    expect(attempted.state).toBeNull();
    expect(attempted.length).toBe(before.length + 1);
    expect(await page.evaluate(() => window.fixtureNextDelivered)).toEqual([]);
    await page.getByRole('button', { name: 'Discard', exact: true }).click();
    await settleFocusWork(page);
    const after = await page.evaluate(() => ({
      url: location.href,
      length: history.length,
      state: history.state,
      nextDelivered: window.fixtureNextDelivered,
      nextTraversals: window.fixtureNextTraversals,
      input: document.querySelector('#invite-list-name')?.value ?? null,
      search: document.querySelector('#invite-list-search')?.value ?? null,
      body: document.body.innerText,
      lists: structuredClone(window.componentFixture.fixture.lists),
      calls: window.componentFixture.fixture.calls,
    }));
    evidence.observations.push({ mode, before, attempted, after });
    expect(after.url).toBe(attempted.url);
    expect(after.length).toBe(attempted.length);
    expect(after.state).toBeNull();
    expect(after.nextDelivered).toEqual([{ url: attempted.url, state: null }]);
    expect(after.nextTraversals).toEqual([]);
    expect(evidence.documentRequests.length).toBe(requestsBefore);
    expect(after.lists).toEqual(savedLists);
    expect(after.calls).toEqual([]);
    // Collect both public create/edit failures rather than stop after one.
    try {
      await expect(page.getByLabel('List name', { exact: true })).toHaveCount(
        0
      );
      if (mode === 'create') {
        await expect(
          page.getByRole('button', { name: 'Create invite list', exact: true })
        ).toBeFocused();
        await page
          .getByRole('button', { name: 'Create invite list', exact: true })
          .click();
        await expect(page.getByLabel('List name', { exact: true })).toHaveValue(
          ''
        );
        await expect(
          page.getByRole('heading', {
            name: 'Selected people (0/100)',
            exact: true,
          })
        ).toBeVisible();
      } else {
        await expect(
          page.getByRole('heading', { name: 'Weekend', exact: true })
        ).toBeVisible();
        await expect(
          page.getByRole('button', { name: 'Edit list', exact: true })
        ).toBeFocused();
        await page
          .getByRole('button', { name: 'Edit list', exact: true })
          .click();
        await expect(page.getByLabel('List name', { exact: true })).toHaveValue(
          'Weekend'
        );
        await expect(
          page.getByRole('button', { name: 'Remove Ada Friend', exact: true })
        ).toBeVisible();
        await expect(
          page.getByRole('button', { name: 'Remove Lee Friend', exact: true })
        ).toBeVisible();
        await expect(
          page.getByRole('button', { name: 'Remove Sam Other', exact: true })
        ).toHaveCount(0);
      }
      await expect(
        page.getByLabel('Search by username', { exact: true })
      ).toHaveValue('');
      await expect(
        page.getByRole('heading', { name: 'Your friends', exact: true })
      ).toBeVisible();
      await expect(
        page.getByRole('heading', { name: 'Search results', exact: true })
      ).toHaveCount(0);
      evidence.assertions.push(
        `${mode}: unknown-fragment Discard clears local draft, restores safe local view/focus, releases installed Next null-state handler without unmount/reload, preserves saved lists and exact attempted URL/null state/history length, no mutation; reopening has fresh original name/people/search`
      );
    } catch (failure) {
      evidence.behaviorFailures.push({ mode, failure: failure.message });
    }
    await page.screenshot({
      path: join(outputRoot, `${outputStem}-${mode}.png`),
      fullPage: true,
    });
  }
  expect(evidence.behaviorFailures).toEqual([]);
}

async function inspectLegacyHistory(page) {
  evidence.observations = [];
  const observe = async step => {
    evidence.observations.push({
      step,
      ...(await page.evaluate(() => {
        const label = [...document.querySelectorAll('label')].find(
          label => label.textContent === 'List name'
        );
        const input = label ? document.getElementById(label.htmlFor) : null;
        const active = document.activeElement;
        return {
          url: location.href,
          state: history.state,
          length: history.length,
          draftValue: input?.value ?? null,
          activeTag: active?.tagName,
          activeId: active?.id,
          activeText: active?.textContent?.slice(0, 100),
          historyWarning: [...document.querySelectorAll('[role="alert"]')].map(
            element => element.textContent
          ),
          deliveredPopstate: window.fixtureDeliveredPopstates ?? [],
          text: document.body.innerText,
        };
      })),
    });
  };
  await page.evaluate(() => {
    window.fixtureDeliveredPopstates = [];
    window.addEventListener('popstate', event =>
      window.fixtureDeliveredPopstates.push({
        url: location.href,
        state: event.state,
      })
    );
  });
  await page
    .getByRole('button', { name: 'Create invite list', exact: true })
    .click();
  await page
    .getByLabel('List name', { exact: true })
    .fill('Unattributed Settings draft');
  await observe('Settings draft before unattributed hash');
  await page.evaluate(() => {
    location.hash = 'typed-settings';
  });
  await expect(
    page.getByRole('heading', { name: 'Discard this invite list?' })
  ).toBeFocused();
  await expect
    .poll(() => page.url())
    .toBe(`${origin}/settings/invite-lists#typed-settings`);
  await observe(
    'Settings unattributed hash confirmation: attempted hash remains in URL'
  );
  await page.getByRole('button', { name: 'Keep Editing', exact: true }).click();
  await settleFocusWork(page);
  await expect(page.getByLabel('List name', { exact: true })).toHaveValue(
    'Unattributed Settings draft'
  );
  await expect(page.getByLabel('List name', { exact: true })).toBeFocused();
  expect(page.url()).toBe(`${origin}/settings/invite-lists#typed-settings`);
  await expect(page.getByRole('alert')).toContainText(
    'Use the opposite browser history button'
  );
  await observe(
    'Settings Keep Editing: draft/input focus preserved, attempted hash and recovery warning remain'
  );
  await page.screenshot({
    path: join(outputRoot, `${outputStem}.png`),
    fullPage: true,
  });
  await page.goBack();
  await expect.poll(() => page.url()).toBe(`${origin}/settings/invite-lists`);
  await expect(page.getByLabel('List name', { exact: true })).toHaveValue(
    'Unattributed Settings draft'
  );
  await expect(page.getByLabel('List name', { exact: true })).toBeFocused();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await observe(
    'Settings manual Back: original URL restored, same draft/focus, warning cleared'
  );
  await page.goForward();
  await expect(
    page.getByRole('heading', { name: 'Discard this invite list?' })
  ).toBeFocused();
  await page.getByRole('button', { name: 'Discard', exact: true }).click();
  await settleFocusWork(page);
  await expect
    .poll(() => page.url())
    .toBe(`${origin}/settings/invite-lists#typed-settings`);
  await expect(
    page.getByRole('heading', { name: 'Discard this invite list?' })
  ).toHaveCount(0);
  await observe(
    'Settings Discard on untracked hash: current hash retained and pending popstate released; actual Next unmount remains mocked'
  );
  expect(
    await page.evaluate(() => window.componentFixture.fixture.calls)
  ).toEqual([]);
  evidence.assertions.push(
    'Settings unattributed hash stays in URL after Keep; draft and input focus preserved with honest manual-recovery warning; manual Back restores original URL/focus/draft; Forward+Discard releases pending popstate without fabricated history or mutations'
  );

  await page.evaluate(() => window.componentFixture.mount('invite'));
  await page.getByRole('button', { name: 'Open invitation fixture' }).click();
  await page
    .getByRole('button', { name: 'Choose Weekend', exact: true })
    .click();
  await page.getByRole('button', { name: 'Add Weekend', exact: true }).click();
  await page.getByLabel('Message (optional)', { exact: true }).click();
  await page.keyboard.type('Legacy parent message');
  await page
    .getByRole('button', { name: 'Create invite list', exact: true })
    .click();
  await page
    .getByLabel('List name', { exact: true })
    .fill('Unattributed inline draft');
  await observe('Inline draft before unattributed hash');
  await page.evaluate(() => {
    location.hash = 'typed-inline';
  });
  await expect(
    page.getByRole('heading', { name: 'Discard this invite list?' })
  ).toBeFocused();
  await page.getByRole('button', { name: 'Keep Editing', exact: true }).click();
  await settleFocusWork(page);
  expect(page.url()).toBe(`${origin}/event/event#typed-inline`);
  await expect(page.getByLabel('List name', { exact: true })).toHaveValue(
    'Unattributed inline draft'
  );
  await expect(page.getByLabel('List name', { exact: true })).toBeFocused();
  await expect(page.getByRole('alert')).toContainText(
    'Use the opposite browser history button'
  );
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await observe(
    'Inline Keep Editing: attempted hash remains, editor draft/input focus and single dialog preserved'
  );
  await page.goBack();
  await expect.poll(() => page.url()).toBe(`${origin}/event/event`);
  await expect(page.getByLabel('List name', { exact: true })).toHaveValue(
    'Unattributed inline draft'
  );
  await expect(page.getByLabel('List name', { exact: true })).toBeFocused();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await observe(
    'Inline manual Back: exact original URL restored, draft/input focus preserved, warning cleared'
  );
  await page.goForward();
  await expect(
    page.getByRole('heading', { name: 'Discard this invite list?' })
  ).toBeFocused();
  await page.getByRole('button', { name: 'Discard', exact: true }).click();
  await settleFocusWork(page);
  await expect(
    page.getByRole('button', { name: 'Create invite list', exact: true })
  ).toBeFocused();
  expect(page.url()).toBe(`${origin}/event/event#typed-inline`);
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await expect(
    page.getByLabel('Message (optional)', { exact: true })
  ).toHaveValue('Legacy parent message');
  await expect(
    page.getByRole('button', { name: 'Remove Ada Friend', exact: true })
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Remove Lee Friend', exact: true })
  ).toBeVisible();
  expect(
    await page.evaluate(() => window.componentFixture.fixture.calls)
  ).toEqual([]);
  await observe(
    'Inline Discard: parent invitation flow/opener/message/recipient IDs preserved, attempted hash retained, no mutation'
  );
  evidence.assertions.push(
    'Inline unattributed hash Keep preserves draft/focus/single dialog and warning; manual Back restores exact original URL; Forward+Discard returns to prior invitation flow with retained recipients/message and current attempted hash, silently'
  );
  evidence.limits.push(
    'Unattributed hash entry is created through actual location.hash navigation, analogous to address-bar/manual fragment changes; headless browser address-bar input itself was not automated. No history entry was overwritten to restore the URL.'
  );
}
const result = await esbuild.build({
  entryPoints: [join(fixtureRoot, 'component-entry.tsx')],
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'browser',
  jsx: 'automatic',
  absWorkingDir: webRoot,
  tsconfig: join(webRoot, 'tsconfig.json'),
  define: { 'process.env.NODE_ENV': '"development"' },
  nodePaths: [join(webRoot, 'node_modules')],
  plugins: [
    {
      name: 'isolated-boundaries',
      setup(build) {
        build.onResolve({ filter: /^convex\/react$/ }, () => ({
          path: join(fixtureRoot, 'component-convex.tsx'),
        }));
        build.onResolve(
          { filter: /^next\/(navigation|link|image)$/ },
          args => ({ path: args.path, namespace: 'fixture-next' })
        );
        build.onLoad({ filter: /.*/, namespace: 'fixture-next' }, args => ({
          contents:
            args.path === 'next/navigation'
              ? `export {useRouter,usePathname,useSearchParams} from ${JSON.stringify(join(fixtureRoot, 'component-next.tsx'))};`
              : `export {${args.path === 'next/link' ? 'Link' : 'Image'} as default} from ${JSON.stringify(join(fixtureRoot, 'component-next.tsx'))};`,
          loader: 'js',
          resolveDir: fixtureRoot,
        }));
        build.onResolve({ filter: /^@\/env\.mjs$/ }, () => ({
          path: join(fixtureRoot, 'component-next.tsx'),
        }));
        build.onResolve({ filter: /^(react|react-dom)(\/.*)?$/ }, args => ({
          path: require.resolve(args.path),
        }));
      },
    },
  ],
});
const cssSource = await readFile(join(webRoot, 'styles/globals.css'), 'utf8');
const css = (
  await postcss([tailwind({ base: webRoot })]).process(cssSource, {
    from: join(webRoot, 'styles/globals.css'),
  })
).css;
const html =
  bootstrapHistory || bootstrapGap || unknownDiscard
    ? `<!doctype html><html lang="en"><head><title>Head bootstrap fixture</title><link rel="stylesheet" href="/fixture.css"><script>${bootstrapText}</script><script>window.fixtureBootstrapDefer=true;window.fixtureBootstrapReady=true;window.fixtureHeadPush=history.pushState;window.fixtureHeadReplace=history.replaceState;window.fixtureBubblingClicks=0;document.addEventListener('click',()=>window.fixtureBubblingClicks++);</script></head><body><a href="#profile">Profile early anchor</a><a href="#members">Members early anchor</a><section id="profile"><h2>Profile docs section</h2></section><section id="members"><h2>Members docs section</h2></section><div id="root"></div></body></html>`
    : `<!doctype html><html lang="en"><head><title>Actual Invite List component fixture</title><link rel="stylesheet" href="/fixture.css">${bootstrapRegression ? `<script>${bootstrapText}</script>` : ''}</head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>`;
const browser = await chromium.launch({
  channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
  headless: true,
});
evidence.browser = browser.version();
let page;
try {
  const context = await browser.newContext({
    viewport: { width: 1200, height: 1000 },
  });
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin !== origin) {
      evidence.blockedRequests.push(url.origin);
      return route.abort();
    }
    const resource =
      url.pathname === '/fixture.js'
        ? ['text/javascript', result.outputFiles[0].text]
        : url.pathname === '/fixture.css'
          ? ['text/css', css]
          : ['text/html', html];
    return route.fulfill({
      status: 200,
      contentType: resource[0],
      body: resource[1],
    });
  });
  page = await context.newPage();
  await page.addInitScript(() =>
    Object.defineProperty(window, 'navigation', {
      value: undefined,
      configurable: true,
    })
  );
  page.setDefaultTimeout(8000);
  page.on('pageerror', error => evidence.errors.push(error.message));
  const auditNames = async step => {
    const audit = await new AxeBuilder({ page })
      .withRules([
        'button-name',
        'label',
        'select-name',
        'aria-dialog-name',
        'aria-input-field-name',
      ])
      .analyze();
    evidence.accessibilityNameChecks.push({
      step,
      rules: [
        'button-name',
        'label',
        'select-name',
        'aria-dialog-name',
        'aria-input-field-name',
      ],
      violations: audit.violations.map(violation => ({
        id: violation.id,
        impact: violation.impact,
        nodes: violation.nodes.map(node => node.target),
      })),
    });
    expect(audit.violations).toEqual([]);
  };
  if (unknownDiscard) {
    await inspectUnknownDiscard(page);
  } else if (bootstrapGap) {
    await inspectBootstrapGap(page);
  } else if (bootstrapHistory) {
    await inspectBootstrapHistory(page);
  } else if (legacyHistory) {
    await page.goto(`${origin}/settings/invite-lists`);
    await inspectLegacyHistory(page);
  } else {
    await page.goto(`${origin}/settings/invite-lists`);
    await expect(
      page.getByRole('button', { name: 'Create invite list', exact: true })
    ).toBeVisible();
    await page
      .getByRole('button', { name: 'Create invite list', exact: true })
      .click();
    await expect(page.getByLabel('List name', { exact: true })).toBeFocused();
    await page
      .getByLabel('List name', { exact: true })
      .fill('Dirty settings draft');
    await auditNames('Settings editor accessible names');
    await page.getByLabel('List name', { exact: true }).press('Escape');
    await expect(
      page.getByRole('heading', { name: 'Discard this invite list?' })
    ).toBeFocused();
    await page
      .getByRole('button', { name: 'Keep Editing', exact: true })
      .click();
    await settleFocusWork(page);
    await expect(page.getByLabel('List name', { exact: true })).toBeFocused();
    await expect(page.getByLabel('List name', { exact: true })).toHaveValue(
      'Dirty settings draft'
    );
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Discard', exact: true }).click();
    await settleFocusWork(page);
    await expect(
      page.getByRole('button', { name: 'Create invite list', exact: true })
    ).toBeFocused();
    evidence.assertions.push(
      'Settings create entry focus; dirty Escape same-flow heading focus; Keep restores input focus/draft; Discard restores collection opener focus'
    );

    evidence.currentStep =
      'Settings indexed browser Back guard without Navigation API';
    await page.evaluate(() => {
      history.pushState({ fixture: 'before' }, '', '/before');
      history.pushState({ fixture: 'settings' }, '', '/settings/invite-lists');
    });
    await page
      .getByRole('button', { name: 'Create invite list', exact: true })
      .click();
    await page
      .getByLabel('List name', { exact: true })
      .fill('Browser Back draft');
    await page.evaluate(() => history.back());
    await expect(
      page.getByRole('heading', { name: 'Discard this invite list?' })
    ).toBeFocused();
    await expect.poll(() => page.url()).toBe(`${origin}/settings/invite-lists`);
    await page
      .getByRole('button', { name: 'Keep Editing', exact: true })
      .click();
    await settleFocusWork(page);
    await expect(page.getByLabel('List name', { exact: true })).toHaveValue(
      'Browser Back draft'
    );
    await expect(page.getByLabel('List name', { exact: true })).toBeFocused();
    await page.evaluate(() => history.back());
    await expect(
      page.getByRole('heading', { name: 'Discard this invite list?' })
    ).toBeFocused();
    await expect.poll(() => page.url()).toBe(`${origin}/settings/invite-lists`);
    await page.getByRole('button', { name: 'Discard', exact: true }).click();
    await settleFocusWork(page);
    await expect.poll(() => page.url()).toBe(`${origin}/before`);
    evidence.assertions.push(
      'Actual Settings guard with Navigation API disabled restores indexed Back URL before decision; Keep restores draft/input focus; a second Back+Discard resumes exact /before URL (Next unmount boundary remains mocked)'
    );

    await page.evaluate(() => window.componentFixture.mount('invite'));
    await page.getByRole('button', { name: 'Open invitation fixture' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(1);
    await page.mouse.click(10, 10);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.getByRole('button', { name: 'Open invitation fixture' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(1);
    evidence.assertions.push(
      'Ordinary dialog overlay pointer dismissal closes the actual Radix dialog'
    );
    await page
      .getByRole('button', { name: 'Choose Weekend', exact: true })
      .click();
    await page
      .getByRole('button', { name: 'Add Weekend', exact: true })
      .click();
    await page.getByRole('tab', { name: 'Username', exact: true }).click();
    await page
      .getByRole('textbox', { name: 'Search by username', exact: true })
      .fill('sam');
    await page
      .getByRole('textbox', { name: 'Search by username', exact: true })
      .press('Enter');
    await page.getByRole('tab', { name: 'From list', exact: true }).click();
    await page
      .getByRole('button', { name: 'Choose Dinner', exact: true })
      .click();
    await page
      .getByRole('combobox', { name: 'Invite as', exact: true })
      .click();
    await page.getByRole('option', { name: 'Moderator', exact: true }).click();
    await expect(
      page.getByRole('combobox', { name: 'Invite as', exact: true })
    ).toHaveText('Moderator');
    await expect(
      page.getByRole('combobox', { name: 'Invite as', exact: true })
    ).toBeFocused();
    await page.getByLabel('Message (optional)', { exact: true }).click();
    await page.keyboard.type('Preserved invitation message');
    await expect(
      page.getByLabel('Message (optional)', { exact: true })
    ).toHaveValue('Preserved invitation message');
    await auditNames('Real invitation dialog accessible names');
    for (const dismissal of ['Escape', 'outside', 'Close']) {
      evidence.currentStep = `dirty inline ${dismissal}`;
      await page
        .getByRole('button', { name: 'Create invite list', exact: true })
        .click();
      await expect(page.getByLabel('List name', { exact: true })).toBeFocused();
      await page
        .getByLabel('List name', { exact: true })
        .fill(`Draft ${dismissal}`);
      if (dismissal === 'Escape')
        await page.getByLabel('List name', { exact: true }).press('Escape');
      else if (dismissal === 'outside') await page.mouse.click(10, 10);
      else
        await page.getByRole('button', { name: 'Close', exact: true }).click();
      await expect(
        page.getByRole('heading', { name: 'Discard this invite list?' })
      ).toBeFocused();
      await expect(page.getByRole('dialog')).toHaveCount(1);
      await auditNames(
        `Single dialog ${dismissal} confirmation accessible names`
      );
      await page
        .getByRole('button', { name: 'Keep Editing', exact: true })
        .click();
      await expect(page.getByLabel('List name', { exact: true })).toHaveValue(
        `Draft ${dismissal}`
      );
      if (dismissal !== 'Close')
        await expect(
          page.getByLabel('List name', { exact: true })
        ).toBeFocused();
      else
        await expect(
          page.getByRole('button', { name: 'Close', exact: true })
        ).toBeFocused();
      if (dismissal === 'Escape') {
        await page.screenshot({
          path: join(
            outputRoot,
            `${bootstrapRegression ? outputStem : 'verification-components-browser'}-after.png`
          ),
          fullPage: true,
        });
        evidence.passedScreenshot = `${bootstrapRegression ? outputStem : 'verification-components-browser'}-after.png`;
      }
      await page
        .getByRole('button', { name: 'Back to invitations', exact: true })
        .click();
      await page.getByRole('button', { name: 'Discard', exact: true }).click();
      await settleFocusWork(page);
      await expect(
        page.getByRole('button', { name: 'Create invite list', exact: true })
      ).toBeFocused();
      await expect(
        page.getByLabel('Message (optional)', { exact: true })
      ).toHaveValue('Preserved invitation message');
      await expect(
        page.getByRole('button', { name: 'Add Dinner', exact: true })
      ).toBeVisible();
    }
    evidence.assertions.push(
      'Actual Radix dialog dirty inline Escape/outside/Close stay in one dialog; Keep preserves draft and restores focus; Discard restores parent opener'
    );
    const createInline = async (name, use) => {
      evidence.currentStep = name;
      await page
        .getByRole('button', { name: 'Create invite list', exact: true })
        .click();
      await page.getByLabel('List name', { exact: true }).fill(name);
      await page
        .getByRole('button', { name: 'Add Ada Friend', exact: true })
        .click();
      await page
        .getByRole('textbox', { name: 'Search by username', exact: true })
        .fill('sam');
      await page.getByRole('button', { name: 'Search', exact: true }).click();
      await page
        .getByRole('button', { name: 'Add Sam Other', exact: true })
        .click();
      await page
        .getByRole('button', {
          name: use ? 'Save and use' : 'Save',
          exact: true,
        })
        .click();
      await expect(
        page.getByRole('button', { name: 'Create invite list', exact: true })
      ).toBeFocused();
      await expect(
        page.getByLabel('Message (optional)', { exact: true })
      ).toHaveValue('Preserved invitation message');
      await expect(
        page.getByRole('button', { name: 'Add Dinner', exact: true })
      ).toBeVisible();
    };
    await createInline('Silent save', false);
    await expect(
      page.getByRole('button', { name: 'Remove Ada Friend', exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Remove Lee Friend', exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Remove Sam Other', exact: true })
    ).toHaveCount(0);
    await createInline('Silent save and use', true);
    await expect(
      page.getByRole('button', { name: 'Remove Sam Other', exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole('combobox', { name: 'Invite as', exact: true })
    ).toHaveText('Moderator');
    await expect(
      page.getByLabel('Message (optional)', { exact: true })
    ).toHaveValue('Preserved invitation message');
    await page.getByRole('tab', { name: 'Username', exact: true }).click();
    await expect(
      page.getByRole('textbox', { name: 'Search by username', exact: true })
    ).toHaveValue('sam');
    await page.getByRole('tab', { name: 'From list', exact: true }).click();
    await expect(
      page.getByRole('button', { name: 'Add Dinner', exact: true })
    ).toBeVisible();
    const callsBefore = await page.evaluate(
      () => window.componentFixture.fixture.calls
    );
    expect(callsBefore.map(call => call.name)).toEqual([
      'inviteLists/mutations:createInviteList',
      'inviteLists/mutations:createInviteList',
    ]);
    evidence.assertions.push(
      'Save and Save-and-use both silent; only Save-and-use adds copied member; prior tab/search/list inspection/role/message/recipient IDs preserved'
    );
    for (let index = 0; index < 35; index++) {
      await page.keyboard.press('Tab');
      expect(
        await page.evaluate(
          () => !!document.activeElement?.closest('[role="dialog"]')
        )
      ).toBe(true);
    }
    for (let index = 0; index < 35; index++) {
      await page.keyboard.press('Shift+Tab');
      expect(
        await page.evaluate(
          () => !!document.activeElement?.closest('[role="dialog"]')
        )
      ).toBe(true);
    }
    evidence.assertions.push(
      '70 actual Chrome forward/reverse Tab steps remain inside actual Radix dialog'
    );
    await page
      .getByRole('button', { name: 'Send invitations', exact: true })
      .click();
    const callsAfter = await page.evaluate(
      () => window.componentFixture.fixture.calls
    );
    expect(callsAfter).toHaveLength(3);
    expect(callsAfter[2].name).toBe(
      'inviteLists/mutations:sendInviteListRecipients'
    );
    expect(callsAfter[2].args).toMatchObject({
      personIds: ['ada', 'lee', 'sam'],
      role: 'MODERATOR',
      message: 'Preserved invitation message',
    });
    evidence.calls = callsAfter;
    evidence.assertions.push(
      'Only explicit Send invokes sending mutation, with preserved unique IDs/Moderator/message'
    );
    await page.evaluate(() => window.componentFixture.mount('invite'));
    await page.getByRole('button', { name: 'Open invitation fixture' }).click();
    await page
      .getByRole('button', { name: 'Choose Weekend', exact: true })
      .click();
    await page
      .getByRole('button', { name: 'Add Weekend', exact: true })
      .click();
    await page.evaluate(() => {
      window.componentFixture.fixture.sendMode = 'uncertain';
    });
    await page
      .getByRole('button', { name: 'Send invitations', exact: true })
      .click();
    await expect(
      page.getByRole('button', { name: 'Retry original send', exact: true })
    ).toBeVisible();
    const originalSend = await page.evaluate(
      () => window.componentFixture.fixture.calls[0]
    );
    await page.mouse.click(10, 10);
    await expect(page.getByRole('dialog')).toHaveCount(1);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(1);
    await page.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(1);
    expect(
      await page.evaluate(() => window.componentFixture.fixture.calls)
    ).toEqual([originalSend]);
    await page.evaluate(() => {
      window.componentFixture.fixture.sendMode = 'success';
    });
    await page
      .getByRole('button', { name: 'Retry original send', exact: true })
      .click();
    const protectedCalls = await page.evaluate(
      () => window.componentFixture.fixture.calls
    );
    expect(protectedCalls).toEqual([originalSend, originalSend]);
    await expect(
      page.getByRole('button', { name: 'Retry original send', exact: true })
    ).toHaveCount(0);
    await page.mouse.click(10, 10);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    evidence.protectedCalls = protectedCalls;
    evidence.assertions.push(
      'Uncertain send blocks actual overlay/Escape/Close dismissal without extra mutation; deliberate retry preserves exact request and releases ordinary overlay dismissal after known result'
    );
  }
  expect(evidence.errors).toEqual([]);
  expect(evidence.blockedRequests).toEqual([]);
  evidence.result = 'passed';
} catch (error) {
  evidence.result = 'failed';
  evidence.failure = error.stack;
  if (page)
    evidence.domAtFailure = await page
      .locator('body')
      .innerText()
      .catch(() => 'unavailable');
  if (page) {
    evidence.layoutAtFailure = await page
      .evaluate(() => {
        const describe = element => {
          if (!element) return null;
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return {
            tag: element.tagName,
            role: element.getAttribute('role'),
            slot: element.getAttribute('data-slot'),
            text: element.textContent.slice(0, 90),
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
            zIndex: style.zIndex,
            position: style.position,
            overflow: style.overflow,
            transform: style.transform,
            opacity: style.opacity,
            pointerEvents: style.pointerEvents,
          };
        };
        const button = [...document.querySelectorAll('button')].find(
          button => button.textContent === 'Keep Editing'
        );
        const rect = button?.getBoundingClientRect();
        const ancestors = [];
        for (let element = button; element; element = element.parentElement)
          ancestors.push(describe(element));
        return {
          focused: describe(document.activeElement),
          centerTarget: rect
            ? describe(
                document.elementFromPoint(
                  rect.x + rect.width / 2,
                  rect.y + rect.height / 2
                )
              )
            : null,
          ancestors,
          overlays: [
            ...document.querySelectorAll('[data-slot="dialog-overlay"]'),
          ].map(describe),
        };
      })
      .catch(() => 'unavailable');
    await page
      .screenshot({
        path: join(outputRoot, `${outputStem}.png`),
        fullPage: true,
      })
      .catch(() => {});
  }
  process.exitCode = 1;
} finally {
  await browser.close();
  const evidencePath = join(outputRoot, `${outputStem}.json`);
  await writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
  await writeFile(
    join(outputRoot, `${outputStem}.log`),
    `${JSON.stringify(evidence, null, 2)}\n`
  );
  console.log(
    `${evidence.failure ? 'FAIL' : 'PASS'}: ${evidence.mode}; ${evidence.assertions.length} behavior groups. Evidence: ${evidencePath}`
  );
  if (evidence.failure) console.error(evidence.failure);
}
