export const REPORT_REASON_OPTIONS = [
  { label: 'Spam', reason: 'SPAM', icon: 'mail-unread-outline' },
  {
    label: 'Harassment',
    reason: 'HARASSMENT',
    icon: 'alert-circle-outline',
  },
  { label: 'Hate Speech', reason: 'HATE_SPEECH', icon: 'warning-outline' },
  {
    label: 'Inappropriate Content',
    reason: 'INAPPROPRIATE_CONTENT',
    icon: 'eye-off-outline',
  },
  {
    label: 'Impersonation',
    reason: 'IMPERSONATION',
    icon: 'people-outline',
  },
  { label: 'Other', reason: 'OTHER', icon: 'help-circle-outline' },
] as const;
