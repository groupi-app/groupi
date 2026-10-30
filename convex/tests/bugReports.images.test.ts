// @vitest-environment node
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { validateImages } from '../bugReports/images';

function image(
  bytes: Uint8Array,
  mimeType: 'image/png' | 'image/jpeg' | 'image/webp' = 'image/png'
) {
  return { bytes: Uint8Array.from(bytes).buffer, mimeType };
}

const createImage = () =>
  sharp({
    create: { width: 2, height: 3, channels: 3, background: '#ff0000' },
  });

describe('bug-report image sanitization', () => {
  it('applies EXIF orientation before stripping private metadata', async () => {
    const original = await createImage()
      .withMetadata({ orientation: 6 })
      .jpeg()
      .toBuffer();
    expect((await sharp(original).metadata()).orientation).toBe(6);
    const [attachment] = await validateImages([image(original, 'image/jpeg')]);
    const metadata = await sharp(attachment.bytes).metadata();
    expect(metadata).toMatchObject({ width: 3, height: 2, format: 'jpeg' });
    expect(metadata.orientation).toBeUndefined();
    expect(metadata.exif).toBeUndefined();
  });

  it('allows a report with no attachments', async () => {
    await expect(validateImages([])).resolves.toEqual([]);
  });

  it.each(['jpeg', 'webp'] as const)(
    'accepts a decoded still %s without copying private metadata',
    async format => {
      const original = await createImage()
        .withExif({ IFD0: { Artist: 'private-name' } })
        .toFormat(format)
        .toBuffer();
      const [attachment] = await validateImages([
        image(original, format === 'jpeg' ? 'image/jpeg' : 'image/webp'),
      ]);
      const metadata = await sharp(attachment.bytes).metadata();
      expect(metadata).toMatchObject({ format, width: 2, height: 3 });
      expect(metadata.exif).toBeUndefined();
    }
  );

  it('rejects decompression above 16 megapixels even with a small input', async () => {
    const original = await sharp({
      create: { width: 4001, height: 4000, channels: 3, background: '#fff' },
    })
      .png()
      .toBuffer();
    expect(original.length).toBeLessThan(2 * 1024 * 1024);
    await expect(validateImages([image(original)])).rejects.toThrow(
      'This image could not be safely decoded.'
    );
  });

  it('rejects empty images and unsupported formats without treating them as URLs', async () => {
    await expect(validateImages([image(new Uint8Array())])).rejects.toThrow(
      'Image type does not match its contents.'
    );
    await expect(
      validateImages([image(Buffer.from('<svg><text>private</text></svg>'))])
    ).rejects.toThrow('Image type does not match its contents.');
  });

  it('bounds total sanitized attachment bytes even when original compression is smaller', async () => {
    // Low-quality original JPEGs expand at the sanitizer's normal quality.
    let seed = 12345;
    const raw = Buffer.alloc(1600 * 1600 * 3);
    for (let i = 0; i < raw.length; i++) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      raw[i] = seed >>> 24;
    }
    const original = await sharp(raw, {
      raw: { width: 1600, height: 1600, channels: 3 },
    })
      .jpeg({ quality: 30 })
      .toBuffer();
    expect(original.length * 3).toBeLessThan(2 * 1024 * 1024);
    await expect(
      validateImages(
        Array.from({ length: 3 }, () => image(original, 'image/jpeg'))
      )
    ).rejects.toThrow('Sanitized images exceed 2 MiB. Choose smaller images.');
  }, 15000);
  it('rejects PNG animation declarations even when the decoder sees only the still frame', async () => {
    const original = await createImage().png().toBuffer();
    // acTL: one frame and infinite loops, valid CRC. Insert after IHDR.
    const animationControl = Buffer.from(
      '000000086163544c0000000100000000b42de9a0',
      'hex'
    );
    const animated = Buffer.concat([
      original.subarray(0, 33),
      animationControl,
      original.subarray(33),
    ]);
    await expect(validateImages([image(animated)])).rejects.toThrow(
      'Choose a still image, not an animation.'
    );
  });
  it('rejects animated WebP rather than silently attaching one frame', async () => {
    const original = await sharp({
      create: { width: 2, height: 4, channels: 3, background: '#f00' },
    })
      .raw()
      .toBuffer();
    original.fill(255, original.length / 2);
    const animated = await sharp(original, {
      raw: { width: 2, height: 4, channels: 3, pageHeight: 2 },
    })
      .webp({ loop: 0, delay: [100, 100] })
      .toBuffer();
    expect((await sharp(animated).metadata()).pages).toBe(2);
    await expect(
      validateImages([image(animated, 'image/webp')])
    ).rejects.toThrow('Choose a still image, not an animation.');
  });
  it('returns only a safe error for corrupt image data', async () => {
    const original = await createImage().png().toBuffer();
    await expect(
      validateImages([image(original.subarray(0, 40))])
    ).rejects.toThrow(
      'This image could not be safely decoded. Remove it or choose another image.'
    );
  });
  it('rejects oversized dimensions even when compressed bytes are small', async () => {
    const original = await sharp({
      create: { width: 8193, height: 1, channels: 3, background: '#fff' },
    })
      .png()
      .toBuffer();
    await expect(validateImages([image(original)])).rejects.toThrow(
      'Images must be at most 8192 pixels per side and 16 megapixels.'
    );
  });
  it('rejects a supported image whose signature disagrees with its declared MIME', async () => {
    const original = await createImage().jpeg().toBuffer();
    await expect(
      validateImages([image(original, 'image/png')])
    ).rejects.toThrow('Image type does not match its contents.');
  });
  it('bounds aggregate original bytes before trying to decode malformed input', async () => {
    await expect(
      validateImages([
        image(new Uint8Array(1024 * 1024)),
        image(new Uint8Array(1024 * 1024 + 1)),
      ])
    ).rejects.toThrow('Images must total at most 2 MiB.');
  });
  it('rejects more than three selected images before decoding', async () => {
    const original = await createImage().png().toBuffer();
    await expect(
      validateImages(Array.from({ length: 4 }, () => image(original)))
    ).rejects.toThrow('Choose at most three images.');
  });
  it('decodes a selected PNG and strips its private metadata before attachment', async () => {
    const original = await createImage()
      .withExif({ IFD0: { Artist: 'private-name' } })
      .png()
      .toBuffer();
    expect((await sharp(original).metadata()).exif).toBeDefined();
    const sanitized = await validateImages([image(original)]);
    expect(sanitized).toHaveLength(1);
    expect(sanitized[0]).toMatchObject({
      mimeType: 'image/png',
      filename: 'screenshot-1.png',
    });
    const metadata = await sharp(sanitized[0].bytes).metadata();
    expect(metadata).toMatchObject({ width: 2, height: 3, format: 'png' });
    expect(metadata.exif).toBeUndefined();
  });
});
