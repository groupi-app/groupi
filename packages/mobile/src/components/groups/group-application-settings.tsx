import { useState } from 'react';
import { View, TextInput } from 'react-native';
import type { Id } from 'convex/_generated/dataModel';
import type { ApplicationQuestion } from '@groupi/shared/hooks';
import { useConfigureGroupApplications } from '@/hooks/use-group-applications';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
const types: ApplicationQuestion['type'][] = [
  'SHORT_ANSWER',
  'LONG_ANSWER',
  'MULTIPLE_CHOICE',
  'CHECKBOXES',
  'NUMBER',
  'DROPDOWN',
  'YES_NO',
];
export function GroupApplicationSettings({
  groupId,
  applicationsEnabled,
  questions: initial,
}: {
  groupId: Id<'groups'>;
  applicationsEnabled: boolean;
  questions: ApplicationQuestion[];
}) {
  const configure = useConfigureGroupApplications();
  const [draft, setDraft] = useState<ApplicationQuestion[] | null>(null);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const questions = draft ?? initial;
  function update(index: number, patch: Partial<ApplicationQuestion>) {
    setDraft(questions.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  }
  async function save() {
    setBusy(true);
    setMessage('');
    try {
      await configure({
        groupId,
        applicationsEnabled: enabled ?? applicationsEnabled,
        questions,
      });
      setDraft(null);
      setEnabled(null);
      setMessage(
        'Application settings saved. Pending applications retain their questions.'
      );
    } catch {
      setMessage(
        'Could not save application settings. Check the questions and your permission.'
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <View className='gap-3 rounded-card border border-border p-3'>
      <Text accessibilityRole='header'>Group admission applications</Text>
      <Text>
        Owner and moderators review. Invitations remain usable. These questions
        are separate from any later questionnaire.
      </Text>
      <Button
        accessibilityLabel='Enable Group applications'
        accessibilityRole='checkbox'
        role='checkbox'
        accessibilityState={{
          checked: enabled ?? applicationsEnabled,
          disabled: busy,
        }}
        disabled={busy}
        onPress={() => setEnabled(!(enabled ?? applicationsEnabled))}
      >
        {(enabled ?? applicationsEnabled)
          ? 'Applications enabled'
          : 'Applications disabled'}
      </Button>
      {questions.map((q, index) => (
        <View
          key={q.id}
          className='gap-2 rounded-card border border-border p-3'
        >
          <TextInput
            accessibilityLabel={`Group question ${index + 1} label`}
            editable={!busy}
            className='rounded-input border border-border p-3 text-foreground'
            value={q.label}
            onChangeText={label => update(index, { label })}
          />
          {types.map(type => (
            <Button
              key={type}
              accessibilityLabel={`Group question ${index + 1} type ${type}`}
              accessibilityRole='radio'
              role='radio'
              accessibilityState={{ checked: q.type === type, disabled: busy }}
              disabled={busy}
              variant={q.type === type ? 'default' : 'outline'}
              onPress={() =>
                update(index, {
                  type,
                  options: [
                    'MULTIPLE_CHOICE',
                    'CHECKBOXES',
                    'DROPDOWN',
                  ].includes(type)
                    ? (q.options ?? ['Option 1'])
                    : undefined,
                })
              }
            >
              {type.replaceAll('_', ' ')}
            </Button>
          ))}
          <Button
            accessibilityLabel={`Group question ${index + 1} required`}
            accessibilityRole='checkbox'
            role='checkbox'
            accessibilityState={{ checked: q.required, disabled: busy }}
            disabled={busy}
            onPress={() => update(index, { required: !q.required })}
          >
            {q.required ? 'Required' : 'Optional'}
          </Button>
          {['MULTIPLE_CHOICE', 'CHECKBOXES', 'DROPDOWN'].includes(q.type) ? (
            <TextInput
              accessibilityLabel={`Group question ${index + 1} options, one per line`}
              multiline
              editable={!busy}
              className='rounded-input border border-border p-3 text-foreground'
              value={q.options?.join('\n') ?? ''}
              onChangeText={value =>
                update(index, { options: value.split('\n') })
              }
            />
          ) : null}
          <Button
            accessibilityLabel={`Remove Group question ${index + 1}`}
            variant='outline'
            disabled={busy}
            onPress={() => setDraft(questions.filter((_, i) => i !== index))}
          >
            Remove question
          </Button>
        </View>
      ))}
      <Button
        accessibilityLabel='Add Group admission question'
        disabled={busy}
        onPress={() =>
          setDraft([
            ...questions,
            {
              id: `question-${Date.now()}`,
              label: '',
              required: false,
              type: 'SHORT_ANSWER',
            },
          ])
        }
      >
        Add question
      </Button>
      <Button
        accessibilityLabel='Save Group application settings'
        disabled={busy}
        onPress={save}
      >
        Save application settings
      </Button>
      {message ? <Text accessibilityRole='alert'>{message}</Text> : null}
    </View>
  );
}
