import { Suspense } from 'react';
import ChangelogContent from './changelog-content';

export default function ChangelogPage() {
  return (
    <Suspense>
      <ChangelogContent />
    </Suspense>
  );
}
