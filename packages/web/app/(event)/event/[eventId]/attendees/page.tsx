'use client';

import { AttendeesContent } from './components/attendees-content';

/**
 * Attendees Page - Client-only architecture
 * - Data provided by EventDataProvider in layout
 * - No params needed - content uses context
 */
export default function EventAttendeesPage() {
  return <AttendeesContent />;
}
