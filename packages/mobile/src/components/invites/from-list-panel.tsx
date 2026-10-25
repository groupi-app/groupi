import { useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  findNodeHandle,
  Pressable,
  View,
  type Text as NativeText,
} from 'react-native';
import type { Id } from 'convex/_generated/dataModel';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { LabeledTextarea } from '@/components/ui/labeled-textarea';
import { InviteListDataBoundary } from '@/components/settings/invite-list-data-boundary';
import {
  useInviteList,
  useInviteLists,
  useInviteListRecipientReview,
  useInviteListDraftPeople,
  useSendInviteListRecipients,
} from '@/hooks/use-invite-lists';
import { useSentEventInvites } from '@/hooks/use-event-invites';
import { isPresent } from './invite-types';
import { InvitePanelScrollView } from './invite-panel-shell';
import type {
  PeopleInviteDraft,
  SelectablePerson,
} from './people-invite-panel';

export type SavedListDetail = NonNullable<ReturnType<typeof useInviteList>>;
export interface InviteRecipientDraft {
  listIds: SavedListDetail['inviteListId'][];
  snapshots: Record<string, SavedListDetail>;
  people: SelectablePerson[];
  error: string;
}
export const EMPTY_INVITE_RECIPIENT_DRAFT: InviteRecipientDraft = {
  listIds: [],
  snapshots: {},
  people: [],
  error: '',
};
type SendResult = Awaited<
  ReturnType<ReturnType<typeof useSendInviteListRecipients>>
>;

export function FromListPanel({
  eventId,
  onCreate,
  draft,
  onDraftChange,
  onSnapshot,
  onReviewLists,
  peopleDraft,
  onPeopleDraftChange,
  canInviteModerator,
  locked,
  sending,
  uncertain,
  expiredRequestId,
  expiryBasedOnDeviceClock = false,
  onStartNewReview,
  result,
  onSend,
  onRetry,
}: {
  eventId: Id<'events'>;
  onCreate: () => void;
  draft: InviteRecipientDraft;
  onDraftChange: Dispatch<SetStateAction<InviteRecipientDraft>>;
  onSnapshot: (list: SavedListDetail) => void;
  onReviewLists: () => void;
  peopleDraft: PeopleInviteDraft;
  onPeopleDraftChange: Dispatch<SetStateAction<PeopleInviteDraft>>;
  canInviteModerator: boolean;
  locked: boolean;
  sending: boolean;
  uncertain: boolean;
  expiredRequestId?: string;
  expiryBasedOnDeviceClock?: boolean;
  onStartNewReview: () => void;
  result?: SendResult;
  onSend: () => void;
  onRetry: () => void;
}) {
  const heading = useRef<NativeText>(null);
  const expiredHeading = useRef<NativeText>(null);
  const hadExpired = useRef(false);
  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(
      'From list. Review recipients before sending.'
    );
    const frame = requestAnimationFrame(() => {
      const handle = findNodeHandle(heading.current);
      if (handle !== null) AccessibilityInfo.setAccessibilityFocus(handle);
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    if (!expiredRequestId && !hadExpired.current) return;
    hadExpired.current = !!expiredRequestId;
    AccessibilityInfo.announceForAccessibility(
      expiredRequestId
        ? expiryBasedOnDeviceClock
          ? 'Based on your device clock, protection for the original invitation request may have expired. Original invitations may exist. Check pending invitations before sending again.'
          : 'Original invitation request expired. It may have sent. Check pending invitations before sending again.'
        : 'Invitation draft restored. Check pending invitations before sending again.'
    );
    const frame = requestAnimationFrame(() => {
      const handle = findNodeHandle(
        expiredRequestId ? expiredHeading.current : heading.current
      );
      if (handle !== null) AccessibilityInfo.setAccessibilityFocus(handle);
    });
    return () => cancelAnimationFrame(frame);
  }, [expiredRequestId, expiryBasedOnDeviceClock]);
  return (
    <InvitePanelScrollView>
      <Text
        ref={heading}
        accessible
        accessibilityRole='header'
        className='text-lg font-semibold'
      >
        From list
      </Text>
      <Text className='text-sm text-muted-foreground'>
        Choose private lists, then review and edit the recipients. Only Send
        invitations sends anything.
      </Text>
      <Button
        accessibilityLabel='Create invite list'
        variant='outline'
        disabled={locked}
        onPress={onCreate}
      >
        Create invite list
      </Button>
      <InviteListDataBoundary context='invite lists'>
        <ListChoices
          draft={draft}
          onDraftChange={onDraftChange}
          locked={locked}
        />
      </InviteListDataBoundary>
      {draft.listIds
        .filter(id => !draft.snapshots[id])
        .map(id => (
          <InviteListDataBoundary key={id} context='selected list'>
            <LoadListSnapshot listId={id} onSnapshot={onSnapshot} />
          </InviteListDataBoundary>
        ))}
      <InviteListDataBoundary context='selected list availability'>
        <ReviewSelectedLists
          draft={draft}
          locked={locked}
          onReview={onReviewLists}
        />
      </InviteListDataBoundary>
      <Text accessibilityRole='header' className='font-semibold'>
        {draft.people.length} recipients
      </Text>
      <Text className='text-sm text-muted-foreground'>
        The People tab can add individual people to this review. Saved list
        changes will not replace these recipients.
      </Text>
      {draft.people.length ? (
        <InviteListDataBoundary context='recipient review'>
          <RecipientReview
            eventId={eventId}
            people={draft.people}
            locked={locked}
            onRemove={personId =>
              onDraftChange(previous => ({
                ...previous,
                people: previous.people.filter(
                  person => person.personId !== personId
                ),
              }))
            }
          />
        </InviteListDataBoundary>
      ) : (
        <Text>No recipients selected.</Text>
      )}
      {canInviteModerator || (locked && peopleDraft.role === 'MODERATOR') ? (
        <View className='flex-row gap-2'>
          {(['ATTENDEE', 'MODERATOR'] as const).map(role => (
            <Pressable
              key={role}
              accessibilityRole='radio'
              accessibilityLabel={
                role === 'ATTENDEE' ? 'Attendee' : 'Moderator'
              }
              accessibilityState={{
                checked: peopleDraft.role === role,
                disabled: locked,
              }}
              disabled={locked}
              onPress={() =>
                onPeopleDraftChange(previous => ({ ...previous, role }))
              }
              className={
                peopleDraft.role === role
                  ? 'min-h-[44px] flex-1 items-center justify-center rounded-button border border-primary bg-primary/10 px-3'
                  : 'min-h-[44px] flex-1 items-center justify-center rounded-button border border-border px-3'
              }
            >
              <Text>{role === 'ATTENDEE' ? 'Attendee' : 'Moderator'}</Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <Text>Invite as Attendee</Text>
      )}
      <LabeledTextarea
        label='Personal message (optional)'
        value={peopleDraft.message}
        onChangeText={message =>
          onPeopleDraftChange(previous => ({ ...previous, message }))
        }
        maxLength={280}
        editable={!locked}
      />
      {draft.error ? (
        <Text
          accessibilityRole='alert'
          accessibilityLiveRegion='polite'
          className='text-destructive'
        >
          {draft.error}
        </Text>
      ) : null}
      {expiredRequestId ? (
        <>
          <Text
            ref={expiredHeading}
            accessible
            accessibilityRole='header'
            className='font-semibold'
          >
            {expiryBasedOnDeviceClock
              ? 'Protection may have expired'
              : 'Original request expired'}
          </Text>
          <Text accessibilityRole='alert' accessibilityLiveRegion='polite'>
            {expiryBasedOnDeviceClock
              ? 'Based on your device clock, protection for this request may have expired. The original invitations may exist. Check pending invitations before sending another request.'
              : 'The original request may have sent invitations. This request ID has expired and cannot be retried. Check pending invitations before sending another request.'}
          </Text>
          <Text selectable>Original request ID: {expiredRequestId}</Text>
          <InviteListDataBoundary context='pending invitations'>
            <ExpiredPendingInvitations
              eventId={eventId}
              personIds={draft.people.map(person => person.personId)}
            />
          </InviteListDataBoundary>
          <Text>
            Start a new review only after acknowledging that the original
            request may have sent. This restores the draft without sending
            anything.
          </Text>
          <Button
            accessibilityLabel='Start a new review'
            disabled={sending}
            onPress={onStartNewReview}
          >
            Start a new review
          </Button>
        </>
      ) : uncertain ? (
        <>
          <Text accessibilityRole='alert'>
            The outcome is unknown. Retry the original request with the same
            recipients, role, message, and request ID. Check pending invitations
            before starting another request.
          </Text>
          <Button
            accessibilityLabel='Retry original invitations'
            isLoading={sending}
            loadingText='Retrying…'
            onPress={onRetry}
          >
            Retry original invitations
          </Button>
        </>
      ) : (
        <InviteListDataBoundary context='send review'>
          <ReviewedSendControl
            eventId={eventId}
            people={draft.people}
            locked={locked}
            sending={sending}
            onSend={onSend}
          />
        </InviteListDataBoundary>
      )}
      {result ? (
        <View
          accessibilityLiveRegion='polite'
          className='gap-2 rounded-card border border-border bg-card p-4'
        >
          <Text accessibilityRole='alert'>
            {result.sentCount === 0
              ? 'No invitations were sent.'
              : `${result.sentCount} invitations sent.`}{' '}
            {result.skippedCount} people skipped.
          </Text>
          <InviteListDataBoundary context='invitation result details'>
            <SendOutcomeRows eventId={eventId} result={result} />
          </InviteListDataBoundary>
        </View>
      ) : null}
    </InvitePanelScrollView>
  );
}

function ListChoices({
  draft,
  onDraftChange,
  locked,
}: {
  draft: InviteRecipientDraft;
  onDraftChange: Dispatch<SetStateAction<InviteRecipientDraft>>;
  locked: boolean;
}) {
  const lists = useInviteLists();
  if (lists === undefined)
    return <ActivityIndicator accessibilityLabel='Loading invite lists' />;
  if (!lists.items.length)
    return <Text>No invite lists yet. Create one in Settings.</Text>;
  return (
    <View className='gap-2'>
      {lists.items.map(list => {
        const selected = draft.listIds.includes(list.inviteListId);
        const disabled = locked || (list.needsAttention && !selected);
        return (
          <Pressable
            key={list.inviteListId}
            accessibilityRole='checkbox'
            accessibilityLabel={`Select ${list.name}`}
            accessibilityHint={
              list.needsAttention
                ? 'Needs attention. Add an existing person in Settings before using this list.'
                : `${list.availablePersonCount} available people`
            }
            accessibilityState={{ checked: selected, disabled }}
            disabled={disabled}
            onPress={() =>
              onDraftChange(previous => {
                if (!previous.listIds.includes(list.inviteListId))
                  return {
                    ...previous,
                    listIds: [...previous.listIds, list.inviteListId],
                  };
                const snapshots = { ...previous.snapshots };
                delete snapshots[list.inviteListId];
                return {
                  ...previous,
                  snapshots,
                  listIds: previous.listIds.filter(
                    id => id !== list.inviteListId
                  ),
                };
              })
            }
            className={
              selected
                ? 'min-h-[44px] gap-1 rounded-card border border-primary bg-primary/10 p-4'
                : 'min-h-[44px] gap-1 rounded-card border border-border bg-card p-4'
            }
          >
            <Text className='font-semibold'>{list.name}</Text>
            <Text>
              {list.availablePersonCount} people
              {list.needsAttention
                ? ' · Needs attention'
                : selected
                  ? ' · Selected'
                  : ''}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function LoadListSnapshot({
  listId,
  onSnapshot,
}: {
  listId: SavedListDetail['inviteListId'];
  onSnapshot: (list: SavedListDetail) => void;
}) {
  const list = useInviteList(listId);
  useEffect(() => {
    if (list) onSnapshot(list);
  }, [list, onSnapshot]);
  return <ActivityIndicator accessibilityLabel='Loading selected list' />;
}

function RecipientReview({
  eventId,
  people,
  locked,
  onRemove,
}: {
  eventId: Id<'events'>;
  people: SelectablePerson[];
  locked: boolean;
  onRemove: (personId: SelectablePerson['personId']) => void;
}) {
  const review = useInviteListRecipientReview(
    eventId,
    people.map(person => person.personId)
  );
  if (review === undefined)
    return <ActivityIndicator accessibilityLabel='Loading recipient review' />;
  return (
    <View className='gap-2'>
      {review.results.map(person => {
        const name = person.available
          ? (person.name ?? person.username ?? 'Groupi person')
          : 'Unavailable person';
        return (
          <View
            key={person.personId}
            className='gap-2 rounded-card border border-border bg-card p-3'
          >
            <Text>{name}</Text>
            {person.available && person.username ? (
              <Text className='text-sm text-muted-foreground'>
                @{person.username}
              </Text>
            ) : null}
            {person.status === 'skipped' ? (
              <Text className='text-sm text-muted-foreground'>
                {describeSkip(person.reason)}
              </Text>
            ) : null}
            <Button
              accessibilityLabel={`Remove ${name}`}
              variant='outline'
              disabled={locked}
              onPress={() => onRemove(person.personId)}
            >
              Remove
            </Button>
          </View>
        );
      })}
    </View>
  );
}

function describeSkip(
  reason: 'ALREADY_MEMBER' | 'INVITATION_PENDING' | 'UNAVAILABLE'
) {
  return reason === 'ALREADY_MEMBER'
    ? 'Already a member'
    : reason === 'INVITATION_PENDING'
      ? 'Invitation already pending'
      : 'Person unavailable';
}

function ReviewedSendControl({
  eventId,
  people,
  locked,
  sending,
  onSend,
}: {
  eventId: Id<'events'>;
  people: SelectablePerson[];
  locked: boolean;
  sending: boolean;
  onSend: () => void;
}) {
  const review = useInviteListRecipientReview(
    people.length ? eventId : undefined,
    people.map(person => person.personId)
  );
  return (
    <Button
      accessibilityLabel='Send invitations'
      isLoading={sending}
      loadingText='Sending…'
      disabled={review === undefined || !people.length || locked}
      onPress={onSend}
    >
      Send invitations
    </Button>
  );
}

function SendOutcomeRows({
  eventId,
  result,
}: {
  eventId: Id<'events'>;
  result: SendResult;
}) {
  const profiles = useInviteListRecipientReview(
    eventId,
    result.results.map(row => row.personId)
  );
  if (profiles === undefined)
    return (
      <ActivityIndicator accessibilityLabel='Loading invitation result details' />
    );
  return (
    <>
      {result.results.map(row => {
        const person = profiles.results.find(
          person => person.personId === row.personId
        );
        const name =
          (row.status === 'skipped' && row.reason === 'UNAVAILABLE') ||
          !person?.available
            ? 'Unavailable person'
            : (person.name ?? person.username ?? 'Groupi person');
        return (
          <Text key={row.personId}>
            {name}:{' '}
            {row.status === 'sent'
              ? 'Invitation sent'
              : describeSkip(row.reason)}
          </Text>
        );
      })}
    </>
  );
}

function ReviewSelectedLists({
  draft,
  locked,
  onReview,
}: {
  draft: InviteRecipientDraft;
  locked: boolean;
  onReview: () => void;
}) {
  const collection = useInviteLists();
  const unavailable =
    collection !== undefined &&
    draft.listIds.some(
      id =>
        !collection.items.some(
          list => list.inviteListId === id && !list.needsAttention
        )
    );
  const disabled =
    locked ||
    collection === undefined ||
    !draft.listIds.length ||
    draft.listIds.some(id => !draft.snapshots[id]) ||
    unavailable;
  return (
    <>
      {unavailable ? (
        <Text accessibilityRole='alert'>
          A selected list needs attention or is no longer available. Update it
          in Settings or remove its selection.
        </Text>
      ) : null}
      <Button
        accessibilityLabel='Review selected lists'
        variant='outline'
        disabled={disabled}
        onPress={onReview}
      >
        Review selected lists
      </Button>
    </>
  );
}

function ExpiredPendingInvitations({
  eventId,
  personIds,
}: {
  eventId: Id<'events'>;
  personIds: SelectablePerson['personId'][];
}) {
  const sent = useSentEventInvites(eventId);
  const profiles = useInviteListDraftPeople(personIds);
  if (sent === undefined || profiles === undefined)
    return (
      <ActivityIndicator accessibilityLabel='Loading pending invitations' />
    );
  const pending = sent
    .filter(isPresent)
    .filter(
      invite =>
        invite.status === 'PENDING' &&
        personIds.includes(invite.invitee.personId)
    );
  return (
    <View className='gap-2 rounded-card border border-border bg-card p-4'>
      <Text accessibilityRole='header'>
        Pending invitations for these recipients
      </Text>
      {pending.length ? (
        pending.map(invite => {
          const person = profiles.items.find(
            person => person.personId === invite.invitee.personId
          );
          const name = person?.available
            ? (person.name ?? person.username ?? 'Groupi person')
            : 'Unavailable person';
          return <Text key={invite.inviteId}>{name}: Invitation pending</Text>;
        })
      ) : (
        <Text>
          No pending invitations for these recipients are currently visible.
        </Text>
      )}
    </View>
  );
}
