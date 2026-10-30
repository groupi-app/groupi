'use client';
import type { ReactNode } from 'react';
export function PortalLayout({
  navigation,
  children,
}: {
  navigation: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      <a className='skip-link' href='#main'>
        Skip to content
      </a>
      <header className='portal-header'>
        <a href='/' aria-label='Groupi developers home' className='wordmark'>
          groupi<span> / developers</span>
        </a>
        {navigation}
      </header>
      <main id='main' tabIndex={-1}>
        {children}
      </main>
      <footer>
        Public developer documentation · Source availability is distinct from
        deployment and package release.
      </footer>
    </>
  );
}
