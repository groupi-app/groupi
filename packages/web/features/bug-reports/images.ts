import {
  BUG_REPORT_LIMITS,
  type bugReportSubmission,
} from '@groupi/shared/utils';
import type { Infer } from 'convex/values';

export async function readBugReportImages(
  files: File[],
  existingBytes: number,
  existingCount: number
) {
  if (
    files.length + existingCount > BUG_REPORT_LIMITS.imageCount ||
    existingBytes + files.reduce((sum, file) => sum + file.size, 0) >
      BUG_REPORT_LIMITS.imageBytes
  )
    throw new Error('Choose up to 3 images, totaling no more than 2 MiB.');
  return Promise.all(
    files.map(async file => {
      const mimeType = file.type;
      if (
        mimeType !== 'image/png' &&
        mimeType !== 'image/jpeg' &&
        mimeType !== 'image/webp'
      )
        throw new Error('Choose PNG, JPEG or WebP images.');
      const preview = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () =>
          typeof reader.result === 'string'
            ? resolve(reader.result)
            : reject(
                new Error('Image could not be read. Remove it or try again.')
              );
        reader.onerror = () =>
          reject(new Error('Image could not be read. Remove it or try again.'));
        reader.readAsDataURL(file);
      });
      const image: NonNullable<
        Infer<typeof bugReportSubmission>['images']
      >[number] = { base64: preview.slice(preview.indexOf(',') + 1), mimeType };
      return { image, preview, bytes: file.size };
    })
  );
}
