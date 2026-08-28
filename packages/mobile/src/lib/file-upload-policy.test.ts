import { describe, expect, it } from 'vitest';

import {
  getAttachmentValidationError,
  MAX_FILE_SIZE,
} from './file-upload-policy';

describe('getAttachmentValidationError', () => {
  it.each([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'application/pdf',
  ])('accepts supported type %s', mimeType => {
    expect(
      getAttachmentValidationError({ mimeType, size: MAX_FILE_SIZE })
    ).toBeNull();
  });

  it('rejects an unsupported MIME type', () => {
    expect(
      getAttachmentValidationError({ mimeType: 'text/html', size: 100 })
    ).toBe('This file type is not supported.');
  });

  it('rejects a file over the maximum size', () => {
    expect(
      getAttachmentValidationError({
        mimeType: 'image/jpeg',
        size: MAX_FILE_SIZE + 1,
      })
    ).toBe('Attachments must be 10 MB or smaller.');
  });

  it('rejects invalid size metadata', () => {
    expect(
      getAttachmentValidationError({ mimeType: 'image/jpeg', size: -1 })
    ).toBe('This file has an invalid size.');
  });

  it('allows validation to continue when the picker omits a size', () => {
    expect(getAttachmentValidationError({ mimeType: 'image/jpeg' })).toBeNull();
  });
});
