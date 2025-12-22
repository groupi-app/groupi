'use client';

import { ReactNode, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

export const accountFormSchema = z.object({
  username: z.string().nullable().optional(),
  email: z.string().email('Please enter a valid email address'),
});

export type AccountForm = z.infer<typeof accountFormSchema>;

export function AccountFormProvider({
  children,
  defaultValues,
}: {
  children: ReactNode;
  defaultValues: AccountForm;
}) {
  const methods = useForm<AccountForm>({
    resolver: zodResolver(accountFormSchema),
    defaultValues,
    mode: 'onChange',
  });

  useEffect(() => {
    methods.reset(defaultValues);
  }, [defaultValues, methods]);

  return <FormProvider {...methods}>{children}</FormProvider>;
}

