/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useSyncExternalStore } from 'react';
const params = new URLSearchParams(location.search);
const owner = params.get('owner') === 'event' ? 'event-one' : 'group-one';
const kind = params.get('kind') || 'poll';
const short = params.get('scenario') === 'short';
const empty = params.has('empty');
const key = `content-fixture:${owner}:${kind}`;
const longTitle =
  'A thoughtful plan for our next gathering with everyone in the community';
const questions = [
  {
    id: 'name',
    label: 'What would make this gathering welcoming and memorable for you?',
    type: 'LONG_ANSWER',
    required: true,
  },
  {
    id: 'choice',
    label: 'Which activities would you enjoy doing together?',
    type: 'CHECKBOXES',
    required: false,
    options: [
      'A relaxed afternoon picnic with shared food and conversation',
      'An accessible guided walk through the community gardens',
    ],
  },
];
const options = short
  ? [
      { id: 'yes', label: 'Pepperoni' },
      { id: 'no', label: 'Cheese' },
      { id: 'veggie', label: 'Veggie' },
      { id: 'other', label: 'Other' },
    ]
  : [
      {
        id: 'yes',
        label: 'A relaxed afternoon picnic with shared food and conversation',
      },
      {
        id: 'no',
        label: 'An accessible guided walk through the community gardens',
      },
    ];
const initial = {
  _id: 'tool-one',
  [owner.startsWith('event') ? 'eventId' : 'groupId']: owner,
  title: short ? 'What kind of pizza do you want?' : longTitle,
  description: short
    ? ''
    : 'Help shape a gathering that feels right for everyone. Share a few ideas and choose what works for you.',
  version: 1,
  canManage: !params.has('private'),
  canReview: !params.has('private'),
  resultsVisibility: params.has('private') ? 'MANAGERS' : 'MEMBERS',
  questions,
  options,
  mode: 'SINGLE',
  answers: empty
    ? {}
    : {
        name: 'A quiet space to catch up and meet new people.',
        choice: [questions[1].options[0]],
      },
  selections: empty ? [] : ['yes'],
  responseRevision: 0,
  voteRevision: 0,
  savedVersion: empty ? null : 1,
  savedQuestions: questions,
  savedOptions: options,
};
const state = JSON.parse(localStorage.getItem(key) || 'null') || {
  tool: initial,
  entries: empty
    ? []
    : [
        {
          _id: 'entry-one',
          text: 'Bring a large picnic blanket and reusable cups for everyone joining us',
          completed: false,
          revision: 1,
          version: 1,
          canEdit: true,
          canRemove: true,
          personId: 'member-one',
          listTitle: longTitle,
        },
      ],
  calls: [],
  tools: params.has('two')
    ? { 'tool-one': initial, 'tool-two': { ...initial, _id: 'tool-two' } }
    : {},
};
const subscribers = new Set<() => void>();
function useFixtureState() {
  useSyncExternalStore(
    cb => {
      subscribers.add(cb);
      return () => subscribers.delete(cb);
    },
    () => JSON.stringify(state)
  );
  return state;
}
function write() {
  localStorage.setItem(key, JSON.stringify(state));
  subscribers.forEach(cb => cb());
}
function mutation(name: string) {
  return async (input: any) => {
    state.calls.push({ name, input });
    if (params.has('error'))
      throw Error('Synthetic save failure. Your draft is still available.');
    if (name.startsWith('create') || name.startsWith('configure'))
      state.tool = { ...state.tool, ...input };
    if (name === 'submitForm')
      state.tool = {
        ...state.tool,
        answers: input.answers,
        responseRevision: state.tool.responseRevision + 1,
        savedVersion: 1,
      };
    if (name === 'submitPoll') {
      const previous = state.tools[input.toolId] || {
        ...state.tool,
        _id: input.toolId,
      };
      if (params.has('delay'))
        await new Promise(resolve => setTimeout(resolve, 400));
      state.tools[input.toolId] = {
        ...previous,
        selections: input.selections,
        voteRevision: previous.voteRevision + 1,
        savedVersion: 1,
      };
      if (input.toolId === 'tool-one') state.tool = state.tools[input.toolId];
    }
    if (name === 'addList') {
      state.entries.push({
        _id: `entry-${state.entries.length + 1}`,
        text: input.text,
        completed: false,
        revision: 1,
        version: 1,
        canEdit: true,
        canRemove: true,
      });
      write();
      return { state: 'PRESENT' };
    }
    if (name === 'editList') {
      state.entries = state.entries.map((entry: any) =>
        entry._id === input.entryId
          ? { ...entry, ...input, revision: entry.revision + 1 }
          : entry
      );
      write();
      return {
        revision: state.entries.find(
          (entry: any) => entry._id === input.entryId
        ).revision,
      };
    }
    write();
    return 'tool-one';
  };
}
const page = (rows: any[]) => ({
  page: rows,
  isDone: true,
  continueCursor: '',
});
export const useToolOwner = () => ({
  viewerRole: 'OWNER',
  joiningQuestionnaire: { canAccessMemberContent: true },
});
export const useContentBase = () =>
  owner.startsWith('event') ? `/event/${owner}` : `/groups/${owner}`;
export const useEventToolId = () =>
  owner.startsWith('event') ? owner : undefined;
export const useForm = () => useFixtureState().tool;
export const usePoll = (args: any) => {
  const s = useFixtureState();
  return s.tools[args.toolId] || { ...s.tool, _id: args.toolId };
};
export const useList = useForm;
export const useFormManagement = (args: any) => {
  const s = useFixtureState();
  return args === 'skip' ? undefined : s.tool;
};
export const usePollManagement = useFormManagement;
export const useListManagement = useFormManagement;
export const useFormPolicy = () => ({
  enabled: true,
  creation: 'MEMBERS',
  canCreate: true,
  canConfigure: false,
});
export const usePollPolicy = useFormPolicy;
export const useListPolicy = useFormPolicy;
export const useForms = () => {
  const s = useFixtureState();
  return page(empty ? [] : [s.tool]);
};
export const usePolls = () => {
  const s = useFixtureState();
  return page(
    params.has('two') ? [s.tool, { ...s.tool, _id: 'tool-two' }] : [s.tool]
  );
};
export const useLists = useForms;
export const useFormResults = () => {
  const s = useFixtureState();
  return page(empty ? [] : [{ ...s.tool, _id: 'response-one' }]);
};
export const usePollResults = (args: any) => {
  const state = useFixtureState();
  const s = { tool: state.tools[args.toolId] || state.tool };
  const skipped = args === 'skip';
  useEffect(() => {
    if (!skipped) (window as any).fixture.resultsReads++;
  }, [skipped]);
  return args === 'skip'
    ? undefined
    : page(
        empty
          ? []
          : [{ ...s.tool, _id: 'vote-one', isCurrent: true, revision: 1 }]
      );
};
export const useListEntries = () => page(useFixtureState().entries);
export const useOwnListEntries = useListEntries;
export const useFormHistory = () => page([]);
export const usePollHistory = () => page([]);
export const useCreateForm = () => mutation('createForm');
export const useConfigureForm = () => mutation('configureForm');
export const useSubmitFormResponse = () => mutation('submitForm');
export const useRemoveFormResponse = () => mutation('removeForm');
export const useRemoveFormResult = () => mutation('removeFormResult');
export const useDeleteForm = () => mutation('deleteForm');
export const useConfigureFormPolicy = () => mutation('formPolicy');
export const useCreatePoll = () => mutation('createPoll');
export const useConfigurePoll = () => mutation('configurePoll');
export const useSubmitPollVote = () => mutation('submitPoll');
export const useRemovePollVote = () => mutation('removePoll');
export const useRemovePollResult = () => mutation('removePollResult');
export const useDeletePoll = () => mutation('deletePoll');
export const useConfigurePollPolicy = () => mutation('pollPolicy');
export const useCreateList = () => mutation('createList');
export const useConfigureList = () => mutation('configureList');
export const useAddListEntry = () => mutation('addList');
export const useEditListEntry = () => mutation('editList');
export const useRemoveListEntry = () => mutation('removeList');
export const useDeleteList = () => mutation('deleteList');
export const useConfigureListPolicy = () => mutation('listPolicy');
const navigate = (url: string) => history.pushState({}, '', url);
export const useRouter = () => ({
  push: navigate,
  replace: (url: string) => history.replaceState({}, '', url),
  back: () => history.back(),
  refresh: () => {},
});
export const usePathname = () => location.pathname;
export function Link({ href, children, ...props }: any) {
  return (
    <a href={href} {...props}>
      {children}
    </a>
  );
}
(window as any).fixture = {
  getState: () => state,
  resultsReads: 0,
  owner,
  kind,
};
