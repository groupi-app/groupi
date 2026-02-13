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

export type Visibility = 'PRIVATE' | 'FRIENDS' | 'PUBLIC';

interface FocalPoint {
  x: number;
  y: number;
}

export interface FormState {
  title: string;
  description?: string;
  location?: string;
  visibility?: Visibility;
  /** @deprecated Use addonConfigs.reminders.reminderOffset instead */
  reminderOffset?: ReminderOffset;
  /** Generic addon config storage keyed by addon id */
  addonConfigs?: Record<string, Record<string, unknown>>;
  imageFile?: File;
  imageFocalPoint?: FocalPoint;
  dateType?: 'single' | 'multi';
  singleDateTime?: { startDateTime: string; endDateTime?: string };
  multiDateTimeOptions?: Array<{ start: string; end?: string }>;
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
    visibility: 'PRIVATE',
    reminderOffset: undefined,
    addonConfigs: {},
    imageFile: undefined,
    imageFocalPoint: undefined,
    dateType: undefined,
    singleDateTime: undefined,
    multiDateTimeOptions: undefined,
  });

  const reset = useCallback(() => {
    setFormState({
      title: '',
      description: undefined,
      location: undefined,
      reminderOffset: undefined,
      addonConfigs: {},
      imageFile: undefined,
      imageFocalPoint: undefined,
      dateType: undefined,
      singleDateTime: undefined,
      multiDateTimeOptions: undefined,
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
