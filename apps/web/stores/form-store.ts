'use client';

import { create } from 'zustand';

interface FormState {
  title: string;
  description?: string;
  location?: string;
}

interface FormStore {
  formState: FormState;
  setFormState: (state: FormState) => void;
  reset: () => void;
  shouldResetOnCreate: boolean;
  setShouldResetOnCreate: (value: boolean) => void;
}

const initialState: FormState = {
  title: '',
  description: undefined,
  location: undefined,
};

export const useFormStore = create<FormStore>(set => ({
  formState: initialState,
  setFormState: state => set({ formState: state }),
  reset: () => set({ formState: initialState }),
  shouldResetOnCreate: false,
  setShouldResetOnCreate: (value: boolean) =>
    set({ shouldResetOnCreate: value }),
}));
