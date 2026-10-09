import { readFile, stat } from 'node:fs/promises';
import { basename, extname } from 'node:path';
import { CliError } from './errors.js';
import { mutateApi } from './mutations.js';
/** @typedef {{apiUrl:string,name:string}} Profile */
const types = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain',
  '.csv': 'text/csv',
  '.zip': 'application/zip',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.doc': 'application/msword',
  '.docx':
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx':
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.rar': 'application/x-rar-compressed',
};
/** @param {Profile} profile @param {string} key @param {string} path @param {'attachment'|'avatar'|'cover'} [purpose] */
export async function uploadFile(profile, key, path, purpose = 'attachment') {
  const mimeType =
    types[/** @type {keyof typeof types} */ (extname(path).toLowerCase())];
  if (!mimeType)
    throw new CliError('USAGE', 'Unsupported local file extension.', 2);
  let bytes;
  try {
    const info = await stat(path);
    if (!info.isFile() || info.size < 1 || info.size > 10 * 1024 * 1024)
      throw Error();
    bytes = await readFile(path);
  } catch {
    throw new CliError(
      'USAGE',
      'Provide a readable regular file between 1 byte and 10 MiB.',
      2
    );
  }
  let response;
  try {
    response = await fetch(`${profile.apiUrl}/uploads?purpose=${purpose}`, {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'Content-Type': mimeType,
        'X-Filename': encodeURIComponent(basename(path)),
      },
      body: bytes,
      redirect: 'manual',
      signal: AbortSignal.timeout(30000),
    });
  } catch {
    throw new CliError(
      'UNCERTAIN_OUTCOME',
      'Upload response was lost. No parent write was sent; abandoned uploads expire after 24 hours. Retry uploading deliberately.',
      5
    );
  }
  if (!response.ok) {
    await response.body?.cancel();
    if (response.status === 401)
      throw new CliError(
        'AUTH_REQUIRED',
        'The key is invalid, expired, disabled, or revoked. Explicitly sign in again for this profile.',
        3
      );
    if (response.status === 403)
      throw new CliError(
        'FORBIDDEN',
        'This identity or key cannot upload files.',
        3
      );
    if (response.status === 404)
      throw new CliError(
        'NOT_FOUND',
        'The upload endpoint was not found. Update the selected server.',
        4
      );
    if (response.status === 429)
      throw new CliError(
        'RATE_LIMITED',
        'Upload rate limit reached. Wait before deliberately trying again.',
        5
      );
    if (
      response.status >= 500 ||
      (response.status >= 300 && response.status < 400)
    )
      throw new CliError(
        'UNCERTAIN_OUTCOME',
        'Upload outcome is unknown; no parent write was sent. No redirect/retry was attempted. Unclaimed uploads expire after 24 hours.',
        5
      );
    throw new CliError(
      'UPLOAD_REJECTED',
      'Upload rejected. No parent write was sent; check file type, size and selected identity.',
      2
    );
  }
  try {
    const data = await response.json();
    if (
      typeof data.storageId !== 'string' ||
      data.size !== bytes.length ||
      data.mimeType !== mimeType
    )
      throw Error();
    return {
      storageId: data.storageId,
      filename: basename(path),
      mimeType,
      size: bytes.length,
    };
  } catch {
    throw new CliError(
      'UNCERTAIN_OUTCOME',
      'Upload returned incomplete metadata. No parent write was sent; abandoned uploads expire after 24 hours.',
      5
    );
  }
}
/** @param {Profile} profile @param {string} key @param {string[]} storageIds */
export async function cleanupUploads(profile, key, storageIds) {
  for (const id of storageIds)
    try {
      await mutateApi(profile, key, `/uploads/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        body: {},
        recovery: 'Unclaimed uploads automatically expire after 24 hours.',
      });
    } catch {
      /* Claimed uploads are never deleted. Expiry handles offline cleanup. */
    }
}
