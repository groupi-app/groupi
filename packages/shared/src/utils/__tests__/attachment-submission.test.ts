import { describe, expect, it, vi } from 'vitest';

import { createAfterUploading } from '../attachment-submission';

describe('createAfterUploading', () => {
  it('uploads the complete batch before creating the parent', async () => {
    const uploadAll = vi.fn().mockResolvedValue(['storage-1', 'storage-2']);
    const create = vi.fn().mockResolvedValue('post-1');

    await expect(
      createAfterUploading({ expectedUploadCount: 2, uploadAll, create })
    ).resolves.toBe('post-1');

    expect(create).toHaveBeenCalledWith(['storage-1', 'storage-2']);
    expect(uploadAll.mock.invocationCallOrder[0]).toBeLessThan(
      create.mock.invocationCallOrder[0]
    );
  });

  it('never creates a parent from a partial upload batch', async () => {
    const create = vi.fn();

    await expect(
      createAfterUploading({
        expectedUploadCount: 2,
        uploadAll: vi.fn().mockResolvedValue(['storage-1']),
        create,
      })
    ).rejects.toThrow('Not all attachments');
    expect(create).not.toHaveBeenCalled();
  });

  it('never creates a parent when uploading throws', async () => {
    const create = vi.fn();

    await expect(
      createAfterUploading({
        expectedUploadCount: 1,
        uploadAll: vi.fn().mockRejectedValue(new Error('network failed')),
        create,
      })
    ).rejects.toThrow('network failed');
    expect(create).not.toHaveBeenCalled();
  });

  it('creates immediately when there are no attachments', async () => {
    const uploadAll = vi.fn();
    const create = vi.fn().mockResolvedValue('reply-1');

    await expect(
      createAfterUploading({ expectedUploadCount: 0, uploadAll, create })
    ).resolves.toBe('reply-1');
    expect(uploadAll).not.toHaveBeenCalled();
    expect(create).toHaveBeenCalledWith([]);
  });
});
