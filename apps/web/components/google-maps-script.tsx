'use client';

import Script from 'next/script';
import { env } from '@/env.mjs';

export function GoogleMapsScript() {
  return (
    <Script
      defer
      src={`https://maps.googleapis.com/maps/api/js?key=${env.GOOGLE_API_KEY}&libraries=places&callback=initMap`}
    />
  );
}
