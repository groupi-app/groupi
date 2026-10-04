import { describe, expect, it } from 'vitest';
import { ConvexError } from 'convex/values';
import {
  createInviteListSendAttempt,
  hasInviteListRequestExpired,
  isDefiniteInviteListRejection,
  isExpiredInviteListRequest,
  mergeInviteRecipients,
} from '../invite-list-draft';

describe('invite-list recipient drafts', () => {
  it('recognizes the retained request deadline when permission checks hide server expiry', () => {
    const issued = 1_791_072_000_000;
    const requestId = `${issued}.12345678-1234-4123-8123-123456789abc`;
    const deadline = issued + 86_400_000;
    expect(hasInviteListRequestExpired(requestId, deadline - 1)).toBe(false);
    expect(hasInviteListRequestExpired(requestId, deadline)).toBe(true);
    expect(hasInviteListRequestExpired(requestId, deadline + 1)).toBe(true);
    expect(hasInviteListRequestExpired(requestId, issued - 1)).toBe(false);
    for (const malformed of [
      'expired',
      `${issued}.12345678-1234-3123-8123-123456789abc`,
      `${issued}.12345678-1234-4123-7123-123456789abc`,
      `${issued - 1_000_000_000_000}.12345678-1234-4123-8123-123456789abc`,
    ]) {
      expect(hasInviteListRequestExpired(malformed, deadline + 1)).toBe(false);
    }
    expect(hasInviteListRequestExpired(requestId, Infinity)).toBe(false);
  });
  it('recognizes expired protected requests without treating them as evidence that nothing was sent', () => {
    for (const data of [
      { code: 'IDEMPOTENCY_EXPIRED', message: 'Inspect invitations' },
      JSON.stringify({ code: 'IDEMPOTENCY_EXPIRED' }),
    ]) {
      const expired = new ConvexError(data);
      expect(isExpiredInviteListRequest(expired)).toBe(true);
      expect(isDefiniteInviteListRejection(expired)).toBe(false);
    }
    expect(isExpiredInviteListRequest(new Error('IDEMPOTENCY_EXPIRED'))).toBe(
      false
    );
    expect(
      isExpiredInviteListRequest(new ConvexError({ code: 'FORBIDDEN' }))
    ).toBe(false);
  });
  it('copies list people into an editable snapshot and keeps existing manual selections once', () => {
    const manual = { personId: 'a', name: 'Manually selected' };
    const fromList = { personId: 'b', name: 'Saved person' };
    const draft = mergeInviteRecipients([manual], [manual, fromList]);

    fromList.name = 'Later profile update';
    expect(draft).toEqual([
      { personId: 'a', name: 'Manually selected' },
      { personId: 'b', name: 'Saved person' },
    ]);
    expect(draft[0]).not.toBe(manual);
  });

  it('accepts 100 unique people and rejects an oversized merge without truncating or changing the draft', () => {
    const current = Array.from({ length: 100 }, (_, index) => ({
      personId: String(index),
    }));
    expect(mergeInviteRecipients(current, [current[0]])).toHaveLength(100);
    expect(() =>
      mergeInviteRecipients(current, [{ personId: 'extra' }])
    ).toThrow('Choose at most 100 recipients.');
    expect(current).toHaveLength(100);
  });

  it('retains the original protected request and recipient snapshot for retry after an uncertain send', async () => {
    const input = {
      eventId: 'event',
      personIds: ['a', 'a', 'b'],
      role: 'ATTENDEE' as const,
      message: 'Come over',
    };
    const attempt = createInviteListSendAttempt(
      input,
      () => '12345678-1234-4123-8123-123456789abc'
    );
    const writes: unknown[] = [];
    const send = async (args: unknown) => {
      writes.push(args);
      if (writes.length === 1) throw new Error('Connection lost');
      return { sentCount: 2 };
    };

    await expect(send(attempt.args)).rejects.toThrow('Connection lost');
    input.personIds.push('c');
    input.message = 'Changed after uncertain outcome';
    await expect(send(attempt.args)).resolves.toEqual({ sentCount: 2 });
    expect(writes[1]).toEqual(writes[0]);
    expect(attempt.args.personIds).toEqual(['a', 'b']);
    expect(attempt.args.message).toBe('Come over');
    expect(attempt.args.requestId).toMatch(
      /^\d{13}\.12345678-1234-4123-8123-123456789abc$/
    );
    expect(() =>
      Object.assign(attempt.args, { message: 'Overwrite retry input' })
    ).toThrow();
    expect(() => attempt.args.personIds.push('new recipient')).toThrow();
  });

  it('refuses empty and oversized sends before issuing a request identifier', () => {
    const createUuid = () => {
      throw new Error('Identifier must not be issued');
    };
    expect(() =>
      createInviteListSendAttempt({ personIds: [] }, createUuid)
    ).toThrow('Choose at least one recipient.');
    expect(() =>
      createInviteListSendAttempt(
        { personIds: Array.from({ length: 101 }, (_, index) => String(index)) },
        createUuid
      )
    ).toThrow('Choose at most 100 recipients.');
  });

  it('distinguishes a fresh no-write rejection from uncertain or expired protected outcomes', () => {
    expect(
      isDefiniteInviteListRejection(
        new ConvexError({
          code: 'VALIDATION_ERROR',
          message: 'Too many recipients',
        })
      )
    ).toBe(true);
    expect(
      isDefiniteInviteListRejection(
        new ConvexError(
          JSON.stringify({ code: 'FORBIDDEN', message: 'Permission denied' })
        )
      )
    ).toBe(true);
    expect(
      isDefiniteInviteListRejection(
        new ConvexError({
          code: 'IDEMPOTENCY_EXPIRED',
          message: 'Inspect invitations',
        })
      )
    ).toBe(false);
    expect(
      isDefiniteInviteListRejection(
        new ConvexError({
          code: 'IDEMPOTENCY_CONFLICT',
          message: 'Different original inputs',
        })
      )
    ).toBe(false);
    expect(isDefiniteInviteListRejection(new Error('Connection lost'))).toBe(
      false
    );
  });
});
