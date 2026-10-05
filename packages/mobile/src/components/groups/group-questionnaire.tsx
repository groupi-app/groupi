import { useState } from 'react';
import { View, TextInput } from 'react-native';
import { router } from 'expo-router';
import type { Id } from 'convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import {
  useJoiningQuestionnaire,
  useSubmitJoiningQuestionnaire,
  useJoiningQuestionnaireHistory,
  useJoiningQuestionnaireAnswers,
} from '@/hooks/use-group-questionnaire';
import { GroupPageControls } from './group-page-controls';

type Form = NonNullable<ReturnType<typeof useJoiningQuestionnaire>>;
type Question = Form['questions'][number];
type Answer = Form['answers'][string];
function display(value: Answer | undefined) {
  return value === undefined
    ? 'No answer saved'
    : Array.isArray(value)
      ? value.join(', ')
      : typeof value === 'boolean'
        ? value
          ? 'Yes'
          : 'No'
        : String(value);
}
export function GroupQuestionField({
  question,
  value,
  onChange,
  disabled,
}: {
  question: Question;
  value: Answer | undefined;
  onChange: (value: Answer | undefined) => void;
  disabled: boolean;
}) {
  const q = question;
  return (
    <View className='gap-2'>
      <Text>
        {q.label}
        {q.required ? ' (required answer if completing)' : ''}
      </Text>
      {q.type === 'SHORT_ANSWER' ||
      q.type === 'LONG_ANSWER' ||
      q.type === 'NUMBER' ? (
        <TextInput
          className='rounded-input border border-border p-3 text-foreground'
          accessibilityLabel={q.label}
          editable={!disabled}
          multiline={q.type === 'LONG_ANSWER'}
          keyboardType={q.type === 'NUMBER' ? 'numeric' : 'default'}
          value={value === undefined ? '' : String(value)}
          onChangeText={text =>
            onChange(
              q.type === 'NUMBER'
                ? text.trim() === ''
                  ? undefined
                  : Number(text)
                : text
            )
          }
        />
      ) : (
        (q.type === 'YES_NO' ? ['Yes', 'No'] : (q.options ?? [])).map(
          option => {
            const checked =
              q.type === 'YES_NO'
                ? value === (option === 'Yes')
                : q.type === 'CHECKBOXES'
                  ? Array.isArray(value) && value.includes(option)
                  : value === option;
            return (
              <Button
                key={option}
                variant={checked ? 'default' : 'outline'}
                disabled={disabled}
                accessibilityLabel={`${q.label}: ${option}`}
                accessibilityRole={
                  q.type === 'CHECKBOXES' ? 'checkbox' : 'radio'
                }
                accessibilityState={{ checked, disabled }}
                onPress={() =>
                  onChange(
                    q.type === 'YES_NO'
                      ? option === 'Yes'
                      : q.type === 'CHECKBOXES'
                        ? checked
                          ? (Array.isArray(value) ? value : []).filter(
                              item => item !== option
                            )
                          : [...(Array.isArray(value) ? value : []), option]
                        : option
                  )
                }
              >
                {option}
              </Button>
            );
          }
        )
      )}
      {value !== undefined ? (
        <Button
          variant='ghost'
          disabled={disabled}
          accessibilityLabel={`Clear ${q.label}`}
          onPress={() => onChange(undefined)}
        >
          Clear answer
        </Button>
      ) : null}
    </View>
  );
}
export function GroupQuestionnaire({ groupId }: { groupId: Id<'groups'> }) {
  const form = useJoiningQuestionnaire({ groupId });
  if (form === undefined) return <Text>Loading joining questionnaire…</Text>;
  return <QuestionnaireForm key={form.version} form={form} groupId={groupId} />;
}
function QuestionnaireForm({
  form,
  groupId,
}: {
  form: Form;
  groupId: Id<'groups'>;
}) {
  const submit = useSubmitJoiningQuestionnaire();
  const [draft, setDraft] = useState<Form['answers'] | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const answers = draft ?? form.answers;
  return (
    <View className='gap-4'>
      <Text accessibilityRole='header'>Joining questionnaire</Text>
      <Text>
        {form.requiresCompletion
          ? 'Complete required onboarding before accessing Group member content.'
          : form.requiredCompletion
            ? 'This questionnaire is required for Group-granted member content. Admission and independent Event grants are unchanged.'
            : 'This questionnaire is separate from admission. Completing it does not require approval or limit Group or Event access.'}
      </Text>
      <Text>
        {form.enabled
          ? form.completed
            ? form.canEdit
              ? 'Your answers are saved. You can edit them.'
              : 'Your saved current answers are read-only.'
            : form.requiresCompletion
              ? 'Your membership is active. Save current required answers to continue.'
              : 'Complete whenever you choose.'
          : 'This questionnaire is disabled. Your saved records remain available.'}
      </Text>
      {form.canEdit ? (
        form.questions.map(question => (
          <GroupQuestionField
            key={`${question.id}-${question.version}`}
            question={question}
            value={answers[question.id]}
            disabled={busy}
            onChange={value => {
              const next = { ...answers };
              if (value === undefined) delete next[question.id];
              else next[question.id] = value;
              setDraft(next);
            }}
          />
        ))
      ) : (
        <Text>
          Answers are read-only. Editing requires current eligible membership
          and an enabled questionnaire.
        </Text>
      )}
      {!form.canEdit
        ? form.questions.map(q => (
            <Text key={`${q.id}-${q.version}`}>
              {q.label}: {display(form.answers[q.id])}
            </Text>
          ))
        : null}
      {form.savedQuestions.length ? (
        <View className='gap-2'>
          <Text accessibilityRole='header'>Saved answered definitions</Text>
          {form.savedQuestions.map(q => (
            <Text key={`${q.id}-${q.version}`}>
              {q.label} · {q.type.toLowerCase().replaceAll('_', ' ')} · version{' '}
              {q.version}
            </Text>
          ))}
        </View>
      ) : null}
      {form.canEdit ? (
        <Button
          accessibilityLabel='Save joining questionnaire answers'
          disabled={busy}
          accessibilityState={{ disabled: busy, busy }}
          onPress={async () => {
            setBusy(true);
            setMessage('');
            try {
              await submit({ groupId, version: form.version, answers });
              setDraft(null);
              setMessage('Answers saved. Membership remains unchanged.');
            } catch (failure) {
              setMessage(
                failure instanceof Error
                  ? failure.message
                  : 'Could not save answers.'
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          Save answers
        </Button>
      ) : null}
      <Button
        variant='outline'
        accessibilityLabel='View own questionnaire history'
        onPress={() => router.push(`/groups/${groupId}/questionnaire/history`)}
      >
        My saved answer history
      </Button>
      {!form.requiresCompletion && (
        <Button
          variant='outline'
          accessibilityLabel='Continue without questionnaire'
          onPress={() => router.replace(`/groups/${groupId}`)}
        >
          Continue to Group
        </Button>
      )}
      {form.canConfigure ? (
        <Button
          variant='outline'
          accessibilityLabel='Configure joining questionnaire'
          onPress={() =>
            router.push(`/groups/${groupId}/questionnaire/settings`)
          }
        >
          Questionnaire settings
        </Button>
      ) : null}
      {form.canReview ? (
        <Button
          variant='outline'
          accessibilityLabel='Review joining questionnaire answers'
          onPress={() =>
            router.push(`/groups/${groupId}/questionnaire/answers`)
          }
        >
          Review private answers
        </Button>
      ) : null}
      {message ? <Text accessibilityRole='alert'>{message}</Text> : null}
    </View>
  );
}
export function GroupQuestionnaireHistory({
  groupId,
  personId,
}: {
  groupId: Id<'groups'>;
  personId?: Id<'persons'>;
}) {
  const [cursor, setCursor] = useState<string | null>(null);
  const history = useJoiningQuestionnaireHistory({
    groupId,
    ...(personId ? { personId } : {}),
    paginationOpts: { numItems: 20, cursor },
  });
  return (
    <View className='gap-3'>
      <Text>Saved answers retain their original question definitions.</Text>
      {history === undefined ? (
        <Text>Loading answer history…</Text>
      ) : history.page.length === 0 ? (
        <Text>No saved answers on this page.</Text>
      ) : (
        history.page.map(entry => (
          <View
            key={entry._id}
            className='gap-2 rounded-card border border-border p-3'
          >
            <Text>
              {entry.question.label} · version {entry.question.version}
            </Text>
            <Text>{display(entry.answer)}</Text>
            <Text>{new Date(entry.answeredAt).toLocaleString()}</Text>
          </View>
        ))
      )}
      <GroupPageControls
        page={history}
        cursor={cursor}
        onPage={setCursor}
        label='Questionnaire history'
      />
    </View>
  );
}
export function GroupQuestionnaireReview({
  groupId,
}: {
  groupId: Id<'groups'>;
}) {
  const form = useJoiningQuestionnaire({ groupId });
  if (form === undefined)
    return <Text>Loading questionnaire permissions…</Text>;
  return form.canReview ? (
    <ReviewRecords groupId={groupId} />
  ) : (
    <Text>Only the Group owner and moderators can review private answers.</Text>
  );
}
function ReviewRecords({ groupId }: { groupId: Id<'groups'> }) {
  const [cursor, setCursor] = useState<string | null>(null);
  const records = useJoiningQuestionnaireAnswers({
    groupId,
    paginationOpts: { numItems: 20, cursor },
  });
  return (
    <View className='gap-3'>
      {records === undefined ? (
        <Text>Loading private answers…</Text>
      ) : records.page.length === 0 ? (
        <Text>No saved questionnaire records on this page.</Text>
      ) : (
        records.page.map(record => (
          <View
            key={record.author.personId}
            className='gap-2 rounded-card border border-border p-3'
          >
            <Text>
              {record.author.name ?? record.author.username ?? 'Groupi user'}
            </Text>
            <Text>
              {record.completed
                ? 'Completed current questionnaire'
                : 'Current questionnaire incomplete'}
            </Text>
            {record.questions.map(q => (
              <Text key={`${q.id}-${q.version}`}>
                {q.label}: {display(record.answers[q.id])}
              </Text>
            ))}
            <Button
              variant='outline'
              accessibilityLabel={`View answer history for ${record.author.name ?? record.author.username ?? 'Groupi user'}`}
              onPress={() =>
                router.push({
                  pathname: '/groups/[groupId]/questionnaire/history',
                  params: { groupId, personId: record.author.personId },
                })
              }
            >
              Saved answer history
            </Button>
          </View>
        ))
      )}
      <GroupPageControls
        page={records}
        cursor={cursor}
        onPage={setCursor}
        label='Questionnaire answers'
      />
    </View>
  );
}

export function GroupJoiningQuestionnairePrompt({
  groupId,
}: {
  groupId: Id<'groups'>;
}) {
  const form = useJoiningQuestionnaire({ groupId });
  const [dismissed, setDismissed] = useState(false);
  if (!form?.shouldPrompt || (dismissed && !form.requiresCompletion))
    return null;
  return (
    <View className='gap-3 rounded-card border border-border p-4'>
      <Text accessibilityRole='header'>Joining questionnaire</Text>
      <Text>
        {form.requiresCompletion
          ? 'Complete required onboarding before accessing Group member content.'
          : 'Your membership is active. You can answer now or later, without further admission approval.'}
      </Text>
      <Button
        accessibilityLabel={
          form.requiresCompletion
            ? 'Complete required joining questionnaire'
            : 'Answer optional joining questionnaire'
        }
        onPress={() => router.push(`/groups/${groupId}/questionnaire`)}
      >
        Answer now
      </Button>
      {!form.requiresCompletion && (
        <Button
          variant='ghost'
          accessibilityLabel='Skip optional joining questionnaire for now'
          onPress={() => setDismissed(true)}
        >
          Later
        </Button>
      )}
    </View>
  );
}
