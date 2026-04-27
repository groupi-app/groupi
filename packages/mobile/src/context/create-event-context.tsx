import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';

export type DateType = 'single' | 'multi';
export type EventVisibility = 'PRIVATE' | 'FRIENDS' | 'PUBLIC';

export interface DateOption {
  id: string;
  date: Date;
  endDate?: Date;
  note?: string;
}

export interface ImageFile {
  uri: string;
  filename: string;
  mimeType: string;
}

export interface FormState {
  title: string;
  description: string;
  location: string;
  visibility: EventVisibility;
  dateType: DateType;
  singleDate: Date;
  singleEndDate?: Date;
  hasEndTime: boolean;
  dateOptions: DateOption[];
  imageUri: string | null;
  imageFile: ImageFile | null;
}

interface FormContextValue {
  formState: FormState;
  updateFormState: (patch: Partial<FormState>) => void;
  reset: () => void;
}

function createInitialState(): FormState {
  return {
    title: '',
    description: '',
    location: '',
    visibility: 'PRIVATE',
    dateType: 'single',
    singleDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    singleEndDate: undefined,
    hasEndTime: false,
    dateOptions: [],
    imageUri: null,
    imageFile: null,
  };
}

const FormContext = createContext<FormContextValue | undefined>(undefined);

export function CreateEventProvider({ children }: { children: ReactNode }) {
  const [formState, setFormState] = useState<FormState>(createInitialState);

  const updateFormState = useCallback((patch: Partial<FormState>) => {
    setFormState(prev => ({ ...prev, ...patch }));
  }, []);

  const reset = useCallback(() => {
    setFormState(createInitialState());
  }, []);

  return (
    <FormContext.Provider value={{ formState, updateFormState, reset }}>
      {children}
    </FormContext.Provider>
  );
}

export function useCreateEventForm() {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error(
      'useCreateEventForm must be used within CreateEventProvider'
    );
  }
  return context;
}
