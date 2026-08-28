// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  post: vi.fn(),
}));

vi.mock('@/lib/auth-server', () => ({
  handler: {
    GET: vi.fn(),
    POST: mocks.post,
  },
}));

import { POST } from '@/app/api/auth/[...all]/route';

describe('auth proxy logging', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('never writes credentials or auth response bodies to application logs', async () => {
    const sensitiveRequest = {
      email: 'person@example.test',
      otp: '123456',
      credential: 'google-id-token',
    };
    mocks.post.mockResolvedValue(
      Response.json(
        { message: 'bad request', internalToken: 'server-response-secret' },
        { status: 401 }
      )
    );
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const error = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    const response = await POST(
      new Request('http://localhost:3000/api/auth/sign-in/email-otp', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(sensitiveRequest),
      }) as never
    );

    const logged = [...log.mock.calls, ...error.mock.calls].flat().join(' ');
    expect(response.status).toBe(401);
    expect(logged).not.toContain(sensitiveRequest.email);
    expect(logged).not.toContain(sensitiveRequest.otp);
    expect(logged).not.toContain(sensitiveRequest.credential);
    expect(logged).not.toContain('server-response-secret');
  });
});
