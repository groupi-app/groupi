import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { getFunctionName } from 'convex/server';
import { describe, expect, it, vi } from 'vitest';
import type { Id } from '@/convex/_generated/dataModel';
import { GroupApplications } from './group-applications';
vi.unmock('convex/react');
vi.unmock('@/convex/_generated/api');
const groupId = 'group-one' as Id<'groups'>;
const question = {
  id: 'why',
  label: 'Why join?',
  type: 'SHORT_ANSWER',
  required: true,
};
const pending = {
  _id: 'application-one',
  _creationTime: 1,
  groupId,
  personId: 'person-one',
  status: 'PENDING',
  questions: [question],
  answers: { why: 'Meet neighbors' },
  submittedAt: 1,
  updatedAt: 1,
  decisions: [],
};
function clientFor(form: unknown, records: unknown[] = []) {
  const client = new ConvexReactClient('https://fixture.convex.cloud', {
    unsavedChangesWarning: false,
  });
  vi.spyOn(client, 'watchQuery').mockImplementation((...args) => ({
    onUpdate: () => () => {},
    journal: () => undefined,
    localQueryResult: () =>
      getFunctionName(args[0]).endsWith(':getGroupApplicationForm')
        ? form
        : { page: records, isDone: true, continueCursor: '' },
  }));
  const mutation = vi
    .spyOn(client, 'mutation')
    .mockResolvedValue({ applicationId: pending._id, status: 'PENDING' });
  return { client, mutation };
}
describe('Group applications through the actual web Convex provider', () => {
  it('edits a retained pending definition and withdraws privately', async () => {
    const { client, mutation } = clientFor({
      applicationsEnabled: true,
      questions: [],
      pending,
      canApply: true,
      canReview: false,
    });
    const mounted = render(
      <ConvexProvider client={client}>
        <GroupApplications groupId={groupId} />
      </ConvexProvider>
    );
    const user = userEvent.setup();
    const answer = screen.getByRole('textbox', { name: 'Why join?' });
    await user.clear(answer);
    await user.type(answer, 'Help organize');
    await user.click(screen.getByRole('button', { name: 'Save application' }));
    await waitFor(() => expect(mutation).toHaveBeenCalled());
    expect(getFunctionName(mutation.mock.calls[0][0])).toBe(
      'groupApplications/mutations:editGroupApplication'
    );
    expect(mutation.mock.calls[0][1]).toEqual({
      applicationId: pending._id,
      answers: { why: 'Help organize' },
    });
    await user.click(
      screen.getByRole('button', { name: 'Withdraw application' })
    );
    await waitFor(() => expect(mutation).toHaveBeenCalledTimes(2));
    expect(getFunctionName(mutation.mock.calls[1][0])).toBe(
      'groupApplications/mutations:withdrawGroupApplication'
    );
    expect(mutation.mock.calls[1][1]).toEqual({ applicationId: pending._id });
    mounted.unmount();
    await client.close();
  });
});

import { GroupApplicationSettings } from './group-application-settings';
it('lets the owner enable voluntary applications and configure a question without invitation preferences', async () => {
  const { client, mutation } = clientFor({
    applicationsEnabled: false,
    questions: [],
    pending: null,
    canApply: false,
    canReview: true,
  });
  const mounted = render(
    <ConvexProvider client={client}>
      <GroupApplicationSettings
        groupId={groupId}
        applicationsEnabled={false}
        questions={[]}
      />
    </ConvexProvider>
  );
  const user = userEvent.setup();
  await user.click(
    screen.getByRole('checkbox', { name: 'Accept Group applications' })
  );
  await user.click(screen.getByRole('button', { name: 'Add question' }));
  await user.type(
    screen.getByRole('textbox', { name: 'Question text' }),
    'Why join?'
  );
  await user.click(
    screen.getByRole('button', { name: 'Save Group application settings' })
  );
  await waitFor(() => expect(mutation).toHaveBeenCalled());
  expect(getFunctionName(mutation.mock.calls[0][0])).toBe(
    'groupApplications/mutations:configureGroupApplications'
  );
  expect(mutation.mock.calls[0][1]).toMatchObject({
    groupId,
    applicationsEnabled: true,
    questions: [{ label: 'Why join?', type: 'SHORT_ANSWER', required: false }],
  });
  expect(mutation).toHaveBeenCalledTimes(1);
  mounted.unmount();
  await client.close();
});

it('allows current managers to review immediately, with no invite or Event admission mutation', async () => {
  const { client, mutation } = clientFor(
    {
      applicationsEnabled: true,
      questions: [],
      pending: null,
      canApply: false,
      canReview: true,
    },
    [
      {
        ...pending,
        applicant: {
          personId: 'person-one',
          name: 'Alex',
          username: 'alex',
          image: null,
        },
      },
    ]
  );
  const mounted = render(
    <ConvexProvider client={client}>
      <GroupApplications groupId={groupId} review />
    </ConvexProvider>
  );
  const user = userEvent.setup();
  expect(screen.getByText('Applicant: Alex')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Approve application' }));
  expect(await screen.findByRole('status')).toHaveTextContent(
    'The applicant is now a Group member.'
  );
  expect(mutation).toHaveBeenCalledTimes(1);
  expect(getFunctionName(mutation.mock.calls[0][0])).toBe(
    'groupApplications/mutations:reviewGroupApplication'
  );
  expect(mutation.mock.calls[0][1]).toEqual({
    applicationId: pending._id,
    decision: 'APPROVED',
  });
  expect(
    screen.getByRole('button', { name: 'Approve application' })
  ).toBeDisabled();
  mounted.unmount();
  await client.close();
});

it('withholds the review query from former or ordinary members', async () => {
  const { client, mutation } = clientFor({
    applicationsEnabled: true,
    questions: [],
    pending: null,
    canApply: false,
    canReview: false,
  });
  const mounted = render(
    <ConvexProvider client={client}>
      <GroupApplications groupId={groupId} review />
    </ConvexProvider>
  );
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Only the current Group owner and moderators'
  );
  expect(
    vi
      .mocked(client.watchQuery)
      .mock.calls.every(
        ([ref]) =>
          getFunctionName(ref) ===
          'groupApplications/queries:getGroupApplicationForm'
      )
  ).toBe(true);
  expect(mutation).not.toHaveBeenCalled();
  mounted.unmount();
  await client.close();
});

it('keeps saved definitions and withdrawal when the Group stops accepting applications', async () => {
  const { client, mutation } = clientFor({
    applicationsEnabled: false,
    questions: [],
    pending,
    canApply: false,
    canReview: false,
  });
  const mounted = render(
    <ConvexProvider client={client}>
      <GroupApplications groupId={groupId} />
    </ConvexProvider>
  );
  expect(screen.getByRole('textbox', { name: 'Why join?' })).toHaveValue(
    'Meet neighbors'
  );
  expect(screen.getByRole('textbox', { name: 'Why join?' })).toBeDisabled();
  expect(
    screen.getByRole('button', { name: 'Save application' })
  ).toBeDisabled();
  await userEvent
    .setup()
    .click(screen.getByRole('button', { name: 'Withdraw application' }));
  await waitFor(() => expect(mutation).toHaveBeenCalled());
  expect(getFunctionName(mutation.mock.calls[0][0])).toBe(
    'groupApplications/mutations:withdrawGroupApplication'
  );
  mounted.unmount();
  await client.close();
});

it('shows retained immutable private history and pages without loading manager records', async () => {
  const client = new ConvexReactClient('https://fixture.convex.cloud', {
    unsavedChangesWarning: false,
  });
  vi.spyOn(client, 'watchQuery').mockImplementation((...args) => ({
    onUpdate: () => () => {},
    journal: () => undefined,
    localQueryResult: () => {
      const name = getFunctionName(args[0]);
      if (name.endsWith(':getGroupApplicationForm'))
        return {
          applicationsEnabled: false,
          questions: [],
          pending: null,
          canApply: false,
          canReview: false,
        };
      if (!name.endsWith(':listMyGroupApplications'))
        throw new Error(`Unexpected manager query ${name}`);
      const next = args[1]?.paginationOpts.cursor === 'next-page';
      return {
        page: [
          {
            ...pending,
            _id: next ? 'application-two' : pending._id,
            status: next ? 'WITHDRAWN' : 'DECLINED',
            answers: { why: next ? 'Later answer' : 'Retained answer' },
            decisions: next
              ? []
              : [{ status: 'DECLINED', actorId: undefined, at: 1 }],
          },
        ],
        isDone: next,
        continueCursor: 'next-page',
      };
    },
  }));
  const mounted = render(
    <ConvexProvider client={client}>
      <GroupApplications groupId={groupId} />
    </ConvexProvider>
  );
  expect(screen.getByText('Retained answer')).toBeInTheDocument();
  expect(screen.getByText(/DECLINED by Deleted account/)).toBeInTheDocument();
  expect(
    screen.queryByRole('textbox', { name: 'Why join?' })
  ).not.toBeInTheDocument();
  await userEvent
    .setup()
    .click(screen.getByRole('button', { name: 'Next applications' }));
  expect(await screen.findByText('Later answer')).toBeInTheDocument();
  expect(
    vi
      .mocked(client.watchQuery)
      .mock.calls.some(
        ([ref, args]) =>
          getFunctionName(ref).endsWith(':listMyGroupApplications') &&
          args?.paginationOpts.cursor === 'next-page'
      )
  ).toBe(true);
  mounted.unmount();
  await client.close();
});

it('reacts to pending and approved status without a second acceptance or Event write', async () => {
  const client = new ConvexReactClient('https://fixture.convex.cloud', {
    unsavedChangesWarning: false,
  });
  const listeners = new Set<() => void>();
  let status: 'NEW' | 'PENDING' | 'APPROVED' = 'NEW';
  vi.spyOn(client, 'watchQuery').mockImplementation((...args) => ({
    onUpdate: listener => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    journal: () => undefined,
    localQueryResult: () =>
      getFunctionName(args[0]).endsWith(':getGroupApplicationForm')
        ? {
            applicationsEnabled: true,
            questions: [question],
            pending: status === 'PENDING' ? pending : null,
            canApply: status !== 'APPROVED',
            canReview: false,
          }
        : {
            page:
              status === 'NEW'
                ? []
                : [
                    {
                      ...pending,
                      status,
                      decisions:
                        status === 'APPROVED'
                          ? [
                              {
                                status: 'APPROVED',
                                actorId: 'owner-one',
                                at: 2,
                              },
                            ]
                          : [],
                    },
                  ],
            isDone: true,
            continueCursor: '',
          },
  }));
  const mutation = vi.spyOn(client, 'mutation').mockImplementation(async () => {
    status = 'PENDING';
    listeners.forEach(listener => listener());
    return { applicationId: pending._id, status };
  });
  const mounted = render(
    <ConvexProvider client={client}>
      <GroupApplications groupId={groupId} />
    </ConvexProvider>
  );
  const user = userEvent.setup();
  await user.type(
    screen.getByRole('textbox', { name: 'Why join?' }),
    'Meet neighbors'
  );
  await user.click(screen.getByRole('button', { name: 'Submit application' }));
  expect(
    await screen.findByRole('button', { name: 'Save application' })
  ).toBeInTheDocument();
  const { act } = await import('@testing-library/react');
  await act(async () => {
    status = 'APPROVED';
    listeners.forEach(listener => listener());
  });
  expect(
    await screen.findByRole('link', { name: 'Open Group' })
  ).toHaveAttribute('href', '/groups/group-one');
  expect(
    screen.getByText(
      'You were admitted as a Group member. No second acceptance is needed.'
    )
  ).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Submit application' })
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Save application' })
  ).not.toBeInTheDocument();
  expect(mutation).toHaveBeenCalledTimes(1);
  expect(getFunctionName(mutation.mock.calls[0][0])).toBe(
    'groupApplications/mutations:submitGroupApplication'
  );
  mounted.unmount();
  await client.close();
});

it('retains applicant answers after an action-time ban rejects submission', async () => {
  const { client, mutation } = clientFor({
    applicationsEnabled: true,
    questions: [question],
    pending: null,
    canApply: true,
    canReview: false,
  });
  mutation.mockRejectedValueOnce(new Error('Application unavailable'));
  const mounted = render(
    <ConvexProvider client={client}>
      <GroupApplications groupId={groupId} />
    </ConvexProvider>
  );
  const user = userEvent.setup();
  await user.type(
    screen.getByRole('textbox', { name: 'Why join?' }),
    'Meet neighbors'
  );
  await user.click(screen.getByRole('button', { name: 'Submit application' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Application unavailable'
  );
  expect(screen.getByRole('textbox', { name: 'Why join?' })).toHaveValue(
    'Meet neighbors'
  );
  expect(
    screen.queryByRole('link', { name: 'Open Group' })
  ).not.toBeInTheDocument();
  mounted.unmount();
  await client.close();
});

it('submits all seven admission field types with typed numeric, boolean and list answers', async () => {
  const questions = [
    { id: 'short', label: 'Name', type: 'SHORT_ANSWER', required: true },
    { id: 'long', label: 'Background', type: 'LONG_ANSWER', required: true },
    {
      id: 'multiple',
      label: 'Meeting time',
      type: 'MULTIPLE_CHOICE',
      required: true,
      options: ['Morning', 'Evening'],
    },
    {
      id: 'checks',
      label: 'Interests',
      type: 'CHECKBOXES',
      required: true,
      options: ['Gardening', 'Cycling'],
    },
    { id: 'number', label: 'Available hours', type: 'NUMBER', required: true },
    {
      id: 'dropdown',
      label: 'Neighborhood',
      type: 'DROPDOWN',
      required: true,
      options: ['North', 'South'],
    },
    { id: 'yes', label: 'Have equipment?', type: 'YES_NO', required: true },
  ];
  const { client, mutation } = clientFor({
    applicationsEnabled: true,
    questions,
    pending: null,
    canApply: true,
    canReview: false,
  });
  const mounted = render(
    <ConvexProvider client={client}>
      <GroupApplications groupId={groupId} />
    </ConvexProvider>
  );
  const user = userEvent.setup();
  await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Alex');
  await user.type(
    screen.getByRole('textbox', { name: 'Background' }),
    'New neighbor'
  );
  await user.selectOptions(
    screen.getByRole('combobox', { name: 'Meeting time' }),
    'Evening'
  );
  await user.click(screen.getByRole('checkbox', { name: 'Gardening' }));
  await user.type(
    screen.getByRole('spinbutton', { name: 'Available hours' }),
    '2.5'
  );
  await user.selectOptions(
    screen.getByRole('combobox', { name: 'Neighborhood' }),
    'North'
  );
  await user.selectOptions(
    screen.getByRole('combobox', { name: 'Have equipment?' }),
    'false'
  );
  await user.click(screen.getByRole('button', { name: 'Submit application' }));
  await waitFor(() => expect(mutation).toHaveBeenCalled());
  expect(mutation.mock.calls[0][1]).toEqual({
    groupId,
    answers: {
      short: 'Alex',
      long: 'New neighbor',
      multiple: 'Evening',
      checks: ['Gardening'],
      number: 2.5,
      dropdown: 'North',
      yes: false,
    },
  });
  mounted.unmount();
  await client.close();
});
