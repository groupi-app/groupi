'use client';

import { SettingsPageTemplate } from '@/components/templates';
import {
  BoundedKeysSettings,
  DeveloperAppsSettings,
} from '@/features/authorization';
import { ApiKeysSettings } from '../components/api-keys-settings';

/** Authentication is owned by the shared Settings layout; no account form provider is mounted here. */
export default function DeveloperSettings() {
  return (
    <SettingsPageTemplate title='Developer'>
      <div className='min-w-0 space-y-6'>
        <BoundedKeysSettings />
        <DeveloperAppsSettings />
        <ApiKeysSettings />
      </div>
    </SettingsPageTemplate>
  );
}
