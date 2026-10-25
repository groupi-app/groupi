// @vitest-environment jsdom
import { test, expect } from 'vitest';
import { BlockNoteEditor } from '@blocknote/core';
import { safeDiscussionContent } from '../../shared/src/utils/discussion-content';
test('current BlockNote formatted/table/checklist output survives server content normalization', async () => {
  const editor = BlockNoteEditor.create();
  const html = await editor.blocksToHTMLLossy([
    {
      type: 'paragraph',
      props: {
        textAlignment: 'center',
        textColor: 'red',
        backgroundColor: 'yellow',
      },
      content: [
        {
          type: 'text',
          text: 'Formatted',
          styles: { bold: true, italic: true, underline: true, strike: true },
        },
      ],
    },
    {
      type: 'checkListItem',
      props: { checked: true },
      content: 'Checked task',
    },
    {
      type: 'table',
      content: {
        type: 'tableContent',
        rows: [{ cells: [[{ type: 'text', text: 'cell', styles: {} }]] }],
      },
    },
  ]);
  const normalized = safeDiscussionContent(html);
  expect(normalized.text).toContain('Formatted');
  expect(normalized.text).toContain('cell');
  expect(normalized.html).toContain('<table');
  expect(normalized.html).toContain('checkbox');
  expect(normalized.html).toContain('text-align: center');
});
