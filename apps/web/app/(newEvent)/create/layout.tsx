import React from 'react';
import { FormContextProvider } from '@/components/providers/form-context-provider';
import { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  return <FormContextProvider>{children}</FormContextProvider>;
}
