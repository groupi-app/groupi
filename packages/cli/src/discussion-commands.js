import { getProfile, credential } from './profiles.js';
import {
  getDiscussion,
  listDiscussion,
  writeDiscussion,
  writeDiscussionWithFiles,
} from './discussion.js';
import { readContent, readableContent } from './content-input.js';
import { CliError } from './errors.js';
/** @param {import('commander').Command} program @param {boolean} json */
export function registerDiscussionCommands(program, json) {
  async function connection() {
    const options = program.opts();
    const profile = await getProfile(options.profile);
    return { profile, key: await credential(profile, !!options.apiKeyStdin) };
  }
  /** @param {unknown} value */
  function output(value) {
    process.stdout.write(
      json
        ? JSON.stringify(value) + '\n'
        : readableContent(JSON.stringify(value, null, 2)) + '\n'
    );
  }
  for (const kind of /** @type {const} */ (['posts', 'replies'])) {
    const group = program
      .command(kind)
      .description(
        'Read/write safe discussion content; use explicit HTML files to preserve rich formatting on edits'
      );
    group
      .command('list <parent-id>')
      .option('--limit <n>', 'Page size, 1–100', '20')
      .option('--cursor <cursor>')
      .option('--all', 'Explicitly retrieve all pages')
      .action(async (parentId, input) => {
        const { profile, key } = await connection();
        output(
          await listDiscussion(profile, key, kind, parentId, {
            limit: Number(input.limit),
            cursor: input.cursor,
            all: input.all,
          })
        );
      });
    group
      .command('get <id>')
      .description(
        'Read full original HTML and attachment metadata; JSON preserves formatting for editing'
      )
      .action(async id => {
        const { profile, key } = await connection();
        output(await getDiscussion(profile, key, kind, id));
      });
    for (const operation of /** @type {const} */ (['create', 'edit'])) {
      let cmd = group
        .command(`${operation} <id>`)
        .description(
          operation === 'create'
            ? 'Create atomically in the event/post ID'
            : 'Edit only supplied fields; omitted rich content is preserved'
        )
        .option('--content <text>')
        .option('--file <path>', 'Read UTF-8 content file')
        .option('--stdin', 'Read UTF-8 content from stdin')
        .option(
          '--content-format <format>',
          'text, markdown, or explicit html',
          'text'
        )
        .option(
          '--attach <path...>',
          'Upload local files before atomic publication'
        )
        .option(
          '--remove-attachment <id...>',
          'Remove attachment IDs while editing'
        )
        .option('--yes', 'Confirm attachment removal');
      if (kind === 'posts') cmd = cmd.option('--title <text>');
      cmd.action(async (id, input) => {
        if (operation === 'create' && kind === 'posts' && !input.title)
          throw new CliError('USAGE', 'Post creation requires --title.', 2);
        if (operation === 'create' && input.removeAttachment)
          throw new CliError('USAGE', 'Attachment removal requires edit.', 2);
        const content = await readContent(input, !!program.opts().apiKeyStdin);
        if (
          operation === 'create' &&
          content === undefined &&
          !input.attach?.length
        )
          throw new CliError(
            'USAGE',
            'Provide --content, --file, --stdin, or --attach.',
            2
          );
        if (
          operation === 'edit' &&
          content === undefined &&
          input.title === undefined &&
          !input.attach?.length &&
          !input.removeAttachment?.length
        )
          throw new CliError(
            'USAGE',
            'Provide a field or attachment change.',
            2
          );
        const files = /** @type {string[]} */ (input.attach ?? []);
        if (files.length > 10 || new Set(files).size !== files.length)
          throw new CliError(
            'USAGE',
            'Use at most 10 distinct attachment files.',
            2
          );
        const { profile, key } = await connection();
        const body = {
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(content !== undefined
            ? { [kind === 'posts' ? 'content' : 'text']: content }
            : {}),
          ...(input.removeAttachment
            ? { attachmentIdsToDelete: input.removeAttachment }
            : {}),
        };
        output(
          await writeDiscussionWithFiles(
            profile,
            key,
            kind,
            operation,
            id,
            body,
            files,
            { yes: input.yes, json }
          )
        );
      });
    }
    group
      .command('delete <id>')
      .option('--yes', 'Confirm deletion')
      .action(async (id, input) => {
        const { profile, key } = await connection();
        output(
          await writeDiscussion(
            profile,
            key,
            kind,
            'delete',
            id,
            {},
            { yes: input.yes, json }
          )
        );
      });
    const attachments = group
      .command('attachments')
      .description(
        'Inspect/remove attachment metadata on accessible parent content'
      );
    attachments.command('list <id>').action(async id => {
      const { profile, key } = await connection();
      const result = /** @type {{attachments?:unknown[]}} */ (
        await getDiscussion(profile, key, kind, id)
      );
      output({ items: result.attachments ?? [], nextCursor: null });
    });
    attachments
      .command('remove <id> <attachment-id>')
      .option('--yes', 'Confirm removal')
      .action(async (id, attachmentId, input) => {
        const { profile, key } = await connection();
        output(
          await writeDiscussion(
            profile,
            key,
            kind,
            'edit',
            id,
            { attachmentIdsToDelete: [attachmentId] },
            { yes: input.yes, json }
          )
        );
      });
  }
}
