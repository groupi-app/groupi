'use client';

import { useMutation } from 'convex/react';
import { useState, useCallback } from 'react';
import { Id } from '@/convex/_generated/dataModel';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let fileMutations: any;

function initApi() {
  if (!fileMutations) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { api } = require('@/convex/_generated/api');
    fileMutations = api.files?.mutations ?? {};
  }
}
initApi();

// File limits (matching Convex mutations)
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_ATTACHMENTS = 10;

// Allowed MIME types
export const ALLOWED_MIME_TYPES = {
  IMAGE: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ],
  VIDEO: ['video/mp4', 'video/webm', 'video/quicktime'],
  AUDIO: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm'],
  FILE: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'application/zip',
    'application/x-rar-compressed',
  ],
};

const ALL_ALLOWED_TYPES = Object.values(ALLOWED_MIME_TYPES).flat();

export interface UploadResult {
  storageId: Id<'_storage'>;
  filename: string;
  size: number;
  mimeType: string;
  width?: number;
  height?: number;
  isSpoiler?: boolean;
  altText?: string;
  /** Preview URL (blob URL) for optimistic rendering before real URL is available */
  previewUrl?: string;
}

export interface PendingUpload {
  id: string;
  file: File;
  preview?: string; // Data URL for image preview
  width?: number;
  height?: number;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  error?: string;
  result?: UploadResult;
  // User-editable metadata (Discord-style)
  displayFilename: string; // Editable filename (defaults to file.name)
  altText?: string; // Alt text / description for accessibility
  isSpoiler: boolean; // Mark as spoiler (blur until clicked)
}

/**
 * Validate a file before upload
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File "${file.name}" is too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`,
    };
  }

  if (!ALL_ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `File type "${file.type}" is not allowed for "${file.name}".`,
    };
  }

  return { valid: true };
}

/**
 * Get image dimensions from a File
 */
function getImageDimensions(
  file: File
): Promise<{ width: number; height: number } | null> {
  return new Promise(resolve => {
    if (!file.type.startsWith('image/')) {
      resolve(null);
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };

    img.src = url;
  });
}

/**
 * Create a preview URL for an image file (data URL)
 */
function createImagePreview(file: File): Promise<string | undefined> {
  return new Promise(resolve => {
    if (!file.type.startsWith('image/')) {
      resolve(undefined);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => resolve(undefined);
    reader.readAsDataURL(file);
  });
}

/**
 * Create a blob URL for video/audio files for immediate playback preview
 */
function createMediaPreview(file: File): string | undefined {
  if (!file.type.startsWith('video/') && !file.type.startsWith('audio/')) {
    return undefined;
  }
  return URL.createObjectURL(file);
}

/**
 * Hook for uploading files to Convex storage
 *
 * Usage:
 * ```tsx
 * const { uploadFile, isUploading } = useFileUpload();
 *
 * const handleUpload = async (file: File) => {
 *   const result = await uploadFile(file);
 *   if (result) {
 *     console.log('Uploaded:', result.storageId);
 *   }
 * };
 * ```
 */
export function useFileUpload() {
  const generateUploadUrl = useMutation(fileMutations.generateUploadUrl);
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = useCallback(
    async (file: File): Promise<UploadResult | null> => {
      // Validate file
      const validation = validateFile(file);
      if (!validation.valid) {
        console.error(validation.error);
        return null;
      }

      setIsUploading(true);

      try {
        // Get image dimensions if applicable
        const dimensions = await getImageDimensions(file);

        // Step 1: Get a presigned URL from Convex
        const uploadUrl = await generateUploadUrl();

        // Step 2: Upload the file directly to that URL
        const response = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'Content-Type': file.type,
          },
          body: file,
        });

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }

        // Step 3: Get the storage ID from the response
        const { storageId } = await response.json();

        return {
          storageId: storageId as Id<'_storage'>,
          filename: file.name,
          size: file.size,
          mimeType: file.type,
          width: dimensions?.width,
          height: dimensions?.height,
        };
      } catch (error) {
        console.error('File upload failed:', error);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [generateUploadUrl]
  );

  return {
    uploadFile,
    isUploading,
  };
}

/**
 * Hook for managing multiple pending file uploads with previews
 *
 * Usage:
 * ```tsx
 * const { pendingUploads, addFiles, removeFile, uploadAll, clearAll } = useAttachments();
 *
 * // Add files from input
 * const handleFileSelect = (e) => addFiles(Array.from(e.target.files));
 *
 * // Upload all pending files
 * const results = await uploadAll();
 * ```
 */
export function useAttachments() {
  const generateUploadUrl = useMutation(fileMutations.generateUploadUrl);
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  /**
   * Add files to pending uploads with validation and preview generation
   */
  const addFiles = useCallback(
    async (files: File[]): Promise<{ added: number; errors: string[] }> => {
      const errors: string[] = [];
      const newUploads: PendingUpload[] = [];

      // Check total count
      const totalAfterAdd = pendingUploads.length + files.length;
      if (totalAfterAdd > MAX_ATTACHMENTS) {
        errors.push(
          `Maximum ${MAX_ATTACHMENTS} files allowed. You can add ${MAX_ATTACHMENTS - pendingUploads.length} more.`
        );
        files = files.slice(0, MAX_ATTACHMENTS - pendingUploads.length);
      }

      for (const file of files) {
        const validation = validateFile(file);
        if (!validation.valid) {
          errors.push(validation.error!);
          continue;
        }

        const [imagePreview, dimensions] = await Promise.all([
          createImagePreview(file),
          getImageDimensions(file),
        ]);

        // Use image data URL preview for images, or blob URL for video/audio
        const preview = imagePreview ?? createMediaPreview(file);

        newUploads.push({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file,
          preview,
          width: dimensions?.width,
          height: dimensions?.height,
          status: 'pending',
          displayFilename: file.name,
          altText: undefined,
          isSpoiler: false,
        });
      }

      if (newUploads.length > 0) {
        setPendingUploads(prev => [...prev, ...newUploads]);
      }

      return { added: newUploads.length, errors };
    },
    [pendingUploads.length]
  );

  /**
   * Remove a pending upload by ID
   */
  const removeFile = useCallback((id: string) => {
    setPendingUploads(prev => {
      const upload = prev.find(u => u.id === id);
      // Revoke blob URL if it's a video/audio (starts with 'blob:')
      if (upload?.preview?.startsWith('blob:')) {
        URL.revokeObjectURL(upload.preview);
      }
      return prev.filter(u => u.id !== id);
    });
  }, []);

  /**
   * Update a pending upload's metadata (filename, alt text, spoiler)
   */
  const updateFile = useCallback(
    (
      id: string,
      updates: {
        displayFilename?: string;
        altText?: string;
        isSpoiler?: boolean;
      }
    ) => {
      setPendingUploads(prev =>
        prev.map(u => {
          if (u.id !== id) return u;
          return {
            ...u,
            ...(updates.displayFilename !== undefined && {
              displayFilename: updates.displayFilename,
            }),
            ...(updates.altText !== undefined && { altText: updates.altText }),
            ...(updates.isSpoiler !== undefined && {
              isSpoiler: updates.isSpoiler,
            }),
          };
        })
      );
    },
    []
  );

  /**
   * Toggle spoiler status for a pending upload
   */
  const toggleSpoiler = useCallback((id: string) => {
    setPendingUploads(prev =>
      prev.map(u => {
        if (u.id !== id) return u;
        return { ...u, isSpoiler: !u.isSpoiler };
      })
    );
  }, []);

  /**
   * Upload all pending files
   */
  const uploadAll = useCallback(async (): Promise<UploadResult[]> => {
    if (pendingUploads.length === 0) return [];

    setIsUploading(true);
    const results: UploadResult[] = [];

    try {
      for (const upload of pendingUploads) {
        if (upload.status !== 'pending') continue;

        // Update status to uploading
        setPendingUploads(prev =>
          prev.map(u =>
            u.id === upload.id ? { ...u, status: 'uploading' as const } : u
          )
        );

        try {
          const uploadUrl = await generateUploadUrl();

          const response = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
              'Content-Type': upload.file.type,
            },
            body: upload.file,
          });

          if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
          }

          const { storageId } = await response.json();

          const result: UploadResult = {
            storageId: storageId as Id<'_storage'>,
            filename: upload.displayFilename,
            size: upload.file.size,
            mimeType: upload.file.type,
            width: upload.width,
            height: upload.height,
            isSpoiler: upload.isSpoiler,
            altText: upload.altText,
            // Include preview URL for optimistic rendering
            previewUrl: upload.preview,
          };

          results.push(result);

          // Update status to complete
          setPendingUploads(prev =>
            prev.map(u =>
              u.id === upload.id
                ? { ...u, status: 'complete' as const, result }
                : u
            )
          );
        } catch (error) {
          // Update status to error
          setPendingUploads(prev =>
            prev.map(u =>
              u.id === upload.id
                ? {
                    ...u,
                    status: 'error' as const,
                    error:
                      error instanceof Error ? error.message : 'Upload failed',
                  }
                : u
            )
          );
        }
      }
    } finally {
      setIsUploading(false);
    }

    return results;
  }, [pendingUploads, generateUploadUrl]);

  /**
   * Clear all pending uploads
   */
  const clearAll = useCallback(() => {
    // Revoke all blob URLs to prevent memory leaks
    pendingUploads.forEach(upload => {
      if (upload.preview?.startsWith('blob:')) {
        URL.revokeObjectURL(upload.preview);
      }
    });
    setPendingUploads([]);
  }, [pendingUploads]);

  /**
   * Check if there are any pending (not yet uploaded) files
   */
  const hasPendingFiles = pendingUploads.some(u => u.status === 'pending');

  /**
   * Get the count of each file type
   */
  const fileCounts = {
    images: pendingUploads.filter(u => u.file.type.startsWith('image/')).length,
    videos: pendingUploads.filter(u => u.file.type.startsWith('video/')).length,
    audio: pendingUploads.filter(u => u.file.type.startsWith('audio/')).length,
    files: pendingUploads.filter(
      u =>
        !u.file.type.startsWith('image/') &&
        !u.file.type.startsWith('video/') &&
        !u.file.type.startsWith('audio/')
    ).length,
    total: pendingUploads.length,
  };

  return {
    pendingUploads,
    addFiles,
    removeFile,
    updateFile,
    toggleSpoiler,
    uploadAll,
    clearAll,
    isUploading,
    hasPendingFiles,
    fileCounts,
    canAddMore: pendingUploads.length < MAX_ATTACHMENTS,
    remainingSlots: MAX_ATTACHMENTS - pendingUploads.length,
  };
}

/**
 * Hook for deleting files from Convex storage
 */
export function useFileDelete() {
  const deleteFile = useMutation(fileMutations.deleteFile);

  const deleteStoredFile = useCallback(
    async (storageId: Id<'_storage'>) => {
      try {
        await deleteFile({ storageId });
        return true;
      } catch (error) {
        console.error('File deletion failed:', error);
        return false;
      }
    },
    [deleteFile]
  );

  return { deleteFile: deleteStoredFile };
}
