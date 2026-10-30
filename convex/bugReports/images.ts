'use node';

import sharp from 'sharp';

const decodeFailure = () =>
  new Error(
    'This image could not be safely decoded. Remove it or choose another image.'
  );

export async function validateImages(
  images: Array<{
    bytes: ArrayBuffer;
    mimeType: 'image/png' | 'image/jpeg' | 'image/webp';
  }>
) {
  if (images.length > 3) throw new Error('Choose at most three images.');
  if (
    images.reduce((sum, image) => sum + image.bytes.byteLength, 0) >
    2 * 1024 * 1024
  )
    throw new Error('Images must total at most 2 MiB.');
  const attachments: Array<{
    bytes: Uint8Array;
    mimeType: string;
    filename: string;
  }> = [];
  let outputBytes = 0;
  for (const [index, image] of images.entries()) {
    const format =
      image.mimeType === 'image/jpeg'
        ? 'jpeg'
        : image.mimeType === 'image/webp'
          ? 'webp'
          : 'png';
    const input = Buffer.from(image.bytes);
    const signature = input
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      ? 'png'
      : input[0] === 255 && input[1] === 216 && input[2] === 255
        ? 'jpeg'
        : input.toString('ascii', 0, 4) === 'RIFF' &&
            input.toString('ascii', 8, 12) === 'WEBP'
          ? 'webp'
          : null;
    if (signature !== format)
      throw new Error('Image type does not match its contents.');
    if (format === 'png') {
      // libvips may expose only the default APNG frame. Inspect bounded chunks
      // instead of silently accepting an animation as a still screenshot.
      for (let offset = 8; offset + 12 <= input.length; ) {
        const length = input.readUInt32BE(offset);
        if (length > input.length - offset - 12) throw decodeFailure();
        if (input.toString('ascii', offset + 4, offset + 8) === 'acTL')
          throw new Error('Choose a still image, not an animation.');
        offset += length + 12;
      }
    }
    const decoder = sharp(input, {
      limitInputPixels: 16_000_000,
      failOn: 'warning',
    }).timeout({ seconds: 5 });
    const metadata = await decoder.metadata().catch(() => {
      throw decodeFailure();
    });
    if (
      !metadata.width ||
      !metadata.height ||
      metadata.width > 8192 ||
      metadata.height > 8192 ||
      metadata.width * metadata.height > 16_000_000
    )
      throw new Error(
        'Images must be at most 8192 pixels per side and 16 megapixels.'
      );
    if ((metadata.pages ?? 1) !== 1)
      throw new Error('Choose a still image, not an animation.');
    if (metadata.format !== format)
      throw new Error('Image type does not match its contents.');
    const bytes = await decoder
      .autoOrient()
      .toFormat(format)
      .toBuffer()
      .catch(() => {
        throw decodeFailure();
      });
    outputBytes += bytes.byteLength;
    if (outputBytes > 2 * 1024 * 1024)
      throw new Error('Sanitized images exceed 2 MiB. Choose smaller images.');
    attachments.push({
      bytes,
      mimeType: image.mimeType,
      filename: `screenshot-${index + 1}.${format}`,
    });
  }
  return attachments;
}
