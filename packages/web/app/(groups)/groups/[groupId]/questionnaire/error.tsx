'use client';
import { Button } from '@/components/ui/button';
export default function QuestionnaireError({ reset }: { reset: () => void }) {
  return (
    <main className='p-6 space-y-3'>
      <p role='alert'>
        Your questionnaire records are unavailable. The Group may have been
        deleted or your access may have changed.
      </p>
      <Button variant='outline' onClick={reset}>
        Try again
      </Button>
    </main>
  );
}
