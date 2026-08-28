export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const MAX_ATTACHMENTS = 10;

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
] as const;

export const ALLOWED_FILE_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'application/pdf',
] as const;

interface AttachmentFileMetadata {
  mimeType: string;
  size?: number;
}

export function getAttachmentValidationError({
  mimeType,
  size,
}: AttachmentFileMetadata): string | null {
  if (!(ALLOWED_FILE_TYPES as readonly string[]).includes(mimeType)) {
    return 'This file type is not supported.';
  }

  if (size !== undefined && (!Number.isFinite(size) || size < 0)) {
    return 'This file has an invalid size.';
  }

  if (size !== undefined && size > MAX_FILE_SIZE) {
    return 'Attachments must be 10 MB or smaller.';
  }

  return null;
}
