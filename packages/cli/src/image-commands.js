import { getProfile, credential } from './profiles.js';
import { getImage, changeImage } from './images.js';
/** @param {import('commander').Command} program @param {import('commander').Command} parent @param {'avatar'|'cover'} purpose @param {boolean} json */
export function registerImageCommands(program, parent, purpose, json) {
  const command = parent
    .command(purpose)
    .description(
      `Inspect, replace, or remove ${purpose} images from local files`
    );
  async function connect() {
    const options = program.opts();
    const profile = await getProfile(options.profile);
    return { profile, key: await credential(profile, !!options.apiKeyStdin) };
  }
  /** @param {{storageId:unknown,imageUrl:unknown,focalPoint:unknown}} image */
  function print(image) {
    const safe = (/** @type {unknown} */ value) =>
      // eslint-disable-next-line no-control-regex -- Remote text cannot control the terminal.
      String(value ?? 'none').replace(/[\x00-\x1f\x7f-\x9f]/g, ' ');
    process.stdout.write(
      json
        ? JSON.stringify(image) + '\n'
        : `${purpose}: ${safe(image.imageUrl)}\nstorageId: ${safe(image.storageId)}\n${image.focalPoint ? `focalPoint: ${safe(JSON.stringify(image.focalPoint))}\n` : ''}`
    );
  }
  for (const action of ['get', 'set', 'remove']) {
    const child = command.command(
      `${action}${purpose === 'cover' ? ' <event-id>' : ''}`
    );
    if (action === 'set') {
      child.requiredOption(
        '--file <path>',
        'Local JPEG, PNG, GIF, WebP, or SVG image, at most 10 MiB'
      );
      if (purpose === 'cover')
        child
          .option('--focal-x <number>', 'Horizontal focal point (0–1)')
          .option('--focal-y <number>', 'Vertical focal point (0–1)');
    }
    if (action === 'remove')
      child.option('--yes', 'Confirm removing this image');
    child.action(async (...args) => {
      const eventId = purpose === 'cover' ? args[0] : undefined;
      const options = args[purpose === 'cover' ? 1 : 0];
      const { profile, key } = await connect();
      print(
        action === 'get'
          ? await getImage(profile, key, purpose, eventId)
          : await changeImage(profile, key, purpose, {
              ...options,
              eventId,
              remove: action === 'remove',
              json,
            })
      );
    });
  }
}
