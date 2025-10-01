'use client';

import { useEffect } from 'react';
import { componentLogger } from '@/lib/logger';

export function PWARegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then(registration => {
          componentLogger.debug('Service worker registered successfully', {
            scope: registration.scope,
          });
        })
        .catch(registrationError => {
          componentLogger.error(
            'Service worker registration failed',
            registrationError
          );
        });
    }
  }, []);

  return null;
}
