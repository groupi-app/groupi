'use client';
import { useRef, useState, type RefObject } from 'react';
import { Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { ActionMenu } from '@/components/ui/action-menu';
import { ActionMenuButton } from '@/components/ui/action-menu-button';
import { useActionMenu } from '@/hooks/use-action-menu';
import { ContextMenuItem } from '@/components/ui/context-menu';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
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
import { ContentPage } from '@/features/content/content-design';
import { Label } from '@/components/ui/label';
import {
  ApplicationQuestionEditor,
  ApplicationQuestionFields,
} from './application-question-fields';
import { GroupConfirmedAction } from './group-confirmed-action';
const formSurface =
  'mx-auto w-full min-w-0 max-w-md space-y-4 rounded-card border border-border bg-card p-4 text-sm break-words';
const formTitleField =
  'min-h-8 resize-none border-transparent bg-transparent px-0 font-heading text-lg font-semibold leading-snug field-sizing-content';
const formDescriptionField =
  'min-h-10 resize-y border-transparent bg-transparent px-0 text-sm leading-relaxed field-sizing-content';

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
      {policy.canConfigure && (
        <details
          className='space-y-3 text-sm'
          aria-label='Form availability policy'
        >
          <summary className='min-h-10 cursor-pointer py-2 text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring'>
            Settings
          </summary>
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
        </details>
      )}
      {!canAccess ? (
        <p>Complete required onboarding to use forms.</p>
      ) : (
        <>
          {!policy.enabled && <p>Forms are disabled.</p>}
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
              No forms yet.
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
              {form.description && <p>{form.description}</p>}
              <p>
                {form.resultsVisibility === 'MEMBERS'
                  ? 'Shared responses'
                  : 'Personal responses'}
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
    <main className='mx-auto w-full min-w-0 max-w-md space-y-3 px-4 py-4'>
      <h1 className='sr-only'>{initial ? 'Manage form' : 'Create form'}</h1>
      <form
        className={formSurface}
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
            setError(`${failure(e)} Check forms before retrying.`);
          } finally {
            setBusy(false);
          }
        }}
      >
        <Label className='sr-only' htmlFor='ordinary-form-title'>
          Form title
        </Label>
        <Textarea
          rows={1}
          className={formTitleField}
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
          rows={1}
          placeholder='Add a description…'
          className={formDescriptionField}
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
        {!initial && (
          <details className='text-sm'>
            <summary className='min-h-10 cursor-pointer py-2 text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring'>
              Visibility · {visibility === 'MANAGERS' ? 'Personal' : 'Shared'}
            </summary>
            <Label className='sr-only' htmlFor='ordinary-form-visibility'>
              Response visibility (fixed for this form)
            </Label>
            <select
              className='w-full min-w-0 rounded-input border border-input bg-background p-2'
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
          </details>
        )}
        <div className='flex flex-wrap items-center gap-2'>
          <Button disabled={busy}>
            {initial ? 'Save changes' : 'Create form'}
          </Button>
          <Button
            variant='ghost'
            type='button'
            disabled={busy}
            onClick={() => router.push(`${base}/forms`)}
          >
            Cancel
          </Button>
        </div>
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
        <details className='text-sm'>
          <summary className='min-h-10 cursor-pointer py-2 text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring'>
            Actions
          </summary>
          <GroupConfirmedAction
            label='Delete form'
            confirmation='Confirm deleting form and all responses'
            explanation='This permanently removes the preserved form and all response history.'
            onConfirm={async () => {
              await deleteForm({ toolId: initial._id });
              router.push(`${base}/forms`);
            }}
          />
        </details>
      )}
    </main>
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
  const [answers, setAnswers] = useState<ApplicationAnswers>(form.answers);
  const [busy, setBusy] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const actionAnchor = useRef<HTMLDivElement>(null);
  return (
    <main className={formSurface}>
      <header className='flex min-w-0 items-start justify-between gap-2'>
        <h1 className='min-w-0 flex-1 font-heading text-lg font-semibold leading-snug'>
          {form.title}
        </h1>
        {(form.savedVersion !== null || form.canManage) && (
          <FormActions
            anchor={actionAnchor}
            form={form}
            base={base}
            busy={busy}
            onViewResponses={() => setShowResults(true)}
            onMessage={setMessage}
          />
        )}
      </header>
      {form.description && (
        <p className='text-sm leading-relaxed'>{form.description}</p>
      )}
      <p className='text-xs text-muted-foreground'>
        {form.resultsVisibility === 'MEMBERS'
          ? 'Shared responses'
          : 'Only you and managers can see your response'}
      </p>
      <form
        className='space-y-4'
        onSubmit={async e => {
          e.preventDefault();
          if (busy) return;
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
        <div className='[&>div>div]:border-0 [&>div>div]:p-0 [&>div>fieldset]:border-0 [&>div>fieldset]:p-0'>
          <ApplicationQuestionFields
            questions={form.questions}
            answers={answers}
            onChange={setAnswers}
            disabled={busy}
          />
        </div>
        <Button disabled={busy} isLoading={busy} loadingText='Submitting…'>
          {form.savedVersion === null ? 'Submit response' : 'Update response'}
        </Button>
      </form>
      {message && (
        <p role='status' className='text-sm'>
          {message}
        </p>
      )}
      {form.canManage && form.canReview && (
        <Dialog open={showResults} onOpenChange={setShowResults}>
          <DialogContent
            onCloseAutoFocus={event => {
              event.preventDefault();
              actionAnchor.current?.querySelector('button')?.focus();
            }}
            aria-describedby={undefined}
            className='max-h-[80dvh] min-w-0 overflow-y-auto [&_button]:h-auto [&_button]:min-h-10 [&_button]:whitespace-normal'
          >
            <DialogTitle>Responses</DialogTitle>
            {showResults && (
              <GroupFormResults toolId={form._id} canManage={form.canManage} />
            )}
          </DialogContent>
        </Dialog>
      )}
    </main>
  );
}
/** The same action inventory drives desktop dropdown/context menu and mobile drawer. */
function FormActions({
  form,
  anchor,
  base,
  busy,
  onViewResponses,
  onMessage,
}: {
  form: NonNullable<ReturnType<typeof useForm>>;
  anchor: RefObject<HTMLDivElement | null>;
  base: string;
  busy: boolean;
  onViewResponses: () => void;
  onMessage: (message: string) => void;
}) {
  const menu = useActionMenu();
  const remove = useRemoveFormResponse();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  function choose(action: 'responses' | 'remove') {
    menu.setSheetOpen(false);
    if (action === 'responses') onViewResponses();
    else {
      setError('');
      setConfirming(true);
    }
  }
  const actions = [
    ...(form.canManage && form.canReview
      ? [{ id: 'responses' as const, label: 'View responses', Icon: Eye }]
      : []),
    ...(form.savedVersion !== null
      ? [{ id: 'remove' as const, label: 'Remove my response', Icon: Trash2 }]
      : []),
  ];
  const dropdownContent = (
    <>
      {actions.map(({ id, label, Icon }) => (
        <DropdownMenuItem key={id} disabled={busy} onSelect={() => choose(id)}>
          <Icon aria-hidden='true' className='size-4' />
          {label}
        </DropdownMenuItem>
      ))}
      {form.canManage && (
        <DropdownMenuItem disabled={busy} asChild>
          <Link href={`${base}/forms/${form._id}/settings`}>
            <Pencil aria-hidden='true' className='size-4' />
            Edit form
          </Link>
        </DropdownMenuItem>
      )}
    </>
  );
  const contextMenuContent = (
    <>
      {actions.map(({ id, label, Icon }) => (
        <ContextMenuItem key={id} disabled={busy} onSelect={() => choose(id)}>
          <Icon aria-hidden='true' className='size-4' />
          {label}
        </ContextMenuItem>
      ))}
      {form.canManage && (
        <ContextMenuItem disabled={busy} asChild>
          <Link href={`${base}/forms/${form._id}/settings`}>
            <Pencil aria-hidden='true' className='size-4' />
            Edit form
          </Link>
        </ContextMenuItem>
      )}
    </>
  );
  const drawerContent = (
    <div className='flex min-w-0 flex-col gap-1 px-4 pb-4 pt-2'>
      {actions.map(({ id, label, Icon }) => (
        <Button
          key={id}
          variant='ghost'
          disabled={busy}
          className='h-auto min-h-11 justify-start whitespace-normal text-left'
          onClick={() => choose(id)}
        >
          <Icon aria-hidden='true' className='size-4 shrink-0' />
          {label}
        </Button>
      ))}
      {form.canManage && (
        <Button
          asChild
          variant='ghost'
          className='h-auto min-h-11 justify-start whitespace-normal text-left'
          onClick={() => menu.setSheetOpen(false)}
        >
          <Link href={`${base}/forms/${form._id}/settings`}>
            <Pencil aria-hidden='true' className='size-4 shrink-0' />
            Edit form
          </Link>
        </Button>
      )}
    </div>
  );
  return (
    <>
      <ActionMenu
        drawerTitle='Form actions'
        drawerContent={drawerContent}
        contextMenuContent={contextMenuContent}
        sheetOpen={menu.sheetOpen}
        onSheetOpenChange={menu.setSheetOpen}
        onContextMenu={menu.handleContextMenu}
        onClick={menu.handleClick}
        disabled={busy}
      >
        <div ref={anchor} className='shrink-0'>
          <ActionMenuButton
            label='Form actions'
            className='size-10 shrink-0'
            onClick={menu.handleMoreClick}
            onContextMenu={menu.handleContextMenu}
            dropdownContent={dropdownContent}
          >
            <MoreHorizontal className='size-4' aria-hidden='true' />
          </ActionMenuButton>
        </div>
      </ActionMenu>
      <Dialog
        open={confirming}
        onOpenChange={open => {
          if (!pending) setConfirming(open);
        }}
      >
        <DialogContent
          preventClose={pending}
          onCloseAutoFocus={event => {
            event.preventDefault();
            anchor.current?.querySelector('button')?.focus();
          }}
        >
          <DialogTitle>Remove your response?</DialogTitle>
          <DialogDescription>
            Your response and its history will be removed.
          </DialogDescription>
          <div className='flex flex-wrap justify-end gap-2'>
            <DialogClose asChild>
              <Button variant='outline' disabled={pending}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              variant='destructive'
              disabled={pending}
              isLoading={pending}
              onClick={async () => {
                setPending(true);
                setError('');
                try {
                  await remove({ toolId: form._id });
                  setConfirming(false);
                  onMessage('Response removed.');
                } catch (e) {
                  setError(failure(e));
                } finally {
                  setPending(false);
                }
              }}
            >
              Remove response
            </Button>
          </div>
          {error && (
            <p role='alert' className='text-sm text-error'>
              {error}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
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
    <dl className='space-y-3'>
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
      <h2 className='sr-only'>Latest responses</h2>
      {results === undefined ? (
        <p role='status'>Loading responses…</p>
      ) : results.page.length === 0 ? (
        <p className='rounded-input bg-bg-sunken p-4 text-sm text-muted-foreground'>
          No responses yet.
        </p>
      ) : null}
      {results?.page.map(row => (
        <div key={row._id} className='space-y-3 border-t border-border pt-3'>
          <p className='text-xs text-muted-foreground'>
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
