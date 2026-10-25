import { afterEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  generateUploadUrl: vi.fn().mockResolvedValue('https://upload.test/ticket'),
}));
vi.mock('react', async original => ({
  ...(await original<typeof import('react')>()),
  useState: <T>(value: T) => [value, vi.fn()],
  useCallback: <T>(fn: T) => fn,
}));
vi.mock('convex/react', () => ({ useMutation: () => mocks.generateUploadUrl }));
vi.mock('convex/_generated/api', () => ({
  api: { files: { mutations: { generateUploadUrl: 'generateUploadUrl' } } },
}));
import { useFileUpload } from './use-file-upload';
afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});
for (const purpose of ['cover', 'avatar', undefined] as const)
  it(`binds mobile ${purpose ?? 'attachment'} uploads to their purpose while preserving attachment defaults`, async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response('image', { headers: { 'Content-Type': 'image/png' } })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ storageId: 'owned-image' }))
      );
    vi.stubGlobal('fetch', fetch);
    const result = await useFileUpload().uploadFile(
      'file:///image.png',
      'image.png',
      'image/png',
      purpose
    );
    expect(mocks.generateUploadUrl).toHaveBeenCalledWith({
      purpose: purpose ?? 'attachment',
    });
    expect(result).toMatchObject({
      storageId: 'owned-image',
      mimeType: 'image/png',
    });
    expect(fetch).toHaveBeenLastCalledWith(
      'https://upload.test/ticket',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'image/png' },
      })
    );
  });
