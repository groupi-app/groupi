/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-unused-vars */
// Fixture strips Next-only image props and renders a browser image directly.
/* eslint-disable @typescript-eslint/no-explicit-any */
// Deliberately synthetic boundary data; production components run unchanged.
import React from 'react';
const router = {
  push: (url: string) => history.pushState({}, '', url),
  replace: (url: string) => history.replaceState({}, '', url),
  back: () => history.back(),
  refresh: () => {},
  prefetch: () => {},
};
export const useRouter = () => router;
export const usePathname = () => location.pathname;
export const useSearchParams = () => new URLSearchParams(location.search);
export function Link({ href, children, ...props }: any) {
  return (
    <a href={typeof href === 'string' ? href : href.pathname} {...props}>
      {children}
    </a>
  );
}
export function Image({ src, alt, fill, priority, ...props }: any) {
  return (
    <img src={typeof src === 'string' ? src : src?.src} alt={alt} {...props} />
  );
}
export const env = {
  NEXT_PUBLIC_BASE_URL: 'https://invite-list-components.test',
};
