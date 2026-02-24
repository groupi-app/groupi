'use client';

import { TemplateMetadataForm } from './template-metadata-form';
import { SectionList } from './section-list';
import { OnSubmitActionList } from './on-submit-action-list';
import { AutomationList } from './automation-list';

export function VisualEditor() {
  return (
    <div className='space-y-6'>
      <TemplateMetadataForm />
      <hr className='border-border' />
      <div>
        <h3 className='mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide'>
          Sections &amp; Fields
        </h3>
        <SectionList />
      </div>
      <hr className='border-border' />
      <div>
        <h3 className='mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide'>
          On Submit
        </h3>
        <p className='text-xs text-muted-foreground mb-3'>
          Actions that run when attendees submit the form.
        </p>
        <OnSubmitActionList />
      </div>
      <hr className='border-border' />
      <div>
        <h3 className='mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide'>
          Automations
        </h3>
        <p className='text-xs text-muted-foreground mb-3'>
          Automations run when triggers fire — like IFTTT for your add-on.
        </p>
        <AutomationList />
      </div>
    </div>
  );
}
