'use client';

import { Fragment } from 'react';
import { Button } from './ui/button';
import { Card, CardHeader } from './ui/card';
import { useFormContext } from 'react-hook-form';
import { Icons } from './icons';

export function ConfirmSettings() {
  const { formState, reset } = useFormContext();

  // Only show if the form has been modified
  if (!formState.isDirty) return null;

  return (
    <Fragment>
      <Card className='mx-auto md:left-[175px] fixed z-40 bottom-20 right-0 left-0 w-full max-w-md'>
        <CardHeader>
          <div className='flex flex-col md:flex-row gap-2 items-center justify-between'>
            <span>You have unsaved changes!</span>
            <div className='flex items-center gap-3 w-full md:w-max'>
              <Button
                className='flex items-center gap-1 grow'
                type='submit'
                disabled={formState.isSubmitting || !formState.isValid}
              >
                {formState.isSubmitting ? (
                  <Icons.spinner className='size-4 animate-spin' />
                ) : (
                  <Icons.save className='size-4' />
                )}
                <span>Save</span>
              </Button>
              <Button
                className='flex items-center gap-1'
                onClick={() => reset()}
                variant='secondary'
              >
                <Icons.undo className='size-4' />
                <span>Revert</span>
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>
    </Fragment>
  );
}
