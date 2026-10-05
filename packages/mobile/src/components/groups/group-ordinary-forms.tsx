import { useState, type ReactNode } from 'react';
import { View, TextInput } from 'react-native';
import { router } from 'expo-router';
import type { Id } from 'convex/_generated/dataModel';
import { groupFormTemplates } from '@groupi/shared/utils';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { showConfirmDialog } from '@/components/ui/confirm-dialog';
import { useGroup } from '@/hooks/use-groups';
import * as hooks from '@/hooks/use-group-forms';
import { GroupQuestionEditor } from './group-question-editor';
import { GroupQuestionField } from './group-questionnaire';
import { GroupPageControls } from './group-page-controls';
type Form = NonNullable<ReturnType<typeof hooks.useForm>>;
type GroupId = Id<'groups'>;
type ToolId = Id<'groupTools'>;
function valueText(value: Form['answers'][string] | undefined) {
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
export function OrdinaryFormGate({
  groupId,
  children,
}: {
  groupId: GroupId;
  children: ReactNode;
}) {
  const group = useGroup(groupId);
  const policy = hooks.useFormPolicy(group ? { groupId } : 'skip');
  if (group === undefined) return <Text>Loading Group…</Text>;
  if (!group) return <Text>Current Group membership is required.</Text>;
  if (group.joiningQuestionnaire?.canAccessMemberContent === false)
    return (
      <View className='gap-3'>
        <Text>Complete required onboarding before accessing Group forms.</Text>
        <Button
          accessibilityLabel='Complete required Group onboarding'
          onPress={() => router.push(`/groups/${groupId}/questionnaire`)}
        >
          Complete onboarding
        </Button>
      </View>
    );
  if (policy === undefined) return <Text>Loading forms policy…</Text>;
  if (!policy.enabled)
    return (
      <Text>
        Forms are disabled. Your own saved history remains available through its
        direct link.
      </Text>
    );
  return <>{children}</>;
}
export function GroupFormsHub({ groupId }: { groupId: GroupId }) {
  return (
    <View className='gap-3'>
      <Button
        accessibilityLabel='Group form policy'
        onPress={() => router.push(`/groups/${groupId}/forms/policy`)}
      >
        Forms policy
      </Button>
      <OrdinaryFormGate groupId={groupId}>
        <FormsList groupId={groupId} />
      </OrdinaryFormGate>
    </View>
  );
}
function FormsList({ groupId }: { groupId: GroupId }) {
  const [cursor, setCursor] = useState<string | null>(null);
  const page = hooks.useForms({
    groupId,
    paginationOpts: { numItems: 20, cursor },
  });
  const policy = hooks.useFormPolicy({ groupId });
  const group = useGroup(groupId);
  return (
    <View className='gap-3'>
      {policy && (policy.creation === 'MEMBERS' || group?.canManageMembers) ? (
        <Button
          accessibilityLabel='Create Group form'
          onPress={() => router.push(`/groups/${groupId}/forms/create`)}
        >
          Create form
        </Button>
      ) : null}
      {page === undefined ? (
        <Text>Loading forms…</Text>
      ) : page.page.length === 0 ? (
        <Text>No forms on this page.</Text>
      ) : (
        page.page.map(form => (
          <Button
            key={form._id}
            variant='outline'
            accessibilityLabel={`Open form ${form.title}`}
            onPress={() => router.push(`/groups/${groupId}/forms/${form._id}`)}
          >
            {form.title}
          </Button>
        ))
      )}
      <GroupPageControls
        page={page}
        cursor={cursor}
        onPage={setCursor}
        label='Forms'
      />
    </View>
  );
}
export function GroupFormPolicy({ groupId }: { groupId: GroupId }) {
  const policy = hooks.useFormPolicy({ groupId });
  const configure = hooks.useConfigureFormPolicy();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  if (!policy) return <Text>Loading forms policy…</Text>;
  if (!policy.canConfigure)
    return <Text>Only the Group owner can configure forms policy.</Text>;
  async function save(enabled: boolean, creation: 'MANAGERS' | 'MEMBERS') {
    setBusy(true);
    try {
      await configure({ groupId, enabled, creation });
      setMessage('Forms policy saved.');
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Could not save policy.'
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <View className='gap-3'>
      <Text>
        Owner policy controls ordinary forms, separately from admission and
        joining questionnaires. Disabling forms preserves saved responses.
      </Text>
      <Button
        accessibilityLabel='Enable Group forms'
        accessibilityRole='checkbox'
        accessibilityState={{ checked: policy.enabled, disabled: busy }}
        disabled={busy}
        onPress={() => save(!policy.enabled, policy.creation)}
      >
        {policy.enabled ? 'Forms enabled' : 'Forms disabled'}
      </Button>
      {(['MANAGERS', 'MEMBERS'] as const).map(creation => (
        <Button
          key={creation}
          accessibilityLabel={`Form creation ${creation}`}
          accessibilityRole='radio'
          accessibilityState={{
            checked: policy.creation === creation,
            disabled: busy,
          }}
          disabled={busy}
          onPress={() => save(policy.enabled, creation)}
        >
          {creation === 'MANAGERS'
            ? 'Managers create forms'
            : 'All members create forms'}
        </Button>
      ))}
      {message ? <Text accessibilityRole='alert'>{message}</Text> : null}
    </View>
  );
}
export function GroupOrdinaryFormEditor({
  groupId,
  toolId,
}: {
  groupId: GroupId;
  toolId?: ToolId;
}) {
  return (
    <OrdinaryFormGate groupId={groupId}>
      <EditorLoader groupId={groupId} toolId={toolId} />
    </OrdinaryFormGate>
  );
}
function EditorLoader({
  groupId,
  toolId,
}: {
  groupId: GroupId;
  toolId?: ToolId;
}) {
  const form = hooks.useForm(toolId ? { toolId } : 'skip');
  const policy = hooks.useFormPolicy({ groupId });
  const group = useGroup(groupId);
  if (toolId && !form) return <Text>Loading form…</Text>;
  if (form && form.groupId !== groupId)
    return <Text>Form belongs to another Group.</Text>;
  if (
    form
      ? !form.canManage
      : policy?.creation !== 'MEMBERS' && !group?.canManageMembers
  )
    return <Text>Form management is unavailable under owner policy.</Text>;
  return (
    <FormEditor key={form?.version ?? 'new'} groupId={groupId} form={form} />
  );
}
function FormEditor({ groupId, form }: { groupId: GroupId; form?: Form }) {
  const create = hooks.useCreateForm();
  const configure = hooks.useConfigureForm();
  const remove = hooks.useDeleteForm();
  const [title, setTitle] = useState(form?.title ?? 'New form');
  const [description, setDescription] = useState(form?.description ?? '');
  const [questions, setQuestions] = useState<Form['questions']>(
    form?.questions ?? []
  );
  const [visibility, setVisibility] = useState<'MANAGERS' | 'MEMBERS'>(
    form?.resultsVisibility ?? 'MANAGERS'
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function save() {
    setBusy(true);
    try {
      const data = { title, description, questions };
      if (form) {
        await configure({ toolId: form._id, version: form.version, ...data });
        setMessage('Form saved. Original answered definitions are retained.');
      } else {
        const id = await create({
          groupId,
          ...data,
          resultsVisibility: visibility,
        });
        router.replace(`/groups/${groupId}/forms/${id}`);
      }
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Could not save form.'
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <View className='gap-3'>
      {!form
        ? groupFormTemplates.map(template => (
            <Button
              key={template.id}
              disabled={busy}
              accessibilityLabel={`Use form template ${template.title}`}
              onPress={() => {
                setTitle(template.title);
                setDescription(template.description);
                setQuestions(template.questions.map(q => ({ ...q })));
              }}
            >
              {template.title}
            </Button>
          ))
        : null}
      <TextInput
        accessibilityLabel='Form title'
        editable={!busy}
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        accessibilityLabel='Form description'
        editable={!busy}
        value={description}
        onChangeText={setDescription}
        multiline
      />
      <Text>Results visibility is fixed at creation.</Text>
      {form ? (
        <Text>
          {visibility === 'MANAGERS'
            ? 'Private to managers'
            : 'Shared with members'}
        </Text>
      ) : (
        (['MANAGERS', 'MEMBERS'] as const).map(mode => (
          <Button
            key={mode}
            disabled={busy}
            accessibilityLabel={`Form results ${mode}`}
            accessibilityRole='radio'
            accessibilityState={{
              checked: visibility === mode,
              disabled: busy,
            }}
            onPress={() => setVisibility(mode)}
          >
            {mode === 'MANAGERS'
              ? 'Private to managers'
              : 'Shared with members'}
          </Button>
        ))
      )}
      <GroupQuestionEditor
        questions={questions}
        onChange={setQuestions}
        disabled={busy}
      />
      <Button
        accessibilityLabel='Save Group form'
        disabled={busy}
        accessibilityState={{ busy, disabled: busy }}
        onPress={save}
      >
        Save form
      </Button>
      {form ? (
        <Button
          accessibilityLabel='Delete Group form'
          disabled={busy}
          onPress={() =>
            showConfirmDialog({
              title: 'Delete form?',
              message:
                'This permanently deletes this form and all saved responses and revisions.',
              destructive: true,
              onConfirm: () => {
                setBusy(true);
                void remove({ toolId: form._id })
                  .then(() => router.replace(`/groups/${groupId}/forms`))
                  .catch(error =>
                    setMessage(
                      error instanceof Error
                        ? error.message
                        : 'Could not delete form.'
                    )
                  )
                  .finally(() => setBusy(false));
              },
            })
          }
        >
          Delete form
        </Button>
      ) : null}
      {message ? <Text accessibilityRole='alert'>{message}</Text> : null}
    </View>
  );
}
export function GroupOrdinaryForm({
  groupId,
  toolId,
}: {
  groupId: GroupId;
  toolId: ToolId;
}) {
  return (
    <View className='gap-3'>
      <Button
        accessibilityLabel='My form response history'
        onPress={() =>
          router.push(`/groups/${groupId}/forms/${toolId}/history`)
        }
      >
        My saved response history
      </Button>
      <OrdinaryFormGate groupId={groupId}>
        <AnswerLoader groupId={groupId} toolId={toolId} />
      </OrdinaryFormGate>
    </View>
  );
}
function AnswerLoader({
  groupId,
  toolId,
}: {
  groupId: GroupId;
  toolId: ToolId;
}) {
  const form = hooks.useForm({ toolId });
  if (!form) return <Text>Loading form…</Text>;
  if (form.groupId !== groupId)
    return <Text>Form belongs to another Group.</Text>;
  return (
    <FormAnswers
      key={`${form.version}-${form.responseRevision}`}
      groupId={groupId}
      form={form}
    />
  );
}
function FormAnswers({ groupId, form }: { groupId: GroupId; form: Form }) {
  const submit = hooks.useSubmitFormResponse();
  const remove = hooks.useRemoveFormResponse();
  const [answers, setAnswers] = useState(form.answers);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function run(action: () => Promise<unknown>, success: string) {
    setBusy(true);
    try {
      await action();
      setMessage(success);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Could not save response.'
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <View className='gap-3'>
      <Text accessibilityRole='header'>{form.title}</Text>
      <Text>{form.description}</Text>
      <Text>
        {form.resultsVisibility === 'MANAGERS'
          ? 'Private answers are visible to managers and are purged when you leave or are removed from this Group, or delete your account.'
          : 'Shared answers are visible to eligible members. After leaving, removal, or account deletion they persist anonymously; membership identity is removed.'}
      </Text>
      {form.questions.map(q => (
        <GroupQuestionField
          key={q.id}
          question={q}
          value={answers[q.id]}
          disabled={busy}
          onChange={value => {
            const next = { ...answers };
            if (value === undefined) delete next[q.id];
            else next[q.id] = value;
            setAnswers(next);
          }}
        />
      ))}
      <Button
        accessibilityLabel='Save Group form answers'
        disabled={busy}
        accessibilityState={{ busy, disabled: busy }}
        onPress={() =>
          run(
            () =>
              submit({
                toolId: form._id,
                version: form.version,
                expectedRevision: form.responseRevision,
                answers,
              }),
            'Answers saved.'
          )
        }
      >
        Save answers
      </Button>
      {form.savedVersion !== null ? (
        <>
          <Text>Saved definitions from version {form.savedVersion}</Text>
          {form.savedQuestions.map(q => (
            <Text key={q.id}>
              {q.label} · {q.type.toLowerCase().replaceAll('_', ' ')}
            </Text>
          ))}
          <Button
            accessibilityLabel='Remove my form response'
            disabled={busy}
            onPress={() =>
              showConfirmDialog({
                title: 'Remove your response?',
                message: 'This deletes your saved response and its history.',
                destructive: true,
                onConfirm: () =>
                  void run(
                    () => remove({ toolId: form._id }),
                    'Response removed.'
                  ),
              })
            }
          >
            Remove my response
          </Button>
        </>
      ) : null}
      {form.canManage ? (
        <Button
          accessibilityLabel='Manage Group form'
          onPress={() =>
            router.push(`/groups/${groupId}/forms/${form._id}/manage`)
          }
        >
          Manage form
        </Button>
      ) : null}
      {form.canReview ? (
        <Button
          accessibilityLabel='View Group form results'
          onPress={() =>
            router.push(`/groups/${groupId}/forms/${form._id}/results`)
          }
        >
          Results
        </Button>
      ) : null}
      {message ? <Text accessibilityRole='alert'>{message}</Text> : null}
    </View>
  );
}
export function GroupOrdinaryFormResults({
  groupId,
  toolId,
}: {
  groupId: GroupId;
  toolId: ToolId;
}) {
  return (
    <OrdinaryFormGate groupId={groupId}>
      <ResultsLoader groupId={groupId} toolId={toolId} />
    </OrdinaryFormGate>
  );
}
function ResultsLoader({
  groupId,
  toolId,
}: {
  groupId: GroupId;
  toolId: ToolId;
}) {
  const form = hooks.useForm({ toolId });
  if (!form) return <Text>Loading result permissions…</Text>;
  if (form.groupId !== groupId || !form.canReview)
    return <Text>Results are private to Group managers.</Text>;
  return <ResponseRecords toolId={toolId} canManage={form.canManage} />;
}
export function GroupOrdinaryFormHistory({ toolId }: { toolId: ToolId }) {
  return <ResponseRecords toolId={toolId} history />;
}
function ResponseRecords({
  toolId,
  history = false,
  canManage = false,
}: {
  toolId: ToolId;
  history?: boolean;
  canManage?: boolean;
}) {
  const [cursor, setCursor] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const args = { toolId, paginationOpts: { numItems: 20, cursor } };
  const own = hooks.useFormHistory(history ? args : 'skip');
  const results = hooks.useFormResults(history ? 'skip' : args);
  const page = history ? own : results;
  const remove = hooks.useRemoveFormResult();
  const removeOwn = hooks.useRemoveFormResponse();
  return (
    <View className='gap-3'>
      <Text>Saved responses retain their original question definitions.</Text>
      {page === undefined ? (
        <Text>Loading saved responses…</Text>
      ) : page.page.length === 0 ? (
        <Text>No saved responses on this page.</Text>
      ) : (
        page.page.map(record => (
          <View
            key={record._id}
            className='gap-2 rounded-card border border-border p-3'
          >
            <Text>
              {record.personId ? 'Member response' : 'Anonymous response'} ·
              revision {record.revision} · form version {record.version}
            </Text>
            {record.questions.map(q => (
              <Text key={q.id}>
                {q.label}: {valueText(record.answers[q.id])}
              </Text>
            ))}
            <Text>{new Date(record.updatedAt).toLocaleString()}</Text>
            {!history && canManage ? (
              <Button
                accessibilityLabel={`Remove form result ${record._id}`}
                disabled={busy}
                onPress={() =>
                  showConfirmDialog({
                    title: 'Remove result?',
                    message:
                      'This permanently removes the response. Identified response history is also removed.',
                    destructive: true,
                    onConfirm: () => {
                      setBusy(true);
                      void remove({
                        responseId: record._id as Id<'groupFormResponses'>,
                      })
                        .then(() => setMessage('Result removed.'))
                        .catch(error =>
                          setMessage(
                            error instanceof Error
                              ? error.message
                              : 'Could not remove result.'
                          )
                        )
                        .finally(() => setBusy(false));
                    },
                  })
                }
              >
                Remove result
              </Button>
            ) : null}
          </View>
        ))
      )}
      {history && page && page.page.length > 0 ? (
        <Button
          accessibilityLabel='Remove my saved form history'
          disabled={busy}
          onPress={() =>
            showConfirmDialog({
              title: 'Remove your response and history?',
              message:
                'This permanently removes your saved response and all your identified revisions.',
              destructive: true,
              onConfirm: () => {
                setBusy(true);
                void removeOwn({ toolId })
                  .then(() =>
                    setMessage('Your response and history were removed.')
                  )
                  .catch(error =>
                    setMessage(
                      error instanceof Error
                        ? error.message
                        : 'Could not remove history.'
                    )
                  )
                  .finally(() => setBusy(false));
              },
            })
          }
        >
          Remove my response and history
        </Button>
      ) : null}
      <GroupPageControls
        page={page}
        cursor={cursor}
        onPage={setCursor}
        label={history ? 'Form history' : 'Form results'}
      />
      {message ? <Text accessibilityRole='alert'>{message}</Text> : null}
    </View>
  );
}
