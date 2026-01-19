'use client';

import { Fragment } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { useFormContext } from 'react-hook-form';
import { Icons } from '@/components/icons';
import { AccountForm } from './account-form-provider';
import { cn } from '@/lib/utils';
import { useAccountFormSubmit } from './account-form';

export function ConfirmAccountSettings({
  shouldFlash,
}: {
  shouldFlash?: boolean;
}) {
  const { formState, reset, handleSubmit } = useFormContext<AccountForm>();
  const onSubmitHandler = useAccountFormSubmit();

  // Only show if the form has been modified
  if (!formState.isDirty) return null;

  const handleSaveClick = () => {
    // Use handleSubmit from react-hook-form with the onSubmit handler
    handleSubmit(onSubmitHandler)();
  };

  return (
    <Fragment>
      <Card
        className={cn(
          'mx-auto md:left-[175px] fixed z-40 bottom-20 right-0 left-0 w-full max-w-md transition-colors duration-300',
          shouldFlash && 'border-destructive bg-destructive'
        )}
      >
        <CardHeader>
          <div className='flex flex-col md:flex-row gap-2 items-center justify-between'>
            <span>You have unsaved changes!</span>
            <div className='flex items-center gap-3 w-full md:w-max'>
              <Button
                className='grow'
                onClick={handleSaveClick}
                disabled={!formState.isValid}
                isLoading={formState.isSubmitting}
                icon={<Icons.save className='size-4' />}
              >
                Save
              </Button>
              <Button
                onClick={() => reset()}
                variant='secondary'
                icon={<Icons.undo className='size-4' />}
              >
                Revert
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>
    </Fragment>
  );
}
