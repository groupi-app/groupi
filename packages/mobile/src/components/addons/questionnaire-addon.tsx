import { useState } from 'react';
import { View, TextInput, Pressable, ScrollView } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Ionicons } from '@expo/vector-icons';
import { useGlobalUser } from '@/context/global-user-context';
import { useMyAddonData, useSetAddonData } from '@/hooks/use-addons';
import { toast } from '@groupi/shared/platform';

interface QuestionnaireAddonProps {
  eventId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: any;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Question = any;

export function QuestionnaireAddon({
  eventId,
  config,
}: QuestionnaireAddonProps) {
  const { person } = useGlobalUser();
  const personId = person?._id as string | undefined;
  const existingData = useMyAddonData(eventId, 'questionnaire');
  const setAddonData = useSetAddonData();

  const questions: Question[] = config?.questions ?? [];
  const existingResponse =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    existingData?.find((d: any) => d.key === `response:${personId}`)?.data ??
    null;

  const [answers, setAnswers] = useState<Record<string, string>>(
    () => (existingResponse as Record<string, string>) ?? {}
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateAnswer(questionId: string, value: string) {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  }

  async function handleSubmit() {
    // Check required fields
    for (const q of questions) {
      if (q.required && !answers[q.id]?.trim()) {
        toast.error(`Please answer: ${q.label}`);
        return;
      }
    }

    if (!personId) return;

    setIsSubmitting(true);
    try {
      await setAddonData({
        eventId,
        addonType: 'questionnaire',
        key: `response:${personId}`,
        data: answers,
      });
      toast.success('Response submitted!');
    } catch {
      toast.error('Failed to submit response');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (questions.length === 0) {
    return (
      <View className='items-center py-8'>
        <Text className='text-base text-muted-foreground'>
          No questions configured
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerClassName='gap-4 pb-8'>
      {questions.map((q: Question, index: number) => (
        <View
          key={q.id ?? index}
          className='rounded-card border border-border bg-card p-4'
        >
          <View className='flex-row items-start gap-1'>
            <Text className='text-base font-medium text-foreground'>
              {q.label ?? `Question ${index + 1}`}
            </Text>
            {q.required ? <Text className='text-error'>*</Text> : null}
          </View>

          {q.type === 'short_answer' || q.type === 'number' ? (
            <TextInput
              className='mt-2 rounded-input border border-border bg-background px-3 py-2 text-base text-foreground'
              placeholder='Your answer...'
              placeholderTextColor='#9ca3af'
              value={answers[q.id] ?? ''}
              onChangeText={val => updateAnswer(q.id, val)}
              keyboardType={q.type === 'number' ? 'numeric' : 'default'}
            />
          ) : q.type === 'long_answer' ? (
            <TextInput
              className='mt-2 min-h-[80px] rounded-input border border-border bg-background px-3 py-2 text-base text-foreground'
              placeholder='Your answer...'
              placeholderTextColor='#9ca3af'
              value={answers[q.id] ?? ''}
              onChangeText={val => updateAnswer(q.id, val)}
              multiline
            />
          ) : q.type === 'yes_no' ? (
            <View className='mt-2 flex-row gap-2'>
              {['Yes', 'No'].map(opt => (
                <Pressable
                  key={opt}
                  onPress={() => updateAnswer(q.id, opt)}
                  className={`flex-1 items-center rounded-button py-2 ${
                    answers[q.id] === opt
                      ? 'border border-primary bg-primary/10'
                      : 'border border-border'
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      answers[q.id] === opt
                        ? 'text-primary'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {opt}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : q.type === 'multiple_choice' ||
            q.type === 'dropdown' ||
            q.type === 'select' ? (
            <View className='mt-2 gap-2'>
              {(q.options ?? []).map((opt: string) => (
                <Pressable
                  key={opt}
                  onPress={() => updateAnswer(q.id, opt)}
                  className={`flex-row items-center gap-2 rounded-button px-3 py-2 ${
                    answers[q.id] === opt
                      ? 'border border-primary bg-primary/10'
                      : 'border border-border'
                  }`}
                >
                  <Ionicons
                    name={
                      answers[q.id] === opt
                        ? 'radio-button-on'
                        : 'radio-button-off'
                    }
                    size={18}
                    color={answers[q.id] === opt ? '#8b00b8' : '#9ca3af'}
                  />
                  <Text
                    className={`text-sm ${
                      answers[q.id] === opt
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {opt}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <TextInput
              className='mt-2 rounded-input border border-border bg-background px-3 py-2 text-base text-foreground'
              placeholder='Your answer...'
              placeholderTextColor='#9ca3af'
              value={answers[q.id] ?? ''}
              onChangeText={val => updateAnswer(q.id, val)}
            />
          )}
        </View>
      ))}

      <Button
        onPress={handleSubmit}
        isLoading={isSubmitting}
        loadingText='Submitting...'
      >
        {existingResponse ? 'Update Response' : 'Submit Response'}
      </Button>
    </ScrollView>
  );
}
