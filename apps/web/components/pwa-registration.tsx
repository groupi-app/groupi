'use client';

import { useEffect } from 'react';
import { log } from '@/lib/logger';

export function PWARegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then(registration => {
          log.debug('Service worker registered successfully', {
            scope: registration.scope,
          });
        })
        .catch(registrationError => {
          log.error('Service worker registration failed', registrationError);
        });
    }
  }, []);

  return null;
}
