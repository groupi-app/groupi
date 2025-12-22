import React, { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  // Layout is minimal - FormProvider is now in CreateWizard component
  // When navigating away from /create, wizard unmounts and state resets automatically
  return <>{children}</>;
}
