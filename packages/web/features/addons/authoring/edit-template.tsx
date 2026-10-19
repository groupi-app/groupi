'use client';

import { useTemplate } from '../hooks/use-addon-templates';
import { BuilderPage } from './builder-page';
import type { Id } from '@/convex/_generated/dataModel';

export function EditTemplate({ templateId }: { templateId: string }) {
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
      initialTemplate={{
        ...template.template,
        sections: template.template.sections.map(section => ({
          ...section,
          fields: section.fields.map(field => ({
            ...field,
            label: field.label ?? '',
            textFormat:
              field.textFormat === undefined
                ? undefined
                : field.textFormat === 'h1' ||
                    field.textFormat === 'h2' ||
                    field.textFormat === 'h3'
                  ? field.textFormat
                  : 'p',
          })),
        })),
      }}
      isPublished={template.isPublished}
    />
  );
}
