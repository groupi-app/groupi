import { test, expect } from '../fixtures/base.fixture';

// Requires the existing authorized E2E fixture setup and matching deployment.
// Never saves a list or sends invitations; fixture accounts are cleaned up by
// base.fixture. Component-boundary tests cannot substitute for this Next route test.
for (const legacy of [false, true]) {
  test(`Invite List Keep/Discard and Next unmount (${legacy ? 'capability disabled' : 'browser default'})`, async ({
    authenticatedPage: page,
  }) => {
    if (legacy) {
      await page.addInitScript(() => {
        Object.defineProperty(window, 'navigation', {
          value: undefined,
          configurable: true,
        });
      });
    }
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/settings/account');
    const listsLink = page.locator('a[href="/settings/invite-lists"]');
    await expect(listsLink).toBeVisible(); // A sign-in redirect must fail, not skip.
    await listsLink.click();
    await expect(page).toHaveURL(/\/settings\/invite-lists$/);
    await page
      .getByRole('button', { name: 'Create invite list', exact: true })
      .click();
    const name = page.getByLabel('List name', { exact: true });
    await name.fill('Unsaved browser history regression');
    await name.focus();

    await page.evaluate(() => history.back());
    await expect(
      page.getByRole('heading', {
        name: 'Discard this invite list?',
        exact: true,
      })
    ).toBeVisible();
    await page
      .getByRole('button', { name: 'Keep Editing', exact: true })
      .click();
    await expect(page).toHaveURL(/\/settings\/invite-lists$/);
    await expect(name).toHaveValue('Unsaved browser history regression');
    await expect(name).toBeFocused();

    await page.evaluate(() => history.back());
    await page.getByRole('button', { name: 'Discard', exact: true }).click();
    await expect(page).toHaveURL(/\/settings\/account$/);
    await expect(name).toHaveCount(0);
    await page.evaluate(() => history.forward());
    await expect(page).toHaveURL(/\/settings\/invite-lists$/);
    await page
      .getByRole('button', { name: 'Create invite list', exact: true })
      .click();
    await expect(name).toHaveValue('');

    // Next Link navigation must obey the same guard and unmount on Discard.
    await name.fill('Unsaved Next Link regression');
    await page.locator('a[href="/settings/account"]').click();
    await page
      .getByRole('button', { name: 'Keep Editing', exact: true })
      .click();
    await expect(name).toHaveValue('Unsaved Next Link regression');
    await expect(page).toHaveURL(/\/settings\/invite-lists$/);
    await page.locator('a[href="/settings/account"]').click();
    await page.getByRole('button', { name: 'Discard', exact: true }).click();
    await expect(page).toHaveURL(/\/settings\/account$/);
    await expect(name).toHaveCount(0);
    await page.locator('a[href="/settings/invite-lists"]').click();
    await page
      .getByRole('button', { name: 'Create invite list', exact: true })
      .click();
    await expect(name).toHaveValue('');
    expect(errors).toEqual([]);
  });
}
