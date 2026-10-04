import { useState } from 'react';
import { View, TextInput } from 'react-native';
import { router } from 'expo-router';
import type { Id } from 'convex/_generated/dataModel';
import type { ApplicationQuestion } from '@groupi/shared/hooks';
import {
  useApplicationForm,
  useConfigureApplications,
} from '@/hooks/use-event-applications';
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
export function ApplicationSettings({ eventId }: { eventId: Id<'events'> }) {
  const form = useApplicationForm({ eventId });
  const configure = useConfigureApplications();
  const [draft, setDraft] = useState<ApplicationQuestion[] | null>(null);
  const [policy, setPolicy] = useState<
    'ORGANIZER_ONLY' | 'ORGANIZERS_AND_MODERATORS' | null
  >(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  if (!form) return <Text>Loading application settings…</Text>;
  const questions = draft ?? form.settings.questions;
  const reviewerPolicy = policy ?? form.settings.reviewerPolicy;
  function update(index: number, patch: Partial<ApplicationQuestion>) {
    setDraft(questions.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  }
  async function save() {
    setBusy(true);
    setMessage('');
    try {
      await configure({ eventId, questions, reviewerPolicy });
      setMessage(
        'Application settings saved. Pending applications retain their original questions.'
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Could not save application settings.'
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <View className='gap-3'>
      <Text accessibilityRole='header'>Admission questions</Text>
      <Text>These questions are separate from member questionnaires.</Text>
      {questions.map((q, index) => (
        <View
          key={q.id}
          className='gap-2 rounded-card border border-border p-3'
        >
          <TextInput
            accessibilityLabel={`Question ${index + 1} label`}
            className='rounded-input border border-border p-3 text-foreground'
            value={q.label}
            onChangeText={label => update(index, { label })}
          />
          {types.map(type => (
            <Button
              key={type}
              accessibilityLabel={`Question ${index + 1} type ${type}`}
              accessibilityRole='radio'
              accessibilityState={{ checked: q.type === type }}
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
            accessibilityLabel={`Question ${index + 1} required`}
            accessibilityRole='checkbox'
            accessibilityState={{ checked: q.required }}
            onPress={() => update(index, { required: !q.required })}
          >
            {q.required ? 'Required' : 'Optional'}
          </Button>
          {['MULTIPLE_CHOICE', 'CHECKBOXES', 'DROPDOWN'].includes(q.type) ? (
            <TextInput
              accessibilityLabel={`Question ${index + 1} options, one per line`}
              multiline
              className='rounded-input border border-border p-3 text-foreground'
              value={q.options?.join('\n') ?? ''}
              onChangeText={value =>
                update(index, { options: value.split('\n') })
              }
            />
          ) : null}
          <Button
            accessibilityLabel={`Remove question ${index + 1}`}
            variant='outline'
            onPress={() => setDraft(questions.filter((_, i) => i !== index))}
          >
            Remove question
          </Button>
        </View>
      ))}
      <Button
        accessibilityLabel='Add admission question'
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
      {(['ORGANIZERS_AND_MODERATORS', 'ORGANIZER_ONLY'] as const).map(value => (
        <Button
          key={value}
          accessibilityLabel={
            value === 'ORGANIZER_ONLY'
              ? 'Organizer only reviews'
              : 'Organizers and moderators review'
          }
          accessibilityRole='radio'
          accessibilityState={{ checked: reviewerPolicy === value }}
          variant={reviewerPolicy === value ? 'default' : 'outline'}
          onPress={() => setPolicy(value)}
        >
          {value === 'ORGANIZER_ONLY'
            ? 'Organizer only'
            : 'Organizer and moderators'}
        </Button>
      ))}
      <Button
        accessibilityLabel='Save application settings'
        disabled={busy}
        onPress={save}
      >
        Save application settings
      </Button>
      <Button
        accessibilityLabel='Review applications'
        variant='outline'
        onPress={() => router.push(`/event/${eventId}/applications`)}
      >
        Review applications
      </Button>
      {message ? <Text accessibilityRole='alert'>{message}</Text> : null}
    </View>
  );
}
