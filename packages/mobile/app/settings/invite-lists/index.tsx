import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  BackHandler,
  findNodeHandle,
  Keyboard,
  Pressable,
  ScrollView,
  View,
  type Text as NativeText,
  type TextInput,
} from 'react-native';
import { ConvexError } from 'convex/values';
import { usePreventRemove } from '@react-navigation/native';
import { Stack, useFocusEffect, useNavigation } from 'expo-router';
import { InviteListSelectedPeople } from '@/components/invites/invite-list-selected-people';
import { InviteListPeople } from '@/components/invites/invite-list-people';
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { InviteListDataBoundary } from '@/components/settings/invite-list-data-boundary';
import {
  useCreateInviteList,
  useUpdateInviteList,
  useDeleteInviteList,
  useInviteList,
  useInviteLists,
} from '@/hooks/use-invite-lists';

type SelectedPerson = NonNullable<
  ReturnType<typeof useInviteList>
>['people'][number];
type ListId = NonNullable<
  ReturnType<typeof useInviteLists>
>['items'][number]['inviteListId'];
type ListSummary = NonNullable<
  ReturnType<typeof useInviteLists>
>['items'][number];

export default function InviteListsScreen() {
  const [view, setView] = useState<
    'collection' | 'create' | 'detail' | 'confirm' | 'delete'
  >('collection');
  const [detailName, setDetailName] = useState('Invite list');
  const [listId, setListId] = useState<ListId>();
  const [search, setSearch] = useState('');
  const createList = useCreateInviteList();
  const updateList = useUpdateInviteList();
  const deleteList = useDeleteInviteList();
  const [editing, setEditing] = useState(false);
  const baseline = useRef({
    name: '',
    personIds: [] as SelectedPerson['personId'][],
  });
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<SelectedPerson[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const nameInput = useRef<TextInput>(null);
  const searchInput = useRef<TextInput>(null);
  const heading = useRef<NativeText>(null);
  const lastInput = useRef<'name' | 'search'>('name');
  const restoreInput = useRef(false);
  const dirty =
    (view === 'create' || view === 'confirm') &&
    (name !== baseline.current.name ||
      selected.length !== baseline.current.personIds.length ||
      selected.some(
        person => !baseline.current.personIds.includes(person.personId)
      ));
  const navigation = useNavigation();
  const pendingNavigation = useRef<(() => void) | undefined>(undefined);
  const dispatchAfterDiscard = useRef(false);

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(
      view === 'confirm'
        ? 'Discard changes?'
        : view === 'delete'
          ? 'Delete invite list?'
          : view === 'create'
            ? editing
              ? 'Edit invite list'
              : 'Create invite list'
            : view === 'detail'
              ? 'Invite list detail'
              : 'Invite lists'
    );
    if (view === 'create' && restoreInput.current) {
      restoreInput.current = false;
      const frame = requestAnimationFrame(() => {
        const input = (lastInput.current === 'name' ? nameInput : searchInput)
          .current;
        input?.focus();
        const handle = findNodeHandle(input);
        if (handle !== null) AccessibilityInfo.setAccessibilityFocus(handle);
      });
      return () => cancelAnimationFrame(frame);
    }
    const frame = requestAnimationFrame(() => {
      const handle = findNodeHandle(heading.current);
      if (handle !== null) AccessibilityInfo.setAccessibilityFocus(handle);
    });
    return () => cancelAnimationFrame(frame);
  }, [view, editing]);

  usePreventRemove(dirty || saving, ({ data }) => {
    if (saving) return;
    pendingNavigation.current ??= () => navigation.dispatch(data.action);
    Keyboard.dismiss();
    setView('confirm');
  });

  useEffect(() => {
    if (
      (view !== 'collection' && view !== 'detail') ||
      !dispatchAfterDiscard.current
    )
      return;
    dispatchAfterDiscard.current = false;
    const proceed = pendingNavigation.current;
    pendingNavigation.current = undefined;
    proceed?.();
  }, [view]);

  useFocusEffect(
    useCallback(() => {
      if (view === 'collection') return;
      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          if (saving) return true;
          if (view === 'confirm') {
            restoreInput.current = true;
            pendingNavigation.current = undefined;
            setView('create');
          } else if (view === 'create' && dirty) {
            Keyboard.dismiss();
            setView('confirm');
          } else {
            setSearch('');
            setError('');
            setView(
              (view === 'create' && editing) || view === 'delete'
                ? 'detail'
                : 'collection'
            );
          }
          return true;
        }
      );
      return () => subscription.remove();
    }, [view, dirty, saving, editing])
  );

  function leaveEditor() {
    if (saving) return;
    if (dirty) {
      Keyboard.dismiss();
      setView('confirm');
    } else {
      setSearch('');
      setError('');
      setView(editing ? 'detail' : 'collection');
    }
  }
  function keepEditing() {
    restoreInput.current = true;
    pendingNavigation.current = undefined;
    setView('create');
  }
  function discard() {
    dispatchAfterDiscard.current = true;
    setName('');
    setSelected([]);
    setSearch('');
    setError('');
    setView(editing ? 'detail' : 'collection');
  }

  async function save() {
    if (saving) return;
    const trimmedName = name.trim();
    if (trimmedName.length < 1 || trimmedName.length > 100) {
      setError('Use 1–100 characters for the name after trimming spaces.');
      return;
    }
    if (!selected.some(person => person.available)) {
      setError('Choose at least one existing Groupi person.');
      return;
    }
    if (selected.length > 100) {
      setError('An invite list can contain at most 100 people.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const values = {
        name: name.trim(),
        personIds: selected.map(person => person.personId),
      };
      const saved =
        editing && listId
          ? await updateList({ inviteListId: listId, ...values })
          : await createList(values);
      setListId(saved.inviteListId);
      setDetailName(saved.name);
      setView('detail');
      setName('');
      setSelected([]);
      setSearch('');
    } catch (error) {
      let data: unknown = error instanceof ConvexError ? error.data : undefined;
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch {
          data = undefined;
        }
      }
      setError(
        data &&
          typeof data === 'object' &&
          'code' in data &&
          data.code === 'CONFLICT'
          ? 'You already have an invite list with this name. Choose another name.'
          : 'Unable to save invite list. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function removeList() {
    if (!listId || saving) return;
    setSaving(true);
    setError('');
    try {
      await deleteList({ inviteListId: listId });
      setView('collection');
      setListId(undefined);
      setName('');
      setSelected([]);
      setEditing(false);
    } catch {
      setError('Unable to delete invite list. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView className='flex-1 bg-background'>
      <Stack.Screen
        options={{
          gestureEnabled: view === 'collection' || view === 'detail',
          headerBackButtonMenuEnabled: false,
        }}
      />
      <View className='flex-row items-center px-4 py-3'>
        <BackButton
          onPress={
            view === 'collection'
              ? undefined
              : view === 'create'
                ? leaveEditor
                : view === 'confirm'
                  ? keepEditing
                  : view === 'delete'
                    ? () => {
                        if (!saving) {
                          setError('');
                          setView('detail');
                        }
                      }
                    : () => setView('collection')
          }
        />
        <Text
          ref={heading}
          accessible
          accessibilityRole='header'
          className='flex-1 text-lg font-semibold text-foreground'
        >
          {view === 'create'
            ? editing
              ? 'Edit invite list'
              : 'Create invite list'
            : view === 'confirm'
              ? 'Discard changes?'
              : view === 'delete'
                ? 'Delete invite list?'
                : view === 'detail'
                  ? detailName
                  : 'Invite lists'}
        </Text>
      </View>
      <ScrollView
        className='flex-1'
        contentContainerClassName='gap-4 px-4 pb-8'
        keyboardShouldPersistTaps='handled'
      >
        <Text className='text-sm text-muted-foreground'>
          Private to you. Saving a list does not invite or notify anyone.
        </Text>
        {view === 'collection' ? (
          <InviteListDataBoundary key='collection' context='invite lists'>
            <InviteListCollection
              onCreate={() => {
                setEditing(false);
                setName('');
                setSelected([]);
                setSearch('');
                setError('');
                baseline.current = { name: '', personIds: [] };
                setView('create');
              }}
              onOpen={list => {
                setListId(list.inviteListId);
                setDetailName(list.name);
                setView('detail');
              }}
            />
          </InviteListDataBoundary>
        ) : view === 'detail' ? (
          <InviteListDataBoundary key={listId} context='invite list'>
            <InviteListDetail
              listId={listId}
              onEdit={list => {
                const people = list.people;
                setEditing(true);
                setName(list.name);
                setSelected(people);
                setSearch('');
                setError('');
                baseline.current = {
                  name: list.name,
                  personIds: people.map(person => person.personId),
                };
                setView('create');
              }}
              onDelete={() => {
                setError('');
                setView('delete');
              }}
            />
          </InviteListDataBoundary>
        ) : view === 'delete' ? (
          <>
            <Text>
              Delete “{detailName}”? Existing invitations and events will remain
              unchanged.
            </Text>
            {error ? (
              <Text accessibilityRole='alert' className='text-destructive'>
                {error}
              </Text>
            ) : null}
            <Button
              accessibilityLabel='Keep invite list'
              variant='outline'
              disabled={saving}
              onPress={() => {
                setError('');
                setView('detail');
              }}
            >
              Keep invite list
            </Button>
            <Button
              accessibilityLabel='Confirm delete invite list'
              variant='destructive'
              isLoading={saving}
              loadingText='Deleting…'
              onPress={() => void removeList()}
            >
              Delete invite list
            </Button>
          </>
        ) : view === 'confirm' ? (
          <>
            <Text>Your invite list has unsaved changes.</Text>
            <Button accessibilityLabel='Keep Editing' onPress={keepEditing}>
              Keep Editing
            </Button>
            <Button
              accessibilityLabel='Discard'
              variant='destructive'
              onPress={discard}
            >
              Discard
            </Button>
          </>
        ) : (
          <>
            <Text className='font-semibold'>List name</Text>
            <Input
              ref={nameInput}
              accessibilityLabel='List name'
              value={name}
              onChangeText={setName}
              onFocus={() => {
                lastInput.current = 'name';
              }}
              editable={!saving}
            />
            <Text className='font-semibold'>
              Selected people ({selected.length}/100)
            </Text>
            {selected.length >= 100 ? (
              <Text accessibilityRole='alert'>
                An invite list can contain at most 100 people. Remove someone to
                choose another person.
              </Text>
            ) : null}
            <InviteListDataBoundary context='selected people'>
              <InviteListSelectedPeople
                personIds={selected.map(person => person.personId)}
                locked={saving}
                onRemove={personId =>
                  setSelected(previous =>
                    previous.filter(person => person.personId !== personId)
                  )
                }
              />
            </InviteListDataBoundary>
            <Text className='font-semibold'>Search by username</Text>
            <Input
              ref={searchInput}
              accessibilityLabel='Search by username'
              value={search}
              onChangeText={setSearch}
              onFocus={() => {
                lastInput.current = 'search';
              }}
              autoCapitalize='none'
              editable={!saving}
            />
            <InviteListDataBoundary
              key={search.trim().length >= 2 ? 'search' : 'friends'}
              context='people'
            >
              <InviteListPeople
                search={search}
                selected={selected}
                saving={saving}
                onToggle={person =>
                  setSelected(items =>
                    items.some(item => item.personId === person.personId)
                      ? items.filter(item => item.personId !== person.personId)
                      : items.length >= 100
                        ? items
                        : [...items, person]
                  )
                }
              />
            </InviteListDataBoundary>
            {error ? (
              <Text accessibilityRole='alert' className='text-destructive'>
                {error}
              </Text>
            ) : null}
            <Button
              accessibilityLabel='Save invite list'
              isLoading={saving}
              loadingText='Saving…'
              onPress={() => void save()}
            >
              Save invite list
            </Button>
            <Button
              accessibilityLabel='Cancel'
              variant='outline'
              disabled={saving}
              onPress={leaveEditor}
            >
              Cancel
            </Button>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function InviteListCollection({
  onCreate,
  onOpen,
}: {
  onCreate: () => void;
  onOpen: (list: ListSummary) => void;
}) {
  const collection = useInviteLists();
  if (collection === undefined)
    return <ActivityIndicator accessibilityLabel='Loading invite lists' />;
  return (
    <>
      <Text className='text-sm text-muted-foreground'>
        {collection.items.length}/100 invite lists
      </Text>
      <Button
        accessibilityLabel='Create invite list'
        disabled={collection.items.length >= 100}
        accessibilityState={{ disabled: collection.items.length >= 100 }}
        onPress={onCreate}
      >
        Create invite list
      </Button>
      {collection.items.length >= 100 ? (
        <Text accessibilityRole='alert'>
          You can create at most 100 invite lists.
        </Text>
      ) : null}
      {collection.items.length === 0 ? (
        <Text>No invite lists yet</Text>
      ) : (
        collection.items.map(list => (
          <Pressable
            key={list.inviteListId}
            accessibilityRole='button'
            accessibilityLabel={`Open ${list.name}`}
            accessibilityHint={`${list.availablePersonCount} people${list.needsAttention ? '. Needs attention' : ''}`}
            onPress={() => onOpen(list)}
            className='min-h-[44px] gap-1 rounded-card border border-border bg-card p-4'
          >
            <Text className='font-semibold'>{list.name}</Text>
            <Text className='text-sm text-muted-foreground'>
              {list.availablePersonCount} people
              {list.needsAttention ? ' · Needs attention' : ''}
            </Text>
          </Pressable>
        ))
      )}
    </>
  );
}

function InviteListDetail({
  listId,
  onEdit,
  onDelete,
}: {
  listId?: ListId;
  onEdit: (list: NonNullable<ReturnType<typeof useInviteList>>) => void;
  onDelete: () => void;
}) {
  const detail = useInviteList(listId);
  if (detail === undefined)
    return <ActivityIndicator accessibilityLabel='Loading invite list' />;
  return (
    <>
      <Button
        accessibilityLabel='Edit invite list'
        onPress={() => onEdit(detail)}
      >
        Edit invite list
      </Button>
      <Button
        accessibilityLabel='Delete invite list'
        variant='outline'
        onPress={onDelete}
      >
        Delete invite list
      </Button>
      <Text>{detail.availablePersonCount} available people</Text>
      {detail.needsAttention ? (
        <Text>Needs attention. No available people remain.</Text>
      ) : null}
      {detail.people.map(person => (
        <View key={person.personId} className='gap-1 rounded-card bg-card p-4'>
          <Text>
            {person.available
              ? (person.name ?? person.username ?? 'Groupi person')
              : 'Unavailable person'}
          </Text>
          {person.available && person.username ? (
            <Text className='text-sm text-muted-foreground'>
              @{person.username}
            </Text>
          ) : null}
        </View>
      ))}
    </>
  );
}
