import { useState, useCallback, useRef } from 'react';
import { useMutation } from 'convex/react';

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const { api } = require('convex/_generated/api') as { api: any };

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_ATTACHMENTS = 10;

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

export const ALLOWED_FILE_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'application/pdf',
];

export interface UploadResult {
  storageId: string;
  filename: string;
  size: number;
  mimeType: string;
  width?: number;
  height?: number;
}

export interface PendingUpload {
  id: string;
  uri: string;
  filename: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  error?: string;
  result?: UploadResult;
}

export function useFileUpload() {
  const generateUploadUrl = useMutation(api.files.mutations.generateUploadUrl);
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = useCallback(
    async (
      uri: string,
      filename: string,
      mimeType: string
    ): Promise<UploadResult | null> => {
      setIsUploading(true);
      try {
        const uploadUrl = await generateUploadUrl({});

        const response = await fetch(uri);
        const blob = await response.blob();

        const uploadResponse = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': mimeType },
          body: blob,
        });

        if (!uploadResponse.ok) {
          throw new Error(`Upload failed: ${uploadResponse.statusText}`);
        }

        const { storageId } = (await uploadResponse.json()) as {
          storageId: string;
        };

        return {
          storageId,
          filename,
          size: blob.size,
          mimeType,
        };
      } catch (err) {
        console.error('File upload error:', err);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [generateUploadUrl]
  );

  return { uploadFile, isUploading };
}

export function useAttachments() {
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const { uploadFile, isUploading: isUploadingFile } = useFileUpload();
  const nextIdRef = useRef(0);

  const isUploading =
    isUploadingFile || pendingUploads.some(u => u.status === 'uploading');
  const hasPendingFiles = pendingUploads.length > 0;
  const canAddMore = pendingUploads.length < MAX_ATTACHMENTS;

  const addFile = useCallback(
    (
      uri: string,
      filename: string,
      mimeType: string,
      width?: number,
      height?: number
    ) => {
      if (pendingUploads.length >= MAX_ATTACHMENTS) return;

      const id = `upload-${nextIdRef.current++}`;
      setPendingUploads(prev => [
        ...prev,
        {
          id,
          uri,
          filename,
          mimeType,
          size: 0,
          width,
          height,
          status: 'pending',
        },
      ]);
      return id;
    },
    [pendingUploads.length]
  );

  const removeFile = useCallback((id: string) => {
    setPendingUploads(prev => prev.filter(u => u.id !== id));
  }, []);

  const uploadAll = useCallback(async (): Promise<UploadResult[]> => {
    const results: UploadResult[] = [];

    for (const upload of pendingUploads) {
      if (upload.status === 'complete' && upload.result) {
        results.push(upload.result);
        continue;
      }

      setPendingUploads(prev =>
        prev.map(u =>
          u.id === upload.id ? { ...u, status: 'uploading' as const } : u
        )
      );

      const result = await uploadFile(
        upload.uri,
        upload.filename,
        upload.mimeType
      );

      if (result) {
        const uploadResult: UploadResult = {
          ...result,
          width: upload.width,
          height: upload.height,
        };
        results.push(uploadResult);
        setPendingUploads(prev =>
          prev.map(u =>
            u.id === upload.id
              ? { ...u, status: 'complete' as const, result: uploadResult }
              : u
          )
        );
      } else {
        setPendingUploads(prev =>
          prev.map(u =>
            u.id === upload.id
              ? { ...u, status: 'error' as const, error: 'Upload failed' }
              : u
          )
        );
      }
    }

    return results;
  }, [pendingUploads, uploadFile]);

  const clearAll = useCallback(() => {
    setPendingUploads([]);
  }, []);

  return {
    pendingUploads,
    isUploading,
    hasPendingFiles,
    canAddMore,
    addFile,
    removeFile,
    uploadAll,
    clearAll,
  };
}
