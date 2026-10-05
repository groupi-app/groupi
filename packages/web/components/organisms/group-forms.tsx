'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Id } from '@/convex/_generated/dataModel';
import {
  groupFormTemplates,
  type ApplicationQuestion,
  type ApplicationAnswers,
} from '@groupi/shared/hooks';
import { useGroup } from '@/hooks/convex/use-groups';
import {
  useForm,
  useForms,
  useFormHistory,
  useFormResults,
  useFormPolicy,
  useConfigureFormPolicy,
  useCreateForm,
  useConfigureForm,
  useSubmitFormResponse,
  useRemoveFormResponse,
  useRemoveFormResult,
  useDeleteForm,
} from '@/hooks/convex/use-group-forms';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ApplicationQuestionEditor,
  ApplicationQuestionFields,
} from './application-question-fields';
import { GroupConfirmedAction } from './group-confirmed-action';
const failure = (error: unknown) =>
  error instanceof Error
    ? error.message
    : 'Operation failed. Inspect current state before repeating.';
export function GroupForms({ groupId }: { groupId: Id<'groups'> }) {
  const group = useGroup(groupId);
  const policy = useFormPolicy({ groupId });
  const setPolicy = useConfigureFormPolicy();
  const [cursor, setCursor] = useState<string | null>(null);
  const [error, setError] = useState('');
  const canAccess =
    group && group.joiningQuestionnaire?.canAccessMemberContent !== false;
  const forms = useForms(
    canAccess && policy?.enabled
      ? { groupId, paginationOpts: { numItems: 20, cursor } }
      : 'skip'
  );
  if (!group || !policy) return <p role='status'>Loading forms…</p>;
  return (
    <main className='p-6 space-y-4'>
      <h1 className='text-2xl font-bold'>Group forms</h1>
      <p>
        Independent ongoing forms. They do not change joining requirements or
        enable tools on Events.
      </p>
      {policy.canConfigure && (
        <section
          className='rounded-card border border-border p-4 space-y-3'
          aria-label='Form availability policy'
        >
          <h2>Owner settings</h2>
          <Button
            onClick={async () => {
              try {
                await setPolicy({
                  groupId,
                  enabled: !policy.enabled,
                  creation: policy.creation,
                });
              } catch (e) {
                setError(failure(e));
              }
            }}
          >
            {policy.enabled ? 'Disable forms' : 'Enable forms'}
          </Button>
          <Label htmlFor='form-creation-policy'>Who can create forms?</Label>
          <select
            id='form-creation-policy'
            value={policy.creation}
            onChange={async e => {
              try {
                await setPolicy({
                  groupId,
                  enabled: policy.enabled,
                  creation:
                    e.target.value === 'MEMBERS' ? 'MEMBERS' : 'MANAGERS',
                });
              } catch (e) {
                setError(failure(e));
              }
            }}
          >
            <option value='MANAGERS'>Owners and moderators</option>
            <option value='MEMBERS'>Any eligible member</option>
          </select>
        </section>
      )}
      {!canAccess ? (
        <p>
          Complete required onboarding before using ordinary forms. Your own
          saved history remains available by its original form link.
        </p>
      ) : !policy.enabled ? (
        <p>
          Forms are disabled. Configuration and saved responses are preserved.
        </p>
      ) : (
        <>
          {(policy.creation === 'MEMBERS' || group.viewerRole !== 'MEMBER') && (
            <Link
              className='text-primary underline'
              href={`/groups/${groupId}/forms/new`}
            >
              Create form
            </Link>
          )}
          {forms?.page.map(form => (
            <div
              key={form._id}
              className='rounded-card border border-border p-4'
            >
              <Link
                className='text-primary underline'
                href={`/groups/${groupId}/forms/${form._id}`}
              >
                {form.title}
              </Link>
              <p>{form.description}</p>
              <p>
                {form.resultsVisibility === 'MEMBERS'
                  ? 'Shared responses visible to eligible members'
                  : 'Personal answers visible to you and current managers'}
              </p>
            </div>
          ))}
          {forms && !forms.isDone && (
            <Button onClick={() => setCursor(forms.continueCursor)}>
              Next forms
            </Button>
          )}
        </>
      )}
      {error && <p role='alert'>{error}</p>}
    </main>
  );
}
export function GroupFormEditor({
  groupId,
  toolId,
}: {
  groupId: Id<'groups'>;
  toolId?: Id<'groupTools'>;
}) {
  const form = useForm(toolId ? { toolId } : 'skip');
  if (!toolId) return <NewFormEditor groupId={groupId} />;
  if (toolId && !form) return <p role='status'>Loading form settings…</p>;
  if (form && form.groupId !== groupId)
    return <p role='alert'>Form unavailable in this Group.</p>;
  if (form && !form.canManage)
    return (
      <p role='alert'>Only current eligible managers can manage this form.</p>
    );
  return (
    <FormEditor key={form?.version ?? 'new'} groupId={groupId} initial={form} />
  );
}
function NewFormEditor({ groupId }: { groupId: Id<'groups'> }) {
  const group = useGroup(groupId);
  const policy = useFormPolicy({ groupId });
  if (group === undefined || policy === undefined)
    return <p role='status'>Loading form creation policy…</p>;
  if (!group) return <p role='alert'>Group unavailable.</p>;
  if (group.joiningQuestionnaire?.canAccessMemberContent === false)
    return (
      <p role='alert'>
        Complete required onboarding before creating ordinary forms.
      </p>
    );
  if (
    !policy.enabled ||
    (policy.creation === 'MANAGERS' && group.viewerRole === 'MEMBER')
  )
    return (
      <p role='alert'>
        Form creation is unavailable under the current owner policy.
      </p>
    );
  return <FormEditor groupId={groupId} initial={undefined} />;
}
function FormEditor({
  groupId,
  initial,
}: {
  groupId: Id<'groups'>;
  initial: ReturnType<typeof useForm>;
}) {
  const create = useCreateForm();
  const configure = useConfigureForm();
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? 'New form');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [questions, setQuestions] = useState<ApplicationQuestion[]>(
    initial?.questions ?? []
  );
  const [visibility, setVisibility] = useState<'MANAGERS' | 'MEMBERS'>(
    initial?.resultsVisibility ?? 'MANAGERS'
  );
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <main className='p-6 space-y-4'>
      <h1>{initial ? 'Manage form' : 'Create form'}</h1>
      {!initial && (
        <div aria-label='Reusable form templates'>
          {groupFormTemplates.map(template => (
            <Button
              key={template.id}
              variant='outline'
              onClick={() => {
                setTitle(template.title);
                setDescription(template.description);
                setQuestions(template.questions.map(q => ({ ...q })));
              }}
            >
              Use {template.id} template
            </Button>
          ))}
        </div>
      )}
      <form
        className='space-y-4'
        onSubmit={async event => {
          event.preventDefault();
          setBusy(true);
          setError('');
          try {
            if (initial) {
              await configure({
                toolId: initial._id,
                version: initial.version,
                title,
                description,
                questions,
              });
              router.push(`/groups/${groupId}/forms/${initial._id}`);
            } else {
              const id = await create({
                groupId,
                title,
                description,
                questions,
                resultsVisibility: visibility,
              });
              router.push(`/groups/${groupId}/forms/${id}`);
            }
          } catch (e) {
            setError(
              `${failure(e)} Creation is not automatically retried; inspect the form list before repeating an uncertain creation.`
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <Label htmlFor='ordinary-form-title'>Form title</Label>
        <Input
          id='ordinary-form-title'
          value={title}
          onChange={e => setTitle(e.target.value)}
          maxLength={100}
          required
          disabled={busy}
        />
        <Label htmlFor='ordinary-form-description'>Description</Label>
        <Input
          id='ordinary-form-description'
          value={description}
          onChange={e => setDescription(e.target.value)}
          maxLength={2000}
          disabled={busy}
        />
        {!initial && (
          <>
            <Label htmlFor='ordinary-form-visibility'>
              Response visibility (fixed for this form)
            </Label>
            <select
              id='ordinary-form-visibility'
              value={visibility}
              onChange={e =>
                setVisibility(
                  e.target.value === 'MEMBERS' ? 'MEMBERS' : 'MANAGERS'
                )
              }
              disabled={busy}
            >
              <option value='MANAGERS'>
                Personal: you and current managers
              </option>
              <option value='MEMBERS'>Shared: all eligible members</option>
            </select>
          </>
        )}
        <p>
          Configuration changes preserve saved answers and their original
          question definitions. Current-version answers require review before
          saving. This is not the joining questionnaire.
        </p>
        <ApplicationQuestionEditor
          title='Form questions'
          requiredLabel='Answer required'
          questions={questions}
          onChange={setQuestions}
          disabled={busy}
        />
        <Button disabled={busy}>
          {initial ? 'Save form settings' : 'Create form'}
        </Button>
        {error && <p role='alert'>{error}</p>}
      </form>
    </main>
  );
}
export function GroupFormInteraction({
  groupId,
  toolId,
}: {
  groupId: Id<'groups'>;
  toolId: Id<'groupTools'>;
}) {
  const form = useForm({ toolId });
  if (!form) return <p role='status'>Loading form…</p>;
  if (form.groupId !== groupId)
    return <p role='alert'>Form unavailable in this Group.</p>;
  return (
    <FormInteraction
      key={`${form.version}:${form.responseRevision}`}
      form={form}
      groupId={groupId}
    />
  );
}
function FormInteraction({
  form,
  groupId,
}: {
  form: NonNullable<ReturnType<typeof useForm>>;
  groupId: Id<'groups'>;
}) {
  const submit = useSubmitFormResponse();
  const remove = useRemoveFormResponse();
  const deleteForm = useDeleteForm();
  const router = useRouter();
  const [answers, setAnswers] = useState<ApplicationAnswers>(form.answers);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  return (
    <main className='p-6 space-y-4'>
      <h1>{form.title}</h1>
      <p>{form.description}</p>
      <p>
        {form.resultsVisibility === 'MEMBERS'
          ? 'Shared contribution: eligible Group members can see your latest answers. On account deletion, that shared contribution survives anonymously; your private revision history is purged.'
          : 'Personal answers: only you and current eligible Group managers can see them. Account deletion purges your answers and history.'}{' '}
        Managers may moderate ordinary responses. Removing your response also
        removes its history.
      </p>
      <form
        className='space-y-4'
        onSubmit={async e => {
          e.preventDefault();
          setBusy(true);
          setMessage('');
          try {
            await submit({
              toolId: form._id,
              version: form.version,
              expectedRevision: form.responseRevision,
              answers,
            });
            setMessage('Response saved.');
          } catch (error) {
            setMessage(failure(error));
          } finally {
            setBusy(false);
          }
        }}
      >
        <ApplicationQuestionFields
          questions={form.questions}
          answers={answers}
          onChange={setAnswers}
          disabled={busy}
        />
        <Button disabled={busy}>Save response</Button>
      </form>
      {form.savedVersion !== null && (
        <GroupConfirmedAction
          label='Remove my response'
          confirmation='Confirm removing my response and its history'
          explanation='Your latest response and private revision history will be removed.'
          onConfirm={() => remove({ toolId: form._id })}
        />
      )}
      <Link
        className='text-primary underline'
        href={`/groups/${groupId}/forms/${form._id}/history`}
      >
        My saved answer history
      </Link>
      {form.canManage && (
        <>
          <Link
            className='text-primary underline'
            href={`/groups/${groupId}/forms/${form._id}/settings`}
          >
            Manage form settings
          </Link>
          <GroupConfirmedAction
            label='Delete form'
            confirmation='Confirm deleting form and all responses'
            explanation='This permanently removes the form and all response history.'
            onConfirm={async () => {
              await deleteForm({ toolId: form._id });
              router.push(`/groups/${groupId}/forms`);
            }}
          />
        </>
      )}
      {message && <p role='status'>{message}</p>}
      {form.canReview && (
        <GroupFormResults toolId={form._id} canManage={form.canManage} />
      )}
    </main>
  );
}
function SavedAnswers({
  questions,
  answers,
}: {
  questions: ApplicationQuestion[];
  answers: ApplicationAnswers;
}) {
  return (
    <dl>
      {questions.map(q => {
        const value = answers[q.id];
        return (
          <div key={q.id}>
            <dt>{q.label}</dt>
            <dd>
              {Array.isArray(value)
                ? value.join(', ')
                : String(value ?? 'No answer')}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
export function GroupFormHistory({ toolId }: { toolId: Id<'groupTools'> }) {
  const [cursor, setCursor] = useState<string | null>(null);
  const history = useFormHistory({
    toolId,
    paginationOpts: { numItems: 20, cursor },
  });
  const remove = useRemoveFormResponse();
  return (
    <section className='p-6 space-y-4'>
      <h1>My saved form history</h1>
      <p>
        Only your retained answers and original definitions are shown. Current
        private questions are not exposed by this recovery view.
      </p>
      {history?.page.map(row => (
        <div className='rounded-card border border-border p-4' key={row._id}>
          <p>
            Response revision {row.revision}, form version {row.version}
          </p>
          <SavedAnswers questions={row.questions} answers={row.answers} />
        </div>
      ))}
      {history && !history.isDone && (
        <Button onClick={() => setCursor(history.continueCursor)}>
          Next history
        </Button>
      )}
      <GroupConfirmedAction
        label='Remove my response and history'
        confirmation='Confirm removing my response and history'
        explanation='All your saved responses to this form will be removed.'
        onConfirm={() => remove({ toolId })}
      />
    </section>
  );
}
function GroupFormResults({
  toolId,
  canManage,
}: {
  toolId: Id<'groupTools'>;
  canManage: boolean;
}) {
  const [cursor, setCursor] = useState<string | null>(null);
  const results = useFormResults({
    toolId,
    paginationOpts: { numItems: 20, cursor },
  });
  const remove = useRemoveFormResult();
  return (
    <section className='space-y-3'>
      <h2>Latest responses</h2>
      {results?.page.map(row => (
        <div key={row._id} className='rounded-card border border-border p-4'>
          <p>
            {row.personId
              ? 'Group member contribution'
              : 'Anonymous contribution'}{' '}
            · form version {row.version}
          </p>
          <SavedAnswers questions={row.questions} answers={row.answers} />
          {canManage && (
            <GroupConfirmedAction
              label='Remove response'
              confirmation='Confirm removing this response'
              explanation='Moderation removes this response and associated private history.'
              onConfirm={() => remove({ responseId: row._id })}
            />
          )}
        </div>
      ))}
      {results && !results.isDone && (
        <Button onClick={() => setCursor(results.continueCursor)}>
          Next responses
        </Button>
      )}
    </section>
  );
}
