import { describe, expect, it } from 'vitest';

import {
  hasRichTextContent,
  htmlToPlainText,
  parseHtml,
  toRichTextHtml,
} from './html-content';

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

  it('converts rich replies to readable text for content checks', () => {
    expect(
      htmlToPlainText(
        '<p>Hello <strong>there</strong></p><ul><li>First</li><li>Second</li></ul>'
      )
    ).toBe('Hello there\n• First\n• Second');
  });

  it('recognizes empty editor HTML without rejecting non-Latin content', () => {
    expect(hasRichTextContent('<p></p>')).toBe(false);
    expect(hasRichTextContent('<p><br></p>')).toBe(false);
    expect(hasRichTextContent('<p>&nbsp;</p>')).toBe(false);
    expect(hasRichTextContent('<p>✨</p>')).toBe(true);
  });

  it('preserves rich HTML and migrates legacy plain-text replies', () => {
    expect(toRichTextHtml('<p><strong>Rich</strong></p>')).toBe(
      '<p><strong>Rich</strong></p>'
    );
    expect(toRichTextHtml('First\nSecond & third')).toBe(
      '<p>First</p><p>Second &amp; third</p>'
    );
    expect(toRichTextHtml('')).toBe('<p></p>');
  });
});
