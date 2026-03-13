'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  isDisplayField,
  type CustomAddonTemplate,
} from '@/lib/custom-addon-schema';
import { AddonHeader, SettingsBadges, PreviewWrapper } from './preview-utils';
import { PreviewField, PreviewSection } from './preview-field';

export function AttendeePagePreview({
  template,
}: {
  template: CustomAddonTemplate;
}) {
  if (template.settings?.cardOnly) {
    return (
      <PreviewWrapper label='Event page — attendee view'>
        <div className='flex flex-col items-center justify-center py-8 text-center'>
          <p className='text-sm font-medium'>Card-only mode</p>
          <p className='mt-1 text-xs text-muted-foreground'>
            This add-on has no dedicated page. Toggles and action buttons render
            on the event card.
          </p>
        </div>
      </PreviewWrapper>
    );
  }

  // Check if any form-layout section has actual input fields (need a submit button)
  const hasFormInputs = template.sections.some(s => {
    if (s.layout === 'interactive') return false;
    return s.fields.some(f => !isDisplayField(f.type));
  });

  return (
    <PreviewWrapper label='Event page — attendee view'>
      <div className='space-y-4'>
        <AddonHeader template={template} />

        {template.sections.map(section => {
          const hasSectionConditions =
            (section.visibilityConditions?.length ?? 0) > 0;

          if (section.layout === 'interactive') {
            // Interactive section: each field standalone
            return (
              <div key={section.id}>
                {hasSectionConditions && (
                  <p className='mb-1 text-[10px] text-muted-foreground'>
                    Section conditionally visible
                  </p>
                )}
                {section.fields.map(field => {
                  // Action buttons and static text render without a card wrapper
                  if (
                    field.type === 'action_button' ||
                    field.type === 'static_text'
                  ) {
                    return (
                      <PreviewField
                        key={field.id}
                        field={field}
                        templateName={template.name}
                      />
                    );
                  }

                  const showLabel =
                    field.label &&
                    !isDisplayField(field.type) &&
                    field.type !== 'toggle';

                  return (
                    <Card
                      key={field.id}
                      className={`rounded-card shadow-raised ${field.type === 'toggle' ? 'w-fit' : ''}`}
                    >
                      <CardContent className='space-y-1 p-4'>
                        {showLabel && (
                          <Label className='text-sm font-medium'>
                            {field.label}
                          </Label>
                        )}
                        <PreviewField
                          field={field}
                          templateName={template.name}
                        />
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            );
          }

          // Form section: all fields in a single card
          if (section.fields.length === 0) return null;

          return (
            <div key={section.id}>
              {hasSectionConditions && (
                <p className='mb-1 text-[10px] text-muted-foreground'>
                  Section conditionally visible
                </p>
              )}
              <Card className='rounded-card shadow-raised'>
                <CardContent className='space-y-4 p-4'>
                  <PreviewSection
                    section={section}
                    templateName={template.name}
                  />
                </CardContent>
              </Card>
            </div>
          );
        })}

        {hasFormInputs && (
          <Button className='w-full rounded-button' disabled>
            {template.submitButtonLabel || 'Submit Response'}
          </Button>
        )}

        <SettingsBadges template={template} />
      </div>
    </PreviewWrapper>
  );
}
