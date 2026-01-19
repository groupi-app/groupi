"use client";

import { useMutation } from "convex/react";
import { useState, useCallback } from "react";
import { Id } from "@/convex/_generated/dataModel";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let fileMutations: any;

function initApi() {
  if (!fileMutations) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { api } = require("@/convex/_generated/api");
    fileMutations = api.files?.mutations ?? {};
  }
}
initApi();

export interface UploadResult {
  storageId: Id<"_storage">;
  url: string;
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
 *     console.log('Uploaded:', result.storageId, result.url);
 *   }
 * };
 * ```
 */
export function useFileUpload() {
  const generateUploadUrl = useMutation(fileMutations.generateUploadUrl);
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = useCallback(async (file: File): Promise<UploadResult | null> => {
    setIsUploading(true);

    try {
      // Step 1: Get a presigned URL from Convex
      const uploadUrl = await generateUploadUrl();

      // Step 2: Upload the file directly to that URL
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      // Step 3: Get the storage ID from the response
      const { storageId } = await response.json();

      // Step 4: The URL is available from storage
      // For now, return the storageId - the mutation will get the URL
      return {
        storageId: storageId as Id<"_storage">,
        url: "", // URL will be fetched by the mutation that saves the file
      };
    } catch (error) {
      console.error("File upload failed:", error);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [generateUploadUrl]);

  return {
    uploadFile,
    isUploading,
  };
}

/**
 * Hook for deleting files from Convex storage
 */
export function useFileDelete() {
  const deleteFile = useMutation(fileMutations.deleteFile);

  const deleteStoredFile = useCallback(async (storageId: Id<"_storage">) => {
    try {
      await deleteFile({ storageId });
      return true;
    } catch (error) {
      console.error("File deletion failed:", error);
      return false;
    }
  }, [deleteFile]);

  return { deleteFile: deleteStoredFile };
}
