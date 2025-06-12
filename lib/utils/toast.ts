import { toast as sonnerToast } from 'sonner';

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export function toast({
  title,
  description,
  variant = 'default',
}: ToastOptions) {
  if (variant === 'destructive') {
    sonnerToast.error(title || 'Error', {
      description,
    });
  } else {
    sonnerToast.success(title || 'Success', {
      description,
    });
  }
}

// For backward compatibility with existing useToast hook pattern
export function useToast() {
  return {
    toast,
    dismiss: () => sonnerToast.dismiss(),
  };
}
