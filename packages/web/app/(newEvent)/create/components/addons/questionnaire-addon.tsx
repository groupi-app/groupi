'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import {
  type AddonConfigProps,
  type EventCardProps,
  type ManageConfigProps,
  type AddonPageProps,
  registerAddon,
} from '../addon-registry';
import {
  useMyAddonData,
  useSetAddonData,
  useAddonData,
} from '@/hooks/convex/use-addons';
import {
  useEventHeaderData,
  useEventAttendeesData,
} from '@/hooks/convex/use-events';
import { useGlobalUser } from '@/context/global-user-context';
import { Id } from '@/convex/_generated/dataModel';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitialsFromName } from '@/lib/utils';
import { downloadFile, toCSV, toJSON } from '@/lib/export-utils';

// ===== Types =====

const QUESTION_TYPES = [
  'SHORT_ANSWER',
  'LONG_ANSWER',
  'MULTIPLE_CHOICE',
  'CHECKBOXES',
  'NUMBER',
  'DROPDOWN',
  'YES_NO',
] as const;

type QuestionType = (typeof QUESTION_TYPES)[number];

interface Question {
  id: string;
  label: string;
  type: QuestionType;
  required: boolean;
  options?: string[];
}

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  SHORT_ANSWER: 'Short Answer',
  LONG_ANSWER: 'Long Answer',
  MULTIPLE_CHOICE: 'Multiple Choice',
  CHECKBOXES: 'Checkboxes',
  NUMBER: 'Number',
  DROPDOWN: 'Dropdown',
  YES_NO: 'Yes / No',
};

const CHOICE_TYPES: QuestionType[] = [
  'MULTIPLE_CHOICE',
  'CHECKBOXES',
  'DROPDOWN',
];

// ===== Question Builder (shared between create + manage) =====

function QuestionBuilder({
  questions,
  onChange,
}: {
  questions: Question[];
  onChange: (questions: Question[]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState<QuestionType>('SHORT_ANSWER');
  const [newRequired, setNewRequired] = useState(true);
  const [newOptions, setNewOptions] = useState<string[]>(['']);

  const handleAdd = () => {
    if (!newLabel.trim()) return;

    const question: Question = {
      id: crypto.randomUUID(),
      label: newLabel.trim(),
      type: newType,
      required: newRequired,
    };

    if (CHOICE_TYPES.includes(newType)) {
      const validOptions = newOptions.filter(o => o.trim());
      if (validOptions.length === 0) return;
      question.options = validOptions;
    }

    onChange([...questions, question]);
    setNewLabel('');
    setNewType('SHORT_ANSWER');
    setNewRequired(true);
    setNewOptions(['']);
    setAdding(false);
  };

  const handleRemove = (id: string) => {
    onChange(questions.filter(q => q.id !== id));
  };

  return (
    <div className='space-y-3'>
      {questions.map(q => (
        <div
          key={q.id}
          className='flex items-center gap-2 p-3 bg-muted rounded-card'
        >
          <div className='flex-1 min-w-0'>
            <p className='text-sm font-medium truncate'>{q.label}</p>
            <p className='text-xs text-muted-foreground'>
              {QUESTION_TYPE_LABELS[q.type]}
              {q.required && ' (required)'}
              {q.options && ` — ${q.options.length} options`}
            </p>
          </div>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={() => handleRemove(q.id)}
            className='shrink-0'
          >
            <Icons.delete className='size-4 text-muted-foreground' />
          </Button>
        </div>
      ))}

      {adding ? (
        <div className='space-y-3 p-3 border rounded-card'>
          <Input
            placeholder='Question label'
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            autoFocus
          />
          <Select
            value={newType}
            onValueChange={v => {
              setNewType(v as QuestionType);
              if (CHOICE_TYPES.includes(v as QuestionType)) {
                setNewOptions(prev => (prev.length === 0 ? [''] : prev));
              }
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {QUESTION_TYPES.map(t => (
                <SelectItem key={t} value={t}>
                  {QUESTION_TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {CHOICE_TYPES.includes(newType) && (
            <div className='space-y-2'>
              <Label className='text-xs text-muted-foreground'>Options</Label>
              {newOptions.map((opt, i) => (
                <div key={i} className='flex gap-2'>
                  <Input
                    placeholder={`Option ${i + 1}`}
                    value={opt}
                    onChange={e => {
                      const updated = [...newOptions];
                      updated[i] = e.target.value;
                      setNewOptions(updated);
                    }}
                  />
                  {newOptions.length > 1 && (
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      onClick={() =>
                        setNewOptions(newOptions.filter((_, j) => j !== i))
                      }
                    >
                      <Icons.delete className='size-4' />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => setNewOptions([...newOptions, ''])}
              >
                Add option
              </Button>
            </div>
          )}

          <div className='flex items-center gap-2'>
            <Switch
              checked={newRequired}
              onCheckedChange={setNewRequired}
              id='question-required'
            />
            <Label htmlFor='question-required' className='text-sm'>
              Required
            </Label>
          </div>

          <div className='flex gap-2'>
            <Button type='button' size='sm' onClick={handleAdd}>
              Add
            </Button>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              onClick={() => setAdding(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={() => setAdding(true)}
          className='w-full'
        >
          <Icons.plus className='size-4 mr-1' />
          Add Question
        </Button>
      )}
    </div>
  );
}

// ===== Create Wizard Config =====

function QuestionnaireCreateConfig({
  formState,
  setFormState,
}: AddonConfigProps) {
  const questions: Question[] =
    (formState.addonConfigs?.questionnaire?.questions as Question[]) ?? [];

  const handleChange = (updated: Question[]) => {
    setFormState({
      ...formState,
      addonConfigs: {
        ...formState.addonConfigs,
        questionnaire: { questions: updated },
      },
    });
  };

  return (
    <div className='space-y-2'>
      <label className='text-sm font-medium leading-none'>
        Questions for attendees
      </label>
      <QuestionBuilder questions={questions} onChange={handleChange} />
      {questions.length === 0 && (
        <p className='text-sm text-muted-foreground'>
          Add at least one question to enable the questionnaire.
        </p>
      )}
    </div>
  );
}

// ===== Event Page Card =====

function QuestionnaireEventCard({ eventId }: EventCardProps) {
  const myData = useMyAddonData(eventId, 'questionnaire');
  const allData = useAddonData(eventId, 'questionnaire');
  const eventData = useEventHeaderData(eventId);
  const isOrganizer = eventData?.userMembership?.role === 'ORGANIZER';

  const hasResponse =
    myData &&
    myData.some((d: { key: string }) => d.key.startsWith('response:'));

  const responseCount = allData
    ? allData.filter((d: { key: string }) => d.key.startsWith('response:'))
        .length
    : 0;

  return (
    <Card className='rounded-card shadow-raised p-4 w-fit'>
      <div className='flex items-center gap-3'>
        <div className='flex items-center justify-center size-9 rounded-card bg-bg-info-subtle text-info shrink-0'>
          <Icons.listOrdered className='size-5' />
        </div>
        <div>
          <p className='font-medium'>Questionnaire</p>
          {isOrganizer ? (
            <p className='text-sm text-muted-foreground'>
              {responseCount} {responseCount === 1 ? 'response' : 'responses'}
            </p>
          ) : hasResponse ? (
            <p className='text-sm text-success'>Completed</p>
          ) : (
            <p className='text-sm text-muted-foreground'>
              Please fill out the questionnaire
            </p>
          )}
        </div>
        <Button variant='outline' size='sm' asChild className='shrink-0'>
          <a href={`/event/${eventId}/addon/questionnaire`}>
            {isOrganizer ? 'View Responses' : hasResponse ? 'Edit' : 'Fill Out'}
          </a>
        </Button>
      </div>
    </Card>
  );
}

// ===== Manage Page Config =====

function QuestionnaireManageConfig({
  config,
  onSave,
  onDisable,
  isSaving,
}: ManageConfigProps) {
  const currentQuestions = (config?.questions as Question[]) ?? [];
  const [questions, setQuestions] = useState<Question[]>(currentQuestions);
  const [enabled, setEnabled] = useState(config !== null);
  const [expanded, setExpanded] = useState(config !== null);

  useEffect(() => {
    const hasConfig = config !== null;
    setEnabled(hasConfig);
    setExpanded(hasConfig);
    if (hasConfig && config?.questions) {
      setQuestions(config.questions as Question[]);
    }
  }, [config]);

  useEffect(() => {
    setExpanded(enabled);
  }, [enabled]);

  const handleToggle = async (checked: boolean) => {
    setEnabled(checked);
    if (!checked) {
      await onDisable();
    } else if (questions.length > 0) {
      await onSave({ questions });
    }
  };

  const handleSaveQuestions = async () => {
    if (questions.length === 0) {
      toast.error('Add at least one question');
      return;
    }
    await onSave({ questions });
  };

  const hasChanges =
    JSON.stringify(questions) !== JSON.stringify(currentQuestions);

  return (
    <Card
      className={cn(
        'transition-all duration-normal',
        enabled && 'ring-2 ring-primary/30'
      )}
    >
      <div className='flex items-center gap-3 p-4'>
        <div className='flex size-10 shrink-0 items-center justify-center rounded-button bg-muted'>
          <Icons.listOrdered className='size-5 text-muted-foreground' />
        </div>
        <div className='flex-1 min-w-0'>
          <p className='text-sm font-medium leading-none'>Questionnaire</p>
          <p className='text-sm text-muted-foreground mt-1'>
            Ask attendees questions before the event
          </p>
        </div>
        {enabled && (
          <button
            type='button'
            onClick={() => setExpanded(prev => !prev)}
            className='shrink-0 p-1 rounded-md hover:bg-muted transition-colors duration-fast'
            aria-label={expanded ? 'Collapse settings' : 'Expand settings'}
          >
            <Icons.down
              className={cn(
                'size-4 text-muted-foreground transition-transform duration-normal',
                expanded && 'rotate-180'
              )}
            />
          </button>
        )}
        <Switch
          checked={enabled}
          onCheckedChange={handleToggle}
          disabled={isSaving}
          data-test='addon-toggle-questionnaire'
        />
      </div>
      <Collapsible open={enabled && expanded}>
        <CollapsibleContent>
          <div className='px-4 pb-4 pt-0 space-y-3'>
            <QuestionBuilder questions={questions} onChange={setQuestions} />
            {hasChanges && questions.length > 0 && (
              <>
                <p className='text-sm text-warning'>
                  Saving changes will reset all existing responses and notify
                  members.
                </p>
                <Button
                  type='button'
                  size='sm'
                  onClick={handleSaveQuestions}
                  disabled={isSaving}
                  isLoading={isSaving}
                >
                  Save Questions
                </Button>
              </>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// ===== Response Form =====

function QuestionnaireResponseForm({
  eventId,
  questions,
  existingResponse,
}: {
  eventId: Id<'events'>;
  questions: Question[];
  existingResponse: Record<string, unknown> | null;
}) {
  const router = useRouter();
  const { person } = useGlobalUser();
  const setAddonData = useSetAddonData();
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Pre-fill from existing response
  useEffect(() => {
    if (existingResponse) {
      setAnswers(existingResponse as Record<string, unknown>);
    }
  }, [existingResponse]);

  const updateAnswer = useCallback((questionId: string, value: unknown) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  }, []);

  const handleSubmit = async () => {
    // Validate required fields
    for (const q of questions) {
      if (!q.required) continue;
      const answer = answers[q.id];
      if (answer === undefined || answer === null || answer === '') {
        toast.error(`Please answer: ${q.label}`);
        return;
      }
      if (
        q.type === 'CHECKBOXES' &&
        Array.isArray(answer) &&
        answer.length === 0
      ) {
        toast.error(`Please select at least one option for: ${q.label}`);
        return;
      }
    }

    if (!person) return;

    setIsSaving(true);
    try {
      await setAddonData(
        eventId,
        'questionnaire',
        `response:${person._id}`,
        answers
      );
      toast.success('Questionnaire submitted');
      router.push(`/event/${eventId}`);
    } catch {
      toast.error('Failed to submit questionnaire');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className='space-y-6'>
      {questions.map(q => (
        <div key={q.id} className='space-y-2'>
          <Label className='text-sm font-medium'>
            {q.label}
            {q.required && <span className='text-error ml-1'>*</span>}
          </Label>
          <QuestionInput
            question={q}
            value={answers[q.id]}
            onChange={v => updateAnswer(q.id, v)}
          />
        </div>
      ))}

      <Button
        type='button'
        onClick={handleSubmit}
        isLoading={isSaving}
        disabled={isSaving}
      >
        {existingResponse ? 'Update Response' : 'Submit'}
      </Button>
    </div>
  );
}

function QuestionInput({
  question,
  value,
  onChange,
}: {
  question: Question;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  switch (question.type) {
    case 'SHORT_ANSWER':
      return (
        <Input
          value={(value as string) ?? ''}
          onChange={e => onChange(e.target.value)}
          placeholder='Your answer'
        />
      );

    case 'LONG_ANSWER':
      return (
        <Textarea
          value={(value as string) ?? ''}
          onChange={e => onChange(e.target.value)}
          placeholder='Your answer'
          rows={3}
        />
      );

    case 'NUMBER':
      return (
        <Input
          type='number'
          value={value !== undefined && value !== null ? String(value) : ''}
          onChange={e => {
            const v = e.target.value;
            onChange(v === '' ? undefined : Number(v));
          }}
          placeholder='0'
        />
      );

    case 'MULTIPLE_CHOICE':
      return (
        <div className='flex flex-col gap-2'>
          {question.options?.map(opt => (
            <button
              key={opt}
              type='button'
              onClick={() => onChange(opt)}
              className={cn(
                'text-left px-3 py-2 rounded-button border transition-colors duration-fast text-sm',
                value === opt
                  ? 'border-primary bg-primary/10 text-primary font-medium'
                  : 'border-border hover:bg-muted'
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      );

    case 'CHECKBOXES': {
      const selected = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div className='flex flex-col gap-2'>
          {question.options?.map(opt => (
            <label
              key={opt}
              className='flex items-center gap-2 cursor-pointer text-sm'
            >
              <Checkbox
                checked={selected.includes(opt)}
                onCheckedChange={checked => {
                  const next = checked
                    ? [...selected, opt]
                    : selected.filter(s => s !== opt);
                  onChange(next);
                }}
              />
              {opt}
            </label>
          ))}
        </div>
      );
    }

    case 'DROPDOWN':
      return (
        <Select
          value={(value as string) ?? ''}
          onValueChange={v => onChange(v)}
        >
          <SelectTrigger>
            <SelectValue placeholder='Select an option' />
          </SelectTrigger>
          <SelectContent>
            {question.options?.map(opt => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case 'YES_NO':
      return (
        <div className='flex gap-2'>
          <Button
            type='button'
            variant={value === true ? 'default' : 'outline'}
            size='sm'
            onClick={() => onChange(true)}
          >
            Yes
          </Button>
          <Button
            type='button'
            variant={value === false ? 'default' : 'outline'}
            size='sm'
            onClick={() => onChange(false)}
          >
            No
          </Button>
        </div>
      );

    default:
      return null;
  }
}

// ===== All Responses Table (organizer view) =====

function AllResponsesView({
  eventId,
  questions,
}: {
  eventId: Id<'events'>;
  questions: Question[];
}) {
  const allData = useAddonData(eventId, 'questionnaire');
  const attendeesData = useEventAttendeesData(eventId);

  const responses = useMemo(() => {
    if (!allData) return [];
    return allData.filter((d: { key: string }) =>
      d.key.startsWith('response:')
    );
  }, [allData]);

  // Build a lookup from personId to member data
  const memberLookup = useMemo(() => {
    const members = attendeesData?.event?.memberships;
    if (!members) return new Map<string, MemberInfo>();
    const map = new Map<string, MemberInfo>();
    for (const m of members) {
      if (m.person) {
        map.set(m.personId as string, {
          name: m.person.user?.name || m.person.user?.email || 'Unknown',
          username: m.person.user?.username || undefined,
          image: m.person.user?.image || undefined,
        });
      }
    }
    return map;
  }, [attendeesData]);

  const handleExport = useCallback(
    (format: 'csv' | 'json') => {
      const headers = ['Name', 'Username', ...questions.map(q => q.label)];
      const date = new Date().toISOString().slice(0, 10);
      const filename = `questionnaire-responses-${date}.${format}`;

      if (format === 'csv') {
        const rows = responses.map((row: { key: string; data: unknown }) => {
          const data = row.data as Record<string, unknown>;
          const personId = row.key.replace('response:', '');
          const member = memberLookup.get(personId);
          return [
            member?.name ?? 'Unknown',
            member?.username ? `@${member.username}` : '',
            ...questions.map(q => formatAnswer(data[q.id], q.type)),
          ];
        });
        downloadFile(toCSV(headers, rows), filename, 'text/csv');
      } else {
        const rows = responses.map((row: { key: string; data: unknown }) => {
          const data = row.data as Record<string, unknown>;
          const personId = row.key.replace('response:', '');
          const member = memberLookup.get(personId);
          const obj: Record<string, unknown> = {
            Name: member?.name ?? 'Unknown',
            Username: member?.username ? `@${member.username}` : '',
          };
          for (const q of questions) {
            obj[q.label] = data[q.id] ?? null;
          }
          return obj;
        });
        downloadFile(toJSON(headers, rows), filename, 'application/json');
      }

      toast.success(
        `Exported ${responses.length} responses as ${format.toUpperCase()}`
      );
    },
    [responses, questions, memberLookup]
  );

  if (!allData || !attendeesData) {
    return (
      <div className='flex items-center justify-center py-8'>
        <Icons.spinner className='size-6 animate-spin text-muted-foreground' />
      </div>
    );
  }

  if (responses.length === 0) {
    return <p className='text-sm text-muted-foreground'>No responses yet.</p>;
  }

  return (
    <div className='space-y-3'>
      <div className='flex justify-end'>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='outline' size='sm'>
              <Icons.download className='size-4 mr-1.5' />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuItem onClick={() => handleExport('csv')}>
              Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('json')}>
              Export as JSON
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className='overflow-x-auto'>
        <table className='w-full text-sm'>
          <thead>
            <tr className='border-b'>
              <th className='text-left py-2 pr-4 font-medium'>Member</th>
              {questions.map(q => (
                <th key={q.id} className='text-left py-2 pr-4 font-medium'>
                  {q.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {responses.map(
              (row: { _id: string; key: string; data: unknown }) => {
                const data = row.data as Record<string, unknown>;
                const personId = row.key.replace('response:', '');
                const member = memberLookup.get(personId);
                return (
                  <tr key={row._id} className='border-b'>
                    <td className='py-2 pr-4'>
                      <div className='flex items-center gap-2'>
                        <Avatar className='size-8'>
                          <AvatarImage src={member?.image} />
                          <AvatarFallback className='text-xs'>
                            {getInitialsFromName(
                              member?.name ?? null,
                              member?.username
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div className='min-w-0'>
                          <div className='font-medium truncate'>
                            {member?.name ?? 'Unknown'}
                          </div>
                          {member?.username && (
                            <div className='text-xs text-muted-foreground truncate'>
                              @{member.username}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    {questions.map(q => (
                      <td key={q.id} className='py-2 pr-4'>
                        {formatAnswer(data[q.id], q.type)}
                      </td>
                    ))}
                  </tr>
                );
              }
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface MemberInfo {
  name: string;
  username?: string;
  image?: string;
}

function formatAnswer(value: unknown, type: QuestionType): string {
  if (value === undefined || value === null) return '—';
  if (type === 'YES_NO') return value ? 'Yes' : 'No';
  if (type === 'CHECKBOXES' && Array.isArray(value)) return value.join(', ');
  return String(value);
}

// ===== Dedicated Page =====

function QuestionnairePageComponent({ eventId, config }: AddonPageProps) {
  const { person } = useGlobalUser();
  const myData = useMyAddonData(eventId, 'questionnaire');
  const questions = (config?.questions as Question[]) ?? [];

  const eventData = useEventHeaderData(eventId);
  const userIsOrganizer = eventData?.userMembership?.role === 'ORGANIZER';

  const existingResponse = useMemo(() => {
    if (!myData || !person) return null;
    const entry = myData.find(
      (d: { key: string }) => d.key === `response:${person._id}`
    );
    return entry ? (entry.data as Record<string, unknown>) : null;
  }, [myData, person]);

  if (!config || questions.length === 0) {
    return (
      <p className='text-muted-foreground'>
        The questionnaire has not been configured yet.
      </p>
    );
  }

  if (userIsOrganizer) {
    return <AllResponsesView eventId={eventId} questions={questions} />;
  }

  return (
    <QuestionnaireResponseForm
      eventId={eventId}
      questions={questions}
      existingResponse={existingResponse}
    />
  );
}

// ===== Registration =====

registerAddon({
  id: 'questionnaire',
  name: 'Questionnaire',
  description: 'Ask attendees questions before the event',
  iconName: 'listOrdered',
  author: { name: 'Groupi' },

  // Create wizard
  CreateConfigComponent: QuestionnaireCreateConfig,
  isEnabled: formState => formState.addonConfigs?.questionnaire !== undefined,
  onEnable: formState => ({
    addonConfigs: {
      ...formState.addonConfigs,
      questionnaire: { questions: [] },
    },
  }),
  onDisable: formState => {
    const { questionnaire: _, ...rest } = formState.addonConfigs ?? {};
    return { addonConfigs: rest };
  },
  getConfigFromFormState: formState => {
    const config = formState.addonConfigs?.questionnaire;
    if (!config) return null;
    const questions = config.questions as Question[] | undefined;
    if (!questions || questions.length === 0) return null;
    return config;
  },

  // Event page
  EventCardComponent: QuestionnaireEventCard,

  // Manage page
  ManageConfigComponent: QuestionnaireManageConfig,

  // Dedicated page
  PageComponent: QuestionnairePageComponent,
  pageTitle: 'Questionnaire',

  // No opt-out (it's required)
  supportsOptOut: false,

  // Gating
  requiresCompletion: true,
  completionRoute: '/addon/questionnaire',
});
