'use client';

import { createContext, ReactNode, useContext, useState } from 'react';

interface FormContextType {
  formState: {
    title: string;
    description?: string | undefined;
    location?: string | undefined;
  }; // Replace 'any' with the actual type of formState
  setFormState: (state: {
    title: string;
    description?: string | undefined;
    location?: string | undefined;
  }) => void; // Replace 'any' with the actual type of the state parameter
}

const FormContext = createContext<FormContextType | undefined>(undefined);

export function FormContextProvider({ children }: { children: ReactNode }) {
  const [formState, setFormState] = useState<{
    title: string;
    description?: string;
    location?: string;
  }>({
    title: '',
    description: undefined,
    location: undefined,
  });

  return (
    <FormContext.Provider value={{ formState, setFormState }}>
      {children}
    </FormContext.Provider>
  );
}

export function useFormContext() {
  const context = useContext(FormContext);

  if (!context) {
    throw new Error('useFormContext must be used within a FormContextProvider');
  }

  return context;
}
