/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { createRoot } from 'react-dom/client';
import {
  GroupFormEditor,
  GroupFormInteraction,
  GroupForms,
} from '../../components/organisms/group-forms';
import * as PollModule from '../../components/organisms/group-polls';
import {
  GroupPollEditor,
  GroupPollInteraction,
  GroupPollResults,
  GroupPolls,
} from '../../components/organisms/group-polls';
import {
  GroupListEditor,
  GroupListInteraction,
  GroupLists,
} from '../../components/organisms/group-lists';
const p = new URLSearchParams(location.search);
const kind = p.get('kind') || 'form';
const view = p.get('view') || 'editor';
const owner = p.get('owner') === 'event' ? 'event-one' : 'group-one';
const components: any = {
  form: {
    editor: GroupFormEditor,
    participant: GroupFormInteraction,
    hub: GroupForms,
  },
  poll: {
    editor: GroupPollEditor,
    participant: GroupPollInteraction,
    results: GroupPollResults,
    feed: (PollModule as any).GroupPollFeed,
    hub: GroupPolls,
  },
  list: {
    editor: GroupListEditor,
    participant: GroupListInteraction,
    hub: GroupLists,
  },
};
const Component = components[kind][view];
createRoot(document.getElementById('root')!).render(
  <Component
    groupId={owner}
    toolId={view === 'editor' && !p.has('edit') ? undefined : 'tool-one'}
  />
);
