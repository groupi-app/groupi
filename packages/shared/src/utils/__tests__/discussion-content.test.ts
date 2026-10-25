import { describe, it, expect } from 'vitest';
import {
  safeDiscussionContent,
  discussionLengthAllowed,
  titleLengthAllowed,
} from '../discussion-content';
describe('shared discussion validation', () => {
  it('counts rendered text and Unicode, not markup bytes', () => {
    expect(
      discussionLengthAllowed(`<strong>${'😀'.repeat(3000)}</strong>`, 3000)
    ).toBe(true);
    expect(discussionLengthAllowed('😀'.repeat(3001), 3000)).toBe(false);
    expect(safeDiscussionContent('<p>A &amp; B</p>').text).toBe('A & B');
  });
  it('retains unchanged oversized content and only permits shrinking edits', () => {
    const original = '<p>' + 'x'.repeat(4000) + '</p>';
    expect(discussionLengthAllowed(original, 3000, original)).toBe(true);
    expect(discussionLengthAllowed('x'.repeat(3999), 3000, original)).toBe(
      true
    );
    expect(discussionLengthAllowed('x'.repeat(4001), 3000, original)).toBe(
      false
    );
    expect(titleLengthAllowed('x'.repeat(101), 'x'.repeat(102))).toBe(true);
  });
  it('rejects unsafe attributes and protocols rather than losing content silently', () => {
    for (const html of [
      '<script>alert(1)</script>',
      '<p onclick="a()">hi</p>',
      '<svg><a onload="x()">x</a></svg>',
      '<a href="jav&#x61;script:alert(1)">x</a>',
      '<img src=x>',
    ])
      expect(() => safeDiscussionContent(html)).toThrow();
  });
  it('preserves supported rich structure and mention identity', () => {
    const input =
      '<blockquote><p><strong>Hello</strong> <span class="mention" data-id="person_1">@Alex</span></p></blockquote>';
    const result = safeDiscussionContent(input);
    expect(result.mentions).toEqual(['person_1']);
    expect(result.html).toContain('data-id="person_1"');
    expect(result.html).toContain('<strong>Hello</strong>');
  });
});
