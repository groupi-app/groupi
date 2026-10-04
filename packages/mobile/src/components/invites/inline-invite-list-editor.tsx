import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  BackHandler,
  findNodeHandle,
  Keyboard,
  View,
  type Text as NativeText,
  type TextInput,
} from 'react-native';
import { Stack, useFocusEffect } from 'expo-router';
import { usePreventRemove } from '@react-navigation/native';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { InviteListDataBoundary } from '@/components/settings/invite-list-data-boundary';
import { useCreateInviteList, useInviteLists } from '@/hooks/use-invite-lists';
import { InvitePanelScrollView } from './invite-panel-shell';
import { InviteListSelectedPeople } from './invite-list-selected-people';
import { InviteListPeople, type Person } from './invite-list-people';
import type { SavedListDetail } from './from-list-panel';

export function InlineInviteListEditor({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: (list: SavedListDetail, use: boolean) => void;
}) {
  const [name, setName] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Person[]>([]);
  const [confirm, setConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const savingRef = useRef(false);
  const createList = useCreateInviteList();
  const heading = useRef<NativeText>(null);
  const nameInput = useRef<TextInput>(null);
  const searchInput = useRef<TextInput>(null);
  const lastInput = useRef<'name' | 'search'>('name');
  const restoreInput = useRef(false);
  const dirty = name.length > 0 || search.length > 0 || selected.length > 0;
  const leave = useCallback(() => {
    if (savingRef.current) return;
    if (dirty) {
      Keyboard.dismiss();
      setConfirm(true);
    } else onClose();
  }, [dirty, onClose]);
  const keepEditing = useCallback(() => {
    restoreInput.current = true;
    setConfirm(false);
  }, []);
  usePreventRemove(true, () => leave());
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          if (confirm) keepEditing();
          else leave();
          return true;
        }
      );
      return () => subscription.remove();
    }, [confirm, leave, keepEditing])
  );
  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(
      confirm ? 'Discard changes?' : 'Create invite list'
    );
    const frame = requestAnimationFrame(() => {
      const target =
        !confirm && restoreInput.current
          ? lastInput.current === 'search'
            ? searchInput.current
            : nameInput.current
          : heading.current;
      if (!confirm && restoreInput.current) {
        restoreInput.current = false;
        (lastInput.current === 'search'
          ? searchInput.current
          : nameInput.current
        )?.focus();
      }
      const handle = findNodeHandle(target);
      if (handle !== null) AccessibilityInfo.setAccessibilityFocus(handle);
    });
    return () => cancelAnimationFrame(frame);
  }, [confirm]);
  async function save(use: boolean) {
    if (savingRef.current) return;
    const label = name.trim();
    if (!label.length || label.length > 100) {
      setError('Use 1–100 characters for the name after trimming spaces.');
      return;
    }
    if (!selected.length || selected.length > 100) {
      setError('Choose 1–100 existing Groupi people.');
      return;
    }
    savingRef.current = true;
    setSaving(true);
    setError('');
    try {
      const result = await createList({
        name: label,
        personIds: selected.map(person => person.personId),
      });
      onSaved(result, use);
    } catch {
      setError(
        'Unable to save invite list. Your draft has been kept. Please try again.'
      );
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }
  return (
    <>
      <Stack.Screen
        options={{ gestureEnabled: false, headerBackButtonMenuEnabled: false }}
      />
      <View className='flex-row items-center px-4 py-3'>
        <BackButton onPress={confirm ? keepEditing : leave} />
        <Text
          ref={heading}
          accessible
          accessibilityRole='header'
          className='text-lg font-semibold'
        >
          {confirm ? 'Discard changes?' : 'Create invite list'}
        </Text>
      </View>
      <InvitePanelScrollView>
        {confirm ? (
          <>
            <Text>
              Your invite list has unsaved changes. Your invitation draft will
              be kept.
            </Text>
            <Button accessibilityLabel='Keep Editing' onPress={keepEditing}>
              Keep Editing
            </Button>
            <Button
              accessibilityLabel='Discard'
              variant='destructive'
              onPress={onClose}
            >
              Discard
            </Button>
          </>
        ) : (
          <>
            <Text>
              Private to you. Saving does not send invitations or notify anyone.
            </Text>
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
            <Input
              ref={searchInput}
              accessibilityLabel='Search by username'
              value={search}
              onChangeText={setSearch}
              onFocus={() => {
                lastInput.current = 'search';
              }}
              editable={!saving}
              autoCapitalize='none'
            />
            <InviteListDataBoundary context='people'>
              <InviteListPeople
                search={search}
                selected={selected}
                saving={saving}
                onToggle={person =>
                  setSelected(previous =>
                    previous.some(item => item.personId === person.personId)
                      ? previous.filter(
                          item => item.personId !== person.personId
                        )
                      : previous.length >= 100
                        ? previous
                        : [...previous, person]
                  )
                }
              />
            </InviteListDataBoundary>
            {error ? (
              <Text
                accessibilityRole='alert'
                accessibilityLiveRegion='polite'
                className='text-destructive'
              >
                {error}
              </Text>
            ) : null}
            <InviteListDataBoundary context='list save options'>
              <InlineSaveOptions
                name={name}
                saving={saving}
                onSave={use => void save(use)}
              />
            </InviteListDataBoundary>
            <Button
              accessibilityLabel='Cancel'
              variant='outline'
              disabled={saving}
              onPress={leave}
            >
              Cancel
            </Button>
          </>
        )}
      </InvitePanelScrollView>
    </>
  );
}
function InlineSaveOptions({
  name,
  saving,
  onSave,
}: {
  name: string;
  saving: boolean;
  onSave: (use: boolean) => void;
}) {
  const lists = useInviteLists();
  const duplicate = lists?.items.some(
    list => list.name.toLowerCase() === name.trim().toLowerCase()
  );
  const full = (lists?.items.length ?? 0) >= 100;
  const disabled = lists === undefined || duplicate || full || saving;
  return (
    <>
      {lists === undefined ? (
        <Text>Loading list save options…</Text>
      ) : duplicate ? (
        <Text accessibilityRole='alert'>
          You already have an invite list with this name. Choose another name.
        </Text>
      ) : full ? (
        <Text accessibilityRole='alert'>
          You can create at most 100 invite lists.
        </Text>
      ) : null}
      <Button
        accessibilityLabel='Save'
        disabled={disabled}
        isLoading={saving}
        loadingText='Saving…'
        onPress={() => onSave(false)}
      >
        Save
      </Button>
      <Button
        accessibilityLabel='Save and use'
        disabled={disabled}
        variant='outline'
        onPress={() => onSave(true)}
      >
        Save and use
      </Button>
    </>
  );
}
