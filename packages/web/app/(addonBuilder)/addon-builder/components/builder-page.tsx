'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { BuilderProvider, useBuilder } from './builder-context';
import { BuilderWorkspace } from './builder-workspace';
import {
  useCreateTemplate,
  useUpdateTemplate,
  usePublishTemplate,
  useUnpublishTemplate,
} from '@/hooks/convex/use-addon-templates';
import type { CustomAddonTemplate } from '@/lib/custom-addon-schema';
import type { Id } from '@/convex/_generated/dataModel';

interface BuilderPageInnerProps {
  templateId?: Id<'addonTemplates'>;
  isPublished?: boolean;
}

function BuilderPageInner({ templateId, isPublished }: BuilderPageInnerProps) {
  const router = useRouter();
  const { template, validation, isDirty } = useBuilder();
  const { createTemplate, isPending: isCreating } = useCreateTemplate();
  const { updateTemplate, isPending: isUpdating } = useUpdateTemplate();
  const publishTemplate = usePublishTemplate();
  const unpublishTemplate = useUnpublishTemplate();

  const isSaving = isCreating || isUpdating;

  const handleSave = useCallback(async () => {
    if (templateId) {
      await updateTemplate({
        templateId,
        name: template.name,
        description: template.description,
        iconName: template.iconName,
        template,
      });
    } else {
      const newId = await createTemplate({
        name: template.name || 'Untitled Template',
        description: template.description,
        iconName: template.iconName,
        template,
      });
      if (newId) {
        router.replace(`/addon-builder/${newId}`);
      }
    }
  }, [templateId, template, updateTemplate, createTemplate, router]);

  const handlePublishToggle = useCallback(async () => {
    if (!templateId) return;
    if (isPublished) {
      await unpublishTemplate(templateId);
    } else {
      await publishTemplate(templateId);
    }
  }, [templateId, isPublished, publishTemplate, unpublishTemplate]);

  return (
    <div className='px-4 py-8'>
      {/* Header */}
      <div className='mx-auto mb-6 flex max-w-7xl items-center justify-between'>
        <div className='flex items-center gap-3'>
          <Button
            variant='ghost'
            size='icon'
            className='rounded-button'
            onClick={() => router.push('/settings/custom-addons')}
          >
            <Icons.arrowLeft className='size-5' />
          </Button>
          <div>
            <h1 className='text-xl font-bold'>
              {templateId ? 'Edit Add-on' : 'New Add-on'}
            </h1>
            {templateId && (
              <Badge
                variant={isPublished ? 'default' : 'secondary'}
                className='mt-0.5 rounded-badge'
              >
                {isPublished ? 'Published' : 'Draft'}
              </Badge>
            )}
          </div>
        </div>
        <div className='flex items-center gap-2'>
          {templateId && (
            <Button
              variant='outline'
              size='sm'
              className='rounded-button'
              onClick={handlePublishToggle}
              disabled={!validation.valid && !isPublished}
            >
              {isPublished ? 'Unpublish' : 'Publish'}
            </Button>
          )}
          <Button
            className='rounded-button'
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Icons.spinner className='mr-2 size-4 animate-spin' />
                Saving...
              </>
            ) : (
              <>
                <Icons.save className='mr-2 size-4' />
                Save
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Template-level validation errors */}
      {!validation.valid && isDirty && (
        <div className='mx-auto mb-4 max-w-7xl'>
          {validation.errors
            .filter(e => !e.sectionId)
            .map((err, i) => (
              <p key={i} className='text-sm text-warning'>
                {err.message}
              </p>
            ))}
        </div>
      )}

      {/* Split-pane workspace */}
      <div className='mx-auto max-w-7xl'>
        <BuilderWorkspace />
      </div>
    </div>
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
