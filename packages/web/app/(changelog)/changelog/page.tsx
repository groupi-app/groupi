import { Suspense } from 'react';
import ChangelogContent from './changelog-content';

export const experimental_ppr = true;

export default function ChangelogPage() {
  return (
    <Suspense>
      <ChangelogContent />
    </Suspense>
  );
}
