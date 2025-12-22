'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { AccountForm } from './account-form-provider';
import { checkUsernameAvailabilityAction } from '@/actions/account-actions';
import { Icons } from '@/components/icons';

export function UsernameField() {
  const { control, watch } = useFormContext<AccountForm>();
  const [availabilityStatus, setAvailabilityStatus] = useState<
    'idle' | 'checking' | 'available' | 'taken'
  >('idle');
  const originalUsernameRef = useRef<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const username = watch('username');
  
  // Store original username on mount
  useEffect(() => {
    if (originalUsernameRef.current === null) {
      originalUsernameRef.current = username ?? null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally only run once on mount to capture initial username

  const checkAvailability = useCallback(async (value: string) => {
    if (!value || value.trim() === '') {
      setAvailabilityStatus('idle');
      return;
    }

    // If username hasn't changed from original, don't check
    if (value === originalUsernameRef.current) {
      setAvailabilityStatus('idle');
      return;
    }

    setAvailabilityStatus('checking');

    try {
      const [error, data] = await checkUsernameAvailabilityAction({
        username: value.trim(),
      });

      if (error) {
        setAvailabilityStatus('taken');
        return;
      }

      if (data?.available) {
        setAvailabilityStatus('available');
      } else {
        setAvailabilityStatus('taken');
      }
    } catch {
      setAvailabilityStatus('taken');
    }
  }, []);

  useEffect(() => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    const timer = setTimeout(() => {
      if (username) {
        checkAvailability(username);
      } else {
        setAvailabilityStatus('idle');
      }
    }, 500); // 500ms debounce

    debounceTimerRef.current = timer;

    // Cleanup
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [username, checkAvailability]);

  return (
    <FormField
      control={control}
      name='username'
      render={({ field }) => (
        <FormItem>
          <FormLabel>Username</FormLabel>
          <FormControl>
            <div className='relative'>
              <Input
                {...field}
                placeholder='Enter username'
                value={field.value ?? ''}
                onChange={(e) => {
                  field.onChange(e.target.value || null);
                }}
              />
              {availabilityStatus === 'checking' && (
                <div className='absolute right-3 top-1/2 -translate-y-1/2'>
                  <Icons.spinner className='size-4 animate-spin text-muted-foreground' />
                </div>
              )}
              {availabilityStatus === 'available' && (
                <div className='absolute right-3 top-1/2 -translate-y-1/2'>
                  <Icons.check className='size-4 text-green-600' />
                </div>
              )}
              {availabilityStatus === 'taken' && (
                <div className='absolute right-3 top-1/2 -translate-y-1/2'>
                  <Icons.close className='size-4 text-red-600' />
                </div>
              )}
            </div>
          </FormControl>
          {availabilityStatus === 'available' && (
            <p className='text-sm text-green-600'>Username is available</p>
          )}
          {availabilityStatus === 'taken' && (
            <p className='text-sm text-red-600'>Username is already taken</p>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
