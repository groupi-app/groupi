import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { BackHandler, View } from 'react-native';
import {
  Stack,
  router,
  useFocusEffect,
  useLocalSearchParams,
} from 'expo-router';
import { usePreventRemove } from '@react-navigation/native';
import { InlineInviteListEditor } from '@/components/invites/inline-invite-list-editor';
import type { FunctionReturnType } from 'convex/server';
import { useQuery } from 'convex/react';
import { api } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';

import { EmailInvitePanel } from '@/components/invites/email-invite-panel';
import { InviteSkeleton } from '@/components/invites/invite-skeleton';
import { LinkInvitePanel } from '@/components/invites/link-invite-panel';
import {
  EMPTY_PEOPLE_INVITE_DRAFT,
  PeopleInvitePanel,
  type SelectablePerson,
} from '@/components/invites/people-invite-panel';
import {
  EMPTY_INVITE_RECIPIENT_DRAFT,
  FromListPanel,
  type SavedListDetail,
} from '@/components/invites/from-list-panel';
import { useSendInviteListRecipients } from '@/hooks/use-invite-lists';
import { isPresent } from '@/components/invites/invite-types';
import { TabBarFilter } from '@/components/molecules/tab-bar-filter';
import { BackButton } from '@/components/ui/back-button';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { Text } from '@/components/ui/text';
import { useFriendsList } from '@/hooks/use-friends';
import { useSentEventInvites } from '@/hooks/use-event-invites';
import { useEventMembers } from '@/hooks/use-events';
import { InviteListDataBoundary } from '@/components/settings/invite-list-data-boundary';
import { EmptyState } from '@/components/ui/empty-state';
import {
  canInviteMembers,
  createInviteListSendAttempt,
  hasInviteListRequestExpired,
  isDefiniteInviteListRejection,
  isExpiredInviteListRequest,
  mergeInviteRecipients,
} from '@groupi/shared/utils';

type InviteTab = 'link' | 'people' | 'email' | 'lists';
type SendArgs = Parameters<ReturnType<typeof useSendInviteListRecipients>>[0];
type SendResult = Awaited<
  ReturnType<ReturnType<typeof useSendInviteListRecipients>>
>;

export default function InviteScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  return (
    <InviteContent
      eventId={eventId as Id<'events'>}
      eventTitle='this event'
      canInviteModerator={false}
      loadAccess
    />
  );
}

export function InviteContent({
  eventId,
  eventTitle,
  canInviteModerator,
  access = 'allowed',
  loadAccess = false,
}: {
  eventId: Id<'events'>;
  eventTitle: string;
  canInviteModerator: boolean;
  access?: 'loading' | 'allowed' | 'unavailable';
  loadAccess?: boolean;
}) {
  const [accessData, setAccessData] = useState<InviteAccessData>({
    access: 'loading',
    eventTitle: 'this event',
    canInviteModerator: false,
  });
  if (loadAccess) ({ access, eventTitle, canInviteModerator } = accessData);
  const unavailableAccess = useCallback(
    () =>
      setAccessData(previous => ({
        ...previous,
        access: 'unavailable',
        canInviteModerator: false,
      })),
    []
  );
  const [editorOpen, setEditorOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<InviteTab>('link');
  const [peopleDraft, setPeopleDraft] = useState(EMPTY_PEOPLE_INVITE_DRAFT);
  const [recipientDraft, setRecipientDraft] = useState(
    EMPTY_INVITE_RECIPIENT_DRAFT
  );
  const [listWorkflow, setListWorkflow] = useState(false);
  const [attempt, setAttempt] = useState<{ args: SendArgs }>();
  const [sending, setSending] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [expired, setExpired] = useState<'server' | 'device-clock'>();
  const [sendResult, setSendResult] = useState<SendResult>();
  const sendingRef = useRef(false);
  const sendRecipients = useSendInviteListRecipients();
  const captureSnapshot = useCallback((list: SavedListDetail) => {
    setRecipientDraft(previous =>
      previous.snapshots[list.inviteListId]
        ? previous
        : {
            ...previous,
            snapshots: {
              ...previous.snapshots,
              [list.inviteListId]: {
                ...list,
                people: list.people.map(person => ({ ...person })),
              },
            },
          }
    );
  }, []);

  function addRecipients(added: SelectablePerson[], savedList = false) {
    if (attempt) return;
    setRecipientDraft(previous => {
      try {
        return {
          ...previous,
          people: mergeInviteRecipients(previous.people, added),
          error: '',
        };
      } catch {
        return {
          ...previous,
          error: `${savedList ? 'Invite list saved. ' : ''}Choose at most 100 recipients. Your previous selection has been kept.`,
        };
      }
    });
  }
  const showRecovery = useCallback(() => {
    setActiveTab('lists');
    setRecipientDraft(previous => ({
      ...previous,
      error:
        'Finish recovering the original invitation request before leaving. Its outcome may be unknown.',
    }));
  }, []);
  usePreventRemove(!!attempt, showRecovery);
  useFocusEffect(
    useCallback(() => {
      if (!attempt) return;
      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          showRecovery();
          return true;
        }
      );
      return () => subscription.remove();
    }, [attempt, showRecovery])
  );

  async function sendReviewedRecipients() {
    if (sendingRef.current || expired) return;
    let currentAttempt = attempt;
    if (!currentAttempt) {
      if (access !== 'allowed') return;
      if (!recipientDraft.people.length || peopleDraft.message.length > 280) {
        setRecipientDraft(previous => ({
          ...previous,
          error:
            peopleDraft.message.length > 280
              ? 'Keep the message to 280 characters or fewer.'
              : 'Choose at least one recipient.',
        }));
        return;
      }
      currentAttempt = createInviteListSendAttempt(
        {
          eventId,
          personIds: recipientDraft.people.map(person => person.personId),
          role: canInviteModerator ? peopleDraft.role : 'ATTENDEE',
          message: peopleDraft.message.trim() || undefined,
        },
        () => globalThis.expo.uuidv4()
      );
      setAttempt(currentAttempt);
      setSendResult(undefined);
    }
    sendingRef.current = true;
    setSending(true);
    setRecipientDraft(previous => ({ ...previous, error: '' }));
    try {
      const result = await sendRecipients(currentAttempt.args);
      setSendResult(result);
      setAttempt(undefined);
      setUncertain(false);
      setExpired(undefined);
      const sent = new Set(
        result.results
          .filter(row => row.status === 'sent')
          .map(row => row.personId)
      );
      setRecipientDraft(previous => ({
        ...previous,
        people: previous.people.filter(person => !sent.has(person.personId)),
      }));
    } catch (error) {
      const serverExpired = isExpiredInviteListRequest(error);
      if (
        serverExpired ||
        (uncertain &&
          hasInviteListRequestExpired(currentAttempt.args.requestId))
      ) {
        setExpired(serverExpired ? 'server' : 'device-clock');
        setUncertain(true);
      } else if (!uncertain && isDefiniteInviteListRejection(error)) {
        setAttempt(undefined);
        setRecipientDraft(previous => ({
          ...previous,
          error:
            'No invitations were sent. Check your permissions and recipient selection, then try again.',
        }));
      } else {
        setUncertain(true);
      }
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }
  function startNewReview() {
    if (!expired || !attempt || sendingRef.current) return;
    setPeopleDraft(previous => ({
      ...previous,
      role: attempt.args.role ?? 'ATTENDEE',
    }));
    setRecipientDraft(previous => ({
      ...previous,
      error:
        'The original request may have sent. Check pending invitations before sending a new request.',
    }));
    setAttempt(undefined);
    setExpired(undefined);
    setUncertain(false);
  }
  const listPanel = (
    <FromListPanel
      eventId={eventId}
      onCreate={() => {
        if (!attempt) setEditorOpen(true);
      }}
      draft={recipientDraft}
      onDraftChange={setRecipientDraft}
      onSnapshot={captureSnapshot}
      onReviewLists={() =>
        addRecipients([
          ...(peopleDraft.selectedPerson ? [peopleDraft.selectedPerson] : []),
          ...recipientDraft.listIds.flatMap(
            id => recipientDraft.snapshots[id]?.people ?? []
          ),
        ])
      }
      peopleDraft={
        attempt
          ? { ...peopleDraft, role: attempt.args.role ?? 'ATTENDEE' }
          : peopleDraft
      }
      onPeopleDraftChange={setPeopleDraft}
      canInviteModerator={canInviteModerator}
      locked={attempt !== undefined}
      sending={sending}
      uncertain={uncertain}
      expiredRequestId={expired ? attempt?.args.requestId : undefined}
      expiryBasedOnDeviceClock={expired === 'device-clock'}
      onStartNewReview={startNewReview}
      result={sendResult}
      onSend={() => void sendReviewedRecipients()}
      onRetry={() => void sendReviewedRecipients()}
    />
  );
  if (editorOpen)
    return (
      <SafeAreaView className='flex-1 bg-background'>
        <InlineInviteListEditor
          onClose={() => setEditorOpen(false)}
          onSaved={(list, use) => {
            if (use) addRecipients(list.people, true);
            setEditorOpen(false);
          }}
        />
      </SafeAreaView>
    );
  return (
    <SafeAreaView className='flex-1 bg-background'>
      {loadAccess ? (
        <InviteListDataBoundary
          context='event permissions'
          onFailure={unavailableAccess}
        >
          <InviteAccessLoader eventId={eventId} onChange={setAccessData} />
        </InviteListDataBoundary>
      ) : null}
      <Stack.Screen
        options={{
          gestureEnabled: !attempt,
          headerBackButtonMenuEnabled: false,
        }}
      />
      <ScreenHeader onBack={() => (attempt ? showRecovery() : router.back())} />
      {access === 'loading' ? (
        <LoadingOptions />
      ) : access === 'unavailable' ? (
        <EmptyState
          icon='lock-closed-outline'
          title='Inviting unavailable'
          description="You don't have permission to invite people to this event."
        />
      ) : null}
      {access !== 'allowed' ? null : (
        <InviteListDataBoundary context='invite options'>
          <InviteLegacyData eventId={eventId}>
            {({
              inviteData,
              availableSentInvites,
              availableFriends,
              eventMembers,
              pendingPeopleCount,
              pendingEmailCount,
              linkCount,
            }) => (
              <>
                <View className='px-4 pb-2'>
                  <Text className='text-sm text-muted-foreground'>
                    Choose how people join {eventTitle}.
                  </Text>
                </View>
                <TabBarFilter
                  activeTab={activeTab}
                  onTabChange={key => {
                    if (attempt && key === 'people') return;
                    if (key === 'lists') setListWorkflow(true);
                    setActiveTab(key as InviteTab);
                  }}
                  tabs={[
                    { key: 'link', label: 'Link', badge: linkCount },
                    {
                      key: 'people',
                      label: 'People',
                      badge: pendingPeopleCount,
                      disabled: !!attempt,
                    },
                    {
                      key: 'lists',
                      label: 'From list',
                      badge: recipientDraft.people.length,
                    },
                    { key: 'email', label: 'Email', badge: pendingEmailCount },
                  ]}
                />

                {activeTab === 'link' ? (
                  <LinkInvitePanel eventId={eventId} inviteData={inviteData} />
                ) : activeTab === 'people' ? (
                  <PeopleInvitePanel
                    eventId={eventId}
                    canInviteModerator={canInviteModerator}
                    sentInvites={availableSentInvites}
                    friends={availableFriends}
                    eventMembers={eventMembers}
                    draft={peopleDraft}
                    onDraftChange={setPeopleDraft}
                    onAddToReview={
                      listWorkflow
                        ? person => {
                            addRecipients([person]);
                            setActiveTab('lists');
                          }
                        : undefined
                    }
                  />
                ) : activeTab === 'lists' ? null : (
                  <EmailInvitePanel eventId={eventId} inviteData={inviteData} />
                )}
              </>
            )}
          </InviteLegacyData>
        </InviteListDataBoundary>
      )}
      {(access === 'allowed' && activeTab === 'lists') ||
      (access !== 'allowed' && attempt)
        ? listPanel
        : null}
    </SafeAreaView>
  );
}

function ScreenHeader({ onBack }: { onBack?: () => void }) {
  return (
    <View className='flex-row items-center px-4 py-3'>
      <BackButton onPress={onBack} />
      <Text className='text-lg font-semibold text-foreground'>
        Invite People
      </Text>
    </View>
  );
}

function LoadingOptions() {
  return (
    <View
      accessible
      accessibilityLabel='Loading invite options'
      accessibilityRole='progressbar'
    >
      <InviteSkeleton />
    </View>
  );
}
function InviteLegacyData({
  eventId,
  children,
}: {
  eventId: Id<'events'>;
  children: (data: {
    inviteData: FunctionReturnType<typeof api.invites.queries.getEventInvites>;
    availableSentInvites:
      | NonNullable<
          NonNullable<ReturnType<typeof useSentEventInvites>>[number]
        >[]
      | undefined;
    availableFriends:
      | NonNullable<NonNullable<ReturnType<typeof useFriendsList>>[number]>[]
      | undefined;
    eventMembers: ReturnType<typeof useEventMembers>;
    pendingPeopleCount: number;
    pendingEmailCount: number;
    linkCount: number;
  }) => ReactNode;
}) {
  const inviteData = useQuery(api.invites.queries.getEventInvites, { eventId });
  const availableSentInvites = useSentEventInvites(eventId)?.filter(isPresent);
  const availableFriends = useFriendsList()?.filter(isPresent);
  const eventMembers = useEventMembers(eventId);
  if (inviteData === undefined) return <LoadingOptions />;
  return children({
    inviteData,
    availableSentInvites,
    availableFriends,
    eventMembers,
    pendingPeopleCount:
      availableSentInvites?.filter(invite => invite.status === 'PENDING')
        .length ?? 0,
    pendingEmailCount: inviteData.pendingEmailCount ?? 0,
    linkCount: inviteData.invites.filter(invite => !invite.hasEmail).length,
  });
}

type InviteAccessData = {
  access: 'loading' | 'allowed' | 'unavailable';
  eventTitle: string;
  canInviteModerator: boolean;
};
function InviteAccessLoader({
  eventId,
  onChange,
}: {
  eventId: Id<'events'>;
  onChange: (data: InviteAccessData) => void;
}) {
  const header = useQuery(api.events.queries.getEventHeader, { eventId });
  useEffect(() => {
    const allowed =
      !!header &&
      canInviteMembers(header.userMembership.role, header.permissions);
    onChange({
      access:
        header === undefined ? 'loading' : allowed ? 'allowed' : 'unavailable',
      eventTitle: header?.event.title ?? 'this event',
      canInviteModerator:
        allowed && header?.userMembership.role === 'ORGANIZER',
    });
  }, [header, onChange]);
  return null;
}
