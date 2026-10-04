import { useState } from 'react';
import { View, TextInput } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import type { Id } from 'convex/_generated/dataModel';
import type { ApplicationAnswers } from '@groupi/shared/hooks';
import { DetailScreenTemplate } from '@/components/templates/detail-screen-template';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import {
  useApplicationForm,
  useApplicationHistory,
  useSubmitApplication,
  useWithdrawApplication,
} from '@/hooks/use-event-applications';

export default function ApplicationScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const id = eventId as Id<'events'>;
  const form = useApplicationForm({ eventId: id });
  const [cursor, setCursor] = useState<string | null>(null);
  const history = useApplicationHistory({
    eventId: id,
    paginationOpts: { cursor, numItems: 10 },
  });
  const submit = useSubmitApplication();
  const withdraw = useWithdrawApplication();
  const [draft, setDraft] = useState<ApplicationAnswers | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const answers = draft ?? form?.pending?.answers ?? {};
  async function action(run: () => Promise<unknown>, success: string) {
    setBusy(true);
    setMessage('');
    try {
      await run();
      setMessage(success);
      setDraft(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <DetailScreenTemplate title='My application'>
      <View className='gap-4 pt-4'>
        {form === undefined ? (
          <Text>Loading application…</Text>
        ) : (
          <>
            <Text>
              Approval adds you as an Attendee with a Pending RSVP. Event
              questionnaires remain separate.
            </Text>
            {form.pending || form.canApply ? (
              <>
                {(form.pending?.questions ?? form.settings.questions).map(
                  question => (
                    <View key={question.id} className='gap-2'>
                      <Text>
                        {question.label}
                        {question.required ? ' (required)' : ''}
                      </Text>
                      {question.type === 'YES_NO' ||
                      ['MULTIPLE_CHOICE', 'DROPDOWN', 'CHECKBOXES'].includes(
                        question.type
                      ) ? (
                        (question.type === 'YES_NO'
                          ? ['Yes', 'No']
                          : (question.options ?? [])
                        ).map(option => {
                          const value =
                            question.type === 'YES_NO'
                              ? option === 'Yes'
                              : option;
                          const checked =
                            question.type === 'CHECKBOXES'
                              ? Array.isArray(answers[question.id]) &&
                                (answers[question.id] as string[]).includes(
                                  option
                                )
                              : answers[question.id] === value;
                          return (
                            <Button
                              key={option}
                              variant={checked ? 'default' : 'outline'}
                              accessibilityLabel={`${question.label}: ${option}`}
                              accessibilityRole={
                                question.type === 'CHECKBOXES'
                                  ? 'checkbox'
                                  : 'radio'
                              }
                              accessibilityState={{ checked }}
                              disabled={busy}
                              onPress={() =>
                                setDraft({
                                  ...answers,
                                  [question.id]:
                                    question.type === 'CHECKBOXES'
                                      ? checked
                                        ? (
                                            answers[question.id] as string[]
                                          ).filter(v => v !== option)
                                        : [
                                            ...(Array.isArray(
                                              answers[question.id]
                                            )
                                              ? (answers[
                                                  question.id
                                                ] as string[])
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
                        })
                      ) : (
                        <TextInput
                          accessibilityLabel={question.label}
                          className='rounded-input border border-border p-3 text-foreground'
                          multiline={question.type === 'LONG_ANSWER'}
                          keyboardType={
                            question.type === 'NUMBER' ? 'numeric' : 'default'
                          }
                          editable={!busy}
                          value={String(answers[question.id] ?? '')}
                          onChangeText={value => {
                            const next = { ...answers };
                            if (value === '') delete next[question.id];
                            else
                              next[question.id] =
                                question.type === 'NUMBER'
                                  ? Number(value)
                                  : value;
                            setDraft(next);
                          }}
                        />
                      )}
                    </View>
                  )
                )}
                <Button
                  accessibilityLabel={
                    form.pending ? 'Update application' : 'Submit application'
                  }
                  disabled={busy || !form.canApply}
                  onPress={() =>
                    action(
                      () => submit({ eventId: id, answers }),
                      'Application submitted for review.'
                    )
                  }
                >
                  {form.pending ? 'Update application' : 'Submit application'}
                </Button>
                {form.pending ? (
                  <Button
                    accessibilityLabel='Withdraw application'
                    variant='outline'
                    disabled={busy}
                    onPress={() =>
                      action(
                        () => withdraw({ applicationId: form.pending!._id }),
                        'Application withdrawn.'
                      )
                    }
                  >
                    Withdraw application
                  </Button>
                ) : null}
              </>
            ) : (
              <Text>
                Applying is currently unavailable. Your private history remains
                below.
              </Text>
            )}
          </>
        )}
        {message ? <Text accessibilityRole='alert'>{message}</Text> : null}
        <Text accessibilityRole='header'>Private application history</Text>
        {history?.page.map(application => (
          <View
            key={application._id}
            className='gap-2 rounded-card border border-border p-3'
          >
            <Text>{application.status}</Text>
            {application.questions.map(question => (
              <Text key={question.id}>
                {question.label}:{' '}
                {String(application.answers[question.id] ?? '')}
              </Text>
            ))}
            {application.decisions.map((decision, index) => (
              <Text key={index}>
                {decision.status}
                {decision.reason ? `: ${decision.reason}` : ''}
              </Text>
            ))}
          </View>
        ))}
        {history && !history.isDone ? (
          <Button
            accessibilityLabel='Next history page'
            onPress={() => setCursor(history.continueCursor)}
          >
            Next history page
          </Button>
        ) : null}
        {cursor ? (
          <Button
            accessibilityLabel='First history page'
            onPress={() => setCursor(null)}
          >
            First history page
          </Button>
        ) : null}
      </View>
    </DetailScreenTemplate>
  );
}
