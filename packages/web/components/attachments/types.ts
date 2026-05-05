import type { PendingUpload } from '@/hooks/convex/use-file-upload';

export interface PreviewAttachment {
  id: string;
  preview?: string;
  filename: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  altText?: string;
  isSpoiler: boolean;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  error?: string;
}

export interface ServerAttachment {
  _id: string;
  type: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE';
  filename: string;
  size: number;
  mimeType: string;
  width?: number;
  height?: number;
  url: string | null;
  isSpoiler?: boolean;
  altText?: string;
}

export function fromPendingUpload(upload: PendingUpload): PreviewAttachment {
  return {
    id: upload.id,
    preview: upload.preview,
    filename: upload.displayFilename,
    mimeType: upload.file.type,
    size: upload.file.size,
    width: upload.width,
    height: upload.height,
    altText: upload.altText,
    isSpoiler: upload.isSpoiler,
    status: upload.status,
    error: upload.error,
  };
}

export function fromServerAttachment(
  attachment: ServerAttachment
): PreviewAttachment {
  return {
    id: attachment._id,
    preview: attachment.url ?? undefined,
    filename: attachment.filename,
    mimeType: attachment.mimeType,
    size: attachment.size,
    width: attachment.width,
    height: attachment.height,
    altText: attachment.altText,
    isSpoiler: attachment.isSpoiler ?? false,
    status: 'complete',
  };
}
