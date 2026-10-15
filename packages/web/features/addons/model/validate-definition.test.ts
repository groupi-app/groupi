import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AddonDefinition } from './types';

function validDefinition(): AddonDefinition {
  return {
    id: 'example',
    name: 'Example',
    description: 'An example add-on',
    iconName: 'bell',
    CreateConfigComponent: () => null,
    EventCardComponent: () => null,
    ManageConfigComponent: () => null,
    isEnabled: () => false,
    onEnable: () => ({}),
    onDisable: () => ({}),
    getConfigFromFormState: () => null,
    supportsOptOut: false,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('built-in definition validation', () => {
  it('accepts optional definitions and required definitions with completion routes', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const { validateAddon } = await import('./validate-definition');
    const definition = validDefinition();

    expect(validateAddon(definition)).toBe(true);
    expect(
      validateAddon({
        ...definition,
        requiresCompletion: true,
        completionRoute: '/addon/example',
      })
    ).toBe(true);
  });

  it.each([
    'id',
    'name',
    'description',
    'iconName',
    'CreateConfigComponent',
    'EventCardComponent',
    'ManageConfigComponent',
    'isEnabled',
    'onEnable',
    'onDisable',
    'getConfigFromFormState',
  ] as const)(
    'reports and skips a definition missing %s in production',
    async key => {
      vi.stubEnv('NODE_ENV', 'production');
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { validateAddon } = await import('./validate-definition');
      const definition = {
        ...validDefinition(),
        [key]: undefined,
      } as unknown as AddonDefinition;

      const accepted = validateAddon(definition);

      expect(accepted).toBe(false);
      expect(error).toHaveBeenCalledWith(expect.stringContaining(`\`${key}\``));
    }
  );

  it('reports and skips a required definition without a completion route in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { validateAddon } = await import('./validate-definition');

    const accepted = validateAddon({
      ...validDefinition(),
      requiresCompletion: true,
    });

    expect(accepted).toBe(false);
    expect(error).toHaveBeenCalledWith(
      expect.stringContaining('`completionRoute` is required')
    );
  });

  it('throws an actionable validation error during development', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const { validateAddon } = await import('./validate-definition');

    expect(() =>
      validateAddon({ ...validDefinition(), requiresCompletion: true })
    ).toThrow('`completionRoute` is required');
  });
});
