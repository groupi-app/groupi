import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useQuery, useMutation } from 'convex/react';
import { getFunctionName } from 'convex/server';
import { api } from '@/convex/_generated/api';
import type { Doc, Id } from '@/convex/_generated/dataModel';
import { AddonPage } from './addon-page';

vi.unmock('@/convex/_generated/api');
// Authentication and neighboring event/account hooks are outside this feature.
// The page, catalog, completion hook, and custom renderer run unchanged.
vi.mock('@/context/global-user-context', () => ({
  useGlobalUser: () => ({ person: { _id: 'person-a' } }),
}));
vi.mock('@/hooks/convex/use-events', () => ({
  useEventHeaderData: vi.fn(),
  useEventAttendeesData: vi.fn(),
}));
vi.mock('@/hooks/convex/use-accounts', () => ({
  useHasLinkedProviders: vi.fn(),
}));

const eventId = 'event-a' as Id<'events'>;
let config: Doc<'eventAddonConfigs'> | null | undefined;
let completed: boolean;
const saveData = vi.fn();

function savedConfig(
  name = 'Event A questions',
  required = true
): Doc<'eventAddonConfigs'> {
  return {
    _id: 'config-a' as Id<'eventAddonConfigs'>,
    _creationTime: 1,
    createdAt: 1,
    updatedAt: 1,
    eventId,
    addonType: 'custom:shared-template',
    enabled: true,
    config: {
      templateId: 'shared-template',
      template: {
        name,
        description: 'Saved event version',
        iconName: 'info',
        settings: { requiresCompletion: required },
        sections: [
          {
            id: 'intro',
            title: 'Instructions',
            layout: 'form',
            fields: [
              {
                id: 'intro-text',
                type: 'static_text',
                required: false,
                label: 'Details',
                content: `Instructions for ${name}`,
              },
            ],
          },
        ],
      },
    },
  };
}

function customTemplate(row: typeof config) {
  if (!row || !('template' in row.config) || !row.config.template)
    throw new Error('Expected a custom template fixture');
  return row.config.template;
}

beforeEach(() => {
  vi.clearAllMocks();
  config = savedConfig();
  completed = false;
  saveData.mockReset().mockResolvedValue(undefined);
  const mutation = Object.assign(saveData, {
    withOptimisticUpdate: () => mutation,
  });
  vi.mocked(useMutation).mockReturnValue(mutation);
  vi.mocked(useQuery).mockImplementation((query, args?) => {
    if (args === 'skip') return undefined;
    switch (getFunctionName(query)) {
      case 'events/queries:getEventHeader':
        return { event: { _id: eventId, title: 'Test event' } };
      case 'addons/queries:getAddonConfig':
        return config;
      case 'addons/queries:getEventAddons':
        return config ? [config] : [];
      case 'addons/queries:getAddonCompletionStatus':
        return {
          isOrganizer: false,
          availability: { required: false, completed: false },
          addons: config ? [{ addonType: config.addonType, completed }] : [],
        };
      case 'addons/queries:getMyAddonData':
      case 'addons/queries:getAddonData':
        return completed ? [{ key: 'response:person-a', data: {} }] : [];
      case 'users/queries:getCurrentUserData':
        return {
          user: {
            _id: 'user-a',
            email: 'a@example.com',
            name: 'A',
            role: 'user',
          },
          person: { _id: 'person-a', bio: null },
          needsOnboarding: false,
        };
      default:
        throw new Error(`Unexpected query: ${getFunctionName(query)}`);
    }
  });
});

function page(id = eventId, addonId = 'custom:shared-template') {
  return <AddonPage eventId={id} addonId={addonId} />;
}

describe('AddonPage', () => {
  it('shows loading without rendering a form until configuration arrives', () => {
    config = undefined;
    render(page());
    expect(screen.getByRole('status')).toHaveTextContent('Loading add-on');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it.each(['disabled', 'missing', 'unsupported', 'card-only'] as const)(
    'shows an unavailable page for a %s add-on with a return link and no form',
    state => {
      let addonId = 'custom:shared-template';
      if (state === 'disabled') config!.enabled = false;
      if (state === 'missing') config = null;
      if (state === 'unsupported') addonId = 'unsupported-addon';
      if (state === 'card-only')
        customTemplate(config).settings!.cardOnly = true;
      render(page(eventId, addonId));
      expect(
        screen.getByRole('heading', { name: 'Add-on unavailable' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: 'Return to Event' })
      ).toHaveAttribute('href', `/event/${eventId}`);
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /submit/i })
      ).not.toBeInTheDocument();
    }
  );

  it('renders a required custom add-on on a direct visit before any prior setup', () => {
    render(page());
    expect(
      screen.getByRole('heading', { name: 'Event A questions' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('Instructions for Event A questions')
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Test event' })
    ).not.toBeInTheDocument();
  });

  it.each(['display-only', 'empty'] as const)(
    'lets members acknowledge a required %s add-on and records its completion',
    async contents => {
      const user = userEvent.setup();
      if (contents === 'empty') customTemplate(config).sections[0].fields = [];
      const { rerender } = render(page());

      await user.click(
        screen.getByRole('button', { name: 'Mark as complete' })
      );

      expect(useMutation).toHaveBeenCalledWith(
        api.addons.mutations.setAddonData
      );
      expect(saveData).toHaveBeenCalledWith({
        eventId,
        addonType: 'custom:shared-template',
        key: 'response:person-a',
        data: {},
      });
      // Convex publishes the saved empty response and updated completion state.
      completed = true;
      rerender(page());
      expect(screen.getByRole('button', { name: 'Completed' })).toBeDisabled();
      expect(screen.getByRole('link', { name: 'Test event' })).toHaveAttribute(
        'href',
        `/event/${eventId}`
      );
    }
  );

  it('does not ask for acknowledgement on an optional display-only add-on', () => {
    config = savedConfig('Optional instructions', false);
    render(page());
    expect(
      screen.queryByRole('button', { name: 'Mark as complete' })
    ).not.toBeInTheDocument();
  });

  it('does not carry draft answers into another event using the same template', async () => {
    const user = userEvent.setup();
    customTemplate(config).sections[0].fields = [
      { id: 'answer', type: 'text', label: 'Your answer', required: false },
    ];
    const { rerender } = render(page());
    await user.type(screen.getByRole('textbox'), 'Private answer for A');
    config = savedConfig('Event B questions');
    customTemplate(config).sections[0].fields = [
      { id: 'answer', type: 'text', label: 'Your answer', required: false },
    ];
    rerender(page('event-b' as Id<'events'>));
    expect(screen.getByRole('textbox')).toHaveValue('');
  });

  it('renders the current event copy and completion requirement when switching events with one template', () => {
    const { rerender } = render(page());
    expect(
      screen.getByRole('heading', { name: 'Event A questions' })
    ).toBeInTheDocument();
    config = savedConfig('Event B questions', false);
    rerender(page('event-b' as Id<'events'>));
    expect(
      screen.getByRole('heading', { name: 'Event B questions' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Event A questions' })
    ).not.toBeInTheDocument();
    expect(
      screen.getByText('Instructions for Event B questions')
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Test event' })).toHaveAttribute(
      'href',
      '/event/event-b'
    );
  });
  it('clears a numeric answer using the supported empty value when submitting', async () => {
    const user = userEvent.setup();
    customTemplate(config).sections[0].fields = [
      { id: 'answer', type: 'number', label: 'Count', required: false },
    ];
    render(page());
    const input = screen.getByRole('spinbutton');
    await user.type(input, '12');
    await user.clear(input);
    await user.click(screen.getByRole('button', { name: /submit/i }));
    expect(saveData).toHaveBeenCalledWith(
      expect.objectContaining({ data: { answer: null } })
    );
  });
});
