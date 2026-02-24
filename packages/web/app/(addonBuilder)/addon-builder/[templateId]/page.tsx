'use client';

import { use } from 'react';
import { useTemplate } from '@/hooks/convex/use-addon-templates';
import { BuilderPage } from '../components/builder-page';
import type { Id } from '@/convex/_generated/dataModel';

export default function EditTemplatePage(props: {
  params: Promise<{ templateId: string }>;
}) {
  const { templateId } = use(props.params);
  const template = useTemplate(templateId as Id<'addonTemplates'>);

  if (template === undefined) {
    return (
      <div className='mx-auto max-w-4xl px-4 py-8'>
        <div className='space-y-4'>
          <div className='h-8 w-48 animate-pulse rounded bg-muted' />
          <div className='h-64 animate-pulse rounded-card bg-muted' />
        </div>
      </div>
    );
  }

  if (template === null) {
    return (
      <div className='mx-auto max-w-4xl px-4 py-8'>
        <p className='text-muted-foreground'>Add-on not found.</p>
      </div>
    );
  }

  return (
    <BuilderPage
      templateId={template._id}
      initialTemplate={template.template}
      isPublished={template.isPublished}
    />
  );
}
