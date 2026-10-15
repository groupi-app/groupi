/** Independent Group poll presets; copying a preset never propagates to Events. */
export const GROUP_POLL_TEMPLATES = [
  {
    id: 'YES_NO',
    title: 'Yes or no',
    description: 'Choose one option.',
    mode: 'SINGLE' as const,
    options: [
      { id: 'yes', label: 'Yes' },
      { id: 'no', label: 'No' },
    ],
  },
  {
    id: 'TOPICS',
    title: 'Topics',
    description: 'Choose the topics you prefer.',
    mode: 'MULTIPLE' as const,
    options: [
      { id: 'discussion', label: 'Discussion' },
      { id: 'workshop', label: 'Workshop' },
      { id: 'social', label: 'Social' },
    ],
  },
];
