import { expect, test, vi } from 'vitest';
import { deliverMagicLink } from '../delegatedApps/hostedEmail';
const appearance = {
  brandName: 'Red Room & friends',
  senderName: 'Red Room',
  accent: '#991b1b',
};
test('magic-link delivery uses a live registered brand and preserves the exact verification URL', async () => {
  const lookup = vi.fn().mockResolvedValue(appearance);
  const send = vi.fn().mockResolvedValue({ error: null });
  const callback = `/onboarding?redirect=${encodeURIComponent(encodeURIComponent('/oauth/consent?interactionId=trusted'))}`;
  const url = `https://ui.example/api/auth/magic-link/verify?token=one-use&callbackURL=${encodeURIComponent(callback)}`;
  await deliverMagicLink({
    email: 'visitor@example.test',
    url,
    siteOrigin: 'https://ui.example',
    from: 'Groupi <noreply@groupi.gg>',
    lookup,
    send,
  });
  expect(lookup).toHaveBeenCalledWith('trusted');
  expect(send).toHaveBeenCalledWith(
    expect.objectContaining({
      to: 'visitor@example.test',
      from: 'Red Room <noreply@groupi.gg>',
      subject: 'Sign in to Red Room & friends',
    })
  );
  expect(send.mock.calls[0][0].html).toContain('Red Room &amp; friends');
  expect(send.mock.calls[0][0].html).toContain(url.replaceAll('&', '&amp;'));
  expect(send.mock.calls[0][0].html).toContain('Sign-in provided by Groupi');
});
test.each([
  'https://evil.example/oauth/consent?interactionId=stolen',
  '//evil.example/oauth/consent?interactionId=stolen',
  '/events?brandName=Fake',
])(
  'an untrusted continuation cannot select an email brand: %s',
  async callback => {
    const lookup = vi.fn();
    const send = vi.fn().mockResolvedValue({ error: null });
    await deliverMagicLink({
      email: 'visitor@example.test',
      url: `https://ui.example/api/auth/magic-link/verify?token=secret&callbackURL=${encodeURIComponent(callback)}`,
      siteOrigin: 'https://ui.example',
      from: 'Groupi <noreply@groupi.gg>',
      lookup,
      send,
    });
    expect(lookup).not.toHaveBeenCalled();
    expect(send.mock.calls[0][0].subject).toBe('Sign in to Groupi');
  }
);
test('a rejected delivery is reported rather than claiming the email was sent', async () => {
  await expect(
    deliverMagicLink({
      email: 'visitor@example.test',
      url: 'https://ui.example/api/auth/magic-link/verify?token=secret',
      siteOrigin: 'https://ui.example',
      from: 'Groupi <noreply@groupi.gg>',
      lookup: vi.fn(),
      send: vi.fn().mockResolvedValue({ error: { message: 'Unavailable' } }),
    })
  ).rejects.toThrow('Sign-in email could not be delivered');
});
