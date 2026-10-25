import type { Meta, StoryObj } from '@storybook/react';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { getFunctionName, type FunctionReference } from 'convex/server';
import type { Doc, Id } from '@/convex/_generated/dataModel';
import { EventFeatureCards } from '@/features/addons/runtime';
import { ContentNavigation } from '@/features/content';

const eventId = 'fixture-event' as Id<'events'>;
function config(addonType: string, value: unknown): Doc<'eventAddonConfigs'> {
  return {
    _id: addonType as Id<'eventAddonConfigs'>,
    _creationTime: 1,
    eventId,
    addonType,
    enabled: true,
    config: value as Doc<'eventAddonConfigs'>['config'],
    createdAt: 1,
    updatedAt: 1,
  };
}
const configs = [
  config('reminders', { reminderOffset: '1_DAY' }),
  config('discord', {
    guildId: 'fixture-community',
    guildName: 'Neighborhood',
  }),
  config('questionnaire', {
    questions: [
      {
        id: 'diet',
        type: 'SHORT_ANSWER',
        label: 'Dietary needs',
        required: true,
      },
    ],
  }),
  config('bring-list', {
    items: [{ id: 'plates', name: 'Plates', quantity: 6 }],
  }),
  config('custom:picnic', {
    templateId: 'picnic',
    template: {
      name: 'Picnic choices',
      description: 'Make a plan together',
      iconName: 'info',
      settings: { cardLinkLabel: 'Choose together' },
      sections: [
        {
          id: 'vote',
          title: 'Meal',
          layout: 'interactive',
          fields: [
            {
              id: 'meal',
              type: 'vote',
              label: 'Choose a meal',
              required: false,
              options: ['Soup', 'Salad'],
            },
          ],
        },
      ],
    },
  }),
  config('unknown-saved-feature', {
    message: 'Never displayed by the fixture',
  }),
];
const client = new ConvexReactClient('https://fixture.convex.cloud', {
  unsavedChangesWarning: false,
});
// All subscriptions and mutations use this local fixture transport; no app backend is contacted.
Object.defineProperty(client, 'watchQuery', {
  value: (query: FunctionReference<'query'>, args: Record<string, unknown>) => {
    const name = getFunctionName(query);
    const value =
      name === 'events/queries:getEventHeader'
        ? {
            event: {
              _id: eventId,
              title: 'Community picnic',
              chosenDateTime: 1900000000000,
            },
            userMembership: { role: 'ATTENDEE' },
          }
        : name === 'addons/queries:isAddonOptedOut'
          ? { isOptedOut: false }
          : name === 'discord/queries:getDiscordEventInfo'
            ? {
                discordEventId: 'fixture-picnic',
                guildId: 'fixture-community',
                guildName: 'Neighborhood',
                error: null,
              }
            : name === 'addons/queries:getAddonData' &&
                args.addonType === 'bring-list'
              ? [{ key: 'claims:fixture-person', data: { plates: 2 } }]
              : [];
    return {
      onUpdate: () => () => {},
      localQueryResult: () => value,
      localQueryLogs: () => [],
      journal: () => undefined,
    };
  },
});
Object.defineProperty(client, 'mutation', {
  value: async (mutation: FunctionReference<'mutation'>) => {
    if (getFunctionName(mutation) === 'addons/mutations:toggleAddonOptOut')
      return { isOptedOut: true };
    throw new Error('This gallery does not save event data.');
  },
});

const meta: Meta = {
  title: 'Features/Event participation',
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj;
export const ParticipantFeatures: Story = {
  render: () => (
    <ConvexProvider client={client}>
      <main className='mx-auto flex max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6'>
        <header className='space-y-2'>
          <h1 className='font-heading text-3xl font-bold'>Community picnic</h1>
          <p className='text-muted-foreground'>Saturday · Riverside Park</p>
        </header>
        <EventFeatureCards
          eventId={eventId}
          chosenDateTime={1900000000000}
          configs={configs}
          placement='planning'
        />
        <ContentNavigation basePath={`/event/${eventId}`} context='event' />
        <EventFeatureCards
          eventId={eventId}
          configs={configs}
          placement='content'
        />
        <section className='space-y-2'>
          <h2 className='font-heading text-xl font-semibold'>Posts</h2>
          <p className='text-muted-foreground'>
            Share an update with everyone joining you.
          </p>
        </section>
      </main>
    </ConvexProvider>
  ),
};
