import { describe, expect, it } from 'vitest';
import { getAddonCompletion, getCustomTemplate } from './completion';

function savedTemplate(
  name: string,
  requiresCompletion = true,
  cardOnly = false
) {
  return {
    template: {
      name,
      description: 'Saved event version',
      sections: [],
      settings: { requiresCompletion, cardOnly },
    },
  };
}

describe('event add-on completion metadata', () => {
  it('resolves the saved version independently for each event and revisit', () => {
    const eventA = savedTemplate('Event A', true);
    const eventB = savedTemplate('Event B', false);

    const firstVisit = getAddonCompletion('custom:shared-template', eventA);
    const otherEvent = getAddonCompletion('custom:shared-template', eventB);
    const revisit = getAddonCompletion('custom:shared-template', eventA);

    expect(firstVisit).toEqual({
      id: 'custom:shared-template',
      name: 'Event A',
      requiresCompletion: true,
      completionRoute: '/addon/custom:shared-template',
    });
    expect(otherEvent).toEqual({
      id: 'custom:shared-template',
      name: 'Event B',
      requiresCompletion: false,
      completionRoute: undefined,
    });
    expect(revisit).toEqual(firstVisit);
  });

  it('keeps card-only templates accessible even when marked required', () => {
    const result = getAddonCompletion(
      'custom:card',
      savedTemplate('Card', true, true)
    );

    expect(result).toMatchObject({ requiresCompletion: false });
    expect(result?.completionRoute).toBeUndefined();
  });

  it.each([
    undefined,
    null,
    {},
    { template: null },
    { template: 'invalid' },
    { template: { name: 'Missing sections', description: '' } },
    { template: { name: 1, description: '', sections: [] } },
    {
      template: {
        name: 'Invalid description',
        description: null,
        sections: [],
      },
    },
  ])(
    'does not offer completion for a missing or malformed saved template: %j',
    config => {
      expect(getCustomTemplate(config)).toBeUndefined();
      expect(getAddonCompletion('custom:missing', config)).toBeUndefined();
    }
  );

  it.each(['unknown', 'constructor', 'toString', '__proto__'])(
    'does not resolve unsupported built-in %s',
    id => {
      expect(getAddonCompletion(id)).toBeUndefined();
    }
  );

  it('requires the built-in questionnaire while keeping optional built-ins ungated', () => {
    expect(getAddonCompletion('questionnaire')).toMatchObject({
      requiresCompletion: true,
      completionRoute: '/addon/questionnaire',
    });
    for (const id of ['reminders', 'bring-list', 'discord']) {
      expect(getAddonCompletion(id)).toMatchObject({
        requiresCompletion: false,
      });
    }
  });
});
