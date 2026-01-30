'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';

// Reminder offset options
export type ReminderOffset =
  | '30_MINUTES'
  | '1_HOUR'
  | '2_HOURS'
  | '4_HOURS'
  | '1_DAY'
  | '2_DAYS'
  | '3_DAYS'
  | '1_WEEK'
  | '2_WEEKS'
  | '4_WEEKS';

interface FocalPoint {
  x: number;
  y: number;
}

interface FormState {
  title: string;
  description?: string;
  location?: string;
  reminderOffset?: ReminderOffset;
  imageFile?: File;
  imageFocalPoint?: FocalPoint;
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
    reminderOffset: undefined,
    imageFile: undefined,
    imageFocalPoint: undefined,
  });

  const reset = useCallback(() => {
    setFormState({
      title: '',
      description: undefined,
      location: undefined,
      reminderOffset: undefined,
      imageFile: undefined,
      imageFocalPoint: undefined,
    });
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
