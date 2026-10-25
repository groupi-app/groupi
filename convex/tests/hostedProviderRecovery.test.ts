// @vitest-environment node
import { afterEach, expect, test, vi } from 'vitest';
import { api } from '../_generated/api';
import { setup, beginConsent } from './delegated-protocol.helpers';
afterEach(() => vi.unstubAllEnvs());
test('opening an interaction in another browser recovers on the trusted hosted origin', async () => {
  const context = await setup();
  const { interactionId } = await beginConsent(context, 'openid');
  const url = new URL(`${context.issuer}/interaction/${interactionId}`);
  const result = await context.t.fetch(url.pathname + url.search, {
    headers: { accept: 'text/html' },
  });
  expect(result.status).toBe(303);
  const recovery = new URL(result.headers.get('location')!);
  expect(recovery.origin + recovery.pathname).toBe(
    'https://ui.example/oauth/error'
  );
  expect(recovery.searchParams.get('interactionId')).toBe(
    url.pathname.split('/').at(-1)
  );
});

test('denied consent returns only access_denied and state to the exact registered app callback', async () => {
  const context = await setup();
  const { interactionId, cookies } = await beginConsent(context, 'openid');
  const denied = await context.owner.auth.mutation(
    api.delegatedApps.mutations.denyConsent,
    { interactionId }
  );
  const approval = new URL(denied.resumeUrl);
  const result = await context.t.fetch(approval.pathname + approval.search, {
    headers: { cookie: cookies },
  });
  expect(result.status).toBe(303);
  const resume = new URL(result.headers.get('location')!);
  const finished = await context.t.fetch(resume.pathname + resume.search, {
    headers: { cookie: cookies },
  });
  const callback = new URL(finished.headers.get('location')!);
  expect(callback.origin + callback.pathname).toBe(context.redirectUri);
  expect(callback.searchParams.get('error')).toBe('access_denied');
  expect(callback.searchParams.get('state')).toBe('client-state');
  expect(callback.searchParams.has('code')).toBe(false);
});
