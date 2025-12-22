'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function Page() {
  const router = useRouter();
  return (
    <div className='container mt-24'>
      <h1 className='font-heading font-medium text-3xl mb-1'>Uh Oh!</h1>
      <p className='mb-4'>{'An internal server error has occured!'}</p>
      <Button
        onClick={() => {
          router.back();
        }}
        variant={'outline'}
      >
        Go Back
      </Button>
    </div>
  );
}
