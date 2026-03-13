'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  FIELD_TYPE_LABELS,
  type CustomAddonTemplate,
  type FieldType,
} from '@/lib/custom-addon-schema';
import { AddonIcon, PreviewWrapper } from './preview-utils';

function hasConfigurableContent(template: CustomAddonTemplate): boolean {
  return template.sections.some(
    s => s.configurable || s.fields.some(f => f.configurable)
  );
}

export function ManageCardPreview({
  template,
}: {
  template: CustomAddonTemplate;
}) {
  const isConfigurable = hasConfigurableContent(template);

  return (
    <PreviewWrapper label='Manage add-ons page'>
      <Card className='rounded-card shadow-raised'>
        <CardHeader className='flex flex-row items-center justify-between'>
          <div className='flex items-center gap-3'>
            <div className='flex size-10 items-center justify-center rounded-button bg-bg-interactive'>
              <AddonIcon
                iconName={template.iconName}
                className='size-5 text-primary'
              />
            </div>
            <div>
              <CardTitle className='text-base'>
                {template.name || 'Untitled Add-on'}
              </CardTitle>
              {template.description && (
                <p className='text-sm text-muted-foreground'>
                  {template.description}
                </p>
              )}
            </div>
          </div>
          <Button
            variant='outline'
            size='sm'
            className='rounded-button text-destructive'
            disabled
          >
            Disable
          </Button>
        </CardHeader>

        {isConfigurable && (
          <CardContent className='space-y-3 border-t pt-4'>
            <Label className='text-xs font-medium text-muted-foreground'>
              Organizer configures:
            </Label>

            {template.sections.map(section => (
              <div key={section.id} className='space-y-2'>
                {/* Configurable fields within the section */}
                {section.fields
                  .filter(f => f.configurable)
                  .map(field => (
                    <div
                      key={field.id}
                      className='rounded-card border border-dashed p-3'
                    >
                      <div className='flex items-center gap-2'>
                        <Badge
                          variant='outline'
                          className='shrink-0 rounded-badge text-xs'
                        >
                          {FIELD_TYPE_LABELS[field.type]}
                        </Badge>
                        <span className='text-sm font-medium'>
                          {field.label || 'Untitled field'}
                        </span>
                      </div>
                      <p className='mt-1 text-xs italic text-muted-foreground'>
                        {field.type === 'list_item'
                          ? 'Organizer defines items for this sign-up list'
                          : 'Organizer defines options for this field'}
                      </p>
                    </div>
                  ))}

                {/* Configurable section */}
                {section.configurable && (
                  <div className='rounded-card border border-dashed p-3'>
                    <p className='text-sm font-medium'>
                      {section.title || 'Untitled section'}
                    </p>
                    <p className='mt-1 text-xs italic text-muted-foreground'>
                      Organizer adds and edits fields
                      {section.allowedFieldTypes?.length
                        ? ` (${section.allowedFieldTypes.map((t: FieldType) => FIELD_TYPE_LABELS[t]).join(', ')})`
                        : ''}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        )}
      </Card>
    </PreviewWrapper>
  );
}
