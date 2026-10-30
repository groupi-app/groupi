'use client';
import Link from 'next/link';
import { Bug, LockKeyhole } from 'lucide-react';
import { bugReportFailureMessage } from './messages';
import { readBugReportImages } from './images';
import { createBugReportReplay } from './replay';
import { Checkbox } from '@/components/ui/checkbox';
import { useEffect, useRef, useState } from 'react';
import { createBugReportHooks } from '@groupi/shared/hooks';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  buildBugReportMessage,
  validateBugReportText,
} from '@groupi/shared/utils';
import { Label } from '@/components/ui/label';
import { bugReportTransport } from './transport';
const replay = createBugReportReplay();
const { useBugReport } = createBugReportHooks(bugReportTransport);
export function BugReportPage() {
  const [description, setDescription] = useState('');
  const report = useBugReport();
  const [reproductionSteps, setSteps] = useState('');
  const [replyEmail, setEmail] = useState('');
  const [error, setError] = useState('');
  const [images, setImages] = useState<
    Awaited<ReturnType<typeof readBugReportImages>>
  >([]);
  const [reading, setReading] = useState(false);
  const [replayAvailable, setReplayAvailable] = useState(false);
  const [includeReplay, setIncludeReplay] = useState(false);
  const [replayError, setReplayError] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const sending = useRef(false);
  useEffect(() => {
    const check = () => setReplayAvailable(replay.available());
    check();
    const timer = setInterval(check, 2000);
    return () => clearInterval(timer);
  }, []);
  async function send(
    withReplay = includeReplay,
    deliberateNewAttempt = false
  ) {
    if (sending.current || report.pending || reading) return;
    const validation = validateBugReportText({
      description,
      reproductionSteps,
      replyEmail,
    });
    if (!validation.valid) {
      setError(validation.message);
      return;
    }
    sending.current = true;
    setPreparing(true);
    setError('');
    setReplayError(false);
    try {
      let replayId: string | undefined;
      if (withReplay) {
        try {
          replayId = await replay.attach();
        } catch (failure) {
          setReplayError(true);
          setError(
            failure instanceof Error
              ? failure.message
              : 'Replay could not be shared.'
          );
          return;
        }
      }
      await report.submit(
        {
          description,
          ...(reproductionSteps ? { reproductionSteps } : {}),
          ...(replyEmail ? { replyEmail } : {}),
          ...(images.length ? { images: images.map(item => item.image) } : {}),
          includeReplay: withReplay,
          ...(replayId ? { replayId } : {}),
        },
        deliberateNewAttempt
      );
    } finally {
      sending.current = false;
      setPreparing(false);
    }
  }
  return (
    <main className='mx-auto max-w-2xl px-6 py-12 text-foreground'>
      <div className='mb-5 inline-flex items-center gap-2 rounded-badge bg-muted px-3 py-1 text-sm font-medium'>
        <Bug className='size-4' aria-hidden='true' /> Make Groupi better
      </div>
      <h1 className='font-heading text-3xl sm:text-4xl font-bold tracking-tight'>
        Report a bug
      </h1>
      <p className='mt-3 text-muted-foreground'>
        Something not working? Tell us what happened. No sign-in needed.
      </p>
      <form
        className='mt-8 space-y-6 rounded-card border border-border bg-card p-5 sm:p-8 shadow-raised'
        onSubmit={event => {
          event.preventDefault();
          void send();
        }}
      >
        <fieldset
          disabled={
            preparing ||
            report.pending ||
            report.result?.status === 'accepted' ||
            report.result?.status === 'outcome-unknown' ||
            report.result?.status === 'in-progress'
          }
          className='space-y-6 min-w-0'
        >
          <legend className='sr-only'>Bug report details</legend>
          <div className='space-y-2'>
            <Label htmlFor='description'>What happened?</Label>
            <Textarea
              id='description'
              className='min-h-32'
              aria-describedby='message-budget'
              placeholder='What did you expect, and what happened instead?'
              required
              value={description}
              onChange={event => setDescription(event.target.value)}
            />
          </div>
          <p id='message-budget' className='text-sm text-muted-foreground'>
            {[...buildBugReportMessage(description, reproductionSteps)].length}{' '}
            / 4,096 characters including steps
          </p>
          <div className='space-y-2'>
            <Label htmlFor='steps'>Steps to reproduce (optional)</Label>
            <Textarea
              id='steps'
              value={reproductionSteps}
              onChange={event => setSteps(event.target.value)}
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='email'>Reply email (optional)</Label>
            <Input
              id='email'
              type='email'
              autoComplete='off'
              value={replyEmail}
              onChange={event => setEmail(event.target.value)}
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='images'>Images (optional)</Label>
            <Input
              id='images'
              type='file'
              multiple
              accept='image/png,image/jpeg,image/webp'
              disabled={reading || report.pending}
              aria-describedby='image-help'
              onChange={async event => {
                const files = Array.from(event.target.files ?? []);
                event.target.value = '';
                setReading(true);
                try {
                  const added = await readBugReportImages(
                    files,
                    images.reduce((sum, item) => sum + item.bytes, 0),
                    images.length
                  );
                  setImages(previous => [...previous, ...added]);
                  setError('');
                } catch (failure) {
                  setError(
                    failure instanceof Error
                      ? failure.message
                      : 'Image could not be read.'
                  );
                } finally {
                  setReading(false);
                }
              }}
            />
            <p id='image-help' className='text-sm text-muted-foreground'>
              Up to 3 PNG, JPEG or WebP images, 2 MiB total. Maximum 16
              megapixels and 8,192 pixels per side. Redact private information
              first.
            </p>
            <div className='flex flex-wrap gap-4'>
              {images.map((item, index) => (
                <div key={index} className='space-y-2'>
                  {/* Local user-selected preview; never an automatic screenshot. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.preview}
                    alt={`Selected image ${index + 1}`}
                    className='h-24 w-24 rounded-card object-cover'
                  />
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() =>
                      setImages(previous =>
                        previous.filter((_, i) => i !== index)
                      )
                    }
                  >
                    Remove image {index + 1}
                  </Button>
                </div>
              ))}
            </div>
          </div>
          {replayAvailable && (
            <div className='space-y-2'>
              <div className='flex items-center gap-3'>
                <Checkbox
                  id='replay'
                  checked={includeReplay}
                  onCheckedChange={value => setIncludeReplay(value === true)}
                />
                <Label htmlFor='replay'>Include session replay</Label>
              </div>
              <p className='text-sm text-muted-foreground'>
                Share the available recording of this Groupi session. It may
                contain private information; it does not include other sites or
                tabs.
              </p>
            </div>
          )}
          <p className='text-sm text-muted-foreground'>
            This choice does not stop independently collected diagnostics. Never
            include passwords, one-time codes, API keys or other people’s
            private content.
          </p>
        </fieldset>
        {replayError && (
          <Button
            type='button'
            variant='outline'
            disabled={preparing || report.pending}
            onClick={() => {
              setIncludeReplay(false);
              void send(false);
            }}
          >
            Send without replay
          </Button>
        )}
        {error && (
          <p role='alert' className='text-error'>
            {error}
          </p>
        )}
        <Button
          type='submit'
          disabled={
            report.pending ||
            reading ||
            preparing ||
            report.result?.status === 'outcome-unknown' ||
            report.result?.status === 'in-progress' ||
            report.result?.status === 'accepted'
          }
        >
          {preparing || report.pending ? 'Sending…' : 'Send report'}
        </Button>
        {(report.result?.status === 'outcome-unknown' ||
          report.result?.status === 'in-progress') && (
          <>
            <p role='status' aria-live='polite'>
              Delivery is uncertain. Your draft is safe here. Check delivery
              before retrying.
            </p>
            <Button
              type='button'
              disabled={report.pending}
              onClick={() => void report.checkReceipt()}
            >
              Check delivery
            </Button>
          </>
        )}
        {report.receiptChecked &&
          report.result?.status === 'outcome-unknown' && (
            <div className='space-y-2'>
              <p>
                We still cannot confirm delivery. Sending again may create a
                duplicate report.
              </p>
              <Button
                type='button'
                variant='outline'
                disabled={preparing || report.pending}
                onClick={() => void send(includeReplay, true)}
              >
                Send another report anyway
              </Button>
            </div>
          )}
        {report.result?.status === 'not-found' && (
          <p role='status' aria-live='polite'>
            No delivery receipt was found. You can retry with the same report
            identifier.
          </p>
        )}
        {report.result?.status === 'failed' && (
          <p role='alert' className='text-error'>
            Your report could not be sent. Your draft is still here.{' '}
            {bugReportFailureMessage(report.result.code)}{' '}
            {report.result.retryAfterMs
              ? `Wait ${Math.ceil(report.result.retryAfterMs / 1000)} seconds before trying again.`
              : ''}
          </p>
        )}
        <p role='status' aria-live='polite'>
          {report.result?.status === 'accepted'
            ? 'Thanks — your report was accepted.'
            : ''}
        </p>
        {report.result?.status === 'accepted' && (
          <p className='text-sm text-muted-foreground'>
            Acceptance does not guarantee image availability, replay retention
            or a reply. Thanks for helping us improve Groupi.
          </p>
        )}
      </form>
      <p className='mt-6 flex items-center gap-2 text-sm text-muted-foreground'>
        <LockKeyhole className='size-4 shrink-0' aria-hidden='true' /> Sent
        privately to Groupi’s Sentry feedback inbox, not a public issue.
      </p>
      <nav aria-label='Report help' className='mt-4 flex gap-6 text-sm'>
        <Link href='/support' className='underline'>
          Help and support
        </Link>
        <Link href='/privacy' className='underline'>
          Privacy policy
        </Link>
      </nav>
    </main>
  );
}
