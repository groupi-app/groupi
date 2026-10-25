import { GroupQuestionEditor } from './group-question-editor';
import { useState } from 'react';
import { View } from 'react-native';
import type { Id } from 'convex/_generated/dataModel';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import {
  useJoiningQuestionnaire,
  useConfigureJoiningQuestionnaire,
} from '@/hooks/use-group-questionnaire';
type Question = Parameters<
  ReturnType<typeof useConfigureJoiningQuestionnaire>
>[0]['questions'][number];
export function GroupQuestionnaireSettings({
  groupId,
}: {
  groupId: Id<'groups'>;
}) {
  const form = useJoiningQuestionnaire({ groupId });
  const configure = useConfigureJoiningQuestionnaire();
  const [draft, setDraft] = useState<Question[] | null>(null);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [requiredCompletion, setRequiredCompletion] = useState<boolean | null>(
    null
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  if (form === undefined) return <Text>Loading questionnaire settings…</Text>;
  if (!form.canConfigure)
    return <Text>Only the Group owner can configure this questionnaire.</Text>;
  const questions =
    draft ??
    form.questions.map(({ version: _version, ...question }) => question);
  const active = enabled ?? form.enabled;
  return (
    <View className='gap-3'>
      <Text accessibilityRole='header'>Joining questionnaire settings</Text>
      <Text>
        Admission is immediate. Saved answers and their original definitions
        survive edits and disabling this questionnaire.
      </Text>
      <Button
        accessibilityLabel='Enable joining questionnaire'
        accessibilityRole='checkbox'
        accessibilityState={{ checked: active, disabled: busy }}
        disabled={busy}
        onPress={() => setEnabled(!active)}
      >
        {active ? 'Enabled' : 'Disabled'}
      </Button>
      <Button
        accessibilityLabel='Require completion before Group member content'
        accessibilityRole='checkbox'
        accessibilityState={{
          checked: requiredCompletion ?? form.requiredCompletion,
          disabled: busy,
        }}
        disabled={busy}
        onPress={() =>
          setRequiredCompletion(
            !(requiredCompletion ?? form.requiredCompletion)
          )
        }
      >
        Require completion before Group member content
      </Button>
      <GroupQuestionEditor
        questions={questions}
        onChange={setDraft}
        disabled={busy}
        label='Joining'
      />
      <Button
        disabled={busy}
        accessibilityState={{ disabled: busy, busy }}
        accessibilityLabel='Save joining questionnaire settings'
        onPress={async () => {
          setBusy(true);
          setMessage('');
          try {
            await configure({
              groupId,
              enabled: active,
              questions,
              requiredCompletion: requiredCompletion ?? form.requiredCompletion,
            });
            setDraft(null);
            setEnabled(null);
            setMessage(
              'Settings saved. Existing private records are preserved.'
            );
          } catch (failure) {
            setMessage(
              failure instanceof Error
                ? failure.message
                : 'Could not save settings.'
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        Save settings
      </Button>
      {message ? <Text accessibilityRole='alert'>{message}</Text> : null}
    </View>
  );
}
