/**
 * Comprehensive tests for platform adapter layer
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  setNavigationAdapter,
  getNavigationAdapter,
  navigation,
  useNavigation,
  setStorageAdapter,
  getStorageAdapter,
  storage,
  useStorage,
  setToastAdapter,
  getToastAdapter,
  toast,
  useToast,
} from '../index';
import { TestSetup, PlatformTestHelpers } from '../../test-helpers';

// Helper to cast mock adapters - test file uses mock functions that don't match exact types
const asMockNavAdapter = (adapter: ReturnType<typeof PlatformTestHelpers.createMockNavigationAdapter>) => adapter as any;
const asMockStorageAdapter = (adapter: ReturnType<typeof PlatformTestHelpers.createMockStorageAdapter>) => adapter as any;
const asMockToastAdapter = (adapter: ReturnType<typeof PlatformTestHelpers.createMockToastAdapter>) => adapter as any;

describe('Platform Adapters', () => {
  beforeEach(() => {
    TestSetup.beforeEach();
    // Reset all adapters to ensure clean test state
    setNavigationAdapter(null as any);
    setStorageAdapter(null as any);
    setToastAdapter(null as any);
  });

  afterEach(() => {
    TestSetup.afterEach();
  });

  describe('Navigation Adapter', () => {
    describe('setNavigationAdapter and getNavigationAdapter', () => {
      it('should set and retrieve navigation adapter', () => {
        const mockAdapter = PlatformTestHelpers.createMockNavigationAdapter();

        setNavigationAdapter(asMockNavAdapter(mockAdapter));
        const retrievedAdapter = getNavigationAdapter();

        expect(retrievedAdapter).toBe(mockAdapter);
      });

      it('should throw error when adapter not set', () => {
        // Clear any existing adapter
        setNavigationAdapter(null as any);

        expect(() => getNavigationAdapter()).toThrow(
          'Navigation adapter not set'
        );
      });
    });

    describe('navigation object', () => {
      let mockAdapter: ReturnType<
        typeof PlatformTestHelpers.createMockNavigationAdapter
      >;

      beforeEach(() => {
        mockAdapter = PlatformTestHelpers.createMockNavigationAdapter();
        setNavigationAdapter(asMockNavAdapter(mockAdapter));
      });

      it('should delegate push calls to adapter', () => {
        navigation.push('/events');
        expect(mockAdapter.push).toHaveBeenCalledWith('/events');
      });

      it('should delegate replace calls to adapter', () => {
        navigation.replace('/login');
        expect(mockAdapter.replace).toHaveBeenCalledWith('/login');
      });

      it('should delegate back calls to adapter', () => {
        navigation.back();
        expect(mockAdapter.back).toHaveBeenCalled();
      });

      it('should delegate canGoBack calls to adapter', () => {
        const result = navigation.canGoBack();
        expect(mockAdapter.canGoBack).toHaveBeenCalled();
        expect(result).toBe(true);
      });

      it('should throw when adapter not set', () => {
        setNavigationAdapter(null as any);

        expect(() => navigation.push('/test')).toThrow(
          'Navigation adapter not set'
        );
        expect(() => navigation.replace('/test')).toThrow(
          'Navigation adapter not set'
        );
        expect(() => navigation.back()).toThrow('Navigation adapter not set');
        expect(() => navigation.canGoBack()).toThrow(
          'Navigation adapter not set'
        );
      });
    });

    describe('useNavigation hook', () => {
      it('should return navigation object', () => {
        const mockAdapter = PlatformTestHelpers.createMockNavigationAdapter();
        setNavigationAdapter(asMockNavAdapter(mockAdapter));

        const result = useNavigation();
        expect(result).toBe(navigation);
      });

      it('should provide access to all navigation methods', () => {
        const mockAdapter = PlatformTestHelpers.createMockNavigationAdapter();
        setNavigationAdapter(asMockNavAdapter(mockAdapter));

        const nav = useNavigation();

        nav.push('/test');
        nav.replace('/test');
        nav.back();
        const canGoBack = nav.canGoBack();

        expect(mockAdapter.push).toHaveBeenCalledWith('/test');
        expect(mockAdapter.replace).toHaveBeenCalledWith('/test');
        expect(mockAdapter.back).toHaveBeenCalled();
        expect(mockAdapter.canGoBack).toHaveBeenCalled();
        expect(canGoBack).toBe(true);
      });
    });
  });

  describe('Storage Adapter', () => {
    describe('setStorageAdapter and getStorageAdapter', () => {
      it('should set and retrieve storage adapter', () => {
        const mockAdapter = PlatformTestHelpers.createMockStorageAdapter();

        setStorageAdapter(asMockStorageAdapter(mockAdapter));
        const retrievedAdapter = getStorageAdapter();

        expect(retrievedAdapter).toBe(mockAdapter);
      });

      it('should throw error when adapter not set', () => {
        setStorageAdapter(null as any);

        expect(() => getStorageAdapter()).toThrow('Storage adapter not set');
      });
    });

    describe('storage object', () => {
      let mockAdapter: ReturnType<
        typeof PlatformTestHelpers.createMockStorageAdapter
      >;

      beforeEach(() => {
        mockAdapter = PlatformTestHelpers.createMockStorageAdapter();
        setStorageAdapter(asMockStorageAdapter(mockAdapter));
      });

      describe('basic operations', () => {
        it('should delegate getItem calls to adapter', async () => {
          mockAdapter.getItem.mockResolvedValue('test-value');

          const result = await storage.getItem('test-key');

          expect(mockAdapter.getItem).toHaveBeenCalledWith('test-key');
          expect(result).toBe('test-value');
        });

        it('should delegate setItem calls to adapter', async () => {
          await storage.setItem('test-key', 'test-value');

          expect(mockAdapter.setItem).toHaveBeenCalledWith(
            'test-key',
            'test-value'
          );
        });

        it('should delegate removeItem calls to adapter', async () => {
          await storage.removeItem('test-key');

          expect(mockAdapter.removeItem).toHaveBeenCalledWith('test-key');
        });

        it('should delegate clear calls to adapter', async () => {
          await storage.clear();

          expect(mockAdapter.clear).toHaveBeenCalled();
        });
      });

      describe('JSON operations', () => {
        it('should serialize and store JSON data', async () => {
          const testData = { id: 123, name: 'Test' };

          await storage.setJSON('test-key', testData);

          expect(mockAdapter.setItem).toHaveBeenCalledWith(
            'test-key',
            JSON.stringify(testData)
          );
        });

        it('should retrieve and deserialize JSON data', async () => {
          const testData = { id: 123, name: 'Test' };
          mockAdapter.getItem.mockResolvedValue(JSON.stringify(testData));

          const result = await storage.getJSON('test-key');

          expect(mockAdapter.getItem).toHaveBeenCalledWith('test-key');
          expect(result).toEqual(testData);
        });

        it('should return null for missing JSON data', async () => {
          mockAdapter.getItem.mockResolvedValue(null);

          const result = await storage.getJSON('missing-key');

          expect(result).toBe(null);
        });

        it('should handle invalid JSON gracefully', async () => {
          mockAdapter.getItem.mockResolvedValue('invalid-json');

          const result = await storage.getJSON('invalid-key');

          expect(result).toBe(null);
        });
      });

      it('should throw when adapter not set', async () => {
        setStorageAdapter(null as any);

        await expect(storage.getItem('test')).rejects.toThrow(
          'Storage adapter not set'
        );
        await expect(storage.setItem('test', 'value')).rejects.toThrow(
          'Storage adapter not set'
        );
        await expect(storage.removeItem('test')).rejects.toThrow(
          'Storage adapter not set'
        );
        await expect(storage.clear()).rejects.toThrow(
          'Storage adapter not set'
        );
        await expect(storage.getJSON('test')).rejects.toThrow(
          'Storage adapter not set'
        );
        await expect(storage.setJSON('test', {})).rejects.toThrow(
          'Storage adapter not set'
        );
      });
    });

    describe('useStorage hook', () => {
      it('should return storage object', () => {
        const mockAdapter = PlatformTestHelpers.createMockStorageAdapter();
        setStorageAdapter(asMockStorageAdapter(mockAdapter));

        const result = useStorage();
        expect(result).toBe(storage);
      });

      it('should provide access to all storage methods', async () => {
        const mockAdapter = PlatformTestHelpers.createMockStorageAdapter();
        setStorageAdapter(asMockStorageAdapter(mockAdapter));

        const store = useStorage();

        await store.setItem('key', 'value');
        await store.getItem('key');
        await store.removeItem('key');
        await store.clear();
        await store.setJSON('json-key', { test: true });
        await store.getJSON('json-key');

        expect(mockAdapter.setItem).toHaveBeenCalled();
        expect(mockAdapter.getItem).toHaveBeenCalled();
        expect(mockAdapter.removeItem).toHaveBeenCalled();
        expect(mockAdapter.clear).toHaveBeenCalled();
      });
    });
  });

  describe('Toast Adapter', () => {
    describe('setToastAdapter and getToastAdapter', () => {
      it('should set and retrieve toast adapter', () => {
        const mockAdapter = PlatformTestHelpers.createMockToastAdapter();

        setToastAdapter(asMockToastAdapter(mockAdapter));
        const retrievedAdapter = getToastAdapter();

        expect(retrievedAdapter).toBe(mockAdapter);
      });

      it('should throw error when adapter not set', () => {
        setToastAdapter(null as any);

        expect(() => getToastAdapter()).toThrow('Toast adapter not set');
      });
    });

    describe('toast object', () => {
      let mockAdapter: ReturnType<
        typeof PlatformTestHelpers.createMockToastAdapter
      >;

      beforeEach(() => {
        mockAdapter = PlatformTestHelpers.createMockToastAdapter();
        setToastAdapter(asMockToastAdapter(mockAdapter));
      });

      it('should delegate show calls to adapter', () => {
        const options = {
          description: 'Test message',
          variant: 'default' as const,
          duration: 3000,
        };

        toast.show(options);

        expect(mockAdapter.show).toHaveBeenCalledWith(options);
      });

      it('should delegate success calls to adapter', () => {
        toast.success('Success message', 'Success Title');

        expect(mockAdapter.success).toHaveBeenCalledWith(
          'Success message',
          'Success Title'
        );
      });

      it('should delegate error calls to adapter', () => {
        toast.error('Error message', 'Error Title');

        expect(mockAdapter.error).toHaveBeenCalledWith(
          'Error message',
          'Error Title'
        );
      });

      it('should delegate info calls to adapter', () => {
        toast.info('Info message', 'Info Title');

        expect(mockAdapter.info).toHaveBeenCalledWith(
          'Info message',
          'Info Title'
        );
      });

      it('should handle optional parameters', () => {
        toast.success('Message only');
        toast.error('Error only');
        toast.info('Info only');

        expect(mockAdapter.success).toHaveBeenCalledWith(
          'Message only',
          undefined
        );
        expect(mockAdapter.error).toHaveBeenCalledWith('Error only', undefined);
        expect(mockAdapter.info).toHaveBeenCalledWith('Info only', undefined);
      });

      it('should throw when adapter not set', () => {
        setToastAdapter(null as any);

        const options = { description: 'Test' };

        expect(() => toast.show(options)).toThrow('Toast adapter not set');
        expect(() => toast.success('test')).toThrow('Toast adapter not set');
        expect(() => toast.error('test')).toThrow('Toast adapter not set');
        expect(() => toast.info('test')).toThrow('Toast adapter not set');
      });
    });

    describe('useToast hook', () => {
      it('should return toast object', () => {
        const mockAdapter = PlatformTestHelpers.createMockToastAdapter();
        setToastAdapter(asMockToastAdapter(mockAdapter));

        const result = useToast();
        expect(result).toBe(toast);
      });

      it('should provide access to all toast methods', () => {
        const mockAdapter = PlatformTestHelpers.createMockToastAdapter();
        setToastAdapter(asMockToastAdapter(mockAdapter));

        const toastService = useToast();

        toastService.success('Success');
        toastService.error('Error');
        toastService.info('Info');
        toastService.show({ description: 'Custom', variant: 'success' });

        expect(mockAdapter.success).toHaveBeenCalledWith('Success', undefined);
        expect(mockAdapter.error).toHaveBeenCalledWith('Error', undefined);
        expect(mockAdapter.info).toHaveBeenCalledWith('Info', undefined);
        expect(mockAdapter.show).toHaveBeenCalledWith({
          description: 'Custom',
          variant: 'success',
        });
      });
    });
  });

  describe('Integration Tests', () => {
    it('should work with all adapters together', async () => {
      const mockNav = PlatformTestHelpers.createMockNavigationAdapter();
      const mockStorage = PlatformTestHelpers.createMockStorageAdapter();
      const mockToast = PlatformTestHelpers.createMockToastAdapter();

      setNavigationAdapter(asMockNavAdapter(mockNav));
      setStorageAdapter(asMockStorageAdapter(mockStorage));
      setToastAdapter(asMockToastAdapter(mockToast));

      // Test navigation
      navigation.push('/test');
      expect(mockNav.push).toHaveBeenCalledWith('/test');

      // Test storage
      await storage.setItem('key', 'value');
      expect(mockStorage.setItem).toHaveBeenCalledWith('key', 'value');

      // Test toast
      toast.success('Operation completed');
      expect(mockToast.success).toHaveBeenCalledWith(
        'Operation completed',
        undefined
      );
    });

    it('should maintain adapter independence', () => {
      // Set only navigation adapter
      const mockNav = PlatformTestHelpers.createMockNavigationAdapter();
      setNavigationAdapter(asMockNavAdapter(mockNav));

      // Navigation should work
      expect(() => navigation.push('/test')).not.toThrow();

      // Storage and toast should throw
      expect(() => getStorageAdapter()).toThrow('Storage adapter not set');
      expect(() => getToastAdapter()).toThrow('Toast adapter not set');
    });

    it('should handle adapter replacement', () => {
      const firstAdapter = PlatformTestHelpers.createMockNavigationAdapter();
      const secondAdapter = PlatformTestHelpers.createMockNavigationAdapter();

      setNavigationAdapter(asMockNavAdapter(firstAdapter));
      navigation.push('/first');

      setNavigationAdapter(asMockNavAdapter(secondAdapter));
      navigation.push('/second');

      expect(firstAdapter.push).toHaveBeenCalledWith('/first');
      expect(secondAdapter.push).toHaveBeenCalledWith('/second');
      expect(firstAdapter.push).not.toHaveBeenCalledWith('/second');
    });
  });

  describe('Error Handling', () => {
    it('should provide helpful error messages', () => {
      expect(() => getNavigationAdapter()).toThrow(
        'Navigation adapter not set. Call setNavigationAdapter() first.'
      );
      expect(() => getStorageAdapter()).toThrow(
        'Storage adapter not set. Call setStorageAdapter() first.'
      );
      expect(() => getToastAdapter()).toThrow(
        'Toast adapter not set. Call setToastAdapter() first.'
      );
    });

    it('should handle adapter method failures gracefully', async () => {
      const mockStorage = PlatformTestHelpers.createMockStorageAdapter();
      mockStorage.getItem.mockRejectedValue(new Error('Storage error'));

      setStorageAdapter(asMockStorageAdapter(mockStorage));

      await expect(storage.getItem('test')).rejects.toThrow('Storage error');
    });

    it('should handle JSON serialization errors', async () => {
      const mockStorage = PlatformTestHelpers.createMockStorageAdapter();
      setStorageAdapter(asMockStorageAdapter(mockStorage));

      // Create object that can't be serialized
      const circularRef: any = {};
      circularRef.self = circularRef;

      await expect(storage.setJSON('key', circularRef)).rejects.toThrow();
    });
  });
});
