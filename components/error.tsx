'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function ErrorPage({ message }: { message: string }) {
  const router = useRouter();
  return (
    <div className='container mt-24 max-w-2xl '>
      <h1 className='font-heading font-medium text-3xl mb-1'>Uh Oh!</h1>
      <p className='mb-4'>{message ?? 'Something went wrong!'}</p>
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
