'use client';

import { useEffect } from 'react';
import { componentLogger } from '@/lib/logger';

export function PWARegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then(registration => {
          componentLogger.debug(
            {
              scope: registration.scope,
            },
            'Service worker registered successfully'
          );
        })
        .catch(registrationError => {
          componentLogger.error(
            { error: registrationError },
            'Service worker registration failed'
          );
        });
    }
  }, []);

  return null;
}
