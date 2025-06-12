import React from 'react';
import { FormContextProvider } from '@/components/providers/form-context-provider';
import { ReactNode } from 'react';

export default async function Layout({ children }: { children: ReactNode }) {
  return <FormContextProvider>{children}</FormContextProvider>;
}
