'use client';
import { Save as ActionSave } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Id } from '@/convex/_generated/dataModel';
import {
  type ApplicationQuestion,
  type ApplicationAnswers,
} from '@groupi/shared/hooks';
import {
  useToolOwner as useGroup,
  useContentBase,
  type ContentOwnerId,
} from '@/features/content/tool-scope';
import {
  useForm,
  useFormManagement,
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
import { Textarea } from '@/components/ui/textarea';
import {
  ContentPage,
  ContentKind,
  ContentSettings,
  contentCanvas,
  contentTitleField,
  contentDescriptionField,
} from '@/features/content/content-design';
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
export function GroupForms({ groupId }: { groupId: ContentOwnerId }) {
  const base = useContentBase(groupId);
  const group = useGroup(groupId);
  const policy = useFormPolicy({ groupId });
  const setPolicy = useConfigureFormPolicy();
  const [cursor, setCursor] = useState<string | null>(null);
  const [error, setError] = useState('');
  const canAccess =
    group && group.joiningQuestionnaire?.canAccessMemberContent !== false;
  const canManage =
    group?.viewerRole === 'OWNER' || group?.viewerRole === 'MODERATOR';
  const forms = useForms(
    canAccess && (policy?.enabled || canManage)
      ? { groupId, paginationOpts: { numItems: 20, cursor } }
      : 'skip'
  );
  if (!group || !policy) return <p role='status'>Loading forms…</p>;
  return (
    <ContentPage>
      <h1 className='font-heading text-2xl font-bold'>
        {base.startsWith('/event/') ? 'Event forms' : 'Group forms'}
      </h1>
      <p>Collect responses without changing joining requirements.</p>
      {policy.canConfigure && (
        <section
          className='rounded-card border border-border p-4 space-y-3'
          aria-label='Form availability policy'
        >
          <h2 className='font-heading'>Owner settings</h2>
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
      ) : (
        <>
          {!policy.enabled && (
            <p>
              Forms are disabled. Configuration and saved responses are
              preserved. Current eligible managers can manage preserved forms.
            </p>
          )}
          {policy.enabled &&
            policy.canCreate !== false &&
            (policy.creation === 'MEMBERS' || canManage) && (
              <Link
                className='text-primary underline'
                href={`${base}/forms/new`}
              >
                Create form
              </Link>
            )}
          {forms === undefined && (policy.enabled || canManage) ? (
            <p role='status'>Loading forms…</p>
          ) : forms?.page.length === 0 ? (
            <p className='rounded-card border border-dashed border-border p-6 text-muted-foreground'>
              No forms yet. Create a form to collect responses.
            </p>
          ) : null}
          {forms?.page.map(form => (
            <div
              key={form._id}
              className='rounded-card border border-border p-4'
            >
              <Link
                className='text-primary underline'
                href={
                  policy.enabled
                    ? `${base}/forms/${form._id}`
                    : `${base}/forms/${form._id}/settings`
                }
              >
                {policy.enabled ? form.title : `Manage ${form.title}`}
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
      {error && (
        <p
          role='alert'
          className='rounded-input border-l-4 border-border-error bg-bg-error-subtle p-3 text-sm text-error'
        >
          {error}
        </p>
      )}
    </ContentPage>
  );
}
export function GroupFormEditor({
  groupId,
  toolId,
}: {
  groupId: ContentOwnerId;
  toolId?: Id<'groupTools'>;
}) {
  const group = useGroup(groupId);
  const eligible =
    group &&
    group.joiningQuestionnaire?.canAccessMemberContent !== false &&
    (group.viewerRole === 'OWNER' || group.viewerRole === 'MODERATOR');
  const form = useFormManagement(toolId && eligible ? { toolId } : 'skip');
  if (!toolId) return <NewFormEditor groupId={groupId} />;
  if (group === undefined) return <p role='status'>Loading content access…</p>;
  if (!eligible)
    return (
      <p role='alert'>
        Current eligible managers can manage this form after completing required
        onboarding.
      </p>
    );
  if (toolId && !form) return <p role='status'>Loading form settings…</p>;
  if (form && (form.groupId ?? form.eventId) !== groupId)
    return <p role='alert'>Form unavailable in this context.</p>;
  if (form && !form.canManage)
    return (
      <p role='alert'>Only current eligible managers can manage this form.</p>
    );
  return (
    <FormEditor key={form?.version ?? 'new'} groupId={groupId} initial={form} />
  );
}
function NewFormEditor({ groupId }: { groupId: ContentOwnerId }) {
  const group = useGroup(groupId);
  const policy = useFormPolicy({ groupId });
  if (group === undefined || policy === undefined)
    return <p role='status'>Loading form creation policy…</p>;
  if (!group) return <p role='alert'>Content unavailable.</p>;
  if (group.joiningQuestionnaire?.canAccessMemberContent === false)
    return (
      <p role='alert'>
        Complete required onboarding before creating ordinary forms.
      </p>
    );
  if (
    policy.canCreate === false ||
    !policy.enabled ||
    (policy.creation === 'MANAGERS' && group.viewerRole === 'MEMBER')
  )
    return (
      <p role='alert'>
        Form creation is unavailable under the current creation policy.
      </p>
    );
  return <FormEditor groupId={groupId} initial={undefined} />;
}
function FormEditor({
  groupId,
  initial,
}: {
  groupId: ContentOwnerId;
  initial: ReturnType<typeof useFormManagement>;
}) {
  const base = useContentBase(groupId);
  const create = useCreateForm();
  const configure = useConfigureForm();
  const deleteForm = useDeleteForm();
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
    <ContentPage>
      <h1 className='font-heading'>
        {initial ? 'Manage form' : 'Create form'}
      </h1>
      <form
        className={contentCanvas}
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
              router.push(`${base}/forms`);
            } else {
              const id = await create({
                groupId,
                title,
                description,
                questions,
                resultsVisibility: visibility,
              });
              router.push(`${base}/forms/${id}`);
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
        <ContentKind kind='Form' editing />
        <Label className='sr-only' htmlFor='ordinary-form-title'>
          Form title
        </Label>
        <Textarea
          rows={2}
          className={contentTitleField}
          id='ordinary-form-title'
          value={title}
          onChange={e => setTitle(e.target.value)}
          maxLength={100}
          required
          disabled={busy}
        />
        <Label className='sr-only' htmlFor='ordinary-form-description'>
          Description
        </Label>
        <Textarea
          rows={2}
          placeholder='Add a description…'
          className={contentDescriptionField}
          id='ordinary-form-description'
          value={description}
          onChange={e => setDescription(e.target.value)}
          maxLength={2000}
          disabled={busy}
        />

        <ApplicationQuestionEditor
          contentLayout
          title='Form questions'
          requiredLabel='Answer required'
          questions={questions}
          onChange={setQuestions}
          disabled={busy}
        />
        <ContentSettings>
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
          )}{' '}
          <p>
            Configuration changes preserve saved answers and their original
            question definitions. Current-version answers require review before
            saving. This is not the joining questionnaire.
          </p>{' '}
        </ContentSettings>
        <Button disabled={busy}>
          {initial ? 'Save form settings' : 'Create form'}
        </Button>
        <Button
          variant='ghost'
          type='button'
          disabled={busy}
          onClick={() => router.push(`${base}/forms`)}
        >
          Cancel
        </Button>
        {error && (
          <p
            role='alert'
            className='rounded-input border-l-4 border-border-error bg-bg-error-subtle p-3 text-sm text-error'
          >
            {error}
          </p>
        )}
      </form>
      {initial && (
        <GroupConfirmedAction
          label='Delete form'
          confirmation='Confirm deleting form and all responses'
          explanation='This permanently removes the preserved form and all response history.'
          onConfirm={async () => {
            await deleteForm({ toolId: initial._id });
            router.push(`${base}/forms`);
          }}
        />
      )}
    </ContentPage>
  );
}
export function GroupFormInteraction({
  groupId,
  toolId,
}: {
  groupId: ContentOwnerId;
  toolId: Id<'groupTools'>;
}) {
  const form = useForm({ toolId });
  const [feedback, setFeedback] = useState({ toolId, message: '' });
  if (!form) return <p role='status'>Loading form…</p>;
  if ((form.groupId ?? form.eventId) !== groupId)
    return <p role='alert'>Form unavailable in this context.</p>;
  return (
    <FormInteraction
      key={`${form._id}:${form.version}:${form.responseRevision}`}
      form={form}
      groupId={groupId}
      message={feedback.toolId === toolId ? feedback.message : ''}
      onMessage={message => setFeedback({ toolId, message })}
    />
  );
}
function FormInteraction({
  form,
  groupId,
  message,
  onMessage: setMessage,
}: {
  form: NonNullable<ReturnType<typeof useForm>>;
  groupId: ContentOwnerId;
  message: string;
  onMessage: (message: string) => void;
}) {
  const base = useContentBase(groupId);
  const submit = useSubmitFormResponse();
  const remove = useRemoveFormResponse();
  const deleteForm = useDeleteForm();
  const router = useRouter();
  const [answers, setAnswers] = useState<ApplicationAnswers>(form.answers);
  const [busy, setBusy] = useState(false);
  return (
    <ContentPage>
      <ContentKind kind='Form' />
      <h1 className='font-heading'>{form.title}</h1>
      <p>{form.description}</p>
      <p className='text-sm text-muted-foreground'>
        {form.resultsVisibility === 'MEMBERS'
          ? 'Shared with eligible members'
          : 'Visible to you and current managers'}
      </p>
      <form
        className={contentCanvas}
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
        <Button
          icon={<ActionSave aria-hidden='true' className='size-4' />}
          disabled={busy}
        >
          Save response
        </Button>
      </form>
      <ContentSettings title='Privacy & saved history'>
        <p>
          {form.resultsVisibility === 'MEMBERS'
            ? 'Shared contribution: eligible members can see your latest answers. On account deletion, that shared contribution survives anonymously; your private revision history is purged.'
            : 'Personal answers: only you and current eligible managers can see them. Account deletion purges your answers and history.'}{' '}
          Managers may moderate ordinary responses. Removing your response also
          removes its history.
        </p>
      </ContentSettings>
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
        href={`${base}/forms/${form._id}/history`}
      >
        My saved answer history
      </Link>
      {form.canManage && (
        <>
          <Link
            className='text-primary underline'
            href={`${base}/forms/${form._id}/settings`}
          >
            Manage form settings
          </Link>
          <GroupConfirmedAction
            label='Delete form'
            confirmation='Confirm deleting form and all responses'
            explanation='This permanently removes the form and all response history.'
            onConfirm={async () => {
              await deleteForm({ toolId: form._id });
              router.push(`${base}/forms`);
            }}
          />
        </>
      )}
      {message && (
        <p
          role='status'
          className='rounded-input bg-bg-sunken p-3 text-sm font-medium'
        >
          {message}
        </p>
      )}
      {form.canReview && (
        <GroupFormResults toolId={form._id} canManage={form.canManage} />
      )}
    </ContentPage>
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
    <dl className='space-y-4'>
      {questions.map(q => {
        const value = answers[q.id];
        return (
          <div key={q.id}>
            <dt className='text-sm font-semibold text-muted-foreground'>
              {q.label}
            </dt>
            <dd className='mt-1 whitespace-pre-wrap break-words'>
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
      <h1 className='font-heading'>My saved form history</h1>
      <p>
        Only your retained answers and original definitions are shown. Current
        private questions are not exposed by this recovery view.
      </p>
      {history === undefined ? (
        <p role='status'>Loading saved history…</p>
      ) : history.page.length === 0 ? (
        <p>No saved responses on this page.</p>
      ) : null}
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
      <h2 className='font-heading'>Latest responses</h2>
      {results === undefined ? (
        <p role='status'>Loading responses…</p>
      ) : results.page.length === 0 ? (
        <p className='rounded-input bg-bg-sunken p-4 text-sm text-muted-foreground'>
          No responses yet.
        </p>
      ) : null}
      {results?.page.map(row => (
        <div key={row._id} className='rounded-card border border-border p-4'>
          <p>
            {row.personId ? 'Member contribution' : 'Anonymous contribution'} ·
            form version {row.version}
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
