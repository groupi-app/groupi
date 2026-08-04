import { useState, useCallback } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Ionicons } from '@expo/vector-icons';
import { useCSSVariable } from 'uniwind';
import { cn } from '@/lib/utils';
import { useAction } from 'convex/react';

import {
  useCreateEventForm,
  type FormState,
} from '@/context/create-event-context';

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const { api } = require('convex/_generated/api') as { api: any };

// ─── Types ──────────────────────────────────────────────────────────────────

interface AddonDefinition {
  id: string;
  name: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  isEnabled: (state: FormState) => boolean;
  onEnable: (state: FormState) => Partial<FormState>;
  onDisable: (state: FormState) => Partial<FormState>;
}

type ReminderOffset =
  | '30_MINUTES'
  | '1_HOUR'
  | '2_HOURS'
  | '4_HOURS'
  | '1_DAY'
  | '2_DAYS'
  | '3_DAYS'
  | '1_WEEK'
  | '2_WEEKS'
  | '4_WEEKS';

interface BringListItem {
  id: string;
  name: string;
  quantity: number;
}

type QuestionType =
  | 'SHORT_ANSWER'
  | 'LONG_ANSWER'
  | 'MULTIPLE_CHOICE'
  | 'CHECKBOXES'
  | 'NUMBER'
  | 'DROPDOWN'
  | 'YES_NO';

interface Question {
  id: string;
  label: string;
  type: QuestionType;
  required: boolean;
  options?: string[];
}

// ─── Addon Definitions ──────────────────────────────────────────────────────

const ADDONS: AddonDefinition[] = [
  {
    id: 'reminders',
    name: 'Reminders',
    description: 'Notify attendees before the event starts.',
    icon: 'notifications-outline',
    isEnabled: s => s.addonConfigs.reminders !== undefined,
    onEnable: s => ({
      addonConfigs: {
        ...s.addonConfigs,
        reminders: { reminderOffset: '1_DAY' },
      },
    }),
    onDisable: s => {
      const { reminders: _, ...rest } = s.addonConfigs;
      return { addonConfigs: rest };
    },
  },
  {
    id: 'bring-list',
    name: 'Bring List',
    description: 'Coordinate items attendees should bring.',
    icon: 'list-outline',
    isEnabled: s => s.addonConfigs['bring-list'] !== undefined,
    onEnable: s => ({
      addonConfigs: { ...s.addonConfigs, 'bring-list': { items: [] } },
    }),
    onDisable: s => {
      const { 'bring-list': _, ...rest } = s.addonConfigs;
      return { addonConfigs: rest };
    },
  },
  {
    id: 'questionnaire',
    name: 'Questionnaire',
    description: 'Ask attendees questions before the event.',
    icon: 'help-circle-outline',
    isEnabled: s => s.addonConfigs.questionnaire !== undefined,
    onEnable: s => ({
      addonConfigs: {
        ...s.addonConfigs,
        questionnaire: { questions: [] },
      },
    }),
    onDisable: s => {
      const { questionnaire: _, ...rest } = s.addonConfigs;
      return { addonConfigs: rest };
    },
  },
  {
    id: 'discord',
    name: 'Discord',
    description: 'Sync event with a Discord server.',
    icon: 'logo-discord',
    isEnabled: s => s.addonConfigs.discord !== undefined,
    onEnable: s => ({
      addonConfigs: {
        ...s.addonConfigs,
        discord: { guildId: '', guildName: '' },
      },
    }),
    onDisable: s => {
      const { discord: _, ...rest } = s.addonConfigs;
      return { addonConfigs: rest };
    },
  },
];

// ─── Reminder Offset Options ────────────────────────────────────────────────

const REMINDER_OPTIONS: { value: ReminderOffset; label: string }[] = [
  { value: '30_MINUTES', label: '30 minutes before' },
  { value: '1_HOUR', label: '1 hour before' },
  { value: '2_HOURS', label: '2 hours before' },
  { value: '4_HOURS', label: '4 hours before' },
  { value: '1_DAY', label: '1 day before' },
  { value: '2_DAYS', label: '2 days before' },
  { value: '3_DAYS', label: '3 days before' },
  { value: '1_WEEK', label: '1 week before' },
  { value: '2_WEEKS', label: '2 weeks before' },
  { value: '4_WEEKS', label: '4 weeks before' },
];

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: 'SHORT_ANSWER', label: 'Short Answer' },
  { value: 'LONG_ANSWER', label: 'Long Answer' },
  { value: 'MULTIPLE_CHOICE', label: 'Multiple Choice' },
  { value: 'CHECKBOXES', label: 'Checkboxes' },
  { value: 'NUMBER', label: 'Number' },
  { value: 'DROPDOWN', label: 'Dropdown' },
  { value: 'YES_NO', label: 'Yes / No' },
];

const CHOICE_TYPES: QuestionType[] = [
  'MULTIPLE_CHOICE',
  'CHECKBOXES',
  'DROPDOWN',
];

// ─── Main Component ─────────────────────────────────────────────────────────

interface AddonsStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function AddonsStep({ onNext, onBack }: AddonsStepProps) {
  const { formState, updateFormState } = useCreateEventForm();
  const primaryColor = String(useCSSVariable('--color-primary') ?? '#8200AD');

  const handleToggle = useCallback(
    (addon: AddonDefinition, enabled: boolean) => {
      const patch = enabled
        ? addon.onEnable(formState)
        : addon.onDisable(formState);
      updateFormState(patch);
    },
    [formState, updateFormState]
  );

  return (
    <ScrollView className='flex-1 px-4' contentContainerClassName='pb-8'>
      <View className='gap-5'>
        <View className='mt-2 gap-1'>
          <Text className='text-2xl font-bold text-foreground'>Add-ons</Text>
          <Text className='text-sm text-muted-foreground'>
            Enable optional features for your event.
          </Text>
        </View>

        {ADDONS.map(addon => {
          const enabled = addon.isEnabled(formState);
          return (
            <View
              key={addon.id}
              className='gap-3 rounded-card border border-border bg-card p-4'
            >
              <View className='flex-row items-center justify-between'>
                <View className='flex-1 flex-row items-center gap-3'>
                  <Ionicons
                    name={addon.icon}
                    size={22}
                    color={enabled ? primaryColor : '#9ca3af'}
                  />
                  <View className='flex-1'>
                    <Text className='font-semibold text-foreground'>
                      {addon.name}
                    </Text>
                    <Text className='text-xs text-muted-foreground'>
                      {addon.description}
                    </Text>
                  </View>
                </View>
                <Switch
                  checked={enabled}
                  onCheckedChange={v => handleToggle(addon, v)}
                />
              </View>

              {enabled ? (
                <AddonConfig
                  addonId={addon.id}
                  formState={formState}
                  updateFormState={updateFormState}
                />
              ) : null}
            </View>
          );
        })}

        <View className='mt-2 flex-row gap-3'>
          <Button variant='outline' onPress={onBack} className='flex-1'>
            Back
          </Button>
          <Button onPress={onNext} className='flex-1'>
            Next
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}

// ─── Config Router ──────────────────────────────────────────────────────────

function AddonConfig({
  addonId,
  formState,
  updateFormState,
}: {
  addonId: string;
  formState: FormState;
  updateFormState: (patch: Partial<FormState>) => void;
}) {
  switch (addonId) {
    case 'reminders':
      return (
        <ReminderConfig
          formState={formState}
          updateFormState={updateFormState}
        />
      );
    case 'bring-list':
      return (
        <BringListConfig
          formState={formState}
          updateFormState={updateFormState}
        />
      );
    case 'questionnaire':
      return (
        <QuestionnaireConfig
          formState={formState}
          updateFormState={updateFormState}
        />
      );
    case 'discord':
      return (
        <DiscordConfig
          formState={formState}
          updateFormState={updateFormState}
        />
      );
    default:
      return null;
  }
}

// ─── Reminder Config ────────────────────────────────────────────────────────

function ReminderConfig({
  formState,
  updateFormState,
}: {
  formState: FormState;
  updateFormState: (patch: Partial<FormState>) => void;
}) {
  const current =
    (formState.addonConfigs.reminders?.reminderOffset as ReminderOffset) ??
    '1_DAY';

  function handleSelect(offset: ReminderOffset) {
    updateFormState({
      addonConfigs: {
        ...formState.addonConfigs,
        reminders: { reminderOffset: offset },
      },
    });
  }

  return (
    <View className='gap-2'>
      <Text className='text-sm font-medium text-foreground'>
        Remind attendees
      </Text>
      <View className='flex-row flex-wrap gap-2'>
        {REMINDER_OPTIONS.map(opt => {
          const isActive = current === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => handleSelect(opt.value)}
              className={cn(
                'rounded-badge px-3 py-1.5',
                isActive
                  ? 'border-2 border-white bg-primary shadow-raised'
                  : 'bg-muted'
              )}
            >
              <Text
                className={cn(
                  'text-xs font-medium',
                  isActive ? 'text-white' : 'text-muted-foreground'
                )}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ─── Bring List Config ──────────────────────────────────────────────────────

function BringListConfig({
  formState,
  updateFormState,
}: {
  formState: FormState;
  updateFormState: (patch: Partial<FormState>) => void;
}) {
  const items = (formState.addonConfigs['bring-list']?.items ??
    []) as BringListItem[];
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newQty, setNewQty] = useState('1');

  function updateItems(updated: BringListItem[]) {
    updateFormState({
      addonConfigs: {
        ...formState.addonConfigs,
        'bring-list': { items: updated },
      },
    });
  }

  function handleAdd() {
    if (!newName.trim()) return;
    const qty = Math.max(1, Math.min(999, parseInt(newQty, 10) || 1));
    updateItems([
      ...items,
      { id: Date.now().toString(), name: newName.trim(), quantity: qty },
    ]);
    setNewName('');
    setNewQty('1');
    setIsAdding(false);
  }

  function handleRemove(id: string) {
    updateItems(items.filter(i => i.id !== id));
  }

  return (
    <View className='gap-3'>
      {items.length > 0 ? (
        <View className='gap-2'>
          {items.map(item => (
            <View
              key={item.id}
              className='flex-row items-center justify-between rounded-input bg-muted px-3 py-2'
            >
              <Text className='text-sm text-foreground'>
                {item.name} x{item.quantity}
              </Text>
              <Pressable onPress={() => handleRemove(item.id)}>
                <Ionicons name='close-circle' size={20} color='#9ca3af' />
              </Pressable>
            </View>
          ))}
        </View>
      ) : (
        <Text className='text-sm text-muted-foreground'>
          No items yet. Add items for attendees to bring.
        </Text>
      )}

      {isAdding ? (
        <View className='gap-2 rounded-input border border-border p-3'>
          <Input
            placeholder='Item name'
            value={newName}
            onChangeText={setNewName}
          />
          <View className='flex-row items-center gap-2'>
            <Text className='text-sm text-muted-foreground'>Qty:</Text>
            <Input
              className='w-16'
              keyboardType='number-pad'
              value={newQty}
              onChangeText={setNewQty}
            />
          </View>
          <View className='flex-row gap-2'>
            <Button
              variant='outline'
              size='sm'
              onPress={() => setIsAdding(false)}
              className='flex-1'
            >
              Cancel
            </Button>
            <Button size='sm' onPress={handleAdd} className='flex-1'>
              Add
            </Button>
          </View>
        </View>
      ) : (
        <Button variant='outline' size='sm' onPress={() => setIsAdding(true)}>
          Add Item
        </Button>
      )}
    </View>
  );
}

// ─── Questionnaire Config ───────────────────────────────────────────────────

function QuestionnaireConfig({
  formState,
  updateFormState,
}: {
  formState: FormState;
  updateFormState: (patch: Partial<FormState>) => void;
}) {
  const questions = (formState.addonConfigs.questionnaire?.questions ??
    []) as Question[];
  const [isAdding, setIsAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState<QuestionType>('SHORT_ANSWER');
  const [newRequired, setNewRequired] = useState(true);
  const [newOptions, setNewOptions] = useState<string[]>(['', '']);

  function updateQuestions(updated: Question[]) {
    updateFormState({
      addonConfigs: {
        ...formState.addonConfigs,
        questionnaire: { questions: updated },
      },
    });
  }

  function handleAdd() {
    if (!newLabel.trim()) return;
    const question: Question = {
      id: Date.now().toString(),
      label: newLabel.trim(),
      type: newType,
      required: newRequired,
    };
    if (CHOICE_TYPES.includes(newType)) {
      question.options = newOptions
        .map(o => o.trim())
        .filter(o => o.length > 0);
    }
    updateQuestions([...questions, question]);
    setNewLabel('');
    setNewType('SHORT_ANSWER');
    setNewRequired(true);
    setNewOptions(['', '']);
    setIsAdding(false);
  }

  function handleRemove(id: string) {
    updateQuestions(questions.filter(q => q.id !== id));
  }

  return (
    <View className='gap-3'>
      {questions.length > 0 ? (
        <View className='gap-2'>
          {questions.map(q => (
            <View
              key={q.id}
              className='flex-row items-center justify-between rounded-input bg-muted px-3 py-2'
            >
              <View className='flex-1 gap-0.5'>
                <Text className='text-sm text-foreground'>{q.label}</Text>
                <View className='flex-row items-center gap-2'>
                  <Text className='text-xs text-muted-foreground'>
                    {QUESTION_TYPES.find(t => t.value === q.type)?.label}
                  </Text>
                  {q.required ? (
                    <Badge variant='secondary' className='py-0'>
                      <Text className='text-[10px]'>Required</Text>
                    </Badge>
                  ) : null}
                </View>
              </View>
              <Pressable onPress={() => handleRemove(q.id)}>
                <Ionicons name='close-circle' size={20} color='#9ca3af' />
              </Pressable>
            </View>
          ))}
        </View>
      ) : (
        <Text className='text-sm text-muted-foreground'>
          No questions yet. Add questions for attendees to answer.
        </Text>
      )}

      {isAdding ? (
        <View className='gap-3 rounded-input border border-border p-3'>
          <Input
            placeholder='Question'
            value={newLabel}
            onChangeText={setNewLabel}
          />

          {/* Type selector */}
          <View className='gap-1'>
            <Text className='text-sm font-medium text-foreground'>Type</Text>
            <View className='flex-row flex-wrap gap-1.5'>
              {QUESTION_TYPES.map(t => {
                const isActive = newType === t.value;
                return (
                  <Pressable
                    key={t.value}
                    onPress={() => setNewType(t.value)}
                    className={cn(
                      'rounded-badge px-2.5 py-1',
                      isActive
                        ? 'border-2 border-white bg-primary shadow-raised'
                        : 'bg-muted'
                    )}
                  >
                    <Text
                      className={cn(
                        'text-xs font-medium',
                        isActive ? 'text-white' : 'text-muted-foreground'
                      )}
                    >
                      {t.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Options for choice types */}
          {CHOICE_TYPES.includes(newType) ? (
            <View className='gap-2'>
              <Text className='text-sm font-medium text-foreground'>
                Options
              </Text>
              {newOptions.map((opt, i) => (
                <View key={i} className='flex-row items-center gap-2'>
                  <Input
                    className='flex-1'
                    placeholder={`Option ${i + 1}`}
                    value={opt}
                    onChangeText={v => {
                      const updated = [...newOptions];
                      updated[i] = v;
                      setNewOptions(updated);
                    }}
                  />
                  {newOptions.length > 2 ? (
                    <Pressable
                      onPress={() =>
                        setNewOptions(newOptions.filter((_, j) => j !== i))
                      }
                    >
                      <Ionicons name='close-circle' size={20} color='#9ca3af' />
                    </Pressable>
                  ) : null}
                </View>
              ))}
              <Button
                variant='outline'
                size='sm'
                onPress={() => setNewOptions([...newOptions, ''])}
              >
                Add Option
              </Button>
            </View>
          ) : null}

          {/* Required toggle */}
          <View className='flex-row items-center justify-between'>
            <Text className='text-sm text-foreground'>Required</Text>
            <Switch checked={newRequired} onCheckedChange={setNewRequired} />
          </View>

          <View className='flex-row gap-2'>
            <Button
              variant='outline'
              size='sm'
              onPress={() => setIsAdding(false)}
              className='flex-1'
            >
              Cancel
            </Button>
            <Button size='sm' onPress={handleAdd} className='flex-1'>
              Add
            </Button>
          </View>
        </View>
      ) : (
        <Button variant='outline' size='sm' onPress={() => setIsAdding(true)}>
          Add Question
        </Button>
      )}
    </View>
  );
}

// ─── Discord Config ─────────────────────────────────────────────────────────

interface Guild {
  id: string;
  name: string;
  icon: string | null;
  botInstalled: boolean;
}

function DiscordConfig({
  formState,
  updateFormState,
}: {
  formState: FormState;
  updateFormState: (patch: Partial<FormState>) => void;
}) {
  const [guilds, setGuilds] = useState<Guild[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const getGuilds = useAction(api.discord.actions.getAvailableGuilds);

  const selectedGuildId =
    (formState.addonConfigs.discord?.guildId as string) ?? '';

  async function fetchGuilds() {
    setLoading(true);
    setError(null);
    try {
      const result = await getGuilds({});
      setGuilds(result?.guilds ?? []);
    } catch {
      setError(
        'Failed to load Discord servers. Make sure your account is linked.'
      );
    } finally {
      setLoading(false);
    }
  }

  // Fetch on first render
  if (guilds === null && !loading && !error) {
    fetchGuilds();
  }

  function handleSelect(guild: Guild) {
    updateFormState({
      addonConfigs: {
        ...formState.addonConfigs,
        discord: { guildId: guild.id, guildName: guild.name },
      },
    });
  }

  if (loading) {
    return (
      <View className='items-center py-4'>
        <Text className='text-sm text-muted-foreground'>
          Loading Discord servers...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className='items-center gap-2 py-4'>
        <Text className='text-sm text-error'>{error}</Text>
        <Button variant='outline' size='sm' onPress={fetchGuilds}>
          Retry
        </Button>
      </View>
    );
  }

  const withBot = guilds?.filter(g => g.botInstalled) ?? [];
  const withoutBot = guilds?.filter(g => !g.botInstalled) ?? [];

  if (withBot.length === 0 && withoutBot.length === 0) {
    return (
      <View className='items-center py-4'>
        <Text className='text-sm text-muted-foreground'>
          No Discord servers found. Link your Discord account first.
        </Text>
      </View>
    );
  }

  return (
    <View className='gap-3'>
      {withBot.length > 0 ? (
        <View className='gap-2'>
          <Text className='text-sm font-medium text-foreground'>
            Select a server
          </Text>
          {withBot.map(guild => {
            const isSelected = selectedGuildId === guild.id;
            return (
              <Pressable
                key={guild.id}
                onPress={() => handleSelect(guild)}
                className={cn(
                  'flex-row items-center gap-3 rounded-input border-2 px-3 py-2.5',
                  isSelected ? 'border-primary bg-primary/5' : 'border-border'
                )}
              >
                <Text className='flex-1 text-sm text-foreground'>
                  {guild.name}
                </Text>
                {isSelected ? (
                  <Ionicons name='checkmark-circle' size={20} color='#8200AD' />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {withoutBot.length > 0 ? (
        <View className='gap-2'>
          <Text className='text-sm font-medium text-muted-foreground'>
            Add bot to more servers
          </Text>
          {withoutBot.map(guild => (
            <View
              key={guild.id}
              className='flex-row items-center gap-3 rounded-input border border-border px-3 py-2.5 opacity-60'
            >
              <Text className='flex-1 text-sm text-muted-foreground'>
                {guild.name}
              </Text>
              <Text className='text-xs text-muted-foreground'>
                Bot not added
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <Button variant='outline' size='sm' onPress={fetchGuilds}>
        Refresh
      </Button>
    </View>
  );
}
