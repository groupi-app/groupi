/**
 * Tests for toast utility
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toast, useToast } from './toast';
import { toast as sonnerToast } from 'sonner';

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    dismiss: vi.fn(),
  },
}));

describe('toast utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('toast function', () => {
    it('should show success toast by default', () => {
      toast({ title: 'Success Message' });

      expect(sonnerToast.success).toHaveBeenCalledWith('Success Message', {
        description: undefined,
      });
    });

    it('should show success toast with description', () => {
      toast({
        title: 'Success Title',
        description: 'Success description text',
      });

      expect(sonnerToast.success).toHaveBeenCalledWith('Success Title', {
        description: 'Success description text',
      });
    });

    it('should show error toast when variant is destructive', () => {
      toast({
        title: 'Error Message',
        variant: 'destructive',
      });

      expect(sonnerToast.error).toHaveBeenCalledWith('Error Message', {
        description: undefined,
      });
    });

    it('should show error toast with description', () => {
      toast({
        title: 'Error Title',
        description: 'Error description text',
        variant: 'destructive',
      });

      expect(sonnerToast.error).toHaveBeenCalledWith('Error Title', {
        description: 'Error description text',
      });
    });

    it('should use default title for success when not provided', () => {
      toast({ description: 'Some description' });

      expect(sonnerToast.success).toHaveBeenCalledWith('Success', {
        description: 'Some description',
      });
    });

    it('should use default title for error when not provided', () => {
      toast({ description: 'Error details', variant: 'destructive' });

      expect(sonnerToast.error).toHaveBeenCalledWith('Error', {
        description: 'Error details',
      });
    });

    it('should handle explicit default variant', () => {
      toast({
        title: 'Normal Toast',
        variant: 'default',
      });

      expect(sonnerToast.success).toHaveBeenCalledWith('Normal Toast', {
        description: undefined,
      });
    });
  });

  describe('useToast hook', () => {
    it('should return toast function', () => {
      const { toast: hookToast } = useToast();

      expect(hookToast).toBe(toast);
    });

    it('should return dismiss function', () => {
      const { dismiss } = useToast();

      dismiss();

      expect(sonnerToast.dismiss).toHaveBeenCalled();
    });

    it('should allow using returned toast function', () => {
      const { toast: hookToast } = useToast();

      hookToast({ title: 'Hook Toast' });

      expect(sonnerToast.success).toHaveBeenCalledWith('Hook Toast', {
        description: undefined,
      });
    });
  });
});
