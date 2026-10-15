import type { FunctionArgs } from 'convex/server';
import type { api } from 'convex/_generated/api';
import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { FocalPoint } from '@/lib/image-focal-point';

export type DateType = 'single' | 'multi';
export type EventVisibility = 'PRIVATE' | 'FRIENDS' | 'PUBLIC';
export type PermissionLevel = 'EVERYONE' | 'MODERATOR' | 'ORGANIZER';

export interface EventPermissions {
  createPosts?: PermissionLevel;
  inviteMembers?: PermissionLevel;
  viewAttendeeList?: PermissionLevel;
}

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

type AddonConfiguration = FunctionArgs<
  typeof api.addons.mutations.enableAddon
>['config'];
type BuiltInConfigurations = {
  reminders?: Extract<AddonConfiguration, { reminderOffset: string }>;
  'bring-list'?: Extract<AddonConfiguration, { items: unknown }>;
  questionnaire?: Extract<AddonConfiguration, { questions: unknown }>;
  discord?: Extract<AddonConfiguration, { guildId: string }>;
} & Record<string, AddonConfiguration | undefined>;

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
  imageFocalPoint: FocalPoint | null;
  addonConfigs: BuiltInConfigurations;
  permissions?: EventPermissions;
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
    imageFocalPoint: null,
    addonConfigs: {},
  };
}

const FormContext = createContext<FormContextValue | undefined>(undefined);

export function CreateEventProvider({
  children,
  initialState,
}: {
  children: ReactNode;
  initialState?: Partial<FormState>;
}) {
  const [formState, setFormState] = useState<FormState>(() => ({
    ...createInitialState(),
    ...initialState,
  }));

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
