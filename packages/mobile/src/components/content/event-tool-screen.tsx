import {
  useLocalSearchParams,
  router,
  type ErrorBoundaryProps,
} from 'expo-router';
import type { Id } from 'convex/_generated/dataModel';
import { DetailScreenTemplate } from '@/components/templates/detail-screen-template';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useEventAddons } from '@/hooks/use-addons';
import { EventToolScope } from './event-tool-scope';
import {
  GroupFormsHub,
  GroupOrdinaryFormEditor,
  GroupOrdinaryForm,
  GroupOrdinaryFormHistory,
  GroupOrdinaryFormResults,
} from '../groups/group-ordinary-forms';
import {
  GroupListsHub,
  GroupListEditor,
  GroupPersistentList,
  GroupOwnListEntries,
} from '../groups/group-persistent-lists';
import {
  GroupPollsHub,
  GroupOrdinaryPollEditor,
  GroupOrdinaryPoll,
  GroupOrdinaryPollHistory,
  GroupOrdinaryPollResults,
} from '../groups/group-polls';

type Kind = 'forms' | 'lists' | 'polls';
type Mode =
  | 'index'
  | 'create'
  | 'detail'
  | 'manage'
  | 'history'
  | 'results'
  | 'own';
export function EventToolScreen({ kind, mode }: { kind: Kind; mode: Mode }) {
  const params = useLocalSearchParams<{ eventId: string; toolId?: string }>();
  const eventId = params.eventId as Id<'events'>;
  const toolId = params.toolId as Id<'groupTools'> | undefined;
  const addons = useEventAddons(
    (kind === 'lists' || kind === 'forms') && mode === 'index'
      ? eventId
      : undefined
  );
  const props = { groupId: eventId };
  const detailProps = toolId ? { ...props, toolId } : null;
  let body;
  if (kind === 'forms') {
    body =
      mode === 'index' ? (
        <GroupFormsHub {...props} />
      ) : mode === 'create' || mode === 'manage' ? (
        <GroupOrdinaryFormEditor {...props} toolId={toolId} />
      ) : (
        detailProps &&
        (mode === 'history' ? (
          <GroupOrdinaryFormHistory toolId={detailProps.toolId} />
        ) : mode === 'results' ? (
          <GroupOrdinaryFormResults {...detailProps} />
        ) : (
          <GroupOrdinaryForm {...detailProps} />
        ))
      );
  } else if (kind === 'polls') {
    body =
      mode === 'index' ? (
        <GroupPollsHub {...props} />
      ) : mode === 'create' || mode === 'manage' ? (
        <GroupOrdinaryPollEditor {...props} toolId={toolId} />
      ) : (
        detailProps &&
        (mode === 'history' ? (
          <GroupOrdinaryPollHistory toolId={detailProps.toolId} />
        ) : mode === 'results' ? (
          <GroupOrdinaryPollResults {...detailProps} />
        ) : (
          <GroupOrdinaryPoll {...detailProps} />
        ))
      );
  } else {
    body =
      mode === 'index' ? (
        <GroupListsHub {...props} />
      ) : mode === 'create' || mode === 'manage' ? (
        <GroupListEditor {...props} toolId={toolId} />
      ) : (
        detailProps &&
        (mode === 'own' ? (
          <GroupOwnListEntries toolId={detailProps.toolId} />
        ) : (
          <GroupPersistentList {...detailProps} />
        ))
      );
  }
  return (
    <DetailScreenTemplate title={`Event ${kind}`}>
      {kind === 'lists' &&
      mode === 'index' &&
      addons?.some(
        addon => addon.enabled && addon.addonType === 'bring-list'
      ) ? (
        <Button
          variant='outline'
          onPress={() => router.push(`/event/${eventId}/addons/bring-list`)}
        >
          What to bring · saved items and claims
        </Button>
      ) : null}
      {kind === 'forms' &&
      mode === 'index' &&
      addons?.some(
        addon => addon.enabled && addon.addonType === 'questionnaire'
      ) ? (
        <Button
          variant='outline'
          onPress={() => router.push(`/event/${eventId}/addons/questionnaire`)}
        >
          Your details · saved Event answers
        </Button>
      ) : null}
      <EventToolScope eventId={eventId}>
        {body || <Text>Content unavailable.</Text>}
      </EventToolScope>
    </DetailScreenTemplate>
  );
}
export function EventToolError({
  error,
  retry,
  kind,
}: ErrorBoundaryProps & { kind: Kind }) {
  const { eventId, toolId } = useLocalSearchParams<{
    eventId: string;
    toolId?: string;
  }>();
  return (
    <DetailScreenTemplate title='Event content'>
      <Text accessibilityRole='alert'>
        {error.message || 'Content access is unavailable.'}
      </Text>
      <Button onPress={retry}>Check current access</Button>
      <Button onPress={() => router.push(`/event/${eventId}`)}>
        Back to Event
      </Button>
      {toolId && (
        <Button
          onPress={() =>
            router.push(
              `/event/${eventId}/${kind}/${toolId}/${kind === 'lists' ? 'own' : 'history'}`
            )
          }
        >
          My saved {kind === 'lists' ? 'entries' : 'history'}
        </Button>
      )}
    </DetailScreenTemplate>
  );
}
