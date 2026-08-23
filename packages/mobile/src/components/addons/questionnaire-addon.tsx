import { useEffect, useState } from 'react';
import { View, TextInput, Pressable, ScrollView } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Ionicons } from '@expo/vector-icons';
import { useCSSVariable } from 'uniwind';
import { useGlobalUser } from '@/context/global-user-context';
import { useMyAddonData, useSetAddonData } from '@/hooks/use-addons';
import { toast } from '@groupi/shared/platform';
import {
  getQuestionnaireAnswers,
  getQuestionnaireQuestions,
  isRequiredAnswerMissing,
  parseNumberAnswer,
  toggleCheckboxAnswer,
  type QuestionnaireAnswer,
  type QuestionnaireAnswers,
  type QuestionnaireQuestion,
} from '@/lib/addon-contracts';

interface QuestionnaireAddonProps {
  eventId: string;
  config: unknown;
}

export function QuestionnaireAddon({
  eventId,
  config,
}: QuestionnaireAddonProps) {
  const { person } = useGlobalUser();
  const personId = person?._id as string | undefined;
  const existingData = useMyAddonData(eventId, 'questionnaire');
  const setAddonData = useSetAddonData();

  const questions = getQuestionnaireQuestions(config);
  const existingResponse = existingData?.find(
    entry => entry.key === `response:${personId}`
  )?.data;

  const [answers, setAnswers] = useState<QuestionnaireAnswers>(() =>
    getQuestionnaireAnswers(existingResponse)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (existingResponse !== undefined) {
      setAnswers(getQuestionnaireAnswers(existingResponse));
    }
  }, [existingResponse]);

  function updateAnswer(
    questionId: string,
    value: QuestionnaireAnswer | undefined
  ) {
    setAnswers(previous => {
      if (value === undefined) {
        const next = { ...previous };
        delete next[questionId];
        return next;
      }
      return { ...previous, [questionId]: value };
    });
  }

  async function handleSubmit() {
    // Check required fields
    for (const question of questions) {
      if (isRequiredAnswerMissing(question, answers[question.id])) {
        toast.error(`Please answer: ${question.label}`);
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
      // The mutation hook presents the actionable error.
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
      {questions.map((question, index) => (
        <View
          key={question.id}
          className='rounded-card border border-border bg-card p-4'
        >
          <View className='flex-row items-start gap-1'>
            <Text className='text-base font-medium text-foreground'>
              {question.label || `Question ${index + 1}`}
            </Text>
            {question.required ? <Text className='text-error'>*</Text> : null}
          </View>

          <QuestionInput
            question={question}
            value={answers[question.id]}
            onChange={value => updateAnswer(question.id, value)}
          />
        </View>
      ))}

      <Button
        onPress={handleSubmit}
        isLoading={isSubmitting}
        loadingText='Submitting...'
      >
        {existingResponse !== undefined ? 'Update Response' : 'Submit Response'}
      </Button>
    </ScrollView>
  );
}

function QuestionInput({
  question,
  value,
  onChange,
}: {
  question: QuestionnaireQuestion;
  value: QuestionnaireAnswer | undefined;
  onChange: (value: QuestionnaireAnswer | undefined) => void;
}) {
  const primaryColor = String(
    useCSSVariable('--color-primary') ?? 'transparent'
  );
  const mutedColor = String(
    useCSSVariable('--color-muted-foreground') ?? 'transparent'
  );

  if (question.type === 'SHORT_ANSWER') {
    return (
      <TextInput
        className='mt-2 rounded-input border border-border bg-background px-3 py-2 text-base text-foreground'
        placeholder='Your answer...'
        placeholderTextColor={mutedColor}
        value={typeof value === 'string' ? value : ''}
        onChangeText={onChange}
      />
    );
  }

  if (question.type === 'LONG_ANSWER') {
    return (
      <TextInput
        className='mt-2 min-h-[80px] rounded-input border border-border bg-background px-3 py-2 text-base text-foreground'
        placeholder='Your answer...'
        placeholderTextColor={mutedColor}
        value={typeof value === 'string' ? value : ''}
        onChangeText={onChange}
        multiline
      />
    );
  }

  if (question.type === 'NUMBER') {
    return (
      <TextInput
        className='mt-2 rounded-input border border-border bg-background px-3 py-2 text-base text-foreground'
        placeholder='0'
        placeholderTextColor={mutedColor}
        value={typeof value === 'number' ? String(value) : ''}
        onChangeText={text => onChange(parseNumberAnswer(text))}
        keyboardType='numeric'
      />
    );
  }

  if (question.type === 'YES_NO') {
    return (
      <View className='mt-2 flex-row gap-2'>
        {[
          { label: 'Yes', answer: true },
          { label: 'No', answer: false },
        ].map(option => (
          <Pressable
            key={option.label}
            accessibilityRole='radio'
            accessibilityState={{ selected: value === option.answer }}
            onPress={() => onChange(option.answer)}
            className={`flex-1 items-center rounded-button py-2 ${
              value === option.answer
                ? 'border border-primary bg-primary/10'
                : 'border border-border'
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                value === option.answer
                  ? 'text-primary'
                  : 'text-muted-foreground'
              }`}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
    );
  }

  const allowsMultiple = question.type === 'CHECKBOXES';

  return (
    <View className='mt-2 gap-2'>
      {(question.options ?? []).map(option => {
        const isSelected = allowsMultiple
          ? Array.isArray(value) && value.includes(option)
          : value === option;

        return (
          <Pressable
            key={option}
            accessibilityRole={allowsMultiple ? 'checkbox' : 'radio'}
            accessibilityState={
              allowsMultiple
                ? { checked: isSelected }
                : { selected: isSelected }
            }
            onPress={() =>
              onChange(
                allowsMultiple ? toggleCheckboxAnswer(value, option) : option
              )
            }
            className={`flex-row items-center gap-2 rounded-button px-3 py-2 ${
              isSelected
                ? 'border border-primary bg-primary/10'
                : 'border border-border'
            }`}
          >
            <Ionicons
              name={
                allowsMultiple
                  ? isSelected
                    ? 'checkbox'
                    : 'square-outline'
                  : isSelected
                    ? 'radio-button-on'
                    : 'radio-button-off'
              }
              size={18}
              color={isSelected ? primaryColor : mutedColor}
            />
            <Text
              className={`text-sm ${
                isSelected ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
