import { View, TextInput } from 'react-native';
import type { ApplicationQuestion } from '@groupi/shared';
import { Button } from '@/components/ui/button';
export function GroupQuestionEditor({
  questions,
  onChange,
  disabled = false,
  label = 'Form',
}: {
  questions: ApplicationQuestion[];
  onChange: (questions: ApplicationQuestion[]) => void;
  disabled?: boolean;
  label?: string;
}) {
  const busy = disabled;
  const types: ApplicationQuestion['type'][] = [
    'SHORT_ANSWER',
    'LONG_ANSWER',
    'MULTIPLE_CHOICE',
    'CHECKBOXES',
    'NUMBER',
    'DROPDOWN',
    'YES_NO',
  ];
  function update(index: number, patch: Partial<ApplicationQuestion>) {
    onChange(questions.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  }
  return (
    <View className='gap-3'>
      {questions.map((q, index) => (
        <View
          key={q.id}
          className='gap-2 rounded-card border border-border p-3'
        >
          <TextInput
            accessibilityLabel={`${label} question ${index + 1} label`}
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
              accessibilityLabel={`${label} question ${index + 1} type ${type}`}
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
            accessibilityLabel={`${label} question ${index + 1} answer required when completing`}
            accessibilityRole='checkbox'
            accessibilityState={{ checked: q.required, disabled: busy }}
            onPress={() => update(index, { required: !q.required })}
          >
            {q.required ? 'Answer required when completing' : 'Answer optional'}
          </Button>
          {['MULTIPLE_CHOICE', 'CHECKBOXES', 'DROPDOWN'].includes(q.type) ? (
            <TextInput
              accessibilityLabel={`${label} question ${index + 1} options, one per line`}
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
            accessibilityLabel={`Remove ${label.toLowerCase()} question ${index + 1}`}
            onPress={() => onChange(questions.filter((_, i) => i !== index))}
          >
            Remove question
          </Button>
        </View>
      ))}
      <Button
        disabled={busy || questions.length >= 50}
        accessibilityLabel={`Add ${label.toLowerCase()} question`}
        onPress={() =>
          onChange([
            ...questions,
            {
              id: `${label.toLowerCase()}-${Date.now()}-${questions.length}`,
              type: 'SHORT_ANSWER',
              label: '',
              required: false,
            },
          ])
        }
      >
        Add question
      </Button>
    </View>
  );
}
