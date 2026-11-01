import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { test, expect, type Page } from '@playwright/test';
import { ConvexHttpClient } from 'convex/browser';
import { anyApi } from 'convex/server';
import type { api as generatedApi } from '../../../../../convex/_generated/api';
const api = anyApi as typeof generatedApi;
import type { Id } from '../../../../../convex/_generated/dataModel';
import { ConvexSeeder } from '../../helpers/convex-seeder';

// Run only against the explicitly configured isolated fixture deployment.
// Example selection: --project=chromium content/shared-content.spec.ts
// Both responsive layouts are exercised here; this is browser, not device QA.
test.use({ trace: 'off', video: 'off', screenshot: 'off' });

function redact(text: string) {
  const fixtureKey = process.env.E2E_FIXTURE_KEY;
  return (fixtureKey ? text.split(fixtureKey).join('[REDACTED]') : text)
    .replace(
      /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
      '[REDACTED JWT]'
    )
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [REDACTED]')
    .replace(
      /(?:https?:\/\/)?[^\s]*[?&][^=\s]*(?:token|code|secret|key)[^=\s]*=[^\s]*/gi,
      '[REDACTED URL]'
    );
}

async function openChoice(
  page: Page,
  base: string,
  choice: string,
  narrow: boolean
) {
  await page.goto(base);
  const trigger = page.getByRole('button', {
    name: 'New content',
    exact: true,
  });
  await expect(trigger).toBeVisible();
  await trigger.click();
  const overlay = narrow
    ? page.getByRole('dialog', { name: 'New content', exact: true })
    : page.getByRole('menu', { name: 'New content', exact: true });
  await expect(overlay).toBeVisible();
  for (const name of ['Post', 'Form', 'List', 'Poll']) {
    await expect(
      overlay.getByRole(narrow ? 'link' : 'menuitem', { name, exact: true })
    ).toBeVisible();
  }
  await overlay
    .getByRole(narrow ? 'link' : 'menuitem', { name: choice, exact: true })
    .click();
}

async function createContent(
  page: Page,
  base: string,
  context: 'event' | 'group',
  narrow: boolean,
  suffix: string,
  routes: string[]
) {
  const title = (kind: string) => `Acceptance ${context} ${kind} ${suffix}`;
  await openChoice(page, base, 'Post', narrow);
  await page.getByLabel('Title', { exact: true }).fill(title('Post'));
  const editor = page
    .getByTestId('post-editor-body')
    .locator('[contenteditable="true"]');
  await expect(editor).toBeVisible();
  await editor.fill(`Persisted ${context} discussion ${suffix}`);
  await page
    .getByRole('button', {
      name: context === 'event' ? 'Post' : 'Publish post',
      exact: true,
    })
    .click();
  if (context === 'event') {
    // Event publishing intentionally returns to its parent feed.
    await expect(page).toHaveURL(new RegExp(`${base}$`));
    const savedCard = page
      .getByTestId('post-card')
      .filter({ hasText: title('Post') });
    await expect(savedCard).toBeVisible();
    await savedCard.click();
  }
  await expect(page).toHaveURL(
    new RegExp(`${base}/(?:post|posts)/(?!new$)[^/]+$`)
  );
  routes.push(new URL(page.url()).pathname);
  await page.reload();
  await expect(
    page.getByRole('heading', { name: title('Post'), exact: true })
  ).toBeVisible();
  await expect(
    page.getByText(`Persisted ${context} discussion ${suffix}`, { exact: true })
  ).toBeVisible();

  await openChoice(page, base, 'Form', narrow);
  await page
    .getByRole('button', { name: 'Use feedback template', exact: true })
    .click();
  await page.getByLabel('Form title', { exact: true }).fill(title('Form'));
  await page.getByRole('button', { name: 'Create form', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${base}/forms/(?!new$)[^/]+$`));
  routes.push(new URL(page.url()).pathname);
  await page.reload();
  await expect(
    page.getByRole('heading', { name: title('Form'), exact: true })
  ).toBeVisible();
  await page
    .getByLabel('What would you like us to know?', { exact: true })
    .fill(`Feedback ${suffix}`);
  await page
    .getByRole('button', { name: 'Save response', exact: true })
    .click();
  await expect(
    page.getByText('Response saved.', { exact: true })
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByLabel('What would you like us to know?', { exact: true })
  ).toHaveValue(`Feedback ${suffix}`);

  await openChoice(page, base, 'List', narrow);
  await page.getByLabel('List title', { exact: true }).fill(title('List'));
  await page.getByRole('button', { name: 'Create list', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${base}/lists/(?!new$)[^/]+$`));
  routes.push(new URL(page.url()).pathname);
  await page
    .getByLabel('New entry', { exact: true })
    .fill(`Saved entry ${suffix}`);
  await page.getByRole('button', { name: 'Add entry', exact: true }).click();
  await expect(page.getByLabel('Entry text', { exact: true })).toHaveValue(
    `Saved entry ${suffix}`
  );
  await page.reload();
  await expect(
    page.getByRole('heading', { name: title('List'), exact: true })
  ).toBeVisible();
  await expect(page.getByLabel('Entry text', { exact: true })).toHaveValue(
    `Saved entry ${suffix}`
  );

  await openChoice(page, base, 'Poll', narrow);
  await page.getByLabel('Poll title', { exact: true }).fill(title('Poll'));
  await page.getByRole('button', { name: 'Create poll', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${base}/polls/(?!new$)[^/]+$`));
  routes.push(new URL(page.url()).pathname);
  await page.getByRole('radio', { name: 'Yes', exact: true }).check();
  await page.getByRole('button', { name: 'Save vote', exact: true }).click();
  await expect(page.getByText('Vote saved.', { exact: true })).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('heading', { name: title('Poll'), exact: true })
  ).toBeVisible();
  await expect(
    page.getByRole('radio', { name: 'Yes', exact: true })
  ).toBeChecked();

  // Saved content remains discoverable through each parent collection.
  for (const kind of ['Form', 'List', 'Poll']) {
    await page.goto(`${base}/${kind.toLowerCase()}s`);
    await page.getByRole('link', { name: title(kind), exact: true }).click();
    await expect(
      page.getByRole('heading', { name: title(kind), exact: true })
    ).toBeVisible();
  }
}

for (const narrow of [false, true]) {
  test(`shared content persists in Event and Group (${narrow ? 'narrow drawer' : 'desktop dropdown'})`, async ({
    page,
    baseURL,
  }, testInfo) => {
    test.setTimeout(300_000);
    if (!process.env.E2E_FIXTURE_KEY || process.env.E2E_FIXTURE_KEY.length < 32)
      throw new Error(
        'The isolated fixture key must be configured before acceptance.'
      );
    const convexUrl =
      process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl || !baseURL)
      throw new Error(
        'Acceptance needs explicit frontend and matching isolated backend URLs.'
      );
    const evidenceRoot =
      process.env.E2E_EVIDENCE_DIR ?? testInfo.outputPath('evidence');
    await mkdir(evidenceRoot, { recursive: true });
    const suffix = randomUUID();
    const email = `shared-content-${suffix}@example.invalid`;
    const username = `accept_${suffix.replaceAll('-', '').slice(0, 20)}`;
    const manifestPath = `${evidenceRoot}/shared-content-fixture-manifest-${narrow ? 'narrow' : 'desktop'}-${suffix}.json`;
    const seeder = new ConvexSeeder();
    const manifest = {
      label: `PR436 shared content ${suffix}`,
      userId: '',
      personId: '',
      eventId: '',
      groupId: '',
      routes: [] as string[],
      screenshots: [] as string[],
      diagnostics: {
        pageErrors: [] as string[],
        consoleErrors: [] as string[],
      },
      retirement: {
        event: 'not-created',
        group: 'not-created',
        account: 'not-created',
        fixtureRecords: 'pending',
      },
    };
    let client: ConvexHttpClient | undefined;
    let eventId: Id<'events'> | undefined;
    let groupId: Id<'groups'> | undefined;
    const errors = manifest.diagnostics.pageErrors;
    page.on('pageerror', error => {
      errors.push(
        redact(
          `${error.name}: ${error.message}\n${error.stack?.split('\n').slice(1, 4).join('\n') ?? ''}`
        )
      );
      process.stderr.write(`Acceptance page error: ${errors.at(-1)}\n`);
    });
    page.on('console', message => {
      if (message.type() === 'error')
        manifest.diagnostics.consoleErrors.push(redact(message.text()));
    });
    await page.setViewportSize(
      narrow ? { width: 390, height: 844 } : { width: 1440, height: 1000 }
    );
    try {
      manifest.retirement.account = 'creating';
      const session = await seeder.createTestSession({
        email,
        name: 'Isolated shared content acceptance',
        username,
      });
      if (!session.personId)
        throw new Error('The fixture did not create an application profile.');
      manifest.retirement.account = 'pending';
      manifest.userId = session.userId;
      manifest.personId = session.personId;
      // Direct fixture token creation bypasses auth email delivery entirely.
      const magicLink = await seeder.createMagicLinkToken(email);
      if (!magicLink)
        throw new Error(
          'The isolated fixture login token could not be created.'
        );
      const link = new URL(magicLink);
      link.searchParams.set('callbackURL', `${link.origin}/events`);
      // Verify at the deployment's trusted origin, without exposing the
      // short-lived URL to a browser trace or sending an auth email.
      const verified = await page.request
        .get(link.toString(), { maxRedirects: 0 })
        .catch(() => {
          throw new Error('The fixture login verification request failed.');
        });
      if (verified.status() >= 400)
        throw new Error('The fixture login verification was rejected.');
      const sessionResponse = await page.request.get(
        `${link.origin}/api/auth/get-session`,
        { maxRedirects: 0 }
      );
      if (
        !sessionResponse.ok() ||
        (await sessionResponse.json())?.user?.email !== email
      )
        throw new Error(
          'The session does not match the newly created fixture account.'
        );
      const tokenResponse = await page.request.get(
        `${link.origin}/api/auth/convex/token`,
        { maxRedirects: 0 }
      );
      if (!tokenResponse.ok())
        throw new Error('The authenticated application token is unavailable.');
      const { token } = await tokenResponse.json();
      if (typeof token !== 'string')
        throw new Error('The authenticated application token is unavailable.');
      const target = new URL(baseURL);
      if (target.origin !== link.origin) {
        if (
          target.protocol !== 'https:' &&
          !['localhost', '127.0.0.1'].includes(target.hostname)
        )
          throw new Error(
            'Fixture cookies may only be handed to HTTPS or a loopback frontend.'
          );
        const cookies = (await page.context().cookies(link.origin)).filter(
          cookie => /(?:^|-)better-auth\.session_token$/.test(cookie.name)
        );
        if (!cookies.length)
          throw new Error(
            'The fixture did not establish a signed session cookie.'
          );
        await page.context().addCookies(
          cookies.map(cookie => ({
            ...cookie,
            domain: target.hostname,
            path: '/',
            // Prefix requirements still apply on loopback secure contexts.
            secure:
              target.protocol === 'https:' ||
              cookie.name.startsWith('__Secure-') ||
              cookie.name.startsWith('__Host-'),
            sameSite: 'Lax' as const,
          }))
        );
      }
      await page.goto(`${baseURL}/events`);
      await expect(page).toHaveURL(/\/events(?:\?|$)/);
      const browserSession = await page.request.get(
        `${baseURL}/api/auth/get-session`,
        { maxRedirects: 0 }
      );
      if (
        !browserSession.ok() ||
        (await browserSession.json())?.user?.email !== email
      )
        throw new Error(
          'The frontend did not accept the isolated signed session cookie.'
        );
      client = new ConvexHttpClient(convexUrl);
      client.setAuth(token);
      const notificationSettings = await client.query(
        api.settings.queries.getNotificationSettings,
        {}
      );
      if (notificationSettings.notificationMethods.length)
        throw new Error(
          'Fixture accounts must have no external notification methods.'
        );

      manifest.retirement.event = 'creating';
      const event = await seeder.createEvent({
        creatorPersonId: session.personId,
        title: manifest.label,
      });
      eventId = event.eventId as Id<'events'>;
      manifest.eventId = eventId;
      manifest.retirement.event = 'pending';
      manifest.retirement.group = 'creating';
      groupId = await client.mutation(api.groups.mutations.createGroup, {
        name: manifest.label,
      });
      manifest.groupId = groupId;
      manifest.retirement.group = 'pending';
      const addon = { eventId, addonType: 'bring-list' };
      const key = `claims:${session.personId}`;
      await client.mutation(api.addons.mutations.enableAddon, {
        ...addon,
        config: {
          items: [{ id: 'chips', name: 'Acceptance chips', quantity: 3 }],
        },
      });
      await client.mutation(api.addons.mutations.setAddonData, {
        ...addon,
        key,
        data: { chips: 2 },
      });
      const legacy = {
        config: await client.query(api.addons.queries.getAddonConfig, addon),
        claim: await client.query(api.addons.queries.getAddonDataByKey, {
          ...addon,
          key,
        }),
      };
      await createContent(
        page,
        `/event/${eventId}`,
        'event',
        narrow,
        suffix,
        manifest.routes
      );
      await createContent(
        page,
        `/groups/${groupId}`,
        'group',
        narrow,
        suffix,
        manifest.routes
      );
      expect({
        config: await client.query(api.addons.queries.getAddonConfig, addon),
        claim: await client.query(api.addons.queries.getAddonDataByKey, {
          ...addon,
          key,
        }),
      }).toEqual(legacy);
      await page.goto(`/event/${eventId}/addon/bring-list`);
      await expect(
        page.getByText('Acceptance chips', { exact: true })
      ).toBeVisible();
      expect(
        await client.query(api.addons.queries.getAddonData, addon)
      ).toEqual([legacy.claim]);
      expect(errors).toEqual([]);
      const layout = narrow ? 'narrow' : 'desktop';
      await page.goto(`/event/${eventId}`);
      await expect(
        page
          .getByTestId('post-card')
          .filter({ hasText: `Acceptance event Post ${suffix}` })
      ).toBeVisible();
      const eventScreenshot = `${evidenceRoot}/shared-content-acceptance-${layout}-event.png`;
      await page.screenshot({ path: eventScreenshot, fullPage: true });
      manifest.screenshots.push(eventScreenshot);
      await page.goto(`/groups/${groupId}`);
      await page.getByRole('link', { name: 'Posts', exact: true }).click();
      await expect(
        page.getByRole('link', {
          name: `Acceptance group Post ${suffix}`,
          exact: true,
        })
      ).toBeVisible();
      const groupScreenshot = `${evidenceRoot}/shared-content-acceptance-${layout}.png`;
      await page.screenshot({ path: groupScreenshot, fullPage: true });
      manifest.screenshots.push(groupScreenshot);
      expect(errors).toEqual([]);
    } catch (error) {
      // Capture the failing fixture view before finally retires its parent.
      // Restrict screenshots/body text to this invocation's known entity URLs;
      // login/verification pages and their query strings are never persisted.
      const current = new URL(page.url());
      const fixturePage =
        (eventId && current.pathname.startsWith(`/event/${eventId}`)) ||
        (groupId && current.pathname.startsWith(`/groups/${groupId}`));
      const diagnostic = `${evidenceRoot}/groupi-content-failure-${narrow ? 'narrow' : 'desktop'}`;
      if (
        fixturePage &&
        ![...current.searchParams.keys()].some(key =>
          /token|code|secret|key/i.test(key)
        )
      ) {
        try {
          const body = await page.locator('body').innerText();
          await writeFile(
            `${diagnostic}.txt`,
            `${current.pathname}\n\n${redact(body)}`,
            { mode: 0o600 }
          );
          await page.screenshot({ path: `${diagnostic}.png`, fullPage: true });
        } catch {
          await writeFile(
            `${diagnostic}.txt`,
            `${current.pathname}\nFixture diagnostic capture unavailable.`,
            { mode: 0o600 }
          );
        }
      } else {
        await writeFile(
          `${diagnostic}.txt`,
          'Failure occurred outside a known fixture content route; body and screenshot intentionally omitted.',
          { mode: 0o600 }
        );
      }
      throw error;
    } finally {
      // Retire only IDs created by this invocation using normal canonical APIs.
      // If retirement fails, preserve accounts and the exact manifest for root
      // recovery rather than hiding orphaned feature data behind legacy cleanup.
      let retirementFailed = Object.values(manifest.retirement).includes(
        'creating'
      );
      for (const kind of ['event', 'group', 'account'] as const)
        if (manifest.retirement[kind] === 'creating')
          manifest.retirement[kind] = 'unconfirmed';
      if (client && eventId) {
        try {
          const result = await client.mutation(
            api.events.mutations.deleteEvent,
            { eventId }
          );
          if (result?.success !== true)
            throw new Error('Event retirement did not confirm success.');
          manifest.retirement.event = 'deleted';
        } catch {
          manifest.retirement.event = 'unconfirmed';
          retirementFailed = true;
        }
      }
      if (client && groupId) {
        try {
          await client.mutation(api.groups.mutations.deleteGroup, { groupId });
          manifest.retirement.group = 'deleted';
        } catch {
          manifest.retirement.group = 'unconfirmed';
          retirementFailed = true;
        }
      }
      if (!retirementFailed && manifest.userId) {
        try {
          if (!client)
            throw new Error(
              'Authenticated fixture account retirement is unavailable.'
            );
          const result = await client.mutation(
            api.users.mutations.deleteUserAccount,
            { confirmation: username }
          );
          if (result?.success !== true)
            throw new Error('Account retirement did not confirm success.');
          manifest.retirement.account = 'deleted';
        } catch {
          manifest.retirement.account = 'unconfirmed';
          retirementFailed = true;
        }
      } else if (retirementFailed)
        manifest.retirement.account = 'retained-for-recovery';
      if (!retirementFailed) {
        try {
          // Canonical account retirement already removed application state;
          // the fixture helper now clears only remaining verification records
          // and tolerates its already-removed explicitly tracked IDs.
          await seeder.cleanup();
          manifest.retirement.fixtureRecords = 'deleted';
        } catch {
          manifest.retirement.fixtureRecords = 'unconfirmed';
          retirementFailed = true;
        }
      }
      const manifestBody = JSON.stringify(manifest, null, 2);
      await writeFile(manifestPath, manifestBody, { mode: 0o600 });
      await testInfo.attach('shared-content-fixture-manifest', {
        path: manifestPath,
        contentType: 'application/json',
      });
      if (retirementFailed)
        throw new Error(
          'Fixture retirement is unconfirmed; retain the attached ID-only manifest for recovery.'
        );
    }
  });
}
