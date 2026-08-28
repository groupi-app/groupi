interface CreateAfterUploadingOptions<TUpload, TResult> {
  expectedUploadCount: number;
  uploadAll: () => Promise<TUpload[]>;
  create: (uploads: TUpload[]) => Promise<TResult>;
}

/**
 * Upload every selected file before invoking the single transactional parent
 * mutation. A partial batch never reaches `create`, so no empty parent can be
 * left behind and completed uploads can remain available for a retry.
 */
export async function createAfterUploading<TUpload, TResult>({
  expectedUploadCount,
  uploadAll,
  create,
}: CreateAfterUploadingOptions<TUpload, TResult>): Promise<TResult> {
  const uploads = expectedUploadCount > 0 ? await uploadAll() : [];
  if (uploads.length !== expectedUploadCount) {
    throw new Error(
      'Not all attachments could be uploaded. Check the failed files and try again.'
    );
  }
  return await create(uploads);
}
