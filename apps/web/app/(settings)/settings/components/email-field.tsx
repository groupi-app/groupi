'use client';

import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { AccountForm } from './account-form-provider';

export function EmailField() {
  const { control } = useFormContext<AccountForm>();

  return (
    <FormField
      control={control}
      name='email'
      render={({ field }) => (
        <FormItem>
          <FormLabel>Email</FormLabel>
          <FormControl>
            <Input
              {...field}
              type='email'
              placeholder='Enter email address'
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

