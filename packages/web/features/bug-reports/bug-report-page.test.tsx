import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BugReportPage } from './bug-report-page';
vi.stubGlobal(
  'ResizeObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
);
vi.mock('@/lib/auth-client', () => ({
  authClient: { convex: { token: async () => ({ data: null }) } },
}));
const replayState = vi.hoisted(() => ({
  available: false,
  attach: vi.fn(async () => 'a'.repeat(32)),
}));
vi.mock('./replay', () => ({
  createBugReportReplay: () => ({
    available: () => replayState.available,
    attach: replayState.attach,
  }),
}));
beforeEach(() =>
  vi.stubGlobal(
    'fetch',
    vi.fn(
      async () =>
        new Response(
          JSON.stringify({ status: 'accepted', eventId: 'a'.repeat(32) })
        )
    )
  )
);
describe('private bug report page', () => {
  it('sends a description anonymously without replay or account details and acknowledges acceptance', async () => {
    render(<BugReportPage />);
    fireEvent.change(screen.getByLabelText('What happened?'), {
      target: { value: 'The sign-in button does nothing.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send report' }));
    await screen.findByText('Thanks — your report was accepted.');
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, options] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe('/api/bug-reports');
    expect(JSON.parse(String(options?.body))).toEqual({
      submissionId: expect.any(String),
      description: 'The sign-in button does nothing.',
      includeReplay: false,
    });
    expect(
      screen.queryByLabelText('Include session replay')
    ).not.toBeInTheDocument();
  });
});
it('keeps the draft after uncertain delivery and checks the receipt before a deliberate retry', async () => {
  vi.mocked(fetch).mockRejectedValueOnce(new Error('offline'));
  render(<BugReportPage />);
  fireEvent.change(screen.getByLabelText('What happened?'), {
    target: { value: 'Draft survives' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Send report' }));
  await screen.findByText(/Delivery is uncertain/);
  expect(screen.getByLabelText('What happened?')).toHaveValue('Draft survives');
  fireEvent.click(screen.getByRole('button', { name: 'Check delivery' }));
  await screen.findByText('Thanks — your report was accepted.');
  expect(vi.mocked(fetch).mock.calls[1][0]).toBe('/api/bug-reports/receipt');
});
it('validates the combined Unicode budget and sends only explicitly entered optional fields', async () => {
  render(<BugReportPage />);
  fireEvent.change(screen.getByLabelText('What happened?'), {
    target: { value: '😀'.repeat(4096) },
  });
  fireEvent.change(screen.getByLabelText('Steps to reproduce (optional)'), {
    target: { value: 'Click' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Send report' }));
  await screen.findByRole('alert');
  expect(fetch).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText('What happened?'), {
    target: { value: 'Broken button' },
  });
  fireEvent.change(screen.getByLabelText('Reply email (optional)'), {
    target: { value: 'reply@example.test' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Send report' }));
  await screen.findByText('Thanks — your report was accepted.');
  expect(
    JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body))
  ).toMatchObject({
    reproductionSteps: 'Click',
    replyEmail: 'reply@example.test',
  });
});
it('keeps selected images local and removable, and rejects unsupported images without losing text', async () => {
  render(<BugReportPage />);
  fireEvent.change(screen.getByLabelText('What happened?'), {
    target: { value: 'Image issue' },
  });
  const input = screen.getByLabelText('Images (optional)');
  fireEvent.change(input, {
    target: {
      files: [new File(['image'], 'screen.png', { type: 'image/png' })],
    },
  });
  await screen.findByRole('img', { name: 'Selected image 1' });
  expect(fetch).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Remove image 1' }));
  expect(screen.queryByRole('img')).not.toBeInTheDocument();
  fireEvent.change(input, {
    target: { files: [new File(['x'], 'secret.txt', { type: 'text/plain' })] },
  });
  await screen.findByRole('alert');
  expect(screen.getByLabelText('What happened?')).toHaveValue('Image issue');
});

it('shares replay only after opting in and pressing Send, with deliberate text-only recovery', async () => {
  replayState.available = true;
  replayState.attach.mockRejectedValueOnce(
    new Error('Replay upload was not accepted.')
  );
  render(<BugReportPage />);
  const consent = screen.getByLabelText('Include session replay');
  expect(consent).not.toBeChecked();
  fireEvent.click(consent);
  expect(replayState.attach).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText('What happened?'), {
    target: { value: 'Replay issue' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Send report' }));
  await screen.findByRole('alert');
  expect(fetch).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Send without replay' }));
  await screen.findByText('Thanks — your report was accepted.');
  expect(
    JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body)).includeReplay
  ).toBe(false);
  replayState.available = false;
});
it('preserves failed drafts, disables concurrent sends and reuses the immutable submission identifier on retry', async () => {
  let finish!: (response: Response) => void;
  vi.mocked(fetch).mockImplementationOnce(
    () =>
      new Promise(resolve => {
        finish = resolve;
      })
  );
  render(<BugReportPage />);
  fireEvent.change(screen.getByLabelText('What happened?'), {
    target: { value: 'Retry me' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Send report' }));
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
  expect(screen.getByRole('button', { name: /Sending/ })).toBeDisabled();
  finish(
    new Response(
      JSON.stringify({ status: 'failed', code: 'upstream-rejected' })
    )
  );
  await screen.findByText(/could not be sent/);
  fireEvent.click(screen.getByRole('button', { name: 'Send report' }));
  await screen.findByText('Thanks — your report was accepted.');
  expect(
    JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body)).submissionId
  ).toBe(
    JSON.parse(String(vi.mocked(fetch).mock.calls[1][1]?.body)).submissionId
  );
});
it('never blindly resends an unknown attempt and requires receipt lookup before a warned new attempt', async () => {
  vi.mocked(fetch).mockRejectedValueOnce(new Error('lost'));
  render(<BugReportPage />);
  fireEvent.change(screen.getByLabelText('What happened?'), {
    target: { value: 'Uncertain report' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Send report' }));
  await screen.findByText(/Delivery is uncertain/);
  expect(screen.getByRole('button', { name: 'Send report' })).toBeDisabled();
  expect(screen.getByLabelText('What happened?')).toBeDisabled();
  expect(
    screen.queryByRole('button', { name: 'Send another report anyway' })
  ).not.toBeInTheDocument();
  vi.mocked(fetch).mockResolvedValueOnce(
    new Response(
      JSON.stringify({ status: 'outcome-unknown', code: 'network-uncertain' })
    )
  );
  fireEvent.click(screen.getByRole('button', { name: 'Check delivery' }));
  fireEvent.click(
    await screen.findByRole('button', { name: 'Send another report anyway' })
  );
  await screen.findByText('Thanks — your report was accepted.');
  const calls = vi.mocked(fetch).mock.calls;
  expect(JSON.parse(String(calls[0][1]?.body)).submissionId).not.toBe(
    JSON.parse(String(calls[2][1]?.body)).submissionId
  );
});
it('does not treat a malformed or rejected HTTP response as acceptance', async () => {
  vi.mocked(fetch).mockResolvedValueOnce(
    new Response(
      JSON.stringify({ status: 'accepted', eventId: 'a'.repeat(32) }),
      { status: 503 }
    )
  );
  render(<BugReportPage />);
  fireEvent.change(screen.getByLabelText('What happened?'), {
    target: { value: 'HTTP failure' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Send report' }));
  await screen.findByText(/Delivery is uncertain/);
  expect(
    screen.queryByText('Thanks — your report was accepted.')
  ).not.toBeInTheDocument();
});
it('explains rejected images and preserves the selected image for removal or retry', async () => {
  vi.mocked(fetch).mockResolvedValueOnce(
    new Response(JSON.stringify({ status: 'failed', code: 'invalid-image' }))
  );
  render(<BugReportPage />);
  fireEvent.change(screen.getByLabelText('What happened?'), {
    target: { value: 'Image transfer issue' },
  });
  fireEvent.change(screen.getByLabelText('Images (optional)'), {
    target: {
      files: [new File(['image'], 'screen.png', { type: 'image/png' })],
    },
  });
  await screen.findByRole('img', { name: 'Selected image 1' });
  fireEvent.click(screen.getByRole('button', { name: 'Send report' }));
  await screen.findByText(/An image was rejected/);
  expect(screen.getByRole('button', { name: 'Remove image 1' })).toBeEnabled();
});

it('supports keyboard-only description entry and sending with live acceptance status', async () => {
  const user = userEvent.setup();
  render(<BugReportPage />);
  await user.tab();
  expect(screen.getByLabelText('What happened?')).toHaveFocus();
  await user.keyboard('Keyboard-only bug report');
  await user.tab();
  expect(screen.getByLabelText('Steps to reproduce (optional)')).toHaveFocus();
  await user.tab();
  expect(screen.getByLabelText('Reply email (optional)')).toHaveFocus();
  await user.tab();
  expect(screen.getByLabelText('Images (optional)')).toHaveFocus();
  await user.tab();
  expect(screen.getByRole('button', { name: 'Send report' })).toHaveFocus();
  await user.keyboard('{Enter}');
  expect(
    await screen.findByText('Thanks — your report was accepted.')
  ).toHaveAttribute('role', 'status');
});
