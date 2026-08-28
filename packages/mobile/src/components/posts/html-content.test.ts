import { describe, expect, it } from 'vitest';

import { htmlToPlainText, parseHtml } from './html-content';

describe('parseHtml', () => {
  it('preserves ordered list numbering from web-authored content', () => {
    expect(parseHtml('<ol><li>First</li><li>Second</li></ol>')).toEqual([
      {
        type: 'list-item',
        segments: [{ text: 'First' }],
        ordered: true,
        listIndex: 1,
      },
      {
        type: 'list-item',
        segments: [{ text: 'Second' }],
        ordered: true,
        listIndex: 2,
      },
    ]);
  });

  it('keeps unordered lists as bullets', () => {
    expect(parseHtml('<ul><li>One</li><li>Two</li></ul>')).toEqual([
      {
        type: 'list-item',
        segments: [{ text: 'One' }],
        ordered: false,
        listIndex: 1,
      },
      {
        type: 'list-item',
        segments: [{ text: 'Two' }],
        ordered: false,
        listIndex: 2,
      },
    ]);
  });

  it('renders web-authored reply paragraphs without exposing HTML markup', () => {
    expect(parseHtml('<p>h</p>')).toEqual([
      {
        type: 'paragraph',
        segments: [{ text: 'h' }],
        level: undefined,
      },
    ]);
  });

  it('converts rich replies to readable text for the native reply editor', () => {
    expect(
      htmlToPlainText(
        '<p>Hello <strong>there</strong></p><ul><li>First</li><li>Second</li></ul>'
      )
    ).toBe('Hello there\n• First\n• Second');
  });
});
