import { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import type { Id } from 'convex/_generated/dataModel';
import { DetailScreenTemplate } from '@/components/templates/detail-screen-template';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import {
  useGroupApplicationForm,
  useGroupApplications,
  useReviewGroupApplication,
} from '@/hooks/use-group-applications';
import { GroupApplicationBoundary } from './group-application-screen';
export function GroupApplicationReviewScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  return (
    <GroupApplicationBoundary key={groupId}>
      <Review groupId={groupId as Id<'groups'>} />
    </GroupApplicationBoundary>
  );
}
function Review({ groupId }: { groupId: Id<'groups'> }) {
  const form = useGroupApplicationForm({ groupId });
  const [cursor, setCursor] = useState<string | null>(null);
  const queue = useGroupApplications(
    form?.canReview
      ? { groupId, paginationOpts: { cursor, numItems: 10 } }
      : 'skip'
  );
  const review = useReviewGroupApplication();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function decide(
    applicationId: Id<'groupApplications'>,
    decision: 'APPROVED' | 'DECLINED'
  ) {
    setBusy(true);
    setMessage('');
    try {
      await review({ applicationId, decision });
      setMessage(
        decision === 'APPROVED'
          ? 'Applicant admitted to the Group. No Event participation was added.'
          : 'Application declined.'
      );
    } catch {
      setMessage(
        'Review unavailable. Your authority or the application status may have changed.'
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <DetailScreenTemplate title='Review Group applications'>
      <View className='gap-4 pt-4'>
        {form === undefined ? (
          <Text>Loading review permissions…</Text>
        ) : !form.canReview ? (
          <Text>Application review unavailable.</Text>
        ) : (
          <>
            {queue === undefined ? (
              <Text>Loading applications…</Text>
            ) : queue.page.length === 0 ? (
              <Text>No applications on this page.</Text>
            ) : (
              queue.page.map(a => (
                <View
                  key={a._id}
                  className='gap-2 rounded-card border border-border p-3'
                >
                  <Text>
                    {a.applicant.name ?? a.applicant.username ?? 'Applicant'}
                  </Text>
                  <Text>{a.status}</Text>
                  {a.questions.map(q => (
                    <Text key={q.id}>
                      {q.label}: {String(a.answers[q.id] ?? '')}
                    </Text>
                  ))}
                  {a.status === 'PENDING' ? (
                    <>
                      <Button
                        accessibilityLabel={`Approve Group application ${a._id}`}
                        disabled={busy}
                        onPress={() => decide(a._id, 'APPROVED')}
                      >
                        Approve and admit
                      </Button>
                      <Button
                        accessibilityLabel={`Decline Group application ${a._id}`}
                        variant='outline'
                        disabled={busy}
                        onPress={() => decide(a._id, 'DECLINED')}
                      >
                        Decline
                      </Button>
                    </>
                  ) : (
                    a.decisions.map((d, i) => <Text key={i}>{d.status}</Text>)
                  )}
                </View>
              ))
            )}
            {queue && !queue.isDone ? (
              <Button
                accessibilityLabel='Next Group review page'
                onPress={() => setCursor(queue.continueCursor)}
              >
                Next review page
              </Button>
            ) : null}
            {cursor ? (
              <Button
                accessibilityLabel='First Group review page'
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
