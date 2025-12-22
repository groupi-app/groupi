'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface FormState {
  title: string;
  description?: string;
  location?: string;
}

interface FormContextValue {
  formState: FormState;
  setFormState: (state: FormState) => void;
  reset: () => void;
}

const FormContext = createContext<FormContextValue | undefined>(undefined);

export function FormProvider({ children }: { children: ReactNode }) {
  const [formState, setFormState] = useState<FormState>({
    title: '',
    description: undefined,
    location: undefined,
  });

  const reset = useCallback(() => {
    setFormState({ title: '', description: undefined, location: undefined });
  }, []);

  return (
    <FormContext.Provider value={{ formState, setFormState, reset }}>
      {children}
    </FormContext.Provider>
  );
}

export function useFormContext() {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useFormContext must be used within FormProvider');
  }
  return context;
}

