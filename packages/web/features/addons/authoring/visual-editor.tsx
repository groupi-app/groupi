'use client';

import { TemplateMetadataForm } from './template-metadata-form';
import { SectionList } from './section-list';
import { OnSubmitActionList } from './on-submit-action-list';
import { AutomationList } from './automation-list';
import { useBuilder } from './builder-context';

export function VisualEditor() {
  const { template } = useBuilder();
  return (
    <div className='min-w-0 space-y-5'>
      <section aria-label='Content sections' className='min-w-0 space-y-3'>
        <h2 className='font-heading text-base font-semibold'>Content</h2>
        <SectionList />
      </section>
      <details className='min-w-0 rounded-card border border-border bg-card'>
        <summary className='cursor-pointer p-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-ring'>
          General settings
          <span className='mt-1 block break-words text-xs font-normal text-muted-foreground'>
            {template.name || 'Name, description and presentation'}
          </span>
        </summary>
        <div className='border-t border-border p-4'>
          <TemplateMetadataForm />
        </div>
      </details>
      <details className='min-w-0 rounded-card border border-border bg-card'>
        <summary className='cursor-pointer p-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-ring'>
          On submit
          <span className='ml-2 text-xs font-normal text-muted-foreground'>
            {template.onSubmitActions?.length ?? 0} actions
          </span>
        </summary>
        <div className='space-y-3 border-t border-border p-4'>
          <p className='text-xs text-muted-foreground'>
            Actions that run when members submit.
          </p>
          <OnSubmitActionList />
        </div>
      </details>
      <details className='min-w-0 rounded-card border border-border bg-card'>
        <summary className='cursor-pointer p-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-ring'>
          Automations
          <span className='ml-2 text-xs font-normal text-muted-foreground'>
            {template.automations?.length ?? 0} automations
          </span>
        </summary>
        <div className='space-y-3 border-t border-border p-4'>
          <AutomationList />
        </div>
      </details>
    </div>
  );
}
