'use client';

import { useState, useCallback } from 'react';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useMyPublishedTemplates } from '@/hooks/convex/use-addon-templates';
import { ensureCustomAddonRegistered } from '@/lib/custom-addon-registration';
import type { CustomAddonTemplate } from '@/lib/custom-addon-schema';
import type { FormState } from './form-context';

interface CreateWizardTemplatePickerProps {
  formState: FormState;
  setFormState: (state: FormState) => void;
}

export function CreateWizardTemplatePicker({
  formState,
  setFormState,
}: CreateWizardTemplatePickerProps) {
  const [open, setOpen] = useState(false);
  const templates = useMyPublishedTemplates();

  const handleSelect = useCallback(
    (tmpl: { _id: string; name: string; template: CustomAddonTemplate }) => {
      const addonType = `custom:${tmpl._id}`;

      // Register in frontend registry
      ensureCustomAddonRegistered(addonType, tmpl.template);

      // Add to form state with the template embedded as config
      const config = {
        templateId: tmpl._id,
        template: tmpl.template,
      };

      setFormState({
        ...formState,
        addonConfigs: {
          ...formState.addonConfigs,
          [addonType]: config,
        },
      });

      setOpen(false);
    },
    [formState, setFormState]
  );

  // Don't render if there are no templates
  if (templates !== undefined && templates.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant='outline' className='w-full rounded-button'>
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
          {templates?.map(
            (tmpl: {
              _id: string;
              name: string;
              description: string;
              iconName: string;
              template: unknown;
            }) => {
              const addonType = `custom:${tmpl._id}`;
              const isAlreadyAdded =
                formState.addonConfigs?.[addonType] !== undefined;

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
                  className={`rounded-card shadow-raised transition-shadow ${
                    isAlreadyAdded
                      ? 'opacity-50'
                      : 'cursor-pointer hover:shadow-floating'
                  }`}
                  onClick={() =>
                    !isAlreadyAdded &&
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
                    {isAlreadyAdded && (
                      <span className='text-xs text-muted-foreground'>
                        Added
                      </span>
                    )}
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
