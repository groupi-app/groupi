import { CliError } from './errors.js';
import { readApi } from './transport.js';
import { mutateApi } from './mutations.js';
import { uploadFile, cleanupUploads } from './uploads.js';
/** @typedef {{name:string,apiUrl:string}} Profile */
/** @param {'avatar'|'cover'} purpose @param {string|undefined} eventId */
function pathFor(purpose, eventId) {
  if (purpose === 'avatar') return '/profile/avatar';
  if (!eventId || !/^[a-zA-Z0-9_-]+$/.test(eventId))
    throw new CliError('USAGE', 'Provide a valid event ID.', 2);
  return `/events/${eventId}/cover`;
}
/** @param {unknown} value */
function imageResult(value) {
  const row =
    /** @type {{storageId?:unknown,imageUrl?:unknown,focalPoint?:unknown}} */ (
      value
    );
  if (
    !row ||
    !(row.storageId === null || typeof row.storageId === 'string') ||
    !(row.imageUrl === null || typeof row.imageUrl === 'string') ||
    !('focalPoint' in row)
  )
    throw new CliError(
      'INVALID_RESPONSE',
      'Expected image metadata. Inspect the current image before another write.',
      5
    );
  return {
    storageId: row.storageId,
    imageUrl: row.imageUrl,
    focalPoint: row.focalPoint,
  };
}
/** @param {Profile} profile @param {string} key */
async function support(profile, key) {
  const health =
    /** @type {{capabilities?:{imageWrites?:{version?:number}}}} */ (
      await readApi(profile, key, '/health')
    );
  if (health?.capabilities?.imageWrites?.version !== 1)
    throw new CliError(
      'UNSUPPORTED_SERVER',
      'Update this server to support cover and avatar image writes.',
      5
    );
}
/** @param {Profile} profile @param {string} key @param {'avatar'|'cover'} purpose @param {string} [eventId] */
export async function getImage(profile, key, purpose, eventId) {
  return imageResult(await readApi(profile, key, pathFor(purpose, eventId)));
}
/** @param {Profile} profile @param {string} key @param {'avatar'|'cover'} purpose @param {{eventId?:string,file?:string,remove?:boolean,yes?:boolean,json?:boolean,focalX?:string,focalY?:string}} options */
export async function changeImage(profile, key, purpose, options) {
  const path = pathFor(purpose, options.eventId);
  let focalPoint;
  if (options.focalX !== undefined || options.focalY !== undefined) {
    const x = Number(options.focalX),
      y = Number(options.focalY);
    if (
      purpose !== 'cover' ||
      options.focalX === undefined ||
      options.focalY === undefined ||
      options.focalX.trim() === '' ||
      options.focalY.trim() === '' ||
      !Number.isFinite(x) ||
      !Number.isFinite(y) ||
      x < 0 ||
      x > 1 ||
      y < 0 ||
      y > 1
    )
      throw new CliError(
        'USAGE',
        'Supply both --focal-x and --focal-y between 0 and 1.',
        2
      );
    focalPoint = { x, y };
  }
  await support(profile, key);
  const inspect = `${purpose === 'avatar' ? 'account avatar get' : `events cover get ${options.eventId}`} --profile ${profile.name}`;
  const recovery = `Inspect ${inspect} before repeating this operation; image writes are not retried.`;
  let storageId;
  try {
    if (!options.remove) {
      if (!options.file)
        throw new CliError(
          'USAGE',
          'Supply --file <path> to a local image (JPEG, PNG, GIF, WebP, or SVG; at most 10 MiB).',
          2
        );
      const uploaded = await uploadFile(profile, key, options.file, purpose);
      storageId = uploaded.storageId;
    }
    const value = await mutateApi(profile, key, path, {
      method: options.remove ? 'DELETE' : 'PUT',
      body: options.remove
        ? {}
        : { storageId, ...(focalPoint ? { focalPoint } : {}) },
      recovery,
      validationGuidance:
        'Use a valid image at most 10 MiB and cover focal coordinates between 0 and 1. Existing images are preserved when validation fails.',
      ...(options.remove
        ? {
            confirmation: {
              target: `remove ${purpose}${options.eventId ? ` for event ${options.eventId}` : ''} on profile ${profile.name}`,
              yes: options.yes,
              json: options.json,
            },
          }
        : {}),
    });
    try {
      return imageResult(value);
    } catch {
      throw new CliError(
        'UNCERTAIN_OUTCOME',
        `The image response was incomplete. ${recovery}`,
        5
      );
    }
  } catch (error) {
    // The server discards only owned, unclaimed objects. It refuses cleanup of
    // a successful claim, including after a lost PUT response.
    if (storageId) {
      try {
        await cleanupUploads(profile, key, [storageId]);
      } catch {
        /* Server expiry removes an unclaimed orphan; preserve the original outcome. */
      }
    }
    throw error;
  }
}
