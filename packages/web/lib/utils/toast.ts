import { toast as sonnerToast, type ExternalToast } from 'sonner';
import type { ReactNode } from 'react';

interface ToastOptions {
  title?: ReactNode;
  description?: ReactNode;
  variant?: 'default' | 'destructive';
}

export function toast(
  { title, description, variant = 'default' }: ToastOptions,
  options: ExternalToast = {}
) {
  if (variant === 'destructive') {
    return sonnerToast.error(title || 'Error', {
      description,
      ...options,
    });
  } else {
    return sonnerToast.success(title || 'Success', {
      description,
      ...options,
    });
  }
}

export function dismissToast(id?: string | number) {
  return sonnerToast.dismiss(id);
}

// For backward compatibility with existing useToast hook pattern
export function useToast() {
  return {
    toast,
    dismiss: dismissToast,
  };
}
