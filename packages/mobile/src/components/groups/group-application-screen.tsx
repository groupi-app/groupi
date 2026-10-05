import { Component, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import type { Id } from 'convex/_generated/dataModel';
import type { ApplicationAnswers } from '@groupi/shared/hooks';
import { DetailScreenTemplate } from '@/components/templates/detail-screen-template';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import {
  useGroupApplicationForm,
  useMyGroupApplications,
  useSubmitGroupApplication,
  useEditGroupApplication,
  useWithdrawGroupApplication,
} from '@/hooks/use-group-applications';
import { GroupApplicationQuestions } from './group-application-questions';
export class GroupApplicationBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <DetailScreenTemplate title='Group applications'>
        <Text accessibilityRole='alert'>
          Applications unavailable. You may not have access.
        </Text>
      </DetailScreenTemplate>
    ) : (
      this.props.children
    );
  }
}
export function GroupApplicationScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  return (
    <GroupApplicationBoundary key={groupId}>
      <Application groupId={groupId as Id<'groups'>} />
    </GroupApplicationBoundary>
  );
}
function Application({ groupId }: { groupId: Id<'groups'> }) {
  const form = useGroupApplicationForm({ groupId });
  const [cursor, setCursor] = useState<string | null>(null);
  const history = useMyGroupApplications({
    groupId,
    paginationOpts: { cursor, numItems: 10 },
  });
  const submit = useSubmitGroupApplication();
  const edit = useEditGroupApplication();
  const withdraw = useWithdrawGroupApplication();
  const [draft, setDraft] = useState<ApplicationAnswers | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const answers = draft ?? form?.pending?.answers ?? {};
  async function run(action: () => Promise<unknown>, success: string) {
    setBusy(true);
    setMessage('');
    try {
      await action();
      setDraft(null);
      setMessage(success);
    } catch {
      setMessage(
        'Application could not be updated. Refresh your status and try again.'
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <DetailScreenTemplate title='My Group application'>
      <View className='gap-4 pt-4'>
        <Text>
          Approval adds you to the Group immediately. It does not join any
          Events. Invitations remain a separate joining option.
        </Text>
        {form === undefined ? (
          <Text>Loading application…</Text>
        ) : (
          <>
            {form.pending ? (
              <Text accessibilityLiveRegion='polite'>
                Application pending review
              </Text>
            ) : null}
            {form.pending || form.canApply ? (
              <>
                <GroupApplicationQuestions
                  questions={form.pending?.questions ?? form.questions}
                  answers={answers}
                  onChange={setDraft}
                  disabled={busy || !form.canApply}
                />
                <Button
                  accessibilityLabel={
                    form.pending
                      ? 'Update Group application'
                      : 'Submit Group application'
                  }
                  disabled={busy || !form.canApply}
                  onPress={() =>
                    run(
                      () =>
                        form.pending
                          ? edit({ applicationId: form.pending._id, answers })
                          : submit({ groupId, answers }),
                      'Application submitted for review.'
                    )
                  }
                >
                  {form.pending ? 'Update application' : 'Submit application'}
                </Button>
                {form.pending ? (
                  <Button
                    accessibilityLabel='Withdraw Group application'
                    variant='outline'
                    disabled={busy}
                    onPress={() =>
                      run(
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
                accessible.
              </Text>
            )}
          </>
        )}
        {message ? <Text accessibilityRole='alert'>{message}</Text> : null}
        <Text accessibilityRole='header'>Private application history</Text>
        {history === undefined ? (
          <Text>Loading private history…</Text>
        ) : history.page.length === 0 ? (
          <Text>No applications on this page.</Text>
        ) : (
          history.page.map(a => (
            <View
              key={a._id}
              className='gap-2 rounded-card border border-border p-3'
            >
              <Text>{a.status}</Text>
              {a.questions.map(q => (
                <Text key={q.id}>
                  {q.label}: {String(a.answers[q.id] ?? '')}
                </Text>
              ))}
              {a.decisions.map((d, i) => (
                <Text key={i}>{d.status}</Text>
              ))}
              {a.status === 'APPROVED' ? (
                <Button
                  accessibilityLabel='Open approved Group'
                  onPress={() => router.push(`/groups/${groupId}`)}
                >
                  Open Group
                </Button>
              ) : null}
            </View>
          ))
        )}
        {history && !history.isDone ? (
          <Button
            accessibilityLabel='Next Group application history page'
            onPress={() => setCursor(history.continueCursor)}
          >
            Next history page
          </Button>
        ) : null}
        {cursor ? (
          <Button
            accessibilityLabel='First Group application history page'
            onPress={() => setCursor(null)}
          >
            First history page
          </Button>
        ) : null}
      </View>
    </DetailScreenTemplate>
  );
}
