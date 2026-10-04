import { useState } from 'react';
import { View, TextInput } from 'react-native';
import type { Id } from 'convex/_generated/dataModel';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import {
  useJoiningQuestionnaire,
  useConfigureJoiningQuestionnaire,
} from '@/hooks/use-group-questionnaire';
type Question = Parameters<
  ReturnType<typeof useConfigureJoiningQuestionnaire>
>[0]['questions'][number];
const types: Question['type'][] = [
  'SHORT_ANSWER',
  'LONG_ANSWER',
  'MULTIPLE_CHOICE',
  'CHECKBOXES',
  'NUMBER',
  'DROPDOWN',
  'YES_NO',
];
export function GroupQuestionnaireSettings({
  groupId,
}: {
  groupId: Id<'groups'>;
}) {
  const form = useJoiningQuestionnaire({ groupId });
  const configure = useConfigureJoiningQuestionnaire();
  const [draft, setDraft] = useState<Question[] | null>(null);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  if (form === undefined) return <Text>Loading questionnaire settings…</Text>;
  if (!form.canConfigure)
    return <Text>Only the Group owner can configure this questionnaire.</Text>;
  const questions =
    draft ??
    form.questions.map(({ version: _version, ...question }) => question);
  const active = enabled ?? form.enabled;
  function update(index: number, patch: Partial<Question>) {
    setDraft(questions.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  }
  return (
    <View className='gap-3'>
      <Text accessibilityRole='header'>
        Optional joining questionnaire settings
      </Text>
      <Text>
        Admission is immediate. Saved answers and their original definitions
        survive edits and disabling this questionnaire.
      </Text>
      <Button
        accessibilityLabel='Enable optional joining questionnaire'
        accessibilityRole='checkbox'
        accessibilityState={{ checked: active, disabled: busy }}
        disabled={busy}
        onPress={() => setEnabled(!active)}
      >
        {active ? 'Enabled' : 'Disabled'}
      </Button>
      {questions.map((q, index) => (
        <View
          key={q.id}
          className='gap-2 rounded-card border border-border p-3'
        >
          <TextInput
            accessibilityLabel={`Joining question ${index + 1} label`}
            editable={!busy}
            className='rounded-input border border-border p-3 text-foreground'
            value={q.label}
            onChangeText={label => update(index, { label })}
          />
          {types.map(type => (
            <Button
              key={type}
              variant={q.type === type ? 'default' : 'outline'}
              disabled={busy}
              accessibilityLabel={`Joining question ${index + 1} type ${type}`}
              accessibilityRole='radio'
              accessibilityState={{ checked: q.type === type, disabled: busy }}
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
            disabled={busy}
            accessibilityLabel={`Joining question ${index + 1} answer required when completing`}
            accessibilityRole='checkbox'
            accessibilityState={{ checked: q.required, disabled: busy }}
            onPress={() => update(index, { required: !q.required })}
          >
            {q.required ? 'Answer required when completing' : 'Answer optional'}
          </Button>
          {['MULTIPLE_CHOICE', 'CHECKBOXES', 'DROPDOWN'].includes(q.type) ? (
            <TextInput
              accessibilityLabel={`Joining question ${index + 1} options, one per line`}
              editable={!busy}
              multiline
              className='rounded-input border border-border p-3 text-foreground'
              value={q.options?.join('\n') ?? ''}
              onChangeText={text =>
                update(index, { options: text.split('\n') })
              }
            />
          ) : null}
          <Button
            variant='outline'
            disabled={busy}
            accessibilityLabel={`Remove joining question ${index + 1}`}
            onPress={() => setDraft(questions.filter((_, i) => i !== index))}
          >
            Remove question
          </Button>
        </View>
      ))}
      <Button
        disabled={busy || questions.length >= 50}
        accessibilityLabel='Add joining question'
        onPress={() =>
          setDraft([
            ...questions,
            {
              id: `joining-${Date.now()}-${questions.length}`,
              type: 'SHORT_ANSWER',
              label: '',
              required: false,
            },
          ])
        }
      >
        Add question
      </Button>
      <Button
        disabled={busy}
        accessibilityState={{ disabled: busy, busy }}
        accessibilityLabel='Save joining questionnaire settings'
        onPress={async () => {
          setBusy(true);
          setMessage('');
          try {
            await configure({ groupId, enabled: active, questions });
            setDraft(null);
            setEnabled(null);
            setMessage(
              'Settings saved. Existing private records are preserved.'
            );
          } catch (failure) {
            setMessage(
              failure instanceof Error
                ? failure.message
                : 'Could not save settings.'
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        Save settings
      </Button>
      {message ? <Text accessibilityRole='alert'>{message}</Text> : null}
    </View>
  );
}
