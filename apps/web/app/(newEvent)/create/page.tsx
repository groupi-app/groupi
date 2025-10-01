import NewEventInfo from './components/new-event-info';
import { env } from '@/env.mjs';
import Script from 'next/script';

export default function Page() {
  return (
    <>
      <div className='container max-w-4xl mt-10'>
        <h1 className='text-4xl font-heading mb-4'>New Event</h1>
        <NewEventInfo />
      </div>
      <Script
        id='google-maps-init-create'
        strategy='beforeInteractive'
        dangerouslySetInnerHTML={{
          __html: `
            window.initMap = function() {
              console.log('Google Maps API loaded successfully');
            };
          `,
        }}
      />
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${env.GOOGLE_API_KEY}&libraries=places&callback=initMap`}
        strategy='afterInteractive'
      />
    </>
  );
}
