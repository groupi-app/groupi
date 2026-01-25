/**
 * Tests for URL utility functions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the env module before importing urls
vi.mock('@/env.mjs', () => ({
  env: {
    NEXT_PUBLIC_BASE_URL: 'https://groupi.app',
  },
}));

import {
  getBaseUrl,
  getInviteUrl,
  getEventUrl,
  getUserUrl,
  getAbsoluteUrl,
} from './urls';

describe('URL Utils', () => {
  describe('getBaseUrl', () => {
    it('should return the base URL from environment', () => {
      expect(getBaseUrl()).toBe('https://groupi.app');
    });
  });

  describe('getInviteUrl', () => {
    it('should generate invite URL with invite ID', () => {
      const url = getInviteUrl('invite123');
      expect(url).toBe('https://groupi.app/invite/invite123');
    });

    it('should handle special characters in invite ID', () => {
      const url = getInviteUrl('abc-123_xyz');
      expect(url).toBe('https://groupi.app/invite/abc-123_xyz');
    });
  });

  describe('getEventUrl', () => {
    it('should generate event URL with event ID', () => {
      const url = getEventUrl('event456');
      expect(url).toBe('https://groupi.app/event/event456');
    });
  });

  describe('getUserUrl', () => {
    it('should generate user URL with user ID', () => {
      const url = getUserUrl('user789');
      expect(url).toBe('https://groupi.app/user/user789');
    });
  });

  describe('getAbsoluteUrl', () => {
    it('should generate absolute URL from relative path', () => {
      const url = getAbsoluteUrl('/settings');
      expect(url).toBe('https://groupi.app/settings');
    });

    it('should handle paths without leading slash', () => {
      const url = getAbsoluteUrl('settings');
      expect(url).toBe('https://groupi.app/settings');
    });

    it('should handle nested paths', () => {
      const url = getAbsoluteUrl('/event/123/posts');
      expect(url).toBe('https://groupi.app/event/123/posts');
    });

    it('should handle root path', () => {
      const url = getAbsoluteUrl('/');
      expect(url).toBe('https://groupi.app/');
    });

    it('should handle empty path', () => {
      const url = getAbsoluteUrl('');
      expect(url).toBe('https://groupi.app/');
    });
  });
});

describe('URL Utils with fallback', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should use localhost as fallback when env is not set', async () => {
    // Re-mock with undefined base URL
    vi.doMock('@/env.mjs', () => ({
      env: {
        NEXT_PUBLIC_BASE_URL: undefined,
      },
    }));

    const { getBaseUrl: getBaseUrlFallback } = await import('./urls');
    expect(getBaseUrlFallback()).toBe('http://localhost:3000');
  });
});
