import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Doc, Id } from '@/convex/_generated/dataModel';
import { EventFeatureCards } from './organisms/event-addons';
import { featureInCollection } from './participant-features';

vi.unmock('@/convex/_generated/api');
vi.mock('./catalog', () => ({
  getAddonById: (id: string, config: { template?: { name: string } }) => ({
    EventCardComponent: ({ eventId }: { eventId: string }) => (
      <a href={`/event/${eventId}/addon/${id}`}>
        {config.template?.name ?? id}
      </a>
    ),
  }),
}));
const eventId = 'event-one' as Id<'events'>;
function row(
  addonType: string,
  config: unknown,
  enabled = true
): Doc<'eventAddonConfigs'> {
  return {
    _id: addonType as Id<'eventAddonConfigs'>,
    _creationTime: 1,
    eventId,
    addonType,
    config: config as Doc<'eventAddonConfigs'>['config'],
    enabled,
    createdAt: 1,
    updatedAt: 1,
  };
}
const custom = {
  templateId: 'saved',
  template: {
    name: 'Picnic choices',
    description: 'Saved event version',
    iconName: 'info',
    settings: { requiresCompletion: false },
    sections: [
      {
        id: 'mixed',
        title: 'Plan',
        layout: 'interactive' as const,
        fields: [
          {
            id: 'vote',
            type: 'vote' as const,
            label: 'Choose a meal',
            required: false,
            options: ['Soup', 'Salad'],
          },
          {
            id: 'list',
            type: 'list_item' as const,
            label: 'Bring food',
            required: false,
            items: [{ id: 'a', name: 'Bread', quantity: 1 }],
          },
        ],
      },
    ],
  },
};
const configs = [
  row('reminders', { reminderOffset: '1_DAY' }),
  row('discord', { guildId: 'server', guildName: 'Community' }),
  row('questionnaire', {
    questions: [
      { id: 'name', type: 'SHORT_ANSWER', label: 'Name', required: true },
    ],
  }),
  row('bring-list', { items: [{ id: 'plates', name: 'Plates', quantity: 2 }] }),
  row('custom:saved', custom),
];
describe('contextual Event features', () => {
  it('keeps planning controls separate from named content, without management or a generic section', () => {
    const planning = render(
      <EventFeatureCards
        eventId={eventId}
        configs={configs}
        placement='planning'
      />
    );
    expect(screen.getByRole('link', { name: 'reminders' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'discord' })).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'bring-list' })
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Add-ons')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Manage' })
    ).not.toBeInTheDocument();
    planning.unmount();
    render(
      <EventFeatureCards
        eventId={eventId}
        configs={configs}
        placement='content'
      />
    );
    expect(screen.getByRole('link', { name: 'questionnaire' })).toHaveAttribute(
      'href',
      '/event/event-one/addon/questionnaire'
    );
    expect(screen.getByRole('link', { name: 'bring-list' })).toHaveAttribute(
      'href',
      '/event/event-one/addon/bring-list'
    );
    expect(
      screen.getByRole('link', { name: 'Picnic choices' })
    ).toHaveAttribute('href', '/event/event-one/addon/custom:saved');
    expect(
      screen.queryByRole('link', { name: 'reminders' })
    ).not.toBeInTheDocument();
  });
  it('preserves mixed custom tools as a whole in each relevant collection', () => {
    expect(featureInCollection('custom:saved', custom, 'polls')).toBe(true);
    expect(featureInCollection('custom:saved', custom, 'lists')).toBe(true);
    render(
      <EventFeatureCards
        eventId={eventId}
        configs={configs}
        placement='polls'
      />
    );
    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(
      screen.getByRole('link', { name: 'Picnic choices' })
    ).toHaveAttribute('href', '/event/event-one/addon/custom:saved');
  });
  it('retains visible unavailable states for unknown or malformed enabled configurations without exposing their data', () => {
    render(
      <EventFeatureCards
        eventId={eventId}
        placement='content'
        configs={[
          row('unknown-tool', { message: 'private-saved-value' }),
          row('custom:broken', {
            templateId: 'broken',
            template: {
              name: 'Bad',
              description: '',
              sections: [{ fields: null }],
            },
          } as unknown as Doc<'eventAddonConfigs'>['config']),
          row('bring-list', { items: [] }, false),
        ]}
      />
    );
    expect(screen.getAllByRole('status')).toHaveLength(2);
    expect(screen.getByRole('heading', { name: 'Bad' })).toBeInTheDocument();
    expect(screen.queryByText('private-saved-value')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
