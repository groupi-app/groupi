import { describe, expect, it } from 'vitest';

import {
  getPasskeyErrorMessage,
  isPasskeyCancellation,
  isSessionNotFreshError,
} from './passkey-errors';

describe('passkey error handling', () => {
  it('recognizes structured fresh-session failures', () => {
    expect(isSessionNotFreshError({ code: 'SESSION_NOT_FRESH' })).toBe(true);
    expect(
      isSessionNotFreshError({ message: 'The session is not fresh' })
    ).toBe(true);
  });

  it('only treats actual cancellation messages as cancellation', () => {
    expect(
      isPasskeyCancellation({
        code: 'AUTH_CANCELLED',
        message: 'The user canceled the authorization request',
      })
    ).toBe(true);
    expect(
      isPasskeyCancellation({
        code: 'AUTH_CANCELLED',
        message: 'The relying party is not associated with this app',
      })
    ).toBe(false);
  });

  it('uses a readable server message before the fallback', () => {
    expect(
      getPasskeyErrorMessage({ message: 'Passkey verification failed' }, 'Nope')
    ).toBe('Passkey verification failed');
    expect(getPasskeyErrorMessage({}, 'Nope')).toBe('Nope');
  });

  it('explains passkey association failures without exposing native IDs', () => {
    expect(
      getPasskeyErrorMessage(
        {
          message:
            'Unable to verify webcredentials association of FAKETEAMID.com.groupi.mobile with domain www.groupi.gg',
        },
        'Passkey sign-in failed'
      )
    ).toBe(
      'Passkeys aren’t available in this simulator build. Try a signed Groupi build on a physical device.'
    );

    expect(
      getPasskeyErrorMessage(
        { message: 'The relying party is not associated with this app' },
        'Passkey sign-in failed'
      )
    ).toBe(
      "This Groupi build isn't registered for passkeys yet. Install the latest signed build and try again."
    );
  });
});
