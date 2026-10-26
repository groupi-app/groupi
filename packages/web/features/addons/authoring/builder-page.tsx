'use client';

import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { useInviteListNavigationGuard } from '@/hooks/use-invite-list-navigation-guard';
import { BuilderProvider, useBuilder } from './builder-context';
import { BuilderWorkspace } from './builder-workspace';
import {
  useCreateTemplate,
  useUpdateTemplate,
  usePublishTemplate,
  useUnpublishTemplate,
} from '../hooks/use-addon-templates';
import type { CustomAddonTemplate } from '../model/custom-addon-schema';
import type { Id } from '@/convex/_generated/dataModel';

interface BuilderPageInnerProps {
  templateId?: Id<'addonTemplates'>;
  isPublished?: boolean;
}

function BuilderPageInner({ templateId, isPublished }: BuilderPageInnerProps) {
  const router = useRouter();
  const {
    template,
    validation,
    isDirty,
    markSaved,
    revert,
    yamlValue,
    yamlPending,
    yamlInvalid,
  } = useBuilder();
  const { createTemplate, isPending: isCreating } = useCreateTemplate();
  const { updateTemplate, isPending: isUpdating } = useUpdateTemplate();
  const publishTemplate = usePublishTemplate();
  const unpublishTemplate = useUnpublishTemplate();
  const [operation, setOperation] = useState<'save' | 'publish' | null>(null);
  const pending = useRef(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [leave, setLeave] = useState<(() => void) | null>(null);
  const isSaving = isCreating || isUpdating || operation === 'save';
  const isWorking = isSaving || operation === 'publish';
  const historyWarning = useInviteListNavigationGuard(
    isDirty || isWorking,
    next => {
      if (pending.current) {
        setNotice('Wait for the current change to finish.');
        return;
      }
      setLeave(() => next);
    },
    isDirty
  );

  const handleSave = useCallback(async () => {
    if (pending.current || yamlPending || yamlInvalid) return;
    pending.current = true;
    setOperation('save');
    setError('');
    setNotice('');
    const snapshot = template;
    const raw = yamlValue;
    try {
      if (templateId) {
        await updateTemplate({
          templateId,
          name: snapshot.name,
          description: snapshot.description,
          iconName: snapshot.iconName,
          template: snapshot,
        });
        markSaved(snapshot, raw);
        setNotice('Changes saved.');
      } else {
        const newId = await createTemplate({
          name: snapshot.name || 'Untitled Template',
          description: snapshot.description,
          iconName: snapshot.iconName,
          template: snapshot,
        });
        if (newId) {
          markSaved(snapshot, raw);
          router.replace(`/addon-builder/${newId}`);
        }
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Unable to save. Your draft is still here.'
      );
    } finally {
      pending.current = false;
      setOperation(null);
    }
  }, [
    templateId,
    template,
    yamlValue,
    yamlPending,
    yamlInvalid,
    updateTemplate,
    createTemplate,
    markSaved,
    router,
  ]);

  const handlePublishToggle = useCallback(async () => {
    if (
      !templateId ||
      pending.current ||
      (!isPublished &&
        (isDirty || !validation.valid || yamlPending || yamlInvalid))
    )
      return;
    pending.current = true;
    setOperation('publish');
    setError('');
    setNotice('');
    try {
      if (isPublished) await unpublishTemplate(templateId);
      else await publishTemplate(templateId);
      setNotice(isPublished ? 'Add-on unpublished.' : 'Add-on published.');
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Unable to change publication. Your draft is still here.'
      );
    } finally {
      pending.current = false;
      setOperation(null);
    }
  }, [
    templateId,
    isPublished,
    isDirty,
    validation.valid,
    yamlPending,
    yamlInvalid,
    publishTemplate,
    unpublishTemplate,
  ]);

  return (
    <main className='min-w-0 px-4 py-6 sm:px-6 sm:py-8'>
      <header className='mx-auto mb-5 flex max-w-7xl flex-wrap items-start justify-between gap-3'>
        <div className='flex min-w-0 items-center gap-2'>
          <Button asChild variant='ghost' size='icon' className='shrink-0'>
            <Link href='/settings/custom-addons' aria-label='Back to add-ons'>
              <Icons.arrowLeft className='size-5' aria-hidden='true' />
            </Link>
          </Button>
          <div className='min-w-0'>
            <h1 className='break-words font-heading text-xl font-semibold'>
              {templateId ? 'Edit add-on' : 'New add-on'}
            </h1>
            <div className='mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground'>
              <Badge variant={isPublished ? 'default' : 'secondary'}>
                {isPublished ? 'Published' : 'Draft'}
              </Badge>
              {isDirty && <span>Unsaved changes</span>}
            </div>
          </div>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          {isDirty && (
            <Button
              type='button'
              variant='ghost'
              disabled={isWorking}
              onClick={() => {
                revert();
                setError('');
                setNotice('Changes reverted.');
              }}
            >
              Revert
            </Button>
          )}
          {templateId && (
            <Button
              type='button'
              variant='outline'
              disabled={
                isWorking ||
                (!isPublished &&
                  (isDirty || !validation.valid || yamlPending || yamlInvalid))
              }
              onClick={() => void handlePublishToggle()}
            >
              {operation === 'publish'
                ? 'Updating…'
                : isPublished
                  ? 'Unpublish'
                  : 'Publish'}
            </Button>
          )}
          <Button
            type='button'
            isLoading={isSaving}
            loadingText='Saving…'
            disabled={
              isWorking ||
              yamlPending ||
              yamlInvalid ||
              (Boolean(templateId) && !isDirty)
            }
            onClick={() => void handleSave()}
          >
            {isPublished ? 'Save changes' : 'Save draft'}
          </Button>
        </div>
      </header>
      <div className='mx-auto mb-4 max-w-7xl space-y-2'>
        {error && (
          <p
            role='alert'
            className='rounded-input border-l-4 border-border-error bg-bg-error-subtle p-3 text-sm text-error'
          >
            {error}
          </p>
        )}
        {notice && !(isDirty && notice === 'Changes saved.') && (
          <p role='status' className='text-sm text-muted-foreground'>
            {notice}
          </p>
        )}
        {historyWarning && (
          <p role='alert' className='text-sm text-warning'>
            {historyWarning}
          </p>
        )}
        {(yamlPending || yamlInvalid) && (
          <p role='status' className='text-sm text-muted-foreground'>
            {yamlPending
              ? 'Checking YAML before saving…'
              : 'Fix the YAML errors before saving. Your raw draft is retained in YAML.'}
          </p>
        )}
        {templateId && !isPublished && isDirty && (
          <p className='text-xs text-muted-foreground'>
            Save your changes before publishing.
          </p>
        )}
        {!validation.valid && isDirty && (
          <div>
            {validation.errors
              .filter(entry => !entry.sectionId)
              .map((entry, index) => (
                <p key={index} className='text-sm text-warning'>
                  {entry.message}
                </p>
              ))}
          </div>
        )}
      </div>
      <fieldset disabled={isWorking} className='mx-auto min-w-0 max-w-7xl'>
        <legend className='sr-only'>Add-on editor</legend>
        <BuilderWorkspace />
      </fieldset>
      <Dialog
        open={Boolean(leave)}
        onOpenChange={open => {
          if (!open) setLeave(null);
        }}
      >
        <DialogContent>
          <DialogTitle>Leave without saving?</DialogTitle>
          <DialogDescription>
            Your unsaved add-on changes will be discarded.
          </DialogDescription>
          <div className='flex flex-wrap justify-end gap-2'>
            <DialogClose asChild>
              <Button variant='outline'>Keep editing</Button>
            </DialogClose>
            <Button
              variant='destructive'
              onClick={() => {
                const next = leave;
                setLeave(null);
                next?.();
              }}
            >
              Discard changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}

interface BuilderPageProps {
  templateId?: Id<'addonTemplates'>;
  initialTemplate?: CustomAddonTemplate;
  isPublished?: boolean;
}

export function BuilderPage({
  templateId,
  initialTemplate,
  isPublished,
}: BuilderPageProps) {
  return (
    <BuilderProvider initialTemplate={initialTemplate}>
      <BuilderPageInner templateId={templateId} isPublished={isPublished} />
    </BuilderProvider>
  );
}
