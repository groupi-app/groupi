'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import type { CustomAddonTemplate } from '@/lib/custom-addon-schema';
import { AddonIcon, PreviewWrapper } from './preview-utils';

const CARD_SAFE_FIELD_TYPES = new Set(['toggle', 'action_button']);

export function EventCardPreview({
  template,
}: {
  template: CustomAddonTemplate;
}) {
  const settings = template.settings;
  const isCardOnly = settings?.cardOnly ?? false;

  const subtitle = settings?.cardSubtitle
    ? settings.cardSubtitle.replace(/\{\{response_count\}\}/g, '3')
    : '3 responses';

  const cardFields = isCardOnly
    ? template.sections
        .flatMap(s => s.fields)
        .filter(f => CARD_SAFE_FIELD_TYPES.has(f.type))
    : [];

  return (
    <PreviewWrapper label='Event page — event card'>
      <Card className='w-fit rounded-card shadow-raised'>
        <CardContent className='flex items-center gap-3 p-4'>
          <div className='flex size-10 shrink-0 items-center justify-center rounded-button bg-bg-interactive'>
            <AddonIcon
              iconName={template.iconName}
              className='size-5 text-primary'
            />
          </div>
          <div className='min-w-0 flex-1'>
            <p className='truncate font-medium'>
              {template.name || 'Untitled Add-on'}
            </p>
            <p className='text-sm text-muted-foreground'>{subtitle}</p>
          </div>
          {isCardOnly ? (
            cardFields.length > 0 && (
              <div className='flex shrink-0 items-center gap-2'>
                {cardFields.map(field =>
                  field.type === 'toggle' ? (
                    <div key={field.id} className='flex items-center gap-2'>
                      <Switch checked={field.defaultEnabled ?? true} disabled />
                      <span className='text-sm'>{field.label}</span>
                    </div>
                  ) : field.type === 'action_button' ? (
                    <Button
                      key={field.id}
                      variant={
                        (field.buttonVariant as
                          | 'default'
                          | 'secondary'
                          | 'outline'
                          | 'destructive') ?? 'default'
                      }
                      size='sm'
                      disabled
                    >
                      {field.buttonLabel || 'Action'}
                    </Button>
                  ) : null
                )}
              </div>
            )
          ) : (
            <Button
              variant='outline'
              size='sm'
              className='shrink-0 rounded-button'
              disabled
            >
              {settings?.cardLinkLabel || 'View'}
            </Button>
          )}
        </CardContent>
      </Card>
    </PreviewWrapper>
  );
}
