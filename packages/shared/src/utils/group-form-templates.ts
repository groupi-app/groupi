import type { ApplicationQuestion } from './application-questions';
/** Reusable ordinary-form presets; none configures admission or an Event. */
export const groupFormTemplates: Array<{
  id: string;
  title: string;
  description: string;
  questions: ApplicationQuestion[];
}> = [
  { id: 'blank', title: 'New form', description: '', questions: [] },
  {
    id: 'feedback',
    title: 'Feedback',
    description: 'Share feedback with your Group.',
    questions: [
      {
        id: 'feedback',
        type: 'LONG_ANSWER',
        label: 'What would you like us to know?',
        required: true,
      },
    ],
  },
  {
    id: 'check-in',
    title: 'Member check-in',
    description: 'A simple ongoing check-in.',
    questions: [
      {
        id: 'participating',
        type: 'YES_NO',
        label: 'Would you like to take part?',
        required: true,
      },
      {
        id: 'note',
        type: 'SHORT_ANSWER',
        label: 'Anything else?',
        required: false,
      },
    ],
  },
];
