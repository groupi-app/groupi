import { useState } from 'react';
import { View, TextInput } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import type { Id } from 'convex/_generated/dataModel';
import { DetailScreenTemplate } from '@/components/templates/detail-screen-template';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import {
  useApplicationForm,
  useApplicationReviewQueue,
  useDecideApplication,
} from '@/hooks/use-event-applications';
export default function ApplicationsScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const id = eventId as Id<'events'>;
  const form = useApplicationForm({ eventId: id });
  const [cursor, setCursor] = useState<string | null>(null);
  const queue = useApplicationReviewQueue(
    form?.canReview
      ? { eventId: id, paginationOpts: { cursor, numItems: 10 } }
      : 'skip'
  );
  const decide = useDecideApplication();
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function review(
    applicationId: Id<'eventApplications'>,
    decision: 'APPROVED' | 'DECLINED'
  ) {
    setBusy(true);
    setMessage('');
    try {
      await decide({
        applicationId,
        decision,
        reason: reasons[applicationId] || undefined,
      });
      setMessage(
        decision === 'APPROVED'
          ? 'Applicant admitted with a Pending RSVP.'
          : 'Application declined.'
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Could not review application.'
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <DetailScreenTemplate title='Review applications'>
      <View className='gap-4 pt-4'>
        {form === undefined ? (
          <Text>Loading review permissions…</Text>
        ) : !form.canReview ? (
          <Text>You cannot review applications for this event.</Text>
        ) : (
          <>
            {queue?.page.map(application => (
              <View
                key={application._id}
                className='gap-2 rounded-card border border-border p-3'
              >
                <Text>
                  {application.applicant?.name ||
                    application.applicant?.username ||
                    'Applicant'}
                </Text>
                <Text>{application.status}</Text>
                {application.questions.map(question => (
                  <Text key={question.id}>
                    {question.label}:{' '}
                    {String(application.answers[question.id] ?? '')}
                  </Text>
                ))}
                {application.status === 'PENDING' ? (
                  <>
                    <TextInput
                      accessibilityLabel={`Decision reason ${application.applicant?.name || application.applicant?.username || 'Applicant'}`}
                      className='rounded-input border border-border p-3 text-foreground'
                      value={reasons[application._id] ?? ''}
                      onChangeText={reason =>
                        setReasons({ ...reasons, [application._id]: reason })
                      }
                    />
                    <Button
                      accessibilityLabel={`Approve ${application.applicant?.name || application.applicant?.username || 'Applicant'}`}
                      disabled={busy}
                      onPress={() => review(application._id, 'APPROVED')}
                    >
                      Approve and admit
                    </Button>
                    <Button
                      accessibilityLabel={`Decline ${application.applicant?.name || application.applicant?.username || 'Applicant'}`}
                      disabled={busy}
                      variant='outline'
                      onPress={() => review(application._id, 'DECLINED')}
                    >
                      Decline
                    </Button>
                  </>
                ) : (
                  application.decisions.map((decision, index) => (
                    <Text key={index}>
                      {decision.status}
                      {decision.reason ? `: ${decision.reason}` : ''}
                    </Text>
                  ))
                )}
              </View>
            ))}
            {queue && !queue.isDone ? (
              <Button
                accessibilityLabel='Next review page'
                onPress={() => setCursor(queue.continueCursor)}
              >
                Next review page
              </Button>
            ) : null}
            {cursor ? (
              <Button
                accessibilityLabel='First review page'
                onPress={() => setCursor(null)}
              >
                First review page
              </Button>
            ) : null}
          </>
        )}
        {message ? <Text accessibilityRole='alert'>{message}</Text> : null}
      </View>
    </DetailScreenTemplate>
  );
}
