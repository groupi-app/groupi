'use client';
import { useEffect, useRef, useState } from 'react';
import corpus from './generated/corpus.json';
import type { Page } from './content';
import { PortalLayout } from './components/templates/portal-layout';
import { ApiExplorer } from './components/organisms/api-explorer';
import { DeveloperSearch } from './components/organisms/developer-search';
import { DocumentReader } from './components/organisms/document-reader';
import { AgentGuideLinks } from './components/molecules/agent-guide-links';
import { PortalHome } from './components/organisms/portal-home';
const pages = corpus.pages as Page[];
const redirects: Record<string, string> = {
  '/docs/api': '/v2/reference/api',
  '/reference/api': '/v2/reference/api',
  '/cli/reference': '/cli/0.1.0/reference',
  '/v2/contributor': '/v2/introduction',
};
export function Portal() {
  const [path, setPath] = useState(
    () => redirects[window.location.pathname] ?? window.location.pathname
  );
  const initialRoute = useRef(true);
  const page = pages.find(item => item.path === path);
  useEffect(() => {
    const update = () =>
      setPath(redirects[window.location.pathname] ?? window.location.pathname);
    window.addEventListener('popstate', update);
    return () => window.removeEventListener('popstate', update);
  }, []);
  useEffect(() => {
    document.title = page
      ? `${page.title} | Groupi developers`
      : 'Groupi developers';
    if (redirects[window.location.pathname])
      window.history.replaceState(
        {},
        '',
        `${path}${window.location.pathname === '/v2/contributor' ? '#contributing' : window.location.hash}`
      );
    const id = window.location.hash.slice(1);
    if (id) {
      const target = document.getElementById(id);
      target?.scrollIntoView?.();
      target?.focus({ preventScroll: true });
    } else if (!initialRoute.current) {
      document.querySelector('header')?.scrollIntoView?.();
      const heading = document.querySelector('main h1') as HTMLElement | null;
      heading?.focus({ preventScroll: true });
    }
    initialRoute.current = false;
  }, [path, page]);
  function navigate(next: string) {
    window.history.pushState({}, '', next);
    setPath(next);
  }
  return (
    <div
      onClick={event => {
        const target = (event.target as Element).closest('a');
        if (
          !target ||
          target.origin !== window.location.origin ||
          target.hasAttribute('download') ||
          target.target === '_blank'
        )
          return;
        if (
          event.ctrlKey ||
          event.metaKey ||
          event.shiftKey ||
          event.altKey ||
          target.pathname.startsWith('/exports/') ||
          target.pathname === '/llms.txt' ||
          target.pathname.endsWith('.md') ||
          target.pathname.startsWith('/examples/')
        )
          return;
        event.preventDefault();
        const destination = new URL(target.href);
        if (redirects[destination.pathname]) {
          if (destination.pathname === '/v2/contributor')
            destination.hash = 'contributing';
          destination.pathname = redirects[destination.pathname];
        }
        window.history.pushState({}, '', destination.href);
        setPath(destination.pathname);
        if (destination.hash) {
          const section = document.getElementById(destination.hash.slice(1));
          section?.scrollIntoView?.();
          section?.focus({ preventScroll: true });
        }
      }}
    >
      <PortalLayout
        navigation={
          <nav aria-label='Developer navigation'>
            <a href='/v2/introduction'>Learn</a>
            <a href='/v2/reference/api'>Reference</a>
            <a href='/cli/0.1.0/guide'>CLI</a>
            <a href='/v2/addons'>Add-ons</a>
            <a href='/v2/sdks'>SDKs</a>
            <a href='/v2/auth'>Authorization</a>
            <a href='/v2/api-sdk-evolution'>Realtime design</a>
            <a href='/v2/self-hosting'>Self-hosting</a>
            <a href='/v2/reference/api'>API reference</a>
            <a href='/cli/0.1.0/reference'>CLI reference</a>
            <a href='/v2/explorer'>API explorer</a>
          </nav>
        }
      >
        <DeveloperSearch key={path} />
        {path === '/v2/explorer' ? (
          <ApiExplorer />
        ) : page ? (
          <>
            {page.id === 'api-v1' || page.id === 'api-v2' ? (
              <label>
                API version
                <select
                  aria-label='API version'
                  value={page.version}
                  onChange={event =>
                    navigate(`/${event.target.value}/reference/api`)
                  }
                >
                  <option value='v2'>REST v2</option>
                  <option value='v1'>REST v1</option>
                </select>
              </label>
            ) : null}
            {page.id === 'introduction' || page.id === 'agents' ? (
              <AgentGuideLinks />
            ) : null}
            <DocumentReader page={page} />
          </>
        ) : path === '/' ? (
          <PortalHome />
        ) : (
          <section className='document'>
            <h1 tabIndex={-1}>Page not found</h1>
            <p>
              This reader path is unavailable. Search the public corpus or
              browse a versioned reference.
            </p>
            <a href='/'>Return to developer home</a>
          </section>
        )}
      </PortalLayout>
    </div>
  );
}
