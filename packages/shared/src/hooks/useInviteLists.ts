import type {
  useMutation as sdkUseMutation,
  useQuery as sdkUseQuery,
} from 'convex/react';
import type { FunctionReference } from 'convex/server';
import type { ConvexId } from './types';

/** Bind both apps to the same generated invite-list API without platform imports. */
export function createInviteListHooks<
  Collection,
  Detail,
  People,
  DraftPeople,
  Deletion,
  Review,
  SendResult,
>(
  api: {
    inviteLists: {
      queries: {
        listInviteLists: FunctionReference<
          'query',
          'public',
          Record<string, never>,
          Collection
        >;
        getInviteList: FunctionReference<
          'query',
          'public',
          { inviteListId: ConvexId<'inviteLists'> },
          Detail
        >;
        searchPeople: FunctionReference<
          'query',
          'public',
          { searchTerm: string },
          People
        >;
        getFriendChoices: FunctionReference<
          'query',
          'public',
          Record<string, never>,
          People
        >;
        getPeopleByIds: FunctionReference<
          'query',
          'public',
          { personIds: ConvexId<'persons'>[] },
          DraftPeople
        >;
        reviewInviteListRecipients: FunctionReference<
          'query',
          'public',
          { eventId: ConvexId<'events'>; personIds: ConvexId<'persons'>[] },
          Review
        >;
      };
      mutations: {
        createInviteList: FunctionReference<
          'mutation',
          'public',
          { name: string; personIds: ConvexId<'persons'>[] },
          Detail
        >;
        updateInviteList: FunctionReference<
          'mutation',
          'public',
          {
            inviteListId: ConvexId<'inviteLists'>;
            name?: string;
            personIds?: ConvexId<'persons'>[];
          },
          Detail
        >;
        deleteInviteList: FunctionReference<
          'mutation',
          'public',
          { inviteListId: ConvexId<'inviteLists'> },
          Deletion
        >;
        sendInviteListRecipients: FunctionReference<
          'mutation',
          'public',
          {
            eventId: ConvexId<'events'>;
            personIds: ConvexId<'persons'>[];
            role?: 'ATTENDEE' | 'MODERATOR';
            message?: string;
            requestId: string;
          },
          SendResult
        >;
      };
    };
  },
  {
    useQuery,
    useMutation,
  }: {
    useQuery: typeof sdkUseQuery;
    useMutation: typeof sdkUseMutation;
  }
) {
  function useInviteLists() {
    return useQuery(api.inviteLists.queries.listInviteLists, {});
  }

  function useInviteList(inviteListId?: ConvexId<'inviteLists'>) {
    return useQuery(
      api.inviteLists.queries.getInviteList,
      inviteListId ? { inviteListId } : 'skip'
    );
  }

  function useInviteListPeople(searchTerm: string) {
    const normalized = searchTerm.trim();
    return useQuery(
      api.inviteLists.queries.searchPeople,
      normalized.length >= 2 ? { searchTerm: normalized } : 'skip'
    );
  }

  function useInviteListFriends() {
    return useQuery(api.inviteLists.queries.getFriendChoices, {});
  }

  function useInviteListDraftPeople(personIds: ConvexId<'persons'>[]) {
    return useQuery(
      api.inviteLists.queries.getPeopleByIds,
      personIds.length ? { personIds } : 'skip'
    );
  }

  function useInviteListRecipientReview(
    eventId: ConvexId<'events'> | undefined,
    personIds: ConvexId<'persons'>[]
  ) {
    return useQuery(
      api.inviteLists.queries.reviewInviteListRecipients,
      eventId && personIds.length ? { eventId, personIds } : 'skip'
    );
  }

  function useCreateInviteList() {
    return useMutation(api.inviteLists.mutations.createInviteList);
  }

  function useUpdateInviteList() {
    return useMutation(api.inviteLists.mutations.updateInviteList);
  }

  function useDeleteInviteList() {
    return useMutation(api.inviteLists.mutations.deleteInviteList);
  }

  function useSendInviteListRecipients() {
    return useMutation(api.inviteLists.mutations.sendInviteListRecipients);
  }

  return {
    useInviteLists,
    useInviteList,
    useInviteListPeople,
    useInviteListFriends,
    useInviteListDraftPeople,
    useInviteListRecipientReview,
    useCreateInviteList,
    useUpdateInviteList,
    useDeleteInviteList,
    useSendInviteListRecipients,
  };
}
