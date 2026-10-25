import { ConvexError } from 'convex/values';

// Both app image workflows use the 10 MiB image uploader. Avatar cropping is
// browser presentation, not a storage constraint. These rules exclude the
// document/video/audio formats accepted by discussion attachments.
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const COVER_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];
export function validateImageMetadata(
  purpose: 'avatar' | 'cover',
  mimeType: string,
  size: number
) {
  if (!Number.isInteger(size) || size <= 0 || size > MAX_IMAGE_BYTES)
    throw new ConvexError({
      code: 'VALIDATION_ERROR',
      message: 'Images must be nonempty and at most 10 MiB.',
    });
  if (!COVER_TYPES.includes(mimeType))
    throw new ConvexError({
      code: 'VALIDATION_ERROR',
      message: `${purpose === 'avatar' ? 'Avatars' : 'Covers'} require JPEG, PNG, GIF, WebP, or SVG images.`,
    });
}
/** Read JPEG frame dimensions without decoding untrusted image data. */
export function jpegDimensions(
  bytes: Uint8Array
): { width: number; height: number } | null {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 3 < bytes.length) {
    if (bytes[offset++] !== 0xff) return null;
    while (bytes[offset] === 0xff) offset++;
    const marker = bytes[offset++];
    if (marker === 0xd9 || marker === 0xda) return null;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    const length = (bytes[offset] << 8) | bytes[offset + 1];
    if (length < 2 || offset + length > bytes.length) return null;
    if (
      [
        0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce,
        0xcf,
      ].includes(marker)
    ) {
      if (length < 8) return null;
      return {
        height: (bytes[offset + 3] << 8) | bytes[offset + 4],
        width: (bytes[offset + 5] << 8) | bytes[offset + 6],
      };
    }
    offset += length;
  }
  return null;
}
/** Validate bounded RIFF image chunks, including images inside animation frames.
 * Container contract: https://developers.google.com/speed/webp/docs/riff_container
 */
function hasWebPFrame(
  bytes: Uint8Array,
  start: number,
  end: number,
  nested = false
): boolean {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const text = new TextDecoder();
  let hasFrame = false;
  let offset = start;
  while (offset + 8 <= end) {
    const type = text.decode(bytes.slice(offset, offset + 4));
    const length = view.getUint32(offset + 4, true);
    const payload = offset + 8;
    const next = payload + length + (length % 2);
    if (next > end || (length % 2 && bytes[next - 1] !== 0)) return false;
    if (type === 'VP8 ') {
      // A WebP lossy image is a key frame with the VP8 start code and dimensions.
      if (
        length < 11 ||
        (bytes[payload] & 1) !== 0 ||
        bytes[payload + 3] !== 0x9d ||
        bytes[payload + 4] !== 0x01 ||
        bytes[payload + 5] !== 0x2a ||
        (view.getUint16(payload + 6, true) & 0x3fff) === 0 ||
        (view.getUint16(payload + 8, true) & 0x3fff) === 0
      )
        return false;
      hasFrame = true;
    } else if (type === 'VP8L') {
      // Signature, packed dimensions/version, and at least one bitstream byte.
      if (
        length < 6 ||
        bytes[payload] !== 0x2f ||
        view.getUint32(payload + 1, true) >>> 29 !== 0
      )
        return false;
      hasFrame = true;
    } else if (type === 'VP8X') {
      if (nested || length !== 10) return false;
    } else if (type === 'ANMF') {
      if (
        nested ||
        length < 24 ||
        !hasWebPFrame(bytes, payload + 16, payload + length, true)
      )
        return false;
      hasFrame = true;
    } else if (type === 'ANIM' && (nested || length !== 6)) return false;
    offset = next;
  }
  return offset === end && hasFrame;
}
export function validateImageBytes(
  purpose: 'avatar' | 'cover',
  mimeType: string,
  bytes: Uint8Array
) {
  validateImageMetadata(purpose, mimeType, bytes.length);
  const invalid = () => {
    throw new ConvexError({
      code: 'VALIDATION_ERROR',
      message: 'Image bytes do not match the declared format.',
    });
  };
  if (mimeType === 'image/jpeg') {
    const size = jpegDimensions(bytes);
    if (
      !size ||
      !size.width ||
      !size.height ||
      bytes[bytes.length - 2] !== 0xff ||
      bytes[bytes.length - 1] !== 0xd9
    )
      invalid();
  } else if (mimeType === 'image/png') {
    if (
      ![137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v) ||
      bytes.length < 45 ||
      new TextDecoder().decode(bytes.slice(12, 16)) !== 'IHDR' ||
      new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(
        16
      ) === 0 ||
      new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(
        20
      ) === 0 ||
      new TextDecoder().decode(bytes.slice(-8, -4)) !== 'IEND'
    )
      invalid();
  } else if (mimeType === 'image/gif') {
    if (
      !['GIF87a', 'GIF89a'].includes(
        new TextDecoder().decode(bytes.slice(0, 6))
      ) ||
      bytes.length < 14 ||
      bytes[bytes.length - 1] !== 0x3b ||
      (bytes[6] === 0 && bytes[7] === 0) ||
      (bytes[8] === 0 && bytes[9] === 0)
    )
      invalid();
  } else if (mimeType === 'image/webp') {
    const text = new TextDecoder().decode(bytes.slice(0, 12));
    if (
      !text.startsWith('RIFF') ||
      text.slice(8) !== 'WEBP' ||
      bytes.length < 20 ||
      new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(
        4,
        true
      ) +
        8 !==
        bytes.length ||
      !hasWebPFrame(bytes, 12, bytes.length)
    )
      invalid();
  } else {
    const svg = new TextDecoder().decode(bytes);
    // SVGs are displayed as images, but reject executable/external content too.
    if (
      !/<svg[\s/>]/i.test(svg) ||
      (!/<\/svg\s*>/i.test(svg) && !/<svg\b[^>]*\/\s*>/i.test(svg)) ||
      /<!DOCTYPE|<!ENTITY|<\s*(script|foreignObject)\b|\bon\w+\s*=|(?:href|src)\s*=\s*["'](?!#)|url\s*\(\s*(?!#)/i.test(
        svg
      )
    )
      invalid();
  }
}
