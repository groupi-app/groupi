import { describe, expect, it } from 'vitest';
import { createApiV1App } from '../api/v1';
import { createApiV2App } from '../api/v2';

// The REST adapter must reject unsupported credentials before dispatching a
// legacy domain operation, even if verified identity fields were supplied.
describe('REST credential dispatch', () => {
  it.each([createApiV1App, createApiV2App])(
    'does not downgrade an unsupported credential into legacy account access',
    async createApp => {
      const app = createApp(undefined, 'user', 'person', {
        kind: 'unsupported-credential',
        credentialId: 'credential',
      } as never);
      const response = await app.request('/events');
      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({
        error: {
          code: 'FORBIDDEN',
          message: 'Credential type is not supported by this API.',
        },
      });
    }
  );
});
