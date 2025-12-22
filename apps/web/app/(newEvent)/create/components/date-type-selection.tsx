'use client';

import { Icons } from '@/components/icons';
import { useFormContext } from './form-context';
import { Button } from '@/components/ui/button';

interface DateTypeSelectionProps {
  onSelectSingle: () => void;
  onSelectMulti: () => void;
  onBack: () => void;
}

export function DateTypeSelection({
  onSelectSingle,
  onSelectMulti,
  onBack,
}: DateTypeSelectionProps) {
  const { formState } = useFormContext();

  // In wizard mode, validation is handled by parent
  if (!formState.title) {
    return null;
  }

  return (
    <>
      <h2 className='font-heading text-4xl mt-10'>I would like to...</h2>
      <div className='flex my-12 gap-4 justify-center flex-col md:flex-row items-center'>
        <Button
          data-test='single-date-button'
          size='lg'
          variant='outline'
          className='py-12 text-xl w-full max-w-md flex items-center justify-center gap-3'
          onClick={onSelectSingle}
        >
          <Icons.organizer className='size-16 min-w-[4rem]' />
          <span>Choose a date myself</span>
        </Button>
        <Button
          size='lg'
          variant='outline'
          className='py-12 text-xl w-full max-w-md flex items-center justify-center gap-3'
          onClick={onSelectMulti}
        >
          <Icons.group
            color2='fill-muted-foreground'
            className='size-24 min-w-[4rem]'
          />
          <span>Poll Attendees</span>
        </Button>
      </div>
      <div className='flex justify-start'>
        <Button
          className='flex items-center gap-1'
          variant={'secondary'}
          onClick={onBack}
        >
          <span>Back</span>
          <Icons.back className='text-sm' />
        </Button>
      </div>
    </>
  );
}

