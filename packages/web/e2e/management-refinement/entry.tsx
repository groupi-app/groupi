/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { EventSettingsDraftProvider } from '../../features/event-settings/draft';
import { EventDetailsFields } from '../../features/event-settings/details';
import { EventAudienceSettings } from '../../components/organisms/event-audience-settings';
import { EventAdmissionSettings } from '../../components/organisms/event-admission-settings';
import { BoundedKeysSettings } from '../../features/authorization/bounded-keys-settings';
import { DeveloperAppsSettings } from '../../features/authorization/developer-apps-settings';
import { ConnectedAppsSettings } from '../../features/authorization/connected-apps-settings';
import { ApiKeysSettings } from '../../app/(settings)/settings/components/api-keys-settings';
import { usePathname, Link } from './boundaries';
const scene = new URLSearchParams(location.search).get('scene') || 'event';
function EventFixture() {
  const path = usePathname();
  return (
    <EventSettingsDraftProvider
      actorId='synthetic-owner'
      eventId={'event-one' as never}
      enabled
    >
      <main className='mx-auto w-full min-w-0 max-w-3xl space-y-5 p-4 sm:p-6'>
        <h1 className='font-heading text-2xl font-bold'>Event settings</h1>
        <nav aria-label='Fixture event routes' className='flex flex-wrap gap-3'>
          <Link href='/event/event-one/settings/details'>Details</Link>
          <Link href='/event/event-one/settings/access'>Access</Link>
          <Link href='/event/event-one'>Event home</Link>
          <Link href='/events'>Outside event</Link>
        </nav>
        {path.endsWith('/details') ? (
          <EventDetailsFields />
        ) : path.endsWith('/access') ? (
          <>
            <EventAudienceSettings
              eventId={'event-one' as never}
              visibility='PRIVATE'
            />
            <EventAdmissionSettings
              eventId={'event-one' as never}
              role='ORGANIZER'
            />
          </>
        ) : (
          <p>Event home fixture</p>
        )}
      </main>
    </EventSettingsDraftProvider>
  );
}
function DeveloperFixture() {
  return (
    <main className='mx-auto w-full min-w-0 max-w-3xl space-y-6 p-4 sm:p-6'>
      <h1 className='font-heading text-2xl font-bold'>Developer settings</h1>
      <BoundedKeysSettings />
      <DeveloperAppsSettings />
      <ApiKeysSettings />
    </main>
  );
}
function AccountFixture() {
  return (
    <main className='mx-auto w-full min-w-0 max-w-3xl space-y-6 p-4 sm:p-6'>
      <h1 className='font-heading text-2xl font-bold'>Account</h1>
      <ConnectedAppsSettings />
      <Link href='/settings/developer'>Developer settings</Link>
    </main>
  );
}
function FixtureApp() {
  const [mounted, setMounted] = useState(true);
  useEffect(() => {
    (window as any).managementFixture.mountProvider = setMounted;
  }, []);
  return scene === 'developer' ? (
    <DeveloperFixture />
  ) : scene === 'account' ? (
    <AccountFixture />
  ) : mounted ? (
    <EventFixture />
  ) : (
    <p>Provider unmounted fixture</p>
  );
}
createRoot(document.getElementById('root')!).render(<FixtureApp />);
