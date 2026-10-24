import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { toast as sonnerToast } from 'sonner';
import userEvent from '@testing-library/user-event';
import { ToastAction } from './toast';
import { Toaster } from './sonner';
import { toast, useToast } from './use-toast';

function Feedback() {
  const { toasts, dismiss } = useToast();
  return (
    <>
      <output>
        {toasts
          .filter(item => item.open)
          .map(item => item.title)
          .join(', ')}
      </output>
      <button onClick={() => dismiss()}>Dismiss feedback</button>
      <button onClick={() => dismiss(toasts[0]?.id)}>
        Dismiss feedback by ID
      </button>
    </>
  );
}

beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, 'setPointerCapture', {
    configurable: true,
    value() {},
  });
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
  }));
});

afterEach(() => {
  act(() => {
    sonnerToast.dismiss();
  });
  cleanup();
  vi.unstubAllGlobals();
});

it('delivers legacy success and error feedback through the mounted app renderer', async () => {
  render(
    <>
      <Feedback />
      <Toaster />
    </>
  );
  act(() => {
    toast({ title: 'Event saved', description: 'Your changes are live.' });
  });
  expect(await screen.findByText('Your changes are live.')).toBeVisible();
  act(() => {
    toast({
      title: 'Unable to save',
      description: 'Try again.',
      variant: 'destructive',
    });
  });
  expect(await screen.findByText('Try again.')).toBeVisible();
});

it('updates feedback in place and dismisses it through the original handle', async () => {
  render(
    <>
      <Feedback />
      <Toaster />
    </>
  );
  let message!: ReturnType<typeof toast>;
  act(() => {
    message = toast({
      title: 'Saving',
      description: 'Waiting for save',
      duration: Infinity,
    });
  });
  expect(await screen.findByText('Waiting for save')).toBeVisible();
  act(() => {
    message.update({ title: 'Saved', description: 'Save completed' });
  });
  expect(await screen.findByText('Save completed')).toBeVisible();
  expect(screen.queryByText('Waiting for save')).not.toBeInTheDocument();
  act(() => message.dismiss());
  await waitFor(() =>
    expect(screen.queryByText('Save completed')).not.toBeInTheDocument()
  );
  expect(screen.getByRole('status')).toBeEmptyDOMElement();
});

it('dismisses by ID without dismissing unrelated Sonner feedback', async () => {
  const user = userEvent.setup();
  render(
    <>
      <Feedback />
      <Toaster />
    </>
  );
  act(() => {
    toast({
      title: 'Legacy feedback',
      description: 'Legacy notice',
      duration: Infinity,
    });
    sonnerToast('Separate notice', {
      description: 'Keep this notice',
      duration: Infinity,
    });
  });
  expect(await screen.findByText('Legacy notice')).toBeInTheDocument();
  await user.click(
    screen.getByRole('button', { name: 'Dismiss feedback by ID' })
  );
  await waitFor(() =>
    expect(screen.queryByText('Legacy notice')).not.toBeInTheDocument()
  );
  expect(screen.getByText('Keep this notice')).toBeVisible();
});

it('delivers a legacy action and synchronizes dismissal with hook state', async () => {
  const user = userEvent.setup();
  let retried = false;
  render(
    <>
      <Feedback />
      <Toaster />
    </>
  );
  act(() => {
    toast({
      title: 'Save failed',
      description: 'Actionable feedback',
      duration: Infinity,
      action: (
        <ToastAction
          altText='Retry saving'
          onClick={() => {
            retried = true;
          }}
        >
          Retry
        </ToastAction>
      ),
    });
  });
  await user.click(await screen.findByRole('button', { name: 'Retry saving' }));
  expect(retried).toBe(true);
  await waitFor(() =>
    expect(screen.queryByText('Actionable feedback')).not.toBeInTheDocument()
  );
  expect(screen.getByRole('status')).toBeEmptyDOMElement();
});

it('removes an obsolete action when feedback is updated', async () => {
  render(<Toaster />);
  let message!: ReturnType<typeof toast>;
  act(() => {
    message = toast({
      title: 'Save failed',
      duration: Infinity,
      action: <ToastAction altText='Retry saving'>Retry</ToastAction>,
    });
  });
  expect(
    await screen.findByRole('button', { name: 'Retry saving' })
  ).toBeInTheDocument();
  act(() => message.update({ title: 'Saved', action: undefined }));
  await waitFor(() =>
    expect(
      screen.queryByRole('button', { name: 'Retry saving' })
    ).not.toBeInTheDocument()
  );
});

it('preserves disabled actions supplied by compatibility callers', async () => {
  render(<Toaster />);
  act(() => {
    toast({
      title: 'Waiting for connection',
      duration: Infinity,
      action: (
        <ToastAction altText='Retry saving' disabled>
          Retry
        </ToastAction>
      ),
    });
  });
  expect(
    await screen.findByRole('button', { name: 'Retry saving' })
  ).toBeDisabled();
});

it('synchronizes automatic expiry with compatibility hook state', async () => {
  render(
    <>
      <Feedback />
      <Toaster />
    </>
  );
  act(() => {
    toast({
      title: 'Event saved',
      description: 'Short-lived notice',
      duration: 30,
    });
  });
  expect(await screen.findByText('Short-lived notice')).toBeInTheDocument();
  await waitFor(() =>
    expect(screen.queryByText('Short-lived notice')).not.toBeInTheDocument()
  );
  expect(screen.getByRole('status')).toBeEmptyDOMElement();
});
