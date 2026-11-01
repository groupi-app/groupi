import { expect, it } from 'vitest';
import {
  eventFeaturePresentation,
  participationResetWarnings,
} from './event-feature-placement';
it('maps built-ins and all named custom modes into participant features', () => {
  expect(
    eventFeaturePresentation('reminders', { reminderOffset: '1_DAY' })
  ).toMatchObject({ kind: 'reminders', title: 'Remind me' });
  expect(
    eventFeaturePresentation('questionnaire', {
      questions: [
        {
          id: 'name',
          label: 'Your name',
          type: 'SHORT_ANSWER',
          required: true,
        },
      ],
    })
  ).toMatchObject({ kind: 'questionnaire', title: 'Your details' });
  expect(
    eventFeaturePresentation('bring-list', {
      items: [{ id: 'ice', name: 'Ice', quantity: 2 }],
    })
  ).toMatchObject({ kind: 'bring-list', title: 'What to bring' });
  expect(
    eventFeaturePresentation('discord', { guildId: 'guild' })
  ).toMatchObject({ kind: 'discord' });
  for (const extra of [
    { cardOnly: true },
    { display: { type: 'text' } },
    { sections: [{ fields: [] }] },
  ])
    expect(
      eventFeaturePresentation('custom:saved', {
        template: {
          name: 'Travel details',
          description: 'For the journey',
          ...extra,
        },
      })
    ).toEqual({ kind: 'custom', title: 'Travel details' });
});
it('retains unknown and malformed saved configurations as useful unavailable features', () => {
  for (const [type, config] of [
    ['future-feature', { secret: 'private' }],
    ['questionnaire', { questions: [{ broken: true }] }],
    ['bring-list', { items: 'bad' }],
    ['reminders', { reminderOffset: 'future' }],
    ['custom:invalid', { template: { name: 42 } }],
  ] as const)
    expect(eventFeaturePresentation(type, config)).toEqual({
      kind: 'unavailable',
      title: 'Saved event feature',
    });
});
it('warns only for changed or disabled enabled features that clear participant data', () => {
  const items = { items: [{ id: 'ice', name: 'Ice', quantity: 1 }] },
    questions = {
      questions: [
        {
          id: 'name',
          label: 'Your name',
          type: 'SHORT_ANSWER',
          required: true,
        },
      ],
    };
  const existing = [
    { addonType: 'bring-list', enabled: true, config: items },
    { addonType: 'questionnaire', enabled: true, config: questions },
    {
      addonType: 'reminders',
      enabled: true,
      config: { reminderOffset: '1_DAY' },
    },
  ];
  expect(
    participationResetWarnings(existing, {
      'bring-list': items,
      questionnaire: questions,
      reminders: { reminderOffset: '1_WEEK' },
    })
  ).toEqual([]);
  expect(
    participationResetWarnings(existing, { 'bring-list': { items: [] } })
  ).toEqual(['all saved Bring List claims', 'saved questionnaire responses']);
  expect(
    participationResetWarnings(
      [{ addonType: 'bring-list', enabled: false, config: items }],
      {}
    )
  ).toEqual([]);
});
