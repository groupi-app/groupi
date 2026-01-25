/**
 * Tests for post validation schema
 */

import { describe, it, expect } from 'vitest';
import { postPatchSchema } from './post';

describe('postPatchSchema', () => {
  describe('valid inputs', () => {
    it('should accept valid post data', () => {
      const result = postPatchSchema.safeParse({
        title: 'My Post Title',
        content: '<p>Some content</p>',
        authorId: 'author-123',
      });

      expect(result.success).toBe(true);
    });

    it('should accept empty title', () => {
      const result = postPatchSchema.safeParse({
        title: '',
        content: '<p>Content</p>',
        authorId: 'author-123',
      });

      expect(result.success).toBe(true);
    });

    it('should accept empty content', () => {
      const result = postPatchSchema.safeParse({
        title: 'Title',
        content: '',
        authorId: 'author-123',
      });

      expect(result.success).toBe(true);
    });

    it('should accept max length title (128 characters)', () => {
      const result = postPatchSchema.safeParse({
        title: 'a'.repeat(128),
        content: 'Content',
        authorId: 'author-123',
      });

      expect(result.success).toBe(true);
    });

    it('should accept HTML content', () => {
      const result = postPatchSchema.safeParse({
        title: 'Post',
        content:
          '<h1>Heading</h1><p>Paragraph with <strong>bold</strong> text.</p>',
        authorId: 'author-123',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('invalid inputs', () => {
    it('should reject title exceeding 128 characters', () => {
      const result = postPatchSchema.safeParse({
        title: 'a'.repeat(129),
        content: 'Content',
        authorId: 'author-123',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('title');
      }
    });

    it('should reject missing title', () => {
      const result = postPatchSchema.safeParse({
        content: 'Content',
        authorId: 'author-123',
      });

      expect(result.success).toBe(false);
    });

    it('should reject missing content', () => {
      const result = postPatchSchema.safeParse({
        title: 'Title',
        authorId: 'author-123',
      });

      expect(result.success).toBe(false);
    });

    it('should reject missing authorId', () => {
      const result = postPatchSchema.safeParse({
        title: 'Title',
        content: 'Content',
      });

      expect(result.success).toBe(false);
    });

    it('should reject non-string title', () => {
      const result = postPatchSchema.safeParse({
        title: 123,
        content: 'Content',
        authorId: 'author-123',
      });

      expect(result.success).toBe(false);
    });

    it('should reject non-string content', () => {
      const result = postPatchSchema.safeParse({
        title: 'Title',
        content: { html: 'content' },
        authorId: 'author-123',
      });

      expect(result.success).toBe(false);
    });

    it('should reject non-string authorId', () => {
      const result = postPatchSchema.safeParse({
        title: 'Title',
        content: 'Content',
        authorId: 12345,
      });

      expect(result.success).toBe(false);
    });
  });

  describe('type inference', () => {
    it('should correctly parse and return typed data', () => {
      const result = postPatchSchema.parse({
        title: 'My Post',
        content: '<p>Content</p>',
        authorId: 'author-123',
      });

      expect(result.title).toBe('My Post');
      expect(result.content).toBe('<p>Content</p>');
      expect(result.authorId).toBe('author-123');
    });
  });
});
