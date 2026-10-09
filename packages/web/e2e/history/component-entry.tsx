/* eslint-disable @typescript-eslint/no-explicit-any */
// Deliberately synthetic boundary data; production components run unchanged.
import React from 'react';
import { createRoot } from 'react-dom/client';
import InviteListsSettings from '@/app/(settings)/settings/invite-lists/page';
import { UnifiedInviteDialog } from '@/components/unified-invite-dialog';
import { NavigationGuardProvider } from '@/app/(settings)/settings/components/navigation-guard-context';
import { useInviteDialogStore } from '@/stores/invite-dialog-store';
import { fixture } from './component-convex';

const root = createRoot(document.getElementById('root')!);
let revision = 0;
function mount(mode: 'settings' | 'invite', preserveHistory = false) {
  useInviteDialogStore.setState({
    open: false,
    eventId: null,
    defaultTab: 'link',
  });
  fixture.reset();
  if (!preserveHistory)
    history.replaceState(
      {},
      '',
      mode === 'settings' ? '/settings/invite-lists' : '/event/event'
    );
  const content = (
    <NavigationGuardProvider key={++revision}>
      {mode === 'settings' ? (
        <InviteListsSettings />
      ) : (
        <>
          <button
            onClick={() =>
              useInviteDialogStore.getState().openDialog('event' as any, 'list')
            }
          >
            Open invitation fixture
          </button>
          <UnifiedInviteDialog />
        </>
      )}
    </NavigationGuardProvider>
  );
  root.render(
    (window as any).fixtureBootstrapDefer ? (
      <React.StrictMode>{content}</React.StrictMode>
    ) : (
      content
    )
  );
}
Object.assign(window, {
  componentFixture: { fixture, mount, store: useInviteDialogStore },
});
if (!(window as any).fixtureBootstrapDefer) mount('settings');
