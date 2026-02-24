'use client';

import { useState } from 'react';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { useMyPublishedTemplates } from '@/hooks/convex/use-addon-templates';
import { ensureCustomAddonRegistered } from '@/lib/custom-addon-registration';
import type { CustomAddonTemplate } from '@/lib/custom-addon-schema';
import type { Id } from '@/convex/_generated/dataModel';

interface TemplatePickerProps {
  eventId: Id<'events'>;
  onSelect: (
    addonType: string,
    config: Record<string, unknown>
  ) => Promise<void>;
}

export function TemplatePicker({ onSelect }: TemplatePickerProps) {
  const [open, setOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const templates = useMyPublishedTemplates();

  const handleSelect = async (template: {
    _id: string;
    name: string;
    template: CustomAddonTemplate;
  }) => {
    const addonType = `custom:${template._id}`;
    const config = {
      templateId: template._id,
      template: template.template,
    };

    // Register in frontend registry
    ensureCustomAddonRegistered(addonType, template.template);

    setIsAdding(true);
    try {
      await onSelect(addonType, config);
      setOpen(false);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant='outline' className='mt-3 w-full rounded-button'>
          <Icons.plus className='mr-2 size-4' />
          Add Custom Add-on
        </Button>
      </DialogTrigger>
      <DialogContent className='max-w-md rounded-modal'>
        <DialogHeader>
          <DialogTitle>Add Custom Add-on</DialogTitle>
        </DialogHeader>
        <div className='space-y-2'>
          {templates === undefined && (
            <div className='space-y-2'>
              {[1, 2].map(i => (
                <div
                  key={i}
                  className='h-16 animate-pulse rounded-card bg-muted'
                />
              ))}
            </div>
          )}
          {templates && templates.length === 0 && (
            <div className='py-8 text-center'>
              <p className='text-sm text-muted-foreground'>
                No published custom add-ons yet.
              </p>
              <Button
                variant='link'
                className='mt-1'
                onClick={() => {
                  setOpen(false);
                  window.location.href = '/addon-builder';
                }}
              >
                Create one in the Add-on Builder
              </Button>
            </div>
          )}
          {templates?.map(
            (tmpl: {
              _id: string;
              name: string;
              description: string;
              iconName: string;
              template: unknown;
            }) => {
              const IconComponent =
                (
                  Icons as Record<
                    string,
                    React.ComponentType<{ className?: string }>
                  >
                )[tmpl.iconName] ?? Icons.info;

              return (
                <Card
                  key={tmpl._id}
                  className='cursor-pointer rounded-card shadow-raised transition-shadow hover:shadow-floating'
                  onClick={() =>
                    !isAdding &&
                    handleSelect({
                      _id: tmpl._id,
                      name: tmpl.name,
                      template: tmpl.template as CustomAddonTemplate,
                    })
                  }
                >
                  <CardContent className='flex items-center gap-3 p-3'>
                    <div className='flex size-9 items-center justify-center rounded-button bg-bg-interactive'>
                      <IconComponent className='size-4 text-primary' />
                    </div>
                    <div className='min-w-0 flex-1'>
                      <p className='truncate text-sm font-medium'>
                        {tmpl.name}
                      </p>
                      <p className='truncate text-xs text-muted-foreground'>
                        {tmpl.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            }
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
