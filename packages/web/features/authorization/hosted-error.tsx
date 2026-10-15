'use client';
import { HostedBrand } from './hosted-brand';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
export function HostedError({ interactionId }: { interactionId: string }) {
  return (
    <Card>
      {interactionId ? <HostedBrand interactionId={interactionId} /> : null}
      <CardHeader>
        <CardTitle>Sign-in could not be completed</CardTitle>
      </CardHeader>
      <CardContent className='space-y-3'>
        <p role='alert'>
          This request may have expired, been completed, or been opened in
          another browser. Return to the original browser where you started
          sign-in. If that request is no longer available, return to the app and
          reconnect.
        </p>
        <p className='text-sm text-muted-foreground'>
          A consent decision cannot be transferred between browsers. No new
          connection is approved from this recovery page.
        </p>
      </CardContent>
    </Card>
  );
}
