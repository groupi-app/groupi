import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { getFunctionName } from 'convex/server';
import { describe, expect, it, vi } from 'vitest';
import type { Id } from '@/convex/_generated/dataModel';
import { EventApplications } from './event-applications';
vi.unmock('convex/react');
vi.unmock('@/convex/_generated/api');
const eventId = 'event-one' as Id<'events'>;
const question = {
  id: 'why',
  type: 'SHORT_ANSWER',
  label: 'Why join?',
  required: true,
};
function fixture(form: unknown, records: unknown[] = [], review = false) {
  const client = new ConvexReactClient('https://fixture.convex.cloud', {
    unsavedChangesWarning: false,
  });
  vi.spyOn(client, 'watchQuery').mockImplementation((...args) => ({
    onUpdate: () => () => {},
    journal: () => undefined,
    localQueryResult: () =>
      getFunctionName(args[0]).endsWith(':getForm')
        ? form
        : { page: records, isDone: true, continueCursor: '' },
  }));
  const mutation = vi
    .spyOn(client, 'mutation')
    .mockResolvedValue({ status: 'PENDING' });
  const mounted = render(
    <ConvexProvider client={client}>
      <EventApplications eventId={eventId} review={review} />
    </ConvexProvider>
  );
  return { client, mutation, mounted };
}
describe('Event applications through the app Convex provider', () => {
  it('submits retained pending questions and offers withdrawal without accepting an invitation', async () => {
    const pending = {
      _id: 'application-one',
      status: 'PENDING',
      questions: [question],
      answers: { why: 'Meet neighbors' },
      decisions: [],
    };
    const { client, mutation, mounted } = fixture({
      settings: { questions: [], reviewerPolicy: 'ORGANIZER_ONLY' },
      pending,
      canApply: true,
      canReview: false,
    });
    const user = userEvent.setup();
    const input = screen.getByRole('textbox', { name: 'Why join?' });
    await user.clear(input);
    await user.type(input, 'Help organize');
    await user.click(screen.getByRole('button', { name: 'Save application' }));
    await waitFor(() => expect(mutation).toHaveBeenCalled());
    expect(getFunctionName(mutation.mock.calls[0][0])).toBe(
      'eventApplications/mutations:submit'
    );
    expect(mutation.mock.calls[0][1]).toEqual({
      eventId,
      answers: { why: 'Help organize' },
    });
    await user.click(
      screen.getByRole('button', { name: 'Withdraw application' })
    );
    await waitFor(() => expect(mutation).toHaveBeenCalledTimes(2));
    expect(mutation.mock.calls[1][1]).toEqual({
      applicationId: 'application-one',
    });
    mounted.unmount();
    await client.close();
  });
});

it('allows authorized review with a reason and reports Pending RSVP admission', async () => {
  const { client, mutation, mounted } = fixture(
    {
      settings: { questions: [], reviewerPolicy: 'ORGANIZERS_AND_MODERATORS' },
      pending: null,
      canApply: false,
      canReview: true,
    },
    [
      {
        _id: 'application-one',
        eventId,
        personId: 'person-one',
        applicant: {
          personId: 'person-one',
          name: 'Jordan',
          username: 'jordan',
          image: null,
        },
        status: 'PENDING',
        questions: [question],
        answers: { why: 'Meet neighbors' },
        decisions: [],
      },
    ],
    true
  );
  expect(screen.getByText('Applicant: Jordan')).toBeInTheDocument();
  const user = userEvent.setup();
  await user.type(
    screen.getByRole('textbox', { name: 'Decision reason (optional)' }),
    'Welcome'
  );
  await user.click(screen.getByRole('button', { name: 'Approve application' }));
  expect(await screen.findByRole('status')).toHaveTextContent(
    'Approved as Attendee with Pending RSVP.'
  );
  expect(getFunctionName(mutation.mock.calls[0][0])).toBe(
    'eventApplications/mutations:decide'
  );
  expect(mutation.mock.calls[0][1]).toEqual({
    applicationId: 'application-one',
    decision: 'APPROVED',
    reason: 'Welcome',
  });
  mounted.unmount();
  await client.close();
});

import { EventAdmissionSettings } from './event-admission-settings';
it('configures approval admission separately from retained questionnaire tools', async () => {
  const client = new ConvexReactClient('https://fixture.convex.cloud', {
    unsavedChangesWarning: false,
  });
  vi.spyOn(client, 'watchQuery').mockImplementation((...args) => ({
    onUpdate: () => () => {},
    journal: () => undefined,
    localQueryResult: () =>
      getFunctionName(args[0]).endsWith(':getForm')
        ? {
            settings: {
              questions: [],
              reviewerPolicy: 'ORGANIZERS_AND_MODERATORS',
            },
            pending: null,
            canReview: true,
            canApply: false,
          }
        : { event: { admissionPolicy: 'DIRECT' } },
  }));
  const mutation = vi
    .spyOn(client, 'mutation')
    .mockResolvedValue({ success: true });
  const mounted = render(
    <ConvexProvider client={client}>
      <EventAdmissionSettings eventId={eventId} role='ORGANIZER' />
    </ConvexProvider>
  );
  const user = userEvent.setup();
  await user.selectOptions(
    screen.getByRole('combobox', { name: 'Admission policy' }),
    'APPLY'
  );
  await user.click(
    screen.getByRole('button', { name: 'Save admission policy' })
  );
  await user.selectOptions(
    screen.getByRole('combobox', { name: 'Application reviewers' }),
    'ORGANIZER_ONLY'
  );
  await user.click(screen.getByRole('button', { name: 'Add question' }));
  await user.type(
    screen.getByRole('textbox', { name: 'Question text' }),
    'Why join?'
  );
  await user.click(
    screen.getByRole('button', { name: 'Save application form' })
  );
  await waitFor(() => expect(mutation).toHaveBeenCalledTimes(2));
  expect(mutation.mock.calls[0][1]).toEqual({
    eventId,
    admissionPolicy: 'APPLY',
  });
  expect(mutation.mock.calls[1][1]).toMatchObject({
    eventId,
    reviewerPolicy: 'ORGANIZER_ONLY',
    questions: [{ label: 'Why join?', type: 'SHORT_ANSWER', required: false }],
  });
  mounted.unmount();
  await client.close();
});

it('withholds reviewer records and controls when review is not authorized', async () => {
  const { client, mutation, mounted } = fixture(
    {
      settings: { questions: [], reviewerPolicy: 'ORGANIZER_ONLY' },
      pending: null,
      canApply: false,
      canReview: false,
    },
    [],
    true
  );
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Only authorized Event reviewers'
  );
  expect(
    vi
      .mocked(client.watchQuery)
      .mock.calls.every(
        ([query]) =>
          getFunctionName(query) === 'eventApplications/queries:getForm'
      )
  ).toBe(true);
  expect(mutation).not.toHaveBeenCalled();
  mounted.unmount();
  await client.close();
});

it('shows private immutable decisions and loads another page through the history query', async () => {
  const client = new ConvexReactClient('https://fixture.convex.cloud', {
    unsavedChangesWarning: false,
  });
  vi.spyOn(client, 'watchQuery').mockImplementation((...args) => ({
    onUpdate: () => () => {},
    journal: () => undefined,
    localQueryResult: () => {
      if (getFunctionName(args[0]).endsWith(':getForm'))
        return {
          settings: { questions: [question], reviewerPolicy: 'ORGANIZER_ONLY' },
          pending: null,
          canApply: false,
          canReview: false,
        };
      const next = args[1]?.paginationOpts.cursor === 'next-page';
      return {
        page: [
          {
            _id: next ? 'application-two' : 'application-one',
            eventId,
            personId: 'person-one',
            applicant: {
              personId: 'person-one',
              name: 'Jordan',
              username: 'jordan',
              image: null,
            },
            status: next ? 'WITHDRAWN' : 'DECLINED',
            questions: [question],
            answers: { why: next ? 'A newer answer' : 'Original answer' },
            decisions: next
              ? []
              : [
                  {
                    status: 'DECLINED',
                    actorId: 'reviewer',
                    at: 1,
                    reason: 'Capacity reached',
                  },
                ],
          },
        ],
        isDone: next,
        continueCursor: 'next-page',
      };
    },
  }));
  const mounted = render(
    <ConvexProvider client={client}>
      <EventApplications eventId={eventId} />
    </ConvexProvider>
  );
  expect(screen.getByText('Original answer')).toBeInTheDocument();
  expect(screen.getByText('DECLINED: Capacity reached')).toBeInTheDocument();
  expect(
    screen.queryByRole('textbox', { name: 'Why join?' })
  ).not.toBeInTheDocument();
  await userEvent
    .setup()
    .click(screen.getByRole('button', { name: 'Next page' }));
  expect(await screen.findByText('A newer answer')).toBeInTheDocument();
  expect(
    vi
      .mocked(client.watchQuery)
      .mock.calls.some(
        ([query, args]) =>
          getFunctionName(query) === 'eventApplications/queries:history' &&
          args?.paginationOpts.cursor === 'next-page'
      )
  ).toBe(true);
  mounted.unmount();
  await client.close();
});

it('keeps the application editable and reports a submission rejected by current eligibility', async () => {
  const { client, mutation, mounted } = fixture({
    settings: { questions: [question], reviewerPolicy: 'ORGANIZER_ONLY' },
    pending: null,
    canApply: true,
    canReview: false,
  });
  mutation.mockRejectedValueOnce(
    new Error('You are no longer eligible for this Event')
  );
  const user = userEvent.setup();
  await user.type(
    screen.getByRole('textbox', { name: 'Why join?' }),
    'Meet neighbors'
  );
  await user.click(screen.getByRole('button', { name: 'Submit application' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'You are no longer eligible'
  );
  expect(screen.getByRole('textbox', { name: 'Why join?' })).toHaveValue(
    'Meet neighbors'
  );
  expect(
    screen.getByRole('button', { name: 'Submit application' })
  ).toBeEnabled();
  mounted.unmount();
  await client.close();
});

import EventPreviewPage from '@/app/(eventPreview)/event/[eventId]/preview/page';
import EventApplicationPage from '@/app/(eventPreview)/event/[eventId]/apply/page';
import { useState } from 'react';
vi.mock('next/navigation', () => ({
  useParams: () => ({ eventId: 'event-one' }),
  useRouter: () => ({ push: vi.fn() }),
}));
it('opens Group-only Apply from readable logistics before membership and submits from the viewer route', async () => {
  const client = new ConvexReactClient('https://fixture.convex.cloud', {
    unsavedChangesWarning: false,
  });
  vi.spyOn(client, 'watchQuery').mockImplementation((...args) => ({
    onUpdate: () => () => {},
    journal: () => undefined,
    localQueryResult: () => {
      const name = getFunctionName(args[0]);
      if (name === 'events/queries:getEventLogistics')
        return {
          event: {
            _id: eventId,
            title: 'Community picnic',
            description: 'Bring lunch',
            timezone: 'UTC',
            imageUrl: null,
            chosenDateTime: null,
            potentialDateTimeOptions: [],
            visibility: 'PRIVATE',
            admissionPolicy: 'APPLY',
          },
          organizer: null,
          entryAction: 'APPLY',
        };
      if (name === 'eventApplications/queries:getForm')
        return {
          settings: {
            questions: [question],
            reviewerPolicy: 'ORGANIZERS_AND_MODERATORS',
          },
          pending: null,
          canApply: true,
          canReview: false,
        };
      if (name === 'eventApplications/queries:history')
        return { page: [], isDone: true, continueCursor: '' };
      throw new Error(`Unexpected member query: ${name}`);
    },
  }));
  const mutation = vi
    .spyOn(client, 'mutation')
    .mockResolvedValue({ status: 'PENDING' });
  function Routes() {
    const [path, setPath] = useState('preview');
    return (
      <div
        onClickCapture={event => {
          const anchor = (event.target as HTMLElement).closest('a');
          if (anchor) {
            event.preventDefault();
            if (anchor.getAttribute('href') === '/event/event-one/apply')
              setPath('apply');
          }
        }}
      >
        {path === 'preview' ? <EventPreviewPage /> : <EventApplicationPage />}
      </div>
    );
  }
  const mounted = render(
    <ConvexProvider client={client}>
      <Routes />
    </ConvexProvider>
  );
  const user = userEvent.setup();
  expect(mutation).not.toHaveBeenCalled();
  await user.click(screen.getByRole('link', { name: 'Apply for approval' }));
  await user.type(
    screen.getByRole('textbox', { name: 'Why join?' }),
    'Meet neighbors'
  );
  await user.click(screen.getByRole('button', { name: 'Submit application' }));
  expect(
    await screen.findByText('Application submitted for review.')
  ).toBeInTheDocument();
  expect(getFunctionName(mutation.mock.calls[0][0])).toBe(
    'eventApplications/mutations:submit'
  );
  expect(mutation.mock.calls[0][1]).toEqual({
    eventId,
    answers: { why: 'Meet neighbors' },
  });
  expect(mutation).toHaveBeenCalledTimes(1);
  mounted.unmount();
  await client.close();
});

import { EventApplicationSettings } from './event-application-settings';
it('withholds current admission definitions when Event settings become unavailable', async () => {
  const client = new ConvexReactClient('https://fixture.convex.cloud', {
    unsavedChangesWarning: false,
  });
  vi.spyOn(client, 'watchQuery').mockImplementation(() => ({
    onUpdate: () => () => {},
    journal: () => undefined,
    localQueryResult: () => ({
      settings: null,
      pending: null,
      canApply: false,
      canReview: false,
    }),
  }));
  const mounted = render(
    <ConvexProvider client={client}>
      <EventApplicationSettings eventId={eventId} />
    </ConvexProvider>
  );
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Application settings are unavailable'
  );
  expect(
    screen.queryByRole('combobox', { name: 'Application reviewers' })
  ).not.toBeInTheDocument();
  mounted.unmount();
  await client.close();
});

it('preserves private pending history after Group grant loss and re-enables edits on restored eligibility', async () => {
  const client = new ConvexReactClient('https://fixture.convex.cloud', {
    unsavedChangesWarning: false,
  });
  const listeners = new Set<() => void>();
  let eligible = false;
  const pending = {
    _id: 'application-one',
    eventId,
    personId: 'person-one',
    status: 'PENDING',
    questions: [question],
    answers: { why: 'Retained answer' },
    decisions: [],
  };
  vi.spyOn(client, 'watchQuery').mockImplementation((...args) => ({
    onUpdate: listener => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    journal: () => undefined,
    localQueryResult: () =>
      getFunctionName(args[0]).endsWith(':getForm')
        ? {
            settings: eligible
              ? { questions: [], reviewerPolicy: 'ORGANIZER_ONLY' }
              : null,
            pending,
            canApply: eligible,
            canReview: false,
          }
        : { page: [pending], isDone: true, continueCursor: '' },
  }));
  const mutation = vi
    .spyOn(client, 'mutation')
    .mockResolvedValue({ status: 'PENDING' });
  const mounted = render(
    <ConvexProvider client={client}>
      <EventApplications eventId={eventId} />
    </ConvexProvider>
  );
  expect(screen.getByRole('textbox', { name: 'Why join?' })).toHaveValue(
    'Retained answer'
  );
  expect(screen.getByRole('textbox', { name: 'Why join?' })).toBeDisabled();
  expect(
    screen.getByRole('button', { name: 'Save application' })
  ).toBeDisabled();
  expect(
    screen.getByRole('button', { name: 'Withdraw application' })
  ).toBeEnabled();
  expect(screen.getByText('Retained answer')).toBeInTheDocument();
  const { act } = await import('@testing-library/react');
  await act(async () => {
    eligible = true;
    listeners.forEach(listener => listener());
  });
  expect(screen.getByRole('textbox', { name: 'Why join?' })).toBeEnabled();
  await userEvent
    .setup()
    .click(screen.getByRole('button', { name: 'Save application' }));
  await waitFor(() => expect(mutation).toHaveBeenCalled());
  expect(mutation.mock.calls[0][1]).toEqual({
    eventId,
    answers: { why: 'Retained answer' },
  });
  expect(
    vi
      .mocked(client.watchQuery)
      .mock.calls.every(([ref]) =>
        [
          'eventApplications/queries:getForm',
          'eventApplications/queries:history',
        ].includes(getFunctionName(ref))
      )
  ).toBe(true);
  mounted.unmount();
  await client.close();
});
it('retains reviewed own records and admitted Event navigation after Group eligibility loss', async () => {
  const { client, mutation, mounted } = fixture(
    { settings: null, pending: null, canApply: false, canReview: false },
    [
      {
        _id: 'approved-one',
        eventId,
        personId: 'person-one',
        status: 'APPROVED',
        questions: [question],
        answers: { why: 'Retained answer' },
        decisions: [{ status: 'APPROVED', actorId: 'organizer', at: 1 }],
      },
    ]
  );
  expect(screen.getByRole('link', { name: 'Open Event' })).toHaveAttribute(
    'href',
    '/event/event-one'
  );
  expect(screen.getByText('Retained answer')).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Submit application' })
  ).not.toBeInTheDocument();
  expect(mutation).not.toHaveBeenCalled();
  mounted.unmount();
  await client.close();
});
it('recovers stale approval through current Event reviewer authority and eligibility', async () => {
  const pending = {
    _id: 'application-one',
    eventId,
    personId: 'person-one',
    status: 'PENDING',
    questions: [question],
    answers: { why: 'Retained answer' },
    decisions: [],
  };
  const { client, mutation, mounted } = fixture(
    {
      settings: { questions: [], reviewerPolicy: 'ORGANIZER_ONLY' },
      pending: null,
      canApply: false,
      canReview: true,
    },
    [pending],
    true
  );
  mutation.mockRejectedValueOnce(
    new Error('Applicant no longer has a qualifying audience')
  );
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Approve application' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'no longer has a qualifying audience'
  );
  expect(
    screen.getByRole('button', { name: 'Approve application' })
  ).toBeEnabled();
  await user.click(screen.getByRole('button', { name: 'Approve application' }));
  expect(await screen.findByRole('status')).toHaveTextContent(
    'Approved as Attendee with Pending RSVP.'
  );
  expect(
    mutation.mock.calls.every(
      ([ref]) => getFunctionName(ref) === 'eventApplications/mutations:decide'
    )
  ).toBe(true);
  mounted.unmount();
  await client.close();
});
it('retries a revoked review query without retaining private queue access', async () => {
  const client = new ConvexReactClient('https://fixture.convex.cloud', {
    unsavedChangesWarning: false,
  });
  let revoked = true;
  vi.spyOn(client, 'watchQuery').mockImplementation(() => ({
    onUpdate: () => () => {},
    journal: () => undefined,
    localQueryResult: () => {
      if (revoked) throw new Error('Current Event authority required');
      return {
        settings: null,
        pending: null,
        canApply: false,
        canReview: false,
      };
    },
  }));
  const report = vi.spyOn(console, 'error').mockImplementation(() => {});
  const mounted = render(
    <ConvexProvider client={client}>
      <EventApplications eventId={eventId} review />
    </ConvexProvider>
  );
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Applications are unavailable'
  );
  revoked = false;
  await userEvent
    .setup()
    .click(screen.getByRole('button', { name: 'Retry applications' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Only authorized Event reviewers'
  );
  expect(
    vi
      .mocked(client.watchQuery)
      .mock.calls.every(
        ([ref]) => getFunctionName(ref) === 'eventApplications/queries:getForm'
      )
  ).toBe(true);
  mounted.unmount();
  await client.close();
  report.mockRestore();
});

it('removes reviewer answers and decisions when live Event policy excludes the moderator', async () => {
  const client = new ConvexReactClient('https://fixture.convex.cloud', {
    unsavedChangesWarning: false,
  });
  let canReview = true;
  const listeners = new Set<() => void>();
  vi.spyOn(client, 'watchQuery').mockImplementation((...args) => ({
    onUpdate: listener => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    journal: () => undefined,
    localQueryResult: () =>
      getFunctionName(args[0]).endsWith(':getForm')
        ? {
            settings: {
              questions: [],
              reviewerPolicy: canReview
                ? 'ORGANIZERS_AND_MODERATORS'
                : 'ORGANIZER_ONLY',
            },
            pending: null,
            canApply: false,
            canReview,
          }
        : {
            page: [
              {
                _id: 'application-one',
                status: 'PENDING',
                questions: [question],
                answers: { why: 'Private answer' },
                decisions: [],
              },
            ],
            isDone: true,
            continueCursor: '',
          },
  }));
  const mounted = render(
    <ConvexProvider client={client}>
      <EventApplications eventId={eventId} review />
    </ConvexProvider>
  );
  expect(screen.getByText('Private answer')).toBeInTheDocument();
  const { act } = await import('@testing-library/react');
  await act(async () => {
    canReview = false;
    listeners.forEach(listener => listener());
  });
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Only authorized Event reviewers'
  );
  expect(screen.queryByText('Private answer')).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Approve application' })
  ).not.toBeInTheDocument();
  mounted.unmount();
  await client.close();
});
