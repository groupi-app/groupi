import { View, TextInput } from 'react-native';
import type {
  ApplicationQuestion,
  ApplicationAnswers,
} from '@groupi/shared/hooks';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
export function GroupApplicationQuestions({
  questions,
  answers,
  onChange,
  disabled = false,
}: {
  questions: ApplicationQuestion[];
  answers: ApplicationAnswers;
  onChange: (answers: ApplicationAnswers) => void;
  disabled?: boolean;
}) {
  return (
    <View className='gap-4'>
      {questions.map(q => (
        <View key={q.id} className='gap-2'>
          <Text>
            {q.label}
            {q.required ? ' (required)' : ''}
          </Text>
          {q.type === 'YES_NO' ||
          ['MULTIPLE_CHOICE', 'CHECKBOXES', 'DROPDOWN'].includes(q.type) ? (
            (q.type === 'YES_NO' ? ['Yes', 'No'] : (q.options ?? [])).map(
              option => {
                const value = q.type === 'YES_NO' ? option === 'Yes' : option;
                const selected =
                  q.type === 'CHECKBOXES'
                    ? Array.isArray(answers[q.id]) &&
                      (answers[q.id] as string[]).includes(option)
                    : answers[q.id] === value;
                return (
                  <Button
                    key={option}
                    role={q.type === 'CHECKBOXES' ? 'checkbox' : 'radio'}
                    accessibilityRole={
                      q.type === 'CHECKBOXES' ? 'checkbox' : 'radio'
                    }
                    accessibilityLabel={`${q.label}: ${option}`}
                    accessibilityState={{ checked: selected, disabled }}
                    disabled={disabled}
                    variant={selected ? 'default' : 'outline'}
                    onPress={() =>
                      onChange({
                        ...answers,
                        [q.id]:
                          q.type === 'CHECKBOXES'
                            ? selected
                              ? (answers[q.id] as string[]).filter(
                                  v => v !== option
                                )
                              : [
                                  ...(Array.isArray(answers[q.id])
                                    ? (answers[q.id] as string[])
                                    : []),
                                  option,
                                ]
                            : value,
                      })
                    }
                  >
                    {option}
                  </Button>
                );
              }
            )
          ) : (
            <TextInput
              accessibilityLabel={q.label}
              className='rounded-input border border-border p-3 text-foreground'
              multiline={q.type === 'LONG_ANSWER'}
              keyboardType={q.type === 'NUMBER' ? 'numeric' : 'default'}
              editable={!disabled}
              value={String(answers[q.id] ?? '')}
              onChangeText={value => {
                const next = { ...answers };
                if (value === '') delete next[q.id];
                else next[q.id] = q.type === 'NUMBER' ? Number(value) : value;
                onChange(next);
              }}
            />
          )}
        </View>
      ))}
    </View>
  );
}
