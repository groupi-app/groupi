import { describe, it, expect, vi } from 'vitest';
import { createBugReportReplay } from './replay';

describe('manual report replay consent', () => {
  it('observes availability without starting or uploading a recording', async () => {
    const recording = {
      getReplayId: () => 'a'.repeat(32),
      getRecordingMode: () => 'session' as const,
      flush: vi.fn(),
      start: vi.fn(),
    };
    const replay = createBugReportReplay(() => recording);
    expect(replay.available()).toBe(true);
    expect(recording.flush).not.toHaveBeenCalled();
    expect(recording.start).not.toHaveBeenCalled();
  });
});

it('flushes only an existing recording on explicit send and refuses expired recording', async () => {
  let id: string | undefined = 'a'.repeat(32);
  const flush = vi.fn(async () => {});
  const replay = createBugReportReplay(
    () => ({ getReplayId: () => id, getRecordingMode: () => 'session', flush }),
    () => ({ promise: Promise.resolve(), dispose: vi.fn() })
  );
  await expect(replay.attach()).resolves.toBe('a'.repeat(32));
  expect(flush).toHaveBeenCalledTimes(1);
  id = undefined;
  await expect(replay.attach()).rejects.toThrow('no longer available');
  expect(flush).toHaveBeenCalledTimes(1);
});
it('preserves session recording and does not mistake a swallowed upload error for acceptance', async () => {
  const flush = vi.fn(async () => {});
  const replay = createBugReportReplay(
    () => ({
      getReplayId: () => 'b'.repeat(32),
      getRecordingMode: () => 'session',
      flush,
    }),
    () => ({
      promise: Promise.reject(new Error('not accepted')),
      dispose: vi.fn(),
    })
  );
  await expect(replay.attach()).rejects.toThrow('could not be confirmed');
  expect(flush).toHaveBeenCalledWith({ continueRecording: true });
});
it('reuses a confirmed current recording link when retrying the same report instead of uploading it again', async () => {
  const flush = vi.fn(async () => {});
  const replay = createBugReportReplay(
    () => ({
      getReplayId: () => 'c'.repeat(32),
      getRecordingMode: () => 'session',
      flush,
    }),
    () => ({ promise: Promise.resolve(), dispose: vi.fn() })
  );
  expect(await replay.attach()).toBe('c'.repeat(32));
  expect(await replay.attach()).toBe('c'.repeat(32));
  expect(flush).toHaveBeenCalledTimes(1);
});
it('does not expose SDK error details when replay preparation fails', async () => {
  const replay = createBugReportReplay(
    () => ({
      getReplayId: () => 'd'.repeat(32),
      getRecordingMode: () => 'session',
      flush: async () => {
        throw new Error('https://private.example/token=secret');
      },
    }),
    () => ({ promise: Promise.resolve(), dispose: vi.fn() })
  );
  await expect(replay.attach()).rejects.toThrow(
    'Replay upload could not be confirmed. Retry or send without replay.'
  );
});

it('never offers or flushes buffered-only replay, preserving independent diagnostics', async () => {
  const flush = vi.fn();
  const observe = vi.fn();
  const replay = createBugReportReplay(
    () => ({
      getReplayId: () => 'e'.repeat(32),
      getRecordingMode: () => 'buffer',
      flush,
    }),
    observe
  );
  expect(replay.available()).toBe(false);
  await expect(replay.attach()).rejects.toThrow('no longer available');
  expect(flush).not.toHaveBeenCalled();
  expect(observe).not.toHaveBeenCalled();
});
