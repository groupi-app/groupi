import NewEventInfo from "@/components/new-event-info";
import Script from "next/script";
import { env } from "@/env.mjs";

export default function Page() {
  return (
    <>
      <div className="container max-w-4xl">
        <h1 className="text-4xl font-heading mb-4">New Event</h1>
        <NewEventInfo />
      </div>
      <Script
        defer
        src={`https://maps.googleapis.com/maps/api/js?key=${env.GOOGLE_API_KEY}&libraries=places&callback=initMap`}
      />
    </>
  );
}
