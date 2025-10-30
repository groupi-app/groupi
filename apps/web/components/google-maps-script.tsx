import Script from 'next/script';

interface GoogleMapsScriptProps {
  apiKey: string;
}

export function GoogleMapsScript({ apiKey }: GoogleMapsScriptProps) {
  return (
    <>
      <Script
        id='google-maps-init'
        strategy='afterInteractive'
        dangerouslySetInnerHTML={{
          __html: `
            window.initMap = function() {
              console.log('Google Maps API loaded successfully');
            };
          `,
        }}
      />
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initMap`}
        strategy='afterInteractive'
      />
    </>
  );
}
