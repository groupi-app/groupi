import { Suspense } from 'react';
import HomeContent from './components/home-content';
import { HomeRedirect } from './components/home-redirect';

export const experimental_ppr = true;

export default function Home() {
  return (
    <>
      <Suspense fallback={null}>
        <HomeRedirect />
      </Suspense>
      <Suspense>
        <HomeContent />
      </Suspense>
    </>
  );
}
