'use client';

import { NotificationMethodsList } from './notification-methods-list';

export function SettingsContent({
  emails = [],
}: {
  emails?: string[];
} = {}) {
  return (
    <div className='space-y-6'>
      <NotificationMethodsList emails={emails} />
    </div>
  );
}
